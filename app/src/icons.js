// Собственные иконки и рисунки (линейный стиль). Все строки статические — пользовательский текст сюда не попадает.
const NS = 'http://www.w3.org/2000/svg';

function make(viewBox, body, cls) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  if (cls) svg.setAttribute('class', cls);
  svg.innerHTML = body;
  return svg;
}

// ---------------------------------------------------------------- иконки 24×24
const ICONS = {
  home: '<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9v11h5v-6h3v6h5V9"/>',
  map: '<path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5z"/><path d="M9 4.5v13M15 6.5v13"/>',
  settings: '<path d="M4 6.5h9M17 6.5h3M4 12h3M11 12h9M4 17.5h11M19 17.5h1"/><circle cx="15" cy="6.5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17.5" r="2"/>',
  learn: '<path d="M12 6.5C10 5 7 4.5 4 5v13.5c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z"/><path d="M12 6.5V20"/>',
  review: '<path d="M19.5 10.5A7.5 7.5 0 0 0 6 7.2L4.5 9"/><path d="M4.5 4.5V9H9"/><path d="M4.5 13.5A7.5 7.5 0 0 0 18 16.8l1.5-1.8"/><path d="M19.5 19.5V15H15"/>',
  practice: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r=".9" fill="currentColor"/>',
  games: '<rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7.5 10.5v4M5.5 12.5h4"/><circle cx="15.5" cy="11.3" r="1" fill="currentColor"/><circle cx="17.8" cy="13.8" r="1" fill="currentColor"/>',
  filword: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17"/><path d="M6.3 6.3h5.6v5.6h5.6" stroke-width="2.6" opacity=".45"/>',
  test: '<path d="M5.5 21V4"/><path d="M5.5 4.5h11l-2.2 4 2.2 4h-11"/>',
  grammar: '<path d="M3 18 7.5 6 12 18M4.8 14h5.4"/><path d="M19.6 12.4V18"/><circle cx="17.1" cy="15.4" r="2.6"/>',
  history: '<path d="M3 9.5 12 4.5l9 5"/><path d="M5.5 10v7.5M10 10v7.5M14 10v7.5M18.5 10v7.5"/><path d="M3.5 20.5h17"/>',
  civics: '<path d="M12 4v16M7.5 20h9M5 7.5h14"/><path d="M5 7.5 2.5 13a2.6 2.6 0 0 0 5 0zM19 7.5 16.5 13a2.6 2.6 0 0 0 5 0z"/>',
  culture: '<path d="M6 10.5h10V14a5 5 0 0 1-10 0z"/><path d="M16 11.5h1.4a2 2 0 0 1 0 4H15.6"/><path d="M6 12.5 3 10.2"/><path d="M8.5 10.5c0-1.6 1.2-2.5 2.5-2.5s2.5.9 2.5 2.5M11 8V6.5"/>',
  dictionary: '<path d="M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/><path d="M9 8h6M9 11h4"/>',
  chat: '<path d="M4.5 6.5A2.5 2.5 0 0 1 7 4h10a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 17 16h-6l-4.5 3.5V16H7a2.5 2.5 0 0 1-2.5-2.5z"/>',
  conj: '<path d="M4 6h7M4 12h7M4 18h7"/><path d="M15 6h5M15 12h5M15 18h5"/><path d="M12.5 4v16" opacity=".5"/>',
  flag: '<path d="M5.5 21V4.5"/><path d="M5.5 4.5h11l-2 4 2 4h-11"/>',
  decl: '<path d="M4 6h7M4 12h7M4 18h7"/><path d="M14 6h6M14 12h6M14 18h6"/><path d="M11.5 4v16"/>',
  dialog: '<path d="M4 5.5h10v7H8l-3 2.5v-2.5H4z"/><path d="M14 9.5h6v6.5h-1v2.5l-3-2.5h-4v-2"/>',
  mistakes: '<circle cx="12" cy="12" r="8.5"/><path d="M9 9l6 6M15 9l-6 6"/>',
  chart: '<path d="M4 20h16"/><path d="M7 16v-5M12 16V7M17 16v-8"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6.5a3.5 3.5 0 0 0 0-7h-5a3.5 3.5 0 0 1 0-7H16"/>',
  sentences: '<path d="M4 7h16M4 12h11M4 17h8"/><path d="M17 15l3 2.5L17 20"/>',
  progress: '<path d="M4 20V12M9.5 20V6M15 20v-9M20.5 20V4"/>',
  lock: '<rect x="5" y="11" width="14" height="9.5" rx="2.2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  check: '<path d="M5 12.5 10 17.5 19 7"/>',
  flame: '<path d="M12 3c1.2 3.2 5.5 5.2 5.5 10.2a5.5 5.5 0 0 1-11 0c0-2.3 1.2-3.8 2.3-4.8 0 2.1 1 3.1 2.1 3.1 0-3.2-.8-5.3 1.1-8.5z"/>',
  sound: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9.2a4 4 0 0 1 0 5.6M18 6.7a7.5 7.5 0 0 1 0 10.6"/>',
  star: '<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>',
  chevron: '<path d="m9.5 6 6 6-6 6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  pairs: '<rect x="3" y="4.5" width="8.5" height="6.5" rx="2"/><rect x="12.5" y="13" width="8.5" height="6.5" rx="2"/><path d="M11.5 7.8h2.8a2.5 2.5 0 0 1 2.5 2.5V13"/>',
  truefalse: '<path d="M3.5 12.5 7 16l5.5-7"/><path d="M15 9l5.5 5.5M20.5 9 15 14.5"/>',
  guess: '<path d="M9.2 18h5.6M10.2 21h3.6"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.1 4.1 0 0 1 12 7.4a4.1 4.1 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z"/>',
  keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M7.5 14h9"/>',
  tiles: '<rect x="2.5" y="7.5" width="5.5" height="9" rx="1.6"/><rect x="9.25" y="7.5" width="5.5" height="9" rx="1.6"/><rect x="16" y="7.5" width="5.5" height="9" rx="1.6"/>',
  user: '<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6"/>',
  sparkle: '<path d="M12 3.5 13.8 10 20.5 12l-6.7 2L12 20.5 10.2 14 3.5 12l6.7-2z"/>',
  trophy: '<path d="M8 4.5h8v5a4 4 0 0 1-8 0z"/><path d="M8 6.5H4.5a3 3 0 0 0 3.5 4M16 6.5h3.5a3 3 0 0 1-3.5 4"/><path d="M12 13.5v3.5M8.5 20.5h7M9.5 17h5v3.5h-5z"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 19.5c.8-3.4 3.4-5.3 6.5-5.3s5.7 1.9 6.5 5.3"/><path d="M15.5 5.2a3.3 3.3 0 0 1 0 6.4M17.6 14.6c2 .7 3.4 2.4 3.9 4.9"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
};

