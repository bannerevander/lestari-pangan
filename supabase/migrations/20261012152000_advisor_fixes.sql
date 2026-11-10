-- Perbaikan dari Supabase advisor setelah migrasi identity dan donation_fulfillment.

-- search_path tetap untuk semua fungsi helper.
alter function private.forbid_change() set search_path = '';
alter function private.qty(numeric) set search_path = '';

-- Fungsi event trigger bawaan proyek ikut ter-grant oleh "grant ... on all functions"; bukan RPC.
-- Default privileges Supabase sudah memberi execute ke authenticated untuk fungsi baru,
-- jadi migrasi berikutnya cukup mencabut dari public/anon tanpa grant massal.
revoke execute on function public.rls_auto_enable() from authenticated;

-- Satu kebijakan baca kontak, bukan dua (multiple_permissive_policies).
drop policy contacts_read_own on public.profile_contacts;
drop policy contacts_read_party on public.profile_contacts;
create policy contacts_read on public.profile_contacts for select to authenticated
  using (profile_id = private.my_id() or private.is_admin() or private.can_see_contact(profile_id));

-- Index untuk foreign key yang dipakai join/RLS.
create index on public.transfers (offer_id);
create index on public.offers (record_id);
create index on public.food_records (source_transfer_id);
