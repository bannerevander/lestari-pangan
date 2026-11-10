-- Modul engagement: konten, challenge, reward, apresiasi (architecture.md §9).
-- Admin konten mengelola konten/challenge/paket reward/materi apresiasi; admin ops memverifikasi peserta dan klaim.

-- ── Tabel ────────────────────────────────────────────────────────────────

create table public.contents (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), -- dipakai rute /tips/:slug dan /resep/:slug
  kind text not null check (kind in ('Tips', 'Resep')),
  title text not null check (length(trim(title)) between 3 and 160),
  category text not null,
  summary text not null default '',
  body jsonb not null default '[]'::jsonb, -- paragraf (Tips) atau bahan + langkah (Resep)
  minutes integer check (minutes > 0),
  photo_path text,
  author text not null default 'Tim Edukasi',
  version integer not null default 1,
  status text not null default 'Draf' check (status in ('Draf', 'Menunggu review', 'Terbit')),
  reviewed_by bigint references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.contents (kind, status);

create table public.saved_contents (
  profile_id bigint not null references public.profiles (id),
  content_id bigint not null references public.contents (id),
  created_at timestamptz not null default now(),
  primary key (profile_id, content_id)
);

create table public.challenges (
  id bigint generated always as identity primary key,
  code text generated always as ('CHL-' || id) stored,
  title text not null check (length(trim(title)) between 3 and 160),
  description text not null default '',
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  roles text[] not null check (cardinality(roles) > 0 and roles <@ array['pemberi', 'penerima']),
  metric text not null check (metric in ('catat_pangan', 'penawaran_alergen', 'laporan_distribusi_24j', 'penyaluran_selesai')),
  target_count integer not null check (target_count > 0),
  status text not null default 'Draf' check (status in ('Draf', 'Aktif', 'Arsip')),
  created_at timestamptz not null default now()
);

create table public.challenge_participants (
  id bigint generated always as identity primary key,
  code text generated always as ('CHK-' || id) stored,
  challenge_id bigint not null references public.challenges (id),
  profile_id bigint not null references public.profiles (id),
  status text not null default 'Berjalan' check (status in ('Berjalan', 'Menunggu verifikasi', 'Lolos', 'Tidak lolos')),
  reason text,
  verified_by bigint references public.profiles (id),
  verified_at timestamptz,
  joined_at timestamptz not null default now(),
  unique (challenge_id, profile_id)
);
create index on public.challenge_participants (profile_id);

create table public.reward_packs (
  id bigint generated always as identity primary key,
  code text generated always as ('RWD-' || id) stored,
  title text not null,
  detail text not null default '',
  sponsor text not null,
  quota integer not null check (quota >= 0),
  claimed integer not null default 0 check (claimed >= 0),
  eligible_roles text[] not null check (cardinality(eligible_roles) > 0 and eligible_roles <@ array['pemberi', 'penerima']),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (claimed <= quota) -- stok tidak bisa negatif (AT-07)
);

create table public.reward_claims (
  id bigint generated always as identity primary key,
  code text generated always as ('CLM-' || id) stored,
  participant_id bigint not null references public.challenge_participants (id),
  pack_id bigint not null references public.reward_packs (id),
  status text not null default 'Diajukan' check (status in ('Diajukan', 'Siap disalurkan', 'Diserahkan', 'Ditolak')),
  reason text,
  created_at timestamptz not null default now()
);
-- Satu hak klaim per challenge yang lolos; klaim yang ditolak boleh diajukan ulang.
create unique index reward_claims_one_active on public.reward_claims (participant_id) where status <> 'Ditolak';
create index on public.reward_claims (pack_id);

create table public.appreciation_materials (
  id bigint generated always as identity primary key,
  profile_id bigint not null references public.profiles (id),
  version integer not null,
  caption text not null,
  image_path text,
  status text not null default 'Draf' check (status in ('Draf', 'Disetujui', 'Revisi diminta')),
  note text,
  approved_at timestamptz,
  created_by bigint references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (profile_id, version)
);

