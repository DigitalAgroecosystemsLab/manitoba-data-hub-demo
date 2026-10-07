/* Maps page: browse every regional layer in the demonstration data and inspect any region. */
(function () {
  const M = (window.MADP = window.MADP || {});
  const { h, icon, fmtNum, colorFor, setKids } = M.u;
  const GROUP_ORDER = ['Water & drought', 'Crops', 'Soils', 'Land & grasslands', 'Climate'];
  const QUESTION_FOR = { drought_regional: 'q1-drought', crop_stress_regional: 'q4-crop-stress', grassland_change_regional: 'q3-grassland', soil_health_regional: 'q2-soc-brandon', landuse_change_regional: 'q3-grassland', flood_risk_regional: 'q5-rrv-datasets', climate_risk_regional: 'q4-crop-stress' };
  const shortLabel = (l) => (l || '').replace(/\s*\(.*\)$/, '');
  function fmt(spec, v) {
    if (v == null) return '\u2013'; if (typeof v === 'string') return v;
    if (spec.categories) return spec.categories[Math.round(v)];
    const n = fmtNum(v, spec.decimals), u = spec.unit || '';
    return !u || u === 'class' || u === 'index' ? n : u.startsWith('%') ? n + u : n + ' ' + u;
  }

  function render() {
    const D = M.data;
    const layers = M.ds.mapLayers();
    const groups = {};
    layers.forEach((l) => { const g = M.ds.THEME_OF_TABLE[l.table.id] || 'Other'; (groups[g] = groups[g] || []).push(l); });
    let cur = layers.find((l) => l.id === 'drought_regional:drought_level');
    const overlays = { stations: false, soc: false };
    let selected = null;

    const panel = h('div', { class: 'region-panel' });
    const layerList = h('div');
    const valuesOf = (l) => Object.fromEntries(D.table_rows[l.table.id].map((r) => [r[l.table.key], r[l.field.name]]));
    const stationPts = () => D.table_rows.precip_stations.map((r) => ({ id: 'st|' + r.station, label: r.station, short: r.station, lat: r.lat, lon: r.lon, value: r.anomaly_pct, tip: `<br>60-day precip anomaly: ${fmtNum(r.anomaly_pct, 0)}%` }));
    const socPts = () => D.table_rows.soc_sites.map((r) => ({ id: 'soc|' + r.site_name, label: r.site_name, short: r.site_name, lat: r.lat, lon: r.lon, value: r.soc_stock_t_ha_0_30cm, color: colorFor(M.ds.fieldSpec('soc_sites', 'soc_stock_t_ha_0_30cm'), r.soc_stock_t_ha_0_30cm), tip: `<br>SOC: ${r.soc_stock_t_ha_0_30cm} t C/ha (${r.land_use})` }));
    const ptsNow = () => [...(overlays.stations ? stationPts() : []), ...(overlays.soc ? socPts() : [])];

    const map = M.ui.manitobaMap({ values: valuesOf(cur), spec: cur.field, view: 'south', points: [], pointSpec: M.ds.fieldSpec('precip_stations', 'anomaly_pct'), pointLabel: 'Station anomaly',
      onSelect: (id) => { selected = id; showRegion(id); }, onPointSelect: (pt) => showPoint(pt) });

    function showRegion(id) {
      const name = M.ds.regionName(id);
      const row = D.table_rows[cur.table.id].find((r) => r[cur.table.key] === id);
      const profile = D.tables_meta.filter((t) => t.kind === 'regional').map((t) => {
        const r = D.table_rows[t.id].find((x) => x[t.key] === id); if (!r) return null;
        const f = t.fields.find((x) => x.name === t.default_field);
        return [shortLabel(f.label), fmt(f, r[f.name])];
      }).filter(Boolean);
      setKids(panel,
        h('h4', null, icon('pin'), name),
        row ? h('div', { class: 'rp-block' }, h('h5', null, cur.table.title), cur.table.fields.map((f) => h('div', { class: 'rp-row' }, h('span', null, shortLabel(f.label)), h('b', null, fmt(f, row[f.name]))))) : h('p', { class: 'muted', style: { marginTop: '10px' } }, 'This layer has no data for ' + name + '.'),
        h('div', { class: 'rp-block' }, h('h5', null, 'Region profile (all layers)'), profile.map(([k, v]) => h('div', { class: 'rp-row' }, h('span', null, k), h('b', null, v)))),
        h('button', { class: 'btn btn-secondary btn-sm', style: { marginTop: '12px' }, onclick: () => M.ui.openMetadata(cur.dataset) }, icon('file'), 'Dataset metadata'));
    }
    function showPoint(pt) {
      setKids(panel, h('h4', null, icon('pin'), pt.label), h('div', { class: 'rp-block' }, h('div', { class: 'rp-row' }, h('span', null, 'Value'), h('b', { html: pt.tip.replace('<br>', '') })),
        h('div', { class: 'rp-row' }, h('span', null, 'Located in'), h('b', null, M.ds.regionName(regionOfPoint(pt.lon, pt.lat))))));
    }
    function regionOfPoint(lon, lat) {
      const pip = (ring) => { let ins = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) ins = !ins; } return ins; };
      for (const f of D.geo.regions.features) if (f.properties.id !== 'northern' && pip(f.geometry.coordinates[0])) return f.properties.id;
      return 'northern';
    }

    function drawLayers() {
      setKids(layerList, GROUP_ORDER.filter((g) => groups[g]).map((g) => h('div', { class: 'filter-group' }, h('h4', null, g),
        h('div', { class: 'stack', style: { gap: '4px' } }, groups[g].map((l) => h('button', { type: 'button', class: 'layer-btn' + (l === cur ? ' on' : ''), onclick: () => { cur = l; map.update({ values: valuesOf(l), spec: l.field }); drawLayers(); drawHeader(); if (selected) showRegion(selected); } },
          h('span', null, shortLabel(l.field.label)), h('small', null, l.dataset.organization)))))));
    }
    const header = h('div');
    function drawHeader() {
      setKids(header, h('div', { class: 'row', style: { justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' } },
        h('div', null, h('h3', { style: { fontSize: '19px' } }, shortLabel(cur.field.label)), h('div', { class: 'muted', style: { fontSize: '13px' } }, `${cur.table.title} \u00b7 ${cur.dataset.title} \u00b7 as of ${cur.table.as_of}`)),
        h('div', { class: 'row' }, h('span', { class: 'demo-tag' }, 'Demo data'),
          h('button', { class: 'btn btn-secondary btn-sm', onclick: () => M.ui.askQuestion(D.questions.find((q) => q.id === QUESTION_FOR[cur.table.id]).text) }, icon('sparkles'), 'Ask about this layer'))));
    }
    function toggle(key, label, ic) {
      const b = h('button', { type: 'button', class: 'layer-btn', onclick: () => { overlays[key] = !overlays[key]; b.classList.toggle('on', overlays[key]); map.update({ points: ptsNow(), pointSpec: overlays.stations && !overlays.soc ? M.ds.fieldSpec('precip_stations', 'anomaly_pct') : overlays.soc && !overlays.stations ? M.ds.fieldSpec('soc_sites', 'soc_stock_t_ha_0_30cm') : null, pointLabel: overlays.stations && !overlays.soc ? 'Station anomaly (%)' : overlays.soc && !overlays.stations ? 'SOC stock (t C/ha)' : '', pointLabels: ptsNow().length <= 10 }); } }, h('span', { style: { display: 'flex', gap: '8px', alignItems: 'center' } }, icon(ic), label));
      return b;
    }
    drawLayers(); drawHeader();
    const side = h('aside', { class: 'card filter-card' }, h('h3', { style: { fontSize: '17px', display: 'flex', gap: '8px', alignItems: 'center' } }, icon('layers'), 'Map layers'), layerList,
      h('div', { class: 'filter-group' }, h('h4', null, 'Overlays'), h('div', { class: 'stack', style: { gap: '4px' } }, toggle('stations', 'Weather stations', 'thermo'), toggle('soc', 'Soil carbon sites', 'seed'))));
    setKids(panel, h('h4', null, icon('target'), 'Region details'), h('p', { class: 'hint', style: { marginTop: '8px' } }, icon('info'), 'Click a region on the map to see its values for the selected layer and a profile across all layers.'));

    return h('div', { class: 'container page fade-in' },
      h('div', { class: 'page-head' }, h('div', null, h('div', { class: 'eyebrow' }, 'Geospatial view'), h('h1', null, 'Maps'), h('p', null, 'Switch layers from different datasets on one common set of regions. All geometry and values are simplified demonstration data stored locally.'))),
      h('div', { class: 'explore-layout' }, side, h('div', { class: 'card card-pad', style: { minWidth: 0 } }, header, h('div', { class: 'map-card-grid' }, map.el, panel))));
  }
  M.router.add('/maps', render, '/maps');
})();
