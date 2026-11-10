-- Modul inventory, donation, fulfillment (architecture.md §9). Bergantung pada 20261012150000_identity.

-- ── Tabel ────────────────────────────────────────────────────────────────

create table public.food_records (
  id bigint generated always as identity primary key,
  code text generated always as ('CP-' || id) stored,
  owner_id bigint not null references public.profiles (id),
  name text not null check (length(trim(name)) between 2 and 120),
  category text not null check (category in ('Makanan matang', 'Bahan pangan', 'Produk kemasan')),
  unit text not null check (unit in ('porsi', 'kg', 'kemasan', 'bungkus', 'unit')),
  quantity numeric(10, 2) not null check (quantity >= 0),
  estimate boolean not null default false,
  storage text not null default '',
  status text not null default 'Masih tersedia'
    check (status in ('Masih tersedia', 'Ditawarkan', 'Digunakan', 'Didistribusikan', 'Terbuang')),
  source_transfer_id bigint,
  client_id uuid unique,
  created_at timestamptz not null default now()
);
create index on public.food_records (owner_id, created_at desc);

-- Append-only: sum(delta) = food_records.quantity.
create table public.record_movements (
  id bigint generated always as identity primary key,
  record_id bigint not null references public.food_records (id),
  kind text not null check (kind in ('masuk', 'keluar', 'koreksi')),
  label text not null,
  delta numeric(10, 2) not null,
  note text,
  actor_id bigint references public.profiles (id),
  client_id uuid unique,
  at timestamptz not null default now()
);
create index on public.record_movements (record_id, at);

create table public.offers (
  id bigint generated always as identity primary key,
  code text generated always as ('PGR-' || id) stored,
  donor_id bigint not null references public.profiles (id),
  record_id bigint references public.food_records (id),
  name text not null check (length(trim(name)) between 2 and 120),
  category text not null check (category in ('Makanan matang', 'Bahan pangan', 'Produk kemasan')),
  unit text not null check (unit in ('porsi', 'kg', 'kemasan', 'bungkus', 'unit')),
  initial numeric(10, 2) not null check (initial >= 0),
  available numeric(10, 2) not null check (available >= 0), -- jaring pengaman AT-01
  reserved numeric(10, 2) not null default 0 check (reserved >= 0),
  handed_over numeric(10, 2) not null default 0 check (handed_over >= 0),
  estimate boolean not null default false,
  photo_path text,
  storage text not null,
  prepared_at timestamptz,
  label_date date,
  allergens text, -- null = belum diketahui pemberi
  description text,
  area text not null,
  pickup_start timestamptz not null,
  pickup_end timestamptz not null check (pickup_end > pickup_start),
  methods text[] not null check (
    cardinality(methods) > 0 and methods <@ array['Ambil sendiri', 'Antar pemberi', 'Mitra pengiriman']
  ),
  status text not null default 'Tersedia' check (status in ('Draf', 'Tersedia', 'Ditutup')),
  client_id uuid unique,
  created_at timestamptz not null default now()
);
create index on public.offers (status, pickup_end);
create index on public.offers (donor_id);

create table public.requests (
  id bigint generated always as identity primary key,
  code text generated always as ('REQ-' || id) stored,
  offer_id bigint not null references public.offers (id),
  recipient_id bigint not null references public.profiles (id),
  quantity numeric(10, 2) not null check (quantity > 0),
  unit text not null,
  method text not null check (method in ('Ambil sendiri', 'Antar pemberi', 'Mitra pengiriman')),
  pickup_at timestamptz not null,
  note text,
  status text not null default 'Diajukan'
    check (status in ('Diajukan', 'Menunggu penyesuaian', 'Disetujui', 'Ditolak', 'Dibatalkan')),
  reason text,
  proposal_quantity numeric(10, 2) check (proposal_quantity > 0),
  proposal_reason text,
  proposal_at timestamptz,
  client_id uuid unique,
  created_at timestamptz not null default now()
);
create index on public.requests (offer_id);
create index on public.requests (recipient_id, created_at desc);
create unique index requests_one_active on public.requests (offer_id, recipient_id)
  where status in ('Diajukan', 'Menunggu penyesuaian');

