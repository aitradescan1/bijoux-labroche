-- ============================================================
-- LES PETITS BIJOUX — Schéma Supabase (PostgreSQL)
-- Exécuter ce script dans Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── Activer l'extension UUID ────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Table: products ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sku         TEXT        UNIQUE,                              -- ex: LBG-26-001
  name        TEXT        NOT NULL,
  description TEXT,
  price_cad   NUMERIC(8,2) NOT NULL CHECK (price_cad > 0),
  category    TEXT        NOT NULL DEFAULT 'autre',            -- boucles, collier, bracelet
  image_url   TEXT,
  stock_qty   INTEGER     NOT NULL DEFAULT 0,                  -- unités disponibles
  in_stock    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Table: orders ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name    TEXT    NOT NULL,
  customer_email   TEXT    NOT NULL,
  product_id       UUID    REFERENCES products(id) ON DELETE SET NULL,
  product_name     TEXT    NOT NULL,                        -- snapshot au moment de la commande
  qty              INTEGER NOT NULL DEFAULT 1 CHECK (qty > 0 AND qty <= 20),
  amount_cad       NUMERIC(8,2) NOT NULL CHECK (amount_cad > 0),
  paypal_order_id  TEXT    UNIQUE,                          -- NULL jusqu'au retour PayPal
  status           TEXT    NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending','paid','cancelled','refunded')),
  livraison        TEXT    NOT NULL DEFAULT 'collecte'
                           CHECK (livraison IN ('collecte','poste_sans_suivi','colis_suivi')),
  frais_livraison  NUMERIC(6,2) NOT NULL DEFAULT 0.00,     -- inclus dans amount_cad
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Table: ventes_locales ───────────────────────────────────
-- Ventes en personne (boutique, marché) — décrémente stock_qty
CREATE TABLE IF NOT EXISTS ventes_locales (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID        REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT        NOT NULL,
  qty          INTEGER     NOT NULL CHECK (qty >= 1),
  price_cad    NUMERIC(8,2) NOT NULL CHECK (price_cad > 0),
  paiement     TEXT        NOT NULL DEFAULT 'comptant'
                           CHECK (paiement IN ('comptant','paypal','interac')),
  vendu_par    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders        (status);
CREATE INDEX IF NOT EXISTS idx_orders_email      ON orders        (customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders        (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON products      (category);
CREATE INDEX IF NOT EXISTS idx_products_sku      ON products      (sku);
CREATE INDEX IF NOT EXISTS idx_ventes_created_at ON ventes_locales (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ventes_product_id ON ventes_locales (product_id);

-- ─── Row Level Security ──────────────────────────────────────
-- On utilise la clé Service Role côté API (bypass RLS automatique)
-- RLS empêche tout accès direct non-autorisé si quelqu'un obtient la clé ANON
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders   ENABLE ROW LEVEL SECURITY;

-- La clé anon ne peut lire que les produits en stock
CREATE POLICY "produits_lisibles_publiquement"
  ON products FOR SELECT
  USING (in_stock = TRUE);

-- Aucun accès anon sur orders
CREATE POLICY "orders_acces_refuse_anon"
  ON orders FOR ALL
  USING (FALSE);

-- Aucun accès anon sur ventes_locales
ALTER TABLE ventes_locales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ventes_acces_refuse_anon"
  ON ventes_locales FOR ALL
  USING (FALSE);

-- ─── Données de démonstration ────────────────────────────────
-- Décommenter pour populer la boutique au départ
/*
INSERT INTO products (sku, name, description, price_cad, category, image_url, stock_qty) VALUES
  (
    'LBG-26-001',
    'Boucles d''oreilles Cornaline',
    'Boucles d''oreilles en véritable cornaline naturelle, polie à la main par Nathan & Lyam. '
    'La cornaline est une pierre semi-précieuse chalcédoine d''un orange saumon caractéristique '
    '— pierre de confiance et d''énergie, parfaite pour les petits entrepreneurs ! '
    'Chaque paire est unique, collectée localement. Monture acier inoxydable hypoallergénique.',
    12.00, 'boucles', 'assets/Produits/Boucles/LBG-26-001-boucles-pierre-polie.jpg', 5
  ),
  (
    'LBG-26-002',
    'Collier Pierre Naturelle',
    'Pendentif en pierre naturelle polie, monté sur chaîne dorée 45 cm. Pièce unique.',
    18.00, 'collier', null, 0
  ),
  (
    'LBG-26-003',
    'Bracelet Pierres Polies',
    'Bracelet ajustable avec pierres naturelles polies au tambour. Chaque pièce est différente.',
    12.00, 'bracelet', null, 0
  );
*/
