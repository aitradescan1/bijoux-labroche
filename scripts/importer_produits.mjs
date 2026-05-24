// scripts/importer_produits.mjs
// Scanne assets/Produits/ et insère automatiquement les nouveaux produits dans Supabase
// Usage:
//   node scripts/importer_produits.mjs             → importe les nouveaux
//   node scripts/importer_produits.mjs --dry-run   → affiche sans insérer
//   node scripts/importer_produits.mjs --list      → liste tous les produits en base

import { createClient } from '@supabase/supabase-js';
import dotenv           from 'dotenv';
import { readdirSync, existsSync, writeFileSync } from 'fs';
import { join, extname, basename } from 'path';
import { fileURLToPath }           from 'url';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const ROOT    = join(fileURLToPath(import.meta.url), '..', '..');
const DRY_RUN = process.argv.includes('--dry-run');
const LIST    = process.argv.includes('--list');
const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// Dossiers → catégorie Supabase
const DOSSIERS = {
  Boucles:      'boucles',
  Colliers:     'collier',
  Bracelets:    'bracelet',
  Accessoires:  'accessoire',
  Autre:        'autre',
};

const CAT_LABEL  = { boucles: "Boucles d'oreilles", collier: 'Collier', bracelet: 'Bracelet', accessoire: 'Accessoire', autre: 'Bijou' };
const CAT_PREFIX = { boucles: ['boucles', 'boucle'], collier: ['collier', 'colliers'], bracelet: ['bracelet', 'bracelets'], accessoire: ['accessoire', 'accessoires'] };

// Mots-clés dans le nom de fichier → prix
const MOTS_CLES_3  = ['identifieur'];
const MOTS_CLES_12 = ['cornaline', 'pierre-miel', 'oeil-de-tigre', 'amethyste', 'obsidienne', 'quartz-rose', 'amazonite', 'pendantes', 'labradorite', 'pierre-de-lune', 'aventurine'];

function prixDepuisFichier(fichier) {
  const slug = fichier.toLowerCase();
  if (MOTS_CLES_3.some(mot => slug.includes(mot)))  return 3.00;
  if (MOTS_CLES_12.some(mot => slug.includes(mot))) return 12.00;
  return 10.00;
}

