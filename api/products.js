// api/products.js
// GET /api/products — retourne les produits en stock depuis Supabase

import { getSupabase } from '../lib/supabase.js';

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? '*';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, price_cad, category, image_url')
      .eq('in_stock', true)
      .order('category')
      .order('name');

    if (error) throw error;

    // Cache de 60 secondes côté CDN Vercel
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(data);

  } catch (err) {
    console.error('[products]', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
