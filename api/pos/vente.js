// api/pos/vente.js
// POST /api/pos/vente
// Enregistre une vente locale, décrémente stock_qty, met à jour in_stock
// Protégé par le header X-Pos-Pin

import { getSupabase }                  from '../../lib/supabase.js';
import { timingSafeEqual, createHash }  from 'crypto';
import { sendVentePOS }                 from '../../lib/mail.js';

const ALLOWED_ORIGIN = (process.env.ALLOWED_ORIGIN ?? '*').trim();
const POS_PIN        = process.env.POS_PIN ?? '';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Pos-Pin');
}

function pinOk(provided) {
  if (!POS_PIN || !provided) return false;
  const ha = createHash('sha256').update(String(provided)).digest();
  const hb = createHash('sha256').update(POS_PIN).digest();
  return ha.length === hb.length && timingSafeEqual(ha, hb);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Méthode non autorisée' });

  if (!pinOk(req.headers['x-pos-pin'])) {
    return res.status(401).json({ error: 'PIN incorrect' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Corps JSON invalide' });
  }

  const { product_id, qty = 1, paiement = 'comptant', vendu_par = '' } = body ?? {};

  if (!product_id || typeof product_id !== 'string') {
    return res.status(400).json({ error: 'product_id manquant' });
  }
  if (!Number.isInteger(qty) || qty < 1 || qty > 20) {
    return res.status(400).json({ error: 'Quantité invalide (1–20)' });
  }
  if (!['comptant', 'paypal', 'interac'].includes(paiement)) {
    return res.status(400).json({ error: 'Méthode de paiement invalide' });
  }

  try {
    const supabase = getSupabase();

    // ── Lire le produit (source of truth pour prix et stock) ──
    const { data: product, error: pErr } = await supabase
      .from('products')
      .select('id, name, price_cad, stock_qty')
      .eq('id', product_id)
      .single();

    if (pErr || !product) return res.status(404).json({ error: 'Produit introuvable' });

    if (product.stock_qty < qty) {
      return res.status(409).json({
        error: `Stock insuffisant — ${product.stock_qty} disponible${product.stock_qty !== 1 ? 's' : ''}`,
      });
    }

    const nouvelleQty = product.stock_qty - qty;
    const amountCAD   = parseFloat((product.price_cad * qty).toFixed(2));

    // ── Décrémenter le stock ──────────────────────────────────
    const { error: uErr } = await supabase
      .from('products')
      .update({ stock_qty: nouvelleQty, in_stock: nouvelleQty > 0 })
      .eq('id', product_id);

    if (uErr) throw uErr;

    // ── Enregistrer la vente ──────────────────────────────────
    const { data: vente, error: vErr } = await supabase
      .from('ventes_locales')
      .insert({
        product_id,
        product_name: product.name,
        qty,
        price_cad:  amountCAD,
        paiement,
        vendu_par:  String(vendu_par).slice(0, 50),
      })
      .select('id')
      .single();

    if (vErr) throw vErr;

    // Notif email admin — fire-and-forget
    sendVentePOS({
      product_name: product.name,
      qty,
      price_cad:    amountCAD,
      paiement,
      vendu_par:    String(vendu_par).slice(0, 50),
    }).catch(e => console.error('[pos/vente] Email non envoyé:', e));

    return res.status(201).json({
      success:      true,
      venteId:      vente.id,
      amountCAD,
      stockRestant: nouvelleQty,
    });

  } catch (err) {
    console.error('[pos/vente]', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
