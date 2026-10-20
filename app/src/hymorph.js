// Армянская морфология (восточноармянский литературный язык): спряжение глаголов и склонение имён.
// API совпадает с узбекским uzmorph.js: conjugate(), decline(), acceptedForms(), PERSONS, CASES, isVerb(), verbStem().
// Формы строятся из инфинитива (-ել / -ալ) и трёх основ:
//   основа настоящего (գր-ել → գր), перфективная основа (կարդ-ալ → կարդաց, տես-նել → տես, վերց-նել → վերցր)
//   и тип аориста. Неправильные глаголы (գալ, տալ, լինել, ուտել, անել, տանել …) — по списку.
// Составные глаголы («հաց ուտել», «լաց լինել») спрягаются по последнему слову; вспомогательный глагол
// встаёт после именной части: «լաց եմ լինում», «լաց չեմ լինում».

const PERSONS = ['ես', 'դու', 'նա', 'մենք', 'դուք', 'նրանք'];
export { PERSONS };

const AUX = ['եմ', 'ես', 'է', 'ենք', 'եք', 'են'];
const AUX_NEG = ['չեմ', 'չես', 'չի', 'չենք', 'չեք', 'չեն'];
const PAST = ['էի', 'էիր', 'էր', 'էինք', 'էիք', 'էին'];
const PAST_NEG = ['չէի', 'չէիր', 'չէր', 'չէինք', 'չէիք', 'չէին'];
const KAROX = ['կարող եմ', 'կարող ես', 'կարող է', 'կարող ենք', 'կարող եք', 'կարող են'];
const KAROX_NEG = ['չեմ կարող', 'չես կարող', 'չի կարող', 'չենք կարող', 'չեք կարող', 'չեն կարող'];

// окончания
const AOR_E = ['եցի', 'եցիր', 'եց', 'եցինք', 'եցիք', 'եցին'];     // գրեցի
const AOR_A = ['ացի', 'ացիր', 'աց', 'ացինք', 'ացիք', 'ացին'];     // կարդացի
const AOR_AV = ['ա', 'ար', 'ավ', 'անք', 'աք', 'ան'];               // տեսա, հասկացա, եկա
const AOR_I = ['ի', 'իր', 'եց', 'ինք', 'իք', 'ին'];                // վերցրի, դրի … (3 л. — վերցրեց)
const SUBJ_E = ['եմ', 'ես', 'ի', 'ենք', 'եք', 'են'];
const SUBJ_A = ['ամ', 'աս', 'ա', 'անք', 'աք', 'ան'];
const SUBJP_E = ['եի', 'եիր', 'եր', 'եինք', 'եիք', 'եին'];
const SUBJP_A = ['այի', 'այիր', 'ար', 'այինք', 'այիք', 'ային'];

// Неправильные и особые глаголы: pres — основа причастия на -ում (или готовое причастие),
// perf — перфективная основа (+ել, +ած), aor — 6 форм аориста, imp — [ед., мн.], neg — отрицательное причастие
const IRR = {
  'գալ': { presPart: 'գալիս', perf: 'եկ', aor: AOR_AV.map((e) => 'եկ' + e), imp: ['արի', 'եկեք'], proh: ['մի արի', 'մի եկեք'], ogh: 'եկող' },
  'տալ': { presPart: 'տալիս', perf: 'տվ', aor: AOR_E.map((e) => 'տվ' + e), imp: ['տուր', 'տվեք'], proh: ['մի տուր', 'մի տաք'], ogh: 'տվող' },
  'լալ': { presPart: 'լալիս', perf: 'լաց', aor: AOR_I.map((e, i) => (i === 2 ? 'լաց' : 'լաց' + e)), imp: ['լաց', 'լացեք'], ogh: 'լացող' },
  'լինել': { perf: 'եղ', aor: AOR_AV.map((e) => 'եղ' + e), imp: ['եղիր', 'եղեք'], proh: ['մի եղիր', 'մի եղեք'] },
  'ուտել': { perf: 'կեր', aor: AOR_AV.map((e) => 'կեր' + e), imp: ['կեր', 'կերեք'] },
  'անել': { perf: 'ար', aor: AOR_E.map((e) => 'ար' + e), imp: ['արա', 'արեք'], proh: ['մի արա', 'մի անեք'] },
  'տանել': { perf: 'տար', aor: AOR_AV.map((e) => 'տար' + e), imp: ['տար', 'տարեք'] },
  'ասել': { perf: 'աս', aor: AOR_A.map((e) => 'աս' + e), imp: ['ասա', 'ասեք'], proh: ['մի ասա', 'մի ասեք'], ogh: 'ասող' },
  'բերել': { imp: ['բեր', 'բերեք'] },
  'տեսնել': { imp: ['տես', 'տեսեք'] },
  'դնել': { perf: 'դր', aor: AOR_E.map((e) => 'դր' + e), imp: ['դիր', 'դրեք'] },
  'ներդնել': { perf: 'ներդր', aor: AOR_E.map((e) => 'ներդր' + e), imp: ['ներդիր', 'ներդրեք'] },
  'առնել': { imp: ['առ', 'առեք'] },
  'կենալ': { perf: 'կաց', aor: AOR_AV.map((e) => 'կաց' + e), imp: ['կաց', 'կացեք'], ogh: 'կացող' },
  'վերադառնալ': { perf: 'վերադարձ', aor: AOR_AV.map((e) => 'վերադարձ' + e), imp: ['վերադարձիր', 'վերադարձեք'] },
  'դառնալ': { perf: 'դարձ', aor: AOR_AV.map((e) => 'դարձ' + e), imp: ['դարձիր', 'դարձեք'] },
  'լվանալ': { perf: 'լվաց', aor: AOR_I.map((e, i) => (i === 2 ? 'լվաց' : 'լվաց' + e)), imp: ['լվա', 'լվացեք'], type: 'a' },
};
// Глаголы с суффиксом -ն- / -չ- в настоящем, который выпадает в аористе: տեսնել → տեսա, թռչել → թռա
const INFIX = new Set(['տեսնել', 'հասնել', 'իջնել', 'մտնել', 'գտնել', 'ընկնել', 'անցնել', 'առնել', 'թռչել', 'դիպչել', 'սառչել', 'փախչել', 'կպչել']);

