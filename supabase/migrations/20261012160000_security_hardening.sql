-- Pengamanan tambahan sebelum front end disambungkan (docs/SECURITY.md).

-- 1. Kolom privat profil tidak terbaca pengguna lain: user_id (UUID auth) dan prefs.
--    Profil sendiri dibaca lengkap lewat identity_me().
revoke select on public.profiles from authenticated;
grant select (id, code, role, admin_scope, org_name, org_type, area, hours, capacity, storage, verification_status, created_at)
  on public.profiles to authenticated;

create function public.identity_me() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  p public.profiles;
  c public.profile_contacts;
begin
  select * into p from public.profiles where user_id = auth.uid();
  if not found then return null; end if; -- login berhasil tetapi onboarding belum selesai
  select * into c from public.profile_contacts where profile_id = p.id;
  return to_jsonb(p) - 'user_id' || jsonb_build_object('contact', to_jsonb(c) - 'profile_id');
end $$;

-- 2. Batas ukuran dan jenis berkas di storage (ditegakkan server, bukan hanya di form).
update storage.buckets set file_size_limit = 2 * 1024 * 1024, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'offer-photos';
update storage.buckets set file_size_limit = 5 * 1024 * 1024, allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png']
 where id = 'verification-docs';

revoke execute on function public.identity_me() from public, anon;
