/* Discreet system status badge. Reads the status object from MADP.llm (backend /api/status or offline defaults). */
(function () {
  const M = (window.MADP = window.MADP || {});
  const { h, icon } = M.u;

  function mount(dock) {
    let pop = null;
    const pill = h('button', { class: 'status-pill', type: 'button', 'aria-label': 'System status', onclick: toggle });
    dock.append(pill);

    function toggle() {
      if (pop) { pop.remove(); pop = null; return; }
      pop = buildPop(M.llm.getStatus());
      dock.append(pop);
    }
    document.addEventListener('click', (e) => { if (pop && !dock.contains(e.target)) { pop.remove(); pop = null; } });

    function buildPop(st) {
      const p = st.provider || {};
      return h('div', { class: 'status-pop', role: 'dialog' },
        h('h4', null, 'System status'),
        h('dl', null,
          h('dt', null, 'AI'), h('dd', null, st.mode === 'live' ? `${st.ai}: ${p.name}, ${p.model}` : 'Pre-generated demonstration responses (DEMO_MODE)'),
          h('dt', null, 'Data processing'), h('dd', null, `${st.data_processing}: all datasets read from local files`),
          h('dt', null, 'Internet required'), h('dd', null, st.internet_required ? 'Yes (remote model endpoint configured)' : 'No: works fully offline'),
          h('dt', null, 'Backend'), h('dd', null, st.reachable ? `Connected (${M.llm.apiBase()})` : 'Not running (offline page mode)'),
          h('dt', null, 'Detail'), h('dd', null, p.detail || '\u2013')),
        h('div', { class: 'tip' }, st.reachable ? 'Live mode uses a locally installed Ollama model. If Ollama stops, the portal switches to demo mode automatically so a presentation never fails.'
          : window.MADP_PUBLIC_SITE ? 'This online copy shows pre-generated demonstration answers. The full prototype runs a language model locally.' : 'To enable the local language model: run start_demo.command, install Ollama and pull a model. This page works without them.'),
        h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: async (e) => { e.stopPropagation(); await M.llm.refresh(true); M.u.toast('Status refreshed'); } }, icon('refresh'), 'Re-check')));
    }

    M.llm.onStatus((st) => {
      const live = st.mode === 'live';
      pill.className = 'status-pill' + (live ? (st.internet_required ? ' remote' : '') : ' demo');
      pill.replaceChildren(
        h('span', { class: 'led' }),
        h('span', null, 'AI: ', h('b', null, live ? st.ai : 'Local'), live ? null : h('span', { style: { color: 'var(--amber-700)', fontWeight: 600 } }, ' \u00b7 demo mode')),
        h('span', { class: 'sep' }),
        h('span', null, 'Data processing: ', h('b', null, st.data_processing)),
        h('span', { class: 'sep' }),
        h('span', null, 'Internet required: ', h('b', null, st.internet_required ? 'Yes' : 'No')));
      if (pop) { pop.remove(); pop = buildPop(st); dock.append(pop); }
    });
  }
  M.ui = M.ui || {};
  M.ui.statusBadge = { mount };
})();
