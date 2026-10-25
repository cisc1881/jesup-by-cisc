-- Transactional entry points. No client role has direct write grants on finance tables.
create or replace function public.save_procurement_event_settings(
  p_event_id uuid,p_enabled boolean,p_methods text[],p_seller_name text,p_seller_address jsonb,
  p_remit_instructions text,p_terms text,p_custom_terms_days integer,p_quote_expiration_days integer,
  p_confirm_on text
) returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.can_manage_procurement_event(p_event_id) then raise exception 'Event finance access required'; end if;
  if p_methods is null or not (p_methods <@ array['purchase_order','invoice','check','institutional_sponsorship','registration_code']::text[])
    then raise exception 'Unknown procurement method'; end if;
  if p_enabled and (nullif(btrim(p_seller_name),'') is null or not ('purchase_order'=any(p_methods) or 'invoice'=any(p_methods)))
    then raise exception 'Provide a seller and an institutional payment method before enabling'; end if;
  if p_enabled and nullif(btrim(coalesce(p_remit_instructions,'')),'') is null
    then raise exception 'Remittance instructions are required before enabling'; end if;
  if p_enabled and not exists (select 1 from public.event_products p where p.event_id=p_event_id
    and p.is_active and p.kind='ticket' and p.price_cents is not null and p.currency='USD')
    then raise exception 'Configure an active priced admission ticket before enabling'; end if;
  if p_confirm_on not in ('po_approved','invoice_paid') then
    raise exception 'Choose a supported registration threshold'; end if;
  insert into public.procurement_event_settings(event_id,enabled,accepted_methods,seller_name,seller_address,
    remit_instructions,terms,custom_terms_days,quote_expiration_days,confirm_registration_on,updated_by)
  values(p_event_id,p_enabled,p_methods,left(btrim(p_seller_name),200),coalesce(p_seller_address,'{}'::jsonb),
    left(p_remit_instructions,2000),p_terms,p_custom_terms_days,p_quote_expiration_days,p_confirm_on,auth.uid())
  on conflict(event_id) do update set enabled=excluded.enabled,accepted_methods=excluded.accepted_methods,
    seller_name=excluded.seller_name,seller_address=excluded.seller_address,remit_instructions=excluded.remit_instructions,
    terms=excluded.terms,custom_terms_days=excluded.custom_terms_days,quote_expiration_days=excluded.quote_expiration_days,
    confirm_registration_on=excluded.confirm_registration_on,updated_by=excluded.updated_by;
end $$;

create or replace function public.request_procurement_quote(
  p_event_id uuid, p_profile_id uuid, p_billing jsonb, p_lines jsonb, p_registrants jsonb
) returns uuid language plpgsql security definer set search_path=public as $$
declare
  v_settings public.procurement_event_settings%rowtype;
  v_event public.events%rowtype;
  v_profile public.institution_procurement_profiles%rowtype;
  v_order_id uuid;
  v_line jsonb;
  v_registrant jsonb;
  v_product public.event_products%rowtype;
  v_qty integer;
  v_total bigint := 0;
  v_ticket_count integer := 0;
  v_registrant_count integer := 0;
  v_field text;
  v_name text;
  v_email text;
