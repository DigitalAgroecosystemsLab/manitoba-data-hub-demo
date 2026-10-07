/* Explore Data (card view) and Data Catalogue (table view): same filter engine. */
(function () {
  const M = (window.MADP = window.MADP || {});
  const { h, icon, setKids, debounce } = M.u;

  const YEARS = ['', 2026, 2024, 2020, 2015, 2010, 2005, 2000, 1990, 1980];
  const RESOLUTIONS = ['Field / sub-field (<=30 m)', 'Landscape (30 m - 1 km)', 'Regional (>1 km)', 'Station / point'];
  const ACCESS = ['Open', 'Partner', 'Restricted'];

  function datasetCard(d, opts = {}) {
    const L = M.ds.LAYERS[d.layer];
    return h('article', { class: 'ds-card', style: { '--org': M.ds.orgColor(d) }, tabindex: 0, role: 'button', 'aria-label': 'Open metadata for ' + d.title,
      onclick: () => M.ui.openMetadata(d), onkeydown: (e) => { if (e.key === 'Enter') M.ui.openMetadata(d); } },
      h('div', { class: 'row', style: { justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' } },
        h('div', { class: 'chip-row' }, d.themes.slice(0, 3).map((t) => h('span', { class: 'chip outline' }, t))),
        h('span', { class: 'chip ' + (d.access_type === 'Open' ? 'green' : d.access_type === 'Partner' ? 'blue' : 'amber') }, icon('lock'), d.access_type)),
      h('h3', null, d.title),
      h('div', { class: 'org' }, h('i', { style: { background: M.ds.orgColor(d) } }), d.organization, h('span', { class: 'chip', style: { background: L.soft, color: L.color, marginLeft: 'auto' } }, L.label)),
      h('p', { class: 'desc' }, d.description),
      h('div', { class: 'source-meta' }, h('span', null, icon('clock'), M.ds.coverageText(d)), h('span', null, icon('ruler'), d.spatial_resolution), h('span', null, icon('pin'), d.geographic_coverage.length > 34 ? d.geographic_coverage.slice(0, 32) + '\u2026' : d.geographic_coverage)),
      h('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: 'auto' } }, M.ui.fairBadges(d, { compact: true }), h('span', { class: 'btn btn-ghost btn-sm' }, 'Metadata', icon('chevron-right'))));
  }

  function build(mode, ctx) {
    const D = M.data.datasets;
    const st = { q: '', themes: new Set(ctx.query.theme ? ctx.query.theme.split(',') : []), orgs: new Set(ctx.query.org ? ctx.query.org.split(',') : []), layers: new Set(ctx.query.layer ? ctx.query.layer.split(',') : []),
      year: '', region: '', res: new Set(), access: new Set(), sort: 'relevance', sortCol: 'title', sortDir: 1 };
    const results = h('div'); const head = h('div'); const chips = h('div', { class: 'chip-row', style: { marginBottom: '14px' } });

    function matches(d) {
      if (st.q) { const hay = (d.title + ' ' + d.description + ' ' + d.keywords.join(' ') + ' ' + d.organization).toLowerCase(); if (!st.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false; }
      if (st.themes.size && !d.themes.some((t) => st.themes.has(t))) return false;
      if (st.orgs.size && !st.orgs.has(d.org_id)) return false;
      if (st.layers.size && !st.layers.has(d.layer)) return false;
      if (st.year && !(d.time_coverage.start <= +st.year && +st.year <= d.time_coverage.end)) return false;
      if (st.region && !d.regions.includes(st.region)) return false;
      if (st.res.size && !st.res.has(d.resolution_class)) return false;
      if (st.access.size && !st.access.has(d.access_type)) return false;
      return true;
    }
    const activeCount = () => st.themes.size + st.orgs.size + st.layers.size + st.res.size + st.access.size + (st.year ? 1 : 0) + (st.region ? 1 : 0) + (st.q ? 1 : 0);

    function filtered() {
      let rows = D.filter(matches);
      if (mode === 'table') rows.sort((a, b) => { const va = colVal(a, st.sortCol), vb = colVal(b, st.sortCol); return (va > vb ? 1 : va < vb ? -1 : 0) * st.sortDir; });
      else if (st.sort === 'title') rows.sort((a, b) => a.title.localeCompare(b.title));
      else if (st.sort === 'org') rows.sort((a, b) => a.organization.localeCompare(b.organization) || a.title.localeCompare(b.title));
      else if (st.sort === 'updated') rows.sort((a, b) => b.last_updated.localeCompare(a.last_updated));
      return rows;
    }
    const colVal = (d, c) => ({ title: d.title.toLowerCase(), org: d.organization, theme: d.themes[0], coverage: d.time_coverage.start, res: d.resolution_class, access: d.access_type, updated: d.last_updated, licence: d.licence }[c]);

    function renderActive() {
      const items = [];
      const add = (label, clear) => items.push(h('button', { type: 'button', class: 'chip green', onclick: () => { clear(); sync(); } }, label, icon('close')));
      st.themes.forEach((t) => add(t, () => st.themes.delete(t)));
      st.orgs.forEach((o) => add(M.ds.orgById[o].name, () => st.orgs.delete(o)));
      st.layers.forEach((l) => add(l, () => st.layers.delete(l)));
      if (st.year) add('Covers ' + st.year, () => (st.year = ''));
      if (st.region) add(M.ds.regionName(st.region), () => (st.region = ''));
      st.res.forEach((r) => add(r.split(' (')[0], () => st.res.delete(r)));
      st.access.forEach((a) => add(a + ' access', () => st.access.delete(a)));
      if (st.q) add('\u201c' + st.q + '\u201d', () => { st.q = ''; qInput.value = ''; });
      setKids(chips, items);
    }

    function renderResults() {
      const rows = filtered();
      setKids(head, h('div', { class: 'row', style: { justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' } },
        h('div', null, h('b', { style: { fontSize: '18px' } }, `${rows.length} of ${D.length} datasets`), h('span', { class: 'muted' }, ' \u00b7 demonstration catalogue')),
        h('div', { class: 'row' },
          mode === 'cards' ? h('select', { class: 'select', 'aria-label': 'Sort', onchange: (e) => { st.sort = e.target.value; renderResults(); } }, [['relevance', 'Sort: default'], ['title', 'Sort: title'], ['org', 'Sort: organization'], ['updated', 'Sort: recently updated']].map(([v, l]) => h('option', { value: v, selected: st.sort === v }, l))) : null,
          mode === 'table' ? [h('button', { class: 'btn btn-secondary btn-sm', onclick: () => M.u.download('manitoba-catalogue-demo.json', JSON.stringify(rows.map((d) => JSON.parse(M.ds.exportMetadata(d))), null, 2)) }, icon('download'), 'Export JSON'),
            h('button', { class: 'btn btn-secondary btn-sm', onclick: () => exportCsv(rows) }, icon('download'), 'Export CSV')] : null,
          h('div', { class: 'seg' }, h('button', { class: mode === 'cards' ? 'on' : '', onclick: () => M.router.go('/explore', Object.fromEntries(new URLSearchParams(location.hash.split('?')[1] || ''))) }, 'Cards'),
            h('button', { class: mode === 'table' ? 'on' : '', onclick: () => M.router.go('/catalogue', Object.fromEntries(new URLSearchParams(location.hash.split('?')[1] || ''))) }, 'Table')))));
      if (!rows.length) { setKids(results, h('div', { class: 'card empty' }, icon('filter'), h('p', null, 'No datasets match these filters.'), h('button', { class: 'btn btn-secondary btn-sm', style: { marginTop: '10px' }, onclick: clearAll }, 'Clear all filters'))); return; }
      if (mode === 'cards') setKids(results, h('div', { class: 'ds-grid' }, rows.map((d) => datasetCard(d))));
      else {
        const th = (c, l, cls) => h('th', { class: 'sortable ' + (cls || ''), onclick: () => { st.sortDir = st.sortCol === c ? -st.sortDir : 1; st.sortCol = c; renderResults(); } }, l + (st.sortCol === c ? (st.sortDir > 0 ? ' \u25b4' : ' \u25be') : ''));
        setKids(results, h('div', { class: 'table-wrap' }, h('table', { class: 'data' },
          h('thead', null, h('tr', null, th('title', 'Dataset'), th('org', 'Organization'), th('theme', 'Theme'), th('coverage', 'Coverage'), th('res', 'Resolution'), th('access', 'Access'), th('updated', 'Updated'), th('licence', 'Licence'))),
          h('tbody', null, rows.map((d) => h('tr', { class: 'clickable', onclick: () => M.ui.openMetadata(d) },
            h('td', null, h('b', null, d.title), h('div', { class: 'muted', style: { fontSize: '12px' } }, d.version)), h('td', null, d.organization), h('td', null, d.themes.join(', ')), h('td', null, M.ds.coverageText(d)),
            h('td', null, d.resolution_class), h('td', null, h('span', { class: 'chip ' + (d.access_type === 'Open' ? 'green' : d.access_type === 'Partner' ? 'blue' : 'amber') }, d.access_type)), h('td', null, d.last_updated), h('td', null, d.licence)))))));
      }
    }
    function exportCsv(rows) {
      const cols = ['id', 'title', 'organization', 'layer', 'themes', 'licence', 'geographic_coverage', 'spatial_resolution', 'format', 'coordinate_system', 'update_frequency', 'last_updated', 'version', 'access_type', 'doi', 'api_url'];
      const esc = (v) => '"' + String(Array.isArray(v) ? v.join('; ') : v).replace(/"/g, '""') + '"';
      M.u.download('manitoba-catalogue-demo.csv', [cols.join(','), ...rows.map((d) => cols.map((c) => esc(d[c])).join(','))].join('\n'), 'text/csv');
    }
    function sync() { renderActive(); renderResults(); side.querySelectorAll('[data-sync]').forEach((el) => el.__sync && el.__sync()); }
    function clearAll() { st.themes.clear(); st.orgs.clear(); st.layers.clear(); st.res.clear(); st.access.clear(); st.year = ''; st.region = ''; st.q = ''; qInput.value = ''; yearSel.value = ''; regionSel.value = ''; sync(); }

    /* sidebar */
    const qInput = h('input', { class: 'input', type: 'search', placeholder: 'Search title, keyword, organization\u2026', style: { width: '100%' }, 'aria-label': 'Search datasets', oninput: debounce((e) => { st.q = e.target.value.trim(); renderActive(); renderResults(); }, 120) });
    const yearSel = h('select', { class: 'select', style: { width: '100%' }, 'aria-label': 'Year', onchange: (e) => { st.year = e.target.value; renderActive(); renderResults(); } }, YEARS.map((y) => h('option', { value: y }, y === '' ? 'Any year' : 'Covers ' + y)));
    const regionSel = h('select', { class: 'select', style: { width: '100%' }, 'aria-label': 'Geographic coverage', onchange: (e) => { st.region = e.target.value; renderActive(); renderResults(); } }, [h('option', { value: '' }, 'Anywhere in Manitoba'), ...M.ds.REGIONS.map(([id, n]) => h('option', { value: id }, n))]);
    function checkGroup(title, options, set, count) {
      return h('div', { class: 'filter-group' }, h('h4', null, title), h('div', { class: 'check-list' }, options.map(([val, label]) => {
        const cb = h('input', { type: 'checkbox', checked: set.has(val), onchange: (e) => { e.target.checked ? set.add(val) : set.delete(val); renderActive(); renderResults(); } });
        const lab = h('label', { class: 'check', 'data-sync': 1 }, cb, label, h('span', { class: 'count' }, count(val)));
        lab.__sync = () => { cb.checked = set.has(val); };
        return lab;
      })));
    }
    const themeBox = h('div', { class: 'filter-group' }, h('h4', null, 'Theme'), h('div', { class: 'chip-row', 'data-sync': 1 }, M.ds.THEMES.map((t) => {
      const b = h('button', { type: 'button', class: 'theme-chip' + (st.themes.has(t.id) ? ' on' : ''), 'aria-pressed': String(st.themes.has(t.id)), onclick: () => { st.themes.has(t.id) ? st.themes.delete(t.id) : st.themes.add(t.id); b.classList.toggle('on', st.themes.has(t.id)); renderActive(); renderResults(); } }, icon(t.icon), t.id);
      b.__sync = () => b.classList.toggle('on', st.themes.has(t.id));
      return b;
    })));
    themeBox.firstChild.nextSibling.__sync = () => themeBox.querySelectorAll('.theme-chip').forEach((b) => b.__sync && b.__sync());
    const side = h('aside', { class: 'card filter-card' },
      h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('h3', { style: { fontSize: '17px', display: 'flex', gap: '8px', alignItems: 'center' } }, icon('filter'), 'Filters'), h('button', { class: 'btn btn-ghost btn-sm', onclick: clearAll }, 'Clear all')),
      h('div', { class: 'filter-group' }, qInput), themeBox,
      checkGroup('Organization', M.data.organizations.map((o) => [o.id, o.name]), st.orgs, (v) => D.filter((d) => d.org_id === v).length),
      checkGroup('Portal layer', Object.keys(M.ds.LAYERS).map((l) => [l, l]), st.layers, (v) => D.filter((d) => d.layer === v).length),
      h('div', { class: 'filter-group' }, h('h4', null, 'Year covered'), yearSel),
      h('div', { class: 'filter-group' }, h('h4', null, 'Geographic coverage'), regionSel),
      checkGroup('Spatial resolution', RESOLUTIONS.map((r) => [r, r]), st.res, (v) => D.filter((d) => d.resolution_class === v).length),
      checkGroup('Access type', ACCESS.map((a) => [a, a]), st.access, (v) => D.filter((d) => d.access_type === v).length));

    renderActive(); renderResults();
    if (ctx.query.dataset && M.ds.byId[ctx.query.dataset]) setTimeout(() => M.ui.openMetadata(ctx.query.dataset), 50);
    const title = mode === 'cards' ? 'Explore Data' : 'Data Catalogue';
    const sub = mode === 'cards' ? 'Discover datasets from local, provincial, federal, research and global sources, described in one common way.' : 'The full demonstration catalogue as a sortable table, ready to export as JSON or CSV.';
    return h('div', { class: 'container page fade-in' },
      h('div', { class: 'page-head' }, h('div', null, h('div', { class: 'eyebrow' }, 'FAIR data catalogue'), h('h1', null, title), h('p', null, sub)),
        h('div', { class: 'callout', style: { maxWidth: '420px' } }, icon('info'), h('div', null, 'We are not replacing existing databases: each record points to a dataset that stays with its owner. ', h('span', { class: 'sim-tag' }, 'Simulated connections')))),
      h('div', { class: 'explore-layout' }, side, h('div', { style: { minWidth: 0 } }, head, chips, results)));
  }

  M.ui = M.ui || {};
  M.ui.datasetCard = datasetCard;
  M.router.add('/explore', (ctx) => build('cards', ctx), '/explore');
  M.router.add('/catalogue', (ctx) => build('table', ctx), '/catalogue');
})();
