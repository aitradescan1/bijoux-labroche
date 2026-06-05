// scripts/rapport_journee.mjs
// Génère le rapport de fin de journée pour Nathan & Lyam
// Usage : node scripts/rapport_journee.mjs
//         node scripts/rapport_journee.mjs --date 2026-06-06

import dotenv       from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import nodemailer   from 'nodemailer';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Date de la journée (par défaut = aujourd'hui)
const argDate = process.argv.find(a => /^\d{4}-\d{2}-\d{2}$/.test(a));
const JOUR    = argDate ?? new Date().toISOString().slice(0, 10);
const debutJ  = `${JOUR}T00:00:00+00:00`;
const finJ    = `${JOUR}T23:59:59+00:00`;

console.log(`\n📊  Rapport journée — ${JOUR}\n`);

// ── 1. Ventes en boutique (POS) ───────────────────────────────
const { data: ventes, error: vErr } = await supabase
  .from('ventes_locales')
  .select('id, product_name, qty, price_cad, paiement, vendu_par, created_at, products(sku)')
  .gte('created_at', debutJ)
  .lte('created_at', finJ)
  .order('created_at');

if (vErr) { console.error('Erreur ventes:', vErr.message); process.exit(1); }

// ── 2. Commandes en ligne payées ──────────────────────────────
const { data: commandes, error: cErr } = await supabase
  .from('orders')
  .select('id, product_name, qty, amount_cad, customer_name, created_at, products(sku)')
  .eq('status', 'paid')
  .gte('created_at', debutJ)
  .lte('created_at', finJ)
  .order('created_at');

if (cErr) { console.error('Erreur commandes:', cErr.message); process.exit(1); }

// ── 3. Calculs ────────────────────────────────────────────────
const totalVentes    = ventes.reduce((s, v) => s + parseFloat(v.price_cad) * (v.qty ?? 1), 0);
const totalCommandes = commandes.reduce((s, c) => s + parseFloat(c.amount_cad), 0);
const totalBrut      = totalVentes + totalCommandes;
const partChacun     = totalBrut / 2;

const nathanVentes   = ventes.filter(v => (v.vendu_par ?? '').toLowerCase() === 'nathan');
const lyamVentes     = ventes.filter(v => (v.vendu_par ?? '').toLowerCase() === 'lyam');
const autreVentes    = ventes.filter(v => !['nathan','lyam'].includes((v.vendu_par ?? '').toLowerCase()));

const nathanTotal    = nathanVentes.reduce((s, v) => s + parseFloat(v.price_cad) * (v.qty ?? 1), 0);
const lyamTotal      = lyamVentes.reduce((s, v) => s + parseFloat(v.price_cad) * (v.qty ?? 1), 0);

// ── 4. Rapport console ────────────────────────────────────────
const ligne = '─'.repeat(60);

console.log(`${ligne}`);
console.log(`🏪  VENTES EN BOUTIQUE  (${ventes.length} article${ventes.length > 1 ? 's' : ''})`);
console.log(ligne);
if (ventes.length === 0) {
  console.log('  Aucune vente boutique enregistrée.');
} else {
  for (const v of ventes) {
    const sku   = (v.products?.sku ?? '—').padEnd(14);
    const nom   = (v.product_name ?? '').slice(0, 32).padEnd(33);
    const prix  = `${parseFloat(v.price_cad).toFixed(2)} $`.padStart(8);
    const par   = (v.vendu_par ?? '—').padEnd(8);
    const pmnt  = v.paiement ?? '—';
    console.log(`  ${sku}  ${nom}  ${prix}  par ${par}  (${pmnt})`);
  }
}

console.log(`\n🌐  COMMANDES EN LIGNE  (${commandes.length} commande${commandes.length > 1 ? 's' : ''})`);
console.log(ligne);
if (commandes.length === 0) {
  console.log('  Aucune commande en ligne ce jour.');
} else {
  for (const c of commandes) {
    const sku  = (c.products?.sku ?? '—').padEnd(14);
    const nom  = (c.product_name ?? '').slice(0, 32).padEnd(33);
    const prix = `${parseFloat(c.amount_cad).toFixed(2)} $`.padStart(8);
    console.log(`  ${sku}  ${nom}  ${prix}  → ${c.customer_name}`);
  }
}

console.log(`\n${ligne}`);
console.log(`💰  RÉSUMÉ FINANCIER`);
console.log(ligne);
console.log(`  Ventes boutique   : ${totalVentes.toFixed(2)} $`);
console.log(`  Commandes en ligne: ${totalCommandes.toFixed(2)} $`);
console.log(`  ─────────────────────────────`);
console.log(`  TOTAL BRUT        : ${totalBrut.toFixed(2)} $`);
console.log(`  ─────────────────────────────`);
console.log(`  🏅 Part Nathan    : ${partChacun.toFixed(2)} $  (50% — parts égales)`);
console.log(`  🏅 Part Lyam      : ${partChacun.toFixed(2)} $  (50% — parts égales)`);
console.log(ligne);

// ── 5. Génération HTML imprimable ─────────────────────────────
function lignesVentes(arr, titre, source = 'boutique') {
  if (!arr.length) return `<tr><td colspan="5" style="color:#aaa;text-align:center;padding:12px">Aucune vente</td></tr>`;
  return arr.map(v => {
    const sku   = source === 'boutique' ? (v.products?.sku ?? '—') : (v.products?.sku ?? '—');
    const nom   = source === 'boutique' ? v.product_name : v.product_name;
    const prix  = source === 'boutique' ? parseFloat(v.price_cad) * (v.qty ?? 1) : parseFloat(v.amount_cad);
    const detail = source === 'boutique'
      ? `<em>Vendu par ${v.vendu_par ?? '—'} · ${v.paiement ?? '—'}</em>`
      : `<em>En ligne → ${v.customer_name}</em>`;
    return `<tr>
      <td><code>${sku}</code></td>
      <td>${nom}</td>
      <td style="text-align:right;font-weight:bold">${prix.toFixed(2)} $</td>
      <td>${detail}</td>
    </tr>`;
  }).join('');
}

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport ${JOUR} — Labroche et Gobeil</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 860px; margin: 40px auto; color: #2d1a0a; }
  h1 { font-family: Georgia, serif; color: #1E0D00; margin-bottom: 4px; }
  .subtitle { color: #888; font-size: 14px; margin-bottom: 32px; }
  h2 { font-size: 16px; font-weight: 700; color: #1E0D00; margin: 28px 0 10px;
       border-bottom: 2px solid #C9A84C; padding-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { background: #f5ede0; padding: 8px 10px; text-align: left; }
  td { padding: 7px 10px; border-bottom: 1px solid #f0e8dc; }
  tr:last-child td { border-bottom: none; }
  code { font-size: 12px; color: #888; }
  em { color: #aaa; font-size: 12px; }
  .totaux { display: flex; gap: 20px; margin-top: 32px; flex-wrap: wrap; }
  .box { border: 2px solid #C9A84C; border-radius: 10px; padding: 18px 24px; flex: 1; min-width: 180px; }
  .box .label { font-size: 12px; color: #888; margin-bottom: 4px; }
  .box .montant { font-size: 28px; font-weight: bold; color: #1E0D00; }
  .box.gold { background: #fffbf0; }
  .box.nathan { border-color: #4a90d9; }
  .box.nathan .montant { color: #2a5c99; }
  .box.lyam { border-color: #27ae60; }
  .box.lyam .montant { color: #1a7a42; }
  .footer { margin-top: 40px; font-size: 12px; color: #bbb; border-top: 1px solid #eee; padding-top: 16px; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>

<h1>✨ Labroche et Gobeil — Rapport de journée</h1>
<p class="subtitle">Journée des Petits Entrepreneurs · ${JOUR} · Généré le ${new Date().toLocaleString('fr-CA')}</p>

<h2>🏪 Ventes en boutique (${ventes.length} articles)</h2>
<table>
  <thead><tr><th>SKU</th><th>Produit</th><th>Prix</th><th>Détail</th></tr></thead>
  <tbody>${lignesVentes(ventes, 'boutique', 'boutique')}</tbody>
</table>

<h2>🌐 Commandes en ligne (${commandes.length} commandes)</h2>
<table>
  <thead><tr><th>SKU</th><th>Produit</th><th>Montant</th><th>Détail</th></tr></thead>
  <tbody>${lignesVentes(commandes, 'en ligne', 'online')}</tbody>
</table>

<div class="totaux">
  <div class="box gold">
    <div class="label">TOTAL BRUT</div>
    <div class="montant">${totalBrut.toFixed(2)} $</div>
    <div style="font-size:12px;color:#888;margin-top:4px">${ventes.length + commandes.length} ventes au total</div>
  </div>
  <div class="box nathan">
    <div class="label">🏅 PART DE NATHAN</div>
    <div class="montant">${partChacun.toFixed(2)} $</div>
    <div style="font-size:12px;color:#888;margin-top:4px">50% du total — parts égales</div>
  </div>
  <div class="box lyam">
    <div class="label">🏅 PART DE LYAM</div>
    <div class="montant">${partChacun.toFixed(2)} $</div>
    <div style="font-size:12px;color:#888;margin-top:4px">50% du total — parts égales</div>
  </div>
</div>

<p class="footer">
  Rapport généré automatiquement · Labroche et Gobeil · ${process.env.EMAIL_DESTINATAIRE ?? ''}<br>
  Partage 50/50 calculé sur le total brut — ventes boutique + commandes en ligne.
</p>

</body>
</html>`;

// Sauvegarder le HTML
const htmlPath = join(ROOT, `rapport-${JOUR}.html`);
writeFileSync(htmlPath, html, 'utf8');
console.log(`\n📄  Rapport HTML : ${htmlPath}`);

// ── 6. Envoi par email ────────────────────────────────────────
if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD },
  });

  await transporter.sendMail({
    from: `"Labroche et Gobeil ✨" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_DESTINATAIRE,
    subject: `📊 Rapport journée ${JOUR} — Total ${totalBrut.toFixed(2)} $ · Nathan & Lyam`,
    html,
  });
  console.log(`✅  Email envoyé à ${process.env.EMAIL_DESTINATAIRE}`);
}

console.log('\n🎉  Rapport complet !');
