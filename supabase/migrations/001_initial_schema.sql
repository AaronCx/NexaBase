-- ============================================================
-- NexaBase — Initial Schema Migration
-- Run via: supabase db push  OR  psql -f 001_initial_schema.sql
-- ============================================================

-- ── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ── Enums ─────────────────────────────────────────────────────────────────────
create type public.tier_type as enum ('free', 'pro');

-- ── Profiles ──────────────────────────────────────────────────────────────────
-- Mirrors auth.users; one row per Supabase auth user.
create table if not exists public.profiles (
  id                       uuid        primary key references auth.users(id) on delete cascade,
  email                    text        not null,
  full_name                text,
  tier                     tier_type   not null default 'free',
  messages_used_this_month integer     not null default 0,
  usage_period_start       timestamptz not null default now(),
  stripe_customer_id       text        unique,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

comment on table public.profiles is 'One row per registered user; extended profile + billing state.';

-- Auto-create profile on new Supabase auth sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep updated_at fresh automatically
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ── Conversations ─────────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  title      text        not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_user_id_idx on public.conversations(user_id);
create index if not exists conversations_updated_at_idx on public.conversations(updated_at desc);

drop trigger if exists conversations_updated_at on public.conversations;
create trigger conversations_updated_at
  before update on public.conversations
  for each row execute procedure public.set_updated_at();

-- ── Messages ──────────────────────────────────────────────────────────────────
create type public.message_role as enum ('user', 'assistant', 'system');

create table if not exists public.messages (
  id              uuid         primary key default gen_random_uuid(),
  conversation_id uuid         not null references public.conversations(id) on delete cascade,
  role            message_role not null,
  content         text         not null,
  created_at      timestamptz  not null default now()
);

create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists messages_created_at_idx      on public.messages(created_at);

-- Update conversation title from first user message
create or replace function public.set_conversation_title()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'user' then
    update public.conversations
    set title = left(new.content, 60),
        updated_at = now()
    where id = new.conversation_id
      and title = 'New conversation';
  else
    update public.conversations
    set updated_at = now()
    where id = new.conversation_id;
  end if;
  return new;
end;
$$;

drop trigger if exists messages_update_conversation on public.messages;
create trigger messages_update_conversation
  after insert on public.messages
  for each row execute procedure public.set_conversation_title();

-- ── Usage Logs ────────────────────────────────────────────────────────────────
create table if not exists public.usage_logs (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  action      text        not null,
  tokens_used integer,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists usage_logs_user_id_idx   on public.usage_logs(user_id);
create index if not exists usage_logs_created_at_idx on public.usage_logs(created_at desc);

-- ── Row Level Security ────────────────────────────────────────────────────────

-- profiles: users can only see/update their own row
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- conversations: users own their conversations
alter table public.conversations enable row level security;
drop policy if exists "conversations_select_own" on public.conversations;
create policy "conversations_select_own"
  on public.conversations for select
  using (auth.uid() = user_id);

drop policy if exists "conversations_insert_own" on public.conversations;
create policy "conversations_insert_own"
  on public.conversations for insert
  with check (auth.uid() = user_id);

drop policy if exists "conversations_update_own" on public.conversations;
create policy "conversations_update_own"
  on public.conversations for update
  using (auth.uid() = user_id);

drop policy if exists "conversations_delete_own" on public.conversations;
create policy "conversations_delete_own"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- messages: users can only access messages in their conversations
alter table public.messages enable row level security;
drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

-- usage_logs: users see only their own
alter table public.usage_logs enable row level security;
drop policy if exists "usage_logs_select_own" on public.usage_logs;
create policy "usage_logs_select_own"
  on public.usage_logs for select
  using (auth.uid() = user_id);
