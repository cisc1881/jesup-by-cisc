-- Optional per-speaker keynote/featured designation and admin-configured public follow-up fields.
alter table public.event_speakers
  add column is_keynote boolean not null default false,
  add column website_url text,
  add column social_links jsonb not null default '[]'::jsonb,
  add column contact_email text,
  add column contact_phone text;

-- Event-scoped speaker <-> session assignment.
create table public.event_session_speakers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  session_id uuid not null references public.event_sessions(id) on delete cascade,
  speaker_id uuid not null references public.event_speakers(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (session_id, speaker_id)
);
create index event_session_speakers_event_idx on public.event_session_speakers (event_id);
create index event_session_speakers_speaker_idx on public.event_session_speakers (speaker_id);

grant select on public.event_session_speakers to anon, authenticated;
grant all on public.event_session_speakers to service_role;

alter table public.event_session_speakers enable row level security;
create policy "event session speakers public read" on public.event_session_speakers for select to anon, authenticated
  using (exists (
    select 1 from public.events e
    where e.id = event_session_speakers.event_id
      and ((e.status = 'published' and e.is_active = true) or public.has_role(auth.uid(), 'admin'))
  ));
create policy "event session speakers admin write" on public.event_session_speakers for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));