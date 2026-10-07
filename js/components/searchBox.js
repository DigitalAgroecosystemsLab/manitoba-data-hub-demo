/* Natural-language search box ("What can I help you with today?") with suggestions. */
(function () {
  const M = (window.MADP = window.MADP || {});
  const { h, icon } = M.u;

  function submit(text) {
    const q = (text || '').trim();
    if (!q) return;
    M.router.go('/ask', { q, t: Date.now() });
  }

  function score(text, q) {
    const t = text.toLowerCase(), words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    return words.filter((w) => t.includes(w)).length;
  }

  function searchBox(opts = {}) {
    const input = h('input', { class: 'search-input', type: 'text', value: opts.value || '', placeholder: 'What can I help you with today?', 'aria-label': 'Ask a question about Manitoba agriculture', autocomplete: 'off', spellcheck: 'false' });
    const list = h('div', { class: 'suggest', role: 'listbox' });
    const btn = h('button', { class: 'search-go', type: 'submit', 'aria-label': 'Ask' }, icon('arrow-right'));
    const form = h('form', { class: 'searchbar' + (opts.big ? ' big' : ''), onsubmit: (e) => { e.preventDefault(); submit(input.value); } },
      h('span', { class: 'search-ico' }, icon('search')), input, btn, list);

    function renderList() {
      const q = input.value.trim();
      let qs = M.data.questions.map((x) => ({ x, s: q ? score(x.text + ' ' + x.keywords.join(' '), q) : 0 }));
      if (q) qs = qs.filter((o) => o.s > 0).sort((a, b) => b.s - a.s);
      M.u.setKids(list,
        h('div', { class: 'suggest-head' }, q ? 'Matching demonstration questions' : 'Try one of these demonstration questions'),
        ...qs.map(({ x }) => h('button', { type: 'button', class: 'suggest-item', onmousedown: (e) => { e.preventDefault(); input.value = x.text; submit(x.text); } },
          h('span', { class: 'suggest-ico' }, icon(({ Soils: 'seed', Crops: 'sprout', Water: 'drop', Environment: 'leaf' })[x.category] || 'search')),
          h('span', null, x.text), h('span', { class: 'chip outline', style: { marginLeft: 'auto' } }, x.category))),
        q ? h('div', { class: 'suggest-foot' }, icon('sparkles'), 'Press Enter to ask: ', h('b', null, q)) : null);
    }
    input.addEventListener('focus', () => { renderList(); form.classList.add('open'); });
    input.addEventListener('input', renderList);
    input.addEventListener('blur', () => setTimeout(() => form.classList.remove('open'), 120));
    if (opts.autofocus) setTimeout(() => input.focus(), 50);
    form.focusInput = () => input.focus();
    return form;
  }

  M.ui = M.ui || {};
  M.ui.searchBox = searchBox;
  M.ui.askQuestion = submit;
})();
