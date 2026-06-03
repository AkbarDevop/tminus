// app.js - minimalist countdown new tab. One featured deadline as a big
// fractional-days number, smaller secondary deadlines, a logo, and links.

import { age, daysCountdown, fractionDigits, parseLocal } from './time.js';
import { loadState, saveState, defaultState, onExternalChange, newId } from './store.js';

const $ = (sel, root = document) => root.querySelector(sel);
const DAY_MS = 86400000;

let state = null;
let featured = null;
const els = {};
let lastWriteSnapshot = null;   // guards against our own storage writes echoing back

const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduceMotion = reduceMQ.matches;
reduceMQ.addEventListener('change', (e) => { reduceMotion = e.matches; renderAll(); });

function setText(el, str) { if (el && el.__last !== str) { el.__last = str; el.textContent = str; } }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
function isImageDataUrl(s) {
  return typeof s === 'string'
    && /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[a-z0-9+/=\s]+$/i.test(s);
}
function isHttpImageUrl(s) { return typeof s === 'string' && /^https?:\/\/\S+$/i.test(s.trim()); }
function isImagey(s) { return isImageDataUrl(s) || isHttpImageUrl(s); }
const SAFE_SCHEMES = ['http', 'https', 'mailto', 'tel', 'ftp'];
function normalizeUrl(u) {
  if (!u) return '#';
  const s = u.trim();
  const m = s.match(/^([a-z][a-z0-9+.-]*):/i);
  if (m) return SAFE_SCHEMES.includes(m[1].toLowerCase()) ? s : '#';
  return `https://${s}`;
}
function firstGlyph(d) { return (d.title || '?').trim().charAt(0).toUpperCase() || '?'; }
function dateOnly(s) { return (s || '').slice(0, 10); }

/* ----------------------------------------------------- look options */
const THEMES = [
  { k: 'paper', label: 'Paper', bg: '#f1efe9', accent: '#e0531f' },
  { k: 'ink', label: 'Ink', bg: '#0c0c0d', accent: '#ff5c38' },
  { k: 'slate', label: 'Slate', bg: '#717f89', accent: '#fb651e' },
  { k: 'sage', label: 'Sage', bg: '#6f7a6c', accent: '#ee6c3a' },
  { k: 'sand', label: 'Sand', bg: '#8a7d6b', accent: '#e0531f' },
  { k: 'midnight', label: 'Midnight', bg: '#1b2330', accent: '#ff6a3d' },
  { k: 'system', label: 'Auto', bg: 'linear-gradient(135deg,#f1efe9 50%,#0c0c0d 50%)', accent: '#9aa' },
];
const FONTS = [
  { k: 'sans', label: 'Sans' }, { k: 'rounded', label: 'Rounded' },
  { k: 'serif', label: 'Serif' }, { k: 'mono', label: 'Mono' },
];

/* a curated, offline emoji set (no CDN, CSP-safe), iPhone-style categories */
const EMOJI = {
  '😀': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😋','😛','😜','🤪','🤗','🤭','🤫','🤔','😐','😏','😌','😔','😴','😎','🥳','🤓','🧐','😤','😭','😱','🤯','🥵','🥶','😬','🙄','😮','😵','🤠','🤡','👻','💀','👽','🤖'],
  '👋': ['👋','🤚','✋','🖖','👌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🙏','💪','🦾','✍️','💅','🤳','👀','🧠','❤️‍🔥'],
  '❤️': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','⭐','🌟','✨','⚡','🔥','💥','💫','🌈','☀️','🌙','💯','🎯'],
  '🐶': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦄','🐝','🦋','🐢','🐍','🦖','🐙','🦀','🐳','🐬','🐟','🦈','🐊','🐘','🦒','🦓','🦍','🦅','🦉'],
  '🍎': ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🥑','🌽','🥕','🥐','🍞','🧀','🍳','🥞','🍔','🍟','🍕','🌭','🌮','🌯','🍜','🍣','🍰','🎂','🍩','🍪','☕','🍵','🍺','🍷','🥂'],
  '⚽': ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸','🥅','🏒','🏑','🏏','⛳','🏹','🎣','🥊','🥋','🎽','⛸️','🎿','🛷','🥌','🎯','🎮','🕹️','🎲','🎰','🎳','🏆','🥇','🥈','🥉','🎖️'],
  '✈️': ['🚗','🚕','🚙','🚌','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚜','🛵','🏍️','✈️','🚀','🛸','🚁','⛵','🚤','🛳️','⚓','🚉','🚄','🗺️','🗽','🗼','🏰','🎡','🎢','🎠','🏖️','🏝️','🏔️','⛰️','🌋','🏕️','🏠'],
  '💡': ['⌚','📱','💻','⌨️','🖥️','🖨️','🖱️','💾','📷','📸','🎥','📺','📻','🎙️','⏰','⏱️','🔋','🔌','💡','🔦','📔','📕','📗','📘','📙','📚','📝','✏️','✒️','🖊️','🖌️','📌','📎','🔗','📐','✂️','🔒','🔑','🔨','🛠️','⚙️','🧲','💰','💎','🎁','🎈','🎉','🎊'],
  '✅': ['✅','❌','⭕','❗','❓','🔔','🔕','🎵','🎶','➕','➖','✖️','➗','♾️','💲','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔶','🔷','⬆️','⬇️','⬅️','➡️','🔄','♻️','✔️','™️','®️','©️'],
};
const CATS = Object.keys(EMOJI);

