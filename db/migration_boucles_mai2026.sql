-- ============================================================
-- BOUCLES D'OREILLES — Mai 2026
-- Coller dans Supabase Dashboard → SQL Editor → Run
-- ============================================================

INSERT INTO products (sku, name, description, price_cad, category, image_url, stock_qty, in_stock)
VALUES

-- LBG-26-001 : Cornaline Saumon
(
  'LBG-26-001',
  'Boucles d''oreilles Cornaline Saumon',
  'La cornaline est une pierre semi-précieuse de la famille des calcédoines, reconnaissable à ses teintes chaleureuses allant de l''orange doux au saumon nacré. Polies à la main par Nathan et Lyam, ces boucles en clous révèlent toute la profondeur de cette pierre millénaire, symbole de vitalité et de confiance en soi. Chaque paire est unique, récoltée et polie localement. Monture en acier inoxydable hypoallergénique.',
  12.00, 'boucles',
  'assets/Produits/Boucles/LBG-26-001-boucles-cornaline-saumon.jpg',
  1, TRUE
),

-- LBG-26-002 : Cornaline Rouge (2 paires)
(
  'LBG-26-002',
  'Boucles d''oreilles Cornaline Rouge',
  'Plus intense que sa cousine saumon, la cornaline rouge arbore des teintes profondes entre l''orange brûlé et le rouge brique — une pierre de feu et d''énergie. Nathan et Lyam ont sélectionné deux paires assorties dans le même type de pierre pour vous offrir ce bijou chaleureux et unique. Clous en pierre naturelle polie, monture en acier inoxydable hypoallergénique.',
  12.00, 'boucles',
  'assets/Produits/Boucles/LBG-26-002-boucles-cornaline-rouge.jpg',
  2, TRUE
),

-- LBG-26-003 : Aventurine Verte
(
  'LBG-26-003',
  'Boucles d''oreilles Aventurine Verte',
  'L''aventurine verte, surnommée «la pierre du gagnant», est réputée pour attirer la chance et apaiser l''esprit. Ses reflets scintillants caractéristiques — appelés aventurescence — donnent l''impression que de la lumière est capturée à l''intérieur même de la pierre. Ces clous d''oreilles apportent une touche de verdure et de bonne énergie à n''importe quelle tenue. Polis avec soin par Nathan et Lyam. Monture hypoallergénique. Pièce unique.',
  10.00, 'boucles',
  'assets/Produits/Boucles/LBG-26-003-boucles-aventurine.jpg',
  1, TRUE
),

-- LBG-26-004 : Jaspe Dalmatien
(
  'LBG-26-004',
  'Boucles d''oreilles Jaspe Dalmatien',
  'Reconnaissable à ses taches sombres sur fond gris-crème, le jaspe dalmatien rappelle la robe du célèbre chien — d''où son nom poétique. Chaque inclusion est unique, créant un motif organique naturel qu''aucun bijoutier ne pourrait reproduire à l''identique. Une pierre joyeuse et ludique, polie à la main par Nathan et Lyam. Monture en acier inoxydable hypoallergénique. Pièce unique.',
  10.00, 'boucles',
  'assets/Produits/Boucles/LBG-26-004-boucles-jaspe-dalmatien.jpg',
  1, TRUE
),

-- LBG-26-005 : Pierre Miel
(
  'LBG-26-005',
  'Boucles d''oreilles Pierre Miel',
  'Dorée comme le miel et translucide comme la lumière d''automne, cette pierre naturelle captive par sa chaleur lumineuse et sa profondeur. Chaque rayon de lumière la traverse différemment, révélant des nuances de doré, d''ambre et de caramel. Un bijou qui réchauffe autant le regard que le cœur. Poli avec amour par Nathan et Lyam. Monture en acier inoxydable hypoallergénique. Pièce unique.',
  12.00, 'boucles',
  'assets/Produits/Boucles/LBG-26-005-boucles-pierre-miel.jpg',
  1, TRUE
),

-- LBG-26-006 : Jaspe Brun
(
  'LBG-26-006',
  'Boucles d''oreilles Jaspe Brun',
  'Le jaspe est l''une des pierres les plus anciennes utilisées en joaillerie — portée depuis l''Antiquité pour son ancrage et sa stabilité. Ces clous aux teintes terreuses brun-caramel rappellent la chaleur de la terre, de l''argile et des bois automnaux. Un bijou discret et authentique pour ceux qui aiment la nature. Polis par Nathan et Lyam. Monture hypoallergénique. Pièce unique.',
  10.00, 'boucles',
  'assets/Produits/Boucles/LBG-26-006-boucles-jaspe-brun.jpg',
  1, TRUE
),

