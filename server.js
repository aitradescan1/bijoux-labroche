// server.js — Serveur de développement local
// Usage : npm run dev  →  http://localhost:3000

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });   // charge .env.local (gitignored)

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname }       from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Charger tous les handlers API ──────────────────────────
const [
  products,
  ordersCreate,
  ordersCapture,
  adminOrders,
  posScan,
  posVente,
  inventory,
] = await Promise.all([
  import('./api/products.js')        .then(m => m.default),
  import('./api/orders/create.js')   .then(m => m.default),
  import('./api/orders/capture.js')  .then(m => m.default),
  import('./api/admin/orders.js')    .then(m => m.default),
  import('./api/pos/scan.js')        .then(m => m.default),
  import('./api/pos/vente.js')       .then(m => m.default),
  import('./api/inventory/index.js') .then(m => m.default),
]);

// ── App Express ─────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(express.static(__dirname));    // sert index.html, css, assets…

// ── Routes API ──────────────────────────────────────────────
app.get( '/api/products',        products);
app.post('/api/orders/create',   ordersCreate);
app.post('/api/orders/capture',  ordersCapture);
app.get( '/api/admin/orders',    adminOrders);
app.get( '/api/pos/scan',        posScan);
app.post('/api/pos/vente',       posVente);
app.get( '/api/inventory',       inventory);
app.post('/api/inventory',       inventory);

// ── Démarrage ───────────────────────────────────────────────
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log('\n✨  Labroche et Gobeil — Serveur local');
  console.log(`    http://localhost:${PORT}`);
  console.log('\n    Pages :');
  console.log(`    http://localhost:${PORT}/index.html`);
  console.log(`    http://localhost:${PORT}/boutique.html`);
  console.log(`    http://localhost:${PORT}/admin.html`);
  console.log(`    http://localhost:${PORT}/vendre.html?sku=LBG-26-001`);
  console.log('\n    API :');
  console.log(`    GET  http://localhost:${PORT}/api/products`);
  console.log(`    GET  http://localhost:${PORT}/api/pos/scan?sku=LBG-26-001`);
  console.log(`    GET  http://localhost:${PORT}/api/inventory  (Bearer admin1234)`);
  console.log('\n    Admin : mot de passe = ADMIN_SECRET dans .env.local');
  console.log(`    POS   : PIN = POS_PIN dans .env.local\n`);
});
