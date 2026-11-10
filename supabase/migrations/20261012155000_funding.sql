-- Modul funding (architecture.md §9). Uang hanya bergerak lewat ledger append-only; saldo selalu dihitung.

-- ── Tabel ────────────────────────────────────────────────────────────────

create table public.programs (
  id bigint generated always as identity primary key,
  code text generated always as ('PRG-' || id) stored,
  title text not null check (length(trim(title)) between 3 and 160),
  sponsor text not null,
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  budget bigint not null default 0 check (budget >= 0),
  status text not null default 'Menunggu dana' check (status in ('Menunggu dana', 'Aktif', 'Selesai')),
  created_at timestamptz not null default now()
);

alter table public.courier_tasks
  add constraint courier_tasks_program_fk foreign key (program_id) references public.programs (id);
create index on public.courier_tasks (program_id);

create table public.supports (
  id bigint generated always as identity primary key,
  code text generated always as ('DKG-' || id) stored,
  profile_id bigint not null references public.profiles (id),
  amount bigint not null check (amount > 0),
  fund text not null check (fund in ('operasional', 'pengiriman', 'bantuan_langsung', 'program')),
  program_id bigint references public.programs (id),
  allocation text not null, -- judul tujuan seperti tampil di UI
  status text not null default 'Menunggu verifikasi' check (status in ('Menunggu verifikasi', 'Tervalidasi', 'Dibatalkan')),
  note text,
  decided_by bigint references public.profiles (id),
  decided_at timestamptz,
  client_id uuid unique,
  created_at timestamptz not null default now(),
  check ((fund = 'program') = (program_id is not null))
);
create index on public.supports (profile_id, created_at desc);
create index on public.supports (status);

create table public.recurring_supports (
  profile_id bigint primary key references public.profiles (id),
  amount bigint not null check (amount > 0),
  day integer not null check (day between 1 and 28),
  fund text not null default 'operasional' check (fund in ('operasional', 'pengiriman', 'bantuan_langsung')),
  updated_at timestamptz not null default now()
);

create table public.in_kind_supports (
  id bigint generated always as identity primary key,
  code text generated always as ('INK-' || id) stored,
  profile_id bigint not null references public.profiles (id),
  kind text not null check (length(trim(kind)) between 2 and 120),
  amount_text text not null, -- barang tidak dikonversi ke rupiah
  status text not null default 'Menunggu peninjauan' check (status in ('Menunggu peninjauan', 'Dicatat fisik', 'Ditolak')),
  reason text,
  client_id uuid unique,
  created_at timestamptz not null default now()
);
create index on public.in_kind_supports (profile_id);

-- Append-only. Koreksi = entri pembalik (reverses_id), bukan UPDATE.
create table public.ledger_entries (
  id bigint generated always as identity primary key,
  code text generated always as ('TRX-' || lpad(id::text, 5, '0')) stored,
  at timestamptz not null default now(),
  kind text not null check (kind in ('Masuk', 'Keluar')),
  fund text not null check (fund in ('operasional', 'pengiriman', 'bantuan_langsung', 'program')),
  program_id bigint references public.programs (id),
  amount bigint not null check (amount > 0),
  source text not null,
  transfer_id bigint references public.transfers (id),
  support_id bigint unique references public.supports (id),
  provider_ref text unique, -- konfirmasi pembayaran ganda tidak menambah saldo (AT-09)
  reverses_id bigint unique references public.ledger_entries (id),
  recorded_by bigint references public.profiles (id),
  note text,
  check ((fund = 'program') = (program_id is not null))
);
create index on public.ledger_entries (fund, program_id);
create index on public.ledger_entries (transfer_id);

create trigger ledger_entries_append_only before update or delete on public.ledger_entries
  for each row execute function private.forbid_change();

-- ── Helper ───────────────────────────────────────────────────────────────

create function private.fund_balance(p_fund text, p_program bigint) returns bigint
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(case when kind = 'Masuk' then amount else -amount end), 0)::bigint
  from public.ledger_entries where fund = p_fund and program_id is not distinct from p_program
$$;

