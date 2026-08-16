const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');

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
const retainedLegacyProjectSlugs = [
  'surgical-twin', 'rtms-navigation', 'mandibular-fracture', 'c-arm-navigation',
  'unmanned-forklift', 'quadruped-robot', 'radioactive-digital-twin', 'life-careverse',
  'orthognathic-ar', 'oral-facial-ar', 'ar-distance-meter',
  'respiratory-surface-guidance', 'llm-wiki'
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

test('Task 3 review retains paired and file-safe CV and legacy routes until Task 6', () => {
  const pages = [
    { route: 'research/', file: 'research/index.html' },
    { route: 'cv/', file: 'cv/index.html' }
  ].concat(retainedLegacyProjectSlugs.map((slug) => ({
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

test('full validator scans live SVGs and passes the twenty-page public contract', () => {
  assert.deepEqual(validator.validatePortfolio(root), []);
  const live = validator.publicPortfolioVisualFiles(root);
  assert.ok(live.some((item) => item.relativePath.replace(/\\/g, '/') === 'assets/diagrams/decision-signal.svg'));
  assert.ok(live.some((item) => item.relativePath.replace(/\\/g, '/') === 'assets/diagrams/research-protocol.svg'));

  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-svg-'));
  try {
    for (const file of canonicalPages()) {
      const target = path.join(temporaryRoot, file.relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(file.absolutePath, target);
    }
    const legacyFile = path.join('projects', 'c-arm-navigation', 'index.html');
    fs.mkdirSync(path.join(temporaryRoot, path.dirname(legacyFile)), { recursive: true });
    fs.copyFileSync(path.join(root, legacyFile), path.join(temporaryRoot, legacyFile));
    for (const file of live) {
      const target = path.join(temporaryRoot, file.relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(file.absolutePath, target);
    }
    const targetSvg = path.join(temporaryRoot, 'assets', 'diagrams', 'decision-signal.svg');
    fs.appendFileSync(targetSvg, '<text>Samsung Medical</text>');
    const legacySvg = path.join(temporaryRoot, 'assets', 'diagrams', 'research-protocol.svg');
    fs.appendFileSync(legacySvg, '<text>Samsung Medical</text>');
    const errors = validator.validatePortfolio(temporaryRoot).map((error) => error.replace(/\\/g, '/'));
    assert.ok(errors.some((error) => /decision-signal\.svg.*nonpublic partner.*Samsung Medical/i.test(error)));
    assert.ok(errors.some((error) => /research-protocol\.svg.*nonpublic partner.*Samsung Medical/i.test(error)));
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('published localized pages never rewrite parent traversal into external URLs', () => {
  for (const file of canonicalPages().filter((item) => fs.existsSync(item.absolutePath))) {
    assert.doesNotMatch(fs.readFileSync(file.absolutePath, 'utf8'), /https?:\/\/[^"\s]*\/\.\.\//, file.relativePath);
  }
});