// Разбор инфинитива: «հաց ուտել» → { prefix: 'հաց ', stem: 'ուտ', inf: 'ուտել', conj: 'e' }
export function verbStem(infinitive) {
  const s = String(infinitive || '').trim();
  const m = s.match(/^(.*?)(\S+)$/);
  if (!m) return null;
  const word = m[2];
  const e = word.match(/^([ա-և]+)ել$/);
  const a = word.match(/^([ա-և]+)ալ$/);
  if (!e && !a) return null;
  if (word === 'գալ' || word === 'տալ' || word === 'լալ') return { prefix: m[1], stem: word.slice(0, 1), inf: word, conj: 'a', full: s };
  return { prefix: m[1], stem: (e || a)[1], inf: word, conj: e ? 'e' : 'a', full: s };
}
export const isVerb = (uz) => Boolean(verbStem(uz));

// Основы и тип аориста глагола (последнего слова)
function analyze(v) {
  const { inf, stem, conj } = v;
  const irr = IRR[inf] || IRR[Object.keys(IRR).find((k) => inf.endsWith(k) && k.length >= 4 && inf !== k && /^(վեր|ներ|հետ)/.test(inf.slice(0, inf.length - k.length))) || ''] || null;
  let perf;
  let aor;
  let imp;
  let type = conj;
  if (conj === 'e' && /(ցն|արձն)$/.test(stem) && !INFIX.has(inf)) {     // վերցնել → վերցր-, վերադարձնել → վերադարձր- (но հանձնել — правильный)
    perf = stem.slice(0, -1) + 'ր';
    aor = AOR_I.map((x) => perf + x);
    imp = [perf + 'ու', perf + 'եք'];
  } else if (conj === 'e' && INFIX.has(inf)) {                              // տեսնել → տես-ա
    perf = stem.slice(0, -1);
    aor = AOR_AV.map((x) => perf + x);
    imp = [perf + 'իր', perf + 'եք'];
  } else if (conj === 'a' && /(ան|են)$/.test(stem) && stem.length > 2) {   // հասկանալ → հասկաց-ա, մոտենալ → մոտեց-ա
    perf = stem.slice(0, -1) + 'ց';
    aor = AOR_AV.map((x) => perf + x);
    imp = [perf + 'իր', perf + 'եք'];
  } else if (conj === 'e') {
    perf = stem;
    aor = AOR_E.map((x) => stem + x);
    imp = [stem + 'իր', stem + 'եք'];
  } else {
    perf = stem + 'աց';
    aor = AOR_A.map((x) => stem + x);
    imp = [stem + 'ա', stem + 'ացեք'];
  }
  if (irr) {
    const pre = inf.slice(0, inf.length - (IRR[inf] ? inf.length : Object.keys(IRR).find((k) => irr === IRR[k]).length));
    if (irr.perf) perf = pre + irr.perf;
    if (irr.aor) aor = irr.aor.map((x) => pre + x);
    if (irr.imp) imp = irr.imp.map((x) => pre + x);
    if (irr.type) type = irr.type;
  }
  const presPart = (irr && irr.presPart) || stem + 'ում';
  const subj = (conj === 'e' ? SUBJ_E : SUBJ_A).map((x) => stem + x);
  const subjPast = (conj === 'e' ? SUBJP_E : SUBJP_A).map((x) => stem + x);
  const negPart = stem + (conj === 'e' ? 'ի' : 'ա');
  const proh = (irr && irr.proh) || (conj === 'e' ? ['մի ' + stem + 'իր', 'մի ' + stem + 'եք'] : ['մի ' + stem + 'ա', 'մի ' + stem + 'աք']);
  const perfPart = perf + 'ել';
  const ogh = (irr && irr.ogh) || (conj === 'e' ? stem + 'ող' : perf + 'ող');
  return { presPart, perf, perfPart, aor, imp, proh, subj, subjPast, negPart, ogh, type, futPart: inf + 'ու' };
}

