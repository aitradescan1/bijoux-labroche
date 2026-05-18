-- ============================================================
-- MIGRATION — Ajout des colonnes de livraison sur orders
-- Exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS livraison TEXT NOT NULL DEFAULT 'collecte'
    CHECK (livraison IN ('collecte', 'poste_sans_suivi', 'colis_suivi'));

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS frais_livraison NUMERIC(6,2) NOT NULL DEFAULT 0.00;

COMMENT ON COLUMN orders.livraison IS
  'Mode de livraison: collecte = ramassage à l''adresse (gratuit), '
  'poste_sans_suivi = Lettermail Canada Post ($3.50), '
  'colis_suivi = Colis Expedited Canada Post ($14.95)';

COMMENT ON COLUMN orders.frais_livraison IS
  'Frais de livraison inclus dans amount_cad (référence seulement)';

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS rabais NUMERIC(6,2) NOT NULL DEFAULT 0.00;

COMMENT ON COLUMN orders.rabais IS
  'Rabais automatique de 5,00$ appliqué quand sous-total articles >= 35,00$ (déjà déduit de amount_cad)';
