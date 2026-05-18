// Endpoint de debug TEMPORAIRE — à supprimer après diagnostic
import { getSupabase } from '../lib/supabase.js';
import { createPayPalOrder } from '../lib/paypal.js';

export default async function handler(req, res) {
  const results = {};
  const TEST_PRODUCT_ID = '2bf5ff21-eb4a-4bbf-991a-bdece4b92b7a';

  // 1. Supabase — lecture produit
  try {
    const sb = getSupabase();
    const { data, error } = await sb.from('products').select('id,name,price_cad,in_stock').eq('id', TEST_PRODUCT_ID).single();
    results.supabase_product = error ? `ERREUR: ${error.message}` : `OK: ${data.name}`;
  } catch(e) { results.supabase_product = `EXCEPTION: ${e.message}`; }

  // 2. Supabase — insert order test
  let testOrderId = null;
  try {
    const sb = getSupabase();
    const { data, error } = await sb.from('orders').insert({
      customer_name: 'Debug Test', customer_email: 'debug@test.com',
      product_id: TEST_PRODUCT_ID, product_name: 'Test', qty: 1,
      amount_cad: 5.00, livraison: 'collecte', frais_livraison: 0, rabais: 0,
      status: 'pending', notes: ''
    }).select('id').single();
    if (error) { results.supabase_insert = `ERREUR: ${error.message} | ${error.details}`; }
    else { testOrderId = data.id; results.supabase_insert = `OK: ${data.id}`; }
  } catch(e) { results.supabase_insert = `EXCEPTION: ${e.message}`; }

  // 3. PayPal order
  if (testOrderId) {
    try {
      const pp = await createPayPalOrder(5.00, testOrderId, 'Test x1');
      results.paypal_order = `OK: ${pp.id}`;
    } catch(e) { results.paypal_order = `ERREUR: ${e.message}`; }

    // Cleanup
    try {
      const sb = getSupabase();
      await sb.from('orders').delete().eq('id', testOrderId);
      results.cleanup = 'OK';
    } catch(e) { results.cleanup = `ERREUR: ${e.message}`; }
  }

  res.status(200).json(results);
}
