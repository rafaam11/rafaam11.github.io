'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { publicSchemaErrors } = require('./activity-media-schema.cjs');
const { privateFixture } = require('./private-paths.cjs');
const publicDocs = new Set(['docs/superpowers/specs/2026-09-28-scholar-readability-design.md', 'docs/superpowers/specs/2026-09-29-positioning-design.md']);
const publicImages = new Set(['assets/img/favicon.ico', 'assets/img/profile_square.webp']);
const mediaPattern = /\.(?:png|jpe?g|webp|gif|svg|ico|mp4|mov|m4v|heic|heif|pdf|mp3|wav|webm)$/i;

function forbiddenPath(file) {
  const value = file.replace(/\\/g, '/');
  if (value.startsWith('docs/') && !publicDocs.has(value)) return true;
  if (value.startsWith('assets/img/') && !publicImages.has(value)) return true;
  return /(?:^|\/)(?:\.claude|\.codex|\.agents|\.vscode|\.idea|\.superpowers|\.worktrees|worktrees|node_modules|private|originals|raw|review|backups|__pycache__)(?:\/|$)/i.test(value)
    || /^assets\/usermedia(?:\/|$)|^data\/activity-media-ids\.json$/i.test(value)
    || /(?:^|\/)(?:\.env(?:\..*)?|\.mcp\.json|mcp\.json|CLAUDE\.local\.md|\.hugo_build\.lock|credentials(?:\.[^/]*)?|secrets?(?:\.[^/]*)?)$/i.test(value)
    || /\.(?:docx?|docm|xlsx?|xlsm|pptx?|pptm|hwp|hwpx|odt|ods|odp|pages|rtf|pem|key|pfx|p12|tmp|bak|pyc)$/i.test(value)
    || /(?:^|\/)~\$|(?:입사지원서|이력서|경력기술서)/.test(value);
}

function indexEntries(rootDir) {
  let top;
  try { top = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return null; }
  if (path.resolve(top).toLowerCase() !== path.resolve(rootDir).toLowerCase()) return null;
  return execFileSync('git', ['ls-files', '--stage', '-z'], { cwd: rootDir, encoding: 'utf8' }).split('\0').filter(Boolean).map(row => {
    const [, mode, sha, stage, file] = row.match(/^(\d+) ([a-f0-9]+) (\d)\t([\s\S]*)$/);
    return { mode, sha, stage, file };
  });
}

function registeredMedia(read) {
  const allowed = new Set(publicImages);
  const activity = JSON.parse(read('data/activity-media.json') || '{"schema":2,"media":{}}');
  for (const record of Object.values(activity.media || {})) for (const field of ['path', 'poster']) if (record?.[field]) allowed.add(record[field]);
  // These files already have independent evidence and PDF-manifest validators.
  for (const file of ['assets/projects/EVIDENCE_REGISTER.md', 'data/public-cv.json', 'output/pdf/manifest.json']) {
    const text = read(file) || '';
    for (const match of text.matchAll(/(?:assets|output)\/[a-zA-Z0-9_./-]+\.(?:png|jpg|webp|mp4|pdf)/g)) allowed.add(match[0]);
    if (file === 'output/pdf/manifest.json') {
      for (const doc of JSON.parse(text || '{"documents":[]}').documents || []) {
        if (!/^[a-z0-9-]+\.pdf$/.test(doc.name || '')) continue;
        allowed.add('output/pdf/' + doc.name);
        if (doc.kind === 'project') allowed.add('assets/pdfs/' + doc.name);
      }
    }
  }
  // Authored CV PDF raster fallbacks are also referenced and verified by the CV validator.
  for (const file of ['cv/index.html', 'en/cv/index.html']) for (const match of (read(file) || '').matchAll(/(?:assets|output)\/[a-zA-Z0-9_./-]+\.(?:png|jpg|webp|pdf)/g)) allowed.add(match[0]);
  return allowed;
}

function publicScopeErrors(rootDir) {
  const entries = indexEntries(rootDir);
  if (!entries) return []; // Generated test fixtures may intentionally have no Git metadata.
  const errors = [];
  // Media/content checks inspect working files. Refuse to approve different bytes in the index.
  const unstaged = execFileSync('git', ['diff', '--name-only', '-z'], { cwd: rootDir, encoding: 'utf8' }).split('\0').filter(Boolean);
  for (const file of unstaged) if (/^(?:assets|data|js)\//.test(file) || /\.html$/i.test(file)) errors.push(`index and working tree differ for validated public input ${file}; stage the verified version`);
  const byName = new Map(entries.map(entry => [entry.file, entry]));
  const readIndex = file => byName.has(file) ? execFileSync('git', ['cat-file', 'blob', byName.get(file).sha], { cwd: rootDir, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }) : '';
  const readWorking = file => fs.existsSync(path.join(rootDir, file)) ? fs.readFileSync(path.join(rootDir, file), 'utf8') : '';
  for (const [label, read] of [['index', readIndex], ['working tree', readWorking]]) {
    let allowed;
    try {
      const raw = read('data/activity-media.json');
      if (raw) errors.push(...publicSchemaErrors(JSON.parse(raw)).map(error => `${label}: ${error}`));
      allowed = registeredMedia(read);
    } catch (error) { errors.push(`${label}: cannot validate public metadata: ${error.message}`); allowed = new Set(); }
    for (const entry of entries) {
      if (label === 'working tree' && !fs.existsSync(path.join(rootDir, entry.file))) continue;
      if (forbiddenPath(entry.file)) errors.push(`${label}: forbidden tracked path ${entry.file}`);
      if (entry.mode === '120000' || entry.mode === '160000' || entry.stage !== '0') errors.push(`${label}: unsupported index entry ${entry.file}`);
      if (!entry.file.startsWith('public/') && mediaPattern.test(entry.file) && !allowed.has(entry.file)) errors.push(`${label}: unregistered media ${entry.file}`);
    }
  }
  return errors;
}

function privateValidationErrors(rootDir, options = {}) {
  let fixture;
  try { fixture = privateFixture(rootDir, options); }
  catch (error) { return [`Private validation fixture unavailable or invalid: ${error.message}`]; }
  const errors = [];
  const inspect = (text, label) => {
    const normalized = text.normalize('NFKC');
    for (let i = 0; i < fixture.forbiddenPeople.length; i++) if (normalized.includes(fixture.forbiddenPeople[i].normalize('NFKC'))) errors.push(`${label}: private person fixture entry ${i + 1}`);
  };
  if (options.texts) options.texts.forEach((text, i) => inspect(text, `text ${i + 1}`));
  else {
    const entries = indexEntries(rootDir);
    if (!entries) return ['Private validation requires a Git index'];
    for (const { file, sha } of entries) {
      if (!/\.(?:md|json|[cm]?js|html|css|txt|xml|yml|yaml|toml|py)$/.test(file)) continue;
      inspect(execFileSync('git', ['cat-file', 'blob', sha], { cwd: rootDir, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }), `index ${file}`);
      if (fs.existsSync(path.join(rootDir, file))) inspect(fs.readFileSync(path.join(rootDir, file), 'utf8'), `working tree ${file}`);
    }
  }
  return errors;
}
module.exports = { forbiddenPath, publicScopeErrors, privateValidationErrors };