// Приставка (именная часть составного глагола) + форма. «սիրտը» перед гласным → «սիրտն»: սիրտն եմ կոտրում
const joinPre = (prefix, rest) => {
  if (!prefix) return rest;
  const p = /ը $/.test(prefix) && /^[աեէըիոօու]/.test(rest) ? prefix.replace(/ը $/, 'ն ') : prefix;
  return p + rest;
};
// аналитическая форма: причастие + вспомогательный глагол; с приставкой — вспомогательный после неё
const analytic = (prefix, part, aux, neg) => (prefix ? joinPre(prefix, `${aux} ${part}`) : neg ? `${aux} ${part}` : `${part} ${aux}`);
const neg = (f) => 'չ' + f;
// կ- условного наклонения
const k = (f) => 'կ' + f;

// Все формы глагола: группы → времена → { pos: [6 форм], neg: [6 форм] } (неличные — одна строка форм)
export function conjugate(infinitive) {
  const v = verbStem(infinitive);
  if (!v) return null;
  const { prefix } = v;
  const A = analyze(v);
  const six = (fn) => PERSONS.map((_, i) => fn(i));
  const syn = (forms) => forms.map((f) => joinPre(prefix, f));

  const tenses = [
    // ---------------------------------------------------------------- изъявительное наклонение
    { group: 'indicative', id: 'pres', uz: 'Ներկա ժամանակ', ru: 'Настоящее время', en: 'Present', aff: '-ում + եմ',
      pos: six((i) => analytic(prefix, A.presPart, AUX[i], false)), neg: six((i) => analytic(prefix, A.presPart, AUX_NEG[i], true)) },
    { group: 'indicative', id: 'imperf', uz: 'Անցյալ անկատար', ru: 'Прошедшее несовершенное', en: 'Past continuous', aff: '-ում + էի',
      pos: six((i) => analytic(prefix, A.presPart, PAST[i], false)), neg: six((i) => analytic(prefix, A.presPart, PAST_NEG[i], true)) },
    { group: 'indicative', id: 'aorist', uz: 'Անցյալ կատարյալ', ru: 'Простое прошедшее (аорист)', en: 'Simple past', aff: '-եցի / -ացի',
      pos: syn(A.aor), neg: syn(A.aor.map(neg)) },
    { group: 'indicative', id: 'perfect', uz: 'Վաղակատար ներկա', ru: 'Перфект', en: 'Present perfect', aff: '-ել + եմ',
      pos: six((i) => analytic(prefix, A.perfPart, AUX[i], false)), neg: six((i) => analytic(prefix, A.perfPart, AUX_NEG[i], true)) },
    { group: 'indicative', id: 'pluperf', uz: 'Վաղակատար անցյալ', ru: 'Плюсквамперфект', en: 'Past perfect', aff: '-ել + էի',
      pos: six((i) => analytic(prefix, A.perfPart, PAST[i], false)), neg: six((i) => analytic(prefix, A.perfPart, PAST_NEG[i], true)) },
    { group: 'indicative', id: 'fut', uz: 'Ապառնի ժամանակ', ru: 'Будущее время', en: 'Future', aff: '-ելու + եմ',
      pos: six((i) => analytic(prefix, A.futPart, AUX[i], false)), neg: six((i) => analytic(prefix, A.futPart, AUX_NEG[i], true)) },
    { group: 'indicative', id: 'fut_past', uz: 'Անցյալի ապառնի', ru: 'Будущее в прошедшем («собирался»)', en: 'Future in the past', aff: '-ելու + էի',
      pos: six((i) => analytic(prefix, A.futPart, PAST[i], false)), neg: six((i) => analytic(prefix, A.futPart, PAST_NEG[i], true)) },

    // ---------------------------------------------------------------- повелительное наклонение
    { group: 'imperative', id: 'imper', uz: 'Հրամայական եղանակ', ru: 'Повелительное («пиши!», «пусть…»)', en: 'Imperative', aff: '-իր / -ա, -եք / -ացեք',
      pos: syn([`թող ${A.subj[0]}`, A.imp[0], `թող ${A.subj[2]}`, A.subj[3], A.imp[1], `թող ${A.subj[5]}`]),
      neg: syn([`թող ${neg(A.subj[0])}`, A.proh[0], `թող ${neg(A.subj[2])}`, neg(A.subj[3]), A.proh[1], `թող ${neg(A.subj[5])}`]) },

    // ---------------------------------------------------------------- желательное и условное наклонения
    { group: 'conditional', id: 'subj', uz: 'Ըղձական ապառնի', ru: 'Желательное («чтобы я…», «давай…»)', en: 'Subjunctive', aff: '-եմ / -ամ',
      pos: syn(A.subj), neg: syn(A.subj.map(neg)) },
    { group: 'conditional', id: 'subj_past', uz: 'Ըղձական անցյալ', ru: 'Желательное прошедшее («если бы я…»)', en: 'Past subjunctive (if I…)', aff: '-եի / -այի',
      pos: syn(A.subjPast), neg: syn(A.subjPast.map(neg)) },
    { group: 'conditional', id: 'cond', uz: 'Ենթադրական ապառնի', ru: 'Условное будущее («я, пожалуй, …»)', en: 'Conditional future', aff: 'կ- + -եմ / -ամ',
      pos: syn(A.subj.map(k)), neg: six((i) => analytic(prefix, A.negPart, AUX_NEG[i], true)) },
    { group: 'conditional', id: 'cond_past', uz: 'Ենթադրական անցյալ', ru: 'Условное прошедшее («я бы…»)', en: 'Conditional (would)', aff: 'կ- + -եի / -այի',
      pos: syn(A.subjPast.map(k)), neg: six((i) => analytic(prefix, A.negPart, PAST_NEG[i], true)) },

    // ---------------------------------------------------------------- возможность
    { group: 'ability', id: 'can', uz: 'Կարող եմ + անորոշ դերբայ', ru: 'Возможность («могу»)', en: 'Ability (can)', aff: 'կարող եմ + -ել',
      pos: six((i) => `${KAROX[i]} ${v.full}`), neg: six((i) => `${KAROX_NEG[i]} ${v.full}`) },
  ];

  // ---------------------------------------------------------------- разговорные (ереванские) варианты
  // Только устойчивые и общеупотребительные: «ա» вместо «է» в 3 л. ед. ч. (գնում ա, գնացել ա),
  // կարամ / չեմ կարա вместо կարող եմ / չեմ կարող, повелительное -ի вместо -իր (նայի, մի նայի),
  // ասի / ասեց, տվի вместо ասացի / ասաց, տվեցի. Где варианта нет — null.
  const only3 = (part) => six((i) => (i === 2 ? analytic(prefix, part, 'ա', false) : null));
  const KARAM = ['կարամ', 'կարաս', 'կարա', 'կարանք', 'կարաք', 'կարան'];
  const KARAM_NEG = ['չեմ կարա', 'չես կարա', 'չի կարա', 'չենք կարա', 'չեք կարա', 'չեն կարա'];
  const COLL = {
    pres: { pos: only3(A.presPart), neg: null },
    perfect: { pos: only3(A.perfPart), neg: null },
    fut: { pos: only3(A.futPart), neg: null },
    can: { pos: six((i) => `${KARAM[i]} ${v.full}`), neg: six((i) => `${KARAM_NEG[i]} ${v.full}`) },
  };
  const impPos = tenses.find((x) => x.id === 'imper');
  if (/իր$/.test(impPos.pos[1])) {
    COLL.imper = {
      pos: impPos.pos.map((f, i) => (i === 1 ? f.replace(/իր$/, 'ի') : null)),
      neg: impPos.neg.map((f, i) => (i === 1 && /իր$/.test(f) ? f.replace(/իր$/, 'ի') : null)),
    };
  }
  const AOR_COLL = { 'ասել': ['ասի', 'ասիր', 'ասեց', 'ասինք', 'ասիք', 'ասին'], 'տալ': ['տվի', 'տվիր', 'տվեց', 'տվինք', 'տվիք', 'տվին'] };
  if (AOR_COLL[v.inf]) COLL.aorist = { pos: syn(AOR_COLL[v.inf]), neg: syn(AOR_COLL[v.inf].map(neg)) };
  for (const tn of tenses) if (COLL[tn.id]) tn.coll = COLL[tn.id];

  // неличные формы (դերբայներ)
  const p = (f) => joinPre(prefix, f);
  const nonfinite = [
    { id: 'inf', uz: 'Անորոշ դերբայ', ru: 'Инфинитив', aff: '-ել / -ալ', forms: [p(v.inf)] },
    { id: 'part_pres', uz: 'Անկատար դերբայ', ru: 'Причастие настоящего («пишущий» — в составе времён)', aff: '-ում', forms: [p(A.presPart)] },
    { id: 'part_perf', uz: 'Վաղակատար դերբայ', ru: 'Причастие прошедшего (в перфекте)', aff: '-ել / -ացել', forms: [p(A.perfPart)] },
    { id: 'part_fut', uz: 'Ապառնի դերբայ', ru: 'Причастие будущего (в будущем времени)', aff: '-ելու / -ալու', forms: [p(A.futPart)] },
    { id: 'part_neg', uz: 'Ժխտական դերբայ', ru: 'Отрицательное причастие (չեմ գրի)', aff: '-ի / -ա', forms: [p(A.negPart)] },
    { id: 'part_res', uz: 'Հարակատար դերբայ', ru: 'Причастие результата («написанный»)', aff: '-ած', forms: [p(A.perf + 'ած')] },
    { id: 'part_subj', uz: 'Ենթակայական դերբայ', ru: 'Причастие деятеля («пишущий, тот, кто…»)', aff: '-ող', forms: [p(A.ogh)] },
    { id: 'part_sim', uz: 'Համակատար դերբայ', ru: 'Деепричастие («когда пишешь»)', aff: '-ելիս / -ալիս', forms: [p(v.inf + 'իս')] },
  ];
  return { inf: v.full, stem: v.stem, prefix, tenses, nonfinite };
}

