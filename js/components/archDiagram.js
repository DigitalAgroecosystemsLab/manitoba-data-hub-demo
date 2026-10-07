/* Interactive architecture diagram. Click any source or stage to see what it does in this prototype. */
(function () {
  const M = (window.MADP = window.MADP || {});
  const { h, icon } = M.u;

  const SOURCES = [
    { id: 'local', label: 'LOCAL', color: '#2f6b3a', detail: 'Municipal, conservation-district and on-farm data: weather stations, field sensors and producer-contributed records.', ex: ['Manitoba Agriculture Weather Station Network'] },
    { id: 'prov', label: 'PROVINCIAL', color: '#3d8a49', detail: 'Authoritative Government of Manitoba datasets: soil survey, land cover, flood forecasting, crop insurance statistics.', ex: ['Manitoba Soil Survey', 'Hydrologic Forecasting & Flood Monitoring'] },
    { id: 'fed', label: 'FEDERAL', color: '#1f6fa8', detail: 'Agriculture and Agri-Food Canada, ECCC and Statistics Canada: drought monitor, crop inventory, climate observations, census.', ex: ['Canadian Drought Monitor', 'Annual Crop Inventory'] },
    { id: 'res', label: 'RESEARCH', color: '#8a5a1f', detail: 'University of Manitoba and partner research: soil carbon networks, land-cover time series, flux towers, models.', ex: ['UM Soil Carbon Sampling Network', 'LULC_Prairie_MODIS_2024'] },
    { id: 'glob', label: 'GLOBAL', color: '#6a4aa0', detail: 'Satellite programs and global repositories: Sentinel, Landsat, SoilGrids, ERA5-Land.', ex: ['Sentinel-2 L2A', 'SoilGrids 2.0'] },
  ];
  const STAGES = [
    { id: 'fair', title: 'FAIR Data & Metadata Layer', icon: 'shield', short: 'Findable, accessible, interoperable, reusable',
      detail: 'Every connected dataset is described with the same metadata (owner, licence, coverage, resolution, version, processing history). Data stay where they are; only descriptions and access paths are registered.',
      proto: 'Explore Data catalogue, metadata cards and the F-A-I-R indicators on every answer.', link: ['/explore', 'Open the catalogue'] },
    { id: 'integ', title: 'Integration & Harmonization', icon: 'layers', short: 'Align formats, units, dates, regions',
      detail: 'Datasets with different formats and coordinate systems are aligned so they can be compared: units standardised, dates normalised, values summarised to shared regions.',
      proto: 'The "Harmonizing data" step of the analysis animation and the regional tables behind every map.', link: ['/maps', 'Open maps'] },
    { id: 'analytics', title: 'Analytics + GIS + AI', icon: 'cpu', short: 'Statistics, maps and language models',
      detail: 'Statistics and spatial summaries are computed in code. A language model (running locally via Ollama) only explains the evidence; it never supplies data values and its output is verified.',
      proto: 'Local Python backend + Ollama, with automatic fall-back to pre-generated responses.', link: ['/ask', 'Ask a question'] },
    { id: 'answers', title: 'INTERPRETABLE ANSWERS', icon: 'sparkles', short: 'Plain language with provenance',
      detail: 'Every answer comes with a plain-language summary, maps and charts, the sources used, limitations, confidence and a "How was this answer generated?" record.',
      proto: 'The answer workspace.', link: ['/ask', 'See an answer'] },
    { id: 'decisions', title: 'DECISIONS', icon: 'target', short: 'Producers, analysts, policy',
      detail: 'Producers, analysts and government decision-makers act on trusted, traceable information, from field-level choices to provincial programs and emergency response.',
      proto: 'The Agricultural Situation Room dashboard.', link: ['/dashboards', 'Open Situation Room'] },
  ];

  function archDiagram() {
    const panel = h('div', { class: 'arch-panel' });
    const stageEls = [], srcEls = [];
    function select(kind, id) {
      stageEls.forEach(([sid, el]) => el.classList.toggle('on', kind === 'stage' && sid === id));
      srcEls.forEach(([sid, el]) => el.classList.toggle('on', kind === 'src' && sid === id));
      if (kind === 'src') {
        const s = SOURCES.find((x) => x.id === id);
        panel.replaceChildren(h('div', { class: 'row', style: { gap: '14px', alignItems: 'flex-start' } },
          h('span', { class: 'arch-badge', style: { background: s.color } }, s.label),
          h('div', null, h('p', null, s.detail), h('div', { class: 'chip-row', style: { marginTop: '10px' } }, h('span', { class: 'muted', style: { fontSize: '13px', marginRight: '4px' } }, 'Examples in this prototype:'), s.ex.map((e) => h('span', { class: 'chip outline' }, e))),
            h('p', { class: 'muted', style: { fontSize: '13px', marginTop: '10px' } }, 'Existing databases stay where they are: they are connected, not replaced.'))));
      } else {
        const st = STAGES.find((x) => x.id === id);
        panel.replaceChildren(h('div', { class: 'row', style: { gap: '14px', alignItems: 'flex-start' } },
          h('span', { class: 'arch-ico' }, icon(st.icon)),
          h('div', null, h('h4', { style: { fontSize: '17px', marginBottom: '4px' } }, st.title), h('p', null, st.detail),
            h('p', { style: { marginTop: '8px', fontSize: '14px' } }, h('b', null, 'In this prototype: '), st.proto),
            h('a', { class: 'btn btn-secondary btn-sm', style: { marginTop: '12px' }, href: '#' + st.link[0] }, st.link[1], icon('arrow-right')))));
      }
      panel.classList.remove('pop'); void panel.offsetWidth; panel.classList.add('pop');
    }

    const src = h('div', { class: 'arch-sources' }, h('div', { class: 'arch-colhead' }, 'Data sources'),
      SOURCES.map((s) => { const b = h('button', { type: 'button', class: 'arch-src', style: { '--c': s.color }, onclick: () => select('src', s.id) }, h('span', { class: 'dot', style: { background: s.color } }), s.label, ); srcEls.push([s.id, b]); return b; }),
      h('div', { class: 'arch-plus' }, 'DATA'));
    const flow = h('div', { class: 'arch-flow' }, STAGES.map((st, i) => {
      const b = h('button', { type: 'button', class: 'arch-stage', style: { '--i': i }, onclick: () => select('stage', st.id) },
        h('span', { class: 'arch-ico' }, icon(st.icon)), h('b', null, st.title), h('span', { class: 'muted' }, st.short));
      stageEls.push([st.id, b]);
      return [h('span', { class: 'arch-arrow', style: { '--i': i } }, h('i'), h('i'), h('i')), b];
    }));
    const phases = h('div', { class: 'arch-phases' },
      ['Data', 'Integration', 'Intelligence', 'Decision'].map((p, i) => h('div', { class: 'arch-phase', style: { '--i': i } }, p, i < 3 ? icon('arrow-right') : null)));
    const el = h('div', { class: 'arch' }, h('div', { class: 'arch-grid' }, src, flow), panel, phases);
    select('stage', 'fair');
    return el;
  }

  M.ui = M.ui || {};
  M.ui.archDiagram = archDiagram;
})();
