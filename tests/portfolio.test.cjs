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

const slugs = [
  'surgical-navigation',
  'mandibular-fracture',
  'life-careverse',
  'rtms-navigation',
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
const tierKeys = ['medical-core', 'industrial-spotlight', 'ai-build-lab'];
const validPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
const excludedProjectSlugs = [
  'ar-distance-meter',
  'c-arm-navigation',
  'llm-wiki',
  'oral-facial-ar',
  'orthognathic-ar',
  'quadruped-robot',
  'radioactive-digital-twin',
  'respiratory-surface-guidance',
  'surgical-twin'
];
const standaloneLegacyFiles = [
  'js/scripts.js',
  'js/spatial-signal.js',
  'css/styles.css',
  'css/cv-theme.css'
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

function copyTask5Surface(targetRoot) {
  for (const relativePath of ['output/pdf', 'assets/pdfs', 'assets/cv']) {
    fs.cpSync(path.join(root, relativePath), path.join(targetRoot, relativePath), { recursive: true });
  }
  for (const relativePath of ['data/public-cv.json', 'assets/projects/EVIDENCE_REGISTER.md', 'cv/index.html', 'en/cv/index.html']) {
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
    'css/site.css',
    'css/spatial-signal.css',
    'css/case-study.css',
    'css/cv-pdf.css',
    'js/site-i18n.js',
    'js/portfolio-data.js',
    'js/portfolio-render.js',
    'js/nav.js'
  ]) {
    const target = path.join(targetRoot, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, relativePath), target);
  }
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

function withEvidenceRoot(registerText, callback) {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-evidence-'));
  try {
    const registerPath = path.join(temporaryRoot, 'assets', 'projects', 'EVIDENCE_REGISTER.md');
    fs.mkdirSync(path.dirname(registerPath), { recursive: true });
    fs.writeFileSync(registerPath, registerText);
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
  assert.equal(register.entries.length, 11);
  assert.deepEqual(
    Object.fromEntries(['pending-review', 'approved-public', 'excluded'].map((state) => [
      state,
      register.entries.filter((entry) => entry.state === state).length
    ])),
    { 'pending-review': 8, 'approved-public': 3, excluded: 0 }
  );
  assert.deepEqual(validator.evidenceRegistryErrors(data, root), []);

  for (const slug of slugs) {
    const readme = path.join(root, 'assets', 'projects', slug, 'README.md');
    assert.equal(fs.existsSync(readme), true, `${slug}: missing public-safe evidence README`);
  }

  const serialized = fs.readFileSync(path.join(root, 'assets', 'projects', 'EVIDENCE_REGISTER.md'), 'utf8');
  assert.doesNotMatch(serialized, /(?:(?:^|[\s(])(?:[A-Za-z]:[\\/]|\\\\)|file:\/\/|OneDrive|Teams|private[\\/]raw|\b(?:CT|MRI|patient|hospital)\b)/i);
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

  const missing = evidenceRegisterText(rows.filter((entry) => entry.id !== 'forklift-registration-pointcloud'));
  withEvidenceRoot(missing, (temporaryRoot) => {
    assert.match(validator.evidenceRegistryErrors(data, temporaryRoot).join(' '), /forklift-registration-pointcloud.*not registered/i);
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

  const pendingWithPath = evidenceRegisterText(rows.map((entry) => entry.id === 'forklift-registration-pointcloud'
    ? { ...entry, source: 'assets/projects/unmanned-forklift/point-cloud.png' }
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
  candidate.projects[4].media.lead = {
    id: 'forklift-registration-pointcloud',
    type: 'image',
    status: 'approved',
    publicPath: 'assets/projects/unmanned-forklift/point-cloud.png'
  };
  const canonical = validator.readEvidenceRegister(root).entries;
  const approvedRows = canonical.map((entry) => entry.id === 'forklift-registration-pointcloud'
    ? { ...entry, state: 'approved-public', source: candidate.projects[4].media.lead.publicPath }
    : entry);

  withEvidenceRoot(evidenceRegisterText(approvedRows), (temporaryRoot) => {
    assert.match(validator.evidenceRegistryErrors(candidate, temporaryRoot).join(' '), /missing approved local asset/i);
    const target = path.join(temporaryRoot, candidate.projects[4].media.lead.publicPath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, 'not a png');
    assert.match(validator.evidenceRegistryErrors(candidate, temporaryRoot).join(' '), /valid intrinsic dimensions/i);
    fs.writeFileSync(target, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'));
    assert.deepEqual(validator.evidenceRegistryErrors(candidate, temporaryRoot), []);
  });

  for (const publicPath of [
    'assets/projects/surgical-navigation/point-cloud.png',
    'assets/projects/unmanned-forklift/PointCloud.png',
    'assets/projects/unmanned-forklift/point-cloud.svg'
  ]) {
    const malformed = clone(candidate);
    malformed.projects[4].media.lead.publicPath = publicPath;
    const malformedRows = canonical.map((entry) => entry.id === 'forklift-registration-pointcloud'
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
    id: 'surgical-navigation-demo', type: 'video', status: 'approved',
    publicPath: 'assets/projects/surgical-navigation/navigation-demo.mp4'
  };
  project.media.video = { ...project.media.lead };
  project.media.poster = {
    id: 'surgical-navigation-demo-poster', type: 'image', status: 'approved',
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
    fs.writeFileSync(videoPath, Buffer.from('public-safe-video-fixture'));
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
  const approvedSource = 'assets/projects/unmanned-forklift/point-cloud.png';
  const approved = evidenceRegisterText(entries.map((entry) => entry.id === 'forklift-registration-pointcloud'
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
  candidate.projects[4].media.lead = {
    id: 'forklift-registration-pointcloud', type: 'image', status: 'approved',
    publicPath: 'assets/projects/unmanned-forklift/point-cloud.png'
  };
  const canonical = validator.readEvidenceRegister(root).entries;
  const approved = evidenceRegisterText(canonical.map((entry) => entry.id === 'forklift-registration-pointcloud'
    ? { ...entry, state: 'approved-public', source: candidate.projects[4].media.lead.publicPath }
    : entry));

  withEvidenceRoot(approved, (temporaryRoot) => {
    const projectDirectory = path.join(temporaryRoot, 'assets', 'projects', 'unmanned-forklift');
    fs.mkdirSync(projectDirectory, { recursive: true });
    fs.writeFileSync(path.join(projectDirectory, 'Point-Cloud.png'), validPng);
    assert.match(validator.evidenceRegistryErrors(candidate, temporaryRoot).join(' '), /exact filesystem case/i);
  });

  withEvidenceRoot(approved, (temporaryRoot) => {
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-evidence-outside-'));
    try {
      fs.writeFileSync(path.join(outside, 'point-cloud.png'), validPng);
      const projectDirectory = path.join(temporaryRoot, 'assets', 'projects', 'unmanned-forklift');
      fs.symlinkSync(outside, projectDirectory, process.platform === 'win32' ? 'junction' : 'dir');
      assert.match(validator.evidenceRegistryErrors(candidate, temporaryRoot).join(' '), /symbolic link|reparse point|realpath escape/i);
    } finally {
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });
});

test('Task 4 review rejects truncated or corrupt PNG files that only expose an IHDR size', () => {
  const candidate = clone(data);
  candidate.projects[4].media.lead = {
    id: 'forklift-registration-pointcloud', type: 'image', status: 'approved',
    publicPath: 'assets/projects/unmanned-forklift/point-cloud.png'
  };
  const canonical = validator.readEvidenceRegister(root).entries;
  const approved = evidenceRegisterText(canonical.map((entry) => entry.id === 'forklift-registration-pointcloud'
    ? { ...entry, state: 'approved-public', source: candidate.projects[4].media.lead.publicPath }
    : entry));

  for (const payload of [validPng.subarray(0, 24), (() => {
    const corrupted = Buffer.from(validPng);
    corrupted[42] ^= 0xff;
    return corrupted;
  })()]) {
    withEvidenceRoot(approved, (temporaryRoot) => {
      const target = path.join(temporaryRoot, candidate.projects[4].media.lead.publicPath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, payload);
      assert.match(validator.evidenceRegistryErrors(candidate, temporaryRoot).join(' '), /structurally complete and decodable/i);
    });
  }
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

test('Task 4 review root inventory permits only the register and six canonical project directories', () => {
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

  const blankPendingSource = evidenceRegisterText(canonical.map((entry, index) => index === 0
    ? { ...entry, source: '' }
    : entry));
  withEvidenceRoot(blankPendingSource, (temporaryRoot) => {
    assert.match(validator.evidenceRegistryErrors(data, temporaryRoot).join(' '), /source must be exactly "-"/i);
  });

  const restrictedCandidate = clone(data);
  restrictedCandidate.projects[4].media.lead = {
    id: 'forklift-registration-pointcloud', type: 'image', status: 'approved',
    publicPath: 'assets/projects/unmanned-forklift/extracted/point-cloud.png'
  };
  const restrictedRows = evidenceRegisterText(canonical.map((entry) => entry.id === 'forklift-registration-pointcloud'
    ? { ...entry, state: 'approved-public', source: restrictedCandidate.projects[4].media.lead.publicPath }
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
    ['industrial-spotlight', '산업 스포트라이트', 'Industrial Spotlight'],
    ['ai-build-lab', 'AI 빌드 랩', 'AI Build Lab']
  ]);
  assert.deepEqual(data.projects.map((project) => [project.slug, project.tier, project.evidenceState]), [
    ['surgical-navigation', 'medical-core', 'ongoing'],
    ['mandibular-fracture', 'medical-core', 'verified'],
    ['life-careverse', 'medical-core', 'ongoing'],
    ['rtms-navigation', 'medical-core', 'prototype'],
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
  named.projects[0].translations.en.summary += ' Samsung Medical partner.';
  assert.match(validator.portfolioDataErrors(named).join(' '), /nonpublic partner/i);
});

test('canonical validator rejects malformed capabilities, tiers, states, blocks, and media', () => {
  const mutations = [
    [(candidate) => { candidate.capabilities[0].key = 'unknown'; }, /known ordered keys/i],
    [(candidate) => { candidate.projects[0].tier = 'featured'; }, /unknown tier/i],
    [(candidate) => { candidate.projects[0].evidenceState = 'completed'; }, /unknown evidence state/i],
    [(candidate) => { candidate.projects[0].blocks[0].type = 'timeline'; }, /unsupported block type/i],
    [(candidate) => { candidate.projects[0].media.lead.publicPath = 'assets/private/demo.mp4'; }, /pending-approval media must not declare a public path/i],
    [(candidate) => { delete candidate.projects.at(-1).media.lead.publicPath; }, /approved media requires a public path/i],
    [(candidate) => { candidate.projects[0].pdf.ko = 'download.pdf'; }, /invalid ko PDF path/i]
  ];
  for (const [mutate, expected] of mutations) {
    const candidate = clone(data);
    mutate(candidate);
    assert.match(validator.portfolioDataErrors(candidate).join(' '), expected);
  }
});

test('route descriptors keep four public pages and six paired case routes', () => {
  assert.deepEqual(i18n.supportedNavigationPages, ['home', 'projects', 'cv', 'contact']);
  assert.deepEqual(i18n.canonicalCaseSlugs, slugs);
  assert.deepEqual(validator.portfolioRoutes().map((item) => item.route), [
    '', 'projects/', 'cv/', 'contact/', ...slugs.map((slug) => `projects/${slug}/`)
  ]);
  const files = canonicalPages();
  assert.equal(files.length, 20);
  assert.equal(new Set(files.map((item) => item.relativePath)).size, 20);
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

test('Task 3 Home renderer creates six ordered title-led links without card marketing copy', () => {
  const html = render.homeProjectGalleryHtml(data, '', false, 'en');
  assert.equal(count(html, 'class="td-home-project"'), 6);
  assertInOrder(html, data.projects.map((project) => project.translations.en.title.replace(/&/g, '&amp;')), 'Home projects');
  for (const project of data.projects) {
    assert.match(html, new RegExp(`href="en/projects/${project.slug}/"`));
    assert.doesNotMatch(html, new RegExp(project.translations.en.summary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.doesNotMatch(html, new RegExp(project.translations.en.role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.doesNotMatch(html, /td-status|td-tech-list|project-summary|project-role/);
});

test('Task 3 review Home tiles render approved images with alt and ledger only', () => {
  const candidate = clone(data);
  candidate.projects[0].media.lead = {
    id: 'surgical-navigation-public-image',
    type: 'image',
    status: 'approved',
    publicPath: 'assets/projects/surgical-navigation/lead.webp'
  };
  const html = render.homeProjectGalleryHtml(candidate, '../', true, 'en');
  const firstTile = html.match(/<article class="td-home-project">[\s\S]*?<\/article>/)?.[0] || '';
  assert.match(firstTile, /<img\b(?=[^>]*src="\.\.\/assets\/projects\/surgical-navigation\/lead\.webp")(?=[^>]*alt="Surgical-navigation demonstration connecting tracked equipment and medical-image models to a HoloLens spatial view\.")/);
  assert.match(firstTile, /Public evidence[\s\S]*IMAGE[\s\S]*Surgical Navigation/);
  assert.doesNotMatch(firstTile, /td-home-project__fallback|td-home-project__caption|The actual integrated demonstration will be published only after approval\./);
});

test('Task 3 review Home video tiles use an approved poster without autoplay or inline video', () => {
  const candidate = clone(data);
  candidate.projects[0].media.lead = {
    id: 'surgical-navigation-public-video',
    type: 'video',
    status: 'approved',
    publicPath: 'assets/projects/surgical-navigation/demo.mp4'
  };
  candidate.projects[0].media.poster = {
    id: 'surgical-navigation-public-poster',
    type: 'image',
    status: 'approved',
    publicPath: 'assets/projects/surgical-navigation/poster.webp'
  };
  const html = render.homeProjectGalleryHtml(candidate, '', false, 'ko');
  const firstTile = html.match(/<article class="td-home-project">[\s\S]*?<\/article>/)?.[0] || '';
  assert.match(firstTile, /<img\b(?=[^>]*src="assets\/projects\/surgical-navigation\/poster\.webp")(?=[^>]*alt="추적 장치와 의료영상 모델이 HoloLens 공간 표시로 연결되는 수술내비게이션 시연\.")/);
  assert.match(firstTile, /공개 근거[\s\S]*VIDEO[\s\S]*수술내비게이션/);
  assert.doesNotMatch(firstTile, /<video\b|autoplay|demo\.mp4/);
});

test('Task 3 Home evidence mosaic and capability index follow the required data order', () => {
  const mosaic = render.homeEvidenceMosaicHtml(data, 'en');
  assert.equal(count(mosaic, 'class="td-mosaic-cell"'), 3);
  assertInOrder(mosaic, ['Registration', 'Surgical navigation', 'Sensor fusion'], 'Home evidence mosaic');
  assert.doesNotMatch(mosaic, /<img|<video|<svg/i, 'pending evidence must remain an honest technical panel');
  assert.doesNotMatch(mosaic, /<figcaption/i, 'mosaic ledger must not use figcaption outside a figure');

  const index = render.capabilityIndexHtml(data, 'en');
  assert.equal(count(index, 'class="td-capability-row"'), 5);
  assertInOrder(index, data.capabilities.map((item) => item.translations.en.title.replace(/&/g, '&amp;')), 'capability index');
  for (const capability of data.capabilities) {
    const method = capability.methods[0].replace(/&/g, '&amp;').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(index, new RegExp(method));
  }
  assert.doesNotMatch(index, /rating|progress|capability-card/i);
});

test('Task 3 review hero mosaic renders approved images with truthful alt and ledger', () => {
  const candidate = clone(data);
  candidate.projects[1].media.lead = {
    id: 'mandibular-public-image',
    type: 'image',
    status: 'approved',
    publicPath: 'assets/projects/mandibular-fracture/lead.webp'
  };
  const html = render.homeEvidenceMosaicHtml(candidate, 'en', '../');
  const firstCell = [...html.matchAll(/<article class="td-mosaic-cell">([\s\S]*?)<\/article>/g)][0]?.[0] || '';
  assert.match(firstCell, /<img\b(?=[^>]*class="td-mosaic-cell__image")(?=[^>]*src="\.\.\/assets\/projects\/mandibular-fracture\/lead\.webp")(?=[^>]*alt="Presentation and award evidence for mandibular fracture reduction research\.")/);
  assert.match(firstCell, /Verified[\s\S]*Public evidence[\s\S]*IMAGE[\s\S]*Mandibular Fracture Optimization/);
  assert.doesNotMatch(firstCell, /role="img"|Representative technical panel|Pending approval/);
});

test('Task 3 review hero mosaic renders an approved video poster without inline playback', () => {
  const candidate = clone(data);
  candidate.projects[0].media.lead = {
    id: 'surgical-navigation-public-video',
    type: 'video',
    status: 'approved',
    publicPath: 'assets/projects/surgical-navigation/demo.mp4'
  };
  candidate.projects[0].media.video = clone(candidate.projects[0].media.lead);
  candidate.projects[0].media.poster = {
    id: 'surgical-navigation-public-poster',
    type: 'image',
    status: 'approved',
    publicPath: 'assets/projects/surgical-navigation/poster.webp'
  };
  const html = render.homeEvidenceMosaicHtml(candidate, 'ko');
  const secondCell = [...html.matchAll(/<article class="td-mosaic-cell">([\s\S]*?)<\/article>/g)][1]?.[0] || '';
  assert.match(secondCell, /<img\b(?=[^>]*class="td-mosaic-cell__image td-mosaic-cell__poster")(?=[^>]*src="assets\/projects\/surgical-navigation\/poster\.webp")(?=[^>]*alt="추적 장치와 의료영상 모델이 HoloLens 공간 표시로 연결되는 수술내비게이션 시연\.")/);
  assert.match(secondCell, /진행 중[\s\S]*공개 근거[\s\S]*VIDEO[\s\S]*수술내비게이션/);
  assert.doesNotMatch(secondCell, /<video\b|autoplay|demo\.mp4/);
});

test('Task 3 review hero mosaic labels a nonvisual approved lead as representative, not actual media', () => {
  const candidate = clone(data);
  candidate.projects[1].media.lead = {
    id: 'mandibular-publication-lead',
    type: 'repository',
    status: 'approved',
    publicPath: 'https://example.com/public-evidence'
  };
  const html = render.homeEvidenceMosaicHtml(candidate, 'en');
  const firstCell = [...html.matchAll(/<article class="td-mosaic-cell">([\s\S]*?)<\/article>/g)][0]?.[0] || '';
  assert.match(firstCell, /role="img" aria-label="Representative technical panel; no actual demo or photograph is shown\."/);
  assert.match(firstCell, /Verified[\s\S]*Public evidence[\s\S]*REPOSITORY[\s\S]*Mandibular Fracture Optimization/);
  assert.doesNotMatch(firstCell, /Pending approval/);
  assert.doesNotMatch(firstCell, /<img\b|Presentation and award evidence for mandibular fracture reduction research\./);
});

test('Task 3 Home shells preserve exact thesis, section order, and six-link no-JS fallback', () => {
  const pages = [
    ['index.html', '3D 정합과 공간 시스템을 설계하고 구현합니다.', data.projects.map((item) => item.translations.ko.title)],
    ['en/index.html', 'I design and build 3D registration and spatial systems.', data.projects.map((item) => item.translations.en.title)]
  ];
  for (const [file, thesis, titles] of pages) {
    const html = read(file);
    assert.match(html, new RegExp(thesis.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assertInOrder(html, ['td-home-hero', 'data-portfolio="home-projects"', 'data-portfolio="capability-index"', 'td-home-contact'], file);
    const fallback = html.match(/<div class="td-home-projects__fallback">([\s\S]*?)<\/div>\s*<\/section>/)?.[1] || '';
    assert.equal(count(fallback, '<a '), 6, `${file}: fallback link count`);
    assertInOrder(fallback, titles, `${file}: fallback project titles`);
  }
});

test('Task 3 Projects renderer groups four Medical Core cases then two full-width spotlights', () => {
  const html = render.projectGroupsHtml(data, '../', false, 'en');
  assertInOrder(html, ['data-tier="medical-core"', 'data-tier="industrial-spotlight"', 'data-tier="ai-build-lab"'], 'project tiers');
  const medical = html.match(/<section[^>]*data-tier="medical-core"[\s\S]*?<\/section>/)?.[0] || '';
  assert.equal(count(medical, 'class="td-project-card"'), 4);
  assert.match(medical, /Surgical Navigation Systems/);
  assert.ok(medical.indexOf('Surgical Navigation Systems') < medical.indexOf('Mandibular Fracture Reduction Optimization'));
  assert.equal(count(html, 'class="td-project-row td-project-row--feature"'), 2);
  assert.match(html, /Personal role[\s\S]*Team result/);
  assert.doesNotMatch(html, /capability-chapter|Featured|More Projects|13 projects/i);
});

test('Task 3 media renderer shows pending provenance without broken media', () => {
  const project = data.projects[0];
  const html = render.evidenceMediaHtml(project, 'en', '../../', false);
  assert.match(html, /data-media-status="pending-approval"/);
  assert.match(html, /Pending approval/);
  assert.match(html, /video/i);
  assert.match(html, new RegExp(project.translations.en.mediaCaption.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(html, /<(?:img|video)\b/i);
});

test('Task 3 review pending visual names disclose approval state without claiming an actual demo', () => {
  const expectations = {
    ko: '공개 시각 자료 승인 대기: 실제 데모 또는 사진을 표시하지 않습니다.',
    en: 'Public visual pending approval; no actual demo or photograph is shown.'
  };
  for (const locale of ['ko', 'en']) {
    const project = data.projects[0];
    const detail = render.evidenceMediaHtml(project, locale, '../../', false);
    const home = render.homeProjectGalleryHtml(data, '', false, locale);
    const mosaic = render.homeEvidenceMosaicHtml(data, locale);
    for (const [surface, html] of [['detail', detail], ['home', home], ['mosaic', mosaic]]) {
      const accessibleNames = [...html.matchAll(/role="img"[^>]*aria-label="([^"]+)"/g)].map((match) => match[1]);
      assert.ok(accessibleNames.includes(expectations[locale]), `${locale} ${surface}: pending accessible name missing`);
      assert.equal(accessibleNames.some((name) => name.includes(project.translations[locale].mediaAlt)), false, `${locale} ${surface}: pending name claims desired media is shown`);
    }
    assert.match(detail, new RegExp(project.translations[locale].mediaCaption.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Task 3 approved video contract is poster-led, click-to-play, and keyboard reachable', () => {
  const project = clone(data.projects[0]);
  project.media.lead = { id: 'approved-demo', type: 'video', status: 'approved', publicPath: 'assets/projects/demo.mp4' };
  project.media.poster = { id: 'approved-poster', type: 'image', status: 'approved', publicPath: 'assets/projects/poster.webp' };
  const html = render.evidenceMediaHtml(project, 'en', '../../', false);
  assert.match(html, /<video\b(?=[^>]*\bcontrols\b)(?=[^>]*\bpreload="none")(?=[^>]*\bposter="\.\.\/\.\.\/assets\/projects\/poster\.webp")(?=[^>]*\btabindex="0")[^>]*>/);
  assert.match(html, /<source src="\.\.\/\.\.\/assets\/projects\/demo\.mp4"/);
  assert.doesNotMatch(html, /\bautoplay\b|\bmuted\b/);
});

test('Task 3 approved video without an approved poster stays an honest fallback', () => {
  const project = clone(data.projects[0]);
  project.media.lead = { id: 'approved-demo', type: 'video', status: 'approved', publicPath: 'assets/projects/demo.mp4' };
  project.media.poster = { id: 'pending-poster', type: 'image', status: 'pending-approval' };
  const html = render.evidenceMediaHtml(project, 'en', '../../', false);
  assert.match(html, /td-evidence-placeholder/);
  assert.doesNotMatch(html, /<video\b|assets\/projects\/demo\.mp4/);
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
  assert.match(directHtml, /td-evidence-placeholder/);
  assert.doesNotMatch(directHtml, /<video\b|poster\.mp4/);
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

test('Task 3 case renderer uses project-specific blocks and separates role from team result', () => {
  const project = clone(data.projects[1]);
  project.blocks = [
    { key: 'text', type: 'text', translations: { ko: { heading: '텍스트', body: '본문' }, en: { heading: 'Text block', body: 'Text body' } } },
    { key: 'list', type: 'list', translations: { ko: { heading: '목록', items: ['하나', '둘'] }, en: { heading: 'List block', items: ['One', 'Two'] } } },
    { key: 'system', type: 'system', translations: { ko: { heading: '시스템', body: '흐름' }, en: { heading: 'System block', body: 'System flow' } } },
    { key: 'evidence', type: 'evidence', translations: { ko: { heading: '근거', body: '증거' }, en: { heading: 'Evidence block', body: 'Evidence body' } } },
    { key: 'limit', type: 'limitation', translations: { ko: { heading: '한계', body: '경계' }, en: { heading: 'Limit block', body: 'Limit body' } } }
  ];
  const candidate = clone(data);
  candidate.projects[1] = project;
  const html = render.caseStudyHtml(candidate, project.slug, '../../../', true, 'en');
  assertInOrder(html, ['td-case__header', 'td-case__thesis', 'td-fact-ledger', 'td-evidence-frame', 'td-case__blocks', 'td-team-result', 'td-evidence-limits', 'td-pdf-cta', 'td-case-contact'], 'case sequence');
  for (const type of ['text', 'list', 'system', 'evidence', 'limitation']) assert.match(html, new RegExp(`data-block-type="${type}"`));
  assert.match(html, /<ul>[\s\S]*<li>One<\/li>[\s\S]*<li>Two<\/li>/);
  assert.match(html, /Personal role[\s\S]*Team result/);
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/assets\/pdfs\/mandibular-fracture-en\.pdf"/);
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/en\/contact\/index\.html"/);
  assert.doesNotMatch(html, /Decision Timeline|decision-step/);
});

test('Task 3 all twelve case shells share one fetch-free, localized renderer contract', () => {
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
        '[data-portfolio="project-groups"]': [projects],
        '[data-portfolio="case-study"]': [validCase, invalidCase]
      })[selector] || [];
    }
  };
  assert.doesNotThrow(() => render.mountAll(fakeDocument, data));
  const once = [home.innerHTML, capabilities.innerHTML, projects.innerHTML, validCase.innerHTML];
  assert.doesNotThrow(() => render.mountAll(fakeDocument, data));
  assert.deepEqual([home.innerHTML, capabilities.innerHTML, projects.innerHTML, validCase.innerHTML], once);
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

test('Task 3 Contact asks joint-development partners for problem, data or sensors, validation, and schedule', () => {
  const pages = [
    ['contact/index.html', [/공동개발/, /문제/, /데이터|센서/, /검증/, /일정/]],
    ['en/contact/index.html', [/joint development/i, /problem/i, /data|sensors/i, /validation/i, /schedule/i]]
  ];
  for (const [file, patterns] of pages) {
    const html = read(file);
    for (const pattern of patterns) assert.match(html, pattern, `${file}: ${pattern}`);
    assert.match(html, /mailto:uiop3847@naver\.com/);
    assert.match(html, /https:\/\/github\.com\/rafaam11/);
    assert.doesNotMatch(html, /<form\b|LinkedIn|response time|consultation|시니어 R&amp;D|채용/i);
  }
});

test('Task 3 technical-document CSS exposes the instrument palette, grid, provenance, focus, and reduced motion', () => {
  const css = [read('css/site.css'), read('css/case-study.css'), read('css/spatial-signal.css')].join('\n');
  for (const value of ['#eef1ef', '#fbfcfb', '#101715', '#586560', '#b9c4c0', '#0c6b5e', '#a94b32']) assert.match(css, new RegExp(value, 'i'));
  assert.match(css, /--td-max:\s*1240px/);
  assert.match(css, /repeat\(12,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /\.td-media-ledger/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  const technical = css.match(/\/\* Task 3 technical-document system \*\/[\s\S]*?\/\* Task 3 technical-document system end \*\//)?.[0] || '';
  assert.doesNotMatch(technical, /gradient|box-shadow/i);
});

test('Task 3 review technical-document CSS stays narrow, touch, and reduced-motion safe', () => {
  const siteCss = read('css/site.css');
  const caseCss = read('css/case-study.css');
  const spatialCss = read('css/spatial-signal.css');
  assert.ok(cssRuleBodies(siteCss, '.td-site-nav .nav-link').some((body) => /min-height\s*:\s*44px/.test(body)));
  assert.ok(cssRuleBodies(caseCss, '.td-pdf-cta > a').some((body) => /min-height\s*:\s*44px/.test(body)));
  assert.ok(cssAtRuleBodies(spatialCss, /@media\s*\(max-width:\s*700px\)/i)
    .some((body) => /\.td-project-row[\s\S]*grid-template-columns:\s*1fr/.test(body)));
  assert.ok(cssAtRuleBodies(caseCss, /@media\s*\(max-width:\s*760px\)/i)
    .some((body) => /\.td-case-block[\s\S]*grid-column:\s*1\s*\/\s*-1/.test(body)));
  assert.ok(cssAtRuleBodies(spatialCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)/i)
    .some((body) => /\.td-shell\s+\*[\s\S]*animation:\s*none\s*!important[\s\S]*transition-duration:\s*\.01ms\s*!important/.test(body)));
});

test('Task 3 review case block title scale wins the trailing Spatial Signal cascade', () => {
  const css = read('css/spatial-signal.css');
  const generalRuleIndex = css.indexOf('.td-shell h2 { font-size: var(--td-section); }');
  const overrideIndex = css.indexOf('.td-shell .td-case-block h2');
  assert.ok(generalRuleIndex >= 0, 'expected the general technical-document H2 scale');
  assert.ok(overrideIndex > generalRuleIndex, 'case block override must follow the general H2 rule');
  assert.ok(cssRuleBodies(css, '.td-shell .td-case-block h2')
    .some((body) => /font-size\s*:\s*var\(--td-title\)/.test(body)));
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
    assert.equal(exported.cv.version, '2026-08-16');
    assert.deepEqual(validator.publicCvDataErrors(exported.cv), []);
    assert.doesNotMatch(fs.readFileSync(first, 'utf8'), /(?:(?:^|[\s"'(])(?:[A-Za-z]:[\\/]|\\\\)|file:\/\/|OneDrive|private[\\/]raw)/i);
    assert.doesNotMatch(JSON.stringify(exported.cv), /\b(?:phone|salary|professor|patient|hospital)\b/i);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('Task 5 publishes exactly twelve six-page project PDFs and two two-page CV PDFs', () => {
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
    assert.doesNotMatch(bytes.toString('latin1'), /(?:^|[\s"'(])(?:[A-Za-z]:[\\/]|\\\\)|file:\/\/|OneDrive|private[\\/]raw/i);
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
  assert.doesNotMatch(publicCv, /(?:\b\d{2,3}-\d{3,4}-\d{4}\b|\b10-\d{4}-\d+\b|\b(?:age|salary|professor|advisor|patient|hospital|customer)\b|나이|연봉|지도교수|환자|병원|고객|3\s*[–-]\s*4개월|1\s*[–-]\s*2주|주\s*단위|월\s*단위)/i);
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
    assert.equal(manifest.schemaVersion, 2);
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
  assert.equal(manifest.schemaVersion, 2);
  assert.match(manifest.sourceDigest, /^[a-f0-9]{64}$/);
  assert.equal(manifest.artifacts.length, 32);
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
  assert.deepEqual(validator.publicPortfolioVisualFiles(root), []);
});

test('published localized pages never rewrite parent traversal into external URLs', () => {
  for (const file of canonicalPages().filter((item) => fs.existsSync(item.absolutePath))) {
    assert.doesNotMatch(fs.readFileSync(file.absolutePath, 'utf8'), /https?:\/\/[^"\s]*\/\.\.\//, file.relativePath);
  }
});

test('Task 6 tracked site HTML inventory is exactly the twenty canonical localized routes', () => {
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
      [baseline.replace('<link rel="stylesheet" href="../../css/case-study.css">', ''), /missing required local stylesheet.*case-study\.css/i],
      [baseline.replace('<script src="../../js/portfolio-data.js"></script>', ''), /missing required local script.*portfolio-data\.js/i],
      [baseline.replace('<link rel="stylesheet" href="../../css/case-study.css">', '<!-- <link rel="stylesheet" href="../../css/case-study.css"> -->'), /missing required local stylesheet.*case-study\.css/i],
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
