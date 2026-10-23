# Les Employeurs · site one-page

Site vitrine de **Les Employeurs** (édité par LOGISTEM 2.0) : 9 fonctions supports représentées comme les 9 pièces d’un puzzle, avec le **Board externalisé** en pièce centrale. Hébergement : **OVH**.

- 100 % statique : HTML, CSS et JavaScript écrits à la main, **sans dépendance ni étape de build**.
- **Aucune ressource externe** au chargement. Les polices, les icônes, les illustrations et la photo sont servies depuis le site.
- **Aucun cookie, aucun traceur.** Aucun bandeau de consentement n’est donc nécessaire.
- Chemins relatifs : le site fonctionne à la racine d’un domaine comme dans un sous-dossier.

## Arborescence

```
index.html                 page unique (tout le contenu est dans le HTML)
mentions-legales.html
confidentialite.html       politique de confidentialité (RGPD)
404.html
robots.txt, sitemap.xml
.htaccess                  configuration du serveur OVH (404, cache, compression, sécurité, HTTPS)
assets/css/styles.css      styles ; la charte est en tête de fichier
assets/js/main.js          enrichissements uniquement (le site reste complet sans JS)
assets/fonts/              Bricolage Grotesque et Instrument Sans (.woff2) et leurs licences
assets/img/logo.svg        logo autonome, texte vectorisé (pour les usages hors site)
assets/img/favicon.svg, apple-touch-icon.png   icônes
assets/img/og-image.png    image de partage (LinkedIn, WhatsApp, Slack…), 1200 × 630
assets/img/jean-philippe-barret.jpg / .webp    portrait de la section « Qui sommes-nous »
.nojekyll, .github/workflows/deploy.yml        aperçu optionnel sur GitHub Pages
```

## Tester en local

```bash
python -m http.server 8000
```

Puis ouvrir <http://localhost:8000/>. Sous macOS ou Linux, la commande peut s’appeler `python3`. Le serveur local ignore le `.htaccess` : la page 404 personnalisée ne s’y affiche pas, c’est normal.

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

Le menu compte 6 liens (Les 9 fonctions, Le Board, Cas client, Qui sommes-nous, FAQ, Contact). Il se replie en bouton « Menu » sous 1080 px de large. « Travailler ensemble » est accessible par le défilement et le pied de page.

## Le puzzle et sa numérotation en escargot

Les pièces sont numérotées **en escargot**, dans le sens des aiguilles d’une montre depuis le coin haut gauche. Le Board, au centre, ferme la boucle en 09 :

```
01 QVCT & RSE             02 Direction & Stratégie   03 Ressources Humaines
08 Achat & Fournisseurs   09 Board externalisé       04 Santé Sécurité
07 Informatique & Digital 06 Commerce & Marketing    05 Finance & Gestion
```

Les pièces sont écrites dans le HTML **dans cet ordre**, et la touche Tab suit donc l’escargot. Chaque `<li class="puzzle-slot">` est placé dans la grille par son `style="grid-area: ligne / colonne"`. L’animation d’entrée suit le même ordre, le Board en dernier. Sur chaque pièce, `--i` fixe le rang et `--sx` / `--sy` la direction d’arrivée.

Les fiches, le sommaire et le pied de page suivent le même ordre.

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
- **Puzzle** (écrans ≥ 1240 px) : « cliquez sur une pièce », et la spirale de l’escargot.
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

## Mise en ligne chez OVH

1. **Certificat SSL.** Dans l’espace client OVH : *Web Cloud › Hébergements › votre hébergement › Multisite*. Vérifiez que `les-employeurs.fr` et `www.les-employeurs.fr` pointent vers le dossier `www` et que le **SSL** est activé (certificat Let’s Encrypt gratuit).
2. **Envoi des fichiers.** Par FTP, avec FileZilla et les identifiants de l’onglet *FTP - SSH* de l’hébergement. Déposez dans le dossier `www/` :
   - `index.html`, `mentions-legales.html`, `confidentialite.html`, `404.html` ;
   - `robots.txt`, `sitemap.xml`, `.htaccess` ;
   - le dossier `assets/` complet.

   N’envoyez pas `README.md`, `.github/`, `.git/` ni `.nojekyll`. Le `.htaccess` commence par un point : dans FileZilla, activez *Serveur › Forcer l’affichage des fichiers cachés* pour le voir.
3. **HTTPS.** Une fois le certificat actif, ouvrez `.htaccess` et retirez le `#` devant les 4 lignes du bloc « HTTPS et adresse unique ». Tout le trafic est alors redirigé vers `https://les-employeurs.fr/`, sans www. Testez `http://les-employeurs.fr` et `https://www.les-employeurs.fr` : les deux doivent aboutir sur `https://les-employeurs.fr/`.