-- Satu jalur tulis ledger; Keluar tidak boleh membuat saldo dana itu negatif (dana khusus dipakai sesuai tujuan).
create function private.ledger_insert(
  p_kind text, p_fund text, p_amount bigint, p_source text, p_actor bigint, p_note text default null,
  p_program bigint default null, p_transfer bigint default null, p_support bigint default null,
  p_provider_ref text default null, p_reverses bigint default null
) returns public.ledger_entries
language plpgsql security definer set search_path = '' as $$
declare v public.ledger_entries;
begin
  if p_provider_ref is not null then
    select * into v from public.ledger_entries where provider_ref = p_provider_ref;
    if found then return v; end if;
  end if;
  if p_kind = 'Keluar' then
    perform pg_advisory_xact_lock(hashtext('ledger:' || p_fund || ':' || coalesce(p_program::text, '')));
    if private.fund_balance(p_fund, p_program) < p_amount then
      raise exception 'SALDO_TIDAK_CUKUP' using errcode = 'P0001';
    end if;
  end if;
  insert into public.ledger_entries (kind, fund, program_id, amount, source, transfer_id, support_id, provider_ref, reverses_id, recorded_by, note)
  values (p_kind, p_fund, p_program, p_amount, p_source, p_transfer, p_support, p_provider_ref, p_reverses, p_actor, p_note)
  returning * into v;
  return v;
end $$;
revoke execute on function private.ledger_insert(text, text, bigint, text, bigint, text, bigint, bigint, bigint, text, bigint) from public, authenticated;

-- ── RLS ──────────────────────────────────────────────────────────────────

alter table public.programs enable row level security;
alter table public.supports enable row level security;
alter table public.recurring_supports enable row level security;
alter table public.in_kind_supports enable row level security;
alter table public.ledger_entries enable row level security;

create policy programs_read on public.programs for select to authenticated using (true);
create policy supports_read on public.supports for select to authenticated
  using (profile_id = private.my_id() or private.is_admin('keuangan'));
create policy recurring_read on public.recurring_supports for select to authenticated
  using (profile_id = private.my_id() or private.is_admin('keuangan'));
create policy in_kind_read on public.in_kind_supports for select to authenticated
  using (profile_id = private.my_id() or private.is_admin('keuangan'));
create policy ledger_read on public.ledger_entries for select to authenticated
  using (private.is_admin('keuangan'));

-- ── View dan ringkasan ───────────────────────────────────────────────────

-- Ringkasan transparan untuk semua pengguna; rincian transaksi hanya admin keuangan.
create function public.funding_summary()
returns table (fund text, program_id bigint, program_title text, masuk bigint, keluar bigint, saldo bigint)
language sql stable security definer set search_path = '' as $$
  select l.fund, l.program_id, p.title,
         coalesce(sum(l.amount) filter (where l.kind = 'Masuk'), 0)::bigint,
         coalesce(sum(l.amount) filter (where l.kind = 'Keluar'), 0)::bigint,
         coalesce(sum(case when l.kind = 'Masuk' then l.amount else -l.amount end), 0)::bigint
  from public.ledger_entries l left join public.programs p on p.id = l.program_id
  group by l.fund, l.program_id, p.title
  order by l.fund, l.program_id
$$;

create view public.v_admin_queue with (security_invoker = true) as
select
  (select count(*) from public.verifications where status = 'Menunggu pemeriksaan') as verifications_pending,
  (select count(*) from public.issues where status in ('Dikirim', 'Sedang ditinjau', 'Keberatan diajukan')) as issues_open,
  (select count(*) from public.challenge_participants where status = 'Menunggu verifikasi') as participants_pending,
  (select count(*) from public.reward_claims where status in ('Diajukan', 'Siap disalurkan')) as claims_open,
  (select count(*) from public.supports where status = 'Menunggu verifikasi') as supports_pending,
  (select count(*) from public.in_kind_supports where status = 'Menunggu peninjauan') as in_kind_pending,
  (select count(*) from public.transfers where status = 'Terjadwal' and overdue_notified_at is not null) as transfers_overdue,
  (select count(*) from public.courier_tasks where status in ('Menunggu kurir', 'Gagal')) as courier_open;

