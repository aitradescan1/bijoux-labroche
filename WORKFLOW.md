# Labroche et Gobeil — Construit entièrement avec Claude Code

> **Aucune ligne de code n'a été écrite à la main.**
> Chaque fichier HTML, chaque fonction API, chaque script a été généré,
> corrigé et amélioré en conversation avec Claude Code.

**Site en production :** https://aitradescan1.github.io/bijoux-labroche/
**Dépôt GitHub :** https://github.com/aitradescan1/bijoux-labroche
**Durée totale :** 9 jours (17 au 26 mai 2026)
**Itérations :** 60+ commits, ~15 sessions de travail

---

## Le projet en chiffres

| Métrique | Valeur |
|---|---|
| Pages web publiques | 8 (accueil, boutique, pierre, histoire, pédagogie, géologie, commande, contact) |
| Endpoints API serverless | 12 (limite Vercel Hobby respectée) |
| Produits en base | 123 bijoux et accessoires |
| Lignes de code générées | ~6 000 |
| Lignes écrites par un humain | **0** |
| Coût infrastructure mensuel | 0 $ (GitHub Pages + Vercel Hobby + Supabase Free) |
| Paiements en production | PayPal Live — testé avec vrai argent |

---

## Le contexte

**Labroche et Gobeil** est une micro-entreprise de bijoux en pierres naturelles tenue par deux jeunes frères, Nathan et Lyam. Ils vendent dans des marchés locaux et voulaient une boutique en ligne avec :

- Une vitrine produits (photos + fiches détaillées)
- Une caisse mobile pour vendre en boutique (scan SKU → encaisser)
- Un système de commande en ligne avec PayPal
- Un panneau administrateur pour gérer le tout
- Un courriel automatique à chaque vente
- Un « passeport pierre » : le client scanne son QR code et apprend tout sur la pierre de son bijou

Le créateur du site (Michael, consultant) n'a **pas écrit une seule ligne de code**. Il a dirigé Claude Code en français, décrit ce qu'il voulait, corrigé les directions quand nécessaire, et laissé Claude faire.

---

## La démarche — Phase par phase

### Jour 1 — 17 mai : Infrastructure de zéro à live en un soir

**Ce qui a été fait :**
- Création du projet GitHub
- Choix de la stack (GitHub Pages + Vercel + Supabase)
- Schéma de base de données PostgreSQL (Supabase)
- Premier produit entré manuellement
- Déploiement Vercel avec CORS, variables d'environnement
- Page "bientôt disponible" en ligne

**Obstacles :** 3 itérations pour corriger la configuration Vercel (runtime Node.js, outputDirectory, CORS)

**Résultat :** API publique fonctionnelle à https://bijoux-labroche-aitradescan1s-projects.vercel.app

---

### Jours 2-3 — 18 mai : Commerce, emails, QR codes et admin

**Ce qui a été fait :**
- Pipeline email complet via Gmail SMTP (nodemailer) :
  - Email client à la création de commande
  - Email client à la confirmation de paiement
  - Email admin à chaque vente boutique ou en ligne
  - Email client quand le bijou est prêt
- Options de livraison Canada Post (lettre sans suivi 3,50 $, colis suivi 14,95 $)
- Rabais automatique de 5 $ pour les commandes ≥ 35 $
- Panneau administrateur protégé (Bearer token, comparaison timing-safe) :
  - Onglet Commandes
  - Onglet Inventaire avec +1/−1 stock
  - Onglet Ventes boutique
- Génération de QR codes en image PNG composée (logo + QR + SKU)
- 11 premiers produits insérés en base

**Obstacles :** Bugs EXIF sur les photos (orientation portrait/paysage), apostrophe dans les noms qui brisait le JS des QR codes — chaque bug corrigé en 1-2 itérations.

---

### Jours 4-5 — 19-21 mai : Pipeline produits et page « Ma pierre »

**Ce qui a été fait :**
- Script `importer_produits.mjs` — pipeline zéro-SQL :
  - Scanne `assets/Produits/` automatiquement
  - Déduit la catégorie depuis le dossier
  - Déduit le prix depuis le nom de fichier
  - Insère uniquement les nouveaux SKU (idempotent)
