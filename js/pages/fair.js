/* FAIR & Metadata page. */
(function () {
  const M = (window.MADP = window.MADP || {});
  const { h, icon, setKids } = M.u;

  const FIELDS = [
    ['Title', 'Human-readable name of the dataset'], ['Organization', 'Data owner and steward'], ['Description', 'What the data contain and why they exist'], ['Licence', 'Terms of reuse'],
    ['Geographic coverage', 'Where the data apply'], ['Time coverage', 'First and last year or date covered'], ['Spatial resolution', 'Grain of the data (pixel size, polygon scale, station)'], ['Format', 'File or service format'],
    ['Coordinate system', 'Reference system (e.g. EPSG code)'], ['Update frequency', 'How often new data arrive'], ['DOI / API / source URL', 'Persistent identifier and access points (placeholders here)'],
    ['Processing history', 'Steps applied since collection'], ['Version', 'Release identifier for citation'],
  ];

  function render() {
    const D = M.data.datasets;
    const stats = {
      findable: `${D.length}/${D.length} datasets have an identifier placeholder and ${Math.round(D.reduce((a, d) => a + d.keywords.length, 0) / D.length)} searchable keywords on average`,
      accessible: `${D.filter((d) => d.access_type === 'Open').length} open, ${D.filter((d) => d.access_type === 'Partner').length} partner, ${D.filter((d) => d.access_type === 'Restricted').length} restricted: access route stated for all`,
      interoperable: `${new Set(D.map((d) => d.format.split(' / ')[0])).size} formats and ${new Set(D.map((d) => d.coordinate_system.split(' ')[0])).size} coordinate systems declared, then harmonised`,
      reusable: `${new Set(D.map((d) => d.licence)).size} licences recorded; every dataset has a version and a processing history`,
    };
    const cards = Object.entries(M.ds.FAIR).map(([k, f]) => h('button', { type: 'button', class: 'fair-card', onclick: () => M.ui.openFairModal(k, D) },
      h('span', { class: 'fair-big' }, f.letter), h('h3', null, f.name), h('p', null, f.meaning), h('div', { class: 'fair-how' }, h('b', null, 'In this portal: '), f.how), h('div', { class: 'fair-stat' }, icon('check'), stats[k]), h('span', { class: 'muted', style: { fontSize: '12.5px' } }, 'Click for per-dataset detail')));

    const sel = h('select', { class: 'select', 'aria-label': 'Choose a dataset', onchange: (e) => show(e.target.value) }, D.map((d) => h('option', { value: d.id }, d.title)));
    const pre = h('pre', { class: 'json-view' });
    const meter = h('div');
    function show(id) {
      const d = M.ds.byId[id], comp = M.ds.completeness(d);
      pre.textContent = M.ds.exportMetadata(d);
      setKids(meter, h('div', { class: 'row', style: { justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' } }, h('span', null, 'Metadata completeness'), h('b', null, `${comp.filled}/${comp.total} required fields`)), h('div', { class: 'meter' }, h('i', { style: { width: comp.pct + '%' } })), h('div', { style: { marginTop: '12px' } }, M.ui.fairBadges(d)));
      sel.dataset.cur = id;
    }
    show(D[0].id);

    const rows = D.slice().sort((a, b) => a.title.localeCompare(b.title)).map((d) => { const c = M.ds.completeness(d); return h('tr', { class: 'clickable', onclick: () => M.ui.openMetadata(d) },
      h('td', null, h('b', null, d.title)), h('td', null, d.organization), h('td', null, h('div', { class: 'meter', style: { width: '120px' } }, h('i', { style: { width: c.pct + '%' } }))), h('td', { class: 'num' }, c.pct + '%'), h('td', null, M.ui.fairBadges(d, { compact: true }))); });

    return h('div', { class: 'container page fade-in' },
      h('div', { class: 'page-head' }, h('div', null, h('div', { class: 'eyebrow' }, 'Trust by design'), h('h1', null, 'FAIR & Metadata'),
        h('p', null, 'FAIR is how disconnected datasets become one ecosystem. Every dataset in the portal, and every answer built from them, carries the same rich metadata.'))),
      h('div', { class: 'fair-cards' }, cards),
      h('section', { class: 'section', style: { paddingTop: '50px' } },
        h('h2', { style: { fontSize: '26px', marginBottom: '6px' } }, 'The metadata record'), h('p', { class: 'muted', style: { marginBottom: '16px' } }, 'Thirteen fields describe every dataset, whatever its source.'),
        h('div', { class: 'field-grid' }, FIELDS.map(([n, d], i) => h('div', { class: 'field-item' }, h('span', { class: 'num-badge' }, i + 1), h('div', null, h('b', null, n), h('div', { class: 'muted', style: { fontSize: '13px' } }, d)))))),
      h('section', { class: 'section', style: { paddingTop: '50px' } },
        h('h2', { style: { fontSize: '26px', marginBottom: '6px' } }, 'Inspect a record'), h('p', { class: 'muted', style: { marginBottom: '16px' } }, 'Metadata are machine-readable (schema.org / JSON-LD) so other systems can discover and reuse them. Identifiers shown are placeholders.'),
        h('div', { class: 'card card-pad' }, h('div', { class: 'row', style: { marginBottom: '14px', flexWrap: 'wrap' } }, sel, h('span', { class: 'spacer' }),
          h('button', { class: 'btn btn-secondary btn-sm', onclick: () => M.u.copy(pre.textContent) }, icon('link'), 'Copy JSON'),
          h('button', { class: 'btn btn-secondary btn-sm', onclick: () => M.u.download(sel.dataset.cur + '.metadata.json', pre.textContent) }, icon('download'), 'Download')),
          h('div', { class: 'fair-inspect' }, pre, meter))),
      h('section', { class: 'section', style: { paddingTop: '50px' } },
        h('h2', { style: { fontSize: '26px', marginBottom: '16px' } }, 'Completeness across the catalogue'),
        h('div', { class: 'table-wrap' }, h('table', { class: 'data' }, h('thead', null, h('tr', null, ['Dataset', 'Organization', 'Completeness', '', 'FAIR'].map((t) => h('th', null, t)))), h('tbody', null, rows)))),
      h('div', { class: 'callout green', style: { marginTop: '34px' } }, icon('shield'), h('div', null, h('b', null, 'Metadata travel with every answer. '), 'Open "How was this answer generated?" on any answer to see the datasets, owners, coverage, resolution, versions, processing, assumptions, limitations and uncertainty behind it.')));
  }
  M.router.add('/fair', render, '/fair');
})();