begin
  if auth.uid() is null then raise exception 'Sign in to request a quote'; end if;
  select * into v_settings from public.procurement_event_settings where event_id=p_event_id and enabled;
  if not found or not ('purchase_order'=any(v_settings.accepted_methods) or 'invoice'=any(v_settings.accepted_methods))
    then raise exception 'Institutional purchasing is not enabled for this event'; end if;
  select * into v_event from public.events where id=p_event_id and status='published' and is_active;
  if not found or v_event.registration_status not in ('open','waiting_list','invite_only')
    then raise exception 'Registration is not open for this event'; end if;
  if nullif(btrim(v_settings.seller_name),'') is null then raise exception 'Seller configuration is incomplete'; end if;
  if p_profile_id is not null then
    select * into v_profile from public.institution_procurement_profiles where id=p_profile_id;
    if not found then raise exception 'Institution profile is unavailable'; end if;
    if not exists (select 1 from public.procurement_institution_members m
      where m.profile_id=p_profile_id and m.user_id=auth.uid()) and not public.has_role(auth.uid(),'admin')
      then raise exception 'Institution profile access required'; end if;
    foreach v_field in array v_profile.required_fields loop
      if nullif(btrim(coalesce(p_billing->>v_field,'')),'') is null then
        raise exception 'Required billing field is missing: %',v_field;
      end if;
    end loop;
  end if;
  v_name:=left(btrim(coalesce(p_billing->>'institution_name',v_profile.institution_name,'')),200);
  v_email:=left(lower(btrim(coalesce(p_billing->>'billing_contact_email',''))),320);
  if v_name='' or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
     or nullif(btrim(coalesce(p_billing->>'billing_contact_name','')),'') is null
    then raise exception 'Institution and billing contact name/email are required'; end if;
  if jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines) not between 1 and 50
    then raise exception 'Select 1 to 50 catalog items'; end if;
  if jsonb_typeof(p_registrants)<>'array' or jsonb_array_length(p_registrants)>1000
    then raise exception 'Registrant list is invalid'; end if;
  if p_billing is null or jsonb_typeof(p_billing)<>'object' then
    raise exception 'Billing details are required'; end if;

  insert into public.procurement_orders(
    event_id,requester_user_id,institution_profile_id,institution_name,department,organizational_unit,
    billing_contact_name,billing_contact_email,billing_contact_phone,billing_address,ap_email,
    requisition_number,vendor_id,cost_center,fund_number,project_number,grant_number,tax_exempt,
    invoice_instructions,buyer_notes,seller_name,seller_address,remit_instructions,payment_terms,
    quote_number,quote_expires_at
  ) values (
    p_event_id,auth.uid(),p_profile_id,v_name,left(p_billing->>'department',200),left(p_billing->>'organizational_unit',200),
    left(btrim(p_billing->>'billing_contact_name'),200),v_email,left(p_billing->>'billing_contact_phone',60),
    coalesce(p_billing->'billing_address','{}'::jsonb),left(p_billing->>'ap_email',320),
    left(p_billing->>'requisition_number',120),left(p_billing->>'vendor_id',120),
    left(p_billing->>'cost_center',120),left(p_billing->>'fund_number',120),
    left(p_billing->>'project_number',120),left(p_billing->>'grant_number',120),
    coalesce((p_billing->>'tax_exempt')::boolean,false),left(p_billing->>'invoice_instructions',2000),
    left(p_billing->>'notes',2000),v_settings.seller_name,v_settings.seller_address,
    v_settings.remit_instructions,v_settings.terms,
    'JESUP-Q-'||to_char(now(),'YYYY')||'-'||lpad(nextval('public.procurement_quote_number_seq')::text,5,'0'),
    now()+make_interval(days=>v_settings.quote_expiration_days)
  ) returning id into v_order_id;

  for v_line in select value from jsonb_array_elements(p_lines) loop
    if nullif(v_line->>'product_id','') is null then raise exception 'Product is required'; end if;
    v_qty:=(v_line->>'quantity')::integer;
    if v_qty not between 1 and 1000 then raise exception 'Quantity must be between 1 and 1000'; end if;
    select * into v_product from public.event_products
      where id=(v_line->>'product_id')::uuid and event_id=p_event_id and is_active for share;
    if not found or v_product.price_cents is null or v_product.currency<>'USD'
      then raise exception 'A selected product is not available with a USD price'; end if;
    insert into public.procurement_order_lines(order_id,event_product_id,description,kind,quantity,unit_price_cents,sort_order)
      values(v_order_id,v_product.id,v_product.name,v_product.kind,v_qty,v_product.price_cents,
        (select count(*) from public.procurement_order_lines where order_id=v_order_id));
    v_total:=v_total+(v_qty::bigint*v_product.price_cents::bigint);
    if v_total>100000000 then raise exception 'Quote total exceeds the online request limit'; end if;
    if v_product.kind='ticket' then v_ticket_count:=v_ticket_count+v_qty; end if;
  end loop;
  for v_registrant in select value from jsonb_array_elements(p_registrants) loop
    if nullif(btrim(coalesce(v_registrant->>'name','')),'') is null then
      raise exception 'Every registrant needs a name'; end if;
    insert into public.procurement_registrants(order_id,attendee_name,attendee_email)
      values(v_order_id,left(btrim(v_registrant->>'name'),200),left(lower(btrim(v_registrant->>'email')),320));
    v_registrant_count:=v_registrant_count+1;
  end loop;
  if v_ticket_count<>v_registrant_count then
    raise exception 'Provide one registrant for each admission ticket'; end if;
  update public.procurement_orders set subtotal_cents=v_total,total_cents=v_total where id=v_order_id;
  insert into public.procurement_activity_log(order_id,actor_id,action)
    values(v_order_id,auth.uid(),'quote_requested');
  return v_order_id;
