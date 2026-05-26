// api/stats.js
// GET /api/stats — statistiques de visites (admin seulement)
// POST /api/stats — enregistre une vue de page (public, session_id requis)
// Header GET requis : Authorization: Bearer <ADMIN_SECRET>

import { getSupabase }                  from '../lib/supabase.js';
import { timingSafeEqual, createHash }  from 'crypto';

const ALLOWED_ORIGIN = (process.env.ALLOWED_ORIGIN ?? '*').trim();

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function uniq(rows, key = 'session_id') {
  return new Set(rows.map(r => r[key]).filter(Boolean)).size;
}

const PAGE_LABELS = {
  '/':             'Accueil',
  '/index.html':   'Accueil',
  '/boutique.html':'Boutique',
  '/pierre.html':  'Ma pierre',
  '/histoire.html':'Notre histoire',
  '/pedagogie.html':'Pédagogie',
  '/geologie.html': 'Géologie',
  '/commande.html': 'Commander',
  '/admin.html':    'Admin',
};

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  // ── POST : enregistrement d'une vue de page ────────────
  if (req.method === 'POST') {
    const { page, sku, referrer, session_id } = req.body ?? {};
    if (!session_id) return res.status(200).json({ ok: true });
    try {
      const supabase = getSupabase();
      await supabase.from('page_views').insert({
        page:       String(page       ?? '').slice(0, 200) || '/',
        sku:        sku        ? String(sku).slice(0, 20)  : null,
        referrer:   referrer   ? String(referrer).slice(0, 200) : null,
        session_id: String(session_id).slice(0, 36),
      });
    } catch (_) { /* silencieux */ }
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'GET') return res.status(405).end();

  const auth   = req.headers.authorization ?? '';
  const token  = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const secret = process.env.ADMIN_SECRET ?? '';
  if (!secret || !token) return res.status(401).json({ error: 'Non autorisé' });
  const ha = createHash('sha256').update(token).digest();
  const hb = createHash('sha256').update(secret).digest();
  if (!timingSafeEqual(ha, hb)) return res.status(401).json({ error: 'Non autorisé' });

  try {
    const supabase = getSupabase();
    const now       = new Date();
    const todayISO  = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekISO   = new Date(Date.now() - 7  * 86400000).toISOString();
    const monthISO  = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [rToday, rWeek, rMonth, rTotal, rMonthFull, rTodaySid, rWeekSid, rMonthSid] =
      await Promise.all([
        supabase.from('page_views').select('id',        { count:'exact', head:true }).gte('created_at', todayISO),
        supabase.from('page_views').select('id',        { count:'exact', head:true }).gte('created_at', weekISO),
        supabase.from('page_views').select('id',        { count:'exact', head:true }).gte('created_at', monthISO),
        supabase.from('page_views').select('id',        { count:'exact', head:true }),
        supabase.from('page_views').select('page, sku, referrer, created_at')
                 .gte('created_at', monthISO).order('created_at', { ascending:false }).limit(3000),
        supabase.from('page_views').select('session_id').gte('created_at', todayISO),
        supabase.from('page_views').select('session_id').gte('created_at', weekISO),
        supabase.from('page_views').select('session_id').gte('created_at', monthISO),
      ]);

    const data = rMonthFull.data ?? [];

    // Top pages
    const pageCounts = {};
    data.forEach(r => {
      const p = (r.page ?? '/').replace(/\?.*/, '');
      pageCounts[p] = (pageCounts[p] ?? 0) + 1;
    });
    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([path, n]) => ({ path, label: PAGE_LABELS[path] ?? path, n }));

    // Top produits consultés (via ?sku=)
    const skuCounts = {};
    data.forEach(r => { if (r.sku) skuCounts[r.sku] = (skuCounts[r.sku] ?? 0) + 1; });
    const topProducts = Object.entries(skuCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([sku, n]) => ({ sku, n }));

    // Top référents
    const refCounts = {};
    data.forEach(r => { if (r.referrer) refCounts[r.referrer] = (refCounts[r.referrer] ?? 0) + 1; });
    const topReferrers = Object.entries(refCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([ref, n]) => ({ ref, n }));

    // Visites par jour (7 derniers jours)
    const byDay = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      byDay[d] = 0;
    }
    data.forEach(r => {
      const d = (r.created_at ?? '').slice(0, 10);
      if (d in byDay) byDay[d]++;
    });

    return res.status(200).json({
      views:    { today: rToday.count ?? 0, week: rWeek.count ?? 0, month: rMonth.count ?? 0, total: rTotal.count ?? 0 },
      sessions: { today: uniq(rTodaySid.data ?? []), week: uniq(rWeekSid.data ?? []), month: uniq(rMonthSid.data ?? []) },
      topPages,
      topProducts,
      topReferrers,
      byDay,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
