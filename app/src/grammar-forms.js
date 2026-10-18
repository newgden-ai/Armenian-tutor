// «Как образуется форма»: таблицы для тем грамматики — по каждому лицу и числу
// корень + суффикс + окончание (+ вспомогательный глагол) = форма, на глаголах -ել и -ալ спряжения.
// Формы берутся из hymorph.js, поэтому таблицы всегда совпадают с упражнениями.
import { t, getLang } from './i18n.js';
import { h } from './ui.js';
import { conjugate, decline, acceptedForms, PERSONS, CASES, withArticle } from './hymorph.js';

// тема грамматики (№ в армянском курсе) → какие таблицы показать
const TOPIC_TABLES = {
  10: [['pres', false], ['can', false]], 11: [['imperf', false]], 12: [['aorist', false]],
  13: [['perfect', false], ['pluperf', false], ['fut', false]], 14: [['pres', true], ['aorist', true], ['perfect', true]],
  15: [['imper', false], ['imper', true], ['subj', false], ['cond', false]],
  3: 'plural', 4: 'cases', 5: 'poss',
};
const EX = ['գրել', 'կարդալ'];                                   // спряжение на -ել и на -ալ
const EX_MORE = { aorist: ['գրել', 'կարդալ', 'տեսնել'] };          // + глагол с выпадающим -ն-
const PERS_RU = ['я', 'ты', 'он, она', 'мы', 'вы', 'они'];
const PERS_EN = ['I', 'you', 'he, she', 'we', 'you (pl.)', 'they'];
// личные окончания синтетических форм (самые длинные — первыми)
const ENDINGS = ['այինք', 'այիք', 'այիր', 'ային', 'եինք', 'եիք', 'եիր', 'եին', 'այի', 'եի', 'ինք', 'իք', 'իր', 'ին', 'անք', 'աք', 'ար', 'ավ', 'ան',
  'ենք', 'եք', 'ես', 'եմ', 'են', 'ամ', 'աս', 'եր', 'ի', 'ա'];
const AUXES = new Set(['եմ', 'ես', 'է', 'ենք', 'եք', 'են', 'էի', 'էիր', 'էր', 'էինք', 'էիք', 'էին', 'չեմ', 'չես', 'չի', 'չենք', 'չեք', 'չեն',
  'չէի', 'չէիր', 'չէր', 'չէինք', 'չէիք', 'չէին', 'թող', 'մի']);

const prefixLen = (a, b) => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; };

// գր + ում + եմ / չ + գր + եց + ի: разбор одного слова формы на части
function splitWord(word, stem) {
  let pre = '';
  let w = word;
  if (/^[չկ]/.test(w) && !stem.startsWith(w[0])) { pre = w[0]; w = w.slice(1); }
  const n = prefixLen(stem, w);
  if (!n) return [{ txt: word, cls: 'gf-suf' }];
  const root = w.slice(0, n);
  const rest = w.slice(n);
  const e = ENDINGS.find((x) => rest.endsWith(x) && rest.length >= x.length) || '';
  return [pre && { txt: pre, cls: 'gf-end' }, { txt: root, cls: 'gf-root' }, { txt: rest.slice(0, rest.length - e.length), cls: 'gf-suf' },
    { txt: e, cls: 'gf-end' }].filter((x) => x && x.txt);
}
function split(form, stem) {
  const f = acceptedForms(form)[0];
  return f.split(' ').flatMap((word) => (AUXES.has(word) || word === 'կարող' ? [{ txt: word, cls: 'gf-end' }] : splitWord(word, stem)));
}

const plus = () => h('span', { class: 'gf-plus' }, '+');
function formula(parts) {
  return parts.flatMap((p, i) => {
    const el = h('span', { class: p.cls }, p.txt);
    return i ? [plus(), el] : [el];
  });
}

function tenseTable(tenseId, neg) {
  const ex = EX_MORE[tenseId] || EX;
  const vs = ex.map((v) => conjugate(v));
  const tn = vs.map((c) => c.tenses.find((x) => x.id === tenseId));
  const name = getLang() === 'hy' ? tn[0].uz : getLang() === 'en' ? tn[0].en : tn[0].ru;
  const pers = getLang() === 'en' ? PERS_EN : PERS_RU;
  return h('div', { class: 'gf-card' },
    h('div', { class: 'gf-title' }, `${name}${neg ? ` · ${t('conjNeg').toLowerCase()}` : ''}`),
    h('div', { class: 'gf-sub muted' }, `${tn[0].uz} · ${tn[0].aff}`),
    h('div', { class: 'gf-legend' }, h('span', { class: 'gf-root' }, t('gfRoot')), plus(), h('span', { class: 'gf-suf' }, t('gfSuf')), plus(),
      h('span', { class: 'gf-end' }, t('gfEnd'))),
    h('table', { class: 'gf-table' },
      h('thead', {}, h('tr', {}, h('th', {}, t('gfPerson')), ...ex.map((v) => h('th', {}, v)))),
      h('tbody', {}, PERSONS.map((p, i) => h('tr', {},
        h('td', { class: 'gf-p' }, h('b', {}, p), h('div', { class: 'tiny muted' }, pers[i])),
        ...tn.map((x, k) => {
          const cell = (neg ? x.neg : x.pos)[i];
          return h('td', {}, h('div', { class: 'gf-formula' }, formula(split(cell, vs[k].stem))), h('div', { class: 'gf-result' }, cell));
        }))))));
}

