-- Tes kuota Asisten Dapur AI (migrasi 20261112100000_ai_assistant). Jalankan utuh; semua data di-rollback.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
create temp table r (n serial, line text);
insert into r (line) select plan(5);

create function pg_temp.login(p_uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true)
$$;

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000002a1', 'ai-a@test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000002c1', 'ai-k@test.invalid', 'authenticated', 'authenticated');
select pg_temp.login('00000000-0000-0000-0000-0000000002a1');
select identity_complete_onboarding('pemberi', 'Uji AI Warung', 'UMKM', 'Coblong', 'Sari', '0812', 'Jl. A');
select pg_temp.login('00000000-0000-0000-0000-0000000002c1');
select identity_complete_onboarding('kurir', 'Uji AI Kurir', 'Relawan', 'Bandung', 'Andi', '0814', 'Jl. K');

select pg_temp.login('00000000-0000-0000-0000-0000000002a1');
insert into r (line) select is(ai_take_quota(), 39, 'Pesan pertama memakai satu kuota');
insert into ai_requests (profile_id) select (select id from profiles where org_name = 'Uji AI Warung') from generate_series(1, 39);
insert into r (line) select throws_ok($$ select ai_take_quota() $$, 'P0001', 'BATAS_AI', 'Pesan ke-41 dalam satu jam ditolak');
update ai_requests set at = now() - interval '2 hours' where profile_id = (select id from profiles where org_name = 'Uji AI Warung');
insert into r (line) select is(ai_take_quota(), 39, 'Kuota pulih setelah satu jam');

select pg_temp.login('00000000-0000-0000-0000-0000000002c1');
insert into r (line) select throws_ok($$ select ai_take_quota() $$, 'P0001', 'TIDAK_BERHAK', 'Kurir tidak memakai asisten');

insert into r (line) select ok(has_function_privilege('authenticated', 'public.ai_take_quota()', 'execute')
  and not has_function_privilege('anon', 'public.ai_take_quota()', 'execute')
  and not has_table_privilege('authenticated', 'public.ai_requests', 'insert'),
  'Hak akses: kuota hanya lewat RPC, anon ditolak');

insert into r (line) select * from finish();
select string_agg(line, E'\n' order by n) as tap from r;
rollback;
