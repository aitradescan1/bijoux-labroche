// api/admin/products.js
// POST /api/admin/products — créer un nouveau produit
// PATCH /api/admin/products — modifier un produit existant
// DELETE /api/admin/products — supprimer un produit
// Protégé par Bearer ADMIN_SECRET

import { getSupabase }                 from '../../lib/supabase.js';
import { timingSafeEqual, createHash } from 'crypto';

const ALLOWED_ORIGIN = (process.env.ALLOWED_ORIGIN ?? '*').trim();
const ADMIN_SECRET   = process.env.ADMIN_SECRET ?? '';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST,PATCH,DELETE,OPTIONS');
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

function parseBody(req) {
  try { return typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {}); }
  catch { return null; }
}

const VALID_CATEGORIES = new Set(['boucles', 'collier', 'bracelet', 'autre']);

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!authenticate(req))      return res.status(401).json({ error: 'Non autorisé' });

  const supabase = getSupabase();
  const body     = parseBody(req);
  if (!body) return res.status(400).json({ error: 'Corps JSON invalide' });

  // ── POST : créer un produit ───────────────────────────────
  if (req.method === 'POST') {
    const { sku, name, description, price_cad, category, image_url, stock_qty } = body;

    if (!name || typeof name !== 'string' || !name.trim())
      return res.status(400).json({ error: 'name manquant' });
    if (!price_cad || isNaN(parseFloat(price_cad)) || parseFloat(price_cad) <= 0)
      return res.status(400).json({ error: 'price_cad invalide' });
    if (category && !VALID_CATEGORIES.has(category))
      return res.status(400).json({ error: 'category invalide' });

    const qty = Number.isInteger(stock_qty) ? Math.max(0, stock_qty) : 0;

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          sku:         sku?.trim()         || null,
          name:        name.trim(),
          description: description?.trim() || null,
          price_cad:   parseFloat(price_cad),
          category:    category            || 'autre',
          image_url:   image_url?.trim()   || null,
          stock_qty:   qty,
          in_stock:    qty > 0,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'Ce SKU existe déjà' });
        throw error;
      }
      return res.status(201).json(data);
    } catch (err) {
      console.error('[admin/products POST]', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // ── PATCH : modifier un produit ───────────────────────────
  if (req.method === 'PATCH') {
    const { id, ...fields } = body;
    if (!id) return res.status(400).json({ error: 'id manquant' });

    const allowed = ['sku', 'name', 'description', 'price_cad', 'category', 'image_url', 'stock_qty'];
    const update  = {};
    for (const k of allowed) {
      if (fields[k] !== undefined) update[k] = fields[k];
    }
    if ('stock_qty' in update) {
      update.stock_qty = Math.max(0, parseInt(update.stock_qty, 10) || 0);
      update.in_stock  = update.stock_qty > 0;
    }
    if ('price_cad' in update) update.price_cad = parseFloat(update.price_cad);
    if (!Object.keys(update).length) return res.status(400).json({ error: 'Aucun champ à modifier' });

    try {
      const { data, error } = await supabase
        .from('products')
        .update(update)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    } catch (err) {
      console.error('[admin/products PATCH]', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // ── DELETE : supprimer un produit ─────────────────────────
  if (req.method === 'DELETE') {
    const { id } = body;
    if (!id) return res.status(400).json({ error: 'id manquant' });

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('[admin/products DELETE]', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