-- ── Progres challenge: dihitung dari kegiatan, tidak disimpan ─────────────

create function private.challenge_progress(p_participant bigint) returns integer
language sql stable security definer set search_path = '' as $$
  select case c.metric
    -- Hari berbeda dengan catatan manual (catatan otomatis dari penerimaan tidak dihitung).
    when 'catat_pangan' then (
      select count(distinct (f.created_at at time zone 'Asia/Jakarta')::date)::int from public.food_records f
      where f.owner_id = p.profile_id and f.source_transfer_id is null
        and (f.created_at at time zone 'Asia/Jakarta')::date between c.period_start and c.period_end)
    when 'penawaran_alergen' then (
      select count(*)::int from public.offers o
      where o.donor_id = p.profile_id and o.allergens is not null
        and (o.created_at at time zone 'Asia/Jakarta')::date between c.period_start and c.period_end)
    when 'laporan_distribusi_24j' then (
      select count(*)::int from public.transfers t
      where t.recipient_id = p.profile_id and t.distribution_reported_at is not null
        and (t.created_at at time zone 'Asia/Jakarta')::date between c.period_start and c.period_end
        and t.distribution_reported_at <= (
          select min(e.at) from public.transfer_events e
          where e.transfer_id = t.id and e.label in ('Diterima penuh', 'Diterima sebagian')) + interval '24 hours')
    when 'penyaluran_selesai' then (
      select count(*)::int from public.transfers t
      where p.profile_id in (t.donor_id, t.recipient_id) and t.received > 0
        and (t.created_at at time zone 'Asia/Jakarta')::date between c.period_start and c.period_end)
  end
  from public.challenge_participants p join public.challenges c on c.id = p.challenge_id
  where p.id = p_participant
$$;
grant execute on function private.challenge_progress(bigint) to authenticated;

create view public.v_challenge_progress with (security_invoker = true) as
select p.id as participant_id, p.code, p.challenge_id, p.profile_id, p.status, c.title, c.metric, c.target_count,
       c.period_start, c.period_end, private.challenge_progress(p.id) as progress
from public.challenge_participants p
join public.challenges c on c.id = p.challenge_id;

-- ── RLS ──────────────────────────────────────────────────────────────────

alter table public.contents enable row level security;
alter table public.saved_contents enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.reward_packs enable row level security;
alter table public.reward_claims enable row level security;
alter table public.appreciation_materials enable row level security;

create policy contents_read on public.contents for select to authenticated
  using (status = 'Terbit' or private.is_admin());
create policy saved_contents_read on public.saved_contents for select to authenticated
  using (profile_id = private.my_id());
create policy challenges_read on public.challenges for select to authenticated
  using (status <> 'Draf' or private.is_admin());
create policy participants_read on public.challenge_participants for select to authenticated
  using (profile_id = private.my_id() or private.is_admin());
create policy reward_packs_read on public.reward_packs for select to authenticated
  using (active or private.is_admin());
create policy reward_claims_read on public.reward_claims for select to authenticated
  using (exists (select 1 from public.challenge_participants p where p.id = participant_id));
create policy appreciation_read on public.appreciation_materials for select to authenticated
  using (profile_id = private.my_id() or private.is_admin());

-- ── RPC pengguna ─────────────────────────────────────────────────────────

-- Mengembalikan true bila sekarang tersimpan.
create function public.engagement_toggle_saved(p_content_id bigint) returns boolean
language plpgsql security definer set search_path = '' as $$
declare me public.profiles := private.me();
begin
  delete from public.saved_contents where profile_id = me.id and content_id = p_content_id;
  if found then return false; end if;
  if not exists (select 1 from public.contents where id = p_content_id and status = 'Terbit') then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001';
  end if;
  insert into public.saved_contents (profile_id, content_id) values (me.id, p_content_id);
  return true;
end $$;

create function public.engagement_join_challenge(p_challenge_id bigint) returns public.challenge_participants
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.me();
  c public.challenges;
  v public.challenge_participants;
