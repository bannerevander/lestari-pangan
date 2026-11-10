-- Tes keputusan produk OD-01 s.d. OD-05 (migrasi 20261110100000_product_decisions). Jalankan utuh; semua data di-rollback.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
create temp table r (n serial, line text);
insert into r (line) select plan(19);

create function pg_temp.login(p_uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true)
$$;

-- A pemberi, B penerima, O admin ops, N admin konten.
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000001a1', 'a@test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000001b1', 'b@test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000001d1', 'o@test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000001f1', 'n@test.invalid', 'authenticated', 'authenticated');
insert into profiles (user_id, role, admin_scope, org_name, org_type, area) values
  ('00000000-0000-0000-0000-0000000001d1', 'admin', 'ops', 'Admin Ops', 'Admin', 'Bandung'),
  ('00000000-0000-0000-0000-0000000001f1', 'admin', 'konten', 'Admin Konten', 'Admin', 'Bandung');
select pg_temp.login('00000000-0000-0000-0000-0000000001a1');
select identity_complete_onboarding('pemberi', 'Toko Uji', 'UMKM', 'Sukasari', 'Sari', '0812', 'Jl. A');
select pg_temp.login('00000000-0000-0000-0000-0000000001b1');
select identity_complete_onboarding('penerima', 'Panti Uji', 'Panti', 'Coblong', 'Budi', '0813', 'Jl. B');

-- OD-03: data wajib per kategori.
select pg_temp.login('00000000-0000-0000-0000-0000000001a1');
insert into r (line) select throws_ok($$ select donation_publish_offer('a2000000-0000-0000-0000-000000000009', 'Nasi', 'Makanan matang', 'porsi', 5,
  'Suhu ruang', 'Sukasari', now(), now() + interval '3 hours', array['Ambil sendiri']) $$,
  'P0001', 'DATA_TIDAK_VALID', 'Makanan matang wajib waktu dimasak');
insert into r (line) select throws_ok($$ select donation_publish_offer('a2000000-0000-0000-0000-000000000008', 'Susu', 'Produk kemasan', 'kemasan', 5,
  'Suhu ruang', 'Sukasari', now(), now() + interval '3 hours', array['Ambil sendiri'], p_label_date => current_date - 1) $$,
  'P0001', 'DATA_TIDAK_VALID', 'Produk kemasan kedaluwarsa ditolak');

-- OD-01: batas 4 kg per penerima.
select donation_publish_offer('a2000000-0000-0000-0000-000000000001', 'Beras', 'Bahan pangan', 'kg', 10, 'Kering', 'Sukasari',
  now() - interval '1 hour', now() + interval '6 hours', array['Ambil sendiri', 'Mitra pengiriman'], p_max_per_recipient => 4);
select pg_temp.login('00000000-0000-0000-0000-0000000001b1');
insert into r (line) select throws_ok($$ select donation_submit_request('b2000000-0000-0000-0000-000000000009', (select id from offers where name = 'Beras' and donor_id = (select id from profiles where org_name = 'Toko Uji')), 5, 'Mitra pengiriman', now() + interval '1 hour') $$,
  'P0001', 'DATA_TIDAK_VALID', 'Permintaan di atas batas per penerima ditolak');
select donation_submit_request('b2000000-0000-0000-0000-000000000001', (select id from offers where name = 'Beras' and donor_id = (select id from profiles where org_name = 'Toko Uji')), 4, 'Mitra pengiriman', now() + interval '1 hour');

-- OD-01: tanpa konfirmasi lebih dari 2 jam = batal.
update requests set created_at = now() - interval '3 hours' where client_id = 'b2000000-0000-0000-0000-000000000001';
select pg_temp.login('00000000-0000-0000-0000-0000000001a1');
insert into r (line) select throws_ok($$ select donation_decide_request((select id from requests where client_id = 'b2000000-0000-0000-0000-000000000001'), 'approve') $$,
  'P0001', 'STATUS_TIDAK_SESUAI', 'Persetujuan setelah 2 jam ditolak');