/* ----------------------------------------------------------------- boot */
(async function init() {
  state = await loadState();
  applyTheme(state.theme);
  applyFont(state.font);
  renderAll();
  wirePanel();
  startLoop();

  onExternalChange((newState) => {
    if (!newState) return;
    // Swallow exactly one echo of our own write, then re-arm so a later
    // genuinely-external change with the same value is still honored.
    if (JSON.stringify(newState) === lastWriteSnapshot) { lastWriteSnapshot = null; return; }
    state = { ...defaultState(), ...newState };
    applyTheme(state.theme);
    applyFont(state.font);
    renderAll();
    const active = document.activeElement;
    const typing = active && (
      (!$('#panel').hidden && $('#panel').contains(active)) ||
      ($('#emojiPop') && $('#emojiPop').contains(active))
    );
    if (!$('#panel').hidden && !typing) populatePanel();
  });

  const mq = window.matchMedia('(prefers-color-scheme: light)');
  mq.addEventListener('change', () => { if (state.theme === 'system') applyTheme('system'); });
})();

function applyTheme(theme) {
  let t = theme || 'paper';
  if (t === 'system') t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'paper' : 'ink';
  document.documentElement.setAttribute('data-theme', t);
}
function applyFont(font) { document.documentElement.setAttribute('data-font', font || 'sans'); }

/* --------------------------------------------------------- render: page */
function resolveFeatured() {
  featured = state.deadlines.find((d) => d.id === state.featuredId) || state.deadlines[0] || null;
}
function logoMarkup(d) {
  const icon = (d.icon || '').trim();
  const fb = escapeHtml(firstGlyph(d));
  if (isImagey(icon)) return `<span class="logo-chip is-img"><img src="${escapeHtml(icon)}" alt="" data-fallback="${fb}"></span>`;
  if (icon && !icon.startsWith('data:')) {
    if (/^[A-Za-z0-9]$/.test(icon)) return `<span class="logo-chip">${escapeHtml(icon.toUpperCase())}</span>`;
    return `<span class="logo-chip is-emoji">${escapeHtml(icon)}</span>`;
  }
  return `<span class="logo-chip">${fb}</span>`;
}
function wireLogoFallbacks(root) {
  root.querySelectorAll('img[data-fallback]').forEach((img) => {
    img.addEventListener('error', () => {
      const glyph = img.getAttribute('data-fallback') || '?';
      const chip = img.closest('.logo-chip');
      if (chip) { chip.className = 'logo-chip'; chip.textContent = glyph; return; }
      const btn = img.closest('.iconbtn');   // settings-row preview: keep the ::after upload badge
      if (btn) btn.textContent = glyph;
    });
  });
}
function linksMarkup() {
  const parts = [];
  state.links.forEach((l) => {
    if (!l.url && !l.label) return;
    if (parts.length) parts.push('<span class="sep">|</span>');
    parts.push(`<a href="${escapeHtml(normalizeUrl(l.url))}" rel="noopener">${escapeHtml(l.label || l.url)}</a>`);
  });
  return parts.join('');
}

