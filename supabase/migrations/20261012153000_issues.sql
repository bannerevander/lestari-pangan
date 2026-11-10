-- Modul issues (architecture.md §9). Admin ops menangani laporan; setiap keputusan admin masuk audit_log.

create table public.issues (
  id bigint generated always as identity primary key,
  code text generated always as ('ISS-' || id) stored,
  transfer_id bigint not null references public.transfers (id),
  reporter_id bigint not null references public.profiles (id),
  category text not null check (length(trim(category)) between 2 and 80), -- daftar berbeda per layar (penyaluran, kurir)
  description text not null check (length(trim(description)) between 5 and 2000),
  priority text not null default 'Sedang' check (priority in ('Tinggi', 'Sedang', 'Rendah')),
  status text not null default 'Dikirim' check (status in ('Dikirim', 'Sedang ditinjau', 'Selesai', 'Keberatan diajukan')),
  resolution text,
  client_id uuid unique,
  created_at timestamptz not null default now()
);
create index on public.issues (transfer_id);
create index on public.issues (reporter_id);
create index on public.issues (status);

create table public.issue_events (
  id bigint generated always as identity primary key,
  issue_id bigint not null references public.issues (id),
  label text not null,
  actor_id bigint references public.profiles (id),
  note text,
  at timestamptz not null default now()
);
create index on public.issue_events (issue_id, at);

create trigger issue_events_append_only before update or delete on public.issue_events
  for each row execute function private.forbid_change();

create function private.notify_admins(p_scope text, p_title text, p_body text, p_link text default null)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (profile_id, kind, title, body, link)
  select id, 'Sistem', p_title, p_body, p_link from public.profiles where role = 'admin' and admin_scope = p_scope
$$;

-- ── RLS ──────────────────────────────────────────────────────────────────

alter table public.issues enable row level security;
alter table public.issue_events enable row level security;

-- Kedua pihak penyaluran dan kurir melihat kendala (AT-04).
create policy issues_read on public.issues for select to authenticated
  using (private.is_transfer_party(transfer_id) or private.is_admin());
create policy issue_events_read on public.issue_events for select to authenticated
  using (exists (select 1 from public.issues i where i.id = issue_id));

-- ── RPC ──────────────────────────────────────────────────────────────────

create function public.issues_report(p_client_id uuid, p_transfer_id bigint, p_category text, p_description text)
returns public.issues
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.me();
  t public.transfers;
  v public.issues;
begin
  select * into v from public.issues where client_id = p_client_id;
  if found then
    if v.reporter_id <> me.id then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
    return v;
  end if;
  if not private.is_transfer_party(p_transfer_id) then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if coalesce(trim(p_category), '') = '' or length(trim(coalesce(p_description, ''))) < 5 then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001';
  end if;
  select * into t from public.transfers where id = p_transfer_id;
  insert into public.issues (transfer_id, reporter_id, category, description, client_id)
  values (p_transfer_id, me.id, trim(p_category), trim(p_description), p_client_id)
  returning * into v;
  insert into public.issue_events (issue_id, label, actor_id, note) values (v.id, 'Laporan dikirim', me.id, v.category);
  perform private.add_event(t.id, 'Kendala dilaporkan', me.id, v.category);
  -- Pihak lain dalam penyaluran ikut tahu ada kendala.
  perform private.notify(x, 'Kegiatan', 'Kendala dilaporkan', t.code || ': ' || v.category, '/aktivitas/' || t.code, 'Lihat penyaluran')
  from unnest(array[t.donor_id, t.recipient_id]) as x where x <> me.id;
  perform private.notify_admins('ops', 'Laporan kendala baru', t.code || ': ' || v.category, '/admin/kendala/' || v.code);
  return v;
end $$;

create function public.issues_object(p_id bigint, p_note text) returns public.issues
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.me();
  v public.issues;
begin
  select * into v from public.issues where id = p_id and reporter_id = me.id for update;
  if not found then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  if v.status = 'Keberatan diajukan' then return v; end if;
  if v.status <> 'Selesai' then raise exception 'STATUS_TIDAK_SESUAI' using errcode = 'P0001'; end if;
  if coalesce(trim(p_note), '') = '' then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'note'; end if;
  update public.issues set status = 'Keberatan diajukan' where id = p_id returning * into v;
  insert into public.issue_events (issue_id, label, actor_id, note) values (v.id, 'Keberatan diajukan', me.id, p_note);
  perform private.notify_admins('ops', 'Keberatan atas penyelesaian', v.code, '/admin/kendala/' || v.code);
  return v;
end $$;

create function public.admin_update_issue(p_id bigint, p_status text, p_resolution text default null, p_priority text default null)
returns public.issues
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('ops');
  old public.issues;
  v public.issues;
begin
  select * into old from public.issues where id = p_id for update;
  if not found then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  if p_status not in ('Sedang ditinjau', 'Selesai') then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'status'; end if;
  if p_status = 'Selesai' and coalesce(trim(p_resolution), '') = '' then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'resolution';
  end if;
  if old.status = p_status and p_priority is null then return old; end if;
  update public.issues
     set status = p_status, resolution = coalesce(p_resolution, resolution), priority = coalesce(p_priority, priority)
   where id = p_id returning * into v;
  insert into public.issue_events (issue_id, label, actor_id, note)
  values (v.id, case when p_status = 'Selesai' then 'Selesai' else 'Sedang ditinjau' end, me.id, p_resolution);
  perform private.audit(me.id, 'kendala', v.code, old.status, v.status, coalesce(p_resolution, 'Peninjauan dimulai'));
  perform private.notify(v.reporter_id, 'Kegiatan',
    case when p_status = 'Selesai' then 'Laporan kendala selesai' else 'Laporan kendala ditinjau' end,
    coalesce(p_resolution, v.code), '/aktivitas', null);
  return v;
end $$;

revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon;
revoke execute on function private.notify_admins(text, text, text, text) from public;
