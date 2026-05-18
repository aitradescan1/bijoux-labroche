// scripts/setup_produits_mai2026.mjs
// Correction one-shot : supprime TEST, met à jour 001, insère 002-011
// node scripts/setup_produits_mai2026.mjs

import { createClient } from '@supabase/supabase-js';
import dotenv           from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// ── 1. Supprimer le produit test ──────────────────────────
console.log('🗑️  Suppression LBG-TEST-001...');
await supabase.from('products').delete().eq('sku', 'LBG-TEST-001');

// ── 2. Mettre à jour LBG-26-001 ──────────────────────────
console.log('✏️  Mise à jour LBG-26-001...');
await supabase.from('products').update({
  name:        'Boucles d\'oreilles Cornaline Saumon',
  description: 'La cornaline est une pierre semi-précieuse de la famille des calcédoines, reconnaissable à ses teintes chaleureuses allant de l\'orange doux au saumon nacré. Polies à la main par Nathan et Lyam, ces boucles en clous révèlent toute la profondeur de cette pierre millénaire — symbole de vitalité et de confiance en soi. Monture en acier inoxydable hypoallergénique. Pièce unique, récoltée localement.',
  price_cad:   12.00,
  image_url:   'assets/Produits/Boucles/LBG-26-001-boucles-cornaline-saumon.jpg',
  stock_qty:   1,
  in_stock:    true,
}).eq('sku', 'LBG-26-001');

