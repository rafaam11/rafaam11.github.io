const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');

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
const evidenceRegisterHeader = '| Evidence ID | Project | Media type | State | Public source | Provenance / usage |';
const evidenceRegisterSeparator = '| --- | --- | --- | --- | --- | --- |';
const localEvidenceExtensions = {
  image: new Set(['.png']),
  video: new Set(['.mp4', '.webm'])
};
const maxRasterBytes = 50 * 1024 * 1024;
const maxDecodedRasterBytes = 100 * 1024 * 1024;
const proseLocalPathPatterns = [
  /[a-z]:[\\/][^\s|]*/i,
  /\\\\[^\\/\s|]+[\\/][^\s|]*/i,
  /file:\/\/[^\s|]*/i,
  /(?:^|[\s"'`(=:])\/(?!\/)[a-z0-9._~-]+(?:\/[a-z0-9._~%+-]+)*/im,
  /(?:^|[\s"'`(=:])\.\.[\\/][^\s|]*/im,
  /\bpath\s*=\s*(?:"[^"]+"|'[^']+'|[^\s|]+)/i,
  /(?:^|[\\/])(?:private|raw|extracted|manifest)(?=[\\/]|$)/im,
  /(?:^|[\s"'`(=:])(?:[a-z0-9._-]+[\\/])+(?:[a-z0-9._-]+\.[a-z0-9._-]+)(?=$|[\s|),.;])/im
];

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
  const nonTableLines = [];
  const skippedNonEntryLines = [];
  const headerIndexes = [];
  const separatorIndexes = [];
  const entryIndexes = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim();
    if (!line.startsWith('|')) {
      nonTableLines.push(lines[index]);
      continue;
    }
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (line === evidenceRegisterHeader) {
      headerIndexes.push(index);
      continue;
    }
    if (cells[0] === 'Evidence ID') {
      errors.push(`Evidence register line ${index + 1}: expected the exact evidence register schema header.`);
      skippedNonEntryLines.push(lines[index]);
      continue;
    }
    if (line === evidenceRegisterSeparator) {
      separatorIndexes.push(index);
      continue;
    }
    if (cells.length > 0 && cells.every((cell) => /^:?-+:?$/.test(cell))) {
      errors.push(`Evidence register line ${index + 1}: expected the exact six-cell evidence register separator.`);
      skippedNonEntryLines.push(lines[index]);
      continue;
    }
    if (cells.length !== 6) {
      errors.push(`Evidence register line ${index + 1}: expected six table columns.`);
      skippedNonEntryLines.push(lines[index]);
      continue;
    }
    entryIndexes.push(index);
    const [id, project, type, state, source, note] = cells;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) errors.push(`${id || `line ${index + 1}`}: invalid stable evidence id.`);
    if (seen.has(id)) errors.push(`${id}: duplicate evidence id.`);
    seen.add(id);
    if (!evidenceMediaTypes.has(type)) errors.push(`${id}: unknown registered media type.`);
    if (!evidenceRegisterStates.has(state)) errors.push(`${id}: unknown evidence register state.`);
    if (!note) errors.push(`${id}: missing provenance or usage note.`);
    entries.push({ id, project, type, state, source, note });
  }

  if (headerIndexes.length === 0) errors.push('Evidence register is missing exact evidence register schema header.');
  if (headerIndexes.length > 1) errors.push('Evidence register contains a duplicate exact evidence register schema header.');
  if (separatorIndexes.length === 0) errors.push('Evidence register is missing exact evidence register separator.');
  if (separatorIndexes.length > 1) errors.push('Evidence register contains a duplicate exact evidence register separator.');
  if (headerIndexes.length === 1 && separatorIndexes.length === 1 && separatorIndexes[0] !== headerIndexes[0] + 1) {
    errors.push('The exact evidence register separator must immediately follow the schema header.');
  }
  if (separatorIndexes.length === 1 && entryIndexes.some((index) => index < separatorIndexes[0])) {
    errors.push('Evidence register entries must follow the exact header and separator.');
  }
  if (entries.length === 0) errors.push('Evidence register contains no entries.');
  return {
    entries,
    errors,
    nonTableProse: nonTableLines.join('\n'),
    skippedNonEntryProse: skippedNonEntryLines.join('\n')
  };
}

function proseContainsLocalPath(value) {
  const withoutHttpsUrls = String(value || '').replace(/https:\/\/[^\s|<>"']+/gi, (token) => (
    isSafeHttpsUrl(token) ? ' HTTPS_URL ' : token
  ));
  return proseLocalPathPatterns.some((pattern) => pattern.test(withoutHttpsUrls));
}

function readEvidenceRegister(rootDir) {
  const registerPath = path.join(rootDir, evidenceRegisterRelativePath);
  const inspection = inspectExactLocalPath(rootDir, evidenceRegisterRelativePath.replace(/\\/g, '/'));
  if (inspection.errors.length || !inspection.filePath || !fs.lstatSync(inspection.filePath).isFile()) {
    return {
      path: registerPath,
      entries: [],
      errors: [`${evidenceRegisterRelativePath.replace(/\\/g, '/')}: missing or unsafe public evidence register (${inspection.errors.join(' ')}).`]
    };
  }
  const content = fs.readFileSync(inspection.filePath, 'utf8');
  const parsed = parseEvidenceRegister(content);
  if (proseContainsLocalPath(parsed.nonTableProse)) {
    parsed.errors.push('Evidence register non-table prose contains a private source path or restricted source label.');
  }
  if (proseContainsLocalPath(parsed.skippedNonEntryProse)) {
    parsed.errors.push('Evidence register skipped non-entry line contains a private source path or restricted source label.');
  }
  for (const entry of parsed.entries) {
    if (proseContainsLocalPath(entry.note)) {
      parsed.errors.push(`${entry.id}: provenance or usage contains a private source path or restricted source label.`);
    }
  }
  const prohibitedPartner = content.match(privatePartnerPattern)?.[0];
  if (prohibitedPartner) parsed.errors.push(`Evidence register contains a nonpublic partner or company-project name: ${prohibitedPartner}.`);
  return { path: registerPath, entries: parsed.entries, errors: parsed.errors };
}

function isSafeHttpsUrl(value) {
  const authority = typeof value === 'string' && value.match(/^https:\/\/([^/?#\s]+)(?:[/?#]|$)/i)?.[1];
  if (!authority || value !== value.trim() || value.includes('\\') || authority.endsWith(':')) return false;
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

let crcTable;

function crc32(buffer) {
  if (!crcTable) {
    crcTable = Array.from({ length: 256 }, (_, value) => {
      let current = value;
      for (let bit = 0; bit < 8; bit++) current = (current & 1) ? (0xedb88320 ^ (current >>> 1)) : (current >>> 1);
      return current >>> 0;
    });
  }
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngDimensions(buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length < 57 || buffer.length > maxRasterBytes || !buffer.subarray(0, 8).equals(signature)) return null;

  let offset = 8;
  let header;
  let sawHeader = false;
  let sawPalette = false;
  let sawImageData = false;
  let imageDataEnded = false;
  let sawEnd = false;
  const imageData = [];

  while (offset < buffer.length) {
    if (offset + 12 > buffer.length) return null;
    const length = buffer.readUInt32BE(offset);
    if (length > maxRasterBytes || offset + 12 + length > buffer.length) return null;
    const typeStart = offset + 4;
    const dataStart = typeStart + 4;
    const dataEnd = dataStart + length;
    const type = buffer.toString('ascii', typeStart, dataStart);
    const chunkData = buffer.subarray(dataStart, dataEnd);
    const declaredCrc = buffer.readUInt32BE(dataEnd);
    if (crc32(buffer.subarray(typeStart, dataEnd)) !== declaredCrc) return null;
    offset = dataEnd + 4;

    if (!sawHeader && type !== 'IHDR') return null;
    if (type === 'IHDR') {
      if (sawHeader || length !== 13) return null;
      sawHeader = true;
      header = {
        width: chunkData.readUInt32BE(0),
        height: chunkData.readUInt32BE(4),
        bitDepth: chunkData[8],
        colorType: chunkData[9],
        compression: chunkData[10],
        filter: chunkData[11],
        interlace: chunkData[12]
      };
    } else if (type === 'PLTE') {
      if (sawPalette || sawImageData || length === 0 || length % 3 !== 0 || length > 768) return null;
      sawPalette = true;
    } else if (type === 'IDAT') {
      if (imageDataEnded || length === 0) return null;
      sawImageData = true;
      imageData.push(chunkData);
    } else if (type === 'IEND') {
      if (!sawImageData || length !== 0 || offset !== buffer.length) return null;
      sawEnd = true;
      break;
    } else {
      if (sawImageData) imageDataEnded = true;
      if ((buffer[typeStart] & 0x20) === 0) return null;
    }
    if (type !== 'IDAT' && sawImageData && type !== 'IEND') imageDataEnded = true;
  }

  if (!sawHeader || !sawImageData || !sawEnd || !header) return null;
  const validDepths = {
    0: new Set([1, 2, 4, 8, 16]),
    2: new Set([8, 16]),
    3: new Set([1, 2, 4, 8]),
    4: new Set([8, 16]),
    6: new Set([8, 16])
  };
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
  if (!validDepths[header.colorType] || !validDepths[header.colorType].has(header.bitDepth) ||
      header.width <= 0 || header.height <= 0 || header.width > 32768 || header.height > 32768 ||
      header.compression !== 0 || header.filter !== 0 || header.interlace !== 0 ||
      (header.colorType === 3 && !sawPalette) || ([0, 4].includes(header.colorType) && sawPalette)) return null;

  const rowBytes = Math.ceil((header.width * channels[header.colorType] * header.bitDepth) / 8);
  const expectedBytes = (rowBytes + 1) * header.height;
  if (!Number.isSafeInteger(expectedBytes) || expectedBytes <= 0 || expectedBytes > maxDecodedRasterBytes) return null;
  let decoded;
  try {
    decoded = zlib.inflateSync(Buffer.concat(imageData), { maxOutputLength: expectedBytes });
  } catch {
    return null;
  }
  if (decoded.length !== expectedBytes) return null;
  for (let row = 0; row < header.height; row++) {
    if (decoded[row * (rowBytes + 1)] > 4) return null;
  }
  return { width: header.width, height: header.height };
}

function imageDimensions(filePath, extension) {
  if (extension !== '.png') return null;
  const buffer = fs.readFileSync(filePath);
  return pngDimensions(buffer);
}

function isRelativePathInside(relativePath) {
  return Boolean(relativePath) && relativePath !== '..' &&
    !relativePath.startsWith(`..${path.sep}`) && !path.isAbsolute(relativePath);
}

function inspectExactLocalPath(rootDir, relativeSource) {
  const errors = [];
  const segments = String(relativeSource || '').replace(/\\/g, '/').split('/').filter(Boolean);
  let current = path.resolve(rootDir);
  let rootRealPath;
  try {
    rootRealPath = fs.realpathSync.native(current);
  } catch {
    return { errors: ['Evidence root cannot be resolved.'], filePath: null };
  }

  for (const segment of segments) {
    let names;
    try {
      names = fs.readdirSync(current);
    } catch {
      errors.push(`${relativeSource}: missing approved local asset.`);
      return { errors, filePath: null };
    }
    const exactName = names.find((name) => name === segment);
    if (!exactName) {
      if (names.some((name) => name.toLowerCase() === segment.toLowerCase())) {
        errors.push(`${relativeSource}: declaration must match exact filesystem case.`);
      } else {
        errors.push(`${relativeSource}: missing approved local asset.`);
      }
      return { errors, filePath: null };
    }

    current = path.join(current, exactName);
    let stats;
    try {
      stats = fs.lstatSync(current);
    } catch {
      errors.push(`${relativeSource}: missing approved local asset.`);
      return { errors, filePath: null };
    }
    if (stats.isSymbolicLink()) {
      errors.push(`${relativeSource}: symbolic link or reparse point is not allowed for public evidence.`);
      return { errors, filePath: null };
    }
    let realPath;
    try {
      realPath = fs.realpathSync.native(current);
    } catch {
      errors.push(`${relativeSource}: approved local asset realpath cannot be resolved.`);
      return { errors, filePath: null };
    }
    if (!isRelativePathInside(path.relative(rootRealPath, realPath))) {
      errors.push(`${relativeSource}: public evidence realpath escapes the repository root.`);
      return { errors, filePath: null };
    }
  }
  return { errors, filePath: current };
}

function approvedLocalEvidenceErrors(entry, rootDir) {
  const errors = [];
  const source = entry.source;
  const normalizedSource = typeof source === 'string' ? source.replace(/\\/g, '/') : '';
  const expectedPrefix = `assets/projects/${entry.project}/`;
  if (!isSafePublicPath(source) || isSafeHttpsUrl(source)) {
    return [`${entry.id}: approved ${entry.type} requires a safe repository-relative source.`];
  }
  if (normalizedSource.split('/').some((segment) => /^(?:private|raw|extracted|manifest)$/i.test(segment))) {
    errors.push(`${entry.id}: approved local asset path contains a restricted source directory segment.`);
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
  if (!isRelativePathInside(relativeToProject)) {
    if (!errors.some((error) => /below its project directory/.test(error))) {
      errors.push(`${entry.id}: approved local asset must resolve below its project directory.`);
    }
  } else {
    const inspection = inspectExactLocalPath(rootDir, normalizedSource);
    errors.push(...inspection.errors.map((error) => `${entry.id}: ${error}`));
    if (inspection.filePath && !fs.lstatSync(inspection.filePath).isFile()) {
      errors.push(`${entry.id}: approved local source must be a regular file.`);
    } else if (inspection.filePath && entry.type === 'image' && !imageDimensions(inspection.filePath, extension)) {
      errors.push(`${entry.id}: approved raster image must be structurally complete and decodable with valid intrinsic dimensions.`);
    }
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
    if ((entry.state === 'pending-review' || entry.state === 'excluded') && entry.source !== '-') {
      errors.push(`${entry.id}: ${entry.state} evidence source must be exactly "-" and must not declare a public source.`);
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
    const lead = project.media && project.media.lead;
    const video = project.media && project.media.video;
    const approvedLeadVideo = Boolean(lead && lead.type === 'video' && lead.status === 'approved');
    const approvedSecondaryVideo = Boolean(video && video.type === 'video' && video.status === 'approved');
    if (!approvedLeadVideo && !approvedSecondaryVideo) continue;
    const sameApprovedVideo = approvedLeadVideo && approvedSecondaryVideo &&
      lead.id === video.id && lead.publicPath === video.publicPath;
    if (!sameApprovedVideo) {
      errors.push(`${project.slug}: approved media.video must equal the approved video lead.`);
      continue;
    }
    const poster = project.media && project.media.poster;
    const posterEntry = poster && entriesById.get(poster.id);
    if (!poster || poster.type !== 'image' || poster.status !== 'approved' ||
        !posterEntry || posterEntry.state !== 'approved-public' || posterEntry.type !== 'image') {
      errors.push(`${project.slug}: approved video requires an approved image poster registered as approved-public.`);
      continue;
    }
    const html = render.evidenceMediaHtml(project, 'en', '', false);
    if (!/<video\b(?=[^>]*\bcontrols\b)(?=[^>]*\bpreload="none")/i.test(html) ||
        !html.includes(`<source src="${lead.publicPath}"`) || /\bautoplay\b/i.test(html)) {
      errors.push(`${project.slug}: approved video renderer must retain controls, preload="none", a source, and no autoplay.`);
    }
  }
  return errors;
}

function evidenceRootInventoryErrors(rootDir) {
  const errors = [];
  const relativeEvidenceRoot = path.posix.join('assets', 'projects');
  const inspection = inspectExactLocalPath(rootDir, relativeEvidenceRoot);
  if (inspection.errors.length || !inspection.filePath) {
    return [`assets/projects: missing or unsafe evidence root (${inspection.errors.join(' ')}).`];
  }
  const evidenceRoot = inspection.filePath;
  if (!fs.lstatSync(evidenceRoot).isDirectory()) return ['assets/projects: evidence root must be a directory.'];

  const expectedDirectories = new Set(i18n.canonicalCaseSlugs);
  const expectedItems = new Set(['EVIDENCE_REGISTER.md', ...expectedDirectories]);
  const actualItems = fs.readdirSync(evidenceRoot, { withFileTypes: true });
  const actualNames = new Set(actualItems.map((item) => item.name));
  const repositoryRealPath = fs.realpathSync.native(path.resolve(rootDir));

  for (const item of actualItems) {
    const absoluteItem = path.join(evidenceRoot, item.name);
    const stats = fs.lstatSync(absoluteItem);
    if (!expectedItems.has(item.name)) {
      const kind = item.isDirectory() ? 'directory' : item.isFile() ? 'file' : 'item';
      errors.push(`${item.name}: unexpected evidence root ${kind}.`);
      if (stats.isSymbolicLink()) errors.push(`${item.name}: unexpected evidence root item is a symbolic link or reparse point.`);
      continue;
    }
    if (stats.isSymbolicLink()) {
      errors.push(`${item.name}: symbolic link or reparse point is not allowed at the evidence root.`);
      continue;
    }
    const realPath = fs.realpathSync.native(absoluteItem);
    if (!isRelativePathInside(path.relative(repositoryRealPath, realPath))) {
      errors.push(`${item.name}: evidence root item realpath escapes the repository.`);
      continue;
    }
    if (item.name === 'EVIDENCE_REGISTER.md' && !item.isFile()) {
      errors.push('EVIDENCE_REGISTER.md: evidence register must be a regular file.');
    }
    if (expectedDirectories.has(item.name) && !item.isDirectory()) {
      errors.push(`${item.name}: canonical evidence root item must be a directory.`);
    }
  }

  for (const expected of expectedItems) {
    if (!actualNames.has(expected)) errors.push(`${expected}: missing required evidence root item.`);
  }
  return errors;
}

function evidenceDirectoryErrors(rootDir) {
  const errors = evidenceRootInventoryErrors(rootDir);
  const register = readEvidenceRegister(rootDir);
  for (const slug of i18n.canonicalCaseSlugs) {
    const relativeProjectDirectory = path.posix.join('assets', 'projects', slug);
    const projectDirectory = path.join(rootDir, ...relativeProjectDirectory.split('/'));
    const directoryInspection = inspectExactLocalPath(rootDir, relativeProjectDirectory);
    if (directoryInspection.errors.length) {
      errors.push(`${slug}: missing or unsafe public evidence directory (${directoryInspection.errors.join(' ')}).`);
      continue;
    }
    if (!fs.lstatSync(projectDirectory).isDirectory()) {
      errors.push(`${slug}: public evidence root must be a directory.`);
      continue;
    }

    const allowedFiles = new Set(['README.md']);
    const allowedDirectories = new Set();
    for (const entry of register.entries) {
      if (entry.project !== slug || entry.state !== 'approved-public' || !['image', 'video'].includes(entry.type) ||
          isSafeHttpsUrl(entry.source)) continue;
      const prefix = `${relativeProjectDirectory}/`;
      if (!entry.source.startsWith(prefix)) continue;
      const localName = entry.source.slice(prefix.length);
      allowedFiles.add(localName);
      const parts = localName.split('/');
      for (let index = 1; index < parts.length; index++) allowedDirectories.add(parts.slice(0, index).join('/'));
    }

    function inspectDirectory(directory, relativeDirectory) {
      for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
        const relativeName = relativeDirectory ? `${relativeDirectory}/${item.name}` : item.name;
        const absoluteName = path.join(directory, item.name);
        const stats = fs.lstatSync(absoluteName);
        if (stats.isSymbolicLink()) {
          errors.push(`${slug}/${relativeName}: symbolic link or reparse point is not allowed in public evidence.`);
          continue;
        }
        let realPath;
        try {
          realPath = fs.realpathSync.native(absoluteName);
        } catch {
          errors.push(`${slug}/${relativeName}: evidence realpath cannot be resolved.`);
          continue;
        }
        const rootRealPath = fs.realpathSync.native(path.resolve(rootDir));
        if (!isRelativePathInside(path.relative(rootRealPath, realPath))) {
          errors.push(`${slug}/${relativeName}: evidence realpath escapes the repository root.`);
          continue;
        }
        if (item.isDirectory()) {
          if (!allowedDirectories.has(relativeName)) errors.push(`${slug}/${relativeName}: unregistered evidence directory.`);
          inspectDirectory(absoluteName, relativeName);
        } else if (!item.isFile() || !allowedFiles.has(relativeName)) {
          errors.push(`${slug}/${relativeName}: unregistered evidence file.`);
        }
      }
    }
    inspectDirectory(projectDirectory, '');

    const readme = path.join(projectDirectory, 'README.md');
    if (!fs.existsSync(readme) || !fs.lstatSync(readme).isFile()) {
      errors.push(`${slug}: missing public-safe evidence directory README.`);
      continue;
    }
    const readmeContent = fs.readFileSync(readme, 'utf8');
    if (proseContainsLocalPath(readmeContent)) {
      errors.push(`${slug}/README.md: contains a private source path or restricted source label.`);
    }
    const prohibitedPartner = readmeContent.match(privatePartnerPattern)?.[0];
    if (prohibitedPartner) {
      errors.push(`${slug}/README.md: contains a nonpublic partner or company-project name: ${prohibitedPartner}.`);
    }
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

function publicCvDataErrors(candidate) {
  const errors = [];
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return ['Public CV data must be an object.'];
  }
  const serialized = JSON.stringify(candidate);
  const prohibitedPatterns = [
    /\b\d{2,3}-\d{3,4}-\d{4}\b/,
    /\b10-\d{4}-\d+\b/,
    /\b(?:age|salary|professor|advisor|patient|hospital|customer|street address|home address)\b/i,
    /나이|연봉|지도교수|환자|병원|고객|자택|거주지|주소/,
    /\b(?:JPT|OPIc)\b/i,
    /3\s*[-–]\s*4\s*(?:months|개월)|1\s*[-–]\s*2\s*(?:weeks|주)|주\s*단위|월\s*단위/i,
    /Samsung Medical|삼성서울병원|동산병원|계명대|HD현대|Hyundai|KERI|KAERI|ANL|ETRI/i,
    /(?:^|[\s"'(])(?:[A-Za-z]:[\\/]|\\\\)|file:\/\/|OneDrive|private[\\/]raw/i
  ];
  for (const pattern of prohibitedPatterns) {
    const match = serialized.match(pattern);
    if (match) errors.push(`Public CV data contains a prohibited private or unverified claim: ${match[0]}.`);
  }
  if (candidate.version !== '2026-08-16') errors.push('Public CV data requires the approved 2026-08-16 version.');
  if (!candidate.identity || candidate.identity.name !== 'Jinmin Kim') errors.push('Public CV identity is missing.');
  for (const locale of ['ko', 'en']) {
    const copy = candidate.identity && candidate.identity.translations && candidate.identity.translations[locale];
    if (!copy || !copy.displayName || !copy.headline || !copy.summary) errors.push(`Public CV identity is missing ${locale} copy.`);
  }
  if (!Array.isArray(candidate.contacts) || candidate.contacts.length !== 3) {
    errors.push('Public CV must declare exactly three public contact links.');
  } else {
    for (const contact of candidate.contacts) {
      const isMail = /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.href || '');
      if (!contact.label || !contact.value || (!isMail && !isSafeHttpsUrl(contact.href))) {
        errors.push('Public CV contains an invalid public contact link.');
      }
    }
  }
  for (const [field, expectedLength] of [['timeline', 4], ['capabilities', 4], ['research', 2]]) {
    if (!Array.isArray(candidate[field]) || candidate[field].length !== expectedLength) {
      errors.push(`Public CV ${field} must contain exactly ${expectedLength} entries.`);
    }
  }
  if (!candidate.achievements || candidate.achievements.patentApplications !== 7 ||
      candidate.achievements.patentGrants !== 3 || candidate.achievements.awardTotal !== 9) {
    errors.push('Public CV achievement totals must remain 7 applications, 3 grants, and 9 awards.');
  }
  if (!serialized.includes('JLPT N2')) errors.push('Public CV must retain the valid JLPT N2 credential.');
  if (!serialized.includes('s10278-024-01014-z') || !serialized.includes('Joint first author')) {
    errors.push('Public CV must retain the public 2024 JIIM joint-first-author evidence.');
  }
  if (!serialized.includes('ACCAS 2022')) errors.push('Public CV must retain the ACCAS 2022 evidence.');
  return errors;
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function pdfPageCount(filePath) {
  return (fs.readFileSync(filePath).toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
}

function pdfArtifactErrors(rootDir) {
  const errors = [];
  const projectNames = i18n.canonicalCaseSlugs.flatMap((slug) => ['ko', 'en'].map((locale) => `${slug}-${locale}.pdf`));
  const cvNames = ['jinmin-kim-cv-ko.pdf', 'jinmin-kim-cv-en.pdf'];
  const expectedOutputNames = projectNames.concat(cvNames).sort();
  const outputRoot = path.join(rootDir, 'output', 'pdf');
  const projectRoot = path.join(rootDir, 'assets', 'pdfs');
  const cvRoot = path.join(rootDir, 'assets', 'cv');

  for (const [directory, label] of [[outputRoot, 'output/pdf'], [projectRoot, 'assets/pdfs'], [cvRoot, 'assets/cv']]) {
    if (!fs.existsSync(directory) || !fs.lstatSync(directory).isDirectory()) errors.push(`${label}: missing PDF artifact directory.`);
  }
  if (errors.length) return errors;

  const actualOutputNames = fs.readdirSync(outputRoot).filter((name) => name.toLowerCase().endsWith('.pdf')).sort();
  const actualProjectNames = fs.readdirSync(projectRoot).filter((name) => name.toLowerCase().endsWith('.pdf')).sort();
  const actualCvNames = fs.readdirSync(cvRoot).filter((name) => name.toLowerCase().endsWith('.pdf')).sort();
  if (JSON.stringify(actualOutputNames) !== JSON.stringify(expectedOutputNames)) errors.push('output/pdf must contain exactly twelve project PDFs and two CV PDFs.');
  if (JSON.stringify(actualProjectNames) !== JSON.stringify(projectNames.slice().sort())) errors.push('assets/pdfs must contain exactly the twelve canonical localized project PDFs.');
  if (JSON.stringify(actualCvNames) !== JSON.stringify(cvNames.slice().sort())) errors.push('assets/cv must contain exactly the two localized CV PDFs.');

  for (const name of expectedOutputNames) {
    const isCv = cvNames.includes(name);
    const publishedPath = path.join(isCv ? cvRoot : projectRoot, name);
    const outputPath = path.join(outputRoot, name);
    const expectedPages = isCv ? 2 : 6;
    for (const filePath of [publishedPath, outputPath]) {
      if (!fs.existsSync(filePath) || !fs.lstatSync(filePath).isFile()) {
        errors.push(`${path.relative(rootDir, filePath)}: missing PDF artifact.`);
        continue;
      }
      const bytes = fs.readFileSync(filePath);
      const text = bytes.toString('latin1');
      if (bytes.subarray(0, 5).toString('ascii') !== '%PDF-' || bytes.length <= 12_000) errors.push(`${path.relative(rootDir, filePath)}: invalid or unexpectedly small PDF.`);
      if (pdfPageCount(filePath) !== expectedPages) errors.push(`${path.relative(rootDir, filePath)}: expected ${expectedPages} PDF pages.`);
      if (!/\/Author\s*\(Jinmin Kim\)/.test(text) || !/\/Creator\s*\(Jinmin Kim Portfolio PDF Generator\)/.test(text)) {
        errors.push(`${path.relative(rootDir, filePath)}: missing sanitized PDF metadata.`);
      }
      if (!/\/URI\s*\(/.test(text)) errors.push(`${path.relative(rootDir, filePath)}: missing public link annotation.`);
      if (/\/EmbeddedFiles\b|\/Filespec\b/.test(text)) errors.push(`${path.relative(rootDir, filePath)}: hidden attachment is not allowed.`);
      if (/(?:^|[\s"'(])(?:[A-Za-z]:[\\/]|\\\\)|file:\/\/|OneDrive|private[\\/]raw/i.test(text)) errors.push(`${path.relative(rootDir, filePath)}: PDF bytes expose a private source path.`);
    }
    if (fs.existsSync(publishedPath) && fs.existsSync(outputPath) && sha256File(publishedPath) !== sha256File(outputPath)) {
      errors.push(`${name}: output and published PDF checksums differ.`);
    }
  }

  for (const locale of ['ko', 'en']) {
    for (const pageNumber of [1, 2]) {
      const name = `jinmin-kim-cv-${locale}-page-${pageNumber}.png`;
      const preview = path.join(cvRoot, name);
      if (!fs.existsSync(preview) || !imageDimensions(preview, '.png')) errors.push(`assets/cv/${name}: missing or invalid CV raster preview.`);
    }
  }

  const publicCvPath = path.join(rootDir, 'data', 'public-cv.json');
  if (!fs.existsSync(publicCvPath) || !fs.lstatSync(publicCvPath).isFile()) {
    errors.push('data/public-cv.json: missing public CV data.');
  } else {
    try {
      errors.push(...publicCvDataErrors(JSON.parse(fs.readFileSync(publicCvPath, 'utf8'))));
    } catch {
      errors.push('data/public-cv.json: malformed public CV data.');
    }
  }

  for (const locale of ['ko', 'en']) {
    const relativePage = locale === 'en' ? path.join('en', 'cv', 'index.html') : path.join('cv', 'index.html');
    const htmlPath = path.join(rootDir, relativePage);
    if (!fs.existsSync(htmlPath)) {
      errors.push(`${relativePage}: missing CV page.`);
      continue;
    }
    const html = fs.readFileSync(htmlPath, 'utf8');
    const base = locale === 'en' ? '../../' : '../';
    const pdfHref = `${base}assets/cv/jinmin-kim-cv-${locale}.pdf`;
    if (!new RegExp(`<object[^>]+data="${escapeRegExp(pdfHref)}"[^>]+type="application/pdf"`).test(html)) errors.push(`${relativePage}: missing localized PDF object.`);
    for (const pageNumber of [1, 2]) {
      const previewHref = `${base}assets/cv/jinmin-kim-cv-${locale}-page-${pageNumber}.png`;
      if (!html.includes(previewHref)) errors.push(`${relativePage}: missing localized CV page ${pageNumber} preview.`);
    }
    if (!new RegExp(`<a[^>]+href="${escapeRegExp(pdfHref)}"[^>]+target="_blank"[^>]+rel="noopener"`).test(html)) errors.push(`${relativePage}: missing PDF open fallback.`);
    if (!new RegExp(`<a[^>]+href="${escapeRegExp(pdfHref)}"[^>]+download`).test(html)) errors.push(`${relativePage}: missing PDF download fallback.`);
  }
  return errors;
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
  errors.push(...pdfArtifactErrors(rootDir));

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
  evidenceRootInventoryErrors,
  evidenceDirectoryErrors,
  imageDimensions,
  portfolioDataErrors,
  publicCvDataErrors,
  pdfArtifactErrors,
  visualAssetErrors,
  validatePortfolio
};
