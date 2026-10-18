-- Другие языковые мини-приложения: кнопка «Другие языки» в настройках.
-- Список хранится в app_config.sister_apps и редактируется администратором в приложении
-- (Настройки → Администратор → «Другие приложения»): [{"title": "...", "bot": "имя_бота"}].
insert into public.app_config (key, value, note) values
  ('sister_apps', '[{"title": "Узбекский · Oʻzbek tili", "bot": "uzbek_tutor_bot"}]'::jsonb,
   'Другие языковые приложения: название и имя бота (без @). Меняется в приложении администратором.')
on conflict (key) do nothing;

create or replace function public.get_app_info()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'community_url', nullif((select value #>> '{}' from public.app_config where key = 'community_url'), ''),
    'sister_apps', coalesce((select value from public.app_config where key = 'sister_apps' and jsonb_typeof(value) = 'array'), '[]'::jsonb))
$$;
grant execute on function public.get_app_info() to anon, authenticated;

create or replace function public.admin_set_sister_apps(p_apps jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  it jsonb;
  v_clean jsonb := '[]'::jsonb;
  v_title text;
  v_bot text;
begin
  if not public.is_admin() then return jsonb_build_object('error', 'forbidden'); end if;
  if jsonb_typeof(p_apps) <> 'array' or jsonb_array_length(p_apps) > 20 then
    return jsonb_build_object('error', 'bad_list');
  end if;
  for it in select * from jsonb_array_elements(p_apps) loop
    v_title := btrim(coalesce(it->>'title', ''));
    v_bot := regexp_replace(btrim(coalesce(it->>'bot', '')), '^(https?://)?(t\.me/)?@?', '');
    if v_title = '' or length(v_title) > 60 then return jsonb_build_object('error', 'bad_title'); end if;
    if v_bot !~ '^[A-Za-z0-9_]{5,32}$' then return jsonb_build_object('error', 'bad_bot', 'bot', v_bot); end if;
    v_clean := v_clean || jsonb_build_array(jsonb_build_object('title', v_title, 'bot', v_bot));
  end loop;
  insert into public.app_config (key, value) values ('sister_apps', v_clean)
  on conflict (key) do update set value = excluded.value;
  return jsonb_build_object('ok', true, 'apps', v_clean);
end $$;
revoke execute on function public.admin_set_sister_apps(jsonb) from public, anon;
grant execute on function public.admin_set_sister_apps(jsonb) to authenticated;