const HINT = { nom: '—', gen: '-ի', dat: '-ի', acc: '= ուղղ.', abl: '-ից', ins: '-ով', loc: '-ում' };
function casesTable(kind) {
  const words = ['քաղաք', 'գիրք', 'տղա'];
  const ds = words.map((w) => decline(w));
  const col = kind === 'plural' ? 'pl' : 'sg';
  return h('div', { class: 'gf-card' },
    h('div', { class: 'gf-title' }, kind === 'plural' ? t('gfPluralTitle') : t('gfCasesTitle')),
    h('div', { class: 'gf-legend' }, h('span', { class: 'gf-root' }, t('gfWord')), plus(),
      kind === 'plural' ? [h('span', { class: 'gf-suf' }, '-եր / -ներ'), plus()] : null, h('span', { class: 'gf-end' }, t('gfCaseEnd'))),
    h('table', { class: 'gf-table' },
      h('thead', {}, h('tr', {}, h('th', {}, t('gfCase')), h('th', {}, t('gfEnding')), ...words.map((w) => h('th', {}, w)))),
      h('tbody', {}, CASES.map((cs, i) => h('tr', {},
        h('td', { class: 'gf-p' }, h('b', {}, cs.uz), h('div', { class: 'tiny muted' }, cs.q)),
        h('td', {}, h('span', { class: 'gf-end' }, HINT[cs.id])),
        ...ds.map((d, k) => {
          const c = d.columns.find((x) => x.id === col);
          const f = c.forms[i];
          let parts;
          if (kind === 'plural') {
            const pl = c.base;                                     // քաղաքներ, գրքեր
            const sufLen = pl.endsWith('ներ') ? 3 : 2;
            parts = [{ txt: pl.slice(0, -sufLen), cls: 'gf-root' }, { txt: pl.slice(-sufLen), cls: 'gf-suf' }, { txt: f.slice(pl.length), cls: 'gf-end' }];
          } else {
            const n = prefixLen(words[k], f);
            parts = [{ txt: f.slice(0, n), cls: 'gf-root' }, { txt: f.slice(n), cls: 'gf-end' }];
          }
          return h('td', {}, h('div', { class: 'gf-formula' }, formula(parts.filter((p) => p.txt))), h('div', { class: 'gf-result' }, f));
        }))))),
    kind === 'plural' ? h('p', { class: 'tiny muted' }, t('gfPluralNote')) : h('p', { class: 'tiny muted' }, t('gfCasesNote')));
}

// Артикли и «мой / твой»: գիրքս, գիրքդ, նրա գիրքը, մեր գիրքը …
function possTable() {
  const words = ['գիրք', 'տղա', 'տուն'];
  const PRON = [null, null, 'նրա', 'մեր', 'ձեր', 'նրանց'];
  const pers = getLang() === 'en' ? ['my', 'your', 'his/her', 'our', 'your (pl.)', 'their'] : ['мой', 'твой', 'его, её', 'наш', 'ваш', 'их'];
  const ends = ['-ս', '-դ', 'նրա … -ը / -ն', 'մեր … -ը / -ն', 'ձեր … -ը / -ն', 'նրանց … -ը / -ն'];
  const cell = (w, i) => (i === 0 ? w + 'ս' : i === 1 ? w + 'դ' : `${PRON[i]} ${withArticle(w)}`);
  return h('div', { class: 'gf-card' },
    h('div', { class: 'gf-title' }, t('gfPossTitle')),
    h('div', { class: 'gf-legend' }, h('span', { class: 'gf-root' }, t('gfWord')), plus(), h('span', { class: 'gf-end' }, t('gfPossEnd'))),
    h('table', { class: 'gf-table' },
      h('thead', {}, h('tr', {}, h('th', {}, t('gfPerson')), h('th', {}, t('gfEnding')), ...words.map((w) => h('th', {}, w)))),
      h('tbody', {}, PERSONS.map((p, i) => h('tr', {},
        h('td', { class: 'gf-p' }, h('b', {}, p), h('div', { class: 'tiny muted' }, pers[i])),
        h('td', {}, h('span', { class: 'gf-end' }, ends[i])),
        ...words.map((w) => h('td', {}, h('div', { class: 'gf-result' }, cell(w, i)))))))),
    h('p', { class: 'tiny muted' }, t('gfPossNote')),
    // определённый артикль в падежах
    h('table', { class: 'gf-table' },
      h('thead', {}, h('tr', {}, h('th', {}, t('gfCase')), ...words.map((w) => h('th', {}, w)))),
      h('tbody', {}, CASES.map((cs, i) => h('tr', {},
        h('td', { class: 'gf-p' }, h('b', {}, cs.uz)),
        ...words.map((w) => h('td', {}, h('div', { class: 'gf-result' }, decline(w).columns.find((c) => c.id === 'def').forms[i]))))))));
}

// Блок для страницы темы грамматики (или null, если у темы нет таблиц)
export function grammarFormsBlock(unit) {
  if (!unit || unit.course_id !== 'grammar') return null;
  const spec = TOPIC_TABLES[unit.n];
  if (!spec) return null;
  let tables;
  if (spec === 'cases' || spec === 'plural') tables = [casesTable(spec)];
  else if (spec === 'poss') tables = [possTable()];
  else tables = spec.map(([id, neg]) => tenseTable(id, neg));
  return h('div', {}, h('h2', {}, t('gfTitle')), h('p', { class: 'small muted' }, t('gfHint')), tables);
}
