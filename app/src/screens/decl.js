// Склонение существительных: список по уровням, таблица падежей (ед., мн., притяжательные) с подсказками
// перевода и упражнение «допишите окончания» со своим уровнем (decl). Столбцы открываются по темам
// грамматики: падежи (4), множественное число (3), артикли и притяжательные формы (5).
import { rpc } from '../api.js';
import { t, getLang } from '../i18n.js';
import { h, mount, spinner, sheet, haptic } from '../ui.js';
import { icon } from '../icons.js';
import { decline, CASES } from '../hymorph.js';
import { hyKeyboard } from '../hykeyboard.js';
import { CASE_MEANING, POSS_MEANING } from '../verbtr.js';
import { displayUz } from '../normalize.js';
import { openColumns, commonRoot, cellOk, reportSheet, flagButton, stableRedraw } from '../morph.js';

const CEFRS = ['A1', 'A2', 'B1', 'B2'];
const CASE_SHORT = ['Ուղղ.', 'Սեռ.', 'Տր.', 'Հայց.', 'Բաց.', 'Գործ.', 'Ներգ.'];
const COL_LABEL = { sg: () => t('declSg'), def: () => t('declDef'), pl: () => t('declPl'), poss0: () => 'իմ (-ս)', poss1: () => 'քո (-դ)' };
const meaning = (v) => (getLang() === 'en' && v.e ? v.e : v.r);

