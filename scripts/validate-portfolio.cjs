const fs = require('node:fs');
const path = require('node:path');

const data = require('../js/portfolio-data.js');
const render = require('../js/portfolio-render.js');
const i18n = require('../js/site-i18n.js');

const contributionPattern = render.policy.contributionPercentagePattern;
const privatePartnerPattern = render.policy.prohibitedPartnerPattern;
const isSafePublicPath = render.isSafePublicPath;
const siteUrl = 'https://rafaam11.github.io/';
const fallbackVisualKeys = [
  'nav-digitaltwin-pipeline',
  'coordinate-signal',
  'hololens-ar-concept',
  'forklift-sim-to-real',
  'decision-signal'
];
const evidenceRegisterRelativePath = path.join('assets', 'projects', 'EVIDENCE_REGISTER.md');
const evidenceRegisterStates = new Set(['pending-review', 'approved-public', 'excluded']);
const evidenceMediaTypes = new Set(['image', 'video', 'repository', 'publication']);
const localEvidenceExtensions = {
  image: new Set(['.png', '.jpg', '.jpeg', '.webp']),
  video: new Set(['.mp4', '.webm'])
};
const evidenceSourceLeakPattern = /(?:(?:^|[\s(`])(?:[A-Za-z]:[\\/]|\\\\)|file:\/\/|OneDrive|Teams|private[\\/]raw|\b(?:CT|MRI|patient|hospital)\b)/i;

function portfolioRoutes() {
  return i18n.routeDescriptors;
}

function publicPortfolioFiles(rootDir) {
  return portfolioRoutes().flatMap((page) => [
    {
      relativePath: page.file,
      absolutePath: path.join(rootDir, page.file),
      route: page.route,
      locale: 'ko',
      allowsNamedEmployer: Boolean(page.allowsNamedEmployer)
    },
    {
      relativePath: path.join('en', page.file),
      absolutePath: path.join(rootDir, 'en', page.file),
      route: page.route,
      locale: 'en',
      allowsNamedEmployer: Boolean(page.allowsNamedEmployer)
    }
  ]);
}

function publishedPortfolioHtmlFiles(rootDir) {
  const files = new Map(publicPortfolioFiles(rootDir).map((file) => [
    file.relativePath.replace(/\\/g, '/'),
    { relativePath: file.relativePath, absolutePath: file.absolutePath }
  ]));
  for (const relativePath of ['research/index.html', 'en/research/index.html']) {
    files.set(relativePath, { relativePath, absolutePath: path.join(rootDir, relativePath) });
  }
  for (const projectRoot of ['projects', path.join('en', 'projects')]) {
    const absoluteRoot = path.join(rootDir, projectRoot);
    if (!fs.existsSync(absoluteRoot)) continue;
    for (const entry of fs.readdirSync(absoluteRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const relativePath = path.join(projectRoot, entry.name, 'index.html');
      files.set(relativePath.replace(/\\/g, '/'), { relativePath, absolutePath: path.join(rootDir, relativePath) });
    }
  }
  return [...files.values()].filter((file) => fs.existsSync(file.absolutePath));
}

function isPathInsideRoot(rootDir, candidatePath) {
  const relativePath = path.relative(path.resolve(rootDir), path.resolve(candidatePath));
  return Boolean(relativePath) &&
    relativePath !== '..' &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath);
}

function parseEvidenceRegister(content) {
  const entries = [];
  const errors = [];
  const seen = new Set();
  const lines = String(content || '').split(/\r?\n/);

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim();
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells[0] === 'Evidence ID' || cells.every((cell) => /^:?-+:?$/.test(cell))) continue;
    if (cells.length !== 6) {
      errors.push(`Evidence register line ${index + 1}: expected six table columns.`);
      continue;
    }
    const [id, project, type, state, source, note] = cells;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) errors.push(`${id || `line ${index + 1}`}: invalid stable evidence id.`);
    if (seen.has(id)) errors.push(`${id}: duplicate evidence id.`);
    seen.add(id);
    if (!evidenceMediaTypes.has(type)) errors.push(`${id}: unknown registered media type.`);
    if (!evidenceRegisterStates.has(state)) errors.push(`${id}: unknown evidence register state.`);
    if (!note) errors.push(`${id}: missing provenance or usage note.`);
    entries.push({ id, project, type, state, source, note });
  }

  if (entries.length === 0) errors.push('Evidence register contains no entries.');
  return { entries, errors };
}

function readEvidenceRegister(rootDir) {
  const registerPath = path.join(rootDir, evidenceRegisterRelativePath);
  if (!fs.existsSync(registerPath)) {
    return {
      path: registerPath,
      entries: [],
      errors: [`${evidenceRegisterRelativePath.replace(/\\/g, '/')}: missing public evidence register.`]
    };
  }
  const content = fs.readFileSync(registerPath, 'utf8');
  const parsed = parseEvidenceRegister(content);
  if (evidenceSourceLeakPattern.test(content)) parsed.errors.push('Evidence register contains a private source path or restricted source label.');
  const prohibitedPartner = content.match(privatePartnerPattern)?.[0];
  if (prohibitedPartner) parsed.errors.push(`Evidence register contains a nonpublic partner or company-project name: ${prohibitedPartner}.`);
  return { path: registerPath, entries: parsed.entries, errors: parsed.errors };
}

function isSafeHttpsUrl(value) {
  if (typeof value !== 'string' || !/^https:\/\//i.test(value)) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function canonicalMediaEntries(candidate) {
  const entries = [];
  for (const project of Array.isArray(candidate && candidate.projects) ? candidate.projects : []) {
    const media = project && project.media;
    if (!project || !media || typeof media !== 'object') continue;
    for (const slot of ['lead', 'video', 'poster']) {
      if (media[slot]) entries.push({ project, item: media[slot], slot });
    }
    for (const [index, item] of (Array.isArray(media.references) ? media.references : []).entries()) {
      entries.push({ project, item, slot: `reference ${index}` });
    }
  }
  return entries;
}

function pngDimensions(buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(signature) || buffer.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function jpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  const startOfFrame = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset + 3 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }
    while (buffer[offset] === 0xff) offset++;
    const marker = buffer[offset++];
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (offset + 2 > buffer.length) return null;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) return null;
    if (startOfFrame.has(marker) && length >= 7) {
      return { width: buffer.readUInt16BE(offset + 5), height: buffer.readUInt16BE(offset + 3) };
    }
    offset += length;
  }
  return null;
}

function webpDimensions(buffer) {
  if (buffer.length < 30 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') return null;
  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8X') {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3)
    };
  }
  if (chunk === 'VP8L' && buffer.length >= 25 && buffer[20] === 0x2f) {
    const bits = buffer.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) };
  }
  if (chunk === 'VP8 ' && buffer.length >= 30 && buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  return null;
}

function imageDimensions(filePath, extension) {
  const buffer = fs.readFileSync(filePath);
  const dimensions = extension === '.png'
    ? pngDimensions(buffer)
    : (extension === '.jpg' || extension === '.jpeg')
      ? jpegDimensions(buffer)
      : extension === '.webp'
        ? webpDimensions(buffer)
        : null;
  if (!dimensions || !Number.isInteger(dimensions.width) || !Number.isInteger(dimensions.height) ||
      dimensions.width <= 0 || dimensions.height <= 0) return null;
  return dimensions;
}

function approvedLocalEvidenceErrors(entry, rootDir) {
  const errors = [];
  const source = entry.source;
  const normalizedSource = typeof source === 'string' ? source.replace(/\\/g, '/') : '';
  const expectedPrefix = `assets/projects/${entry.project}/`;
  if (!isSafePublicPath(source) || isSafeHttpsUrl(source)) {
    return [`${entry.id}: approved ${entry.type} requires a safe repository-relative source.`];
  }
  if (!normalizedSource.startsWith(expectedPrefix)) {
    errors.push(`${entry.id}: approved local asset must resolve below its project directory.`);
  }
  const relativeName = normalizedSource.slice(expectedPrefix.length);
  const nameSegments = relativeName.split('/');
  if (!relativeName || normalizedSource !== normalizedSource.toLowerCase() ||
      nameSegments.some((segment) => !/^[a-z0-9][a-z0-9._-]*$/.test(segment))) {
    errors.push(`${entry.id}: approved local asset requires a lower-case safe file name.`);
  }
  const extension = path.posix.extname(normalizedSource);
  if (!localEvidenceExtensions[entry.type].has(extension) || extension !== extension.toLowerCase()) {
    errors.push(`${entry.id}: approved ${entry.type} requires an allowlisted lower-case extension.`);
  }
  const absolutePath = path.resolve(rootDir, normalizedSource.replace(/\//g, path.sep));
  const projectRoot = path.resolve(rootDir, 'assets', 'projects', entry.project);
  const relativeToProject = path.relative(projectRoot, absolutePath);
  if (!relativeToProject || relativeToProject === '..' || relativeToProject.startsWith(`..${path.sep}`) || path.isAbsolute(relativeToProject)) {
    if (!errors.some((error) => /below its project directory/.test(error))) {
      errors.push(`${entry.id}: approved local asset must resolve below its project directory.`);
    }
  } else if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    errors.push(`${entry.id}: missing approved local asset ${normalizedSource}.`);
  } else if (entry.type === 'image' && !imageDimensions(absolutePath, extension)) {
    errors.push(`${entry.id}: approved raster image must expose valid intrinsic dimensions.`);
  }
  return errors;
}

function evidenceRegistryErrors(candidate, rootDir) {
  const register = readEvidenceRegister(rootDir);
  const errors = register.errors.slice();
  const entriesById = new Map();
  for (const entry of register.entries) {
    if (!entriesById.has(entry.id)) entriesById.set(entry.id, entry);
    if (!i18n.canonicalCaseSlugs.includes(entry.project)) errors.push(`${entry.id}: unknown registered project.`);
    const hasSource = entry.source && entry.source !== '-';
    if ((entry.state === 'pending-review' || entry.state === 'excluded') && hasSource) {
      errors.push(`${entry.id}: ${entry.state} evidence must not declare a public source.`);
    }
    if (entry.state === 'approved-public' && !hasSource) errors.push(`${entry.id}: approved-public evidence requires a public source.`);
    if (entry.state === 'approved-public' && ['repository', 'publication'].includes(entry.type) && !isSafeHttpsUrl(entry.source)) {
      errors.push(`${entry.id}: approved ${entry.type} evidence requires an HTTPS source.`);
    }
    if (entry.state === 'approved-public' && ['image', 'video'].includes(entry.type)) {
      errors.push(...approvedLocalEvidenceErrors(entry, rootDir));
    }
  }

  const declaredIds = new Set();
  for (const { project, item, slot } of canonicalMediaEntries(candidate)) {
    if (!item || typeof item.id !== 'string' || !item.id) continue;
    declaredIds.add(item.id);
    const entry = entriesById.get(item.id);
    if (!entry) {
      errors.push(`${project.slug} ${slot} ${item.id}: canonical media id is not registered.`);
      continue;
    }
    if (entry.project !== project.slug) errors.push(`${item.id}: registered project mismatch; expected ${project.slug}.`);
    if (entry.type !== item.type) errors.push(`${item.id}: registered media type mismatch; expected ${item.type}.`);
    const expectedState = item.status === 'approved' ? 'approved-public' : item.status === 'pending-approval' ? 'pending-review' : '';
    if (expectedState && entry.state !== expectedState) errors.push(`${item.id}: registered state mismatch; expected ${expectedState}.`);
    if (item.status === 'approved' && entry.source !== item.publicPath) errors.push(`${item.id}: registered public source does not match canonical media.`);
  }
  for (const entry of register.entries) {
    if (entry.state !== 'excluded' && !declaredIds.has(entry.id)) errors.push(`${entry.id}: registered evidence is not declared by canonical media.`);
  }

  for (const project of Array.isArray(candidate && candidate.projects) ? candidate.projects : []) {
    const approvedVideos = canonicalMediaEntries({ projects: [project] })
      .filter(({ item }) => item && item.type === 'video' && item.status === 'approved');
    if (approvedVideos.length === 0) continue;
    const poster = project.media && project.media.poster;
    const posterEntry = poster && entriesById.get(poster.id);
    if (!poster || poster.type !== 'image' || poster.status !== 'approved' ||
        !posterEntry || posterEntry.state !== 'approved-public' || posterEntry.type !== 'image') {
      errors.push(`${project.slug}: approved video requires an approved image poster registered as approved-public.`);
      continue;
    }
    if (project.media.lead && project.media.lead.type === 'video' && project.media.lead.status === 'approved') {
      const html = render.evidenceMediaHtml(project, 'en', '', false);
      if (!/<video\b(?=[^>]*\bcontrols\b)(?=[^>]*\bpreload="none")/i.test(html) || /\bautoplay\b/i.test(html)) {
        errors.push(`${project.slug}: approved video renderer must retain controls, preload="none", and no autoplay.`);
      }
    }
  }
  return errors;
}

function evidenceDirectoryErrors(rootDir) {
  const errors = [];
  for (const slug of i18n.canonicalCaseSlugs) {
    const readme = path.join(rootDir, 'assets', 'projects', slug, 'README.md');
    if (!fs.existsSync(readme)) errors.push(`${slug}: missing public-safe evidence directory README.`);
  }
  return errors;
}

function publicPortfolioVisualFiles(rootDir) {
  const mediaItems = data.projects.flatMap((project) => {
    const media = project.media || {};
    const references = Array.isArray(media.references) ? media.references : [];
    return [media.lead, media.video, media.poster].concat(references).filter(Boolean);
  });
  const declaredFiles = mediaItems
    .filter((item) => item.status === 'approved' && isSafePublicPath(item.publicPath) && !/^https?:\/\//i.test(item.publicPath))
    .map((item) => ({
      relativePath: path.normalize(item.publicPath),
      absolutePath: path.join(rootDir, item.publicPath),
      evidenceId: item.id
    }));
  const rendererFallbackFiles = [...new Set(data.projects
    .map((project) => project.visualKey)
    .filter((visualKey) => fallbackVisualKeys.includes(visualKey)))]
    .flatMap((visualKey) => ['', '-en'].map((suffix) => {
      const relativePath = path.join('assets', 'diagrams', `${visualKey}${suffix}.svg`);
      return { relativePath, absolutePath: path.resolve(rootDir, relativePath), evidenceId: `renderer:${visualKey}` };
    }));

  const referencedFiles = [];
  for (const file of publishedPortfolioHtmlFiles(rootDir)) {
    const html = fs.readFileSync(file.absolutePath, 'utf8');
    for (const match of html.matchAll(/\b(?:src|href)="([^"?#]+\.svg)(?:[?#][^"]*)?"/gi)) {
      const href = match[1];
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) continue;
      const absolutePath = path.resolve(path.dirname(file.absolutePath), href.replace(/\//g, path.sep));
      const relativePath = path.relative(rootDir, absolutePath);
      if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) continue;
      referencedFiles.push({ relativePath, absolutePath, evidenceId: `html:${file.relativePath}` });
    }
  }

  const unique = new Map();
  for (const file of declaredFiles.concat(rendererFallbackFiles, referencedFiles)) {
    if (!isPathInsideRoot(rootDir, file.absolutePath)) continue;
    const key = file.relativePath.replace(/\\/g, '/').toLowerCase();
    if (!unique.has(key)) unique.set(key, file);
  }
  return [...unique.values()];
}

function portfolioDataErrors(candidate) {
  return render.validatePortfolioData(candidate);
}

function visualAssetErrors(assets) {
  const errors = [];
  for (const asset of assets) {
    const content = typeof asset.content === 'string' ? asset.content : '';
    const prohibitedPartner = content.match(privatePartnerPattern)?.[0];
    if (prohibitedPartner) {
      errors.push(`${asset.relativePath}: contains a nonpublic partner or company-project name: ${prohibitedPartner}.`);
    }
  }
  return errors;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function localAnchorErrors(file, html, rootDir) {
  const errors = [];
  const pageDirectory = path.posix.dirname('/' + file.relativePath.replace(/\\/g, '/'));
  for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>/g)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|tel:|#)/.test(href)) continue;
    const localHref = href.split(/[?#]/, 1)[0];
    const resolved = path.posix.normalize(path.posix.join(pageDirectory, localHref));
    const isSharedAsset = resolved === '/assets' || resolved.startsWith('/assets/');
    if (file.locale === 'en' && !isSharedAsset && resolved !== '/en' && !resolved.startsWith('/en/')) {
      errors.push(`${file.relativePath}: English link leaves /en/: ${href}`);
    }
    if (file.locale === 'ko' && (resolved === '/en' || resolved.startsWith('/en/'))) {
      errors.push(`${file.relativePath}: Korean link enters /en/: ${href}`);
    }
    if (localHref.endsWith('index.html')) {
      const target = path.join(rootDir, resolved.replace(/^\//, '').replace(/\//g, path.sep));
      if (!fs.existsSync(target)) errors.push(`${file.relativePath}: missing local link target ${href}`);
    }
  }
  return errors;
}

function staticPageErrors(file, html, rootDir) {
  const errors = [];
  const koreanUrl = siteUrl + file.route;
  const englishUrl = siteUrl + 'en/' + file.route;
  const canonicalUrl = file.locale === 'en' ? englishUrl : koreanUrl;
  const expectedLang = file.locale;

  if (!new RegExp(`<html lang="${expectedLang}">`).test(html)) {
    errors.push(`${file.relativePath}: expected html lang ${expectedLang}.`);
  }
  if (!new RegExp(`data-lang="${expectedLang}"`).test(html)) {
    errors.push(`${file.relativePath}: expected data-lang ${expectedLang}.`);
  }
  if (!new RegExp(`data-route="${escapeRegExp(file.route)}"`).test(html)) {
    errors.push(`${file.relativePath}: semantic route does not match ${file.route}.`);
  }
  if (!new RegExp(`<link rel="canonical" href="${escapeRegExp(canonicalUrl)}"`).test(html)) {
    errors.push(`${file.relativePath}: canonical URL does not match locale route.`);
  }
  if (!new RegExp(`hreflang="ko" href="${escapeRegExp(koreanUrl)}"`).test(html) ||
      !new RegExp(`hreflang="en" href="${escapeRegExp(englishUrl)}"`).test(html) ||
      !new RegExp(`hreflang="x-default" href="${escapeRegExp(koreanUrl)}"`).test(html)) {
    errors.push(`${file.relativePath}: incomplete hreflang pair.`);
  }
  if (html.indexOf('site-i18n.js') === -1 || html.indexOf('site-i18n.js') > html.indexOf('nav.js')) {
    errors.push(`${file.relativePath}: site-i18n.js must load before nav.js.`);
  }
  if (html.includes('portfolio-render.js') && html.indexOf('site-i18n.js') > html.indexOf('portfolio-render.js')) {
    errors.push(`${file.relativePath}: site-i18n.js must load before portfolio-render.js.`);
  }
  return errors.concat(localAnchorErrors(file, html, rootDir));
}

function validatePortfolio(rootDir) {
  const errors = portfolioDataErrors(data).slice();
  errors.push(...evidenceRegistryErrors(data, rootDir));
  errors.push(...evidenceDirectoryErrors(rootDir));

  for (const file of publicPortfolioFiles(rootDir)) {
    if (!fs.existsSync(file.absolutePath)) {
      errors.push(`${file.relativePath}: missing public page.`);
      continue;
    }
    const html = fs.readFileSync(file.absolutePath, 'utf8');
    if (contributionPattern.test(html)) {
      errors.push(`${file.relativePath}: contains a contribution percentage.`);
    }
    if (!file.allowsNamedEmployer && privatePartnerPattern.test(html)) {
      errors.push(`${file.relativePath}: contains a nonpublic partner or company-project name.`);
    }
    errors.push(...staticPageErrors(file, html, rootDir));
  }

  const visualAssets = [];
  for (const file of publicPortfolioVisualFiles(rootDir)) {
    if (!isPathInsideRoot(rootDir, file.absolutePath)) {
      errors.push(`${file.relativePath}: public evidence asset resolves outside repository root.`);
      continue;
    }
    if (!fs.existsSync(file.absolutePath)) {
      errors.push(`${file.relativePath}: missing public evidence asset.`);
      continue;
    }
    visualAssets.push({
      ...file,
      content: fs.readFileSync(file.absolutePath, 'utf8')
    });
  }
  errors.push(...visualAssetErrors(visualAssets));

  return errors;
}

if (require.main === module) {
  const rootDir = path.join(__dirname, '..');
  const errors = validatePortfolio(rootDir);
  if (errors.length) {
    for (const error of errors) process.stderr.write(`- ${error}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`Portfolio validation passed: ${i18n.canonicalCaseSlugs.length} projects, ${data.capabilities.length} capabilities, ${publicPortfolioFiles(rootDir).length} localized pages.\n`);
  }
}

module.exports = {
  portfolioRoutes,
  publicPortfolioFiles,
  publicPortfolioVisualFiles,
  parseEvidenceRegister,
  readEvidenceRegister,
  evidenceRegistryErrors,
  evidenceDirectoryErrors,
  imageDimensions,
  portfolioDataErrors,
  visualAssetErrors,
  validatePortfolio
};
