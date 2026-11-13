-- Lampiran foto opsional pada laporan kendala (penerima, pemberi, kurir).
-- Bucket privat: hanya pelapor dan admin ops yang bisa membuka (tautan sementara).

alter table public.issues add column photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('issue-photos', 'issue-photos', false, 2 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Konvensi path: <auth.uid()>/<nama berkas>.
create policy issue_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'issue-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy issue_photos_read on storage.objects for select to authenticated
  using (bucket_id = 'issue-photos' and ((storage.foldername(name))[1] = auth.uid()::text or private.is_admin('ops')));

-- Tanda tangan berubah (parameter baru), jadi fungsi lama dihapus lalu dibuat ulang; isi selain foto sama.
drop function public.issues_report(uuid, bigint, text, text);
create function public.issues_report(p_client_id uuid, p_transfer_id bigint, p_category text, p_description text, p_photo_path text default null)
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
  if p_photo_path is not null and split_part(p_photo_path, '/', 1) <> auth.uid()::text then
    raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001', detail = 'photo_path';
  end if;
  select * into t from public.transfers where id = p_transfer_id;
  insert into public.issues (transfer_id, reporter_id, category, description, client_id, photo_path)
  values (p_transfer_id, me.id, trim(p_category), trim(p_description), p_client_id, p_photo_path)
  returning * into v;
  insert into public.issue_events (issue_id, label, actor_id, note) values (v.id, 'Laporan dikirim', me.id, v.category);
  perform private.add_event(t.id, 'Kendala dilaporkan', me.id, v.category);
  -- Pihak lain dalam penyaluran ikut tahu ada kendala.
  perform private.notify(x, 'Kegiatan', 'Kendala dilaporkan', t.code || ': ' || v.category, '/aktivitas/' || t.code, 'Lihat penyaluran')
  from unnest(array[t.donor_id, t.recipient_id]) as x where x <> me.id;
  perform private.notify_admins('ops', 'Laporan kendala baru', t.code || ': ' || v.category, '/admin/kendala/' || v.code);
  return v;
end $$;
revoke execute on function public.issues_report(uuid, bigint, text, text, text) from public, anon;
grant execute on function public.issues_report(uuid, bigint, text, text, text) to authenticated;
