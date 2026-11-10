-- Tes modul donation/fulfillment (architecture.md §9.8). Jalankan utuh; semua data di-rollback.
-- Hasil: satu baris per asersi pgTAP ("ok n - ..." / "not ok n - ...").
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
create temp table r (n serial, line text);
insert into r (line) select plan(23);

create function pg_temp.login(p_uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true)
$$;

-- Pengguna uji: A pemberi, B dan C penerima, D penerima tanpa penyaluran.
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000c', 'c@test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000d', 'd@test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000e', 'e@test.invalid', 'authenticated', 'authenticated');
insert into profiles (user_id, role, admin_scope, org_name, org_type, area) values
  ('00000000-0000-0000-0000-00000000000e', 'admin', 'ops', 'Admin Ops', 'Admin', 'Coblong');

select pg_temp.login('00000000-0000-0000-0000-00000000000a');
select identity_complete_onboarding('pemberi', 'Warung Uji', 'UMKM', 'Coblong', 'Rina', '0812', 'Jl. Uji 1');
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select identity_complete_onboarding('penerima', 'Komunitas B', 'Komunitas', 'Coblong', 'Dimas', '0813', 'Jl. Uji 2');
select pg_temp.login('00000000-0000-0000-0000-00000000000c');
select identity_complete_onboarding('penerima', 'Panti C', 'Panti', 'Coblong', 'Ahmad', '0814', 'Jl. Uji 3');
select pg_temp.login('00000000-0000-0000-0000-00000000000d');
select identity_complete_onboarding('penerima', 'Dapur D', 'Komunitas', 'Coblong', 'Sari', '0815', 'Jl. Uji 4');

-- Pemberi menawarkan 20 porsi; publikasi ulang dengan client_id sama tidak menggandakan.
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
select donation_publish_offer('aaaaaaaa-0000-0000-0000-000000000001', 'Nasi kotak', 'Makanan matang', 'porsi', 20,
  'Suhu ruang', 'Coblong', now() - interval '1 hour', now() + interval '5 hours', array['Ambil sendiri'], p_prepared_at => now() - interval '30 minutes');
select donation_publish_offer('aaaaaaaa-0000-0000-0000-000000000001', 'Nasi kotak', 'Makanan matang', 'porsi', 20,
  'Suhu ruang', 'Coblong', now() - interval '1 hour', now() + interval '5 hours', array['Ambil sendiri'], p_prepared_at => now() - interval '30 minutes');
insert into r (line) select is((select count(*) from offers)::int, 1, 'Publikasi ulang dengan client_id sama = satu penawaran');

-- B meminta 12, C meminta 10.
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select donation_submit_request('bbbbbbbb-0000-0000-0000-000000000001', (select id from offers limit 1), 12, 'Ambil sendiri', now() + interval '1 hour');
select pg_temp.login('00000000-0000-0000-0000-00000000000c');
select donation_submit_request('cccccccc-0000-0000-0000-000000000001', (select id from offers limit 1), 10, 'Ambil sendiri', now() + interval '1 hour');
insert into r (line) select throws_ok(
  $$ select donation_submit_request('cccccccc-0000-0000-0000-000000000002', (select id from offers limit 1), 1, 'Ambil sendiri', now() + interval '1 hour') $$,
  'P0001', 'STATUS_TIDAK_SESUAI', 'Satu permintaan aktif per penerima per penawaran');

-- AT-01: setujui 12 lalu 10 dari 20.
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
select donation_decide_request((select id from requests where client_id = 'bbbbbbbb-0000-0000-0000-000000000001'), 'approve');
insert into r (line) select throws_ok(
  $$ select donation_decide_request((select id from requests where client_id = 'cccccccc-0000-0000-0000-000000000001'), 'approve') $$,
  'P0001', 'STOK_TIDAK_CUKUP', 'AT-01: persetujuan kedua melebihi stok ditolak');
insert into r (line) select results_eq($$ select available, reserved from offers $$, $$ values (8.00::numeric(10,2), 12.00::numeric(10,2)) $$,
  'AT-01: tersedia 8, direservasi 12');
insert into r (line) select is((select status from requests where client_id = 'cccccccc-0000-0000-0000-000000000001'), 'Diajukan',
  'AT-01: permintaan yang gagal tetap Diajukan');
select donation_decide_request((select id from requests where client_id = 'bbbbbbbb-0000-0000-0000-000000000001'), 'approve');
insert into r (line) select is((select available from offers), 8.00::numeric(10,2), 'Persetujuan ulang tidak mengurangi stok lagi');
insert into r (line) select is((select count(*) from transfers)::int, 1, 'Satu penyaluran dibuat');
insert into r (line) select is((select count(*) from transfer_events)::int, 2, 'Timeline: diajukan + disetujui');
insert into r (line) select ok(exists (select 1 from notifications n join profiles p on p.id = n.profile_id
  where p.org_name = 'Komunitas B' and n.title = 'Permintaan disetujui'), 'Penerima mendapat notifikasi persetujuan');

