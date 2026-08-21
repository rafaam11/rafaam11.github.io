const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const childProcess = require('node:child_process');

const root = path.join(__dirname, '..');
const dataPath = path.join(root, 'js', 'portfolio-data.js');
const rendererPath = path.join(root, 'js', 'portfolio-render.js');
const data = require('../js/portfolio-data.js');
const render = require('../js/portfolio-render.js');
const i18n = require('../js/site-i18n.js');
const nav = require('../js/nav.js');
const validator = require('../scripts/validate-portfolio.cjs');
const pdfSource = require('../scripts/portfolio-pdf-source.cjs');

const slugs = [
  'surgical-navigation',
  'mandibular-fracture',
  'life-careverse',
  'rtms-navigation',
  'respiratory-surface-guidance',
  'skadi-tracking-software',
  'unmanned-forklift',
  'ai-build-lab'
];
const capabilityKeys = [
  'registration',
  'sensor-fusion',
  'medical-navigation',
  'xr-engineering',
  'ai-product-engineering'
];
const tierKeys = ['medical-core', 'platform', 'industrial-spotlight', 'ai-build-lab'];
const validPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');

function fixtureCrc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, payload) {
  const typeBytes = Buffer.from(type, 'ascii');
  const result = Buffer.alloc(12 + payload.length);
  result.writeUInt32BE(payload.length, 0);
  typeBytes.copy(result, 4);
  payload.copy(result, 8);
  result.writeUInt32BE(fixtureCrc32(Buffer.concat([typeBytes, payload])), 8 + payload.length);
  return result;
}

function pngWithMetadata(type, payload) {
  const afterHeader = 8 + 12 + 13;
  return Buffer.concat([validPng.subarray(0, afterHeader), pngChunk(type, payload), validPng.subarray(afterHeader)]);
}

function mp4Box(type, payload = Buffer.alloc(0)) {
  const result = Buffer.alloc(8 + payload.length);
  result.writeUInt32BE(result.length, 0);
  result.write(type, 4, 4, 'latin1');
  payload.copy(result, 8);
  return result;
}

function validMp4({ durationSeconds = 20, extraMoovBoxes = [], mdatPayload = Buffer.from([0]) } = {}) {
  const ftyp = mp4Box('ftyp', Buffer.concat([
    Buffer.from('isom', 'ascii'), Buffer.alloc(4), Buffer.from('isommp42', 'ascii')
  ]));
  const mvhdPayload = Buffer.alloc(100);
  mvhdPayload.writeUInt32BE(1000, 12);
  mvhdPayload.writeUInt32BE(Math.round(durationSeconds * 1000), 16);
  const hdlrPayload = Buffer.alloc(24);
  hdlrPayload.write('vide', 8, 4, 'ascii');
  const track = mp4Box('trak', mp4Box('mdia', mp4Box('hdlr', hdlrPayload)));
  const moov = mp4Box('moov', Buffer.concat([mp4Box('mvhd', mvhdPayload), track, ...extraMoovBoxes]));
  return Buffer.concat([ftyp, moov, mp4Box('mdat', mdatPayload)]);
}
const excludedProjectSlugs = [
  'ar-distance-meter',
  'c-arm-navigation',
  'llm-wiki',
  'oral-facial-ar',
  'orthognathic-ar',
  'quadruped-robot',
  'radioactive-digital-twin',
  'surgical-twin'
];
const standaloneLegacyFiles = [
  'js/scripts.js',
  'js/spatial-signal.js',
  'css/styles.css',
  'css/cv-theme.css',
  'css/spatial-signal.css'
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function count(haystack, needle) {
  return (haystack.match(new RegExp(needle, 'g')) || []).length;
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function pdfPageCount(filePath) {
  const bytes = fs.readFileSync(filePath);
  return (bytes.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
}

function task5Python() {
  return process.env.PORTFOLIO_PDF_PYTHON || path.join(
    root,
    '.superpowers', 'sdd', '2026-08-16-3d-registration-partner-portfolio',
    '.venv-pdf', 'Scripts', 'python.exe'
  );
}

function treeFileHashes(directory) {
  const hashes = {};
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) visit(absolute);
      if (entry.isFile()) hashes[path.relative(directory, absolute).replace(/\\/g, '/')] = sha256(absolute);
    }
  };
  visit(directory);
  return hashes;
}

function copyApprovedEvidence(targetRoot) {
  // The generator embeds approved local evidence, so a temporary publish root needs the real derivatives.
  const projectsRoot = path.join(root, 'assets', 'projects');
  for (const slug of fs.readdirSync(projectsRoot)) {
    const source = path.join(projectsRoot, slug);
    if (!fs.statSync(source).isDirectory()) continue;
    for (const name of fs.readdirSync(source).filter((entry) => /\.(?:png|mp4)$/i.test(entry))) {
      const target = path.join(targetRoot, 'assets', 'projects', slug, name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(source, name), target);
    }
  }
}

function copyTask5Surface(targetRoot) {
  for (const relativePath of ['output/pdf', 'assets/pdfs', 'assets/cv']) {
    fs.cpSync(path.join(root, relativePath), path.join(targetRoot, relativePath), { recursive: true });
  }
  copyApprovedEvidence(targetRoot);
  for (const relativePath of [
    'data/public-cv.json',
    'assets/projects/EVIDENCE_REGISTER.md',
    'cv/index.html',
    'en/cv/index.html',
    'scripts/generate-portfolio-pdfs.py'
  ]) {
    const target = path.join(targetRoot, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, relativePath), target);
  }
}

function copyCvSummarySurface(targetRoot) {
  for (const relativePath of ['data/public-cv.json', 'cv/index.html', 'en/cv/index.html']) {
    const target = path.join(targetRoot, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, relativePath), target);
  }
}

