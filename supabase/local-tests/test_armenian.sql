-- Проверка армянской версии на локальной базе: после local_stubs.sql, миграций и импорта словаря и курсов
-- (scripts/load_vocab.sql, scripts/load_courses.sql). Любая ошибка останавливает файл (ON_ERROR_STOP).
-- Узбекские test_step*.sql рассчитаны на узбекские слова — для армянской копии запускается этот файл.
\set ON_ERROR_STOP 1

-- ---------------------------------------------------------------- данные
do $$
declare n int;
begin
  select count(*) into n from public.words;
  if n < 4000 then raise exception 'FAIL: words %', n; end if;
  if exists (select 1 from public.words where uz !~ '[ա-ևԱ-Ֆ]') then raise exception 'FAIL: слово без армянских букв'; end if;
  if exists (select 1 from public.words where uz_key <> public.key_uz(uz)) then raise exception 'FAIL: uz_key ≠ key_uz(uz)'; end if;
  select count(*) into n from public.course_units where coalesce(title_uz, '') = '' or coalesce(express_uz, '') = '';
  if n > 0 then raise exception 'FAIL: % тем курсов без армянского текста', n; end if;
  if (select count(*) from public.course_units where course_id = 'dialogs') <> 30 then raise exception 'FAIL: диалогов не 30'; end if;
  raise notice 'ok: данные (% слов)', (select count(*) from public.words);
end $$;

-- ---------------------------------------------------------------- нормализация (та же, что в build_vocab.py и normalize.js)
do $$ begin
  if public.key_uz('Ի՞նչ է Ձեր ԱՆՈՒՆԸ, եւ ինչպե՛ս') <> 'ինչ է ձեր անունը և ինչպես' then raise exception 'FAIL: key_uz %', public.key_uz('Ի՞նչ է Ձեր ԱՆՈՒՆԸ, եւ ինչպե՛ս'); end if;
  if public.key_uz('Երևան-Գյումրի') <> 'երևան գյումրի' then raise exception 'FAIL: key_uz hyphen'; end if;
  if regexp_replace(public.uz_strip_pron('ես գնում եմ'), '\s+', ' ', 'g') <> 'գնում եմ' then raise exception 'FAIL: uz_strip_pron'; end if;
  raise notice 'ok: нормализация';
end $$;

