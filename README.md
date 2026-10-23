# Les Employeurs · site one-page

Site vitrine de **Les Employeurs** : 9 fonctions supports représentées comme les 9 pièces d’un puzzle, avec le **Board externalisé** en pièce centrale.

- 100 % statique : HTML, CSS et JavaScript écrits à la main, **sans dépendance ni étape de build**. Astro et Tailwind étaient autorisés mais n’apportaient rien ici : sans build, l’arborescence demandée est respectée telle quelle et les chemins restent relatifs partout.
- **Aucune ressource externe** au chargement (ni CDN, ni police distante, ni script tiers, ni iframe), **aucun cookie, aucun traceur**.
- Les chemins sont relatifs : le site fonctionne à la racine d’un domaine (`https://les-employeurs.fr/`) comme dans un sous-dossier (`https://aceosolo.github.io/les-employeurs/`).

## Arborescence

```
index.html                 page unique (tout le contenu est dans le HTML)
mentions-legales.html
404.html
robots.txt
sitemap.xml
.nojekyll
assets/css/styles.css      styles ; la charte est en tête de fichier
assets/js/main.js          enrichissements uniquement (le site reste lisible sans JS)
assets/img/logo.svg        logo provisoire (grille 3×3, case centrale orange)
assets/img/favicon.svg
.github/workflows/deploy.yml   publication automatique sur GitHub Pages
```

## Tester en local

```bash
python -m http.server 8000
```

Puis ouvrir <http://localhost:8000/>. Sous macOS ou Linux, la commande peut s’appeler `python3`.

## Modifier les textes

Tout le contenu est dans `index.html`, découpé par des commentaires : `<!-- ============ 1. Hero ============ -->`, `2. Le puzzle`, `3. Le Board externalisé`, `4. Une pièce ou tout le puzzle`, `5. Contact`.

### Une pièce du puzzle

Chaque pièce apparaît à deux endroits :

1. **Le bouton** `id="piece-…"` (dans `<ul class="puzzle">`) :
   - `.piece-label` : libellé complet (écran ≥ 640 px) ;
   - `.piece-label-short` : libellé court (mobile) ;
   - `data-short` : libellé court, repris dans le message annoncé quand on filtre par cycle ;
   - `data-cycles` : les cycles où la pièce est mobilisée (voir ci-dessous).
2. **Le panneau de détail** `<dialog id="fonction-…">` (dans `<div class="piece-details">`) : titre, description, 3 missions, partenaire éventuel, cycles concernés, bouton de rendez-vous.

Identifiants des pièces : `qvct`, `strategie`, `rh`, `achats`, `board`, `sante`, `digital`, `commerce`, `finance`.

Ne modifiez pas les attributs `d="…"` des tracés SVG : ce sont les formes des pièces, calculées pour s’emboîter exactement.

### Les cycles

La correspondance cycle → pièces est écrite à **trois endroits**, à garder cohérents :

1. `data-cycles="…"` sur chaque bouton de pièce (valeurs : `creation`, `lancement`, `croissance`, `structuration`, `transmission`, séparées par des espaces) : c’est ce qui pilote la mise en avant ;
2. le texte de la frise (`<span class="cycle-pieces">`) ;
3. la liste « Cycles concernés » de chaque panneau (`<ul class="tags">`).

### Autres contenus

- Mentions légales : `mentions-legales.html`.
- Référencement : `<title>`, `meta description`, balises Open Graph et données structurées JSON-LD (`ProfessionalService`) en tête de `index.html`.
- L’année du copyright est écrite en dur dans les pieds de page (`© 2026`).

## Modifier la charte

Toutes les valeurs sont des variables CSS déclarées dans le bloc `:root` au début de `assets/css/styles.css`. Changer une valeur suffit pour tout le site.

