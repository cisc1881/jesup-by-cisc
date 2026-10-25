-- Institutional procurement is opt-in per event. This migration does not enable FC135.
-- Amounts are integer USD cents. Buyer input never supplies a trusted price.
create sequence public.procurement_quote_number_seq;
create sequence public.procurement_invoice_number_seq;

create table public.institution_procurement_profiles (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid unique references public.institutions(id) on delete set null,
  institution_name text not null,
  abbreviation text,
  ap_email text,
  ap_phone text,
  billing_address jsonb not null default '{}'::jsonb,
  default_terms text not null default 'net_30' check (default_terms in ('due_on_receipt','net_15','net_30','net_45','net_60','custom')),
  vendor_id text,
  tax_exempt boolean not null default false,
  required_fields text[] not null default '{}',
  w9_required boolean not null default false,
  invoice_instructions text,
  procurement_portal_url text,
  notes text,
  allow_partial_payment boolean not null default true,
  allow_check boolean not null default true,
  allow_ach boolean not null default false,
  allow_card boolean not null default false,
  quote_expiration_days integer not null default 30 check (quote_expiration_days between 1 and 365),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger institution_procurement_profiles_updated before update on public.institution_procurement_profiles
  for each row execute function public.tg_set_updated_at();

create table public.procurement_institution_members (
  profile_id uuid not null references public.institution_procurement_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('buyer','institution_admin')),
  created_at timestamptz not null default now(),
  primary key (profile_id,user_id)
);

create table public.procurement_event_settings (
  event_id uuid primary key references public.events(id) on delete cascade,
  enabled boolean not null default false,
  accepted_methods text[] not null default array['purchase_order','invoice'],
  confirm_registration_on text not null default 'po_approved'
    check (confirm_registration_on in ('quote_requested','po_received','po_approved','invoice_paid')),
  quote_expiration_days integer not null default 30 check (quote_expiration_days between 1 and 365),
  seller_name text,
  seller_address jsonb not null default '{}'::jsonb,
  remit_instructions text,
  terms text not null default 'net_30' check (terms in ('due_on_receipt','net_15','net_30','net_45','net_60','custom')),
  custom_terms_days integer check (custom_terms_days between 0 and 365),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  constraint procurement_enabled_has_seller check (not enabled or nullif(btrim(seller_name),'') is not null),
  constraint procurement_methods_valid check (accepted_methods <@ array['purchase_order','invoice','check','institutional_sponsorship','registration_code']::text[])
);
create trigger procurement_event_settings_updated before update on public.procurement_event_settings
  for each row execute function public.tg_set_updated_at();

-- The organizer chose HNCH LLC for JESUP FC135 PO sales. Keep requests disabled
-- until prices, remit-to details and event approval are configured. Eventbrite
-- sales remain on the organizer's separate payment path.
insert into public.procurement_event_settings(event_id,enabled,seller_name)
select id,false,'HNCH LLC' from public.events where slug='fc135'
on conflict(event_id) do nothing;

create table public.procurement_orders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete restrict,
  requester_user_id uuid not null references auth.users(id) on delete restrict,
  institution_profile_id uuid references public.institution_procurement_profiles(id) on delete set null,
  institution_name text not null,
  department text,
  organizational_unit text,
  billing_contact_name text not null,
  billing_contact_email text not null,
  billing_contact_phone text,
  billing_address jsonb not null default '{}'::jsonb,
  ap_email text,
  po_number text,
  requisition_number text,
  vendor_id text,
  cost_center text,
  fund_number text,
  project_number text,
  grant_number text,
  tax_exempt boolean not null default false,
  invoice_instructions text,
  buyer_notes text,
  seller_name text not null,
  seller_address jsonb not null default '{}'::jsonb,
  remit_instructions text,
  procurement_status text not null default 'quote_requested' check (procurement_status in
    ('draft','quote_requested','quote_issued','awaiting_purchase_order','purchase_order_received','under_review','registration_confirmed','invoice_issued','payment_pending','partially_paid','paid','past_due','cancelled','rejected')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','partially_paid','paid','past_due','refunded')),
  quote_number text unique,
  quote_issued_at timestamptz,
  quote_expires_at timestamptz,
  invoice_number text unique,
  invoice_issued_at timestamptz,
  due_at timestamptz,
  payment_terms text not null default 'net_30',
  subtotal_cents bigint not null default 0 check (subtotal_cents >= 0),
  discount_cents bigint not null default 0 check (discount_cents >= 0),
  tax_cents bigint not null default 0 check (tax_cents >= 0),
  total_cents bigint not null default 0 check (total_cents >= 0),
  paid_cents bigint not null default 0 check (paid_cents >= 0),
  currency text not null default 'USD' check (currency='USD'),
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint procurement_paid_not_over_total check (paid_cents <= total_cents)
);
create index procurement_orders_event_idx on public.procurement_orders(event_id,created_at desc);
create index procurement_orders_institution_idx on public.procurement_orders(institution_profile_id,created_at desc);
create index procurement_orders_requester_idx on public.procurement_orders(requester_user_id,created_at desc);
create trigger procurement_orders_updated before update on public.procurement_orders
  for each row execute function public.tg_set_updated_at();

