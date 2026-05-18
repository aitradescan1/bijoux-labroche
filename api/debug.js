// Endpoint de debug TEMPORAIRE — à supprimer après diagnostic
export default async function handler(req, res) {
  const results = {};

  // PayPal credentials
  const clientId     = process.env.PAYPAL_CLIENT_ID ?? '';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET ?? '';
  results.paypal_id_set      = clientId.length > 10;
  results.paypal_secret_set  = clientSecret.length > 10 && !clientSecret.includes('VOTRE');
  results.paypal_mode        = process.env.PAYPAL_MODE;

  // Test token PayPal
  if (results.paypal_id_set && results.paypal_secret_set) {
    try {
      const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const r = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials',
      });
      const d = await r.json();
      results.paypal_token = r.ok ? 'OK' : `ERREUR ${r.status}: ${d.error_description}`;
    } catch (e) {
      results.paypal_token = `EXCEPTION: ${e.message}`;
    }
  } else {
    results.paypal_token = 'SKIP — credentials manquants';
  }

  res.status(200).json(results);
}
