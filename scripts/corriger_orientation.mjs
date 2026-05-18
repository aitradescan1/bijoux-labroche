// scripts/corriger_orientation.mjs
// Corrige l'orientation EXIF de toutes les photos produits
// (bake la rotation dans les pixels, remet EXIF orientation à 1)
// node scripts/corriger_orientation.mjs

import sharp      from 'sharp';
import { readdirSync, existsSync, renameSync, unlinkSync, writeFileSync } from 'fs';
import { join, extname }          from 'path';
import { fileURLToPath }          from 'url';

const ROOT    = join(fileURLToPath(import.meta.url), '..', '..');
const DOSSIERS = ['Boucles', 'Colliers', 'Bracelets', 'Autre'];
const IMG_EXT  = new Set(['.jpg', '.jpeg', '.png', '.webp']);

let traites = 0, erreurs = 0;

for (const dossier of DOSSIERS) {
  const dir = join(ROOT, 'assets', 'Produits', dossier);
  if (!existsSync(dir)) continue;

  const fichiers = readdirSync(dir).filter(f =>
    IMG_EXT.has(extname(f).toLowerCase())
  );

  for (const fichier of fichiers) {
    const chemin = join(dir, fichier);
    const tmp    = chemin + '.tmp.jpg';
    try {
      // Lire → auto-rotate EXIF → écrire dans tmp → remplacer l'original
      const buf = await sharp(chemin)
        .rotate()                            // applique la rotation EXIF dans les pixels
        .withMetadata({ orientation: 1 })    // remet l'orientation à "normal"
        .jpeg({ quality: 90 })
        .toBuffer();
      writeFileSync(tmp, buf);
      unlinkSync(chemin);
      renameSync(tmp, chemin);
      console.log(`  ✅ ${dossier}/${fichier}`);
      traites++;
    } catch (e) {
      try { unlinkSync(tmp); } catch {}
      console.error(`  ❌ ${dossier}/${fichier} — ${e.message}`);
      erreurs++;
    }
  }
}

console.log(`\n✅ ${traites} photo(s) corrigée(s)${erreurs ? `, ❌ ${erreurs} erreur(s)` : ''}\n`);