-- LBG-26-007 : Chalcédoine Gris-Bleu
(
  'LBG-26-007',
  'Boucles d''oreilles Chalcédoine Gris-Bleu',
  'La chalcédoine gris-bleutée dégage une élégance sobre et intemporelle. Ses teintes douces — quelque part entre le ciel nuageux et l''eau calme d''un lac — s''harmonisent naturellement avec toute tenue, du quotidien au soir. Une pierre de communication et de sérénité. Polie à la main par Nathan et Lyam. Monture en acier inoxydable hypoallergénique. Pièce unique.',
  10.00, 'boucles',
  'assets/Produits/Boucles/LBG-26-007-boucles-calcedoine-gris.jpg',
  1, TRUE
),

-- LBG-26-008 : Jaspe Rouge
(
  'LBG-26-008',
  'Boucles d''oreilles Jaspe Rouge',
  'Pierre de force et de courage portée depuis l''Antiquité par les guerriers et les explorateurs, le jaspe rouge inspire la persévérance et la vitalité. Ces clous arborent des teintes profondes entre le brun chaud et le rouge brique, avec des nuances naturelles qui donnent à chaque paire son caractère propre. Polis par Nathan et Lyam. Monture en acier inoxydable hypoallergénique. Pièce unique.',
  10.00, 'boucles',
  'assets/Produits/Boucles/LBG-26-008-boucles-jaspe-rouge.jpg',
  1, TRUE
),

-- LBG-26-009 : Amazonite
(
  'LBG-26-009',
  'Boucles d''oreilles Amazonite',
  'Surnommée «la pierre de l''espoir et de la vérité», l''amazonite séduit par ses teintes turquoise-vert pâle apaisantes qui rappellent les eaux claires d''une rivière au printemps ou les glaces fondantes d''un glacier nordique. Ces clous d''oreilles discrets et délicats apportent une touche de fraîcheur et de sérénité. Polis avec amour par Nathan et Lyam. Monture hypoallergénique. Pièce unique.',
  12.00, 'boucles',
  'assets/Produits/Boucles/LBG-26-009-boucles-amazonite.jpg',
  1, TRUE
),

-- LBG-26-010 : Pendantes Pierre & Chaîne Dorée
(
  'LBG-26-010',
  'Boucles d''oreilles Pendantes Pierre & Chaîne Dorée',
  'Ces boucles d''oreilles pendantes allient la chaleur d''une pierre naturelle brune polie au brillant d''une monture et chaîne dorées. Le mouvement délicat de la chaîne donne vie au bijou, qui capte et reflète la lumière à chaque geste. Plus élaborées que nos clous classiques, ces pendantes sont parfaites pour une occasion spéciale ou pour se faire plaisir au quotidien. Création artisanale de Nathan et Lyam. Acier inoxydable doré, pierre naturelle. Pièce unique.',
  12.00, 'boucles',
  'assets/Produits/Boucles/LBG-26-010-boucles-pendantes-dorees.jpg',
  1, TRUE
),

-- LBG-26-011 : Pendantes Plume & Cœur
(
  'LBG-26-011',
  'Boucles d''oreilles Pendantes Plume & Cœur',
  'Pièce phare de la collection Labroche et Gobeil — ces boucles d''oreilles pendantes associent la légèreté symbolique d''une plume en métal finement ciselé et la douceur d''un cœur en pierre naturelle tachetée. La plume évoque la liberté et la créativité ; le cœur en pierre, l''authenticité et l''amour de la nature. Un bijou artisanal unique qui raconte une histoire : celle de Nathan et Lyam, deux jeunes créateurs passionnés. Monture en acier inoxydable. Pièce unique.',
  12.00, 'boucles',
  'assets/Produits/Boucles/LBG-26-011-boucles-pendantes-plume.jpg',
  1, TRUE
)

ON CONFLICT (sku) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cad   = EXCLUDED.price_cad,
  image_url   = EXCLUDED.image_url,
  stock_qty   = EXCLUDED.stock_qty,
  in_stock    = EXCLUDED.in_stock;
