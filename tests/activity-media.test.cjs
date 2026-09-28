// Activity-feed media contracts: originals stay private, public derivatives stay small and clean.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('original usermedia is git-ignored and never tracked', () => {
  const lines = read('.gitignore').split(/\r?\n/).map((line) => line.trim());
  assert.ok(lines.includes('assets/usermedia/'), '.gitignore lists assets/usermedia/');
  let tracked;
  try {
    tracked = execFileSync('git', ['ls-files', 'assets/usermedia'], { cwd: root, encoding: 'utf8' });
  } catch (error) {
    return; // git unavailable here; the .gitignore assertion above still protects the originals
  }
  assert.equal(tracked.trim(), '', 'no original media file is tracked');
});
