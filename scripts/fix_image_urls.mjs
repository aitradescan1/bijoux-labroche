// Corrige les image_url des colliers et bracelets (majuscule → minuscule dans le chemin)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data, error } = await supabase
  .from('products')
  .select('id, sku, image_url')
  .or('image_url.like.%/Colliers/%,image_url.like.%/Bracelets/%');

if (error) { console.error(error.message); process.exit(1); }
console.log(`\n${data.length} produits à corriger :\n`);

for (const p of data) {
  const fixed = p.image_url
    .replace('/Colliers/', '/colliers/')
    .replace('/Bracelets/', '/bracelets/');
  const { error: e } = await supabase.from('products').update({ image_url: fixed }).eq('id', p.id);
  if (e) {
    console.log(`  ❌ ${p.sku}: ${e.message}`);
  } else {
    console.log(`  ✅ ${p.sku}: ${fixed}`);
  }
}
console.log('\nTerminé.\n');
