/* Dataset-facing components: FAIR badges, metadata modal, source cards. */
(function () {
  const M = (window.MADP = window.MADP || {});
  const { h, icon, openModal, fmtDate, download, copy } = M.u;
  const FAIR_KEYS = ['findable', 'accessible', 'interoperable', 'reusable'];

  /** Four clickable FAIR indicators. `datasets` may be one dataset or a list (answer-level). */
  function fairBadges(datasets, opts = {}) {
    const list = Array.isArray(datasets) ? datasets : [datasets];
    const row = h('div', { class: 'fair-row' + (opts.compact ? ' compact' : '') });
    FAIR_KEYS.forEach((k) => {
      const f = M.ds.FAIR[k];
      row.appendChild(h('button', { type: 'button', class: 'fair-badge', title: f.meaning, 'aria-label': `${f.name}: yes. Click for explanation`, onclick: (e) => { e.stopPropagation(); openFairModal(k, list); } },
        h('span', { class: 'tick' }, icon('check')), `${f.name} \u2713`));
    });
    return row;
  }

  function openFairModal(key, datasets) {
    const f = M.ds.FAIR[key];
    openModal((close) => h('div', { class: 'modal narrow' },
      h('div', { class: 'modal-head' },
        h('div', { class: 'row' }, h('span', { class: 'fair-letters' }, h('b', { style: { width: '40px', height: '40px', fontSize: '20px', borderRadius: '12px' } }, f.letter)),
          h('div', null, h('div', { class: 'eyebrow' }, 'FAIR principle'), h('h2', null, f.name))),
        h('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: close }, icon('close'))),
      h('div', { class: 'modal-body stack' },
        h('div', null, h('h4', { style: { fontSize: '14px', marginBottom: '4px' } }, 'What it means'), h('p', null, f.meaning)),
        h('div', null, h('h4', { style: { fontSize: '14px', marginBottom: '4px' } }, 'How this portal supports it'), h('p', null, f.how)),
        datasets.length ? h('div', null, h('h4', { style: { fontSize: '14px', marginBottom: '8px' } }, datasets.length === 1 ? 'For this dataset' : `For the ${datasets.length} datasets behind this answer`),
          h('ul', { class: 'tidy' }, datasets.slice(0, 8).map((d) => h('li', null, h('b', null, d.title), ': ', d.fair[key]))),
          datasets.length > 8 ? h('p', { class: 'muted', style: { marginTop: '6px' } }, `\u2026and ${datasets.length - 8} more.`) : null) : null,
        h('div', { class: 'callout' }, icon('info'), h('div', null, 'In this prototype the FAIR assessment is based on the metadata fields recorded for each demonstration dataset. A production system would verify them automatically against each source.')),
      )));
  }

  function kv(label, value, wide) {
    return h('div', { class: 'meta-item' + (wide ? ' wide' : '') }, h('dt', null, label), h('dd', null, value));
  }

  function openMetadata(dataset) {
    const d = typeof dataset === 'string' ? M.ds.byId[dataset] : dataset;
    const comp = M.ds.completeness(d);
    const layer = M.ds.LAYERS[d.layer];
    openModal((close) => h('div', { class: 'modal' },
      h('div', { class: 'modal-head' },
        h('div', null,
          h('div', { class: 'chip-row', style: { marginBottom: '8px' } },
            h('span', { class: 'chip', style: { background: layer.soft, color: layer.color } }, icon(layer.icon), d.layer),
            ...d.themes.map((t) => h('span', { class: 'chip outline' }, t)),
            h('span', { class: 'sim-tag' }, 'Simulated connection'), h('span', { class: 'demo-tag' }, 'Demo metadata')),
          h('h2', null, d.title),
          h('p', { class: 'muted', style: { marginTop: '4px' } }, d.organization)),
        h('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: close }, icon('close'))),
      h('div', { class: 'modal-body' },
        h('p', { style: { fontSize: '15.5px', marginBottom: '14px' } }, d.description),
        h('div', { class: 'row', style: { justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' } },
          fairBadges(d), h('div', { style: { minWidth: '220px' } }, h('div', { class: 'row', style: { justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--muted)', marginBottom: '4px' } }, h('span', null, 'Metadata completeness'), h('b', { style: { color: 'var(--ink)' } }, `${comp.filled}/${comp.total} fields`)), h('div', { class: 'meter' }, h('i', { style: { width: comp.pct + '%' } })))),
        h('dl', { class: 'meta-grid', style: { margin: '10px 0 0' } },
          kv('Title', d.title, true), kv('Organization', d.organization), kv('Licence', d.licence),
          kv('Geographic coverage', d.geographic_coverage), kv('Time coverage', `${d.time_coverage.start} \u2013 ${d.time_coverage.end}`),
          kv('Spatial resolution', d.spatial_resolution), kv('Format', d.format),
          kv('Coordinate system', d.coordinate_system), kv('Update frequency', d.update_frequency),
          kv('Last updated', fmtDate(d.last_updated)), kv('Version', d.version),
          kv('Access type', d.access_type),
          kv('DOI (placeholder)', h('span', { class: 'placeholder' }, d.doi)), kv('API endpoint (placeholder)', h('span', { class: 'placeholder' }, d.api_url)),
          kv('Source URL (placeholder)', h('span', { class: 'placeholder' }, d.source_url)),
          kv('Connection status', h('span', { class: 'sim-tag' }, d.connection)),
          h('div', { class: 'meta-item wide' }, h('dt', null, 'Processing history'), h('dd', null, h('ul', { class: 'timeline' }, d.processing_history.map((p) => h('li', null, p))))),
          kv('Keywords', h('div', { class: 'chip-row' }, d.keywords.map((k) => h('span', { class: 'chip outline' }, k))), true)),
        h('div', { class: 'row', style: { marginTop: '20px', flexWrap: 'wrap' } },
          h('button', { class: 'btn btn-primary btn-sm', onclick: () => download(`${d.id}.metadata.json`, M.ds.exportMetadata(d)) }, icon('download'), 'Download metadata (JSON-LD)'),
          h('button', { class: 'btn btn-secondary btn-sm', onclick: () => copy(`${d.organization} (${d.last_updated.slice(0, 4)}). ${d.title}, ${d.version}. ${d.doi} [DEMONSTRATION METADATA]`) }, icon('link'), 'Copy citation'),
          h('span', { class: 'spacer' }),
          h('span', { class: 'muted', style: { fontSize: '12.5px' } }, 'Identifiers and URLs are placeholders in this prototype.')),
      )));
  }

  function sourceCard(d, opts = {}) {
    const layer = M.ds.LAYERS[d.layer];
    return h('button', { type: 'button', class: 'source-card', style: { '--org': M.ds.orgColor(d) }, onclick: () => openMetadata(d) },
      h('div', { class: 'row', style: { justifyContent: 'space-between', alignItems: 'flex-start' } },
        h('h4', null, d.title), h('span', { class: 'chip', style: { background: layer.soft, color: layer.color } }, layer.label)),
      h('div', { class: 'org' }, icon('building'), d.organization),
      opts.usedFor ? h('div', { class: 'used' }, h('b', null, 'Used for: '), opts.usedFor) : null,
      h('div', { class: 'source-meta' },
        h('span', null, icon('clock'), M.ds.coverageText(d)), h('span', null, icon('ruler'), d.spatial_resolution), h('span', null, icon('lock'), d.access_type)),
      h('div', { class: 'row', style: { justifyContent: 'space-between' } }, fairBadges(d, { compact: true }), h('span', { class: 'sim-tag' }, 'Simulated')));
  }

  M.ui = M.ui || {};
  Object.assign(M.ui, { fairBadges, openFairModal, openMetadata, sourceCard });
})();
