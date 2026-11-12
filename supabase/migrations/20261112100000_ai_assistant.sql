-- Asisten Dapur AI (AR-21): kuota per akun untuk Edge Function ai-chat.
-- Hanya waktu permintaan yang disimpan, bukan isi percakapan (FR-RS-06, OD-06).

create table public.ai_requests (
  id bigint generated always as identity primary key,
  profile_id bigint not null references public.profiles (id),
  at timestamptz not null default now()
);
create index on public.ai_requests (profile_id, at desc);

alter table public.ai_requests enable row level security;
create policy ai_requests_read on public.ai_requests for select to authenticated
  using (profile_id = private.my_id() or private.is_admin());

-- Dipanggil Edge Function sebelum memanggil Gemini; menjaga kuota gratis tetap ada selama penjurian.
create function public.ai_take_quota() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.me();
  per_hour constant integer := 40;
  used integer;
begin
  if me.role not in ('pemberi', 'penerima') then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  perform 1 from public.profiles where id = me.id for update; -- dua tab tidak melewati batas bersamaan
  select count(*) into used from public.ai_requests where profile_id = me.id and at > now() - interval '1 hour';
  if used >= per_hour then raise exception 'BATAS_AI' using errcode = 'P0001'; end if;
  insert into public.ai_requests (profile_id) values (me.id);
  return per_hour - used - 1;
end $$;

-- ── Hak akses ────────────────────────────────────────────────────────────

revoke insert, update, delete, truncate on public.ai_requests from anon, authenticated;
revoke all on public.ai_requests from anon;
revoke execute on function public.ai_take_quota() from public, anon;