// Descriptions par SKU (générées manuellement pour les nouvelles pièces)
const DESCRIPTIONS = {
  'LBG-26-015': "Petites boucles en pierre miel dorée — une touche subtile et lumineuse pour tous les jours.",
  'LBG-26-016': "L'aventurine verte apporte fraîcheur et espoir. Ces boucles à cabochon ovale sont légères et naturellement élégantes.",
  'LBG-26-017': "Jaspe rouge intense, une des pierres les plus anciennes de l'humanité. Chaque cabochon est taillé et poli à la main.",
  'LBG-26-018': "Boucles en jaspe aux tons sable et beige — une palette terreuse et apaisante, parfaite avec une tenue naturelle.",
  'LBG-26-019': "Jaspe brun clair aux reflets chauds. Discrètes et polyvalentes, ces petites boucles s'adaptent à tout.",
  'LBG-26-020': "Cornaline rouge-orangé aux tons chauds et ensoleillés — une pierre d'énergie et de vitalité qui rayonne.",
  'LBG-26-021': "Pierre miel au ton doré profond, comme de l'ambre figé dans le temps. Chaleureux et authentique.",
  'LBG-26-022': "Cornaline aux teintes saumon et terracotta. Une pierre douce et féminine, polie et montée sur clou doré.",
  'LBG-26-023': "Le jaspe dalmatien et ses taches noires caractéristiques rappellent le pelage d'un dalmatien. Original et unique.",
  'LBG-26-024': "L'œil de tigre révèle un chatoyement unique selon l'angle de lumière — une pierre rare aux reflets soyeux et dorés.",
  'LBG-26-025': "Jaspe rouge taillé en forme de cœur — l'alliance du symbolisme amoureux et de la chaleur de cette pierre ancienne.",
  'LBG-26-026': "Chalcédoine aux tons gris-bleu apaisants. Sa surface lisse et polie capte délicatement la lumière du jour.",
  'LBG-26-027': "Chalcédoine aux reflets mauves subtils — une teinte rare et douce, quelque part entre le gris et le lilas.",
  'LBG-26-028': "Jaspe brun profond, presque chocolat — une pierre au caractère affirmé et aux tons riches de la terre.",
  'LBG-26-029': "Améthyste brute non taillée : les cristaux violets conservent leur forme cristalline originelle. Authentique et spectaculaire.",
  'LBG-26-030': "Jaspe brun aux tons naturels. Simple, solide, élégant — une pierre de la terre qui s'accorde avec tout.",
  'LBG-26-031': "Quartz blanc laiteux à la pureté minérale. Ces boucles classiques et lumineuses s'accordent avec toute tenue.",
  'LBG-26-032': "Le quartz rose, pierre de l'amour et de la tendresse. Sa teinte délicate et lumineuse en fait un bijou intemporel.",
  'LBG-26-033': "Chalcédoine gris-bleu taillée en cœur — la douceur de cette pierre apaisante dans un symbole universel.",
  'LBG-26-034': "Œil de tigre brun doré — ses stries chatoyantes créent un effet fascinant qui change selon l'éclairage.",
  'LBG-26-035': "Petite cornaline rouge vif — intense et percutante. Une touche de chaleur dans un format discret et quotidien.",
  'LBG-26-036': "Cornaline saumon marbrée aux motifs naturels uniques. Chaque paire est différente — c'est la signature de la nature.",
  'LBG-26-037': "Œil de tigre doré taillé en cœur — le chatoyement naturel de cette pierre prend tout son sens dans cette forme romantique.",
  'LBG-26-038': "Obsidienne noire au poli parfait — ce verre volcanique naturel capte la lumière comme un miroir. Élégant et intemporel.",

  // ── Identifieurs à coupe de vin (ensembles de 2) ─────────
  'LBG-26-039': "Ensemble de 2 identifieurs pour coupe à vin — cœur doré et pendentif pierre verte. Plus jamais de verre confondu en soirée !",
  'LBG-26-040': "Ensemble de 2 identifieurs pour coupe à vin — figurines royales dorées aux détails finement travaillés. Élégant et original.",
  'LBG-26-041': "Ensemble de 2 identifieurs pour coupe à vin — libellules dorées aux ailes délicates. Un duo nature et légèreté pour vos soirées d'été.",
  'LBG-26-042': "Ensemble de 2 identifieurs pour coupe à vin — étoile dorée et perle sombre. Simple, élégant, efficace.",
  'LBG-26-043': "Ensemble de 2 identifieurs pour coupe à vin — éléphant doré porte-bonheur et étoile de mer. Pour les esprits curieux et aventuriers.",
  'LBG-26-044': "Ensemble de 2 identifieurs pour coupe à vin — cœur celtique en filigrane et lune croissant dorés. Un duo mystérieux et romantique.",
  'LBG-26-045': "Ensemble de 2 identifieurs pour coupe à vin — grands cœurs en filigrane doré aux détails ajourés. Pour les romantiques.",
  'LBG-26-046': "Ensemble de 2 identifieurs pour coupe à vin — feuille dorée et petite fleur. Un duo nature et douceur tout en légèreté.",
  'LBG-26-047': "Ensemble de 2 identifieurs pour coupe à vin — lunes croissant dorées, simples et élégantes. Parfait pour une ambiance mystérieuse.",
  'LBG-26-048': "Ensemble de 2 identifieurs pour coupe à vin — diamant doré et lune croissant. Brillant et féminin.",
  'LBG-26-049': "Ensemble de 2 identifieurs pour coupe à vin — cœur doré et pierre ambrée ovale. La chaleur de l'ambre dans un format délicat.",
  'LBG-26-050': "Ensemble de 2 identifieurs pour coupe à vin — lune croissant et pierre orange en pendentif. Un duo coloré et mystérieux.",
  'LBG-26-051': "Ensemble de 2 identifieurs pour coupe à vin — lune et étoile dorées. Un classique céleste pour distinguer votre verre.",
  'LBG-26-052': "Ensemble de 2 identifieurs pour coupe à vin — petits pendentifs minimalistes dorés. Discrets et polyvalents.",
  'LBG-26-053': "Ensemble de 2 identifieurs pour coupe à vin — petites étoiles dorées. Simple, clair, efficace.",
  'LBG-26-054': "Ensemble de 2 identifieurs pour coupe à vin — anneaux dorés minimalistes. Le plus sobre et élégant de la collection.",
  'LBG-26-055': "Ensemble de 2 identifieurs pour coupe à vin — pierre ambrée ovale et étoile rouge émaillée. Un duo chaud et festif, parfait pour les célébrations.",

  'LBG-26-060': "Boucles d'oreilles en améthyste claire aux tons rose-mauve apaisants — cabochons polis présentés dans leur boîte en bois gravée Labroche et Gobeil. Une pierre de sérénité et d'intuition.",

  // ── Bracelets ─────────────────────────────────────────────
  'LBG-26-056': "Bracelet chaîne fine avec pendentif cœur doré — délicat et intemporel. Présenté dans sa boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-057': "Bracelet orné de pierres cornaline orangées et d'un charm soleil doré — chaleureux et lumineux. Chaque pierre est naturelle et unique. Présenté dans sa boîte en bois gravée.",
  'LBG-26-058': "Bracelet œil de tigre aux reflets dorés-bruns avec charm étoile — le chatoyement naturel de cette pierre en fait une pièce remarquable. Présenté dans sa boîte en bois gravée.",
  'LBG-26-059': "Bracelet chaîne dorée avec pendentif aventurine verte — la pierre de la chance et de la prospérité dans un format élégant. Présenté dans sa boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-061': "Bracelet chaîne dorée avec pendentif œil de tigre brun ambré — le chatoyement naturel de cette pierre en fait une pièce unique. Présenté dans sa boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-062': "Bracelet chaîne argentée avec charm étoile noire — minimaliste et élégant, parfait au quotidien. Présenté dans sa boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-063': "Bracelet chaîne dorée orné de deux pendentifs cœur et d'une pierre améthyste mauve — romantique et délicat. Présenté dans sa boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-064': "Bracelet chaîne argentée avec pierre cornaline rouge — la chaleur et l'énergie de cette pierre semi-précieuse dans un format élégant. Présenté dans sa boîte en bois gravée Labroche et Gobeil.",

  // ── Boucles (lot 20260523) ─────────────────────────────────
  'LBG-26-065': "Boucles d'oreilles œil de tigre aux grands cabochons — leurs reflets dorés et chatoyants capturent la lumière de façon hypnotique. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-066': "Boucles d'oreilles jaspe dalmatien brun tacheté — les taches naturelles uniques de cette pierre rappellent le pelage du dalmatien. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-067': "Boucles d'oreilles obsidienne noire au poli miroir — ce verre volcanique naturel capte la lumière avec une élégance sombre et intemporelle. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-068': "Boucles d'oreilles quartz translucide aux inclusions naturelles — chaque paire est unique grâce aux voiles et nuages emprisonnés dans la pierre. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-069': "Boucles d'oreilles labradorite gris-bleu aux reflets irisés — sa labradorescence révèle des éclats de bleu, vert et or selon la lumière. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-070': "Boucles d'oreilles améthyste fumée brute aux cristaux sombres — la version mystérieuse de l'améthyste, avec des teintes violettes profondes presque noires. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-071': "Boucles d'oreilles quartz blanc aux taches vertes naturelles — une pierre aux inclusions chloritiques qui lui donnent un caractère botanique unique. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-072': "Boucles d'oreilles quartz blanc ivoire au poli lisse — la pureté classique du quartz blanc dans un format délicat et polyvalent. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-073': "Boucles d'oreilles jaspe vert foncé — une pierre terreuse aux tons profonds de forêt, douce et élégante au quotidien. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-074': "Boucles d'oreilles quartz rose pâle translucide — la pierre de l'amour et de la tendresse dans sa version la plus lumineuse. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-075': "Boucles d'oreilles jaspe dalmatien clair crème aux taches délicates — une version plus douce et lumineuse du jaspe dalmatien. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-076': "Boucles d'oreilles jaspe dalmatien classique aux taches noires — original et reconnaissable, chaque paire est un morceau de nature unique. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-077': "Boucles d'oreilles lapis lazuli bleu nuit — une des pierres les plus anciennes au monde, avec ses éclats dorés de pyrite sur fond bleu profond. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-078': "Boucles d'oreilles citrine orange ensoleillée — la pierre du soleil et de la positivité, aux teintes chaudes et lumineuses. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-079': "Boucles d'oreilles amazonite turquoise pâle — cette pierre apaisante aux tons eau-de-mer apporte fraîcheur et sérénité. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-080': "Boucles d'oreilles amazonite grand cabochon turquoise — les grands cabochons mettent en valeur la couleur caractéristique de cette pierre aux tons caraïbes. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",

  // ── Colliers (lot 20260524) ───────────────────────────────
  'LBG-26-081': "Collier en quartz rose brut — la délicatesse rosée de cette pierre de l'amour suspendue en pendentif naturel. Présenté dans sa boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-082': "Collier en cornaline — la chaleur orangée de cette pierre semi-précieuse en pendentif brut, vitalité et énergie au quotidien. Présenté dans sa boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-083': "Collier en labradorite brute aux reflets irisés — sa labradorescence révèle des éclats de bleu et vert selon la lumière. Présenté dans sa boîte en bois gravée Labroche et Gobeil.",

  // ── Bracelets (lot 20260524) ──────────────────────────────
  'LBG-26-084': "Bracelet avec charm étoile et quartz rose — la douceur du rose et la magie des étoiles réunis sur une chaîne délicate. Présenté dans sa boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-085': "Bracelet avec charm étoile argenté — minimaliste et élégant, un croissant stellaire pour tous les jours. Présenté dans sa boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-086': "Bracelet avec charm lune dorée — délicat et romantique, un croissant de lune suspendu sur une fine chaîne. Présenté dans sa boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-087': "Bracelet avec charm cœur et cornaline — la chaleur orangée de la cornaline et un pendentif cœur, pour un style doux et énergisant. Présenté dans sa boîte en bois gravée Labroche et Gobeil.",

  // ── Boucles (lot 20260524) ────────────────────────────────
  'LBG-26-088': "Boucles d'oreilles pierre de lune — ses reflets opalescents et sa teinte pêche translucide en font une pierre de lumière et de féminité. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-089': "Boucles d'oreilles lapis-lazuli — le bleu nuit profond et les éclats dorés de pyrite de cette pierre millénaire, en clou délicat. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-090': "Boucles d'oreilles amazonite claire — la teinte bleu-vert très pâle et apaisante de cette pierre des eaux tropicales. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-091': "Boucles d'oreilles amazonite — le bleu-vert caractéristique de cette pierre aux tons caraïbes, dans un format clou discret. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-092': "Boucles d'oreilles amazonite — une teinte légèrement plus soutenue, toujours apaisante et lumineuse. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-093': "Boucles pendantes en malachite — des créoles dorées rehaussées de cabochons malachite vert profond pour un effet spectaculaire. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-094': "Boucles d'oreilles sodalite — le bleu intense veiné de blanc de cette pierre apaisante, dans un format cabochon généreux. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-095': "Boucles d'oreilles aventurine verte — la pierre de la chance aux tons menthe délicats, légères et naturellement élégantes. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-096': "Boucles d'oreilles quartz rose facetté — les facettes en forme de rose capturent la lumière et révèlent les nuances translucides de cette pierre tendre. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-097': "Boucles d'oreilles cornaline saumon — les tons pêche et saumon chaleureux de cette cornaline brute rayonnent d'une énergie douce et féminine. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-098': "Boucles d'oreilles amazonite — le bleu ciel et turquoise de cette pierre aux tons marins, apaisante et lumineuse. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-099': "Boucles d'oreilles labradorite grise — de très petits cabochons aux reflets subtils de labradorescence dans un format discret et élégant. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-100': "Boucles d'oreilles pierre de lune crème — la teinte crème et ivoire de ces petits cabochons évoque la douceur lunaire. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-101': "Boucles d'oreilles obsidienne noire — ce verre volcanique naturel au poli parfait capte la lumière comme un miroir sombre. Élégant et intemporel. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-102': "Boucles d'oreilles quartz fumé — la transparence brune ambrée du quartz fumé apporte une touche discrète et mystérieuse. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-103': "Boucles d'oreilles labradorite aux inclusions — de petits cabochons gris aux inclusions naturelles révèlent la beauté brute de cette pierre. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-104': "Boucles d'oreilles quartz blanc cristal — la pureté du quartz transparent presque incolore dans un format discret et polyvalent. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-105': "Boucles d'oreilles cornaline rouge — de petites pierres rouge-orange vif pour une touche de chaleur et d'énergie au quotidien. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-106': "Boucles d'oreilles labradorite — de petits cabochons gris-bleu aux reflets labradorescents selon la lumière. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-107': "Boucles d'oreilles rhodonite — le rose fuschia parsemé de veinures noires de manganèse de cette pierre équilibrante et rare. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-108': "Boucles d'oreilles pierre de lune rectangle — de petits cabochons rectangulaires gris-lavande à l'éclat discret et délicat. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-109': "Boucles d'oreilles cœur quartz rose — de minuscules clous en forme de cœur en quartz rose translucide, délicats et romantiques. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-110': "Boucles d'oreilles jaspe dalmatien — les taches noires caractéristiques sur fond blanc rappellent le pelage du dalmatien. Original et naturellement unique. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-111': "Boucles d'oreilles jaspe gris — le jaspe aux tons gris naturels, discret et polyvalent pour un style minimaliste et terrien. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-112': "Boucles d'oreilles améthyste pâle — la teinte mauve très douce de l'améthyste claire, subtile et apaisante au quotidien. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-113': "Boucles d'oreilles quartz cristal — la transparence parfaite et l'éclat naturel du quartz cristal, discrètes et lumineuses. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-114': "Boucles d'oreilles bronzite — les tons brun doré et les reflets bronzés de cette pierre terrienne aux chaudes nuances métalliques. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-115': "Boucles d'oreilles tourmaline & quartz — les inclusions de tourmaline noire dans le quartz blanc créent un contraste naturel et unique. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-116': "Boucles d'oreilles labradorite bleue — de petits cabochons gris-bleu aux reflets labradorescents, élégants et mystérieux. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-117': "Boucles d'oreilles rhodonite — les tons rose-saumon avec des mouchetures sombres caractéristiques de cette pierre de l'amour et de l'équilibre. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-118': "Boucles d'oreilles labradorite foncée — les tons vert-gris profonds de cette labradorite sombre révèlent un éclat irisé particulièrement mystérieux. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-119': "Boucles pendantes obsidienne — de grands cabochons noirs polis suspendus sur fine chaîne argentée. Élégance sombre en verre volcanique naturel. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-120': "Boucles d'oreilles œil de tigre — le chatoyement doré-brun fascinant de cette pierre change selon l'angle de lumière. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-121': "Boucles d'oreilles jaspe dalmatien — les grands cabochons crème aux taches noires naturelles, chaque paire unique comme une empreinte. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-122': "Boucles d'oreilles calcédoine grise — les tons gris-perle apaisants de cette calcédoine lisse et polie, discrètes et élégantes. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
  'LBG-26-123': "Boucles d'oreilles aventurine foncée — les tons vert forêt profond de cette aventurine intense, naturelle et élégante. Présentées dans leur boîte en bois gravée Labroche et Gobeil.",
};