select private.job_expire_requests();
insert into r (line) select is((select status from requests where client_id = 'b2000000-0000-0000-0000-000000000001'), 'Dibatalkan', 'Job membatalkan permintaan tanpa konfirmasi 2 jam');
insert into r (line) select ok(exists (select 1 from notifications n join profiles p on p.id = n.profile_id
  where p.org_name = 'Panti Uji' and n.title = 'Permintaan berakhir'), 'Penerima diberi tahu permintaan berakhir');

select pg_temp.login('00000000-0000-0000-0000-0000000001b1');
select donation_submit_request('b2000000-0000-0000-0000-000000000002', (select id from offers where name = 'Beras' and donor_id = (select id from profiles where org_name = 'Toko Uji')), 4, 'Mitra pengiriman', now() + interval '1 hour');
select pg_temp.login('00000000-0000-0000-0000-0000000001a1');
select donation_decide_request((select id from requests where client_id = 'b2000000-0000-0000-0000-000000000002'), 'approve');
select pg_temp.login('00000000-0000-0000-0000-0000000001b1');
insert into r (line) select throws_ok($$ select donation_submit_request('b2000000-0000-0000-0000-000000000003', (select id from offers where name = 'Beras' and donor_id = (select id from profiles where org_name = 'Toko Uji')), 1, 'Ambil sendiri', now() + interval '1 hour') $$,
  'P0001', 'DATA_TIDAK_VALID', 'Batas per penerima menghitung permintaan yang sudah disetujui');

-- OD-04: ongkir bawaan penerima, bisa diajukan ke pemberi. tt = penyaluran uji (database bisa berisi data asli).
create temp table tt as select id from transfers where request_id = (select id from requests where client_id = 'b2000000-0000-0000-0000-000000000002');
insert into r (line) select is((select fee_payer from transfers where id = (select id from tt)), 'penerima', 'Ongkir bawaan ditanggung penerima');
select fulfillment_request_fee((select id from tt));
select pg_temp.login('00000000-0000-0000-0000-0000000001a1');
select fulfillment_respond_fee((select id from tt), true);
insert into r (line) select results_eq($$ select fee_payer, fee_request from transfers where id = (select id from tt) $$, $$ values ('pemberi'::text, false) $$, 'Pemberi menyetujui menanggung ongkir');
select pg_temp.login('00000000-0000-0000-0000-0000000001d1');
select admin_assign_courier((select id from tt), null, 15000);
insert into r (line) select is((select payer from courier_tasks where transfer_id = (select id from tt)), 'pemberi', 'Tugas kurir mengikuti pembayar ongkir yang disepakati');

-- OD-03: penerimaan sebagian perlu alasan jelas dan verifikasi staf.
select pg_temp.login('00000000-0000-0000-0000-0000000001b1');
insert into r (line) select throws_ok($$ select fulfillment_receive((select id from tt), 3, 'kurang') $$,
  'P0001', 'DATA_TIDAK_VALID', 'Alasan terlalu singkat ditolak');
select fulfillment_receive((select id from tt), 3, '1 kg beras basah kena hujan');
insert into r (line) select results_eq($$ select status, received is null, (pending_receipt ->> 'received')::numeric from transfers where id = (select id from tt) $$,
  $$ values ('Menunggu verifikasi'::text, true, 3::numeric) $$, 'Penerimaan sebagian menunggu staf; dampak belum tercatat');
select pg_temp.login('00000000-0000-0000-0000-0000000001d1');
select admin_verify_receipt((select id from tt), false, 'Mohon sertakan foto beras basah');
insert into r (line) select results_eq($$ select status, pending_receipt is null from transfers where id = (select id from tt) $$, $$ values ('Terjadwal'::text, true) $$,
  'Staf mengembalikan: penerima konfirmasi ulang');