function renderAll() {
  resolveFeatured();
  const stage = $('#stage');
  els.int = els.dec = els.unit = els.count = els.ageLead = els.ageFrac = null;
  els.others = [];

  if (!featured || !parseLocal(featured.target)) {
    stage.innerHTML = `
      <div class="empty">
        ${featured ? logoMarkup(featured) : ''}
        <div class="msg">${featured ? 'No date set for this deadline.' : 'No deadline yet. Add one.'}</div>
        <button class="cta" type="button" id="emptyAdd">${featured ? 'Set a date' : '+ Add deadline'}</button>
      </div>`;
    wireLogoFallbacks(stage);
    $('#emptyAdd').addEventListener('click', () => { openPanel(); if (!featured) addDeadline(); });
    return;
  }

  const others = state.deadlines.filter((d) => d.id !== featured.id && parseLocal(d.target));
  const othersMarkup = others.length ? `<div class="others">${others.map((d) => {
    const ic = (d.icon || '').trim();
    const icSpan = (ic && !ic.startsWith('data:') && !isHttpImageUrl(ic)) ? `<span class="ic">${escapeHtml(ic)}</span>` : '';
    return `<button class="other" type="button" data-id="${d.id}" aria-label="Feature ${escapeHtml(d.title || 'deadline')}">${icSpan}${escapeHtml(d.title || 'Untitled')} <b data-other="${d.id}">--</b>d</button>`;
  }).join('')}</div>` : '';

  const ageMarkup = (state.showAge && parseLocal(state.dob))
    ? '<div class="age-hint">alive <span data-f="ageLead"></span><span class="frac" data-f="ageFrac"></span></div>'
    : '';

  const sub = (featured.subtitle || '').trim();
  stage.innerHTML = `
    <div class="head">
      ${logoMarkup(featured)}
      ${sub ? `<div class="subtitle">${escapeHtml(sub)}</div>` : ''}
    </div>
    <div class="count" id="count">
      <span class="int" data-f="int">0</span>
      <span class="tail"><span class="dec" data-f="dec"></span><span class="unit" data-f="unit">days</span></span>
    </div>
    ${othersMarkup}
    <nav class="links" aria-label="Quick links">${linksMarkup()}</nav>
    ${ageMarkup}`;

  wireLogoFallbacks(stage);
  els.count = $('#count');
  els.int = $('[data-f="int"]', stage);
  els.dec = $('[data-f="dec"]', stage);
  els.unit = $('[data-f="unit"]', stage);
  els.ageLead = $('[data-f="ageLead"]', stage);
  els.ageFrac = $('[data-f="ageFrac"]', stage);
  els.others = others.map((d) => ({ el: $(`[data-other="${d.id}"]`, stage), target: d.target }));
  stage.querySelectorAll('.other').forEach((btn) => {
    btn.addEventListener('click', () => setFeatured(btn.getAttribute('data-id')));
  });
}

