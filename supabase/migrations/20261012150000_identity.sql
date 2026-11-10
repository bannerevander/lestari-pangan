-- Modul identity, notify, audit (architecture.md §9). Klien hanya membaca; semua perubahan lewat RPC.

create schema if not exists private;
grant usage on schema private to authenticated;

-- ── Tabel ────────────────────────────────────────────────────────────────

create table public.profiles (
  id bigint generated always as identity primary key,
  code text generated always as ('USR-' || id) stored,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  role text not null check (role in ('pemberi', 'penerima', 'kurir', 'admin')),
  admin_scope text check (admin_scope in ('ops', 'keuangan', 'konten')),
  org_name text not null check (length(trim(org_name)) between 2 and 120),
  org_type text not null,
  area text not null,
  hours text,
  capacity text,
  storage text,
  verification_status text not null default 'Belum diajukan'
    check (verification_status in ('Belum diajukan', 'Menunggu pemeriksaan', 'Terverifikasi', 'Ditolak')),
  prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check ((role = 'admin') = (admin_scope is not null))
);

-- Kontak dipisah agar RLS bisa membatasinya (NFR-01, AT-10).
create table public.profile_contacts (
  profile_id bigint primary key references public.profiles (id) on delete cascade,
  pic text not null,
  phone text not null,
  address text not null,
  created_at timestamptz not null default now()
);

