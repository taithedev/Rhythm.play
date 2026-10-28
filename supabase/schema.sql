-- Optional worldwide leaderboard for Rhythm.play
-- Run in Supabase SQL Editor, then configure index.html with public project URL and anon key.
-- This scoreboard is CLIENT-REPORTED. For competitive prizes, add server-side verification/anti-cheat.
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
create index if not exists rhythm_scores_top_idx on public.rhythm_scores (score desc, played_at asc);
alter table public.rhythm_scores enable row level security;
grant select, insert on table public.rhythm_scores to anon, authenticated;
drop policy if exists "Read community scores" on public.rhythm_scores;
create policy "Read community scores" on public.rhythm_scores for select to anon, authenticated using (true);
drop policy if exists "Post community scores" on public.rhythm_scores;
create policy "Post community scores" on public.rhythm_scores for insert to anon, authenticated with check (
  char_length(btrim(player_name)) between 2 and 18
  and score between 0 and 10000000
  and accuracy between 0 and 100
  and max_combo between 0 and 10000
  and grade in ('S','A','B','C','D')
  and track = 'Neon Side Street'
);
-- No UPDATE or DELETE grants are given to browser clients.