/* ----------------------------------------------------------- live loop */
function startLoop() {
  tick(Date.now());
  const frame = () => { tick(Date.now()); requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
}
function tick(now) { const d = new Date(now); updateCount(d); updateOthers(d); updateAge(d); }
function updateCount(d) {
  if (!featured || !els.int) return;
  const dc = daysCountdown(featured.target, d);
  if (!dc) return;
  setText(els.int, String(dc.whole));
  setText(els.dec, reduceMotion ? '' : '.' + fractionDigits(dc.fraction, state.decimals || 6));
  setText(els.unit, dc.overdue ? 'days ago' : 'days');
  els.count.classList.toggle('passed', dc.overdue);
}
function updateOthers(d) {
  if (!els.others) return;
  for (const o of els.others) {
    const dc = daysCountdown(o.target, d);
    if (!dc || !o.el) continue;
    setText(o.el, dc.overdue ? '-' + dc.whole : String(dc.whole));
  }
}
function updateAge(d) {
  if (!els.ageLead || !state.dob) return;
  const a = age(state.dob, d);
  if (!a || a.unborn) { setText(els.ageLead, ''); setText(els.ageFrac, ''); return; }
  const dec = a.decimalYears.toFixed(9);
  const [ip, fp] = dec.split('.');
  setText(els.ageLead, `${ip}.${fp.slice(0, 3)}`);
  setText(els.ageFrac, reduceMotion ? '' : ` ${fp.slice(3, 6)} ${fp.slice(6, 9)}`);
}

/* ------------------------------------------------------- state mutation */
let saveTimer = null;
function commit({ rebuildPanelRows = false } = {}) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { lastWriteSnapshot = JSON.stringify(state); saveState(state); }, 250);
  renderAll();
  if (rebuildPanelRows && !$('#panel').hidden) { buildDeadlineRows(); buildLinkRows(); }
}
function updateDeadline(id, patch) {
  const d = state.deadlines.find((x) => x.id === id);
  if (!d) return;
  Object.assign(d, patch);
  commit();
}
function setIcon(id, val) { updateDeadline(id, { icon: val }); if (!$('#panel').hidden) buildDeadlineRows(); }
function addDeadline() {
  const soon = new Date(Date.now() + 14 * DAY_MS);
  const p = (n) => String(n).padStart(2, '0');
  const target = `${soon.getFullYear()}-${p(soon.getMonth() + 1)}-${p(soon.getDate())}`;
  const d = { id: newId(), title: 'New deadline', target, icon: '' };
  state.deadlines.push(d);
  if (!state.deadlines.find((x) => x.id === state.featuredId)) state.featuredId = d.id;
  commit({ rebuildPanelRows: true });
}
function removeDeadline(id) {
  state.deadlines = state.deadlines.filter((x) => x.id !== id);
  if (state.featuredId === id) state.featuredId = state.deadlines[0]?.id || null;
  commit({ rebuildPanelRows: true });
}
function setFeatured(id) { state.featuredId = id; commit({ rebuildPanelRows: true }); }
function addLink() { if (state.links.length >= 6) return; state.links.push({ id: newId(), label: 'Link', url: 'https://' }); commit({ rebuildPanelRows: true }); }
function removeLink(id) { state.links = state.links.filter((x) => x.id !== id); commit({ rebuildPanelRows: true }); }

/* ----------------------------------------------------------- settings */
function wirePanel() {
  $('#editBtn').addEventListener('click', () => (($('#panel').hidden) ? openPanel() : closePanel()));
  $('#closeBtn').addEventListener('click', closePanel);
  $('#panelScrim').addEventListener('click', closePanel);
  $('#addDeadline').addEventListener('click', addDeadline);
  $('#addLink').addEventListener('click', addLink);
  $('#resetBtn').addEventListener('click', resetAll);
  $('#decimalsSelect').addEventListener('change', (e) => { state.decimals = Number(e.target.value); commit(); });
  $('#showAgeToggle').addEventListener('change', (e) => { state.showAge = e.target.checked; commit(); });
  $('#dobInput').addEventListener('change', (e) => { state.dob = e.target.value; commit(); });
  $('#logoFile').addEventListener('change', onLogoFile);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if ($('#emojiPop')) { closeEmojiPicker(); return; }
    if (!$('#panel').hidden) closePanel();
  });
}

