const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');

test('catalog and derive stay private; only validated promote publishes and re-derive revokes approval', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-promotion-'));
  const repo = path.join(temp, 'site'), privateRoot = path.join(temp, 'private');
  const cli = (...args) => spawnSync(process.execPath, ['scripts/activity-media.cjs', ...args], { cwd: repo, env: { ...process.env, PORTFOLIO_PRIVATE_ROOT: privateRoot }, encoding: 'utf8' });
  const ok = result => assert.equal(result.status, 0, result.stderr || result.stdout);
  const privateFile = path.join(privateRoot, 'activity-media.private.json');
  const edit = mutate => { const data = JSON.parse(fs.readFileSync(privateFile)); mutate(data.media.M001); fs.writeFileSync(privateFile, JSON.stringify(data)); };
  try {
    for (const dir of ['scripts', 'js']) fs.cpSync(path.join(root, dir), path.join(repo, dir), { recursive: true });
    fs.mkdirSync(path.join(repo, 'data'), { recursive: true });
    fs.mkdirSync(path.join(privateRoot, 'originals'), { recursive: true });
    fs.writeFileSync(path.join(repo, 'data/activity-media.json'), '{"schema":2,"media":{}}\n');
    fs.writeFileSync(path.join(privateRoot, 'private-validation.json'), '{"schema":1,"forbiddenPeople":["Example Private Person"]}');
    fs.copyFileSync(path.join(root, 'assets/local-review/M012.webp'), path.join(privateRoot, 'originals/photo.webp'));
    ok(cli('catalog'));
    ok(cli('derive', 'M001'));
    assert.ok(fs.existsSync(path.join(privateRoot, 'derived/M001.webp')));
    assert.ok(!fs.existsSync(path.join(repo, 'assets/local-review/M001.webp')));
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(repo, 'data/activity-media.json'))).media, {});
    assert.notEqual(cli('promote', 'M001').status, 0, 'draft cannot publish');
    edit(record => {
      record.approval = 'approved-public'; record.takenAt = '2020';
      record.eventIds = ['accas-occlusion-paper-2022'];
      record.translations = { ko: { caption: 'Public caption', alt: 'Public scene' }, en: { caption: 'Public caption', alt: 'Public scene' } };
    });
    edit(record => { record.translations.en.caption = 'Example Private Person'; });
    assert.notEqual(cli('promote', 'M001').status, 0, 'private fixture must gate publication');
    assert.ok(!fs.existsSync(path.join(repo, 'assets/local-review/M001.webp')));
    edit(record => { record.translations.en.caption = 'Public caption'; });
    ok(cli('promote', 'M001'));
    const published = fs.readFileSync(path.join(repo, 'data/activity-media.json'), 'utf8');
    const record = JSON.parse(published).media.M001;
    assert.equal(record.approval, 'approved-public');
    assert.ok(!('sourcePath' in record) && !('sourceSha256' in record));
    ok(cli('check', '--sources'));
    ok(cli('derive', 'M001', '--force'));
    assert.equal(JSON.parse(fs.readFileSync(privateFile)).media.M001.approval, 'draft');
    assert.equal(fs.readFileSync(path.join(repo, 'data/activity-media.json'), 'utf8'), published);
    const original = path.join(privateRoot, 'originals/photo.webp');
    fs.appendFileSync(original, 'changed');
    assert.notEqual(cli('derive', 'M001', '--force').status, 0, 'cached catalog cannot hide source drift');
    assert.notEqual(cli('check', '--sources').status, 0);
    assert.notEqual(cli('sheet', 'M001', '--out', path.join(repo, 'review')).status, 0, 'review output must stay outside public root');
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('HEIF scratch junction cannot write a decoded frame into the public root', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-scratch-'));
  const repo = path.join(temp, 'site'), privateRoot = path.join(temp, 'private');
  try {
    fs.cpSync(path.join(root, 'scripts'), path.join(repo, 'scripts'), { recursive: true });
    fs.mkdirSync(privateRoot);
    fs.symlinkSync(repo, path.join(privateRoot, 'scratch'), process.platform === 'win32' ? 'junction' : 'dir');
    const source = path.join(privateRoot, 'source.heic');
    // A decodable image with a HEIF suffix exercises the HEIF scratch path on all ffmpeg builds.
    fs.copyFileSync(path.join(root, 'assets/local-review/M012.webp'), source);
    const code = `const p=require('./scripts/activity-media.cjs');p.convertImage({src:process.argv[1],out:process.argv[2]});`;
    const result = spawnSync(process.execPath, ['-e', code, source, path.join(privateRoot, 'derived/out.webp')], { cwd: repo, env: { ...process.env, PORTFOLIO_PRIVATE_ROOT: privateRoot }, encoding: 'utf8' });
    assert.notEqual(result.status, 0, result.stderr);
    assert.match(result.stderr, /not an allowed output|private storage/);
    assert.deepEqual(fs.readdirSync(repo), ['scripts']);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
