// lib/supabase.js
// Client Supabase singleton — utilise la clé Service Role (côté serveur uniquement)
// Ne jamais exposer SUPABASE_SERVICE_ROLE_KEY au frontend

import { createClient } from '@supabase/supabase-js';

// Singleton — créé à la première utilisation (lazy) pour permettre
// au serveur local de démarrer même si les variables ne sont pas encore remplies
let client;
export function getSupabase() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Variables SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY manquantes dans .env.local');
    }
    client = createClient(url, key, {
      auth: { persistSession: false }
    });
  }
  return client;
}
