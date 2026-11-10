-- Keputusan produk OD-01 s.d. OD-05 (10 Nov 2026; architecture.md AR-16 s.d. AR-20).
-- OD-01: batas konfirmasi 2 jam, batas jumlah per penerima (opsional).
-- OD-03: data wajib per kategori; penerimaan sebagian/penolakan diverifikasi staf ops.
-- OD-04: ongkir mitra pengiriman ditanggung penerima, bisa diajukan ke pemberi.
-- OD-05: challenge memberi poin; poin ditukar paket reward; challenge bisa diikuti lagi di periode berikutnya.

-- ── OD-01 ────────────────────────────────────────────────────────────────

alter table public.offers add column max_per_recipient numeric(10, 2) check (max_per_recipient > 0); -- null = tanpa batas

-- Data wajib per kategori (OD-03). Dipakai saat terbit.
create function private.check_offer_fields(p_category text, p_storage text, p_prepared_at timestamptz, p_label_date date)
returns void language plpgsql stable set search_path = '' as $$
begin
  if coalesce(trim(p_storage), '') = '' then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'storage'; end if;
  if p_category = 'Makanan matang' and (p_prepared_at is null or p_prepared_at > now() + interval '5 minutes') then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'prepared_at';
  end if;
  if p_category = 'Produk kemasan' and (p_label_date is null or p_label_date < (now() at time zone 'Asia/Jakarta')::date) then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'label_date';
  end if;
end $$;

drop function public.donation_publish_offer(uuid, text, text, text, numeric, text, text, timestamptz, timestamptz, text[],
  boolean, text, timestamptz, date, text, text, bigint);
create function public.donation_publish_offer(
  p_client_id uuid, p_name text, p_category text, p_unit text, p_quantity numeric,
  p_storage text, p_area text, p_pickup_start timestamptz, p_pickup_end timestamptz, p_methods text[],
  p_estimate boolean default false, p_photo_path text default null, p_prepared_at timestamptz default null,
  p_label_date date default null, p_allergens text default null, p_description text default null,
  p_record_id bigint default null, p_max_per_recipient numeric default null
) returns public.offers
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_role('pemberi');
  v public.offers;
  r public.food_records;
begin
  -- Akun boleh berkegiatan sebelum diverifikasi (AR-13).
  select * into v from public.offers where client_id = p_client_id;
  if found then
    if v.donor_id <> me.id then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
    return v;
  end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'quantity'; end if;
  if p_pickup_end <= now() then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'pickup_end'; end if;
  if p_max_per_recipient is not null and (p_max_per_recipient <= 0 or p_max_per_recipient > p_quantity) then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'max_per_recipient';
  end if;
  perform private.check_offer_fields(p_category, p_storage, p_prepared_at, p_label_date);
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
    prepared_at, label_date, allergens, description, area, pickup_start, pickup_end, methods, max_per_recipient, client_id)
  values (me.id, p_record_id, trim(p_name), p_category, p_unit, p_quantity, p_quantity, p_estimate, p_photo_path, p_storage,
    p_prepared_at, p_label_date, p_allergens, p_description, p_area, p_pickup_start, p_pickup_end, p_methods, p_max_per_recipient, p_client_id)
  returning * into v;
  return v;
end $$;

create or replace function public.donation_submit_request(
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
  -- Batas per penerima dihitung dari semua permintaan aktif dan yang sudah disetujui pada penawaran ini.
  if o.max_per_recipient is not null and p_quantity + coalesce((
       select sum(quantity) from public.requests
        where offer_id = o.id and recipient_id = me.id and status in ('Diajukan', 'Menunggu penyesuaian', 'Disetujui')), 0) > o.max_per_recipient then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'max_per_recipient';
  end if;
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
    me.org_name || ' meminta ' || private.qty(p_quantity) || ' ' || o.unit || ' ' || o.name || '. Tanggapi dalam 2 jam.',
    '/penawaran/' || o.code, 'Tinjau permintaan');
  return v;
end $$;

create or replace function public.donation_decide_request(p_id bigint, p_decision text, p_reason text default null) returns public.requests
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
  -- Job membatalkan tiap 5 menit; cek ini menutup celah di antaranya.
  if r.created_at <= now() - interval '2 hours' then
    raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001', detail = 'Batas konfirmasi 2 jam terlewat';
  end if;
  if p_decision = 'approve' then
    return private.approve_request(r);
  elsif p_decision = 'reject' then
    update public.requests set status = 'Ditolak', reason = p_reason where id = p_id returning * into r;
    perform private.notify(r.recipient_id, 'Kegiatan', 'Permintaan tidak disetujui', coalesce(p_reason, 'Tanpa alasan tambahan.'), '/aktivitas', null);
    return r;
  end if;
  raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'decision';
