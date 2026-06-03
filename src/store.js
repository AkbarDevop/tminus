// store.js - persistence layer.
// Prefers chrome.storage.local (real extension), falls back to localStorage so
// the page also works when opened directly as a file:// for preview/testing.

const KEY = 'onward.state.v1';

/** Build the first-run state. `now` is injectable for testing. */
export function defaultState(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  // date-only string YYYY-MM-DD, `days` days from now
  const dateIn = (days) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  return {
    version: 1,
    theme: 'paper',        // paper | ink | slate | sage | sand | midnight | system
    font: 'sans',          // sans | mono | serif | rounded
    decimals: 6,           // fractional-day digits after the big number
    showAge: false,        // optional faint "alive" line
    dob: '',               // date only, YYYY-MM-DD
    name: '',
    featuredId: 'seed-1',
    deadlines: [
      { id: 'seed-1', title: 'Demo Day', subtitle: 'until the thing that matters', target: dateIn(90), icon: 'Y' },
      { id: 'seed-2', title: 'Launch', subtitle: '', target: dateIn(30), icon: '🚀' },
    ],
    links: [
      { id: 'l1', label: 'Calendar', url: 'https://calendar.google.com' },
      { id: 'l2', label: 'Mail', url: 'https://mail.google.com' },
      { id: 'l3', label: 'GitHub', url: 'https://github.com' },
      { id: 'l4', label: 'Docs', url: 'https://docs.google.com' },
    ],
  };
}

const hasChrome = () =>
  typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

export async function loadState() {
  let raw = null;
  if (hasChrome()) {
    const got = await chrome.storage.local.get(KEY);
    raw = got[KEY] ?? null;
  } else {
    try { raw = JSON.parse(localStorage.getItem(KEY)); } catch { raw = null; }
  }
  if (!raw) {
    const seeded = defaultState();
    await saveState(seeded);
    return seeded;
  }
  return { ...defaultState(), ...raw };
}

export async function saveState(state) {
  if (hasChrome()) {
    await chrome.storage.local.set({ [KEY]: state });
  } else {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  // Mirror theme + font so theme-init.js can apply them before first paint.
  try {
    localStorage.setItem('onward.theme', state.theme || 'paper');
    localStorage.setItem('onward.font', state.font || 'sans');
  } catch {}
  return state;
}

export function onExternalChange(cb) {
  if (hasChrome() && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes[KEY]) cb(changes[KEY].newValue);
    });
  } else {
    window.addEventListener('storage', (e) => {
      if (e.key === KEY && e.newValue) {
        try { cb(JSON.parse(e.newValue)); } catch {}
      }
    });
  }
}

let _seq = 0;
export function newId() {
  _seq += 1;
  return 'd' + Date.now().toString(36) + _seq.toString(36);
}