// Подсказка перевода для строки (падежа) столбца. Русские формы — words.morph.ru: sg/pl = им, род, вин, дат, пр
const POSS_RU = { m: ['мой', 'твой'], f: ['моя', 'твоя'], n: ['моё', 'твоё'] };
export function caseHint(morph, enWord, colId, caseIdx) {
  const L = getLang() === 'en' ? 'en' : 'ru';
  const cs = CASES[caseIdx].id;
  if (L === 'en') {
    const w = enWord ? String(enWord).split(/[,;(]/)[0].trim() : '';
    if (!w) return CASE_MEANING.en[cs];
    const base = colId === 'sg' ? `a ${w}` : colId === 'def' ? `the ${w}` : colId === 'pl' ? `${w}s` : `${POSS_MEANING.en[Number(colId.slice(4))]} ${w}`;
    return { nom: base, gen: `of ${base}`, dat: `to ${base}`, acc: `${base} (object)`, abl: `from ${base}`, ins: `with / by ${base}`, loc: `in ${base}` }[cs];
  }
  const r = morph && morph.ru;
  if (!r) return CASE_MEANING.ru[cs];
  const f = colId === 'pl' ? r.pl : r.sg;     // им, род, вин, дат, пр
  if (colId === 'poss0' || colId === 'poss1') {
    const pron = (POSS_RU[r.g] || POSS_RU.m)[Number(colId.slice(4))];
    return caseIdx === 0 ? `${pron} ${f[0]}` : `${CASE_MEANING.ru[cs].split(':')[1].trim()} (${pron} ${f[0]})`;
  }
  return { nom: f[0], gen: `${f[1]} (чей? чего?)`, dat: `${f[3]} (кому? чему?)`, acc: f[2], abl: `из / от ${f[1]}`,
    ins: `(чем? с кем?) ${f[0]}`, loc: `в ${f[4]}` }[cs];
}

function declTable(noun, morph, col) {
  const d = decline(noun.uz);
  const c = d.columns.find((x) => x.id === col);
  const rows = CASES.map((cs, i) => ({ label: cs.uz, text: `${c.forms[i]} — ${caseHint(morph, noun.en, col, i)}` }));
  return h('div', { class: 'conj-card decl-card' },
    flagButton(() => reportSheet({ word: noun, kind: 'decl', item: col, title: COL_LABEL[col](), rows })),
    CASES.map((cs, i) => h('div', { class: 'conj-row' },
      h('span', { class: 'conj-p' }, h('span', {}, cs.uz), h('span', { class: 'tiny muted' }, ` ${cs.q}`)),
      h('div', { class: 'conj-cell right' }, h('b', {}, c.forms[i]), h('div', { class: 'conj-tr' }, caseHint(morph, noun.en, col, i))))),
    h('p', { class: 'tiny muted' }, t('declNote')));
}

function colSeg(cols, cur, onPick) {
  return h('div', { class: 'segmented scroll' }, cols.map((id) => h('button', { type: 'button', class: id === cur ? 'active' : '',
    onClick: () => { haptic(); onPick(id); } }, COL_LABEL[id]())));
}

// Шторка со склонением (из карточки слова и словаря)
export async function declSheet(noun, app) {
  const d = decline(noun.uz);
  if (!d) return;
  const morph = (await rpc('get_morph', { p_ids: [noun.id] }).catch(() => ({})))[noun.id];
  let col = 'sg';
  const box = h('div', {});
  const draw = stableRedraw(box, () => h('div', {}, colSeg(d.columns.map((x) => x.id), col, (c) => { if (c === col) return; col = c; draw(); }), declTable(noun, morph, col)));
  draw();
  const close = sheet(h('div', { class: 'label' }, t('declTitle')), h('h3', {}, noun.uz, h('span', { class: 'muted' }, ` — ${noun.ru}`)),
    app ? h('button', { class: 'btn btn-big', type: 'button', onClick: () => { close(); app.go('decl', { noun }); } }, icon('practice'), t('declOpenNoun')) : null,
    box);
}

// ---------------------------------------------------------------- экран «Склонение»
export async function renderDecl(app, params = {}) {
  if (params.noun) return renderNoun(app, params.noun);
  if (params.train) return declTraining(app, params.train);
  mount(spinner(t('loading')));
  const data = await rpc('get_nouns');
  const nouns = (data.nouns || []).filter((n) => decline(n.u));
  const open = openColumns(data.state || {});
  let q = '';
  const list = h('div', {});
  const pill = (label, value, cls = '') => h('span', { class: `lvl-pill ${cls} ${value == null ? 'empty' : ''}` }, `${label} ${value == null ? '—' : value}`);
  const draw = () => {
    const ql = q.toLowerCase();
    const rows = q ? nouns.filter((v) => v.u.toLowerCase().includes(ql) || (v.r || '').toLowerCase().includes(ql) || (v.e || '').toLowerCase().includes(ql)) : nouns;
    list.replaceChildren(...CEFRS.map((cefr) => {
      const lv = rows.filter((v) => v.c === cefr).slice(0, q ? 200 : 400);
      if (!lv.length) return null;
      return h('div', {},
        h('div', { class: 'lv-head' }, h('b', {}, cefr), h('span', { class: 'muted small' }, t('nNouns', rows.filter((v) => v.c === cefr).length))),
        h('div', { class: 'card dict-card' }, lv.map((v) => h('button', { class: 'dict-row', type: 'button',
          onClick: () => app.go('decl', { noun: { id: v.i, uz: v.u, ru: meaning(v), en: v.e } }) },
          h('div', { class: 'dict-main' }, h('b', {}, v.u), h('div', { class: 'small muted' }, meaning(v)),
            v.l != null || v.d != null ? h('div', { class: 'pill-row' }, pill(t('lvWord'), v.l), pill(t('lvDecl'), v.d, 'gold')) : null),
          icon('chevron', 'ic chev')))));
    }));
  };
  const search = h('input', { class: 'answer-input dict-search', type: 'search', placeholder: t('dictSearch'),
    onInput: () => { q = search.value.trim(); draw(); } });
  draw();
  const mine = nouns.filter((v) => v.l != null)
    .sort((a, b) => (b.dd ? 1 : 0) - (a.dd ? 1 : 0) || (a.d ?? -1) - (b.d ?? -1))
    .slice(0, 3).map((v) => ({ id: v.i, uz: v.u, ru: meaning(v), en: v.e }));
  mount(h('div', { class: 'screen' },
    h('h1', {}, t('declTitle')),
    h('p', { class: 'muted small' }, t('declSub')),
    h('div', { class: 'card note' }, icon('grammar'),
      h('div', { class: 'small' }, open.none ? t('declOpenNone') : t('declOpenCols', open.cols.length > 2, open.cols.includes('pl')),
        h('div', { class: 'tiny muted' }, t('declCap', (data.state && data.state.decl_cap) || 1)))),
    h('button', { class: 'btn btn-big', type: 'button', onClick: () => app.go('decl', { train: mine }) }, icon('practice'), t('trainDecl')),
    search, list));
}

async function renderNoun(app, noun) {
  mount(spinner(t('loading')));
  const [morphs, data] = await Promise.all([rpc('get_morph', { p_ids: [noun.id] }).catch(() => ({})), rpc('get_nouns').catch(() => ({}))]);
  const morph = morphs[noun.id];
  const me = (data.nouns || []).find((v) => v.i === noun.id) || {};
  const d = decline(noun.uz);
  let col = 'sg';
  const box = h('div', {});
  const draw = stableRedraw(box, () => h('div', {}, colSeg(d.columns.map((x) => x.id), col, (c) => { if (c === col) return; col = c; draw(); }), declTable(noun, morph, col)));
  draw();
  mount(h('div', { class: 'screen' },
    h('div', { class: 'label' }, t('declTitle')),
    h('h1', {}, noun.uz), h('p', { class: 'muted' }, noun.ru),
    h('div', { class: 'pill-row' },
      h('span', { class: `lvl-pill ${me.l == null ? 'empty' : ''}` }, `${t('lvWord')} ${me.l ?? '—'}`),
      h('span', { class: `lvl-pill gold ${me.d == null ? 'empty' : ''}` }, `${t('lvDecl')} ${me.d ?? '—'}`)),
    h('button', { class: 'btn btn-big', type: 'button', onClick: () => app.go('decl', { train: [noun] }) }, icon('practice'), t('trainDeclThis')),
    box));
}

// ---------------------------------------------------------------- упражнение: допишите окончания
async function declTraining(app, nouns) {
  mount(spinner(t('loading')));
  const data = await rpc('get_nouns');
  const open = openColumns(data.state || {});
  const list0 = (nouns || []).filter((n) => decline(n.uz));
  if (!list0.length) {
    mount(h('div', { class: 'screen' }, h('div', { class: 'card empty' }, icon('practice'), h('p', {}, t('declNoNouns')),
      h('button', { class: 'btn', onClick: () => app.back() }, t('back')))));
    return;
  }
  const morphs = await rpc('get_morph', { p_ids: list0.map((n) => n.id) }).catch(() => ({}));
  const tables = [];
  for (const n of list0) {
    let cols = open.cols;
    if (cols.length > 3) cols = ['sg', ...cols.filter((c) => c !== 'sg').sort(() => Math.random() - 0.5).slice(0, list0.length > 1 ? 1 : 3)];
    for (const c of cols) tables.push({ noun: n, col: c });
  }
  let i = 0;
  let score = 0;
  let total = 0;
  const results = {};
  const show = async () => {
    if (i >= tables.length) {
      const levels = [];
      for (const [id, r] of Object.entries(results)) {
        const res = await rpc('answer_morph', { p_word: Number(id), p_kind: 'decl', p_ok: r.ok, p_total: r.total }).catch(() => null);
        if (res && res.ok) levels.push(`${r.uz}: ${t('levelChange', res.prev, res.level)}`);
      }
      haptic('success');
      mount(h('div', { class: 'screen' },
        h('div', { class: 'card result-hero' }, h('div', { class: 'result-icon ok' }, icon('trophy')),
          h('h1', {}, t('tableDone')), h('div', { class: 'big' }, `${score}/${total}`),
          h('div', { class: 'small' }, levels.map((l) => h('div', {}, l)))),
        h('button', { class: 'btn btn-big', onClick: () => declTraining(app, nouns) }, t('again')),
        h('button', { class: 'btn btn-secondary', onClick: () => app.back() }, t('back'))));
      return;
    }
    const task = tables[i];
    const d = decline(task.noun.uz);
    const c = d.columns.find((x) => x.id === task.col);
    const root = commonRoot(c.forms, task.noun.uz);
    const morph = morphs[task.noun.id];
    let checked = false;
    // именительный падеж показан готовым — спрашиваем остальные 6
    const inputs = c.forms.map((f, k) => (k === 0 ? null : h('input', { class: 'tbl-inp', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: '…' })));
    const ins = inputs.filter(Boolean);
    ins.forEach((inp, k) => inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { if (ins[k + 1]) ins[k + 1].focus(); else check(); } }));
    const fixes = c.forms.map(() => h('div', { class: 'tbl-fix' }));
    const fb = h('div', {});
    const check = () => {
      if (checked) { i++; show(); return; }
      checked = true;
      let ok = 0;
      inputs.forEach((inp, k) => {
        if (!inp) return;
        const good = cellOk(displayUz(inp.value.trim()), c.forms[k], root);
        inp.classList.add(good ? 'ok' : 'bad'); inp.disabled = true;
        if (good) ok++; else fixes[k].textContent = `→ ${c.forms[k]}`;
      });
      score += ok; total += ins.length;
      const r = results[task.noun.id] || (results[task.noun.id] = { ok: 0, total: 0, uz: task.noun.uz });
      r.ok += ok; r.total += ins.length;
      haptic(ok === ins.length ? 'success' : 'error');
      fb.replaceChildren(h('div', { class: `feedback show ${ok >= ins.length - 1 ? 'good' : 'bad'}` }, h('b', {}, t('tableScore', ok, ins.length))));
      btn.textContent = t('next');
    };
    const btn = h('button', { class: 'btn btn-big', type: 'button', onClick: check }, t('check'));
    const rows = CASES.map((cs, k) => ({ label: cs.uz, text: `${c.forms[k]} — ${caseHint(morph, task.noun.en, task.col, k)}` }));
    mount(h('div', { class: 'screen session' },
      h('div', { class: 'session-top' },
        h('div', { class: 'progress' }, h('div', { class: 'bar', style: { width: `${Math.round((i / tables.length) * 100)}%` } })),
        h('span', { class: 'counter' }, `${i + 1}/${tables.length}`)),
      h('div', { class: 'label' }, t('declTask')),
      h('div', { class: 'card ex-card' },
        flagButton(() => reportSheet({ word: task.noun, kind: 'decl', item: task.col, title: COL_LABEL[task.col](), rows })),
        h('div', { class: 'prompt' },
          h('div', { class: 'word-uz' }, task.noun.uz), h('div', { class: 'muted' }, task.noun.ru),
          h('div', { class: 'conj-ask' }, h('span', { class: 'chip accent' }, COL_LABEL[task.col]()))),
        h('div', { class: 'tbl decl-tbl' }, c.forms.map((f, k) => h('div', { class: 'tbl-row' },
          h('span', { class: 'conj-p decl-p' }, CASE_SHORT[k]),
          k === 0 ? h('b', { class: 'tbl-root' }, f) : h('b', { class: 'tbl-root' }, root),
          inputs[k] || h('span', {}),
          fixes[k],
          h('div', { class: 'conj-tr tbl-tr' }, caseHint(morph, task.noun.en, task.col, k))))),
        hyKeyboard(ins),
        fb, btn),
      h('p', { class: 'tiny muted' }, t('tableHint'))));
    setTimeout(() => ins[0].focus(), 50);
  };
  show();
}