// Position de cadrage par SKU (object-position CSS)
// Toutes les images sont désormais en portrait natif (EXIF=1, 3000×4000).
// object-fit: contain affiche l'image complète — center center suffit pour tout.
// Ce dictionnaire est conservé pour référence et surcharges futures.
const IMAGE_POSITIONS = {
  'LBG-26-001': 'center center',
  'LBG-26-002': 'center center',
  'LBG-26-003': 'center center',
  'LBG-26-004': 'center center',
  'LBG-26-005': 'center center',
  'LBG-26-006': 'center center',
  'LBG-26-007': 'center center',
  'LBG-26-008': 'center center',
  'LBG-26-009': 'center center',
  'LBG-26-010': 'center center',
  'LBG-26-011': 'center center',
  'LBG-26-012': 'center center',
  'LBG-26-013': 'center center',
  'LBG-26-014': 'center center',
  'LBG-26-015': 'center center',
  'LBG-26-016': 'center center',
  'LBG-26-017': 'center center',
  'LBG-26-018': 'center center',
  'LBG-26-019': 'center center',
  'LBG-26-020': 'center center',
  'LBG-26-021': 'center center',
  'LBG-26-022': 'center center',
  'LBG-26-023': 'center center',
  'LBG-26-024': 'center center',
  'LBG-26-025': 'center center',
  'LBG-26-026': 'center center',
  'LBG-26-027': 'center center',
  'LBG-26-028': 'center center',
  'LBG-26-029': 'center center',
  'LBG-26-030': 'center center',
  'LBG-26-031': 'center center',
  'LBG-26-032': 'center center',
  'LBG-26-033': 'center center',
  'LBG-26-034': 'center center',
  'LBG-26-035': 'center center',
  'LBG-26-036': 'center center',
  'LBG-26-037': 'center center',
  'LBG-26-038': 'center center',
  'LBG-26-039': 'center center',
  'LBG-26-040': 'center center',
  'LBG-26-041': 'center center',
  'LBG-26-042': 'center center',
  'LBG-26-043': 'center center',
  'LBG-26-044': 'center center',
  'LBG-26-045': 'center center',
  'LBG-26-046': 'center center',
  'LBG-26-047': 'center center',
  'LBG-26-048': 'center center',
  'LBG-26-049': 'center center',
  'LBG-26-050': 'center center',
  'LBG-26-051': 'center center',
  'LBG-26-052': 'center center',
  'LBG-26-053': 'center center',
  'LBG-26-054': 'center center',
  'LBG-26-055': 'center center',
  'LBG-26-056': 'center center',
  'LBG-26-057': 'center center',
  'LBG-26-058': 'center center',
  'LBG-26-059': 'center center',
  'LBG-26-060': 'center center',
  'LBG-26-061': 'center center',
  'LBG-26-062': 'center center',
  'LBG-26-063': 'center center',
  'LBG-26-064': 'center center',
  'LBG-26-065': 'center center',
  'LBG-26-066': 'center center',
  'LBG-26-067': 'center center',
  'LBG-26-068': 'center center',
  'LBG-26-069': 'center center',
  'LBG-26-070': 'center center',
  'LBG-26-071': 'center center',
  'LBG-26-072': 'center center',
  'LBG-26-073': 'center center',
  'LBG-26-074': 'center center',
  'LBG-26-075': 'center center',
  'LBG-26-076': 'center center',
  'LBG-26-077': 'center center',
  'LBG-26-078': 'center center',
  'LBG-26-079': 'center center',
  'LBG-26-080': 'center center',
  'LBG-26-081': 'center center',
  'LBG-26-082': 'center center',
  'LBG-26-083': 'center center',
  'LBG-26-084': 'center center',
  'LBG-26-085': 'center center',
  'LBG-26-086': 'center center',
  'LBG-26-087': 'center center',
  'LBG-26-088': 'center center',
  'LBG-26-089': 'center center',
  'LBG-26-090': 'center center',
  'LBG-26-091': 'center center',
  'LBG-26-092': 'center center',
  'LBG-26-093': 'center center',
  'LBG-26-094': 'center center',
  'LBG-26-095': 'center center',
  'LBG-26-096': 'center center',
  'LBG-26-097': 'center center',
  'LBG-26-098': 'center center',
  'LBG-26-099': 'center center',
  'LBG-26-100': 'center center',
  'LBG-26-101': 'center center',
  'LBG-26-102': 'center center',
  'LBG-26-103': 'center center',
  'LBG-26-104': 'center center',
  'LBG-26-105': 'center center',
  'LBG-26-106': 'center center',
  'LBG-26-107': 'center center',
  'LBG-26-108': 'center center',
  'LBG-26-109': 'center center',
  'LBG-26-110': 'center center',
  'LBG-26-111': 'center center',
  'LBG-26-112': 'center center',
  'LBG-26-113': 'center center',
  'LBG-26-114': 'center center',
  'LBG-26-115': 'center center',
  'LBG-26-116': 'center center',
  'LBG-26-117': 'center center',
  'LBG-26-118': 'center center',
  'LBG-26-119': 'center center',
  'LBG-26-120': 'center center',
  'LBG-26-121': 'center center',
  'LBG-26-122': 'center center',
  'LBG-26-123': 'center center',
};