begin
  select * into v from public.challenge_participants where challenge_id = p_challenge_id and profile_id = me.id;
  if found then return v; end if;
  select * into c from public.challenges where id = p_challenge_id;
  if not found or c.status <> 'Aktif' or (now() at time zone 'Asia/Jakarta')::date > c.period_end then
    raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001';
  end if;
  if not (me.role = any (c.roles)) then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  insert into public.challenge_participants (challenge_id, profile_id) values (c.id, me.id) returning * into v;
  return v;
end $$;

create function public.engagement_finish_challenge(p_participant_id bigint) returns public.challenge_participants
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.me();
  v public.challenge_participants;
  c public.challenges;
begin
  select * into v from public.challenge_participants where id = p_participant_id and profile_id = me.id for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if v.status = 'Menunggu verifikasi' then return v; end if;
  if v.status <> 'Berjalan' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  select * into c from public.challenges where id = v.challenge_id;
  if private.challenge_progress(v.id) < c.target_count then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'Target belum tercapai';
  end if;
  update public.challenge_participants set status = 'Menunggu verifikasi' where id = v.id returning * into v;
  perform private.notify_admins('ops', 'Challenge menunggu verifikasi', me.org_name || ': ' || c.title, '/admin/challenge/' || c.code);
  return v;
end $$;

create function public.engagement_claim_reward(p_participant_id bigint, p_pack_id bigint) returns public.reward_claims
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.me();
  p public.challenge_participants;
  pack public.reward_packs;
  v public.reward_claims;
begin
  select * into p from public.challenge_participants where id = p_participant_id and profile_id = me.id for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  -- Challenge selesai tetapi belum lolos verifikasi belum boleh klaim (AT-07).
  if p.status <> 'Lolos' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  select * into v from public.reward_claims where participant_id = p.id and status <> 'Ditolak';
  if found then return v; end if; -- satu hak klaim tidak dipakai dua kali
  update public.reward_packs set claimed = claimed + 1
   where id = p_pack_id and active and me.role = any (eligible_roles) and claimed < quota
  returning * into pack;
  if not found then raise exception 'KUOTA_HABIS' using errcode = 'P0001'; end if;
  insert into public.reward_claims (participant_id, pack_id) values (p.id, pack.id) returning * into v;
  perform private.notify_admins('ops', 'Klaim reward baru', me.org_name || ': ' || pack.title, '/admin/reward/' || v.code);
  return v;
end $$;

create function public.engagement_respond_appreciation(p_material_id bigint, p_decision text, p_note text default null)
returns public.appreciation_materials
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.me();
  v public.appreciation_materials;
begin
  select * into v from public.appreciation_materials where id = p_material_id and profile_id = me.id for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if p_decision not in ('Disetujui', 'Revisi diminta') then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  if v.status = p_decision then return v; end if;
  -- Hanya versi terbaru yang bisa disetujui; versi lama tidak menyetujui versi baru (AT-08).
  if v.status <> 'Draf' or v.version <> (select max(version) from public.appreciation_materials where profile_id = me.id) then
    raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001';
  end if;
  update public.appreciation_materials
     set status = p_decision, note = p_note, approved_at = case when p_decision = 'Disetujui' then now() end
   where id = v.id returning * into v;
  perform private.notify_admins('konten', 'Tanggapan materi apresiasi', me.org_name || ': ' || p_decision, '/admin/apresiasi');
  return v;
end $$;

-- ── RPC admin ────────────────────────────────────────────────────────────

-- Simpan konten baru (p_id null) atau ubah; setiap perubahan menaikkan versi dan menurunkan status sampai ditinjau lagi.
create function public.admin_save_content(p_id bigint, p_fields jsonb, p_submit boolean default false) returns public.contents
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('konten');
  old public.contents;
  v public.contents;
  new_status text := case when p_submit then 'Menunggu review' else 'Draf' end;
