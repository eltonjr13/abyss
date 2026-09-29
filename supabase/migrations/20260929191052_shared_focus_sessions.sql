create table public.focus_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('running', 'paused', 'completed', 'abandoned')),
  biome text not null check (biome in ('reef', 'kelp', 'mangrove', 'island', 'deep', 'abyss')),
  planned_seconds integer check (planned_seconds between 60 and 10800),
  elapsed_ms bigint not null default 0 check (elapsed_ms >= 0),
  running_since timestamptz,
  quote text not null check (length(quote) <= 500),
  origin text not null check (origin in ('mobile', 'extension', 'web')),
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  check ((status = 'running') = (running_since is not null))
);

create unique index focus_one_active_per_user on public.focus_sessions(user_id)
  where status in ('running', 'paused');
create index focus_user_history on public.focus_sessions(user_id, created_at desc);
alter table public.focus_sessions enable row level security;
revoke all on public.focus_sessions from public, anon, authenticated;
grant select, insert, update on public.focus_sessions to authenticated;
create policy focus_read_own on public.focus_sessions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy focus_insert_own on public.focus_sessions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy focus_update_own on public.focus_sessions for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- All supported commands are serialized per account and use the server clock.
-- Invoker + RLS: this function never gains access to another account's rows.
create function public.focus_command(
  p_command text, p_id uuid default null, p_revision integer default null,
  p_seconds integer default null, p_biome text default 'reef',
  p_quote text default 'Um respiro de cada vez.', p_origin text default 'web'
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := clock_timestamp();
  v_session public.focus_sessions;
  v_elapsed bigint;
  v_end timestamptz;
begin
  if v_user is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if p_command not in ('start', 'pause', 'resume', 'complete', 'abandon', 'refresh') then
    raise exception 'invalid_command' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  v_now := clock_timestamp();
  select * into v_session from public.focus_sessions
    where user_id = v_user and status in ('running', 'paused') for update;

  -- Finish overdue timed sessions before accepting another start or command.
  if v_session.id is not null and v_session.status = 'running' and v_session.planned_seconds is not null then
    v_end := v_session.running_since +
      (v_session.planned_seconds * 1000 - v_session.elapsed_ms) * interval '1 millisecond';
    if v_now >= v_end then
      update public.focus_sessions set status = 'completed', running_since = null,
        elapsed_ms = planned_seconds * 1000, completed_at = v_end,
        updated_at = v_now, revision = revision + 1 where id = v_session.id
        returning * into v_session;
      if p_command <> 'start' then
        return jsonb_build_object('session', to_jsonb(v_session), 'conflict', false, 'server_now', v_now);
      end if;
      v_session := null;
    end if;
  end if;

  if p_command = 'start' then
    if v_session.id is not null then
      return jsonb_build_object('session', to_jsonb(v_session), 'conflict', true, 'server_now', v_now);
    end if;
    -- A retried start must never recreate an already finished session.
    select * into v_session from public.focus_sessions where id = p_id and user_id = v_user;
    if v_session.id is null then
      insert into public.focus_sessions(id, user_id, status, biome, planned_seconds,
        running_since, quote, origin) values
        (coalesce(p_id, gen_random_uuid()), v_user, 'running', p_biome, p_seconds, v_now, p_quote, p_origin)
        returning * into v_session;
    end if;
  elsif p_command <> 'refresh' then
    if v_session.id is null then
      select * into v_session from public.focus_sessions where id = p_id and user_id = v_user;
    elsif v_session.id <> p_id or v_session.revision is distinct from p_revision then
      return jsonb_build_object('session', to_jsonb(v_session), 'conflict', true, 'server_now', v_now);
    else
      v_elapsed := v_session.elapsed_ms + case when v_session.running_since is null then 0
        else greatest(0, floor(extract(epoch from (v_now - v_session.running_since)) * 1000)::bigint) end;
      if v_session.planned_seconds is not null then
        v_elapsed := least(v_elapsed, v_session.planned_seconds * 1000);
      end if;
      if p_command = 'complete' and v_elapsed < 60000 then
        raise exception 'minimum_focus_is_60_seconds' using errcode = '22023';
      end if;
      if (p_command = 'pause' and v_session.status = 'running') or
         (p_command = 'resume' and v_session.status = 'paused') or
         p_command in ('complete', 'abandon') then
        update public.focus_sessions set
          status = case p_command when 'pause' then 'paused' when 'resume' then 'running'
            when 'complete' then 'completed' else 'abandoned' end,
          elapsed_ms = v_elapsed,
          running_since = case when p_command = 'resume' then v_now else null end,
          completed_at = case when p_command = 'complete' then v_now else null end,
          updated_at = v_now, revision = revision + 1 where id = v_session.id
          returning * into v_session;
      end if;
    end if;
  end if;
  return jsonb_build_object('session', case when v_session.id is null then null else to_jsonb(v_session) end,
    'conflict', false, 'server_now', v_now);
end;
$$;
revoke all on function public.focus_command(text, uuid, integer, integer, text, text, text) from public, anon;
grant execute on function public.focus_command(text, uuid, integer, integer, text, text, text) to authenticated;
alter publication supabase_realtime add table public.focus_sessions;
