// api/inventory/index.js
// GET  /api/inventory        — liste complète des produits avec stock (admin)
// POST /api/inventory        — réapprovisionner un produit (admin)
// Protégé par Bearer ADMIN_SECRET

import { getSupabase }                  from '../../lib/supabase.js';
import { timingSafeEqual, createHash }  from 'crypto';

const ALLOWED_ORIGIN = (process.env.ALLOWED_ORIGIN ?? '*').trim();
const ADMIN_SECRET   = process.env.ADMIN_SECRET   ?? '';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function authenticate(req) {
  const auth  = req.headers['authorization'] ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!ADMIN_SECRET || !token) return false;
  const ha = createHash('sha256').update(token).digest();
  const hb = createHash('sha256').update(ADMIN_SECRET).digest();
  return ha.length === hb.length && timingSafeEqual(ha, hb);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!authenticate(req))      return res.status(401).json({ error: 'Non autorisé' });

  const supabase = getSupabase();

  // ── GET : liste inventaire ────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, sku, name, category, price_cad, stock_qty, in_stock, image_url')
        .order('category')
        .order('name');

      if (error) throw error;
      return res.status(200).json(data);

    } catch (err) {
      console.error('[inventory GET]', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // ── POST : réapprovisionner ───────────────────────────────
  if (req.method === 'POST') {
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ error: 'Corps JSON invalide' });
    }

    const { product_id, add_qty } = body ?? {};

    if (!product_id || typeof product_id !== 'string') {
      return res.status(400).json({ error: 'product_id manquant' });
    }
    if (!Number.isInteger(add_qty) || add_qty === 0 || Math.abs(add_qty) > 999) {
      return res.status(400).json({ error: 'add_qty invalide (−999 à 999, non nul)' });
    }

    try {
      const { data: product, error: pErr } = await supabase
        .from('products')
        .select('id, stock_qty')
        .eq('id', product_id)
        .single();

      if (pErr || !product) return res.status(404).json({ error: 'Produit introuvable' });

      const newQty = Math.max(0, product.stock_qty + add_qty);
      const { error: uErr } = await supabase
        .from('products')
        .update({ stock_qty: newQty, in_stock: newQty > 0 })
        .eq('id', product_id);

      if (uErr) throw uErr;
      return res.status(200).json({ success: true, stock_qty: newQty });

    } catch (err) {
      console.error('[inventory POST]', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
