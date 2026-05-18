# SVGs fournis

Fichiers SVG ajoutés (petits pictogrammes ludiques) :

- `assets/svg/heart.svg` — coeur enfantin, couleur rose
- `assets/svg/star.svg` — étoile jaune
- `assets/svg/sparkle.svg` — petite étincelle
- `assets/svg/necklace.svg` — icône collier
- `assets/svg/earring.svg` — icône boucle d'oreille
- `assets/svg/kid-badge.svg` — badge enfant "Petit Créateur"

# Photos / assets demandés (ce que vous devez fournir)

Fournissez les photos dans le dossier `assets/photos/` avec les noms ci-dessous.

- `product_<slug>_01.jpg` (ex: `product_tiges_01.jpg`) — photo produit principale, fond uni / blanc, 2000×2000 px idéal.
- `product_<slug>_02.jpg` — vue alternative / détail (macro), 1200×1200 px.
- `product_<slug>_pack.jpg` — photo du conditionnement (si utile), 1200×1200 px.
- `hero.jpg` — bannière site, 1600×600 px (centre le produit, assez d'espace gauche/droit).
- `logo.png` — logo transparent (idéal 1024×1024 px) ou SVG si disponible.

# Nommage & métadonnées

- Utilisez des slugs simples sans espaces (ex: `boucle-oreille-rose`).
- Fournissez pour chaque photo un petit fichier texte `product_<slug>_meta.txt` contenant : `title`, `alt`, `description`, `materials`.

# Recommandations pour traitement IA local

- Prétraitement : recadrage carré (1:1), suppression du fond si nécessaire, amélioration de la netteté.
- Versions à générer : `web` (1200px), `thumb` (400px) et `print` (3000px si possible).
- Conservez les originaux non modifiés dans `assets/photos/originals/`.

# Notes d'intégration

- J'intégrerai les images optimisées dans `assets/photos/` et mettrai à jour `boutique.html` pour afficher : vignette, galerie, et bouton « Expliquer ce prix » (ouvre `pedagogie.html`).
- Dites-moi quand vous m'envoyez les photos; je peux exécuter votre IA locale si vous me donnez la commande exacte à lancer ou je vous fournis une pipeline simple (préproc → amélioration → export).
