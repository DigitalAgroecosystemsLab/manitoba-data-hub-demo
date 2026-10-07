/* Hub pages opened from the three homepage cards. */
(function () {
  const M = (window.MADP = window.MADP || {});
  const { h, icon } = M.u;

  const HUBS = {
    mb: { logo: 'gov', layer: 'MB Core Data', title: 'MB Core Data', lead: 'Authoritative provincial datasets.',
      body: 'Datasets maintained by Government of Manitoba programs: the reference layer that other sources are compared against.',
      points: ['Soil survey, land cover and weather network from provincial programs', 'Governed by the data owner; accessed through open or controlled routes', 'Each record keeps its provincial licence and version'], q: 'q5-rrv-datasets' },
    um: { logo: 'um', layer: 'UM Research', title: 'UM Research', lead: 'University datasets, projects, models, and research outputs.',
      body: 'Research data from the University of Manitoba and partners: soil carbon networks, land-cover time series, flux towers and biodiversity surveys.',
      points: ['Repeated field sampling and satellite-derived time series', 'Partner access to protect research agreements', 'Direct route from research output to decision-ready answer'], q: 'q2-soc-brandon' },
    datahub: { layer: 'Connected DataHub', title: 'Connected DataHub', lead: 'Federal, industry, partner, satellite, and global datasets.',
      body: 'External sources connected through shared metadata: federal programs, satellite archives and global reference datasets.',
      points: ['Agriculture and Agri-Food Canada, ECCC and Statistics Canada', 'Sentinel, Landsat, SoilGrids and ERA5-Land', 'Connected, not copied: data stay with their owners'], q: 'q1-drought' },
  };
  const AGO = ['2 minutes ago', '14 minutes ago', '1 hour ago', '3 hours ago', 'yesterday'];

  function render(ctx) {
    const hub = HUBS[ctx.params.key];
    if (!hub) { M.router.go('/'); return null; }
    const L = M.ds.LAYERS[hub.layer];
    const list = M.data.datasets.filter((d) => d.layer === hub.layer);
    const orgs = M.u.unique(list.map((d) => d.organization));
    const themes = M.u.unique(list.flatMap((d) => d.themes));
    const q = M.data.questions.find((x) => x.id === hub.q);
    return h('div', { class: 'fade-in' },
      h('section', { class: 'hub-hero', style: { '--c': L.color, '--soft': L.soft } }, h('div', { class: 'container' },
        h('a', { href: '#/', class: 'muted', style: { fontSize: '13px' } }, '\u2190 Home'),
        h('div', { class: 'row', style: { gap: '20px', marginTop: '14px', alignItems: 'flex-start', flexWrap: 'wrap' } },
          h('div', { class: 'hub-ico' }, icon(L.icon)),
          h('div', { style: { flex: 1, minWidth: '300px' } }, h('div', { class: 'eyebrow', style: { color: L.color } }, 'Portal data layer'), h('h1', { style: { fontSize: '40px', margin: '4px 0' } }, hub.title), h('p', { style: { fontSize: '19px', color: '#2d3f52' } }, hub.lead), h('p', { class: 'muted', style: { marginTop: '8px', maxWidth: '720px' } }, hub.body)),
          h('div', { class: 'row', style: { flexDirection: 'column', alignItems: 'stretch' } }, hub.logo ? h('div', { class: 'partner-tile hub-logo', style: { alignSelf: 'stretch' } }, M.ui.partnerLogo(hub.logo, 50)) : null, h('a', { class: 'btn btn-primary', href: '#/explore?layer=' + encodeURIComponent(hub.layer), style: { background: L.color } }, 'Explore these datasets', icon('arrow-right')),
            h('button', { class: 'btn btn-secondary', onclick: () => M.ui.askQuestion(q.text) }, icon('sparkles'), 'Try: ' + q.short)))),
        h('div', { class: 'container hub-stat-row' }, [[list.length, 'datasets'], [orgs.length, orgs.length === 1 ? 'organization' : 'organizations'], [themes.length, 'themes'], ['4/4', 'FAIR checks']].map(([n, l]) => h('div', { class: 'hub-stat' }, h('b', null, n), h('span', null, l))))),
      h('div', { class: 'container page' },
        h('div', { class: 'two-col', style: { gridTemplateColumns: '1fr 1.3fr', alignItems: 'start' } },
          h('div', { class: 'card card-pad' }, h('h3', { style: { fontSize: '18px', marginBottom: '10px' } }, 'What this layer provides'), h('ul', { class: 'tidy' }, hub.points.map((p) => h('li', null, p))),
            h('div', { class: 'chip-row', style: { marginTop: '14px' } }, themes.map((t) => h('span', { class: 'chip outline' }, t))),
            h('div', { class: 'callout', style: { marginTop: '16px' } }, icon('info'), h('div', null, 'Data stay with their owners. The portal registers metadata and access routes only.'))),
          h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h3', null, icon('refresh'), 'Connector status'), h('span', { class: 'sim-tag' }, 'Simulated')),
            h('div', { class: 'card-body' }, h('div', { class: 'table-wrap' }, h('table', { class: 'data' }, h('thead', null, h('tr', null, ['Dataset', 'Connector', 'Last sync', 'Status'].map((t) => h('th', null, t)))),
              h('tbody', null, list.map((d, i) => h('tr', { class: 'clickable', onclick: () => M.ui.openMetadata(d) }, h('td', null, h('b', null, d.title)), h('td', null, d.format.split(' / ')[0]), h('td', null, AGO[i % AGO.length]), h('td', null, h('span', { class: 'chip green' }, h('span', { class: 'dot' }), 'Connected (demo)'))))))),
              h('p', { class: 'muted', style: { fontSize: '12.5px', marginTop: '8px' } }, 'No live connection exists in this prototype; status and sync times are illustrative.')))),
        h('h2', { style: { fontSize: '26px', margin: '40px 0 16px' } }, 'Datasets in this layer'),
        h('div', { class: 'ds-grid' }, list.map((d) => M.ui.datasetCard(d)))));
  }
  M.router.add('/hub/:key', render, '/');
})();
