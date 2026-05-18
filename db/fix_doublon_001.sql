-- ============================================================
-- FIX : doublon LBG-26-001 → renommer en LBG-26-012
-- Coller dans Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Étape 1 : voir les deux entrées (diagnostic)
SELECT id, sku, name, image_url, stock_qty, created_at
FROM products
WHERE sku = 'LBG-26-001'
ORDER BY created_at;

-- Étape 2 : renommer le PLUS RÉCENT en LBG-26-012
-- (celui ajouté par la migration mai 2026 = image cornaline-saumon)
UPDATE products
SET sku  = 'LBG-26-012',
    name = 'Boucles d''oreilles Cornaline Saumon'
WHERE sku = 'LBG-26-001'
  AND ctid = (
    SELECT ctid FROM products
    WHERE sku = 'LBG-26-001'
    ORDER BY created_at DESC
    LIMIT 1
  );

-- Étape 3 : vérification finale — doit afficher 12 produits sans doublon
SELECT sku, name, stock_qty, price_cad
FROM products
ORDER BY sku;
