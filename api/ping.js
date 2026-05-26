// api/ping.js
// GET  /api/ping — health check + config publique (PayPal client ID)
// POST /api/ping — formulaire de contact → email à l'admin

import { getSupabase }        from '../lib/supabase.js';
import { sendContactMessage } from '../lib/mail.js';

const ALLOWED_ORIGIN = (process.env.ALLOWED_ORIGIN ?? '*').trim();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // ── POST : formulaire de contact ─────────────────────────────
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const { name, email, subject, message, honeypot } = body;

    // Anti-spam basique : champ caché rempli = bot
    if (honeypot) return res.status(200).json({ ok: true });

    if (!name    || String(name).trim().length < 2)        return res.status(400).json({ error: 'Nom invalide' });
    if (!email   || !String(email).includes('@'))           return res.status(400).json({ error: 'Courriel invalide' });
    if (!message || String(message).trim().length < 5)     return res.status(400).json({ error: 'Message trop court' });

    const cleanSubject = String(subject || 'Message général').slice(0, 200);
    const cleanMessage = String(message).slice(0, 2000);

    try {
      await sendContactMessage({
        name:    String(name).trim().slice(0, 100),
        email:   String(email).trim().slice(0, 254),
        subject: cleanSubject,
        message: cleanMessage,
      });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[contact]', err);
      return res.status(500).json({ error: 'Erreur envoi courriel' });
    }
  }

  // ── GET : health check ────────────────────────────────────────
  try {
    const supabase = getSupabase();
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return res.status(200).json({
      ok:             true,
      products:       count,
      ts:             new Date().toISOString(),
      paypalClientId: process.env.PAYPAL_CLIENT_ID ?? null,
      paypalMode:     process.env.PAYPAL_MODE ?? 'sandbox',
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
