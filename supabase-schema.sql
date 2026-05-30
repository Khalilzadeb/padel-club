-- ============================================================
-- PADEL CLUB — Supabase Schema + Seed Data
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- TABLES

-- Venue admins (padel center managers)
create table if not exists venue_admins (
  id text primary key,
  email text unique not null,
  password_hash text not null,
  name text not null,
  location text not null,
  created_at timestamptz default now()
);

-- Recurring bookings (e.g. every Tuesday 19:00)
create table if not exists recurring_bookings (
  id text primary key,
  court_id text references courts(id),
  day_of_week integer not null, -- 0=Sun, 1=Mon, ..., 6=Sat
  start_time text not null,     -- "HH:MM"
  duration_minutes integer not null default 90,
  label text,
  created_by text references venue_admins(id),
  created_at timestamptz default now()
);

create table if not exists courts (
  id text primary key,
  name text not null,
  surface text not null,
  type text not null,
  is_active boolean default true,
  price_per_hour integer not null,
  image_url text,
  features text[] default '{}'
);

create table if not exists players (
  id text primary key,
  name text not null,
  avatar_url text,
  level text not null,
  hand text not null,
  position text not null,
  member_since text not null,
  matches_played integer default 0,
  matches_won integer default 0,
  matches_lost integer default 0,
  sets_won integer default 0,
  sets_lost integer default 0,
  games_won integer default 0,
  games_lost integer default 0,
  elo_rating integer default 1000,
  ranking_points integer default 0,
  current_streak integer default 0,
  tournaments_won integer default 0,
  contact_email text,
  contact_phone text
);

create table if not exists users (
  id text primary key,
  email text unique not null,
  name text not null,
  password_hash text,
  google_id text,
  avatar_url text,
  player_id text references players(id),
  created_at timestamptz default now()
);

create table if not exists bookings (
  id text primary key,
  court_id text references courts(id),
  player_ids text[] not null default '{}',
  date text not null,
  start_time text not null,
  end_time text not null,
  duration_minutes integer not null default 60,
  status text not null default 'confirmed',
  total_price integer,
  notes text,
  created_at timestamptz default now()
);

create table if not exists matches (
  id text primary key,
  court_id text references courts(id),
  booking_id text,
  type text not null,
  format text not null default 'best-of-3',
  status text not null default 'completed',
  team1_player_ids text[] not null,
  team2_player_ids text[] not null,
  sets jsonb default '[]',
  winner_id text,
  date text not null,
  start_time text not null,
  duration_minutes integer default 75,
  tournament_id text,
  tournament_round text,
  elo_changes jsonb,
  created_at timestamptz default now()
);