// Варианты, которые принимаются как верный ответ для одной клетки таблицы: «ասացի / ասեցի» → ասացի | ասեցի
export function acceptedForms(cell) {
  const out = new Set();
  for (const part of String(cell).split(' / ')) {
    const t = part.trim();
    if (t) out.add(t);
  }
  return [...out];
}

// ---------------------------------------------------------------- склонение имён
// Семь падежей восточноармянского: именительный, родительный, дательный, винительный, исходный,
// творительный, местный. Родительный и дательный в ед. ч. совпадают (գրքի), винительный неодушевлённых
// совпадает с именительным, одушевлённых — с дательным (մարդուն).
const CASES = [
  { id: 'nom', uz: 'Ուղղական', q: 'ո՞վ, ի՞նչ', aff: '—' },
  { id: 'gen', uz: 'Սեռական', q: 'ո՞ւմ, ինչի՞', aff: '-ի / -ու / -ան' },
  { id: 'dat', uz: 'Տրական', q: 'ո՞ւմ, ինչի՞ն', aff: '-ի(ն)' },
  { id: 'acc', uz: 'Հայցական', q: 'ո՞ւմ, ի՞նչը', aff: '= ուղղ. / տրակ.' },
  { id: 'abl', uz: 'Բացառական', q: 'ումի՞ց, ինչի՞ց', aff: '-ից' },
  { id: 'ins', uz: 'Գործիական', q: 'ումո՞վ, ինչո՞վ', aff: '-ով' },
  { id: 'loc', uz: 'Ներգոյական', q: 'ո՞ւր, ինչո՞ւմ', aff: '-ում' },
];
export { CASES };

