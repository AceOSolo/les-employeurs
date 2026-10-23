# Les Employeurs · site one-page

Site vitrine de **Les Employeurs** (édité par LOGISTEM 2.0) : 9 fonctions supports représentées comme les 9 pièces d’un puzzle, avec le **Board externalisé** en pièce centrale.

- 100 % statique : HTML, CSS et JavaScript écrits à la main, **sans dépendance ni étape de build**.
- **Aucune ressource externe** au chargement. Les polices, les icônes et les illustrations sont servies depuis le dépôt.
- **Aucun cookie, aucun traceur.** Aucun bandeau de consentement n’est donc nécessaire.
- Chemins relatifs : le site fonctionne à la racine d’un domaine (`https://les-employeurs.fr/`) comme dans un sous-dossier (`https://aceosolo.github.io/les-employeurs/`).

## Arborescence

```
index.html                 page unique (tout le contenu est dans le HTML)
mentions-legales.html
confidentialite.html       politique de confidentialité (RGPD)
404.html
robots.txt, sitemap.xml, .nojekyll
assets/css/styles.css      styles ; la charte est en tête de fichier
assets/js/main.js          enrichissements uniquement (le site reste complet sans JS)
assets/fonts/              Bricolage Grotesque et Instrument Sans (.woff2) et leurs licences
assets/img/logo.svg        logo autonome, texte vectorisé (pour les usages hors site)
assets/img/favicon.svg     icône d’onglet
assets/img/apple-touch-icon.png   icône d’écran d’accueil (iPhone, iPad)
assets/img/og-image.png    image de partage (LinkedIn, WhatsApp, Slack…), 1200 × 630
.github/workflows/deploy.yml   publication automatique sur GitHub Pages
```

## Tester en local

```bash
python -m http.server 8000
```

Puis ouvrir <http://localhost:8000/>. Sous macOS ou Linux, la commande peut s’appeler `python3`.

## Structure de la page

1. **Hero.** Le H1 contient les mots-clés (« Fonctions supports externalisées pour les dirigeants de TPE et PME ») et le slogan « Tout pour entreprendre. ».
2. **Les 9 fonctions** (`#fonctions`) :
   - la frise des 5 cycles ;
   - le puzzle : chaque pièce est un lien vers sa fiche ;
   - les **9 fiches détaillées**, visibles et indexables, avec un sommaire et un mini-puzzle qui suivent la lecture sur grand écran.
3. **Le Board externalisé** (`#board`).
4. **Travailler ensemble** (`#travailler-ensemble`) : une fonction, plusieurs ou toutes.
5. **FAQ** (`#faq`) : 6 questions en `<details>` natifs.
6. **Contact** (`#contact`) : « Quelle pièce vous manque ? », rendez-vous, email, téléphone.
7. **Pied de page** : liens vers les 9 fonctions, les sections, le contact, les partenaires et les pages légales.

## Le puzzle et sa numérotation en escargot

Les pièces sont numérotées **en escargot**, dans le sens des aiguilles d’une montre depuis le coin haut gauche. Le Board, au centre, ferme la boucle en 09 :

