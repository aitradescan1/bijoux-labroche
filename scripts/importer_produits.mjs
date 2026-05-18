// scripts/importer_produits.mjs
// Scanne assets/Produits/ et insère automatiquement les nouveaux produits dans Supabase
// Usage:
//   node scripts/importer_produits.mjs             → importe les nouveaux
//   node scripts/importer_produits.mjs --dry-run   → affiche sans insérer
//   node scripts/importer_produits.mjs --list      → liste tous les produits en base

import { createClient } from '@supabase/supabase-js';
import dotenv           from 'dotenv';
import { readdirSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';
import { fileURLToPath }           from 'url';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const ROOT    = join(fileURLToPath(import.meta.url), '..', '..');
const DRY_RUN = process.argv.includes('--dry-run');
const LIST    = process.argv.includes('--list');
const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// Dossiers → catégorie Supabase
const DOSSIERS = {
  Boucles:   'boucles',
  Colliers:  'collier',
  Bracelets: 'bracelet',
  Autre:     'autre',
};

const CAT_LABEL  = { boucles: "Boucles d'oreilles", collier: 'Collier', bracelet: 'Bracelet', autre: 'Bijou' };
const CAT_PREFIX = { boucles: ['boucles', 'boucle'], collier: ['collier', 'colliers'], bracelet: ['bracelet', 'bracelets'] };

// Génère un nom lisible depuis le nom de fichier
// ex: "LBG-26-003-boucles-aventurine.jpg" → "Boucles d'oreilles Aventurine"
function nomDepuisFichier(fichier, categorie) {
  let mots = basename(fichier, extname(fichier))
    .replace(/^LBG-\d{2}-\d{3}-?/i, '')
    .replace(/-/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
  // Retirer le mot de catégorie s'il est en tête (ex: "boucles")
  const prefixes = CAT_PREFIX[categorie] ?? [];
  while (mots.length && prefixes.includes(mots[0].toLowerCase())) mots.shift();
  const stone = mots.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' ');
  return stone ? `${CAT_LABEL[categorie] ?? 'Bijou'} ${stone}` : (CAT_LABEL[categorie] ?? 'Bijou');
}

// ── --list ─────────────────────────────────────────────────
if (LIST) {
  const { data, error } = await supabase
    .from('products')
    .select('sku, name, category, price_cad, stock_qty, in_stock')
    .order('sku');
  if (error) { console.error('❌', error.message); process.exit(1); }
  console.log(`\n📦  ${data.length} produit(s) en base:\n`);
  for (const p of data) {
    const stock = p.in_stock ? `✅ ${p.stock_qty}` : '❌ 0';
    console.log(`  ${(p.sku ?? '—').padEnd(14)} ${p.name.slice(0, 40).padEnd(42)} ${String(p.price_cad).padStart(5)} $  ${stock}`);
  }
  console.log('');
  process.exit(0);
}

// ── Scan des dossiers ──────────────────────────────────────
const images = [];
for (const [dossier, categorie] of Object.entries(DOSSIERS)) {
  const dir = join(ROOT, 'assets', 'Produits', dossier);
  if (!existsSync(dir)) continue;
  for (const fichier of readdirSync(dir)) {
    if (!IMG_EXT.has(extname(fichier).toLowerCase())) continue;
    const m = fichier.match(/^(LBG-\d{2}-\d{3})/i);
    if (!m) continue;
    const sku = m[1].toUpperCase();
    images.push({ sku, categorie, fichier, dossier });
  }
}

// Dédupliquer (garder la 1ère occurrence par SKU)
const vus = new Set();
const imagesUniques = images.filter(img => {
  if (vus.has(img.sku)) return false;
  vus.add(img.sku);
  return true;
});

// ── SKUs déjà en base ──────────────────────────────────────
const { data: existants } = await supabase.from('products').select('sku');
const skusEnBase = new Set(existants?.map(p => p.sku) ?? []);

// ── Nouveaux seulement ─────────────────────────────────────
const nouveaux = imagesUniques.filter(img => !skusEnBase.has(img.sku));

if (nouveaux.length === 0) {
  console.log('\n✅  Tous les produits sont déjà en base. Rien à importer.\n');
  console.log('   Astuce: node scripts/importer_produits.mjs --list\n');
  process.exit(0);
}

console.log(`\n📸  ${nouveaux.length} nouveau(x) produit(s) détecté(s):\n`);

const aInserer = nouveaux.map(img => {
  const nom = nomDepuisFichier(img.fichier, img.categorie);
  const imageUrl = `assets/Produits/${img.dossier}/${img.fichier}`;
  console.log(`  + ${img.sku.padEnd(14)} ${nom.slice(0, 40).padEnd(42)} 10.00 $  stock: 1`);
  return {
    sku:         img.sku,
    name:        nom,
    description: null,
    price_cad:   10.00,
    category:    img.categorie,
    image_url:   imageUrl,
    stock_qty:   1,
    in_stock:    true,
  };
});

if (DRY_RUN) {
  console.log('\n⚠️   Mode --dry-run : aucune insertion effectuée.\n');
  process.exit(0);
}

console.log('\n⬆️   Insertion dans Supabase...');
const { error } = await supabase.from('products').insert(aInserer);
if (error) {
  console.error('❌  Erreur:', error.message);
  process.exit(1);
}

console.log(`\n🎉  ${aInserer.length} produit(s) ajouté(s) !`);
console.log('   → Complète prix et descriptions dans le panneau admin si besoin.\n');
console.log('   Vérifier: node scripts/importer_produits.mjs --list\n');