**Ce que fait le `.htaccess`.**
- Il affiche `404.html` pour toute adresse inconnue. Un petit script de cette page corrige les chemins quelle que soit la profondeur de l’adresse.
- Il déclare les types de fichiers récents (`.woff2`, `.webp`).
- Il active la compression et le cache navigateur : HTML toujours frais, polices et images mises en cache.
- Il ajoute des en-têtes de sécurité (`nosniff`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`).

Chaque bloc optionnel est protégé par `<IfModule>`.

**Aperçu sur GitHub Pages (optionnel).** Le workflow `.github/workflows/deploy.yml` ne se lance plus automatiquement. Pour un aperçu sur `https://aceosolo.github.io/les-employeurs/`, activez *Settings › Pages › Source : GitHub Actions*, puis *Actions › Aperçu sur GitHub Pages › Run workflow*.

## Placeholders restants

| Placeholder | Où | Remarque |
|---|---|---|
| `[URL_RDV]` | `index.html` (13 occurrences) | lien de l’outil de prise de rendez-vous, ouvert dans un nouvel onglet |
| `[OUTIL_RDV]` | `confidentialite.html` | nom de cet outil, déclaré comme sous-traitant |

Pour les lister : `grep -rn "\[[A-Z_]*\]" --include=*.html .`

Toutes les autres informations sont renseignées. Sources :
- **LOGISTEM 2.0** : API Sirene, BODACC et Société.com, le 23/10/2026.
- **OVH** : leurs mentions légales officielles pour l’identité et l’adresse. Le numéro 09 72 10 10 07 vient du forum communautaire officiel d’OVHcloud ; leur page de mentions légales n’en affiche aucun.

## Obligations légales

| Élément | Statut | Où |
|---|---|---|
| Mentions légales (art. 1-1 LCEN, depuis la loi SREN de 2024) | obligatoires, en place | `mentions-legales.html` |
| Politique de confidentialité (RGPD, art. 13) | obligatoire dès qu’on reçoit des données (emails, rendez-vous), en place | `confidentialite.html` |
| Bandeau cookies | **non nécessaire** : aucun cookie ni traceur. À revoir si vous ajoutez une mesure d’audience ou intégrez l’agenda dans la page (iframe) | |
| CGV | **non obligatoires en B2B** et pas à publier. Si vous en avez, vous devez les communiquer à tout client professionnel qui les demande (art. L441-1 du Code de commerce) | |
| CGU | non obligatoires pour un site vitrine | |
| Médiateur de la consommation | uniquement en B2C, non concerné | |
| Accessibilité (RGAA, European Accessibility Act) | non applicables à un site vitrine B2B sans vente en ligne. Le site vise tout de même le niveau AA | |

## Référencement (SEO)

**Mots-clés travaillés.** Le choix est fait sur l’intention de recherche. Faute de crédits API sur le compte Semrush, aucun volume n’a pu être vérifié.

- **Principal** : *fonctions supports externalisées*, ciblé dans le `title`, le H1, le H2 du puzzle, la FAQ et le JSON-LD.
- **Secondaires**, un par fiche via le titre et le sous-titre `.fn-seo` : *RH externalisées*, *Board externalisé*, *gestion financière externalisée*, *DUERP / prévention des risques*, *démarche RSE / QVCT*, *achats externalisés*, *conseil en stratégie pour dirigeants*, *développement commercial*, *transformation digitale*.
- **Confiance** : la section « Qui sommes-nous » et le fondateur déclaré dans le JSON-LD (avec son profil LinkedIn) renforcent l’expertise perçue par les moteurs. Le cas client ajoute un exemple concret.
- **Local** : le siège à Culin (Nord-Isère) est mentionné dans « Qui sommes-nous » et dans le JSON-LD.

## Pistes d’amélioration

**Déjà fait** : hébergement OVH, section « Qui sommes-nous », cas client.

**Plus tard**, selon vos réponses du 23/10/2026 :

1. **Agenda en lien sortant.** Choisissez l’outil, puis remplacez `[URL_RDV]` et `[OUTIL_RDV]`. Gardez-le en lien sortant : intégré dans la page, il déposerait des cookies et imposerait un bandeau.
2. **Adresse email au nom du domaine** (`contact@les-employeurs.fr`), avec SPF, DKIM et DMARC. OVH les configure depuis l’espace client si le domaine y est.
3. **Google Search Console** : validation par DNS et soumission de `sitemap.xml`.
4. **Repères de prix**, quand vous serez prêts : mode d’intervention ou fourchette, et une question dans la FAQ.
5. **Zone d’intervention et Google Business Profile** (siège de Culin).
6. **Ensuite** :
   - vérifier les mots-clés avec de vrais volumes ;
   - créer une page LinkedIn entreprise, à ajouter en `sameAs` dans le JSON-LD ;
   - vérifier la marque à l’INPI ;
   - formaliser avec les partenaires l’usage de leur nom ;
   - une page par fonction à terme.
7. **Sécurité avancée** : une fois le HTTPS forcé et stable, ajouter un en-tête HSTS dans `.htaccess`. Une politique CSP est aussi possible, mais demande de lister les scripts en ligne (voir le script de la balise `<head>`).

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
- **Puzzle** : numérotation en escargot, formes dans leur case, ordre de tabulation et fiches dans l’ordre 01 → 09.
- **Nouvelles sections** : cas client et « Qui sommes-nous » en place, sans aucune mention santé-sécurité dans le portrait. Photo chargée (WebP), menu actif correct, y compris en haut de page.
- **Tracés « feutre »** : les 22 tracés sont cachés au chargement et tous dessinés après défilement. Ils sont visibles d’emblée sans JavaScript. Ils ne créent aucun défilement horizontal, même sur mobile.
- **Réseau** : aucune erreur, aucune ressource en échec, aucune requête externe. Les polices auto-hébergées sont chargées.
- **Clavier et souris** : focus visible partout, Entrée sur une pièce mène à sa fiche, la zone cliquable suit la vraie forme des pièces.
- **Dégradés** : sans JavaScript et avec `prefers-reduced-motion`, contenu complet et puzzle assemblé.
- **Pages secondaires** : mentions légales, confidentialité et 404 vérifiées. HTML validé avec html-validate.
- **Non testé** : le `.htaccess` (pas d’Apache en local). Ses directives sont standard et protégées par `<IfModule>`, mais vérifiez le site juste après l’envoi sur OVH.
