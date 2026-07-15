-- =========================================================
-- FALCOM ADS LANDING — Supabase schema
-- Jalankan ini di: Supabase Dashboard → SQL Editor → New query
-- =========================================================

create table if not exists leads (
    id            uuid primary key default gen_random_uuid(),
    created_at    timestamptz default now(),
    name          text not null,
    phone         text not null,
    company       text,
    need          text,
    utm_source    text,
    utm_medium    text,
    utm_campaign  text,
    page_url      text,
    status        text default 'baru',   -- baru | dihubungi | ditawar | deal | gagal
    deal_value    numeric,
    contacted_at  timestamptz,
    notes         text
);

-- Aktifkan Row Level Security (WAJIB, jangan dilewati)
alter table leads enable row level security;

-- Publik (anon key dari landing page) HANYA BOLEH INSERT.
-- Tidak boleh SELECT/UPDATE/DELETE — itu cuma boleh lewat
-- Netlify Function yang pakai Service Role Key (server-side).
create policy "public can insert leads"
    on leads
    for insert
    to anon
    with check (true);

-- Index biar query dashboard (sort by tanggal, filter campaign) cepat
create index if not exists leads_created_at_idx on leads (created_at desc);
create index if not exists leads_utm_campaign_idx on leads (utm_campaign);
create index if not exists leads_status_idx on leads (status);
