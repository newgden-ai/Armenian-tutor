-- Армянская версия: спряжение и склонение.
-- Темы армянского курса грамматики, после которых растёт потолок уровня тренажёров:
--   спряжение — 10 (настоящее), 11 (прошедшее несовершенное), 12 (аорист), 13 (перфект, будущее),
--               14 (отрицание), 15 (повелительное, желательное, условное);
--   склонение — 3 (множественное число), 4 (падежи), 5 (артикли и притяжательные формы).
-- Узбекские номера тем (3,5,6,7,8,16,21–27 и 9–11) заменены; остальная логика та же, что в step21.
create or replace function public.morph_state(p_user uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  with lvl as (
    select max(cefr) as cefr from public.level_test_attempts where user_id = p_user and passed),
  passed as (
    select u.source_no from public.course_units u
     where u.course_id = 'grammar'
       and (exists (select 1 from public.course_progress cp
                     where cp.user_id = p_user and cp.unit_id = u.id and (cp.read_at is not null or cp.status = 'tested'))
            or u.cefr <= (select cefr from lvl)
            or coalesce((select p.alpha from public.profiles p where p.id = p_user), false)))
  select jsonb_build_object(
    'grammar', coalesce((select jsonb_agg(source_no order by source_no) from passed), '[]'::jsonb),
    'by_test', (select cefr from lvl),
    'alpha', coalesce((select p.alpha from public.profiles p where p.id = p_user), false),
    'conj_cap', (select case when count(*) = 6 then 15 else greatest(1, floor(15.0 * count(*) / 6))::int end
                   from passed where source_no in (10,11,12,13,14,15)),
    'decl_cap', (select case when count(*) = 3 then 15 else greatest(1, floor(15.0 * count(*) / 3))::int end
                   from passed where source_no in (3,4,5)))
$$;
