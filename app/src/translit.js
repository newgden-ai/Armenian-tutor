// Транскрипция армянского текста: латиница (как в словаре, колонка «Транслитерация») и кириллица с ударением
// (колонка «Транскрипция (кир.)»). Те же правила, что при подготовке словаря.
const LAT = { 'ա': 'a', 'բ': 'b', 'գ': 'g', 'դ': 'd', 'զ': 'z', 'է': 'e', 'ը': 'ə', 'թ': "t'", 'ժ': 'zh', 'ի': 'i', 'լ': 'l',
  'խ': 'kh', 'ծ': 'ts', 'կ': 'k', 'հ': 'h', 'ձ': 'dz', 'ղ': 'gh', 'ճ': 'ch', 'մ': 'm', 'յ': 'y', 'ն': 'n', 'շ': 'sh', 'չ': "ch'",
  'պ': 'p', 'ջ': 'j', 'ռ': 'rr', 'ս': 's', 'վ': 'v', 'տ': 't', 'ր': 'r', 'ց': "ts'", 'փ': "p'", 'ք': "k'", 'օ': 'o', 'ֆ': 'f' };
const CYR = { 'ա': 'а', 'բ': 'б', 'գ': 'г', 'դ': 'д', 'զ': 'з', 'է': 'э', 'ը': 'ы', 'թ': 'т‘', 'ժ': 'ж', 'ի': 'и', 'լ': 'л',
  'խ': 'х', 'ծ': 'ц', 'կ': 'к', 'հ': 'һ', 'ձ': 'дз', 'ղ': 'гх', 'ճ': 'ч', 'մ': 'м', 'յ': 'й', 'ն': 'н', 'շ': 'ш', 'չ': 'ч‘',
  'պ': 'п', 'ջ': 'дж', 'ռ': 'рр', 'ս': 'с', 'վ': 'в', 'տ': 'т', 'ր': 'р', 'ց': 'ц‘', 'փ': 'п‘', 'ք': 'к‘', 'օ': 'о', 'ֆ': 'ф' };
const AUX_LAT = { 'եմ': 'em', 'ես': 'es', 'է': 'e', 'ենք': "enk'", 'եք': "ek'", 'են': 'en',
  'էի': 'ei', 'էիր': 'eir', 'էր': 'er', 'էինք': "eink'", 'էիք': "eik'", 'էին': 'ein' };
const AUX_CYR = { 'եմ': 'эм', 'ես': 'эс', 'է': 'э', 'ենք': 'энк‘', 'եք': 'эк‘', 'են': 'эн',
  'էի': 'эи', 'էիր': 'эир', 'էր': 'эр', 'էինք': 'эинк‘', 'էիք': 'эик‘', 'էին': 'эин' };
const isHy = (c) => /[ա-ևԱ-Ֆ]/.test(c || '');

function wordLat(w) {
  let out = '';
  for (let i = 0; i < w.length;) {
    const c = w[i]; const lc = c.toLowerCase(); const up = c !== lc && isHy(c);
    const start = i === 0 || !isHy(w[i - 1]);
    let r; let step = 1;
    if (lc === 'ո' && (w[i + 1] || '').toLowerCase() === 'ւ') { r = 'u'; step = 2; }
    else if (lc === 'և') r = start ? 'yev' : 'ev';
    else if (lc === 'ե') r = start ? 'ye' : 'e';
    else if (lc === 'ո') r = start && (w[i + 1] || '').toLowerCase() !== 'վ' ? 'vo' : 'o';
    else if (lc === 'ւ') r = 'v';
    else r = LAT[lc] ?? c;
    if (up && r) r = r[0].toUpperCase() + r.slice(1);
    out += r; i += step;
  }
  return out;
}

function wordCyr(w) {
  let out = '';
  const low = w.toLowerCase();
  for (let i = 0; i < low.length;) {
    const c = low[i]; const start = i === 0 || !isHy(low[i - 1]);
    let r; let step = 1;
    if (c === 'ո' && low[i + 1] === 'ւ') { r = 'у'; step = 2; }
    else if (c === 'և') r = 'ев';
    else if (c === 'ե') r = 'е';
    else if (c === 'ո') r = start && low[i + 1] !== 'վ' ? 'во' : 'о';
    else if (c === 'ւ') r = 'в';
    else r = CYR[c] ?? c;
    out += r; i += step;
  }
  // ударение — на последний слог (кроме конечного ы)
  const V = 'аэыиоуе';
  const idx = [...out].map((ch, k) => (V.includes(ch) ? k : -1)).filter((k) => k >= 0);
  if (idx.length > 1) {
    let k = idx[idx.length - 1];
    if (out[k] === 'ы') k = idx[idx.length - 2];
    out = out.slice(0, k + 1) + '́' + out.slice(k + 1);
  }
  // заглавная буква — как в армянском слове (начало предложения, имена)
  if (w[0] !== low[0] && out) out = out[0].toUpperCase() + out.slice(1);
  return out;
}

function convert(text, wordFn, aux) {
  // в армянском вопрос отмечается знаком ՞ над словом, а предложение кончается точкой ։ — в транскрипции ставим «?»
  const s = String(text ?? '').replace(/([^։]*՞[^։]*)։/g, '$1?').replace(/[՞՛՜]/g, '');
  const parts = s.split(/(\s+)/);
  return parts.map((p, k) => {
    if (/^\s+$/.test(p) || !p) return p;
    const m = p.match(/^([^ա-ևԱ-Ֆ]*)([ա-ևԱ-Ֆ]+)([^ա-ևԱ-Ֆ]*)$/);
    if (m && k > 0 && aux[m[2].toLowerCase()]) return m[1] + aux[m[2].toLowerCase()] + m[3];
    return p.replace(/[ա-ևԱ-Ֆ]+/g, wordFn);
  }).join('').replace(/։/g, '.').replace(/՝/g, ',');
}

export const toLatin = (text) => convert(text, wordLat, AUX_LAT);
export const toCyrillic = (text) => convert(text, wordCyr, AUX_CYR);
// Подсказка для текущего языка интерфейса: русскоязычным — кириллица, остальным — латиница
export function translitFor(text, lang) { return lang === 'ru' ? toCyrillic(text) : toLatin(text); }
