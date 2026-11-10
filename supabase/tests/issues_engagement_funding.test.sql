-- Tes modul issues, engagement, funding (architecture.md §9.8). Jalankan utuh; semua data di-rollback.
-- Baris uji difilter per judul/slug agar tidak bentrok dengan data awal (migrasi engagement_seed_realtime).
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
create temp table r (n serial, line text);
insert into r (line) select plan(26);

create function pg_temp.login(p_uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true)
$$;

-- A pemberi, B penerima, K kurir; O admin ops, F admin keuangan, N admin konten.
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b1', 'b@test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c1', 'k@test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000d1', 'o@test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000e1', 'f@test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000f1', 'n@test.invalid', 'authenticated', 'authenticated');
insert into profiles (user_id, role, admin_scope, org_name, org_type, area) values
  ('00000000-0000-0000-0000-0000000000d1', 'admin', 'ops', 'Admin Ops', 'Admin', 'Bandung'),
  ('00000000-0000-0000-0000-0000000000e1', 'admin', 'keuangan', 'Admin Keuangan', 'Admin', 'Bandung'),
  ('00000000-0000-0000-0000-0000000000f1', 'admin', 'konten', 'Admin Konten', 'Admin', 'Bandung');

select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select identity_complete_onboarding('pemberi', 'Toko A', 'UMKM', 'Sukasari', 'Sari', '0812', 'Jl. A');
select pg_temp.login('00000000-0000-0000-0000-0000000000b1');
select identity_complete_onboarding('penerima', 'Panti B', 'Panti', 'Coblong', 'Budi', '0813', 'Jl. B');
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select identity_complete_onboarding('kurir', 'Kurir K', 'Relawan', 'Bandung', 'Andi', '0814', 'Jl. K');

-- Penyaluran lewat mitra pengiriman.
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select donation_publish_offer('a1000000-0000-0000-0000-000000000001', 'Beras', 'Bahan pangan', 'kg', 10, 'Kering', 'Sukasari',
  now() - interval '1 hour', now() + interval '6 hours', array['Mitra pengiriman']);
select pg_temp.login('00000000-0000-0000-0000-0000000000b1');
select donation_submit_request('b1000000-0000-0000-0000-000000000001', (select id from offers limit 1), 5, 'Mitra pengiriman', now() + interval '2 hours');
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select donation_decide_request((select id from requests limit 1), 'approve');
select pg_temp.login('00000000-0000-0000-0000-0000000000d1');
select admin_assign_courier((select id from transfers limit 1), (select id from profiles where role = 'kurir'), 20000, 'sponsor');

-- AT-04: kurir gagal mengantar; pangan tidak ditandai diterima.
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select fulfillment_task_pickup((select id from courier_tasks limit 1), 5);
select fulfillment_task_fail((select id from courier_tasks limit 1), 'Ban bocor di jalan');
insert into r (line) select results_eq($$ select t.status, t.received is null, c.status from transfers t join courier_tasks c on c.transfer_id = t.id $$,
  $$ values ('Diserahkan'::text, true, 'Gagal'::text) $$, 'AT-04: kurir gagal, penyaluran tidak ditandai diterima');

-- Laporan kendala, penyelesaian, keberatan.
select pg_temp.login('00000000-0000-0000-0000-0000000000b1');
select issues_report('b1000000-0000-0000-0000-000000000002', (select id from transfers limit 1), 'Kendala pengiriman', 'Kurir gagal antar karena ban bocor');
insert into r (line) select ok(exists (select 1 from notifications n join profiles p on p.id = n.profile_id
  where p.org_name = 'Toko A' and n.title = 'Kendala dilaporkan'), 'Pihak lain penyaluran diberi tahu kendala');
insert into r (line) select ok(exists (select 1 from notifications n join profiles p on p.id = n.profile_id
  where p.org_name = 'Admin Ops' and n.title = 'Laporan kendala baru'), 'Admin ops diberi tahu kendala');
insert into r (line) select throws_ok($$ select issues_object((select id from issues limit 1), 'belum selesai') $$,
  'P0001', 'STATUS_TIDAK_SESUAI', 'Keberatan hanya setelah laporan selesai');
insert into r (line) select throws_ok($$ select admin_update_issue((select id from issues limit 1), 'Selesai', 'x') $$,
  'P0001', 'TIDAK_BERHAK', 'Pengguna biasa tidak bisa memakai RPC admin');
