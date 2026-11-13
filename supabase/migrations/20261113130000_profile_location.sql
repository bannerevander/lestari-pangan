-- Titik peta lokasi usaha/titik temu (dipilih dari peta atau GPS), privat seperti alamat lengkap:
-- hanya pemilik, admin, dan pihak penyaluran yang bisa membaca (RLS profile_contacts yang sudah ada).
-- Dipakai untuk tautan "Buka di Google Maps" bagi penerima dan driver ojek online.

alter table public.profile_contacts
  add column lat double precision check (lat between -90 and 90),
  add column lng double precision check (lng between -180 and 180),
  add constraint profile_contacts_latlng_pair check ((lat is null) = (lng is null));

-- Isi sama dengan versi sebelumnya, ditambah lat/lng (kirim null untuk menghapus titik).
create or replace function public.identity_save_profile(p_fields jsonb)
returns public.profiles
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
    address = coalesce(p_fields ->> 'address', address),
    lat     = case when p_fields ? 'lat' then (p_fields ->> 'lat')::double precision else lat end,
    lng     = case when p_fields ? 'lng' then (p_fields ->> 'lng')::double precision else lng end
  where profile_id = v.id;
  return v;
end $$;
