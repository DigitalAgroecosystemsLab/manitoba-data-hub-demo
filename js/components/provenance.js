/* "How was this answer generated?" - expandable interpretation / provenance panel.
 * Renders ONLY from the response envelope, so it works identically for live-model, demo and template answers. */
(function () {
  const M = (window.MADP = window.MADP || {});
  const { h, icon, fmtNum, fmtDate, download } = M.u;

  function modeDescription(env) {
    const p = env.provider || {};
    switch (env.mode) {
      case 'live': return { who: 'Local language model', detail: `${p.name} \u00b7 ${p.model || 'model'} \u00b7 ${p.local ? 'runs on this computer' : 'REMOTE endpoint'}`, cls: 'green' };
      case 'demo': return { who: 'Pre-generated demonstration text', detail: 'Written in advance in the same format a live model returns; verified by the same checks', cls: 'amber' };
      case 'evidence_only': return { who: 'Fixed template (no language model)', detail: 'Statistics restated by a template; no interpretation offered', cls: 'amber' };
      default: return { who: 'No model used', detail: 'No matching data', cls: 'amber' };
    }
  }

  function datasetRows(env) {
    const rows = env.datasets.map((d) => h('tr', { class: 'clickable', onclick: () => M.ui.openMetadata(d), title: 'Open metadata card' },
      h('td', null, h('b', null, d.title)), h('td', null, d.organization), h('td', null, M.ds.coverageText(d)), h('td', null, d.spatial_resolution), h('td', null, fmtDate(d.last_updated)), h('td', null, d.version)));
    return h('div', { class: 'table-wrap' }, h('table', { class: 'data' },
      h('thead', null, h('tr', null, ['Dataset', 'Data owner', 'Temporal coverage', 'Spatial resolution', 'Last updated', 'Version'].map((t) => h('th', null, t)))),
      h('tbody', null, rows)));
  }

  function assumptions(env) {
    const u = env.understanding || {}, out = [];
    out.push('All values are demonstration data prepared for this prototype; no live feeds or official figures are used.');
    if (u.place) out.push(`"${u.place}" was interpreted as a place in Manitoba${u.intent === 'analysis' && env.evidence.some((e) => e.focus && e.focus.radius_km) ? ` and point data within ${env.evidence.find((e) => e.focus && e.focus.radius_km).focus.radius_km} km were used` : ''}.`);
    if (u.region_ids && u.region_ids.length) out.push(`Region focus: ${u.region_ids.map(M.ds.regionName).join(', ')}.`);
    if (u.window_years) out.push(`"Last ${u.window_years} years" was interpreted as the most recent ${u.window_years} annual values in the data (inclusive).`);
    out.push('Regions use simplified demonstration boundaries; values are regional aggregates, not field-level measurements.');
    out.push('Datasets were selected by keyword matching against the local catalogue (no data were fetched from the internet).');
    if (env.evidence.some((e) => e.kind === 'regional' && e.id.includes('stress'))) out.push('The crop stress index is a composite screening indicator, not a yield forecast.');
    return out;
  }

  function processing(env) {
    const platform = [
      'Question parsed for place, region, time window and topic (rule-based, on this computer).',
      'Relevant datasets and tables retrieved from local files; only these were shown to the language step.',
      'Statistics (highest / lowest, first / last, change, group means) computed in code from the retrieved tables.',
      'Language step wrote the plain-language explanation; sources and names were re-attached from the catalogue.',
      'Every number in the text was checked against the retrieved data.',
    ];
    return { platform, perDataset: env.datasets.map((d) => ({ title: d.title, steps: d.processing_history })) };
  }

  function confidence(env) {
    const items = env.evidence.filter((e) => e.uncertainty && e.uncertainty.confidence);
    const scores = items.map((e) => e.uncertainty.confidence_score).filter((x) => x != null);
    const overall = scores.length ? Math.min(...scores) : null;
    return { items, overall };
  }

  function evidenceTable(e) {
    if (e.kind === 'catalogue') return null;
    const cols = e.kind === 'timeseries' ? [e.x.field, ...e.series.map((s) => s.field)] : Object.keys(e.rows[0] || {}).filter((k) => !['lat', 'lon'].includes(k));
    return h('div', { class: 'table-wrap' }, h('table', { class: 'data' },
      h('thead', null, h('tr', null, cols.map((c) => h('th', null, c.replace(/_/g, ' '))))),
      h('tbody', null, e.rows.slice(0, 40).map((r) => h('tr', null, cols.map((c) => h('td', { class: typeof r[c] === 'number' ? 'num' : '' }, typeof r[c] === 'number' ? fmtNum(r[c]) : String(r[c] ?? '\u2013'))))))));
  }

  function provenancePanel(env, opts = {}) {
    const v = env.verification || {};
    const mode = modeDescription(env);
    const conf = confidence(env);
    const proc = processing(env);
    const passed = v.passed;
    const root = h('section', { class: 'accordion' + (opts.open ? ' open' : ''), id: 'provenance' });
    const head = h('button', { class: 'accordion-head', type: 'button', 'aria-expanded': String(!!opts.open), onclick: () => { const o = root.classList.toggle('open'); head.setAttribute('aria-expanded', String(o)); } },
      h('h3', null, h('span', { class: 'num-badge' }, '5'), 'How was this answer generated?', h('span', { class: 'chip green' }, icon('shield'), 'Traceable \u00b7 not a black box')),
      h('span', { class: 'muted', style: { fontSize: '13px' } }, `${env.datasets.length} datasets \u00b7 ${v.numbers_checked || 0} numbers checked`), h('span', { class: 'chev' }, icon('chevron-down')));

    const pipe = [
      ['Understood your question', `${env.understanding.intent === 'catalogue' ? 'Catalogue request' : 'Data question'}${env.understanding.place ? ' about ' + env.understanding.place : ''}`, 'code', 'On this computer'],
      ['Retrieved local datasets', `${env.datasets.length} datasets, ${env.evidence.length} data tables`, 'code', 'On this computer'],
      ['Computed statistics', 'Min / max, change and group means from the tables', 'code', 'On this computer'],
      ['Explained the evidence', mode.who, 'ai', env.mode === 'live' ? 'Language model' : 'Pre-generated'],
      ['Checked the result', passed ? 'Numbers and sources verified' : 'Needs review', 'check', 'Automated checks'],
    ];
    const body = h('div', { class: 'accordion-body' },
      h('div', { class: 'callout green', style: { marginTop: '16px' } }, icon('shield'), h('div', null, h('b', null, 'The language model never supplies the data. '), 'Every number below comes from datasets stored locally. The model only explains the retrieved evidence, and its output is checked before you see it.')),
      h('div', { class: 'pipeline' }, pipe.map(([t, d, k, w], i) => h('div', { class: 'pipe-step' }, h('b', null, `${i + 1}. ${t}`), h('span', { class: 'muted' }, d), h('div', { class: 'who ' + k }, w)))),

      h('div', { class: 'subsection' }, h('h4', null, icon('database'), 'Datasets used'), datasetRows(env),
        h('p', { class: 'muted', style: { fontSize: '12.5px', marginTop: '8px' } }, 'Click a row to open the full metadata card. Connections are simulated in this prototype.')),

      h('div', { class: 'two-col' },
        h('div', { class: 'subsection' }, h('h4', null, icon('cpu'), 'Processing performed'),
          h('ul', { class: 'tidy' }, proc.platform.map((p) => h('li', null, p))),
          h('details', { class: 'evidence' }, h('summary', null, icon('chevron-right'), 'Source-dataset processing history'),
            h('div', { style: { padding: '8px 14px 12px' } }, proc.perDataset.map((d) => h('div', { style: { marginBottom: '8px' } }, h('b', { style: { fontSize: '13px' } }, d.title), h('ul', { class: 'tidy', style: { fontSize: '13px' } }, d.steps.map((x) => h('li', null, x)))))))),
        h('div', { class: 'subsection' }, h('h4', null, icon('info'), 'Assumptions'), h('ul', { class: 'tidy' }, assumptions(env).map((a) => h('li', null, a))))),

      h('div', { class: 'two-col' },
        h('div', { class: 'subsection' }, h('h4', null, icon('alert'), 'Limitations'), h('ul', { class: 'tidy' }, env.answer.limitations.map((l) => h('li', null, l)))),
        h('div', { class: 'subsection' }, h('h4', null, icon('gauge'), 'Confidence & uncertainty'),
          conf.overall != null ? h('div', { style: { marginBottom: '10px' } },
            h('div', { class: 'row', style: { justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' } }, h('span', null, 'Overall confidence (lowest of the data used)'), h('b', null, conf.overall >= 0.8 ? 'High' : conf.overall >= 0.6 ? 'Moderate' : 'Low')),
            h('div', { class: 'meter' }, h('i', { style: { width: Math.round(conf.overall * 100) + '%' } }))) : null,
          h('p', { style: { fontSize: '14px', marginBottom: '10px' } }, env.answer.uncertainty),
          h('ul', { class: 'tidy', style: { fontSize: '13px' } }, conf.items.map((e) => h('li', null, h('b', null, e.title), ': ', h('span', { class: 'chip ' + (e.uncertainty.confidence === 'High' ? 'green' : e.uncertainty.confidence === 'Low' ? 'red' : 'amber') }, e.uncertainty.confidence)))))),

      h('div', { class: 'subsection' }, h('h4', null, icon('check'), 'Automated verification'),
        h('div', { class: 'verify-box' + (passed ? '' : ' warn') },
          h('div', { class: 'verify-big' }, passed ? `${v.numbers_checked}/${v.numbers_checked}` : `${(v.numbers_checked || 0) - (v.numbers_unsupported || []).length}/${v.numbers_checked || 0}`),
          h('div', null, h('b', null, passed ? 'Every number in the answer text was found in the retrieved data.' : 'Some numbers could not be matched to the retrieved data.'),
            h('div', { class: 'muted', style: { fontSize: '13px', marginTop: '3px' } }, 'Sources and dataset names were re-attached from the catalogue (never taken from the model). ' + (v.attempts && v.attempts.length > 1 ? `The model needed ${v.attempts.length} attempts; the first was rejected for unsupported numbers: ${(v.attempts[0].unsupported_numbers || []).join(', ') || 'invalid format'}.` : '')),
            !passed && v.numbers_unsupported && v.numbers_unsupported.length ? h('div', { style: { marginTop: '4px', fontSize: '13px' } }, 'Unmatched: ' + v.numbers_unsupported.join(', ')) : null))),

      h('div', { class: 'subsection' }, h('h4', null, icon('sparkles'), 'The language step'),
        h('dl', { class: 'meta-grid', style: { margin: 0 } },
          h('div', { class: 'meta-item' }, h('dt', null, 'Produced by'), h('dd', null, mode.who)),
          h('div', { class: 'meta-item' }, h('dt', null, 'Detail'), h('dd', null, mode.detail)),
          h('div', { class: 'meta-item wide' }, h('dt', null, 'Explanation in plain language'), h('dd', null, env.answer.how_generated || '\u2013')),
          env.mode !== 'live' && env.mode_reason ? h('div', { class: 'meta-item wide' }, h('dt', null, 'Why not a live model?'), h('dd', null, env.mode_reason)) : null,
          env.timings_ms && env.timings_ms.total ? h('div', { class: 'meta-item' }, h('dt', null, 'Time taken'), h('dd', null, `${(env.timings_ms.total / 1000).toFixed(1)} s total (${env.timings_ms.retrieval} ms retrieval)`)) : null)),

      h('div', { class: 'subsection' }, h('h4', null, icon('table'), 'Evidence the language step was given'),
        env.evidence.map((e) => h('details', { class: 'evidence' }, h('summary', null, icon('chevron-right'), e.title, h('span', { class: 'chip outline', style: { marginLeft: 'auto' } }, e.kind === 'catalogue' ? `${e.rows.length} datasets` : `${e.rows.length} rows`)),
          evidenceTable(e) || h('div', { style: { padding: '10px 14px', fontSize: '13px' } }, 'Catalogue records (see Datasets used above).')))),

      h('div', { class: 'row', style: { marginTop: '22px', flexWrap: 'wrap' } },
        h('button', { class: 'btn btn-secondary btn-sm', onclick: () => download('answer-provenance-record.json', JSON.stringify({ question: env.question, mode: env.mode, provider: env.provider, understanding: env.understanding, retrieval: env.retrieval, datasets: env.datasets.map((d) => ({ id: d.id, title: d.title, organization: d.organization, version: d.version, last_updated: d.last_updated, licence: d.licence })), answer: env.answer, verification: env.verification, generated_at: env.generated_at, note: 'DEMONSTRATION DATA' }, null, 2)) }, icon('download'), 'Download provenance record (JSON)'),
        h('span', { class: 'muted', style: { fontSize: '12.5px' } }, 'Everything needed to audit this answer is in this record.')));
    root.append(head, body);
    return root;
  }

  M.ui = M.ui || {};
  M.ui.provenancePanel = provenancePanel;
})();
