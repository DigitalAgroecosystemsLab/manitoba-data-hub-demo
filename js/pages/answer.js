/* Ask page + answer workspace. Renders purely from the response envelope (see backend/orchestrator.py). */
(function () {
  const M = (window.MADP = window.MADP || {});
  const { h, icon, fmtNum, colorFor } = M.u;
  const cache = new Map();

  /* ---------------- helpers ---------------- */
  const specOf = (e, name) => (e.fields || []).find((f) => f.name === name) || {};
  function fmtVal(spec, v) {
    if (v == null) return '\u2013';
    if (typeof v === 'string') return v;
    if (spec.categories) return spec.categories[Math.round(v)];
    const n = fmtNum(v, spec.decimals);
    const u = spec.unit || '';
    if (!u || u === 'class' || u === 'index') return n;
    return u.startsWith('%') ? n + u : n + ' ' + u;
  }
  const shortLabel = (l) => (l || '').replace(/\s*\(.*\)$/, '');
  const regional = (env) => env.evidence.filter((e) => e.kind === 'regional');
  const points = (env) => env.evidence.filter((e) => e.kind === 'point');
  const focusIds = (env) => {
    const ids = new Set(env.understanding.region_ids || []);
    env.evidence.forEach((e) => e.focus && (e.focus.region_ids || []).forEach((r) => ids.add(r)));
    return [...ids];
  };
  const focusCircle = (env) => {
    const e = env.evidence.find((x) => x.focus && x.focus.radius_km);
    return e ? { lat: e.focus.lat, lon: e.focus.lon, radius_km: e.focus.radius_km, name: e.focus.place } : null;
  };
  function pip(lon, lat, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function regionOfPoint(lon, lat) {
    for (const f of M.data.geo.regions.features) if (f.properties.id !== 'northern' && pip(lon, lat, f.geometry.coordinates[0])) return f.properties.id;
    return 'northern';
  }

  /* ---------------- KPI cards ---------------- */
  function kpis(env) {
    const out = [];
    env.evidence.forEach((e) => {
      if (e.kind === 'regional') {
        const d = e.derived.find((x) => x.field === e.default_field); if (!d) return;
        const sp = specOf(e, e.default_field);
        out.push({ label: shortLabel(sp.label) + ': highest', value: fmtVal(sp, d.highest.value), foot: `${d.highest.region} \u00b7 lowest: ${d.lowest.region} (${fmtVal(sp, d.lowest.value)})`, color: colorFor(sp, d.highest.value) });
        const second = e.derived.find((x) => x.field !== e.default_field && ['pct_area_d1_plus', 'pct_cropland_stressed', 'ndvi_anomaly'].includes(x.field));
        if (second) {
          const s2 = specOf(e, second.field), neg = second.field === 'ndvi_anomaly';
          const pick = neg ? second.lowest : second.highest;
          out.push({ label: shortLabel(s2.label) + ': ' + (neg ? 'lowest' : 'highest'), value: fmtVal(s2, pick.value), foot: pick.region, color: colorFor(s2, pick.value) });
        }
      } else if (e.kind === 'timeseries') {
        e.derived.filter((d) => e.default_series.includes(d.field)).slice(0, 2).forEach((d) => {
          const sp = e.series.find((s) => s.field === d.field);
          const delta = d.change_abs;
          out.push({ label: d.label, value: fmtVal(sp, d.last.value), foot: `${d.first.x} \u2192 ${d.last.x}: ${delta > 0 ? '+' : ''}${fmtNum(delta, sp.decimals)}${sp.unit.startsWith('%') ? ' pts' : ' ' + sp.unit}${d.change_pct != null ? ` (${d.change_pct > 0 ? '+' : ''}${fmtNum(d.change_pct, 1)}%)` : ''}`, color: sp.color });
        });
      } else if (e.kind === 'point') {
        const d = e.derived[0]; if (!d) return;
        const sp = specOf(e, d.field);
        if (d.groups) d.groups.forEach((g, i) => out.push({ label: `${g.group}: mean ${shortLabel(d.label)}`, value: fmtVal(sp, g.mean), foot: `${g.n} site${g.n > 1 ? 's' : ''} \u00b7 range ${fmtNum(g.min, sp.decimals)}\u2013${fmtNum(g.max, sp.decimals)}`, color: ['#2f6b3a', '#1f6fa8', '#e08e0b'][i % 3] }));
        else out.push({ label: shortLabel(d.label) + ': mean of ' + d.n + ' stations', value: fmtVal(sp, d.mean), foot: `range ${fmtNum(d.min, 0)}${sp.unit === '%' ? '%' : ''} to ${fmtNum(d.max, 0)}${sp.unit === '%' ? '%' : ''}`, color: '#2e86c1' });
      } else if (e.kind === 'catalogue') {
        const d = e.derived[0];
        out.push({ label: 'Datasets covering the area', value: String(d.n_matching_catalogue), foot: `${d.n_listed} most relevant shown`, color: '#2f6b3a' });
        Object.entries(d.by_layer).forEach(([k, v]) => out.push({ label: k, value: String(v), foot: 'datasets shown', color: M.ds.LAYERS[k] ? M.ds.LAYERS[k].color : '#999' }));
      }
    });
    return out.slice(0, 6);
  }

  /* ---------------- region / point info panel ---------------- */
  function block(title, rows, sub) {
    return h('div', { class: 'rp-block' }, h('h5', null, title), sub ? h('div', { class: 'muted', style: { fontSize: '12px', marginTop: '-3px', marginBottom: '4px' } }, sub) : null,
      rows.map(([k, v]) => h('div', { class: 'rp-row' }, h('span', null, k), h('b', null, v))));
  }
  function regionInfo(env, rid) {
    const name = M.ds.regionName(rid);
    const blocks = [];
    regional(env).forEach((e) => {
      const row = e.rows.find((r) => r[e.key] === rid);
      if (!row) { blocks.push(block(e.title, [['Status', 'No data for this region']])); return; }
      blocks.push(block(e.title, e.fields.map((f) => [shortLabel(f.label), fmtVal(f, row[f.name])]), `${e.dataset_title} \u00b7 ${e.as_of}`));
    });
    points(env).forEach((e) => {
      const inR = e.rows.filter((r) => (r.region_id ? r.region_id === rid : regionOfPoint(r[e.lon], r[e.lat]) === rid));
      if (!inR.length) return;
      const vf = specOf(e, e.value_field);
      blocks.push(block(`${e.title}: ${inR.length} in this region`, inR.slice(0, 6).map((r) => [r[e.label_field], fmtVal(vf, r[e.value_field])]), e.dataset_title));
    });
    env.evidence.filter((e) => e.kind === 'catalogue').forEach((e) => {
      const ds = env.datasets.filter((d) => d.regions.includes(rid));
      blocks.push(block(`${ds.length} of ${e.rows.length} listed datasets cover this region`, ds.slice(0, 8).map((d) => [d.title.length > 38 ? d.title.slice(0, 36) + '\u2026' : d.title, d.access_type])));
    });
    return h('div', null, h('h4', null, icon('pin'), name), blocks.length ? blocks : h('p', { class: 'muted', style: { marginTop: '10px' } }, 'No sample data for this region in the datasets used.'));
  }
  function pointInfo(env, ev, pt) {
    const row = ev.rows.find((r) => r[ev.label_field] === pt.label);
    const rows = ev.fields.filter((f) => row[f.name] != null).map((f) => [shortLabel(f.label), fmtVal(f, row[f.name])]);
    if (row.distance_km != null) rows.push(['Distance from ' + (ev.focus && ev.focus.place ? ev.focus.place : 'place'), fmtNum(row.distance_km, 1) + ' km']);
    return h('div', null, h('h4', null, icon('pin'), pt.label), block(ev.title, rows, `${ev.dataset_title} \u00b7 ${ev.as_of}`),
      h('div', { class: 'rp-block' }, h('h5', null, 'Region'), h('div', { class: 'rp-row' }, h('span', null, 'Located in'), h('b', null, M.ds.regionName(row.region_id || regionOfPoint(row[ev.lon], row[ev.lat]))))));
  }

  /* ---------------- map card ---------------- */
  function mapCard(env, num) {
    const regs = regional(env), pts = points(env);
    const fids = focusIds(env), fc = focusCircle(env);
    if (!regs.length && !pts.length && !fids.length) return null;
    const layers = [];
    regs.forEach((e) => e.fields.filter((f) => f.map).forEach((f) => layers.push({ e, f, id: e.id + ':' + f.name })));
    let layer = layers.find((l) => regs[0] && l.e.id === regs[0].id && l.f.name === regs[0].default_field) || layers[0] || null;
    const pe = pts[0] || null;
    const ptsList = (e) => e.rows.map((r) => ({ id: e.id + '|' + r[e.label_field], label: r[e.label_field], short: r[e.label_field], lat: r[e.lat], lon: r[e.lon], value: r[e.value_field],
      tip: `<br>${shortLabel(specOf(e, e.value_field).label)}: ${fmtVal(specOf(e, e.value_field), r[e.value_field])}` }));
    const panel = h('div', { class: 'region-panel' });
    const hint = () => panel.replaceChildren(h('h4', null, icon('target'), 'Explore the map'), h('p', { class: 'hint', style: { marginTop: '8px' } }, icon('info'), (regs.length || fids.length) ? 'Click a region' + (pe ? ' or a point' : '') + ' on the map to see sample information from the datasets used.' : 'Click a point to see its details.'));
    const valuesFor = (l) => (l ? Object.fromEntries(l.e.rows.map((r) => [r[l.e.key], r[l.f.name]])) : {});
    const map = M.ui.manitobaMap({
      values: valuesFor(layer), spec: layer ? layer.f : null, focusIds: fids, view: fc ? 'focus' : 'south', focusCircle: fc,
      points: pe ? ptsList(pe) : [], pointSpec: pe ? specOf(pe, pe.value_field) : null, pointLabel: pe ? shortLabel(specOf(pe, pe.value_field).label) : '', pointLabels: !!pe && pe.rows.length <= 6 && !!fc,
      onSelect: (id) => panel.replaceChildren(regionInfo(env, id)),
      onPointSelect: (pt) => { const ev = pts.find((e) => pt.id.startsWith(e.id + '|')); panel.replaceChildren(pointInfo(env, ev, pt)); },
    });
    hint();
    // Pre-select the focus region, or the highest-valued one, so the panel is never empty.
    let pre = fids[0] || null;
    if (!pre && layer) {
      const d = layer.e.derived.find((x) => x.field === layer.f.name);
      const row = d && layer.e.rows.find((r) => r[layer.e.label_field] === d.highest.region);
      pre = row ? row[layer.e.key] : null;
    }
    if (pre) setTimeout(() => { map.select(pre); panel.replaceChildren(regionInfo(env, pre)); }, 0);

    const select = layers.length > 1 ? h('select', { class: 'select', 'aria-label': 'Map layer', onchange: (ev) => {
      layer = layers.find((l) => l.id === ev.target.value);
      map.update({ values: valuesFor(layer), spec: layer.f });
    } }, layers.map((l) => h('option', { value: l.id, selected: l === layer }, shortLabel(l.f.label)))) : null;

    return h('section', { class: 'card', id: 'viz-map' },
      h('div', { class: 'card-head' }, h('div', null, h('h3', null, h('span', { class: 'num-badge' }, num), 'Interactive Manitoba map'), h('div', { class: 'sub' }, fc ? `Showing ${fc.radius_km} km around ${fc.name}. Click a region or point.` : 'Click a region to see sample information.')),
        h('div', { class: 'row' }, select, h('span', { class: 'demo-tag' }, 'Demo data'))),
      h('div', { class: 'card-body map-card-grid' }, map.el, panel));
  }

  /* ---------------- chart cards ---------------- */
  function vizCard(env, v) {
    const e = env.evidence.find((x) => x.id === v.evidence_id); if (!e) return null;
    let body = null, sub = '';
    if (v.type === 'line_chart' && e.kind === 'timeseries') {
      const series = e.series.map((s) => ({ key: s.field, label: s.label, color: s.color, off: !e.default_series.includes(s.field), values: e.rows.map((r) => ({ x: r[e.x.field], y: r[s.field] })) }));
      body = M.ui.lineChart({ series, xType: e.x.type, unit: e.series.find((s) => e.default_series.includes(s.field)).unit, height: 270 });
      sub = e.series.length > 1 ? 'Toggle series to compare' : '';
    } else if (v.type === 'stacked_area' && e.kind === 'timeseries') {
      body = M.ui.stackedArea({ series: e.series.map((s) => ({ label: s.label, color: s.color, values: e.rows.map((r) => ({ x: r[e.x.field], y: r[s.field] })) })), unit: e.series[0].unit });
    } else if (v.type === 'bar_chart' && (e.kind === 'regional' || e.kind === 'point')) {
      return barCard(env, e, v);
    } else if (v.type === 'data_table') {
      body = tableFor(e);
    } else if (v.type === 'catalogue_list' && e.kind === 'catalogue') {
      body = h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '12px' } }, e.rows.map((r) => {
        const d = M.ds.byId[r.dataset_id]; const L = M.ds.LAYERS[d.layer];
        return h('button', { type: 'button', class: 'source-card', style: { '--org': M.ds.orgColor(d) }, onclick: () => M.ui.openMetadata(d) },
          h('h4', null, d.title), h('div', { class: 'org' }, icon('building'), d.organization),
          h('div', { class: 'chip-row' }, h('span', { class: 'chip', style: { background: L.soft, color: L.color } }, L.label), d.themes.slice(0, 2).map((t) => h('span', { class: 'chip outline' }, t)), h('span', { class: 'chip ' + (d.access_type === 'Open' ? 'green' : 'amber') }, d.access_type)),
          h('div', { class: 'source-meta' }, h('span', null, icon('clock'), M.ds.coverageText(d)), h('span', null, icon('ruler'), d.spatial_resolution)));
      }));
      sub = `${e.rows.length} of ${e.derived[0].n_matching_catalogue} matching datasets. Click one for its metadata card.`;
    }
    if (!body) return null;
    const wide = v.type === 'catalogue_list' || v.type === 'data_table';
    return h('section', { class: 'card', id: 'viz-' + e.id + '-' + v.type, style: wide ? { gridColumn: '1 / -1' } : null },
      h('div', { class: 'card-head' }, h('div', null, h('h3', null, icon(v.type === 'catalogue_list' ? 'database' : 'chart'), v.title), sub ? h('div', { class: 'sub' }, sub) : null), h('span', { class: 'demo-tag' }, 'Demo data')),
      h('div', { class: 'card-body' }, body, h('div', { class: 'muted', style: { fontSize: '12px', marginTop: '10px' } }, `Source: ${e.dataset_title}${e.as_of ? ' \u00b7 as of ' + e.as_of : ''}`)));
  }

  function barCard(env, e, v) {
    const fids = focusIds(env);
    const fields = e.fields.filter((f) => f.map);
    let field = fields.find((f) => f.name === e.default_field) || fields[0];
    const holder = h('div');
    const GROUP_COL = { Grassland: '#2f6b3a', Forage: '#1f6fa8', Cropland: '#e08e0b' };
    function draw() {
      let items;
      if (e.kind === 'regional') {
        items = e.rows.map((r) => ({ id: r[e.key], label: r[e.label_field], value: r[field.name], color: colorFor(field, r[field.name]), highlight: fids.includes(r[e.key]) }));
      } else {
        items = e.rows.map((r) => ({ id: r[e.label_field], label: r[e.label_field], value: r[field.name], color: e.group_by ? GROUP_COL[r[e.group_by]] || '#2f6b3a' : colorFor(field, r[field.name]), note: e.group_by ? r[e.group_by] : null }));
      }
      items.sort((a, b) => b.value - a.value);
      const nonNeg = items.every((i) => i.value >= 0);
      M.u.setKids(holder, M.ui.barChart({ items, unit: field.unit && field.unit !== 'class' && field.unit !== 'index' ? field.unit : '', decimals: field.decimals, valueFmt: field.categories ? (x) => fmtVal(field, x) : null, domain: nonNeg && field.domain && e.kind === 'regional' ? [0, Math.max(field.domain[1], ...items.map((i) => i.value))] : null }),
        e.group_by ? h('div', { class: 'series-toggles', style: { marginTop: '10px' } }, Object.entries(GROUP_COL).map(([k, c]) => h('span', { class: 'series-toggle' }, h('i', { style: { background: c } }), k))) : null);
    }
    draw();
    const select = fields.length > 1 ? h('select', { class: 'select', 'aria-label': 'Indicator', onchange: (ev) => { field = fields.find((f) => f.name === ev.target.value); draw(); } }, fields.map((f) => h('option', { value: f.name, selected: f === field }, shortLabel(f.label)))) : null;
    return h('section', { class: 'card', id: 'viz-' + e.id + '-bar' },
      h('div', { class: 'card-head' }, h('div', null, h('h3', null, icon('chart'), v.title), h('div', { class: 'sub' }, 'Sorted, highest first')), select),
      h('div', { class: 'card-body' }, holder, h('div', { class: 'muted', style: { fontSize: '12px', marginTop: '10px' } }, `Source: ${e.dataset_title} \u00b7 as of ${e.as_of}`)));
  }

  function tableFor(e) {
    const cols = e.kind === 'timeseries' ? [e.x.field, ...e.series.map((s) => s.field)] : Object.keys(e.rows[0] || {});
    return h('div', { class: 'table-wrap' }, h('table', { class: 'data' }, h('thead', null, h('tr', null, cols.map((c) => h('th', null, c.replace(/_/g, ' '))))),
      h('tbody', null, e.rows.map((r) => h('tr', null, cols.map((c) => h('td', { class: typeof r[c] === 'number' ? 'num' : '' }, typeof r[c] === 'number' ? fmtNum(r[c]) : String(r[c] == null ? '\u2013' : r[c]))))))));
  }

  /* ---------------- sections ---------------- */
  function modeChip(env) {
    if (env.mode === 'live') return h('span', { class: 'chip green' }, h('span', { class: 'dot' }), `Local model \u00b7 ${env.provider.model}`);
    if (env.mode === 'demo') return h('span', { class: 'chip amber' }, h('span', { class: 'dot' }), 'Demo mode \u00b7 pre-generated explanation');
    if (env.mode === 'evidence_only') return h('span', { class: 'chip amber' }, h('span', { class: 'dot' }), 'Template summary \u00b7 no language model');
    return h('span', { class: 'chip' }, 'No match');
  }

  function trustBar(env) {
    const v = env.verification || {};
    const scores = env.evidence.map((e) => e.uncertainty && e.uncertainty.confidence_score).filter((x) => x != null);
    const overall = scores.length ? Math.min(...scores) : null;
    const nOrg = new Set(env.datasets.map((d) => d.organization)).size;
    return h('div', { class: 'card trust-bar' },
      h('span', { class: 'row', style: { fontWeight: 700, color: 'var(--green-800)' } }, icon('shield'), 'Trusted answer'),
      h('span', { class: 'chip outline' }, icon('database'), `${env.datasets.length} dataset${env.datasets.length > 1 ? 's' : ''} from ${nOrg} organization${nOrg > 1 ? 's' : ''}`),
      v.numbers_checked ? h('span', { class: 'chip green' }, icon('check'), `${v.numbers_checked - (v.numbers_unsupported || []).length}/${v.numbers_checked} numbers traced to data`) : null,
      overall != null ? h('span', { class: 'chip ' + (overall >= 0.8 ? 'green' : overall >= 0.6 ? 'amber' : 'red') }, icon('gauge'), 'Confidence: ' + (overall >= 0.8 ? 'high' : overall >= 0.6 ? 'moderate' : 'low')) : null,
      M.ui.fairBadges(env.datasets, { compact: true }),
      h('span', { class: 'spacer' }),
      h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onclick: () => { const p = document.getElementById('provenance'); p.classList.add('open'); p.querySelector('.accordion-head').setAttribute('aria-expanded', 'true'); p.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, icon('eye'), 'How was this answer generated?'));
  }

  function answerCard(env) {
    const a = env.answer;
    const evTitle = (id) => (env.evidence.find((e) => e.id === id) || {}).title || id;
    const jump = (id) => {
      const t = document.querySelector(`[id^="viz-${id}"]`) || document.getElementById('viz-map');
      if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'center' }); t.animate([{ boxShadow: '0 0 0 4px rgba(59,147,207,.5)' }, { boxShadow: '0 0 0 0 rgba(59,147,207,0)' }], { duration: 1400 }); }
    };
    return h('section', { class: 'card', style: { borderLeft: '6px solid var(--green-600)' } },
      h('div', { class: 'card-head' }, h('h3', null, h('span', { class: 'num-badge' }, '1'), 'Plain-language answer'), h('div', { class: 'row' }, modeChip(env), h('span', { class: 'demo-tag' }, 'Demo data'))),
      h('div', { class: 'card-body' },
        h('p', { style: { fontSize: '19px', lineHeight: 1.55, color: 'var(--navy)', fontWeight: 500, maxWidth: '980px' } }, a.summary),
        h('div', { class: 'subsection' }, h('h4', null, icon('check'), 'Key findings', h('span', { class: 'muted', style: { fontWeight: 500, textTransform: 'none', letterSpacing: 0 } }, '\u00b7 observations come from the data; interpretations are labelled')),
          h('div', { class: 'stack', style: { gap: '9px' } }, a.key_findings.map((f) => h('div', { class: 'row', style: { alignItems: 'flex-start', gap: '12px', padding: '10px 14px', background: f.type === 'interpretation' ? '#f7f3fd' : '#f6faf8', borderRadius: '12px' } },
            h('span', { class: 'finding-type ' + f.type, style: { marginTop: '2px' } }, f.type === 'observation' ? 'Data show' : 'May mean'),
            h('div', { style: { flex: 1 } }, h('div', { style: { fontSize: '15px' } }, f.statement),
              f.evidence_ids.length ? h('div', { class: 'chip-row', style: { marginTop: '6px' } }, f.evidence_ids.map((id) => h('button', { type: 'button', class: 'chip outline', title: 'Jump to this evidence', onclick: () => jump(id) }, icon('link'), evTitle(id)))) : null))))),
        h('div', { class: 'callout', style: { marginTop: '16px' } }, icon('gauge'), h('div', null, h('b', null, 'Uncertainty: '), a.uncertainty))));
  }

  function kpiRow(env) {
    const items = kpis(env);
    if (!items.length) return null;
    return h('section', null, h('div', { class: 'row', style: { marginBottom: '10px' } }, h('h3', { style: { fontSize: '17px', display: 'flex', alignItems: 'center', gap: '10px' } }, h('span', { class: 'num-badge' }, '3'), 'Indicators')),
      h('div', { class: 'kpi-row' }, items.map((k) => h('div', { class: 'kpi', style: { '--kpi-color': k.color } }, h('div', { class: 'kpi-label' }, k.label), h('div', { class: 'kpi-value' }, k.value), h('div', { class: 'kpi-foot' }, k.foot)))));
  }

  function sourcesSection(env) {
    const used = Object.fromEntries(env.answer.sources.map((s) => [s.dataset_id, s.used_for]));
    return h('section', null,
      h('div', { class: 'row', style: { marginBottom: '10px', flexWrap: 'wrap' } }, h('h3', { style: { fontSize: '17px', display: 'flex', alignItems: 'center', gap: '10px' } }, h('span', { class: 'num-badge' }, '4'), 'Data sources'), h('span', { class: 'sim-tag' }, 'Connections are simulated in this prototype'),
        h('span', { class: 'muted', style: { fontSize: '13px' } }, 'Click a card for its full metadata')),
      h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))' } }, env.datasets.map((d) => M.ui.sourceCard(d, { usedFor: used[d.id] }))));
  }

  function fairSection(env) {
    const comps = env.datasets.map((d) => M.ds.completeness(d).pct);
    const avg = Math.round(comps.reduce((a, b) => a + b, 0) / (comps.length || 1));
    const lic = M.u.unique(env.datasets.map((d) => d.licence));
    return h('section', { class: 'card' },
      h('div', { class: 'card-head' }, h('h3', null, h('span', { class: 'num-badge' }, '6'), 'FAIR principles for this answer'), h('span', { class: 'muted', style: { fontSize: '13px' } }, 'Click an indicator for what it means')),
      h('div', { class: 'card-body fair-grid' },
        h('div', { class: 'stack' }, M.ui.fairBadges(env.datasets),
          h('p', { class: 'muted', style: { fontSize: '14px' } }, `All ${env.datasets.length} dataset${env.datasets.length > 1 ? 's' : ''} used here carry the portal's required FAIR metadata: persistent identifier, access route, standard format and coordinate system, licence and processing history.`)),
        h('div', { class: 'stack', style: { gap: '10px' } },
          h('div', null, h('div', { class: 'row', style: { justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' } }, h('span', null, 'Average metadata completeness'), h('b', null, avg + '%')), h('div', { class: 'meter' }, h('i', { style: { width: avg + '%' } }))),
          h('div', { style: { fontSize: '13px' } }, h('b', null, 'Licences: '), lic.join(' \u00b7 ')))));
  }

  function suggestionsCard(title, intro) {
    return h('div', { class: 'card card-pad', style: { maxWidth: '860px', margin: '40px auto' } },
      h('h3', { style: { fontSize: '20px', marginBottom: '6px' } }, title), intro ? h('p', { class: 'muted', style: { marginBottom: '14px' } }, intro) : null,
      h('div', { class: 'stack', style: { gap: '8px' } }, M.data.questions.map((q) => h('button', { type: 'button', class: 'cat-q', onclick: () => M.ui.askQuestion(q.text) }, icon('sparkles'), q.text, h('span', { style: { marginLeft: 'auto' } }, icon('arrow-right'))))));
  }

  /* ---------------- workspace ---------------- */
  function workspace(env, rerun, ctx) {
    const viz = env.answer.recommended_visualizations;
    const mapC = viz.some((v) => v.type === 'map') || focusIds(env).length ? mapCard(env, '2') : null;
    const charts = viz.filter((v) => v.type !== 'map' && v.type !== 'indicator_cards').map((v) => vizCard(env, v)).filter(Boolean);
    const status = M.llm.getStatus();
    const toggle = status.reachable ? h('div', { class: 'seg', role: 'group', 'aria-label': 'Answer source' },
      h('button', { type: 'button', class: env.mode === 'live' ? 'on' : '', onclick: () => rerun(false), title: 'Run through the local language model (Ollama)' }, 'Local model'),
      h('button', { type: 'button', class: env.mode !== 'live' ? 'on' : '', onclick: () => rerun(true), title: 'Use pre-generated responses' }, 'Demo mode')) : null;
    return h('div', { class: 'container page fade-in' },
      h('div', { class: 'page-head' },
        h('div', { style: { maxWidth: '900px' } }, h('div', { class: 'eyebrow' }, 'Answer workspace'), h('h1', { style: { fontSize: '30px', marginTop: '6px' } }, env.question)),
        h('div', { class: 'row', style: { flexWrap: 'wrap' } }, toggle, h('a', { class: 'btn btn-primary btn-sm', href: '#/ask' }, icon('search'), 'Ask another question'))),
      h('div', { class: 'stack', style: { gap: '22px' } },
        trustBar(env), answerCard(env), kpiRow(env), mapC,
        charts.length ? h('div', { class: 'chart-grid' }, charts) : null,
        sourcesSection(env), M.ui.provenancePanel(env, { open: ctx && ctx.query && ctx.query.open === 'provenance' }), fairSection(env),
        h('div', { class: 'callout green' }, icon('link'), h('div', null, h('b', null, 'We are not replacing existing databases. '), 'This answer was assembled by connecting datasets that already exist, each still owned and maintained by its organization.'))));
  }

  /* ---------------- ask landing ---------------- */
  function landing() {
    return h('div', { class: 'container page fade-in' },
      h('div', { style: { maxWidth: '960px', margin: '30px auto 0', textAlign: 'center' } },
        h('div', { class: 'eyebrow' }, 'Ask the data, not the database'), h('h1', { style: { fontSize: '44px', fontWeight: 800, margin: '10px 0 8px' } }, 'What can I help you with today?'),
        h('p', { class: 'muted', style: { fontSize: '17px', marginBottom: '28px' } }, 'Ask in plain language. The portal finds the datasets, integrates them and explains the answer, showing exactly how.'),
        h('div', { style: { textAlign: 'left' } }, M.ui.searchBox({ big: true, autofocus: true }))),
      h('div', { style: { marginTop: '60px' } }, suggestionsCard('Demonstration questions', 'Click one to see the full workflow.')),
      h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', maxWidth: '860px', margin: '0 auto' } }, [
        ['database', 'Finds the data', 'Searches the connected local, provincial, federal, research and global catalogue.'],
        ['cpu', 'Explains, never invents', 'A local language model explains retrieved evidence; every number is checked against it.'],
        ['shield', 'Shows its work', 'Sources, assumptions, limitations and uncertainty are one click away.']].map(([ic, t, d]) => h('div', { class: 'card card-pad' }, h('div', { class: 'arch-ico', style: { marginBottom: '10px' } }, icon(ic)), h('b', null, t), h('p', { class: 'muted', style: { fontSize: '13.5px', marginTop: '4px' } }, d)))));
  }

  /* ---------------- route ---------------- */
  async function render(ctx) {
    const q = (ctx.query.q || '').trim();
    if (!q) return landing();
    const key = q + '|' + (ctx.query.t || '');
    const app = ctx.mount;
    const show = (node) => { app.replaceChildren(node); window.scrollTo(0, 0); };

    function present(env, rerun) {
      if (env.mode === 'unsupported') {
        show(h('div', { class: 'container page fade-in' }, suggestionsCard('This demo can answer these questions', window.MADP_PUBLIC_SITE ? 'This online demonstration uses pre-generated answers, so only the questions below are available. The full prototype answers other questions with a locally run language model.' : 'The portal is running without its local backend, so only the pre-generated demonstration questions are available. Start the backend (start_demo.command) to ask anything covered by the local datasets.')));
      } else if (env.mode === 'no_match') {
        show(h('div', { class: 'container page fade-in' }, h('div', { class: 'card card-pad', style: { maxWidth: '860px', margin: '40px auto 0' } }, h('h2', { style: { fontSize: '24px' } }, '\u201c' + env.question + '\u201d'), h('p', { style: { marginTop: '10px', fontSize: '17px' } }, env.answer.summary)), suggestionsCard('Try one of these instead', null)));
      } else {
        show(workspace(env, rerun, ctx));
      }
    }
    const rerun = async (forceDemo) => {
      show(h('div', { class: 'container page' }, h('div', { class: 'empty' }, 'Preparing answer\u2026')));
      const env = await M.llm.ask(q, { forceDemo });
      cache.set(key, env);
      present(env, rerun);
    };

    if (cache.has(key)) { present(cache.get(key), rerun); return; }

    const wf = M.ui.workflowView(q);
    app.replaceChildren(h('div', { class: 'container' }, wf.el));
    const preview = await M.llm.preview(q);
    const answerPromise = M.llm.ask(q);
    const env = await wf.run(preview, answerPromise);
    if (!ctx.isCurrent()) return;
    cache.set(key, env);
    present(env, rerun);
  }

  M.router.add('/ask', render, '/ask');
})();
