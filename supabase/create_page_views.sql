-- ── Coller dans Supabase → SQL Editor → Run (une seule fois) ──────────────
-- Crée la table de suivi des visites pour les stats dans le panneau admin.

create table if not exists page_views (
  id          uuid        primary key default gen_random_uuid(),
  page        text        not null,
  sku         text,
  referrer    text,
  session_id  text,
  created_at  timestamptz default now()
);

-- Index pour accélérer les requêtes par date et par SKU
create index if not exists idx_pv_created on page_views (created_at desc);
create index if not exists idx_pv_sku     on page_views (sku) where sku is not null;

-- Désactiver RLS (accès via Service Role uniquement, côté serveur)
alter table page_views disable row level security;
