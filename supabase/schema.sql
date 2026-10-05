-- Smoky Bubble Loyalty App — run in Supabase SQL editor

create table if not exists customers (
  id                   uuid        primary key default gen_random_uuid(),
  name                 text        not null,
  phone                text        unique not null,
  total_visits         integer     not null default 0,
  current_punches      integer     not null default 0,
  total_rewards_earned integer     not null default 0,
  is_vip               boolean     not null default false,
  notes                text        not null default '',
  last_visit_at        timestamptz,
  created_at           timestamptz not null default now(),
  vape_under20_count   integer     not null default 0,
  vape_over20_count    integer     not null default 0,
  dob                  date,
  sms_opt_in           boolean     not null default false
);

-- Migration: run once if table already exists
-- alter table customers add column if not exists vape_under20_count integer not null default 0;
-- alter table customers add column if not exists vape_over20_count integer not null default 0;
-- alter table customers add column if not exists dob date;
-- alter table customers add column if not exists sms_opt_in boolean not null default false;

create table if not exists checkins (
  id             uuid        primary key default gen_random_uuid(),
  customer_id    uuid        not null references customers(id) on delete cascade,
  checked_in_at  timestamptz not null default now(),
  punches_before integer     not null,
  punches_after  integer     not null,
  reward_earned  text
);

create table if not exists rewards_earned (
  id           uuid        primary key default gen_random_uuid(),
  customer_id  uuid        not null references customers(id) on delete cascade,
  reward_name  text        not null,
  earned_at    timestamptz not null default now(),
  redeemed     boolean     not null default false
);

create table if not exists settings (
  id    uuid primary key default gen_random_uuid(),
  key   text unique not null,
  value text not null
);

alter publication supabase_realtime add table customers;
alter publication supabase_realtime add table checkins;
alter publication supabase_realtime add table rewards_earned;
alter publication supabase_realtime add table settings;

alter table customers      enable row level security;
alter table checkins        enable row level security;
alter table rewards_earned  enable row level security;
alter table settings        enable row level security;

create policy "public_all" on customers      for all using (true) with check (true);
create policy "public_all" on checkins        for all using (true) with check (true);
create policy "public_all" on rewards_earned  for all using (true) with check (true);
create policy "public_all" on settings        for all using (true) with check (true);

create index if not exists customers_phone_idx  on customers(phone);
create index if not exists checkins_customer_idx on checkins(customer_id);
create index if not exists checkins_time_idx     on checkins(checked_in_at desc);
