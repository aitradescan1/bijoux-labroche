// api/orders/capture.js
// POST /api/orders/capture
// Capture les fonds PayPal + marque la commande comme payée
// Body: { paypalOrderId }

import { getSupabase }        from '../../lib/supabase.js';
import { capturePayPalOrder } from '../../lib/paypal.js';
import { sendOrderConfirmation } from '../../lib/mail.js';

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? '*';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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

  const { paypalOrderId } = body ?? {};
  if (!paypalOrderId || typeof paypalOrderId !== 'string') {
    return res.status(400).json({ error: 'paypalOrderId manquant' });
  }

  try {
    const supabase = getSupabase();

    // ── Vérifier que la commande existe et est encore pending ──
    const { data: order, error: findErr } = await supabase
      .from('orders')
      .select('*')
      .eq('paypal_order_id', paypalOrderId)
      .eq('status', 'pending')
      .single();

    if (findErr || !order) {
      return res.status(404).json({ error: 'Commande introuvable ou déjà traitée' });
    }

    // ── Capturer les fonds côté PayPal ──────────────────────
    const capture = await capturePayPalOrder(paypalOrderId);

    if (capture.status !== 'COMPLETED') {
      return res.status(402).json({ error: `Paiement non complété: ${capture.status}` });
    }

    // ── Vérifier que le montant capturé correspond ───────────
    // Protection contre la manipulation du montant côté client
    if (Math.abs(capture.amount - parseFloat(order.amount_cad)) > 0.01) {
      console.error('[capture] Montant discordant', { expected: order.amount_cad, got: capture.amount });
      return res.status(400).json({ error: 'Montant incorrect' });
    }

    // ── Mettre à jour le statut en DB ───────────────────────
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', order.id);

    if (updateErr) throw updateErr;

    // ── Envoyer l'email de confirmation à l'adulte ──────────
    // Fire-and-forget : une erreur email ne doit pas bloquer la réponse client
    sendOrderConfirmation({ ...order, status: 'paid' }).catch(e =>
      console.error('[capture] Email non envoyé:', e)
    );

    return res.status(200).json({
      success:    true,
      orderId:    order.id,
      captureId:  capture.captureId,
      amountCAD:  capture.amount,
    });

  } catch (err) {
    console.error('[orders/capture]', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
