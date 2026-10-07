/* Inline icon set (24x24, stroke-based) and the portal logo. No external assets. */
(function () {
  const M = (window.MADP = window.MADP || {});
  const P = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-right': '<path d="m9 6 6 6-6 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    pin: '<path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    waves: '<path d="M3 8c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 1 1 3 2M3 13c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 1 1 3 2M3 18c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 1 1 3 2"/>',
    thermo: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/>',
    seed: '<path d="M12 12V8"/><path d="M12 8c0-2.5-2-4-4.5-4C7.5 6.5 9.5 8 12 8z"/><path d="M12 9c0-2.5 2-4 4.5-4 0 2.5-2 4-4.5 4z"/><path d="M4 14h16c0 3.5-3.5 6-8 6s-8-2.5-8-6z"/>',
    sprout: '<path d="M12 21v-9"/><path d="M12 12c0-3.5-2.7-5.5-6-5.5 0 3.5 2.7 5.5 6 5.5z"/><path d="M12 14c0-3 2.4-5 5.5-5 0 3-2.4 5-5.5 5z"/>',
    wheat: '<path d="M12 22V8"/><path d="M12 8c-2 0-3.5-1.5-3.5-3.5C10.5 4.5 12 6 12 8zM12 8c2 0 3.5-1.5 3.5-3.5C13.5 4.5 12 6 12 8zM12 14c-2 0-3.5-1.5-3.5-3.5 2 0 3.5 1.5 3.5 3.5zM12 14c2 0 3.5-1.5 3.5-3.5-2 0-3.5 1.5-3.5 3.5zM12 20c-2 0-3.5-1.5-3.5-3.5 2 0 3.5 1.5 3.5 3.5zM12 20c2 0 3.5-1.5 3.5-3.5-2 0-3.5 1.5-3.5 3.5z"/>',
    drop: '<path d="M12 3s6.5 6.5 6.5 11a6.5 6.5 0 0 1-13 0C5.5 9.5 12 3 12 3z"/>',
    'drop-off': '<path d="M12 3s6.5 6.5 6.5 11a6.5 6.5 0 0 1-13 0C5.5 9.5 12 3 12 3z"/><path d="m4 4 16 16"/>',
    leaf: '<path d="M5 19c0-8 5-13 15-14 0 10-5 15-13 15"/><path d="M5 19c3-5 6-8 10-10"/>',
    database: '<ellipse cx="12" cy="5.5" rx="7.5" ry="3"/><path d="M4.5 5.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6M4.5 11.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6"/>',
    cap: '<path d="m2 9 10-5 10 5-10 5L2 9z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v6"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>',
    download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6L12 3z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    ruler: '<rect x="2.5" y="8" width="19" height="8" rx="1.5"/><path d="M6.5 8v3M10.5 8v4M14.5 8v3M18.5 8v4"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    sparkles: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"/><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z"/>',
    alert: '<path d="M12 4 3 20h18L12 4z"/><path d="M12 10v4.5M12 17.5h.01"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    filter: '<path d="M4 5h16l-6 7.5V19l-4 2v-8.5L4 5z"/>',
    table: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 10h17M3.5 15h17M10 4.5v15"/>',
    chart: '<path d="M4 20V5M4 20h16"/><path d="m7 15 4-4 3 3 5-6"/>',
    map: '<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    server: '<rect x="4" y="4" width="16" height="6" rx="1.5"/><rect x="4" y="14" width="16" height="6" rx="1.5"/><path d="M8 7h.01M8 17h.01"/>',
    'wifi-off': '<path d="M2 8.8a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 20h.01M3 3l18 18"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12h.01"/>',
    flask: '<path d="M9 3h6M10 3v6l-5.5 9.5A1.5 1.5 0 0 0 5.8 21h12.4a1.5 1.5 0 0 0 1.3-2.5L14 9V3"/><path d="M7.5 15h9"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-5.5 6.5-5.5s6.5 1.9 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2.1.6 3.5 2.2 3.5 5.2"/>',
    gauge: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="m12 17 4-5"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.5-4M4 4v4h4M4 13a8 8 0 0 0 14.5 4M20 20v-4h-4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  };
  function svg(name, cls) {
    return `<svg class="icon ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || P.info}</svg>`;
  }
  /** Brand mark: stylised Manitoba outline with leaf + data nodes. */
  function logoMark() {
    return `<svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M14 8h22l4 3h10l-2 6 6 10-4 8 2 9-8 6H20l-4-10-6-4 2-12-4-4z" fill="#eaf4fb" stroke="#1f6fa8" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M12 52c0-14 9-24 28-27-1 16-9 27-24 28" fill="#3d8a49"/>
      <path d="M16 51c6-9 12-14 22-22" stroke="#e8f3e7" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="40" cy="18" r="2.6" fill="#1f6fa8"/><circle cx="48" cy="30" r="2.6" fill="#1f6fa8"/><circle cx="30" cy="12" r="2.2" fill="#1f6fa8"/>
      <path d="M30 12l10 6 8 12" stroke="#1f6fa8" stroke-width="1.6" fill="none"/></svg>`;
  }
  M.icons = { svg, logoMark, names: Object.keys(P) };
})();