create table public.verifications (
  id bigint generated always as identity primary key,
  code text generated always as ('VRF-' || id) stored,
  profile_id bigint not null references public.profiles (id),
  doc_path text not null,
  status text not null default 'Menunggu pemeriksaan'
    check (status in ('Menunggu pemeriksaan', 'Terverifikasi', 'Ditolak')),
  reason text,
  decided_by bigint references public.profiles (id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.verifications (profile_id);

create table public.notifications (
  id bigint generated always as identity primary key,
  profile_id bigint not null references public.profiles (id),
  kind text not null check (kind in ('Kegiatan', 'Reward', 'Sistem')),
  title text not null,
  body text not null,
  link text,
  cta text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (profile_id, created_at desc);

create table public.audit_log (
  id bigint generated always as identity primary key,
  code text generated always as ('AUD-' || lpad(id::text, 4, '0')) stored,
  at timestamptz not null default now(),
  actor_id bigint references public.profiles (id), -- null = Sistem
  action text not null,
  target text not null,
  before text,
  after text,
  reason text not null
);

-- ── Helper (schema private tidak diekspos API) ───────────────────────────

create function private.my_id() returns bigint
language sql stable security definer set search_path = '' as $$
  select id from public.profiles where user_id = auth.uid()
$$;

create function private.my_role() returns text
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where user_id = auth.uid()
$$;

create function private.is_admin(p_scope text default null) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin' and (p_scope is null or admin_scope = p_scope)
  )
$$;

-- Profil pemanggil; galat bila belum login atau belum onboarding.
create function private.me() returns public.profiles
language plpgsql stable security definer set search_path = '' as $$
declare v public.profiles;
begin
  select * into v from public.profiles where user_id = auth.uid();
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001', detail = 'Profil belum dibuat'; end if;
  return v;
end $$;

create function private.require_role(p_role text) returns public.profiles
language plpgsql stable security definer set search_path = '' as $$
declare v public.profiles := private.me();
begin
  if v.role <> p_role then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  return v;
end $$;

create function private.require_admin(p_scope text) returns public.profiles
language plpgsql stable security definer set search_path = '' as $$
declare v public.profiles := private.me();
begin
  if v.role <> 'admin' or v.admin_scope <> p_scope then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  return v;
end $$;

create function private.notify(p_to bigint, p_kind text, p_title text, p_body text, p_link text default null, p_cta text default null)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (profile_id, kind, title, body, link, cta)
  values (p_to, p_kind, p_title, p_body, p_link, p_cta)
$$;

create function private.audit(p_actor bigint, p_action text, p_target text, p_before text, p_after text, p_reason text)
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_log (actor_id, action, target, before, after, reason)
  values (p_actor, p_action, p_target, p_before, p_after, p_reason)
$$;

create function private.forbid_change() returns trigger
language plpgsql as $$
begin
  raise exception 'APPEND_ONLY' using errcode = 'P0001', detail = tg_table_name || ' tidak boleh diubah atau dihapus';
end $$;

create trigger audit_log_append_only before update or delete on public.audit_log
  for each row execute function private.forbid_change();

grant execute on all functions in schema private to authenticated;

-- ── RLS: hanya baca ──────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.profile_contacts enable row level security;
alter table public.verifications enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;

create policy profiles_read on public.profiles for select to authenticated using (true);
-- Kebijakan baca profile_contacts untuk lawan pihak penyaluran ditambah di migrasi fulfillment.
create policy contacts_read_own on public.profile_contacts for select to authenticated
  using (profile_id = private.my_id() or private.is_admin());
create policy verifications_read on public.verifications for select to authenticated
  using (profile_id = private.my_id() or private.is_admin('ops'));
create policy notifications_read on public.notifications for select to authenticated
  using (profile_id = private.my_id());
create policy audit_read on public.audit_log for select to authenticated
  using (private.is_admin());

-- ── RPC identity ─────────────────────────────────────────────────────────

create function public.identity_complete_onboarding(
  p_role text, p_org_name text, p_org_type text, p_area text,
  p_pic text, p_phone text, p_address text,
  p_hours text default null, p_capacity text default null, p_storage text default null
) returns public.profiles
language plpgsql security definer set search_path = '' as $$
declare v public.profiles;
begin
  if auth.uid() is null then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  select * into v from public.profiles where user_id = auth.uid();
  if found then
    if v.role <> p_role then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001', detail = 'Peran sudah ditetapkan'; end if;
    return v; -- idempotent
  end if;
  -- Admin hanya dibuat manual oleh pengelola (AR-07).
  if p_role not in ('pemberi', 'penerima', 'kurir') then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'role';
  end if;
  if coalesce(trim(p_pic), '') = '' or coalesce(trim(p_phone), '') = '' or coalesce(trim(p_address), '') = '' then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'kontak';
  end if;
  insert into public.profiles (user_id, role, org_name, org_type, area, hours, capacity, storage)
  values (auth.uid(), p_role, trim(p_org_name), p_org_type, p_area, p_hours, p_capacity, p_storage)
  returning * into v;
  insert into public.profile_contacts (profile_id, pic, phone, address) values (v.id, trim(p_pic), trim(p_phone), trim(p_address));
  return v;
end $$;

-- Kolom yang tidak dikirim tidak berubah.
create function public.identity_save_profile(p_fields jsonb) returns public.profiles
language plpgsql security definer set search_path = '' as $$
declare v public.profiles := private.me();
begin
  if p_fields ? 'org_name' and v.verification_status = 'Terverifikasi' then
    raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001', detail = 'Nama terverifikasi hanya diubah lewat admin';
  end if;
  update public.profiles set
    org_name = coalesce(p_fields ->> 'org_name', org_name),
    area     = coalesce(p_fields ->> 'area', area),
    hours    = coalesce(p_fields ->> 'hours', hours),
    capacity = coalesce(p_fields ->> 'capacity', capacity),
    storage  = coalesce(p_fields ->> 'storage', storage)
  where id = v.id returning * into v;
  update public.profile_contacts set
    pic     = coalesce(p_fields ->> 'pic', pic),
    phone   = coalesce(p_fields ->> 'phone', phone),
    address = coalesce(p_fields ->> 'address', address)
  where profile_id = v.id;
  return v;
end $$;

create function public.identity_set_pref(p_key text, p_value boolean) returns public.profiles
language plpgsql security definer set search_path = '' as $$
declare v public.profiles := private.me();
begin
  update public.profiles set prefs = prefs || jsonb_build_object(p_key, p_value) where id = v.id returning * into v;
  return v;
end $$;

create function public.identity_submit_verification(p_doc_path text) returns public.verifications
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.me();
  v public.verifications;
begin
  -- Berkas wajib berada di folder milik pemanggil pada bucket verification-docs.
  if split_part(p_doc_path, '/', 1) <> auth.uid()::text then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'doc_path';
  end if;
  select * into v from public.verifications where profile_id = me.id and status = 'Menunggu pemeriksaan';
  if found then return v; end if;
  if me.verification_status = 'Terverifikasi' then
    raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001';
  end if;
  insert into public.verifications (profile_id, doc_path) values (me.id, p_doc_path) returning * into v;
  update public.profiles set verification_status = 'Menunggu pemeriksaan' where id = me.id;
  perform private.audit(me.id, 'verifikasi_diajukan', me.code, me.verification_status, 'Menunggu pemeriksaan', 'Berkas diunggah');
  return v;
end $$;

create function public.notify_mark_read(p_id bigint default null) returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  update public.notifications set read_at = now()
  where profile_id = private.my_id() and read_at is null and (p_id is null or id = p_id);
  get diagnostics n = row_count;
  return n;
end $$;

-- ── RPC admin identity ───────────────────────────────────────────────────

create function public.admin_decide_verification(p_id bigint, p_decision text, p_reason text) returns public.verifications
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('ops');
  v public.verifications;
  target public.profiles;
begin
  if p_decision not in ('Terverifikasi', 'Ditolak') or coalesce(trim(p_reason), '') = '' then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001';
  end if;
  select * into v from public.verifications where id = p_id for update;
  if not found then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  if v.status = p_decision then return v; end if;
  if v.status <> 'Menunggu pemeriksaan' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  update public.verifications set status = p_decision, reason = p_reason, decided_by = me.id, decided_at = now()
  where id = p_id returning * into v;
  update public.profiles set verification_status = p_decision where id = v.profile_id returning * into target;
  perform private.audit(me.id, 'verifikasi', target.code, 'Menunggu pemeriksaan', p_decision, p_reason);
  perform private.notify(target.id, 'Sistem',
    case when p_decision = 'Terverifikasi' then 'Akun terverifikasi' else 'Verifikasi belum diterima' end,
    p_reason, '/akun', 'Lihat akun');
  return v;
end $$;

-- ── Storage ──────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public) values
  ('offer-photos', 'offer-photos', true),
  ('verification-docs', 'verification-docs', false)
on conflict (id) do nothing;

-- Konvensi path: <auth.uid()>/<nama berkas>.
create policy offer_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'offer-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy verification_docs_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy verification_docs_read on storage.objects for select to authenticated
  using (bucket_id = 'verification-docs' and ((storage.foldername(name))[1] = auth.uid()::text or private.is_admin('ops')));

-- ── Hak akses: klien tidak menulis langsung ke tabel ─────────────────────

revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
