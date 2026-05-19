// api/ping.js
// GET /api/ping — health check public, garde Supabase actif
// Appelé automatiquement par GitHub Actions toutes les 48h

import { getSupabase } from '../lib/supabase.js';

const ALLOWED_ORIGIN = (process.env.ALLOWED_ORIGIN ?? '*').trim();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const supabase = getSupabase();
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return res.status(200).json({
      ok:       true,
      products: count,
      ts:       new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