| Variable | Rôle | Valeur |
|---|---|---|
| `--color-ink` | encre, texte | `#1E2B2F` |
| `--color-paper` | papier, fond | `#F7F4EE` |
| `--color-teal` | vert sarcelle, couleur principale | `#0F7C72` |
| `--color-teal-strong` | sarcelle pour les textes et les survols | `#0B6159` |
| `--color-orange` | orange, **réservé au Board** | `#B94A1C` |
| `--piece-*` | couleur de chacune des 9 pièces | déclinaisons du sarcelle, orange au centre |
| `--font-serif` / `--font-sans` | titres / texte courant | piles de polices système |
| `--fs-*`, `--space-*` | tailles de texte et espacements | valeurs fluides (`clamp`) |
| `--puzzle-size` | largeur maximale du puzzle | `40rem` |

**Contrastes (WCAG AA).** L’orange de départ `#C4501F` n’atteignait que 4,24:1 avec un texte clair. Il a été foncé en `#B94A1C` (4,71:1). Toutes les associations texte/fond du site sont au-dessus de 4,5:1. Si vous changez une couleur, vérifiez le contraste de nouveau.

**Polices personnalisées.** Le dossier `assets/fonts/` n’existe pas, le site utilise donc des piles de polices système. Pour une police à vous, déposez les fichiers `.woff2` dans `assets/fonts/`, puis ajoutez en tête de `styles.css` :

```css
@font-face {
  font-family: "MaPolice";
  src: url("../fonts/ma-police.woff2") format("woff2");
  font-weight: 400 700;
  font-display: swap;
}
```

Placez ensuite `"MaPolice"` en premier dans `--font-serif` ou `--font-sans`.

**Logo.** Le logo provisoire est dans `assets/img/logo.svg` et `assets/img/favicon.svg`. La grille du logo est aussi intégrée directement (SVG en ligne) dans les en-têtes et pieds de page de `index.html`, `mentions-legales.html` et `404.html` : pensez à la remplacer à ces endroits aussi.

## Publier sur GitHub Pages

Le dépôt est `github.com/AceOSolo/les-employeurs`.

1. Poussez le contenu sur la branche `main`.
2. Sur GitHub : **Settings › Pages › Build and deployment › Source : « GitHub Actions »**.
3. Le workflow `.github/workflows/deploy.yml` se lance à chaque push sur `main` (ou à la main, onglet **Actions › Déployer sur GitHub Pages › Run workflow**). Il ne publie que les fichiers du site : le README et le workflow ne sont pas mis en ligne.
4. Le site est alors en ligne sur `https://aceosolo.github.io/les-employeurs/`.

**Nom de domaine `les-employeurs.fr`.**

1. Dans **Settings › Pages › Custom domain**, saisissez `les-employeurs.fr`.
2. Chez le registraire du domaine, créez les enregistrements DNS indiqués par la documentation GitHub (« Managing a custom domain for your GitHub Pages site ») :
   - quatre enregistrements `A` vers `185.199.108.153`, `185.199.109.153`, `185.199.110.153` et `185.199.111.153` ;
   - un `CNAME` `www` vers `aceosolo.github.io`.
3. Une fois le domaine vérifié, cochez **Enforce HTTPS**.

**Sans GitHub Actions.** Vous pouvez aussi choisir **Source : « Deploy from a branch »**, branche `main`, dossier `/ (root)`. Le fichier `.nojekyll` évite alors tout traitement Jekyll.

**À savoir.**

- Les balises `canonical` et `og:url`, l’image Open Graph, le JSON-LD, `sitemap.xml` et `robots.txt` pointent déjà vers `https://les-employeurs.fr/`. C’est voulu : ce sont des métadonnées, pas des ressources chargées.
- `404.html` : GitHub Pages sert cette page pour toute adresse inconnue, quelle que soit sa profondeur. Un petit script en tête de page corrige la base des chemins relatifs : `/les-employeurs/` sur `*.github.io`, la racine sur `les-employeurs.fr`.

## Placeholders restants

Les variables laissées vides dans le brief apparaissent entre crochets, visibles sur le site. Faites un rechercher-remplacer sur tout le projet. Pour les lister :

```bash
grep -rn "\[[A-Z_]*\]" --include=*.html .
```

