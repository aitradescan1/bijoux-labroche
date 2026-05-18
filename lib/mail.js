// lib/mail.js
// Envoi d'emails de confirmation via Nodemailer + Gmail App Password

import nodemailer from 'nodemailer';

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
}

/**
 * Notifie l'adulte responsable d'une nouvelle commande payée.
 * @param {Object} order  Ligne de la table orders
 */
export async function sendOrderConfirmation(order) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) return; // Skip si non configuré

  const transporter = getTransporter();

  await transporter.sendMail({
    from:    `"Les Petits Bijoux" <${process.env.EMAIL_USER}>`,
    to:      process.env.EMAIL_DESTINATAIRE,
    subject: `💎 Nouvelle commande payée — ${order.customer_name}`,
    html: `
      <h2>Nouvelle commande reçue !</h2>
      <table cellpadding="6" style="border-collapse:collapse">
        <tr><td><strong>Client</strong></td><td>${order.customer_name}</td></tr>
        <tr><td><strong>Email</strong></td><td>${order.customer_email}</td></tr>
        <tr><td><strong>Produit</strong></td><td>${order.product_name}</td></tr>
        <tr><td><strong>Quantité</strong></td><td>${order.qty}</td></tr>
        <tr><td><strong>Montant</strong></td><td><strong>${order.amount_cad} $CAD</strong></td></tr>
        <tr><td><strong>ID PayPal</strong></td><td>${order.paypal_order_id}</td></tr>
      </table>
      <p style="margin-top:16px">Connecte-toi à <a href="${process.env.ALLOWED_ORIGIN}/admin.html">l'admin</a> pour voir toutes les commandes.</p>
    `,
  });
}