const VOWEL = /[աեէըիոօ]$|ու$/;
const endsVowel = (w) => VOWEL.test(w);
const glide = (w) => /[աոօ]$/.test(w) && !/ու$/.test(w);          // տղա → տղայի, կինո → կինոյի

// Существительные с особым склонением. gen — родительный (= дательный), obl — основа для -ից / -ով / -ում,
// abl / ins / loc — готовые формы, pl — множественное число, anim — одушевлённое (винительный = дательный)
const NOUN = {
  'մարդ': { gen: 'մարդու', abl: 'մարդուց', pl: 'մարդիկ', anim: true },
  'տուն': { gen: 'տան', obl: 'տն', loc: 'տանը', pl: 'տներ' },
  'դուռ': { gen: 'դռան', obl: 'դռն', loc: 'դռանը', pl: 'դռներ' },
  'շուն': { gen: 'շան', obl: 'շն', pl: 'շներ', anim: true },
  'անուն': { gen: 'անվան', obl: 'անվ', abl: 'անունից', ins: 'անունով', loc: 'անվան մեջ', pl: 'անուններ' },
  'դերանուն': { gen: 'դերանվան', abl: 'դերանունից', ins: 'դերանունով', loc: 'դերանվան մեջ', pl: 'դերանուններ' },
  'աշուն': { gen: 'աշնան', abl: 'աշնանից', ins: 'աշնանով', loc: 'աշնանը', pl: 'աշուններ' },
  'գարուն': { gen: 'գարնան', abl: 'գարնանից', ins: 'գարնանով', loc: 'գարնանը', pl: 'գարուններ' },
  'ամառ': { gen: 'ամռան', abl: 'ամռանից', ins: 'ամռանով', loc: 'ամռանը', pl: 'ամառներ' },
  'ձմեռ': { gen: 'ձմռան', abl: 'ձմռանից', ins: 'ձմռանով', loc: 'ձմռանը', pl: 'ձմեռներ' },
  'մուկ': { gen: 'մկան', obl: 'մկ', loc: 'մկան մեջ', pl: 'մկներ', anim: true },
  'ձուկ': { gen: 'ձկան', obl: 'ձկ', loc: 'ձկան մեջ', pl: 'ձկներ', anim: true },
  'ծունկ': { gen: 'ծնկան', obl: 'ծնկ', loc: 'ծնկան մեջ', pl: 'ծնկներ' },
  'ձյուն': { gen: 'ձյան', abl: 'ձյունից', ins: 'ձյունով', loc: 'ձյան մեջ', pl: 'ձյուներ' },
  'արյուն': { gen: 'արյան', abl: 'արյունից', ins: 'արյունով', loc: 'արյան մեջ', pl: 'արյուններ' },
  'մանուկ': { gen: 'մանկան', abl: 'մանկանից', ins: 'մանկանով', loc: 'մանկան մեջ', pl: 'մանուկներ', anim: true },
  'հայր': { gen: 'հոր', abl: 'հորից', ins: 'հորով', loc: 'հոր մոտ', pl: 'հայրեր', anim: true },
  'մայր': { gen: 'մոր', abl: 'մորից', ins: 'մորով', loc: 'մոր մոտ', pl: 'մայրեր', anim: true },
  'եղբայր': { gen: 'եղբոր', abl: 'եղբորից', ins: 'եղբորով', loc: 'եղբոր մոտ', pl: 'եղբայրներ', anim: true },
  'քույր': { gen: 'քրոջ', abl: 'քրոջից', ins: 'քրոջով', loc: 'քրոջ մոտ', pl: 'քույրեր', anim: true },
  'մորաքույր': { gen: 'մորաքրոջ', abl: 'մորաքրոջից', ins: 'մորաքրոջով', loc: 'մորաքրոջ մոտ', pl: 'մորաքույրեր', anim: true },
  'հորաքույր': { gen: 'հորաքրոջ', abl: 'հորաքրոջից', ins: 'հորաքրոջով', loc: 'հորաքրոջ մոտ', pl: 'հորաքույրեր', anim: true },
  'դուստր': { gen: 'դստեր', abl: 'դստերից', ins: 'դստերով', loc: 'դստեր մոտ', pl: 'դուստրեր', anim: true },
  'կին': { gen: 'կնոջ', abl: 'կնոջից', ins: 'կնոջով', loc: 'կնոջ մոտ', pl: 'կանայք', anim: true },
  'ամուսին': { gen: 'ամուսնու', abl: 'ամուսնուց', ins: 'ամուսնով', loc: 'ամուսնու մոտ', pl: 'ամուսիններ', anim: true },
  'ընկեր': { gen: 'ընկերոջ', abl: 'ընկերոջից', ins: 'ընկերոջով', loc: 'ընկերոջ մոտ', pl: 'ընկերներ', anim: true },
  'աղջիկ': { gen: 'աղջկա', abl: 'աղջկանից', ins: 'աղջկանով', loc: 'աղջկա մոտ', pl: 'աղջիկներ', anim: true },
  'ձի': { gen: 'ձիու', abl: 'ձիուց', ins: 'ձիով', loc: 'ձիու մոտ', pl: 'ձիեր', anim: true },
  'օր': { gen: 'օրվա', abl: 'օրվանից', ins: 'օրով', loc: 'օրում', pl: 'օրեր' },
  'տարի': { gen: 'տարվա', abl: 'տարուց', ins: 'տարով', loc: 'տարում', pl: 'տարիներ' },
  'ամիս': { gen: 'ամսվա', abl: 'ամսից', ins: 'ամսով', loc: 'ամսում', pl: 'ամիսներ' },
  'շաբաթ': { gen: 'շաբաթվա', pl: 'շաբաթներ' },
  'գիշեր': { gen: 'գիշերվա', pl: 'գիշերներ' },
  'առավոտ': { gen: 'առավոտվա', pl: 'առավոտներ' },
  'սեր': { gen: 'սիրո', abl: 'սիրուց', ins: 'սիրով', loc: 'սիրո մեջ', pl: 'սերեր' },
  'դասագիրք': { pl: 'դասագրքեր' },
  'փաստաթուղթ': { pl: 'փաստաթղթեր' },
  'ժամ': { pl: 'ժամեր' },
};
// Одушевлённые (винительный падеж = дательный: տեսնում եմ մարդուն) — люди и животные, кроме особых выше
const ANIM = new Set(['երեխա', 'տղա', 'տղամարդ', 'պապիկ', 'տատիկ', 'քեռի', 'բժիշկ', 'ուսուցիչ', 'նկարիչ', 'երգիչ', 'երաժիշտ',
  'վարսավիր', 'մարզիչ', 'մարզիկ', 'հյուր', 'թարգմանիչ', 'խմբագիր', 'հրատարակիչ', 'հիմնադիր', 'քննիչ', 'թղթակից', 'գործազուրկ',
  'շախմատիստ', 'գյուղացի', 'թոռնուհի', 'զարմուհի', 'եղբորորդի', 'ամուրի', 'ընկերուհի', 'համակուրսեցի', 'համադասարանցի', 'թշնամի',
  'քաղաքացի', 'դասատու', 'դերասանուհի', 'խորհրդատու', 'պատվիրատու', 'թեկնածու', 'գերի', 'կենսաթոշակառու', 'կատու', 'աղավնի',
  'ջորի', 'ոզնի', 'կենգուրու', 'բազե', 'մեղու', 'արծիվ', 'թռչուն', 'փիղ', 'ցուլ', 'առյուծ', 'կապիկ', 'ուղտ', 'եղնիկ', 'սկյուռ',
  'էլեկտրիկ', 'սանտեխնիկ', 'հյուսն', 'զբոսաշրջիկ', 'սցենարիստ', 'ատամնաբույժ', 'մանկաբույժ', 'վիրաբույժ', 'հոգեբույժ']);