begin
  if p_id is null then
    insert into public.contents (slug, kind, title, category, summary, body, minutes, photo_path, author, status)
    values (p_fields ->> 'slug', p_fields ->> 'kind', p_fields ->> 'title', p_fields ->> 'category',
            coalesce(p_fields ->> 'summary', ''), coalesce(p_fields -> 'body', '[]'::jsonb), (p_fields ->> 'minutes')::int,
            p_fields ->> 'photo_path', coalesce(p_fields ->> 'author', 'Tim Edukasi'), new_status)
    returning * into v;
    perform private.audit(me.id, 'konten', v.slug, null, v.status, 'Konten dibuat');
    return v;
  end if;
  select * into old from public.contents where id = p_id for update;
  if not found then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  update public.contents set
    slug = coalesce(p_fields ->> 'slug', slug), kind = coalesce(p_fields ->> 'kind', kind),
    title = coalesce(p_fields ->> 'title', title), category = coalesce(p_fields ->> 'category', category),
    summary = coalesce(p_fields ->> 'summary', summary), body = coalesce(p_fields -> 'body', body),
    minutes = coalesce((p_fields ->> 'minutes')::int, minutes), photo_path = coalesce(p_fields ->> 'photo_path', photo_path),
    author = coalesce(p_fields ->> 'author', author),
    version = version + 1, status = new_status, reviewed_by = null, reviewed_at = null, updated_at = now()
  where id = p_id returning * into v;
  perform private.audit(me.id, 'konten', v.slug, old.status || ' v' || old.version, v.status || ' v' || v.version, 'Konten diubah');
  return v;
end $$;

create function public.admin_publish_content(p_id bigint) returns public.contents
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('konten');
  v public.contents;
begin
  select * into v from public.contents where id = p_id for update;
  if not found then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  if v.status = 'Terbit' then return v; end if;
  -- Konten terbit hanya setelah ditinjau (FR-TP-02).
  if v.status <> 'Menunggu review' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  update public.contents set status = 'Terbit', reviewed_by = me.id, reviewed_at = now() where id = p_id returning * into v;
  perform private.audit(me.id, 'konten', v.slug, 'Menunggu review', 'Terbit', 'Konten ditinjau dan diterbitkan v' || v.version);
  return v;
end $$;

create function public.admin_save_challenge(p_id bigint, p_fields jsonb) returns public.challenges
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('konten');
  old public.challenges;
  v public.challenges;
  v_roles text[] := (select array_agg(x) from jsonb_array_elements_text(p_fields -> 'roles') x);
begin
  if p_id is null then
    insert into public.challenges (title, description, period_start, period_end, roles, metric, target_count, status)
    values (p_fields ->> 'title', coalesce(p_fields ->> 'description', ''), (p_fields ->> 'period_start')::date,
            (p_fields ->> 'period_end')::date, v_roles, p_fields ->> 'metric', (p_fields ->> 'target_count')::int,
            coalesce(p_fields ->> 'status', 'Draf'))
    returning * into v;
    perform private.audit(me.id, 'challenge', v.code, null, v.status, 'Challenge dibuat');
    return v;
  end if;
  select * into old from public.challenges where id = p_id for update;
  if not found then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  -- Aturan tidak diubah setelah ada peserta, agar adil (FR-EC-03); status dan teks tetap boleh.
  if (p_fields ?| array['metric', 'target_count', 'period_start', 'period_end', 'roles'])
     and exists (select 1 from public.challenge_participants where challenge_id = p_id) then
    raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001', detail = 'Aturan terkunci setelah ada peserta';
  end if;
  update public.challenges set
    title = coalesce(p_fields ->> 'title', title), description = coalesce(p_fields ->> 'description', description),
    period_start = coalesce((p_fields ->> 'period_start')::date, period_start),
    period_end = coalesce((p_fields ->> 'period_end')::date, period_end),
    roles = coalesce(v_roles, roles), metric = coalesce(p_fields ->> 'metric', metric),
    target_count = coalesce((p_fields ->> 'target_count')::int, target_count), status = coalesce(p_fields ->> 'status', status)
  where id = p_id returning * into v;
  perform private.audit(me.id, 'challenge', v.code, old.status, v.status, 'Challenge diubah');
  return v;
