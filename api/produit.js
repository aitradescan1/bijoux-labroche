// api/produit.js
// GET /api/produit?sku=LBG-26-003  — fiche publique d'un produit (sans filtre in_stock)

import { getSupabase } from '../lib/supabase.js';

const ALLOWED_ORIGIN = (process.env.ALLOWED_ORIGIN ?? '*').trim();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });

  const sku = (req.query?.sku ?? '').trim().toUpperCase();
  if (!sku) return res.status(400).json({ error: 'Paramètre sku manquant' });

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('products')
      .select('id, sku, name, description, price_cad, category, image_url, stock_qty, in_stock')
      .eq('sku', sku)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Produit introuvable' });
    return res.status(200).json(data);
  } catch (err) {
    console.error('[produit]', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
