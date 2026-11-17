/* ==========================================================================
   Les Employeurs · page espace.html (mon espace)
   ========================================================================== */
(function () {
  'use strict';

  var D = window.LEDiag;
  var Compte = window.LECompte;
  var app = document.getElementById('dg-app');
  if (!app || !D || !Compte) return;

  var esc = D.esc;
  var params = new URLSearchParams(location.search);

  function focusHeading() {
    var h = app.querySelector('h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  /* ---------- Nouveau mot de passe (lien reçu par email) ---------- */
  function renderReset(token) {
    app.innerHTML = '<header class="dg-head"><p class="kicker">Mon espace</p><h1 class="dg-title">Choisir un nouveau mot de passe</h1></header>' +
      '<div class="auth-box"><form class="auth-form" id="reset-form" novalidate>' +
      '<p class="form-field"><label for="reset-pwd">Nouveau mot de passe <span class="form-hint">(8 caractères minimum)</span></label>' +
      '<input id="reset-pwd" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></p>' +
      '<p class="auth-error" role="alert" hidden></p>' +
      '<p><button class="btn btn--primary" type="submit">Enregistrer</button></p></form></div>';
    focusHeading();
    document.getElementById('reset-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var pwd = document.getElementById('reset-pwd').value;
      var err = app.querySelector('.auth-error');
      if (pwd.length < 8) { err.textContent = 'Le mot de passe doit comporter au moins 8 caractères.'; err.hidden = false; return; }
      Compte.resetPassword(token, pwd).then(function (r) {
        if (r.error) { err.textContent = r.error; err.hidden = false; return; }
        history.replaceState(null, '', 'espace.html');
        renderSignedOut('Votre mot de passe est modifié. Connectez-vous.');
      });
    });
  }

  /* ---------- Non connecté ---------- */
  function renderSignedOut(message) {
    var pending = D.readPending();
    var intro = pending
      ? 'Votre diagnostic ' + esc(D.getPiece(pending.piece).label) + ' vous attend&nbsp;: connectez-vous ou créez votre compte pour voir votre résultat.'
      : '';
    app.innerHTML = '<header class="dg-head"><p class="kicker">Mon espace</p><h1 class="dg-title">Retrouvez vos diagnostics</h1>' +
      '<p class="dg-lead">Votre espace garde l’historique de vos diagnostics, pièce par pièce, pour suivre votre évolution dans le temps.</p></header>' +
      (message ? '<p class="auth-ok" role="status">' + esc(message) + '</p>' : '') +
      '<div id="espace-auth"></div>' +
      '<p class="dg-already">Pas encore de diagnostic&nbsp;? <a href="diagnostic.html">Faire un premier diagnostic offert</a>.</p>';
    focusHeading();
    window.LEAuthUI.mount(document.getElementById('espace-auth'), {
      intro: intro,
      defaultMode: pending ? 'signup' : 'signin',
      autofocus: false,
      onSuccess: start
    });
  }

  /* ---------- Connecté ---------- */
  function sparkline(scores) {
    if (scores.length < 2) return '';
    var w = 120, h = 32, step = w / (scores.length - 1);
    var pts = scores.map(function (s, i) { return (i * step).toFixed(1) + ',' + (h - 2 - (s / 100) * (h - 4)).toFixed(1); }).join(' ');
    return '<svg class="esp-spark" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true" focusable="false"><polyline points="' + pts + '"/></svg>';
  }

  function renderDashboard(user, list) {
    var byPiece = {};
    list.forEach(function (d) { (byPiece[d.piece] = byPiece[d.piece] || []).push(d); });

    var done = D.data.pieces.filter(function (p) { return byPiece[p.key]; });
    var todo = D.data.pieces.filter(function (p) { return !byPiece[p.key]; });

    var html = '<header class="dg-head"><p class="kicker">Mon espace</p>' +
      '<h1 class="dg-title">Bonjour ' + esc((user.name || '').split(' ')[0] || '') + '</h1>' +
      '<p class="dg-lead">' + (list.length
        ? list.length + ' diagnostic' + (list.length > 1 ? 's' : '') + ' réalisé' + (list.length > 1 ? 's' : '') + ' sur ' + done.length + ' pièce' + (done.length > 1 ? 's' : '') + ' du puzzle. Refaites un diagnostic quand vous voulez pour mesurer vos progrès.'
        : 'Vous n’avez pas encore de diagnostic. Choisissez une pièce pour commencer.') + '</p></header>';

    if (done.length) {
      html += '<h2 class="dg-h2">Vos diagnostics</h2><ul class="esp-cards" role="list">';
      done.forEach(function (p) {
        var items = byPiece[p.key]; // du plus récent au plus ancien
        var last = items[0];
        var prev = items[1] || null;
        var m = D.maturity(last.score_global);
        html += '<li class="esp-card' + (p.key === 'board' ? ' esp-card--board' : '') + '">' +
          '<div class="esp-card-head"><img src="' + D.avatarSrc(p) + '" alt="" width="176" height="176" loading="lazy">' +
          '<div><h3>' + esc(p.label) + '</h3><p class="esp-card-score"><strong>' + last.score_global + '</strong>/100 · ' + esc(m.label) +
          (prev ? ' ' + D.delta(last.score_global, prev.score_global) : '') + '</p></div>' +
          sparkline(items.slice().reverse().map(function (d) { return d.score_global; })) + '</div>' +
          '<ol class="esp-history" reversed>';
        items.forEach(function (d) {
          html += '<li><a href="diagnostic.html?id=' + encodeURIComponent(d.id) + '">' + D.formatDate(d.created_at) + '</a> <span>' + d.score_global + '/100</span></li>';
        });
        html += '</ol><p class="esp-card-actions"><a class="link-arrow" href="diagnostic.html?id=' + encodeURIComponent(last.id) + '">Voir le dernier résultat</a>' +
          ' <a class="link-arrow" href="diagnostic.html?piece=' + p.key + '">Refaire le diagnostic</a></p></li>';
      });
      html += '</ul>';
    }

    if (todo.length) {
      html += '<h2 class="dg-h2">' + (done.length ? 'Les autres pièces' : 'Choisissez une pièce') + '</h2><ul class="dg-choices dg-choices--compact" role="list">';
      todo.forEach(function (p) {
        html += '<li><a class="dg-choice' + (p.key === 'board' ? ' dg-choice--board' : '') + '" href="diagnostic.html?piece=' + p.key + '">' +
          '<img src="' + D.avatarSrc(p) + '" alt="" width="176" height="176" loading="lazy">' +
          '<span class="dg-choice-label">' + esc(p.label) + '</span>' +
          '<span class="dg-choice-meta">≈&nbsp;' + D.minutes(p) + '&nbsp;min · offert</span></a></li>';
      });
      html += '</ul>';
    }

    html += '<section class="esp-account" aria-labelledby="esp-account-title"><h2 class="dg-h2" id="esp-account-title">Mon compte</h2>' +
      '<p>Connecté avec <strong>' + esc(user.email) + '</strong>.</p>' +
      '<p class="dg-actions"><button type="button" class="btn btn--ghost" id="esp-signout">Me déconnecter</button>' +
      ' <a class="btn btn--primary" href="' + D.rdvUrl + '" target="_blank" rel="noopener">Prendre rendez-vous<span class="sr-only"> (nouvel onglet)</span></a></p>' +
      '<details class="esp-danger"><summary>Supprimer mes données</summary>' +
      '<p>Vous pouvez supprimer tous vos diagnostics, ou votre compte entier (diagnostics compris). Cette action est définitive.</p>' +
      '<p><button type="button" class="btn btn--ghost" id="esp-del-diags">Supprimer mes diagnostics</button></p>' +
      '<form id="esp-del-account" class="auth-form" novalidate><p class="form-field"><label for="esp-del-pwd">Mot de passe, pour confirmer la suppression du compte</label>' +
      '<input id="esp-del-pwd" type="password" autocomplete="current-password" required></p>' +
      '<p class="auth-error" role="alert" hidden></p>' +
      '<p><button type="submit" class="btn btn--ghost">Supprimer mon compte</button></p></form></details></section>';

    app.innerHTML = html;
    focusHeading();

    document.getElementById('esp-signout').addEventListener('click', function () {
      Compte.signOut().then(function () { renderSignedOut('Vous êtes déconnecté.'); });
    });
    document.getElementById('esp-del-diags').addEventListener('click', function () {
      if (!window.confirm('Supprimer définitivement tous vos diagnostics ?')) return;
      Compte.deleteAllDiagnostics(user.id).then(function (r) {
        if (r.error) { window.alert(r.error); return; }
        start();
      });
    });
    document.getElementById('esp-del-account').addEventListener('submit', function (e) {
      e.preventDefault();
      var err = e.target.querySelector('.auth-error');
      var pwd = document.getElementById('esp-del-pwd').value;
      if (!pwd) { err.textContent = 'Saisissez votre mot de passe.'; err.hidden = false; return; }
      if (!window.confirm('Supprimer définitivement votre compte et tous vos diagnostics ?')) return;
      Compte.deleteAllDiagnostics(user.id).then(function (r) {
        if (r.error) { err.textContent = r.error; err.hidden = false; return null; }
        return Compte.deleteAccount(pwd);
      }).then(function (r) {
        if (!r) return;
        if (r.error) { err.textContent = r.error; err.hidden = false; return; }
        D.clearPending();
        renderSignedOut('Votre compte et vos diagnostics sont supprimés.');
      });
    });
  }

  function start() {
    app.innerHTML = '<p class="dg-loading" role="status">Chargement…</p>';
    Compte.getUser().then(function (user) {
      if (!user) return renderSignedOut();
      var pending = D.readPending();
      var p = Promise.resolve();
      if (pending) {
        /* Diagnostic fait avant la connexion (ex. après confirmation de l'email) */
        var piece = D.getPiece(pending.piece);
        var scores = D.computeScores(piece, pending.answers);
        p = Compte.saveDiagnostic({ piece: pending.piece, version: D.data.version, answers: pending.answers, scores: scores, score_global: scores.global })
          .then(function (r) {
            if (!r.error && r.data) { D.clearPending(); location.replace('diagnostic.html?id=' + encodeURIComponent(r.data.id)); return 'redirect'; }
          });
      }
      return p.then(function (state) {
        if (state === 'redirect') return;
        return Compte.listDiagnostics().then(function (r) {
          if (r.error) { app.innerHTML = '<p class="dg-error" role="alert">' + esc(r.error) + '</p>'; return; }
          renderDashboard(user, r.data || []);
        });
      });
    });
  }

  if (!Compte.isConfigured()) {
    app.innerHTML = '<header class="dg-head"><p class="kicker">Mon espace</p><h1 class="dg-title">Votre espace ouvre très prochainement</h1>' +
      '<p class="dg-lead">Vous pourrez y retrouver tous vos diagnostics. En attendant, prenez rendez-vous&nbsp;: nous ferons le point ensemble.</p></header>' +
      '<p><a class="btn btn--primary" href="' + D.rdvUrl + '" target="_blank" rel="noopener">Prendre rendez-vous<span class="sr-only"> (nouvel onglet)</span></a></p>';
    return;
  }

  if (params.get('mdp') === 'nouveau' && params.get('token')) renderReset(params.get('token'));
  else start();
})();
