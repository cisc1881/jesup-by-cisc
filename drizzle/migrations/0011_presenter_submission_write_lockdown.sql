-- Close direct-write bypass: all submission writes go through submit_presenter_file.
revoke insert, update on public.event_presenter_submissions from authenticated;
drop policy "Presenters add files while open" on public.event_presenter_submissions;
drop policy "Presenters replace files while open" on public.event_presenter_submissions;

-- Close forged audit events: access log rows are written only by secure functions.
revoke insert on public.event_presenter_access_log from authenticated;
drop policy "Actors log their own access" on public.event_presenter_access_log;

-- Allow logging staff file removals.
alter table public.event_presenter_access_log drop constraint event_presenter_access_log_action_check;
alter table public.event_presenter_access_log add constraint event_presenter_access_log_action_check check (action in ('upload','replace','download','remove'));

-- Hardened submit: verifies the storage object exists and matches the claimed size.
create or replace function public.submit_presenter_file(
  p_event_id uuid, p_kind text, p_title text, p_file_path text, p_file_name text, p_file_size integer, p_mime_type text
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_presenter public.event_presenters%rowtype;
  v_settings public.event_presenter_settings%rowtype;
  v_id uuid;
  v_replacing boolean;
  v_object_size bigint;
begin
  select * into v_presenter from public.event_presenters where event_id = p_event_id and user_id = auth.uid();
  if not found then raise exception 'You are not an authorized presenter for this event.'; end if;
  if not public.presenter_submissions_open(p_event_id) then raise exception 'Presenter submissions are not open for this event.'; end if;
  select * into v_settings from public.event_presenter_settings where event_id = p_event_id;
  if p_kind not in ('proposal','slides','material') then raise exception 'Unknown submission type.'; end if;
  if not (p_mime_type = any(v_settings.allowed_mime_types)) then raise exception 'This file type is not accepted for this event.'; end if;
  if p_file_size is null or p_file_size < 1 or p_file_size > v_settings.max_file_bytes then raise exception 'File exceeds the allowed size.'; end if;
  if p_file_path not like p_event_id::text || '/' || v_presenter.id::text || '/%' then raise exception 'File path does not match this event and presenter.'; end if;
  if p_file_path like '%..%' then raise exception 'Invalid file path.'; end if;
  -- The object must actually exist in the private bucket at the claimed path.
  select (o.metadata->>'size')::bigint into v_object_size
    from storage.objects o
    where o.bucket_id = 'presenter-files' and o.name = p_file_path;
  if not found then raise exception 'Uploaded file not found in storage.'; end if;
  if v_object_size is not null and v_object_size <> p_file_size then raise exception 'File size does not match the uploaded object.'; end if;
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

-- Server-side audit logging: event and actor are derived from the submission row and session, never from caller input.
create or replace function public.log_presenter_file_access(p_submission_id uuid, p_action text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_sub public.event_presenter_submissions%rowtype;
begin
  if auth.uid() is null then raise exception 'Not authenticated.'; end if;
  if p_action not in ('download','remove') then raise exception 'Unknown access action.'; end if;
  select * into v_sub from public.event_presenter_submissions where id = p_submission_id;
  if not found then raise exception 'Submission not found.'; end if;
  if not (public.is_event_staff(v_sub.event_id) or exists (
    select 1 from public.event_presenters p where p.id = v_sub.presenter_id and p.user_id = auth.uid()
  )) then raise exception 'Not authorized for this submission.'; end if;
  insert into public.event_presenter_access_log (event_id, submission_id, actor_id, action)
    values (v_sub.event_id, v_sub.id, auth.uid(), p_action);
end $$;
grant execute on function public.log_presenter_file_access(uuid, text) to authenticated;