- 24 nouveaux produits LBG-26-015 à 038 importés en quelques secondes
- Variable `piece_unique` : distingue photo exacte (pièce unique) vs photo représentative
- Page `pierre.html` — le « passeport pierre » :
  - Client scanne son QR code → voit la fiche complète de SA pierre
  - Description géologique, propriétés, entretien, origine
  - Section « Vous pensez qu'on s'est trompé ? » → formulaire de contact pré-rempli
- GitHub Actions : keep-alive Supabase toutes les 48h (le plan gratuit dort après inactivité)

---

### Jours 6-7 — 22-23 mai : Explosion de catalogue

**Ce qui a été fait :**
- Nouvelle catégorie Accessoires (identifieurs de coupe à vin)
- 17 identifieurs (LBG-26-039 à 055) — 3 $ l'ensemble de 2
- 8 bracelets (LBG-26-056 à 064)
- 16 boucles haut de gamme avec boîte en bois gravée (LBG-26-065 à 080)
- POS mobile amélioré : saisie SKU manuelle (un seul QR pour tout vendre)

**Astuce pipeline :** nommer les fichiers `LBG-26-XXX-categorie-pierre.jpg` suffit. Le script fait le reste.

---

### Jour 8 — 24 mai : Lancement public

**Ce qui a été fait :**
- 43 nouveaux produits (LBG-26-081 à 123) — colliers, bracelets, boucles
- Système de recadrage image par SKU (`object-position` CSS) pour centrer chaque bijou
- Correction orientation portrait → le navigateur affiche les photos correctement
- **Page d'accueil** : remplacement du "bientôt disponible" par le vrai site
  - Carousel des nouveautés
  - Section « Retrouvez votre bijou » (recherche par SKU)
  - Catégories, appel à l'action
- Correction de tous les doublons d'images découverts lors de l'audit
- Onglet Stats dans le panneau admin (tracking visites, top pages, top produits, graphique 7 jours)

---

### Jour 9 — 25-26 mai : Paiement réel et finition

**Ce qui a été fait :**
- **Page de commande PayPal complète** :
  - 2 colonnes : formulaire + résumé sticky
  - Boutons PayPal Smart Buttons (PayPal, carte crédit/débit, Apple Pay, Google Pay)
  - Calcul côté serveur (le client ne peut pas manipuler le prix)
  - Vérification du montant capturé vs commande en base (anti-fraude)
  - Décrément automatique du stock à la capture
- Passage de sandbox → production PayPal (vrai argent)
- **Test réel :** achat d'un produit à 1 $, vérification dans Supabase → ✅
- Fix contrainte Vercel : 14 fonctions → consolidation à 12 (limite plan Hobby)
- **Formulaire de contact web** (plus de mailto: qui ne marche pas sur mobile)
  - Fonctionne sans application mail configurée
  - Honeypot anti-spam
  - Pré-rempli depuis les QR codes (`?sku=` ou `?sujet=`)
- Audit complet : 7 bugs corrigés (nom incorrect PayPal, catégorie manquante, nav incomplète, etc.)
- Tests fonctionnels : 19 cas sur tous les endpoints API → tout vert

---

## La stack technique — 100 % gratuite

```
Client (navigateur)
    │
    ├── GitHub Pages (hébergement statique gratuit)
    │       HTML / CSS / JS vanilla — aucun framework
    │
    └── Vercel Hobby (serverless gratuit — 12 fonctions max)
            Node.js 20, ES modules
            │
            ├── Supabase Free (PostgreSQL)
            │       Tables: products, orders, ventes_locales, page_views
            │
            ├── PayPal Orders API v2 (live)
            │       Capture côté serveur — montant vérifié
            │
            └── Gmail SMTP (nodemailer + App Password)
                    Emails: commande, paiement, prêt, contact, vente POS
```

---

## Pipeline « Ajouter un produit » — un enfant peut le faire

### Étape 1 — La photo (30 secondes)

Prendre une photo du bijou avec le téléphone.
Nommer le fichier selon la convention :

```
LBG-26-124-boucles-cornaline-rouge.jpg
  ↑       ↑   ↑        ↑
  marque  an  numéro   pierre (détermine le prix automatiquement)
```

Copier le fichier dans le bon dossier :

```
assets/Produits/Boucles/       ← boucles d'oreilles
assets/Produits/colliers/      ← colliers
assets/Produits/bracelets/     ← bracelets
assets/Produits/Accessoires/   ← tout le reste
```

