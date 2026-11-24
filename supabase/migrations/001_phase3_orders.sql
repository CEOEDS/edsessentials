-- =====================================================================
-- ED'S ESSENTIALS - Phase 3 database migration (001)
-- Adds: admins, delivery zones, orders, order items, stock functions,
--       and the security rules (RLS) that protect them.
--
-- HOW TO RUN: Supabase dashboard > SQL Editor > New query > paste all of
-- this > Run. Run it ONCE. It is wrapped in BEGIN/COMMIT, so if anything
-- fails, nothing is changed and you can safely try again after a fix.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 0. Safety check: this migration expects products.id and
--    product_variants.id to be of type uuid. If they are not, stop with
--    a clear message instead of failing halfway.
-- ---------------------------------------------------------------------
do $$
declare
  t1 text;
  t2 text;
begin
  select data_type into t1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'id';
  select data_type into t2 from information_schema.columns
    where table_schema = 'public' and table_name = 'product_variants' and column_name = 'id';
  if t1 is distinct from 'uuid' or t2 is distinct from 'uuid' then
    raise exception 'STOP: products.id is %, product_variants.id is %. Expected uuid for both. Nothing was changed. Tell Claude these two values.', t1, t2;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 1. Admins
--    A separate table (not a column on profiles) so a customer can never
--    make themselves an admin by editing their own profile.
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists "admins can read own row" on public.admins;
create policy "admins can read own row" on public.admins
  for select to authenticated
  using (user_id = auth.uid());
-- No insert/update/delete policies on purpose: admins are added only from
-- the SQL editor (see 002_make_me_admin.sql).

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Delivery zones (flat fee per group of states, editable later)
--    The fees below are PLACEHOLDERS. Change them in Table Editor >
--    delivery_zones (or from the admin dashboard once it exists).
-- ---------------------------------------------------------------------
create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  states text[] not null,
  fee_ngn numeric(12,2) not null check (fee_ngn >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.delivery_zones enable row level security;

drop policy if exists "anyone can read delivery zones" on public.delivery_zones;
create policy "anyone can read delivery zones" on public.delivery_zones
  for select to anon, authenticated
  using (true);

drop policy if exists "admins manage delivery zones" on public.delivery_zones;
create policy "admins manage delivery zones" on public.delivery_zones
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.delivery_zones (name, states, fee_ngn, sort_order)
select v.name, v.states, v.fee_ngn, v.sort_order
from (values
  ('South-East', array['Abia','Anambra','Ebonyi','Enugu','Imo'], 3500::numeric, 1),
  ('Lagos, Ogun and Abuja', array['Lagos','Ogun','FCT (Abuja)'], 4500::numeric, 2),
  ('Rest of Nigeria', array['Adamawa','Akwa Ibom','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Edo','Ekiti','Gombe','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Nasarawa','Niger','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'], 6000::numeric, 3)
) as v(name, states, fee_ngn, sort_order)
where not exists (select 1 from public.delivery_zones);

-- ---------------------------------------------------------------------
-- 3. Orders
-- ---------------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('EE-' || nextval('public.order_number_seq')::text),
  user_id uuid references auth.users (id) on delete set null,   -- null for guest orders
  access_token uuid not null default gen_random_uuid(),         -- lets a guest open their own confirmation page
  email text not null,
  full_name text not null,
  phone text not null,
  street text not null,
  city_lga text not null,
  state text not null,
  subtotal_ngn numeric(12,2) not null check (subtotal_ngn >= 0),
  delivery_fee_ngn numeric(12,2) not null default 0 check (delivery_fee_ngn >= 0),
  total_ngn numeric(12,2) not null check (total_ngn >= 0),
  status text not null default 'pending'
    check (status in ('pending','paid','processing','shipped','delivered','cancelled')),
  payment_provider text,
  payment_reference text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  -- Snapshot of what the customer bought, so old orders stay correct even
  -- if a product is renamed, re-priced or deleted later.
  product_name text not null,
  color text,
  size text,
  unit_price_ngn numeric(12,2) not null check (unit_price_ngn >= 0),
  quantity integer not null check (quantity > 0),
  image_url text
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- Keep orders.updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. Security rules for orders
--    Customers can only READ their own orders. Nobody can create orders
--    straight from the browser: the server creates them after checking
--    prices and stock, using a secret key that bypasses these rules.
-- ---------------------------------------------------------------------
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "customers read own orders" on public.orders;
create policy "customers read own orders" on public.orders
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "admins read all orders" on public.orders;
create policy "admins read all orders" on public.orders
  for select to authenticated
  using (public.is_admin());

drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders" on public.orders
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "customers read own order items" on public.order_items;
create policy "customers read own order items" on public.order_items
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  ));

drop policy if exists "admins read all order items" on public.order_items;
create policy "admins read all order items" on public.order_items
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- 5. Stock functions (used only by the server, never by the browser)
--    reserve_stock : holds items for a pending order, fails if not enough
--    release_stock : gives the held items back (payment failed/cancelled)
--    commit_stock  : payment succeeded, remove from stock for good
-- ---------------------------------------------------------------------
create or replace function public.reserve_stock(p_variant_id uuid, p_qty integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.product_variants
     set reserved_quantity = reserved_quantity + p_qty
   where id = p_variant_id
     and p_qty > 0
     and stock_quantity - reserved_quantity >= p_qty;
  return found;
end;
$$;

create or replace function public.release_stock(p_variant_id uuid, p_qty integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.product_variants
     set reserved_quantity = greatest(0, reserved_quantity - p_qty)
   where id = p_variant_id;
$$;

create or replace function public.commit_stock(p_variant_id uuid, p_qty integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.product_variants
     set stock_quantity = greatest(0, stock_quantity - p_qty),
         reserved_quantity = greatest(0, reserved_quantity - p_qty)
   where id = p_variant_id;
$$;

revoke all on function public.reserve_stock(uuid, integer) from public, anon, authenticated;
revoke all on function public.release_stock(uuid, integer) from public, anon, authenticated;
revoke all on function public.commit_stock(uuid, integer) from public, anon, authenticated;
grant execute on function public.reserve_stock(uuid, integer) to service_role;
grant execute on function public.release_stock(uuid, integer) to service_role;
grant execute on function public.commit_stock(uuid, integer) to service_role;

-- ---------------------------------------------------------------------
-- 6. Let admins manage the catalogue and read the newsletter list
--    (these ADD to your existing rules; they do not replace them)
-- ---------------------------------------------------------------------
drop policy if exists "admins manage products" on public.products;
create policy "admins manage products" on public.products
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins manage product images" on public.product_images;
create policy "admins manage product images" on public.product_images
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins manage product variants" on public.product_variants;
create policy "admins manage product variants" on public.product_variants
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins read newsletter subscribers" on public.newsletter_subscribers;
create policy "admins read newsletter subscribers" on public.newsletter_subscribers
  for select to authenticated
  using (public.is_admin());

commit;
