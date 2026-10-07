/* Lightweight SVG charts (no libraries, offline). All return DOM nodes. */
(function () {
  const M = (window.MADP = window.MADP || {});
  const { h, s, fmtNum, shortDate, clamp } = M.u;

  function niceScale(min, max, n = 5) {
    if (min === max) { min -= 1; max += 1; }
    const span = max - min, raw = span / n;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((st) => st >= raw) || raw;
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(10));
    return { lo, hi, ticks, step };
  }
  const decs = (step) => (step >= 1 ? 0 : Math.min(3, Math.ceil(-Math.log10(step))));

  /** series: [{key,label,color,values:[{x,y}]}]; xType 'date' | 'year' */
  function lineChart(opts) {
    const { series, xType = 'date', unit = '', height = 280, decimals, zeroLine = true, area = true, title } = opts;
    const W = 680, H = height, m = { l: 54, r: 18, t: 16, b: 32 };
    const hidden = new Set();
    const root = h('div', { class: 'chart', style: { position: 'relative' } });
    const tip = h('div', { class: 'chart-tip' });
    const toggles = h('div', { class: 'series-toggles' });
    const holder = h('div');
    root.append(series.length > 1 ? toggles : null, holder, tip);
    const xs = series[0].values.map((v) => v.x);
    const xnum = (x) => (xType === 'date' ? new Date(x + 'T12:00:00').getTime() : +x);
    const x0 = xnum(xs[0]), x1 = xnum(xs[xs.length - 1]);
    const fx = (x) => m.l + ((xnum(x) - x0) / (x1 - x0 || 1)) * (W - m.l - m.r);

    function draw() {
      const vis = series.filter((sr) => !hidden.has(sr.key));
      const all = vis.flatMap((sr) => sr.values.map((v) => v.y));
      const ext = all.length ? [Math.min(...all), Math.max(...all)] : [0, 1];
      const sc = niceScale(zeroLine && ext[0] > 0 && ext[0] < ext[1] * 0.5 ? 0 : ext[0], ext[1]);
      const fy = (y) => H - m.b - ((y - sc.lo) / (sc.hi - sc.lo)) * (H - m.t - m.b);
      const dd = decimals != null ? decimals : decs(sc.step);
      const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': title || 'Line chart' });
      const g = s('g', { class: 'grid' }), ax = s('g', { class: 'axis' });
      sc.ticks.forEach((t) => {
        g.appendChild(s('line', { x1: m.l, x2: W - m.r, y1: fy(t), y2: fy(t) }));
        ax.appendChild(s('text', { x: m.l - 8, y: fy(t) + 4, 'text-anchor': 'end' }, fmtNum(t, dd)));
      });
      const nTicks = Math.min(xs.length, xType === 'year' ? xs.length : 6);
      for (let i = 0; i < nTicks; i++) {
        const idx = Math.round((i * (xs.length - 1)) / (nTicks - 1 || 1));
        ax.appendChild(s('text', { x: fx(xs[idx]), y: H - 8, 'text-anchor': i === 0 ? 'start' : i === nTicks - 1 ? 'end' : 'middle' }, xType === 'date' ? shortDate(xs[idx]) : xs[idx]));
      }
      svg.append(g, ax);
      if (sc.lo < 0 && sc.hi > 0) svg.appendChild(s('line', { class: 'zero', x1: m.l, x2: W - m.r, y1: fy(0), y2: fy(0) }));
      if (unit) svg.appendChild(s('text', { x: m.l, y: 10, style: 'font-size:11px;fill:#6b7b8a;font-weight:600' }, unit));

      vis.forEach((sr) => {
        const pts = sr.values.map((v) => [fx(v.x), fy(v.y)]);
        const d = 'M' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L');
        if (area && vis.length <= 2) svg.appendChild(s('path', { class: 'area', d: d + `L${pts[pts.length - 1][0]},${fy(Math.max(sc.lo, Math.min(0, sc.hi)))}L${pts[0][0]},${fy(Math.max(sc.lo, Math.min(0, sc.hi)))}Z`, fill: sr.color }));
        const p = s('path', { class: 'line', d, stroke: sr.color, pathLength: 1 });
        p.style.strokeDasharray = 1; p.style.strokeDashoffset = 1;
        svg.appendChild(p);
        requestAnimationFrame(() => { p.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.3,.7,.2,1)'; p.style.strokeDashoffset = 0; });
        const last = pts[pts.length - 1];
        svg.appendChild(s('circle', { class: 'dot', cx: last[0], cy: last[1], r: 5, fill: sr.color }));
        if (xs.length <= 12) pts.forEach((pt) => svg.appendChild(s('circle', { class: 'dot', cx: pt[0], cy: pt[1], r: 3.5, fill: sr.color })));
      });

      const cross = s('line', { y1: m.t, y2: H - m.b, stroke: '#5a6a7a', 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0 });
      svg.appendChild(cross);
      const overlay = s('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: 'transparent' });
      overlay.addEventListener('mousemove', (e) => {
        const r = svg.getBoundingClientRect(), scale = W / r.width;
        const mx = (e.clientX - r.left) * scale;
        let idx = 0, best = 1e9;
        xs.forEach((x, i) => { const dxx = Math.abs(fx(x) - mx); if (dxx < best) { best = dxx; idx = i; } });
        cross.setAttribute('x1', fx(xs[idx])); cross.setAttribute('x2', fx(xs[idx])); cross.setAttribute('opacity', 1);
        const label = xType === 'date' ? M.u.fmtDate(xs[idx]) : xs[idx];
        tip.innerHTML = `<b>${label}</b><br>` + vis.map((sr) => `<i style="background:${sr.color}"></i>${sr.label}: <b>${fmtNum(sr.values[idx].y, dd)}</b>`).join('<br>');
        tip.classList.add('on');
        const tx = (fx(xs[idx]) / scale) + 14;
        tip.style.left = Math.min(tx, r.width - tip.offsetWidth - 4) + 'px';
        tip.style.top = (toggles.offsetHeight ? toggles.offsetHeight + 8 : 0) + 20 + 'px';
      });
      overlay.addEventListener('mouseleave', () => { tip.classList.remove('on'); cross.setAttribute('opacity', 0); });
      svg.appendChild(overlay);
      holder.replaceChildren(svg);
    }
    series.forEach((sr) => {
      toggles.appendChild(h('button', { type: 'button', class: 'series-toggle' + (sr.off ? ' off' : ''), 'aria-pressed': String(!sr.off), onclick: (e) => {
        const b = e.currentTarget;
        if (hidden.has(sr.key)) { hidden.delete(sr.key); b.classList.remove('off'); } else if (hidden.size < series.length - 1) { hidden.add(sr.key); b.classList.add('off'); }
        draw();
      } }, h('i', { style: { background: sr.color } }), sr.label));
      if (sr.off) hidden.add(sr.key);
    });
    draw();
    return root;
  }

  /** Stacked area for land-cover classes. */
  function stackedArea(opts) {
    const { series, unit = '', height = 280, xType = 'year' } = opts;
    const W = 680, H = height, m = { l: 62, r: 18, t: 16, b: 32 };
    const xs = series[0].values.map((v) => v.x);
    const totals = xs.map((_, i) => series.reduce((a, sr) => a + sr.values[i].y, 0));
    const sc = niceScale(0, Math.max(...totals));
    const fx = (i) => m.l + (i / (xs.length - 1)) * (W - m.l - m.r);
    const fy = (y) => H - m.b - ((y - sc.lo) / (sc.hi - sc.lo)) * (H - m.t - m.b);
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}` });
    const g = s('g', { class: 'grid' }), ax = s('g', { class: 'axis' });
    sc.ticks.forEach((t) => { g.appendChild(s('line', { x1: m.l, x2: W - m.r, y1: fy(t), y2: fy(t) })); ax.appendChild(s('text', { x: m.l - 8, y: fy(t) + 4, 'text-anchor': 'end' }, fmtNum(t, 0))); });
    xs.forEach((x, i) => { if (i % Math.ceil(xs.length / 8) === 0 || i === xs.length - 1) ax.appendChild(s('text', { x: fx(i), y: H - 8, 'text-anchor': 'middle' }, x)); });
    svg.append(g, ax);
    const base = xs.map(() => 0);
    series.forEach((sr) => {
      const top = sr.values.map((v, i) => base[i] + v.y);
      const d = 'M' + top.map((t, i) => fx(i) + ',' + fy(t)).join('L') + 'L' + base.map((b, i) => fx(xs.length - 1 - i) + ',' + fy(base[xs.length - 1 - i])).join('L') + 'Z';
      svg.appendChild(s('path', { d, fill: sr.color, opacity: 0.85, stroke: '#fff', 'stroke-width': 1.2 }));
      top.forEach((t, i) => (base[i] = t));
    });
    svg.appendChild(s('text', { x: m.l, y: 10, style: 'font-size:11px;fill:#6b7b8a;font-weight:600' }, unit));
    const legend = h('div', { class: 'series-toggles', style: { marginTop: '8px' } }, series.map((sr) => h('span', { class: 'series-toggle' }, h('i', { style: { background: sr.color } }), sr.label)));
    return h('div', { class: 'chart' }, svg, legend);
  }

  /** Horizontal bars. items: [{label,value,color,highlight,note}] */
  function barChart(opts) {
    const { items, unit = '', decimals, domain, valueFmt, onClick, selected } = opts;
    const rowH = 34, W = 680, labelW = 150, valW = 70;
    const H = items.length * rowH + 26;
    const vals = items.map((i) => i.value);
    const lo = domain ? domain[0] : Math.min(0, ...vals), hi = domain ? domain[1] : Math.max(0, ...vals);
    const x0 = labelW, x1 = W - valW;
    const fx = (v) => x0 + ((v - lo) / (hi - lo || 1)) * (x1 - x0);
    const zero = fx(clamp(0, lo, hi));
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' });
    const tip = h('div', { class: 'chart-tip' });
    const root = h('div', { class: 'chart', style: { position: 'relative' } }, svg, tip);
    svg.appendChild(s('line', { class: 'zero', x1: zero, x2: zero, y1: 4, y2: H - 18 }));
    items.forEach((it, i) => {
      const y = 8 + i * rowH;
      const a = Math.min(zero, fx(it.value)), w = Math.max(2, Math.abs(fx(it.value) - zero));
      const g = s('g', { style: onClick ? 'cursor:pointer' : '' });
      g.appendChild(s('text', { class: 'bar-label', x: labelW - 10, y: y + 18, 'text-anchor': 'end', style: it.highlight ? 'font-weight:700' : '' }, it.label));
      g.appendChild(s('rect', { x: x0, y, width: x1 - x0, height: 24, rx: 6, fill: '#f1f5f7' }));
      const bar = s('rect', { class: 'bar', x: zero, y, width: 0, height: 24, rx: 6, fill: it.color || '#2f6b3a', stroke: selected === it.id ? '#0f2744' : 'none', 'stroke-width': 2.5 });
      g.appendChild(bar);
      requestAnimationFrame(() => { bar.style.transition = `all .8s ${i * 50}ms cubic-bezier(.2,.8,.2,1)`; bar.setAttribute('x', a); bar.setAttribute('width', w); });
      const txt = valueFmt ? valueFmt(it.value) : fmtNum(it.value, decimals);
      g.appendChild(s('text', { class: 'bar-value', x: W - valW + 10, y: y + 17 }, txt));
      g.addEventListener('mousemove', (e) => {
        const r = root.getBoundingClientRect();
        tip.innerHTML = `<b>${it.label}</b><br>${txt}${unit && !valueFmt ? ' ' + unit : ''}${it.note ? '<br>' + it.note : ''}`;
        tip.style.left = e.clientX - r.left + 12 + 'px'; tip.style.top = e.clientY - r.top + 12 + 'px'; tip.classList.add('on');
      });
      g.addEventListener('mouseleave', () => tip.classList.remove('on'));
      if (onClick) g.addEventListener('click', () => onClick(it));
      svg.appendChild(g);
    });
    if (unit) svg.appendChild(s('text', { x: x0, y: H - 4, style: 'font-size:11px;fill:#6b7b8a;font-weight:600' }, unit));
    return root;
  }

  function sparkline(values, opts = {}) {
    const { color = '#2f6b3a', w = 120, hgt = 36 } = opts;
    const min = Math.min(...values), max = Math.max(...values), pad = 3;
    const fx = (i) => pad + (i / (values.length - 1 || 1)) * (w - pad * 2);
    const fy = (v) => hgt - pad - ((v - min) / (max - min || 1)) * (hgt - pad * 2);
    const d = 'M' + values.map((v, i) => fx(i).toFixed(1) + ',' + fy(v).toFixed(1)).join('L');
    return s('svg', { viewBox: `0 0 ${w} ${hgt}`, width: w, height: hgt, style: 'overflow:visible' },
      s('path', { d: d + `L${fx(values.length - 1)},${hgt}L${fx(0)},${hgt}Z`, fill: color, opacity: 0.12 }),
      s('path', { d, fill: 'none', stroke: color, 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      s('circle', { cx: fx(values.length - 1), cy: fy(values[values.length - 1]), r: 3.4, fill: color, stroke: '#fff', 'stroke-width': 1.5 }));
  }

  M.ui = M.ui || {};
  Object.assign(M.ui, { lineChart, barChart, stackedArea, sparkline });
})();
