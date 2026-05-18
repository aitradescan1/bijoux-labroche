// lib/mail.js
// Pipeline email complet — Labroche et Gobeil
// Tous les emails passent par Gmail SMTP (App Password requis)

import nodemailer from 'nodemailer';

const SITE_URL  = process.env.ALLOWED_ORIGIN ?? 'https://aitradescan1.github.io/bijoux-labroche';
const ADMIN_URL = `${SITE_URL}/admin.html`;
const FROM      = `"Labroche et Gobeil ✨" <${process.env.EMAIL_USER}>`;

function transporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD },
  });
}

function send(opts) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) return Promise.resolve();
  return transporter().sendMail({ from: FROM, ...opts });
}

// ── Styles partagés ──────────────────────────────────────────────
const CSS = `
  body{margin:0;padding:0;background:#FFF8F0;font-family:Arial,sans-serif}
  .wrap{max-width:560px;margin:0 auto;background:#fff;border-radius:16px;
        overflow:hidden;box-shadow:0 4px 24px rgba(60,20,0,.10)}
  .header{background:linear-gradient(135deg,#1E0D00,#3A1F0D);
          padding:32px 32px 24px;text-align:center}
  .header h1{color:#C9A84C;font-size:22px;margin:0 0 4px;font-family:Georgia,serif}
  .header p{color:#d4b882;font-size:13px;margin:0}
  .body{padding:32px}
  .body h2{color:#1E0D00;font-size:18px;margin:0 0 16px}
  .body p{color:#3A1F0D;font-size:15px;line-height:1.6;margin:0 0 12px}
  .card{background:#FFF8F0;border-radius:12px;padding:20px 24px;margin:20px 0}
  .card table{width:100%;border-collapse:collapse}
  .card td{padding:6px 0;font-size:14px;color:#3A1F0D;vertical-align:top}
  .card td:first-child{color:#8A6555;width:140px;font-weight:600}
  .btn{display:inline-block;background:linear-gradient(135deg,#C9A84C,#d4a017);
       color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;
       font-weight:600;font-size:15px;margin:16px 0}
  .footer{background:#F5EDE0;padding:20px 32px;text-align:center;
          font-size:12px;color:#8A6555;border-top:1px solid #e8ddd0}
  .badge{display:inline-block;background:#FFF8F0;border:1px solid #C9A84C;
         color:#8a6200;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:600}
`;

