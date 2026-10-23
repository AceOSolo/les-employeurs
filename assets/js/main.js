/* ==========================================================================
   Les Employeurs · enrichissements JavaScript
   Tout le contenu est déjà dans le HTML : ce script ne fait qu’ajouter
   des comportements (menu mobile, animation du puzzle, filtre des cycles,
   suivi de lecture des fiches). Sans lui, le site reste complet.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduceMotion = function () { return !!(motionQuery && motionQuery.matches); };
  var hasIO = 'IntersectionObserver' in window;
  var toArray = function (list) { return Array.prototype.slice.call(list); };

  /* ---------- 1. Menu mobile ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  function setNav(open) {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', String(open));
    root.classList.toggle('nav-open', open);
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setNav(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setNav(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setNav(false);
        toggle.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 960) setNav(false);
    });
  }

  /* ---------- 2. En-tête : filet au défilement ---------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 3. Lien actif dans la navigation ---------- */
  var navLinks = nav ? toArray(nav.querySelectorAll('a[href^="#"]')) : [];
  if (navLinks.length && hasIO) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          if (link.getAttribute('href') === '#' + entry.target.id) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (link) {
      var section = document.getElementById(link.getAttribute('href').slice(1));
      if (section) sectionObserver.observe(section);
    });
  }

  /* ---------- 4. Puzzle : les pièces s’emboîtent à l’entrée dans l’écran ---------- */
  var puzzle = document.querySelector('.puzzle');
  if (puzzle && !reduceMotion() && hasIO) {
    puzzle.classList.add('is-scattered');
    var puzzleObserver;
    var assemble = function () {
      puzzleObserver.disconnect();
      // Deux images d’écart : l’état écarté est peint avant de lancer la transition.
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { puzzle.classList.remove('is-scattered'); });
      });
    };
    puzzleObserver = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) assemble();
    }, { threshold: 0.25 });
    puzzleObserver.observe(puzzle);
    // Au clavier, le puzzle s’assemble dès qu’une pièce reçoit le focus.
    puzzle.addEventListener('focusin', function () {
      if (puzzle.classList.contains('is-scattered')) assemble();
    });
  }

  /* ---------- 5. Frise des cycles : mise en avant des pièces ---------- */
  var cycleButtons = toArray(document.querySelectorAll('[data-cycle]'));
  var pieces = toArray(document.querySelectorAll('.piece'));
  var status = document.getElementById('puzzle-status');
  var defaultStatus = status ? status.textContent : '';

  function setCycle(cycle) {
    var active = cycle && cycle !== 'all';
    var names = [];

    cycleButtons.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-cycle') === (active ? cycle : 'all')));
    });
    pieces.forEach(function (piece) {
      var concerned = !active || piece.getAttribute('data-cycles').split(' ').indexOf(cycle) !== -1;
      piece.classList.toggle('is-dimmed', !concerned);
      piece.classList.toggle('is-highlighted', active && concerned);
      if (active && concerned) names.push(piece.getAttribute('data-short'));
    });
    if (puzzle) puzzle.setAttribute('data-cycle', active ? cycle : 'all');

    if (status) {
      if (!active) {
        status.textContent = defaultStatus;
      } else {
        var label = document.querySelector('.cycle-btn[data-cycle="' + cycle + '"] .cycle-name');
        status.textContent = 'Cycle ' + (label ? label.textContent : cycle) + ' : ' +
          names.length + ' pièces mobilisées (' + names.join(', ') + ').';
      }
    }
  }

  cycleButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var cycle = button.getAttribute('data-cycle');
      // Un second clic sur le cycle actif revient à « Toutes les pièces ».
      var isActive = button.getAttribute('aria-pressed') === 'true';
      setCycle(isActive && cycle !== 'all' ? 'all' : cycle);
    });
  });

  /* ---------- 6. Fiches : sommaire et mini-puzzle suivent la lecture ---------- */
  var articles = toArray(document.querySelectorAll('.fn[id]'));
  var indexLinks = toArray(document.querySelectorAll('.fn-index-list a'));
  var mapCells = toArray(document.querySelectorAll('.fn-index-map use[data-piece]'));

  function setCurrent(article) {
    var id = article.id;
    var piece = article.getAttribute('data-piece');
    indexLinks.forEach(function (link) {
      if (link.getAttribute('href') === '#' + id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    mapCells.forEach(function (cell) {
      cell.classList.toggle('is-current', cell.getAttribute('data-piece') === piece);
    });
  }
  if (articles.length && hasIO) {
    var articleObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) setCurrent(entry.target); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    articles.forEach(function (article) { articleObserver.observe(article); });
  }
})();