// Génère un nom lisible depuis le nom de fichier
// ex: "LBG-26-003-boucles-aventurine.jpg" → "Boucles d'oreilles Aventurine"
function nomDepuisFichier(fichier, categorie) {
  let mots = basename(fichier, extname(fichier))
    .replace(/^LBG-\d{2}-\d{3}-?/i, '')
    .replace(/-/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
  // Retirer le mot de catégorie s'il est en tête (ex: "boucles")
  const prefixes = CAT_PREFIX[categorie] ?? [];
  while (mots.length && prefixes.includes(mots[0].toLowerCase())) mots.shift();
  const stone = mots.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' ');
  return stone ? `${CAT_LABEL[categorie] ?? 'Bijou'} ${stone}` : (CAT_LABEL[categorie] ?? 'Bijou');
}

// ── --list ─────────────────────────────────────────────────
if (LIST) {
  const { data, error } = await supabase
    .from('products')
    .select('sku, name, category, price_cad, stock_qty, in_stock')
    .order('sku');
  if (error) { console.error('❌', error.message); process.exit(1); }
  console.log(`\n📦  ${data.length} produit(s) en base:\n`);
  for (const p of data) {
    const stock = p.in_stock ? `✅ ${p.stock_qty}` : '❌ 0';
    console.log(`  ${(p.sku ?? '—').padEnd(14)} ${p.name.slice(0, 40).padEnd(42)} ${String(p.price_cad).padStart(5)} $  ${stock}`);
  }
  console.log('');
  process.exit(0);
}

