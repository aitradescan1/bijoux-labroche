// scripts/setup_db.mjs
// Insère / met à jour le produit LBG-26-001 via l'API REST Supabase
// Pré-requis : tables créées via Supabase SQL Editor (db/schema.sql)
// Usage: node scripts/setup_db.mjs

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error('❌  SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local');
  process.exit(1);
}

const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

const DESCRIPTION =
  'Ces boucles irradient une chaleur rare. Taillées et polies à la main par Nathan & Lyam, ' +
  'elles sont façonnées dans ce que les créateurs ont identifié comme de la cornaline — ' +
  'une pierre semi-précieuse aux tons orange-saumon lumineux, variété de calcédoine appréciée ' +
  'en bijouterie depuis l\'Antiquité pour sa couleur chaude et son éclat profond. ' +
  'Chaque paire est absolument unique : la taille, les nuances et le veinage varient ' +
  'd\'une pierre à l\'autre — c\'est précisément ce qui la rend précieuse. ' +
  'Monture dorée légère incluse. ' +
  '✦ Note : l\'identification des pierres est réalisée avec passion par les créateurs ' +
  '— de légères variations sont toujours possibles.';

console.log('🔍  Vérification du produit LBG-26-001...');

const { data: existing, error: chkErr } = await supabase
  .from('products')
  .select('id, sku, name')
  .eq('sku', 'LBG-26-001')
  .maybeSingle();

if (chkErr) {
  if (chkErr.message.includes('schema cache') || chkErr.code === '42P01') {
    console.error('❌  Tables introuvables dans Supabase.');
    console.error('');
    console.error('👉  Étape requise (30 secondes):');
    console.error('    1. Va sur https://supabase.com → projet bijoux.labroche');
    console.error('    2. Menu gauche → SQL Editor');
    console.error('    3. Colle et exécute le contenu de db/schema.sql');
    console.error('    4. Relance: node scripts/setup_db.mjs');
  } else {
    console.error('❌  Erreur:', chkErr.message);
  }
  process.exit(1);
}

if (existing) {
  console.log(`⚠️   Produit existant — mise à jour...`);
  const { error } = await supabase
    .from('products')
    .update({ name: 'Boucles d\'oreilles — Cornaline polie', description: DESCRIPTION,
              image_url: 'assets/Produits/Boucles/LBG-26-001-boucles-pierre-polie.jpg',
              price_cad: 12.00, stock_qty: 1, in_stock: true })
    .eq('sku', 'LBG-26-001');
  if (error) { console.error('❌', error.message); process.exit(1); }
  console.log('✅  Produit mis à jour!');
} else {
  console.log('📦  Insertion de LBG-26-001...');
  const { data, error } = await supabase
    .from('products')
    .insert({ sku: 'LBG-26-001', name: 'Boucles d\'oreilles — Cornaline polie',
              description: DESCRIPTION, price_cad: 12.00, category: 'boucles',
              image_url: 'assets/Produits/Boucles/LBG-26-001-boucles-pierre-polie.jpg',
              stock_qty: 1, in_stock: true })
    .select().single();
  if (error) { console.error('❌', error.message); process.exit(1); }
  console.log('🎉  Produit inséré!');
  console.log(`    ID  : ${data.id}`);
  console.log(`    SKU : ${data.sku}`);
  console.log(`    Nom : ${data.name}`);
  console.log(`    Prix: ${data.price_cad} $`);
}

console.log('\n✅  Base de données prête!');
