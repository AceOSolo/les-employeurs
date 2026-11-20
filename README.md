# Les Employeurs · site one-page

Site vitrine de **Les Employeurs** (édité par LOGISTEM 2.0) : 9 fonctions supports représentées comme les 9 pièces d’un puzzle, avec le **Board externalisé** en pièce centrale. Hébergement : **GitHub Pages** ; nom de domaine chez **OVH**.

- 100 % statique : HTML, CSS et JavaScript écrits à la main, **sans dépendance ni étape de build**.
- **Aucune ressource externe** au chargement des pages publiques. Les polices, les icônes, les illustrations et la photo sont servies depuis le site.
- **Aucun traceur.** Seul l’espace personnel (diagnostics) garde une session de connexion, strictement nécessaire : aucun bandeau de consentement n’est donc nécessaire.
- **Diagnostics offerts** par pièce, avec compte et historique : comptes et données sur **notre propre API PHP/MySQL**, hébergée chez OVH (aucun service tiers), voir [Diagnostics et espace personnel](#diagnostics-et-espace-personnel).
- Chemins relatifs : le site fonctionne à la racine d’un domaine comme dans un sous-dossier.

## Arborescence

```
index.html                 page unique (tout le contenu est dans le HTML)
diagnostic.html            diagnostic offert : choix de la pièce, questionnaire, résultat
espace.html                espace personnel : connexion, historique des diagnostics
mentions-legales.html
confidentialite.html       politique de confidentialité (RGPD)
404.html
robots.txt, sitemap.xml
assets/css/styles.css      styles ; la charte est en tête de fichier
assets/js/main.js          enrichissements uniquement (le site reste complet sans JS)
assets/js/diag-data.js     contenu des diagnostics, généré depuis le catalogue 9 pôles
assets/js/diag-core.js     calcul des scores, rendu du résultat
assets/js/compte.js        client de l’API des comptes (et mode démo local)
assets/js/auth-ui.js       formulaire de création de compte / connexion
assets/js/diagnostic.js, espace.js   logique des deux pages
serveur/api/               API PHP des comptes et diagnostics, à déposer chez OVH
serveur/schema.sql         tables MySQL, à importer une fois dans phpMyAdmin
outils/generer-diagnostics.py   régénère diag-data.js depuis le fichier Excel du catalogue
assets/fonts/              Bricolage Grotesque et Instrument Sans (.woff2) et leurs licences
assets/img/logo.svg        logo autonome, texte vectorisé (pour les usages hors site)
assets/img/favicon.svg, apple-touch-icon.png   icônes
assets/img/og-image.png    image de partage (LinkedIn, WhatsApp, Slack…), 1200 × 630
assets/img/jean-philippe-barret.jpg / .webp    portrait de la section « Qui sommes-nous »
assets/img/avatars/        les 9 portraits ronds des avatars en WebP (nom-portrait.webp, 176 px)
assets/video/              vidéo « BOARD to be » (MP4 H.264/AAC), son image d’attente et ses sous-titres (.vtt)
CNAME                      domaine personnalisé GitHub Pages (les-employeurs.fr)
.nojekyll                  désactive Jekyll : GitHub Pages sert les fichiers tels quels
```

## Tester en local

```bash
python -m http.server 8000
```

Puis ouvrir <http://localhost:8000/>. Sous macOS ou Linux, la commande peut s’appeler `python3`. Le serveur local n’affiche pas la page 404 personnalisée ; GitHub Pages, si.

## Structure de la page

| # | Section | Ancre |
|---|---|---|
| | Hero : H1 avec mots-clés et slogan « Tout pour entreprendre. » | `#accueil` |
| 01 | Les 9 fonctions : frise des 5 cycles, puzzle, 9 fiches détaillées avec sommaire | `#fonctions` |
| 02 | Le Board externalisé | `#board` |
| 03 | Travailler ensemble : une fonction, plusieurs ou toutes | `#travailler-ensemble` |
| 04 | Cas client : Agence Coïncidence | `#cas-client` |
| 05 | Qui sommes-nous : Jean-Philippe Barret | `#qui-sommes-nous` |
| 06 | FAQ (6 questions en `<details>` natifs) | `#faq` |
| 07 | Contact : « Quelle pièce vous manque ? » | `#contact` |

Le menu compte 7 liens (Les 9 fonctions, Le Board, Cas client, Qui sommes-nous, FAQ, Diagnostic, Contact). Il se replie en bouton « Menu » sous 1080 px de large. « Travailler ensemble » est accessible par le défilement et le pied de page.

## Le puzzle et sa numérotation en horloge

Les pièces sont numérotées **comme une horloge** : 01 à midi (haut centre), puis dans le sens des aiguilles d’une montre, jusqu’à 08 en haut à gauche. Le Board, au centre, ferme la boucle en 09 :

```
08 Santé Sécurité         01 Direction & Stratégie   02 Ressources Humaines
07 QVCT & RSE             09 Board externalisé       03 Finance & Gestion
06 Achat & Fournisseurs   05 Informatique & Digital  04 Commerce & Marketing
```

Les pièces sont écrites dans le HTML **dans l’ordre 01 → 09**, et la touche Tab suit donc l’horloge. Chaque `<li class="puzzle-slot">` est placé dans la grille par son `style="grid-area: ligne / colonne"`. L’animation d’entrée suit le même ordre, le Board en dernier. Sur chaque pièce, `--i` fixe le rang et `--sx` / `--sy` la direction d’arrivée.

Les fiches, le sommaire, le pied de page, le JSON-LD et les diagnostics suivent le même ordre (aligné sur le catalogue Marc Employeur et l’ordre des avatars).

Les formes des pièces (`<path id="pz-…">` du sprite) dépendent de la **case** et non de la fonction : pour réordonner, on garde la géométrie de chaque case et on renomme les `id`.

## Modifier les textes

Tout le contenu est dans `index.html`, découpé par des commentaires (`<!-- ============ 1. Hero ============ -->`, etc.).

### Une fonction

Chaque fonction apparaît à **quatre endroits** :

1. **La pièce du puzzle**, `<a class="piece" id="piece-…">` :
   - `.piece-num` : numéro ;
   - `.piece-label` : libellé complet ;
   - `.piece-label-short` : libellé court, sur mobile ;
   - `data-short` : libellé court repris dans le message du filtre ;
   - `data-cycles` : cycles concernés.
2. **La fiche**, `<article class="fn" id="fonction-…">` : numéro, titre, sous-titre SEO (`.fn-seo`), description, missions, cycles, partenaire.
3. **Le sommaire** des fiches (`.fn-index-list`).
4. **Le pied de page** (colonne « Les 9 fonctions »).

Identifiants : `qvct`, `strategie`, `rh`, `sante`, `finance`, `commerce`, `digital`, `achats`, `board`.

Les formes des pièces sont définies **une seule fois**, dans le sprite SVG en haut de `index.html` (`<path id="pz-…">`). Elles sont réutilisées partout via `<use>` : puzzle, sommaire, illustrations, mini-puzzle du cas client. Ne modifiez pas leurs attributs `d="…"` : ce sont des arcs de cercle calculés pour que tenons et mortaises s’emboîtent avec un joint constant.

### Les cycles

La correspondance cycle → pièces est écrite à **trois endroits**, à garder cohérents :

1. `data-cycles` sur chaque pièce. Valeurs : `creation`, `lancement`, `croissance`, `structuration`, `transmission`.
2. Le texte de la frise (`.cycle-pieces`).
3. Les étiquettes « Cycles concernés » de chaque fiche.

### Les avatars (TK-559, TK-573)

Chaque pièce a son avatar : VIBE (QVCT & RSE), CAP (Direction & Stratégie), BUDDY (Ressources Humaines), SAFE (Santé Sécurité), CENT (Finance & Gestion), DEAL (Commerce & Marketing), BYTE (Informatique & Digital), NEGO (Achat & Fournisseurs) et MARC, « Pilote de Succès », sur le Board.

- **Sur le puzzle**, chaque pièce affiche le portrait rond, le nom et la fonction (`.piece-avatar`, `.piece-name`, `.piece-label`). Sur mobile, portrait, nom et libellé court. Le texte alternatif du portrait (« CAP, avatar Direction & Stratégie ») donne son nom au lien ; le nom et la fonction affichés sont donc en `aria-hidden`.
- **Sur chaque fiche**, `<figure class="fn-avatar">` dans l’en-tête : petit portrait rond cerclé, à droite en face du titre, avec le nom dessous.
- **Fichiers** : `assets/img/avatars/`, recadrés tête et épaules, visage centré, à partir des PNG 1024 px de référence (TK-573). Pour remplacer un avatar, gardez le nom de fichier et le format carré, et augmentez le `?v=` des `src` dans `index.html`.

### La vidéo « BOARD to be » (TK-573)

Dans la section Board, au-dessus des cinq formats : `<div class="board-video">`, la vidéo à gauche et son texte à droite (l’un sous l’autre sur mobile).

- Lecteur HTML5, `preload="metadata"`, sans lecture automatique ; image d’attente `board-to-be-poster.jpg`, 16/9. Avec JavaScript, un grand bouton orange « Lancer la vidéo » couvre l’image et les contrôles natifs apparaissent au premier clic ; sans JavaScript, le lecteur garde ses contrôles.
- **Chapitres** : chaque carte de format a un bouton (0:08, 0:21, 0:34, 0:47, 1:00) qui lance la vidéo au passage correspondant (`data-time`, en secondes).
- Sous-titres `board-to-be.fr.vtt`, calés sur la voix off et placés au-dessus du bandeau « BOARD to be » de l’image. Le texte complet est aussi dans la page (`<details>` « Lire le texte de la vidéo ») et la vidéo est déclarée en JSON-LD (`VideoObject`).
- Le MP4 a son index en tête de fichier (lecture progressive). Pour le remplacer, gardez le même nom et réexportez en H.264/AAC avec l’option *faststart*.
- Limite connue, côté vidéo : dans le plan final, DEAL apparaît en double et NEGO est absent.

### Cas client

La section `#cas-client` présente l’accompagnement de l’Agence Coïncidence en trois temps : situation, actions, résultat. Le mini-puzzle allume les pièces mobilisées : ajoutez ou retirez `class="is-on"` sur les `<use>` de `.cas-map`, et mettez à jour la liste `.cas-pieces`. Pour un second cas client, dupliquez le bloc `<div class="cas">`.

### Qui sommes-nous

La section présente Jean-Philippe Barret en **entrepreneur** : chef d’entreprise, homme de terrain, créateur et dirigeant de plusieurs entreprises, avec sa citation sur l’entrepreneuriat. Elle ne mentionne volontairement rien de son activité santé-sécurité.

Le portrait existe en deux formats, WebP et JPEG, au même cadrage (640 × 800). Pour le remplacer, gardez ce ratio 4:5 et les mêmes noms de fichiers. Le cadre griffonné derrière la photo est `.about-frame`, la pièce orange en angle `.about-badge`.

### Les tracés « feutre »

Tout le site reprend la direction artistique du croquis du haut de page : traits de feutre qui se dessinent, annotations manuscrites, grilles hachurées.

**Comment ça marche.** Tout élément portant l’attribut `data-ink` se dessine quand il entre à l’écran : `main.js` lui ajoute la classe `is-inked`, et les traits `.ink-path` se tracent. Sans JavaScript ou avec `prefers-reduced-motion`, ils s’affichent directement.

**Mots marqués dans les titres.**

| Classe | Effet | Exemple |
|---|---|---|
| `.mk--under` | soulignés | « à vos côtés », « remettre de l’ordre », « vos questions », « entreprendre » |
| `.mk--circle` | entourés | « vous choisissez », « vous manque » |
| `.mk--round` | entouré, pour un seul caractère | le « 9 » |
| `.mk--hl` | surligné | « entrepreneurs » |

Les modificateurs `.mk--board` (orange clair) et `.mk--soft` (sarcelle clair) servent sur les fonds sombres. Pour marquer un autre mot, copiez un `<span class="mk …" data-ink>` existant, SVG compris, autour du nouveau mot. Le tracé s’adapte à la longueur du mot.

**Annotations et dessins.**
- **Hero** : flèche « les 9 pièces, juste en dessous ».
- **Puzzle** (écrans ≥ 1240 px) : « cliquez sur une pièce », et la spirale qui mène de 01 (à midi) au Board.
- **Frise** : ligne de temps griffonnée, et un cercle qui se dessine autour du cycle choisi (`.cycle-ink`).
- **Board** : cercle autour de la pièce centrale, « cinq experts, une seule table ».
- **Travailler ensemble** et **cas client** : flèche « et vous pouvez ajouter des pièces en chemin » et grilles hachurées (`.sketch-grid`). Une case hachurée = une pièce confiée, en orange pour le Board.
- **Cas client** : une coche sur « Ce qui a changé ».
- **Qui sommes-nous** : cadre autour du portrait.
- **FAQ** : point d’interrogation.
- **Contact** : « celle-ci ? » et une flèche vers la pièce manquante.
- **Pied de page** : slogan souligné.

Ces tracés sont des courbes générées pour avoir l’air faits à la main. Pour en changer la forme, il faut les redessiner ; leur couleur et leur épaisseur se règlent dans la section 6.0 de `styles.css`.

### Partenaires

- **Secutop** (Santé Sécurité) : lien vers <https://www.secutop.fr/> dans sa fiche et dans le pied de page.
- **Gingerence** (QVCT & RSE) et **Sinolx** (Informatique & Digital) : affichés sans lien. Pour en ajouter un, reprenez le balisage du lien Secutop dans la fiche (`.fn-partner`) et dans le pied de page (`.footer-partners`).

### Autres contenus

- Pages légales : `mentions-legales.html` et `confidentialite.html`.
- Référencement : `<title>`, `meta description`, Open Graph et JSON-LD (`ProfessionalService` avec raison sociale, TVA, adresse et fondateur) en tête de `index.html`.
- Copyright : l’année est écrite en dur dans les pieds de page (`© 2026`).

## Diagnostics et espace personnel

Chaque pièce du puzzle propose un **diagnostic offert**. Le visiteur évalue où en est son entreprise sur chaque sous-famille de la pièce (échelle : *Pas encore*, *En réflexion*, *En partie*, *En place*, *Non concerné*). Pour voir le résultat, il **crée un compte**. Son espace garde l’**historique** de tous ses diagnostics, pièce par pièce, pour comparer l’évolution.

**Contenu.** Les familles et sous-familles viennent du catalogue Marc Employeur (`Catalogue_9_poles.xlsx`, page Notion « Catalogue 9 pôles ») : 9 familles × 3 sous-familles par pièce (27 questions), 18 familles pour QVCT & RSE (66 questions), 5 pour le Board (15 questions). Chaque question cite 3 articles du catalogue en exemple. Pour mettre à jour après une modification du catalogue :

```bash
python outils/generer-diagnostics.py chemin/vers/Catalogue_9_poles.xlsx
```

**Scores.** Une sous-famille vaut 0 à 3 ; une famille = moyenne ramenée sur 100 ; le score global = moyenne des familles (les « Non concerné » sont exclus). Niveaux : À construire (< 25), En chantier (< 50), Bien engagé (< 75), Solide. Les 3 priorités sont les familles les plus basses sous 75, avec leurs sous-familles les plus faibles.

**Parcours.** `diagnostic.html` (choix de la pièce) → `diagnostic.html?piece=strategie` (questionnaire, une famille par écran) → création du compte ou connexion → enregistrement → `diagnostic.html?id=…` (résultat, comparé au diagnostic précédent de la même pièce). Le diagnostic terminé est gardé dans le navigateur jusqu’à la connexion, même si l’adresse email doit d’abord être confirmée : il est enregistré automatiquement à l’arrivée dans `espace.html`.

**Technique.** Le site reste statique sur GitHub Pages. Les comptes et les diagnostics sont gérés par **notre propre API** en PHP (dossier `serveur/api/`, sans dépendance) et stockés dans une **base MySQL chez OVH** : les données restent chez vous, sans service tiers. Mots de passe chiffrés (`password_hash`), sessions par jeton aléatoire dont seule l’empreinte est stockée, limitation des tentatives, CORS limité au site, scores recalculés par le serveur, chaque compte ne voit que ses diagnostics.

**Mise en service chez OVH** (une fois) :

1. Espace client OVH › Hébergement › **Bases de données** : créer une base MySQL, puis l’ouvrir dans phpMyAdmin et **importer** `serveur/schema.sql`.
2. Espace client › Hébergement › **Multisite** : ajouter `api.les-employeurs.fr`, dossier racine `api-les-employeurs`, SSL activé. OVH crée l’entrée DNS si le domaine est chez OVH.
3. Déposer **le contenu** de `serveur/api/` dans ce dossier (FTP), y compris `.htaccess`.
4. Copier `config.exemple.php` en `config.php` sur le serveur et le remplir (accès à la base, adresse d’expédition des emails). Ne jamais le mettre dans Git.
5. Vérifier : `https://api.les-employeurs.fr/?r=me` doit répondre `{"code":"UNAUTHORIZED"}`.
6. Renseigner `apiUrl: 'https://api.les-employeurs.fr/'` en tête de `assets/js/compte.js`, changer le numéro de version des scripts, publier le site.

Tant que `apiUrl` est vide, le questionnaire fonctionne mais l’écran de résultat invite à prendre rendez-vous, et `espace.html` annonce une ouverture prochaine.

**Emails.** Seul le « mot de passe oublié » envoie un email, par la fonction `mail()` de l’hébergement OVH. L’adresse d’expédition (`mail_from`) doit appartenir à un domaine hébergé chez OVH.

**Tester en local.** Sans serveur : ajouter `?demo` à l’adresse (`diagnostic.html?demo`), comptes et diagnostics sont simulés dans le navigateur. Avec l’API : lancer MySQL et `php -S 127.0.0.1:8081 -t serveur/api` (avec un `config.php` de test), servir le site sur `http://localhost:8000`, puis ouvrir `diagnostic.html?api=http://127.0.0.1:8081/index.php`. Ces deux modes ne fonctionnent qu’en local. Pour en sortir : `localStorage.clear()` dans la console.

**Purge RGPD.** Automatique : l’API supprime de temps en temps les comptes sans connexion depuis 3 ans, avec leurs diagnostics, ainsi que les sessions expirées.

## Cache des navigateurs

`styles.css` et `main.js` sont appelés avec un numéro de version (`?v=AAAAMMJJx`). Changez-le dans toutes les pages HTML (six pages, y compris `diagnostic.html` et `espace.html`, qui versionnent aussi leurs scripts) à chaque modification de ces fichiers : sinon, les visiteurs peuvent voir le nouveau HTML avec l’ancien CSS.

## Modifier la charte

Toutes les valeurs sont des variables CSS du bloc `:root`, au début de `assets/css/styles.css`.

| Variable | Rôle | Valeur |
|---|---|---|
| `--color-ink` | encre, texte | `#1E2B2F` |
| `--color-paper` | papier, fond | `#F7F4EE` |
| `--color-teal` | vert sarcelle, couleur principale | `#0F7C72` |
| `--color-teal-strong` | sarcelle pour les textes et les survols | `#0B6159` |
| `--color-orange` | orange, **réservé au Board** | `#B94A1C` |
| `--tile-*` | couleurs des pièces au repos, au survol et filtrées | |
| `--font-display` / `--font-body` | titres / texte courant | Bricolage Grotesque / Instrument Sans |
| `--fs-*`, `--space-*` | tailles de texte et espacements | valeurs fluides (`clamp`) |
| `--puzzle-size` | largeur maximale du puzzle | `44rem` |

**Contrastes (WCAG AA).** L’orange de départ `#C4501F` n’atteignait que 4,24:1 avec un texte clair. Il a été foncé en `#B94A1C` (4,71:1). Toutes les associations texte/fond sont au-dessus de 4,5:1.

**Polices.** Bricolage Grotesque (titres) et Instrument Sans (texte) sont des polices libres (SIL Open Font License 1.1), déclarées en `@font-face` en tête de `styles.css`.

**Logo.** La marque est une grille 3×3 dont la pièce centrale orange, à quatre tenons, est le Board. Elle existe sous plusieurs formes :
- le symbole `#logo-mark` du sprite SVG de chaque page ;
- `logo.svg` ;
- `favicon.svg` et `apple-touch-icon.png` ;
- `og-image.png`, que vous pouvez remplacer au même nom et au format 1200 × 630.

## Mise en ligne (GitHub Pages, domaine chez OVH)

Le site est publié par **GitHub Pages** directement depuis la branche `main`, à la racine du dépôt (*Settings › Pages › Source : Deploy from a branch*). Il n’y a ni build ni workflow : **chaque push sur `main` met le site à jour en ligne** en une à deux minutes.

- **Domaine.** Le fichier `CNAME` contient `les-employeurs.fr`. Chez OVH (zone DNS du domaine), il faut :
  - quatre enregistrements `A` vers `185.199.108.153`, `185.199.109.153`, `185.199.110.153` et `185.199.111.153` ;
  - un `CNAME` `www` vers `aceosolo.github.io`.
- **HTTPS.** Dès que GitHub a émis le certificat, cochez **Enforce HTTPS** dans *Settings › Pages*. Au 23/10/2026, l’option n’était pas encore activée.
- **Page 404.** GitHub Pages sert `404.html` pour toute adresse inconnue. Un petit script de cette page corrige les chemins, quelle que soit la profondeur de l’adresse.
- **Fichiers publics.** Avec ce mode de publication, tout le dépôt est servi, README compris. C’est sans conséquence : le dépôt est déjà public.

## Placeholders restants

Aucun. La prise de rendez-vous pointe vers `https://cal.com/jbarret/15min` (13 liens dans `index.html`), le lien déjà utilisé sur iatop.eu. Cal.com est déclaré comme sous-traitant dans `confidentialite.html`.

Pour vérifier : `grep -rn "\[[A-Z_]*\]" --include=*.html .`

Toutes les autres informations sont renseignées. Sources :
- **LOGISTEM 2.0** : API Sirene, BODACC et Société.com, le 23/10/2026.
- **GitHub (hébergeur)** : l’adresse vient de sa politique de confidentialité officielle. GitHub ne publie aucun numéro de téléphone. Le +1 877 448 4820 indiqué dans les mentions légales est son ancien numéro commercial, relevé sur un annuaire tiers : c’est l’usage courant pour les sites hébergés sur GitHub Pages, mais il n’est pas confirmé par GitHub.

## Obligations légales

| Élément | Statut | Où |
|---|---|---|
| Mentions légales (art. 1-1 LCEN, depuis la loi SREN de 2024) | obligatoires, en place | `mentions-legales.html` |
| Politique de confidentialité (RGPD, art. 13) | obligatoire dès qu’on reçoit des données (comptes, diagnostics, emails, rendez-vous), en place | `confidentialite.html` |
| Consentement à la création du compte | case à cocher obligatoire, base légale des diagnostics | `assets/js/auth-ui.js` |
| Droit à l’effacement | en libre-service dans l’espace (diagnostics, compte) | `espace.html` |
| Durée de conservation | comptes inactifs 3 ans : purge automatique par l’API | `serveur/api/lib.php` |
| Bandeau cookies | **non nécessaire** : aucun traceur ; la session de l’espace est strictement nécessaire. À revoir si vous ajoutez une mesure d’audience ou intégrez l’agenda dans la page (iframe) | |
| CGV | **non obligatoires en B2B** et pas à publier. Si vous en avez, vous devez les communiquer à tout client professionnel qui les demande (art. L441-1 du Code de commerce) | |
| CGU | non obligatoires pour un site vitrine | |
| Médiateur de la consommation | uniquement en B2C, non concerné | |
| Accessibilité (RGAA, European Accessibility Act) | non applicables à un site vitrine B2B sans vente en ligne. Le site vise tout de même le niveau AA | |

## Référencement (SEO)

**Mots-clés travaillés.** Le choix est fait sur l’intention de recherche. Faute de crédits API sur le compte Semrush, aucun volume n’a pu être vérifié.

- **Principal** : *fonctions supports externalisées*, ciblé dans le `title`, le H1, le H2 du puzzle, la FAQ et le JSON-LD.
- **Secondaires**, un par fiche via le titre et le sous-titre `.fn-seo` : *RH externalisées*, *Board externalisé*, *gestion financière externalisée*, *DUERP / prévention des risques*, *démarche RSE / QVCT*, *achats externalisés*, *conseil en stratégie pour dirigeants*, *développement commercial*, *transformation digitale*.
- **Confiance** : la section « Qui sommes-nous » et le fondateur déclaré dans le JSON-LD (avec son profil LinkedIn) renforcent l’expertise perçue par les moteurs. Le cas client ajoute un exemple concret.
- **Local** : l’adresse de Saint-Quentin-Fallavier (Nord-Isère) figure dans le JSON-LD.

## Pistes d’amélioration

**Déjà fait** : mise en ligne sur GitHub Pages avec le domaine OVH, section « Qui sommes-nous », cas client.

**Plus tard**, selon vos réponses du 23/10/2026 :

1. **Agenda en lien sortant** (fait : Cal.com). Gardez-le en lien sortant : intégré dans la page, il déposerait des cookies et imposerait un bandeau.
2. **Adresse email au nom du domaine** (`contact@les-employeurs.fr`), avec SPF, DKIM et DMARC. OVH les configure depuis l’espace client si le domaine y est.
3. **Google Search Console** : validation par DNS et soumission de `sitemap.xml`.
4. **Repères de prix**, quand vous serez prêts : mode d’intervention ou fourchette, et une question dans la FAQ.
5. **Zone d’intervention et Google Business Profile** (Saint-Quentin-Fallavier).
6. **Ensuite** :
   - vérifier les mots-clés avec de vrais volumes ;
   - créer une page LinkedIn entreprise, à ajouter en `sameAs` dans le JSON-LD ;
   - vérifier la marque à l’INPI ;
   - formaliser avec les partenaires l’usage de leur nom ;
   - une page par fonction à terme.
7. **Activer Enforce HTTPS** dans *Settings › Pages* dès que le certificat est disponible.

## À valider

- **« Qui sommes-nous ».** Les « 30 ans de terrain » et la citation viennent de la page auteurs de secutop.fr, comme la photo. Sont à confirmer :
  - le titre « Fondateur des Employeurs » ;
  - « a créé et dirige plusieurs entreprises » (LOGISTEM 2.0 et Secutop) ;
  - les paragraphes sur son quotidien de dirigeant et la genèse des Employeurs.
- **Répartition des pièces par cycle**, marquée « À VALIDER » dans le brief.
- **Textes rédigés** : fiches, Board, « Travailler ensemble », FAQ, contact.
- **Politique de confidentialité** : durées de conservation (alignées sur la CNIL), bases légales, sous-traitants.
- **Logo** : version « clé de voûte », provisoire.

## Vérifications effectuées (23 octobre 2026)

Site servi en local et piloté dans Chrome (Puppeteer) : 68 contrôles, tous réussis.

- **Affichage** à 360, 768 et 1280 px (et vérification visuelle à 900 et 1100 px) : pas de défilement horizontal, texte contenu dans le cœur de chaque pièce.
- **Puzzle** : numérotation en horloge (01 à midi, 08 en haut à gauche), formes dans leur case, ordre de tabulation et fiches dans l’ordre 01 → 09.
- **Nouvelles sections** : cas client et « Qui sommes-nous » en place, sans aucune mention santé-sécurité dans le portrait. Photo chargée (WebP), menu actif correct, y compris en haut de page.
- **Tracés « feutre »** : les 22 tracés sont cachés au chargement et tous dessinés après défilement. Ils sont visibles d’emblée sans JavaScript. Ils ne créent aucun défilement horizontal, même sur mobile.
- **Réseau** : aucune erreur, aucune ressource en échec, aucune requête externe. Les polices auto-hébergées sont chargées.
- **Clavier et souris** : focus visible partout, Entrée sur une pièce mène à sa fiche, la zone cliquable suit la vraie forme des pièces.
- **Dégradés** : sans JavaScript et avec `prefers-reduced-motion`, contenu complet et puzzle assemblé.
- **Pages secondaires** : mentions légales, confidentialité et 404 vérifiées. HTML validé avec html-validate.
