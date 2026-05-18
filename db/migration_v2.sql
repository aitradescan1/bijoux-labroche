-- ============================================================
-- LES PETITS BIJOUX — Migration v2 : Inventaire physique
-- Exécuter dans Supabase Dashboard → SQL Editor
-- Idempotent : peut être relancé sans erreur
-- ============================================================

-- ─── 1. Nouvelles colonnes sur products ──────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sku       TEXT,
  ADD COLUMN IF NOT EXISTS stock_qty INTEGER NOT NULL DEFAULT 0;

-- Contrainte UNIQUE sur sku (séparée pour être idempotente)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_sku_key'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_sku_key UNIQUE (sku);
  END IF;
END $$;

-- ─── 2. Table des ventes en boutique ─────────────────────────
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

-- ─── 3. Index ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_sku          ON products       (sku);
CREATE INDEX IF NOT EXISTS idx_ventes_created_at     ON ventes_locales (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ventes_product_id     ON ventes_locales (product_id);

-- ─── 4. RLS pour ventes_locales ──────────────────────────────
ALTER TABLE ventes_locales ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ventes_locales' AND policyname = 'ventes_acces_refuse_anon'
  ) THEN
    EXECUTE 'CREATE POLICY "ventes_acces_refuse_anon" ON ventes_locales FOR ALL USING (FALSE)';
  END IF;
END $$;

-- ─── 5. SKU et description cornaline pour LBG-26-001 ─────────
-- Assigne le SKU au produit boucles existant (si déjà inséré en DB)
UPDATE products
SET
  sku         = 'LBG-26-001',
  description = 'Boucles d''oreilles en véritable cornaline naturelle, polie à la main '
             || 'par Nathan & Lyam. La cornaline est une pierre semi-précieuse chalcédoine '
             || 'd''un orange saumon caractéristique — pierre de confiance et d''énergie, '
             || 'parfaite pour les petits entrepreneurs ! Chaque paire est unique, collectée '
             || 'localement. Monture acier inoxydable hypoallergénique.'
WHERE (image_url LIKE '%LBG-26-001%' OR name ILIKE '%boucles%pierre%')
  AND sku IS NULL;
