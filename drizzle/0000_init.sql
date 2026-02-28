-- Initial schema for Holy Water Reservas (PostgreSQL)
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customers_phone_idx on customers(phone);
create index if not exists customers_name_idx on customers(name);

create table if not exists dining_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  width int not null default 900,
  height int not null default 560,
  background text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tables (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references dining_rooms(id) on delete set null,
  code text not null,
  name text not null,
  capacity int not null default 2,
  shape text not null default 'round',
  status text not null default 'available',
  is_active boolean not null default true,
  x int not null default 10,
  y int not null default 10,
  w int not null default 90,
  h int not null default 90,
  rotation int not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tables_room_idx on tables(room_id);
create index if not exists tables_code_idx on tables(code);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  customer_id uuid references customers(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  reservation_date date not null,
  reservation_time time not null,
  party_size int not null default 2,
  status text not null default 'pending',
  table_id uuid references tables(id) on delete set null,
  notes text,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reservations_date_idx on reservations(reservation_date);
create index if not exists reservations_table_idx on reservations(table_id);

create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text,
  party_size int not null default 2,
  status text not null default 'waiting',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists waitlist_status_idx on waitlist(status);

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists restaurant_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists support_audit (
  id uuid primary key default gen_random_uuid(),
  actor text not null default 'system',
  action text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  role text not null,
  content text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create table if not exists memory_short (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  value text not null,
  created_at timestamptz not null default now()
);

create table if not exists memory_long (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  value text not null,
  created_at timestamptz not null default now()
);
