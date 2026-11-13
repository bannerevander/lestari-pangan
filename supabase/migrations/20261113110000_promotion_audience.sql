-- Target peran promosi: banner "Tawarkan pangan" hanya untuk pemberi, ajakan untuk penerima hanya untuk penerima.

alter table public.promotions add column audience text not null default 'semua'
  check (audience in ('semua', 'pemberi', 'penerima'));

-- Isi sama dengan versi 20261013110000, ditambah kolom audience.
create or replace function public.admin_save_promotion(p_id bigint, p_fields jsonb) returns public.promotions
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := private.require_admin('konten');
  old public.promotions;
  v public.promotions;
begin
  if p_id is null then
    insert into public.promotions (title, placement, image_path, link, area, starts_on, ends_on, active, sort, audience)
    values (p_fields ->> 'title', p_fields ->> 'placement', p_fields ->> 'image_path', nullif(p_fields ->> 'link', ''),
            nullif(p_fields ->> 'area', ''), (p_fields ->> 'starts_on')::date, (p_fields ->> 'ends_on')::date,
            coalesce((p_fields ->> 'active')::boolean, true), coalesce((p_fields ->> 'sort')::int, 0),
            coalesce(nullif(p_fields ->> 'audience', ''), 'semua'))
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
    updated_at = now()
  where id = p_id returning * into v;
  perform private.audit(me.id, 'promosi', v.code,
    old.placement || case when old.active then ' aktif' else ' nonaktif' end,
    v.placement || case when v.active then ' aktif' else ' nonaktif' end, 'Promosi diubah: ' || v.title);
  return v;
end $$;