end $$;

create or replace function public.donation_propose_adjustment(p_id bigint, p_quantity numeric, p_reason text) returns public.requests
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
  if r.created_at <= now() - interval '2 hours' then
    raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001', detail = 'Batas konfirmasi 2 jam terlewat';
  end if;
  if p_quantity is null or p_quantity <= 0 or p_quantity >= r.quantity or coalesce(trim(p_reason), '') = '' then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001';
  end if;
  select * into o from public.offers where id = r.offer_id;
  if p_quantity > o.available then raise exception 'STOK_TIDAK_CUKUP' using errcode = 'P0001'; end if;
  update public.requests
     set status = 'Menunggu penyesuaian', proposal_quantity = p_quantity, proposal_reason = p_reason, proposal_at = now()
   where id = p_id returning * into r;
  perform private.notify(r.recipient_id, 'Kegiatan', 'Pemberi mengusulkan penyesuaian',
    'Usulan ' || private.qty(p_quantity) || ' ' || r.unit || ' untuk permintaan ' || r.code || '. Tanggapi dalam 2 jam.',
    '/permintaan/' || r.code || '/penyesuaian', 'Tinjau usulan');
  return r;
end $$;

create or replace function public.donation_respond_adjustment(p_id bigint, p_accept boolean) returns public.requests
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_role('penerima');
  r public.requests;
begin
  select * into r from public.requests where id = p_id and recipient_id = me.id for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if (p_accept and r.status = 'Disetujui') or (not p_accept and r.status = 'Dibatalkan') then return r; end if;
  if r.status <> 'Menunggu penyesuaian' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  if r.proposal_at <= now() - interval '2 hours' then
    raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001', detail = 'Batas tanggapan 2 jam terlewat';
  end if;
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

-- Permintaan tanpa tanggapan lebih dari 2 jam dibatalkan (OD-01).
create function private.job_expire_requests() returns void
language plpgsql security definer set search_path = '' as $$
declare
  r public.requests;
  o public.offers;
begin
  for r in
    update public.requests
       set status = 'Dibatalkan',
           reason = case when status = 'Diajukan' then 'Tidak ada konfirmasi pemberi dalam 2 jam.'
                         else 'Tidak ada tanggapan penerima atas usulan penyesuaian dalam 2 jam.' end
     where (status = 'Diajukan' and created_at <= now() - interval '2 hours')
        or (status = 'Menunggu penyesuaian' and proposal_at <= now() - interval '2 hours')
    returning *
  loop
    select * into o from public.offers where id = r.offer_id;
    perform private.notify(r.recipient_id, 'Kegiatan', 'Permintaan berakhir', o.name || ': ' || r.reason, '/aktivitas', null);
    perform private.notify(o.donor_id, 'Kegiatan', 'Permintaan berakhir', o.name || ': ' || r.reason, '/aktivitas', null);
  end loop;
end $$;
revoke execute on function private.job_expire_requests() from public, authenticated;
select cron.schedule('expire-requests', '*/5 * * * *', 'select private.job_expire_requests()');

-- ── OD-03: penerimaan sebagian atau penolakan diverifikasi staf ──────────

alter table public.transfers drop constraint transfers_status_check;
alter table public.transfers add constraint transfers_status_check
  check (status in ('Terjadwal', 'Diserahkan', 'Menunggu verifikasi', 'Diterima penuh', 'Diterima sebagian', 'Ditolak'));
alter table public.transfers add column pending_receipt jsonb; -- {received, reason, note, prev}; dampak belum dihitung

-- Mencatat hasil penerimaan final: status, stok penawaran, catatan pangan penerima, timeline.
create function private.finalize_receipt(p_t public.transfers, p_received numeric, p_reason text, p_note text)
returns public.transfers
language plpgsql security definer set search_path = '' as $$
declare
  t public.transfers;
  o public.offers;
  rec public.food_records;
  base numeric := coalesce(p_t.handed_over, p_t.agreed);
  new_status text;
  msg text;
