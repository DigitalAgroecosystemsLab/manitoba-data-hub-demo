/* Home page. */
(function () {
  const M = (window.MADP = window.MADP || {});
  const { h, s, icon } = M.u;

  /* Seeded RNG so the generated landscape is identical every load. */
  function rng(seed) { let t = seed; return () => ((t = (t * 1664525 + 1013904223) % 4294967296) / 4294967296); }

  function heroScene() {
    const W = 1600, H = 720, r = rng(7);
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMax slice', 'aria-hidden': 'true' });
    svg.appendChild(s('defs', null,
      s('linearGradient', { id: 'gHillBack', x1: 0, y1: 0, x2: 0, y2: 1 }, s('stop', { offset: 0, 'stop-color': '#c4dbe6' }), s('stop', { offset: 1, 'stop-color': '#d9e9e2' })),
      s('linearGradient', { id: 'gHillMid', x1: 0, y1: 0, x2: 0, y2: 1 }, s('stop', { offset: 0, 'stop-color': '#a9cbb4' }), s('stop', { offset: 1, 'stop-color': '#8fbf92' })),
      s('linearGradient', { id: 'gField', x1: 0, y1: 0, x2: 0, y2: 1 }, s('stop', { offset: 0, 'stop-color': '#79b25a' }), s('stop', { offset: 1, 'stop-color': '#4f9440' })),
      s('linearGradient', { id: 'gCanola', x1: 0, y1: 0, x2: 1, y2: 0 }, s('stop', { offset: 0, 'stop-color': '#f4d421' }), s('stop', { offset: 1, 'stop-color': '#e6c11a' })),
      s('linearGradient', { id: 'gRiver', x1: 0, y1: 0, x2: 1, y2: 0 }, s('stop', { offset: 0, 'stop-color': '#a9d0e6' }), s('stop', { offset: 1, 'stop-color': '#cfe5f1' })),
      s('radialGradient', { id: 'gSun', cx: '78%', cy: '8%', r: '55%' }, s('stop', { offset: 0, 'stop-color': '#fffbe8', 'stop-opacity': 0.9 }), s('stop', { offset: 1, 'stop-color': '#fffbe8', 'stop-opacity': 0 }))));
    svg.appendChild(s('rect', { width: W, height: H, fill: 'url(#gSun)' }));
    // clouds
    for (let i = 0; i < 9; i++) {
      const cx = r() * W, cy = 40 + r() * 190, w = 140 + r() * 260;
      svg.appendChild(s('ellipse', { cx, cy, rx: w, ry: 14 + r() * 18, fill: '#fff', opacity: 0.35 + r() * 0.25 }));
    }
    // distant hills
    svg.appendChild(s('path', { d: `M0 440 C 200 380, 380 410, 560 395 S 900 360, 1100 395 S 1450 380, 1600 405 L1600 ${H} L0 ${H}Z`, fill: 'url(#gHillBack)' }));
    svg.appendChild(s('path', { d: `M0 470 C 260 430, 420 460, 640 440 S 1000 420, 1200 445 S 1500 440, 1600 455 L1600 ${H} L0 ${H}Z`, fill: 'url(#gHillMid)' }));
    // tree line on mid hills
    const treeBase = (x) => 452 + Math.sin(x / 150) * 12 + Math.sin(x / 57) * 3;
    const trees = s('g');
    for (let i = 0; i < 260; i++) {
      const x = r() * W, y = treeBase(x) + r() * 10, rad = 6 + r() * 11;
      const g = 90 + Math.floor(r() * 50);
      trees.appendChild(s('ellipse', { cx: x, cy: y - rad * 0.8, rx: rad * 0.8, ry: rad * 1.3, fill: `rgb(${35 + Math.floor(r() * 20)},${g},${50 + Math.floor(r() * 20)})`, opacity: 0.92 }));
    }
    svg.appendChild(trees);
    // far fields
    svg.appendChild(s('path', { d: `M0 500 C 300 480, 600 505, 900 490 S 1400 500, 1600 488 L1600 ${H} L0 ${H}Z`, fill: '#9cc86f' }));
    svg.appendChild(s('path', { d: `M0 520 C 350 505, 700 530, 1000 512 S 1450 520, 1600 515 L1600 ${H} L0 ${H}Z`, fill: '#86b95b' }));
    // river
    svg.appendChild(s('path', { d: 'M1650 560 C 1450 548, 1280 575, 1100 560 C 960 548, 880 575, 760 566 C 700 562, 680 556, 640 560', fill: 'none', stroke: 'url(#gRiver)', 'stroke-width': 20, 'stroke-linecap': 'round', opacity: 0.95 }));
    svg.appendChild(s('path', { d: 'M1650 556 C 1450 544, 1280 571, 1100 556', fill: 'none', stroke: '#fff', 'stroke-width': 2, opacity: 0.45 }));
    // river-bank trees
    for (let i = 0; i < 70; i++) {
      const x = 640 + r() * 960, y = 548 + Math.sin(x / 90) * 6 + (r() > 0.5 ? -12 : 20) + r() * 8, rad = 4 + r() * 8;
      svg.appendChild(s('ellipse', { cx: x, cy: y, rx: rad, ry: rad * 1.25, fill: `rgb(${40 + Math.floor(r() * 20)},${100 + Math.floor(r() * 40)},${55 + Math.floor(r() * 20)})` }));
    }
    // canola band
    svg.appendChild(s('path', { d: `M0 ${H - 140} C 260 ${H - 190}, 620 ${H - 150}, 980 ${H - 215} S 1500 ${H - 250}, 1600 ${H - 262} L1600 ${H - 160} C 1300 ${H - 120}, 900 ${H - 40}, 500 ${H - 10} L0 ${H}Z`, fill: 'url(#gCanola)' }));
    for (let i = 0; i < 180; i++) {
      const x = r() * W, y = H - 40 - r() * 190;
      if (y > H - 262 + (x / W) * 40 - 20 && y < H - 40 - (x / W) * 150 + 90) svg.appendChild(s('circle', { cx: x, cy: y, r: 1.4 + r() * 2.2, fill: r() > 0.5 ? '#fff0a0' : '#d8aa0a', opacity: 0.6 }));
    }
    // foreground green + crop rows
    svg.appendChild(s('path', { d: `M0 ${H - 90} C 300 ${H - 140}, 700 ${H - 60}, 1100 ${H - 110} S 1500 ${H - 130}, 1600 ${H - 120} L1600 ${H} L0 ${H}Z`, fill: 'url(#gField)' }));
    for (let i = 0; i < 26; i++) {
      const x0 = i * 64 - 100;
      svg.appendChild(s('path', { d: `M${x0} ${H} L${800 + (x0 - 800) * 0.35} ${H - 110}`, stroke: '#3f8337', 'stroke-width': 2.2, opacity: 0.35, fill: 'none' }));
    }
    for (let i = 0; i < 40; i++) {
      const x = r() * W, y = H - 100 + r() * 90, rad = 8 + r() * 16;
      svg.appendChild(s('ellipse', { cx: x, cy: y, rx: rad * 1.2, ry: rad * 0.6, fill: `rgb(${70 + Math.floor(r() * 30)},${140 + Math.floor(r() * 40)},${60 + Math.floor(r() * 20)})`, opacity: 0.5 }));
    }
    return svg;
  }

  function heroMap() {
    const { px, py, ringPath } = M.ui.mapGeometry;
    const prov = M.data.geo.regions.features[0];
    const svg = s('svg', { viewBox: '-20 -20 800 1140', 'aria-hidden': 'true', style: 'filter: drop-shadow(0 12px 28px rgba(31,111,168,.18))' });
    svg.appendChild(s('path', { d: ringPath(prov.geometry.coordinates), fill: 'rgba(255,255,255,.42)', stroke: 'rgba(255,255,255,.95)', 'stroke-width': 5, 'stroke-linejoin': 'round' }));
    const nodes = [[-100, 59], [-96.5, 58.2], [-98.7, 56.6], [-95.2, 55.4], [-99.6, 54.3], [-97.4, 53.2], [-100.8, 52.2], [-96.2, 51.6], [-99.3, 50.7], [-97.1, 49.9], [-100.2, 49.7], [-95.9, 49.5], [-98.4, 49.2]]
      .map(([lo, la]) => [px(lo), py(la)]);
    const links = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 5], [4, 6], [5, 7], [6, 8], [7, 9], [8, 9], [8, 10], [9, 11], [9, 12], [10, 12], [11, 12], [5, 8], [7, 11]];
    links.forEach(([a, b]) => svg.appendChild(s('line', { x1: nodes[a][0], y1: nodes[a][1], x2: nodes[b][0], y2: nodes[b][1], stroke: 'rgba(31,111,168,.45)', 'stroke-width': 2.5 })));
    nodes.forEach(([x, y], i) => {
      const c = s('circle', { cx: x, cy: y, r: 9 + (i % 3) * 3, fill: '#fff', stroke: 'rgba(31,111,168,.7)', 'stroke-width': 3 });
      svg.appendChild(c);
      svg.appendChild(s('circle', { cx: x, cy: y, r: 4, fill: i % 4 === 0 ? '#3d8a49' : '#1f6fa8' }));
    });
    return svg;
  }

  function hubCards() {
    const defs = [
      { key: 'mb', layer: 'MB Core Data', title: 'MB Core Data', text: 'Authoritative provincial datasets.' },
      { key: 'um', layer: 'UM Research', title: 'UM Research', text: 'University datasets, projects, models, and research outputs.' },
      { key: 'datahub', layer: 'Connected DataHub', title: 'Connected DataHub', text: 'Federal, industry, partner, satellite, and global datasets.' },
    ];
    return h('div', { class: 'hub-cards container' }, defs.map((d) => {
      const L = M.ds.LAYERS[d.layer];
      const n = M.data.datasets.filter((x) => x.layer === d.layer).length;
      return h('a', { class: 'hub-card', href: '#/hub/' + d.key, style: { '--c': L.color, '--soft': L.soft } },
        h('div', { class: 'hub-ico' }, icon(L.icon)),
        h('div', null, h('h3', null, d.title), h('p', null, d.text), h('div', { class: 'hub-stats' }, h('span', null, `${n} demo datasets`), h('span', null, 'simulated connection'))),
        h('span', { class: 'go' }, icon('chevron-right')));
    }));
  }

  function categories(hero) {
    const defs = [
      { id: 'Soils', cls: 'cat-soil', ic: 'seed', theme: 'Soil' }, { id: 'Crops', cls: 'cat-crop', ic: 'wheat', theme: 'Crops' },
      { id: 'Water', cls: 'cat-water', ic: 'drop', theme: 'Water' }, { id: 'Environment', cls: 'cat-env', ic: 'leaf', theme: 'Grasslands' },
    ];
    const phaseView = M.router.parse().query.phase === '1'; // presentation flag for the concept report figure
    const holder = h('div');
    const row = h('div', { class: 'cats', role: 'tablist', 'aria-label': 'Browse by category' });
    let active = null;
    defs.forEach((d) => {
      const b = h('button', { type: 'button', class: 'cat ' + d.cls, role: 'tab', onclick: () => {
        active = active === d.id ? null : d.id;
        row.querySelectorAll('.cat').forEach((x) => x.classList.toggle('on', x === b && active));
        if (!active) { holder.replaceChildren(); return; }
        const c = M.data.categories.find((x) => x.id === d.id);
        holder.replaceChildren(h('div', { class: 'cat-panel' },
          h('h3', null, d.id), h('p', null, c.blurb),
          c.questions.map((qid) => { const q = M.data.questions.find((x) => x.id === qid); return h('button', { type: 'button', class: 'cat-q', onclick: () => M.ui.askQuestion(q.text) }, icon('sparkles'), q.text, h('span', { style: { marginLeft: 'auto' } }, icon('arrow-right'))); }),
          h('a', { class: 'btn btn-ghost btn-sm', style: { marginTop: '8px' }, href: '#/explore?theme=' + encodeURIComponent(d.theme) }, `Browse ${d.id.toLowerCase()} datasets`, icon('chevron-right'))));
      } }, h('span', { class: 'cat-ico' }, icon(d.ic)), d.id, phaseView ? h('span', { class: 'cat-phase ' + (d.id === 'Soils' ? 'now' : 'later') }, d.id === 'Soils' ? 'Phase 1' : 'Future') : null);
      row.appendChild(b);
    });
    return h('div', null, row, holder);
  }

  function render() {
    const hero = h('section', { class: 'hero' },
      h('div', { class: 'hero-scene' }, heroScene()),
      h('div', { class: 'hero-map' }, heroMap()),
      h('div', { class: 'container hero-inner' },
        h('div', { class: 'hero-eyebrow' }, 'Manitoba Agricultural Data Portal'),
        h('h1', null, 'Hello, ', h('span', null, 'Manitobans')),
        h('p', { class: 'sub' }, 'Trusted, interpretable, and FAIR data for Manitoba agriculture.'),
        h('div', { class: 'hero-search' }, M.ui.searchBox({ big: true })),
        categories()));

    const qCards = M.data.questions.map((q, i) => h('button', { type: 'button', class: 'qcard', onclick: () => M.ui.askQuestion(q.text) },
      h('span', { class: 'qn' }, i + 1), h('div', null, h('b', null, q.text), h('span', null, `${q.category} \u00b7 datasets from several sources, one answer`))));

    return h('div', { class: 'fade-in' },
      hero, hubCards(),
      h('section', { class: 'section container' },
        h('div', { class: 'section-title' }, h('div', { class: 'eyebrow' }, 'Ask the data, not the database'),
          h('h2', null, 'Manitoba already has enormous amounts of agricultural data'),
          h('p', null, 'The problem is that they are fragmented. This platform connects them and turns them into trusted, interpretable information people can use to make decisions.')),
        h('div', { class: 'dflow' }, [['1', 'Data', 'Local, provincial, federal, research and global'], ['2', 'Integration', 'Harmonised through FAIR metadata'], ['3', 'Intelligence', 'Analytics, GIS and AI you can audit'], ['4', 'Decision', 'Interpretable answers, ready to act on']].map(([n, t, d]) => h('div', { class: 'dstep' }, h('div', { class: 'n' }, n), h('h4', null, t), h('p', null, d))))),
      h('section', { class: 'section container' },
        h('div', { class: 'section-title' }, h('h2', null, 'Try a demonstration question'), h('p', null, 'Each answer combines several datasets, shows its sources and explains exactly how it was produced.')),
        h('div', { class: 'qgrid' }, qCards)),
      h('section', { class: 'section container' },
        h('div', { class: 'section-title' }, h('div', { class: 'eyebrow' }, 'Architecture'), h('h2', null, 'How the platform fits together'), h('p', null, 'Click any source or stage to see what it does.')),
        M.ui.archDiagram()),
      h('section', { class: 'section container' },
        h('div', { class: 'statement' },
          h('div', { style: { position: 'relative', zIndex: 1 } }, h('div', { class: 'eyebrow', style: { color: '#8fd29b' } }, 'Our principle'),
            h('h2', null, 'We are not replacing existing databases. We are creating the intelligence and interoperability layer that makes existing and future data investments work together.'),
            h('p', null, 'Data stay with their owners. The portal adds shared metadata, harmonisation and trustworthy answers on top.')),
          h('div', { class: 'kv' }, [['database', 'Existing databases stay in place'], ['link', 'Connected through FAIR metadata'], ['shield', 'Every answer is traceable'], ['users', 'Built with, and for, decision-makers']].map(([ic, t]) => h('div', null, icon(ic), t))))),
      h('section', { class: 'container' }, M.ui.partnerStrip()),
      h('div', { class: 'tagband container' }, h('span', null, 'Built for Manitoba.'), ' Connected to Canada. ', h('em', null, 'Interoperable globally.')));
  }

  M.router.add('/', render, '/');
})();
