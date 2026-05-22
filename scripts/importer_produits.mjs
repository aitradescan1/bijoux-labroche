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
  Boucles:      'boucles',
  Colliers:     'collier',
  Bracelets:    'bracelet',
  Accessoires:  'accessoire',
  Autre:        'autre',
};

const CAT_LABEL  = { boucles: "Boucles d'oreilles", collier: 'Collier', bracelet: 'Bracelet', accessoire: 'Accessoire', autre: 'Bijou' };
const CAT_PREFIX = { boucles: ['boucles', 'boucle'], collier: ['collier', 'colliers'], bracelet: ['bracelet', 'bracelets'], accessoire: ['accessoire', 'accessoires'] };

// Mots-clés dans le nom de fichier → prix $12 (sinon $10 par défaut)
const MOTS_CLES_12 = ['cornaline', 'pierre-miel', 'oeil-de-tigre', 'amethyste', 'obsidienne', 'quartz-rose', 'amazonite', 'pendantes', 'labradorite', 'pierre-de-lune'];

function prixDepuisFichier(fichier) {
  const slug = fichier.toLowerCase();
  return MOTS_CLES_12.some(mot => slug.includes(mot)) ? 12.00 : 10.00;
}

// Descriptions par SKU (générées manuellement pour les nouvelles pièces)
const DESCRIPTIONS = {
  'LBG-26-015': "Petites boucles en pierre miel dorée — une touche subtile et lumineuse pour tous les jours.",
  'LBG-26-016': "L'aventurine verte apporte fraîcheur et espoir. Ces boucles à cabochon ovale sont légères et naturellement élégantes.",
  'LBG-26-017': "Jaspe rouge intense, une des pierres les plus anciennes de l'humanité. Chaque cabochon est taillé et poli à la main.",
  'LBG-26-018': "Boucles en jaspe aux tons sable et beige — une palette terreuse et apaisante, parfaite avec une tenue naturelle.",
  'LBG-26-019': "Jaspe brun clair aux reflets chauds. Discrètes et polyvalentes, ces petites boucles s'adaptent à tout.",
  'LBG-26-020': "Cornaline rouge-orangé aux tons chauds et ensoleillés — une pierre d'énergie et de vitalité qui rayonne.",
  'LBG-26-021': "Pierre miel au ton doré profond, comme de l'ambre figé dans le temps. Chaleureux et authentique.",
  'LBG-26-022': "Cornaline aux teintes saumon et terracotta. Une pierre douce et féminine, polie et montée sur clou doré.",
  'LBG-26-023': "Le jaspe dalmatien et ses taches noires caractéristiques rappellent le pelage d'un dalmatien. Original et unique.",
  'LBG-26-024': "L'œil de tigre révèle un chatoyement unique selon l'angle de lumière — une pierre rare aux reflets soyeux et dorés.",
  'LBG-26-025': "Jaspe rouge taillé en forme de cœur — l'alliance du symbolisme amoureux et de la chaleur de cette pierre ancienne.",
  'LBG-26-026': "Chalcédoine aux tons gris-bleu apaisants. Sa surface lisse et polie capte délicatement la lumière du jour.",
  'LBG-26-027': "Chalcédoine aux reflets mauves subtils — une teinte rare et douce, quelque part entre le gris et le lilas.",
  'LBG-26-028': "Jaspe brun profond, presque chocolat — une pierre au caractère affirmé et aux tons riches de la terre.",
  'LBG-26-029': "Améthyste brute non taillée : les cristaux violets conservent leur forme cristalline originelle. Authentique et spectaculaire.",
  'LBG-26-030': "Jaspe brun aux tons naturels. Simple, solide, élégant — une pierre de la terre qui s'accorde avec tout.",
  'LBG-26-031': "Quartz blanc laiteux à la pureté minérale. Ces boucles classiques et lumineuses s'accordent avec toute tenue.",
  'LBG-26-032': "Le quartz rose, pierre de l'amour et de la tendresse. Sa teinte délicate et lumineuse en fait un bijou intemporel.",
  'LBG-26-033': "Chalcédoine gris-bleu taillée en cœur — la douceur de cette pierre apaisante dans un symbole universel.",
  'LBG-26-034': "Œil de tigre brun doré — ses stries chatoyantes créent un effet fascinant qui change selon l'éclairage.",
  'LBG-26-035': "Petite cornaline rouge vif — intense et percutante. Une touche de chaleur dans un format discret et quotidien.",
  'LBG-26-036': "Cornaline saumon marbrée aux motifs naturels uniques. Chaque paire est différente — c'est la signature de la nature.",
  'LBG-26-037': "Œil de tigre doré taillé en cœur — le chatoyement naturel de cette pierre prend tout son sens dans cette forme romantique.",
  'LBG-26-038': "Obsidienne noire au poli parfait — ce verre volcanique naturel capte la lumière comme un miroir. Élégant et intemporel.",
};

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
  const nom         = nomDepuisFichier(img.fichier, img.categorie);
  const prix        = prixDepuisFichier(img.fichier);
  const description = DESCRIPTIONS[img.sku] ?? null;
  const imageUrl    = `assets/Produits/${img.dossier}/${img.fichier}`;
  console.log(`  + ${img.sku.padEnd(14)} ${nom.slice(0, 40).padEnd(42)} ${String(prix.toFixed(2)).padStart(5)} $  stock: 1`);
  return {
    sku:          img.sku,
    name:         nom,
    description,
    price_cad:    prix,
    category:     img.categorie,
    image_url:    imageUrl,
    stock_qty:    1,
    in_stock:     true,
    piece_unique: true,   // 1 photo = 1 paire exacte reçue par le client
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