-- ── RPC pengguna ─────────────────────────────────────────────────────────

create function public.funding_add_support(
  p_client_id uuid, p_amount bigint, p_fund text, p_allocation text, p_program_id bigint default null
) returns public.supports
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.me();
  v public.supports;
begin
  select * into v from public.supports where client_id = p_client_id;
  if found then
    if v.profile_id <> me.id then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
    return v;
  end if;
  if p_amount is null or p_amount <= 0 or coalesce(trim(p_allocation), '') = '' then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001';
  end if;
  -- Belum masuk ledger sampai pembayaran dikonfirmasi admin/penyedia pembayaran.
  insert into public.supports (profile_id, amount, fund, program_id, allocation, client_id)
  values (me.id, p_amount, p_fund, p_program_id, trim(p_allocation), p_client_id)
  returning * into v;
  perform private.notify_admins('keuangan', 'Dukungan menunggu verifikasi', v.code || ': Rp' || v.amount, '/admin/dana');
  return v;
end $$;

-- p_amount null = berhenti berlangganan dukungan rutin.
create function public.funding_set_recurring(p_amount bigint default null, p_day integer default null, p_fund text default 'operasional')
returns public.recurring_supports
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.me();
  v public.recurring_supports;
begin
  if p_amount is null then
    delete from public.recurring_supports where profile_id = me.id;
    return null;
  end if;
  if p_amount <= 0 or p_day is null then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  insert into public.recurring_supports (profile_id, amount, day, fund) values (me.id, p_amount, p_day, p_fund)
  on conflict (profile_id) do update set amount = excluded.amount, day = excluded.day, fund = excluded.fund, updated_at = now()
  returning * into v;
  return v;
end $$;

create function public.funding_add_in_kind(p_client_id uuid, p_kind text, p_amount_text text) returns public.in_kind_supports
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.me();
  v public.in_kind_supports;
begin
  select * into v from public.in_kind_supports where client_id = p_client_id;
  if found then
    if v.profile_id <> me.id then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
    return v;
  end if;
  if coalesce(trim(p_amount_text), '') = '' then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  insert into public.in_kind_supports (profile_id, kind, amount_text, client_id)
  values (me.id, trim(p_kind), trim(p_amount_text), p_client_id) returning * into v;
  perform private.notify_admins('keuangan', 'Bantuan barang/jasa baru', v.kind || ': ' || v.amount_text, '/admin/dana');
  return v;
end $$;

-- ── RPC admin keuangan ───────────────────────────────────────────────────

create function public.admin_decide_support(p_id bigint, p_decision text, p_reason text, p_provider_ref text default null)
returns public.supports
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('keuangan');
  v public.supports;
  donor public.profiles;
begin
  if p_decision not in ('Tervalidasi', 'Dibatalkan') or coalesce(trim(p_reason), '') = '' then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001';
  end if;
  select * into v from public.supports where id = p_id for update;
  if not found then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  if v.status = p_decision then return v; end if;
  if v.status <> 'Menunggu verifikasi' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  if p_decision = 'Tervalidasi' then
    if p_provider_ref is not null and exists (select 1 from public.ledger_entries where provider_ref = p_provider_ref) then
      raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'provider_ref sudah tercatat';
    end if;
    select * into donor from public.profiles where id = v.profile_id;
    perform private.ledger_insert('Masuk', v.fund, v.amount, donor.org_name, me.id, v.allocation,
      v.program_id, null, v.id, p_provider_ref);
  end if;
  update public.supports set status = p_decision, note = p_reason, decided_by = me.id, decided_at = now()
   where id = p_id returning * into v;
  perform private.audit(me.id, 'dukungan', v.code, 'Menunggu verifikasi', p_decision || ' Rp' || v.amount, p_reason);
  perform private.notify(v.profile_id, 'Sistem',
    case when p_decision = 'Tervalidasi' then 'Dukungan diterima' else 'Dukungan dibatalkan' end, p_reason, '/dukung', null);
  return v;
