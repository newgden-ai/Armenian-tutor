// Нормализация ответов — те же правила, что в базе (public.key_uz / public.key_ru)
// и в scripts/build_vocab.py. См. docs/normalization.md. Имя «Uz» — внутреннее: «изучаемый язык» (армянский).
const MARKS = /[՞՛՜՚'’`ʼ]/g;          // знаки внутри слова, которые при сравнении не важны
const UPPER = 'ԱԲԳԴԵԶԷԸԹԺԻԼԽԾԿՀՁՂՃՄՅՆՇՈՉՊՋՌՍՎՏՐՑՒՓՔՕՖ';
const LOWER = 'աբգդեզէըթժիլխծկհձղճմյնշոչպջռսվտրցւփքօֆ';
function hyLower(s) {
  let out = '';
  for (const ch of s) { const k = UPPER.indexOf(ch); out += k >= 0 ? LOWER[k] : ch.toLowerCase(); }
  return out;
}

export function keyUz(s) {
  return hyLower(String(s ?? '').normalize('NFC'))
    .replace(/եւ/g, 'և')
    .replace(MARKS, '')
    .replace(/[^ա-և \-]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function keyRu(s) {
  return String(s ?? '')
    .replace(/\([^)]*\)/g, ' ')
    .normalize('NFC')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^0-9a-zа-я \-]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Число слов (без пояснений в скобках) — варианты ответа подбираются той же длины
export function wordCount(s) {
  const t = String(s ?? '').replace(/\([^)]*\)/g, ' ').replace(/[-–—]/g, ' ').trim();
  return t ? t.split(/\s+/).length : 0;
}

// Ответ на армянском без личных местоимений тоже верный: «գնում եմ» = «Ես գնում եմ։»
const PRON = new Set(['ես', 'դու', 'նա', 'մենք', 'դուք', 'նրանք']);
export function stripPron(s) {
  return keyUz(s).split(' ').filter((w) => w && !PRON.has(w)).join(' ');
}
export function uzSame(a, b) {
  const ka = keyUz(a);
  if (!ka) return false;
  if (ka === keyUz(b)) return true;
  const sa = stripPron(a);
  return sa !== '' && sa === stripPron(b);
}

// Армянский текст с ввода пользователя для показа: NFC, «եւ» как написано, лишние пробелы убраны
export function displayUz(s) {
  return String(s ?? '').normalize('NFC').replace(/\s+/g, ' ');
}

// Посимвольное сравнение для подсветки ошибки: [{ch, kind: 'same'|'wrong'|'missing'|'extra'}]
export function diffChars(answer, correct) {
  const a = [...String(answer ?? '')];
  const b = [...String(correct ?? '')];
  const n = (c) => hyLower(c).replace(MARKS, '').replace('ё', 'е');
  const eq = (x, y) => n(x) === n(y);
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (eq(a[i - 1], b[j - 1]) ? 0 : 1));
  const out = [];
  let i = a.length, j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + (eq(a[i - 1], b[j - 1]) ? 0 : 1)) {
      out.push({ ch: b[j - 1], kind: eq(a[i - 1], b[j - 1]) ? 'same' : 'wrong' });
      i--; j--;
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      out.push({ ch: b[j - 1], kind: 'missing' });
      j--;
    } else {
      out.push({ ch: a[i - 1], kind: 'extra' });
      i--;
    }
  }
  return out.reverse();
}
