-- Teks banner disimpan sebagai data (bukan ditanam di gambar): tampil tajam dan besar di semua layar,
-- dibaca pembaca layar, dan bisa diubah admin tanpa membuat ulang gambar. Kosong = gambar sudah berisi tulisan.

alter table public.promotions
  add column headline text check (headline is null or length(trim(headline)) between 3 and 40),
  add column body text check (body is null or length(trim(body)) <= 90),
  add column cta text check (cta is null or length(trim(cta)) <= 20);

-- Isi sama dengan versi 20261113110000, ditambah headline, body, cta.
create or replace function public.admin_save_promotion(p_id bigint, p_fields jsonb) returns public.promotions
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('konten');
  old public.promotions;
  v public.promotions;
begin
  if p_id is null then
    insert into public.promotions (title, placement, image_path, link, area, starts_on, ends_on, active, sort, audience, headline, body, cta)
    values (p_fields ->> 'title', p_fields ->> 'placement', p_fields ->> 'image_path', nullif(p_fields ->> 'link', ''),
            nullif(p_fields ->> 'area', ''), (p_fields ->> 'starts_on')::date, (p_fields ->> 'ends_on')::date,
            coalesce((p_fields ->> 'active')::boolean, true), coalesce((p_fields ->> 'sort')::int, 0),
            coalesce(nullif(p_fields ->> 'audience', ''), 'semua'),
            nullif(trim(p_fields ->> 'headline'), ''), nullif(trim(p_fields ->> 'body'), ''), nullif(trim(p_fields ->> 'cta'), ''))
    returning * into v;
    perform private.audit(me.id, 'promosi', v.code, null, v.placement || case when v.active then ' aktif' else ' nonaktif' end, 'Promosi dibuat: ' || v.title);
    return v;
  end if;
  select * into old from public.promotions where id = p_id for update;
  if not found then raise exception 'DATA_TIDAK_VALID' using errcode = 'P0001'; end if;
  update public.promotions set
    title = coalesce(p_fields ->> 'title', title), placement = coalesce(p_fields ->> 'placement', placement),
    image_path = coalesce(p_fields ->> 'image_path', image_path),
    link = case when p_fields ? 'link' then nullif(p_fields ->> 'link', '') else link end,
    area = case when p_fields ? 'area' then nullif(p_fields ->> 'area', '') else area end,
    starts_on = case when p_fields ? 'starts_on' then (p_fields ->> 'starts_on')::date else starts_on end,
    ends_on = case when p_fields ? 'ends_on' then (p_fields ->> 'ends_on')::date else ends_on end,
    active = coalesce((p_fields ->> 'active')::boolean, active), sort = coalesce((p_fields ->> 'sort')::int, sort),
    audience = coalesce(nullif(p_fields ->> 'audience', ''), audience),
    headline = case when p_fields ? 'headline' then nullif(trim(p_fields ->> 'headline'), '') else headline end,
    body = case when p_fields ? 'body' then nullif(trim(p_fields ->> 'body'), '') else body end,
    cta = case when p_fields ? 'cta' then nullif(trim(p_fields ->> 'cta'), '') else cta end,
    updated_at = now()
  where id = p_id returning * into v;
  perform private.audit(me.id, 'promosi', v.code,
    old.placement || case when old.active then ' aktif' else ' nonaktif' end,
    v.placement || case when v.active then ' aktif' else ' nonaktif' end, 'Promosi diubah: ' || v.title);
  return v;
end $$;