### Étape 2 — Git push (10 secondes)

```bash
git add assets/Produits/Boucles/LBG-26-124-boucles-cornaline-rouge.jpg
git push
```

### Étape 3 — Dire à Claude la pierre et le prix (1 phrase)

> « Ajoute LBG-26-124, cornaline rouge, 12 $ »

Claude ajoute la description dans `importer_produits.mjs` et lance :

```bash
node scripts/importer_produits.mjs
```

### Résultat

```
📸  1 nouveau produit détecté:

  + LBG-26-124     Boucles d'oreilles Cornaline Rouge        12.00 $  stock: 1

⬆️   Insertion dans Supabase...
🎉  1 produit ajouté !
```

**Le bijou est en ligne. Le QR code fonctionne. Le stock est suivi.**
Aucun SQL. Aucun panneau d'administration à ouvrir. Aucun code.

---

## Pipeline Vision — La prochaine étape

La version actuelle nécessite encore que Claude connaisse le nom de la pierre.
La version Vision va plus loin : **montrer la photo à Claude, qui identifie la pierre et génère la description automatiquement.**

```
Photo → Claude Vision → « C'est de la cornaline rouge, 
                          voici la description géologique… »
                       → Insertion Supabase automatique
```

**Flux complet :**
1. Photographier le bijou
2. `node scripts/importer_vision.mjs assets/Produits/Boucles/LBG-26-124.jpg`
3. Claude analyse l'image, identifie la pierre, génère nom + description
4. Confirmation humaine (optionnelle)
5. Insertion en base — le produit est en ligne

Un enfant de 10 ans peut faire les étapes 1 et 2.

---

## Ce que Claude Code a fait — et ce que l'humain a fait

| Tâche | Qui |
|---|---|
| Écrire le HTML, CSS, JavaScript | Claude Code |
| Concevoir les endpoints API | Claude Code |
| Déboguer les erreurs | Claude Code |
| Écrire les emails HTML | Claude Code |
| Créer le schéma de base de données | Claude Code |
| Corriger l'orientation EXIF des photos | Claude Code |
| Générer les QR codes | Claude Code |
| Configurer Vercel, GitHub Pages, Supabase | Claude Code (guidance) |
| Rédiger les descriptions de pierres | Claude Code |
| Auditer la sécurité | Claude Code |
| Tester les paiements PayPal | Michael (cliquer « Acheter ») |
| Prendre les photos des bijoux | Nathan & Lyam |
| Créer les bijoux | Nathan & Lyam |
| Dire quoi construire | Michael |

---

## Leçons apprises

**1. La direction est la compétence.** Savoir *quoi* demander est plus précieux que savoir *comment* le coder. Claude Code connaît la technique — l'humain connaît le problème.

**2. Le MVP en heures, pas en semaines.** Le premier produit était en ligne le soir du jour 1. Chaque itération ajoutait une couche réelle et fonctionnelle.

**3. Les contraintes deviennent des features.** La limite de 12 fonctions Vercel a forcé une architecture plus propre (consolidation des endpoints similaires).

**4. Zéro framework = zéro dette.** HTML vanilla, CSS natif, JS sans bibliothèque. Le site charge en < 1 seconde, fonctionne hors ligne partiellement, et n'a aucune dépendance frontend à maintenir.

**5. Le pipeline importe plus que le code.** L'investissement dans `importer_produits.mjs` a permis d'ajouter 112 produits en quelques heures. L'automatisation d'une tâche répétitive vaut 10× son temps de développement.

---

## Reproduire ce projet

Pour construire quelque chose de similaire pour votre entreprise :

1. **Avoir Claude Code** (claude.ai/code ou extension VS Code)
2. **Créer un compte** GitHub (gratuit), Vercel (gratuit), Supabase (gratuit)
3. **Décrire votre besoin** en langage naturel — pas besoin de vocabulaire technique
4. **Itérer** : chaque conversation ajoute une couche fonctionnelle

Aucune formation en programmation requise.
Aucun développeur à embaucher.
Aucun logiciel à acheter.

---

*Document généré avec Claude Code — mai 2026*
*Contact : consultez le dépôt GitHub pour plus d'informations*
