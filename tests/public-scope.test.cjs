const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const validator = require('../scripts/validate-portfolio.cjs');
const pipeline = require('../scripts/activity-media.cjs');
const profile = require('../scripts/profile-home.cjs');

test('public schema rejects private metadata, unknown nested fields and draft approvals', () => {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'data/activity-media.json')));
  assert.equal(data.schema, 2);
  for (const mutate of [
    r => { r.sourcePath = 'private/portrait.jpg'; },
    r => { r.translations.ko.note = 'internal'; },
    r => { r.translations.fr = { caption: 'private' }; },
    r => { r.approval = 'draft'; },
    r => { r.poster = 'assets/local-review/../../private.jpg'; },
    r => { r.bytes = -1; }
  ]) {
    const broken = structuredClone(data);
    mutate(broken.media.M012);
    assert.ok(profile.activityMediaErrors(broken).length);
  }
});

test('index validation catches force-added private paths, media and staged-only JSON leaks', () => {
  assert.equal(typeof validator.publicScopeErrors, 'function');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-index-'));
  try {
    execFileSync('git', ['init', '-q', dir]);
    fs.mkdirSync(path.join(dir, 'data'));
    const clean = { schema: 2, media: {} };
    fs.writeFileSync(path.join(dir, 'data/activity-media.json'), JSON.stringify(clean));
    for (const rel of ['.claude/settings.json', 'docs/private.md', 'assets/img/unused.png', 'assets/local-review/M999.webp', 'raw.DOCX', '.env.production']) {
      fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
      fs.writeFileSync(path.join(dir, rel), 'private');
    }
    execFileSync('git', ['add', '-f', '.'], { cwd: dir });
    const errors = validator.publicScopeErrors(dir).join('\n');
    for (const fragment of ['.claude/', 'docs/private', 'unused.png', 'M999.webp', 'raw.DOCX', '.env.production']) assert.ok(errors.includes(fragment), fragment);
    fs.writeFileSync(path.join(dir, 'data/activity-media.json'), JSON.stringify({ ...clean, sourcePath: 'hidden' }));
    execFileSync('git', ['add', 'data/activity-media.json'], { cwd: dir });
    fs.writeFileSync(path.join(dir, 'data/activity-media.json'), JSON.stringify(clean));
    assert.match(validator.publicScopeErrors(dir).join('\n'), /index.*sourcePath/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('private scans fail closed on absent, malformed or empty fixtures and catch synthetic names', () => {
  assert.equal(typeof validator.privateValidationErrors, 'function');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-private-check-'));
  try {
    const options = { privateRoot: dir };
    assert.match(validator.privateValidationErrors(root, options).join('\n'), /fixture/);
    fs.writeFileSync(path.join(dir, 'private-validation.json'), '{');
    assert.match(validator.privateValidationErrors(root, options).join('\n'), /fixture/);
    fs.writeFileSync(path.join(dir, 'private-validation.json'), JSON.stringify({ schema: 1, forbiddenPeople: [] }));
    assert.match(validator.privateValidationErrors(root, options).join('\n'), /fixture/);
    fs.writeFileSync(path.join(dir, 'private-validation.json'), JSON.stringify({ schema: 1, forbiddenPeople: ['Example Private Person'] }));
    assert.deepEqual(validator.privateValidationErrors(root, { ...options, texts: ['Public scene'] }), []);
    assert.ok(validator.privateValidationErrors(root, { ...options, texts: ['Example Private Person'] }).length);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('explicit source checking cannot succeed without the private ledger', () => {
  const missing = path.join(os.tmpdir(), 'missing-portfolio-' + process.pid);
  const result = spawnSync(process.execPath, ['scripts/activity-media.cjs', 'check', '--sources'], { cwd: root, env: { ...process.env, PORTFOLIO_PRIVATE_ROOT: missing }, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /private|source|ledger/i);
});

test('staged media cannot differ from the bytes that passed working-tree verification', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-staged-bytes-'));
  try {
    execFileSync('git', ['init', '-q', dir]);
    fs.mkdirSync(path.join(dir, 'data'));
    fs.mkdirSync(path.join(dir, 'assets/local-review'), { recursive: true });
    const record = JSON.parse(fs.readFileSync(path.join(root, 'data/activity-media.json'))).media.M012;
    fs.writeFileSync(path.join(dir, 'data/activity-media.json'), JSON.stringify({ schema: 2, media: { M012: record } }));
    fs.writeFileSync(path.join(dir, record.path), 'unapproved staged bytes');
    execFileSync('git', ['add', '.'], { cwd: dir });
    fs.copyFileSync(path.join(root, record.path), path.join(dir, record.path));
    assert.match(validator.publicScopeErrors(dir).join('\n'), /index.*working.*M012/);
    execFileSync('git', ['add', '.'], { cwd: dir });
    assert.deepEqual(validator.publicScopeErrors(dir), []);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('public source-free generation remains fresh', () => {
  assert.deepEqual(profile.freshnessErrors(), []);
  assert.deepEqual(pipeline.checkRecords().errors, []);
});