create table public.transfers (
  id bigint generated always as identity primary key,
  code text generated always as ('LP-' || id) stored,
  request_id bigint not null unique references public.requests (id),
  offer_id bigint not null references public.offers (id),
  donor_id bigint not null references public.profiles (id),
  recipient_id bigint not null references public.profiles (id),
  agreed numeric(10, 2) not null check (agreed > 0),
  handed_over numeric(10, 2) check (handed_over >= 0),
  received numeric(10, 2) check (received >= 0),
  rejected numeric(10, 2) check (rejected >= 0),
  unit text not null,
  method text not null check (method in ('Ambil sendiri', 'Antar pemberi', 'Mitra pengiriman')),
  pickup_at timestamptz not null,
  window_start timestamptz not null,
  window_end timestamptz not null,
  status text not null default 'Terjadwal'
    check (status in ('Terjadwal', 'Diserahkan', 'Diterima penuh', 'Diterima sebagian', 'Ditolak')),
  pending_schedule jsonb, -- {start, end, reason}; kesepakatan lama berlaku sampai penerima setuju
  prep text[] not null default '{}',
  distributed numeric(10, 2) check (distributed >= 0),
  used numeric(10, 2) check (used >= 0),
  wasted numeric(10, 2) check (wasted >= 0),
  distribution_reported_at timestamptz,
  overdue_notified_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.transfers (donor_id, created_at desc);
create index on public.transfers (recipient_id, created_at desc);
create index on public.transfers (status, window_end);

alter table public.food_records
  add constraint food_records_source_transfer_fk foreign key (source_transfer_id) references public.transfers (id);

create table public.transfer_events (
  id bigint generated always as identity primary key,
  transfer_id bigint not null references public.transfers (id),
  label text not null,
  actor_id bigint references public.profiles (id), -- null = Sistem
  note text,
  at timestamptz not null default now()
);
create index on public.transfer_events (transfer_id, at);

create table public.courier_tasks (
  id bigint generated always as identity primary key,
  code text generated always as ('DEL-' || id) stored,
  transfer_id bigint not null unique references public.transfers (id),
  courier_id bigint references public.profiles (id),
  cost bigint not null default 0 check (cost >= 0),
  payer text not null default 'relawan' check (payer in ('sponsor', 'pemberi', 'penerima', 'relawan')),
  program_id bigint, -- FK ditambah di migrasi funding
  status text not null default 'Menunggu kurir'
    check (status in ('Menunggu kurir', 'Menunggu ambil', 'Dalam perjalanan', 'Selesai', 'Gagal')),
  picked numeric(10, 2) check (picked >= 0),
  delivered numeric(10, 2) check (delivered >= 0),
  fail_reason text,
  created_at timestamptz not null default now(),
  check ((courier_id is null) = (status = 'Menunggu kurir'))
);
create index on public.courier_tasks (courier_id);

create trigger record_movements_append_only before update or delete on public.record_movements
  for each row execute function private.forbid_change();
create trigger transfer_events_append_only before update or delete on public.transfer_events
  for each row execute function private.forbid_change();

-- ── Helper ───────────────────────────────────────────────────────────────

create function private.qty(p numeric) returns text
language sql immutable as $$ select trim_scale(p)::text $$;

create function private.offer_donor(p_offer bigint) returns bigint
language sql stable security definer set search_path = '' as $$
  select donor_id from public.offers where id = p_offer
$$;

create function private.is_transfer_party(p_transfer bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.transfers t where t.id = p_transfer and private.my_id() in (t.donor_id, t.recipient_id))
      or exists (select 1 from public.courier_tasks c where c.transfer_id = p_transfer and c.courier_id = private.my_id())
$$;

create function private.can_see_offer(p_offer bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.offers o where o.id = p_offer and o.donor_id = private.my_id())
      or exists (select 1 from public.requests r where r.offer_id = p_offer and r.recipient_id = private.my_id())
      or exists (
        select 1 from public.courier_tasks c join public.transfers t on t.id = c.transfer_id
        where t.offer_id = p_offer and c.courier_id = private.my_id()
      )
$$;

-- Kontak terbuka untuk lawan pihak penyaluran yang sudah disetujui dan kurir yang ditugaskan.
create function private.can_see_contact(p_profile bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
        select 1 from public.transfers t
        where (t.donor_id = p_profile and t.recipient_id = private.my_id())
           or (t.recipient_id = p_profile and t.donor_id = private.my_id())
      )
      or exists (
        select 1 from public.courier_tasks c join public.transfers t on t.id = c.transfer_id
        where c.courier_id = private.my_id() and p_profile in (t.donor_id, t.recipient_id)
      )
$$;

create function private.add_event(p_transfer bigint, p_label text, p_actor bigint, p_note text default null, p_at timestamptz default now())
returns void language sql security definer set search_path = '' as $$
  insert into public.transfer_events (transfer_id, label, actor_id, note, at) values (p_transfer, p_label, p_actor, p_note, p_at)
$$;

-- Setujui permintaan: reservasi atomik + penyaluran + timeline + notifikasi. Pemanggil sudah memeriksa hak dan status.
create function private.approve_request(p_req public.requests) returns public.requests
language plpgsql security definer set search_path = '' as $$
declare
  v_offer public.offers;
  v_req public.requests;
  v_t public.transfers;
begin
  update public.offers
     set available = available - p_req.quantity,
         reserved  = reserved  + p_req.quantity
   where id = p_req.offer_id
     and status = 'Tersedia'
     and available >= p_req.quantity
  returning * into v_offer;
  if not found then raise exception 'STOK_TIDAK_CUKUP' using errcode = 'P0001'; end if;

  update public.requests set status = 'Disetujui' where id = p_req.id returning * into v_req;
  insert into public.transfers (request_id, offer_id, donor_id, recipient_id, agreed, unit, method, pickup_at, window_start, window_end)
  values (p_req.id, v_offer.id, v_offer.donor_id, p_req.recipient_id, p_req.quantity, p_req.unit, p_req.method,
          p_req.pickup_at, v_offer.pickup_start, v_offer.pickup_end)
  returning * into v_t;

  perform private.add_event(v_t.id, 'Permintaan diajukan', p_req.recipient_id, null, p_req.created_at);
  perform private.add_event(v_t.id, 'Permintaan disetujui', v_offer.donor_id, private.qty(p_req.quantity) || ' ' || p_req.unit);
  perform private.notify(p_req.recipient_id, 'Kegiatan', 'Permintaan disetujui',
    v_offer.name || ': ' || private.qty(p_req.quantity) || ' ' || p_req.unit, '/aktivitas/' || v_t.code, 'Lihat penyaluran');
  return v_req;
end $$;

grant execute on all functions in schema private to authenticated;

-- ── RLS: hanya baca ──────────────────────────────────────────────────────

alter table public.food_records enable row level security;
alter table public.record_movements enable row level security;
alter table public.offers enable row level security;
alter table public.requests enable row level security;
alter table public.transfers enable row level security;
alter table public.transfer_events enable row level security;
alter table public.courier_tasks enable row level security;

create policy food_records_read on public.food_records for select to authenticated
  using (owner_id = private.my_id() or private.is_admin());
create policy record_movements_read on public.record_movements for select to authenticated
  using (exists (select 1 from public.food_records r where r.id = record_id));
create policy offers_read on public.offers for select to authenticated
  using (status = 'Tersedia' or private.can_see_offer(id) or private.is_admin());
create policy requests_read on public.requests for select to authenticated
  using (recipient_id = private.my_id() or private.offer_donor(offer_id) = private.my_id() or private.is_admin());
create policy transfers_read on public.transfers for select to authenticated
  using (private.is_transfer_party(id) or private.is_admin());
create policy transfer_events_read on public.transfer_events for select to authenticated
  using (private.is_transfer_party(transfer_id) or private.is_admin());
create policy courier_tasks_read on public.courier_tasks for select to authenticated
  using (private.is_transfer_party(transfer_id) or private.is_admin());
create policy contacts_read_party on public.profile_contacts for select to authenticated
  using (private.can_see_contact(profile_id));

-- ── View ─────────────────────────────────────────────────────────────────

create view public.v_offer_cards with (security_invoker = true) as
select o.id, o.code, o.name, o.category, o.unit, o.initial, o.available, o.estimate, o.photo_path, o.storage,
       o.prepared_at, o.label_date, o.allergens, o.description, o.area, o.pickup_start, o.pickup_end, o.methods,
       o.created_at, p.org_name as donor_name, p.org_type as donor_type,
       p.verification_status = 'Terverifikasi' as donor_verified
from public.offers o
join public.profiles p on p.id = o.donor_id
where o.status = 'Tersedia' and o.pickup_end > now() and o.available > 0;

-- Dampak per bulan dan per satuan; hanya dari penerimaan aktual (FR-IM-02). Satuan tidak pernah dijumlahkan lintas jenis.
create view public.v_impact_donor with (security_invoker = true) as
select t.donor_id, date_trunc('month', t.created_at) as month, t.unit,
       count(*) as transfers,
       sum(t.agreed) as agreed,
       coalesce(sum(t.received), 0) as received,
       coalesce(sum(t.rejected), 0) as rejected
from public.transfers t
where t.status in ('Diterima penuh', 'Diterima sebagian', 'Ditolak')
group by 1, 2, 3;

create view public.v_impact_recipient with (security_invoker = true) as
select t.recipient_id, date_trunc('month', t.created_at) as month, t.unit,
       count(*) as transfers,
       coalesce(sum(t.received), 0) as received,
       coalesce(sum(t.distributed), 0) as distributed,
       coalesce(sum(t.used), 0) as used,
       coalesce(sum(t.wasted), 0) as wasted,
       count(*) filter (where t.received > 0 and t.distribution_reported_at is null) as unreported
from public.transfers t
where t.status in ('Diterima penuh', 'Diterima sebagian', 'Ditolak')
group by 1, 2, 3;

-- ── RPC inventory ────────────────────────────────────────────────────────

create function public.inventory_add_record(
  p_client_id uuid, p_name text, p_category text, p_quantity numeric, p_unit text,
  p_storage text default '', p_estimate boolean default false
) returns public.food_records
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.me();
  v public.food_records;
begin
  select * into v from public.food_records where client_id = p_client_id;
  if found then
    if v.owner_id <> me.id then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
    return v;
  end if;
  if me.role not in ('pemberi', 'penerima') then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'quantity'; end if;
  insert into public.food_records (owner_id, name, category, unit, quantity, estimate, storage, client_id)
  values (me.id, trim(p_name), p_category, p_unit, p_quantity, p_estimate, coalesce(p_storage, ''), p_client_id)
  returning * into v;
  insert into public.record_movements (record_id, kind, label, delta, actor_id)
  values (v.id, 'masuk', 'Dicatat', p_quantity, me.id);
  return v;
end $$;

create function public.inventory_move_record(
  p_client_id uuid, p_id bigint, p_kind text, p_quantity numeric, p_note text default null
) returns public.food_records
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.me();
  v public.food_records;
begin
  if exists (select 1 from public.record_movements where client_id = p_client_id) then
    select * into v from public.food_records where id = p_id and owner_id = me.id;
    return v;
  end if;
  if p_kind not in ('Digunakan', 'Didistribusikan', 'Terbuang') then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'kind';
  end if;
  select * into v from public.food_records where id = p_id and owner_id = me.id for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if p_quantity is null or p_quantity <= 0 or p_quantity > v.quantity then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'quantity';
  end if;
  -- Status mengikuti pergerakan terakhir hanya bila saldo habis.
  update public.food_records
     set quantity = quantity - p_quantity,
         status = case when quantity - p_quantity = 0 then p_kind else status end
   where id = p_id returning * into v;
  insert into public.record_movements (record_id, kind, label, delta, note, actor_id, client_id)
  values (v.id, 'keluar', p_kind, -p_quantity, p_note, me.id, p_client_id);
  return v;
end $$;

create function public.inventory_correct_record(
  p_client_id uuid, p_id bigint, p_quantity numeric, p_reason text
) returns public.food_records
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.me();
  v public.food_records;
  old_qty numeric;
begin
  if exists (select 1 from public.record_movements where client_id = p_client_id) then
    select * into v from public.food_records where id = p_id and owner_id = me.id;
    return v;
  end if;
  if p_quantity is null or p_quantity < 0 or coalesce(trim(p_reason), '') = '' then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001';
  end if;
  select * into v from public.food_records where id = p_id and owner_id = me.id for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  old_qty := v.quantity;
  update public.food_records
     set quantity = p_quantity,
         status = case when p_quantity > 0 and status in ('Digunakan', 'Didistribusikan', 'Terbuang') then 'Masih tersedia' else status end
   where id = p_id returning * into v;
  insert into public.record_movements (record_id, kind, label, delta, note, actor_id, client_id)
  values (v.id, 'koreksi', 'Koreksi: ' || trim(p_reason), p_quantity - old_qty,
          private.qty(old_qty) || ' → ' || private.qty(p_quantity) || ' ' || v.unit, me.id, p_client_id);
  return v;
end $$;

-- ── RPC donation ─────────────────────────────────────────────────────────

create function public.donation_publish_offer(
  p_client_id uuid, p_name text, p_category text, p_unit text, p_quantity numeric,
  p_storage text, p_area text, p_pickup_start timestamptz, p_pickup_end timestamptz, p_methods text[],
  p_estimate boolean default false, p_photo_path text default null, p_prepared_at timestamptz default null,
  p_label_date date default null, p_allergens text default null, p_description text default null,
  p_record_id bigint default null
) returns public.offers
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_role('pemberi');
  v public.offers;
  r public.food_records;
begin
  -- shortcut: belum mewajibkan akun terverifikasi (AO-09); tambahkan cek di sini setelah diputuskan.
  select * into v from public.offers where client_id = p_client_id;
  if found then
    if v.donor_id <> me.id then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
    return v;
  end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'quantity'; end if;
  if p_pickup_end <= now() then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'pickup_end'; end if;
  if p_photo_path is not null and split_part(p_photo_path, '/', 1) <> auth.uid()::text then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'photo_path';
  end if;
  if p_record_id is not null then
    select * into r from public.food_records where id = p_record_id and owner_id = me.id for update;
    if not found or r.status <> 'Masih tersedia' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
    if r.unit <> p_unit or p_quantity > r.quantity then
      raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'quantity';
    end if;
    update public.food_records set status = 'Ditawarkan' where id = r.id; -- riwayat asal tetap ada (AT-11)
  end if;
  insert into public.offers (donor_id, record_id, name, category, unit, initial, available, estimate, photo_path, storage,
    prepared_at, label_date, allergens, description, area, pickup_start, pickup_end, methods, client_id)
  values (me.id, p_record_id, trim(p_name), p_category, p_unit, p_quantity, p_quantity, p_estimate, p_photo_path, p_storage,
    p_prepared_at, p_label_date, p_allergens, p_description, p_area, p_pickup_start, p_pickup_end, p_methods, p_client_id)
  returning * into v;
  return v;
end $$;

create function public.donation_update_offer(
  p_id bigint, p_pickup_start timestamptz, p_pickup_end timestamptz, p_available numeric,
  p_storage text default null, p_description text default null, p_reason text default null
) returns public.offers
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_role('pemberi');
  old public.offers;
  v public.offers;
  t public.transfers;
begin
  select * into old from public.offers where id = p_id and donor_id = me.id for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if old.status = 'Ditutup' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  if p_available is null or p_available < 0 or p_pickup_end <= p_pickup_start then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001';
  end if;
  -- Jumlah awal ikut berubah agar tersedia + direservasi + diserahkan tetap konsisten.
  update public.offers
     set pickup_start = p_pickup_start, pickup_end = p_pickup_end,
         initial = initial + (p_available - available), available = p_available,
         storage = coalesce(p_storage, storage), description = coalesce(p_description, description)
   where id = p_id returning * into v;
  if p_pickup_start <> old.pickup_start or p_pickup_end <> old.pickup_end then
    for t in
      update public.transfers
         set pending_schedule = jsonb_build_object('start', p_pickup_start, 'end', p_pickup_end, 'reason', p_reason)
       where offer_id = p_id and status = 'Terjadwal'
      returning *
    loop
      perform private.add_event(t.id, 'Usulan jadwal baru', me.id, 'Menunggu persetujuan penerima' || coalesce('. ' || p_reason, ''));
      perform private.notify(t.recipient_id, 'Kegiatan', 'Usulan jadwal baru',
        v.name || '. Kesepakatan lama berlaku sampai Anda setuju.', '/aktivitas/' || t.code, 'Tinjau jadwal');
    end loop;
  end if;
  return v;
end $$;

create function public.donation_close_offer(p_id bigint) returns public.offers
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_role('pemberi');
  v public.offers;
  r public.requests;
begin
  select * into v from public.offers where id = p_id and donor_id = me.id for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if v.status = 'Ditutup' then return v; end if;
  update public.offers set status = 'Ditutup' where id = p_id returning * into v;
  -- Penyaluran yang sudah disetujui tetap berjalan; permintaan tertunda tidak bisa disetujui lagi.
  for r in
    update public.requests set status = 'Dibatalkan', reason = 'Penawaran ditutup pemberi.'
     where offer_id = p_id and status in ('Diajukan', 'Menunggu penyesuaian')
    returning *
  loop
    perform private.notify(r.recipient_id, 'Kegiatan', 'Penawaran ditutup', v.name || ' ditutup oleh pemberi.', '/aktivitas', null);
  end loop;
  return v;
end $$;

create function public.donation_submit_request(
  p_client_id uuid, p_offer_id bigint, p_quantity numeric, p_method text, p_pickup_at timestamptz, p_note text default null
) returns public.requests
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_role('penerima');
  o public.offers;
  v public.requests;
begin
  select * into v from public.requests where client_id = p_client_id;
  if found then
    if v.recipient_id <> me.id then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
    return v;
  end if;
  select * into o from public.offers where id = p_offer_id;
  if not found or o.status <> 'Tersedia' or o.pickup_end <= now() then
    raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001';
  end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'quantity'; end if;
  if p_quantity > o.available then raise exception 'STOK_TIDAK_CUKUP' using errcode = 'P0001'; end if;
  if not (p_method = any (o.methods)) then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'method'; end if;
  if p_pickup_at < o.pickup_start or p_pickup_at > o.pickup_end then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'pickup_at';
  end if;
  begin
    insert into public.requests (offer_id, recipient_id, quantity, unit, method, pickup_at, note, client_id)
    values (o.id, me.id, p_quantity, o.unit, p_method, p_pickup_at, p_note, p_client_id)
    returning * into v;
  exception when unique_violation then
    raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001', detail = 'Sudah ada permintaan aktif untuk penawaran ini';
  end;
  perform private.notify(o.donor_id, 'Kegiatan', 'Permintaan baru',
    me.org_name || ' meminta ' || private.qty(p_quantity) || ' ' || o.unit || ' ' || o.name, '/penawaran/' || o.code, 'Tinjau permintaan');
  return v;
end $$;

create function public.donation_decide_request(p_id bigint, p_decision text, p_reason text default null) returns public.requests
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_role('pemberi');
  r public.requests;
begin
  select * into r from public.requests where id = p_id for update;
  if not found or private.offer_donor(r.offer_id) <> me.id then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if (p_decision = 'approve' and r.status = 'Disetujui') or (p_decision = 'reject' and r.status = 'Ditolak') then
    return r; -- idempotent
  end if;
  if r.status <> 'Diajukan' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  if p_decision = 'approve' then
    return private.approve_request(r);
  elsif p_decision = 'reject' then
    update public.requests set status = 'Ditolak', reason = p_reason where id = p_id returning * into r;
    perform private.notify(r.recipient_id, 'Kegiatan', 'Permintaan tidak disetujui', coalesce(p_reason, 'Tanpa alasan tambahan.'), '/aktivitas', null);
    return r;
  end if;
  raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'decision';
end $$;

create function public.donation_cancel_request(p_id bigint, p_reason text) returns public.requests
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_role('penerima');
  r public.requests;
begin
  select * into r from public.requests where id = p_id and recipient_id = me.id for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if r.status = 'Dibatalkan' then return r; end if;
  if r.status <> 'Diajukan' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'reason'; end if;
  update public.requests set status = 'Dibatalkan', reason = p_reason where id = p_id returning * into r;
  perform private.notify(private.offer_donor(r.offer_id), 'Kegiatan', 'Permintaan dibatalkan', me.org_name || ': ' || p_reason, '/aktivitas', null);
  return r;
end $$;

create function public.donation_propose_adjustment(p_id bigint, p_quantity numeric, p_reason text) returns public.requests
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_role('pemberi');
  r public.requests;
  o public.offers;
begin
  select * into r from public.requests where id = p_id for update;
  if not found or private.offer_donor(r.offer_id) <> me.id then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if r.status = 'Menunggu penyesuaian' and r.proposal_quantity = p_quantity then return r; end if;
  if r.status <> 'Diajukan' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  if p_quantity is null or p_quantity <= 0 or p_quantity >= r.quantity or coalesce(trim(p_reason), '') = '' then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001';
  end if;
  select * into o from public.offers where id = r.offer_id;
  if p_quantity > o.available then raise exception 'STOK_TIDAK_CUKUP' using errcode = 'P0001'; end if;
  update public.requests
     set status = 'Menunggu penyesuaian', proposal_quantity = p_quantity, proposal_reason = p_reason, proposal_at = now()
   where id = p_id returning * into r;
  perform private.notify(r.recipient_id, 'Kegiatan', 'Pemberi mengusulkan penyesuaian',
    'Usulan ' || private.qty(p_quantity) || ' ' || r.unit || ' untuk permintaan ' || r.code || '.',
    '/permintaan/' || r.code || '/penyesuaian', 'Tinjau usulan');
  return r;
end $$;

create function public.donation_respond_adjustment(p_id bigint, p_accept boolean) returns public.requests
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_role('penerima');
  r public.requests;
begin
  select * into r from public.requests where id = p_id and recipient_id = me.id for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if (p_accept and r.status = 'Disetujui') or (not p_accept and r.status = 'Dibatalkan') then return r; end if;
  if r.status <> 'Menunggu penyesuaian' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  if not p_accept then
    update public.requests set status = 'Dibatalkan', reason = 'Penyesuaian jumlah tidak disetujui penerima.'
     where id = p_id returning * into r;
    perform private.notify(private.offer_donor(r.offer_id), 'Kegiatan', 'Penyesuaian ditolak', me.org_name || ' tidak menyetujui usulan jumlah.', '/aktivitas', null);
    return r;
  end if;
  -- Menyetujui usulan = menyetujui permintaan dengan jumlah baru; kuota langsung dikunci.
  update public.requests set quantity = proposal_quantity, status = 'Diajukan' where id = p_id returning * into r;
  perform private.notify(private.offer_donor(r.offer_id), 'Kegiatan', 'Penyesuaian disetujui',
    me.org_name || ' menyetujui ' || private.qty(r.quantity) || ' ' || r.unit || '.', '/aktivitas', null);
  return private.approve_request(r);
end $$;

-- ── RPC fulfillment ──────────────────────────────────────────────────────

create function public.fulfillment_handover(p_id bigint, p_quantity numeric, p_note text default null) returns public.transfers
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_role('pemberi');
  t public.transfers;
begin
  select * into t from public.transfers where id = p_id and donor_id = me.id for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if t.status = 'Diserahkan' then return t; end if;
  if t.status <> 'Terjadwal' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  if p_quantity is null or p_quantity <= 0 or p_quantity > t.agreed then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'quantity';
  end if;
  update public.transfers set status = 'Diserahkan', handed_over = p_quantity where id = p_id returning * into t;
  perform private.add_event(t.id, 'Diserahkan', me.id, private.qty(p_quantity) || ' ' || t.unit || ' diserahkan' || coalesce('. ' || p_note, ''));
  perform private.notify(t.recipient_id, 'Kegiatan', 'Pangan diserahkan', 'Konfirmasi jumlah yang Anda terima.', '/aktivitas/' || t.code, 'Konfirmasi penerimaan');
  return t;
end $$;

create function public.fulfillment_receive(p_id bigint, p_received numeric, p_reason text default null, p_note text default null)
returns public.transfers
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_role('penerima');
  t public.transfers;
  o public.offers;
  rec public.food_records;
  base numeric;
  new_status text;
  msg text;
begin
  select * into t from public.transfers where id = p_id and recipient_id = me.id for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  -- Konfirmasi ulang tidak menambah dampak (AT-02).
  if t.status in ('Diterima penuh', 'Diterima sebagian', 'Ditolak') then return t; end if;
  if t.status not in ('Terjadwal', 'Diserahkan') then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  base := coalesce(t.handed_over, t.agreed);
  if p_received is null or p_received < 0 or p_received > base then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'received';
  end if;
  new_status := case when p_received = 0 then 'Ditolak' when p_received < base then 'Diterima sebagian' else 'Diterima penuh' end;
  msg := case when new_status = 'Diterima penuh' then private.qty(p_received) || ' ' || t.unit || ' diterima'
              else private.qty(p_received) || ' ' || t.unit || ' diterima, ' || private.qty(base - p_received) || ' ' || t.unit
                   || ' tidak diterima' || coalesce(': ' || p_reason, '') end;

  update public.transfers
     set status = new_status, handed_over = base, received = p_received, rejected = base - p_received
   where id = p_id returning * into t;
  update public.offers
     set reserved = reserved - t.agreed, handed_over = handed_over + p_received
   where id = t.offer_id returning * into o;

  if p_received > 0 then
    insert into public.food_records (owner_id, name, category, unit, quantity, storage, source_transfer_id)
    values (me.id, o.name, o.category, t.unit, p_received, coalesce(me.storage, ''), t.id)
    returning * into rec;
    insert into public.record_movements (record_id, kind, label, delta, actor_id)
    values (rec.id, 'masuk', 'Diterima dari penyaluran ' || t.code, p_received, me.id);
  end if;

  perform private.add_event(t.id, new_status, me.id, msg || coalesce('. ' || p_note, ''));
  perform private.notify(t.donor_id, 'Kegiatan', 'Penerimaan dikonfirmasi', o.name || ': ' || msg || '.', '/aktivitas/' || t.code, 'Lihat penyaluran');
  return t;
end $$;

create function public.fulfillment_report_distribution(p_id bigint, p_distributed numeric, p_used numeric, p_wasted numeric)
returns public.transfers
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_role('penerima');
  t public.transfers;
begin
  select * into t from public.transfers where id = p_id and recipient_id = me.id for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if t.distribution_reported_at is not null then return t; end if;
  if t.status not in ('Diterima penuh', 'Diterima sebagian') then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  -- Sisa yang belum dipakai boleh dilaporkan apa adanya (AT-06).
  if least(p_distributed, p_used, p_wasted) < 0 or p_distributed + p_used + p_wasted > t.received then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001';
  end if;
  update public.transfers
     set distributed = p_distributed, used = p_used, wasted = p_wasted, distribution_reported_at = now()
   where id = p_id returning * into t;
  perform private.add_event(t.id, 'Laporan distribusi disimpan', me.id,
    private.qty(p_distributed) || ' didistribusikan, ' || private.qty(p_used) || ' digunakan, ' || private.qty(p_wasted) || ' terbuang');
  return t;
end $$;

create function public.fulfillment_respond_schedule(p_id bigint, p_accept boolean) returns public.transfers
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_role('penerima');
  t public.transfers;
  p jsonb;
begin
  select * into t from public.transfers where id = p_id and recipient_id = me.id for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if t.pending_schedule is null then return t; end if;
  p := t.pending_schedule;
  if p_accept then
    update public.transfers
       set window_start = (p ->> 'start')::timestamptz, window_end = (p ->> 'end')::timestamptz, pending_schedule = null
     where id = p_id returning * into t;
    perform private.add_event(t.id, 'Jadwal baru disetujui', me.id, null);
  else
    update public.transfers set pending_schedule = null where id = p_id returning * into t;
    perform private.add_event(t.id, 'Jadwal baru ditolak', me.id, 'Kesepakatan jadwal lama tetap berlaku.');
  end if;
  perform private.notify(t.donor_id, 'Kegiatan', case when p_accept then 'Jadwal baru disetujui' else 'Jadwal baru ditolak' end,
    'Penyaluran ' || t.code, '/aktivitas/' || t.code, null);
  return t;
end $$;

create function public.fulfillment_set_method(p_id bigint, p_method text) returns public.transfers
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.me();
  t public.transfers;
  old_method text;
begin
  select * into t from public.transfers where id = p_id and me.id in (donor_id, recipient_id) for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if t.method = p_method then return t; end if;
  if t.status <> 'Terjadwal' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  old_method := t.method;
  update public.transfers set method = p_method where id = p_id returning * into t;
  perform private.add_event(t.id, 'Cara penyaluran diubah', me.id, old_method || ' → ' || p_method);
  perform private.notify(case when me.id = t.donor_id then t.recipient_id else t.donor_id end, 'Kegiatan',
    'Cara penyaluran diubah', old_method || ' → ' || p_method, '/aktivitas/' || t.code, null);
  return t;
end $$;

create function public.fulfillment_set_prep(p_id bigint, p_checks text[]) returns public.transfers
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_role('pemberi');
  t public.transfers;
begin
  update public.transfers set prep = coalesce(p_checks, '{}') where id = p_id and donor_id = me.id returning * into t;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  return t;
end $$;

-- ── RPC kurir ────────────────────────────────────────────────────────────

create function public.admin_assign_courier(
  p_transfer_id bigint, p_courier_id bigint default null, p_cost bigint default 0,
  p_payer text default 'relawan', p_program_id bigint default null
) returns public.courier_tasks
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('ops');
  t public.transfers;
  c public.courier_tasks;
  before_text text;
begin
  select * into t from public.transfers where id = p_transfer_id;
  if not found then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  if t.status <> 'Terjadwal' or t.method <> 'Mitra pengiriman' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  if p_courier_id is not null and not exists (select 1 from public.profiles where id = p_courier_id and role = 'kurir') then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'courier_id';
  end if;
  select * into c from public.courier_tasks where transfer_id = p_transfer_id for update;
  if found and c.status in ('Dalam perjalanan', 'Selesai') then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  before_text := case when found then c.status || coalesce(' / kurir ' || c.courier_id, '') else 'Belum ada tugas' end;
  insert into public.courier_tasks (transfer_id, courier_id, cost, payer, program_id, status)
  values (p_transfer_id, p_courier_id, p_cost, p_payer, p_program_id,
          case when p_courier_id is null then 'Menunggu kurir' else 'Menunggu ambil' end)
  on conflict (transfer_id) do update
     set courier_id = excluded.courier_id, cost = excluded.cost, payer = excluded.payer,
         program_id = excluded.program_id, status = excluded.status, fail_reason = null
  returning * into c;
  perform private.audit(me.id, 'tugas_kurir', c.code, before_text, c.status || coalesce(' / kurir ' || c.courier_id, ''), 'Penugasan pengiriman');
  if p_courier_id is not null then
    perform private.add_event(t.id, 'Kurir ditugaskan', me.id, null);
    perform private.notify(p_courier_id, 'Kegiatan', 'Tugas pengiriman baru', 'Penyaluran ' || t.code, '/tugas/' || c.code, 'Lihat tugas');
  end if;
  return c;
end $$;

create function public.fulfillment_task_pickup(p_task_id bigint, p_quantity numeric) returns public.courier_tasks
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_role('kurir');
  c public.courier_tasks;
  t public.transfers;
begin
  select * into c from public.courier_tasks where id = p_task_id and courier_id = me.id for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if c.status = 'Dalam perjalanan' then return c; end if;
  if c.status <> 'Menunggu ambil' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  select * into t from public.transfers where id = c.transfer_id for update;
  if p_quantity is null or p_quantity <= 0 or p_quantity > t.agreed then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'quantity';
  end if;
  update public.courier_tasks set status = 'Dalam perjalanan', picked = p_quantity where id = p_task_id returning * into c;
  -- Pengambilan oleh kurir = serah terima dari pemberi.
  if t.status = 'Terjadwal' then
    update public.transfers set status = 'Diserahkan', handed_over = p_quantity where id = t.id;
  end if;
  perform private.add_event(t.id, 'Diambil dari pemberi', me.id, private.qty(p_quantity) || ' ' || t.unit);
  perform private.notify(t.recipient_id, 'Kegiatan', 'Pangan dalam perjalanan', 'Penyaluran ' || t.code, '/aktivitas/' || t.code, null);
  return c;
end $$;

create function public.fulfillment_task_deliver(p_task_id bigint, p_quantity numeric) returns public.courier_tasks
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_role('kurir');
  c public.courier_tasks;
  t public.transfers;
begin
  select * into c from public.courier_tasks where id = p_task_id and courier_id = me.id for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if c.status = 'Selesai' then return c; end if;
  if c.status <> 'Dalam perjalanan' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  if p_quantity is null or p_quantity < 0 or p_quantity > c.picked then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'quantity';
  end if;
  update public.courier_tasks set status = 'Selesai', delivered = p_quantity where id = p_task_id returning * into c;
  select * into t from public.transfers where id = c.transfer_id;
  -- Tidak menandai diterima: penerima tetap mengonfirmasi (AT-04).
  perform private.add_event(t.id, 'Diantar ke penerima', me.id, private.qty(p_quantity) || ' ' || t.unit);
  perform private.notify(t.recipient_id, 'Kegiatan', 'Pangan sudah diantar', 'Konfirmasi jumlah yang Anda terima.', '/aktivitas/' || t.code, 'Konfirmasi penerimaan');
  return c;
end $$;

create function public.fulfillment_task_fail(p_task_id bigint, p_reason text) returns public.courier_tasks
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_role('kurir');
  c public.courier_tasks;
  t public.transfers;
begin
  select * into c from public.courier_tasks where id = p_task_id and courier_id = me.id for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if c.status = 'Gagal' then return c; end if;
  if c.status not in ('Menunggu ambil', 'Dalam perjalanan') then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'reason'; end if;
  update public.courier_tasks set status = 'Gagal', fail_reason = p_reason where id = p_task_id returning * into c;
  select * into t from public.transfers where id = c.transfer_id;
  perform private.add_event(t.id, 'Pengiriman gagal', me.id, p_reason);
  perform private.notify(t.donor_id, 'Kegiatan', 'Pengiriman gagal', p_reason, '/aktivitas/' || t.code, null);
  perform private.notify(t.recipient_id, 'Kegiatan', 'Pengiriman gagal', p_reason, '/aktivitas/' || t.code, null);
  return c;
end $$;

-- ── Job terjadwal (AT-03, AR-09) ─────────────────────────────────────────

create function private.job_expire_offers() returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.offers;
  r public.requests;
  t public.transfers;
begin
  for o in update public.offers set status = 'Ditutup' where status = 'Tersedia' and pickup_end <= now() returning * loop
    for r in
      update public.requests set status = 'Dibatalkan', reason = 'Batas waktu pengambilan terlewat.'
       where offer_id = o.id and status in ('Diajukan', 'Menunggu penyesuaian')
      returning *
    loop
      perform private.notify(r.recipient_id, 'Kegiatan', 'Permintaan berakhir', o.name || ': batas waktu pengambilan terlewat.', '/aktivitas', null);
    end loop;
  end loop;
  -- Penyaluran yang lewat jadwal tidak diubah statusnya, hanya diberi tahu sekali.
  for t in
    update public.transfers set overdue_notified_at = now()
     where status = 'Terjadwal' and window_end <= now() and overdue_notified_at is null
    returning *
  loop
    perform private.add_event(t.id, 'Melewati jadwal', null, 'Belum ada serah terima.');
    perform private.notify(t.donor_id, 'Kegiatan', 'Penyaluran melewati jadwal', 'Perbarui status atau laporkan kendala.', '/aktivitas/' || t.code, 'Lihat penyaluran');
    perform private.notify(t.recipient_id, 'Kegiatan', 'Penyaluran melewati jadwal', 'Perbarui status atau laporkan kendala.', '/aktivitas/' || t.code, 'Lihat penyaluran');
  end loop;
end $$;

revoke execute on function private.job_expire_offers() from public, authenticated;

create extension if not exists pg_cron;
select cron.schedule('expire-offers', '*/5 * * * *', 'select private.job_expire_offers()');

-- ── Hak akses: klien tidak menulis langsung ke tabel ─────────────────────

revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