select pg_temp.login('00000000-0000-0000-0000-0000000000d1');
select admin_update_issue((select id from issues limit 1), 'Selesai', 'Pengantaran dijadwalkan ulang besok');
select pg_temp.login('00000000-0000-0000-0000-0000000000b1');
select issues_object((select id from issues limit 1), 'Belum ada jadwal ulang dari kurir');
insert into r (line) select is((select status from issues), 'Keberatan diajukan', 'Pelapor bisa mengajukan keberatan');
insert into r (line) select ok(exists (select 1 from audit_log where action = 'kendala' and after = 'Selesai'), 'Keputusan admin tercatat di audit');

-- Challenge dan reward (AT-07).
select pg_temp.login('00000000-0000-0000-0000-0000000000f1');
select admin_save_challenge(null, jsonb_build_object('title', 'Catat Pangan rutin', 'period_start', current_date - 1,
  'period_end', current_date + 30, 'roles', jsonb_build_array('pemberi'), 'metric', 'catat_pangan', 'target_count', 1, 'status', 'Aktif'));
select admin_save_reward_pack(null, '{"title":"Wadah besek","sponsor":"Mitra","quota":1,"eligible_roles":["pemberi"]}');
select admin_save_reward_pack(null, '{"title":"Tas insulasi","sponsor":"Mitra","quota":0,"eligible_roles":["pemberi"]}');
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select engagement_join_challenge((select id from challenges where title = 'Catat Pangan rutin'));
insert into r (line) select throws_ok($$ select engagement_finish_challenge((select id from challenge_participants where challenge_id = (select id from challenges where title = 'Catat Pangan rutin'))) $$,
  'P0001', 'DATA_TIDAK_VALID', 'Challenge tidak bisa selesai sebelum target');
select inventory_add_record('a1000000-0000-0000-0000-000000000002', 'Wortel', 'Bahan pangan', 2, 'kg');
insert into r (line) select is((select progress from v_challenge_progress where challenge_id = (select id from challenges where title = 'Catat Pangan rutin')), 1, 'Progres dihitung dari catatan pangan');
select engagement_finish_challenge((select id from challenge_participants where challenge_id = (select id from challenges where title = 'Catat Pangan rutin')));
insert into r (line) select throws_ok($$ select engagement_claim_reward((select id from challenge_participants where challenge_id = (select id from challenges where title = 'Catat Pangan rutin')), (select id from reward_packs where quota = 1)) $$,
  'P0001', 'STATUS_TIDAK_SESUAI', 'AT-07: belum diverifikasi, reward belum bisa diklaim');
select pg_temp.login('00000000-0000-0000-0000-0000000000d1');
select admin_decide_participant((select id from challenge_participants where challenge_id = (select id from challenges where title = 'Catat Pangan rutin')), 'Lolos', 'Bukti catatan sesuai');
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select engagement_claim_reward((select id from challenge_participants where challenge_id = (select id from challenges where title = 'Catat Pangan rutin')), (select id from reward_packs where quota = 1));
select engagement_claim_reward((select id from challenge_participants where challenge_id = (select id from challenges where title = 'Catat Pangan rutin')), (select id from reward_packs where quota = 1));
insert into r (line) select results_eq($$ select (select count(*) from reward_claims)::int, (select claimed from reward_packs where quota = 1) $$,
  $$ values (1, 1) $$, 'AT-07: klaim ulang tidak membuat klaim atau mengurangi stok lagi');
select pg_temp.login('00000000-0000-0000-0000-0000000000d1');
select admin_update_claim((select id from reward_claims limit 1), 'Ditolak', 'Alamat pengiriman tidak lengkap');
insert into r (line) select is((select claimed from reward_packs where quota = 1), 0, 'Klaim ditolak mengembalikan kuota');
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
insert into r (line) select throws_ok($$ select engagement_claim_reward((select id from challenge_participants where challenge_id = (select id from challenges where title = 'Catat Pangan rutin')), (select id from reward_packs where quota = 0)) $$,
  'P0001', 'KUOTA_HABIS', 'AT-07: stok habis ditolak, tidak negatif');

-- Konten hanya terbit setelah ditinjau.
select pg_temp.login('00000000-0000-0000-0000-0000000000f1');
select admin_save_content(null, '{"slug":"tes-simpan-sayur","kind":"Tips","title":"Simpan sayur berdaun","category":"Penyimpanan","body":["Keringkan dulu."]}');
insert into r (line) select throws_ok($$ select admin_publish_content((select id from contents where slug = 'tes-simpan-sayur')) $$,
  'P0001', 'STATUS_TIDAK_SESUAI', 'Draf tidak bisa langsung terbit');
select admin_save_content((select id from contents where slug = 'tes-simpan-sayur'), '{"summary":"Agar segar lebih lama"}', true);
select admin_publish_content((select id from contents where slug = 'tes-simpan-sayur'));
insert into r (line) select results_eq($$ select status, version from contents where slug = 'tes-simpan-sayur' $$, $$ values ('Terbit'::text, 2) $$, 'Konten terbit setelah review, versi naik');
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
insert into r (line) select is(engagement_toggle_saved((select id from contents where slug = 'tes-simpan-sayur')), true, 'Konten bisa disimpan');

