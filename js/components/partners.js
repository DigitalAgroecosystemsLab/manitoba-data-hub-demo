/* Partner logos (local files in assets/logos). */
(function () {
  const M = (window.MADP = window.MADP || {});
  const { h } = M.u;
  const PARTNERS = {
    gov: { name: 'Government of Manitoba', src: 'assets/logos/government-of-manitoba.png', w: 190 },
    um: { name: 'University of Manitoba', src: 'assets/logos/university-of-manitoba.png', w: 170 },
  };
  const logo = (key, h_) => h('img', { class: 'partner-logo', src: PARTNERS[key].src, alt: PARTNERS[key].name + ' logo', style: { height: (h_ || 46) + 'px' }, loading: 'eager' });

  function partnerStrip() {
    return h('section', { class: 'partner-strip', 'aria-label': 'Partners and collaborators' },
      h('div', { class: 'eyebrow' }, 'Partners & collaborators'),
      h('div', { class: 'partner-row' },
        h('a', { class: 'partner-tile', href: '#/hub/mb', title: 'MB Core Data' }, logo('gov', 52)),
        h('a', { class: 'partner-tile', href: '#/hub/um', title: 'UM Research' }, logo('um', 58))),
      h('p', { class: 'muted' }, 'Prototype prepared for an NSERC Alliance proposal. Logos identify the proposed partners; they do not indicate endorsement of this demonstration.'));
  }
  M.ui = M.ui || {};
  M.ui.partnerStrip = partnerStrip;
  M.ui.partnerLogo = logo;
})();
