-- Suara Asisten Dapur (Gemini TTS lewat Edge Function ai-tts): kuota per akun terpisah dari chat.
-- Satu jawaban dibacakan dalam beberapa potongan, jadi batasnya per potongan suara.

alter table public.ai_requests add column kind text not null default 'chat' check (kind in ('chat', 'suara'));
drop index if exists public.ai_requests_profile_id_at_idx;
create index on public.ai_requests (profile_id, kind, at desc);

-- Isi sama dengan versi 20261112100000; kini hanya menghitung permintaan chat.
create or replace function public.ai_take_quota() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.me();
  per_hour constant integer := 40;
  used integer;
begin
  if me.role not in ('pemberi', 'penerima') then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  perform 1 from public.profiles where id = me.id for update; -- dua tab tidak melewati batas bersamaan
  select count(*) into used from public.ai_requests where profile_id = me.id and kind = 'chat' and at > now() - interval '1 hour';
  if used >= per_hour then raise exception 'BATAS_AI' using errcode = 'P0001'; end if;
  insert into public.ai_requests (profile_id, kind) values (me.id, 'chat');
  return per_hour - used - 1;
end $$;

create function public.ai_take_tts_quota() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.me();
  per_hour constant integer := 120;
  used integer;
begin
  if me.role not in ('pemberi', 'penerima') then raise exception 'TIDAK_BERHAK' using errcode = 'P0001'; end if;
  perform 1 from public.profiles where id = me.id for update;
  select count(*) into used from public.ai_requests where profile_id = me.id and kind = 'suara' and at > now() - interval '1 hour';
  if used >= per_hour then raise exception 'BATAS_AI' using errcode = 'P0001'; end if;
  insert into public.ai_requests (profile_id, kind) values (me.id, 'suara');
  return per_hour - used - 1;
end $$;

revoke execute on function public.ai_take_tts_quota() from public, anon;
grant execute on function public.ai_take_tts_quota() to authenticated;
