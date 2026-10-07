create table if not exists public.daily_upgrade_log (
    id uuid primary key default gen_random_uuid(),
    entry text not null
        check (char_length(btrim(entry)) between 1 and 1000),
    created_at timestamptz not null default now(),
    created_by uuid not null references auth.users(id) on delete cascade
);

alter table public.daily_upgrade_log enable row level security;

revoke all on public.daily_upgrade_log from anon, authenticated;
grant select, insert on public.daily_upgrade_log to authenticated;

drop policy if exists "Authenticated members can read upgrade log"
    on public.daily_upgrade_log;
create policy "Authenticated members can read upgrade log"
    on public.daily_upgrade_log
    for select
    to authenticated
    using (auth.uid() is not null);

drop policy if exists "Admins can publish upgrade log entries"
    on public.daily_upgrade_log;
create policy "Admins can publish upgrade log entries"
    on public.daily_upgrade_log
    for insert
    to authenticated
    with check (
        auth.uid() = created_by
        and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );
