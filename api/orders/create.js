// api/orders/create.js
// POST /api/orders/create
// Crée une commande en DB (status: pending) + un ordre PayPal
// Retourne { orderId, paypalOrderId } au frontend

import { getSupabase }       from '../../lib/supabase.js';
import { createPayPalOrder } from '../../lib/paypal.js';
import { sendOrderReceived } from '../../lib/mail.js';

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? '*';
const MAX_NAME_LEN   = 100;
const MAX_EMAIL_LEN  = 254;
const MAX_QTY        = 20;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/** Validation simple — retourne null si OK, sinon un message d'erreur */
function validate({ customerName, customerEmail, productId, qty }) {
  if (!customerName  || typeof customerName  !== 'string' || customerName.trim().length  < 2)  return 'Nom invalide';
  if (!customerEmail || typeof customerEmail !== 'string' || !customerEmail.includes('@'))       return 'Email invalide';
  if (customerName.length  > MAX_NAME_LEN)  return 'Nom trop long';
  if (customerEmail.length > MAX_EMAIL_LEN) return 'Email trop long';
  if (!productId || typeof productId !== 'string') return 'Produit manquant';
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return `Quantité invalide (1–${MAX_QTY})`;
  return null;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Méthode non autorisée' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Corps JSON invalide' });
  }

  const { customerName, customerEmail, productId, qty = 1, notes = '' } = body ?? {};

  // ── Validation ──────────────────────────────────────────────
  const validErr = validate({ customerName, customerEmail, productId, qty });
  if (validErr) return res.status(400).json({ error: validErr });

  try {
    const supabase = getSupabase();

    // ── Récupérer le produit (source of truth pour le prix) ──
    const { data: product, error: pErr } = await supabase
      .from('products')
      .select('id, name, price_cad, in_stock')
      .eq('id', productId)
      .single();

    if (pErr || !product) return res.status(404).json({ error: 'Produit introuvable' });
    if (!product.in_stock) return res.status(409).json({ error: 'Produit en rupture de stock' });

    // ── Calcul du montant côté serveur (jamais confiance au client) ──
    const amountCAD = parseFloat((product.price_cad * qty).toFixed(2));

    // ── Créer la commande en DB (pending) ───────────────────
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .insert({
        customer_name:  customerName.trim(),
        customer_email: customerEmail.trim().toLowerCase(),
        product_id:     product.id,
        product_name:   product.name,
        qty,
        amount_cad:     amountCAD,
        status:         'pending',
        notes:          notes?.toString().slice(0, 500) ?? '',
      })
      .select('id')
      .single();

    if (oErr) throw oErr;

    // ── Créer l'ordre PayPal ─────────────────────────────────
    const { id: paypalOrderId } = await createPayPalOrder(
      amountCAD,
      order.id,
      `${product.name} x${qty}`
    );

    // ── Stocker l'ID PayPal dans la commande ────────────────
    await supabase
      .from('orders')
      .update({ paypal_order_id: paypalOrderId })
      .eq('id', order.id);

    // Email client — commande en attente de paiement (fire-and-forget)
    sendOrderReceived({
      customer_name:  customerName.trim(),
      customer_email: customerEmail.trim().toLowerCase(),
      product_name:   product.name,
      qty,
      amount_cad:     amountCAD,
    }).catch(e => console.error('[orders/create] Email non envoyé:', e));

    return res.status(201).json({
      orderId:       order.id,
      paypalOrderId,
      amountCAD,
    });

  } catch (err) {
    console.error('[orders/create]', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
