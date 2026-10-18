// Перевод форм армянского глагола на русский и английский по шаблонам времени.
// Формы русского/английского глагола берутся из словаря (words.morph, файл data/verb_forms.csv):
//   ru: { inf, tail, pres[6], past[м, ж, мн], imp[ед, мн] }, en: { f: [base, 3s, past, pp, ing], tail }.
// Армянский глагол не различает вид, поэтому перевод дан несовершенным видом; оттенки приблизительные —
// ошибку можно отметить кнопкой ⚑.

const RU_PR = ['я', 'ты', 'он(а)', 'мы', 'вы', 'они'];
const EN_PR = ['I', 'you', 'he/she', 'we', 'you', 'they'];
const BUDU = ['буду', 'будешь', 'будет', 'будем', 'будете', 'будут'];
const MOGU = ['могу', 'можешь', 'может', 'можем', 'можете', 'могут'];
const SOBIR = ['собирался(-ась)', 'собирался(-ась)', 'собирался(-ась)', 'собирались', 'собирались', 'собирались'];

// «ходил» + «ходила» → «ходил(а)»; «шёл» + «шла» → «шёл / шла»
function ruPastSg(m, f) {
  if (!m) return '';
  if (f === `${m}а`) return `${m}(а)`;
  if (m.endsWith('ся') && f === `${m.slice(0, -2)}ась`) return `${m}(-ась)`;
  return f ? `${m} / ${f}` : m;
}

function ru(morph, tense, neg, i) {
  const r = morph && morph.ru;
  if (!r || !r.pres || !r.pres[i]) return '';
  const pr = RU_PR[i];
  const ne = neg ? 'не ' : '';
  const V = `${ne}${r.pres[i]}`;
  const P = `${ne}${i >= 3 ? r.past[2] : ruPastSg(r.past[0], r.past[1])}`;
  const I = r.inf;
  let s;
  switch (tense) {
    case 'pres': s = `${pr} ${V}`; break;
    case 'imperf': s = `${pr} ${P} (тогда, бывало)`; break;
    case 'aorist': s = `${pr} ${P}`; break;
    case 'perfect': s = `${pr} ${neg ? 'ещё' : 'уже'} ${P}`; break;
    case 'pluperf': s = `${pr} ${P} (до того)`; break;
    case 'fut': s = `${pr} ${ne}${BUDU[i]} ${I}`; break;
    case 'fut_past': s = `${pr} ${ne}${SOBIR[i]} ${I}`; break;
    case 'imper':
      s = [`пусть я ${V}`, `${ne}${r.imp[0]}`, `пусть он(а) ${V}`, `давайте ${ne}${I}`, `${ne}${r.imp[1]}`, `пусть они ${V}`][i];
      break;
    case 'subj': s = `(чтобы) ${pr} ${P}`; break;
    case 'subj_past': s = `если бы ${pr} ${P}`; break;
    case 'cond': s = `${pr}, пожалуй, ${ne}${BUDU[i]} ${I}`; break;
    case 'cond_past': s = `${pr} бы ${P}`; break;
    case 'can': s = `${pr} ${ne}${MOGU[i]} ${I}`; break;
    default: return '';
  }
  return r.tail ? `${s} ${r.tail}` : s;
}

function en(morph, tense, neg, i) {
  const e = morph && morph.en;
  if (!e || !e.f || !e.f[0]) return '';
  const [b, s3, past, pp, ing] = e.f;
  const be = b === 'be';
  const third = i === 2;
  const pr = EN_PR[i];
  const am = i === 0 ? 'am' : third ? 'is' : 'are';
  const was = i === 0 || third ? 'was' : 'were';
  const has = third ? 'has' : 'have';
  const doo = third ? 'does' : 'do';
  const n = neg ? ' not' : '';
  let s;
  switch (tense) {
    case 'pres': s = be ? `${pr} ${am}${n}` : neg ? `${pr} ${doo} not ${b}` : `${pr} ${third ? s3 : b}`; break;
    case 'imperf': s = be ? `${pr} ${was}${n} (then)` : `${pr} ${was}${n} ${ing}`; break;
    case 'aorist': s = be ? `${pr} ${was}${n}` : neg ? `${pr} did not ${b}` : `${pr} ${past}`; break;
    case 'perfect': s = `${pr} ${has}${n} ${pp}`; break;
    case 'pluperf': s = `${pr} had${n} ${pp}`; break;
    case 'fut': s = `${pr} will${n} ${b}`; break;
    case 'fut_past': s = `${pr} ${was}${n} going to ${b}`; break;
    case 'imper':
      s = neg ? ['let me not', `don't`, 'let him/her not', `let's not`, `don't`, 'let them not'][i] + ` ${b}`
        : ['let me', '', 'let him/her', `let's`, '', 'let them'][i] + ` ${b}`;
      s = s.trim(); break;
    case 'subj': s = `${pr} should${n} ${b}`; break;
    case 'subj_past': s = `if ${pr} ${be ? 'were' : neg ? `didn't ${b}` : past}${be && neg ? ' not' : ''}`; break;
    case 'cond': s = neg ? `${pr} probably won't ${b}` : `${pr} will probably ${b}`; break;
    case 'cond_past': s = `${pr} would${n} ${b}`; break;
    case 'can': s = `${pr} ${neg ? 'cannot' : 'can'} ${b}`; break;
    default: return '';
  }
  return e.tail ? `${s} ${e.tail}` : s;
}

// Перевод клетки таблицы: lang 'ru' | 'en' (для армянского интерфейса — русский)
export function formTranslation(morph, tense, neg, i, lang) {
  if (!morph) return '';
  return lang === 'en' ? en(morph, tense, neg, i) : ru(morph, tense, neg, i);
}

// Значения падежей и притяжательных форм для таблиц склонения
export const CASE_MEANING = {
  ru: { nom: 'именительный: кто? что?', gen: 'родительный: чей? кого? чего?', dat: 'дательный: кому? чему?',
        acc: 'винительный: кого? что?', abl: 'исходный: откуда? от кого? из чего?', ins: 'творительный: чем? с кем?',
        loc: 'местный: где? в чём?' },
  en: { nom: 'nominative: who? what?', gen: 'genitive: whose? of what?', dat: 'dative: to whom?',
        acc: 'accusative (object)', abl: 'ablative: from where? from whom?', ins: 'instrumental: with what? by what?',
        loc: 'locative: where? in what?' },
};
export const POSS_MEANING = {
  ru: ['мой, моя, моё', 'твой, твоя, твоё'],
  en: ['my', 'your'],
};
