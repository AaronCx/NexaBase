-- ============================================================
-- NexaBase — Additional indexes & helper views
-- ============================================================

-- Partial index for active Pro subscribers (fast billing queries)
create index if not exists profiles_pro_idx
  on public.profiles(id)
  where tier = 'pro';

-- Partial index for users near quota (alerting / marketing)
create index if not exists profiles_near_quota_idx
  on public.profiles(id, messages_used_this_month)
  where messages_used_this_month > 40;

-- ── Views ─────────────────────────────────────────────────────────────────────

-- Conversation list with message counts (used by the API)
create or replace view public.conversation_summaries as
select
  c.id,
  c.user_id,
  c.title,
  c.created_at,
  c.updated_at,
  count(m.id)::int as message_count
from public.conversations c
left join public.messages m on m.conversation_id = c.id
group by c.id, c.user_id, c.title, c.created_at, c.updated_at;

-- Monthly usage summary per user
create or replace view public.monthly_usage_summary as
select
  u.user_id,
  date_trunc('month', u.created_at) as month,
  count(*)::int as total_messages,
  sum(coalesce(u.tokens_used, 0))::bigint as total_tokens
from public.usage_logs u
where u.action = 'ai_message'
group by u.user_id, date_trunc('month', u.created_at);