select pg_temp.login('00000000-0000-0000-0000-0000000001b1');
select fulfillment_receive((select id from tt), 3, '1 kg beras basah kena hujan, foto di catatan');
select pg_temp.login('00000000-0000-0000-0000-0000000001d1');
select admin_verify_receipt((select id from tt), true, 'Foto sesuai');
insert into r (line) select results_eq($$ select status, received, rejected from transfers where id = (select id from tt) $$,
  $$ values ('Diterima sebagian'::text, 3.00::numeric(10,2), 1.00::numeric(10,2)) $$, 'Disetujui staf: tercatat diterima sebagian');

-- OD-05: poin dari challenge ditukar reward; periode berikutnya boleh diikuti lagi.
select pg_temp.login('00000000-0000-0000-0000-0000000001f1');
select admin_save_challenge(null, jsonb_build_object('title', 'Uji poin', 'period_start', current_date - 1, 'period_end', current_date + 30,
  'roles', jsonb_build_array('pemberi'), 'metric', 'catat_pangan', 'target_count', 1, 'points', 30, 'status', 'Aktif'));
select admin_save_reward_pack(null, '{"title":"Uji paket 30","sponsor":"Lumbung Fiksi","quota":5,"cost":30,"eligible_roles":["pemberi"]}');
select admin_save_reward_pack(null, '{"title":"Uji paket 1","sponsor":"Lumbung Fiksi","quota":5,"cost":1,"eligible_roles":["pemberi"]}');
select pg_temp.login('00000000-0000-0000-0000-0000000001a1');
select engagement_join_challenge((select id from challenges where title = 'Uji poin'));
select inventory_add_record('a2000000-0000-0000-0000-000000000002', 'Wortel', 'Bahan pangan', 2, 'kg');
select engagement_finish_challenge((select id from challenge_participants where challenge_id = (select id from challenges where title = 'Uji poin')));
select pg_temp.login('00000000-0000-0000-0000-0000000001d1');
select admin_decide_participant((select id from challenge_participants where challenge_id = (select id from challenges where title = 'Uji poin')), 'Lolos', 'Catatan sesuai');
insert into r (line) select is((select points from challenge_participants where challenge_id = (select id from challenges where title = 'Uji poin')), 30, 'Challenge lolos memberi poin');
select pg_temp.login('00000000-0000-0000-0000-0000000001a1');
select engagement_claim_reward('a2000000-0000-0000-0000-0000000000c1', (select id from reward_packs where title = 'Uji paket 30'));
insert into r (line) select throws_ok($$ select engagement_claim_reward('a2000000-0000-0000-0000-0000000000c2', (select id from reward_packs where title = 'Uji paket 1')) $$,
  'P0001', 'POIN_TIDAK_CUKUP', 'Poin yang sudah ditukar tidak bisa dipakai lagi');
select pg_temp.login('00000000-0000-0000-0000-0000000001f1');
insert into r (line) select throws_ok($$ select admin_save_challenge((select id from challenges where title = 'Uji poin'), '{"metric":"penyaluran_selesai"}') $$,
  'P0001', 'STATUS_TIDAK_SESUAI', 'Aturan terkunci selama periode berjalan');
select admin_save_challenge((select id from challenges where title = 'Uji poin'),
  jsonb_build_object('period_start', current_date + 31, 'period_end', current_date + 60));
select pg_temp.login('00000000-0000-0000-0000-0000000001a1');
select engagement_join_challenge((select id from challenges where title = 'Uji poin'));
insert into r (line) select is((select count(*) from challenge_participants where challenge_id = (select id from challenges where title = 'Uji poin'))::int, 2,
  'Challenge bisa diikuti lagi di periode berikutnya');

insert into r (line) select ok(has_function_privilege('authenticated', 'public.admin_verify_receipt(bigint,boolean,text)', 'execute')
  and not has_function_privilege('anon', 'public.admin_verify_receipt(bigint,boolean,text)', 'execute')
  and not has_function_privilege('anon', 'public.engagement_claim_reward(uuid,bigint)', 'execute'),
  'RPC baru tidak bisa dipanggil anon');

insert into r (line) select * from finish();
select string_agg(line, E'\n' order by n) as tap from r;
rollback;
