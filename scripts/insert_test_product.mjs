// scripts/insert_test_product.mjs
// Insère ou remet à zéro le produit de test LBG-TEST-001
// Usage: node scripts/insert_test_product.mjs
// Pour supprimer après les tests: node scripts/insert_test_product.mjs --delete

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
const SKU      = 'LBG-TEST-001';
const DELETE   = process.argv.includes('--delete');

if (DELETE) {
  console.log(`🗑️   Suppression de ${SKU}...`);
  const { error } = await supabase.from('products').delete().eq('sku', SKU);
  if (error) { console.error('❌', error.message); process.exit(1); }
  console.log('✅  Produit test supprimé.');
  process.exit(0);
}

const PRODUIT = {
  sku:         SKU,
  name:        '🧪 Produit Test — Pipeline',
  description: 'Article fictif pour tester le pipeline complet (POS, stock, email). À supprimer après les tests.',
  price_cad:   5.00,
  category:    'autre',
  image_url:   null,
  stock_qty:   5,
  in_stock:    true,
};

console.log(`🔍  Vérification de ${SKU}...`);

const { data: existing } = await supabase
  .from('products')
  .select('id, sku, stock_qty')
  .eq('sku', SKU)
  .maybeSingle();

if (existing) {
  console.log(`⚠️   Produit existant (stock actuel: ${existing.stock_qty}) — remise à 5 unités...`);
  const { error } = await supabase
    .from('products')
    .update({ stock_qty: 5, in_stock: true, price_cad: 5.00 })
    .eq('sku', SKU);
  if (error) { console.error('❌', error.message); process.exit(1); }
  console.log('✅  Stock remis à 5.');
} else {
  console.log('📦  Insertion du produit test...');
  const { data, error } = await supabase
    .from('products')
    .insert(PRODUIT)
    .select('id, sku, name, price_cad, stock_qty')
    .single();
  if (error) { console.error('❌', error.message); process.exit(1); }
  console.log('🎉  Produit test inséré !');
  console.log(`    ID    : ${data.id}`);
  console.log(`    SKU   : ${data.sku}`);
  console.log(`    Nom   : ${data.name}`);
  console.log(`    Prix  : ${data.price_cad} $CAD`);
  console.log(`    Stock : ${data.stock_qty} unités`);
}

console.log('\n📋  URLs de test:');
console.log('    POS mobile  → https://aitradescan1.github.io/bijoux-labroche/vendre.html?sku=LBG-TEST-001');
console.log('    Admin panel → https://aitradescan1.github.io/bijoux-labroche/admin.html');
console.log('    Local POS   → http://localhost:3000/vendre.html?sku=LBG-TEST-001');
console.log('\n🔑  PIN POS : 1234');
console.log('📧  Email notif → bijoux.labroche@gmail.com');
console.log('\n⚠️   Supprimer après les tests : node scripts/insert_test_product.mjs --delete');
