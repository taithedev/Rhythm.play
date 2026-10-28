-- Deployed in the existing Zuzify Supabase project.
-- All public tables have the "rhythm_" prefix. No other Zuzify table is modified.
-- The scores are guest-submitted, not anti-cheat verified.
create table if not exists public.rhythm_scores (
 id uuid primary key default gen_random_uuid(),
 player_name text not null check (char_length(btrim(player_name)) between 2 and 18),
 score integer not null check (score between 0 and 10000000),
 accuracy numeric(5,2) not null check (accuracy between 0 and 100),
 max_combo integer not null check (max_combo between 0 and 10000),
 grade text not null check (grade in ('S','A','B','C','D')),
 track text not null default 'Neon Side Street' check (track = 'Neon Side Street'),
 played_at timestamptz not null default now()
);
create index if not exists rhythm_scores_rank_idx on public.rhythm_scores (score desc, played_at asc);
create table if not exists public.rhythm_skins (
 id text primary key check (id ~ '^[a-z0-9_-]{2,32}$'),
 name text not null,
 tier text not null check (tier in ('STARTER','RARE','EPIC','LEGENDARY')),
 price integer not null check (price between 0 and 1000000),
 palette text[] not null check (array_length(palette,1) = 4),
 is_active boolean not null default true
);
alter table public.rhythm_scores enable row level security;
alter table public.rhythm_skins enable row level security;
revoke all on public.rhythm_scores, public.rhythm_skins from anon, authenticated;
grant select, insert on public.rhythm_scores to anon, authenticated;
grant select on public.rhythm_skins to anon, authenticated;
drop policy if exists "rhythm_scores_public_read" on public.rhythm_scores;
create policy "rhythm_scores_public_read" on public.rhythm_scores
for select to anon, authenticated using (true);
drop policy if exists "rhythm_scores_guest_submit" on public.rhythm_scores;
create policy "rhythm_scores_guest_submit" on public.rhythm_scores
for insert to anon, authenticated with check (
 char_length(btrim(player_name)) between 2 and 18
 and score between 0 and 10000000
 and accuracy between 0 and 100
 and max_combo between 0 and 10000
 and grade in ('S','A','B','C','D')
 and track = 'Neon Side Street'
);
drop policy if exists "rhythm_skins_public_read" on public.rhythm_skins;
create policy "rhythm_skins_public_read" on public.rhythm_skins
for select to anon, authenticated using (is_active = true);
insert into public.rhythm_skins(id,name,tier,price,palette) values
('pulse','Pulse Original','STARTER',0,array['#8c85ff','#b47bff','#ff73bb','#76f5ca']),
('afterglow','Afterglow','RARE',450,array['#ff6a9c','#fc83e7','#ffb07b','#ffc9e7']),
('aquawave','Aquawave','RARE',700,array['#5ef3df','#60b4ff','#86ebfa','#b1fcf1']),
('solar','Solar Flare','EPIC',1100,array['#ffc75e','#ff8c5a','#ffe58d','#ff647c']),
('toxic','Cyberlime','EPIC',1500,array['#d4fa77','#6efc94','#a6f37e','#e8ffb3']),
('prism','Prism Shift','LEGENDARY',2400,array['#a49fff','#ff85d3','#64e9ff','#ffe987'])
on conflict (id) do nothing;
