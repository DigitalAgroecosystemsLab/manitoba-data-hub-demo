/* Data service: the ONLY place the UI reads demonstration data from (window.MADP.data).
 * To connect real APIs later, re-implement these functions to fetch() from services; UI code stays unchanged. */
(function () {
  const M = (window.MADP = window.MADP || {});
  const D = M.data;

  const orgById = Object.fromEntries(D.organizations.map((o) => [o.id, o]));
  const byId = Object.fromEntries(D.datasets.map((d) => [d.id, d]));
  const tableMeta = Object.fromEntries(D.tables_meta.map((t) => [t.id, t]));

  const LAYERS = {
    'MB Core Data': { key: 'mb', label: 'MB Core Data', color: '#2f6b3a', soft: '#e8f3e7', icon: 'database', tag: 'Authoritative provincial datasets.' },
    'UM Research': { key: 'um', label: 'UM Research', color: '#1f6fa8', soft: '#e5f1fa', icon: 'cap', tag: 'University datasets, projects, models and research outputs.' },
    'Connected DataHub': { key: 'datahub', label: 'Connected DataHub', color: '#55a65f', soft: '#eef7ec', icon: 'share', tag: 'Federal, industry, partner, satellite and global datasets.' },
  };
  const layerByKey = Object.fromEntries(Object.values(LAYERS).map((l) => [l.key, l]));

  const THEMES = [
    { id: 'Soil', icon: 'seed' }, { id: 'Crops', icon: 'sprout' }, { id: 'Climate', icon: 'thermo' }, { id: 'Water', icon: 'drop' },
    { id: 'Land Use', icon: 'grid' }, { id: 'Grasslands', icon: 'wheat' }, { id: 'Biodiversity', icon: 'leaf' }, { id: 'Remote Sensing', icon: 'globe' },
  ];
  const REGIONS = [
    ['westman', 'Westman'], ['pembina', 'Pembina Valley'], ['central', 'Central Plains'], ['rrv', 'Red River Valley'],
    ['eastern', 'Eastern'], ['interlake', 'Interlake'], ['parkland', 'Parkland'], ['northern', 'Northern Manitoba'],
  ];

  const FAIR = {
    findable: {
      letter: 'F', name: 'Findable',
      meaning: 'Data and metadata are easy to find for both people and computers.',
      how: 'Every dataset has a unique identifier (DOI placeholder), rich descriptive metadata and is indexed in the searchable portal catalogue and in answers.',
    },
    accessible: {
      letter: 'A', name: 'Accessible',
      meaning: 'Once found, users know how the data can be accessed, including any authentication or request process.',
      how: 'Metadata is always open. Access type (Open, Partner, Restricted) and the access protocol are stated on every dataset card.',
    },
    interoperable: {
      letter: 'I', name: 'Interoperable',
      meaning: 'Data use shared formats, vocabularies and coordinate systems so different sources can be combined.',
      how: 'Standard formats and declared coordinate systems are recorded, and the Integration & Harmonization layer aligns units, dates and regions.',
    },
    reusable: {
      letter: 'R', name: 'Reusable',
      meaning: 'Data have clear licences and provenance so they can be reused with confidence.',
      how: 'Licence, version, owner and processing history are recorded, and every answer carries a "How was this answer generated?" provenance record.',
    },
  };

  const REQUIRED_META = ['title', 'organization', 'description', 'licence', 'geographic_coverage', 'time_coverage', 'spatial_resolution', 'format', 'coordinate_system', 'update_frequency', 'doi', 'api_url', 'processing_history', 'version'];
  function completeness(d) {
    const filled = REQUIRED_META.filter((k) => {
      const v = d[k];
      return Array.isArray(v) ? v.length : v && (typeof v !== 'object' || Object.keys(v).length);
    });
    return { filled: filled.length, total: REQUIRED_META.length, pct: Math.round((filled.length / REQUIRED_META.length) * 100) };
  }

  const orgColor = (d) => (orgById[d.org_id] ? orgById[d.org_id].color : '#2f6b3a');
  const regionName = (id) => D.region_names[id] || id;
  const coverageText = (d) => `${d.time_coverage.start}\u2013${d.time_coverage.end}`;

  function regionValues(tableId, field) {
    const meta = tableMeta[tableId];
    const out = {};
    for (const r of D.table_rows[tableId] || []) out[r[meta.key]] = r[field];
    return out;
  }
  function fieldSpec(tableId, field) { return (tableMeta[tableId].fields || []).find((f) => f.name === field); }

  /** All regional tables with at least one mappable field: used by the Maps page. */
  function mapLayers() {
    const out = [];
    for (const t of D.tables_meta) {
      if (t.kind !== 'regional') continue;
      for (const f of t.fields) if (f.map) out.push({ id: t.id + ':' + f.name, table: t, field: f, dataset: byId[t.dataset_id] });
    }
    return out;
  }
  const THEME_OF_TABLE = {
    drought_regional: 'Water & drought', crop_stress_regional: 'Crops', grassland_change_regional: 'Land & grasslands', landuse_change_regional: 'Land & grasslands',
    soil_health_regional: 'Soils', flood_risk_regional: 'Water & drought', climate_risk_regional: 'Climate',
  };

  function exportMetadata(d) {
    return JSON.stringify({ '@context': 'https://schema.org', '@type': 'Dataset', name: d.title, description: d.description, creator: d.organization, license: d.licence,
      spatialCoverage: d.geographic_coverage, temporalCoverage: `${d.time_coverage.start}/${d.time_coverage.end}`, encodingFormat: d.format, version: d.version,
      identifier: d.doi, url: d.source_url, dateModified: d.last_updated, keywords: d.keywords, accessType: d.access_type, spatialResolution: d.spatial_resolution,
      coordinateSystem: d.coordinate_system, updateFrequency: d.update_frequency, processingHistory: d.processing_history,
      note: 'DEMONSTRATION METADATA - identifiers and URLs are placeholders' }, null, 2);
  }

  M.ds = { D, orgById, byId, tableMeta, LAYERS, layerByKey, THEMES, REGIONS, FAIR, completeness, orgColor, regionName, coverageText, regionValues, fieldSpec, mapLayers, THEME_OF_TABLE, exportMetadata };
})();
