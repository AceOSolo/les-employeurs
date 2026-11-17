/* ==========================================================================
   Les Employeurs · formulaire de création de compte et de connexion
   ========================================================================== */
(function () {
  'use strict';

  var Compte = window.LECompte;
  var uid = 0;

  function field(id, label, type, autocomplete, extra) {
    return '<p class="form-field"><label for="' + id + '">' + label + '</label>' +
      '<input id="' + id + '" name="' + id + '" type="' + type + '" autocomplete="' + autocomplete + '" required' + (extra || '') + '></p>';
  }

  /* options : { intro, defaultMode: 'signup'|'signin', onSuccess(user) } */
  function mount(container, options) {
    options = options || {};
    var n = ++uid;
    var mode = options.defaultMode || 'signup';

    if (!Compte.isConfigured()) {
      container.innerHTML = '<div class="auth-box"><p class="auth-note">La création de compte ouvre très prochainement. ' +
        'En attendant, prenez rendez-vous&nbsp;: nous lirons votre diagnostic ensemble.</p>' +
        '<p><a class="btn btn--primary" href="' + window.LEDiag.rdvUrl + '" target="_blank" rel="noopener">Prendre rendez-vous<span class="sr-only"> (nouvel onglet)</span></a></p></div>';
      return;
    }

    function render() {
      var html = '<div class="auth-box">';
      if (options.intro) html += '<p class="auth-intro">' + options.intro + '</p>';
      html += '<div class="auth-tabs" role="group" aria-label="Choix du formulaire">' +
        '<button type="button" class="auth-tab" data-mode="signup" aria-pressed="' + (mode === 'signup') + '">Créer mon compte</button>' +
        '<button type="button" class="auth-tab" data-mode="signin" aria-pressed="' + (mode === 'signin') + '">J’ai déjà un compte</button></div>';

      if (mode === 'signup') {
        html += '<form class="auth-form" novalidate>' +
          field('a' + n + '-name', 'Prénom et nom', 'text', 'name', ' maxlength="80"') +
          field('a' + n + '-email', 'Adresse email professionnelle', 'email', 'email', ' maxlength="120"') +
          field('a' + n + '-pwd', 'Mot de passe <span class="form-hint">(8 caractères minimum)</span>', 'password', 'new-password', ' minlength="8" maxlength="128"') +
          '<p class="form-check"><input id="a' + n + '-ok" type="checkbox" required> <label for="a' + n + '-ok">J’accepte que LOGISTEM 2.0 conserve mon compte et mes diagnostics pour me les restituer dans mon espace, conformément à la <a href="confidentialite.html" target="_blank" rel="noopener">politique de confidentialité<span class="sr-only"> (nouvel onglet)</span></a>.</label></p>' +
          '<p class="auth-error" role="alert" hidden></p>' +
          '<p><button class="btn btn--primary" type="submit">Créer mon compte et voir mon résultat</button></p></form>';
      } else if (mode === 'signin') {
        html += '<form class="auth-form" novalidate>' +
          field('a' + n + '-email', 'Adresse email', 'email', 'email') +
          field('a' + n + '-pwd', 'Mot de passe', 'password', 'current-password') +
          '<p class="auth-error" role="alert" hidden></p>' +
          '<p><button class="btn btn--primary" type="submit">Me connecter</button></p>' +
          '<p><button type="button" class="auth-link" data-mode="forgot">Mot de passe oublié&nbsp;?</button></p></form>';
      } else if (mode === 'forgot') {
        html += '<form class="auth-form" novalidate>' +
          '<p>Indiquez votre adresse&nbsp;: nous vous envoyons un lien pour choisir un nouveau mot de passe.</p>' +
          field('a' + n + '-email', 'Adresse email', 'email', 'email') +
          '<p class="auth-error" role="alert" hidden></p>' +
          '<p><button class="btn btn--primary" type="submit">Recevoir le lien</button></p>' +
          '<p><button type="button" class="auth-link" data-mode="signin">Retour à la connexion</button></p></form>';
      } else if (mode === 'sent') {
        html += '<p class="auth-ok" role="status">' + (options.sentMessage || 'C’est envoyé. Consultez votre boîte mail.') + '</p>';
      }
      html += '</div>';
      container.innerHTML = html;
      var focusTarget = container.querySelector('input');
      if (focusTarget && options.autofocus !== false && mode !== 'signup') focusTarget.focus();
    }

    function showError(msg) {
      var el = container.querySelector('.auth-error');
      el.textContent = msg;
      el.hidden = false;
    }

    function value(suffix) {
      var el = document.getElementById('a' + n + '-' + suffix);
      return el ? el.value.trim() : '';
    }

    container.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-mode]');
      if (!btn) return;
      mode = btn.getAttribute('data-mode');
      render();
      var first = container.querySelector('input');
      if (first) first.focus();
    });

    container.addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.target;
      var submit = form.querySelector('[type=submit]');
      var email = value('email');
      var pwd = document.getElementById('a' + n + '-pwd') ? document.getElementById('a' + n + '-pwd').value : '';

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError('Saisissez une adresse email valide.');

      var p;
      if (mode === 'signup') {
        if (!value('name')) return showError('Indiquez votre prénom et votre nom.');
        if (pwd.length < 8) return showError('Le mot de passe doit comporter au moins 8 caractères.');
        if (!document.getElementById('a' + n + '-ok').checked) return showError('Cochez la case pour accepter la conservation de vos données.');
        p = Compte.signUp(value('name'), email, pwd);
      } else if (mode === 'signin') {
        if (!pwd) return showError('Saisissez votre mot de passe.');
        p = Compte.signIn(email, pwd);
      } else {
        p = Compte.requestPasswordReset(email);
      }

      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
      p.then(function (r) {
        submit.disabled = false;
        submit.removeAttribute('aria-busy');
        if (r.error) return showError(r.error);
        if (mode === 'forgot') {
          options.sentMessage = 'Si un compte existe pour cette adresse, un lien vient de lui être envoyé. Pensez à vérifier vos courriers indésirables.';
          mode = 'sent';
          return render();
        }
        return Compte.getUser().then(function (user) {
          if (user) return options.onSuccess && options.onSuccess(user);
          /* Compte créé mais adresse à confirmer */
          options.sentMessage = 'Votre compte est créé. Cliquez sur le lien reçu par email pour confirmer votre adresse, puis connectez-vous&nbsp;: votre résultat vous attendra.';
          mode = 'sent';
          render();
        });
      });
    });

    render();
  }

  window.LEAuthUI = { mount: mount };
})();