begin
  new_status := case when p_received = 0 then 'Ditolak' when p_received < base then 'Diterima sebagian' else 'Diterima penuh' end;
  msg := case when new_status = 'Diterima penuh' then private.qty(p_received) || ' ' || p_t.unit || ' diterima'
              else private.qty(p_received) || ' ' || p_t.unit || ' diterima, ' || private.qty(base - p_received) || ' ' || p_t.unit
                   || ' tidak diterima' || coalesce(': ' || p_reason, '') end;
  update public.transfers
     set status = new_status, handed_over = base, received = p_received, rejected = base - p_received, pending_receipt = null
   where id = p_t.id returning * into t;
  update public.offers
     set reserved = reserved - t.agreed, handed_over = handed_over + p_received
   where id = t.offer_id returning * into o;
  if p_received > 0 then
    insert into public.food_records (owner_id, name, category, unit, quantity, storage, source_transfer_id)
    values (t.recipient_id, o.name, o.category, t.unit, p_received,
            coalesce((select storage from public.profiles where id = t.recipient_id), ''), t.id)
    returning * into rec;
    insert into public.record_movements (record_id, kind, label, delta, actor_id)
    values (rec.id, 'masuk', 'Diterima dari penyaluran ' || t.code, p_received, t.recipient_id);
  end if;
  perform private.add_event(t.id, new_status, t.recipient_id, msg || coalesce('. ' || p_note, ''));
  perform private.notify(t.donor_id, 'Kegiatan', 'Penerimaan dikonfirmasi', o.name || ': ' || msg || '.', '/aktivitas/' || t.code, 'Lihat penyaluran');
  return t;
end $$;
revoke execute on function private.finalize_receipt(public.transfers, numeric, text, text) from public, authenticated;

create or replace function public.fulfillment_receive(p_id bigint, p_received numeric, p_reason text default null, p_note text default null)
returns public.transfers
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_role('penerima');
  t public.transfers;
  base numeric;
begin
  select * into t from public.transfers where id = p_id and recipient_id = me.id for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  -- Konfirmasi ulang tidak menambah dampak (AT-02).
  if t.status in ('Menunggu verifikasi', 'Diterima penuh', 'Diterima sebagian', 'Ditolak') then return t; end if;
  if t.status not in ('Terjadwal', 'Diserahkan') then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  base := coalesce(t.handed_over, t.agreed);
  if p_received is null or p_received < 0 or p_received > base then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'received';
  end if;
  if p_received = base then return private.finalize_receipt(t, p_received, p_reason, p_note); end if;
  -- Kurang dari jumlah diserahkan: alasan jelas wajib, lalu diperiksa staf ops sebelum tercatat.
  if length(trim(coalesce(p_reason, ''))) < 10 then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'reason'; end if;
  update public.transfers
     set status = 'Menunggu verifikasi',
         pending_receipt = jsonb_build_object('received', p_received, 'reason', trim(p_reason), 'note', p_note, 'prev', t.status)
   where id = p_id returning * into t;
  perform private.add_event(t.id, 'Menunggu verifikasi staf', me.id,
    private.qty(p_received) || ' dari ' || private.qty(base) || ' ' || t.unit || ' diterima: ' || trim(p_reason));
  perform private.notify(t.donor_id, 'Kegiatan', 'Penerimaan sedang diverifikasi',
    'Penerima melaporkan jumlah berbeda. Staf memeriksa alasannya.', '/aktivitas/' || t.code, null);
  perform private.notify_admins('ops', 'Penerimaan perlu diverifikasi', me.org_name || ': ' || t.code, '/admin/penyaluran/' || t.code);
  return t;
end $$;

create function public.admin_verify_receipt(p_id bigint, p_approve boolean, p_note text) returns public.transfers
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('ops');
  t public.transfers;
  p jsonb;
begin
  if coalesce(trim(p_note), '') = '' then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'note'; end if;
  select * into t from public.transfers where id = p_id for update;
  if not found then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  if t.status <> 'Menunggu verifikasi' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  p := t.pending_receipt;
  perform private.audit(me.id, 'verifikasi_penerimaan', t.code, 'Menunggu verifikasi', case when p_approve then 'Disetujui' else 'Dikembalikan' end, p_note);
  if p_approve then
    perform private.add_event(t.id, 'Diverifikasi staf', me.id, p_note);
    return private.finalize_receipt(t, (p ->> 'received')::numeric, p ->> 'reason', p ->> 'note');
  end if;
  update public.transfers set status = p ->> 'prev', pending_receipt = null where id = p_id returning * into t;
  perform private.add_event(t.id, 'Alasan belum diterima staf', me.id, p_note);
  perform private.notify(t.recipient_id, 'Kegiatan', 'Konfirmasi ulang penerimaan', p_note, '/aktivitas/' || t.code, 'Konfirmasi penerimaan');
  return t;
