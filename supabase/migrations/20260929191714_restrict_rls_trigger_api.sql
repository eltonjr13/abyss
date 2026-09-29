-- The platform's DDL event trigger stays active; clients cannot call its helper.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
