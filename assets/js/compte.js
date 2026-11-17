/* ==========================================================================
   Les Employeurs · comptes et diagnostics
   --------------------------------------------------------------------------
   Petit client sans dépendance pour l'API PHP/MySQL des Employeurs
   (dossier serveur/ du dépôt, hébergée chez OVH).
   La session est un jeton gardé dans le navigateur (localStorage),
   uniquement pour maintenir la connexion : stockage strictement nécessaire.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Configuration ----------
     Adresse de l'API (dossier serveur/api déposé sur l'hébergement OVH).
     Vide = espace pas encore ouvert (le questionnaire reste utilisable). */
  var CONFIG = {
    apiUrl: '' // ex. https://api.les-employeurs.fr/
  };

  var TOKEN_KEY = 'le_session';

  function store(action, key, value) {
    try {
      if (action === 'get') return window.localStorage.getItem(key);
      if (action === 'set') window.localStorage.setItem(key, value);
      if (action === 'del') window.localStorage.removeItem(key);
    } catch (e) { /* navigation privée stricte : la session ne survivra pas au rechargement */ }
    return null;
  }

  function isConfigured() { return !!CONFIG.apiUrl; }

  /* Messages d'erreur lisibles */
  var MESSAGES = {
    USER_ALREADY_EXISTS: 'Un compte existe déjà avec cette adresse. Connectez-vous.',
    INVALID_EMAIL_OR_PASSWORD: 'Adresse email ou mot de passe incorrect.',
    INVALID_EMAIL: 'Adresse email invalide.',
    INVALID_PASSWORD: 'Mot de passe incorrect.',
    NAME_REQUIRED: 'Indiquez votre prénom et votre nom.',
    CONSENT_REQUIRED: 'Cochez la case pour accepter la conservation de vos données.',
    PASSWORD_TOO_SHORT: 'Le mot de passe doit comporter au moins 8 caractères.',
    PASSWORD_TOO_LONG: 'Le mot de passe est trop long.',
    INVALID_TOKEN: 'Ce lien n’est plus valide. Refaites une demande.',
    TOO_MANY_REQUESTS: 'Trop de tentatives. Réessayez dans quelques minutes.',
    UNAUTHORIZED: 'Votre session a expiré. Reconnectez-vous.',
    NOT_FOUND: 'Élément introuvable.'
  };

  function niceError(body, status) {
    var code = body && body.code;
    if (code && MESSAGES[code]) return MESSAGES[code];
    if (status === 429) return MESSAGES.TOO_MANY_REQUESTS;
    if (status === 0) return 'Connexion impossible. Vérifiez votre réseau et réessayez.';
    return 'Une erreur est survenue. Réessayez dans un instant.';
  }

  /* Appel à l'API : renvoie toujours { error, data, status } */
  function call(method, route, body, extra) {
    var headers = { 'Content-Type': 'application/json' };
    var token = store('get', TOKEN_KEY);
    if (token) {
      headers.Authorization = 'Bearer ' + token;
      headers['X-LE-Token'] = token; // secours si l'hébergement retire Authorization
    }
    var url = CONFIG.apiUrl + (CONFIG.apiUrl.indexOf('?') === -1 ? '?' : '&') + 'r=' + route + (extra || '');
    return fetch(url, {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined
    }).then(function (res) {
      return res.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
        if (res.status === 401 && token) store('del', TOKEN_KEY);
        if (!res.ok) return { error: niceError(data, res.status), data: null, status: res.status };
        return { error: null, data: data, status: res.status };
      });
    }, function () {
      return { error: niceError(null, 0), data: null, status: 0 };
    });
  }

  function keepToken(r) {
    if (!r.error && r.data && r.data.token) store('set', TOKEN_KEY, r.data.token);
    return r;
  }

  var Compte = {
    isConfigured: isConfigured,

    signUp: function (name, email, password) {
      return call('POST', 'signup', { name: name, email: email, password: password, consent: true }).then(keepToken);
    },

    signIn: function (email, password) {
      return call('POST', 'signin', { email: email, password: password }).then(keepToken);
    },

    signOut: function () {
      return call('POST', 'signout', {}).then(function (r) { store('del', TOKEN_KEY); return r; });
    },

    /* Renvoie l'utilisateur connecté ou null */
    getUser: function () {
      if (!isConfigured() || !store('get', TOKEN_KEY)) return Promise.resolve(null);
      return call('GET', 'me').then(function (r) { return r.data && r.data.user ? r.data.user : null; });
    },

    requestPasswordReset: function (email) {
      return call('POST', 'password-forgot', { email: email });
    },

    resetPassword: function (token, password) {
      return call('POST', 'password-reset', { token: token, password: password });
    },

    deleteAccount: function (password) {
      return call('POST', 'delete-account', { password: password }).then(function (r) {
        if (!r.error) store('del', TOKEN_KEY);
        return r;
      });
    },

    saveDiagnostic: function (record) {
      return call('POST', 'diagnostics', record).then(function (r) {
        if (r.data) r.data = r.data.diagnostic;
        return r;
      });
    },

    listDiagnostics: function () {
      return call('GET', 'diagnostics').then(function (r) {
        if (r.data) r.data = r.data.diagnostics;
        return r;
      });
    },

    getDiagnostic: function (id) {
      return call('GET', 'diagnostics', null, '&id=' + encodeURIComponent(id)).then(function (r) {
        r.data = r.data ? r.data.diagnostic : null;
        return r;
      });
    },

    deleteAllDiagnostics: function () {
      return call('DELETE', 'diagnostics');
    }
  };

  /* ---------- Mode démo, pour tester en local sans serveur ----------
     Actif uniquement en local (fichier ou localhost) avec ?demo dans l'adresse.
     Comptes et diagnostics sont alors simulés dans le navigateur.
     ?api=<adresse> permet aussi, en local, de tester contre une API de test. */
  var isLocal = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var apiParam = isLocal && location.search.match(/[?&]api=([^&]+)/);
  if (apiParam) store('set', 'le_api', decodeURIComponent(apiParam[1]));
  if (isLocal && store('get', 'le_api')) CONFIG.apiUrl = store('get', 'le_api');

  if (isLocal && !CONFIG.apiUrl && (/[?&]demo\b/.test(location.search) || store('get', 'le_demo') === '1')) {
    store('set', 'le_demo', '1');
    var db = function (v) {
      if (v) store('set', 'le_demo_db', JSON.stringify(v));
      return JSON.parse(store('get', 'le_demo_db') || '{"users":[],"diags":[],"me":null}');
    };
    var ok = function (data) { return Promise.resolve({ error: null, data: data, status: 200 }); };
    var ko = function (code) { return Promise.resolve({ error: MESSAGES[code] || code, data: null, status: 400 }); };
    Compte.isConfigured = function () { return true; };
    Compte.signUp = function (name, email, password) {
      var s = db();
      if (s.users.some(function (u) { return u.email === email; })) return ko('USER_ALREADY_EXISTS');
      var u = { id: 'u' + Date.now(), name: name, email: email, password: password };
      s.users.push(u); s.me = u.id; db(s); return ok({ user: u });
    };
    Compte.signIn = function (email, password) {
      var s = db();
      var u = s.users.filter(function (x) { return x.email === email && x.password === password; })[0];
      if (!u) return ko('INVALID_EMAIL_OR_PASSWORD');
      s.me = u.id; db(s); return ok({ user: u });
    };
    Compte.signOut = function () { var s = db(); s.me = null; db(s); return ok({}); };
    Compte.getUser = function () {
      var s = db();
      return Promise.resolve(s.users.filter(function (u) { return u.id === s.me; })[0] || null);
    };
    Compte.requestPasswordReset = function () { return ok({}); };
    Compte.resetPassword = function () { return ok({}); };
    Compte.deleteAccount = function () {
      var s = db();
      s.diags = s.diags.filter(function (d) { return d.user_id !== s.me; });
      s.users = s.users.filter(function (u) { return u.id !== s.me; }); s.me = null; db(s); return ok({});
    };
    Compte.saveDiagnostic = function (rec) {
      var s = db();
      var r = JSON.parse(JSON.stringify(rec));
      r.id = 'd' + Date.now(); r.user_id = s.me; r.created_at = new Date().toISOString();
      s.diags.push(r); db(s); return ok(r);
    };
    Compte.listDiagnostics = function () {
      var s = db();
      return ok(s.diags.filter(function (d) { return d.user_id === s.me; })
        .sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; }));
    };
    Compte.getDiagnostic = function (id) {
      var s = db();
      return ok(s.diags.filter(function (d) { return d.id === id && d.user_id === s.me; })[0] || null);
    };
    Compte.deleteAllDiagnostics = function () {
      var s = db(); s.diags = s.diags.filter(function (d) { return d.user_id !== s.me; }); db(s); return ok(null);
    };
  }

  window.LECompte = Compte;
})();