// Беглый гласный: последний слог теряет -ի- / -ու- перед окончанием (գիրք → գրքի, ջուր → ջրի).
// Правилом это не предсказать (մատիտ → մատիտի), поэтому только по списку: слово → основа косвенных падежей
const REDUCE = {
  'գիրք': 'գրք', 'դասագիրք': 'դասագրք', 'սիրտ': 'սրտ', 'միտք': 'մտք', 'ջուր': 'ջր', 'գարեջուր': 'գարեջր', 'բրինձ': 'բրնձ',
  'սունկ': 'սնկ', 'պանիր': 'պանր', 'նարինջ': 'նարնջ', 'մարմին': 'մարմն', 'գլուխ': 'գլխ', 'քիթ': 'քթ', 'վիզ': 'վզ',
  'կուրծք': 'կրծք', 'բժիշկ': 'բժշկ', 'արծիվ': 'արծվ', 'երկինք': 'երկնք', 'փոթորիկ': 'փոթորկ', 'լիճ': 'լճ', 'ծաղիկ': 'ծաղկ',
  'կամուրջ': 'կամրջ', 'ուսուցիչ': 'ուսուցչ', 'նկարիչ': 'նկարչ', 'երգիչ': 'երգչ', 'երաժիշտ': 'երաժշտ', 'գրիչ': 'գրչ',
  'սուտ': 'ստ', 'քուն': 'քն', 'բջիջ': 'բջջ', 'համակարգիչ': 'համակարգչ', 'միս': 'մս', 'գին': 'գն', 'նուշ': 'նշ',
  'գետնանուշ': 'գետնանշ', 'հաշիվ': 'հաշվ', 'սոսինձ': 'սոսնձ', 'վրձին': 'վրձն', 'պղինձ': 'պղնձ', 'թուփ': 'թփ', 'բուն': 'բն',
  'փիղ': 'փղ', 'թռչուն': 'թռչն', 'ճահիճ': 'ճահճ', 'բլուր': 'բլր', 'հրաբուխ': 'հրաբխ', 'անձնագիր': 'անձնագր',
  'ժողովուրդ': 'ժողովրդ', 'թարգմանիչ': 'թարգմանչ', 'թուղթ': 'թղթ', 'փաստաթուղթ': 'փաստաթղթ', 'շիշ': 'շշ', 'թիվ': 'թվ',
  'առևտուր': 'առևտր', 'պայմանագիր': 'պայմանագր', 'նախագիծ': 'նախագծ', 'եկամուտ': 'եկամտ', 'սակագին': 'սակագն',
  'ծրագիր': 'ծրագր', 'ծածկագիր': 'ծածկագր', 'նվագախումբ': 'նվագախմբ', 'խմբագիր': 'խմբագր', 'հրատարակիչ': 'հրատարակչ',
  'բուրդ': 'բրդ', 'սերունդ': 'սերնդ', 'հիմնադիր': 'հիմնադր', 'հաշվեկշիռ': 'հաշվեկշռ', 'համաձայնագիր': 'համաձայնագր',
  'դատավճիռ': 'դատավճռ', 'պատիժ': 'պատժ', 'ամսագիր': 'ամսագր', 'ծուխ': 'ծխ', 'վարքագիծ': 'վարքագծ', 'խիղճ': 'խղճ',
  'սուգ': 'սգ', 'ձեռագիր': 'ձեռագր', 'ձու': 'ձվ', 'լեզու': 'լեզվ', 'կատու': 'կատվ', 'բու': 'բվ', 'մեղու': 'մեղվ', 'առու': 'առվ',
};
// Не склоняем в тренажёре: склонение неоднозначно или слово обычно не склоняется
const NO_DECL = new Set(['երկուշաբթի', 'երեքշաբթի', 'չորեքշաբթի', 'հինգշաբթի', 'ուրբաթ', 'կիրակի', 'ցուկկինի', 'վիսկի', 'նուռ',
  'թուզ', 'արմունկ', 'եղունգ', 'կրունկ', 'կաթիլ', 'ջնջիչ', 'մրջյուն', 'սյուն', 'ձողաձուկ', 'դուր', 'սուրբ', 'ծնունդ', 'կկու']);

