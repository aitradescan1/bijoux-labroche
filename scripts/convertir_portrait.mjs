// scripts/convertir_portrait.mjs
// Bake l'orientation EXIF=6 dans les fichiers image (rotate 90° CW et supprime le flag)
// Usage: node scripts/convertir_portrait.mjs
//        node scripts/convertir_portrait.mjs --dry-run   (liste sans modifier)

import sharp from 'sharp';
import { readdirSync, renameSync, unlinkSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const ROOT    = join(fileURLToPath(import.meta.url), '..', '..');
const DRY_RUN = process.argv.includes('--dry-run');
const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const DOSSIERS = [
  'assets/Produits/Boucles',
  'assets/Produits/bracelets',
  'assets/Produits/Accessoires',
  'assets/Produits/colliers',
];

let total = 0, converti = 0;

for (const dossier of DOSSIERS) {
  const dir = join(ROOT, dossier);
  let fichiers;
  try { fichiers = readdirSync(dir); } catch { continue; }

  for (const fichier of fichiers) {
    if (!IMG_EXT.has(extname(fichier).toLowerCase())) continue;
    const chemin = join(dir, fichier);
    total++;

    const meta = await sharp(chemin).metadata();
    if (meta.orientation !== 6 && meta.orientation !== 8 && meta.orientation !== 3) {
      console.log(`  — ${fichier} (orientation=${meta.orientation ?? 1}, skipped)`);
      continue;
    }

    const dims = `${meta.width}×${meta.height}`;
    if (DRY_RUN) {
      console.log(`  ✎ ${fichier} orientation=${meta.orientation} ${dims} → à convertir`);
      converti++;
      continue;
    }

    const tmp = chemin + '.tmp.jpg';
    try {
      await sharp(chemin)
        .rotate()                     // applique l'orientation EXIF et supprime le tag
        .jpeg({ quality: 92, mozjpeg: true })
        .toFile(tmp);

      renameSync(tmp, chemin);
      const meta2 = await sharp(chemin).metadata();
      console.log(`  ✅ ${fichier}: ${dims} → ${meta2.width}×${meta2.height} (orient=${meta2.orientation ?? 1})`);
      converti++;
    } catch (err) {
      try { unlinkSync(tmp); } catch {}
      console.error(`  ❌ ${fichier}: ${err.message}`);
    }
  }
}

console.log(`\n${DRY_RUN ? '[DRY-RUN] ' : ''}${converti}/${total} images converties en portrait natif.`);
