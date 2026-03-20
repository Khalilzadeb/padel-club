-- ============================================================
-- PADEL CLUB — Supabase Schema + Seed Data
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- TABLES

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
