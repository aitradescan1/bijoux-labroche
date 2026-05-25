// api/track.js
// POST /api/track — enregistre une vue de page (appelé côté client sur chaque page)

import { getSupabase } from '../lib/supabase.js';

const ALLOWED_ORIGIN = (process.env.ALLOWED_ORIGIN ?? '*').trim();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).end();

  const { page, sku, referrer, session_id } = req.body ?? {};

  // Ignorer les bots évidents (pas de session_id)
  if (!session_id) return res.status(200).json({ ok: true });

  try {
    const supabase = getSupabase();
    await supabase.from('page_views').insert({
      page:       String(page       ?? '').slice(0, 200) || '/',
      sku:        sku        ? String(sku).slice(0, 20)  : null,
      referrer:   referrer   ? String(referrer).slice(0, 200) : null,
      session_id: String(session_id).slice(0, 36),
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    // Silencieux côté client — ne pas casser le site si la table n'existe pas encore
    return res.status(200).json({ ok: false });
  }
}
