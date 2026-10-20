// Общее для спряжения и склонения: какие времена и падежи открыты (по пройденным темам грамматики),
// корень таблицы, проверка ответа «дописать суффикс и окончание», шторка «Нужно исправить».
import { rpc, notifyFlags } from './api.js';
import { t } from './i18n.js';
import { h, sheet, haptic } from './ui.js';
import { icon } from './icons.js';
import { acceptedForms } from './hymorph.js';
import { keyUz } from './normalize.js';

// Тема грамматики (№ в армянском курсе), после которой открывается время. 14 — отрицание (չ-, մի).
export const TENSE_TOPIC = {
  pres: 10, imperf: 11, aorist: 12, perfect: 13, pluperf: 13, imper: 15,
  fut: 21, fut_past: 21, cond: 21, subj: 22, subj_past: 23, cond_past: 23, can: 24,
};
export const NEG_TOPIC = 14;
// Склонение: падежи — тема 4, множественное число — 3, артикли и притяжательные формы — 5
export const DECL_TOPIC = { sg: 4, pl: 3, poss: 5 };

export function openTenses(state) {
  const passed = new Set((state && state.grammar) || []);
  const open = Object.keys(TENSE_TOPIC).filter((id) => passed.has(TENSE_TOPIC[id]));
  return { tenses: open.length ? open : ['pres'], neg: passed.has(NEG_TOPIC), passed, none: !open.length };
}
export function openColumns(state) {
  const passed = new Set((state && state.grammar) || []);
  const cols = ['sg'];
  if (passed.has(DECL_TOPIC.poss)) cols.push('def');
  if (passed.has(DECL_TOPIC.pl)) cols.push('pl');
  if (passed.has(DECL_TOPIC.poss)) cols.push('poss0', 'poss1');
  return { cols, none: !passed.has(DECL_TOPIC.sg) };
}

// Общий корень всех форм таблицы (и основы): գր (գրում եմ, գրեցի …), գ (գիրք → գրքի)
export function commonRoot(forms, base) {
  const all = [base, ...forms.flatMap((f) => acceptedForms(f))].filter((x) => x != null);
  let root = all[0] || '';
  for (const f of all) {
    let i = 0;
    while (i < root.length && i < f.length && root[i] === f[i]) i++;
    root = root.slice(0, i);
  }
  // не обрываем «ու» посередине
  if (/ո$/.test(root) && all.some((f) => f.slice(root.length, root.length + 1) === 'ւ')) root = root.slice(0, -1);
  return root;
}

// Ответ в клетке: можно написать только окончание (после корня) или всю форму
export function cellOk(answer, cell, root, extra = []) {
  // «ես գրում եմ» — тоже верно: личное (или притяжательное) местоимение перед формой не мешает
  const a = keyUz(answer || '').replace(/^(ես|դու|նա|մենք|դուք|նրանք|իմ|քո|նրա|մեր|ձեր|նրանց) (?=\S)/, '');
  const variants = [...acceptedForms(cell), ...extra.flatMap((x) => (x ? acceptedForms(x) : []))];
  return variants.some((v) => {
    const k = keyUz(v);
    if (a === k) return true;
    return v.startsWith(root) && a === keyUz(v.slice(root.length));
  });
}

// Шторка «Нужно исправить»: вся таблица или одна строка + короткий комментарий → администратору
export function reportSheet({ word, kind, item, title, rows }) {
  let person = null;
  const chips = h('div', { class: 'segmented scroll wrap' });
  const drawChips = () => chips.replaceChildren(
    h('button', { type: 'button', class: person === null ? 'active' : '', onClick: () => { person = null; drawChips(); } }, t('repWhole')),
    ...rows.map((r, i) => h('button', { type: 'button', class: person === i ? 'active' : '', onClick: () => { person = i; drawChips(); } }, r.label)));
  drawChips();
  const ta = h('textarea', { class: 'answer-input report-ta', rows: '3', maxlength: '500', placeholder: t('repPlaceholder') });
  const msg = h('div', { class: 'small muted' });
  const send = h('button', { class: 'btn btn-big', type: 'button', onClick: async () => {
    const comment = ta.value.trim();
    if (!comment) { ta.focus(); return; }
    send.disabled = true;
    const row = person === null ? null : rows[person];
    const res = await rpc('report_form', { p_word: word.id, p_kind: kind, p_item: item, p_person: person,
      p_form: row ? row.text : rows.map((r) => r.text).join('; ').slice(0, 300), p_comment: comment }).catch(() => ({ error: 'net' }));
    if (res && res.ok) {
      haptic('success');
      notifyFlags();
      close();
    } else {
      send.disabled = false;
      msg.textContent = res && res.error === 'too_many' ? t('repTooMany') : t('repFailed');
    }
  } }, t('repSend'));
  const close = sheet(
    h('div', { class: 'label' }, t('repTitle')),
    h('h3', {}, `${word.uz} · ${title}`),
    chips, ta, msg, send,
    h('p', { class: 'tiny muted center-text' }, t('repHint')));
  setTimeout(() => ta.focus(), 100);
}

export const flagButton = (onClick) =>
  h('button', { class: 'flag-mini', type: 'button', title: t('repTitle'), 'aria-label': t('repTitle'), onClick: (e) => { e.stopPropagation(); onClick(); } },
    icon('flag'));

// Перерисовка без скачков: сохраняем прокрутку страницы, горизонтальную прокрутку вкладок и высоту блока
export function stableRedraw(box, build) {
  return () => {
    const bars = [...box.querySelectorAll('.segmented.scroll')].map((b) => b.scrollLeft);
    const y = window.scrollY;
    if (box.offsetHeight) box.style.minHeight = `${Math.max(box.offsetHeight, parseInt(box.style.minHeight || '0', 10))}px`;
    box.replaceChildren(build());
    box.querySelectorAll('.segmented.scroll').forEach((b, i) => { if (bars[i] != null) b.scrollLeft = bars[i]; });
    window.scrollTo(0, y);
    // высоту не уменьшаем, пока открыт экран: короткая вкладка не «утягивает» страницу вверх
    requestAnimationFrame(() => { window.scrollTo(0, y); });
  };
}

