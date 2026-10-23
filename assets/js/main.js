/* ==========================================================================
   Les Employeurs · enrichissements JavaScript
   Tout le contenu est déjà dans le HTML : ce script ne fait qu’ajouter
   des comportements (menu mobile, animation du puzzle, panneaux, filtres).
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduceMotion = function () { return !!(motionQuery && motionQuery.matches); };

  /* Navigateur sans <dialog> : on revient à l’affichage sans JavaScript (fiches lisibles). */
  var supportsDialog = typeof window.HTMLDialogElement === 'function' &&
    typeof document.createElement('dialog').showModal === 'function';
  if (!supportsDialog) {
    root.classList.remove('js');
    root.classList.add('no-js');
  }

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
      if (window.innerWidth >= 860) setNav(false);
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
  var navLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]')) : [];
  if (navLinks.length && 'IntersectionObserver' in window) {
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

  /* ---------- 4. Puzzle : assemblage à l’entrée dans l’écran ---------- */
  var puzzle = document.querySelector('.puzzle');
  if (puzzle && !reduceMotion() && 'IntersectionObserver' in window) {
    puzzle.classList.add('is-scattered');
    var assemble = function () {
      puzzleObserver.disconnect();
      // Deux images d’écart : l’état dispersé est peint avant de lancer la transition.
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { puzzle.classList.remove('is-scattered'); });
      });
    };
    var puzzleObserver = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) assemble();
    }, { threshold: 0.3 });
    puzzleObserver.observe(puzzle);
    // Au clavier, le puzzle s’assemble dès qu’une pièce reçoit le focus.
    puzzle.addEventListener('focusin', function () {
      if (puzzle.classList.contains('is-scattered')) assemble();
    });
  }

  /* ---------- 5. Panneaux de détail ---------- */
  if (!supportsDialog) {
    // Repli : chaque pièce mène à sa fiche, affichée sous le puzzle.
    Array.prototype.forEach.call(document.querySelectorAll('.piece[commandfor]'), function (button) {
      button.addEventListener('click', function () {
        var card = document.getElementById(button.getAttribute('commandfor'));
        if (card) card.scrollIntoView();
      });
    });
  } else {
    // Les boutons utilisent commandfor/command (natif). Repli pour les navigateurs qui ne les gèrent pas.
    var supportsInvokers = 'commandForElement' in HTMLButtonElement.prototype;
    var openers = document.querySelectorAll('[commandfor][command="show-modal"]');
    if (!supportsInvokers) {
      Array.prototype.forEach.call(openers, function (button) {
        button.addEventListener('click', function () {
          var dialog = document.getElementById(button.getAttribute('commandfor'));
          if (dialog && !dialog.open) dialog.showModal();
        });
      });
    }
    // Fermeture au clic sur le fond (repli si l’attribut closedby n’est pas géré).
    Array.prototype.forEach.call(document.querySelectorAll('.piece-dialog'), function (dialog) {
      dialog.addEventListener('click', function (event) {
        if (event.target === dialog) dialog.close();
      });
    });
  }

  /* ---------- 6. Frise des cycles : mise en avant des pièces ---------- */
  var cycleButtons = Array.prototype.slice.call(document.querySelectorAll('[data-cycle]'));
  var pieces = Array.prototype.slice.call(document.querySelectorAll('.piece'));
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
        var button = document.querySelector('.cycle-btn[data-cycle="' + cycle + '"] .cycle-name');
        status.textContent = 'Cycle ' + (button ? button.textContent : cycle) + ' : ' +
          names.length + ' pièces mises en avant (' + names.join(', ') + ').';
      }
    }
  }

  cycleButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var cycle = button.getAttribute('data-cycle');
      // Un second clic sur le cycle actif revient à « Tous les cycles ».
      var isActive = button.getAttribute('aria-pressed') === 'true';
      setCycle(isActive && cycle !== 'all' ? 'all' : cycle);
    });
  });
})();