```
01 QVCT & RSE            02 Direction & Stratégie   03 Ressources Humaines
08 Achat & Fournisseurs  09 Board externalisé       04 Santé Sécurité
07 Informatique & Digital 06 Commerce & Marketing   05 Finance & Gestion
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

Les formes des pièces sont définies **une seule fois**, dans le sprite SVG en haut de `index.html` (`<path id="pz-…">`). Elles sont réutilisées partout via `<use>`. Ne modifiez pas leurs attributs `d="…"` : ce sont des arcs de cercle calculés pour que tenons et mortaises s’emboîtent avec un joint constant.

### Les cycles

La correspondance cycle → pièces est écrite à **trois endroits**, à garder cohérents :

1. `data-cycles` sur chaque pièce. Valeurs : `creation`, `lancement`, `croissance`, `structuration`, `transmission`.
2. Le texte de la frise (`.cycle-pieces`).
3. Les étiquettes « Cycles concernés » de chaque fiche.

### Partenaires

- **Secutop** (Santé Sécurité) : lien vers <https://www.secutop.fr/> dans sa fiche et dans le pied de page.
- **Gingerence** (QVCT & RSE) et **Sinolx** (Informatique & Digital) : affichés sans lien. Aucun site n’a été trouvé en ligne. Pour ajouter un lien, reprenez le balisage du lien Secutop dans la fiche (`.fn-partner`) et dans le pied de page (`.footer-partners`).

### Autres contenus

- Pages légales : `mentions-legales.html` et `confidentialite.html`.
- Référencement : `<title>`, `meta description`, Open Graph et JSON-LD (`ProfessionalService`, avec raison sociale, TVA et adresse) en tête de `index.html`.
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

**Polices.** Bricolage Grotesque (titres) et Instrument Sans (texte) sont des polices libres (SIL Open Font License 1.1). Elles sont déclarées en `@font-face` en tête de `styles.css`.

**Logo.** La marque est une grille 3×3 dont la pièce centrale orange, à quatre tenons, est le Board. Elle existe sous plusieurs formes :
- le symbole `#logo-mark` du sprite SVG de chaque page : en-têtes et pied de page, couleur pilotée par CSS ;
- `assets/img/logo.svg` : marque et texte vectorisé ;
- `favicon.svg` et `apple-touch-icon.png` : icônes ;
- `og-image.png` : image de partage. Vous pouvez la remplacer par un visuel de votre choix, au même nom et au format 1200 × 630.

## Publier sur GitHub Pages

Le dépôt est `github.com/AceOSolo/les-employeurs`.

1. Sur GitHub : **Settings › Pages › Build and deployment › Source : « GitHub Actions »**. Tant que ce réglage n’est pas fait, le workflow échoue à l’étape « Configurer GitHub Pages ».
2. Poussez sur `main`, ou relancez le dernier run dans l’onglet **Actions**. Le workflow publie uniquement les fichiers du site : le README et le workflow ne sont pas mis en ligne.
3. Le site est en ligne sur `https://aceosolo.github.io/les-employeurs/`.

**Nom de domaine `les-employeurs.fr`.**

1. **Settings › Pages › Custom domain** : saisissez `les-employeurs.fr`.
2. Chez le registraire, créez les enregistrements DNS indiqués par la documentation GitHub (« Managing a custom domain for your GitHub Pages site ») :
   - quatre `A` vers `185.199.108.153`, `185.199.109.153`, `185.199.110.153` et `185.199.111.153` ;
   - un `CNAME` `www` vers `aceosolo.github.io`.
3. Cochez **Enforce HTTPS** une fois le domaine vérifié.

**À savoir.** `canonical`, `og:url`, l’image Open Graph, le JSON-LD, `sitemap.xml` et `robots.txt` pointent déjà vers `https://les-employeurs.fr/`.

## Placeholders restants

Faites un rechercher-remplacer sur tout le projet. Pour les lister :

```bash
grep -rn "\[[A-Z_]*\]" --include=*.html .
```

| Placeholder | Où | Remarque |
|---|---|---|
| `[URL_RDV]` | `index.html` (13 occurrences) | lien de l’outil de prise de rendez-vous, ouvert dans un nouvel onglet |
| `[OUTIL_RDV]` | `confidentialite.html` | nom de cet outil, déclaré comme sous-traitant |
| `[TELEPHONE_HEBERGEUR]` | `mentions-legales.html` | GitHub ne publie aucun numéro officiel. Seul numéro trouvé : +1 877 448 4820, sur un annuaire tiers, non vérifié (voir « Pistes d’amélioration ») |

Toutes les autres informations sont renseignées. Les données légales de LOGISTEM 2.0 ont été recoupées sur l’API Sirene, le BODACC et Société.com le 23/10/2026.

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
- **Cible** : *dirigeants de TPE et PME*.

## Pistes d’amélioration

Classées par priorité.

**Avant la mise en ligne**

