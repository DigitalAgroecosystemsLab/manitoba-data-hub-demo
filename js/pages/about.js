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
              h('ul', { class: 'tidy' }, h('li', null, window.MADP_PUBLIC_SITE ? 'A working demonstration of the user experience. This online copy shows pre-generated answers to five example questions.' : 'A working demonstration that runs offline from a double-clicked file.'), h('li', null, 'A local Python backend with a locally installed language model (Ollama) and automatic fall-back to pre-generated answers.'), h('li', null, 'Built with replaceable layers: swap in real APIs, GIS services or an institutional model without changing the interface.'))),
            h('div', { class: 'card card-pad' }, h('h3', { style: { fontSize: '18px', marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'center' } }, icon('alert'), 'It is not'),
              h('ul', { class: 'tidy' }, h('li', null, 'Connected to live or official data. All values, identifiers and connections are demonstration data.'), h('li', null, 'A decision tool: thresholds, indices and boundaries are illustrative.'), h('li', null, 'A replacement for any existing database or program.'))))),
        h('section', { class: 'section' }, h('div', { class: 'section-title' }, h('h2', null, 'Roadmap')),
          h('div', { class: 'roadmap' }, roadmap.map(([p, t, d, now]) => h('div', { class: 'card card-pad road' + (now ? ' now' : '') }, h('div', { class: 'chip ' + (now ? 'green' : 'outline') }, p + (now ? ' \u00b7 you are here' : '')), h('h3', { style: { fontSize: '19px', margin: '10px 0 6px' } }, t), h('p', { class: 'muted', style: { fontSize: '14.5px' } }, d))))),
        h('section', { class: 'section', id: 'who' }, h('div', { class: 'section-title' }, h('h2', null, 'About this demonstration'), h('p', null, 'Who prepared it, and the organizations it involves.')),
          h('div', { class: 'card card-pad', style: { marginBottom: '18px' } },
            h('h3', { style: { fontSize: '19px', marginBottom: '8px' } }, 'The demonstration'),
            h('p', null, 'This prototype illustrates the proposed Manitoba Soil Data & Intelligence Hub: an interoperable, FAIR and interpretable layer that would connect existing and future soil information without replacing the systems that hold it. Users begin with a question and receive a traceable answer that shows the data, methods, limitations and uncertainty behind it.'),
            h('p', { style: { marginTop: '8px' } }, 'It was prepared to support discussion of a potential NSERC Alliance partnership. Soils are the proposed Phase 1 focus; crops, water, climate, grasslands and environment are a longer-term vision. The interface carries the broader working name “Manitoba Agricultural Data Portal”. All values, identifiers and connections shown are demonstration data.')),
          h('div', { class: 'two-col' },
            h('div', { class: 'card card-pad' },
              h('div', { class: 'partner-tile', style: { marginBottom: '12px', boxShadow: 'none' } }, M.ui.partnerLogo('lab', 52)),
              h('h3', { style: { fontSize: '19px', marginBottom: '8px' } }, 'Nasem Badreldin and the Digital AgroEcosystems Lab'),
              h('p', null, 'The concept and this prototype were prepared by ', h('a', { href: 'https://umanitoba.ca/agricultural-food-sciences/soil-science/nasem-badreldin', target: '_blank', rel: 'noopener' }, 'Nasem Badreldin'), ' and the ', h('a', { href: 'https://www.digitalagroecosystemslab.ca/', target: '_blank', rel: 'noopener' }, 'Digital AgroEcosystems Lab'), ' at the University of Manitoba.')),
            h('div', { class: 'card card-pad' },
              h('div', { class: 'partner-tile', style: { marginBottom: '12px', boxShadow: 'none' } }, M.ui.partnerLogo('um', 52)),
              h('h3', { style: { fontSize: '19px', marginBottom: '8px' } }, 'University of Manitoba'),
              h('p', null, 'University of Manitoba research assets, including soil laboratory, mapping, spectroscopy and geospatial work, are the starting point for the proposed Hub. An existing Manitoba soil spectroscopy and data program could serve as an early demonstration dataset.'))),
          h('div', { class: 'card card-pad', style: { marginTop: '18px' } },
            h('div', { class: 'partner-tile', style: { marginBottom: '12px', boxShadow: 'none' } }, M.ui.partnerLogo('gov', 46)),
            h('h3', { style: { fontSize: '19px', marginBottom: '8px' } }, 'Government of Manitoba'),
            h('p', null, 'The Government of Manitoba is a potential partner for the proposed NSERC Alliance project. Its participation would help ensure the work is designed around real provincial information needs. Provincial datasets such as soil survey, land cover and flood forecasting form the authoritative reference layer in the proposed design.'),
            h('p', { class: 'muted', style: { marginTop: '8px' } }, 'No funding or partnership commitments are implied. Logos identify the proposed partners; they do not indicate endorsement of this demonstration.'))),
        h('section', { class: 'section' }, M.ui.partnerStrip()),
        h('div', { class: 'tagband' }, h('span', null, 'Built for Manitoba.'), ' Connected to Canada. ', h('em', null, 'Interoperable globally.'))));
  }
  M.router.add('/about', render, '/about');
})();
