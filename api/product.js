// api/product.js
// GET /api/product?sku=LBG-26-001
// Retourne un produit par SKU, tous statuts de stock (fiche produit client)

import { getSupabase } from '../lib/supabase.js';

const ALLOWED_ORIGIN = (process.env.ALLOWED_ORIGIN ?? '*').trim();

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Méthode non autorisée' });

  const { sku } = req.query;
  if (!sku || typeof sku !== 'string' || sku.trim().length === 0) {
    return res.status(400).json({ error: 'Paramètre sku manquant' });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('products')
      .select('id, sku, name, description, price_cad, category, image_url, piece_unique, stock_qty, in_stock')
      .eq('sku', sku.trim().toUpperCase())
      .single();

    if (error || !data) return res.status(404).json({ error: 'Produit introuvable' });

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
    return res.status(200).json(data);

  } catch (err) {
    console.error('[product]', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