// Число слогов с учётом непроизносимого «ը» в начальном сочетании согласных (գրիչ = գը-րիչ, դպրոց = դըպ-րոց)
const V_RE = /ու|[աեէըիոօև]/g;
function syllables(w) {
  const n = (w.match(V_RE) || []).length;
  const cluster = /^[^աեէըիոօւև][^աեէըիոօւևյ]/.test(w) ? 1 : 0;
  return n + cluster;
}
// Множественное число: односложные — -եր, многосложные — -ներ; беглый гласный выпадает (գիրք → գրքեր)
function plural(w) {
  if (NOUN[w] && NOUN[w].pl) return NOUN[w].pl;
  if (/տուն$/.test(w)) return w.replace(/տուն$/, 'տներ');           // դեղատուն → դեղատներ
  if (syllables(w) <= 1) return (REDUCE[w] || w) + 'եր';
  return w + 'ներ';
}

// Основа косвенных падежей слова: родительный, исходный, творительный, местный
function oblique(w) {
  const spec = NOUN[w] || {};
  if (/տուն$/.test(w) && w !== 'տուն') {                             // դեղատուն → դեղատան, դեղատնից, դեղատանը
    const s = w.slice(0, -4);
    return { gen: s + 'տան', abl: s + 'տնից', ins: s + 'տնով', loc: s + 'տանը' };
  }
  if (/ություն$/.test(w)) {
    const s = w.slice(0, -7);
    return { gen: s + 'ության', abl: w + 'ից', ins: s + 'ությամբ', loc: w + 'ում' };
  }
  let gen;
  let obl;
  if (spec.gen) { gen = spec.gen; obl = spec.obl || w; }
  else if (/ի$/.test(w)) {                                           // գինի → գինու, գինուց, գինով, գինում
    const s = w.slice(0, -1);
    return { gen: s + 'ու', abl: s + 'ուց', ins: s + 'ով', loc: s + 'ում', ...pick(spec) };
  } else if (REDUCE[w]) { obl = REDUCE[w]; gen = obl + 'ի'; }
  else if (glide(w)) { obl = w + 'յ'; gen = obl + 'ի'; }
  else { obl = w; gen = w + 'ի'; }
  return { gen, abl: obl + 'ից', ins: obl + 'ով', loc: obl + 'ում', ...pick(spec) };
}
const pick = (spec) => Object.fromEntries(['abl', 'ins', 'loc'].filter((k) => spec[k]).map((k) => [k, spec[k]]));
// Определённый артикль: после согласного -ը, после гласного -ն (տունը, տղան)
export const withArticle = (w) => (endsVowel(w) ? w + 'ն' : w + 'ը');
// Притяжательные артикли 1 и 2 л. ед. ч.: տունս, տունդ
const POSS_ART = ['ս', 'դ'];

