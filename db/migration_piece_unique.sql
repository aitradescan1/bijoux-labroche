-- Migration: variable d'unicité par produit
-- Exécuter dans Supabase Dashboard → SQL Editor (une seule fois)
--
-- piece_unique = true  → la photo montre exactement la pièce que le client reçoit
-- piece_unique = false → photo représentative, lot de plusieurs paires similaires

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS piece_unique BOOLEAN NOT NULL DEFAULT true;

-- Anciens lots groupés créés avant la règle "1 photo = 1 SKU" (mai 2026)
UPDATE products
SET piece_unique = false
WHERE sku IN ('LBG-26-002', 'LBG-26-008', 'LBG-26-012', 'LBG-26-013', 'LBG-26-014');
