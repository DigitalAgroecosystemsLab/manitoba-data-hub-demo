/* Manitoba Agricultural Situation Room: 8 decision tiles computed from the local tables. */
(function () {
  const M = (window.MADP = window.MADP || {});
  const { h, icon, fmtNum, colorFor, setKids, openModal } = M.u;
  const STATUS = { alert: { label: 'Alert', cls: 'red', color: '#c0392b' }, watch: { label: 'Watch', cls: 'amber', color: '#e0a100' }, normal: { label: 'Normal', cls: 'green', color: '#3d8a49' } };

  function statusOf(t, v) {
    if (t.direction === 'higher_worse') return v >= t.alert ? 'alert' : v >= t.watch ? 'watch' : 'normal';
    return v <= t.alert ? 'alert' : v <= t.watch ? 'watch' : 'normal';
  }
  function compute(t) {
    const D = M.data, rows = D.table_rows[t.table], meta = M.ds.tableMeta[t.table];
    let row, v;
    if (t.agg === 'last') { row = rows[rows.length - 1]; v = row[t.field]; }
    else { const key = (r) => r[t.field]; row = rows.reduce((a, b) => ((t.agg === 'max_region' ? key(b) > key(a) : key(b) < key(a)) ? b : a)); v = row[t.field]; }
    const spec = (meta.fields || meta.series || []).find((f) => (f.name || f.field) === t.field) || {};
    const spark = t.spark ? D.table_rows[t.spark.table].map((r) => r[t.spark.field]).slice(-16) : null;
    const mapMeta = t.map ? M.ds.tableMeta[t.map.table] : null;
    const values = t.map ? Object.fromEntries(D.table_rows[t.map.table].map((r) => [r[mapMeta.key], r[t.map.field]])) : null;
    return { t, v, row, region: meta.label_field && row[meta.label_field] ? row[meta.label_field] : null, status: statusOf(t, v), spark, values, mapSpec: t.map ? M.ds.fieldSpec(t.map.table, t.map.field) : null,
      text: t.format.replace('{v}', fmtNum(v, spec.decimals != null ? spec.decimals : (Number.isInteger(v) ? 0 : 1))), asOf: (t.agg === 'last' ? row[meta.x] : meta.as_of) };
  }

  function tile(c, open) {
    const st = STATUS[c.status];
    const mini = c.values ? M.ui.manitobaMap({ values: c.values, spec: c.mapSpec, mini: true, legend: false, view: 'south' }).el : null;
    return h('button', { type: 'button', class: 'sr-tile', style: { '--st': st.color }, onclick: () => open(c), 'aria-label': `${c.t.title}: ${st.label}. Open details` },
      h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('span', { class: 'sr-ico' }, icon(c.t.icon)), h('span', { class: 'chip ' + st.cls }, h('span', { class: 'dot' }), st.label)),
      h('h3', null, c.t.title),
      h('div', { class: 'sr-val' }, c.text),
      h('div', { class: 'sr-cap' }, c.t.caption, c.region ? h('b', null, ' \u00b7 ' + c.region) : null),
      h('div', { class: 'row', style: { justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' } },
        c.spark ? M.ui.sparkline(c.spark, { color: st.color, w: 130, hgt: 42 }) : h('span', { class: 'muted', style: { fontSize: '12px' } }, 'Snapshot'),
        mini ? h('div', { class: 'sr-mini' }, mini) : null));
  }

  function openDetail(c) {
    const t = c.t, D = M.data;
    const meta = M.ds.tableMeta[t.table], ds = M.ds.byId[meta.dataset_id];
    const mapMeta = t.map ? M.ds.tableMeta[t.map.table] : null;
    const bigMap = t.map ? M.ui.manitobaMap({ values: c.values, spec: c.mapSpec, view: 'south', onSelect: () => {} }) : null;
    const trend = t.spark ? (() => {
      const sm = M.ds.tableMeta[t.spark.table], rows = D.table_rows[t.spark.table], s = sm.series.find((x) => x.field === t.spark.field);
      return M.ui.lineChart({ series: [{ key: s.field, label: s.label, color: STATUS[c.status].color, values: rows.map((r) => ({ x: r[sm.x], y: r[s.field] })) }], xType: sm.x_type, unit: s.unit, height: 220 });
    })() : null;
    const regionRows = mapMeta ? D.table_rows[t.map.table].slice().sort((a, b) => (t.direction === 'higher_worse' ? b[t.map.field] - a[t.map.field] : a[t.map.field] - b[t.map.field])) : [];
    const q = M.data.questions.find((x) => x.id === t.question);
    openModal((close) => h('aside', { class: 'drawer', role: 'dialog' },
      h('div', { class: 'modal-head' }, h('div', null, h('div', { class: 'chip-row', style: { marginBottom: '8px' } }, h('span', { class: 'chip ' + STATUS[c.status].cls }, STATUS[c.status].label), h('span', { class: 'demo-tag' }, 'Demo data')), h('h2', null, t.title), h('p', { class: 'muted', style: { marginTop: '4px' } }, `${c.text} ${t.caption}${c.region ? ' (' + c.region + ')' : ''}`)),
        h('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: close }, icon('close'))),
      h('div', { class: 'modal-body stack', style: { gap: '18px' } },
        h('p', { class: 'muted' }, t.note),
        bigMap ? h('div', null, h('h4', { style: { fontSize: '14px', marginBottom: '8px' } }, shortField(c.mapSpec)), bigMap.el) : null,
        trend ? h('div', null, h('h4', { style: { fontSize: '14px', marginBottom: '8px' } }, 'Trend'), trend) : null,
        regionRows.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'data' }, h('thead', null, h('tr', null, h('th', null, 'Region'), h('th', { class: 'num' }, shortField(c.mapSpec)), h('th', null, 'Status'))),
          h('tbody', null, regionRows.map((r) => { const s = statusOf(t, r[t.map.field]); return h('tr', null, h('td', null, r[mapMeta.label_field]), h('td', { class: 'num' }, h('b', null, fmtNum(r[t.map.field], c.mapSpec.decimals))), h('td', null, h('span', { class: 'chip ' + STATUS[s].cls }, STATUS[s].label))); })))) : null,
        h('div', null, h('h4', { style: { fontSize: '14px', marginBottom: '8px' } }, 'Data behind this tile'), M.ui.sourceCard(ds)),
        h('div', { class: 'row', style: { flexWrap: 'wrap' } }, q ? h('button', { class: 'btn btn-primary', onclick: () => { close(); M.ui.askQuestion(q.text); } }, icon('sparkles'), 'Ask: ' + q.short) : null,
          h('span', { class: 'muted', style: { fontSize: '12.5px' } }, 'Thresholds are illustrative: watch \u2265/\u2264 ' + t.watch + ', alert ' + t.alert))))); 
  }
  const shortField = (sp) => (sp.label || '').replace(/\s*\(.*\)$/, '');

  function render() {
    const cs = M.data.situation_room.tiles.map(compute);
    const counts = { alert: 0, watch: 0, normal: 0 };
    cs.forEach((c) => counts[c.status]++);
    // regions to watch: how many regional indicators put each region at Alert / Watch
    const score = {};
    cs.forEach((c) => {
      if (!c.values) return;
      Object.entries(c.values).forEach(([rid, v]) => { if (v == null) return; const s = statusOf(c.t, v); (score[rid] = score[rid] || { alert: 0, watch: 0, n: 0 }); score[rid].n++; if (s !== 'normal') score[rid][s]++; });
    });
    const ranked = Object.entries(score).filter(([r]) => r !== 'northern').map(([r, s]) => ({ r, ...s })).sort((a, b) => b.alert * 2 + b.watch - (a.alert * 2 + a.watch)).slice(0, 5);
    const asOf = '2026-09-28';

    return h('div', { class: 'container page fade-in' },
      h('div', { class: 'page-head' },
        h('div', null, h('div', { class: 'eyebrow' }, 'Government / analyst dashboard'), h('h1', null, M.data.situation_room.title), h('p', null, 'The same data infrastructure that answers questions also powers rapid, high-level situational awareness. Click any tile for the regions and data behind it.')),
        h('div', { class: 'row' }, h('span', { class: 'chip outline' }, icon('clock'), 'As of ' + asOf), h('span', { class: 'demo-tag' }, 'Demo data'))),
      h('div', { class: 'sr-summary' },
        ['alert', 'watch', 'normal'].map((k) => h('div', { class: 'sr-count', style: { '--st': STATUS[k].color } }, h('b', null, counts[k]), h('span', null, STATUS[k].label + (counts[k] === 1 ? ' indicator' : ' indicators')))),
        h('div', { class: 'sr-flow' }, h('span', null, 'Data'), icon('arrow-right'), h('span', null, 'Integration'), icon('arrow-right'), h('span', null, 'Intelligence'), icon('arrow-right'), h('b', null, 'Decision'))),
      h('div', { class: 'sr-layout' },
        h('div', { class: 'sr-grid' }, cs.map((c) => tile(c, openDetail))),
        h('aside', { class: 'card card-pad sr-watch' }, h('h3', { style: { fontSize: '17px', display: 'flex', gap: '8px', alignItems: 'center' } }, icon('target'), 'Regions to watch'),
          h('p', { class: 'muted', style: { fontSize: '13px', margin: '4px 0 12px' } }, 'Regions ranked by how many indicators are at Alert or Watch level.'),
          h('div', { class: 'stack', style: { gap: '10px' } }, ranked.map((x) => h('div', null,
            h('div', { class: 'row', style: { justifyContent: 'space-between', fontSize: '14px' } }, h('b', null, M.ds.regionName(x.r)), h('span', { class: 'muted' }, `${x.alert} alert \u00b7 ${x.watch} watch`)),
            h('div', { class: 'meter', style: { marginTop: '5px' } }, h('i', { style: { width: Math.round(((x.alert * 2 + x.watch) / (x.n * 2)) * 100) + '%', background: x.alert ? 'linear-gradient(90deg,#e0a100,#c0392b)' : '#e0a100' } }))))),
          h('div', { class: 'callout', style: { marginTop: '16px', fontSize: '13px' } }, icon('info'), h('div', null, 'Every tile is computed from the same local datasets that power the answers, so figures here and in the Ask workspace always agree.')))));
  }
  M.router.add('/dashboards', render, '/dashboards');
})();