// ── 3. Nouveaux produits ──────────────────────────────────
const PRODUITS = [
  {
    sku:         'LBG-26-002',
    name:        'Boucles d\'oreilles Cornaline Rouge',
    description: 'Plus intense que sa cousine saumon, la cornaline rouge arbore des teintes profondes entre l\'orange brûlé et le rouge brique — une pierre de feu et d\'énergie. Nathan et Lyam ont sélectionné deux paires assorties dans le même type de pierre. Clous en pierre naturelle polie, monture en acier inoxydable hypoallergénique.',
    price_cad:   12.00,
    category:    'boucles',
    image_url:   'assets/Produits/Boucles/LBG-26-002-boucles-cornaline-rouge.jpg',
    stock_qty:   2,
    in_stock:    true,
  },
  {
    sku:         'LBG-26-003',
    name:        'Boucles d\'oreilles Aventurine Verte',
    description: 'L\'aventurine verte, surnommée «la pierre du gagnant», est réputée pour attirer la chance et apaiser l\'esprit. Ses reflets scintillants — l\'aventurescence — donnent l\'impression que de la lumière est capturée à l\'intérieur même de la pierre. Polis par Nathan et Lyam. Monture hypoallergénique. Pièce unique.',
    price_cad:   10.00,
    category:    'boucles',
    image_url:   'assets/Produits/Boucles/LBG-26-003-boucles-aventurine.jpg',
    stock_qty:   1,
    in_stock:    true,
  },
  {
    sku:         'LBG-26-004',
    name:        'Boucles d\'oreilles Jaspe Dalmatien',
    description: 'Reconnaissable à ses taches sombres sur fond gris-crème, le jaspe dalmatien rappelle la robe du célèbre chien — d\'où son nom poétique. Chaque tache est unique, une empreinte naturelle qu\'aucun bijoutier ne pourrait reproduire. Poli à la main par Nathan et Lyam. Monture hypoallergénique. Pièce unique.',
    price_cad:   10.00,
    category:    'boucles',
    image_url:   'assets/Produits/Boucles/LBG-26-004-boucles-jaspe-dalmatien.jpg',
    stock_qty:   1,
    in_stock:    true,
  },
  {
    sku:         'LBG-26-005',
    name:        'Boucles d\'oreilles Pierre Miel',
    description: 'Dorée comme le miel et translucide comme la lumière d\'automne, cette pierre naturelle captive par sa chaleur lumineuse. Chaque rayon de lumière la traverse différemment, révélant des nuances de doré, d\'ambre et de caramel. Poli avec amour par Nathan et Lyam. Monture en acier inoxydable hypoallergénique. Pièce unique.',
    price_cad:   12.00,
    category:    'boucles',
    image_url:   'assets/Produits/Boucles/LBG-26-005-boucles-pierre-miel.jpg',
    stock_qty:   1,
    in_stock:    true,
  },
  {
    sku:         'LBG-26-006',
    name:        'Boucles d\'oreilles Jaspe Brun',
    description: 'Le jaspe est l\'une des pierres les plus anciennes utilisées en joaillerie, réputé pour son ancrage et sa stabilité. Ces clous aux teintes terreuses brun-caramel rappellent la chaleur de la terre et des bois automnaux. Polis par Nathan et Lyam. Monture hypoallergénique. Pièce unique.',
    price_cad:   10.00,
    category:    'boucles',
    image_url:   'assets/Produits/Boucles/LBG-26-006-boucles-jaspe-brun.jpg',
    stock_qty:   1,
    in_stock:    true,
  },
  {
    sku:         'LBG-26-007',
    name:        'Boucles d\'oreilles Chalcédoine Gris-Bleu',
    description: 'La chalcédoine gris-bleutée dégage une élégance sobre et intemporelle. Ses teintes douces — quelque part entre le ciel nuageux et l\'eau calme d\'un lac — s\'harmonisent avec toute tenue, du quotidien au soir. Polie à la main par Nathan et Lyam. Monture hypoallergénique. Pièce unique.',
    price_cad:   10.00,
    category:    'boucles',
    image_url:   'assets/Produits/Boucles/LBG-26-007-boucles-calcedoine-gris.jpg',
    stock_qty:   1,
    in_stock:    true,
  },
  {
    sku:         'LBG-26-008',
    name:        'Boucles d\'oreilles Jaspe Rouge',
    description: 'Portée depuis l\'Antiquité comme pierre de force et de courage, le jaspe rouge inspire la persévérance. Ces clous arborent des teintes profondes entre le brun chaud et le rouge brique, avec des nuances naturelles propres à chaque paire. Polis par Nathan et Lyam. Monture hypoallergénique. Pièce unique.',
    price_cad:   10.00,
    category:    'boucles',
    image_url:   'assets/Produits/Boucles/LBG-26-008-boucles-jaspe-rouge.jpg',
    stock_qty:   1,
    in_stock:    true,
  },
  {
    sku:         'LBG-26-009',
    name:        'Boucles d\'oreilles Amazonite',
    description: 'Surnommée «la pierre de l\'espoir», l\'amazonite séduit par ses teintes turquoise-vert pâle qui rappellent les eaux claires d\'une rivière au printemps. Ces clous délicats apportent fraîcheur et sérénité à tout style. Polis avec amour par Nathan et Lyam. Monture hypoallergénique. Pièce unique.',
    price_cad:   12.00,
    category:    'boucles',
    image_url:   'assets/Produits/Boucles/LBG-26-009-boucles-amazonite.jpg',
    stock_qty:   1,
    in_stock:    true,
  },
  {
    sku:         'LBG-26-010',
    name:        'Boucles d\'oreilles Pendantes Pierre & Chaîne Dorée',
    description: 'Ces boucles pendantes allient la chaleur d\'une pierre naturelle brune au brillant d\'une chaîne dorée. Le mouvement délicat de la chaîne donne vie au bijou, qui capte la lumière à chaque geste. Parfaites pour une occasion spéciale ou se faire plaisir au quotidien. Création artisanale de Nathan et Lyam. Pièce unique.',
    price_cad:   12.00,
    category:    'boucles',
    image_url:   'assets/Produits/Boucles/LBG-26-010-boucles-pendantes-dorees.jpg',
    stock_qty:   1,
    in_stock:    true,
  },
  {
    sku:         'LBG-26-011',
    name:        'Boucles d\'oreilles Pendantes Plume & Cœur',
    description: 'Pièce phare de la collection Labroche et Gobeil — ces pendantes associent la légèreté d\'une plume en métal ciselé et la douceur d\'un cœur en pierre naturelle tachetée. La plume évoque la liberté, le cœur l\'authenticité. Un bijou artisanal unique signé Nathan et Lyam. Monture en acier inoxydable. Pièce unique.',
    price_cad:   12.00,
    category:    'boucles',
    image_url:   'assets/Produits/Boucles/LBG-26-011-boucles-pendantes-plume.jpg',
    stock_qty:   1,
    in_stock:    true,
  },
];

console.log(`📦  Insertion de ${PRODUITS.length} produits...`);
const { error } = await supabase.from('products').insert(PRODUITS);
if (error) {
  console.error('❌  Erreur insertion:', error.message);
  process.exit(1);
}

// ── 4. Résumé final ───────────────────────────────────────
const { data: tous } = await supabase
  .from('products').select('sku, name, price_cad, stock_qty').order('sku');

console.log(`\n✅  Terminé — ${tous.length} produits en base:\n`);
for (const p of tous) {
  console.log(`  ${p.sku.padEnd(14)} ${p.name.slice(0,45).padEnd(47)} ${String(p.price_cad).padStart(5)} $  stock: ${p.stock_qty}`);
}
console.log('');