create table if not exists tournaments (
  id text primary key,
  name text not null,
  description text,
  status text not null,
  format text not null,
  start_date text not null,
  end_date text not null,
  registration_deadline text,
  max_teams integer,
  registered_teams jsonb default '[]',
  court_ids text[] default '{}',
  prizes jsonb default '[]',
  bracket jsonb,
  groups jsonb,
  match_ids text[] default '{}',
  winner_id text,
  image_url text,
  created_at timestamptz default now()
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Courts
insert into courts (id, name, surface, type, is_active, price_per_hour, features) values
  ('c1', 'Court 1 - Crystal Blue',  'crystal',          'indoor',  true, 6000, '{"lighting","climate-control","pro-glass-walls","electronic-scoreboard"}'),
  ('c2', 'Court 2 - Crystal Green', 'crystal',          'indoor',  true, 6000, '{"lighting","climate-control","pro-glass-walls"}'),
  ('c3', 'Court 3 - Panorama',      'artificial-grass', 'outdoor', true, 4000, '{"lighting","panoramic-view","covered"}'),
  ('c4', 'Court 4 - Garden',        'artificial-grass', 'outdoor', true, 3500, '{"lighting","garden-view"}'),
  ('c5', 'Court 5 - Competition',   'crystal',          'indoor',  true, 8000, '{"lighting","climate-control","pro-glass-walls","spectator-stands","streaming-setup","electronic-scoreboard"}')
on conflict (id) do nothing;

-- Players
insert into players (id, name, level, hand, position, member_since, matches_played, matches_won, matches_lost, sets_won, sets_lost, games_won, games_lost, elo_rating, ranking_points, current_streak, tournaments_won, contact_email, contact_phone) values
  ('p1',  'Alejandro García',  'pro',          'right', 'drive',    '2021-03-10', 87, 64, 23, 142, 61,  912, 574, 1348, 2450, 5,  3, 'alex.garcia@padel.club', '+34 612 345 678'),
  ('p2',  'Sofia Martínez',    'pro',          'right', 'revés',    '2021-05-22', 79, 57, 22, 128, 56,  843, 502, 1312, 2210, 3,  2, 'sofia.m@padel.club',      null),
  ('p3',  'Marco Rossi',       'advanced',     'right', 'flexible', '2022-01-15', 63, 41, 22, 95,  54,  654, 423, 1187, 1640, 2,  1, 'marco.rossi@padel.club',  null),
  ('p4',  'Emma Johansson',    'advanced',     'left',  'revés',    '2022-03-08', 58, 35, 23, 82,  58,  576, 432, 1142, 1390, -2, 0, 'emma.j@padel.club',       null),
  ('p5',  'Carlos Fernández',  'advanced',     'right', 'drive',    '2021-11-20', 71, 44, 27, 103, 68,  712, 523, 1165, 1750, 1,  1, 'carlos.f@padel.club',     '+34 678 901 234'),
  ('p6',  'Lena Müller',       'intermediate', 'right', 'flexible', '2023-02-14', 42, 23, 19, 56,  47,  378, 332, 1058, 860,  -1, 0, 'lena.m@padel.club',       null),
  ('p7',  'Tiago Santos',      'intermediate', 'right', 'drive',    '2023-04-01', 38, 20, 18, 49,  43,  342, 312, 1022, 720,  2,  0, 'tiago.s@padel.club',      null),
  ('p8',  'Isabelle Dupont',   'intermediate', 'left',  'revés',    '2022-09-17', 47, 25, 22, 60,  53,  412, 385, 1041, 940,  0,  0, 'isabelle.d@padel.club',   null),
  ('p9',  'Rafa Torres',       'advanced',     'right', 'flexible', '2021-07-30', 66, 38, 28, 89,  72,  623, 534, 1118, 1520, -3, 1, 'rafa.t@padel.club',       null),
  ('p10', 'Nadia Kowalski',    'beginner',     'right', 'flexible', '2024-01-10', 18, 7,  11, 18,  26,  132, 187, 945,  210,  -1, 0, 'nadia.k@padel.club',      null),
  ('p11', 'Diego Almeida',     'beginner',     'right', 'drive',    '2024-02-20', 12, 4,  8,  10,  18,  78,  134, 912,  120,  1,  0, 'diego.a@padel.club',      null),
  ('p12', 'Yuki Tanaka',       'intermediate', 'right', 'revés',    '2023-06-05', 35, 18, 17, 43,  40,  298, 287, 1009, 680,  2,  0, 'yuki.t@padel.club',       null)
on conflict (id) do nothing;

-- Users (password: "password123" — bcrypt hash)
insert into users (id, email, name, password_hash, player_id, created_at) values
  ('u1', 'alex.garcia@padel.club', 'Alejandro García', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'p1', '2021-03-10T00:00:00Z'),
  ('u2', 'sofia.m@padel.club',     'Sofia Martínez',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'p2', '2021-05-22T00:00:00Z'),
  ('u3', 'demo@padel.club',        'Demo User',        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, now())
on conflict (id) do nothing;

-- Tournaments
insert into tournaments (id, name, description, status, format, start_date, end_date, registration_deadline, max_teams, registered_teams, court_ids, prizes, bracket, match_ids, winner_id) values
  ('t1', 'Spring Open 2026', 'Flagship knockout tournament. Top 8 seeded pairs compete for the Spring Open title.', 'completed', 'knockout', '2026-03-13', '2026-03-15', '2026-03-10', 8,
   '[["p1","p2"],["p3","p5"],["p9","p4"],["p6","p8"],["p7","p12"],["p10","p11"],["p1","p3"],["p2","p9"]]',
   '{"c5"}',
   '[{"place":1,"description":"Trophy + Club Membership 1 year","value":500},{"place":2,"description":"Trophy + Club Membership 6 months","value":250},{"place":3,"description":"Trophy","value":100}]',
   '[{"round":"Quarter-final","position":1,"matchId":null,"team1PlayerIds":["p1","p2"],"team2PlayerIds":["p7","p12"],"winnerId":"team1"},{"round":"Quarter-final","position":2,"matchId":null,"team1PlayerIds":["p3","p5"],"team2PlayerIds":["p10","p11"],"winnerId":"team1"},{"round":"Quarter-final","position":3,"matchId":null,"team1PlayerIds":["p9","p4"],"team2PlayerIds":["p6","p8"],"winnerId":"team1"},{"round":"Semi-final","position":1,"matchId":"m6","team1PlayerIds":["p1","p2"],"team2PlayerIds":["p3","p5"],"winnerId":"team1"},{"round":"Semi-final","position":2,"matchId":"m7","team1PlayerIds":["p9","p4"],"team2PlayerIds":["p6","p8"],"winnerId":"team1"},{"round":"Final","position":1,"matchId":"m5","team1PlayerIds":["p1","p2"],"team2PlayerIds":["p9","p4"],"winnerId":"team1"}]',
   '{"m5","m6","m7"}',
   '["p1","p2"]'),
  ('t2', 'Summer League 2026', 'Round-robin group stage followed by knockout. Open to all levels.', 'registration', 'group-then-knockout', '2026-05-01', '2026-05-31', '2026-04-25', 12,
   '[["p1","p2"],["p3","p5"],["p6","p7"],["p8","p12"]]',
   '{"c1","c2","c3"}',
   '[{"place":1,"description":"Trophy + €300 prize","value":300},{"place":2,"description":"Trophy + €150 prize","value":150}]',
   null, '{}', null),
  ('t3', 'Beginners Cup', 'Friendly tournament for beginner and intermediate players.', 'active', 'round-robin', '2026-03-18', '2026-03-30', '2026-03-15', 6,
   '[["p10","p11"],["p6","p7"],["p8","p12"]]',
   '{"c3","c4"}',
   '[{"place":1,"description":"Trophy + Free court hours","value":0}]',
   null, '{}', null)
on conflict (id) do nothing;

-- Bookings (using today's date as reference — adjust dates as needed)
insert into bookings (id, court_id, player_ids, date, start_time, end_time, duration_minutes, status, total_price) values
  ('b1', 'c1', '{"p1","p3","p5","p9"}', current_date::text,              '09:00', '10:00', 60, 'confirmed', 6000),
  ('b2', 'c2', '{"p2","p4"}',           current_date::text,              '11:00', '12:00', 60, 'confirmed', 6000),
  ('b3', 'c3', '{"p6","p7","p8","p12"}', (current_date+1)::text,         '16:00', '17:30', 90, 'confirmed', 6000),
  ('b4', 'c1', '{"p1","p2","p3","p4"}', (current_date+2)::text,          '10:00', '11:30', 90, 'confirmed', 9000),
  ('b5', 'c5', '{"p1","p2","p5","p9"}', (current_date+3)::text,          '18:00', '19:00', 60, 'confirmed', 8000),
  ('b6', 'c4', '{"p10","p11"}',          (current_date+1)::text,         '09:00', '10:00', 60, 'confirmed', 3500),
  ('b7', 'c2', '{"p5","p9","p6","p8"}', (current_date-1)::text,          '14:00', '15:00', 60, 'confirmed', 6000)
on conflict (id) do nothing;

-- Matches
insert into matches (id, court_id, type, format, status, team1_player_ids, team2_player_ids, sets, winner_id, date, start_time, duration_minutes, elo_changes) values
  ('m1',  'c1', 'ranked',     'best-of-3', 'completed', '{"p1","p3"}', '{"p5","p9"}', '[{"setNumber":1,"team1Games":6,"team2Games":3},{"setNumber":2,"team1Games":6,"team2Games":4}]', 'team1', (current_date-1)::text, '10:00', 75,  '{"p1":18,"p3":18,"p5":-18,"p9":-18}'),
  ('m2',  'c2', 'ranked',     'best-of-3', 'completed', '{"p2","p4"}', '{"p6","p8"}', '[{"setNumber":1,"team1Games":6,"team2Games":2},{"setNumber":2,"team1Games":4,"team2Games":6},{"setNumber":3,"team1Games":7,"team2Games":5}]', 'team1', (current_date-1)::text, '12:00', 105, '{"p2":22,"p4":22,"p6":-22,"p8":-22}'),
  ('m3',  'c3', 'casual',     'best-of-3', 'completed', '{"p7","p12"}', '{"p10","p11"}', '[{"setNumber":1,"team1Games":6,"team2Games":4},{"setNumber":2,"team1Games":6,"team2Games":1}]', 'team1', (current_date-2)::text, '16:00', 70,  null),
  ('m4',  'c1', 'ranked',     'best-of-3', 'completed', '{"p1","p2"}', '{"p3","p5"}', '[{"setNumber":1,"team1Games":7,"team2Games":5},{"setNumber":2,"team1Games":5,"team2Games":7},{"setNumber":3,"team1Games":6,"team2Games":3}]', 'team1', (current_date-3)::text, '09:00', 110, '{"p1":14,"p2":14,"p3":-14,"p5":-14}'),
  ('m5',  'c5', 'tournament', 'best-of-3', 'completed', '{"p1","p2"}', '{"p9","p4"}', '[{"setNumber":1,"team1Games":6,"team2Games":1},{"setNumber":2,"team1Games":6,"team2Games":3}]', 'team1', (current_date-7)::text, '15:00', 65,  '{"p1":28,"p2":28,"p9":-28,"p4":-28}'),
  ('m6',  'c5', 'tournament', 'best-of-3', 'completed', '{"p1","p2"}', '{"p3","p5"}', '[{"setNumber":1,"team1Games":6,"team2Games":4},{"setNumber":2,"team1Games":7,"team2Games":6,"tiebreak":{"team1Points":7,"team2Points":5}}]', 'team1', (current_date-8)::text, '13:00', 85,  '{"p1":20,"p2":20,"p3":-20,"p5":-20}'),
  ('m7',  'c5', 'tournament', 'best-of-3', 'completed', '{"p9","p4"}', '{"p6","p8"}', '[{"setNumber":1,"team1Games":6,"team2Games":3},{"setNumber":2,"team1Games":3,"team2Games":6},{"setNumber":3,"team1Games":6,"team2Games":4}]', 'team1', (current_date-8)::text, '15:30', 95,  null),
  ('m8',  'c2', 'ranked',     'best-of-3', 'completed', '{"p3","p9"}', '{"p7","p12"}', '[{"setNumber":1,"team1Games":6,"team2Games":2},{"setNumber":2,"team1Games":6,"team2Games":4}]', 'team1', (current_date-4)::text, '11:00', 65,  '{"p3":16,"p9":16,"p7":-16,"p12":-16}'),
  ('m9',  'c4', 'casual',     'best-of-3', 'completed', '{"p6","p7"}', '{"p8","p10"}', '[{"setNumber":1,"team1Games":4,"team2Games":6},{"setNumber":2,"team1Games":6,"team2Games":3},{"setNumber":3,"team1Games":6,"team2Games":4}]', 'team1', (current_date-5)::text, '17:00', 90,  null),
  ('m10', 'c1', 'ranked',     'best-of-3', 'completed', '{"p5","p3"}', '{"p4","p9"}', '[{"setNumber":1,"team1Games":3,"team2Games":6},{"setNumber":2,"team1Games":6,"team2Games":2},{"setNumber":3,"team1Games":4,"team2Games":6}]', 'team2', (current_date-6)::text, '10:00', 100, '{"p5":-12,"p3":-12,"p4":12,"p9":12}')
on conflict (id) do nothing;

-- ============================================================
-- COMMUNITIES (PadelSmash)
-- ============================================================
-- A community is an autonomous group inside Padelon with its own
-- player roster, admins, tournaments and history.

create table if not exists communities (
  id text primary key,
  slug text unique not null,
  name text not null,
  description text,
  logo_url text,
  cover_url text,
  created_at timestamptz default now()
);

-- Community players: each community keeps its own roster.
-- A community player can OPTIONALLY be linked to a Padelon user
-- (so that user sees the community on their profile) or a Padelon
-- player profile (to reuse global stats). Both links are nullable.
create table if not exists community_players (
  id text primary key,
  community_id text references communities(id) on delete cascade,
  name text not null,
  avatar_url text,
  contact_phone text,
  contact_email text,
  linked_user_id text references users(id) on delete set null,
  linked_player_id text references players(id) on delete set null,
  ntrp numeric(3,1),
  elo_rating integer default 1000,
  matches_played integer default 0,
  matches_won integer default 0,
  tournaments_won integer default 0,
  created_at timestamptz default now()
);

-- Migration for existing tables created before ntrp was added:
alter table community_players add column if not exists ntrp numeric(3,1);

create index if not exists idx_community_players_community on community_players(community_id);
create index if not exists idx_community_players_linked_user on community_players(linked_user_id);
create index if not exists idx_community_players_linked_player on community_players(linked_player_id);

-- Admins of a community. Set by super-admin (Padelon owner).
-- An admin is a Padelon user that can manage this community's roster,
-- tournaments and announcements.
create table if not exists community_admins (
  community_id text references communities(id) on delete cascade,
  user_id text references users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (community_id, user_id)
);

create index if not exists idx_community_admins_user on community_admins(user_id);

-- Community tournaments: Americano, Mexicano, team variants, and championships.
create table if not exists community_tournaments (
  id text primary key,
  community_id text references communities(id) on delete cascade,
  name text not null,
  description text,
  format text not null, -- 'americano' | 'mexicano' | 'team-americano' | 'team-mexicano' | 'championship'
  status text not null default 'draft', -- 'draft' | 'active' | 'completed' | 'cancelled'
  points_per_round integer not null default 24, -- 16, 24 or 32
  rounds_count integer, -- planned rounds (null for championship)
  start_date text,
  end_date text,
  winner_player_ids text[], -- ids in community_players
  cover_url text, -- group photo of winners
  created_by text references users(id),
  created_at timestamptz default now()
);

create index if not exists idx_community_tournaments_community on community_tournaments(community_id);
create index if not exists idx_community_tournaments_status on community_tournaments(status);

create table if not exists community_tournament_players (
  id text primary key,
  tournament_id text references community_tournaments(id) on delete cascade,
  community_player_id text references community_players(id) on delete cascade,
  team_id text, -- for team formats: players sharing the same team_id are partners
  seed integer, -- initial ranking (used by mexicano for round 1)
  total_points integer default 0,
  matches_played integer default 0,
  matches_won integer default 0,
  unique(tournament_id, community_player_id)
);

create index if not exists idx_ct_players_tournament on community_tournament_players(tournament_id);

create table if not exists community_tournament_rounds (
  id text primary key,
  tournament_id text references community_tournaments(id) on delete cascade,
  round_number integer not null,
  status text not null default 'pending', -- 'pending' | 'active' | 'completed'
  started_at timestamptz,
  completed_at timestamptz,
  unique(tournament_id, round_number)
);

create index if not exists idx_ct_rounds_tournament on community_tournament_rounds(tournament_id);

create table if not exists community_tournament_matches (
  id text primary key,
  round_id text references community_tournament_rounds(id) on delete cascade,
  tournament_id text references community_tournaments(id) on delete cascade,
  court_label text, -- 'Court 1', 'Court A' etc.
  team1_player_ids text[] not null,
  team2_player_ids text[] not null,
  team1_points integer,
  team2_points integer,
  status text not null default 'pending', -- 'pending' | 'completed'
  created_at timestamptz default now()
);

create index if not exists idx_ct_matches_round on community_tournament_matches(round_id);
create index if not exists idx_ct_matches_tournament on community_tournament_matches(tournament_id);

-- Seed the PadelSmash community itself.
insert into communities (id, slug, name, description, logo_url, cover_url) values
  ('padelsmash', 'padelsmash', 'PadelSmash',
   'PadelSmash community — Mexicano və Americano turnirləri, dostluq oyunları və daimi üzvlər.',
   null, null)
on conflict (id) do nothing;

-- Seed PadelSmash players (SMASH PADEL PLAYERS NTRP 20.05 — 80 players in rank order).
-- ELO = 2000 - (rank - 1) * 9 so that default sort by elo_rating preserves the image order.
insert into community_players (id, community_id, name, ntrp, elo_rating) values
  ('ps1',  'padelsmash', 'PHILL',     3.5, 2000),
  ('ps2',  'padelsmash', 'ERNAR',     4.0, 1991),
  ('ps3',  'padelsmash', 'Ismail',    4.0, 1982),
  ('ps4',  'padelsmash', 'KAMRAN V.', 3.5, 1973),
  ('ps5',  'padelsmash', 'FUAD',      3.5, 1964),
  ('ps6',  'padelsmash', 'MAX',       3.5, 1955),
  ('ps7',  'padelsmash', 'SHAUN',     3.5, 1946),
  ('ps8',  'padelsmash', 'SERGEY',    3.5, 1937),
  ('ps9',  'padelsmash', 'INARA',     3.0, 1928),
  ('ps10', 'padelsmash', 'PARVIZ',    3.0, 1919),
  ('ps11', 'padelsmash', 'ROMAN',     3.0, 1910),
  ('ps12', 'padelsmash', 'DANIZ',     3.0, 1901),
  ('ps13', 'padelsmash', 'ILYA K',    3.0, 1892),
  ('ps14', 'padelsmash', 'ILYA R.',   3.0, 1883),
  ('ps15', 'padelsmash', 'FAIK',      3.0, 1874),
  ('ps16', 'padelsmash', 'ATESH',     3.0, 1865),
  ('ps17', 'padelsmash', 'SABUHI',    3.0, 1856),
  ('ps18', 'padelsmash', 'SANAM',     3.0, 1847),
  ('ps19', 'padelsmash', 'VADIM',     3.0, 1838),
  ('ps20', 'padelsmash', 'EMILIYA',   3.0, 1829),
  ('ps21', 'padelsmash', 'NIJAT',     3.0, 1820),
  ('ps22', 'padelsmash', 'JALIL',     3.0, 1811),
  ('ps23', 'padelsmash', 'FARID',     3.0, 1802),
  ('ps24', 'padelsmash', 'AYDIN',     3.0, 1793),
  ('ps25', 'padelsmash', 'HUSEYN M.', 3.0, 1784),
  ('ps26', 'padelsmash', 'ALI',       3.0, 1775),
  ('ps27', 'padelsmash', 'AYNAR',     3.0, 1766),
  ('ps28', 'padelsmash', 'KRISTS',    3.0, 1757),
  ('ps29', 'padelsmash', 'Saimon',    3.0, 1748),
  ('ps30', 'padelsmash', 'ADIL',      2.5, 1739),
  ('ps31', 'padelsmash', 'Eldar',     2.5, 1730),
  ('ps32', 'padelsmash', 'BEK',       2.5, 1721),
  ('ps33', 'padelsmash', 'VADIM CH.', 2.5, 1712),
  ('ps34', 'padelsmash', 'HUSEYN N.', 2.5, 1703),
  ('ps35', 'padelsmash', 'HUSEYN B.', 2.5, 1694),
  ('ps36', 'padelsmash', 'OXSHAN',    2.5, 1685),
  ('ps37', 'padelsmash', 'SEYMUR',    2.5, 1676),
  ('ps38', 'padelsmash', 'TOKAY',     3.0, 1667),
  ('ps39', 'padelsmash', 'ELNUR',     3.0, 1658),
  ('ps40', 'padelsmash', 'Chinara',   2.0, 1649),
  ('ps41', 'padelsmash', 'BAYRAM',    2.5, 1640),
  ('ps42', 'padelsmash', 'VLADIMIR',  2.5, 1631),
  ('ps43', 'padelsmash', 'Teymur',    2.5, 1622),
  ('ps44', 'padelsmash', 'IRINA',     2.5, 1613),
  ('ps45', 'padelsmash', 'ABDULLA',   2.5, 1604),
  ('ps46', 'padelsmash', 'KAMRAN',    3.0, 1595),
  ('ps47', 'padelsmash', 'AYDAN',     2.5, 1586),
  ('ps48', 'padelsmash', 'GUMUS',     2.5, 1577),
  ('ps49', 'padelsmash', 'Rufat',     2.5, 1568),
  ('ps50', 'padelsmash', 'ALEX',      2.5, 1559),
  ('ps51', 'padelsmash', 'NILUFAR',   2.0, 1550),
  ('ps52', 'padelsmash', 'HANIFA',    2.5, 1541),
  ('ps53', 'padelsmash', 'ARIF',      2.5, 1532),
  ('ps54', 'padelsmash', 'MAHMUD',    2.5, 1523),
  ('ps55', 'padelsmash', 'SLAVA',     2.5, 1514),
  ('ps56', 'padelsmash', 'HIDAYAT',   3.0, 1505),
  ('ps57', 'padelsmash', 'RAUL',      2.5, 1496),
  ('ps58', 'padelsmash', 'HEZI',      2.5, 1487),
  ('ps59', 'padelsmash', 'ELENA',     2.0, 1478),
  ('ps60', 'padelsmash', 'ANATOLIY',  2.5, 1469),
  ('ps61', 'padelsmash', 'ALEKSANDR', 2.0, 1460),
  ('ps62', 'padelsmash', 'CHINGIZ',   2.5, 1451),
  ('ps63', 'padelsmash', 'ELDAR..',   2.5, 1442),
  ('ps64', 'padelsmash', 'EMIL',      2.0, 1433),
  ('ps65', 'padelsmash', 'ZIYA',      2.5, 1424),
  ('ps66', 'padelsmash', 'PEDRO',     2.5, 1415),
  ('ps67', 'padelsmash', 'RIAD',      2.0, 1406),
  ('ps68', 'padelsmash', 'KHAYAL',    2.0, 1397),
  ('ps69', 'padelsmash', 'TALEH',     2.5, 1388),
  ('ps70', 'padelsmash', 'JAVID',     2.5, 1379),
  ('ps71', 'padelsmash', 'GÜNEL',     2.0, 1370),
  ('ps72', 'padelsmash', 'ORXAN...',  2.5, 1361),
  ('ps73', 'padelsmash', 'FARXAD',    2.0, 1352),
  ('ps74', 'padelsmash', 'TAYYAR',    2.5, 1343),
  ('ps75', 'padelsmash', 'NARMINA',   2.0, 1334),
  ('ps76', 'padelsmash', 'VLADIMIR',  3.0, 1325),
  ('ps77', 'padelsmash', 'NARGIZ',    2.0, 1316),
  ('ps78', 'padelsmash', 'ORXAN',     2.0, 1307),
  ('ps79', 'padelsmash', 'JAMIL',     2.0, 1298),
  ('ps80', 'padelsmash', 'KAMIL',     2.5, 1289)
on conflict (id) do nothing;