end $$;

create function public.admin_record_ledger(
  p_kind text, p_fund text, p_amount bigint, p_source text, p_note text,
  p_program_id bigint default null, p_transfer_id bigint default null, p_provider_ref text default null
) returns public.ledger_entries
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('keuangan');
  v public.ledger_entries;
begin
  if p_amount is null or p_amount <= 0 or coalesce(trim(p_source), '') = '' or coalesce(trim(p_note), '') = '' then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001';
  end if;
  v := private.ledger_insert(p_kind, p_fund, p_amount, trim(p_source), me.id, trim(p_note), p_program_id, p_transfer_id, null, p_provider_ref);
  perform private.audit(me.id, 'ledger', v.code, null, v.kind || ' ' || v.fund || ' Rp' || v.amount, v.note);
  return v;
end $$;

create function public.admin_reverse_ledger(p_id bigint, p_reason text) returns public.ledger_entries
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('keuangan');
  orig public.ledger_entries;
  v public.ledger_entries;
begin
  if coalesce(trim(p_reason), '') = '' then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'reason'; end if;
  select * into v from public.ledger_entries where reverses_id = p_id;
  if found then return v; end if;
  select * into orig from public.ledger_entries where id = p_id;
  if not found or orig.reverses_id is not null then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  v := private.ledger_insert(case when orig.kind = 'Masuk' then 'Keluar' else 'Masuk' end, orig.fund, orig.amount,
    orig.source, me.id, 'Pembalik ' || orig.code || ': ' || p_reason, orig.program_id, orig.transfer_id, null, null, orig.id);
  perform private.audit(me.id, 'ledger', orig.code, orig.kind || ' Rp' || orig.amount, 'Dibalik oleh ' || v.code, p_reason);
  return v;
end $$;

create function public.admin_save_program(p_id bigint, p_fields jsonb) returns public.programs
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('keuangan');
  old public.programs;
  v public.programs;
begin
  if p_id is null then
    insert into public.programs (title, sponsor, period_start, period_end, budget, status)
    values (p_fields ->> 'title', p_fields ->> 'sponsor', (p_fields ->> 'period_start')::date, (p_fields ->> 'period_end')::date,
            coalesce((p_fields ->> 'budget')::bigint, 0), coalesce(p_fields ->> 'status', 'Menunggu dana'))
    returning * into v;
    perform private.audit(me.id, 'program', v.code, null, v.status, 'Program dibuat');
    return v;
  end if;
  select * into old from public.programs where id = p_id for update;
  if not found then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  update public.programs set
    title = coalesce(p_fields ->> 'title', title), sponsor = coalesce(p_fields ->> 'sponsor', sponsor),
    period_start = coalesce((p_fields ->> 'period_start')::date, period_start),
    period_end = coalesce((p_fields ->> 'period_end')::date, period_end),
    budget = coalesce((p_fields ->> 'budget')::bigint, budget), status = coalesce(p_fields ->> 'status', status)
  where id = p_id returning * into v;
  perform private.audit(me.id, 'program', v.code, old.status || ' Rp' || old.budget, v.status || ' Rp' || v.budget, 'Program diubah');
  return v;
end $$;

create function public.admin_decide_in_kind(p_id bigint, p_status text, p_reason text) returns public.in_kind_supports
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('keuangan');
  v public.in_kind_supports;
begin
  if p_status not in ('Dicatat fisik', 'Ditolak') or coalesce(trim(p_reason), '') = '' then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001';
  end if;
  select * into v from public.in_kind_supports where id = p_id for update;
  if not found then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  if v.status = p_status then return v; end if;
  if v.status <> 'Menunggu peninjauan' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  update public.in_kind_supports set status = p_status, reason = p_reason where id = p_id returning * into v;
  perform private.audit(me.id, 'bantuan_barang', v.code, 'Menunggu peninjauan', p_status, p_reason);
  perform private.notify(v.profile_id, 'Sistem', 'Bantuan barang/jasa: ' || p_status, p_reason, '/dukung', null);
  return v;
end $$;

revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon;
