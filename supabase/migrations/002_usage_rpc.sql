-- ============================================================
-- NexaBase — Usage tracking RPC (atomic increment + quota check)
-- ============================================================

create or replace function public.increment_message_usage(p_user_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_tier                   tier_type;
  v_used                   integer;
  v_limit                  integer;
  v_period_start           timestamptz;
  v_now                    timestamptz := now();
  v_period_start_of_month  timestamptz;
begin
  -- Lock the row for update
  select tier, messages_used_this_month, usage_period_start
  into   v_tier, v_used, v_period_start
  from   public.profiles
  where  id = p_user_id
  for update;

  if not found then
    raise exception 'User profile not found for id %', p_user_id;
  end if;

  -- Determine quota
  v_limit := case when v_tier = 'pro' then 5000 else 50 end;

  -- Reset counter if we've rolled into a new calendar month
  v_period_start_of_month := date_trunc('month', v_now);
  if v_period_start < v_period_start_of_month then
    v_used         := 0;
    v_period_start := v_period_start_of_month;
  end if;

  -- Quota check (without incrementing)
  if v_used >= v_limit then
    return jsonb_build_object(
      'quota_exceeded',  true,
      'messages_used',   v_used,
      'messages_limit',  v_limit,
      'tier',            v_tier::text
    );
  end if;

  -- Atomic increment
  v_used := v_used + 1;

  update public.profiles
  set    messages_used_this_month = v_used,
         usage_period_start       = v_period_start,
         updated_at               = v_now
  where  id = p_user_id;

  -- Append to audit log
  insert into public.usage_logs (user_id, action)
  values (p_user_id, 'ai_message');

  return jsonb_build_object(
    'quota_exceeded',  false,
    'messages_used',   v_used,
    'messages_limit',  v_limit,
    'tier',            v_tier::text
  );
end;
$$;

comment on function public.increment_message_usage(uuid) is
  'Atomically check quota and increment monthly message counter. '
  'Returns quota_exceeded=true without incrementing if limit reached.';

-- Grant execute to authenticated users (called via service role from backend)
-- revoke execute on function public.increment_message_usage(uuid) from public;
-- grant  execute on function public.increment_message_usage(uuid) to service_role;
