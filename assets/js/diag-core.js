/* ==========================================================================
   Les Employeurs · diagnostics : calcul des scores et affichage du résultat
   (partagé par diagnostic.html et espace.html)
   ========================================================================== */
(function () {
  'use strict';

  var DATA = window.LE_DIAG_DATA;
  var RDV_URL = 'https://cal.com/jbarret/15min';
  var PENDING_KEY = 'le_diag_en_attente';

  /* Échelle de réponse : la valeur sert au score, null = non concerné */
  var LEVELS = [
    { value: 0, label: 'Pas encore' },
    { value: 1, label: 'En réflexion' },
    { value: 2, label: 'En partie' },
    { value: 3, label: 'En place' },
    { value: null, label: 'Non concerné', key: 'nc' }
  ];

  var MATURITY = [
    { min: 75, label: 'Solide', text: 'Les fondamentaux sont en place. L’enjeu est maintenant de les faire vivre et de les améliorer.' },
    { min: 50, label: 'Bien engagé', text: 'Une bonne partie est en place. Quelques chantiers restent à consolider.' },
    { min: 25, label: 'En chantier', text: 'Les bases existent, mais plusieurs sujets restent à structurer.' },
    { min: 0, label: 'À construire', text: 'Beaucoup reste à mettre en place : c’est le bon moment pour poser les bases.' }
  ];

  function getPiece(key) {
    for (var i = 0; i < DATA.pieces.length; i++) if (DATA.pieces[i].key === key) return DATA.pieces[i];
    return null;
  }

  function avatarSrc(piece) {
    return 'assets/img/avatars/' + piece.avatar.toLowerCase() + '-portrait.webp?v=2';
  }

  function maturity(score) {
    for (var i = 0; i < MATURITY.length; i++) if (score >= MATURITY[i].min) return MATURITY[i];
    return MATURITY[MATURITY.length - 1];
  }

  /* answers : { "1.2": 0..3 | "nc" } → { global, families: { "1": 0..100 | null } } */
  function computeScores(piece, answers) {
    var families = {};
    var sum = 0, count = 0;
    piece.families.forEach(function (fam) {
      var fs = 0, fc = 0;
      fam.items.forEach(function (item) {
        var v = answers[item.id];
        if (typeof v === 'number') { fs += v; fc += 1; }
      });
      if (fc) {
        var s = Math.round((fs / (fc * 3)) * 100);
        families[fam.id] = s;
        sum += s; count += 1;
      } else {
        families[fam.id] = null;
      }
    });
    return { global: count ? Math.round(sum / count) : 0, families: families };
  }

  function countItems(piece) {
    return piece.families.reduce(function (n, f) { return n + f.items.length; }, 0);
  }

  function minutes(piece) {
    return Math.max(2, Math.round(countItems(piece) * 8 / 60));
  }

  /* ---------- Diagnostic en attente (avant création du compte) ---------- */
  function savePending(piece, answers) {
    try { window.localStorage.setItem(PENDING_KEY, JSON.stringify({ piece: piece, answers: answers, ts: Date.now() })); } catch (e) {}
  }
  function readPending() {
    try {
      var p = JSON.parse(window.localStorage.getItem(PENDING_KEY) || 'null');
      if (p && Date.now() - p.ts < 7 * 24 * 3600 * 1000 && getPiece(p.piece)) return p;
    } catch (e) {}
    return null;
  }
  function clearPending() {
    try { window.localStorage.removeItem(PENDING_KEY); } catch (e) {}
  }

  /* ---------- Rendu ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) { return ''; }
  }

  function delta(now, before) {
    if (typeof now !== 'number' || typeof before !== 'number') return '';
    var d = now - before;
    if (d === 0) return '<span class="dg-delta dg-delta--flat">=</span>';
    var cls = d > 0 ? 'up' : 'down';
    var label = (d > 0 ? '+' : '−') + Math.abs(d);
    return '<span class="dg-delta dg-delta--' + cls + '"><span class="sr-only">Évolution depuis le diagnostic précédent&nbsp;: </span>' + label + '</span>';
  }

  /* Priorités : les familles les plus basses, avec leurs sous-familles les plus faibles */
  function priorities(piece, record) {
    var scored = piece.families
      .filter(function (f) { return typeof record.scores.families[f.id] === 'number' && record.scores.families[f.id] < 75; })
      .sort(function (a, b) { return record.scores.families[a.id] - record.scores.families[b.id]; })
      .slice(0, 3);
    return scored.map(function (fam) {
      var weak = fam.items
        .filter(function (it) { return typeof record.answers[it.id] === 'number' && record.answers[it.id] < 2; })
        .slice(0, 3);
      if (!weak.length) weak = fam.items.slice(0, 2);
      return { fam: fam, items: weak };
    });
  }

  /* record : { piece, answers, scores, score_global, created_at }  previous : idem ou null */
  function renderResult(record, previous, options) {
    options = options || {};
    var piece = getPiece(record.piece);
    var m = maturity(record.score_global);
    var html = '';

    html += '<header class="dg-result-head">';
    html += '<img class="dg-result-avatar" src="' + avatarSrc(piece) + '" alt="" width="176" height="176">';
    html += '<div><p class="kicker">Diagnostic ' + esc(piece.label) + '</p>';
    html += '<h1 class="dg-title" id="dg-result-title">Votre résultat</h1>';
    if (record.created_at) html += '<p class="dg-meta">Réalisé le ' + formatDate(record.created_at) + '</p>';
    html += '</div></header>';

    html += '<div class="dg-score-card">';
    html += '<p class="dg-score"><span class="dg-score-num">' + record.score_global + '</span><span class="dg-score-unit">/100</span>';
    if (previous) html += ' ' + delta(record.score_global, previous.score_global);
    html += '</p>';
    html += '<div><p class="dg-level">' + esc(m.label) + '</p><p class="dg-level-text">' + esc(m.text) + '</p>';
    if (previous) html += '<p class="dg-compare">Comparé à votre diagnostic du ' + formatDate(previous.created_at) + ' (' + previous.score_global + '/100).</p>';
    html += '</div></div>';

    html += '<h2 class="dg-h2">Famille par famille</h2>';
    html += '<ul class="dg-bars" role="list">';
    piece.families.forEach(function (fam) {
      var s = record.scores.families[fam.id];
      var prev = previous && previous.scores && previous.scores.families ? previous.scores.families[fam.id] : null;
      html += '<li class="dg-bar">';
      html += '<span class="dg-bar-label">' + esc(fam.label) + '</span>';
      if (typeof s === 'number') {
        html += '<span class="dg-bar-track" aria-hidden="true"><span class="dg-bar-fill" style="width:' + s + '%"></span></span>';
        html += '<span class="dg-bar-value">' + s + '<span class="sr-only"> sur 100</span>' + (previous ? ' ' + delta(s, prev) : '') + '</span>';
      } else {
        html += '<span class="dg-bar-track dg-bar-track--na" aria-hidden="true"></span><span class="dg-bar-value dg-bar-value--na">non concerné</span>';
      }
      html += '</li>';
    });
    html += '</ul>';

    var prio = priorities(piece, record);
    if (prio.length) {
      html += '<h2 class="dg-h2">Vos 3 priorités</h2><ol class="dg-prio">';
      prio.forEach(function (p) {
        html += '<li><h3>' + esc(p.fam.label) + ' <span class="dg-prio-score">' + record.scores.families[p.fam.id] + '/100</span></h3><ul>';
        p.items.forEach(function (it) {
          html += '<li><strong>' + esc(it.label) + '</strong>&nbsp;: ' + it.ex.map(esc).join(' · ') + '</li>';
        });
        html += '</ul></li>';
      });
      html += '</ol>';
    } else {
      html += '<p class="dg-good">Aucune famille sous 75/100&nbsp;: bravo. Un échange peut vous aider à aller plus loin.</p>';
    }

    html += '<div class="dg-cta">';
    html += '<p>Ce diagnostic est un premier repère. Pour le lire ensemble et définir vos priorités, prenez rendez-vous&nbsp;: le premier échange est offert.</p>';
    html += '<p class="dg-actions"><a class="btn btn--primary" href="' + RDV_URL + '" target="_blank" rel="noopener">En parler en rendez-vous<span class="sr-only"> (nouvel onglet)</span></a>';
    html += ' <a class="btn btn--ghost" href="espace.html">Mon espace</a>';
    if (options.retake !== false) html += ' <a class="link-arrow" href="diagnostic.html?piece=' + piece.key + '">Refaire ce diagnostic</a>';
    html += '</p></div>';
    return html;
  }

  window.LEDiag = {
    data: DATA,
    levels: LEVELS,
    rdvUrl: RDV_URL,
    getPiece: getPiece,
    avatarSrc: avatarSrc,
    maturity: maturity,
    computeScores: computeScores,
    countItems: countItems,
    minutes: minutes,
    savePending: savePending,
    readPending: readPending,
    clearPending: clearPending,
    renderResult: renderResult,
    esc: esc,
    formatDate: formatDate,
    delta: delta
  };
})();