-- ---------------------------------------------------------------- цены, язык, часовой пояс
do $$ begin
  if (select price_uzs from public.plans where tier = 'basic' and months = 1 and seats = 1) <> 3300 then raise exception 'FAIL: цена в драмах'; end if;
  if (select value #>> '{}' from public.app_config where key = 'target_language') <> 'hy' then raise exception 'FAIL: target_language'; end if;
  raise notice 'ok: цены и настройки';
end $$;

-- ---------------------------------------------------------------- пользователь: интерфейс hy, сеанс, ответы, план дня
insert into public.profiles (id, tg_id, first_name, ui_lang) values ('a1a1a1a1-0000-0000-0000-000000000001', 990001, 'Test', 'hy')
on conflict (id) do nothing;
set role authenticated;
set request.jwt.claim.sub = 'a1a1a1a1-0000-0000-0000-000000000001';

do $$
declare s jsonb; me jsonb; nxt jsonb; items jsonb; ev jsonb := '[]'; it jsonb; r jsonb;
begin
  me := public.update_settings('hy', '{"onboarded": true}'::jsonb);
  if me->>'ui_lang' <> 'hy' then raise exception 'FAIL: ui_lang hy не сохранился: %', me->>'ui_lang'; end if;

  s := public.start_session('normal', null);
  items := s->'items';
  if jsonb_array_length(items) = 0 then raise exception 'FAIL: пустой сеанс: %', s; end if;
  if (items->0->>'uz') !~ '[ա-և]' then raise exception 'FAIL: в сеансе не армянское слово: %', items->0; end if;

  -- показ и верный ответ на каждую карточку сеанса (формат событий — как у приложения)
  for it in select * from jsonb_array_elements(items) loop
    ev := ev || jsonb_build_array(
      jsonb_build_object('seq', jsonb_array_length(ev) + 1, 'kind', 'shown', 'word_id', (it->>'id')::int),
      jsonb_build_object('seq', jsonb_array_length(ev) + 2, 'kind', 'answer', 'word_id', (it->>'id')::int,
                         'ex_type', 'uz_ru_choice', 'target', 'ru', 'answer', it->>'ru', 'attempt', 'first'));
  end loop;
  r := public.submit_answers((s->>'session_id')::uuid, ev);
  if (select count(*) from public.word_progress where user_id = auth.uid()) = 0 then raise exception 'FAIL: прогресс не записан: %', r; end if;

  nxt := public.get_next_step();
  if nxt->'next'->>'kind' = 'dialog' then raise exception 'FAIL: план предлагает диалог'; end if;
  if nxt->'next'->>'kind' = 'consolidate' and nxt->'next'->>'what' = 'conj' then raise exception 'FAIL: план предлагает спряжение'; end if;
  raise notice 'ok: сеанс (% слов), ответы, план: %', jsonb_array_length(items), nxt->'next'->>'kind';
end $$;

-- тест уровня A1 собирается из армянских слов
do $$
declare t jsonb;
begin
  t := public.start_level_test('A1');
  if t ? 'error' then raise exception 'FAIL: start_level_test: %', t; end if;
  if jsonb_array_length(t->'questions') < 20 then raise exception 'FAIL: мало вопросов теста: %', jsonb_array_length(t->'questions'); end if;
  raise notice 'ok: тест A1 (% вопросов)', jsonb_array_length(t->'questions');
end $$;

reset role;
-- ---------------------------------------------------------------- спряжение и склонение
do $$
declare v jsonb; n int;
begin
  select count(*) into n from public.words where word_class = 'verb' and canonical_id is null and morph is not null;
  if n < 450 then raise exception 'FAIL: переводы форм глаголов: %', n; end if;
  if (select morph->'ru'->'pres'->>0 from public.words where uz = 'գրել' and canonical_id is null limit 1) <> 'пишу' then raise exception 'FAIL: գրել — «пишу»'; end if;
  select count(*) into n from public.words where pos = 'n' and morph is not null;
  if n < 1000 then raise exception 'FAIL: существительные с падежными формами: %', n; end if;
  -- темы армянского курса: ничего не пройдено — потолок 1; пройдены все темы о глаголе (10–15) — 15
  if (public.morph_state('a1a1a1a1-0000-0000-0000-000000000001')->>'conj_cap')::int <> 1 then raise exception 'FAIL: conj_cap без тем'; end if;
  insert into public.course_progress (user_id, unit_id, read_at)
    select 'a1a1a1a1-0000-0000-0000-000000000001', id, now() from public.course_units where course_id = 'grammar' and source_no in (3,4,5,10,11,12,13,14,15,21,22,23,24,25,26)
  on conflict do nothing;
  v := public.morph_state('a1a1a1a1-0000-0000-0000-000000000001');
  if (v->>'conj_cap')::int <> 15 or (v->>'decl_cap')::int <> 15 then raise exception 'FAIL: потолки после тем: %', v; end if;
  raise notice 'ok: спряжение и склонение';
end $$;
set role authenticated;
set request.jwt.claim.sub = 'a1a1a1a1-0000-0000-0000-000000000001';
do $$
declare r jsonb;
begin
  r := public.get_verbs();
  if jsonb_array_length(r->'verbs') < 450 then raise exception 'FAIL: get_verbs %', jsonb_array_length(r->'verbs'); end if;
  r := public.get_nouns();
  if jsonb_array_length(r->'nouns') < 1000 then raise exception 'FAIL: get_nouns %', jsonb_array_length(r->'nouns'); end if;
end $$;
reset role;

delete from public.profiles where id = 'a1a1a1a1-0000-0000-0000-000000000001';
select 'armenian checks passed' as result;
