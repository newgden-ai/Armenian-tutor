// Армянская экранная клавиатура для ответов на армянском.
// В узбекской версии здесь были кнопки oʻ gʻ ʼ; армянской раскладки на телефоне часто нет, поэтому —
// полная клавиатура (буквы в порядке алфавита, «ու» и «և» отдельными клавишами, ՞ для вопросов).
// Включена — системная клавиатура не выскакивает (inputmode="none"); выключить можно кнопкой «⌨».
import { h, haptic } from './ui.js';
import { t } from './i18n.js';

const ROWS = [
  ['ա', 'բ', 'գ', 'դ', 'ե', 'զ', 'է', 'ը', 'թ', 'ժ'],
  ['ի', 'լ', 'խ', 'ծ', 'կ', 'հ', 'ձ', 'ղ', 'ճ', 'մ'],
  ['յ', 'ն', 'շ', 'ո', 'չ', 'պ', 'ջ', 'ռ', 'ս', 'վ'],
  ['տ', 'ր', 'ց', 'ու', 'փ', 'ք', 'օ', 'ֆ', 'և', '՞'],
];
const PREF = 'hy_keyboard';

function prefOn() {
  try { return localStorage.getItem(PREF) !== 'off'; } catch { return true; }
}
function savePref(on) {
  try { localStorage.setItem(PREF, on ? 'on' : 'off'); } catch { /* приватный режим — без запоминания */ }
}

function insert(input, text) {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  input.value = input.value.slice(0, start) + text + input.value.slice(end);
  const pos = start + text.length;
  try { input.setSelectionRange(pos, pos); } catch { /* type=text — всегда можно */ }
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
function backspace(input) {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  if (start !== end) { insert(input, ''); return; }
  if (start === 0) return;
  // «ու» стирается целиком, как одна буква
  const cut = input.value.slice(start - 2, start) === 'ու' ? 2 : 1;
  input.value = input.value.slice(0, start - cut) + input.value.slice(end);
  try { input.setSelectionRange(start - cut, start - cut); } catch { /* ignore */ }
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

// Возвращает элемент: строка с переключателем и (если включена) клавиатура под полем ввода
export function hyKeyboard(input, { onEnter } = {}) {
  let on = prefOn();
  const key = (label, fn, cls = '') => h('button', {
    class: `hk-key ${cls}`, type: 'button', tabindex: '-1',
    onPointerdown: (e) => e.preventDefault(),          // поле ввода не теряет фокус и курсор
    onClick: () => { haptic(); fn(); },
  }, label);
  const grid = h('div', { class: 'hk-grid' },
    ROWS.map((row) => h('div', { class: 'hk-row' }, row.map((ch) => key(ch, () => insert(input, ch))))),
    h('div', { class: 'hk-row' },
      key(t('kbSpace'), () => insert(input, ' '), 'hk-space'),
      key('⌫', () => backspace(input), 'hk-wide'),
      onEnter ? key('↵', () => onEnter(), 'hk-wide hk-enter') : null));
  const toggle = h('button', { class: 'chip-btn hk-toggle', type: 'button' });
  const apply = () => {
    grid.hidden = !on;
    input.setAttribute('inputmode', on ? 'none' : 'text');
    toggle.textContent = on ? `⌨ ${t('kbSystem')}` : `⌨ ${t('kbArmenian')}`;
  };
  toggle.addEventListener('click', () => { on = !on; savePref(on); apply(); input.blur(); setTimeout(() => input.focus(), 30); });
  apply();
  return h('div', { class: 'hk' }, h('div', { class: 'helper-row' }, toggle), grid);
}
