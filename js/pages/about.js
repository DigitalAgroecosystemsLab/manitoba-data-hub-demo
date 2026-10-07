/* About page: the story, the architecture, what the prototype is and is not. */
(function () {
  const M = (window.MADP = window.MADP || {});
  const { h, icon } = M.u;

  function render() {
    const roadmap = [
      ['Phase 1', 'This prototype', 'Offline demonstration of the full experience: question, analysis, interpretable answer, catalogue and Situation Room, on demonstration data.', true],
      ['Phase 2', 'Connect real data', 'Register priority provincial, federal and University of Manitoba datasets through FAIR metadata and connect first live services.', false],
      ['Phase 3', 'Operational intelligence', 'Institution-hosted language model, authentication, scheduled updates, partner onboarding and decision-support workflows.', false],
    ];
    return h('div', { class: 'fade-in' },
      h('section', { class: 'about-hero' }, h('div', { class: 'container' },
        h('div', { class: 'eyebrow' }, 'About'), h('h1', null, 'Ask the data, not the database.'),
        h('p', null, 'A FAIR, interoperable, interpretable agricultural data hub that connects local, provincial, federal, research and global datasets and turns fragmented information into decision-ready answers.'))),
      h('div', { class: 'container' },
        h('section', { class: 'section' }, h('div', { class: 'two-col about-problem' },
          h('div', { class: 'card card-pad' }, h('div', { class: 'chip red', style: { marginBottom: '10px' } }, 'The problem'), h('h3', { style: { fontSize: '22px', marginBottom: '8px' } }, 'Enormous amounts of data, fragmented'),
            h('ul', { class: 'tidy', style: { fontSize: '15px' } }, h('li', null, 'Soil, climate, crop, water and land data sit in different organizations.'), h('li', null, 'Formats, coordinate systems, units and licences differ.'), h('li', null, 'Finding and combining them takes specialists days or weeks.'), h('li', null, 'AI answers without provenance cannot be trusted for decisions.'))),
          h('div', { class: 'card card-pad', style: { borderTop: '5px solid var(--green-600)' } }, h('div', { class: 'chip green', style: { marginBottom: '10px' } }, 'The approach'), h('h3', { style: { fontSize: '22px', marginBottom: '8px' } }, 'Connect, harmonise, explain'),
            h('ul', { class: 'tidy', style: { fontSize: '15px' } }, h('li', null, 'Describe every dataset the same way (FAIR metadata).'), h('li', null, 'Harmonise formats, units, dates and regions.'), h('li', null, 'Compute statistics and maps in code.'), h('li', null, 'Use AI only to explain evidence, and show exactly how.'))))),
        h('section', { class: 'section' }, h('div', { class: 'dflow' }, [['1', 'Data', 'Local \u00b7 provincial \u00b7 federal \u00b7 research \u00b7 global'], ['2', 'Integration', 'FAIR layer + harmonisation'], ['3', 'Intelligence', 'Analytics + GIS + AI'], ['4', 'Decision', 'Interpretable answers']].map(([n, t, d]) => h('div', { class: 'dstep' }, h('div', { class: 'n' }, n), h('h4', null, t), h('p', null, d))))),
        h('section', { class: 'section' }, h('div', { class: 'section-title' }, h('h2', null, 'Architecture'), h('p', null, 'Click any source or stage.')), M.ui.archDiagram()),
        h('section', { class: 'section' }, h('div', { class: 'statement' },
          h('div', { style: { position: 'relative', zIndex: 1 } }, h('div', { class: 'eyebrow', style: { color: '#8fd29b' } }, 'Principle'), h('h2', null, 'We are not replacing existing databases.'), h('p', null, 'We are creating the intelligence and interoperability layer that makes existing and future data investments work together.')),
          h('div', { class: 'kv' }, [['database', 'Data stay with their owners'], ['link', 'Connected via shared metadata'], ['cpu', 'AI explains, never invents'], ['shield', 'Every answer is auditable']].map(([ic, t]) => h('div', null, icon(ic), t))))),
        h('section', { class: 'section' }, h('div', { class: 'section-title' }, h('h2', null, 'What this prototype is, and is not')),
          h('div', { class: 'two-col' },
            h('div', { class: 'card card-pad' }, h('h3', { style: { fontSize: '18px', marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'center' } }, icon('check'), 'It is'),
              h('ul', { class: 'tidy' }, h('li', null, 'A working demonstration that runs offline from a double-clicked file.'), h('li', null, 'A local Python backend with a locally installed language model (Ollama) and automatic fall-back to pre-generated answers.'), h('li', null, 'Built with replaceable layers: swap in real APIs, GIS services or an institutional model without changing the interface.'))),
            h('div', { class: 'card card-pad' }, h('h3', { style: { fontSize: '18px', marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'center' } }, icon('alert'), 'It is not'),
              h('ul', { class: 'tidy' }, h('li', null, 'Connected to live or official data. All values, identifiers and connections are demonstration data.'), h('li', null, 'A decision tool: thresholds, indices and boundaries are illustrative.'), h('li', null, 'A replacement for any existing database or program.'))))),
        h('section', { class: 'section' }, h('div', { class: 'section-title' }, h('h2', null, 'Roadmap')),
          h('div', { class: 'roadmap' }, roadmap.map(([p, t, d, now]) => h('div', { class: 'card card-pad road' + (now ? ' now' : '') }, h('div', { class: 'chip ' + (now ? 'green' : 'outline') }, p + (now ? ' \u00b7 you are here' : '')), h('h3', { style: { fontSize: '19px', margin: '10px 0 6px' } }, t), h('p', { class: 'muted', style: { fontSize: '14.5px' } }, d))))),
        h('section', { class: 'section' }, M.ui.partnerStrip()),
        h('div', { class: 'tagband' }, h('span', null, 'Built for Manitoba.'), ' Connected to Canada. ', h('em', null, 'Interoperable globally.'))));
  }
  M.router.add('/about', render, '/about');
})();