end $$;

-- ── OD-04: ongkir mitra pengiriman ───────────────────────────────────────

alter table public.transfers
  add column fee_payer text not null default 'penerima' check (fee_payer in ('penerima', 'pemberi')),
  add column fee_request boolean not null default false; -- penerima meminta pemberi menanggung ongkir

create function public.fulfillment_request_fee(p_id bigint) returns public.transfers
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_role('penerima');
  t public.transfers;
begin
  select * into t from public.transfers where id = p_id and recipient_id = me.id for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if t.fee_request or t.fee_payer = 'pemberi' then return t; end if;
  if t.status <> 'Terjadwal' or t.method <> 'Mitra pengiriman' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  update public.transfers set fee_request = true where id = p_id returning * into t;
  perform private.add_event(t.id, 'Ongkir diajukan ke pemberi', me.id, null);
  perform private.notify(t.donor_id, 'Kegiatan', 'Permintaan tanggung ongkir', me.org_name || ' meminta ongkir penyaluran ' || t.code || ' ditanggung pemberi.',
    '/aktivitas/' || t.code, 'Tanggapi');
  return t;
end $$;

create function public.fulfillment_respond_fee(p_id bigint, p_accept boolean) returns public.transfers
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_role('pemberi');
  t public.transfers;
begin
  select * into t from public.transfers where id = p_id and donor_id = me.id for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if not t.fee_request then return t; end if;
  update public.transfers set fee_request = false, fee_payer = case when p_accept then 'pemberi' else fee_payer end
   where id = p_id returning * into t;
  if p_accept then
    update public.courier_tasks set payer = 'pemberi' where transfer_id = t.id and payer = 'penerima';
  end if;
  perform private.add_event(t.id, case when p_accept then 'Ongkir ditanggung pemberi' else 'Ongkir tetap ditanggung penerima' end, me.id, null);
  perform private.notify(t.recipient_id, 'Kegiatan', case when p_accept then 'Pemberi menanggung ongkir' else 'Ongkir tetap ditanggung penerima' end,
    'Penyaluran ' || t.code, '/aktivitas/' || t.code, null);
  return t;
end $$;

-- Pembayar ongkir bawaan mengikuti kesepakatan penyaluran.
drop function public.admin_assign_courier(bigint, bigint, bigint, text, bigint);
create function public.admin_assign_courier(
  p_transfer_id bigint, p_courier_id bigint default null, p_cost bigint default 0,
  p_payer text default null, p_program_id bigint default null
) returns public.courier_tasks
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('ops');
  t public.transfers;
  c public.courier_tasks;
  before_text text;
  v_payer text;
