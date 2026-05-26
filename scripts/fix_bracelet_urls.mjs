// fix_bracelet_urls.mjs
// Corrige la casse des URLs d'images bracelets dans Supabase:
//   assets/Produits/Bracelets/ → assets/Produits/bracelets/

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const { data, error } = await supabase
  .from('products')
  .select('id, sku, image_url')
  .ilike('image_url', '%/Bracelets/%');

if (error) { console.error('Erreur lecture:', error); process.exit(1); }
if (!data.length) { console.log('Aucun produit avec Bracelets/ trouvé.'); process.exit(0); }

console.log(`${data.length} produit(s) à corriger:`);
for (const p of data) {
  const newUrl = p.image_url.replace('/Bracelets/', '/bracelets/');
  console.log(`  ${p.sku}: ${p.image_url} → ${newUrl}`);
  const { error: upErr } = await supabase
    .from('products')
    .update({ image_url: newUrl })
    .eq('id', p.id);
  if (upErr) console.error(`    ❌ Erreur pour ${p.sku}:`, upErr);
  else       console.log(`    ✅ OK`);
}
console.log('Terminé.');