let lastFocus = null;
function openPanel(focus) {
  lastFocus = document.activeElement;
  $('#panel').hidden = false;
  $('#panelScrim').hidden = false;
  $('#stage').inert = true;
  $('#editBtn').inert = true;
  populatePanel();
  setTimeout(() => { (focus === 'dob' ? $('#dobInput') : $('#closeBtn')).focus(); }, 50);
}
function closePanel() {
  closeEmojiPicker();
  $('#panel').hidden = true;
  $('#panelScrim').hidden = true;
  $('#stage').inert = false;
  $('#editBtn').inert = false;
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
function resetAll() {
  if (!window.confirm('Reset all deadlines, links, and settings to defaults?')) return;
  state = defaultState();
  lastWriteSnapshot = JSON.stringify(state);
  saveState(state);
  applyTheme(state.theme); applyFont(state.font);
  renderAll(); populatePanel();
}
function populatePanel() {
  $('#decimalsSelect').value = String(state.decimals || 6);
  $('#showAgeToggle').checked = !!state.showAge;
  $('#dobInput').value = dateOnly(state.dob);
  buildThemeSwatches();
  buildFontChips();
  buildDeadlineRows();
  buildLinkRows();
}

function buildThemeSwatches() {
  const wrap = $('#themeSwatches');
  wrap.innerHTML = '';
  for (const t of THEMES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch' + (state.theme === t.k ? ' active' : '');
    b.style.background = t.bg;
    b.title = t.label;
    b.setAttribute('aria-label', t.label);
    b.innerHTML = `<span class="dot" style="background:${t.accent}"></span><span class="lbl">${t.label}</span>`;
    b.addEventListener('click', () => { state.theme = t.k; applyTheme(t.k); commit(); buildThemeSwatches(); });
    wrap.appendChild(b);
  }
}
function buildFontChips() {
  const wrap = $('#fontChips');
  wrap.innerHTML = '';
  for (const f of FONTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'font-chip' + (state.font === f.k ? ' active' : '');
    b.setAttribute('data-f', f.k);
    b.innerHTML = `<b>89</b><span>${f.label}</span>`;
    b.addEventListener('click', () => { state.font = f.k; applyFont(f.k); commit(); buildFontChips(); });
    wrap.appendChild(b);
  }
}

function iconPreview(d) {
  const ic = (d.icon || '').trim();
  if (isImagey(ic)) return `<img src="${escapeHtml(ic)}" alt="" data-fallback="${escapeHtml(firstGlyph(d))}">`;
  if (ic && !ic.startsWith('data:')) return escapeHtml(ic);
  return '🙂';
}
function buildDeadlineRows() {
  closeEmojiPicker();          // rows are about to be recreated; drop any open picker
  const wrap = $('#deadlineRows');
  wrap.innerHTML = '';
  for (const d of state.deadlines) {
    const row = document.createElement('div');
    row.className = 'editor deadline';
    row.innerHTML = `
      <div class="ed-top">
        <button class="iconbtn" type="button" title="Choose an emoji or upload a logo">${iconPreview(d)}</button>
        <input type="text" class="d-title" value="${escapeHtml(d.title || '')}" placeholder="Deadline name" />
      </div>
      <input type="text" class="d-sub" value="${escapeHtml(d.subtitle || '')}" placeholder="Subtitle (optional, shows under the logo)" />
      <input type="date" class="d-target" value="${escapeHtml(dateOnly(d.target))}" />
      <div class="ed-bottom">
        <label class="feat"><input type="radio" name="featured" ${d.id === state.featuredId ? 'checked' : ''}> featured</label>
        <button class="del" type="button" title="Delete">Delete ✕</button>
      </div>`;
    wireLogoFallbacks(row);
    $('.iconbtn', row).addEventListener('click', (e) => openEmojiPicker(d.id, e.currentTarget));
    $('.d-title', row).addEventListener('input', (e) => updateDeadline(d.id, { title: e.target.value }));
    $('.d-sub', row).addEventListener('input', (e) => updateDeadline(d.id, { subtitle: e.target.value }));
    $('.d-target', row).addEventListener('change', (e) => updateDeadline(d.id, { target: e.target.value }));
    $('.feat input', row).addEventListener('change', () => setFeatured(d.id));
    $('.del', row).addEventListener('click', () => removeDeadline(d.id));
    wrap.appendChild(row);
  }
}

function faviconUrl(url) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(normalizeUrl(url)).hostname}&sz=64`; }
  catch { return ''; }
}
function buildLinkRows() {
  const wrap = $('#linkRows');
  wrap.innerHTML = '';
  for (const l of state.links) {
    const row = document.createElement('div');
    row.className = 'editor link';
    const fv = faviconUrl(l.url);
    const fb = (l.label || l.url || '?').trim().charAt(0).toUpperCase() || '?';
    row.innerHTML = `
      ${fv ? `<img class="fav" src="${escapeHtml(fv)}" alt="" data-fb="${escapeHtml(fb)}">` : `<span class="fav fallback">${escapeHtml(fb)}</span>`}
      <input type="text" class="l-label" value="${escapeHtml(l.label || '')}" placeholder="Label" />
      <input type="url" class="l-url" value="${escapeHtml(l.url || '')}" placeholder="https://" />
      <button class="del" type="button" title="Delete">✕</button>`;
    const fav = $('.fav', row);
    if (fav && fav.tagName === 'IMG') {
      fav.addEventListener('error', () => {
        const span = document.createElement('span');
        span.className = 'fav fallback'; span.textContent = fav.getAttribute('data-fb') || '?';
        fav.replaceWith(span);
      });
    }
    let favTimer = null;
    $('.l-label', row).addEventListener('input', (e) => { l.label = e.target.value; commit(); });
    $('.l-url', row).addEventListener('input', (e) => {
      l.url = e.target.value; commit();
      clearTimeout(favTimer); favTimer = setTimeout(() => { if (!$('#panel').hidden) buildLinkRows(); }, 700);
    });
    $('.del', row).addEventListener('click', () => removeLink(l.id));
    wrap.appendChild(row);
  }
}

/* ------------------------------------------------ emoji / logo picker */
let pendingLogoId = null;
function closeEmojiPicker() {
  const pop = $('#emojiPop');
  if (pop) pop.remove();
  document.removeEventListener('mousedown', epOutside, true);
}
function epOutside(e) {
  const pop = $('#emojiPop');
  if (pop && !pop.contains(e.target) && !e.target.closest('.iconbtn')) closeEmojiPicker();
}
function openEmojiPicker(deadlineId, anchor) {
  closeEmojiPicker();
  const pop = document.createElement('div');
  pop.className = 'emoji-pop';
  pop.id = 'emojiPop';
  pop.innerHTML = `
    <div class="ep-top">
      <button class="ep-up" type="button">Upload a logo image</button>
      <div class="ep-url"><input class="ep-url-input" type="url" placeholder="or paste an image URL"><button class="ep-url-set" type="button">Set</button></div>
    </div>
    <div class="ep-cats"></div>
    <div class="ep-grid"></div>`;
  document.body.appendChild(pop);

  const r = anchor.getBoundingClientRect();
  const maxH = Math.min(380, window.innerHeight - 24);
  pop.style.maxHeight = maxH + 'px';
  pop.style.top = Math.max(12, Math.min(r.bottom + 8, window.innerHeight - maxH - 12)) + 'px';
  pop.style.left = Math.max(12, Math.min(r.left, window.innerWidth - 332)) + 'px';

  const catBar = $('.ep-cats', pop);
  const grid = $('.ep-grid', pop);
  function showCat(c) {
    grid.innerHTML = '';
    EMOJI[c].forEach((e) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'ep-emoji'; b.textContent = e;
      b.addEventListener('click', () => { setIcon(deadlineId, e); closeEmojiPicker(); });
      grid.appendChild(b);
    });
    catBar.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x.dataset.c === c));
  }
  CATS.forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.c = c; b.textContent = c; b.title = c;
    b.addEventListener('click', () => showCat(c));
    catBar.appendChild(b);
  });
  showCat(CATS[0]);

  $('.ep-up', pop).addEventListener('click', () => { pendingLogoId = deadlineId; $('#logoFile').value = ''; $('#logoFile').click(); });
  const urlInput = $('.ep-url-input', pop);
  const setUrl = () => { const v = urlInput.value.trim(); if (v) { setIcon(deadlineId, v); closeEmojiPicker(); } };
  $('.ep-url-set', pop).addEventListener('click', setUrl);
  urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') setUrl(); });

  setTimeout(() => document.addEventListener('mousedown', epOutside, true), 0);
}

/* upload: downscale to a small PNG so any size works and storage stays tiny */
function processImageFile(file, cb) {
  const reader = new FileReader();
  reader.onload = () => {
    const raw = reader.result;
    const img = new Image();
    img.onload = () => {
      try {
        const max = 256;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        cb(canvas.toDataURL('image/png'));
      } catch { cb(raw); }
    };
    img.onerror = () => cb(raw);  // e.g. some SVGs: keep the original data URL
    img.src = raw;
  };
  reader.readAsDataURL(file);
}
function onLogoFile(e) {
  const file = e.target.files && e.target.files[0];
  if (!file || !pendingLogoId) return;
  if (file.size > 12 * 1024 * 1024) { window.alert('That image is very large (over 12 MB). Please pick a smaller one.'); return; }
  const id = pendingLogoId; pendingLogoId = null;
  processImageFile(file, (dataUrl) => setIcon(id, dataUrl));
  closeEmojiPicker();
}