begin
  select * into t from public.transfers where id = p_transfer_id;
  if not found then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  if t.status <> 'Terjadwal' or t.method <> 'Mitra pengiriman' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  if p_courier_id is not null and not exists (select 1 from public.profiles where id = p_courier_id and role = 'kurir') then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'courier_id';
  end if;
  v_payer := coalesce(p_payer, case when p_cost > 0 then t.fee_payer else 'relawan' end);
  select * into c from public.courier_tasks where transfer_id = p_transfer_id for update;
  if found and c.status in ('Dalam perjalanan', 'Selesai') then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  before_text := case when found then c.status || coalesce(' / kurir ' || c.courier_id, '') else 'Belum ada tugas' end;
  insert into public.courier_tasks (transfer_id, courier_id, cost, payer, program_id, status)
  values (p_transfer_id, p_courier_id, p_cost, v_payer, p_program_id,
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

-- ── OD-05: poin challenge dan periode berikutnya ─────────────────────────

alter table public.challenges add column points integer not null default 0 check (points >= 0);
alter table public.reward_packs add column cost integer not null default 0 check (cost >= 0);

-- Periode disalin saat bergabung; admin bisa memindah challenge ke periode berikutnya tanpa mengubah progres lama.
alter table public.challenge_participants
  add column points integer not null default 0 check (points >= 0), -- diberikan saat Lolos
  add column period_start date,
  add column period_end date;
update public.challenge_participants p set period_start = c.period_start, period_end = c.period_end
  from public.challenges c where c.id = p.challenge_id;
alter table public.challenge_participants alter column period_start set not null, alter column period_end set not null;
alter table public.challenge_participants drop constraint challenge_participants_challenge_id_profile_id_key;
alter table public.challenge_participants add constraint challenge_participants_once_per_period unique (challenge_id, profile_id, period_start);

-- Klaim membelanjakan poin, tidak lagi terikat ke satu keikutsertaan.
alter table public.reward_claims
  add column profile_id bigint references public.profiles (id),
  add column points integer not null default 0 check (points >= 0),
  add column client_id uuid unique;
update public.reward_claims rc set profile_id = p.profile_id from public.challenge_participants p where p.id = rc.participant_id;
alter table public.reward_claims alter column profile_id set not null, alter column participant_id drop not null;
drop index public.reward_claims_one_active;
create index on public.reward_claims (profile_id);
drop policy reward_claims_read on public.reward_claims;
create policy reward_claims_read on public.reward_claims for select to authenticated
  using (profile_id = private.my_id() or private.is_admin());

create function private.points_balance(p_profile bigint) returns integer
language sql stable security definer set search_path = '' as $$
  select (coalesce((select sum(points) from public.challenge_participants where profile_id = p_profile and status = 'Lolos'), 0)
        - coalesce((select sum(points) from public.reward_claims where profile_id = p_profile and status <> 'Ditolak'), 0))::int
$$;
revoke execute on function private.points_balance(bigint) from public, authenticated;

create or replace function private.challenge_progress(p_participant bigint) returns integer
language sql stable security definer set search_path = '' as $$
  select case c.metric
    -- Hari berbeda dengan catatan manual (catatan otomatis dari penerimaan tidak dihitung).
    when 'catat_pangan' then (
      select count(distinct (f.created_at at time zone 'Asia/Jakarta')::date)::int from public.food_records f
      where f.owner_id = p.profile_id and f.source_transfer_id is null
        and (f.created_at at time zone 'Asia/Jakarta')::date between p.period_start and p.period_end)
    when 'penawaran_alergen' then (
      select count(*)::int from public.offers o
      where o.donor_id = p.profile_id and o.allergens is not null
        and (o.created_at at time zone 'Asia/Jakarta')::date between p.period_start and p.period_end)
    when 'laporan_distribusi_24j' then (
      select count(*)::int from public.transfers t
      where t.recipient_id = p.profile_id and t.distribution_reported_at is not null
        and (t.created_at at time zone 'Asia/Jakarta')::date between p.period_start and p.period_end
        and t.distribution_reported_at <= (
          select min(e.at) from public.transfer_events e
          where e.transfer_id = t.id and e.label in ('Diterima penuh', 'Diterima sebagian')) + interval '24 hours')
    when 'penyaluran_selesai' then (
      select count(*)::int from public.transfers t
      where p.profile_id in (t.donor_id, t.recipient_id) and t.received > 0
        and (t.created_at at time zone 'Asia/Jakarta')::date between p.period_start and p.period_end)
  end
  from public.challenge_participants p join public.challenges c on c.id = p.challenge_id
  where p.id = p_participant
$$;

drop view public.v_challenge_progress;
create view public.v_challenge_progress with (security_invoker = true) as
select p.id as participant_id, p.code, p.challenge_id, p.profile_id, p.status, c.title, c.metric, c.target_count,
       p.period_start, p.period_end, private.challenge_progress(p.id) as progress, p.points, c.points as challenge_points
from public.challenge_participants p
join public.challenges c on c.id = p.challenge_id;

create or replace function public.engagement_join_challenge(p_challenge_id bigint) returns public.challenge_participants
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.me();
  c public.challenges;
  v public.challenge_participants;
begin
  select * into c from public.challenges where id = p_challenge_id;
  if not found then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  select * into v from public.challenge_participants
   where challenge_id = c.id and profile_id = me.id and period_start = c.period_start;
  if found then return v; end if; -- satu keikutsertaan per periode
  if c.status <> 'Aktif' or (now() at time zone 'Asia/Jakarta')::date > c.period_end then
    raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001';
  end if;
  if not (me.role = any (c.roles)) then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  insert into public.challenge_participants (challenge_id, profile_id, period_start, period_end)
  values (c.id, me.id, c.period_start, c.period_end) returning * into v;
  return v;
end $$;

create or replace function public.admin_save_challenge(p_id bigint, p_fields jsonb) returns public.challenges
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('konten');
  old public.challenges;
  v public.challenges;
  v_roles text[] := (select array_agg(x) from jsonb_array_elements_text(p_fields -> 'roles') x);
  next_period boolean;
begin
  if p_id is null then
    insert into public.challenges (title, description, period_start, period_end, roles, metric, target_count, points, status)
    values (p_fields ->> 'title', coalesce(p_fields ->> 'description', ''), (p_fields ->> 'period_start')::date,
            (p_fields ->> 'period_end')::date, v_roles, p_fields ->> 'metric', (p_fields ->> 'target_count')::int,
            coalesce((p_fields ->> 'points')::int, 0), coalesce(p_fields ->> 'status', 'Draf'))
    returning * into v;
    perform private.audit(me.id, 'challenge', v.code, null, v.status, 'Challenge dibuat');
    return v;
  end if;
  select * into old from public.challenges where id = p_id for update;
  if not found then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  -- Aturan terkunci selama periode berjalan (FR-EC-03); pindah ke periode berikutnya membuka aturan baru.
  next_period := coalesce((p_fields ->> 'period_start')::date > old.period_end, false);
  if not next_period
     and exists (select 1 from public.challenge_participants where challenge_id = p_id and period_start = old.period_start)
     and (coalesce(p_fields ->> 'metric', old.metric) <> old.metric
       or coalesce((p_fields ->> 'target_count')::int, old.target_count) <> old.target_count
       or coalesce((p_fields ->> 'points')::int, old.points) <> old.points
       or coalesce((p_fields ->> 'period_start')::date, old.period_start) <> old.period_start
       or coalesce((p_fields ->> 'period_end')::date, old.period_end) <> old.period_end
       or (v_roles is not null and v_roles::text[] <> old.roles)) then
    raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001', detail = 'Aturan terkunci setelah ada peserta';
  end if;
  update public.challenges set
    title = coalesce(p_fields ->> 'title', title), description = coalesce(p_fields ->> 'description', description),
    period_start = coalesce((p_fields ->> 'period_start')::date, period_start),
    period_end = coalesce((p_fields ->> 'period_end')::date, period_end),
    roles = coalesce(v_roles, roles), metric = coalesce(p_fields ->> 'metric', metric),
    target_count = coalesce((p_fields ->> 'target_count')::int, target_count),
    points = coalesce((p_fields ->> 'points')::int, points), status = coalesce(p_fields ->> 'status', status)
  where id = p_id returning * into v;
  perform private.audit(me.id, 'challenge', v.code, old.status, v.status,
    case when next_period then 'Challenge pindah ke periode berikutnya' else 'Challenge diubah' end);
  return v;
end $$;

create or replace function public.admin_save_reward_pack(p_id bigint, p_fields jsonb) returns public.reward_packs
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('konten');
  old public.reward_packs;
  v public.reward_packs;
  v_roles text[] := (select array_agg(x) from jsonb_array_elements_text(p_fields -> 'eligible_roles') x);
begin
  if p_id is null then
    insert into public.reward_packs (title, detail, sponsor, quota, cost, eligible_roles, active)
    values (p_fields ->> 'title', coalesce(p_fields ->> 'detail', ''), p_fields ->> 'sponsor', (p_fields ->> 'quota')::int,
            coalesce((p_fields ->> 'cost')::int, 0), v_roles, coalesce((p_fields ->> 'active')::boolean, true))
    returning * into v;
    perform private.audit(me.id, 'reward', v.code, null, 'kuota ' || v.quota, 'Paket reward dibuat');
    return v;
  end if;
  select * into old from public.reward_packs where id = p_id for update;
  if not found then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  update public.reward_packs set
    title = coalesce(p_fields ->> 'title', title), detail = coalesce(p_fields ->> 'detail', detail),
    sponsor = coalesce(p_fields ->> 'sponsor', sponsor), quota = coalesce((p_fields ->> 'quota')::int, quota),
    cost = coalesce((p_fields ->> 'cost')::int, cost),
    eligible_roles = coalesce(v_roles, eligible_roles), active = coalesce((p_fields ->> 'active')::boolean, active)
  where id = p_id returning * into v;
  perform private.audit(me.id, 'reward', v.code, 'kuota ' || old.quota, 'kuota ' || v.quota, 'Paket reward diubah');
  return v;
end $$;

create or replace function public.admin_decide_participant(p_id bigint, p_decision text, p_reason text) returns public.challenge_participants
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('ops');
  v public.challenge_participants;
begin
  if p_decision not in ('Lolos', 'Tidak lolos') or coalesce(trim(p_reason), '') = '' then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001';
  end if;
  select * into v from public.challenge_participants where id = p_id for update;
  if not found then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  if v.status = p_decision then return v; end if;
  if v.status <> 'Menunggu verifikasi' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  update public.challenge_participants
     set status = p_decision, reason = p_reason, verified_by = me.id, verified_at = now(),
         points = case when p_decision = 'Lolos' then (select points from public.challenges where id = v.challenge_id) else 0 end
   where id = p_id returning * into v;
  perform private.audit(me.id, 'peserta_challenge', v.code, 'Menunggu verifikasi', p_decision, p_reason);
  perform private.notify(v.profile_id, 'Reward',
    case when p_decision = 'Lolos' then 'Challenge terverifikasi: +' || v.points || ' poin' else 'Challenge belum lolos' end,
    p_reason, '/reward', 'Lihat reward');
  return v;
end $$;

drop function public.engagement_claim_reward(bigint, bigint);
create function public.engagement_claim_reward(p_client_id uuid, p_pack_id bigint) returns public.reward_claims
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.me();
  pack public.reward_packs;
  v public.reward_claims;
begin
  select * into v from public.reward_claims where client_id = p_client_id;
  if found then
    if v.profile_id <> me.id then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
    return v;
  end if;
  perform 1 from public.profiles where id = me.id for update; -- satu penukaran per akun dalam satu waktu: poin tidak terpakai ganda
  select * into pack from public.reward_packs where id = p_pack_id and active and me.role = any (eligible_roles);
  if not found then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'pack'; end if;
  if private.points_balance(me.id) < pack.cost then raise exception 'POIN_TIDAK_CUKUP' using errcode = 'P0001'; end if;
  update public.reward_packs set claimed = claimed + 1 where id = pack.id and claimed < quota returning * into pack;
  if not found then raise exception 'KUOTA_HABIS' using errcode = 'P0001'; end if;
  insert into public.reward_claims (profile_id, pack_id, points, client_id) values (me.id, pack.id, pack.cost, p_client_id) returning * into v;
  perform private.notify_admins('ops', 'Klaim reward baru', me.org_name || ': ' || pack.title, '/admin/reward/' || v.code);
  return v;
end $$;

create or replace function public.admin_update_claim(p_id bigint, p_status text, p_reason text) returns public.reward_claims
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('ops');
  old public.reward_claims;
  v public.reward_claims;
begin
  select * into old from public.reward_claims where id = p_id for update;
  if not found or coalesce(trim(p_reason), '') = '' then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  if old.status = p_status then return old; end if;
  if not ((old.status = 'Diajukan' and p_status in ('Siap disalurkan', 'Ditolak'))
       or (old.status = 'Siap disalurkan' and p_status in ('Diserahkan', 'Ditolak'))) then
    raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001';
  end if;
  update public.reward_claims set status = p_status, reason = p_reason where id = p_id returning * into v;
  if p_status = 'Ditolak' then
    update public.reward_packs set claimed = claimed - 1 where id = v.pack_id; -- kuota kembali; poin kembali lewat points_balance
  end if;
  perform private.audit(me.id, 'klaim_reward', v.code, old.status, v.status, p_reason);
  perform private.notify(v.profile_id, 'Reward', 'Status klaim: ' || p_status, p_reason, '/reward', 'Lihat reward');
  return v;
end $$;

-- Nilai poin data awal: tiap peran bisa mengumpulkan 100 poin per periode.
update public.challenges set points = case metric when 'catat_pangan' then 40 else 60 end
 where title in ('Catat Pangan tiga hari', 'Label donasi lengkap', 'Lengkapi laporan distribusi');
update public.reward_packs set cost = case title when 'Paket wadah besek higienis' then 80 else 100 end
 where title in ('Paket wadah besek higienis', 'Paket bahan pokok dapur komunitas');
update public.reward_packs set sponsor = 'Lumbung Warga Bandung' where sponsor = 'Sponsor Komunitas Bandung'; -- sponsor fiksi

-- ── Hak akses ────────────────────────────────────────────────────────────

-- Tanpa grant massal (advisor_fixes); authenticated mendapat EXECUTE dari default privileges Supabase.
revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon;
