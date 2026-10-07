/* Interactive Manitoba map built from local GeoJSON -> inline SVG (works offline).
 *
 *   const map = MADP.ui.manitobaMap({ values:{westman:3,...}, spec:{palette:'drought',domain:[0,5],categories:[..]},
 *                                      focusIds:['westman'], points:[...], pointSpec:{...}, onSelect(id){} });
 *   container.appendChild(map.el);   map.update({ values, spec });   map.select('westman');
 */
(function () {
  const M = (window.MADP = window.MADP || {});
  const { h, s, icon, colorFor, gradientCss, fmtNum } = M.u;
  const COS = Math.cos((54.5 * Math.PI) / 180), S = 100;
  const px = (lon) => (lon + 102) * COS * S;
  const py = (lat) => (60 - lat) * S;
  const VIEWS = {
    south: { x: -12, y: 640, w: 530, h: 470 },
    full: { x: -40, y: -20, w: 820, h: 1160 },
  };
  const CITIES = [
    ['Winnipeg', 49.90, -97.14, 'start'], ['Brandon', 49.84, -99.95, 'start'], ['Portage la Prairie', 49.97, -98.29, 'middle', -11], ['Dauphin', 51.15, -100.05, 'start'],
    ['Steinbach', 49.52, -96.68, 'start'], ['Morden', 49.19, -98.10, 'end'], ['The Pas', 53.82, -101.25, 'start'],
  ];

  function ringPath(coords) {
    return coords.map((ring) => 'M' + ring.map(([lo, la]) => px(lo).toFixed(1) + ',' + py(la).toFixed(1)).join('L') + 'Z').join('');
  }
  function linePath(coords) {
    return 'M' + coords.map(([lo, la]) => px(lo).toFixed(1) + ',' + py(la).toFixed(1)).join('L');
  }
  function centroid(coords) {
    const pts = coords[0]; let x = 0, y = 0;
    pts.forEach(([lo, la]) => { x += lo; y += la; });
    return [x / pts.length, y / pts.length];
  }
  const LABEL_POS = { northern: [-98.2, 54.0], westman: [-100.35, 50.45], pembina: [-98.45, 49.5], central: [-98.45, 50.5], rrv: [-97.0, 49.28], eastern: [-95.8, 50.35], interlake: [-97.9, 51.5], parkland: [-100.4, 52.2] };

  function createMap(opts0) {
    let o = Object.assign({ values: {}, spec: null, focusIds: [], points: [], pointSpec: null, view: 'south', showCities: true, showLabels: true, mini: false,
      selected: null, selectedPoint: null, focusCircle: null, pointLabels: false, legend: true, disclaimer: true, onSelect: null, onPointSelect: null }, opts0);
    const geo = M.data.geo;
    const wrap = h('div', { class: 'map-wrap' + (o.mini ? ' mini' : '') });
    const tip = h('div', { class: 'map-tip' });
    const legendEl = h('div', { class: 'map-legend' });
    const el = h('div', { class: 'map-block' }, wrap, o.legend && !o.mini ? legendEl : null);
    wrap.style.aspectRatio = '1.13 / 1';
    let svg;

    function viewBox() {
      if (o.view === 'focus' && o.focusCircle) {
        const c = o.focusCircle, cx = px(c.lon), cy = py(c.lat);
        const hw = Math.max(140, c.radius_km * 0.81 * 2.9), hh = hw / 1.13;
        return { x: cx - hw, y: cy - hh, w: hw * 2, h: hh * 2 };
      }
      return VIEWS[o.view === 'focus' ? 'south' : o.view] || VIEWS.south;
    }
    const hasValues = () => o.spec && Object.values(o.values).some((v) => v != null);

    function fillFor(id) {
      if (hasValues()) return o.values[id] == null ? '#e6ebe9' : colorFor(o.spec, o.values[id]);
      if (id === 'northern') return '#e7efe3';
      return o.focusIds.includes(id) ? '#bfe0bd' : '#dcebd8';
    }

    function render() {
      const vb = viewBox();
      const k = vb.w / 530; // units-per-normal-unit: keeps text and markers a constant on-screen size at every zoom
      svg = s('svg', { class: 'map-svg', viewBox: `${vb.x} ${vb.y} ${vb.w} ${vb.h}`, role: 'img', 'aria-label': 'Map of agricultural Manitoba' });
      const defs = s('defs', null, s('filter', { id: 'mapShadow', x: '-5%', y: '-5%', width: '110%', height: '110%' },
        s('feDropShadow', { dx: 0, dy: 2, stdDeviation: 3, 'flood-color': '#0f2744', 'flood-opacity': 0.12 })));
      svg.appendChild(defs);

      const gReg = s('g', { filter: 'url(#mapShadow)' });
      geo.regions.features.forEach((f) => {
        const id = f.properties.id;
        const cls = ['map-region'];
        if (o.selected === id) cls.push('selected');
        if (o.focusIds.length && !o.focusIds.includes(id) && id !== 'northern' && !hasValues()) cls.push('dim');
        if (o.focusIds.includes(id) && o.focusIds.length < 4) cls.push('focus');
        const p = s('path', { class: cls.join(' '), d: ringPath(f.geometry.coordinates), fill: fillFor(id), 'data-id': id, tabindex: o.mini ? null : 0, role: 'button', 'aria-label': f.properties.name });
        if (!o.mini) {
          p.addEventListener('mousemove', (e) => showTip(e, regionTip(id)));
          p.addEventListener('mouseleave', hideTip);
          p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(id); } });
        }
        p.addEventListener('click', () => choose(id));
        gReg.appendChild(p);
      });
      svg.appendChild(gReg);

      geo.lakes.features.forEach((f) => svg.appendChild(s('path', { class: 'map-lake', d: ringPath(f.geometry.coordinates) })));
      if (!o.mini) geo.rivers.features.forEach((f) => svg.appendChild(s('path', { class: 'map-river', d: linePath(f.geometry.coordinates) })));

      if (o.focusCircle) {
        const c = o.focusCircle;
        svg.appendChild(s('ellipse', { class: 'map-focus-ring', cx: px(c.lon), cy: py(c.lat), rx: c.radius_km * 0.81, ry: c.radius_km * 0.9 }));
      }

      if (o.showLabels && !o.mini) {
        const wide = o.view === 'full';
        geo.regions.features.forEach((f) => {
          const id = f.properties.id;
          if (o.view === 'focus' && !o.focusIds.includes(id)) return;
          if (id === 'northern' && o.view !== 'full') return;
          const [lo, la] = LABEL_POS[id] || centroid(f.geometry.coordinates);
          const words = f.properties.name.split(' ');
          const lines = words.length > 1 && id !== 'northern' ? [words[0], words.slice(1).join(' ')] : [f.properties.name];
          const t = s('text', { class: 'map-label', x: px(lo), y: py(la), style: `font-size:${(wide ? 17 : 12.5) * k}px;stroke-width:${3.5 * k}px` });
          lines.forEach((ln, i) => t.appendChild(s('tspan', { x: px(lo), dy: i === 0 ? 0 : '1.1em' }, ln)));
          svg.appendChild(t);
        });
      }

      if (o.showCities && !o.mini) {
        CITIES.forEach(([name, la, lo, anchor, dy]) => {
          if (o.view === 'full' && !['Winnipeg', 'Brandon', 'The Pas'].includes(name)) return;
          if (o.view === 'focus' && o.focusCircle && Math.hypot((px(lo) - px(o.focusCircle.lon)), (py(la) - py(o.focusCircle.lat))) > 200) return;
          const isFocusPlace = o.focusCircle && name === o.focusCircle.name;
          if (!isFocusPlace && o.points.some((pt) => Math.hypot(px(pt.lon) - px(lo), py(pt.lat) - py(la)) < 22)) return; // a point marker already shows this place
          svg.appendChild(s('circle', { class: 'map-city', cx: px(lo), cy: py(la), r: 4 * k, 'stroke-width': 2 * k }));
          svg.appendChild(s('text', { class: 'map-city-label', x: px(lo) + (anchor === 'end' ? -7 : anchor === 'middle' ? 0 : 7) * k, y: py(la) + (dy != null ? dy : 4) * k, 'text-anchor': anchor, style: `font-size:${12.5 * k}px;stroke-width:${3 * k}px` }, name));
        });
      }

      const sel = o.selectedPoint;
      o.points.forEach((pt) => {
        const color = pt.color || (o.pointSpec ? colorFor(o.pointSpec, pt.value) : '#2f6b3a');
        const c = s('circle', { class: 'map-point' + (sel === pt.id ? ' selected' : ''), cx: px(pt.lon), cy: py(pt.lat), r: 7 * k, 'stroke-width': (sel === pt.id ? 3.8 : 2.5) * k, fill: color, tabindex: 0, role: 'button', 'aria-label': pt.label });
        c.addEventListener('mousemove', (e) => showTip(e, `<b>${esc(pt.label)}</b>${pt.tip || ''}`));
        c.addEventListener('mouseleave', hideTip);
        c.addEventListener('click', (e) => { e.stopPropagation(); o.selectedPoint = pt.id; o.selected = null; render(); o.onPointSelect && o.onPointSelect(pt); });
        svg.appendChild(c);
        if (o.pointLabels && !o.mini) svg.appendChild(s('text', { class: 'map-city-label', x: px(pt.lon) + 10 * k, y: py(pt.lat) + 4 * k, style: `font-size:${11 * k}px;font-weight:500;stroke-width:${3 * k}px` }, pt.short || pt.label));
      });

      wrap.replaceChildren(svg, tip);
      if (!o.mini) {
        const tools = h('div', { class: 'map-tools' },
          h('button', { type: 'button', onclick: () => { o.view = o.view === 'full' ? (o.focusCircle ? 'focus' : 'south') : 'full'; render(); } }, o.view === 'full' ? 'Zoom to agricultural area' : 'Show full province'),
          o.focusCircle && o.view !== 'focus' && o.view !== 'full' ? h('button', { type: 'button', onclick: () => { o.view = 'focus'; render(); } }, 'Zoom to ' + (o.focusCircle.name || 'place')) : null,
        );
        wrap.appendChild(tools);
        if (o.disclaimer) wrap.appendChild(h('div', { class: 'map-disclaimer' }, 'Simplified demonstration geometry'));
      }
      renderLegend();
    }

    function esc(t) { return String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
    function regionTip(id) {
      const name = M.ds.regionName(id);
      if (o.tooltip) return o.tooltip(id, name);
      if (!hasValues()) return `<b>${esc(name)}</b>Click for details`;
      const v = o.values[id];
      return `<b>${esc(name)}</b>${v == null ? 'No data' : esc(o.spec.label.split(' (')[0]) + ': ' + fmtVal(v)}`;
    }
    function fmtVal(v) {
      if (o.spec && o.spec.categories) return o.spec.categories[Math.round(v)] + ' (' + v + ')';
      return fmtNum(v, o.spec && o.spec.decimals) + (o.spec && o.spec.unit && o.spec.unit !== 'class' && o.spec.unit !== 'index' ? ' ' + o.spec.unit : '');
    }
    function showTip(e, html) {
      const r = wrap.getBoundingClientRect();
      tip.innerHTML = html;
      tip.style.left = Math.min(e.clientX - r.left + 14, r.width - 200) + 'px';
      tip.style.top = e.clientY - r.top + 14 + 'px';
      tip.classList.add('on');
    }
    function hideTip() { tip.classList.remove('on'); }
    function choose(id) {
      o.selected = id; o.selectedPoint = null; render();
      o.onSelect && o.onSelect(id, geo.regions.features.find((f) => f.properties.id === id));
    }

    function renderLegend() {
      legendEl.replaceChildren();
      if (!o.legend) return;
      if (hasValues()) {
        const sp = o.spec;
        if (sp.categories) {
          const row = h('div', { class: 'legend-cats' }, sp.categories.map((c, i) => h('span', null, h('i', { style: { background: colorFor(sp, i) } }), c)));
          legendEl.append(h('b', { style: { color: 'var(--ink)' } }, sp.label.split(' (')[0]), row);
        } else {
          legendEl.append(h('b', { style: { color: 'var(--ink)' } }, sp.label), h('span', null, fmtNum(sp.domain[0], sp.decimals)),
            h('div', { class: 'legend-bar', style: { background: gradientCss(sp) } }), h('span', null, fmtNum(sp.domain[1], sp.decimals) + (sp.unit && sp.unit !== 'index' ? ' ' + sp.unit : '')));
        }
        legendEl.append(h('span', null, h('i', { style: { display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: '#e6ebe9', marginRight: '5px', verticalAlign: '-2px' } }), 'No data'));
      }
      if (o.points.length && o.pointSpec) {
        const sp = o.pointSpec;
        legendEl.append(h('span', { class: 'sep', style: { width: '1px', height: '14px', background: 'var(--line)' } }),
          h('span', null, 'Points:'), h('b', { style: { color: 'var(--ink)' } }, (o.pointLabel || sp.label)), h('span', null, fmtNum(sp.domain[0], 0)),
          h('div', { class: 'legend-bar', style: { background: gradientCss(sp), width: '120px' } }), h('span', null, fmtNum(sp.domain[1], 0)));
      }
      if (o.focusCircle) legendEl.append(h('span', null, h('i', { style: { display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', border: '2px dashed var(--blue-700)', marginRight: '5px', verticalAlign: '-3px' } }), `${o.focusCircle.radius_km} km around ${o.focusCircle.name}`));
    }

    render();
    return {
      el,
      update(patch) { o = Object.assign(o, patch); render(); },
      select(id) { o.selected = id; o.selectedPoint = null; render(); },
      get options() { return o; },
    };
  }

  M.ui = M.ui || {};
  M.ui.manitobaMap = createMap;
  M.ui.mapGeometry = { px, py, ringPath };
})();
