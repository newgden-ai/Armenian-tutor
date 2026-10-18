// Администратор: список других языковых мини-приложений (кнопка «Другие языки» в настройках).
// Название и имя бота; сохраняется в app_config.sister_apps (функция admin_set_sister_apps).
import { rpc } from '../api.js';
import { t } from '../i18n.js';
import { h, mount, spinner, haptic } from '../ui.js';
import { icon } from '../icons.js';

export async function renderSisterApps(app) {
  mount(spinner(t('loading')));
  if (!app.me || !app.me.is_admin) {
    mount(h('div', { class: 'screen' }, h('div', { class: 'card empty' }, icon('lock'), h('p', {}, t('adminOnly')))));
    return;
  }
  const info = await rpc('get_app_info').catch(() => ({}));
  let list = Array.isArray(info.sister_apps) ? info.sister_apps.map((x) => ({ ...x })) : [];
  const status = h('p', { class: 'small muted' });
  const box = h('div', {});
  const title = h('input', { class: 'answer-input', type: 'text', placeholder: t('saTitlePh'), maxlength: '60' });
  const bot = h('input', { class: 'answer-input', type: 'text', placeholder: t('saBotPh'), maxlength: '45', autocapitalize: 'off', spellcheck: 'false' });

  const save = async () => {
    status.textContent = t('loading');
    const res = await rpc('admin_set_sister_apps', { p_apps: list }).catch((e) => ({ error: String(e.message || e) }));
    if (res && res.ok) {
      list = res.apps; haptic('success'); status.textContent = t('saved');
      app.info = { ...(app.info || {}), sister_apps: res.apps };
      draw();
    } else {
      haptic('error');
      status.textContent = (t('saErrors') || {})[res && res.error] || t('saErrors').other;
    }
  };
  const draw = () => {
    box.replaceChildren(
      list.length ? h('div', { class: 'card' }, list.map((a, i) => h('div', { class: 'row sa-row' },
        h('div', { class: 'spacer' }, h('b', {}, a.title), h('div', { class: 'small muted' }, `@${a.bot}`)),
        i > 0 ? h('button', { class: 'chip-btn', type: 'button', title: '↑', onClick: () => { [list[i - 1], list[i]] = [list[i], list[i - 1]]; save(); } }, '↑') : null,
        h('button', { class: 'chip-btn', type: 'button', onClick: () => { list.splice(i, 1); save(); } }, t('saDelete'))))) :
        h('div', { class: 'card empty' }, h('p', {}, t('saEmpty'))));
  };
  draw();
  mount(h('div', { class: 'screen' },
    h('h1', {}, t('saTitle')),
    h('p', { class: 'muted small' }, t('saSub')),
    box,
    h('h2', {}, t('saAdd')),
    h('div', { class: 'card', style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
      title, bot,
      h('button', { class: 'btn', type: 'button', onClick: () => {
        if (!title.value.trim() || !bot.value.trim()) return;
        list.push({ title: title.value.trim(), bot: bot.value.trim() });
        title.value = ''; bot.value = '';
        save();
      } }, t('saAddBtn'))),
    status));
}