export function icon(name, cls = 'ic') {
  return make('0 0 24 24', ICONS[name] || ICONS.star, cls);
}

// ---------------------------------------------------------------- рисунки для карты пути (64×64)
// .fa — мягкая заливка акцентным цветом, .fb — заливка «золотом»

// армянский «знак вечности» (аревахач): 8 загнутых лучей вокруг центра
function eternity() {
  let arms = '';
  for (let i = 0; i < 8; i++) {
    arms += `<path class="fa" transform="rotate(${i * 45} 32 32)" d="M32 32c0-8 4-14 11-16-1 6-4 11-11 16z"/>`;
  }
  return `${arms}<circle class="fb" cx="32" cy="32" r="5"/>`;
}

const ART = {
  // Ереван: Каскад (лестница-террасы) и Арарат за ним
  cascade: '<path class="fa" d="M4 34 18 16l6 7 8-12 14 23z"/><path class="fb" d="M14 21l4-5 3 3.5M28 15l4-4 4 5"/><path d="M10 60V52h10v-6h10v-6h10v-6h10v26"/><path d="M15 52v8M25 46v14M35 40v20M45 34v26"/><path d="M4 60h56"/>',
  // Гюмри: армянская церковь — барабан и конический купол
  church: '<path class="fa" d="M14 60V36h36v24"/><path d="M14 36l18-8 18 8"/><path class="fa" d="M26 30V20h12v10"/><path class="fb" d="M24.5 20 32 9l7.5 11z"/><path d="M32 9V4M30 6h4"/><path d="M28 60V49a4 4 0 0 1 8 0v11"/><path d="M20 44v4M44 44v4M31 23v4M33 23v4"/><path d="M8 60h48"/>',
  // Дилижан: горы и лес
  dilijan: '<path d="M2 40 18 22l10 10 10-14 24 22"/><path class="fa" d="M14 60 22 38l8 22zM34 60l9-26 9 26z"/><path class="fb" d="M10 60l5-14 5 14zM46 60l5-12 5 12z"/><path d="M22 52v8M43 50v10"/><path d="M4 60h56"/>',
  // Татев: монастырь на скале над ущельем
  tatev: '<path class="fa" d="M4 60V44l10-4 8 2v18M42 60V42l10-6 8 4v20"/><path d="M22 60c4-6 16-6 20 0"/><path class="fa" d="M10 40V30h12v10"/><path class="fb" d="M14 30v-5h4v5"/><path d="M13 25 16 19l3 6"/><path d="M48 36V28h8v8"/><path d="M50 28l2-5 2 5"/><path d="M26 30l16-4" stroke-dasharray="2 3"/>',
  // ворота уровня (тест)
  gate: '<path class="fa" d="M12 60V26h40v34"/><path d="M24 60V45a8 8 0 0 1 16 0v15"/><path d="M10 26h44M13 26v-6h38v6"/><path d="M32 20V7"/><path class="fb" d="M32 7h11l-3 3.5 3 3.5H32z"/>',
  pomegranate: '<path class="fa" d="M32 18c11 0 18 8 18 19s-8 19-18 19-18-8-18-19 7-19 18-19z"/><path d="M26.5 19 27 12l5 4 5-4 .5 7"/><circle class="fb" cx="26" cy="36" r="2"/><circle class="fb" cx="33" cy="32" r="2"/><circle class="fb" cx="38" cy="39" r="2"/><circle class="fb" cx="30" cy="43" r="2"/>',
  // абрикос с листом
  apricot: '<path class="fa" d="M32 20c-10-2-18 6-18 17s8 19 18 19 18-8 18-19-8-19-18-17z"/><path d="M32 21c-3 8-3 22 0 34" opacity=".55"/><path d="M32 20c0-4 1-7 3-9"/><path class="fb" d="M35 13c6-5 14-4 17 1-6 4-12 4-17-1z"/>',
  // лаваш: тонкий лист с пузырьками
  lavash: '<path class="fa" d="M8 22c8-4 40-4 48 0 3 8 3 20 0 28-8 4-40 4-48 0-3-8-3-20 0-28z"/><path d="M18 30h.01M28 27h.01M40 30h.01M24 38h.01M36 37h.01M46 41h.01M16 44h.01M30 45h.01" stroke-width="2.6"/>',
  // дудук: трубка с отверстиями и трость
  duduk: '<path class="fa" d="M10 50 46 14l4 4-36 36z"/><path d="M46 14l6-6 4 4-6 6"/><path d="M20 44h.01M25 39h.01M30 34h.01M35 29h.01M40 24h.01" stroke-width="2.8"/><path class="fb" d="M8 52l-3 3 4 4 3-3z"/>',
  // хачкар: каменный крест с узором
  khachkar: '<path class="fa" d="M18 60V10h28v50"/><path d="M14 60h36"/><path class="fb" d="M29 18h6v8h8v6h-8v14h-6V32h-8v-6h8z"/><path d="M22 52c3-3 6-3 10 0 4-3 7-3 10 0"/><path d="M22 14h.01M42 14h.01" stroke-width="2.6"/>',
  grapes: '<circle class="fa" cx="26" cy="28" r="5"/><circle class="fa" cx="36" cy="28" r="5"/><circle class="fa" cx="31" cy="36" r="5"/><circle class="fa" cx="21" cy="36" r="5"/><circle class="fa" cx="41" cy="36" r="5"/><circle class="fa" cx="26" cy="44" r="5"/><circle class="fa" cx="36" cy="44" r="5"/><circle class="fa" cx="31" cy="52" r="5"/><path d="M31 23V12"/><path class="fb" d="M31 15c4-6 12-6 16-2-4 5-11 6-16 2z"/>',
  eternity: eternity(),
  // Арарат: Масис и Сис
  ararat: '<path class="fa" d="M2 54 24 18l12 14 6-6 20 28z"/><path class="fb" d="M18 28l6-10 6 7-4 3-3-2zM39 29l3-3 4 5-3 1z"/><path d="M2 54h60"/>',
  // джезве с кофе
  jazzve: '<path class="fa" d="M20 26h18l-3 26a4 4 0 0 1-4 3h-4a4 4 0 0 1-4-3z"/><path d="M38 30 56 22"/><path class="fb" d="M21 30h16"/><path d="M26 20c0-3 2-4 2-7M32 20c0-3 2-4 2-7"/><path d="M14 58h30"/>',
  // ковёр: ромбы
  carpet: '<rect class="fa" x="10" y="12" width="44" height="40" rx="2"/><path class="fb" d="M32 18 44 32 32 46 20 32z"/><path d="M32 26 37 32 32 38 27 32z"/><path d="M10 56v4M18 56v4M26 56v4M34 56v4M42 56v4M50 56v4"/>',
};

export const DECOR = ['pomegranate', 'apricot', 'lavash', 'duduk', 'khachkar', 'grapes', 'eternity', 'ararat', 'jazzve', 'carpet'];
export const CITY_ART = { A1: 'cascade', A2: 'church', B1: 'dilijan', B2: 'tatev' };

export function art(name, cls = 'art') {
  return make('0 0 64 64', ART[name] || ART.eternity, cls);
}
