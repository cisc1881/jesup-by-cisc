create table public.event_presenter_settings (
  event_id uuid primary key references public.events(id) on delete cascade,
  enabled boolean not null default false,
  opens_at timestamptz,
  closes_at timestamptz,
  allowed_mime_types text[] not null default array['application/pdf','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.ms-powerpoint'],
  max_file_bytes integer not null default 26214400,
  instructions text,
  updated_by uuid,
  updated_at timestamptz not null default now()
);
grant select on public.event_presenter_settings to authenticated;
grant all on public.event_presenter_settings to service_role;

create table public.event_presenters (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null,
  presenter_type text not null default 'student' check (presenter_type in ('student','faculty')),
  session_id uuid references public.event_sessions(id) on delete set null,
  display_name text,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);
grant select, insert, update, delete on public.event_presenters to authenticated;
grant all on public.event_presenters to service_role;

create table public.event_presenter_submissions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  presenter_id uuid not null references public.event_presenters(id) on delete cascade,
  kind text not null check (kind in ('proposal','slides','material')),
  title text not null,
  file_path text not null,
  file_name text not null,
  file_size integer not null,
  mime_type text not null,
  is_current boolean not null default true,
  uploaded_by uuid not null,
  created_at timestamptz not null default now()
);
create unique index event_presenter_submissions_current_idx on public.event_presenter_submissions (presenter_id, kind) where is_current;
grant select, insert, update on public.event_presenter_submissions to authenticated;
grant all on public.event_presenter_submissions to service_role;

create table public.event_presenter_access_log (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  submission_id uuid references public.event_presenter_submissions(id) on delete set null,
  actor_id uuid not null,
  action text not null check (action in ('upload','replace','download')),
  created_at timestamptz not null default now()
);
grant select, insert on public.event_presenter_access_log to authenticated;
grant all on public.event_presenter_access_log to service_role;

create or replace function public.is_event_staff(p_event_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin') or exists (
    select 1 from public.event_staff_assignments
    where event_id = p_event_id and user_id = auth.uid() and is_active = true
  )
$$;

create or replace function public.is_event_presenter(p_event_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.event_presenters
    where event_id = p_event_id and user_id = auth.uid()
  )
$$;

create or replace function public.presenter_submissions_open(p_event_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.event_presenter_settings s
    where s.event_id = p_event_id and s.enabled
      and (s.opens_at is null or s.opens_at <= now())
      and (s.closes_at is null or s.closes_at > now())
  )
$$;

grant execute on function public.is_event_staff(uuid) to authenticated;
grant execute on function public.is_event_presenter(uuid) to authenticated;
grant execute on function public.presenter_submissions_open(uuid) to authenticated;

alter table public.event_presenter_settings enable row level security;
create policy "Presenters and staff read submission settings" on public.event_presenter_settings for select to authenticated
  using (public.is_event_staff(event_id) or public.is_event_presenter(event_id));
create policy "Event staff manage submission settings" on public.event_presenter_settings for all to authenticated
  using (public.is_event_staff(event_id)) with check (public.is_event_staff(event_id));

alter table public.event_presenters enable row level security;
create policy "Presenters read own access" on public.event_presenters for select to authenticated
  using (user_id = auth.uid() or public.is_event_staff(event_id));
create policy "Event staff manage presenters" on public.event_presenters for all to authenticated
  using (public.is_event_staff(event_id)) with check (public.is_event_staff(event_id));

alter table public.event_presenter_submissions enable row level security;
create policy "Presenters and staff read submissions" on public.event_presenter_submissions for select to authenticated
  using (public.is_event_staff(event_id) or exists (
    select 1 from public.event_presenters p where p.id = presenter_id and p.user_id = auth.uid()
  ));
create policy "Presenters add files while open" on public.event_presenter_submissions for insert to authenticated
  with check (public.presenter_submissions_open(event_id) and uploaded_by = auth.uid() and exists (
    select 1 from public.event_presenters p where p.id = presenter_id and p.user_id = auth.uid() and p.event_id = event_id
  ));
create policy "Presenters replace files while open" on public.event_presenter_submissions for update to authenticated
  using (public.presenter_submissions_open(event_id) and exists (
    select 1 from public.event_presenters p where p.id = presenter_id and p.user_id = auth.uid()
  )) with check (public.presenter_submissions_open(event_id));

alter table public.event_presenter_access_log enable row level security;
create policy "Event staff read access log" on public.event_presenter_access_log for select to authenticated
  using (public.is_event_staff(event_id));
create policy "Actors log their own access" on public.event_presenter_access_log for insert to authenticated
  with check (actor_id = auth.uid());

create or replace function public.submit_presenter_file(
  p_event_id uuid, p_kind text, p_title text, p_file_path text, p_file_name text, p_file_size integer, p_mime_type text
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_presenter public.event_presenters%rowtype;
  v_settings public.event_presenter_settings%rowtype;
  v_id uuid;
  v_replacing boolean;
begin
  select * into v_presenter from public.event_presenters where event_id = p_event_id and user_id = auth.uid();
  if not found then raise exception 'You are not an authorized presenter for this event.'; end if;
  if not public.presenter_submissions_open(p_event_id) then raise exception 'Presenter submissions are not open for this event.'; end if;
  select * into v_settings from public.event_presenter_settings where event_id = p_event_id;
  if p_kind not in ('proposal','slides','material') then raise exception 'Unknown submission type.'; end if;
  if not (p_mime_type = any(v_settings.allowed_mime_types)) then raise exception 'This file type is not accepted for this event.'; end if;
  if p_file_size is null or p_file_size < 1 or p_file_size > v_settings.max_file_bytes then raise exception 'File exceeds the allowed size.'; end if;
  if p_file_path not like p_event_id::text || '/' || v_presenter.id::text || '/%' then raise exception 'File path does not match this event and presenter.'; end if;
  select exists(select 1 from public.event_presenter_submissions where presenter_id = v_presenter.id and kind = p_kind and is_current) into v_replacing;
  update public.event_presenter_submissions set is_current = false where presenter_id = v_presenter.id and kind = p_kind and is_current;
  insert into public.event_presenter_submissions (event_id, presenter_id, kind, title, file_path, file_name, file_size, mime_type, is_current, uploaded_by)
    values (p_event_id, v_presenter.id, p_kind, coalesce(nullif(trim(p_title), ''), p_file_name), p_file_path, p_file_name, p_file_size, p_mime_type, true, auth.uid())
    returning id into v_id;
  insert into public.event_presenter_access_log (event_id, submission_id, actor_id, action)
    values (p_event_id, v_id, auth.uid(), case when v_replacing then 'replace' else 'upload' end);
  return v_id;
end $$;
grant execute on function public.submit_presenter_file(uuid, text, text, text, text, integer, text) to authenticated;