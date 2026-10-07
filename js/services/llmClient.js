/* LLM client.
 *
 *   web interface -> local Python backend -> local datasets -> Ollama -> structured response -> interface
 *
 * If the backend is not running (e.g. index.html double-clicked), the client transparently switches to
 * DEMO mode using pre-generated responses embedded in data/bundle.js. The UI renders the same response
 * envelope either way, so replacing Ollama with another provider never touches the interface.
 */
(function () {
  const M = (window.MADP = window.MADP || {});
  const D = M.data;
  const listeners = new Set();
  let status = offlineStatus('Checking for local backend…');
  let started = false;

  function apiBase() {
    const q = new URLSearchParams(location.search).get('api');
    if (q) return q.replace(/\/$/, '');
    if (location.protocol === 'http:' || location.protocol === 'https:') return location.origin;
    try { return localStorage.getItem('madp.api') || 'http://127.0.0.1:8000'; } catch { return 'http://127.0.0.1:8000'; }
  }

  function offlineStatus(detail) {
    return {
      source: 'offline', reachable: false, mode: 'demo', demo_mode_forced: false,
      provider: { name: 'demo', model: 'pre-generated', configured_model: null, local: true, healthy: false, detail: detail || 'Backend not running: using pre-generated responses embedded in this page' },
      ai: 'Local (demo mode)', data_processing: 'Local', internet_required: false,
    };
  }

  async function fetchJson(url, opts = {}) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), opts.timeout || 2000);
    try {
      const res = await fetch(url, { ...opts, signal: ctl.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } finally { clearTimeout(t); }
  }

  async function refresh(force) {
    if (window.MADP_PUBLIC_SITE) {
      status = offlineStatus('Public online demo: using pre-generated responses embedded in this page');
      listeners.forEach((fn) => fn(status));
      return status;
    }
    try {
      const s = await fetchJson(apiBase() + '/api/status' + (force ? '?refresh=true' : ''), { timeout: 2500 });
      status = { source: 'backend', reachable: true, ...s };
    } catch {
      status = offlineStatus();
    }
    listeners.forEach((fn) => fn(status));
    return status;
  }
  function start() {
    if (started) return;
    started = true;
    refresh();
    if (!window.MADP_PUBLIC_SITE) setInterval(() => refresh(), 12000);
  }
  function onStatus(fn) { listeners.add(fn); fn(status); return () => listeners.delete(fn); }

  /* ---------- offline question matching (mirrors backend/orchestrator.match_demo_question) ---------- */
  const norm = (t) => t.toLowerCase().replace(/[^a-z0-9\-\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const has = (qn, phrase) => new RegExp('\\b' + phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:s|es|d|ed|ing)?\\b').test(qn);
  function matchDemoQuestion(text) {
    const qn = norm(text);
    for (const q of D.questions) if (norm(q.text) === qn) return q.id;
    let best = null, bestScore = 0;
    for (const q of D.questions) {
      const score = q.keywords.filter((k) => has(qn, norm(k))).length;
      if (score > bestScore) { best = q.id; bestScore = score; }
    }
    return bestScore >= 2 ? best : null;
  }

  function offlineEnvelope(text) {
    const id = matchDemoQuestion(text);
    if (!id) return { mode: 'unsupported', question: text, supported: D.questions };
    const env = JSON.parse(JSON.stringify(D.demo_envelopes[id]));
    env.question = text.trim() || env.question;
    env.mode = 'demo';
    env.mode_reason = status.reachable ? 'Demo mode requested' : 'Backend not running: pre-generated demonstration response served from this page';
    return env;
  }

  /** Quick look at what the pipeline will use (real data in backend mode; local envelope offline). */
  async function preview(text) {
    if (status.reachable) {
      try {
        return await fetchJson(apiBase() + '/api/retrieve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: text }), timeout: 4000 });
      } catch { /* fall through */ }
    }
    const env = offlineEnvelope(text);
    if (env.mode === 'unsupported') return null;
    return {
      understanding: env.understanding, datasets: env.datasets.slice(0, 6).map((d) => ({ id: d.id, title: d.title, organization: d.organization })),
      n_datasets: env.datasets.length, evidence: env.evidence.map((e) => ({ id: e.id, title: e.title, kind: e.kind, n_rows: e.rows.length })),
    };
  }

  async function ask(text, opts = {}) {
    if (status.reachable && !opts.forceDemo) {
      try {
        const env = await fetchJson(apiBase() + '/api/ask', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: text, demo: !!opts.forceDemo }), timeout: 240000,
        });
        return env;
      } catch (e) {
        console.warn('Backend call failed; using offline demo response.', e);
        status = offlineStatus('Backend call failed: using pre-generated responses');
        listeners.forEach((fn) => fn(status));
      }
    }
    return offlineEnvelope(text);
  }

  M.llm = { start, refresh, onStatus, ask, preview, matchDemoQuestion, getStatus: () => status, apiBase };
})();