1. **Agenda en lien sortant.** Choisissez l’outil de rendez-vous, puis remplacez `[URL_RDV]` et `[OUTIL_RDV]`. Gardez-le en lien sortant : un agenda intégré dans la page (iframe) déposerait des cookies et imposerait un bandeau.
2. **Adresse email au nom du domaine.** Préférez une adresse en `@les-employeurs.fr` (par exemple `contact@`) à l’adresse `@logistem.fr` : cohérence de marque, et vous pourrez changer de destinataire sans toucher au site. Configurez SPF, DKIM et DMARC pour éviter les spams. Un email et un mobile publiés en clair attirent aussi le démarchage : une ligne dédiée peut valoir le coup.
3. **Google Search Console.** Validez le domaine par un enregistrement DNS (aucun script sur le site) et soumettez `sitemap.xml`. C’est gratuit, sans cookie, et c’est la seule façon de voir sur quelles recherches vous apparaissez.
4. **Hébergeur.** GitHub ne publie aucun numéro de téléphone. Sa documentation (« GitHub Pages limits ») précise aussi que Pages n’est pas destiné à servir d’hébergement gratuit pour faire tourner une activité en ligne (« online business »), une boutique ou un site dont l’objet principal est de faciliter des transactions commerciales. Un site vitrine de société se situe dans une zone grise. Un hébergeur français de site statique réglerait d’un coup le téléphone manquant et le transfert de données hors UE de la politique de confidentialité. Les fichiers sont prêts à être déposés n’importe où.

**Crédibilité et conversion**

5. **Mettre des visages.** Ajoutez une section « Qui sommes-nous » : Jean-Philippe Barret et les experts du Board, avec photo, parcours et lien LinkedIn. En conseil B2B, on achète d’abord des personnes. C’est le levier de conversion le plus fort qui manque aujourd’hui.
6. **Preuves réelles.** Ajoutez deux ou trois témoignages ou cas concrets, idéalement un par cycle, avec l’accord des clients, et les logos des partenaires s’ils l’autorisent.
7. **Repères de prix.** Indiquez le mode d’intervention (forfait, jours, abonnement) ou au moins une fourchette, et ajoutez une question « Combien ça coûte ? » à la FAQ. Sans repère, beaucoup de dirigeants n’osent pas prendre rendez-vous.
8. **Zone d’intervention.** Précisez-la : Nord-Isère, Lyon, Auvergne-Rhône-Alpes, France entière, à distance ? Pour une TPE ou une PME, c’est le levier SEO le plus rentable. Ajoutez une fiche Google Business Profile au siège de Culin.

**Ensuite**

9. Valider les mots-clés avec de vrais volumes (Semrush rechargé, ou Search Console après 4 à 6 semaines). À terme, créer une page par fonction.
10. Créer une page LinkedIn entreprise et l’ajouter en `sameAs` dans le JSON-LD.
11. **Mesure d’audience.** Si vous en voulez une, choisissez un outil configuré selon l’exemption CNIL (sans consentement), et mettez à jour la politique de confidentialité.
12. **Marque et partenaires.** Vérifiez la disponibilité de « Les Employeurs » à l’INPI avant d’investir dans la marque. Formalisez avec les partenaires l’usage de leur nom et, le cas échéant, le partage de données clients (à ajouter alors aux destinataires dans la politique de confidentialité).

## À valider

- **Répartition des pièces par cycle**, marquée « À VALIDER » dans le brief, reprise telle quelle.
- **Textes rédigés** : fiches, Board, « Travailler ensemble », FAQ, contact.
- **Politique de confidentialité** : durées de conservation (alignées sur la CNIL), bases légales, sous-traitants.
- **Logo** : version « clé de voûte », provisoire.

Conformément au brief, le site ne contient ni chiffre, ni témoignage, ni logo client, ni certification, ni référence inventés.

## Vérifications effectuées (23 octobre 2026)

Site servi en local et piloté dans Chrome (Puppeteer) : 64 contrôles, tous réussis.

- **Affichage** à 360, 768 et 1280 px : pas de défilement horizontal, texte contenu dans le cœur de chaque pièce.
- **Puzzle** : numérotation en escargot, formes dans leur case, ordre de tabulation et fiches dans l’ordre 01 → 09.
- **Réseau** : aucune erreur, aucune ressource en échec, aucune requête externe. Les polices auto-hébergées sont chargées.
- **Clavier et souris** : focus visible partout, Entrée sur une pièce mène à sa fiche, la zone cliquable suit la vraie forme des pièces.
- **Filtre** : les 5 cycles mettent en avant les bonnes pièces.
- **Fiches** : le sommaire suit la lecture, la FAQ s’ouvre et se ferme.
- **Dégradés** : sans JavaScript et avec `prefers-reduced-motion`, contenu complet et puzzle assemblé.
- **Pages secondaires** : mentions légales, confidentialité et 404 vérifiées. HTML validé avec html-validate.