-- AT-08: persetujuan versi lama tidak berlaku untuk versi baru.
select pg_temp.login('00000000-0000-0000-0000-0000000000f1');
select admin_propose_appreciation((select id from profiles where org_name = 'Toko A'), 'Terima kasih Toko A');
select admin_propose_appreciation((select id from profiles where org_name = 'Toko A'), 'Terima kasih Toko A atas 10 kg beras');
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
insert into r (line) select throws_ok($$ select engagement_respond_appreciation((select id from appreciation_materials where version = 1), 'Disetujui') $$,
  'P0001', 'STATUS_TIDAK_SESUAI', 'AT-08: versi lama tidak bisa disetujui');
select engagement_respond_appreciation((select id from appreciation_materials where version = 2), 'Disetujui');
insert into r (line) select results_eq($$ select version, status from appreciation_materials order by version $$,
  $$ values (1, 'Draf'::text), (2, 'Disetujui'::text) $$, 'AT-08: hanya versi terbaru yang disetujui');

-- AT-09: dukungan dan ledger.
select pg_temp.login('00000000-0000-0000-0000-0000000000b1');
select funding_add_support('b1000000-0000-0000-0000-000000000003', 50000, 'pengiriman', 'Subsidi ongkir dan relawan');
select pg_temp.login('00000000-0000-0000-0000-0000000000e1');
select admin_decide_support((select id from supports limit 1), 'Tervalidasi', 'Bukti transfer sesuai', 'PAY-001');
select admin_decide_support((select id from supports limit 1), 'Tervalidasi', 'Bukti transfer sesuai', 'PAY-001');
insert into r (line) select results_eq($$ select (select count(*) from ledger_entries)::int, (select saldo from funding_summary() where fund = 'pengiriman') $$,
  $$ values (1, 50000::bigint) $$, 'AT-09: validasi ganda = satu entri, saldo bertambah sekali');
select admin_record_ledger('Masuk', 'operasional', 100000, 'Donatur', 'Dukungan operasional', null, null, 'PAY-002');
select admin_record_ledger('Masuk', 'operasional', 100000, 'Donatur', 'Dukungan operasional', null, null, 'PAY-002');
insert into r (line) select is((select count(*) from ledger_entries where provider_ref = 'PAY-002')::int, 1, 'AT-09: konfirmasi penyedia ganda dicatat sekali');
insert into r (line) select throws_ok($$ select admin_record_ledger('Keluar', 'pengiriman', 60000, 'Kurir', 'Ongkir') $$,
  'P0001', 'SALDO_TIDAK_CUKUP', 'Dana pengiriman tidak bisa keluar melebihi saldonya');
select admin_record_ledger('Keluar', 'pengiriman', 20000, 'Kurir K', 'Ongkir penyaluran', null, (select id from transfers limit 1));
insert into r (line) select is((select saldo from funding_summary() where fund = 'pengiriman'), 30000::bigint, 'Saldo = masuk - keluar');
select admin_reverse_ledger((select id from ledger_entries where kind = 'Keluar'), 'Salah catat nominal');
insert into r (line) select is((select saldo from funding_summary() where fund = 'pengiriman'), 50000::bigint, 'Koreksi lewat entri pembalik');
insert into r (line) select throws_ok($$ update ledger_entries set amount = 1 $$, 'P0001', 'APPEND_ONLY', 'Ledger tidak bisa diubah');

-- Rincian ledger hanya admin keuangan; ringkasan terbuka untuk semua.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
select set_config('t.b_ledger', (select count(*) from ledger_entries)::text, true),
       set_config('t.b_summary', (select count(*) from funding_summary())::text, true);
reset role;
insert into r (line) select ok(current_setting('t.b_ledger') = '0' and current_setting('t.b_summary')::int > 0,
  'Pengguna melihat ringkasan dana, bukan rincian ledger');

insert into r (line) select ok(has_function_privilege('authenticated', 'public.funding_add_support(uuid,bigint,text,text,bigint)', 'execute')
  and not has_function_privilege('anon', 'public.funding_add_support(uuid,bigint,text,text,bigint)', 'execute')
  and not has_function_privilege('authenticated', 'public.rls_auto_enable()', 'execute')
  and not has_table_privilege('authenticated', 'public.ledger_entries', 'insert'),
  'Hak akses RPC dan tabel modul baru');

insert into r (line) select * from finish();
select string_agg(line, E'\n' order by n) as tap from r;
rollback;
