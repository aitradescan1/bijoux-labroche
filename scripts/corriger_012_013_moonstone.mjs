// scripts/corriger_012_013_moonstone.mjs
// Renomme les fichiers 012/013 quartz-blanc → pierre-de-lune
// et met à jour les noms/descriptions/image_url dans Supabase.

import { renameSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { getSupabase } from '../lib/supabase.js';

const ROOT    = join(fileURLToPath(import.meta.url), '..', '..');
const BOUCLES = join(ROOT, 'assets', 'Produits', 'Boucles');
const GH_RAW  = 'https://raw.githubusercontent.com/aitradescan1/bijoux-labroche/main/';

// ── 1. Renommer les fichiers ──────────────────────────────────────────────────
const RENAMES = [
  { from: 'LBG-26-012-boucles-quartz-blanc.jpg', to: 'LBG-26-012-boucles-pierre-de-lune.jpg' },
  { from: 'LBG-26-013-boucles-quartz-blanc.jpg', to: 'LBG-26-013-boucles-pierre-de-lune.jpg' },
];

for (const { from, to } of RENAMES) {
  const src = join(BOUCLES, from);
  const dst = join(BOUCLES, to);
  if (!existsSync(src)) { console.warn(`⚠️  Introuvable : ${from}`); continue; }
  renameSync(src, dst);
  console.log(`✅  ${from}  →  ${to}`);
}

// ── 2. Mettre à jour Supabase ─────────────────────────────────────────────────
const supabase = getSupabase();

const UPDATES = [
  {
    sku:         'LBG-26-012',
    name:        "Boucles d'oreilles Pierre de Lune",
    description: "Cabochons de pierre de lune (moonstone) de Madagascar aux reflets bleu-gris caractéristiques, montés sur puces dorées. L'adularescence — ce voile lumineux qui glisse sous la surface — est la signature unique de cette pierre de feldspath. Chaque pièce est différente selon l'angle de la lumière.",
    image_url:   `${GH_RAW}assets/Produits/Boucles/LBG-26-012-boucles-pierre-de-lune.jpg`,
  },
  {
    sku:         'LBG-26-013',
    name:        "Boucles d'oreilles Pierre de Lune Nacrée",
    description: "Paire de cabochons de pierre de lune de Madagascar, teinte blanc-crème avec un voile irisé lumineux. La pierre de lune est un feldspath formé dans les pegmatites granitiques — ses couches internes créent un effet de lumière unique appelé adularescence. Pièce unique, taillée à la main.",
    image_url:   `${GH_RAW}assets/Produits/Boucles/LBG-26-013-boucles-pierre-de-lune.jpg`,
  },
];

for (const { sku, name, description, image_url } of UPDATES) {
  const { data, error } = await supabase
    .from('products')
    .update({ name, description, image_url })
    .eq('sku', sku)
    .select('sku, name');

  if (error) console.error(`❌  ${sku} : ${error.message}`);
  else       console.log(`✅  DB ${data[0].sku} — ${data[0].name}`);
}

console.log('\nTerminé.\n');