create table public.procurement_order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.procurement_orders(id) on delete cascade,
  event_product_id uuid references public.event_products(id) on delete set null,
  description text not null,
  kind text not null,
  quantity integer not null check (quantity between 1 and 1000),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  total_cents bigint generated always as (quantity::bigint * unit_price_cents::bigint) stored,
  sort_order integer not null default 0
);
create table public.procurement_registrants (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.procurement_orders(id) on delete cascade,
  attendee_name text not null,
  attendee_email text,
  registration_id uuid unique references public.event_registrations(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.procurement_documents (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.procurement_orders(id) on delete cascade,
  kind text not null check (kind in ('quote','purchase_order','invoice','receipt','w9','tax_certificate','vendor_form','insurance','ach_form','other')),
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  file_size integer not null check (file_size between 1 and 26214400),
  audience text not null default 'buyer' check (audience in ('buyer','admin')),
  is_approved boolean not null default false,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint procurement_document_scope check (order_id is not null or kind in ('w9','vendor_form','insurance','ach_form'))
);
create table public.procurement_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.procurement_orders(id) on delete restrict,
  amount_cents bigint not null check (amount_cents > 0),
  received_at timestamptz not null,
  method text not null check (method in ('check','ach','square','manual','other')),
  reference_number text,
  transaction_id text,
  notes text,
  recorded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create table public.procurement_internal_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.procurement_orders(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  body text not null,
  created_at timestamptz not null default now()
);
create unique index procurement_payments_transaction_idx on public.procurement_payments(transaction_id) where transaction_id is not null;
create table public.procurement_activity_log (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.procurement_orders(id) on delete cascade,
  action text not null,
  actor_id uuid references auth.users(id),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table public.procurement_secure_links (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.procurement_orders(id) on delete cascade,
  token_hash text not null unique,
  scopes text[] not null default array['read'],
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace function public.can_manage_procurement_event(p_event_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select auth.uid() is not null and (public.has_role(auth.uid(),'admin') or
    exists (select 1 from public.event_staff_assignments s where s.event_id=p_event_id
      and s.user_id=auth.uid() and s.is_active and s.staff_role='manager'))
$$;
create or replace function public.can_read_procurement_order(p_order_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select auth.uid() is not null and exists (
    select 1 from public.procurement_orders o where o.id=p_order_id and (
      o.requester_user_id=auth.uid() or public.can_manage_procurement_event(o.event_id) or
      exists (select 1 from public.procurement_institution_members m where m.profile_id=o.institution_profile_id
        and m.user_id=auth.uid() and m.role='institution_admin')
    )
  )
$$;
revoke all on function public.can_manage_procurement_event(uuid) from public,anon;
revoke all on function public.can_read_procurement_order(uuid) from public,anon;
grant execute on function public.can_manage_procurement_event(uuid) to authenticated;
grant execute on function public.can_read_procurement_order(uuid) to authenticated;

grant select on public.institution_procurement_profiles to authenticated;
grant select on public.procurement_institution_members to authenticated;
grant select on public.procurement_event_settings to anon,authenticated;
grant select on public.procurement_orders,public.procurement_order_lines,public.procurement_registrants,
  public.procurement_documents,public.procurement_payments,public.procurement_activity_log to authenticated;
grant select on public.procurement_internal_notes to authenticated;
grant all on public.institution_procurement_profiles,public.procurement_institution_members,public.procurement_event_settings,
  public.procurement_orders,public.procurement_order_lines,public.procurement_registrants,public.procurement_documents,
  public.procurement_payments,public.procurement_activity_log,public.procurement_secure_links,
  public.procurement_internal_notes to service_role;

alter table public.institution_procurement_profiles enable row level security;
alter table public.procurement_institution_members enable row level security;
alter table public.procurement_event_settings enable row level security;
alter table public.procurement_orders enable row level security;
alter table public.procurement_order_lines enable row level security;
alter table public.procurement_registrants enable row level security;
alter table public.procurement_documents enable row level security;
alter table public.procurement_payments enable row level security;
alter table public.procurement_activity_log enable row level security;
alter table public.procurement_secure_links enable row level security;
alter table public.procurement_internal_notes enable row level security;

create policy procurement_profiles_admin_read on public.institution_procurement_profiles for select to authenticated
  using (public.has_role(auth.uid(),'admin') or exists (select 1 from public.procurement_institution_members m
    where m.profile_id=id and m.user_id=auth.uid()));
create policy procurement_members_self_read on public.procurement_institution_members for select to authenticated
  using (user_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy procurement_event_settings_public_read on public.procurement_event_settings for select to anon,authenticated
  using (enabled);
create policy procurement_event_settings_manager_read on public.procurement_event_settings for select to authenticated
  using (public.can_manage_procurement_event(event_id));
create policy procurement_orders_authorized_read on public.procurement_orders for select to authenticated
  using (public.can_read_procurement_order(id));
create policy procurement_lines_authorized_read on public.procurement_order_lines for select to authenticated
  using (public.can_read_procurement_order(order_id));
create policy procurement_registrants_authorized_read on public.procurement_registrants for select to authenticated
  using (public.can_read_procurement_order(order_id));
create policy procurement_documents_authorized_read on public.procurement_documents for select to authenticated
  using ((order_id is not null and public.can_read_procurement_order(order_id) and
    (audience='buyer' or exists(select 1 from public.procurement_orders o where o.id=order_id and public.can_manage_procurement_event(o.event_id))))
    or (order_id is null and audience='buyer' and is_approved));
create policy procurement_payments_authorized_read on public.procurement_payments for select to authenticated
  using (public.can_read_procurement_order(order_id));
create policy procurement_activity_authorized_read on public.procurement_activity_log for select to authenticated
  using (public.can_read_procurement_order(order_id));
create policy procurement_links_admin_read on public.procurement_secure_links for select to authenticated
  using (public.has_role(auth.uid(),'admin'));
create policy procurement_internal_notes_manager_read on public.procurement_internal_notes for select to authenticated
  using (exists(select 1 from public.procurement_orders o where o.id=order_id and
    public.can_manage_procurement_event(o.event_id)));

-- All writes go through validated RPC/server paths; direct client mutations are denied.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('procurement-private','procurement-private',false,26214400,
  array['application/pdf','image/png','image/jpeg']) on conflict (id) do nothing;
