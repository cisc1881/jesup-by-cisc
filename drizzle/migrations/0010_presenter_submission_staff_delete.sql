grant delete on public.event_presenter_submissions to authenticated;
create policy "Event staff remove submission files" on public.event_presenter_submissions for delete to authenticated
  using (public.is_event_staff(event_id));