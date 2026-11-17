/* ==========================================================================
   Les Employeurs · page diagnostic.html
   ?piece=<clé>  questionnaire de la pièce
   ?id=<uuid>    résultat enregistré (connecté)
   sans paramètre : choix de la pièce
   ========================================================================== */
(function () {
  'use strict';

  var D = window.LEDiag;
  var Compte = window.LECompte;
  var app = document.getElementById('dg-app');
  if (!app || !D || !Compte) return;

  var params = new URLSearchParams(location.search);
  var esc = D.esc;

  function setTitle(t) { document.title = t + ' | Les Employeurs'; }

  function focusHeading() {
    var h = app.querySelector('h1, h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    window.scrollTo(0, 0);
  }

  function loading(msg) {
    app.innerHTML = '<p class="dg-loading" role="status">' + (msg || 'Chargement…') + '</p>';
  }

  /* ---------- 1. Choix de la pièce ---------- */
  function renderChooser() {
    setTitle('Diagnostic offert');
    var html = '<header class="dg-head"><p class="kicker">Diagnostic offert</p>' +
      '<h1 class="dg-title">Faites le point sur une pièce de votre entreprise</h1>' +
      '<p class="dg-lead">Choisissez une fonction. Vous évaluez où vous en êtes sur chacune de ses familles, puis vous obtenez votre score, famille par famille, et vos priorités. Le premier diagnostic de chaque pièce est offert.</p></header>' +
      '<ul class="dg-choices" role="list">';
    D.data.pieces.forEach(function (p) {
      html += '<li><a class="dg-choice' + (p.key === 'board' ? ' dg-choice--board' : '') + '" href="?piece=' + p.key + '">' +
        '<img src="' + D.avatarSrc(p) + '" alt="" width="176" height="176" loading="lazy">' +
        '<span class="dg-choice-name">' + esc(p.avatar) + '</span>' +
        '<span class="dg-choice-label">' + esc(p.label) + '</span>' +
        '<span class="dg-choice-meta">' + p.families.length + ' familles · ' + D.countItems(p) + ' questions · ≈&nbsp;' + D.minutes(p) + '&nbsp;min</span></a></li>';
    });
    html += '</ul><p class="dg-already">Déjà un compte&nbsp;? <a href="espace.html">Retrouvez vos diagnostics dans votre espace</a>.</p>';
    app.innerHTML = html;
  }

  /* ---------- 2. Questionnaire ---------- */
  function runQuestionnaire(piece) {
    var answers = {};
    var step = -1; // -1 = introduction
    var total = piece.families.length;

    setTitle('Diagnostic ' + piece.label);

    function renderIntro() {
      app.innerHTML =
        '<header class="dg-head dg-head--piece">' +
        '<img class="dg-head-avatar" src="' + D.avatarSrc(piece) + '" alt="' + esc(piece.avatar) + ', avatar ' + esc(piece.label) + '" width="176" height="176">' +
        '<div><p class="kicker">Diagnostic offert</p><h1 class="dg-title">' + esc(piece.label) + '</h1>' +
        '<p class="dg-lead">' + total + ' familles, ' + D.countItems(piece) + ' questions, environ ' + D.minutes(piece) + '&nbsp;minutes. Pour chaque point, indiquez où en est votre entreprise aujourd’hui. Il n’y a pas de bonne réponse&nbsp;: c’est une photo de départ.</p></div></header>' +
        '<ol class="dg-fam-list">' + piece.families.map(function (f) { return '<li>' + esc(f.label) + '</li>'; }).join('') + '</ol>' +
        '<p class="dg-actions"><button type="button" class="btn btn--primary btn--lg" data-go="0">Commencer le diagnostic</button>' +
        ' <a class="link-arrow" href="diagnostic.html">Choisir une autre pièce</a></p>' +
        '<p class="dg-note">Votre résultat s’affiche après la création d’un compte gratuit. Vous retrouvez ensuite tous vos diagnostics dans votre espace, pour suivre votre évolution.</p>';
      focusHeading();
    }

    function renderStep() {
      var fam = piece.families[step];
      var pct = Math.round((step / total) * 100);
      var html = '<form class="dg-step" novalidate>' +
        '<div class="dg-progress"><p class="dg-progress-text">' + esc(piece.label) + ' · famille ' + (step + 1) + ' sur ' + total + '</p>' +
        '<div class="dg-progress-track" aria-hidden="true"><span style="width:' + pct + '%"></span></div></div>' +
        '<h1 class="dg-step-title">' + esc(fam.label) + '</h1>' +
        '<p class="dg-step-help">Où en est votre entreprise sur chacun de ces points&nbsp;?</p>';
      fam.items.forEach(function (item) {
        var name = 'q' + item.id.replace('.', '-');
        html += '<fieldset class="dg-q"><legend><span class="dg-q-label">' + esc(item.label) + '</span>' +
          '<span class="dg-q-ex">Par exemple&nbsp;: ' + item.ex.map(esc).join(' · ') + '</span></legend><div class="dg-scale">';
        D.levels.forEach(function (lv, i) {
          var val = lv.value === null ? 'nc' : String(lv.value);
          var checked = String(answers[item.id]) === val ? ' checked' : '';
          var id = name + '-' + i;
          html += '<span class="dg-opt' + (lv.value === null ? ' dg-opt--nc' : '') + '"><input type="radio" id="' + id + '" name="' + name + '" value="' + val + '"' + checked + '>' +
            '<label for="' + id + '">' + esc(lv.label) + '</label></span>';
        });
        html += '</div></fieldset>';
      });
      html += '<p class="dg-error" role="alert" hidden></p>' +
        '<p class="dg-nav"><button type="button" class="btn btn--ghost" data-go="' + (step - 1) + '">Précédent</button>' +
        '<button type="submit" class="btn btn--primary">' + (step === total - 1 ? 'Voir mon résultat' : 'Suivant') + '</button></p></form>';
      app.innerHTML = html;
      focusHeading();
    }

    function collect() {
      var fam = piece.families[step];
      var missing = [];
      fam.items.forEach(function (item) {
        var checked = app.querySelector('input[name="q' + item.id.replace('.', '-') + '"]:checked');
        if (!checked) { missing.push(item.label); return; }
        answers[item.id] = checked.value === 'nc' ? 'nc' : Number(checked.value);
      });
      return missing;
    }

    function go(to) {
      step = to;
      if (step < 0) return renderIntro();
      if (step >= total) return finish();
      renderStep();
    }

    function finish() {
      var scores = D.computeScores(piece, answers);
      D.savePending(piece.key, answers);
      loading('Calcul de votre résultat…');
      Compte.getUser().then(function (user) {
        if (user) return saveAndShow(piece.key, answers);
        renderGate(piece, scores);
      });
    }

    app.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-go]');
      if (!btn) return;
      if (step >= 0 && step < total) collect(); // garde les réponses déjà saisies
      go(Number(btn.getAttribute('data-go')));
    });

    app.addEventListener('submit', function (e) {
      if (!e.target.classList.contains('dg-step')) return;
      e.preventDefault();
      var missing = collect();
      if (missing.length) {
        var err = app.querySelector('.dg-error');
        err.textContent = 'Répondez à chaque point (ou choisissez « Non concerné ») : ' + missing.join(', ') + '.';
        err.hidden = false;
        err.scrollIntoView({ block: 'center' });
        return;
      }
      go(step + 1);
    });

    renderIntro();
  }

  /* ---------- 3. Création du compte avant le résultat ---------- */
  function renderGate(piece, scores) {
    var answered = 0;
    piece.families.forEach(function (f) { if (typeof scores.families[f.id] === 'number') answered++; });
    app.innerHTML =
      '<header class="dg-head dg-head--piece">' +
      '<img class="dg-head-avatar" src="' + D.avatarSrc(piece) + '" alt="" width="176" height="176">' +
      '<div><p class="kicker">Diagnostic ' + esc(piece.label) + '</p><h1 class="dg-title">Votre résultat est prêt</h1>' +
      '<p class="dg-lead">Créez votre compte gratuit pour le découvrir&nbsp;: votre score sur 100, le détail de vos ' + answered + ' familles et vos 3 priorités. Vos diagnostics restent dans votre espace pour mesurer vos progrès.</p></div></header>' +
      '<div class="dg-teaser" aria-hidden="true"><span></span><span></span><span></span><span></span></div>' +
      '<div id="dg-auth"></div>';
    focusHeading();
    window.LEAuthUI.mount(document.getElementById('dg-auth'), {
      autofocus: false,
      onSuccess: function () { saveAndShow(piece.key, D.readPending() ? D.readPending().answers : {}); }
    });
  }

  /* ---------- 4. Enregistrement puis affichage ---------- */
  function saveAndShow(pieceKey, answers) {
    var piece = D.getPiece(pieceKey);
    var scores = D.computeScores(piece, answers);
    loading('Enregistrement de votre diagnostic…');
    Compte.saveDiagnostic({
      piece: pieceKey,
      version: D.data.version,
      answers: answers,
      scores: scores,
      score_global: scores.global
    }).then(function (r) {
      if (r.error || !r.data) {
        app.innerHTML = '<p class="dg-error" role="alert">L’enregistrement a échoué&nbsp;: ' + esc(r.error || 'réponse vide') + '</p>' +
          '<p><button type="button" class="btn btn--primary" id="dg-retry">Réessayer</button></p>';
        document.getElementById('dg-retry').addEventListener('click', function () { saveAndShow(pieceKey, answers); });
        return;
      }
      D.clearPending();
      history.replaceState(null, '', 'diagnostic.html?id=' + encodeURIComponent(r.data.id));
      showSaved(r.data);
    });
  }

  function showSaved(record) {
    Compte.listDiagnostics().then(function (list) {
      var previous = null;
      (list.data || []).some(function (d) {
        if (d.piece === record.piece && d.id !== record.id && new Date(d.created_at) < new Date(record.created_at)) { previous = d; return true; }
        return false;
      });
      setTitle('Résultat ' + D.getPiece(record.piece).label);
      app.innerHTML = '<article class="dg-result" aria-labelledby="dg-result-title">' + D.renderResult(record, previous) + '</article>';
      focusHeading();
    });
  }

  /* ---------- Démarrage ---------- */
  var id = params.get('id');
  var piece = D.getPiece(params.get('piece') || '');

  if (id) {
    loading();
    Compte.getUser().then(function (user) {
      if (!user) { location.replace('espace.html'); return; }
      Compte.getDiagnostic(id).then(function (r) {
        if (!r.data) { app.innerHTML = '<p class="dg-error" role="alert">Ce diagnostic est introuvable.</p><p><a href="espace.html">Retour à mon espace</a></p>'; return; }
        showSaved(r.data);
      });
    });
  } else if (piece) {
    runQuestionnaire(piece);
  } else {
    renderChooser();
  }
})();