// Таблица склонения: строки — падежи; столбцы — неопределённая форма, определённая (с артиклем),
// множественное число и формы с притяжательными артиклями «мой» (-ս) и «твой» (-դ)
export function decline(noun) {
  const w = String(noun || '').trim();
  if (!w || /\s/.test(w) || !/^[ա-և]+$/.test(w) || NO_DECL.has(w)) return null;
  const anim = Boolean((NOUN[w] && NOUN[w].anim) || ANIM.has(w));
  const o = oblique(w);
  const datDef = endsVowel(o.gen) ? o.gen + 'ն' : o.gen + 'ը';       // գրքին, տանը, ընկերոջը
  const sg = [w, o.gen, o.gen, anim ? o.gen : w, o.abl, o.ins, o.loc];
  const def = [withArticle(w), o.gen, datDef, anim ? datDef : withArticle(w), o.abl, o.ins, o.loc];
  const plw = plural(w);
  const pls = [plw, plw + 'ի', plw + 'ի', anim ? plw + 'ի' : plw, plw + 'ից', plw + 'ով', plw + 'ում'];
  const poss = (a) => {
    const g = o.gen.replace(/ը$/, '') + a;
    const tail = (f) => (/ մեջ$| մոտ$/.test(f) ? f.replace(/ (մեջ|մոտ)$/, `${a} $1`) : f.replace(/ը$/, '') + a);
    return [w + a, g, g, anim ? g : w + a, o.abl + a, o.ins + a, tail(o.loc)];
  };
  const columns = [
    { id: 'sg', base: w, forms: sg },
    { id: 'def', base: withArticle(w), forms: def },
    { id: 'pl', base: plw, forms: pls },
    { id: 'poss0', base: w + POSS_ART[0], person: 0, forms: poss(POSS_ART[0]) },
    { id: 'poss1', base: w + POSS_ART[1], person: 1, forms: poss(POSS_ART[1]) },
  ];
  return { word: w, anim, columns };
}