function layout(content, footer = '') {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>${CSS}</style></head><body>
  <div style="padding:24px 16px;background:#FFF8F0">
  <div class="wrap">
    <div class="header">
      <h1>✨ Labroche et Gobeil</h1>
      <p>Bijoux en pierres naturelles · Fait à la main</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      © 2026 Labroche et Gobeil &nbsp;·&nbsp; Nathan &amp; Lyam
      ${footer ? `<br>${footer}` : ''}
    </div>
  </div></div></body></html>`;
}

const LIVRAISON_LABEL = {
  collecte:         '📍 Ramassage à l\'adresse (gratuit)',
  poste_sans_suivi: '📬 Canada Post — Lettermail (sans suivi, +3,50 $)',
  colis_suivi:      '📦 Canada Post — Colis avec suivi (+14,95 $)',
};

function orderCard(o) {
  const livraisonLabel = o.livraison ? (LIVRAISON_LABEL[o.livraison] ?? o.livraison) : null;
  return `<div class="card"><table>
    <tr><td>Produit</td><td><strong>${o.product_name}</strong></td></tr>
    <tr><td>Quantité</td><td>${o.qty}</td></tr>
    ${livraisonLabel ? `<tr><td>Livraison</td><td>${livraisonLabel}</td></tr>` : ''}
    <tr><td>Montant total</td><td><strong>${Number(o.amount_cad).toFixed(2)} $CAD</strong></td></tr>
    ${o.customer_name  ? `<tr><td>Client</td><td>${o.customer_name}</td></tr>` : ''}
    ${o.customer_email ? `<tr><td>Courriel</td><td>${o.customer_email}</td></tr>` : ''}
    ${o.paypal_order_id ? `<tr><td>Réf. PayPal</td><td style="font-size:12px">${o.paypal_order_id}</td></tr>` : ''}
  </table></div>`;
}

// ════════════════════════════════════════════════════════════════
// 1. Commande créée — email au CLIENT (avant paiement)
// ════════════════════════════════════════════════════════════════
export function sendOrderReceived(order) {
  return send({
    to:      order.customer_email,
    subject: `🛍️ Commande reçue — ${order.product_name}`,
    html: layout(`
      <h2>On a bien reçu ta commande !</h2>
      <p>Bonjour <strong>${order.customer_name}</strong>,</p>
      <p>Merci de ton intérêt pour nos bijoux ✨<br>
         Ta commande est enregistrée — complète le paiement PayPal pour la confirmer.</p>
      ${orderCard(order)}
      <p style="color:#8A6555;font-size:13px">
        Si tu n'as pas passé cette commande, ignore simplement ce message.
      </p>
    `, 'Questions ? Réponds à ce courriel.')
  });
}

// ════════════════════════════════════════════════════════════════
// 2a. Paiement confirmé — email au CLIENT
// ════════════════════════════════════════════════════════════════
export function sendPaymentConfirmedClient(order) {
  return send({
    to:      order.customer_email,
    subject: `💛 Paiement reçu — Labroche et Gobeil`,
    html: layout(`
      <h2>Paiement confirmé, merci !</h2>
      <p>Bonjour <strong>${order.customer_name}</strong>,</p>
      <p>Ton paiement a été reçu avec succès.<br>
         Nathan et Lyam préparent ton bijou avec soin — tu recevras un message dès qu'il sera prêt !</p>
      ${orderCard(order)}
      <p>✋ <em>Chaque pièce est faite à la main — merci pour ta patience et ton soutien !</em></p>
    `, 'Questions ? Réponds à ce courriel.')
  });
}

// ════════════════════════════════════════════════════════════════
// 2b. Paiement confirmé — email à l'ADMIN
// ════════════════════════════════════════════════════════════════
export function sendPaymentConfirmedAdmin(order) {
  return send({
    to:      process.env.EMAIL_DESTINATAIRE,
    subject: `💰 Vente en ligne — ${order.customer_name} · ${Number(order.amount_cad).toFixed(2)} $`,
    html: layout(`
      <h2>Nouvelle vente en ligne !</h2>
      <p>Un paiement PayPal vient d'être confirmé.</p>
      ${orderCard(order)}
      <a class="btn" href="${ADMIN_URL}">Voir dans l'admin →</a>
    `)
  });
}

// ════════════════════════════════════════════════════════════════
// 3. Vente au POS — email à l'ADMIN seulement
// ════════════════════════════════════════════════════════════════
export function sendVentePOS(vente) {
  const paiementLabel = { comptant: '💵 Comptant', interac: '📱 Interac', paypal: '🅿️ PayPal' };
  return send({
    to:      process.env.EMAIL_DESTINATAIRE,
    subject: `🏪 Vente boutique — ${vente.product_name} · ${Number(vente.price_cad).toFixed(2)} $`,
    html: layout(`
      <h2>Vente en boutique enregistrée</h2>
      <div class="card"><table>
        <tr><td>Produit</td><td><strong>${vente.product_name}</strong></td></tr>
        <tr><td>Quantité</td><td>${vente.qty}</td></tr>
        <tr><td>Montant</td><td><strong>${Number(vente.price_cad).toFixed(2)} $CAD</strong></td></tr>
        <tr><td>Paiement</td><td>${paiementLabel[vente.paiement] ?? vente.paiement}</td></tr>
        <tr><td>Vendu par</td><td>${vente.vendu_par ?? '—'}</td></tr>
      </table></div>
      <a class="btn" href="${ADMIN_URL}">Voir l'inventaire →</a>
    `)
  });
}

// ════════════════════════════════════════════════════════════════
// 4. Commande prête — email au CLIENT
// ════════════════════════════════════════════════════════════════
export function sendOrderReady(order) {
  return send({
    to:      order.customer_email,
    subject: `🎁 Ton bijou est prêt ! — Labroche et Gobeil`,
    html: layout(`
      <h2>Ton bijou est prêt !</h2>
      <p>Bonjour <strong>${order.customer_name}</strong>,</p>
      <p>Bonne nouvelle — <strong>${order.product_name}</strong> est prêt pour toi !</p>
      <p>Contacte-nous pour organiser la livraison ou la remise en mains propres.</p>
      ${orderCard(order)}
      <a class="btn" href="mailto:${process.env.EMAIL_USER}">Nous contacter →</a>
    `, 'Questions ? Réponds à ce courriel.')
  });
}
