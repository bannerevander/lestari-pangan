-- Tes keamanan menyeluruh (docs/SECURITY.md). Memeriksa seluruh skema, jadi tabel/fungsi baru ikut teruji.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
create temp table r (n serial, line text);
insert into r (line) select plan(12);

insert into r (line) select is((select count(*)::int from information_schema.role_table_grants
  where grantee = 'anon' and table_schema = 'public'), 0, 'anon tidak punya hak apa pun pada tabel/view public');
insert into r (line) select is((select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')), 0, 'anon tidak bisa memanggil fungsi public');
insert into r (line) select is((select count(*)::int from information_schema.role_table_grants
  where grantee = 'authenticated' and table_schema = 'public' and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')),
  0, 'authenticated tidak bisa menulis tabel langsung');
insert into r (line) select is((select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity), 0, 'Semua tabel public memakai RLS');
insert into r (line) select is((select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'v' and not coalesce('security_invoker=true' = any (c.reloptions), false)),
  0, 'Semua view public memakai security_invoker');
insert into r (line) select is((select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'private') and p.prosecdef and p.proconfig is null), 0, 'Semua SECURITY DEFINER mengunci search_path');
insert into r (line) select ok(not has_column_privilege('authenticated', 'public.profiles', 'user_id', 'select')
  and not has_column_privilege('authenticated', 'public.profiles', 'prefs', 'select')
  and has_column_privilege('authenticated', 'public.profiles', 'org_name', 'select'), 'Kolom privat profil tertutup untuk pengguna lain');
insert into r (line) select is((select count(*)::int from pg_trigger where tgname like '%append_only' and not tgisinternal), 5,
  'Lima tabel riwayat append-only dilindungi trigger');
insert into r (line) select results_eq($$ select id, file_size_limit, public from storage.buckets order by id $$,
  $$ values ('media'::text, 2097152::bigint, true), ('offer-photos'::text, 2097152::bigint, true), ('verification-docs'::text, 5242880::bigint, false) $$,
  'Batas ukuran bucket; dokumen verifikasi privat');

-- identity_me: profil sendiri tanpa user_id; null sebelum onboarding.
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000aa', 'me@test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000bb', 'new@test.invalid', 'authenticated', 'authenticated');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000aa","role":"authenticated"}', true);
select identity_complete_onboarding('pemberi', 'Warung Saya', 'UMKM', 'Coblong', 'Rina', '0812', 'Jl. Uji');
insert into r (line) select ok((select identity_me() ? 'contact' and not identity_me() ? 'user_id' and identity_me() ->> 'org_name' = 'Warung Saya'),
  'identity_me mengembalikan profil + kontak sendiri tanpa user_id');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000bb","role":"authenticated"}', true);
insert into r (line) select is(identity_me(), null, 'identity_me null sebelum onboarding');
insert into r (line) select throws_ok($$ select identity_complete_onboarding('admin', 'Saya Admin', 'x', 'x', 'x', '0', 'x') $$,
  'P0001', 'DATA_TIDAK_VALID', 'Pengguna tidak bisa mendaftar sebagai admin');

insert into r (line) select * from finish();
select string_agg(line, E'\n' order by n) as tap from r;
rollback;
