/* Minimal hash router: #/path?query. Pages register with MADP.router.add(path, fn). */
(function () {
  const M = (window.MADP = window.MADP || {});
  const routes = [];
  let current = null;

  function parse() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, qs] = raw.split('?');
    return { path: path || '/', query: Object.fromEntries(new URLSearchParams(qs || '')) };
  }
  function add(pattern, render, nav) {
    const keys = [];
    const rx = new RegExp('^' + pattern.replace(/:([a-z]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
    routes.push({ rx, keys, render, nav: nav || pattern });
  }
  async function run() {
    const { path, query } = parse();
    for (const r of routes) {
      const m = r.rx.exec(path);
      if (!m) continue;
      const params = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      const app = document.getElementById('app');
      if (current && current.cleanup) { try { current.cleanup(); } catch (e) { console.warn(e); } }
      M.u.closeAllModals();
      app.replaceChildren();
      window.scrollTo(0, 0);
      document.querySelectorAll('.main-nav a').forEach((a) => a.classList.toggle('active', a.dataset.nav === r.nav));
      document.querySelector('.main-nav')?.classList.remove('open');
      const token = (current = { cleanup: null });
      try {
        const out = await r.render({ params, query, path, mount: app, onCleanup: (fn) => (token.cleanup = fn), isCurrent: () => current === token });
        if (current === token && out instanceof Node) app.appendChild(out);
      } catch (e) {
        console.error(e);
        app.appendChild(M.u.h('div', { class: 'container page' }, M.u.h('div', { class: 'callout amber' }, 'Something went wrong rendering this page: ' + e.message)));
      }
      return;
    }
    location.hash = '#/';
  }
  function go(path, query) {
    const qs = query ? '?' + new URLSearchParams(query).toString() : '';
    location.hash = '#' + path + qs;
  }
  window.addEventListener('hashchange', run);
  M.router = { add, run, go, parse };
})();
