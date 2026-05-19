// scripts/ajouter_26_012_015.mjs
// One-shot : renomme les 4 photos du 2026-05-19, corrige l'orientation EXIF,
// supprime le doublon LBG-26-001-pierre-polie, insère LBG-26-012 à LBG-26-015.

import sharp        from 'sharp';
import { renameSync, unlinkSync, existsSync, writeFileSync } from 'fs';
import { join }     from 'path';
import { fileURLToPath } from 'url';
import { getSupabase }   from '../lib/supabase.js';

const ROOT   = join(fileURLToPath(import.meta.url), '..', '..');
const BOUCLES = join(ROOT, 'assets', 'Produits', 'Boucles');
const GH_RAW  = 'https://raw.githubusercontent.com/aitradescan1/bijoux-labroche/main/';

// ── 1. Supprimer le doublon ───────────────────────────────────────────────────
const doublon = join(BOUCLES, 'LBG-26-001-boucles-pierre-polie.jpg');
if (existsSync(doublon)) {
  unlinkSync(doublon);
  console.log('🗑  Doublon supprimé : LBG-26-001-boucles-pierre-polie.jpg');
}

// ── 2. Renommages + correction orientation EXIF ───────────────────────────────
const RENAMES = [
  { from: '20260519_130858.jpg', to: 'LBG-26-012-boucles-quartz-blanc.jpg' },
  { from: '20260519_130914.jpg', to: 'LBG-26-013-boucles-quartz-blanc.jpg' },
  { from: '20260519_130926.jpg', to: 'LBG-26-014-boucles-pierre-miel.jpg'  },
  { from: '20260519_130951.jpg', to: 'LBG-26-015-boucles-jaspe-rouge.jpg'  },
];

for (const { from, to } of RENAMES) {
  const src = join(BOUCLES, from);
  const dst = join(BOUCLES, to);
  const tmp = dst + '.tmp.jpg';

  if (!existsSync(src)) { console.warn(`⚠️  Introuvable : ${from}`); continue; }

  // Corriger EXIF puis renommer
  try {
    const buf = await sharp(src)
      .rotate()
      .withMetadata({ orientation: 1 })
      .jpeg({ quality: 90 })
      .toBuffer();
    writeFileSync(tmp, buf);
    unlinkSync(src);
    renameSync(tmp, dst);
    console.log(`✅  ${from}  →  ${to}`);
  } catch (e) {
    try { unlinkSync(tmp); } catch {}
    console.error(`❌  ${from} : ${e.message}`);
  }
}

// ── 3. Insérer dans Supabase ──────────────────────────────────────────────────
const supabase = getSupabase();

const PRODUITS = [
  {
    sku:         'LBG-26-012',
    name:        "Boucles d'oreilles Quartz Blanc",
    description: "Paires de cabochons de quartz laiteux d'un blanc pur et doux, montés sur puces dorées. La blancheur immaculée de ces pierres apporte une élégance intemporelle et naturelle. Chaque pièce est polie à la main par Nathan et Lyam pour révéler la douceur soyeuse de la pierre.",
    price_cad:   10,
    category:    'boucles',
    image_url:   `${GH_RAW}assets/Produits/Boucles/LBG-26-012-boucles-quartz-blanc.jpg`,
    stock_qty:   1,
    in_stock:    true,
  },
  {
    sku:         'LBG-26-013',
    name:        "Boucles d'oreilles Quartz Blanc Nacré",
    description: "Cabochons de quartz blanc aux reflets nacrés légèrement nacrés, montés sur puces dorées. Une variation plus lumineuse du quartz laiteux — la même pureté minérale mais avec une touche de brillance naturelle unique. Pièce unique, faite à la main.",
    price_cad:   10,
    category:    'boucles',
    image_url:   `${GH_RAW}assets/Produits/Boucles/LBG-26-013-boucles-quartz-blanc.jpg`,
    stock_qty:   1,
    in_stock:    true,
  },
  {
    sku:         'LBG-26-014',
    name:        "Boucles d'oreilles Pierre Miel Ambrée",
    description: "Sublimes cabochons de pierre miel aux tons chauds dorés-ambrés, montés sur puces argentées. La teinte chaude de ces pierres évoque le miel et l'ambre — comme capturer un rayon de soleil d'été. Cousines de LBG-26-005, chaque paire est unique dans ses nuances.",
    price_cad:   12,
    category:    'boucles',
    image_url:   `${GH_RAW}assets/Produits/Boucles/LBG-26-014-boucles-pierre-miel.jpg`,
    stock_qty:   1,
    in_stock:    true,
  },
  {
    sku:         'LBG-26-015',
    name:        "Boucles d'oreilles Jaspe Rouge Profond",
    description: "Cabochons de jaspe rouge aux teintes profondes bordeaux-rubis, montés sur puces dorées. La richesse de cette couleur intense, presque somptueuse, en fait une pièce de caractère. Le jaspe rouge était la pierre des guerriers dans l'Antiquité — une énergie forte et protectrice.",
    price_cad:   12,
    category:    'boucles',
    image_url:   `${GH_RAW}assets/Produits/Boucles/LBG-26-015-boucles-jaspe-rouge.jpg`,
    stock_qty:   1,
    in_stock:    true,
  },
];

for (const produit of PRODUITS) {
  const { data, error } = await supabase
    .from('products')
    .upsert(produit, { onConflict: 'sku' })
    .select('id, sku, name');

  if (error) {
    console.error(`❌  ${produit.sku} : ${error.message}`);
  } else {
    console.log(`✅  DB ${data[0].sku} — ${data[0].name}`);
  }
}

console.log('\nTerminé.\n');