// ── Scan des dossiers ──────────────────────────────────────
const images = [];
for (const [dossier, categorie] of Object.entries(DOSSIERS)) {
  const dir = join(ROOT, 'assets', 'Produits', dossier);
  if (!existsSync(dir)) continue;
  for (const fichier of readdirSync(dir)) {
    if (!IMG_EXT.has(extname(fichier).toLowerCase())) continue;
    const m = fichier.match(/^(LBG-\d{2}-\d{3})/i);
    if (!m) continue;
    const sku = m[1].toUpperCase();
    images.push({ sku, categorie, fichier, dossier });
  }
}

// Dédupliquer (garder la 1ère occurrence par SKU)
const vus = new Set();
const imagesUniques = images.filter(img => {
  if (vus.has(img.sku)) return false;
  vus.add(img.sku);
  return true;
});

// ── SKUs déjà en base ──────────────────────────────────────
const { data: existants } = await supabase.from('products').select('sku');
const skusEnBase = new Set(existants?.map(p => p.sku) ?? []);

// ── Nouveaux seulement ─────────────────────────────────────
const nouveaux = imagesUniques.filter(img => !skusEnBase.has(img.sku));

if (nouveaux.length === 0) {
  console.log('\n✅  Tous les produits sont déjà en base. Rien à importer.\n');
  console.log('   Astuce: node scripts/importer_produits.mjs --list\n');
  // Mettre à jour le JSON des positions même s'il n'y a rien à importer
  const jsonPath0 = join(ROOT, 'data', 'image-positions.json');
  writeFileSync(jsonPath0, JSON.stringify(IMAGE_POSITIONS, null, 2) + '\n', 'utf8');
  console.log('   ✅  data/image-positions.json mis à jour.\n');
  process.exit(0);
}