end $$;

create function public.admin_save_reward_pack(p_id bigint, p_fields jsonb) returns public.reward_packs
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('konten');
  old public.reward_packs;
  v public.reward_packs;
  v_roles text[] := (select array_agg(x) from jsonb_array_elements_text(p_fields -> 'eligible_roles') x);
begin
  if p_id is null then
    insert into public.reward_packs (title, detail, sponsor, quota, eligible_roles, active)
    values (p_fields ->> 'title', coalesce(p_fields ->> 'detail', ''), p_fields ->> 'sponsor', (p_fields ->> 'quota')::int,
            v_roles, coalesce((p_fields ->> 'active')::boolean, true))
    returning * into v;
    perform private.audit(me.id, 'reward', v.code, null, 'kuota ' || v.quota, 'Paket reward dibuat');
    return v;
  end if;
  select * into old from public.reward_packs where id = p_id for update;
  if not found then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  update public.reward_packs set
    title = coalesce(p_fields ->> 'title', title), detail = coalesce(p_fields ->> 'detail', detail),
    sponsor = coalesce(p_fields ->> 'sponsor', sponsor), quota = coalesce((p_fields ->> 'quota')::int, quota),
    eligible_roles = coalesce(v_roles, eligible_roles), active = coalesce((p_fields ->> 'active')::boolean, active)
  where id = p_id returning * into v;
  perform private.audit(me.id, 'reward', v.code, 'kuota ' || old.quota, 'kuota ' || v.quota, 'Paket reward diubah');
  return v;
end $$;

create function public.admin_decide_participant(p_id bigint, p_decision text, p_reason text) returns public.challenge_participants
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
     set status = p_decision, reason = p_reason, verified_by = me.id, verified_at = now()
   where id = p_id returning * into v;
  perform private.audit(me.id, 'peserta_challenge', v.code, 'Menunggu verifikasi', p_decision, p_reason);
  perform private.notify(v.profile_id, 'Reward',
    case when p_decision = 'Lolos' then 'Challenge terverifikasi' else 'Challenge belum lolos' end, p_reason, '/reward', 'Lihat reward');
  return v;
end $$;

create function public.admin_update_claim(p_id bigint, p_status text, p_reason text) returns public.reward_claims
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('ops');
  old public.reward_claims;
  v public.reward_claims;
  owner_id bigint;
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
    update public.reward_packs set claimed = claimed - 1 where id = v.pack_id; -- kuota kembali
  end if;
  select profile_id into owner_id from public.challenge_participants where id = v.participant_id;
  perform private.audit(me.id, 'klaim_reward', v.code, old.status, v.status, p_reason);
  perform private.notify(owner_id, 'Reward', 'Status klaim: ' || p_status, p_reason, '/reward', 'Lihat reward');
  return v;
end $$;

create function public.admin_propose_appreciation(p_profile_id bigint, p_caption text, p_image_path text default null)
returns public.appreciation_materials
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('konten');
  v public.appreciation_materials;
begin
  if coalesce(trim(p_caption), '') = '' then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'caption'; end if;
  perform 1 from public.profiles where id = p_profile_id for update; -- urutkan nomor versi per mitra
  insert into public.appreciation_materials (profile_id, version, caption, image_path, created_by)
  values (p_profile_id,
          coalesce((select max(version) from public.appreciation_materials where profile_id = p_profile_id), 0) + 1,
          trim(p_caption), p_image_path, me.id)
  returning * into v;
  perform private.audit(me.id, 'apresiasi', 'USR-' || p_profile_id, null, 'Draf v' || v.version, 'Materi apresiasi diajukan ke mitra');
  perform private.notify(p_profile_id, 'Reward', 'Materi apresiasi perlu persetujuan', 'Tinjau caption dan gambar sebelum terbit.', '/reward/apresiasi', 'Tinjau materi');
  return v;
end $$;

revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon;
