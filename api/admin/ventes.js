// api/admin/ventes.js
// GET /api/admin/ventes — liste les ventes boutique (ventes_locales)
// Protégé par Bearer token (ADMIN_SECRET)
// Query params: ?limit=50&offset=0

import { getSupabase } from '../../lib/supabase.js';

const ALLOWED_ORIGIN = (process.env.ALLOWED_ORIGIN ?? '*').trim();
const DEFAULT_LIMIT  = 50;
const MAX_LIMIT      = 200;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function isAuthorized(req) {
  const authHeader = req.headers['authorization'] ?? '';
  const token      = authHeader.replace(/^Bearer\s+/i, '').trim();
  const secret     = process.env.ADMIN_SECRET;
  if (!secret || secret.length < 6) return false;
  if (token.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) {
    diff |= token.charCodeAt(i) ^ secret.charCodeAt(i);
  }
  return diff === 0;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Méthode non autorisée' });

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const rawLimit  = parseInt(req.query?.limit  ?? DEFAULT_LIMIT, 10);
  const rawOffset = parseInt(req.query?.offset ?? 0, 10);
  const limit     = Math.min(isNaN(rawLimit)  ? DEFAULT_LIMIT : Math.max(1, rawLimit),  MAX_LIMIT);
  const offset    = isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);

  try {
    const supabase = getSupabase();

    const { data, error, count } = await supabase
      .from('ventes_locales')
      .select('id, product_name, qty, price_cad, paiement, vendu_par, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return res.status(200).json({ ventes: data, total: count, limit, offset });

  } catch (err) {
    console.error('[admin/ventes]', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
