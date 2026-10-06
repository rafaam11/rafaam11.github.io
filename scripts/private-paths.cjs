'use strict';
const fs = require('node:fs');
const path = require('node:path');

function realLocation(value) {
  const absolute = path.resolve(value);
  if (fs.existsSync(absolute)) return fs.realpathSync(absolute);
  const parent = path.dirname(absolute);
  return parent === absolute ? absolute : path.join(realLocation(parent), path.basename(absolute));
}
function within(target, parent) {
  const normalize = value => process.platform === 'win32' ? realLocation(value).toLowerCase() : realLocation(value);
  const relative = path.relative(normalize(parent), normalize(target));
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
}
function privateRoot(repoRoot, configured = process.env.PORTFOLIO_PRIVATE_ROOT) {
  if (!configured) throw new Error('PORTFOLIO_PRIVATE_ROOT is required for private operations');
  const result = path.resolve(configured);
  if (within(result, repoRoot)) throw new Error('private root must be outside the public repository');
  return result;
}
function privateFixture(repoRoot, options = {}) {
  const dir = privateRoot(repoRoot, options.privateRoot);
  const fixture = JSON.parse(fs.readFileSync(path.join(dir, 'private-validation.json'), 'utf8'));
  if (fixture.schema !== 1 || !Array.isArray(fixture.forbiddenPeople) || !fixture.forbiddenPeople.length || fixture.forbiddenPeople.some(value => typeof value !== 'string' || !value.trim())) throw new Error('private fixture requires a nonempty forbiddenPeople list');
  return fixture;
}
module.exports = { within, realLocation, privateRoot, privateFixture };
