/* Animated analysis workflow shown while an answer is prepared.
 * Steps are driven by real pipeline output (retrieval preview + the pending answer promise). */
(function () {
  const M = (window.MADP = window.MADP || {});
  const { h, icon, sleep } = M.u;

  const STEPS = [
    { title: 'Understanding your question', sub: 'Finding place, region, time period and topic', icon: 'search' },
    { title: 'Discovering datasets', sub: 'Searching the connected local, provincial, federal, research and global catalogue', icon: 'database' },
    { title: 'Harmonizing data', sub: 'Aligning formats, units, dates and region boundaries', icon: 'layers' },
    { title: 'Analyzing', sub: 'Computing statistics and trends from the harmonized tables', icon: 'chart' },
    { title: 'Preparing an interpretable answer', sub: 'Writing a plain-language explanation and verifying every number', icon: 'sparkles' },
  ];

  function workflowView(question) {
    const els = STEPS.map((st) => {
      const detail = h('div', { class: 'wf-detail' });
      const sub = h('p', null, st.sub);
      const dot = h('div', { class: 'wf-dot' }, icon(st.icon));
      const root = h('div', { class: 'wf-step' }, dot, h('div', { class: 'wf-body' }, h('h4', null, st.title), sub, detail));
      return { root, detail, sub, dot, st };
    });
    let skipped = false;
    const timer = h('div', { class: 'muted', style: { fontSize: '13px', marginTop: '10px', textAlign: 'center', minHeight: '18px' } });
    const skip = h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => { skipped = true; } }, 'Skip animation');
    const root = h('div', { class: 'card card-pad fade-in', style: { maxWidth: '860px', margin: '40px auto' } },
      h('div', { class: 'row', style: { justifyContent: 'space-between', marginBottom: '6px' } },
        h('div', null, h('div', { class: 'eyebrow' }, 'Ask the data, not the database'), h('h2', { style: { fontSize: '24px', marginTop: '4px' } }, '\u201c' + question + '\u201d')), skip),
      h('div', { class: 'workflow' }, els.map((e) => e.root)), timer);

    const chip = (t, cls) => h('span', { class: 'chip ' + (cls || 'outline') }, t);
    const act = (i) => els[i].root.classList.add('active');
    const done = (i) => { els[i].root.classList.remove('active'); els[i].root.classList.add('done'); els[i].dot.replaceChildren(icon('check')); };
    const wait = (ms) => (skipped ? Promise.resolve() : sleep(ms));

    async function run(preview, answerPromise) {
      const u = (preview && preview.understanding) || {};
      act(0); await wait(750);
      const chips0 = [chip('Intent: ' + (u.intent === 'catalogue' ? 'find datasets' : u.intent === 'catalogue_fallback' ? 'find datasets' : 'analyse data'), 'blue')];
      if (u.place) chips0.push(chip('Place: ' + u.place, 'green'));
      (u.region_ids || []).forEach((r) => chips0.push(chip('Region: ' + M.ds.regionName(r), 'green')));
      if (u.window_years) chips0.push(chip(`Time: last ${u.window_years} years`, 'amber'));
      (u.themes || []).forEach((t) => chips0.push(chip('Topic: ' + t)));
      els[0].detail.append(...chips0);
      await wait(600); done(0);

      act(1);
      const dsList = (preview && preview.datasets) || [];
      for (const d of dsList) { els[1].detail.append(chip(d.title, 'green')); await wait(260); }
      if (preview && preview.n_datasets > dsList.length) els[1].detail.append(chip(`+${preview.n_datasets - dsList.length} more`, 'outline'));
      await wait(500); done(1);

      act(2);
      const ev = (preview && preview.evidence) || [];
      els[2].detail.append(chip('Coordinates \u2192 WGS 84', 'outline'), chip('Dates \u2192 ISO 8601', 'outline'), chip('Units standardised', 'outline'), chip('Regions aligned', 'outline'));
      await wait(900); done(2);

      act(3);
      ev.forEach((e) => els[3].detail.append(chip(`${e.title}${e.kind === 'catalogue' ? '' : ' (' + e.n_rows + ' rows)'}`, 'blue')));
      await wait(1000); done(3);

      act(4);
      const t0 = Date.now();
      const tick = setInterval(() => {
        const s = Math.round((Date.now() - t0) / 1000);
        timer.textContent = s >= 3 ? `Local language model is writing the explanation\u2026 ${s}s` : '';
      }, 500);
      const env = await answerPromise;
      clearInterval(tick); timer.textContent = '';
      const mode = env.mode;
      els[4].detail.append(chip(mode === 'live' ? `Model: ${env.provider.model} (local)` : mode === 'demo' ? 'Pre-generated explanation' : mode === 'evidence_only' ? 'Template explanation' : 'No match', mode === 'live' ? 'green' : 'amber'));
      if (env.verification && env.verification.numbers_checked) els[4].detail.append(chip(`${env.verification.numbers_checked} numbers verified`, 'green'));
      await wait(900); done(4);
      await wait(350);
      return env;
    }
    return { el: root, run };
  }

  M.ui = M.ui || {};
  M.ui.workflowView = workflowView;
})();
