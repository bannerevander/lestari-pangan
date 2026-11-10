-- Lingkup admin `semua`: satu akun staf memegang ops, keuangan, dan konten sekaligus (tim kecil/solo).
-- Lingkup tunggal tetap didukung; pemisahan tugas bisa dipakai lagi dengan membuat akun per lingkup.

alter table public.profiles drop constraint profiles_admin_scope_check;
alter table public.profiles add constraint profiles_admin_scope_check
  check (admin_scope in ('ops', 'keuangan', 'konten', 'semua'));

create or replace function private.is_admin(p_scope text default null) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin' and (p_scope is null or admin_scope in (p_scope, 'semua'))
  )
$$;

create or replace function private.require_admin(p_scope text) returns public.profiles
language plpgsql stable security definer set search_path = '' as $$
declare v public.profiles := private.me();
begin
  if v.role <> 'admin' or v.admin_scope not in (p_scope, 'semua') then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  return v;
end $$;

create or replace function private.notify_admins(p_scope text, p_title text, p_body text, p_link text default null)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (profile_id, kind, title, body, link)
  select id, 'Sistem', p_title, p_body, p_link from public.profiles where role = 'admin' and admin_scope in (p_scope, 'semua')
$$;
revoke execute on function private.notify_admins(text, text, text, text) from public;
