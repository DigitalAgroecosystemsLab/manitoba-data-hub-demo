/* Core utilities. Everything hangs off window.MADP (no modules: works from file://). */
(function () {
  const M = (window.MADP = window.MADP || {});
  const SVG_NS = 'http://www.w3.org/2000/svg';

  /** Hyperscript: h('div', {class:'x', onclick:fn}, child, 'text', [more]) */
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    apply(el, props);
    append(el, kids);
    return el;
  }
  function s(tag, props, ...kids) {
    const el = document.createElementNS(SVG_NS, tag);
    apply(el, props, true);
    append(el, kids);
    return el;
  }
  function apply(el, props, isSvg) {
    if (!props) return;
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.setAttribute('class', v);
      else if (k === 'style' && typeof v === 'object') { for (const [sk, sv] of Object.entries(v)) { if (sk.startsWith('--')) el.style.setProperty(sk, sv); else el.style[sk] = sv; } }
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
  }
  function append(el, kids) {
    for (const k of kids.flat(Infinity)) {
      if (k == null || k === false) continue;
      el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
    }
  }
  const icon = (name, cls) => {
    const w = document.createElement('span');
    w.style.display = 'inline-flex';
    w.innerHTML = M.icons.svg(name, cls);
    return w.firstChild;
  };
  const setKids = (el, ...kids) => { el.replaceChildren(); append(el, kids); return el; };
  const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };

  /* ---------- formatting ---------- */
  function fmtNum(v, decimals) {
    if (v == null || Number.isNaN(v)) return '–';
    if (typeof v !== 'number') return String(v);
    const d = decimals == null ? (Number.isInteger(v) ? 0 : 1) : decimals;
    return v.toLocaleString('en-CA', { minimumFractionDigits: d, maximumFractionDigits: d }).replace('-', '\u2212');
  }
  function fmtDate(s) {
    if (!s || !/^\d{4}-\d{2}-\d{2}/.test(s)) return String(s);
    const d = new Date(s + 'T12:00:00');
    return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  const shortDate = (s) => {
    const d = new Date(s + 'T12:00:00');
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const slug = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const unique = (a) => [...new Set(a)];

  /* ---------- colour ---------- */
  function hex2rgb(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function rgb2hex(r, g, b) { return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join(''); }
  function ramp(stops, t) {
    t = clamp(t, 0, 1);
    const n = stops.length - 1, i = Math.min(n - 1, Math.floor(t * n)), f = t * n - i;
    const a = hex2rgb(stops[i]), b = hex2rgb(stops[i + 1]);
    return rgb2hex(lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f));
  }
  const PALETTES = {
    drought: ['#f2f2ee', '#fff1a8', '#fcd37b', '#f59e3a', '#e0542b', '#8e1b1b'],  // categorical (None, D0..D4)
    drought_pct: ['#fff8dc', '#fcd37b', '#f59e3a', '#e0542b', '#8e1b1b'],
    stress: ['#e9f5e4', '#f7e58a', '#f5b04c', '#e0642b', '#a31d1d'],
    moisture: ['#a3411f', '#e6a65a', '#f0e6b8', '#9ccbe0', '#2c6fa8'],
    diverging_dry: ['#a3411f', '#e8a15a', '#f5efe0', '#a5cde3', '#2c6fa8'],
    diverging_veg: ['#a3411f', '#e8a15a', '#f1ecd2', '#a7d08c', '#2f7a3a'],
    carbon: ['#f3ecd9', '#d9c08a', '#a98152', '#6a4a2c', '#3a2616'],
    change_loss: ['#8e2a1c', '#d6643a', '#f0b78a', '#f8e9d8'],
    change_gain: ['#f6f1dc', '#e3d485', '#b5a23c', '#6f6a1c'],
    health: ['#c75a3a', '#e8b25c', '#d6e08a', '#77b562', '#2f7a3a'],
    risk_blue: ['#eaf3fa', '#a8cbe6', '#5b9bd0', '#2a63a0', '#14366b'],
  };
  /** Colour for a value in a field spec ({palette, domain, categories}). */
  function colorFor(spec, v) {
    if (v == null || Number.isNaN(v)) return '#e4e9ec';
    const pal = PALETTES[spec.palette] || PALETTES.stress;
    const [lo, hi] = spec.domain || [0, 100];
    if (spec.palette === 'drought') return pal[clamp(Math.round(v), 0, 5)];
    return ramp(pal, (v - lo) / (hi - lo || 1));
  }
  function gradientCss(spec) {
    const pal = PALETTES[spec.palette] || PALETTES.stress;
    return 'linear-gradient(90deg,' + pal.join(',') + ')';
  }

  /* ---------- modal / toast ---------- */
  let modalStack = [];
  function openModal(content, opts = {}) {
    const overlay = h('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true' });
    const close = () => { overlay.remove(); modalStack = modalStack.filter((m) => m !== close); document.removeEventListener('keydown', onKey); opts.onClose && opts.onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
    overlay.appendChild(typeof content === 'function' ? content(close) : content);
    document.body.appendChild(overlay);
    modalStack.push(close);
    return close;
  }
  function closeAllModals() { [...modalStack].forEach((c) => c()); }
  function toast(msg, ms = 2200) {
    const t = h('div', { class: 'toast', role: 'status' }, msg);
    document.body.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }
  function download(filename, text, mime = 'application/json') {
    const blob = new Blob([text], { type: mime });
    const a = h('a', { href: URL.createObjectURL(blob), download: filename });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); }
    catch { toast('Copy not available in this browser'); }
  }

  M.u = { h, s, icon, clear, setKids, fmtNum, fmtDate, shortDate, clamp, lerp, debounce, sleep, slug, unique, ramp, PALETTES, colorFor, gradientCss, openModal, closeAllModals, toast, download, copy };
})();