| Placeholder | Où | Remarque |
|---|---|---|
| `[URL_RDV]` | `index.html` (13 occurrences : en-tête, hero, 9 panneaux, Board, contact) | lien de prise de rendez-vous, ouvert dans un nouvel onglet |
| `[EMAIL]` | `index.html` (contact, JSON-LD), `mentions-legales.html` | remplacer aussi dans `mailto:[EMAIL]` |
| `[TELEPHONE]` | `index.html` (contact, JSON-LD), `mentions-legales.html` | dans `href="tel:…"`, utiliser le format international sans espaces (`tel:+33…`) ; ailleurs, le format d’affichage |
| `[ADRESSE]` | `mentions-legales.html`, JSON-LD de `index.html` | siège social |
| `[RAISON_SOCIALE]` | `mentions-legales.html` (2 occurrences) | |
| `[FORME_JURIDIQUE]` | `mentions-legales.html` | |
| `[CAPITAL]` | `mentions-legales.html` | |
| `[SIRET]` | `mentions-legales.html` | |
| `[DIRECTEUR_PUBLICATION]` | `mentions-legales.html` | |

**Fichier à fournir :** `assets/img/og-image.png`, l’image de partage sur les réseaux sociaux (1200 × 630 px conseillé). Elle est déjà référencée dans `index.html`.

## À valider

- **Répartition des pièces par cycle**, marquée « À VALIDER » dans le brief. Elle est reprise telle quelle.
- **Textes rédigés** à partir des bases du brief : descriptions et missions des 9 pièces, section Board (une ligne par expertise, les 3 étapes « Comment ça se passe »), les trois manières de travailler ensemble, paragraphe « Données personnelles » des mentions légales.
- **Logo provisoire.**
- **Partenaires** cités par leur seul nom, sans logo : Gingerence (QVCT & RSE), Secutop (Santé Sécurité), Sinolx (Informatique & Digital).

Conformément au brief, le site ne contient ni chiffre, ni témoignage, ni logo client, ni certification, ni référence inventés.

## Fonctionnement et accessibilité

- **Puzzle** : chaque pièce est un `<button>` qui ouvre son panneau `<dialog>` natif, avec les attributs `commandfor` / `command="show-modal"`. `main.js` prend le relais sur les navigateurs qui ne les gèrent pas. La zone cliquable suit la vraie forme de la pièce, tenons compris. Le panneau se ferme avec Échap, le bouton Fermer ou un clic sur le fond, et le focus revient sur la pièce.
- **Mobile (< 640 px)** : le puzzle reste en 3×3, avec icône et libellé court. Le panneau s’ouvre en plein écran.
- **Sans JavaScript** : le puzzle s’affiche assemblé, les 9 panneaux s’affichent sous forme de fiches sous le puzzle, la navigation reste visible.
- **`prefers-reduced-motion`** : le puzzle s’affiche directement assemblé, sans aucune animation.
- Un seul `h1`, HTML sémantique, lien d’évitement, focus visible partout (anneau en forme de pièce sur le puzzle), messages annoncés aux lecteurs d’écran lors du filtrage par cycle.

## Vérifications effectuées (23 octobre 2026)

Site servi en local et piloté dans Chrome (Puppeteer), à la racine et dans un sous-dossier `/les-employeurs/` :

- affichage à 360, 768 et 1280 px : pas de défilement horizontal, libellés courts sous 640 px, texte contenu dans le cœur de chaque pièce ;
- aucune erreur console, aucune ressource en échec, **aucune requête externe** ;
- clavier : 29 arrêts dans l’ordre logique, focus visible sur chacun ; les 9 panneaux s’ouvrent avec Entrée et se ferment avec Échap, le focus revient sur la pièce ;
- souris : un clic sur un tenon ouvre bien la pièce à laquelle il appartient ;
- les 5 cycles mettent en avant les bonnes pièces ; « Tous les cycles » et un second clic réinitialisent ;
- sans JavaScript et avec `prefers-reduced-motion` : contenu complet et puzzle assemblé ;
- page 404 testée en profondeur, en simulant GitHub Pages ;
- recherche d’URL externes dans le code : seuls subsistent les métadonnées vers `les-employeurs.fr`, les espaces de noms (`schema.org`, `sitemaps.org`, `w3.org/2000/svg`) et les liens cliquables de rendez-vous, `mailto:` et `tel:`.
