// lib/paypal.js
// Helpers PayPal Orders API v2 — côté serveur uniquement
// Utilise le fetch natif de Node 18+ (pas de dépendance externe)

const BASE_URL = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

/**
 * Obtient un token d'accès OAuth2 PayPal.
 * @returns {Promise<string>} Bearer token
 */
async function getAccessToken() {
  const clientId     = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Identifiants PayPal manquants dans les variables d\'environnement');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new Error(`Erreur token PayPal: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Crée un ordre PayPal.
 * @param {number} amountCAD  Montant exact en CAD (ex: 12.50)
 * @param {string} reference  Référence interne (ID de commande)
 * @param {string} itemName   Nom du produit affiché au client
 * @returns {Promise<{id: string, approveUrl: string}>}
 */
export async function createPayPalOrder(amountCAD, reference, itemName) {
  const token = await getAccessToken();

  const body = {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: reference,
      description:  `Les Petits Bijoux — ${itemName}`,
      amount: {
        currency_code: 'CAD',
        value: amountCAD.toFixed(2),
      },
    }],
    application_context: {
      brand_name:          'Les Petits Bijoux',
      locale:              'fr-CA',
      landing_page:        'NO_PREFERENCE',
      user_action:         'PAY_NOW',
      return_url:          `${process.env.ALLOWED_ORIGIN}/merci.html`,
      cancel_url:          `${process.env.ALLOWED_ORIGIN}/commande.html`,
    },
  };

  const res = await fetch(`${BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
      'PayPal-Request-Id': reference, // idempotence
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erreur création ordre PayPal: ${res.status} — ${err}`);
  }

  const order = await res.json();
  const approveUrl = order.links?.find(l => l.rel === 'approve')?.href ?? null;
  return { id: order.id, approveUrl };
}

/**
 * Capture les fonds d'un ordre PayPal approuvé.
 * @param {string} paypalOrderId  ID retourné par createPayPalOrder
 * @returns {Promise<{status: string, captureId: string, amount: number}>}
 */
export async function capturePayPalOrder(paypalOrderId) {
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erreur capture PayPal: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

  return {
    status:    data.status,                          // 'COMPLETED'
    captureId: capture?.id ?? null,
    amount:    parseFloat(capture?.amount?.value ?? 0),
  };
}
