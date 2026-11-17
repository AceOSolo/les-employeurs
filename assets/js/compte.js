/* ==========================================================================
   Les Employeurs · comptes et diagnostics
   --------------------------------------------------------------------------
   Petit client sans dépendance pour :
   - l'authentification (Neon Auth, basé sur Better Auth) ;
   - l'enregistrement des diagnostics (Neon Data API, protégée par RLS).
   La session est gardée dans le navigateur (localStorage), uniquement pour
   maintenir la connexion : c'est un stockage strictement nécessaire.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Configuration ----------
     Les deux adresses se trouvent dans la console Neon du projet
     « les-employeurs » (Auth › Configuration, Data API). */
  var CONFIG = {
    authUrl: '',     // ex. https://ep-xxx.neonauth.eu-central-1.aws.neon.tech/neondb/auth
    dataApiUrl: ''   // ex. https://ep-xxx.apirest.eu-central-1.aws.neon.tech/neondb/rest/v1
  };

  var TOKEN_KEY = 'le_session';
  var jwtCache = null; // { token, exp }

  function store(action, key, value) {
    try {
      if (action === 'get') return window.localStorage.getItem(key);
      if (action === 'set') window.localStorage.setItem(key, value);
      if (action === 'del') window.localStorage.removeItem(key);
    } catch (e) { /* navigation privée : la session ne survivra pas au rechargement */ }
    return null;
  }

  function isConfigured() { return !!(CONFIG.authUrl && CONFIG.dataApiUrl); }

  function decodeExp(jwt) {
    try {
      var payload = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(window.atob(payload)))).exp || 0;
    } catch (e) { return 0; }
  }

  function keepJwt(jwt) {
    if (jwt) jwtCache = { token: jwt, exp: decodeExp(jwt) };
  }

  /* Messages d'erreur lisibles */
  var MESSAGES = {
    USER_ALREADY_EXISTS: 'Un compte existe déjà avec cette adresse. Connectez-vous.',
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Un compte existe déjà avec cette adresse. Connectez-vous.',
    INVALID_EMAIL_OR_PASSWORD: 'Adresse email ou mot de passe incorrect.',
    INVALID_EMAIL: 'Adresse email invalide.',
    INVALID_PASSWORD: 'Mot de passe incorrect.',
    PASSWORD_TOO_SHORT: 'Le mot de passe doit comporter au moins 8 caractères.',
    PASSWORD_TOO_LONG: 'Le mot de passe est trop long.',
    EMAIL_NOT_VERIFIED: 'Confirmez d’abord votre adresse email grâce au lien reçu.',
    INVALID_TOKEN: 'Ce lien n’est plus valide. Refaites une demande.',
    TOO_MANY_REQUESTS: 'Trop de tentatives. Réessayez dans quelques minutes.'
  };

  function niceError(body, status) {
    var code = body && (body.code || (body.error && body.error.code));
    if (code && MESSAGES[code]) return MESSAGES[code];
    if (status === 429) return MESSAGES.TOO_MANY_REQUESTS;
    if (status === 0) return 'Connexion impossible. Vérifiez votre réseau et réessayez.';
    return 'Une erreur est survenue. Réessayez dans un instant.';
  }

  /* ---------- Appels à Neon Auth ---------- */
  function auth(path, options) {
    options = options || {};
    var headers = { 'Content-Type': 'application/json' };
    var token = store('get', TOKEN_KEY);
    if (token) headers.Authorization = 'Bearer ' + token;

    return fetch(CONFIG.authUrl + path, {
      method: options.method || 'GET',
      headers: headers,
      credentials: 'include',
      body: options.body ? JSON.stringify(options.body) : undefined
    }).then(function (res) {
      var newToken = res.headers.get('set-auth-token');
      if (newToken) store('set', TOKEN_KEY, newToken);
      keepJwt(res.headers.get('set-auth-jwt'));
      return res.text().then(function (text) {
        var body = null;
        try { body = text ? JSON.parse(text) : null; } catch (e) { body = null; }
        if (!res.ok) return { error: niceError(body, res.status), status: res.status, data: null };
        return { error: null, status: res.status, data: body };
      });
    }, function () {
      return { error: niceError(null, 0), status: 0, data: null };
    });
  }

  function clearLocal() {
    store('del', TOKEN_KEY);
    jwtCache = null;
  }

  var Compte = {
    isConfigured: isConfigured,

    signUp: function (name, email, password) {
      return auth('/sign-up/email', {
        method: 'POST',
        body: { name: name, email: email, password: password, callbackURL: location.origin + '/espace.html' }
      });
    },

    signIn: function (email, password) {
      return auth('/sign-in/email', { method: 'POST', body: { email: email, password: password, rememberMe: true } });
    },

    signOut: function () {
      return auth('/sign-out', { method: 'POST', body: {} }).then(function (r) { clearLocal(); return r; });
    },

    /* Renvoie { user } ou null */
    getUser: function () {
      if (!isConfigured()) return Promise.resolve(null);
      return auth('/get-session').then(function (r) {
        if (r.error || !r.data || !r.data.user) { if (!r.error || r.status === 401) clearLocal(); return null; }
        return r.data.user;
      });
    },

    requestPasswordReset: function (email) {
      return auth('/request-password-reset', {
        method: 'POST',
        body: { email: email, redirectTo: location.origin + '/espace.html?mdp=nouveau' }
      });
    },

    resetPassword: function (token, password) {
      return auth('/reset-password', { method: 'POST', body: { token: token, newPassword: password } });
    },

    deleteAccount: function (password) {
      return auth('/delete-user', { method: 'POST', body: { password: password } }).then(function (r) {
        if (!r.error) clearLocal();
        return r;
      });
    },

    /* JWT pour la Data API (renouvelé automatiquement, durée ~15 min) */
    getJwt: function () {
      var now = Date.now() / 1000;
      if (jwtCache && jwtCache.exp - 60 > now) return Promise.resolve(jwtCache.token);
      return auth('/get-session').then(function () {
        if (jwtCache && jwtCache.exp - 60 > now) return jwtCache.token;
        return auth('/token').then(function (r) {
          if (r.data && r.data.token) { keepJwt(r.data.token); return r.data.token; }
          return null;
        });
      });
    },

    /* ---------- Data API : table public.diagnostics ---------- */
    api: function (path, options) {
      options = options || {};
      return Compte.getJwt().then(function (jwt) {
        if (!jwt) return { error: 'Votre session a expiré. Reconnectez-vous.', data: null, status: 401 };
        var headers = { Authorization: 'Bearer ' + jwt, 'Content-Type': 'application/json' };
        if (options.prefer) headers.Prefer = options.prefer;
        return fetch(CONFIG.dataApiUrl + path, {
          method: options.method || 'GET',
          headers: headers,
          body: options.body ? JSON.stringify(options.body) : undefined
        }).then(function (res) {
          return res.text().then(function (text) {
            var body = null;
            try { body = text ? JSON.parse(text) : null; } catch (e) { body = null; }
            if (!res.ok) return { error: niceError(body, res.status), data: null, status: res.status };
            return { error: null, data: body, status: res.status };
          });
        }, function () { return { error: niceError(null, 0), data: null, status: 0 }; });
      });
    },

    saveDiagnostic: function (record) {
      return Compte.api('/diagnostics', { method: 'POST', body: record, prefer: 'return=representation' })
        .then(function (r) { if (r.data && r.data.length) r.data = r.data[0]; return r; });
    },

    listDiagnostics: function () {
      return Compte.api('/diagnostics?select=id,piece,score_global,scores,created_at&order=created_at.desc');
    },

    getDiagnostic: function (id) {
      return Compte.api('/diagnostics?id=eq.' + encodeURIComponent(id) + '&select=*')
        .then(function (r) { if (r.data) r.data = r.data[0] || null; return r; });
    },

    deleteAllDiagnostics: function (userId) {
      return Compte.api('/diagnostics?user_id=eq.' + encodeURIComponent(userId), { method: 'DELETE' });
    }
  };

  /* ---------- Mode démo, pour tester en local sans serveur ----------
     Actif uniquement en local (fichier ou localhost) avec ?demo dans l'adresse.
     Comptes et diagnostics sont alors simulés dans le navigateur. */
  var isLocal = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if (isLocal && (/[?&]demo\b/.test(location.search) || store('get', 'le_demo') === '1')) {
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
      var s = db(); s.users = s.users.filter(function (u) { return u.id !== s.me; }); s.me = null; db(s); return ok({});
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
