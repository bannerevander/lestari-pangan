-- Tiket bantuan + permintaan penghapusan data (A10, A12) dan promosi yang dikelola admin konten.
-- Gambar promosi, sampul konten, dan materi apresiasi disimpan di bucket publik `media` (hanya admin konten yang mengunggah).

-- ── Tiket ────────────────────────────────────────────────────────────────

create table public.support_tickets (
  id bigint generated always as identity primary key,
  code text generated always as ('TKT-' || id) stored,
  profile_id bigint not null references public.profiles (id),
  kind text not null check (kind in ('Bantuan', 'Hapus data')),
  topic text not null check (length(trim(topic)) between 2 and 120),
  related text,
  message text not null default '' check (length(message) <= 2000),
  status text not null default 'Dikirim' check (status in ('Dikirim', 'Ditangani', 'Selesai')),
  reply text,
  client_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.support_tickets (profile_id, created_at desc);
create index on public.support_tickets (status);

alter table public.support_tickets enable row level security;
create policy support_tickets_read on public.support_tickets for select to authenticated
  using (profile_id = private.my_id() or private.is_admin('ops'));

create function public.support_create_ticket(p_client_id uuid, p_kind text, p_topic text, p_message text, p_related text default null)
returns public.support_tickets
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.me();
  v public.support_tickets;
begin
  select * into v from public.support_tickets where client_id = p_client_id;
  if found then
    if v.profile_id <> me.id then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
    return v;
  end if;
  if p_kind not in ('Bantuan', 'Hapus data') or coalesce(trim(p_topic), '') = '' then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001';
  end if;
  if p_kind = 'Bantuan' and length(trim(coalesce(p_message, ''))) < 10 then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'message';
  end if;
  insert into public.support_tickets (profile_id, kind, topic, related, message, client_id)
  values (me.id, p_kind, trim(p_topic), nullif(trim(coalesce(p_related, '')), ''), trim(coalesce(p_message, '')), p_client_id)
  returning * into v;
  perform private.notify_admins('ops',
    case when p_kind = 'Bantuan' then 'Tiket bantuan baru' else 'Permintaan penghapusan data' end,
    v.code || ': ' || v.topic, '/admin/tiket/' || v.code);
  return v;
end $$;

create function public.admin_reply_ticket(p_id bigint, p_status text, p_reply text) returns public.support_tickets
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('ops');
  old public.support_tickets;
  v public.support_tickets;
begin
  if p_status not in ('Ditangani', 'Selesai') or coalesce(trim(p_reply), '') = '' then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001';
  end if;
  select * into old from public.support_tickets where id = p_id for update;
  if not found then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  if old.status = 'Selesai' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  update public.support_tickets set status = p_status, reply = trim(p_reply), updated_at = now() where id = p_id returning * into v;
  perform private.audit(me.id, 'tiket', v.code, old.status, v.status, v.reply);
  perform private.notify(v.profile_id, 'Sistem', 'Balasan ' || v.code || ': ' || v.topic, v.reply, '/bantuan', 'Lihat tiket');
  return v;
end $$;

-- ── Promosi ──────────────────────────────────────────────────────────────

create table public.promotions (
  id bigint generated always as identity primary key,
  code text generated always as ('PRM-' || id) stored,
  title text not null check (length(trim(title)) between 3 and 120),
  placement text not null check (placement in ('beranda', 'tips', 'resep', 'reward', 'dukung')),
  image_path text not null check (image_path ~ '^promo/[A-Za-z0-9._-]+$'),
  link text check (link is null or link ~ '^/[a-z0-9/_-]*$'), -- hanya rute di dalam aplikasi
  area text, -- null = semua wilayah; selain itu nama kab/kota persis seperti di profil
  starts_on date,
  ends_on date check (ends_on is null or starts_on is null or ends_on >= starts_on),
  active boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.promotions (placement, active);

alter table public.promotions enable row level security;
create policy promotions_read on public.promotions for select to authenticated
  using (
    (active and (starts_on is null or starts_on <= (now() at time zone 'Asia/Jakarta')::date)
            and (ends_on is null or ends_on >= (now() at time zone 'Asia/Jakarta')::date))
    or private.is_admin()
  );

create function public.admin_save_promotion(p_id bigint, p_fields jsonb) returns public.promotions
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('konten');
  old public.promotions;
  v public.promotions;
begin
  if p_id is null then
    insert into public.promotions (title, placement, image_path, link, area, starts_on, ends_on, active, sort)
    values (p_fields ->> 'title', p_fields ->> 'placement', p_fields ->> 'image_path', nullif(p_fields ->> 'link', ''),
            nullif(p_fields ->> 'area', ''), (p_fields ->> 'starts_on')::date, (p_fields ->> 'ends_on')::date,
            coalesce((p_fields ->> 'active')::boolean, true), coalesce((p_fields ->> 'sort')::int, 0))
    returning * into v;
    perform private.audit(me.id, 'promosi', v.code, null, v.placement || case when v.active then ' aktif' else ' nonaktif' end, 'Promosi dibuat: ' || v.title);
    return v;
  end if;
  select * into old from public.promotions where id = p_id for update;
  if not found then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  update public.promotions set
    title = coalesce(p_fields ->> 'title', title), placement = coalesce(p_fields ->> 'placement', placement),
    image_path = coalesce(p_fields ->> 'image_path', image_path),
    link = case when p_fields ? 'link' then nullif(p_fields ->> 'link', '') else link end,
    area = case when p_fields ? 'area' then nullif(p_fields ->> 'area', '') else area end,
    starts_on = case when p_fields ? 'starts_on' then (p_fields ->> 'starts_on')::date else starts_on end,
    ends_on = case when p_fields ? 'ends_on' then (p_fields ->> 'ends_on')::date else ends_on end,
    active = coalesce((p_fields ->> 'active')::boolean, active), sort = coalesce((p_fields ->> 'sort')::int, sort),
    updated_at = now()
  where id = p_id returning * into v;
  perform private.audit(me.id, 'promosi', v.code,
    old.placement || case when old.active then ' aktif' else ' nonaktif' end,
    v.placement || case when v.active then ' aktif' else ' nonaktif' end, 'Promosi diubah: ' || v.title);
  return v;
end $$;

-- ── Bucket media (publik baca, hanya admin konten unggah) ─────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 2 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and private.is_admin('konten') and (storage.foldername(name))[1] in ('promo', 'konten', 'apresiasi'));

-- ── Hak akses ────────────────────────────────────────────────────────────

revoke insert, update, delete, truncate on public.support_tickets, public.promotions from anon, authenticated;
revoke all on public.support_tickets, public.promotions from anon;
revoke execute on function public.support_create_ticket(uuid, text, text, text, text) from public, anon;
revoke execute on function public.admin_reply_ticket(bigint, text, text) from public, anon;
revoke execute on function public.admin_save_promotion(bigint, jsonb) from public, anon;