-- AT-02: diserahkan 12, diterima 10.
select fulfillment_handover((select id from transfers limit 1), 12);
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select fulfillment_receive((select id from transfers limit 1), 10, '2 kemasan rusak');
insert into r (line) select results_eq($$ select status, received is null from transfers $$,
  $$ values ('Menunggu verifikasi'::text, true) $$, 'OD-03: penerimaan sebagian menunggu verifikasi staf, dampak belum dihitung');
select pg_temp.login('00000000-0000-0000-0000-00000000000e');
select admin_verify_receipt((select id from transfers limit 1), true, 'Foto kemasan rusak sesuai');
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
insert into r (line) select results_eq($$ select status, received, rejected from transfers $$,
  $$ values ('Diterima sebagian'::text, 10.00::numeric(10,2), 2.00::numeric(10,2)) $$, 'AT-02: diterima sebagian 10, ditolak 2');
select fulfillment_receive((select id from transfers limit 1), 12);
insert into r (line) select is((select received from transfers), 10.00::numeric(10,2), 'AT-02: konfirmasi ulang tidak mengubah jumlah');
insert into r (line) select is((select received from v_impact_recipient), 10.00::numeric(10,2), 'AT-02: dampak penerima = 10');
insert into r (line) select results_eq($$ select reserved, handed_over from offers $$, $$ values (0.00::numeric(10,2), 10.00::numeric(10,2)) $$,
  'Reservasi dilepas; diserahkan = diterima aktual');
insert into r (line) select is(
  (select sum(m.delta) from record_movements m join food_records f on f.id = m.record_id where f.source_transfer_id is not null),
  10.00::numeric, 'Catatan pangan penerima dibuat; saldo = jumlah pergerakan');

-- Laporan distribusi: total melebihi diterima ditolak, yang valid disimpan sekali.
insert into r (line) select throws_ok($$ select fulfillment_report_distribution((select id from transfers limit 1), 8, 3, 1) $$,
  'P0001', 'DATA_TIDAK_VALID', 'Distribusi melebihi jumlah diterima ditolak');
select fulfillment_report_distribution((select id from transfers limit 1), 6, 3, 0);
insert into r (line) select is((select distributed + used + wasted from transfers), 9.00::numeric(10,2), 'AT-06: sisa 1 boleh tidak dilaporkan habis');

-- Append-only.
insert into r (line) select throws_ok($$ update transfer_events set note = 'ubah' $$, 'P0001', 'APPEND_ONLY', 'Timeline tidak bisa diubah');

-- AT-03: penawaran lewat batas; permintaan C yang tertunda dibatalkan job.
update offers set pickup_start = now() - interval '3 hours', pickup_end = now() - interval '1 minute';
select private.job_expire_offers();
insert into r (line) select results_eq(
  $$ select o.status, q.status from offers o join requests q on q.offer_id = o.id where q.client_id = 'cccccccc-0000-0000-0000-000000000001' $$,
  $$ values ('Ditutup'::text, 'Dibatalkan'::text) $$, 'AT-03: penawaran ditutup, permintaan tertunda dibatalkan');

-- AT-10: hak baca diuji sebagai peran authenticated (RLS aktif).
-- Login lewat set_config langsung: fungsi pg_temp tidak dipanggil sebagai authenticated.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select set_config('t.d_contacts', (select count(*) from profile_contacts)::text, true),
       set_config('t.d_transfers', (select count(*) from transfers)::text, true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select set_config('t.b_contacts', (select count(*) from profile_contacts)::text, true);
reset role;
insert into r (line) select is(current_setting('t.d_contacts'), '1', 'AT-10: akun lain hanya melihat kontaknya sendiri');
insert into r (line) select is(current_setting('t.d_transfers'), '0', 'AT-10: akun lain tidak melihat penyaluran orang lain');
insert into r (line) select is(current_setting('t.b_contacts'), '2', 'Penerima melihat kontaknya + kontak pemberi setelah disetujui');

-- Klien tidak bisa menulis tabel langsung; anon tidak bisa memanggil RPC.
insert into r (line) select ok(not has_table_privilege('authenticated', 'public.offers', 'insert')
  and has_function_privilege('authenticated', 'public.donation_decide_request(bigint,text,text)', 'execute')
  and not has_function_privilege('anon', 'public.donation_decide_request(bigint,text,text)', 'execute'),
  'Hak akses: tulis hanya lewat RPC, anon tanpa RPC');

insert into r (line) select * from finish();
select string_agg(line, E'\n' order by n) as tap from r;
rollback;
