-- Tes tiket bantuan/penghapusan data dan promosi (migrasi 20261013110000). Jalankan utuh; semua data di-rollback.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
create temp table r (n serial, line text);
insert into r (line) select plan(10);

create function pg_temp.login(p_uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true)
$$;

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000a0a1', 'u1@test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000a0a2', 'u2@test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000a0d1', 'ops@test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000a0f1', 'konten@test.invalid', 'authenticated', 'authenticated');
insert into profiles (user_id, role, admin_scope, org_name, org_type, area) values
  ('00000000-0000-0000-0000-00000000a0d1', 'admin', 'ops', 'Uji Admin Ops', 'Admin', 'Kota Bandung'),
  ('00000000-0000-0000-0000-00000000a0f1', 'admin', 'konten', 'Uji Admin Konten', 'Admin', 'Kota Bandung');
select pg_temp.login('00000000-0000-0000-0000-00000000a0a1');
select identity_complete_onboarding('pemberi', 'Uji Warung 1', 'UMKM', 'Kota Bandung', 'Rina', '0812', 'Jl. A');
select pg_temp.login('00000000-0000-0000-0000-00000000a0a2');
select identity_complete_onboarding('penerima', 'Uji Panti 2', 'Panti', 'Kota Bandung', 'Budi', '0813', 'Jl. B');

-- Tiket
select pg_temp.login('00000000-0000-0000-0000-00000000a0a1');
insert into r (line) select throws_ok($$ select support_create_ticket('a1a10000-0000-0000-0000-000000000001', 'Bantuan', 'Lainnya', 'pendek') $$,
  'P0001', 'DATA_TIDAK_VALID', 'Pesan bantuan minimal 10 karakter');
select support_create_ticket('a1a10000-0000-0000-0000-000000000002', 'Bantuan', 'Status verifikasi akun', 'Verifikasi saya belum diproses');
select support_create_ticket('a1a10000-0000-0000-0000-000000000002', 'Bantuan', 'Status verifikasi akun', 'Verifikasi saya belum diproses');
insert into r (line) select is((select count(*)::int from support_tickets t join profiles p on p.id = t.profile_id where p.org_name = 'Uji Warung 1'), 1,
  'Kiriman ulang dengan client_id sama tidak menggandakan tiket');
insert into r (line) select ok(exists (select 1 from notifications n join profiles p on p.id = n.profile_id
  where p.org_name = 'Uji Admin Ops' and n.title = 'Tiket bantuan baru'), 'Admin ops diberi tahu tiket baru');

set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-00000000a0a2');
select set_config('t.other', (select count(*) from support_tickets)::text, true);
reset role;
insert into r (line) select is(current_setting('t.other'), '0', 'Pengguna lain tidak melihat tiket orang lain');

select pg_temp.login('00000000-0000-0000-0000-00000000a0a1');
insert into r (line) select throws_ok($$ select admin_reply_ticket((select t.id from support_tickets t join profiles p on p.id = t.profile_id where p.org_name = 'Uji Warung 1'), 'Selesai', 'x') $$,
  'P0001', 'TIDAK_BERHAK', 'Pengguna biasa tidak bisa membalas tiket');
select pg_temp.login('00000000-0000-0000-0000-00000000a0d1');
select admin_reply_ticket((select t.id from support_tickets t join profiles p on p.id = t.profile_id where p.org_name = 'Uji Warung 1'), 'Selesai', 'Berkas sudah kami periksa.');
insert into r (line) select ok(exists (select 1 from notifications n join profiles p on p.id = n.profile_id
  where p.org_name = 'Uji Warung 1' and n.body = 'Berkas sudah kami periksa.') and exists (select 1 from audit_log where action = 'tiket'),
  'Balasan admin sampai ke pengguna dan tercatat di audit');

-- Promosi
select pg_temp.login('00000000-0000-0000-0000-00000000a0d1');
insert into r (line) select throws_ok($$ select admin_save_promotion(null, '{"title":"Uji promo","placement":"beranda","image_path":"promo/a.jpg"}') $$,
  'P0001', 'TIDAK_BERHAK', 'Hanya admin konten yang mengelola promosi');
select pg_temp.login('00000000-0000-0000-0000-00000000a0f1');
insert into r (line) select throws_ok($$ select admin_save_promotion(null, '{"title":"Uji promo","placement":"beranda","image_path":"promo/a.jpg","link":"https://contoh.id"}') $$,
  '23514', null, 'Tautan promosi hanya rute di dalam aplikasi');
select admin_save_promotion(null, '{"title":"Uji promo aktif","placement":"beranda","image_path":"promo/a.jpg","link":"/dukung"}');
select admin_save_promotion(null, '{"title":"Uji promo lewat","placement":"beranda","image_path":"promo/b.jpg","starts_on":"2020-01-01","ends_on":"2020-01-31"}');
set local role authenticated;
select pg_temp.login('00000000-0000-0000-0000-00000000a0a2');
select set_config('t.promo', (select string_agg(title, ',') from promotions where title like 'Uji promo%'), true);
reset role;
insert into r (line) select is(current_setting('t.promo'), 'Uji promo aktif', 'Pengguna hanya melihat promosi aktif dalam periodenya');
insert into r (line) select ok(not has_table_privilege('authenticated', 'public.promotions', 'insert')
  and not has_table_privilege('authenticated', 'public.support_tickets', 'insert')
  and not has_function_privilege('anon', 'public.support_create_ticket(uuid,text,text,text,text)', 'execute'),
  'Hak akses tabel dan RPC modul baru');

insert into r (line) select * from finish();
select string_agg(line, E'\n' order by n) as tap from r;
rollback;