function copyTask6Surface(targetRoot) {
  for (const file of canonicalPages()) {
    const target = path.join(targetRoot, file.relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(file.absolutePath, target);
  }
  for (const relativePath of [
    'assets/projects',
    'assets/pdfs',
    'assets/cv',
    'output/pdf'
  ]) {
    fs.cpSync(path.join(root, relativePath), path.join(targetRoot, relativePath), { recursive: true });
  }
  if (fs.existsSync(path.join(root, 'assets', 'diagrams'))) {
    fs.cpSync(path.join(root, 'assets', 'diagrams'), path.join(targetRoot, 'assets', 'diagrams'), { recursive: true });
  }
  for (const relativePath of [
    'data/public-cv.json',
    'assets/img/favicon.ico',
    'assets/img/profile_square.webp',
    'css/site.css',
    'css/scholar.css',
    'css/cv-pdf.css',
    'js/site-i18n.js',
    'js/portfolio-data.js',
    'js/portfolio-render.js',
    'js/nav.js',
    'scripts/generate-portfolio-pdfs.py'
  ]) {
    const target = path.join(targetRoot, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, relativePath), target);
  }

  // Task 6 fixtures isolate page contracts from the intentionally stale published PDF digest.
  const register = validator.readEvidenceRegister(targetRoot);
  assert.deepEqual(register.errors, []);
  const evidence = register.entries.map((entry) => ({
    id: entry.id,
    project: entry.project,
    type: entry.type,
    state: entry.state,
    source: entry.source,
    note: entry.note
  }));
  const cv = JSON.parse(fs.readFileSync(path.join(targetRoot, 'data', 'public-cv.json'), 'utf8'));
  const manifestPath = path.join(targetRoot, 'output', 'pdf', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.sourceDigest = pdfSource.pdfSourceDigest(pdfSource.canonicalPdfSource(data, evidence, cv));
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function trackedFiles(pathspec) {
  const result = childProcess.spawnSync('git', ['-c', 'core.quotePath=false', 'ls-files', '-z', '--', pathspec], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.split('\0')
    .filter(Boolean)
    .map((item) => item.replace(/\\/g, '/'))
    .filter((item) => fs.existsSync(path.join(root, ...item.split('/'))))
    .sort();
}

function cvSummaryTransactionArtifacts(targetRoot) {
  return ['cv', path.join('en', 'cv')].flatMap((relativeDirectory) => {
    const directory = path.join(targetRoot, relativeDirectory);
    return fs.readdirSync(directory)
      .filter((name) => name.includes('.public-cv-summary-'))
      .map((name) => path.join(relativeDirectory, name));
  });
}

function assertInOrder(haystack, values, label) {
  let previous = -1;
  for (const value of values) {
    const current = haystack.indexOf(value);
    assert.ok(current > previous, `${label}: ${value} is missing or out of order`);
    previous = current;
  }
}

function canonicalPages() {
  return validator.publicPortfolioFiles(root);
}

function evidenceRegisterText(entries) {
  return [
    '# Public Evidence Register',
    '',
    '| Evidence ID | Project | Media type | State | Public source | Provenance / usage |',
    '| --- | --- | --- | --- | --- | --- |',
    ...entries.map((entry) => `| ${entry.id} | ${entry.project} | ${entry.type} | ${entry.state} | ${entry.source === undefined ? '-' : entry.source} | ${entry.note || 'Public-safe test evidence.'} |`),
    ''
  ].join('\n');
}

function mirrorApprovedAssets(temporaryRoot, registerText) {
  // Copy the real derivative for every approved-public row the synthetic register still points at,
  // so a fixture starts from the repository's clean baseline instead of dozens of missing-asset errors.
  const rowPattern = /^\| [a-z0-9-]+ \| [a-z0-9-]+ \| [a-z]+ \| approved-public \| (assets\/projects\/[a-z0-9-]+\/[a-z0-9.-]+) \|/gm;
  for (const match of registerText.matchAll(rowPattern)) {
    const source = path.join(root, match[1]);
    if (!fs.existsSync(source)) continue;
    const target = path.join(temporaryRoot, match[1]);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
}

function withEvidenceRoot(registerText, callback) {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-evidence-'));
  try {
    const registerPath = path.join(temporaryRoot, 'assets', 'projects', 'EVIDENCE_REGISTER.md');
    fs.mkdirSync(path.dirname(registerPath), { recursive: true });
    fs.writeFileSync(registerPath, registerText);
    mirrorApprovedAssets(temporaryRoot, registerText);
    return callback(temporaryRoot);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function seedEvidenceReadmes(temporaryRoot, body = 'Patient data excluded. Public-safe derivative boundary.') {
  for (const slug of slugs) {
    const projectDirectory = path.join(temporaryRoot, 'assets', 'projects', slug);
    fs.mkdirSync(projectDirectory, { recursive: true });
    fs.writeFileSync(path.join(projectDirectory, 'README.md'), body);
  }
}

function cssRuleBodies(css, selector) {
  return [...css.matchAll(/(?:^|})\s*([^@}{][^{]+)\{([^{}]*)\}/gm)]
    .filter((match) => match[1].split(',').some((candidate) => candidate.trim() === selector))
    .map((match) => match[2]);
}

function cssAtRuleBodies(css, atRule) {
  const flags = atRule.flags.includes('g') ? atRule.flags : atRule.flags + 'g';
  const pattern = new RegExp(atRule.source, flags);
  const bodies = [];
  for (let match = pattern.exec(css); match; match = pattern.exec(css)) {
    const openingBrace = css.indexOf('{', match.index);
    let depth = 0;
    for (let index = openingBrace; index < css.length; index++) {
      if (css[index] === '{') depth++;
      if (css[index] === '}' && --depth === 0) {
        bodies.push(css.slice(openingBrace + 1, index));
        break;
      }
    }
  }
  return bodies;
}

test('canonical data preserves the browser/CommonJS boundary and exact ordered portfolio', () => {
  const browser = {};
  vm.runInNewContext(fs.readFileSync(dataPath, 'utf8'), browser);
  assert.deepEqual(Array.from(browser.PortfolioData.projects, (project) => project.slug), slugs);
  assert.deepEqual(data.projects.map((project) => project.slug), slugs);
  assert.deepEqual(data.capabilities.map((capability) => capability.key), capabilityKeys);
  assert.deepEqual(data.tiers.map((tier) => tier.key), tierKeys);
  assert.deepEqual(data.impactMetrics, []);
});

test('canonical records retain localized evidence, attribution, media, blocks, and stable PDFs', () => {
  const required = [
    'title', 'shortTitle', 'eyebrow', 'thesis', 'summary', 'problem', 'role',
    'teamResult', 'evidence', 'limitation', 'collaboration', 'mediaAlt', 'mediaCaption'
  ];
  const blockTypes = new Set(['text', 'list', 'system', 'evidence', 'limitation']);
  for (const project of data.projects) {
    assert.equal(project.route, `projects/${project.slug}/`);
    assert.deepEqual(project.pdf, {
      ko: `assets/pdfs/${project.slug}-ko.pdf`,
      en: `assets/pdfs/${project.slug}-en.pdf`
    });
    assert.ok(project.capabilityKeys.every((key) => capabilityKeys.includes(key)));
    assert.ok(project.media && project.media.lead);
    assert.ok(project.blocks.length > 0);
    for (const locale of ['ko', 'en']) {
      for (const field of required) assert.ok(project.translations[locale][field], `${project.slug}: missing ${locale}.${field}`);
      assert.notEqual(project.translations[locale].role, project.translations[locale].teamResult);
    }
    for (const block of project.blocks) {
      assert.ok(blockTypes.has(block.type), `${project.slug}: unsupported ${block.type}`);
      for (const locale of ['ko', 'en']) {
        const copy = block.translations[locale];
        assert.ok(copy.heading);
        if (block.type === 'list') assert.ok(Array.isArray(copy.items) && copy.items.length > 0);
        else assert.ok(copy.body);
      }
    }
  }
  assert.deepEqual(data.projects.at(-1).subcases.map((item) => item.key), ['llm-wiki', 'multi-cli-work', 'daegu-bus']);
});

test('pending evidence remains pathless and approved evidence uses safe public paths', () => {
  for (const project of data.projects) {
    const lead = project.media.lead;
    if (lead.status === 'pending-approval') assert.equal(Object.hasOwn(lead, 'publicPath'), false);
    if (lead.status === 'approved') assert.equal(validator.portfolioDataErrors(data).length, 0);
  }
  const unsafePaths = [
    'C:/private/raw/demo.png',
    'C:\\private\\raw\\demo.png',
    '\\\\server\\share\\demo.png',
    '/assets/projects/demo.png',
    '../private/raw/demo.png',
    'assets/projects/../private/raw/demo.png',
    'assets/%2e%2e/private/raw/demo.png',
    'assets/%252e%252e/private/raw/demo.png',
    'assets/projects%2f..%2fprivate/raw/demo.png',
    'assets/private/raw/demo.png',
    'assets/projects/private-demo.png',
    'assets/projects/raw-export.png',
    'file:///C:/private/raw/demo.png',
    'javascript:alert(1)',
    'data:text/plain,private'
  ];
  for (const publicPath of unsafePaths) {
    const candidate = clone(data);
    candidate.projects.at(-1).media.lead.publicPath = publicPath;
    assert.match(validator.portfolioDataErrors(candidate).join(' '), /unsafe public path/i);
  }
});

test('Task 4 public evidence register covers every canonical media id without private provenance', () => {
  const register = validator.readEvidenceRegister(root);
  assert.deepEqual(register.errors, []);
  assert.equal(register.entries.length, 32);
  assert.deepEqual(
    Object.fromEntries(['pending-review', 'approved-public', 'excluded'].map((state) => [
      state,
      register.entries.filter((entry) => entry.state === state).length
    ])),
    { 'pending-review': 4, 'approved-public': 28, excluded: 0 }
  );
  assert.deepEqual(validator.evidenceRegistryErrors(data, root), []);

  for (const slug of slugs) {
    const readme = path.join(root, 'assets', 'projects', slug, 'README.md');
    assert.equal(fs.existsSync(readme), true, `${slug}: missing public-safe evidence README`);
  }

  const serialized = fs.readFileSync(path.join(root, 'assets', 'projects', 'EVIDENCE_REGISTER.md'), 'utf8');
  assert.doesNotMatch(serialized, /(?:(?:^|[\s(])(?:[A-Za-z]:[\\/]|\\\\)|file:\/\/|OneDrive|Teams|private[\\/]raw|\b(?:CT|MRI|patient)\b)/i);
  const aiEvidence = register.entries.filter((entry) => entry.project === 'ai-build-lab');
  assert.deepEqual(aiEvidence.map((entry) => [entry.id, entry.type, entry.state, entry.source]), [
    ['multi-cli-work-repository', 'repository', 'approved-public', 'https://github.com/rafaam11/multi-cli-work'],
    ['daegu-bus-repository', 'repository', 'approved-public', 'https://github.com/rafaam11/public-transportation-info']
  ]);
});

test('Task 4 evidence registry rejects missing, duplicate, mismatched, and unapproved declarations', () => {
  const canonical = validator.readEvidenceRegister(root);
  assert.deepEqual(canonical.errors, []);
  const rows = canonical.entries;

  const missing = evidenceRegisterText(rows.filter((entry) => entry.id !== 'unmanned-forklift-clip-01'));
  withEvidenceRoot(missing, (temporaryRoot) => {
    assert.match(validator.evidenceRegistryErrors(data, temporaryRoot).join(' '), /unmanned-forklift-clip-01.*not registered/i);
  });

  const duplicated = evidenceRegisterText(rows.concat(rows[0]));
  withEvidenceRoot(duplicated, (temporaryRoot) => {
    assert.match(validator.evidenceRegistryErrors(data, temporaryRoot).join(' '), /duplicate evidence id/i);
  });

  const mismatched = evidenceRegisterText(rows.map((entry) => entry.id === 'mandibular-publication'
    ? { ...entry, project: 'ai-build-lab', type: 'repository' }
    : entry));
  withEvidenceRoot(mismatched, (temporaryRoot) => {
    const errors = validator.evidenceRegistryErrors(data, temporaryRoot).join(' ');
    assert.match(errors, /mandibular-publication.*project mismatch/i);
    assert.match(errors, /mandibular-publication.*media type mismatch/i);
  });

  const pendingWithPath = evidenceRegisterText(rows.map((entry) => entry.id === 'rtms-prototype-recording'
    ? { ...entry, source: 'assets/projects/rtms-navigation/prototype.mp4' }
    : entry));
  withEvidenceRoot(pendingWithPath, (temporaryRoot) => {
    assert.match(validator.evidenceRegistryErrors(data, temporaryRoot).join(' '), /pending-review.*must not declare a public source/i);
  });

  const leakedProvenance = evidenceRegisterText(rows.map((entry, index) => index === 0
    ? { ...entry, note: 'Original at file:///sensitive/original.png.' }
    : entry));
  withEvidenceRoot(leakedProvenance, (temporaryRoot) => {
    assert.match(validator.evidenceRegistryErrors(data, temporaryRoot).join(' '), /private source path/i);
  });
});

test('Task 4 approved local raster validation enforces slug containment, safe names, existence, and dimensions', () => {
  const candidate = clone(data);
  candidate.projects[1].media.lead = {
    id: 'mandibular-fracture-lead-01',
    type: 'image',
    status: 'approved',
    publicPath: 'assets/projects/mandibular-fracture/point-cloud.png'
  };
  const canonical = validator.readEvidenceRegister(root).entries;
  const approvedRows = canonical.map((entry) => entry.id === 'mandibular-fracture-lead-01'
    ? { ...entry, state: 'approved-public', source: candidate.projects[1].media.lead.publicPath }
    : entry);

  withEvidenceRoot(evidenceRegisterText(approvedRows), (temporaryRoot) => {
    assert.match(validator.evidenceRegistryErrors(candidate, temporaryRoot).join(' '), /missing approved local asset/i);
    const target = path.join(temporaryRoot, candidate.projects[1].media.lead.publicPath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, 'not a png');
    assert.match(validator.evidenceRegistryErrors(candidate, temporaryRoot).join(' '), /valid intrinsic dimensions/i);
    fs.writeFileSync(target, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'));
    assert.deepEqual(validator.evidenceRegistryErrors(candidate, temporaryRoot), []);
  });

  for (const publicPath of [
    'assets/projects/surgical-navigation/point-cloud.png',
    'assets/projects/mandibular-fracture/PointCloud.png',
    'assets/projects/mandibular-fracture/point-cloud.svg'
  ]) {
    const malformed = clone(candidate);
    malformed.projects[1].media.lead.publicPath = publicPath;
    const malformedRows = canonical.map((entry) => entry.id === 'mandibular-fracture-lead-01'
      ? { ...entry, state: 'approved-public', source: publicPath }
      : entry);
    withEvidenceRoot(evidenceRegisterText(malformedRows), (temporaryRoot) => {
      assert.match(
        validator.evidenceRegistryErrors(malformed, temporaryRoot).join(' '),
        /below its project directory|lower-case safe file name|allowlisted lower-case extension/i,
        publicPath
      );
    });
  }
});

test('Task 4 approved video requires an approved registered image poster and keeps safe playback markup', () => {
  const candidate = clone(data);
  const project = candidate.projects[0];
  project.media.lead = {
    id: 'surgical-navigation-clip-01', type: 'video', status: 'approved',
    publicPath: 'assets/projects/surgical-navigation/navigation-demo.mp4'
  };
  project.media.video = { ...project.media.lead };
  project.media.poster = {
    id: 'surgical-navigation-poster-01', type: 'image', status: 'approved',
    publicPath: 'assets/projects/surgical-navigation/navigation-demo-poster.png'
  };
  const canonical = validator.readEvidenceRegister(root).entries;
  const approvedRows = canonical.map((entry) => {
    if (entry.id === project.media.lead.id) return { ...entry, state: 'approved-public', source: project.media.lead.publicPath };
    if (entry.id === project.media.poster.id) return { ...entry, state: 'approved-public', source: project.media.poster.publicPath };
    return entry;
  });

  withEvidenceRoot(evidenceRegisterText(approvedRows), (temporaryRoot) => {
    const videoPath = path.join(temporaryRoot, project.media.lead.publicPath);
    const posterPath = path.join(temporaryRoot, project.media.poster.publicPath);
    fs.mkdirSync(path.dirname(videoPath), { recursive: true });
    fs.writeFileSync(videoPath, validMp4());
    fs.writeFileSync(posterPath, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'));
    assert.deepEqual(validator.evidenceRegistryErrors(candidate, temporaryRoot), []);
    const html = render.evidenceMediaHtml(project, 'en', '../../', false);
    assert.match(html, /<video\b(?=[^>]*\bcontrols\b)(?=[^>]*\bpreload="none")/);
    assert.doesNotMatch(html, /\bautoplay\b/);

    project.media.poster.status = 'pending-approval';
    delete project.media.poster.publicPath;
    const pendingPosterRows = approvedRows.map((entry) => entry.id === project.media.poster.id
      ? { ...entry, state: 'pending-review', source: '-' }
      : entry);
    fs.writeFileSync(path.join(temporaryRoot, 'assets', 'projects', 'EVIDENCE_REGISTER.md'), evidenceRegisterText(pendingPosterRows));
    assert.match(validator.evidenceRegistryErrors(candidate, temporaryRoot).join(' '), /approved video requires an approved image poster/i);
  });
});

test('Task 4 review rejects every unregistered file or directory below a project evidence root', () => {
  const registerText = fs.readFileSync(path.join(root, 'assets', 'projects', 'EVIDENCE_REGISTER.md'), 'utf8');
  withEvidenceRoot(registerText, (temporaryRoot) => {
    seedEvidenceReadmes(temporaryRoot);
    assert.deepEqual(validator.evidenceDirectoryErrors(temporaryRoot), []);
    const unexpectedDirectory = path.join(temporaryRoot, 'assets', 'projects', 'unmanned-forklift', 'exports');
    fs.mkdirSync(unexpectedDirectory);
    fs.writeFileSync(path.join(unexpectedDirectory, 'field-frame.png'), validPng);
    const errors = validator.evidenceDirectoryErrors(temporaryRoot).join(' ');
    assert.match(errors, /unregistered evidence (?:directory|file)/i);
    assert.match(errors, /unmanned-forklift[\\/]exports/i);
  });

  const entries = validator.readEvidenceRegister(root).entries;
  const approvedSource = 'assets/projects/mandibular-fracture/point-cloud.png';
  const approved = evidenceRegisterText(entries.map((entry) => entry.id === 'mandibular-fracture-lead-01'
    ? { ...entry, state: 'approved-public', source: approvedSource }
    : entry));
  withEvidenceRoot(approved, (temporaryRoot) => {
    seedEvidenceReadmes(temporaryRoot);
    fs.writeFileSync(path.join(temporaryRoot, approvedSource), validPng);
    assert.deepEqual(validator.evidenceDirectoryErrors(temporaryRoot), []);
  });
});

test('Task 4 review structurally detects source paths while allowing plain exclusion language', () => {
  const canonical = validator.readEvidenceRegister(root).entries;
  const safe = evidenceRegisterText(canonical.map((entry, index) => index === 0
    ? { ...entry, note: 'Patient data excluded; only approved derivatives may be published.' }
    : entry));
  withEvidenceRoot(safe, (temporaryRoot) => {
    seedEvidenceReadmes(temporaryRoot, 'Patient data excluded. No identifying source metadata is recorded.');
    assert.deepEqual(validator.readEvidenceRegister(temporaryRoot).errors, []);
    assert.deepEqual(validator.evidenceDirectoryErrors(temporaryRoot), []);
  });

  const leaks = [
    'C:\\source\\capture.png',
    '\\\\server\\share\\capture.png',
    'file:///source/capture.png',
    '/Users/reviewer/capture.png',
    '/home/reviewer/capture.png',
    '/mnt/c/source/capture.png',
    'path=exports/capture.png',
    'archive/private/raw/capture.png',
    'archive/extracted/capture.png',
    'archive/manifest/capture.json'
  ];
  for (const leakedNote of leaks) {
    const leaked = evidenceRegisterText(canonical.map((entry, index) => index === 0
      ? { ...entry, note: `Original ${leakedNote}` }
      : entry));
    withEvidenceRoot(leaked, (temporaryRoot) => {
      assert.match(validator.readEvidenceRegister(temporaryRoot).errors.join(' '), /private source path/i, leakedNote);
    });
  }

  withEvidenceRoot(evidenceRegisterText(canonical), (temporaryRoot) => {
    seedEvidenceReadmes(temporaryRoot);
    fs.writeFileSync(
      path.join(temporaryRoot, 'assets', 'projects', 'rtms-navigation', 'README.md'),
      'Review source path=/home/reviewer/prototype.mp4'
    );
    assert.match(validator.evidenceDirectoryErrors(temporaryRoot).join(' '), /README\.md.*private source path/i);
  });
});

test('Task 4 review requires exact filesystem case and rejects link or realpath escape', () => {
  const candidate = clone(data);
  candidate.projects[1].media.lead = {
    id: 'mandibular-fracture-lead-01', type: 'image', status: 'approved',
    publicPath: 'assets/projects/mandibular-fracture/point-cloud.png'
  };
  const canonical = validator.readEvidenceRegister(root).entries;
  const approved = evidenceRegisterText(canonical.map((entry) => entry.id === 'mandibular-fracture-lead-01'
    ? { ...entry, state: 'approved-public', source: candidate.projects[1].media.lead.publicPath }
    : entry));

  withEvidenceRoot(approved, (temporaryRoot) => {
    const projectDirectory = path.join(temporaryRoot, 'assets', 'projects', 'mandibular-fracture');
    fs.mkdirSync(projectDirectory, { recursive: true });
    fs.writeFileSync(path.join(projectDirectory, 'Point-Cloud.png'), validPng);
    assert.match(validator.evidenceRegistryErrors(candidate, temporaryRoot).join(' '), /exact filesystem case/i);
  });

  withEvidenceRoot(approved, (temporaryRoot) => {
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-evidence-outside-'));
    try {
      fs.writeFileSync(path.join(outside, 'point-cloud.png'), validPng);
      const projectDirectory = path.join(temporaryRoot, 'assets', 'projects', 'mandibular-fracture');
      fs.rmSync(projectDirectory, { recursive: true, force: true });
      fs.symlinkSync(outside, projectDirectory, process.platform === 'win32' ? 'junction' : 'dir');
      assert.match(validator.evidenceRegistryErrors(candidate, temporaryRoot).join(' '), /symbolic link|reparse point|realpath escape/i);
    } finally {
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });
});

test('Task 4 review rejects truncated or corrupt PNG files that only expose an IHDR size', () => {
  const candidate = clone(data);
  candidate.projects[1].media.lead = {
    id: 'mandibular-fracture-lead-01', type: 'image', status: 'approved',
    publicPath: 'assets/projects/mandibular-fracture/point-cloud.png'
  };
  const canonical = validator.readEvidenceRegister(root).entries;
  const approved = evidenceRegisterText(canonical.map((entry) => entry.id === 'mandibular-fracture-lead-01'
    ? { ...entry, state: 'approved-public', source: candidate.projects[1].media.lead.publicPath }
    : entry));

  for (const payload of [validPng.subarray(0, 24), (() => {
    const corrupted = Buffer.from(validPng);
    corrupted[42] ^= 0xff;
    return corrupted;
  })()]) {
    withEvidenceRoot(approved, (temporaryRoot) => {
      const target = path.join(temporaryRoot, candidate.projects[1].media.lead.publicPath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, payload);
      assert.match(validator.evidenceRegistryErrors(candidate, temporaryRoot).join(' '), /structurally complete and decodable/i);
    });
  }
});

test('Task 4 review rejects privacy-bearing metadata in an otherwise valid approved PNG', () => {
  const candidate = clone(data);
  candidate.projects[1].media.lead = {
    id: 'mandibular-fracture-lead-01', type: 'image', status: 'approved',
    publicPath: 'assets/projects/mandibular-fracture/point-cloud.png'
  };
  const canonical = validator.readEvidenceRegister(root).entries;
  const approved = evidenceRegisterText(canonical.map((entry) => entry.id === 'mandibular-fracture-lead-01'
    ? { ...entry, state: 'approved-public', source: candidate.projects[1].media.lead.publicPath }
    : entry));
  const metadataFixtures = [
    ['tEXt', Buffer.from('Source\0C:\\Users\\patient\\private\\raw\\scan.png')],
    ['zTXt', Buffer.from('PatientName\0\0private')],
    ['iTXt', Buffer.from('PatientName\0\0\0\0\0private')],
    ['eXIf', Buffer.from('PatientName=private')],
    ['tIME', Buffer.from([0x07, 0xe8, 1, 1, 0, 0, 0])]
  ];
  for (const [type, payload] of metadataFixtures) {
    withEvidenceRoot(approved, (temporaryRoot) => {
      const target = path.join(temporaryRoot, candidate.projects[1].media.lead.publicPath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, pngWithMetadata(type, payload));
      assert.deepEqual(validator.imageDimensions(target, '.png'), { width: 1, height: 1 });
      assert.match(validator.evidenceRegistryErrors(candidate, temporaryRoot).join(' '), /metadata-stripped|metadata chunk/i, type);
    });
  }
});

test('Task 4 review requires approved MP4 evidence to be bounded, playable video, duration-limited, and metadata-stripped', () => {
  const candidate = clone(data);
  const project = candidate.projects[0];
  project.media.lead = {
    id: 'surgical-navigation-clip-01', type: 'video', status: 'approved',
    publicPath: 'assets/projects/surgical-navigation/navigation-demo.mp4'
  };
  project.media.video = { ...project.media.lead };
  project.media.poster = {
    id: 'surgical-navigation-poster-01', type: 'image', status: 'approved',
    publicPath: 'assets/projects/surgical-navigation/navigation-demo-poster.png'
  };
  const canonical = validator.readEvidenceRegister(root).entries;
  const approved = evidenceRegisterText(canonical.map((entry) => {
    if (entry.id === project.media.lead.id) return { ...entry, state: 'approved-public', source: project.media.lead.publicPath };
    if (entry.id === project.media.poster.id) return { ...entry, state: 'approved-public', source: project.media.poster.publicPath };
    return entry;
  }));
  const fixtures = [
    [Buffer.from('not an MP4'), /valid MP4|container/i],
    [validMp4({ durationSeconds: 10 }), /15-30 seconds|duration/i],
    [validMp4({ durationSeconds: 31 }), /15-30 seconds|duration/i],
    [validMp4({ extraMoovBoxes: [mp4Box('udta', Buffer.from('PatientName=private'))] }), /metadata-stripped|metadata box/i],
    [validMp4({ mdatPayload: Buffer.from('C:\\Users\\patient\\private\\raw\\scan.mp4') }), /private path|private PII/i],
    [Buffer.alloc(20 * 1024 * 1024 + 1), /20 MB|size/i]
  ];
  for (const [payload, expected] of fixtures) {
    withEvidenceRoot(approved, (temporaryRoot) => {
      const videoPath = path.join(temporaryRoot, project.media.lead.publicPath);
      const posterPath = path.join(temporaryRoot, project.media.poster.publicPath);
      fs.mkdirSync(path.dirname(videoPath), { recursive: true });
      fs.writeFileSync(videoPath, payload);
      fs.writeFileSync(posterPath, validPng);
      assert.match(validator.evidenceRegistryErrors(candidate, temporaryRoot).join(' '), expected);
    });
  }
  withEvidenceRoot(approved, (temporaryRoot) => {
    const videoPath = path.join(temporaryRoot, project.media.lead.publicPath);
    const posterPath = path.join(temporaryRoot, project.media.poster.publicPath);
    fs.mkdirSync(path.dirname(videoPath), { recursive: true });
    fs.writeFileSync(videoPath, validMp4());
    fs.writeFileSync(posterPath, validPng);
    assert.deepEqual(validator.evidenceRegistryErrors(candidate, temporaryRoot), []);
  });
});

test('Task 4 review rejects an approved secondary video when the approved lead is an image', () => {
  const candidate = clone(data);
  const project = candidate.projects[0];
  project.media.lead = {
    id: 'surgical-navigation-demo-poster', type: 'image', status: 'approved',
    publicPath: 'assets/projects/surgical-navigation/navigation-demo-poster.png'
  };
  project.media.poster = { ...project.media.lead };
  project.media.video = {
    id: 'surgical-navigation-demo', type: 'video', status: 'approved',
    publicPath: 'assets/projects/surgical-navigation/navigation-demo.mp4'
  };
  const canonical = validator.readEvidenceRegister(root).entries;
  const approved = evidenceRegisterText(canonical.map((entry) => {
    if (entry.id === project.media.lead.id) return { ...entry, state: 'approved-public', source: project.media.lead.publicPath };
    if (entry.id === project.media.video.id) return { ...entry, state: 'approved-public', source: project.media.video.publicPath };
    return entry;
  }));
  withEvidenceRoot(approved, (temporaryRoot) => {
    const poster = path.join(temporaryRoot, project.media.lead.publicPath);
    fs.mkdirSync(path.dirname(poster), { recursive: true });
    fs.writeFileSync(poster, validPng);
    fs.writeFileSync(path.join(temporaryRoot, project.media.video.publicPath), 'video fixture');
    assert.match(validator.evidenceRegistryErrors(candidate, temporaryRoot).join(' '), /approved media\.video must equal the approved video lead/i);
  });
});

test('Task 4 review root inventory permits only the register and eight canonical project directories', () => {
  const registerText = fs.readFileSync(path.join(root, 'assets', 'projects', 'EVIDENCE_REGISTER.md'), 'utf8');
  withEvidenceRoot(registerText, (temporaryRoot) => {
    seedEvidenceReadmes(temporaryRoot);
    assert.deepEqual(validator.evidenceDirectoryErrors(temporaryRoot), []);
    const evidenceRoot = path.join(temporaryRoot, 'assets', 'projects');
    const secretRoot = path.join(evidenceRoot, 'secret-project');
    fs.mkdirSync(secretRoot);
    fs.writeFileSync(path.join(secretRoot, 'patient-export.png'), validPng);
    fs.writeFileSync(path.join(evidenceRoot, 'stray-notes.txt'), 'unexpected root file');
    const errors = validator.evidenceDirectoryErrors(temporaryRoot).join(' ');
    assert.match(errors, /secret-project.*unexpected evidence root (?:directory|item)/i);
    assert.match(errors, /stray-notes\.txt.*unexpected evidence root (?:file|item)/i);

    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-evidence-root-link-'));
    const linkedRoot = path.join(evidenceRoot, 'linked-project');
    try {
      fs.symlinkSync(outside, linkedRoot, process.platform === 'win32' ? 'junction' : 'dir');
      assert.match(validator.evidenceDirectoryErrors(temporaryRoot).join(' '), /linked-project.*symbolic link or reparse point/i);
    } finally {
      fs.rmSync(linkedRoot, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });
});

test('Task 4 review validates source and prose columns structurally without rejecting safe HTTPS paths', () => {
  const canonical = validator.readEvidenceRegister(root).entries;
  const candidate = clone(data);
  const safeUrl = 'https://example.com/study/raw/images';
  candidate.projects[1].media.references[0].publicPath = safeUrl;
  const safeRows = canonical.map((entry) => entry.id === 'mandibular-publication'
    ? { ...entry, source: safeUrl, note: `Public evidence: ${safeUrl}` }
    : entry);
  withEvidenceRoot(evidenceRegisterText(safeRows), (temporaryRoot) => {
    seedEvidenceReadmes(temporaryRoot, `Patient data excluded. Public evidence: ${safeUrl}`);
    assert.deepEqual(validator.readEvidenceRegister(temporaryRoot).errors, []);
    assert.deepEqual(validator.evidenceRegistryErrors(candidate, temporaryRoot), []);
    assert.deepEqual(validator.evidenceDirectoryErrors(temporaryRoot), []);
  });

  const proseLeaks = [
    '/tmp/capture.png',
    '/workspace/review/capture.png',
    '/var/tmp/capture.png',
    '/Users/reviewer/capture.png',
    '/home/reviewer/capture.png',
    '/mnt/c/review/capture.png',
    'source:C:/review/capture.png',
    '\\\\server\\share\\capture.png',
    'file:///review/capture.png',
    '../review/capture.png',
    'exports/capture.png',
    'archive/private/capture.png',
    'archive/raw/capture.png',
    'archive/extracted/capture.png',
    'archive/manifest/capture.json'
  ];
  for (const localPath of proseLeaks) {
    const leakedRows = canonical.map((entry, index) => index === 0
      ? { ...entry, note: `Local review source ${localPath}` }
      : entry);
    withEvidenceRoot(evidenceRegisterText(leakedRows), (temporaryRoot) => {
      assert.match(validator.readEvidenceRegister(temporaryRoot).errors.join(' '), /private source path/i, localPath);
    });
  }

  const blankPendingSource = evidenceRegisterText(canonical.map((entry) => entry.id === 'rtms-prototype-recording'
    ? { ...entry, source: '' }
    : entry));
  withEvidenceRoot(blankPendingSource, (temporaryRoot) => {
    assert.match(validator.evidenceRegistryErrors(data, temporaryRoot).join(' '), /source must be exactly "-"/i);
  });

  const restrictedCandidate = clone(data);
  restrictedCandidate.projects[1].media.lead = {
    id: 'mandibular-fracture-lead-01', type: 'image', status: 'approved',
    publicPath: 'assets/projects/mandibular-fracture/extracted/point-cloud.png'
  };
  const restrictedRows = evidenceRegisterText(canonical.map((entry) => entry.id === 'mandibular-fracture-lead-01'
    ? { ...entry, state: 'approved-public', source: restrictedCandidate.projects[1].media.lead.publicPath }
    : entry));
  withEvidenceRoot(restrictedRows, (temporaryRoot) => {
    assert.match(validator.evidenceRegistryErrors(restrictedCandidate, temporaryRoot).join(' '), /restricted source directory segment/i);
  });

  withEvidenceRoot(evidenceRegisterText(canonical), (temporaryRoot) => {
    seedEvidenceReadmes(temporaryRoot);
    fs.writeFileSync(
      path.join(temporaryRoot, 'assets', 'projects', 'life-careverse', 'README.md'),
      'Local review source /tmp/multiuser-demo.mp4'
    );
    assert.match(validator.evidenceDirectoryErrors(temporaryRoot).join(' '), /README\.md.*private source path/i);
  });
});

test('Task 4 review rejects encoded local paths and private-network hosts in approved external evidence URLs', () => {
  const canonical = validator.readEvidenceRegister(root).entries;
  const target = canonical.find((entry) => entry.state === 'approved-public' && ['repository', 'publication'].includes(entry.type));
  assert.ok(target, 'expected at least one approved external evidence entry');
  const unsafeSources = [
    'https://example.com/?source=C:%5CUsers%5Cname%5Cprivate%5Craw%5Cscan.png',
    'https://example.com/?source=C%253A%255CUsers%255Cname%255Cprivate%255Craw%255Cscan.png',
    'https://example.com/private/raw/scan.png',
    'https://localhost/internal',
    'https://127.0.0.1/internal',
    'https://192.168.1.8/internal',
    'https://10.0.0.4/internal',
    'https://172.16.2.4/internal',
    'https://[::1]/internal'
  ];
  for (const source of unsafeSources) {
    const register = evidenceRegisterText(canonical.map((entry) => entry.id === target.id ? { ...entry, source } : entry));
    withEvidenceRoot(register, (temporaryRoot) => {
      assert.match(
        validator.evidenceRegistryErrors(data, temporaryRoot).join(' '),
        /public HTTPS|private network|local source path|unsafe external evidence/i,
        source
      );
    });
  }
  withEvidenceRoot(evidenceRegisterText(canonical), (temporaryRoot) => {
    assert.deepEqual(validator.evidenceRegistryErrors(data, temporaryRoot), []);
  });
});

test('Task 4 review rejects a Unix source path in prepended non-table register prose', () => {
  const registerText = fs.readFileSync(path.join(root, 'assets', 'projects', 'EVIDENCE_REGISTER.md'), 'utf8');
  const leaked = `<!-- review source /tmp/company/capture.png -->\n${registerText}`;
  withEvidenceRoot(leaked, (temporaryRoot) => {
    assert.match(validator.readEvidenceRegister(temporaryRoot).errors.join(' '), /non-table prose.*private source path/i);
  });
});

test('Task 4 review rejects a Windows source path in appended non-table register prose', () => {
  const registerText = fs.readFileSync(path.join(root, 'assets', 'projects', 'EVIDENCE_REGISTER.md'), 'utf8');
  const leaked = `${registerText}\n<!-- review source C:\\company\\capture.png -->`;
  withEvidenceRoot(leaked, (temporaryRoot) => {
    assert.match(validator.readEvidenceRegister(temporaryRoot).errors.join(' '), /non-table prose.*private source path/i);
  });
});

test('Task 4 review removes only structurally valid HTTPS tokens from non-table prose checks', () => {
  const registerText = fs.readFileSync(path.join(root, 'assets', 'projects', 'EVIDENCE_REGISTER.md'), 'utf8');
  const safe = `<!-- public evidence https://example.com/study/raw/images -->\n${registerText}`;
  withEvidenceRoot(safe, (temporaryRoot) => {
    assert.deepEqual(validator.readEvidenceRegister(temporaryRoot).errors, []);
  });

  for (const token of ['https:///tmp/company/capture.png', 'https://example.com\\tmp\\capture.png', 'https://C:/company/capture.png']) {
    const malformed = `<!-- review source ${token} -->\n${registerText}`;
    withEvidenceRoot(malformed, (temporaryRoot) => {
      assert.match(validator.readEvidenceRegister(temporaryRoot).errors.join(' '), /non-table prose.*private source path/i, token);
    });
  }
});

test('Task 4 review rejects the exact malicious first-cell header bypass from review', () => {
  const registerText = fs.readFileSync(path.join(root, 'assets', 'projects', 'EVIDENCE_REGISTER.md'), 'utf8');
  const header = '| Evidence ID | Project | Media type | State | Public source | Provenance / usage |';
  const maliciousHeader = '| Evidence ID | Project | Media type | State | /tmp/company/capture.png | Provenance / usage |';
  const mutated = registerText.replace(header, maliciousHeader);
  withEvidenceRoot(mutated, (temporaryRoot) => {
    const errors = validator.readEvidenceRegister(temporaryRoot).errors.join(' ');
    assert.match(errors, /exact evidence register schema header/i);
    assert.match(errors, /skipped non-entry line.*private source path/i);
  });
});

test('Task 4 review requires one exact header and one exact adjacent six-cell separator', () => {
  const registerText = fs.readFileSync(path.join(root, 'assets', 'projects', 'EVIDENCE_REGISTER.md'), 'utf8');
  const header = '| Evidence ID | Project | Media type | State | Public source | Provenance / usage |';
  const separator = '| --- | --- | --- | --- | --- | --- |';
  const mutations = [
    [registerText.replace(header, `${header}\n${header}`), /duplicate exact evidence register schema header/i],
    [registerText.replace(header, ''), /missing exact evidence register schema header/i],
    [registerText.replace(header, '| Evidence Key | Project | Media type | State | Public source | Provenance / usage |'), /missing exact evidence register schema header/i],
    [registerText.replace(separator, ''), /missing exact evidence register separator/i],
    [registerText.replace(separator, '| -- | --- | --- | --- | --- | --- |'), /exact six-cell evidence register separator/i],
    [registerText.replace(separator, `${separator}\n${separator}`), /duplicate exact evidence register separator/i]
  ];
  for (const [mutated, expected] of mutations) {
    withEvidenceRoot(mutated, (temporaryRoot) => {
      assert.match(validator.readEvidenceRegister(temporaryRoot).errors.join(' '), expected);
    });
  }
});

test('Task 3 review preserves literal tier and evidence-state mappings', () => {
  assert.deepEqual(data.tiers.map((tier) => [tier.key, tier.translations.ko.label, tier.translations.en.label]), [
    ['medical-core', '의료 코어', 'Medical Core'],
    ['platform', '플랫폼 소프트웨어', 'Platform Software'],
    ['industrial-spotlight', '산업 스포트라이트', 'Industrial Spotlight'],
    ['ai-build-lab', 'AI 빌드 랩', 'AI Build Lab']
  ]);
  assert.deepEqual(data.projects.map((project) => [project.slug, project.tier, project.evidenceState]), [
    ['surgical-navigation', 'medical-core', 'ongoing'],
    ['mandibular-fracture', 'medical-core', 'verified'],
    ['life-careverse', 'medical-core', 'ongoing'],
    ['rtms-navigation', 'medical-core', 'prototype'],
    ['respiratory-surface-guidance', 'medical-core', 'ongoing'],
    ['skadi-tracking-software', 'platform', 'ongoing'],
    ['unmanned-forklift', 'industrial-spotlight', 'ongoing'],
    ['ai-build-lab', 'ai-build-lab', 'ongoing']
  ]);
  assert.deepEqual(
    ['verified', 'ongoing', 'prototype'].map((state) => [state, i18n.ui.ko.portfolio.evidenceStates[state], i18n.ui.en.portfolio.evidenceStates[state]]),
    [
      ['verified', '검증됨', 'Verified'],
      ['ongoing', '진행 중', 'Ongoing'],
      ['prototype', '프로토타입', 'Prototype']
    ]
  );
});

test('privacy and attribution policies reject private names and contribution percentages', () => {
  assert.doesNotMatch(JSON.stringify(data), render.policy.prohibitedPartnerPattern);
  const percentage = clone(data);
  percentage.projects[0].translations.en.role += ' Contribution 47%.';
  assert.match(validator.portfolioDataErrors(percentage).join(' '), /contribution percentage/i);
  const measured = clone(data);
  measured.projects[0].translations.en.evidence += ' Measured pass rate 87%.';
  assert.doesNotMatch(validator.portfolioDataErrors(measured).join(' '), /contribution percentage/i);
  const named = clone(data);
  named.projects[0].translations.en.summary += ' Genoray partner.';
  assert.match(validator.portfolioDataErrors(named).join(' '), /nonpublic partner/i);
});

test('Scholar policy allows approved institution and product names while still rejecting private partners', () => {
  const approved = clone(data);
  approved.projects[0].translations.ko.summary += ' 삼성서울병원 구강악안면외과와 협력해 SKADI·SMCNavi 기반으로 통합했고 KERI·ETRI 컨소시엄 과제에 참여합니다.';
  approved.projects[0].translations.en.summary += ' Built with Samsung Medical Center on SKADI and SMCNavi; Digitrack, KERI, and ETRI are named.';
  assert.deepEqual(render.dataErrors(approved).filter((error) => /nonpublic partner/i.test(error)), []);
  assert.deepEqual(validator.portfolioDataErrors(approved).filter((error) => /nonpublic partner/i.test(error)), []);

  const blocked = clone(data);
  blocked.projects[0].translations.en.summary += ' Genoray partner.';
  assert.match(render.dataErrors(blocked).join('\n'), /nonpublic partner/i);

  const cv = JSON.parse(read('data/public-cv.json'));
  cv.identity.translations.ko.summary += ' 삼성서울병원·서울성모병원과 협력했습니다.';
  cv.identity.translations.en.summary += ' Collaborated with Samsung Medical Center, KERI, and ETRI.';
  assert.deepEqual(validator.publicCvDataErrors(cv).filter((error) => /prohibited/i.test(error)), []);
  const stillBlocked = JSON.parse(read('data/public-cv.json'));
  stillBlocked.identity.translations.ko.summary += ' 연봉 협상 중';
  assert.match(validator.publicCvDataErrors(stillBlocked).join('\n'), /prohibited/i);
});

test('canonical validator rejects malformed capabilities, tiers, states, blocks, and media', () => {
  const mutations = [
    [(candidate) => { candidate.capabilities[0].key = 'unknown'; }, /known ordered keys/i],
    [(candidate) => { candidate.projects[0].tier = 'featured'; }, /unknown tier/i],
    [(candidate) => { candidate.projects[0].evidenceState = 'completed'; }, /unknown evidence state/i],
    [(candidate) => { candidate.projects[0].blocks[0].type = 'timeline'; }, /unsupported block type/i],
    [(candidate) => { candidate.projects[3].media.lead.publicPath = 'assets/private/demo.mp4'; }, /pending-approval media must not declare a public path/i],
    [(candidate) => { delete candidate.projects.at(-1).media.lead.publicPath; }, /approved media requires a public path/i],
    [(candidate) => { candidate.projects[0].pdf.ko = 'download.pdf'; }, /invalid ko PDF path/i]
  ];
  for (const [mutate, expected] of mutations) {
    const candidate = clone(data);
    mutate(candidate);
    assert.match(validator.portfolioDataErrors(candidate).join(' '), expected);
  }
});

test('route descriptors keep four public pages and eight paired case routes', () => {
  assert.deepEqual(i18n.supportedNavigationPages, ['home', 'projects', 'cv', 'contact']);
  assert.deepEqual(i18n.canonicalCaseSlugs, slugs);
  assert.deepEqual(validator.portfolioRoutes().map((item) => item.route), [
    '', 'projects/', 'cv/', 'contact/', ...slugs.map((slug) => `projects/${slug}/`)
  ]);
  const files = canonicalPages();
  assert.equal(files.length, 24);
  assert.equal(new Set(files.map((item) => item.relativePath)).size, 24);
});

test('route helpers preserve locale and explicit file protocol targets', () => {
  assert.equal(i18n.routeHref('../', 'ko', 'projects/surgical-navigation/', false), '../projects/surgical-navigation/');
  assert.equal(i18n.routeHref('../', 'en', 'projects/surgical-navigation/', false), '../en/projects/surgical-navigation/');
  assert.equal(i18n.routeHref('../../../', 'en', 'projects/', true), '../../../en/projects/index.html');
  assert.equal(i18n.routeHref('', 'ko', '', true), 'index.html');
});

test('shared navigation contains only brand, Projects, CV, Contact, and explicit locale links', () => {
  const html = nav.navigationHtml({ base: '../../../', current: 'projects', locale: 'en', route: 'projects/rtms-navigation/', isFile: true });
  assertInOrder(html, ['Jinmin Kim', '>Projects<', '>CV<', '>Contact<', '>한국어<', '>EN<'], 'navigation');
  assert.doesNotMatch(html, /Capabilities|Research|GitHub|fontawesome|navbar-toggler|data-bs-/i);
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/projects\/rtms-navigation\/index\.html"[^>]*>한국어<\/a>/);
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/en\/projects\/rtms-navigation\/index\.html"[^>]*aria-current="page"[^>]*>EN<\/a>/);
});

test('prototype evidence state is localized in both languages', () => {
  assert.equal(i18n.ui.ko.portfolio.evidenceStates.prototype, '프로토타입');
  assert.equal(i18n.ui.en.portfolio.evidenceStates.prototype, 'Prototype');
});

test('Scholar Home list renders every project as thumbnail-plus-text rows grouped by tier', () => {
  const html = render.homeProjectGalleryHtml(data, '', false, 'en');
  assert.equal(count(html, '<li class="sc-project'), data.projects.length);
  assertInOrder(html, data.tiers.filter((tier) => data.projects.some((project) => project.tier === tier.key)).map((tier) => `data-tier="${tier.key}"`), 'Home groups');
  assertInOrder(html, data.projects.map((project) => project.translations.en.title.replace(/&/g, '&amp;')), 'Home projects');
  for (const project of data.projects) {
    assert.match(html, new RegExp(`<h4 class="sc-project__title"><a href="en/projects/${project.slug}/">`));
    assert.match(html, new RegExp(project.translations.en.summary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.doesNotMatch(html, new RegExp(project.translations.en.role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.doesNotMatch(html, /td-|sc-project__facts|Pending approval|Public evidence|role="img"|aria-label=|data-media-status/);
});

test('Scholar list rows show an approved lead image as a decorative thumbnail', () => {
  const candidate = clone(data);
  candidate.projects[0].media.lead = { id: 'surgical-navigation-public-image', type: 'image', status: 'approved', publicPath: 'assets/projects/surgical-navigation/lead.png' };
  candidate.projects[0].pdfSequence.evidenceId = candidate.projects[0].media.lead.id;
  const html = render.homeProjectGalleryHtml(candidate, '../', true, 'en');
  const firstRow = html.match(/<li class="sc-project"[\s\S]*?<\/li>/)?.[0] || '';
  assert.match(firstRow, /<a class="sc-project__thumb" href="\.\.\/en\/projects\/surgical-navigation\/index\.html" tabindex="-1" aria-hidden="true"><img src="\.\.\/assets\/projects\/surgical-navigation\/lead\.png" alt="" loading="lazy" decoding="async"><\/a>/);
  const pendingRow = html.match(/<li class="sc-project sc-project--text"[\s\S]*?<\/li>/)?.[0] || '';
  assert.ok(pendingRow, 'pending projects render as text-only rows');
  assert.doesNotMatch(pendingRow, /<img|sc-project__thumb|Pending approval|placeholder/i);
});

test('Task 3 review Home video tiles use an approved poster without autoplay or inline video', () => {
  const candidate = clone(data);
  candidate.projects[0].media.lead = { id: 'surgical-navigation-public-video', type: 'video', status: 'approved', publicPath: 'assets/projects/surgical-navigation/demo.mp4' };
  candidate.projects[0].media.poster = { id: 'surgical-navigation-public-poster', type: 'image', status: 'approved', publicPath: 'assets/projects/surgical-navigation/poster.png' };
  candidate.projects[0].pdfSequence.evidenceId = candidate.projects[0].media.lead.id;
  const html = render.homeProjectGalleryHtml(candidate, '', false, 'ko');
  const firstRow = html.match(/<li class="sc-project"[\s\S]*?<\/li>/)?.[0] || '';
  assert.match(firstRow, /<img src="assets\/projects\/surgical-navigation\/poster\.png" alt=""/);
  assert.doesNotMatch(firstRow, /<video\b|autoplay|demo\.mp4/);
});

test('Scholar capability paragraph follows data order and the mosaic is gone', () => {
  assert.equal(render.homeEvidenceMosaicHtml, undefined);
  const index = render.capabilityIndexHtml(data, 'en');
  assert.match(index, /^<p class="sc-capabilities">/);
  assertInOrder(index, data.capabilities.map((item) => item.translations.en.title.replace(/&/g, '&amp;')), 'capability paragraph');
  for (const capability of data.capabilities) {
    assert.match(index, new RegExp(capability.methods[0].replace(/&/g, '&amp;').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.doesNotMatch(index, /rating|progress|capability-card|td-/i);
});

test('Scholar highlights render three numbered groups and a linked publication', () => {
  const candidate = clone(data);
  candidate.highlights = {
    publications: [{ year: '2024', href: 'https://link.springer.com/article/10.1007/s10278-024-01014-z', translations: { ko: { title: '논문 제목', venue: 'JIIM' }, en: { title: 'Paper title', venue: 'JIIM' } } }],
    patents: { filed: 7, registered: 3, items: [{ year: '2024', status: 'registered', translations: { ko: { title: '특허 제목' }, en: { title: 'Patent title' } } }] },
    awards: [{ year: '2023', translations: { ko: { title: '수상 제목' }, en: { title: 'Award title' } } }]
  };
  const html = render.highlightsHtml(candidate, 'ko');
  assertInOrder(html, ['<h3>논문</h3>', 'https://link.springer.com/article/10.1007/s10278-024-01014-z', '논문 제목', '<h3>특허</h3>', '출원 7건 · 등록 3건', '특허 제목', '<h3>수상</h3>', '수상 제목'], 'highlights');
  assert.equal(count(html, '<ol class="sc-list">'), 3);
  const withoutHighlights = clone(data);
  delete withoutHighlights.highlights;
  assert.equal(render.highlightsHtml(withoutHighlights, 'en'), '', 'no highlights data renders nothing');
});

test('Scholar Home shells carry the intro, four mounts, and a full no-JS project list', () => {
  const pages = [
    ['index.html', '로봇SW 엔지니어', data.projects.map((item) => item.translations.ko.title), 'assets/'],
    ['en/index.html', 'robot software engineer', data.projects.map((item) => item.translations.en.title), '../assets/']
  ];
  for (const [file, identity, titles, assetBase] of pages) {
    const html = read(file);
    assert.match(html, new RegExp(identity, 'i'));
    assertInOrder(html, ['class="sc-intro"', 'data-portfolio="capability-index"', 'data-portfolio="home-projects"', 'data-portfolio="home-highlights"', 'class="sc-contact"'], file);
    assert.match(html, new RegExp(`<img class="sc-intro__photo" src="${assetBase}img/profile_square.webp"`));
    assert.match(html, /mailto:uiop3847@naver\.com/);
    assert.match(html, /https:\/\/www\.linkedin\.com\/in\/rlawlsals/);
    assert.match(html, new RegExp(`${assetBase}cv/jinmin-kim-cv-(?:ko|en)\\.pdf`));
    const fallback = html.match(/<ol class="sc-project-list sc-project-list--fallback">([\s\S]*?)<\/ol>/)?.[1] || '';
    assert.equal(count(fallback, '<a '), data.projects.length, `${file}: fallback link count`);
    assertInOrder(fallback, titles, `${file}: fallback project titles`);
    assert.doesNotMatch(html, /td-eyebrow|td-home-hero|td-mosaic|hero-kicker|SELECTED WORK|JOINT DEVELOPMENT|공동개발 파트너|박사|진학|이직|PhD|admission/i, `${file}: no Spatial Signal residue or career wording`);
  }
});

test('Scholar Projects page groups detailed rows by tier in data order', () => {
  const html = render.projectGroupsHtml(data, '../', false, 'en');
  const tiers = data.tiers.filter((tier) => data.projects.some((project) => project.tier === tier.key));
  assertInOrder(html, tiers.map((tier) => `data-tier="${tier.key}"`), 'project tiers');
  assert.equal(count(html, '<section class="sc-group"'), tiers.length);
  assert.equal(count(html, '<li class="sc-project'), data.projects.length);
  for (const tier of tiers) {
    const group = html.match(new RegExp(`<section class="sc-group" data-tier="${tier.key}">[\\s\\S]*?</section>`))?.[0] || '';
    assert.match(group, new RegExp(`<h2 class="sc-group__title">${tier.translations.en.label.replace(/&/g, '&amp;')}</h2>`));
    assert.equal(count(group, '<li class="sc-project'), data.projects.filter((project) => project.tier === tier.key).length);
  }
  assert.match(html, /<dt>Problem<\/dt>[\s\S]*<dt>My role<\/dt>[\s\S]*<dt>Evidence<\/dt>/);
  assert.match(html, /<h3 class="sc-project__title"><a href="\.\.\/en\/projects\/surgical-navigation\/">Surgical Navigation Systems<\/a><\/h3>/);
  assert.doesNotMatch(html, /td-|Featured|More Projects/i);
});

test('Scholar figure renderer skips pending media instead of drawing a placeholder', () => {
  const project = data.projects.find((item) => item.slug === 'rtms-navigation');
  assert.equal(render.evidenceMediaHtml(project, 'en', '../../', false), '');
  const html = render.caseStudyHtml(data, project.slug, '../../', false, 'en');
  assert.doesNotMatch(html, /<figure|<img|<video|role="img"|placeholder/i);
  assert.match(html, new RegExp(project.translations.en.limitation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const repositoryLead = data.projects.find((item) => item.media.lead.type === 'repository');
  assert.equal(render.evidenceMediaHtml(repositoryLead, 'en', '', false), '');
});

test('Task 3 approved video contract is poster-led, click-to-play, and keyboard reachable', () => {
  const project = clone(data.projects[0]);
  project.media.lead = { id: 'approved-demo', type: 'video', status: 'approved', publicPath: 'assets/projects/demo.mp4' };
  project.media.poster = { id: 'approved-poster', type: 'image', status: 'approved', publicPath: 'assets/projects/poster.png' };
  const html = render.evidenceMediaHtml(project, 'en', '../../', false);
  assert.match(html, /<video\b(?=[^>]*\bcontrols\b)(?=[^>]*\bpreload="none")(?=[^>]*\bposter="\.\.\/\.\.\/assets\/projects\/poster\.png")(?=[^>]*\btabindex="0")[^>]*>/);
  assert.match(html, /<source src="\.\.\/\.\.\/assets\/projects\/demo\.mp4"/);
  assert.doesNotMatch(html, /\bautoplay\b|\bmuted\b/);
  assert.match(html, /<figcaption><span class="sc-figure__label">Figure 1\.<\/span> /);
});

test('Task 3 approved video without an approved poster stays an honest fallback', () => {
  const project = clone(data.projects[0]);
  project.media.lead = { id: 'approved-demo', type: 'video', status: 'approved', publicPath: 'assets/projects/demo.mp4' };
  project.media.poster = { id: 'pending-poster', type: 'image', status: 'pending-approval' };
  const html = render.evidenceMediaHtml(project, 'en', '../../', false);
  assert.equal(html, '');
});

test('Task 3 review renderer validation matches the canonical render-required boundary', () => {
  assert.equal(typeof render.dataErrors, 'function');
  const mutations = [
    [(candidate) => { delete candidate.projects[0].translations.en.thesis; }, /missing en translation for thesis/i],
    [(candidate) => { delete candidate.projects[0].translations.ko.mediaAlt; }, /missing ko translation for mediaAlt/i],
    [(candidate) => { delete candidate.projects[0].translations.en.mediaCaption; }, /missing en translation for mediaCaption/i],
    [(candidate) => { delete candidate.projects[0].pdf; }, /missing PDF paths/i],
    [(candidate) => { delete candidate.projects[0].media; }, /missing lead media declaration/i],
    [(candidate) => { candidate.projects[0].blocks = []; }, /missing structural blocks/i],
    [(candidate) => { candidate.projects[0].route = 'projects/../private/'; }, /invalid project route/i],
    [(candidate) => { candidate.projects[0].tech = []; }, /missing technologies/i]
  ];
  for (const [mutate, expected] of mutations) {
    const candidate = clone(data);
    mutate(candidate);
    const rendererErrors = render.dataErrors(candidate);
    assert.match(rendererErrors.join(' '), expected);
    assert.deepEqual(rendererErrors, validator.portfolioDataErrors(candidate));
    assert.equal(render.caseStudyHtml(candidate, 'surgical-navigation', '../../', false, 'en'), '');
  }
});

test('Task 3 review canonical media validation enforces literal slot-compatible types', () => {
  const mutations = [
    [(candidate) => {
      candidate.projects[1].media.lead = {
        id: 'publication-as-lead', type: 'publication', status: 'approved',
        publicPath: 'https://example.com/publication'
      };
    }, /lead: unsupported publication media type/i],
    [(candidate) => { candidate.projects[0].media.video.type = 'image'; }, /video: unsupported image media type/i],
    [(candidate) => { candidate.projects[0].media.poster.type = 'video'; }, /poster: unsupported video media type/i],
    [(candidate) => {
      candidate.projects[0].media.lead = {
        id: 'approved-video', type: 'video', status: 'approved',
        publicPath: 'assets/projects/surgical-navigation/demo.mp4'
      };
      candidate.projects[0].media.poster = {
        id: 'mp4-poster', type: 'image', status: 'approved',
        publicPath: 'assets/projects/surgical-navigation/poster.mp4'
      };
    }, /poster: image media requires an image file/i],
    [(candidate) => {
      candidate.projects[1].media.lead = {
        id: 'local-repository', type: 'repository', status: 'approved',
        publicPath: 'assets/projects/mandibular-fracture/repository.html'
      };
    }, /lead: repository media requires an HTTP\(S\) public URL/i],
    [(candidate) => { candidate.projects[1].media.references[0].type = 'image'; }, /reference 0: unsupported image media type/i]
  ];
  for (const [mutate, expected] of mutations) {
    const candidate = clone(data);
    mutate(candidate);
    const rendererErrors = render.dataErrors(candidate);
    assert.match(rendererErrors.join(' '), expected);
    assert.deepEqual(rendererErrors, validator.portfolioDataErrors(candidate));
    assert.equal(render.homeProjectGalleryHtml(candidate, '', false, 'en'), '');
  }

  const malformedPoster = clone(data.projects[0]);
  malformedPoster.media.lead = {
    id: 'approved-video', type: 'video', status: 'approved',
    publicPath: 'assets/projects/surgical-navigation/demo.mp4'
  };
  malformedPoster.media.poster = {
    id: 'video-poster', type: 'video', status: 'approved',
    publicPath: 'assets/projects/surgical-navigation/poster.mp4'
  };
  const directHtml = render.evidenceMediaHtml(malformedPoster, 'en', '../../', false);
  assert.equal(directHtml, '');
});

test('Task 3 review renderer validation remains browser-UMD and CommonJS safe', () => {
  const browser = { SiteI18n: i18n, URL };
  vm.runInNewContext(fs.readFileSync(rendererPath, 'utf8'), browser);
  assert.equal(typeof browser.PortfolioRender.dataErrors, 'function');
  assert.equal(browser.PortfolioRender.dataErrors(data).length, 0);
  assert.equal(render.dataErrors(data).length, 0);
});

test('Task 3 review rejects unsafe canonical project links before rendering', () => {
  for (const href of [
    'javascript:alert(1)',
    'file:///C:/private/raw/notes.txt',
    'data:text/html,private',
    '../private/raw/notes.html',
    '%2e%2e/private/raw/notes.html'
  ]) {
    const candidate = clone(data);
    candidate.projects[1].links[0].href = href;
    assert.match(render.dataErrors(candidate).join(' '), /unsafe project link/i, href);
    assert.match(validator.portfolioDataErrors(candidate).join(' '), /unsafe project link/i, href);
    assert.equal(render.caseStudyHtml(candidate, 'mandibular-fracture', '../../', false, 'en'), '', href);
  }
  assert.match(render.caseStudyHtml(data, 'mandibular-fracture', '../../', false, 'en'), /href="https:\/\/link\.springer\.com\/article\/10\.1007\/s10278-024-01014-z"/);
});

test('Scholar case article orders header, figure, five sections, gallery, and links', () => {
  const project = clone(data.projects[1]);
  project.blocks = [
    { key: 'text', type: 'text', translations: { ko: { heading: '텍스트', body: '본문' }, en: { heading: 'Text block', body: 'Text body' } } },
    { key: 'list', type: 'list', translations: { ko: { heading: '목록', items: ['하나', '둘'] }, en: { heading: 'List block', items: ['One', 'Two'] } } },
    { key: 'system', type: 'system', translations: { ko: { heading: '시스템', body: '흐름' }, en: { heading: 'System block', body: 'System flow' } } },
    { key: 'evidence', type: 'evidence', translations: { ko: { heading: '근거', body: '증거' }, en: { heading: 'Evidence block', body: 'Evidence body' } } },
    { key: 'limit', type: 'limitation', translations: { ko: { heading: '한계', body: '경계' }, en: { heading: 'Limit block', body: 'Limit body' } } }
  ];
  project.pdfSequence.middle = ['text', 'list', 'system', 'evidence'];
  project.media.lead = { id: 'mandibular-lead', type: 'image', status: 'approved', publicPath: 'assets/projects/mandibular-fracture/lead.png' };
  project.pdfSequence.evidenceId = 'mandibular-lead';
  project.media.gallery = [
    { id: 'mandibular-gallery-1', type: 'image', status: 'approved', publicPath: 'assets/projects/mandibular-fracture/g1.png', translations: { ko: { caption: '첫 그림', alt: '첫 그림 설명' }, en: { caption: 'First gallery figure', alt: 'First gallery alt' } } },
    { id: 'mandibular-gallery-2', type: 'image', status: 'pending-approval' },
    { id: 'mandibular-gallery-3', type: 'image', status: 'approved', publicPath: 'assets/projects/mandibular-fracture/g3.png', translations: { ko: { caption: '셋째', alt: '셋째 설명' }, en: { caption: 'Third gallery figure', alt: 'Third alt' } } }
  ];
  const candidate = clone(data);
  candidate.projects[1] = project;
  const html = render.caseStudyHtml(candidate, project.slug, '../../../', true, 'en');
  assertInOrder(html, ['sc-case__header', 'sc-case__meta', 'sc-case__thesis', 'Figure 1.', '<h2>Problem</h2>', '<h2>Approach</h2>', 'data-block-type="system"', 'data-block-type="text"', 'data-block-type="list"', '<h2>My role</h2>', '<h2>Results and evidence</h2>', 'data-block-type="evidence"', '<h2>Limits and team result</h2>', 'data-block-type="limitation"', 'sc-gallery', 'Figure 2.', 'First gallery figure', 'Figure 3.', 'Third gallery figure', 'sc-case__links'], 'case sequence');
  assert.match(html, /<ul>[\s\S]*<li>One<\/li>[\s\S]*<li>Two<\/li>/);
  assert.doesNotMatch(html, /mandibular-gallery-2|Figure 4\./);
  assert.match(html, /src="\.\.\/\.\.\/\.\.\/assets\/projects\/mandibular-fracture\/g1\.png" alt="First gallery alt"/);
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/assets\/pdfs\/mandibular-fracture-en\.pdf"/);
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/en\/contact\/index\.html"/);
  assert.match(html, new RegExp(project.translations.en.teamResult.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(html, /td-|Decision Timeline|decision-step|Verified · Completed<\/span><span class="td/);
  const pendingGallery = render.caseStudyHtml(data, 'rtms-navigation', '', false, 'ko');
  assert.doesNotMatch(pendingGallery, /sc-gallery/);
});

test('Task 3 all sixteen case shells share one fetch-free, localized renderer contract', () => {
  for (const locale of ['ko', 'en']) {
    for (const project of data.projects) {
      const file = `${locale === 'en' ? 'en/' : ''}projects/${project.slug}/index.html`;
      assert.equal(fs.existsSync(path.join(root, file)), true, `${file}: missing shell`);
      const html = read(file);
      const copy = project.translations[locale];
      assert.match(html, new RegExp(`<html lang="${locale}">`));
      assert.match(html, new RegExp(`data-project="${project.slug}"`));
      assert.match(html, new RegExp(`data-lang="${locale}"`));
      assert.match(html, /data-portfolio="case-study"/);
      assert.match(html, new RegExp(copy.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.match(html, new RegExp(copy.summary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.match(html, new RegExp(`${project.slug}-${locale}\\.pdf`));
      assertInOrder(html, ['site-i18n.js', 'portfolio-data.js', 'portfolio-render.js', 'nav.js'], `${file}: script order`);
      assert.doesNotMatch(html, /fetch\s*\(|fontawesome|bootstrap(?:\.bundle)?\.min\.js|spatial-signal\.js|carousel/i);
    }
  }
});

test('Task 3 mountAll is safe, idempotent, and ignores invalid case mounts', () => {
  const home = { innerHTML: '', getAttribute: () => '' };
  const capabilities = { innerHTML: '', getAttribute: () => '' };
  const highlights = { innerHTML: '', getAttribute: () => '' };
  const projects = { innerHTML: '', getAttribute: () => '' };
  const validCase = { innerHTML: '', getAttribute: (name) => name === 'data-project' ? 'rtms-navigation' : '' };
  const invalidCase = { innerHTML: 'fallback remains', getAttribute: () => 'missing-project' };
  const fakeDocument = {
    body: { getAttribute: (name) => ({ 'data-base': '../../', 'data-lang': 'en' }[name] || '') },
    location: { protocol: 'file:' },
    querySelectorAll(selector) {
      return ({
        '[data-portfolio="home-projects"]': [home],
        '[data-portfolio="capability-index"]': [capabilities],
        '[data-portfolio="home-highlights"]': [highlights],
        '[data-portfolio="project-groups"]': [projects],
        '[data-portfolio="case-study"]': [validCase, invalidCase]
      })[selector] || [];
    }
  };
  assert.doesNotThrow(() => render.mountAll(fakeDocument, data));
  const once = [home.innerHTML, capabilities.innerHTML, highlights.innerHTML, projects.innerHTML, validCase.innerHTML];
  assert.doesNotThrow(() => render.mountAll(fakeDocument, data));
  assert.deepEqual([home.innerHTML, capabilities.innerHTML, highlights.innerHTML, projects.innerHTML, validCase.innerHTML], once);
  assert.equal(invalidCase.innerHTML, 'fallback remains');
  assert.doesNotThrow(() => render.mountAll({ body: null, querySelectorAll: () => [] }, null));
});

test('Task 3 rebuilt pages exclude obsolete scripts and retain HTTP/file-safe metadata', () => {
  const files = ['index.html', 'projects/index.html', 'contact/index.html', 'en/index.html', 'en/projects/index.html', 'en/contact/index.html']
    .concat(slugs.flatMap((slug) => [`projects/${slug}/index.html`, `en/projects/${slug}/index.html`]));
  for (const file of files) {
    const html = read(file);
    assert.match(html, /<main id="main-content"/);
    assert.match(html, /<header id="site-nav"><\/header>/);
    assert.match(html, /<footer id="site-footer"><\/footer>/);
    assert.doesNotMatch(html, /fontawesome|use\.fontawesome|bootstrap(?:\.bundle)?\.min\.js|spatial-signal\.js|data-ss-evidence-strip|carousel/i, file);
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const href = match[1];
      if (/^(?:https?:|mailto:|#)/.test(href)) continue;
      assert.equal(href.endsWith('/'), false, `${file}: directory fallback must end in index.html: ${href}`);
    }
  }
});

test('selected project and CV routes retain paired file-safe locale metadata', () => {
  const pages = [
    { route: 'cv/', file: 'cv/index.html' }
  ].concat(slugs.map((slug) => ({
    route: `projects/${slug}/`,
    file: `projects/${slug}/index.html`
  })));
  for (const page of pages) {
    const files = [page.file, `en/${page.file}`];
    for (const [index, file] of files.entries()) {
      assert.equal(fs.existsSync(path.join(root, file)), true, `${file}: missing paired route`);
      const locale = index === 0 ? 'ko' : 'en';
      const localePrefix = locale === 'en' ? 'en/' : '';
      const html = read(file);
      assert.match(html, new RegExp(`<html lang="${locale}">`), file);
      assert.match(html, new RegExp(`data-lang="${locale}"`), file);
      assert.match(html, new RegExp(`data-route="${page.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), file);
      assert.match(html, new RegExp(`<link rel="canonical" href="https://rafaam11\\.github\\.io/${localePrefix}${page.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), file);
      assert.match(html, /hreflang="ko"/);
      assert.match(html, /hreflang="en"/);
      assert.equal(html.indexOf('site-i18n.js') < html.indexOf('nav.js'), true, `${file}: i18n must precede nav`);
      for (const match of html.matchAll(/href="([^"]+)"/g)) {
        const href = match[1];
        if (/^(?:https?:|mailto:|tel:|#)/.test(href)) continue;
        assert.equal(href.endsWith('/'), false, `${file}: local directory link is not file-safe: ${href}`);
      }
    }
  }
});

test('Scholar Contact invites research collaboration in neutral wording', () => {
  const pages = [
    ['contact/index.html', [/공동연구/, /연구 협력/, /문제/, /데이터|센서/, /검증/, /일정/]],
    ['en/contact/index.html', [/joint research/i, /research collaboration/i, /problem/i, /data|sensors/i, /validation/i, /schedule/i]]
  ];
  for (const [file, patterns] of pages) {
    const html = read(file);
    for (const pattern of patterns) assert.match(html, pattern, `${file}: ${pattern}`);
    assert.match(html, /mailto:uiop3847@naver\.com/);
    assert.match(html, /https:\/\/github\.com\/rafaam11/);
    assert.ok(count(html.match(/<main[\s\S]*<\/main>/)?.[0] || '', '<p') <= 4, `${file}: at most three paragraphs plus the link line`);
    assert.doesNotMatch(html, /<form\b|response time|consultation|채용|박사|진학|이직|PhD|admission|graduate program|job change|td-eyebrow|hero-kicker/i);
  }
});

test('Scholar CSS keeps the quiet researcher palette and no decorative devices', () => {
  const siteCss = read('css/site.css');
  const scholarCss = read('css/scholar.css');
  const css = `${siteCss}\n${scholarCss}`;
  assert.equal(fs.existsSync(path.join(root, 'css', 'spatial-signal.css')), false, 'spatial-signal.css must be deleted');
  for (const value of ['#1a1a1a', '#555', '#e5e5e5', '#1a56db', '--sc-max: 880px']) assert.match(css, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  assert.doesNotMatch(css, /text-transform\s*:\s*uppercase|ui-monospace|SFMono|gradient|box-shadow|--td-|\.td-(?!shell|site-nav|site-footer|cv-|section-heading)/i);
  for (const selector of ['.td-shell', '.td-site-nav', '.td-site-footer', '.td-shell .ss-skip-link', '.sc-intro', '.sc-project-list', '.sc-project', '.sc-project__thumb', '.sc-figure', '.sc-gallery__grid', '.sc-highlights', '.sc-case', '.sc-contact', '.hero-kicker']) {
    assert.ok(cssRuleBodies(css, selector).length, `missing selector ${selector}`);
  }
  assert.ok(cssRuleBodies(siteCss, '.td-site-nav .nav-link').some((body) => /min-height\s*:\s*44px/.test(body)));
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.ok(cssAtRuleBodies(scholarCss, /@media\s*\(max-width:\s*700px\)/i).some((body) => /\.sc-project[\s\S]*grid-template-columns:\s*1fr/.test(body)));
  assert.ok(cssAtRuleBodies(scholarCss, /@media\s*\(max-width:\s*760px\)/i).some((body) => /\.sc-gallery__grid[\s\S]*grid-template-columns:\s*1fr/.test(body)));
  assert.ok(siteCss.split(/\r?\n/).length <= 160, 'site.css stays a small shared shell');
  assert.ok(scholarCss.split(/\r?\n/).length <= 300, 'scholar.css stays compact');
  const ssClasses = [...new Set([...css.matchAll(/\.((?:ss)-[a-z0-9_-]+)/gi)].map((match) => match[1]))].sort();
  assert.deepEqual(ssClasses, ['ss-skip-link']);
});

test('Task 5 exporter produces deterministic public-safe project and CV input', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-pdf-export-'));
  try {
    const first = path.join(temporaryRoot, 'first.json');
    const second = path.join(temporaryRoot, 'second.json');
    for (const output of [first, second]) {
      const result = childProcess.spawnSync(process.execPath, [
        path.join(root, 'scripts', 'export-portfolio-data.cjs'),
        '--output', output
      ], { cwd: root, encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr || result.stdout);
    }
    assert.equal(fs.readFileSync(first, 'utf8'), fs.readFileSync(second, 'utf8'));
    const exported = JSON.parse(fs.readFileSync(first, 'utf8'));
    assert.equal(exported.schemaVersion, 1);
    assert.match(exported.sourceDigest, /^[a-f0-9]{64}$/);
    assert.equal(Object.prototype.hasOwnProperty.call(exported, 'contentVersion'), false);
    assert.deepEqual(exported.projects.map((project) => project.slug), slugs);
    assert.deepEqual(exported.locales, ['ko', 'en']);
    assert.equal(exported.cv.version, '2026-08-21');
    assert.deepEqual(validator.publicCvDataErrors(exported.cv), []);
    assert.doesNotMatch(fs.readFileSync(first, 'utf8'), /(?:(?:^|[\s"'(])(?:[A-Za-z]:[\\/]|\\\\)|file:\/\/|OneDrive|private[\\/]raw)/i);
    assert.doesNotMatch(JSON.stringify(exported.cv), /\b(?:phone|salary|professor|patient|hospital)\b/i);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 publishes exactly sixteen six-page project PDFs and two two-page CV PDFs', () => {
  const projectNames = slugs.flatMap((slug) => ['ko', 'en'].map((locale) => `${slug}-${locale}.pdf`));
  const cvNames = ['jinmin-kim-cv-ko.pdf', 'jinmin-kim-cv-en.pdf'];
  const outputNames = fs.readdirSync(path.join(root, 'output', 'pdf'))
    .filter((name) => name.endsWith('.pdf')).sort();
  assert.deepEqual(outputNames, projectNames.concat(cvNames).sort());
  assert.deepEqual(fs.readdirSync(path.join(root, 'assets', 'pdfs')).filter((name) => name.endsWith('.pdf')).sort(), projectNames.sort());
  assert.deepEqual(fs.readdirSync(path.join(root, 'assets', 'cv')).filter((name) => name.endsWith('.pdf')).sort(), cvNames.sort());

  for (const name of projectNames) {
    const asset = path.join(root, 'assets', 'pdfs', name);
    const output = path.join(root, 'output', 'pdf', name);
    const bytes = fs.readFileSync(asset);
    assert.equal(bytes.subarray(0, 5).toString('ascii'), '%PDF-');
    assert.ok(bytes.length > 12_000, `${name}: unexpectedly small PDF`);
    assert.equal(pdfPageCount(asset), 6, `${name}: project PDF page count`);
    assert.equal(sha256(asset), sha256(output), `${name}: output/assets checksum mismatch`);
    assert.match(bytes.toString('latin1'), /\/URI\s*\(mailto:uiop3847@naver\.com\)/);
    // Compressed stream bodies (embedded images) are binary; only dictionaries and metadata can leak a path.
    assert.doesNotMatch(bytes.toString('latin1').replace(/stream\r?\n[\s\S]*?endstream/g, 'stream endstream'), /(?:^|[\s"'(])(?:[A-Za-z]:[\\/]|\\\\)|file:\/\/|OneDrive|private[\\/]raw/i);
  }
  for (const name of cvNames) {
    const asset = path.join(root, 'assets', 'cv', name);
    const output = path.join(root, 'output', 'pdf', name);
    const bytes = fs.readFileSync(asset);
    assert.equal(bytes.subarray(0, 5).toString('ascii'), '%PDF-');
    assert.ok(bytes.length > 12_000, `${name}: unexpectedly small PDF`);
    assert.equal(pdfPageCount(asset), 2, `${name}: CV PDF page count`);
    assert.equal(sha256(asset), sha256(output), `${name}: output/assets checksum mismatch`);
  }
  assert.deepEqual(validator.pdfArtifactErrors(root), []);
});

test('Task 5 lifecycle follow-up keeps canonical evidence and lifecycle status on all sixteen PDF covers', (t) => {
  const python = task5Python();
  if (!fs.existsSync(python)) return t.skip('Task 5 ignored PDF virtual environment is unavailable.');
  const expected = {
    'surgical-navigation': { ko: '진행 중', en: 'Ongoing' },
    'mandibular-fracture': { ko: '검증됨 · 완료', en: 'Verified · Completed' },
    'life-careverse': { ko: '진행 중', en: 'Ongoing' },
    'rtms-navigation': { ko: '프로토타입 · 진행 중', en: 'Prototype · Ongoing' },
    'respiratory-surface-guidance': { ko: '진행 중 · 연구', en: 'Ongoing · Research' },
    'skadi-tracking-software': { ko: '진행 중', en: 'Ongoing' },
    'unmanned-forklift': { ko: '진행 중', en: 'Ongoing' },
    'ai-build-lab': { ko: '진행 중', en: 'Ongoing' }
  };
  assert.deepEqual(Object.fromEntries(data.projects.map((project) => [
    project.slug,
    { ko: project.translations.ko.status, en: project.translations.en.status }
  ])), expected);

  const auditCode = [
    'import json, sys',
    'from pathlib import Path',
    'from pypdf import PdfReader',
    'root = Path(sys.argv[1])',
    'slugs = json.loads(sys.argv[2])',
    'covers = {}',
    'for slug in slugs:',
    '    for locale in ("ko", "en"):',
    '        path = root / "assets" / "pdfs" / f"{slug}-{locale}.pdf"',
    '        covers[f"{slug}:{locale}"] = PdfReader(str(path)).pages[0].extract_text() or ""',
    'print(json.dumps(covers, ensure_ascii=False))'
  ].join('\n');
  const audit = childProcess.spawnSync(python, ['-c', auditCode, root, JSON.stringify(slugs)], {
    cwd: root, encoding: 'utf8', timeout: 30_000
  });
  assert.equal(audit.status, 0, audit.stderr || audit.stdout);
  const covers = JSON.parse(audit.stdout);
  for (const [slug, translations] of Object.entries(expected)) {
    for (const locale of ['ko', 'en']) {
      assert.ok(covers[`${slug}:${locale}`].includes(translations[locale]),
        `${slug}-${locale}.pdf cover must expose ${translations[locale]}`);
    }
  }
  assert.doesNotMatch(Object.values(covers).join('\n'), /(?:Ongoing\s*·\s*Ongoing|진행 중\s*·\s*진행 중)/i);
});

test('Task 5 case routes expose their localized stable PDF artifacts', () => {
  for (const project of data.projects) {
    for (const locale of ['ko', 'en']) {
      const prefix = locale === 'en' ? 'en/' : '';
      const html = read(`${prefix}projects/${project.slug}/index.html`);
      const expected = `${locale === 'en' ? '../../../' : '../../'}${project.pdf[locale]}`;
      assert.match(html, new RegExp(`href="${expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
      assert.equal(fs.existsSync(path.join(root, project.pdf[locale])), true);
    }
  }
});

test('Task 5 CV pages provide localized PDF object, raster previews, open, and download fallbacks', () => {
  const pages = [
    { file: 'cv/index.html', locale: 'ko', base: '../', intro: /3D 정합과 로봇 소프트웨어/, open: /PDF 열기/, download: /PDF 다운로드/, alt: /국문 이력서 .*페이지/ },
    { file: 'en/cv/index.html', locale: 'en', base: '../../', intro: /3D registration and robot software/i, open: /Open PDF/, download: /Download PDF/, alt: /English CV page/ }
  ];
  for (const page of pages) {
    const html = read(page.file);
    const pdf = `${page.base}assets/cv/jinmin-kim-cv-${page.locale}.pdf`;
    assert.match(html, page.intro);
    assert.match(html, new RegExp(`<object[^>]+data="${pdf.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]+type="application/pdf"`));
    for (const pageNumber of [1, 2]) {
      const preview = `${page.base}assets/cv/jinmin-kim-cv-${page.locale}-page-${pageNumber}.png`;
      assert.match(html, new RegExp(`<img[^>]+src="${preview.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]+alt="[^"]+"`));
      assert.equal(fs.existsSync(path.join(root, 'assets', 'cv', `jinmin-kim-cv-${page.locale}-page-${pageNumber}.png`)), true);
    }
    assert.match(html, page.open);
    assert.match(html, page.download);
    assert.match(html, new RegExp(`<a[^>]+href="${pdf.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]+target="_blank"[^>]+rel="noopener"`));
    assert.match(html, new RegExp(`<a[^>]+href="${pdf.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]+download`));
    assert.match(html, page.alt);
    assert.doesNotMatch(html, /fontawesome|bootstrap(?:\.bundle)?\.min\.js|styles\.css|cv-theme\.css/i);
  }
});

test('Task 5 public CV surfaces exclude private and unverified claims', () => {
  const cvData = JSON.parse(read('data/public-cv.json'));
  assert.deepEqual(validator.publicCvDataErrors(cvData), []);
  const publicCv = [
    JSON.stringify(cvData),
    read('cv/index.html'),
    read('en/cv/index.html')
  ].join('\n');
  assert.doesNotMatch(publicCv, /(?:\b\d{2,3}-\d{3,4}-\d{4}\b|\b10-\d{4}-\d+\b|\b(?:age|salary|professor|advisor|patient|customer)\b|나이|연봉|지도교수|환자|고객|3\s*[–-]\s*4개월|1\s*[–-]\s*2주|주\s*단위|월\s*단위)/i);
  assert.match(publicCv, /7/);
  assert.match(publicCv, /3/);
  assert.match(publicCv, /9/);
  assert.match(publicCv, /JLPT N2/);
  assert.match(publicCv, /s10278-024-01014-z/);
});

test('Task 5 standalone PDF validator reports missing or malformed CV data without throwing', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-pdf-validator-'));
  try {
    for (const relativePath of ['output/pdf', 'assets/pdfs', 'assets/cv']) {
      fs.cpSync(path.join(root, relativePath), path.join(temporaryRoot, relativePath), { recursive: true });
    }
    for (const relativePath of ['cv/index.html', 'en/cv/index.html']) {
      const target = path.join(temporaryRoot, relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(root, relativePath), target);
    }
    assert.doesNotThrow(() => validator.pdfArtifactErrors(temporaryRoot));
    assert.match(validator.pdfArtifactErrors(temporaryRoot).join(' '), /missing public CV data/i);

    const cvPath = path.join(temporaryRoot, 'data', 'public-cv.json');
    fs.mkdirSync(path.dirname(cvPath), { recursive: true });
    fs.writeFileSync(cvPath, '{ malformed');
    assert.doesNotThrow(() => validator.pdfArtifactErrors(temporaryRoot));
    assert.match(validator.pdfArtifactErrors(temporaryRoot).join(' '), /malformed public CV data/i);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 public CV validation is total and rejects malformed nested data and private contact variants', () => {
  const approved = JSON.parse(read('data/public-cv.json'));
  assert.deepEqual(validator.publicCvDataErrors(approved), []);

  const malformed = [
    null,
    {},
    { ...clone(approved), identity: null },
    { ...clone(approved), identity: { name: 'Jinmin Kim', translations: null } },
    { ...clone(approved), contacts: [null, null, null] },
    { ...clone(approved), timeline: [null, null, null, null] },
    { ...clone(approved), capabilities: [null, null, null, null] },
    { ...clone(approved), research: [null, null] },
    { ...clone(approved), achievements: { patentApplications: 7, patentGrants: 3, awardTotal: 9, selectedAwards: [null] } },
    { ...clone(approved), languages: [null, null] }
  ];
  for (const candidate of malformed) {
    assert.doesNotThrow(() => validator.publicCvDataErrors(candidate));
    assert.ok(validator.publicCvDataErrors(candidate).length > 0);
  }

  for (const privateValue of [
    '31세', '010 1234 5678', '010-1234-5678', '(010) 1234 5678', '+82 10 1234 5678',
    '서울시 강남구', '부산광역시 해운대구', '경기도 성남시', '강남구 역삼동', '역삼동 123', '테헤란로 123'
  ]) {
    const candidate = clone(approved);
    candidate.identity.translations.ko.summary = privateValue;
    assert.match(validator.publicCvDataErrors(candidate).join(' '), /prohibited|private|address|phone|age/i, privateValue);
  }

  const smuggledPhone = clone(approved);
  smuggledPhone.contacts[1] = { label: 'Phone', value: '010 1234 5678', href: 'tel:01012345678' };
  assert.match(validator.publicCvDataErrors(smuggledPhone).join(' '), /contact|phone|prohibited/i);
  const wrongHost = clone(approved);
  wrongHost.contacts[1].href = 'https://example.com/rafaam11';
  assert.match(validator.publicCvDataErrors(wrongHost).join(' '), /contact/i);
});

test('Task 5 generator rejects malformed nested input atomically with a controlled error', (t) => {
  const python = task5Python();
  if (!fs.existsSync(python)) return t.skip('Task 5 ignored PDF virtual environment is unavailable.');
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-pdf-atomic-'));
  try {
    copyTask5Surface(temporaryRoot);
    const input = path.join(temporaryRoot, 'input.json');
    const exportResult = childProcess.spawnSync(process.execPath, [
      path.join(root, 'scripts', 'export-portfolio-data.cjs'), '--output', input
    ], { cwd: root, encoding: 'utf8' });
    assert.equal(exportResult.status, 0, exportResult.stderr || exportResult.stdout);
    const malformed = JSON.parse(fs.readFileSync(input, 'utf8'));
    malformed.projects[0].translations.ko = null;
    fs.writeFileSync(input, `${JSON.stringify(malformed, null, 2)}\n`);
    const before = treeFileHashes(temporaryRoot);
    const result = childProcess.spawnSync(python, [
      path.join(root, 'scripts', 'generate-portfolio-pdfs.py'),
      '--input', input,
      '--output-dir', path.join(temporaryRoot, 'output', 'pdf'),
      '--publish-root', temporaryRoot
    ], { cwd: root, encoding: 'utf8', timeout: 120_000 });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /^PDF generation failed: [^\r\n]+\r?\n$/);
    assert.doesNotMatch(result.stderr, /Traceback/);
    assert.deepEqual(treeFileHashes(temporaryRoot), before);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 generator publishes CV previews and digest manifest without a review directory', (t) => {
  const python = task5Python();
  if (!fs.existsSync(python)) return t.skip('Task 5 ignored PDF virtual environment is unavailable.');
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-pdf-no-review-'));
  try {
    copyApprovedEvidence(temporaryRoot);
    const input = path.join(temporaryRoot, 'input.json');
    const exportResult = childProcess.spawnSync(process.execPath, [
      path.join(root, 'scripts', 'export-portfolio-data.cjs'), '--output', input
    ], { cwd: root, encoding: 'utf8' });
    assert.equal(exportResult.status, 0, exportResult.stderr || exportResult.stdout);
    const result = childProcess.spawnSync(python, [
      path.join(root, 'scripts', 'generate-portfolio-pdfs.py'),
      '--input', input,
      '--output-dir', path.join(temporaryRoot, 'output', 'pdf'),
      '--publish-root', temporaryRoot
    ], { cwd: root, encoding: 'utf8', timeout: 120_000 });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const manifest = JSON.parse(fs.readFileSync(path.join(temporaryRoot, 'output', 'pdf', 'manifest.json'), 'utf8'));
    assert.equal(manifest.schemaVersion, 3);
    assert.equal(manifest.generatorVersion, '3.0');
    assert.equal(manifest.generatorSha256, sha256(path.join(root, 'scripts', 'generate-portfolio-pdfs.py')));
    assert.match(manifest.sourceDigest, /^[a-f0-9]{64}$/);
    const previews = manifest.artifacts.filter((artifact) => artifact.kind === 'cv-preview');
    assert.equal(previews.length, 4);
    for (const preview of previews) {
      assert.equal(fs.existsSync(path.join(temporaryRoot, preview.path)), true, preview.path);
      assert.equal(sha256(path.join(temporaryRoot, preview.path)), preview.sha256);
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 manifest freshness follows canonical project, evidence, and public CV content', () => {
  const manifest = JSON.parse(read('output/pdf/manifest.json'));
  assert.equal(manifest.schemaVersion, 3);
  assert.match(manifest.sourceDigest, /^[a-f0-9]{64}$/);
  assert.equal(manifest.artifacts.length, 40);
  assert.equal(manifest.artifacts.filter((artifact) => artifact.kind === 'cv-preview').length, 4);

  const changedPortfolio = clone(data);
  changedPortfolio.projects[0].translations.en.title += ' changed';
  assert.match(validator.pdfArtifactErrors(root, changedPortfolio).join(' '), /source digest|stale/i);

  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-pdf-stale-cv-'));
  try {
    copyTask5Surface(temporaryRoot);
    const cvPath = path.join(temporaryRoot, 'data', 'public-cv.json');
    const changedCv = JSON.parse(fs.readFileSync(cvPath, 'utf8'));
    changedCv.identity.translations.en.headline += ' changed';
    fs.writeFileSync(cvPath, `${JSON.stringify(changedCv, null, 2)}\n`);
    assert.match(validator.pdfArtifactErrors(temporaryRoot).join(' '), /source digest|stale/i);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 integrated review requires four project-specific middle blocks and eight diagram contracts', () => {
  const expectedKinds = new Map([
    ['surgical-navigation', 'coordinate-chain'],
    ['mandibular-fracture', 'optimization-loop'],
    ['life-careverse', 'sync-topology'],
    ['rtms-navigation', 'navigation-loop'],
    ['respiratory-surface-guidance', 'surface-gating-chain'],
    ['skadi-tracking-software', 'tracking-sdk-stack'],
    ['unmanned-forklift', 'sensor-convergence'],
    ['ai-build-lab', 'product-loop']
  ]);
  const seenKinds = new Set();
  for (const project of data.projects) {
    assert.ok(project.pdfSequence && typeof project.pdfSequence === 'object', `${project.slug}: missing pdfSequence`);
    assert.deepEqual(project.pdfSequence.middle, project.blocks.map((block) => block.key), `${project.slug}: middle sequence`);
    assert.equal(project.pdfSequence.evidenceId, project.media.lead.id, `${project.slug}: evidence selection`);
    assert.equal(project.pdfSequence.diagram.kind, expectedKinds.get(project.slug), `${project.slug}: diagram kind`);
    assert.equal(seenKinds.has(project.pdfSequence.diagram.kind), false, `${project.slug}: duplicate diagram kind`);
    seenKinds.add(project.pdfSequence.diagram.kind);
    for (const locale of ['ko', 'en']) {
      const diagram = project.pdfSequence.diagram.translations[locale];
      assert.equal(typeof diagram.title, 'string');
      assert.equal(diagram.title.trim().length > 0, true);
      assert.equal(diagram.nodes.length, 4);
      assert.equal(diagram.nodes.every((node) => typeof node === 'string' && node.trim()), true);
    }
  }
  assert.equal(seenKinds.size, 8);
  assert.deepEqual(validator.portfolioDataErrors(data), []);

  const malformed = clone(data);
  malformed.projects[0].pdfSequence.middle[1] = 'unknown-middle-block';
  malformed.projects[1].pdfSequence.diagram.kind = malformed.projects[0].pdfSequence.diagram.kind;
  assert.match(validator.portfolioDataErrors(malformed).join('\n'), /pdf sequence|middle block|diagram kind|unique/i);
});

test('Task 5 integrated review renders each middle block on its contracted page and embeds approved local evidence', (t) => {
  const python = task5Python();
  if (!fs.existsSync(python)) return t.skip('Task 5 ignored PDF virtual environment is unavailable.');
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-pdf-sequence-'));
  try {
    const input = path.join(temporaryRoot, 'input.json');
    const exportResult = childProcess.spawnSync(process.execPath, [
      path.join(root, 'scripts', 'export-portfolio-data.cjs'), '--output', input
    ], { cwd: root, encoding: 'utf8' });
    assert.equal(exportResult.status, 0, exportResult.stderr || exportResult.stdout);
    const payload = JSON.parse(fs.readFileSync(input, 'utf8'));
    const localEvidence = payload.evidence.find((entry) => entry.id === 'mandibular-fracture-lead-01');
    localEvidence.type = 'image';
    localEvidence.state = 'approved-public';
    localEvidence.source = 'assets/projects/mandibular-fracture/approved-demo.png';
    const imageProject = payload.projects.find((entry) => entry.slug === 'mandibular-fracture');
    imageProject.media.lead = {
      id: localEvidence.id, type: 'image', status: 'approved', publicPath: localEvidence.source
    };
    const source = clone(payload);
    delete source.sourceDigest;
    payload.sourceDigest = crypto.createHash('sha256').update(JSON.stringify(source), 'utf8').digest('hex');
    fs.writeFileSync(input, `${JSON.stringify(payload, null, 2)}\n`);
    copyApprovedEvidence(temporaryRoot);
    const approvedPath = path.join(temporaryRoot, ...localEvidence.source.split('/'));
    fs.mkdirSync(path.dirname(approvedPath), { recursive: true });
    fs.copyFileSync(path.join(root, 'assets', 'cv', 'jinmin-kim-cv-ko-page-1.png'), approvedPath);

    const generation = childProcess.spawnSync(python, [
      path.join(root, 'scripts', 'generate-portfolio-pdfs.py'),
      '--input', input,
      '--output-dir', path.join(temporaryRoot, 'output', 'pdf'),
      '--publish-root', temporaryRoot
    ], { cwd: root, encoding: 'utf8', timeout: 120_000 });
    assert.equal(generation.status, 0, generation.stderr || generation.stdout);

    const auditCode = [
      'import json, sys',
      'from pathlib import Path',
      'from pypdf import PdfReader',
      'root = Path(sys.argv[1])',
      'slugs = json.loads(sys.argv[2])',
      'result = {}',
      'for slug in slugs:',
      '    reader = PdfReader(str(root / "output" / "pdf" / f"{slug}-en.pdf"))',
      '    result[slug] = [(page.extract_text() or "") for page in reader.pages[1:5]]',
      'page = PdfReader(str(root / "output" / "pdf" / "surgical-navigation-en.pdf")).pages[3]',
      'xobjects = (page.get("/Resources") or {}).get("/XObject") or {}',
      'result["approvedImage"] = any(ref.get_object().get("/Subtype") == "/Image" for ref in xobjects.values())',
      'print(json.dumps(result))'
    ].join('\n');
    const audit = childProcess.spawnSync(python, ['-c', auditCode, temporaryRoot, JSON.stringify(slugs)], {
      cwd: root, encoding: 'utf8', timeout: 30_000
    });
    assert.equal(audit.status, 0, audit.stderr || audit.stdout);
    const pages = JSON.parse(audit.stdout);
    for (const project of payload.projects) {
      for (let index = 0; index < 4; index += 1) {
        const key = project.pdfSequence.middle[index];
        const block = project.blocks.find((candidate) => candidate.key === key);
        assert.ok(pages[project.slug][index].includes(block.translations.en.heading), `${project.slug}: page ${index + 2} omits ${key}`);
      }
      assert.ok(pages[project.slug][1].includes(project.pdfSequence.diagram.translations.en.title), `${project.slug}: diagram title`);
    }
    assert.equal(pages.approvedImage, true, 'approved local image must be placed on evidence page');
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 integrated review embeds an approved poster instead of opening a video lead as an image', (t) => {
  const python = task5Python();
  if (!fs.existsSync(python)) return t.skip('Task 5 ignored PDF virtual environment is unavailable.');
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-pdf-video-poster-'));
  try {
    const input = path.join(temporaryRoot, 'input.json');
    const exportResult = childProcess.spawnSync(process.execPath, [
      path.join(root, 'scripts', 'export-portfolio-data.cjs'), '--output', input
    ], { cwd: root, encoding: 'utf8' });
    assert.equal(exportResult.status, 0, exportResult.stderr || exportResult.stdout);

    const payload = JSON.parse(fs.readFileSync(input, 'utf8'));
    const project = payload.projects.find((entry) => entry.slug === 'surgical-navigation');
    const videoPath = 'assets/projects/surgical-navigation/approved-demo.mp4';
    const posterPath = 'assets/projects/surgical-navigation/approved-demo-poster.png';
    project.media.lead = { id: 'surgical-navigation-clip-01', type: 'video', status: 'approved', publicPath: videoPath };
    project.media.video = { ...project.media.lead };
    project.media.poster = {
      id: 'surgical-navigation-poster-01', type: 'image', status: 'approved', publicPath: posterPath
    };
    for (const entry of payload.evidence) {
      if (entry.id === project.media.lead.id) Object.assign(entry, { type: 'video', state: 'approved-public', source: videoPath });
      if (entry.id === project.media.poster.id) Object.assign(entry, { type: 'image', state: 'approved-public', source: posterPath });
    }
    const source = clone(payload);
    delete source.sourceDigest;
    payload.sourceDigest = crypto.createHash('sha256').update(JSON.stringify(source), 'utf8').digest('hex');
    fs.writeFileSync(input, `${JSON.stringify(payload, null, 2)}\n`);

    copyApprovedEvidence(temporaryRoot);
    const video = path.join(temporaryRoot, ...videoPath.split('/'));
    const poster = path.join(temporaryRoot, ...posterPath.split('/'));
    fs.mkdirSync(path.dirname(video), { recursive: true });
    fs.writeFileSync(video, validMp4());
    fs.copyFileSync(path.join(root, 'assets', 'cv', 'jinmin-kim-cv-ko-page-1.png'), poster);

    const generation = childProcess.spawnSync(python, [
      path.join(root, 'scripts', 'generate-portfolio-pdfs.py'),
      '--input', input,
      '--output-dir', path.join(temporaryRoot, 'output', 'pdf'),
      '--publish-root', temporaryRoot
    ], { cwd: root, encoding: 'utf8', timeout: 120_000 });
    assert.equal(generation.status, 0, generation.stderr || generation.stdout);

    const audit = childProcess.spawnSync(python, ['-c', [
      'import sys',
      'from pypdf import PdfReader',
      'page = PdfReader(sys.argv[1]).pages[3]',
      'xobjects = (page.get("/Resources") or {}).get("/XObject") or {}',
      'print(any(ref.get_object().get("/Subtype") == "/Image" for ref in xobjects.values()))'
    ].join('\n'), path.join(temporaryRoot, 'output', 'pdf', 'surgical-navigation-en.pdf')], {
      cwd: root, encoding: 'utf8', timeout: 30_000
    });
    assert.equal(audit.status, 0, audit.stderr || audit.stdout);
    assert.equal(audit.stdout.trim(), 'True', 'approved video evidence must use its approved image poster in the PDF');
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 integrated review failure preserves all existing public PDF trees byte-for-byte', (t) => {
  const python = task5Python();
  if (!fs.existsSync(python)) return t.skip('Task 5 ignored PDF virtual environment is unavailable.');
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-pdf-review-atomic-'));
  try {
    copyTask5Surface(temporaryRoot);
    const input = path.join(temporaryRoot, 'input.json');
    const exportResult = childProcess.spawnSync(process.execPath, [
      path.join(root, 'scripts', 'export-portfolio-data.cjs'), '--output', input
    ], { cwd: root, encoding: 'utf8' });
    assert.equal(exportResult.status, 0, exportResult.stderr || exportResult.stdout);
    const payload = JSON.parse(fs.readFileSync(input, 'utf8'));
    payload.projects[0].translations.en.title += ' staged review failure';
    const source = clone(payload);
    delete source.sourceDigest;
    payload.sourceDigest = crypto.createHash('sha256').update(JSON.stringify(source), 'utf8').digest('hex');
    fs.writeFileSync(input, `${JSON.stringify(payload, null, 2)}\n`);
    const before = Object.fromEntries(['output/pdf', 'assets/pdfs', 'assets/cv'].map((relativePath) => [
      relativePath, treeFileHashes(path.join(temporaryRoot, relativePath))
    ]));
    const driver = [
      'import importlib.util, sys',
      'from pathlib import Path',
      'module_path, input_path, target_root, regular, bold = map(Path, sys.argv[1:6])',
      'spec = importlib.util.spec_from_file_location("portfolio_pdf_generator", module_path)',
      'module = importlib.util.module_from_spec(spec)',
      'spec.loader.exec_module(module)',
      'payload = module.load_export(input_path)',
      'deps = module.import_pdf_dependencies()',
      'module.register_fonts(deps, regular, bold)',
      'def fail_review(*args, **kwargs):',
      '    raise RuntimeError("simulated review verification failure")',
      'module.render_reviews = fail_review',
      'try:',
      '    module.generate(payload, deps, target_root / "output" / "pdf", target_root, target_root / "review")',
      'except Exception as error:',
      '    print(f"PDF generation failed: {error}", file=sys.stderr)',
      '    raise SystemExit(1)',
      'raise SystemExit(0)'
    ].join('\n');
    const result = childProcess.spawnSync(python, [
      '-c', driver,
      path.join(root, 'scripts', 'generate-portfolio-pdfs.py'),
      input,
      temporaryRoot,
      'C:\\Windows\\Fonts\\malgun.ttf',
      'C:\\Windows\\Fonts\\malgunbd.ttf'
    ], { cwd: root, encoding: 'utf8', timeout: 120_000 });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /^PDF generation failed: simulated review verification failure\r?\n$/);
    assert.doesNotMatch(result.stderr, /Traceback/);
    for (const relativePath of ['output/pdf', 'assets/pdfs', 'assets/cv']) {
      assert.deepEqual(treeFileHashes(path.join(temporaryRoot, relativePath)), before[relativePath], relativePath);
    }
    const leakedTransactions = fs.readdirSync(path.join(temporaryRoot, 'output'))
      .concat(fs.readdirSync(path.join(temporaryRoot, 'assets')))
      .filter((name) => /\.(?:stage|backup)-/.test(name));
    assert.deepEqual(leakedTransactions, []);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 integrated review manifest binds artifacts to the current generator source', () => {
  const manifest = JSON.parse(read('output/pdf/manifest.json'));
  const generatorPath = path.join(root, 'scripts', 'generate-portfolio-pdfs.py');
  assert.equal(manifest.schemaVersion, 3);
  assert.match(manifest.generatorVersion, /^\d+\.\d+$/);
  assert.equal(manifest.generatorSha256, sha256(generatorPath));

  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-pdf-generator-stale-'));
  try {
    copyTask5Surface(temporaryRoot);
    fs.appendFileSync(path.join(temporaryRoot, 'scripts', 'generate-portfolio-pdfs.py'), '\n# stale layout mutation\n');
    assert.match(validator.pdfArtifactErrors(temporaryRoot).join('\n'), /generator.*(?:hash|stale)|stale.*generator/i);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 integrated review CV HTML intrinsic dimensions match the 1241x1754 previews', () => {
  for (const relativePath of ['cv/index.html', 'en/cv/index.html']) {
    const html = read(relativePath);
    const images = [...html.matchAll(/<img[^>]+jinmin-kim-cv-(?:ko|en)-page-[12]\.png[^>]*>/g)];
    assert.equal(images.length, 2, relativePath);
    for (const image of images) {
      assert.match(image[0], /\bwidth="1241"/);
      assert.match(image[0], /\bheight="1754"/);
    }
  }

  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-cv-preview-size-'));
  try {
    copyTask5Surface(temporaryRoot);
    const cvPath = path.join(temporaryRoot, 'cv', 'index.html');
    fs.writeFileSync(cvPath, fs.readFileSync(cvPath, 'utf8').replace('width="1241"', 'width="1240"'));
    assert.match(validator.pdfArtifactErrors(temporaryRoot).join('\n'), /cv\/index\.html.*preview.*dimension|intrinsic.*dimension/i);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 CV pages expose a concise semantic HTML summary without relying on PDF tags', () => {
  const pages = [
    { file: 'cv/index.html', identity: /김진민/, timeline: /DIGITRACK/, capability: /3D 정합 및 최적화/, evidence: /공동 제1저자/, boundary: /출원 7건.*등록 3건.*수상 9건/s },
    { file: 'en/cv/index.html', identity: /Jinmin Kim/, timeline: /DIGITRACK/, capability: /3D Registration and Optimization/, evidence: /Joint first author/, boundary: /7 applications.*3 grants.*9 awards/s }
  ];
  for (const page of pages) {
    const html = read(page.file);
    assert.match(html, /<section[^>]+data-cv-summary[^>]+aria-labelledby=/);
    assert.match(html, /<h2\b/);
    assert.match(html, /<ol\b/);
    assert.match(html, /<ul\b/);
    assert.match(html, /<dl\b/);
    assert.match(html, page.identity);
    assert.match(html, page.timeline);
    assert.match(html, page.capability);
    assert.match(html, page.evidence);
    assert.match(html, page.boundary);
  }
});

test('Task 5 review round 2 rejects reviewer PII variants in public CV data without false positives', () => {
  const approved = JSON.parse(read('data/public-cv.json'));
  const reviewerVariants = [
    '31 years old',
    '31-year-old engineer',
    '010/1234/5678',
    '010·1234·5678',
    '+82 (10) 1234-5678',
    '123 Teheran-ro, Gangnam-gu, Seoul',
    '31세',
    '서울시 강남구'
  ];
  assert.deepEqual(validator.publicCvDataErrors(approved), []);
  for (const privateValue of reviewerVariants) {
    const candidate = clone(approved);
    candidate.identity.translations.en.summary = privateValue;
    assert.doesNotThrow(() => validator.publicCvDataErrors(candidate), privateValue);
    assert.match(validator.publicCvDataErrors(candidate).join(' '), /private|prohibited|age|phone|address/i, privateValue);
  }
});

test('Task 5 public PII scanner is total and permits approved dates, links, page labels, and technical hyphens', () => {
  assert.equal(typeof validator.publicPiiFindings, 'function');
  const cyclic = { safe: '3D registration' };
  cyclic.self = cyclic;
  for (const malformed of [null, undefined, 42, Symbol('safe'), cyclic, { nested: [null, { value: 'safe' }] }]) {
    assert.doesNotThrow(() => validator.publicPiiFindings(malformed));
  }
  const safeValues = [
    'https://link.springer.com/article/10.1007/s10278-024-01014-z',
    '2023-02 - 2026-08-17',
    '1 / 2',
    'optimized jawbone-reduction model',
    'joint-first-author evidence',
    read('data/public-cv.json'),
    read('cv/index.html'),
    read('en/cv/index.html')
  ];
  for (const safeValue of safeValues) assert.deepEqual(validator.publicPiiFindings(safeValue), [], safeValue.slice?.(0, 80));
});

test('Task 5 PDF validator rejects reviewer PII variants injected into either public CV HTML page', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-cv-html-pii-'));
  try {
    copyTask5Surface(temporaryRoot);
    const variants = ['31 years old', '010/1234/5678', '010·1234·5678', '+82 (10) 1234-5678', '123 Teheran-ro, Gangnam-gu, Seoul', '서울시 강남구'];
    for (const relativePath of ['cv/index.html', 'en/cv/index.html']) {
      const htmlPath = path.join(temporaryRoot, relativePath);
      const original = fs.readFileSync(htmlPath, 'utf8');
      for (const privateValue of variants) {
        fs.writeFileSync(htmlPath, original.replace('</main>', `<p>${privateValue}</p>\n  </main>`));
        assert.match(validator.pdfArtifactErrors(temporaryRoot).join(' '), /CV HTML.*private|public surface.*PII/i, `${relativePath}: ${privateValue}`);
      }
      fs.writeFileSync(htmlPath, original);
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 Python validate-only rejects expanded PII variants with controlled errors', (t) => {
  const python = task5Python();
  if (!fs.existsSync(python)) return t.skip('Task 5 ignored PDF virtual environment is unavailable.');
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-python-pii-'));
  try {
    const input = path.join(temporaryRoot, 'input.json');
    const exportResult = childProcess.spawnSync(process.execPath, [
      path.join(root, 'scripts', 'export-portfolio-data.cjs'), '--output', input
    ], { cwd: root, encoding: 'utf8' });
    assert.equal(exportResult.status, 0, exportResult.stderr || exportResult.stdout);
    const approved = JSON.parse(fs.readFileSync(input, 'utf8'));
    const approvedResult = childProcess.spawnSync(python, [
      path.join(root, 'scripts', 'generate-portfolio-pdfs.py'), '--input', input, '--validate-only'
    ], { cwd: root, encoding: 'utf8' });
    assert.equal(approvedResult.status, 0, approvedResult.stderr || approvedResult.stdout);

    for (const privateValue of ['31 years old', '31-year-old engineer', '010/1234/5678', '010·1234·5678', '+82 (10) 1234-5678', '123 Teheran-ro, Gangnam-gu, Seoul']) {
      const payload = clone(approved);
      payload.cv.identity.translations.en.summary = privateValue;
      const source = { ...payload };
      delete source.sourceDigest;
      payload.sourceDigest = crypto.createHash('sha256').update(JSON.stringify(source), 'utf8').digest('hex');
      fs.writeFileSync(input, `${JSON.stringify(payload, null, 2)}\n`);
      const result = childProcess.spawnSync(python, [
        path.join(root, 'scripts', 'generate-portfolio-pdfs.py'), '--input', input, '--validate-only'
      ], { cwd: root, encoding: 'utf8' });
      assert.equal(result.status, 1, privateValue);
      assert.match(result.stderr, /^PDF generation failed: [^\r\n]+\r?\n$/, privateValue);
      assert.match(result.stderr, /age|phone|address|private/i, privateValue);
      assert.doesNotMatch(result.stderr, /Traceback/, privateValue);
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 semantic CV renderer escapes canonical values and refuses unsafe public links', () => {
  const summary = require('../scripts/public-cv-summary.cjs');
  const cv = JSON.parse(read('data/public-cv.json'));
  cv.identity.translations.en.displayName = '<img src=x onerror="alert(1)">';
  cv.research[0].title = '<script>alert(1)</script>';
  const rendered = summary.renderPublicCvSummary(cv, 'en');
  assert.match(rendered.sourceDigest, /^[a-f0-9]{64}$/);
  assert.match(rendered.summaryDigest, /^[a-f0-9]{64}$/);
  assert.match(rendered.html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(rendered.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(rendered.html, /<img|<script>/i);

  const unsafe = JSON.parse(read('data/public-cv.json'));
  unsafe.research[0].href = 'javascript:alert(1)';
  assert.throws(() => summary.renderPublicCvSummary(unsafe, 'en'), /safe HTTPS/i);
});

test('Task 5 summary refresh is deterministic, exact, and preserves unrelated page content', () => {
  const summary = require('../scripts/public-cv-summary.cjs');
  const cv = JSON.parse(read('data/public-cv.json'));
  for (const locale of ['ko', 'en']) {
    const relativePath = locale === 'ko' ? 'cv/index.html' : 'en/cv/index.html';
    const html = read(relativePath);
    assert.equal(summary.extractPublicCvSummary(html), summary.renderPublicCvSummary(cv, locale).envelope);
  }

  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-summary-refresh-'));
  try {
    for (const relativePath of ['data/public-cv.json', 'cv/index.html', 'en/cv/index.html']) {
      const target = path.join(temporaryRoot, relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(root, relativePath), target);
    }
    const koPath = path.join(temporaryRoot, 'cv/index.html');
    const before = fs.readFileSync(koPath, 'utf8');
    const envelope = summary.extractPublicCvSummary(before);
    fs.writeFileSync(koPath, before.replace(envelope, envelope.replace('김진민', '오래된 요약')));
    const result = childProcess.spawnSync(process.execPath, [
      path.join(root, 'scripts', 'public-cv-summary.cjs'), '--root', temporaryRoot, '--write'
    ], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const after = fs.readFileSync(koPath, 'utf8');
    assert.equal(after.replace(summary.extractPublicCvSummary(after), ''), before.replace(envelope, ''));
    assert.equal(summary.extractPublicCvSummary(after), summary.renderPublicCvSummary(cv, 'ko').envelope);
    assert.deepEqual(cvSummaryTransactionArtifacts(temporaryRoot), []);
    const second = childProcess.spawnSync(process.execPath, [
      path.join(root, 'scripts', 'public-cv-summary.cjs'), '--root', temporaryRoot, '--write'
    ], { cwd: root, encoding: 'utf8' });
    assert.equal(second.status, 0, second.stderr || second.stdout);
    assert.equal(fs.readFileSync(koPath, 'utf8'), after);
    assert.deepEqual(cvSummaryTransactionArtifacts(temporaryRoot), []);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 validator rejects stale semantic HTML after a normal PDF regeneration', (t) => {
  const python = task5Python();
  if (!fs.existsSync(python)) return t.skip('Task 5 ignored PDF virtual environment is unavailable.');
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-summary-stale-'));
  try {
    copyTask5Surface(temporaryRoot);
    const input = path.join(temporaryRoot, 'input.json');
    const exportResult = childProcess.spawnSync(process.execPath, [
      path.join(root, 'scripts', 'export-portfolio-data.cjs'), '--output', input
    ], { cwd: root, encoding: 'utf8' });
    assert.equal(exportResult.status, 0, exportResult.stderr || exportResult.stdout);
    const payload = JSON.parse(fs.readFileSync(input, 'utf8'));
    payload.cv.identity.translations.en.headline = 'Updated public engineering headline';
    const source = { ...payload };
    delete source.sourceDigest;
    payload.sourceDigest = crypto.createHash('sha256').update(JSON.stringify(source), 'utf8').digest('hex');
    fs.writeFileSync(input, `${JSON.stringify(payload, null, 2)}\n`);
    fs.writeFileSync(path.join(temporaryRoot, 'data', 'public-cv.json'), `${JSON.stringify(payload.cv, null, 2)}\n`);
    const generation = childProcess.spawnSync(python, [
      path.join(root, 'scripts', 'generate-portfolio-pdfs.py'),
      '--input', input,
      '--output-dir', path.join(temporaryRoot, 'output', 'pdf'),
      '--publish-root', temporaryRoot
    ], { cwd: root, encoding: 'utf8', timeout: 120_000 });
    assert.equal(generation.status, 0, generation.stderr || generation.stdout);
    assert.match(validator.pdfArtifactErrors(temporaryRoot).join(' '), /semantic HTML CV summary.*(?:stale|match)|does not match.*canonical/i);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 validator rejects HTML summary mutation and digest-only spoofing', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-summary-spoof-'));
  try {
    copyTask5Surface(temporaryRoot);
    const htmlPath = path.join(temporaryRoot, 'en', 'cv', 'index.html');
    const original = fs.readFileSync(htmlPath, 'utf8');
    assert.match(original, /data-cv-summary-digest="[a-f0-9]{64}"/);

    fs.writeFileSync(htmlPath, original.replace('Jinmin Kim · Public career summary', 'Mutated public career summary'));
    assert.match(validator.pdfArtifactErrors(temporaryRoot).join(' '), /semantic HTML CV summary.*(?:stale|match)|does not match.*canonical/i);

    fs.writeFileSync(htmlPath, original.replace(/data-cv-summary-digest="[a-f0-9]{64}"/, `data-cv-summary-digest="${'0'.repeat(64)}"`));
    assert.match(validator.pdfArtifactErrors(temporaryRoot).join(' '), /semantic HTML CV summary.*(?:stale|match)|does not match.*canonical/i);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 review round 3 rejects ambiguous, duplicate, and displaced CV summary envelopes', () => {
  const summary = require('../scripts/public-cv-summary.cjs');
  const html = read('en/cv/index.html');
  const envelope = summary.extractPublicCvSummary(html);
  assert.equal(typeof envelope, 'string');
  const startMarker = '<!-- PUBLIC CV SUMMARY:START -->';
  const endMarker = '<!-- PUBLIC CV SUMMARY:END -->';
  const ambiguous = [
    html.replace(startMarker, `${startMarker}\n    ${startMarker}`),
    html.replace(endMarker, `${endMarker}\n    ${endMarker}`),
    html.replace('</main>', '<section data-cv-summary><h2>Extra summary</h2></section>\n  </main>'),
    html.replace(/(<!-- PUBLIC CV SUMMARY:START -->\r?\n)(\s*<section[^>]+data-cv-summary[^>]*>\r?\n)/, '$2    $1')
  ];
  for (const candidate of ambiguous) {
    assert.throws(() => summary.extractPublicCvSummary(candidate), /exactly one|ambiguous|enclose/i);
  }

  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-summary-duplicate-'));
  try {
    copyTask5Surface(temporaryRoot);
    const htmlPath = path.join(temporaryRoot, 'en', 'cv', 'index.html');
    fs.writeFileSync(htmlPath, html.replace('</main>', `${envelope.replaceAll('9 awards', '99 awards')}\n  </main>`));
    assert.throws(() => summary.extractPublicCvSummary(fs.readFileSync(htmlPath, 'utf8')), /exactly one|ambiguous/i);
    assert.match(validator.pdfArtifactErrors(temporaryRoot).join(' '), /exactly one|ambiguous|semantic HTML CV summary/i);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 review round 3 decodes entities and Unicode spacing before public-surface PII scanning', () => {
  const encodedPii = [
    '31&nbsp;years&nbsp;old',
    '31&#32;years&#x20;old',
    '31&amp;nbsp;years&amp;nbsp;old',
    '010&#47;1234&#47;5678',
    '010&#183;1234&#xB7;5678',
    '+82&#32;&#40;10&#41;&#32;1234&#45;5678',
    '123&nbsp;Teheran&#45;ro, Gangnam&#45;gu, Seoul',
    '서울시&#x20;강남구',
    `31\u202fyears\u00a0old`
  ];
  for (const privateValue of encodedPii) {
    assert.match(validator.publicPiiFindings(privateValue).join(' '), /age|phone|address/i, privateValue);
  }
  const malformedEntity = '3D registration &nbsp &#xZZ; &#1114112; &bogus;';
  assert.doesNotThrow(() => validator.publicPiiFindings(malformedEntity));
  assert.deepEqual(validator.publicPiiFindings(malformedEntity), []);
  assert.deepEqual(validator.publicPiiFindings(read('cv/index.html')), []);
  assert.deepEqual(validator.publicPiiFindings(read('en/cv/index.html')), []);

  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-summary-entity-pii-'));
  try {
    copyTask5Surface(temporaryRoot);
    const htmlPath = path.join(temporaryRoot, 'en', 'cv', 'index.html');
    const original = fs.readFileSync(htmlPath, 'utf8');
    for (const privateValue of encodedPii) {
      fs.writeFileSync(htmlPath, original.replace('</main>', `<p>${privateValue}</p>\n  </main>`));
      assert.match(validator.pdfArtifactErrors(temporaryRoot).join(' '), /CV HTML public surface contains prohibited private PII/i, privateValue);
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 review round 3 refresh preflights source PII and both marker envelopes before writing', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-summary-preflight-'));
  try {
    copyCvSummarySurface(temporaryRoot);
    const koPath = path.join(temporaryRoot, 'cv', 'index.html');
    const enPath = path.join(temporaryRoot, 'en', 'cv', 'index.html');
    const cvPath = path.join(temporaryRoot, 'data', 'public-cv.json');
    const cv = JSON.parse(fs.readFileSync(cvPath, 'utf8'));
    cv.identity.translations.en.summary = '31&nbsp;years&nbsp;old';
    fs.writeFileSync(cvPath, `${JSON.stringify(cv, null, 2)}\n`);
    const piiBefore = [sha256(koPath), sha256(enPath)];
    const piiResult = childProcess.spawnSync(process.execPath, [
      path.join(root, 'scripts', 'public-cv-summary.cjs'), '--root', temporaryRoot, '--write'
    ], { cwd: root, encoding: 'utf8' });
    assert.equal(piiResult.status, 1, piiResult.stderr || piiResult.stdout);
    assert.match(piiResult.stderr, /^Public CV summary refresh failed: [^\r\n]+\r?\n$/);
    assert.match(piiResult.stderr, /private|PII|age/i);
    assert.doesNotMatch(piiResult.stderr, /at .*public-cv-summary|Traceback/i);
    assert.deepEqual([sha256(koPath), sha256(enPath)], piiBefore);
    assert.deepEqual(cvSummaryTransactionArtifacts(temporaryRoot), []);

    fs.copyFileSync(path.join(root, 'data', 'public-cv.json'), cvPath);
    const safeCv = JSON.parse(fs.readFileSync(cvPath, 'utf8'));
    safeCv.identity.translations.ko.headline = '갱신되어야 할 안전한 공개 헤드라인';
    safeCv.identity.translations.en.headline = 'Safe public headline that should be refreshed';
    fs.writeFileSync(cvPath, `${JSON.stringify(safeCv, null, 2)}\n`);
    fs.writeFileSync(enPath, fs.readFileSync(enPath, 'utf8').replace('<!-- PUBLIC CV SUMMARY:START -->', '<!-- MISSING PUBLIC CV SUMMARY START -->'));
    const missingBefore = [sha256(koPath), sha256(enPath)];
    const missingResult = childProcess.spawnSync(process.execPath, [
      path.join(root, 'scripts', 'public-cv-summary.cjs'), '--root', temporaryRoot, '--write'
    ], { cwd: root, encoding: 'utf8' });
    assert.equal(missingResult.status, 1, missingResult.stderr || missingResult.stdout);
    assert.match(missingResult.stderr, /exactly one|missing|marker/i);
    assert.deepEqual([sha256(koPath), sha256(enPath)], missingBefore);
    assert.deepEqual(cvSummaryTransactionArtifacts(temporaryRoot), []);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 review round 3 refresh rolls back both pages when the second staged replacement fails', () => {
  const summary = require('../scripts/public-cv-summary.cjs');
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-summary-rollback-'));
  try {
    copyCvSummarySurface(temporaryRoot);
    const cvPath = path.join(temporaryRoot, 'data', 'public-cv.json');
    const cv = JSON.parse(fs.readFileSync(cvPath, 'utf8'));
    cv.identity.translations.ko.headline = '원자적 갱신 검증용 공개 헤드라인';
    cv.identity.translations.en.headline = 'Atomic refresh verification headline';
    fs.writeFileSync(cvPath, `${JSON.stringify(cv, null, 2)}\n`);
    const koPath = path.join(temporaryRoot, 'cv', 'index.html');
    const enPath = path.join(temporaryRoot, 'en', 'cv', 'index.html');
    const before = [sha256(koPath), sha256(enPath)];
    let stagedReplacement = 0;
    const renameFile = (source, target) => {
      if (path.basename(source).includes('.public-cv-summary-') && source.endsWith('.tmp') && !source.endsWith('.restore.tmp') && path.basename(target) === 'index.html') {
        stagedReplacement += 1;
        if (stagedReplacement === 2) throw new Error('simulated second staged replacement failure');
      }
      fs.renameSync(source, target);
    };
    assert.throws(
      () => summary.refreshCvSummaries(temporaryRoot, { renameFile }),
      /simulated second staged replacement failure|atomic CV summary refresh failed/i
    );
    assert.equal(stagedReplacement, 2);
    assert.deepEqual([sha256(koPath), sha256(enPath)], before);
    assert.deepEqual(cvSummaryTransactionArtifacts(temporaryRoot), []);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 review round 4 flattens browser-visible entity and markup PII splits conservatively', () => {
  const privateValues = [
    '31&nbsp years&nbsp old',
    '31&#32years&#32old',
    '31&Tab;years&Tab;old',
    '010&sol;1234&sol;5678',
    '010&middot;1234&middot;5678',
    '31&amp;nbsp years&amp;nbsp old',
    '010&amp;sol;1234&amp;sol;5678',
    '31<span> years </span>old',
    '010<span>/</span>1234<span>/</span>5678',
    '123<span> Teheran-ro, </span>Gangnam-gu, Seoul',
    '서울시<span> </span>강남구',
    '31&mystery;years&mystery;old',
    '010&mystery;1234&mystery;5678'
  ];
  for (const privateValue of privateValues) {
    assert.match(validator.publicPiiFindings(privateValue).join(' '), /age|phone|address/i, privateValue);
  }
  for (const safeValue of [
    'https://link.springer.com/article/10.1007/s10278-024-01014-z?view=full&tab=article',
    'R&D engineer · 2023-02 - 2026-08-17 · 1 / 2 · joint-first-author',
    read('data/public-cv.json'),
    read('cv/index.html'),
    read('en/cv/index.html')
  ]) {
    assert.deepEqual(validator.publicPiiFindings(safeValue), [], safeValue.slice(0, 100));
  }

  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-visible-pii-'));
  try {
    copyTask5Surface(temporaryRoot);
    const htmlPath = path.join(temporaryRoot, 'en', 'cv', 'index.html');
    const original = fs.readFileSync(htmlPath, 'utf8');
    for (const privateValue of privateValues) {
      fs.writeFileSync(htmlPath, original.replace('</main>', `<p>${privateValue}</p>\n  </main>`));
      assert.match(validator.pdfArtifactErrors(temporaryRoot).join(' '), /CV HTML public surface contains prohibited private PII/i, privateValue);
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 review round 4 mirrors entity and markup PII normalization in Python validate-only', (t) => {
  const python = task5Python();
  if (!fs.existsSync(python)) return t.skip('Task 5 ignored PDF virtual environment is unavailable.');
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-python-visible-pii-'));
  try {
    const input = path.join(temporaryRoot, 'input.json');
    const exportResult = childProcess.spawnSync(process.execPath, [
      path.join(root, 'scripts', 'export-portfolio-data.cjs'), '--output', input
    ], { cwd: root, encoding: 'utf8' });
    assert.equal(exportResult.status, 0, exportResult.stderr || exportResult.stdout);
    const approved = JSON.parse(fs.readFileSync(input, 'utf8'));
    const approvedResult = childProcess.spawnSync(python, [
      path.join(root, 'scripts', 'generate-portfolio-pdfs.py'), '--input', input, '--validate-only'
    ], { cwd: root, encoding: 'utf8' });
    assert.equal(approvedResult.status, 0, approvedResult.stderr || approvedResult.stdout);

    for (const privateValue of [
      '31&nbsp years&nbsp old',
      '31&#32years&#32old',
      '31&Tab;years&Tab;old',
      '010&sol;1234&sol;5678',
      '010&middot;1234&middot;5678',
      '31&amp;nbsp years&amp;nbsp old',
      '010&amp;sol;1234&amp;sol;5678',
      '31<span> years </span>old',
      '010<span>/</span>1234<span>/</span>5678'
    ]) {
      const payload = clone(approved);
      payload.cv.identity.translations.en.summary = privateValue;
      const source = { ...payload };
      delete source.sourceDigest;
      payload.sourceDigest = crypto.createHash('sha256').update(JSON.stringify(source), 'utf8').digest('hex');
      fs.writeFileSync(input, `${JSON.stringify(payload)}\n`);
      const result = childProcess.spawnSync(python, [
        path.join(root, 'scripts', 'generate-portfolio-pdfs.py'), '--input', input, '--validate-only'
      ], { cwd: root, encoding: 'utf8' });
      assert.equal(result.status, 1, privateValue);
      assert.match(result.stderr, /^PDF generation failed: [^\r\n]+\r?\n$/, privateValue);
      assert.match(result.stderr, /age|phone|address|private/i, privateValue);
      assert.doesNotMatch(result.stderr, /Traceback/, privateValue);
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 review round 4 preserves durable recovery backups when rollback restoration fails', () => {
  const summary = require('../scripts/public-cv-summary.cjs');
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-summary-recovery-'));
  try {
    copyCvSummarySurface(temporaryRoot);
    const cvPath = path.join(temporaryRoot, 'data', 'public-cv.json');
    const cv = JSON.parse(fs.readFileSync(cvPath, 'utf8'));
    cv.identity.translations.ko.headline = '복구 백업 보존 검증용 공개 헤드라인';
    cv.identity.translations.en.headline = 'Durable recovery backup verification headline';
    fs.writeFileSync(cvPath, `${JSON.stringify(cv, null, 2)}\n`);
    const targets = [path.join(temporaryRoot, 'cv', 'index.html'), path.join(temporaryRoot, 'en', 'cv', 'index.html')];
    const before = targets.map(sha256);
    let stagedReplacement = 0;
    let restorationFailure = 0;
    const renameFile = (source, target) => {
      const isTransaction = path.basename(source).includes('.public-cv-summary-');
      if (isTransaction && source.endsWith('.tmp') && !source.endsWith('.restore.tmp') && path.basename(target) === 'index.html') {
        stagedReplacement += 1;
        if (stagedReplacement === 2) throw new Error('simulated second publish failure');
      }
      if (isTransaction && (source.endsWith('.bak') || source.endsWith('.restore.tmp')) && path.basename(target) === 'index.html') {
        restorationFailure += 1;
        if (restorationFailure === 1) throw new Error('simulated backup restoration failure');
      }
      fs.renameSync(source, target);
    };
    let failure;
    assert.throws(() => summary.refreshCvSummaries(temporaryRoot, { renameFile }), (error) => {
      failure = error;
      return /recovery|rollback|restoration/i.test(error.message);
    });
    const recoveryArtifacts = cvSummaryTransactionArtifacts(temporaryRoot);
    const backups = recoveryArtifacts.filter((relativePath) => relativePath.endsWith('.bak'));
    assert.equal(backups.length, 2, failure?.message);
    assert.ok(recoveryArtifacts.some((relativePath) => !relativePath.endsWith('.bak')), 'incomplete transaction artifacts must remain untouched until recovery completes');
    const recoveryErrors = validator.pdfArtifactErrors(temporaryRoot).join('\n').replace(/\\/g, '/');
    for (const relativePath of recoveryArtifacts) {
      const portablePath = relativePath.replace(/\\/g, '/');
      const ignored = childProcess.spawnSync('git', ['check-ignore', '--no-index', '--quiet', '--', portablePath], {
        cwd: root,
        encoding: 'utf8'
      });
      assert.equal(ignored.status, 0, `${portablePath} must be ignored: ${ignored.stderr || ignored.stdout}`);
      assert.ok(recoveryErrors.includes(portablePath), `${portablePath} must be named by the validator: ${recoveryErrors}`);
    }
    for (const [index, locale] of ['ko', 'en'].entries()) {
      const backupRelative = backups.find((relativePath) => relativePath.includes(`-${locale}.bak`));
      assert.ok(backupRelative, locale);
      const backupPath = path.join(temporaryRoot, backupRelative);
      assert.equal(sha256(backupPath), before[index], locale);
      const originalStillAvailable = (fs.existsSync(targets[index]) && sha256(targets[index]) === before[index]) || sha256(backupPath) === before[index];
      assert.equal(originalStillAvailable, true, locale);
      assert.ok(failure.message.includes(backupPath), failure.message);
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 review round 5 catches entity, numeric, and visible-join romanized addresses without false positives', () => {
  const privateValues = [
    '123 Teheran&dash;ro, Gangnam&dash;gu, Seoul',
    '123 Teheran&hyphen;ro, Gangnam&hyphen;gu, Seoul',
    '123 Teheran&ndash;ro, Gangnam&ndash;gu, Seoul',
    '123 Teheran&mdash;ro, Gangnam&mdash;gu, Seoul',
    '123 Teheran&dashro, Gangnam&dashgu, Seoul',
    '123 Teheran&#45;ro, Gangnam&#45;gu, Seoul',
    '123 Teheran&#x2d;ro, Gangnam&#x2d;gu, Seoul',
    '123 Teheran&amp;#8211;ro, Gangnam&amp;#x2014;gu, Seoul',
    '123 Teheran&amp;ndash;ro, Gangnam&amp;mdash;gu, Seoul',
    '123 Teheran<span>-</span>ro, Gangnam<span>-</span>gu, Seoul',
    '123 Teheran<!-- join -->-ro, Gangnam<!-- join -->-gu, Seoul',
    '123 Tehe<!-- join -->ran-ro, Gang<!-- join -->nam-gu, Seoul'
  ];
  for (const privateValue of privateValues) {
    assert.match(validator.publicPiiFindings(privateValue).join(' '), /romanized street address/i, privateValue);
  }
  for (const safeValue of [
    'https://example.com/research/teheran-ro?view=full&dash=compact',
    'dash-aware R&D normalization - joint-first-author - 1 / 2',
    read('data/public-cv.json'),
    read('cv/index.html'),
    read('en/cv/index.html')
  ]) {
    assert.deepEqual(validator.publicPiiFindings(safeValue), [], safeValue.slice(0, 120));
  }

  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-romanized-visible-pii-'));
  try {
    copyTask5Surface(temporaryRoot);
    const htmlPath = path.join(temporaryRoot, 'en', 'cv', 'index.html');
    const original = fs.readFileSync(htmlPath, 'utf8');
    for (const privateValue of privateValues) {
      fs.writeFileSync(htmlPath, original.replace('</main>', `<p>${privateValue}</p>\n  </main>`));
      assert.match(validator.pdfArtifactErrors(temporaryRoot).join(' '), /CV HTML public surface contains prohibited private PII/i, privateValue);
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 review round 5 keeps Python romanized-address normalization aligned with JavaScript', (t) => {
  const python = task5Python();
  if (!fs.existsSync(python)) return t.skip('Task 5 ignored PDF virtual environment is unavailable.');
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-python-romanized-pii-'));
  try {
    const input = path.join(temporaryRoot, 'input.json');
    const exportResult = childProcess.spawnSync(process.execPath, [
      path.join(root, 'scripts', 'export-portfolio-data.cjs'), '--output', input
    ], { cwd: root, encoding: 'utf8' });
    assert.equal(exportResult.status, 0, exportResult.stderr || exportResult.stdout);
    const approved = JSON.parse(fs.readFileSync(input, 'utf8'));
    for (const privateValue of [
      '123 Teheran&dash;ro, Gangnam&dash;gu, Seoul',
      '123 Teheran&hyphen;ro, Gangnam&hyphen;gu, Seoul',
      '123 Teheran&ndash;ro, Gangnam&ndash;gu, Seoul',
      '123 Teheran&mdash;ro, Gangnam&mdash;gu, Seoul',
      '123 Teheran&dashro, Gangnam&dashgu, Seoul',
      '123 Teheran&#45;ro, Gangnam&#x2d;gu, Seoul',
      '123 Teheran&amp;#8211;ro, Gangnam&amp;#x2014;gu, Seoul',
      '123 Teheran&amp;ndash;ro, Gangnam&amp;mdash;gu, Seoul',
      '123 Teheran<span>-</span>ro, Gangnam<span>-</span>gu, Seoul',
      '123 Teheran<!-- join -->-ro, Gangnam<!-- join -->-gu, Seoul',
      '123 Tehe<!-- join -->ran-ro, Gang<!-- join -->nam-gu, Seoul'
    ]) {
      const payload = clone(approved);
      payload.cv.identity.translations.en.summary = privateValue;
      const source = { ...payload };
      delete source.sourceDigest;
      payload.sourceDigest = crypto.createHash('sha256').update(JSON.stringify(source), 'utf8').digest('hex');
      fs.writeFileSync(input, `${JSON.stringify(payload)}\n`);
      const result = childProcess.spawnSync(python, [
        path.join(root, 'scripts', 'generate-portfolio-pdfs.py'), '--input', input, '--validate-only'
      ], { cwd: root, encoding: 'utf8' });
      assert.equal(result.status, 1, privateValue);
      assert.match(result.stderr, /^PDF generation failed: [^\r\n]+\r?\n$/, privateValue);
      assert.match(result.stderr, /romanized street address|private/i, privateValue);
      assert.doesNotMatch(result.stderr, /Traceback/, privateValue);
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 review round 5 ignores and reports every stranded CV recovery artifact', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-recovery-validator-'));
  try {
    copyTask5Surface(temporaryRoot);
    const artifacts = [
      'cv/index.html.public-cv-summary-review-ko.tmp',
      'cv/index.html.public-cv-summary-.tmp',
      'en/cv/index.html.public-cv-summary-review-en.bak',
      'en/cv/index.html.public-cv-summary-review-en.restore.tmp'
    ];
    for (const relativePath of artifacts) {
      fs.writeFileSync(path.join(temporaryRoot, relativePath), 'preserved recovery data');
      const ignored = childProcess.spawnSync('git', ['check-ignore', '--no-index', '--quiet', '--', relativePath], {
        cwd: root,
        encoding: 'utf8'
      });
      assert.equal(ignored.status, 0, `${relativePath} must be ignored: ${ignored.stderr || ignored.stdout}`);
    }
    for (const errors of [validator.pdfArtifactErrors(temporaryRoot), validator.validatePortfolio(temporaryRoot)]) {
      const joined = errors.join('\n').replace(/\\/g, '/');
      for (const relativePath of artifacts) assert.ok(joined.includes(relativePath), `${relativePath} must be reported: ${joined}`);
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('full validator passes without decorative SVG fallback assets', () => {
  assert.deepEqual(validator.validatePortfolio(root), []);
  const visualFiles = validator.publicPortfolioVisualFiles(root);
  assert.equal(visualFiles.length, 25, 'first-wave approved derivatives: 5 cases');
  assert.ok(visualFiles.every((file) => /\.(?:png|mp4)$/i.test(file.relativePath)), 'only PNG and MP4 derivatives are published');
});

test('published localized pages never rewrite parent traversal into external URLs', () => {
  for (const file of canonicalPages().filter((item) => fs.existsSync(item.absolutePath))) {
    assert.doesNotMatch(fs.readFileSync(file.absolutePath, 'utf8'), /https?:\/\/[^"\s]*\/\.\.\//, file.relativePath);
  }
});

test('Task 6 tracked site HTML inventory is exactly the twenty-four canonical localized routes', () => {
  const expected = canonicalPages().map((file) => file.relativePath.replace(/\\/g, '/')).sort();
  const actual = trackedFiles('*.html').filter((relativePath) => (
    !relativePath.startsWith('public/') &&
    !relativePath.startsWith('docs/') &&
    !relativePath.startsWith('.superpowers/')
  ));
  assert.deepEqual(actual, expected);
});

test('Task 6 removes excluded routes, decorative diagrams, and standalone legacy bundles', () => {
  for (const slug of excludedProjectSlugs) {
    assert.equal(fs.existsSync(path.join(root, 'projects', slug, 'index.html')), false, `Korean legacy route remains: ${slug}`);
    assert.equal(fs.existsSync(path.join(root, 'en', 'projects', slug, 'index.html')), false, `English legacy route remains: ${slug}`);
  }
  assert.equal(fs.existsSync(path.join(root, 'research', 'index.html')), false, 'Korean research route remains');
  assert.equal(fs.existsSync(path.join(root, 'en', 'research', 'index.html')), false, 'English research route remains');
  assert.deepEqual(trackedFiles('assets/diagrams/**'), []);
  for (const relativePath of standaloneLegacyFiles) {
    assert.equal(fs.existsSync(path.join(root, relativePath)), false, `standalone legacy file remains: ${relativePath}`);
  }
});

test('Task 6 validator rejects unexpected pages and excluded route references while ignoring public output', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-task6-inventory-'));
  try {
    copyTask6Surface(temporaryRoot);
    const publicPage = path.join(temporaryRoot, 'public', 'generated', 'index.html');
    fs.mkdirSync(path.dirname(publicPage), { recursive: true });
    fs.writeFileSync(publicPage, '<!doctype html><title>Generated output outside portfolio inventory</title>');
    assert.deepEqual(validator.validatePortfolio(temporaryRoot), []);

    const legacyPage = path.join(temporaryRoot, 'research', 'index.html');
    fs.mkdirSync(path.dirname(legacyPage), { recursive: true });
    fs.writeFileSync(legacyPage, '<!doctype html><title>Unexpected route</title>');
    let errors = validator.validatePortfolio(temporaryRoot).join('\n').replace(/\\/g, '/');
    assert.match(errors, /research\/index\.html.*unexpected public HTML page/i);

    fs.rmSync(path.join(temporaryRoot, 'research'), { recursive: true, force: true });
    const legacyBundle = path.join(temporaryRoot, 'css', 'styles.css');
    fs.writeFileSync(legacyBundle, '/* obsolete */');
    errors = validator.validatePortfolio(temporaryRoot).join('\n').replace(/\\/g, '/');
    assert.match(errors, /css\/styles\.css.*standalone legacy file/i);
    fs.rmSync(legacyBundle);

    const legacySvg = path.join(temporaryRoot, 'assets', 'diagrams', 'legacy.svg');
    fs.mkdirSync(path.dirname(legacySvg), { recursive: true });
    fs.writeFileSync(legacySvg, '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    errors = validator.validatePortfolio(temporaryRoot).join('\n').replace(/\\/g, '/');
    assert.match(errors, /assets\/diagrams\/legacy\.svg.*legacy SVG/i);
    fs.rmSync(path.join(temporaryRoot, 'assets', 'diagrams'), { recursive: true, force: true });

    const homePath = path.join(temporaryRoot, 'index.html');
    fs.appendFileSync(homePath, '<a href="projects/c-arm-navigation/?view=old#case">Old route</a>');
    errors = validator.validatePortfolio(temporaryRoot).join('\n').replace(/\\/g, '/');
    assert.match(errors, /index\.html.*excluded route reference.*c-arm-navigation/i);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 6 validator resolves query and fragment targets and rejects unsafe or case-mismatched local references', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-task6-links-'));
  try {
    copyTask6Surface(temporaryRoot);
    const homePath = path.join(temporaryRoot, 'index.html');
    const baseline = fs.readFileSync(homePath, 'utf8');
    fs.writeFileSync(homePath, baseline.replace('</main>', [
      '<a href="projects/?tier=medical#cases">Directory index</a>',
      '<img src="assets/img/favicon.ico?v=1#icon" alt="">',
      '<a href="#main-content">Fragment</a>',
      '<a href="mailto:public@example.com">Email</a>',
      '<a href="tel:+820000000000">Telephone</a>',
      '<a href="https://example.com/reference">HTTPS</a>',
      '</main>'
    ].join('')));
    assert.deepEqual(validator.validatePortfolio(temporaryRoot), []);

    const unsafeReferences = [
      ['<a href="../../outside/index.html">Escape</a>', /path traversal|escapes portfolio root/i],
      ['<a href="C:/private/demo.pdf">Drive</a>', /drive path|unsafe local reference/i],
      ['<a href="file:///C:/private/demo.pdf">File URL</a>', /file URL|unsafe local reference/i],
      ['<a href="javascript:alert(1)">Script URL</a>', /javascript.*unsafe|unsafe.*javascript/i],
      ['<img src="assets/img/Favicon.ico" alt="">', /exact filesystem case/i]
    ];
    for (const [markup, expected] of unsafeReferences) {
      fs.writeFileSync(homePath, baseline.replace('</main>', `${markup}</main>`));
      const errors = validator.validatePortfolio(temporaryRoot).join('\n');
      assert.match(errors, expected, markup);
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 6 validator enforces page metadata, shared mounts, and route-specific dependencies', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-task6-contract-'));
  try {
    copyTask6Surface(temporaryRoot);
    const casePath = path.join(temporaryRoot, 'projects', 'surgical-navigation', 'index.html');
    const baseline = fs.readFileSync(casePath, 'utf8');
    const mutations = [
      [baseline.replace('data-base="../../"', 'data-base="../"'), /expected data-base/i],
      [baseline.replace('data-page="projects"', 'data-page="capabilities"'), /unsupported data-page|expected data-page/i],
      [baseline.replace('<header id="site-nav"></header>', ''), /missing shared navigation mount/i],
      [baseline.replace('<footer id="site-footer"></footer>', ''), /missing shared footer mount/i],
      [baseline.replace('<script src="../../js/portfolio-data.js"></script>', ''), /missing required local script.*portfolio-data\.js/i],
      [baseline.replace('<script src="../../js/portfolio-data.js"></script>', '<style>/* <script src="../../js/portfolio-data.js"></script> */</style>'), /missing required local script.*portfolio-data\.js/i],
      [baseline.replace('../../css/site.css', '../../css/styles.css'), /legacy dependency|missing required local stylesheet.*site\.css/i]
    ];
    for (const [html, expected] of mutations) {
      fs.writeFileSync(casePath, html);
      const errors = validator.validatePortfolio(temporaryRoot).join('\n');
      assert.match(errors, expected);
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 6 review round 1 maps same-origin absolute URLs before local and excluded-route validation', () => {
  const home = canonicalPages().find((file) => file.relativePath === 'index.html');
  assert.deepEqual(validator.localReferenceErrors(home, [
    '<a href="https://RAFAAM11.GITHUB.IO:443/projects/?tier=medical#cases">Projects</a>',
    '<a href="//rafaam11.github.io:443/assets/cv/jinmin-kim-cv-ko.pdf?download=1#page=1">CV</a>',
    '<a href="https://example.com/projects/c-arm-navigation/">External HTTPS</a>',
    '<a href="//example.com/missing.html">External protocol-relative HTTPS</a>'
  ].join(''), root), []);

  const invalid = [
    ['<a href="https://rafaam11.github.io/missing/index.html?view=all#top">Missing</a>', /missing local reference target/i],
    ['<img src="https://RAFAAM11.GITHUB.IO:443/assets/img/Favicon.ico?cache=1#icon" alt="">', /exact filesystem case/i],
    ['<a href="https://rafaam11.github.io/%2e%2e/private/index.html">Traversal</a>', /path traversal/i],
    ['<a href="https://rafaam11.github.io\\missing\\index.html">Backslash</a>', /file-compatible/i]
  ];
  for (const [html, expected] of invalid) {
    assert.match(validator.localReferenceErrors(home, html, root).join('\n'), expected, html);
  }

  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-task6-origin-'));
  try {
    copyTask6Surface(temporaryRoot);
    const homePath = path.join(temporaryRoot, 'index.html');
    const baseline = fs.readFileSync(homePath, 'utf8');
    const excludedUrls = [
      'https://rafaam11.github.io/projects/c-arm-navigation?view=old#case',
      '//RAFAAM11.GITHUB.IO:443/%70rojects/%63-arm-navigation%2Findex.html/?view=old#case'
    ];
    for (const href of excludedUrls) {
      fs.writeFileSync(homePath, baseline.replace('</main>', `<a href="${href}">Old route</a></main>`));
      const errors = validator.validatePortfolio(temporaryRoot).join('\n').replace(/\\/g, '/');
      assert.match(errors, /index\.html.*excluded route reference.*c-arm-navigation/i, href);
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 6 review round 1 parses real HTML reference attributes without comments or raw-text false positives', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-task6-parser-'));
  try {
    const file = { relativePath: 'index.html', locale: 'ko' };
    const html = [
      '<!-- <iframe src=assets/comment-missing.html></iframe> -->',
      '<script>const sample = "<video src=assets/script-missing.mp4 poster=assets/script-missing.png>"; const prefix = "</scripture><iframe src=assets/script-prefix-missing.html>";</script>',
      '<style>.sample::after { content: "<img src=assets/style-missing.png>"; }</style>',
      '<div href=assets/invalid-tag-missing.html src=assets/invalid-tag-missing.png></div>',
      '<a href=assets/missing-link.html>Missing link</a>',
      '<iframe src=\'assets/missing-frame.html\'><a href=assets/iframe-fallback-missing.html>Fallback</a></iframe>',
      '<video src=assets/missing-video.mp4 poster=assets/missing-poster.png></video>',
      '<source src=assets/missing-source.mp4>',
      '<object data=assets/missing-object.pdf></object>',
      '<script src=assets/missing-runtime.js></script>'
    ].join('\n');
    assert.deepEqual(validator.htmlReferences(html), [
      { tag: 'a', attribute: 'href', value: 'assets/missing-link.html' },
      { tag: 'iframe', attribute: 'src', value: 'assets/missing-frame.html' },
      { tag: 'video', attribute: 'src', value: 'assets/missing-video.mp4' },
      { tag: 'video', attribute: 'poster', value: 'assets/missing-poster.png' },
      { tag: 'source', attribute: 'src', value: 'assets/missing-source.mp4' },
      { tag: 'object', attribute: 'data', value: 'assets/missing-object.pdf' },
      { tag: 'script', attribute: 'src', value: 'assets/missing-runtime.js' }
    ]);
    const errors = validator.localReferenceErrors(file, html, temporaryRoot).join('\n').replace(/\\/g, '/');
    for (const expected of [
      'missing-link.html',
      'missing-frame.html',
      'missing-video.mp4',
      'missing-poster.png',
      'missing-source.mp4',
      'missing-object.pdf',
      'missing-runtime.js'
    ]) assert.match(errors, new RegExp(expected.replace('.', '\\.')));
    for (const ignored of ['comment-missing', 'script-missing', 'script-prefix-missing', 'style-missing', 'invalid-tag-missing', 'iframe-fallback-missing']) {
      assert.doesNotMatch(errors, new RegExp(ignored));
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 6 review round 1 scopes runtime metadata to exactly one real body start tag', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-task6-body-'));
  try {
    copyTask6Surface(temporaryRoot);
    const casePath = path.join(temporaryRoot, 'projects', 'surgical-navigation', 'index.html');
    const baseline = fs.readFileSync(casePath, 'utf8');
    const bodyStart = baseline.match(/<body\b[^>]*>/i)?.[0];
    assert.ok(bodyStart);

    fs.writeFileSync(casePath, baseline
      .replace('data-lang="ko"', '')
      .replace('</head>', '<meta data-lang="ko"></head>'));
    let errors = validator.validatePortfolio(temporaryRoot).join('\n');
    assert.match(errors, /expected body data-lang="ko"/i);

    fs.writeFileSync(casePath, baseline
      .replace('data-route="projects/surgical-navigation/"', '')
      .replace('</main>', '<div data-route="projects/surgical-navigation/"></div></main>'));
    errors = validator.validatePortfolio(temporaryRoot).join('\n');
    assert.match(errors, /expected body data-route="projects\/surgical-navigation\/"/i);

    fs.writeFileSync(casePath, baseline
      .replace(bodyStart, `<div id="body-shell"${bodyStart.slice('<body'.length, -1)}>`)
      .replace('</head>', `<!-- ${bodyStart} --><script>const spoof = '${bodyStart.replace(/'/g, '&#39;')}';</script></head>`));
    errors = validator.validatePortfolio(temporaryRoot).join('\n');
    assert.match(errors, /expected exactly one real body start tag/i);

    fs.writeFileSync(casePath, baseline.replace('</body>', `${bodyStart}</body></body>`));
    errors = validator.validatePortfolio(temporaryRoot).join('\n');
    assert.match(errors, /expected exactly one real body start tag/i);

    fs.writeFileSync(casePath, baseline
      .replace('data-base="../../"', 'data-base=../../')
      .replace('data-page="projects"', "data-page='projects'")
      .replace('data-lang="ko"', 'data-lang=ko')
      .replace('data-route="projects/surgical-navigation/"', "data-route='projects/surgical-navigation/'"));
    assert.deepEqual(validator.validatePortfolio(temporaryRoot), []);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 6 review round 2 rejects spoofed or ambiguous structural, link, and script contracts', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-task6-contract-round2-'));
  try {
    copyTask6Surface(temporaryRoot);
    const baselines = new Map([
      ['index.html', fs.readFileSync(path.join(temporaryRoot, 'index.html'), 'utf8')],
      ['projects/index.html', fs.readFileSync(path.join(temporaryRoot, 'projects', 'index.html'), 'utf8')],
      ['projects/surgical-navigation/index.html', fs.readFileSync(path.join(temporaryRoot, 'projects', 'surgical-navigation', 'index.html'), 'utf8')],
      ['cv/index.html', fs.readFileSync(path.join(temporaryRoot, 'cv', 'index.html'), 'utf8')],
      ['contact/index.html', fs.readFileSync(path.join(temporaryRoot, 'contact', 'index.html'), 'utf8')]
    ]);
    const casePath = 'projects/surgical-navigation/index.html';
    const caseCanonical = '<link rel="canonical" href="https://rafaam11.github.io/projects/surgical-navigation/">';
    const caseKoAlternate = '<link rel="alternate" hreflang="ko" href="https://rafaam11.github.io/projects/surgical-navigation/">';
    const caseData = '<script src="../../js/portfolio-data.js"></script>';
    const homeData = '<script src="js/portfolio-data.js"></script>';
    const homeRender = '<script src="js/portfolio-render.js"></script>';
    const projectNav = '<script src="../js/nav.js"></script>';
    const cvNav = '<script src="../js/nav.js"></script>';
    const contactI18n = '<script src="../js/site-i18n.js"></script>';
    const contactNav = '<script src="../js/nav.js"></script>';
    const swap = (html, first, second) => html
      .replace(first, '__TASK6_FIRST_SCRIPT__')
      .replace(second, first)
      .replace('__TASK6_FIRST_SCRIPT__', second);
    const mutations = [
      {
        label: 'comment-only header mount',
        relativePath: casePath,
        mutate: (html) => html.replace('<header id="site-nav"></header>', '<!-- <header id="site-nav"></header> -->'),
        expected: /expected exactly one real header#site-nav/i
      },
      {
        label: 'script-text main mount',
        relativePath: casePath,
        mutate: (html) => html.replace('<main id="main-content"', '<script>const spoof = \'<main id="main-content">\';</script><section data-old-main'),
        expected: /expected exactly one real main#main-content/i
      },
      {
        label: 'style-text footer mount',
        relativePath: casePath,
        mutate: (html) => html.replace('<footer id="site-footer"></footer>', '<style>/* <footer id="site-footer"></footer> */</style>'),
        expected: /expected exactly one real footer#site-footer/i
      },
      {
        label: 'duplicate header mount',
        relativePath: casePath,
        mutate: (html) => html.replace('<header id="site-nav"></header>', '<header id="site-nav"></header><header id="site-nav"></header>'),
        expected: /expected exactly one real header#site-nav/i
      },
      {
        label: 'duplicate main mount',
        relativePath: casePath,
        mutate: (html) => html.replace('<main id="main-content"', '<main id="main-content"></main><main id="main-content"'),
        expected: /expected exactly one real main#main-content/i
      },
      {
        label: 'duplicate footer mount',
        relativePath: casePath,
        mutate: (html) => html.replace('<footer id="site-footer"></footer>', '<footer id="site-footer"></footer><footer id="site-footer"></footer>'),
        expected: /expected exactly one real footer#site-footer/i
      },
      {
        label: 'wrong real canonical plus correct comment',
        relativePath: casePath,
        mutate: (html) => html.replace(caseCanonical, `<link rel="canonical" href="https://rafaam11.github.io/"><!-- ${caseCanonical} -->`),
        expected: /exactly one correct parsed canonical link/i
      },
      {
        label: 'duplicate canonical',
        relativePath: casePath,
        mutate: (html) => html.replace(caseCanonical, caseCanonical + caseCanonical),
        expected: /exactly one correct parsed canonical link/i
      },
      {
        label: 'wrong real ko alternate plus correct comment',
        relativePath: casePath,
        mutate: (html) => html.replace(caseKoAlternate, `<link rel="alternate" hreflang="ko" href="https://rafaam11.github.io/projects/"><!-- ${caseKoAlternate} -->`),
        expected: /exactly one correct parsed alternate.*hreflang="ko"/i
      },
      {
        label: 'duplicate ko alternate',
        relativePath: casePath,
        mutate: (html) => html.replace(caseKoAlternate, caseKoAlternate + caseKoAlternate),
        expected: /exactly one correct parsed alternate.*hreflang="ko"/i
      },
      {
        label: 'Home render before data',
        relativePath: 'index.html',
        mutate: (html) => swap(html, homeData, homeRender),
        expected: /exact parsed script sequence/i
      },
      {
        label: 'Projects duplicate nav',
        relativePath: 'projects/index.html',
        mutate: (html) => html.replace(projectNav, projectNav + projectNav),
        expected: /exact parsed script sequence/i
      },
      {
        label: 'case duplicate data',
        relativePath: casePath,
        mutate: (html) => html.replace(caseData, caseData + caseData),
        expected: /exact parsed script sequence/i
      },
      {
        label: 'case missing data hidden in a comment',
        relativePath: casePath,
        mutate: (html) => html.replace(caseData, `<!-- ${caseData} -->`),
        expected: /missing required local script.*portfolio-data\.js|exact parsed script sequence/i
      },
      {
        label: 'CV duplicate nav',
        relativePath: 'cv/index.html',
        mutate: (html) => html.replace(cvNav, cvNav + cvNav),
        expected: /exact parsed script sequence/i
      },
      {
        label: 'Contact nav before i18n',
        relativePath: 'contact/index.html',
        mutate: (html) => swap(html, contactI18n, contactNav),
        expected: /exact parsed script sequence/i
      },
      {
        label: 'external script added to Home sequence',
        relativePath: 'index.html',
        mutate: (html) => html.replace('<script src="js/nav.js"></script>', '<script src="https://example.com/runtime.js"></script><script src="js/nav.js"></script>'),
        expected: /exact parsed script sequence/i
      },
      {
        label: 'valueless script src added to Home sequence',
        relativePath: 'index.html',
        mutate: (html) => html.replace('<script src="js/nav.js"></script>', '<script src></script><script src="js/nav.js"></script>'),
        expected: /exact parsed script sequence/i
      }
    ];

    const undetected = [];
    for (const mutation of mutations) {
      const baseline = baselines.get(mutation.relativePath);
      const html = mutation.mutate(baseline);
      assert.notEqual(html, baseline, `${mutation.label}: fixture mutation did not apply`);
      const target = path.join(temporaryRoot, ...mutation.relativePath.split('/'));
      fs.writeFileSync(target, html);
      const errors = validator.validatePortfolio(temporaryRoot).join('\n');
      if (!mutation.expected.test(errors)) undetected.push(`${mutation.label}: ${errors || '<no errors>'}`);
      fs.writeFileSync(target, baseline);
    }
    assert.deepEqual(undetected, []);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 6 review round 2 accepts valid parsed tag and attribute forms', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-task6-parsed-forms-'));
  try {
    copyTask6Surface(temporaryRoot);
    const casePath = path.join(temporaryRoot, 'projects', 'surgical-navigation', 'index.html');
    const baseline = fs.readFileSync(casePath, 'utf8');
    const replacements = [
      ['<header id="site-nav"></header>', '<HEADER ID=site-nav></HEADER>'],
      ['<main id="main-content"', "<MAIN ID='main-content'"],
      ['<footer id="site-footer"></footer>', '<FOOTER ID=site-footer></FOOTER>'],
      ['<link rel="canonical" href="https://rafaam11.github.io/projects/surgical-navigation/">', "<LINK HREF='https://rafaam11.github.io/projects/surgical-navigation/' REL=canonical>"],
      ['<link rel="alternate" hreflang="ko" href="https://rafaam11.github.io/projects/surgical-navigation/">', "<LINK HREF='https://rafaam11.github.io/projects/surgical-navigation/' HREFLANG=ko REL=alternate>"],
      ['<link rel="alternate" hreflang="en" href="https://rafaam11.github.io/en/projects/surgical-navigation/">', '<LINK HREF=https://rafaam11.github.io/en/projects/surgical-navigation/ HREFLANG=en REL=alternate>'],
      ['<link rel="alternate" hreflang="x-default" href="https://rafaam11.github.io/projects/surgical-navigation/">', "<LINK REL='alternate' HREFLANG=x-default HREF=https://rafaam11.github.io/projects/surgical-navigation/>"],
      ['<script src="../../js/site-i18n.js"></script>', "<SCRIPT SRC='../../js/site-i18n.js'></SCRIPT>"],
      ['<script src="../../js/portfolio-data.js"></script>', '<SCRIPT SRC=../../js/portfolio-data.js></SCRIPT>'],
      ['<script src="../../js/portfolio-render.js"></script>', "<SCRIPT SRC='../../js/portfolio-render.js'></SCRIPT>"],
      ['<script src="../../js/nav.js"></script>', '<SCRIPT SRC=../../js/nav.js></SCRIPT>']
    ];
    let html = baseline;
    for (const [from, to] of replacements) {
      assert.ok(html.includes(from), `fixture is missing ${from}`);
      html = html.replace(from, to);
    }
    fs.writeFileSync(casePath, html);
    assert.deepEqual(validator.validatePortfolio(temporaryRoot), []);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 6 review round 2 rejects every real base element before reference resolution', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-task6-base-'));
  try {
    copyTask6Surface(temporaryRoot);
    const homePath = path.join(temporaryRoot, 'index.html');
    const baseline = fs.readFileSync(homePath, 'utf8');
    const home = validator.publicPortfolioFiles(temporaryRoot).find((file) => file.relativePath === 'index.html');
    const variants = [
      '<base href="projects/">',
      "<base href='projects/'>",
      '<base href=projects/>',
      '<BASE HREF=projects/>',
      '<base>'
    ];
    const undetected = [];
    for (const markup of variants) {
      const html = baseline.replace('</head>', `${markup}</head>`);
      assert.deepEqual(validator.localReferenceErrors(home, html, temporaryRoot), [], `${markup}: reference resolution should remain clean`);
      fs.writeFileSync(homePath, html);
      const errors = validator.validatePortfolio(temporaryRoot).join('\n');
      if (!/real base elements? (?:are|is) not allowed|base element.*prohibited/i.test(errors)) {
        undetected.push(`${markup}: ${errors || '<no errors>'}`);
      }
    }
    assert.deepEqual(undetected, []);

    const shadowOnly = baseline.replace('</head>', '<!-- <BASE HREF=projects/> --><script>const spoof = \'<base href="projects/">\';</script></head>');
    fs.writeFileSync(homePath, shadowOnly);
    assert.deepEqual(validator.validatePortfolio(temporaryRoot), []);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 6 review round 3 rejects real inert containers without trusting their contents', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-task6-inert-'));
  try {
    copyTask6Surface(temporaryRoot);
    const homePath = path.join(temporaryRoot, 'index.html');
    const baseline = fs.readFileSync(homePath, 'utf8');
    const canonical = '<link rel="canonical" href="https://rafaam11.github.io/">';
    const header = '<header id="site-nav"></header>';
    const scripts = [
      '  <script src="js/site-i18n.js"></script>',
      '  <script src="js/portfolio-data.js"></script>',
      '  <script src="js/portfolio-render.js"></script>',
      '  <script src="js/nav.js"></script>'
    ].join('\n');
    assert.ok(baseline.includes(scripts), 'Home fixture must contain the exact dependency block');

    const mutations = [
      ['empty template', (html) => html.replace('</head>', '<template></template></head>')],
      ['empty noscript', (html) => html.replace('</head>', '<noscript></noscript></head>')],
      ['header mount inside template', (html) => html.replace(header, `<template>${header}</template>`)],
      ['canonical inside template', (html) => html.replace(canonical, `<template>${canonical}</template>`)],
      ['required scripts inside noscript', (html) => html.replace(scripts, `<noscript>${scripts}</noscript>`)]
    ];
    const undetected = [];
    for (const [label, mutate] of mutations) {
      const html = mutate(baseline);
      assert.notEqual(html, baseline, `${label}: fixture mutation did not apply`);
      fs.writeFileSync(homePath, html);
      const errors = validator.validatePortfolio(temporaryRoot).join('\n');
      if (!/real (?:template|noscript).*not allowed|inert container.*(?:template|noscript)/i.test(errors)) {
        undetected.push(`${label}: ${errors || '<no errors>'}`);
      }
    }
    assert.deepEqual(undetected, []);

    const shadowOnly = baseline.replace('</head>', [
      '<!-- <template><header id="site-nav"></header></template> -->',
      '<script>const shadow = \'<noscript><footer id="site-footer"></footer></noscript>\';</script>',
      '</head>'
    ].join(''));
    fs.writeFileSync(homePath, shadowOnly);
    assert.deepEqual(validator.validatePortfolio(temporaryRoot), []);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 6 review round 3 requires unique contract IDs on their expected tags', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-task6-contract-ids-'));
  try {
    copyTask6Surface(temporaryRoot);
    const casePath = path.join(temporaryRoot, 'projects', 'surgical-navigation', 'index.html');
    const baseline = fs.readFileSync(casePath, 'utf8');
    const mutations = [
      {
        label: 'wrong-tag site-nav alongside valid header',
        mutate: (html) => html.replace('<header id="site-nav"></header>', '<div id="site-nav"></div><header id="site-nav"></header>'),
        expected: /id="site-nav".*found 2|duplicate.*site-nav/i
      },
      {
        label: 'wrong-tag-only site-nav',
        mutate: (html) => html.replace('<header id="site-nav"></header>', '<div id="site-nav"></div>'),
        expected: /id="site-nav".*(?:must belong|header)|real header#site-nav/i
      },
      {
        label: 'duplicate site-nav attributes on one header',
        mutate: (html) => html.replace('<header id="site-nav"></header>', '<header id="site-nav" id="site-nav"></header>'),
        expected: /id="site-nav".*found 2|duplicate.*site-nav/i
      },
      {
        label: 'wrong-tag main-content alongside valid main',
        mutate: (html) => html.replace('<main id="main-content"', '<section id="main-content"></section><main id="main-content"'),
        expected: /id="main-content".*found 2|duplicate.*main-content/i
      },
      {
        label: 'wrong-tag-only main-content',
        mutate: (html) => html.replace('<main id="main-content"', '<section id="main-content"'),
        expected: /id="main-content".*(?:must belong|main)|real main#main-content/i
      },
      {
        label: 'duplicate main-content mounts',
        mutate: (html) => html.replace('<main id="main-content"', '<main id="main-content"></main><main id="main-content"'),
        expected: /id="main-content".*found 2|duplicate.*main-content/i
      },
      {
        label: 'wrong-tag site-footer alongside valid footer',
        mutate: (html) => html.replace('<footer id="site-footer"></footer>', '<div id="site-footer"></div><footer id="site-footer"></footer>'),
        expected: /id="site-footer".*found 2|duplicate.*site-footer/i
      },
      {
        label: 'wrong-tag-only site-footer',
        mutate: (html) => html.replace('<footer id="site-footer"></footer>', '<div id="site-footer"></div>'),
        expected: /id="site-footer".*(?:must belong|footer)|real footer#site-footer/i
      },
      {
        label: 'duplicate site-footer mounts',
        mutate: (html) => html.replace('<footer id="site-footer"></footer>', '<footer id="site-footer"></footer><footer id="site-footer"></footer>'),
        expected: /id="site-footer".*found 2|duplicate.*site-footer/i
      }
    ];

    const undetected = [];
    for (const mutation of mutations) {
      const html = mutation.mutate(baseline);
      assert.notEqual(html, baseline, `${mutation.label}: fixture mutation did not apply`);
      fs.writeFileSync(casePath, html);
      const errors = validator.validatePortfolio(temporaryRoot).join('\n');
      if (!mutation.expected.test(errors)) undetected.push(`${mutation.label}: ${errors || '<no errors>'}`);
    }
    assert.deepEqual(undetected, []);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 6 review round 3 enforces classic required scripts after all live mounts', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-task6-script-contracts-'));
  try {
    copyTask6Surface(temporaryRoot);
    const homePath = path.join(temporaryRoot, 'index.html');
    const baseline = fs.readFileSync(homePath, 'utf8');
    const scriptLines = [
      '  <script src="js/site-i18n.js"></script>',
      '  <script src="js/portfolio-data.js"></script>',
      '  <script src="js/portfolio-render.js"></script>',
      '  <script src="js/nav.js"></script>'
    ];
    const scriptBlock = scriptLines.join('\n');
    assert.ok(baseline.includes(scriptBlock), 'Home fixture must contain the exact dependency block');
    assert.deepEqual(validator.validatePortfolio(temporaryRoot), []);

    const moveAllScriptsToHead = (html) => html
      .replace(scriptBlock, '')
      .replace('</head>', `${scriptBlock}</head>`);
    const moveI18nBeforeBody = (html) => html
      .replace(`${scriptLines[0]}\n`, '')
      .replace('</head>', `${scriptLines[0]}</head>`);
    const mutations = [
      {
        label: 'type override',
        html: baseline.replace('<script src="js/site-i18n.js"></script>', '<script type=text/plain src="js/site-i18n.js"></script>'),
        expected: /required local script.*site-i18n\.js.*classic executable/i
      },
      {
        label: 'bare async',
        html: baseline.replace('<script src="js/portfolio-data.js"></script>', '<script async src="js/portfolio-data.js"></script>'),
        expected: /required local script.*portfolio-data\.js.*classic executable/i
      },
      {
        label: 'valued defer',
        html: baseline.replace('<script src="js/portfolio-render.js"></script>', '<script defer="false" src="js/portfolio-render.js"></script>'),
        expected: /required local script.*portfolio-render\.js.*classic executable/i
      },
      {
        label: 'bare nomodule',
        html: baseline.replace('<script src="js/nav.js"></script>', '<script nomodule src="js/nav.js"></script>'),
        expected: /required local script.*nav\.js.*classic executable/i
      },
      {
        label: 'valued nomodule',
        html: baseline.replace('<script src="js/nav.js"></script>', '<script nomodule=false src="js/nav.js"></script>'),
        expected: /required local script.*nav\.js.*classic executable/i
      },
      {
        label: 'all required scripts in head',
        html: moveAllScriptsToHead(baseline),
        expected: /required local script.*must appear after.*(?:footer|live mounts)/i
      },
      {
        label: 'first required script before body and mounts',
        html: moveI18nBeforeBody(baseline),
        expected: /required local script.*site-i18n\.js.*must appear after.*(?:footer|live mounts)/i
      }
    ];

    const undetected = [];
    for (const mutation of mutations) {
      assert.notEqual(mutation.html, baseline, `${mutation.label}: fixture mutation did not apply`);
      fs.writeFileSync(homePath, mutation.html);
      const errors = validator.validatePortfolio(temporaryRoot).join('\n');
      if (!mutation.expected.test(errors)) undetected.push(`${mutation.label}: ${errors || '<no errors>'}`);
    }
    assert.deepEqual(undetected, []);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 6 review round 3 exposes exact source offsets for parsed real start tags', () => {
  assert.equal(typeof validator.htmlStartTags, 'function');
  const html = 'prefix<header id=site-nav></header>\n<script src=js/nav.js></script>';
  const tags = validator.htmlStartTags(html);
  assert.deepEqual(tags.map((tag) => ({
    name: tag.name,
    startOffset: tag.startOffset,
    endOffset: tag.endOffset,
    source: html.slice(tag.startOffset, tag.endOffset)
  })), [
    {
      name: 'header',
      startOffset: html.indexOf('<header'),
      endOffset: html.indexOf('<header') + '<header id=site-nav>'.length,
      source: '<header id=site-nav>'
    },
    {
      name: 'script',
      startOffset: html.indexOf('<script'),
      endOffset: html.indexOf('<script') + '<script src=js/nav.js>'.length,
      source: '<script src=js/nav.js>'
    }
  ]);
});

test('Task 6 review round 4 decodes attribute character references exactly once', () => {
  const html = [
    '<header id="site&#45;nav" data-copy="A&nbsp;B&Tab;C&mdash;D"></header>',
    '<link rel="canon&#105;cal" href="https&colon;&sol;&sol;rafaam11&period;github&period;io&sol;">',
    '<a href="&amp;#47;projects">One-pass reference</a>',
    '<img src=assets&#x2f;img&#47;favicon&#46;ico alt="">',
    '<object data="assets&#47;cv&#47;file.pdf"></object>',
    '<video poster=assets&#47;cv&#47;poster.png></video>'
  ].join('');
  const tags = validator.htmlStartTags(html);
  const header = tags.find((tag) => tag.name === 'header');
  const link = tags.find((tag) => tag.name === 'link');
  const id = header.attributes.find((attribute) => attribute.name === 'id');
  const copy = header.attributes.find((attribute) => attribute.name === 'data-copy');
  assert.deepEqual({ value: id.value, rawValue: id.rawValue }, {
    value: 'site-nav',
    rawValue: 'site&#45;nav'
  });
  assert.equal(copy.value, 'A\u00a0B\tC\u2014D');
  assert.equal(link.attributes.find((attribute) => attribute.name === 'rel').value, 'canonical');
  assert.equal(link.attributes.find((attribute) => attribute.name === 'href').value, 'https://rafaam11.github.io/');
  assert.deepEqual(validator.htmlReferences(html), [
    { tag: 'link', attribute: 'href', value: 'https://rafaam11.github.io/' },
    { tag: 'a', attribute: 'href', value: '&#47;projects' },
    { tag: 'img', attribute: 'src', value: 'assets/img/favicon.ico' },
    { tag: 'object', attribute: 'data', value: 'assets/cv/file.pdf' },
    { tag: 'video', attribute: 'poster', value: 'assets/cv/poster.png' }
  ]);
  const onePassErrors = validator.localReferenceErrors(
    { relativePath: 'index.html', locale: 'ko' },
    '<a href="projects&amp;#47;index.html">One-pass path</a>',
    root
  ).join('\n');
  assert.match(onePassErrors, /projects&: missing local reference target/i);
});

test('Task 6 review round 4 applies decoded values to page and dependency contracts', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-task6-entities-'));
  try {
    copyTask6Surface(temporaryRoot);
    const relativePath = 'projects/surgical-navigation/index.html';
    const casePath = path.join(temporaryRoot, ...relativePath.split('/'));
    const baseline = fs.readFileSync(casePath, 'utf8');
    const canonical = '<link rel="canonical" href="https://rafaam11.github.io/projects/surgical-navigation/">';
    const koAlternate = '<link rel="alternate" hreflang="ko" href="https://rafaam11.github.io/projects/surgical-navigation/">';
    const header = '<header id="site-nav"></header>';
    const encodedValid = baseline
      .replace('data-base="../../"', 'data-base="&#46;&#46;&#47;&#x2e;&#x2e;&#x2f;"')
      .replace('data-page="projects"', 'data-page="pro&#106;ects"')
      .replace('data-lang="ko"', 'data-lang="&#107;&#111;"')
      .replace('data-route="projects/surgical-navigation/"', 'data-route="projects&#47;surgical&#45;navigation&#x2f;"')
      .replace(header, '<header id="site&#45;nav"></header>')
      .replace(canonical, '<link rel="canon&#105;cal" href="https&colon;&sol;&sol;rafaam11&period;github&period;io&sol;projects&sol;surgical-navigation&sol;">')
      .replace(koAlternate, '<link rel="alternate" hreflang="&#107;&#111;" href="https://rafaam11.github.io/projects/surgical-navigation/">')
      .replace('href="../../css/site.css"', 'href="&#46;&#46;&#47;&#46;&#46;&#47;css&#47;site&#46;css"')
      .replace('src="../../js/site-i18n.js"', 'src="&#46;&#46;&#47;&#46;&#46;&#47;js&#47;site&#45;i18n&#46;js"');
    assert.notEqual(encodedValid, baseline, 'encoded valid fixture mutation did not apply');

    const undetected = [];
    fs.writeFileSync(casePath, encodedValid);
    const encodedErrors = validator.validatePortfolio(temporaryRoot);
    if (encodedErrors.length) undetected.push(`encoded valid page: ${encodedErrors.join('\n')}`);

    const mutations = [
      {
        label: 'encoded duplicate mount ID',
        html: baseline.replace(header, `<div id="site&#45;nav"></div>${header}`),
        expected: /duplicate shared navigation mount|id="site-nav".*found 2/i
      },
      {
        label: 'encoded duplicate canonical relation',
        html: baseline.replace(canonical, `${canonical}<link rel="canon&#105;cal" href="https://rafaam11.github.io/projects/surgical-navigation/">`),
        expected: /exactly one correct parsed canonical link/i
      },
      {
        label: 'encoded duplicate alternate language',
        html: baseline.replace(koAlternate, `${koAlternate}<link rel="alternate" hreflang="&#107;&#111;" href="https://rafaam11.github.io/projects/surgical-navigation/">`),
        expected: /exactly one correct parsed alternate.*hreflang="ko"/i
      }
    ];
    for (const mutation of mutations) {
      assert.notEqual(mutation.html, baseline, `${mutation.label}: fixture mutation did not apply`);
      fs.writeFileSync(casePath, mutation.html);
      const errors = validator.validatePortfolio(temporaryRoot).join('\n');
      if (!mutation.expected.test(errors)) undetected.push(`${mutation.label}: ${errors || '<no errors>'}`);
    }
    assert.deepEqual(undetected, []);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 6 review round 4 requires one valued src and no other required-script attributes', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-task6-script-attributes-'));
  try {
    copyTask6Surface(temporaryRoot);
    const homePath = path.join(temporaryRoot, 'index.html');
    const baseline = fs.readFileSync(homePath, 'utf8');
    const i18n = '<script src="js/site-i18n.js"></script>';
    const mutations = [
      ['mismatched SRI', `<script src="js/site-i18n.js" integrity="sha384-reviewer-mismatch"></script>`, /classic executable.*exactly one valued src|script attribute contract.*integrity/i],
      ['crossorigin', '<script src="js/site-i18n.js" crossorigin=anonymous></script>', /classic executable.*exactly one valued src|script attribute contract.*crossorigin/i],
      ['referrer policy', '<script src="js/site-i18n.js" referrerpolicy=no-referrer></script>', /classic executable.*exactly one valued src|script attribute contract.*referrerpolicy/i],
      ['nonce', '<script nonce=review src="js/site-i18n.js"></script>', /classic executable.*exactly one valued src|script attribute contract.*nonce/i],
      ['id', '<script id=runtime src="js/site-i18n.js"></script>', /classic executable.*exactly one valued src|script attribute contract.*id/i],
      ['arbitrary attribute', '<script data-runtime=review src="js/site-i18n.js"></script>', /classic executable.*exactly one valued src|script attribute contract.*data-runtime/i],
      ['duplicate valued src', '<script src="js/site-i18n.js" src="js/site-i18n.js"></script>', /classic executable.*exactly one valued src|script attribute contract.*src/i],
      ['duplicate boolean src', '<script src="js/site-i18n.js" src></script>', /classic executable.*exactly one valued src|script attribute contract.*src/i],
      ['boolean-only src', '<script src></script>', /missing required local script.*site-i18n\.js|exact parsed script sequence/i],
      ['missing src', '<script></script>', /missing required local script.*site-i18n\.js|exact parsed script sequence/i]
    ];

    const undetected = [];
    for (const [label, replacement, expected] of mutations) {
      const html = baseline.replace(i18n, replacement);
      assert.notEqual(html, baseline, `${label}: fixture mutation did not apply`);
      fs.writeFileSync(homePath, html);
      const errors = validator.validatePortfolio(temporaryRoot).join('\n');
      if (!expected.test(errors)) undetected.push(`${label}: ${errors || '<no errors>'}`);
    }
    assert.deepEqual(undetected, []);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 6 review round 4 requires exact unique local stylesheet tags without blocking attributes', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-task6-style-attributes-'));
  try {
    copyTask6Surface(temporaryRoot);
    const homePath = path.join(temporaryRoot, 'index.html');
    const baseline = fs.readFileSync(homePath, 'utf8');
    const siteStyle = '<link rel="stylesheet" href="css/site.css">';
    const externalStyle = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css">';
    const mutations = [
      ['duplicate required style', `${siteStyle}${siteStyle}`, /required local stylesheet.*site\.css.*exactly once|duplicate required local stylesheet/i],
      ['mismatched SRI', '<link rel="stylesheet" href="css/site.css" integrity="sha384-reviewer-mismatch">', /required local stylesheet.*site\.css.*only.*rel.*href|stylesheet attribute contract.*integrity/i],
      ['disabled', '<link rel="stylesheet" href="css/site.css" disabled>', /required local stylesheet.*site\.css.*only.*rel.*href|stylesheet attribute contract.*disabled/i],
      ['media', '<link rel="stylesheet" href="css/site.css" media=print>', /required local stylesheet.*site\.css.*only.*rel.*href|stylesheet attribute contract.*media/i],
      ['type', '<link rel="stylesheet" href="css/site.css" type=text/css>', /required local stylesheet.*site\.css.*only.*rel.*href|stylesheet attribute contract.*type/i],
      ['id', '<link id=site-css rel="stylesheet" href="css/site.css">', /required local stylesheet.*site\.css.*only.*rel.*href|stylesheet attribute contract.*id/i],
      ['duplicate href', '<link rel="stylesheet" href="css/site.css" href="css/site.css">', /required local stylesheet.*site\.css.*only.*rel.*href|stylesheet attribute contract.*href/i],
      ['duplicate rel', '<link rel="stylesheet" rel="stylesheet" href="css/site.css">', /required local stylesheet.*site\.css.*only.*rel.*href|stylesheet attribute contract.*rel/i],
      ['alternate stylesheet', '<link rel="alternate stylesheet" href="css/site.css">', /required local stylesheet.*site\.css.*only.*rel.*href|stylesheet attribute contract.*rel/i],
      ['missing rel', '<link href="css/site.css">', /required local stylesheet.*site\.css.*only.*rel.*href|missing required local stylesheet/i],
      ['boolean href', '<link rel="stylesheet" href>', /missing required local stylesheet.*site\.css|stylesheet.*valued href/i],
      ['missing href', '<link rel="stylesheet">', /missing required local stylesheet.*site\.css|stylesheet.*valued href/i]
    ];

    const undetected = [];
    for (const [label, replacement, expected] of mutations) {
      const html = baseline.replace(siteStyle, replacement);
      assert.notEqual(html, baseline, `${label}: fixture mutation did not apply`);
      fs.writeFileSync(homePath, html);
      const errors = validator.validatePortfolio(temporaryRoot).join('\n');
      if (!expected.test(errors)) undetected.push(`${label}: ${errors || '<no errors>'}`);
    }

    const externalWithAttributes = baseline.replace(externalStyle, externalStyle.replace('>', ' crossorigin=anonymous referrerpolicy=no-referrer media=all>'));
    assert.notEqual(externalWithAttributes, baseline, 'external stylesheet fixture mutation did not apply');
    fs.writeFileSync(homePath, externalWithAttributes);
    const externalErrors = validator.validatePortfolio(temporaryRoot);
    if (externalErrors.length) undetected.push(`external stylesheet preservation: ${externalErrors.join('\n')}`);

    assert.deepEqual(undetected, []);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 6 review round 5 uses only ASCII whitespace for rel tokens and exact hreflang values', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-task6-ascii-tokens-'));
  try {
    copyTask6Surface(temporaryRoot);
    const homePath = path.join(temporaryRoot, 'index.html');
    const baseline = fs.readFileSync(homePath, 'utf8');
    const canonical = '<link rel="canonical" href="https://rafaam11.github.io/">';
    const koAlternate = '<link rel="alternate" hreflang="ko" href="https://rafaam11.github.io/">';
    const siteStyle = '<link rel="stylesheet" href="css/site.css">';
    assert.deepEqual(validator.validatePortfolio(temporaryRoot), []);

    const asciiTokenLists = baseline
      .replace(canonical, '<link rel="author\t\n\f\r canonical" href="https://rafaam11.github.io/">')
      .replaceAll('rel="alternate"', 'rel="author \t\n\f\r alternate"')
      .replace(siteStyle, '<link rel=" \t\n\f\r stylesheet " href="css/site.css">');
    assert.notEqual(asciiTokenLists, baseline, 'ASCII token-list fixture mutation did not apply');
    fs.writeFileSync(homePath, asciiTokenLists);
    const asciiErrors = validator.validatePortfolio(temporaryRoot);

    const mutations = [
      {
        label: 'exact reviewer stylesheet named NBSP',
        html: baseline.replace(siteStyle, '<link rel="stylesheet&nbsp;" href="css/site.css">'),
        expected: /missing required local stylesheet.*site\.css|may use only.*rel="stylesheet"/i
      },
      {
        label: 'exact reviewer canonical named NBSP',
        html: baseline.replace(canonical, '<link rel="canonical&nbsp;" href="https://rafaam11.github.io/">'),
        expected: /exactly one correct parsed canonical link/i
      },
      {
        label: 'canonical numeric NBSP',
        html: baseline.replace(canonical, '<link rel="canonical&#160;" href="https://rafaam11.github.io/">'),
        expected: /exactly one correct parsed canonical link/i
      },
      {
        label: 'canonical hex NBSP',
        html: baseline.replace(canonical, '<link rel="canonical&#xA0;" href="https://rafaam11.github.io/">'),
        expected: /exactly one correct parsed canonical link/i
      },
      {
        label: 'canonical em-space',
        html: baseline.replace(canonical, '<link rel="canonical&emsp;" href="https://rafaam11.github.io/">'),
        expected: /exactly one correct parsed canonical link/i
      },
      {
        label: 'exact reviewer hreflang named NBSP',
        html: baseline.replace(koAlternate, '<link rel="alternate" hreflang="ko&nbsp;" href="https://rafaam11.github.io/">'),
        expected: /exactly one correct parsed alternate.*hreflang="ko"/i
      },
      {
        label: 'hreflang numeric NBSP',
        html: baseline.replace(koAlternate, '<link rel="alternate" hreflang="ko&#160;" href="https://rafaam11.github.io/">'),
        expected: /exactly one correct parsed alternate.*hreflang="ko"/i
      },
      {
        label: 'hreflang em-space',
        html: baseline.replace(koAlternate, '<link rel="alternate" hreflang="ko&emsp;" href="https://rafaam11.github.io/">'),
        expected: /exactly one correct parsed alternate.*hreflang="ko"/i
      },
      {
        label: 'hreflang ASCII padding',
        html: baseline.replace(koAlternate, '<link rel="alternate" hreflang=" ko " href="https://rafaam11.github.io/">'),
        expected: /exactly one correct parsed alternate.*hreflang="ko"/i
      }
    ];

    const undetected = asciiErrors.length ? [`valid ASCII token lists: ${asciiErrors.join('\n')}`] : [];
    for (const mutation of mutations) {
      assert.notEqual(mutation.html, baseline, `${mutation.label}: fixture mutation did not apply`);
      fs.writeFileSync(homePath, mutation.html);
      const errors = validator.validatePortfolio(temporaryRoot).join('\n');
      if (!mutation.expected.test(errors)) undetected.push(`${mutation.label}: ${errors || '<no errors>'}`);
    }
    assert.deepEqual(undetected, []);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 6 review round 5 classifies same-origin stylesheet URL variants as one local target', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-task6-style-origin-'));
  try {
    copyTask6Surface(temporaryRoot);
    const homePath = path.join(temporaryRoot, 'index.html');
    const baseline = fs.readFileSync(homePath, 'utf8');
    const siteStyle = '<link rel="stylesheet" href="css/site.css">';
    const variants = [
      'https://rafaam11.github.io/css/site.css',
      'https://RAFAAM11.GITHUB.IO:443/css/site.css?cache=1#site',
      '//RAFAAM11.GITHUB.IO:443/css/site.css?v=2#stylesheet',
      '/css/site.css?root=1#style'
    ];
    const undetected = [];

    for (const href of variants) {
      const duplicate = `<link rel="stylesheet" href="${href}">`;
      const html = baseline.replace(siteStyle, siteStyle + duplicate);
      assert.notEqual(html, baseline, `${href}: duplicate fixture mutation did not apply`);
      fs.writeFileSync(homePath, html);
      const errors = validator.validatePortfolio(temporaryRoot).join('\n');
      if (!/required local stylesheet.*site\.css.*exactly once.*found 2|duplicate required local stylesheet/i.test(errors)) {
        undetected.push(`duplicate ${href}: ${errors || '<no errors>'}`);
      }
    }

    for (const href of variants) {
      const html = baseline.replace(siteStyle, `<link rel="stylesheet" href="${href}">`);
      assert.notEqual(html, baseline, `${href}: replacement fixture mutation did not apply`);
      fs.writeFileSync(homePath, html);
      const errors = validator.validatePortfolio(temporaryRoot).join('\n');
      if (!/required local stylesheet.*site\.css.*exact file-compatible href/i.test(errors)) {
        undetected.push(`replacement ${href}: ${errors || '<no errors>'}`);
      }
    }

    fs.writeFileSync(homePath, baseline);
    const externalErrors = validator.validatePortfolio(temporaryRoot);
    if (externalErrors.length) undetected.push(`external Pretendard control: ${externalErrors.join('\n')}`);
    assert.deepEqual(undetected, []);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Integrated review separates evidence maturity from project lifecycle', () => {
  assert.deepEqual(data.projects.map((project) => [
    project.slug,
    project.evidenceState,
    project.lifecycleState
  ]), [
    ['surgical-navigation', 'ongoing', 'ongoing'],
    ['mandibular-fracture', 'verified', 'completed'],
    ['life-careverse', 'ongoing', 'ongoing'],
    ['rtms-navigation', 'prototype', 'ongoing'],
    ['respiratory-surface-guidance', 'ongoing', 'research'],
    ['skadi-tracking-software', 'ongoing', 'ongoing'],
    ['unmanned-forklift', 'ongoing', 'ongoing'],
    ['ai-build-lab', 'ongoing', 'ongoing']
  ]);

  const projectsHtml = render.projectGroupsHtml(data, '', false, 'en');
  assert.match(projectsHtml, /Verified · Completed/);
  assert.match(projectsHtml, /Prototype · Ongoing/);
  assert.match(projectsHtml, /Ongoing · Research/);
  assert.doesNotMatch(projectsHtml, /Ongoing · Ongoing/);
  const caseHtml = render.caseStudyHtml(data, 'mandibular-fracture', '../../', false, 'ko');
  assert.match(caseHtml, /<span>검증됨 · 완료<\/span>/);

  const missing = clone(data);
  delete missing.projects[0].lifecycleState;
  assert.match(validator.portfolioDataErrors(missing).join('\n'), /lifecycle state/i);
  const unknown = clone(data);
  unknown.projects[0].lifecycleState = 'paused';
  assert.match(validator.portfolioDataErrors(unknown).join('\n'), /unknown lifecycle state/i);
});

test('Integrated review rejects private project copy and keeps AI claims factual', () => {
  assert.equal(
    data.projects.find((project) => project.slug === 'ai-build-lab').translations.ko.role,
    '문제 맥락, 요구사항, 아키텍처, 수용 기준, 테스트, 릴리스, 운영 판단을 소유하고 AI를 구현 보조·증폭 수단으로 사용했습니다.'
  );
  assert.doesNotMatch(JSON.stringify(data.projects), /AI로 구현 속도를 높/i);

  const mutations = [
    'C:\\Users\\patient\\private\\raw\\scan.png',
    '\\\\server\\share\\secret.dcm',
    '010-1234-5678',
    'PatientName: Hong Gil Dong',
    'PatientID=CASE-001'
  ];
  for (const privateValue of mutations) {
    const candidate = clone(data);
    candidate.projects[0].translations.en.summary = privateValue;
    assert.match(render.validatePortfolioData(candidate).join('\n'), /private|PII|patient|path|phone/i, privateValue);
    assert.match(validator.portfolioDataErrors(candidate).join('\n'), /private|PII|patient|path|phone/i, privateValue);
  }

  const diagramLeak = clone(data);
  diagramLeak.projects[0].pdfSequence.diagram.translations.en.nodes[0] = 'C:\\Users\\reviewer\\private\\raw\\frame.png';
  assert.match(validator.portfolioDataErrors(diagramLeak).join('\n'), /private|path/i);
});

test('Integrated review scans every rendered canonical data surface and requires public project URLs', () => {
  const textMutations = [
    ['project technology', (candidate) => { candidate.projects[0].tech[0] = 'C:\\Users\\patient\\private\\raw\\scan.dcm'; }],
    ['capability method', (candidate) => { candidate.capabilities[0].methods[0] = 'C:\\Users\\patient\\private\\raw\\scan.dcm'; }],
    ['capability translation', (candidate) => { candidate.capabilities[0].translations.en.title = 'PatientName: Jane Doe'; }],
    ['capability age', (candidate) => { candidate.capabilities[0].translations.en.summary = '31-year-old engineer'; }],
    ['tier phone', (candidate) => { candidate.tiers[0].translations.ko.label = '010-1234-5678'; }],
    ['tier address', (candidate) => { candidate.tiers[0].translations.ko.label = '서울시 강남구'; }]
  ];
  for (const [label, mutate] of textMutations) {
    const candidate = clone(data);
    mutate(candidate);
    assert.match(render.dataErrors(candidate).join('\n'), /private|PII|patient|path|phone|age|address/i, label);
    assert.match(validator.portfolioDataErrors(candidate).join('\n'), /private|PII|patient|path|phone|age|address/i, label);
  }

  for (const href of [
    'http://example.com/publication',
    'https://localhost/internal',
    'http://127.0.0.1/internal?source=C%3A%5CUsers%5Cname',
    'https://example.com/?source=C:%5CUsers%5Cname%5Cprivate%5Craw%5Cscan.png'
  ]) {
    const candidate = clone(data);
    candidate.projects[1].links[0].href = href;
    assert.match(render.dataErrors(candidate).join('\n'), /unsafe project link/i, href);
    assert.match(validator.portfolioDataErrors(candidate).join('\n'), /unsafe project link|public HTTPS|private-network|local source path/i, href);
  }
});

test('Integrated review scans authored visible HTML for private paths and PII', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-public-html-privacy-'));
  try {
    copyTask6Surface(temporaryRoot);
    const homePath = path.join(temporaryRoot, 'index.html');
    const baseline = fs.readFileSync(homePath, 'utf8');
    const mutations = [
      ['C:\\Users\\patient\\private\\raw\\scan.png', /private source path|local path/i],
      ['010-1234-5678', /private PII|phone/i],
      ['PatientName: Hong Gil Dong', /private PII|patient/i]
    ];
    for (const [privateValue, expected] of mutations) {
      fs.writeFileSync(homePath, baseline.replace('</main>', `<p>${privateValue}</p></main>`));
      assert.match(validator.validatePortfolio(temporaryRoot).join('\n'), expected, privateValue);
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Integrated review forbids private resume source documents from the public tree', () => {
  assert.equal(typeof validator.forbiddenSourceDocumentErrors, 'function');
  assert.deepEqual(validator.forbiddenSourceDocumentErrors(root), []);

  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-source-docs-'));
  try {
    copyTask6Surface(temporaryRoot);
    const sourceDirectory = path.join(temporaryRoot, 'docs', '이력서');
    fs.mkdirSync(sourceDirectory, { recursive: true });
    fs.writeFileSync(path.join(sourceDirectory, '지원서-원본.md'), 'private resume source');
    fs.writeFileSync(path.join(temporaryRoot, 'application-original.docx'), 'private resume source');
    const errors = validator.validatePortfolio(temporaryRoot).join('\n');
    assert.match(errors, /private source document.*docs\/이력서\/지원서-원본\.md/i);
    assert.match(errors, /private source document.*application-original\.docx/i);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Integrated review marks a project-section nav item as a location, not the current page', () => {
  const html = nav.navigationHtml({
    base: '../../',
    current: 'projects',
    locale: 'ko',
    route: 'projects/mandibular-fracture/',
    isFile: false
  });
  assert.match(html, /href="\.\.\/\.\.\/projects\/"[^>]*aria-current="location"[^>]*>[\s\S]*?프로젝트</);
  assert.doesNotMatch(html, /href="\.\.\/\.\.\/projects\/"[^>]*aria-current="page"/);
  assert.match(read('css/site.css'), /\.td-site-nav \.nav-link\[aria-current="location"\]/);
});

test('Task 6 follow-up removes the dead case stylesheet and visual fallback metadata', () => {
  const violations = [];
  const caseCssPath = path.join(root, 'css', 'case-study.css');
  if (fs.existsSync(caseCssPath)) violations.push('css/case-study.css still exists');

  for (const slug of slugs) {
    for (const relativePath of [`projects/${slug}/index.html`, `en/projects/${slug}/index.html`]) {
      if (/case-study\.css/i.test(read(relativePath))) violations.push(`${relativePath}: case-study.css dependency`);
    }
  }
  if (/case-study\.css/i.test(read('scripts/validate-portfolio.cjs'))) {
    violations.push('validator still requires case-study.css');
  }
  for (const project of data.projects) {
    if (Object.prototype.hasOwnProperty.call(project, 'visualKey')) violations.push(`${project.slug}: visualKey`);
  }
  const rendererSource = read('js/portfolio-render.js');
  if (/fallbackVisualKeys|project\.visualKey/.test(rendererSource)) violations.push('renderer visual fallback contract');

  assert.deepEqual(violations, []);
});

test('Scholar gallery contract accepts up to six images and rejects other shapes', () => {
  const ok = clone(data);
  ok.projects[0].media.gallery = [
    { id: 'surgical-navigation-gallery-1', type: 'image', status: 'pending-approval' },
    { id: 'surgical-navigation-gallery-2', type: 'image', status: 'approved', publicPath: 'assets/projects/surgical-navigation/gallery-2.png',
      translations: { ko: { caption: '정합 화면', alt: '정합 화면 캡처' }, en: { caption: 'Registration view', alt: 'Registration view capture' } } }
  ];
  assert.deepEqual(render.dataErrors(ok).filter((error) => /gallery/i.test(error)), []);
  const mutations = [
    [(candidate) => { candidate.projects[0].media.gallery = 'nope'; }, /gallery must be an array/i],
    [(candidate) => { candidate.projects[0].media.gallery = Array.from({ length: 7 }, (_, index) => ({ id: `g-${index}`, type: 'image', status: 'pending-approval' })); }, /at most six/i],
    [(candidate) => { candidate.projects[0].media.gallery = [{ id: 'g-video', type: 'video', status: 'pending-approval' }]; }, /unsupported video media type/i],
    [(candidate) => { candidate.projects[0].media.gallery = [{ id: 'g-1', type: 'image', status: 'approved' }]; }, /approved media requires a public path/i],
    [(candidate) => { candidate.projects[0].media.gallery = [{ id: 'g-1', type: 'image', status: 'approved', publicPath: 'assets/projects/surgical-navigation/g-1.png' }]; }, /missing ko translation for caption/i],
    [(candidate) => { candidate.projects[0].media.gallery = [{ id: 'dup', type: 'image', status: 'pending-approval' }, { id: 'dup', type: 'image', status: 'pending-approval' }]; }, /duplicate gallery id/i]
  ];
  for (const [mutate, expected] of mutations) {
    const candidate = clone(data);
    mutate(candidate);
    assert.match(render.dataErrors(candidate).join('\n'), expected);
    assert.match(validator.portfolioDataErrors(candidate).join('\n'), expected);
  }
});

test('Scholar gallery items participate in evidence registry and public visual file checks', () => {
  const candidate = clone(data);
  candidate.projects[0].media.gallery = [{ id: 'surgical-navigation-gallery-unregistered', type: 'image', status: 'pending-approval' }];
  assert.match(validator.evidenceRegistryErrors(candidate, root).join('\n'), /gallery 0 surgical-navigation-gallery-unregistered: canonical media id is not registered/i);

  const approved = clone(data);
  approved.projects[0].media.gallery = [{ id: 'surgical-navigation-gallery-1', type: 'image', status: 'approved', publicPath: 'assets/projects/surgical-navigation/gallery-1.png',
    translations: { ko: { caption: 'c', alt: 'a' }, en: { caption: 'c', alt: 'a' } } }];
  const files = validator.publicPortfolioVisualFiles(root, approved).map((file) => file.relativePath.replace(/\\/g, '/'));
  assert.ok(files.includes('assets/projects/surgical-navigation/gallery-1.png'));
});

test('Scholar highlights contract validates publications, patents, and awards without patent numbers', () => {
  const base = {
    publications: [{ year: '2024', href: 'https://link.springer.com/article/10.1007/s10278-024-01014-z', translations: { ko: { title: '제목', venue: '학술지' }, en: { title: 'Title', venue: 'Journal' } } }],
    patents: { filed: 7, registered: 3, items: [{ year: '2024', status: 'registered', translations: { ko: { title: '특허' }, en: { title: 'Patent' } } }] },
    awards: [{ year: '2024', translations: { ko: { title: '수상' }, en: { title: 'Award' } } }]
  };
  const ok = clone(data);
  ok.highlights = clone(base);
  assert.deepEqual(render.dataErrors(ok).filter((error) => /highlight/i.test(error)), []);
  const mutations = [
    [(candidate) => { candidate.highlights = []; }, /highlights must be an object/i],
    [(candidate) => { candidate.highlights.publications = []; }, /require publications/i],
    [(candidate) => { candidate.highlights.publications[0].href = 'http://example.com/x'; }, /unsafe link/i],
    [(candidate) => { candidate.highlights.patents.registered = 9; }, /registered <= filed/i],
    [(candidate) => { candidate.highlights.patents.items[0].translations.ko.title = '특허 10-2024-0186869'; }, /patent number/i],
    [(candidate) => { candidate.highlights.awards[0].year = '24'; }, /four-digit year/i],
    [(candidate) => { delete candidate.highlights.awards[0].translations.en; }, /missing en translation for title/i]
  ];
  for (const [mutate, expected] of mutations) {
    const candidate = clone(data);
    candidate.highlights = clone(base);
    mutate(candidate);
    assert.match(render.dataErrors(candidate).join('\n'), expected);
  }
});

test('Scholar highlights data mirrors the approved public CV signals', () => {
  assert.ok(data.highlights, 'portfolio data exports highlights');
  assert.deepEqual(render.dataErrors(data).filter((error) => /highlight/i.test(error)), []);
  assert.equal(data.highlights.publications.length, 3);
  assert.equal(data.highlights.publications[0].href, 'https://link.springer.com/article/10.1007/s10278-024-01014-z');
  assert.deepEqual([data.highlights.patents.filed, data.highlights.patents.registered], [7, 3]);
  assert.equal(data.highlights.patents.items.length, 3);
  assert.ok(data.highlights.patents.items.every((item) => item.status === 'registered'));
  assert.equal(data.highlights.awards.length, 9);
  assert.doesNotMatch(JSON.stringify(data.highlights), /\b10-\d{4}-\d+\b|홍재성|안재명|강영남|최현석/);
});

test('Scholar CV refresh names the approved partners and products within the PDF line caps', () => {
  const cv = JSON.parse(read('data/public-cv.json'));
  assert.equal(cv.version, '2026-08-21');
  assert.equal(cv.achievements.asOf, '2026-08-21');
  const digitrack = cv.timeline[0];
  assert.match(digitrack.translations.ko.summary, /삼성서울병원/);
  assert.match(digitrack.translations.ko.summary, /SKADI/);
  assert.match(digitrack.translations.ko.summary, /DOTORI/);
  assert.match(digitrack.translations.en.summary, /Samsung Medical Center/);
  for (const entry of cv.timeline) {
    assert.ok(entry.translations.ko.summary.length <= 95, `${entry.organization}: ko summary ${entry.translations.ko.summary.length} chars`);
    assert.ok(entry.translations.en.summary.length <= 190, `${entry.organization}: en summary ${entry.translations.en.summary.length} chars`);
  }
  for (const capability of cv.capabilities) {
    assert.ok(capability.translations.ko.body.length <= 85, `${capability.translations.ko.title}: ko body`);
    assert.ok(capability.translations.en.body.length <= 170, `${capability.translations.en.title}: en body`);
  }
  assert.doesNotMatch(JSON.stringify(cv), /박사|진학|이직|PhD|admission|홍재성|안재명|강영남|최현석|\b10-\d{4}-\d+\b/);
  assert.deepEqual(validator.publicCvDataErrors(cv), []);
});