end $$;

create or replace function public.submit_procurement_po(p_order_id uuid,p_po_number text,p_document_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_order public.procurement_orders%rowtype;
begin
  select * into v_order from public.procurement_orders where id=p_order_id for update;
  if not found or (v_order.requester_user_id<>auth.uid() and not public.can_manage_procurement_event(v_order.event_id))
    then raise exception 'Purchase unavailable'; end if;
  if v_order.procurement_status not in ('quote_requested','quote_issued','awaiting_purchase_order','purchase_order_received')
    then raise exception 'This purchase cannot accept a PO'; end if;
  if nullif(btrim(p_po_number),'') is null or length(p_po_number)>120
    then raise exception 'Enter a valid PO number'; end if;
  if not exists(select 1 from public.procurement_documents where id=p_document_id and order_id=p_order_id and kind='purchase_order')
    then raise exception 'Upload the official purchase order first'; end if;
  update public.procurement_orders set po_number=btrim(p_po_number),procurement_status='purchase_order_received'
    where id=p_order_id;
  insert into public.procurement_activity_log(order_id,actor_id,action,details)
    values(p_order_id,auth.uid(),'po_received',jsonb_build_object('document_id',p_document_id));
end $$;

create or replace function public.issue_procurement_quote(p_order_id uuid)
returns text language plpgsql security definer set search_path=public as $$
declare v_order public.procurement_orders%rowtype;
begin
  select * into v_order from public.procurement_orders where id=p_order_id for update;
  if not found or not public.can_manage_procurement_event(v_order.event_id) then
    raise exception 'Event finance access required'; end if;
  if v_order.procurement_status not in ('quote_requested','quote_issued') then
    raise exception 'Quote cannot be issued in this state'; end if;
  if v_order.quote_issued_at is null then
    update public.procurement_orders set quote_issued_at=now(),procurement_status='quote_issued' where id=p_order_id;
    insert into public.procurement_activity_log(order_id,actor_id,action)
      values(p_order_id,auth.uid(),'quote_issued');
  end if;
  return v_order.quote_number;
end $$;

create or replace function public.approve_procurement_po(p_order_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_order public.procurement_orders%rowtype;
begin
  select * into v_order from public.procurement_orders where id=p_order_id for update;
  if not found or not public.can_manage_procurement_event(v_order.event_id) then
    raise exception 'Event finance access required'; end if;
  if v_order.procurement_status not in ('purchase_order_received','under_review') or v_order.po_number is null
    then raise exception 'Review a received PO before approval'; end if;
  if not exists(select 1 from public.procurement_documents where order_id=p_order_id and kind='purchase_order')
    then raise exception 'Official PO document is required'; end if;
  update public.procurement_orders set procurement_status='under_review',approved_at=now(),approved_by=auth.uid()
    where id=p_order_id;
  insert into public.procurement_activity_log(order_id,actor_id,action)
    values(p_order_id,auth.uid(),'po_approved');
end $$;

create or replace function public.issue_procurement_invoice(p_order_id uuid)
returns text language plpgsql security definer set search_path=public as $$
declare v_order public.procurement_orders%rowtype; v_terms public.procurement_event_settings%rowtype;
  v_days integer; v_invoice text;
begin
  select * into v_order from public.procurement_orders where id=p_order_id for update;
  if not found or not public.can_manage_procurement_event(v_order.event_id) then
    raise exception 'Event finance access required'; end if;
  if v_order.approved_at is null then raise exception 'Approve the PO first'; end if;
  if v_order.invoice_number is not null then return v_order.invoice_number; end if;
  select * into v_terms from public.procurement_event_settings where event_id=v_order.event_id;
  v_days:=case v_order.payment_terms when 'due_on_receipt' then 0 when 'net_15' then 15
    when 'net_30' then 30 when 'net_45' then 45 when 'net_60' then 60
    else coalesce(v_terms.custom_terms_days,30) end;
  v_invoice:='JESUP-INV-'||to_char(now(),'YYYY')||'-'||lpad(nextval('public.procurement_invoice_number_seq')::text,5,'0');
  update public.procurement_orders set invoice_number=v_invoice,invoice_issued_at=now(),
    due_at=now()+make_interval(days=>v_days),procurement_status='invoice_issued',payment_status='unpaid'
    where id=p_order_id;
  insert into public.procurement_activity_log(order_id,actor_id,action)
    values(p_order_id,auth.uid(),'invoice_issued');
  return v_invoice;
end $$;

create or replace function public.record_procurement_payment(
  p_order_id uuid,p_amount_cents bigint,p_received_at timestamptz,p_method text,
  p_reference text default null,p_transaction_id text default null,p_notes text default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_order public.procurement_orders%rowtype; v_id uuid; v_paid bigint;
begin
  select * into v_order from public.procurement_orders where id=p_order_id for update;
  if not found or not public.can_manage_procurement_event(v_order.event_id) then
    raise exception 'Event finance access required'; end if;
  if v_order.invoice_number is null then raise exception 'Issue an invoice first'; end if;
  if p_amount_cents is null or p_amount_cents<=0 or p_amount_cents>v_order.total_cents-v_order.paid_cents
    then raise exception 'Payment exceeds the remaining balance'; end if;
  if p_method not in ('check','ach','square','manual','other') then raise exception 'Unknown payment method'; end if;
  if p_received_at is null or p_received_at>now()+interval '1 day' then raise exception 'Invalid receipt date'; end if;
  insert into public.procurement_payments(order_id,amount_cents,received_at,method,reference_number,transaction_id,notes,recorded_by)
    values(p_order_id,p_amount_cents,p_received_at,p_method,left(p_reference,120),left(p_transaction_id,200),
      left(p_notes,2000),auth.uid()) returning id into v_id;
  v_paid:=v_order.paid_cents+p_amount_cents;
  update public.procurement_orders set paid_cents=v_paid,
    payment_status=case when v_paid=v_order.total_cents then 'paid' else 'partially_paid' end,
    procurement_status=case when v_paid=v_order.total_cents then 'paid' else 'partially_paid' end
    where id=p_order_id;
  insert into public.procurement_activity_log(order_id,actor_id,action,details)
    values(p_order_id,auth.uid(),'payment_recorded',jsonb_build_object('payment_id',v_id,'amount_cents',p_amount_cents));
  return v_id;
end $$;

create view public.procurement_order_balances with (security_invoker=true) as
select o.id,o.total_cents,o.paid_cents,(o.total_cents-o.paid_cents) as balance_cents,o.due_at,
  case when o.paid_cents=o.total_cents and o.invoice_number is not null then 'paid'
    when o.due_at<now() and o.paid_cents<o.total_cents then 'past_due'
    when o.paid_cents>0 then 'partially_paid' else 'unpaid' end as effective_payment_status,
  case when o.due_at is null or o.due_at>=now() then 'current'
    when now()-o.due_at<=interval '30 days' then '1_30'
    when now()-o.due_at<=interval '60 days' then '31_60'
    when now()-o.due_at<=interval '90 days' then '61_90' else '90_plus' end as aging_bucket
from public.procurement_orders o;
grant select on public.procurement_order_balances to authenticated;

revoke all on function public.request_procurement_quote(uuid,uuid,jsonb,jsonb,jsonb) from public,anon;
revoke all on function public.save_procurement_event_settings(uuid,boolean,text[],text,jsonb,text,text,integer,integer,text) from public,anon;
revoke all on function public.submit_procurement_po(uuid,text,uuid) from public,anon;
revoke all on function public.issue_procurement_quote(uuid) from public,anon;
revoke all on function public.approve_procurement_po(uuid) from public,anon;
revoke all on function public.issue_procurement_invoice(uuid) from public,anon;
revoke all on function public.record_procurement_payment(uuid,bigint,timestamptz,text,text,text,text) from public,anon;
grant execute on function public.request_procurement_quote(uuid,uuid,jsonb,jsonb,jsonb) to authenticated;
grant execute on function public.save_procurement_event_settings(uuid,boolean,text[],text,jsonb,text,text,integer,integer,text) to authenticated;
grant execute on function public.submit_procurement_po(uuid,text,uuid) to authenticated;
grant execute on function public.issue_procurement_quote(uuid) to authenticated;
grant execute on function public.approve_procurement_po(uuid) to authenticated;
grant execute on function public.issue_procurement_invoice(uuid) to authenticated;
grant execute on function public.record_procurement_payment(uuid,bigint,timestamptz,text,text,text,text) to authenticated;