console.log(`\n📸  ${nouveaux.length} nouveau(x) produit(s) détecté(s):\n`);

const aInserer = nouveaux.map(img => {
  const nom            = nomDepuisFichier(img.fichier, img.categorie);
  const prix           = prixDepuisFichier(img.fichier);
  const description    = DESCRIPTIONS[img.sku] ?? null;
  const imageUrl       = `assets/Produits/${img.dossier}/${img.fichier}`;
  console.log(`  + ${img.sku.padEnd(14)} ${nom.slice(0, 40).padEnd(42)} ${String(prix.toFixed(2)).padStart(5)} $  stock: 1`);
  return {
    sku:          img.sku,
    name:         nom,
    description,
    price_cad:    prix,
    category:     img.categorie,
    image_url:    imageUrl,
    stock_qty:    1,
    in_stock:     true,
    piece_unique: true,
  };
});

if (DRY_RUN) {
  console.log('\n⚠️   Mode --dry-run : aucune insertion effectuée.\n');
  process.exit(0);
}

console.log('\n⬆️   Insertion dans Supabase...');
const { error } = await supabase.from('products').insert(aInserer);
if (error) {
  console.error('❌  Erreur:', error.message);
  process.exit(1);
}

console.log(`\n🎉  ${aInserer.length} produit(s) ajouté(s) !`);
console.log('   → Complète prix et descriptions dans le panneau admin si besoin.\n');
console.log('   Vérifier: node scripts/importer_produits.mjs --list\n');

// Toujours régénérer data/image-positions.json depuis IMAGE_POSITIONS
const jsonPath = join(ROOT, 'data', 'image-positions.json');
writeFileSync(jsonPath, JSON.stringify(IMAGE_POSITIONS, null, 2) + '\n', 'utf8');
console.log('   ✅  data/image-positions.json mis à jour.\n');
