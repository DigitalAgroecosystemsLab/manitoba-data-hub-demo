/* App bootstrap. */
(function () {
  const M = window.MADP;
  const { h, icon, openModal } = M.u;

  function init() {
    document.getElementById('brand').innerHTML = M.icons.logoMark() + '<span class="brand-text">Manitoba Agricultural<br>Data Portal</span>';
    document.getElementById('btn-search').replaceChildren(icon('search'));
    document.getElementById('btn-help').replaceChildren(icon('help'));
    document.getElementById('btn-menu').replaceChildren(icon('menu'));
    document.getElementById('btn-search').addEventListener('click', () => M.router.go('/ask'));
    document.getElementById('btn-menu').addEventListener('click', () => document.getElementById('main-nav').classList.toggle('open'));
    document.getElementById('btn-help').addEventListener('click', openGuide);

    M.llm.start();
    M.ui.statusBadge.mount(document.getElementById('status-dock'));
    M.router.run();
  }

  function openGuide() {
    openModal((close) => h('div', { class: 'modal narrow' },
      h('div', { class: 'modal-head' }, h('div', null, h('div', { class: 'eyebrow' }, 'Demo guide'), h('h2', null, 'A two-minute tour')),
        h('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: close }, icon('close'))),
      h('div', { class: 'modal-body stack' },
        h('ol', { class: 'tidy', style: { gap: '10px' } },
          h('li', null, h('b', null, 'Ask: '), 'pick a demonstration question on the home page, or type your own.'),
          h('li', null, h('b', null, 'Watch: '), 'datasets are discovered, harmonised and analysed.'),
          h('li', null, h('b', null, 'Read: '), 'a plain-language answer with a map, charts and sources.'),
          h('li', null, h('b', null, 'Trust: '), 'open "How was this answer generated?" and click the F-A-I-R badges.'),
          h('li', null, h('b', null, 'Explore: '), 'browse the catalogue, then open the Situation Room.')),
        h('div', { class: 'callout amber' }, icon('alert'), h('div', null, 'Everything shown is demonstration data. Nothing is live or official.')),
        h('a', { class: 'btn btn-primary', href: '#/ask', onclick: close }, 'Start with a question', icon('arrow-right')))));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
