-- Integration assertions on disposable users; ROLLBACK leaves no users or sessions.
begin;
select set_config('mergulhe.test_a', gen_random_uuid()::text, true);
select set_config('mergulhe.test_b', gen_random_uuid()::text, true);
insert into auth.users(id) values (current_setting('mergulhe.test_a')::uuid), (current_setting('mergulhe.test_b')::uuid);
select set_config('request.jwt.claim.sub', current_setting('mergulhe.test_a'), true);
set local role authenticated;
do $$
declare
  a jsonb;
  b jsonb;
  session_id uuid := gen_random_uuid();
begin
  a := public.focus_command('start', session_id, null, 300, 'reef', 'Teste', 'mobile');
  assert a->'session'->>'status' = 'running', 'start failed';
  b := public.focus_command('start', gen_random_uuid(), null, 300, 'reef', 'Teste', 'extension');
  assert (b->>'conflict')::boolean and b->'session'->>'id' = session_id::text, 'second active session accepted';
  a := public.focus_command('pause', session_id, 1);
  assert a->'session'->>'status' = 'paused', 'pause failed';
  b := public.focus_command('resume', session_id, 1);
  assert (b->>'conflict')::boolean and b->'session'->>'status' = 'paused', 'stale revision accepted';
  a := public.focus_command('resume', session_id, 2);
  assert a->'session'->>'status' = 'running', 'resume failed';
  begin
    perform public.focus_command('complete', session_id, 3);
    raise exception 'short session rewarded';
  exception when invalid_parameter_value then null; end;
  update public.focus_sessions set running_since = now() - interval '301 seconds' where id = session_id;
  a := public.focus_command('refresh');
  assert a->'session'->>'status' = 'completed' and (a->'session'->>'elapsed_ms')::bigint = 300000, 'scheduled completion failed';
  b := public.focus_command('complete', session_id, 3);
  assert b->'session'->>'completed_at' = a->'session'->>'completed_at', 'completion not idempotent';
  b := public.focus_command('start', session_id, null, 300, 'reef', 'Teste', 'extension');
  assert b->'session'->>'status' = 'completed', 'retried start recreated finished session';
  begin
    update public.focus_sessions set user_id = current_setting('mergulhe.test_b')::uuid where id = session_id;
    raise exception 'ownership reassignment accepted';
  exception when insufficient_privilege then null; end;
end;
$$;
select set_config('request.jwt.claim.sub', current_setting('mergulhe.test_b'), true);
do $$ begin
  assert (select count(*) from public.focus_sessions) = 0, 'another account can read sessions';
end $$;
set local role anon;
do $$ begin
  begin
    perform public.focus_command('refresh');
    raise exception 'anonymous command accepted';
  exception when insufficient_privilege then null; end;
end $$;
select 'start, conflict, pause, resume, minimum duration, overdue completion, retry, ownership and anonymous access: OK' as assertions;
rollback;
