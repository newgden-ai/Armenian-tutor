-- Армянская версия (Armenian Tutor): то, чего нет в узбекской схеме.
-- Остальные языковые отличия внесены прямо в копии миграций (key_uz, ui_lang 'hy', часовой пояс Еревана,
-- армянские буквы в регулярных выражениях) — их видно в истории репозитория по сравнению с эталоном.

-- ---------------------------------------------------------------- транскрипция слова
-- Латиница и кириллица с ударением (data/source/vocabulary.xlsx). Приложение показывает транскрипцию,
-- вычисляя её на устройстве (app/src/translit.js); в базе — для отчётов и будущего объединения приложений.
alter table public.words add column if not exists tr_lat text;
alter table public.words add column if not exists tr_cyr text;

-- ---------------------------------------------------------------- цены в драмах
-- Колонка price_uzs оставлена с узбекским именем (схема общая) и хранит цену в местной валюте — драмах (֏).
-- ПРЕДЛОЖЕНИЕ (меняется в Table Editor → plans): звёзды и доллары как в узбекской версии,
-- драмы ≈ доллары × 390, округление до 100 ֏. Групповая подписка на 3 человек — ×3 и −15%.
update public.plans p set price_uzs = v.amd
from (values
  ('basic', 1,  3300), ('basic', 3,  9000), ('basic', 6, 16800), ('basic', 12, 31600),
  ('advanced', 1, 6600), ('advanced', 3, 17900), ('advanced', 6, 33500), ('advanced', 12, 63200)
) as v(tier, months, amd)
where p.tier = v.tier and p.months = v.months and p.seats = 1;

update public.plans g set price_uzs = (round(p.price_uzs * 3 * 0.85 / 100.0) * 100)::int
  from public.plans p
 where g.seats = 3 and p.seats = 1 and p.tier = g.tier and p.months = g.months;

-- ---------------------------------------------------------------- разделы, которых пока нет
-- Спряжение, склонение, «Как образуется», диалоги и разговорная речь в узбекской версии построены на
-- узбекской грамматике. В армянской они скрыты в приложении (app/src/features.js) до своих армянских версий.
insert into public.app_config (key, value, note) values
  ('target_language', '"hy"', 'Изучаемый язык этой копии приложения (hy — армянский)')
on conflict (key) do nothing;
