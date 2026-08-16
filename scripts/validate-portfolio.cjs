const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');

const data = require('../js/portfolio-data.js');
const render = require('../js/portfolio-render.js');
const i18n = require('../js/site-i18n.js');
const {
  canonicalPdfSource,
  pdfSourceDigest
} = require('./portfolio-pdf-source.cjs');
const {
  extractPublicCvSummary,
  publicPiiFindings,
  renderPublicCvSummary
} = require('./public-cv-summary.cjs');

const contributionPattern = render.policy.contributionPercentagePattern;
const privatePartnerPattern = render.policy.prohibitedPartnerPattern;
const isSafePublicPath = render.isSafePublicPath;
const siteUrl = 'https://rafaam11.github.io/';
const pdfGeneratorRelativePath = path.join('scripts', 'generate-portfolio-pdfs.py');
const pdfGeneratorVersion = '3.0';
const pageMountContracts = [
  { tag: 'header', id: 'site-nav', label: 'shared navigation mount' },
  { tag: 'main', id: 'main-content', label: 'main-content landmark' },
  { tag: 'footer', id: 'site-footer', label: 'shared footer mount' }
];
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
const ignoredHtmlInventoryRoots = new Set(['.git', '.superpowers', 'docs', 'node_modules', 'public']);
const evidenceRegisterRelativePath = path.join('assets', 'projects', 'EVIDENCE_REGISTER.md');
const evidenceRegisterStates = new Set(['pending-review', 'approved-public', 'excluded']);
const evidenceMediaTypes = new Set(['image', 'video', 'repository', 'publication']);
const evidenceRegisterHeader = '| Evidence ID | Project | Media type | State | Public source | Provenance / usage |';
const evidenceRegisterSeparator = '| --- | --- | --- | --- | --- | --- |';
const localEvidenceExtensions = {
  image: new Set(['.png']),
  video: new Set(['.mp4'])
};
const maxRasterBytes = 50 * 1024 * 1024;
const maxDecodedRasterBytes = 100 * 1024 * 1024;
const maxVideoBytes = 20 * 1024 * 1024;
const prohibitedPngMetadataChunks = new Set(['tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME']);
const prohibitedMp4MetadataBoxes = new Set(['udta', 'meta', 'ilst', 'uuid']);
const mp4ContainerBoxes = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'dinf', 'edts', 'mvex', 'moof', 'traf', 'mfra']);
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
      page: page.page,
      locale: 'ko',
      allowsNamedEmployer: Boolean(page.allowsNamedEmployer)
    },
    {
      relativePath: path.join('en', page.file),
      absolutePath: path.join(rootDir, 'en', page.file),
      route: page.route,
      page: page.page,
      locale: 'en',
      allowsNamedEmployer: Boolean(page.allowsNamedEmployer)
    }
  ]);
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

function repeatedlyDecodeUrlComponent(value) {
  let decoded = String(value || '');
  for (let index = 0; index < 6; index += 1) {
    let next;
    try {
      next = decodeURIComponent(decoded.replace(/\+/g, '%20'));
    } catch {
      return { value: decoded, malformed: true };
    }
    if (next === decoded) return { value: decoded, malformed: false };
    decoded = next;
  }
  return { value: decoded, malformed: /%[a-f0-9]{2}/i.test(decoded) };
}

function isPrivateNetworkHostname(hostname) {
  const normalized = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!normalized || normalized === 'localhost' || normalized.endsWith('.localhost') ||
      normalized.endsWith('.local') || normalized.endsWith('.internal') || normalized.endsWith('.lan')) return true;
  const ipv4 = normalized.split('.');
  if (ipv4.length === 4 && ipv4.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)) {
    const [first, second] = ipv4.map(Number);
    return first === 0 || first === 10 || first === 127 || first >= 224 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168);
  }
  if (normalized.includes(':')) {
    if (normalized === '::' || normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') ||
        /^fe[89ab]/.test(normalized)) return true;
    const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
    if (mapped) return isPrivateNetworkHostname(mapped);
  }
  return !normalized.includes('.');
}

function publicEvidenceUrlErrors(value) {
  if (!isSafeHttpsUrl(value)) return ['external evidence requires a public HTTPS URL.'];
  const parsed = new URL(value);
  if (isPrivateNetworkHostname(parsed.hostname)) return ['external evidence must not use a private-network or loopback host.'];
  const decoded = repeatedlyDecodeUrlComponent(`${parsed.pathname}${parsed.search}${parsed.hash}`);
  if (decoded.malformed) return ['external evidence URL contains malformed or excessively encoded path data.'];
  const surface = decoded.value.replace(/\\/g, '/');
  if (/[a-z]:\//i.test(surface) || /(?:^|[^:])\/\//.test(surface) || /file:\/\//i.test(surface) ||
      /(?:^|[/])(?:users|home|tmp|onedrive)(?:[/]|$)/i.test(surface) ||
      /(?:^|[/])private[/](?:raw|extracted|manifest)(?:[/]|$)/i.test(surface) ||
      /(?:^|[/])(?:extracted|manifest)(?:[/]|$)/i.test(surface)) {
    return ['external evidence URL exposes an encoded local source path.'];
  }
  return [];
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

function pngChunkTypes(buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length < 20 || !buffer.subarray(0, 8).equals(signature)) return null;
  const types = [];
  let offset = 8;
  while (offset < buffer.length) {
    if (offset + 12 > buffer.length) return null;
    const length = buffer.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (length > maxRasterBytes || end > buffer.length) return null;
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    types.push(type);
    offset = end;
    if (type === 'IEND') return offset === buffer.length ? types : null;
  }
  return null;
}

function mp4Boxes(buffer, start = 0, end = buffer.length) {
  const boxes = [];
  let offset = start;
  while (offset < end) {
    if (offset + 8 > end) return null;
    const size32 = buffer.readUInt32BE(offset);
    const type = buffer.toString('latin1', offset + 4, offset + 8);
    let headerSize = 8;
    let size = size32;
    if (size32 === 1) {
      if (offset + 16 > end) return null;
      const extended = buffer.readBigUInt64BE(offset + 8);
      if (extended > BigInt(Number.MAX_SAFE_INTEGER)) return null;
      size = Number(extended);
      headerSize = 16;
    } else if (size32 === 0) {
      size = end - offset;
    }
    if (size < headerSize || offset + size > end) return null;
    boxes.push({ type, start: offset, dataStart: offset + headerSize, end: offset + size });
    offset += size;
    if (size32 === 0 && offset !== end) return null;
  }
  return offset === end ? boxes : null;
}

function findMp4MetadataBox(buffer, boxes, depth = 0) {
  if (depth > 12) return 'excessive nesting';
  for (const box of boxes) {
    if (prohibitedMp4MetadataBoxes.has(box.type)) return box.type;
    if (!mp4ContainerBoxes.has(box.type)) continue;
    const children = mp4Boxes(buffer, box.dataStart, box.end);
    if (!children) return 'malformed nested container';
    const nested = findMp4MetadataBox(buffer, children, depth + 1);
    if (nested) return nested;
  }
  return '';
}

function mp4DurationSeconds(buffer, movieHeader) {
  const length = movieHeader.end - movieHeader.dataStart;
  if (length < 20) return null;
  const version = buffer[movieHeader.dataStart];
  if (version === 0) {
    const timescale = buffer.readUInt32BE(movieHeader.dataStart + 12);
    const duration = buffer.readUInt32BE(movieHeader.dataStart + 16);
    return timescale > 0 ? duration / timescale : null;
  }
  if (version === 1 && length >= 32) {
    const timescale = buffer.readUInt32BE(movieHeader.dataStart + 20);
    const duration = buffer.readBigUInt64BE(movieHeader.dataStart + 24);
    if (timescale <= 0 || duration > BigInt(Number.MAX_SAFE_INTEGER)) return null;
    return Number(duration) / timescale;
  }
  return null;
}

function mp4HasVideoTrack(buffer, moovChildren) {
  for (const track of moovChildren.filter((box) => box.type === 'trak')) {
    const trackChildren = mp4Boxes(buffer, track.dataStart, track.end);
    if (!trackChildren) continue;
    for (const media of trackChildren.filter((box) => box.type === 'mdia')) {
      const mediaChildren = mp4Boxes(buffer, media.dataStart, media.end);
      if (!mediaChildren) continue;
      for (const handler of mediaChildren.filter((box) => box.type === 'hdlr')) {
        if (handler.end - handler.dataStart >= 12 && buffer.toString('ascii', handler.dataStart + 8, handler.dataStart + 12) === 'vide') {
          return true;
        }
      }
    }
  }
  return false;
}

function approvedMp4Errors(filePath) {
  const errors = [];
  const size = fs.statSync(filePath).size;
  if (size > maxVideoBytes) return ['approved video must be 20 MB or less.'];
  const buffer = fs.readFileSync(filePath);
  const boxes = mp4Boxes(buffer);
  if (!boxes || boxes.length < 3 || boxes[0].type !== 'ftyp') return ['approved video must be a structurally valid MP4 container.'];
  const fileType = boxes[0];
  if (fileType.end - fileType.dataStart < 8 || !/^[\x20-\x7e]{4}$/.test(buffer.toString('ascii', fileType.dataStart, fileType.dataStart + 4))) {
    return ['approved video must contain a valid MP4 file-type box.'];
  }
  const movieBoxes = boxes.filter((box) => box.type === 'moov');
  const mediaBoxes = boxes.filter((box) => box.type === 'mdat' && box.end > box.dataStart);
  if (movieBoxes.length !== 1 || mediaBoxes.length === 0) return ['approved video must contain one movie box and non-empty media data.'];
  const movieChildren = mp4Boxes(buffer, movieBoxes[0].dataStart, movieBoxes[0].end);
  if (!movieChildren) return ['approved video contains a malformed MP4 movie box.'];
  const movieHeaders = movieChildren.filter((box) => box.type === 'mvhd');
  const duration = movieHeaders.length === 1 ? mp4DurationSeconds(buffer, movieHeaders[0]) : null;
  if (!Number.isFinite(duration) || duration < 15 || duration > 30) errors.push('approved video duration must be within the public 15-30 seconds target.');
  if (!mp4HasVideoTrack(buffer, movieChildren)) errors.push('approved MP4 must contain a video track.');
  const metadataBox = findMp4MetadataBox(buffer, boxes);
  if (metadataBox) errors.push(`approved MP4 must be metadata-stripped; prohibited metadata box: ${metadataBox}.`);
  const printable = (buffer.toString('latin1').match(/[\x20-\x7e]{6,}/g) || []).join('\n');
  const pii = publicPiiFindings(printable);
  if (proseContainsLocalPath(printable)) errors.push('approved MP4 exposes a private path.');
  if (pii.length || /(?:PatientName|PatientID|DICOM|OneDrive|GPSLatitude|GPSLongitude)/i.test(printable)) {
    errors.push('approved MP4 exposes private PII or source metadata.');
  }
  const prohibitedPartner = printable.match(privatePartnerPattern)?.[0];
  if (prohibitedPartner) errors.push(`approved MP4 contains a nonpublic partner or company-project name: ${prohibitedPartner}.`);
  return errors;
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
    } else if (inspection.filePath && entry.type === 'image') {
      const buffer = fs.readFileSync(inspection.filePath);
      if (!pngDimensions(buffer)) {
        errors.push(`${entry.id}: approved raster image must be structurally complete and decodable with valid intrinsic dimensions.`);
      } else {
        const metadataChunks = (pngChunkTypes(buffer) || []).filter((type) => prohibitedPngMetadataChunks.has(type));
        if (metadataChunks.length) {
          errors.push(`${entry.id}: approved PNG must be metadata-stripped; prohibited metadata chunk(s): ${metadataChunks.join(', ')}.`);
        }
      }
    } else if (inspection.filePath && entry.type === 'video' && extension === '.mp4') {
      errors.push(...approvedMp4Errors(inspection.filePath).map((error) => `${entry.id}: ${error}`));
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
    if (entry.state === 'approved-public' && ['repository', 'publication'].includes(entry.type)) {
      errors.push(...publicEvidenceUrlErrors(entry.source).map((error) => `${entry.id}: unsafe external evidence source: ${error}`));
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
  const unique = new Map();
  for (const file of declaredFiles) {
    if (!isPathInsideRoot(rootDir, file.absolutePath)) continue;
    const key = file.relativePath.replace(/\\/g, '/').toLowerCase();
    if (!unique.has(key)) unique.set(key, file);
  }
  return [...unique.values()];
}

function collectPublicStrings(value, output = []) {
  if (typeof value === 'string') {
    output.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectPublicStrings(item, output);
  } else if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) collectPublicStrings(nested, output);
  }
  return output;
}

function projectPublicText(project) {
  const surfaces = [project?.translations];
  for (const block of project?.blocks || []) surfaces.push(block?.translations);
  for (const subcase of project?.subcases || []) surfaces.push(subcase?.translations);
  for (const link of project?.links || []) surfaces.push(link?.translations);
  surfaces.push(project?.pdfSequence?.diagram?.translations);
  let text = collectPublicStrings(surfaces).join('\n');
  for (let index = 0; index < 6; index += 1) {
    const next = decodeHtmlReferenceEntities(text);
    if (next === text) break;
    text = next;
  }
  return text;
}

function projectPublicTextErrors(project) {
  const slug = project?.slug || 'unknown-project';
  const text = projectPublicText(project);
  const errors = [];
  if (proseContainsLocalPath(text)) errors.push(`${slug}: localized public copy contains a private source path.`);
  for (const finding of publicPiiFindings(text)) {
    errors.push(`${slug}: localized public copy contains prohibited private PII (${finding}).`);
  }
  if (/(?:\b(?:PatientName|PatientID|StudyInstanceUID|SOPInstanceUID)\b|환자(?:명|번호|ID))\s*[:=]/i.test(text)) {
    errors.push(`${slug}: localized public copy contains a private patient identifier.`);
  }
  return errors;
}

function portfolioDataErrors(candidate) {
  const errors = render.validatePortfolioData(candidate).slice();
  for (const project of candidate?.projects || []) errors.push(...projectPublicTextErrors(project));
  return errors;
}

function publicCvDataErrors(candidate) {
  const errors = [];
  const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  const isText = (value) => typeof value === 'string' && value.trim().length > 0;
  const requireKeys = (value, required, label, optional = []) => {
    if (!isRecord(value)) {
      errors.push(`${label} must be an object.`);
      return false;
    }
    const allowed = new Set(required.concat(optional));
    for (const key of required) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) errors.push(`${label} is missing ${key}.`);
    }
    for (const key of Object.keys(value)) {
      if (!allowed.has(key)) errors.push(`${label} contains unexpected field ${key}.`);
    }
    return true;
  };
  const requireTranslations = (value, fields, label) => {
    if (!requireKeys(value, ['ko', 'en'], `${label} translations`)) return;
    for (const locale of ['ko', 'en']) {
      const copy = value[locale];
      if (!requireKeys(copy, fields, `${label} ${locale} translation`)) continue;
      for (const field of fields) {
        if (!isText(copy[field])) errors.push(`${label} ${locale} ${field} must be a non-empty string.`);
      }
    }
  };
  const requireLocalizedStrings = (value, label) => {
    if (!requireKeys(value, ['ko', 'en'], `${label} translations`)) return;
    for (const locale of ['ko', 'en']) {
      if (!isText(value[locale])) errors.push(`${label} ${locale} must be a non-empty string.`);
    }
  };

  if (!isRecord(candidate)) {
    return ['Public CV data must be an object.'];
  }
  let serialized = '';
  try {
    const json = JSON.stringify(candidate);
    serialized = typeof json === 'string' ? json : '';
  } catch {
    errors.push('Public CV data must be JSON serializable.');
  }
  for (const finding of publicPiiFindings(candidate)) {
    errors.push(`Public CV data contains prohibited private PII (${finding}).`);
  }
  const prohibitedPatterns = [
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
  requireKeys(candidate, ['version', 'identity', 'contacts', 'timeline', 'capabilities', 'research', 'achievements', 'languages'], 'Public CV data');
  if (candidate.version !== '2026-08-16') errors.push('Public CV data requires the approved 2026-08-16 version.');
  if (requireKeys(candidate.identity, ['name', 'translations'], 'Public CV identity')) {
    if (candidate.identity.name !== 'Jinmin Kim') errors.push('Public CV identity must be Jinmin Kim.');
    requireTranslations(candidate.identity.translations, ['displayName', 'headline', 'summary'], 'Public CV identity');
  }
  if (!Array.isArray(candidate.contacts) || candidate.contacts.length !== 3) {
    errors.push('Public CV must declare exactly three public contact links.');
  } else {
    const allowedContacts = new Map([
      ['Email', { value: 'uiop3847@naver.com', href: 'mailto:uiop3847@naver.com' }],
      ['GitHub', { value: 'github.com/rafaam11', href: 'https://github.com/rafaam11' }],
      ['LinkedIn', { value: 'linkedin.com/in/rlawlsals', href: 'https://www.linkedin.com/in/rlawlsals' }]
    ]);
    const labels = new Set();
    for (const [index, contact] of candidate.contacts.entries()) {
      if (!requireKeys(contact, ['label', 'value', 'href'], `Public CV contact ${index + 1}`)) continue;
      const expected = allowedContacts.get(contact.label);
      if (!expected || labels.has(contact.label) || contact.value !== expected.value || contact.href !== expected.href) {
        errors.push(`Public CV contact ${index + 1} is not an approved public contact.`);
      }
      labels.add(contact.label);
    }
    if (labels.size !== allowedContacts.size) errors.push('Public CV contacts must contain Email, GitHub, and LinkedIn exactly once.');
  }

  if (!Array.isArray(candidate.timeline) || candidate.timeline.length !== 4) {
    errors.push('Public CV timeline must contain exactly 4 entries.');
  } else {
    for (const [index, entry] of candidate.timeline.entries()) {
      if (!requireKeys(entry, ['period', 'organization', 'translations'], `Public CV timeline entry ${index + 1}`)) continue;
      for (const field of ['period', 'organization']) if (!isText(entry[field])) errors.push(`Public CV timeline entry ${index + 1} ${field} must be a non-empty string.`);
      requireTranslations(entry.translations, ['role', 'summary'], `Public CV timeline entry ${index + 1}`);
    }
  }
  if (!Array.isArray(candidate.capabilities) || candidate.capabilities.length !== 4) {
    errors.push('Public CV capabilities must contain exactly 4 entries.');
  } else {
    for (const [index, entry] of candidate.capabilities.entries()) {
      if (!requireKeys(entry, ['translations'], `Public CV capability ${index + 1}`)) continue;
      requireTranslations(entry.translations, ['title', 'body'], `Public CV capability ${index + 1}`);
    }
  }
  if (!Array.isArray(candidate.research) || candidate.research.length !== 2) {
    errors.push('Public CV research must contain exactly 2 entries.');
  } else {
    for (const [index, entry] of candidate.research.entries()) {
      if (!requireKeys(entry, ['year', 'title', 'venue', 'role'], `Public CV research entry ${index + 1}`, ['href'])) continue;
      for (const field of ['year', 'title', 'venue', 'role']) if (!isText(entry[field])) errors.push(`Public CV research entry ${index + 1} ${field} must be a non-empty string.`);
      if (entry.href !== undefined && !isSafeHttpsUrl(entry.href)) errors.push(`Public CV research entry ${index + 1} has an invalid public link.`);
    }
  }

  if (requireKeys(candidate.achievements, ['patentApplications', 'patentGrants', 'awardTotal', 'asOf', 'selectedAwards'], 'Public CV achievements')) {
    if (candidate.achievements.patentApplications !== 7 || candidate.achievements.patentGrants !== 3 || candidate.achievements.awardTotal !== 9) {
      errors.push('Public CV achievement totals must remain 7 applications, 3 grants, and 9 awards.');
    }
    if (!isText(candidate.achievements.asOf)) errors.push('Public CV achievements asOf must be a non-empty string.');
    if (!Array.isArray(candidate.achievements.selectedAwards) || candidate.achievements.selectedAwards.length !== 3) {
      errors.push('Public CV achievements must contain exactly 3 selected awards.');
    } else {
      for (const [index, award] of candidate.achievements.selectedAwards.entries()) {
        if (!requireKeys(award, ['year', 'translations'], `Public CV selected award ${index + 1}`)) continue;
        if (!isText(award.year)) errors.push(`Public CV selected award ${index + 1} year must be a non-empty string.`);
        requireLocalizedStrings(award.translations, `Public CV selected award ${index + 1}`);
      }
    }
  }
  if (!Array.isArray(candidate.languages) || candidate.languages.length !== 2) {
    errors.push('Public CV languages must contain exactly 2 entries.');
  } else {
    for (const [index, language] of candidate.languages.entries()) {
      if (!requireKeys(language, ['language', 'translations'], `Public CV language ${index + 1}`)) continue;
      if (!isText(language.language)) errors.push(`Public CV language ${index + 1} language must be a non-empty string.`);
      requireLocalizedStrings(language.translations, `Public CV language ${index + 1}`);
    }
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

function canonicalEvidenceForPdf(rootDir) {
  const register = readEvidenceRegister(rootDir);
  if (register.errors.length) return { evidence: null, errors: register.errors };
  return {
    evidence: register.entries.map((entry) => ({
      id: entry.id,
      project: entry.project,
      type: entry.type,
      state: entry.state,
      source: entry.source,
      note: entry.note
    })),
    errors: []
  };
}

function expectedPdfSourceDigest(rootDir, candidatePortfolio = data, candidateCv) {
  const errors = [];
  let cv = candidateCv;
  if (cv === undefined) {
    const cvPath = path.join(rootDir, 'data', 'public-cv.json');
    if (!fs.existsSync(cvPath) || !fs.lstatSync(cvPath).isFile()) {
      errors.push('data/public-cv.json: missing public CV data.');
    } else {
      try {
        cv = JSON.parse(fs.readFileSync(cvPath, 'utf8'));
      } catch {
        errors.push('data/public-cv.json: malformed public CV data.');
      }
    }
  }
  const evidenceResult = canonicalEvidenceForPdf(rootDir);
  errors.push(...evidenceResult.errors);
  if (errors.length || cv === undefined || !evidenceResult.evidence) return { digest: null, cv, errors };
  try {
    return {
      digest: pdfSourceDigest(canonicalPdfSource(candidatePortfolio, evidenceResult.evidence, cv)),
      cv,
      errors: []
    };
  } catch {
    return { digest: null, cv, errors: ['Canonical PDF source cannot be serialized.'] };
  }
}

function cvSummaryRecoveryArtifactErrors(rootDir) {
  const errors = [];
  const recoveryNamePattern = /\.public-cv-summary-.*\.(?:tmp|bak)$/i;
  const visit = (directory) => {
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch (error) {
      errors.push(`${path.relative(rootDir, directory).replace(/\\/g, '/')}: cannot inspect CV summary recovery artifacts.`);
      return;
    }
    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      const relativePath = path.relative(rootDir, absolutePath).replace(/\\/g, '/');
      if (recoveryNamePattern.test(entry.name)) {
        errors.push(`${relativePath}: stranded CV summary recovery artifact must be recovered or removed before publication.`);
      }
      if (entry.isDirectory()) visit(absolutePath);
    }
  };
  for (const relativeDirectory of ['cv', path.join('en', 'cv')]) {
    const directory = path.join(rootDir, relativeDirectory);
    if (fs.existsSync(directory) && fs.lstatSync(directory).isDirectory()) visit(directory);
  }
  return errors;
}

function pdfArtifactErrors(rootDir, candidatePortfolio = data) {
  const errors = cvSummaryRecoveryArtifactErrors(rootDir);
  const projectNames = i18n.canonicalCaseSlugs.flatMap((slug) => ['ko', 'en'].map((locale) => `${slug}-${locale}.pdf`));
  const cvNames = ['jinmin-kim-cv-ko.pdf', 'jinmin-kim-cv-en.pdf'];
  const expectedOutputNames = projectNames.concat(cvNames).sort();
  const outputRoot = path.join(rootDir, 'output', 'pdf');
  const projectRoot = path.join(rootDir, 'assets', 'pdfs');
  const cvRoot = path.join(rootDir, 'assets', 'cv');
  const expectedPreviewNames = ['ko', 'en'].flatMap((locale) => [1, 2].map((pageNumber) => `jinmin-kim-cv-${locale}-page-${pageNumber}.png`));

  for (const [directory, label] of [[outputRoot, 'output/pdf'], [projectRoot, 'assets/pdfs'], [cvRoot, 'assets/cv']]) {
    if (!fs.existsSync(directory) || !fs.lstatSync(directory).isDirectory()) errors.push(`${label}: missing PDF artifact directory.`);
  }
  if (errors.length) return errors;

  const actualOutputEntries = fs.readdirSync(outputRoot).sort();
  const actualProjectEntries = fs.readdirSync(projectRoot).sort();
  const actualCvEntries = fs.readdirSync(cvRoot).sort();
  const actualOutputNames = actualOutputEntries.filter((name) => name.toLowerCase().endsWith('.pdf')).sort();
  const actualProjectNames = actualProjectEntries.filter((name) => name.toLowerCase().endsWith('.pdf')).sort();
  const actualCvNames = actualCvEntries.filter((name) => name.toLowerCase().endsWith('.pdf')).sort();
  if (JSON.stringify(actualOutputNames) !== JSON.stringify(expectedOutputNames)) errors.push('output/pdf must contain exactly twelve project PDFs and two CV PDFs.');
  if (JSON.stringify(actualProjectNames) !== JSON.stringify(projectNames.slice().sort())) errors.push('assets/pdfs must contain exactly the twelve canonical localized project PDFs.');
  if (JSON.stringify(actualCvNames) !== JSON.stringify(cvNames.slice().sort())) errors.push('assets/cv must contain exactly the two localized CV PDFs.');
  if (JSON.stringify(actualOutputEntries) !== JSON.stringify(expectedOutputNames.concat('manifest.json').sort())) errors.push('output/pdf contains an unexpected or missing published artifact.');
  if (JSON.stringify(actualProjectEntries) !== JSON.stringify(projectNames.slice().sort())) errors.push('assets/pdfs contains an unexpected or missing published artifact.');
  if (JSON.stringify(actualCvEntries) !== JSON.stringify(cvNames.concat(expectedPreviewNames).sort())) errors.push('assets/cv contains an unexpected or missing published artifact.');

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
      const dimensions = fs.existsSync(preview) ? imageDimensions(preview, '.png') : null;
      if (!dimensions) {
        errors.push(`assets/cv/${name}: missing or invalid CV raster preview.`);
      } else if (dimensions.width !== 1241 || dimensions.height !== 1754) {
        errors.push(`assets/cv/${name}: CV raster preview must be exactly 1241x1754.`);
      }
    }
  }

  const sourceResult = expectedPdfSourceDigest(rootDir, candidatePortfolio);
  errors.push(...sourceResult.errors);
  if (sourceResult.cv !== undefined) errors.push(...publicCvDataErrors(sourceResult.cv));

  const manifestPath = path.join(outputRoot, 'manifest.json');
  let manifest;
  if (!fs.existsSync(manifestPath) || !fs.lstatSync(manifestPath).isFile()) {
    errors.push('output/pdf/manifest.json: missing PDF artifact manifest.');
  } else {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {
      errors.push('output/pdf/manifest.json: malformed PDF artifact manifest.');
    }
  }
  if (manifest && typeof manifest === 'object' && !Array.isArray(manifest)) {
    const topKeys = Object.keys(manifest).sort();
    if (JSON.stringify(topKeys) !== JSON.stringify(['artifacts', 'documents', 'generator', 'generatorSha256', 'generatorVersion', 'schemaVersion', 'sourceDigest'])) {
      errors.push('output/pdf/manifest.json: invalid manifest schema fields.');
    }
    if (manifest.schemaVersion !== 3) errors.push('output/pdf/manifest.json: unsupported manifest schemaVersion.');
    if (manifest.generator !== 'scripts/generate-portfolio-pdfs.py') errors.push('output/pdf/manifest.json: invalid generator identity.');
    if (manifest.generatorVersion !== pdfGeneratorVersion) errors.push('output/pdf/manifest.json: invalid generator version.');
    if (!/^[a-f0-9]{64}$/.test(manifest.generatorSha256 || '')) {
      errors.push('output/pdf/manifest.json: invalid generator SHA-256.');
    }
    const generatorPath = path.join(rootDir, pdfGeneratorRelativePath);
    if (!fs.existsSync(generatorPath) || !fs.lstatSync(generatorPath).isFile()) {
      errors.push('scripts/generate-portfolio-pdfs.py: missing current PDF generator source.');
    } else if (manifest.generatorSha256 !== sha256File(generatorPath)) {
      errors.push('output/pdf/manifest.json: generator source hash is stale for the current PDF layout code.');
    }
    if (!/^[a-f0-9]{64}$/.test(manifest.sourceDigest || '')) errors.push('output/pdf/manifest.json: invalid source digest.');
    if (sourceResult.digest && manifest.sourceDigest !== sourceResult.digest) {
      errors.push('output/pdf/manifest.json: source digest is stale for the current canonical portfolio, evidence register, or public CV data.');
    }

    const expectedDocuments = new Map();
    for (const slug of i18n.canonicalCaseSlugs) {
      for (const locale of ['ko', 'en']) {
        const name = `${slug}-${locale}.pdf`;
        expectedDocuments.set(name, { kind: 'project', slug, locale, pages: 6 });
      }
    }
    for (const locale of ['ko', 'en']) {
      expectedDocuments.set(`jinmin-kim-cv-${locale}.pdf`, { kind: 'cv', locale, pages: 2 });
    }
    if (!Array.isArray(manifest.documents) || manifest.documents.length !== expectedDocuments.size) {
      errors.push('output/pdf/manifest.json: documents must track exactly fourteen PDFs.');
    } else {
      const seen = new Set();
      for (const document of manifest.documents) {
        if (!document || typeof document !== 'object' || Array.isArray(document)) {
          errors.push('output/pdf/manifest.json: document record must be an object.');
          continue;
        }
        const expected = expectedDocuments.get(document.name);
        const expectedKeys = expected && expected.kind === 'project'
          ? ['bytes', 'characters', 'kind', 'links', 'locale', 'name', 'pages', 'sha256', 'slug']
          : ['bytes', 'characters', 'kind', 'links', 'locale', 'name', 'pages', 'sha256'];
        if (!expected || seen.has(document.name)) {
          errors.push(`output/pdf/manifest.json: unexpected or duplicate document ${String(document.name)}.`);
          continue;
        }
        seen.add(document.name);
        if (JSON.stringify(Object.keys(document).sort()) !== JSON.stringify(expectedKeys)) errors.push(`${document.name}: invalid document manifest schema.`);
        if (document.kind !== expected.kind || document.locale !== expected.locale || document.pages !== expected.pages ||
            (expected.slug && document.slug !== expected.slug)) errors.push(`${document.name}: document manifest identity or page count mismatch.`);
        if (!Number.isInteger(document.links) || document.links < 1 || !Number.isInteger(document.characters) || document.characters < 1) {
          errors.push(`${document.name}: invalid document QA totals in manifest.`);
        }
        const filePath = path.join(outputRoot, document.name);
        if (fs.existsSync(filePath) && (document.bytes !== fs.statSync(filePath).size || document.sha256 !== sha256File(filePath))) {
          errors.push(`${document.name}: document manifest hash or byte count mismatch.`);
        }
      }
      if (seen.size !== expectedDocuments.size) errors.push('output/pdf/manifest.json: one or more canonical documents are missing.');
    }

    const expectedArtifacts = new Map();
    for (const slug of i18n.canonicalCaseSlugs) {
      for (const locale of ['ko', 'en']) {
        const name = `${slug}-${locale}.pdf`;
        for (const prefix of ['output/pdf', 'assets/pdfs']) {
          expectedArtifacts.set(`${prefix}/${name}`, { kind: 'project-pdf', slug, locale, pages: 6 });
        }
      }
    }
    for (const locale of ['ko', 'en']) {
      const pdfName = `jinmin-kim-cv-${locale}.pdf`;
      for (const prefix of ['output/pdf', 'assets/cv']) {
        expectedArtifacts.set(`${prefix}/${pdfName}`, { kind: 'cv-pdf', locale, pages: 2 });
      }
      for (const pageNumber of [1, 2]) {
        expectedArtifacts.set(`assets/cv/jinmin-kim-cv-${locale}-page-${pageNumber}.png`, {
          kind: 'cv-preview', locale, page: pageNumber
        });
      }
    }
    if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length !== expectedArtifacts.size) {
      errors.push('output/pdf/manifest.json: artifacts must track exactly 32 published files.');
    } else {
      const seen = new Set();
      for (const artifact of manifest.artifacts) {
        if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) {
          errors.push('output/pdf/manifest.json: artifact record must be an object.');
          continue;
        }
        const expected = expectedArtifacts.get(artifact.path);
        if (!expected || seen.has(artifact.path)) {
          errors.push(`output/pdf/manifest.json: unexpected or duplicate artifact ${String(artifact.path)}.`);
          continue;
        }
        seen.add(artifact.path);
        const expectedKeys = expected.kind === 'project-pdf'
          ? ['bytes', 'kind', 'locale', 'pages', 'path', 'sha256', 'slug']
          : expected.kind === 'cv-pdf'
            ? ['bytes', 'kind', 'locale', 'pages', 'path', 'sha256']
            : ['bytes', 'height', 'kind', 'locale', 'page', 'path', 'sha256', 'width'];
        if (JSON.stringify(Object.keys(artifact).sort()) !== JSON.stringify(expectedKeys)) errors.push(`${artifact.path}: invalid artifact manifest schema.`);
        if (artifact.kind !== expected.kind || artifact.locale !== expected.locale ||
            (expected.slug && artifact.slug !== expected.slug) ||
            (expected.pages && artifact.pages !== expected.pages) ||
            (expected.page && artifact.page !== expected.page)) errors.push(`${artifact.path}: artifact manifest identity mismatch.`);
        const filePath = path.join(rootDir, ...artifact.path.split('/'));
        if (!fs.existsSync(filePath) || !fs.lstatSync(filePath).isFile()) continue;
        if (!Number.isInteger(artifact.bytes) || artifact.bytes !== fs.statSync(filePath).size || artifact.sha256 !== sha256File(filePath)) {
          errors.push(`${artifact.path}: artifact manifest hash or byte count mismatch.`);
        }
        if (expected.kind === 'cv-preview') {
          const dimensions = imageDimensions(filePath, '.png');
          if (!dimensions || dimensions.width !== artifact.width || dimensions.height !== artifact.height) {
            errors.push(`${artifact.path}: preview manifest dimensions mismatch.`);
          }
        }
      }
      if (seen.size !== expectedArtifacts.size) errors.push('output/pdf/manifest.json: one or more canonical artifacts are missing.');
    }
  } else if (manifest !== undefined) {
    errors.push('output/pdf/manifest.json: manifest must be an object.');
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
      const previewTag = html.match(new RegExp(`<img\\b[^>]*src="${escapeRegExp(previewHref)}"[^>]*>`, 'i'))?.[0];
      if (!previewTag) {
        errors.push(`${relativePage}: missing localized CV page ${pageNumber} preview.`);
      } else {
        const width = Number(previewTag.match(/\bwidth="(\d+)"/i)?.[1]);
        const height = Number(previewTag.match(/\bheight="(\d+)"/i)?.[1]);
        const previewPath = path.join(cvRoot, `jinmin-kim-cv-${locale}-page-${pageNumber}.png`);
        const dimensions = fs.existsSync(previewPath) ? imageDimensions(previewPath, '.png') : null;
        if (!dimensions || width !== dimensions.width || height !== dimensions.height || width !== 1241 || height !== 1754) {
          errors.push(`${relativePage}: CV preview intrinsic dimensions must match the 1241x1754 raster artifact.`);
        }
      }
    }
    if (!new RegExp(`<a[^>]+href="${escapeRegExp(pdfHref)}"[^>]+target="_blank"[^>]+rel="noopener"`).test(html)) errors.push(`${relativePage}: missing PDF open fallback.`);
    if (!new RegExp(`<a[^>]+href="${escapeRegExp(pdfHref)}"[^>]+download`).test(html)) errors.push(`${relativePage}: missing PDF download fallback.`);
    if (!/<section[^>]+data-cv-summary[^>]+aria-labelledby=/.test(html) || !/<ol\b/.test(html) || !/<ul\b/.test(html) || !/<dl\b/.test(html)) {
      errors.push(`${relativePage}: missing visible semantic HTML CV summary.`);
    }
    const htmlPii = publicPiiFindings(html);
    if (htmlPii.length) errors.push(`${relativePage}: CV HTML public surface contains prohibited private PII (${htmlPii.join('; ')}).`);
    if (sourceResult.cv !== undefined) {
      try {
        const actualSummary = extractPublicCvSummary(html);
        const expectedSummary = renderPublicCvSummary(sourceResult.cv, locale).envelope;
        if (actualSummary !== expectedSummary) {
          errors.push(`${relativePage}: semantic HTML CV summary does not match canonical public CV data.`);
        }
      } catch (error) {
        errors.push(`${relativePage}: semantic HTML CV summary cannot be derived from canonical public CV data (${error instanceof Error ? error.message : String(error)}).`);
      }
    }
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

function toPosix(value) {
  return String(value || '').replace(/\\/g, '/');
}

const htmlAttributeNamedEntities = {
  AMP: '&',
  amp: '&',
  apos: "'",
  bsol: '\\',
  bull: '\u2022',
  centerdot: '\u00b7',
  colon: ':',
  comma: ',',
  dash: '\u2010',
  emsp: '\u2003',
  ensp: '\u2002',
  equals: '=',
  GT: '>',
  gt: '>',
  hairsp: '\u200a',
  hellip: '\u2026',
  hyphen: '\u2010',
  ldquo: '\u201c',
  lpar: '(',
  lsquo: '\u2018',
  LT: '<',
  lt: '<',
  mdash: '\u2014',
  middot: '\u00b7',
  minus: '\u2212',
  nbsp: '\u00a0',
  ndash: '\u2013',
  NewLine: '\n',
  num: '#',
  period: '.',
  plus: '+',
  quest: '?',
  QUOT: '"',
  quot: '"',
  rdquo: '\u201d',
  rpar: ')',
  rsquo: '\u2019',
  semi: ';',
  sol: '/',
  Tab: '\t',
  thinsp: '\u2009'
};
const htmlNumericReferenceReplacements = {
  0x80: 0x20ac,
  0x82: 0x201a,
  0x83: 0x0192,
  0x84: 0x201e,
  0x85: 0x2026,
  0x86: 0x2020,
  0x87: 0x2021,
  0x88: 0x02c6,
  0x89: 0x2030,
  0x8a: 0x0160,
  0x8b: 0x2039,
  0x8c: 0x0152,
  0x8e: 0x017d,
  0x91: 0x2018,
  0x92: 0x2019,
  0x93: 0x201c,
  0x94: 0x201d,
  0x95: 0x2022,
  0x96: 0x2013,
  0x97: 0x2014,
  0x98: 0x02dc,
  0x99: 0x2122,
  0x9a: 0x0161,
  0x9b: 0x203a,
  0x9c: 0x0153,
  0x9e: 0x017e,
  0x9f: 0x0178
};
const htmlAttributeCharacterReferencePattern = /&#(?:[xX]([0-9a-fA-F]+)|(\d+));?|&([A-Za-z][A-Za-z0-9]+);|&(amp|AMP|lt|LT|gt|GT|quot|QUOT|nbsp)(?![A-Za-z0-9=])/g;

function decodeHtmlReferenceEntities(value) {
  return String(value || '').replace(
    htmlAttributeCharacterReferencePattern,
    (match, hexadecimal, decimal, named, legacyNamed) => {
      if (hexadecimal !== undefined || decimal !== undefined) {
        let codePoint = Number.parseInt(hexadecimal || decimal, hexadecimal !== undefined ? 16 : 10);
        if (codePoint === 0 || codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) {
          codePoint = 0xfffd;
        } else if (Object.hasOwn(htmlNumericReferenceReplacements, codePoint)) {
          codePoint = htmlNumericReferenceReplacements[codePoint];
        }
        return String.fromCodePoint(codePoint);
      }
      const name = named || legacyNamed;
      return Object.hasOwn(htmlAttributeNamedEntities, name)
        ? htmlAttributeNamedEntities[name]
        : match;
    }
  );
}

function decodePercentReference(value) {
  let decoded = String(value || '');
  for (let index = 0; index < 4; index++) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      return null;
    }
  }
  return decoded;
}

function absoluteUrlRawPath(value) {
  const authorityStart = value.startsWith('//') ? 2 : value.indexOf('://') + 3;
  const pathSeparators = [value.indexOf('/', authorityStart), value.indexOf('\\', authorityStart)]
    .filter((index) => index !== -1);
  const pathStart = pathSeparators.length ? Math.min(...pathSeparators) : -1;
  const queryStart = value.indexOf('?', authorityStart);
  const fragmentStart = value.indexOf('#', authorityStart);
  const candidates = [queryStart, fragmentStart].filter((index) => index !== -1);
  const suffixStart = candidates.length ? Math.min(...candidates) : value.length;
  if (pathStart === -1 || pathStart > suffixStart) return '/';
  return value.slice(pathStart, suffixStart);
}

function normalizedReference(value, reference, options = {}) {
  const original = String(value || '').trim();
  if (!original || original.startsWith('#') || original.startsWith('?')) return { kind: 'skip' };
  if (/^(?:mailto:|tel:)/i.test(original)) {
    return reference.tag === 'a' ? { kind: 'external' } : { kind: 'error', reason: 'unsupported scheme' };
  }
  if (/^http:/i.test(original)) return { kind: 'error', reason: 'external references must use HTTPS' };
  if (/^https:/i.test(original) || original.startsWith('//')) {
    let parsed;
    try {
      parsed = new URL(original.startsWith('//') ? `https:${original}` : original);
    } catch {
      return { kind: 'error', reason: 'malformed absolute URL' };
    }
    if (parsed.protocol !== 'https:') return { kind: 'error', reason: 'external references must use HTTPS' };
    const sameHost = parsed.hostname.toLowerCase() === 'rafaam11.github.io';
    const samePort = !parsed.port || parsed.port === '443';
    if (!sameHost || !samePort) return { kind: 'external' };
    if (parsed.username || parsed.password) return { kind: 'error', reason: 'same-origin URL must not contain credentials' };
    const decodedPath = decodePercentReference(absoluteUrlRawPath(original));
    if (decodedPath === null) return { kind: 'error', reason: 'malformed encoded reference' };
    if (decodedPath.includes('\\')) return { kind: 'error', reason: 'unsafe local reference is not file-compatible' };
    const segments = decodedPath.split('/');
    if (segments.includes('..')) return { kind: 'error', reason: 'local reference path traversal escapes portfolio root' };
    return { kind: 'local', path: decodedPath.replace(/^\/+/, ''), rootRelative: true };
  }
  if (/^[a-z]:[\\/]/i.test(original)) return { kind: 'error', reason: 'unsafe local reference uses a drive path' };
  if (/^(?:file:|javascript:|data:)/i.test(original) || /^\\\\/.test(original)) {
    return { kind: 'error', reason: 'unsafe local reference uses a prohibited URL form' };
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(original)) return { kind: 'error', reason: 'unsafe local reference uses an unsupported scheme' };
  if (options.allowRootRelative && original.startsWith('/')) {
    const rawPath = original.split(/[?#]/, 1)[0];
    const decodedPath = decodePercentReference(rawPath);
    if (decodedPath === null) return { kind: 'error', reason: 'malformed encoded reference' };
    if (decodedPath.includes('\\')) return { kind: 'error', reason: 'unsafe local reference is not file-compatible' };
    if (decodedPath.split('/').includes('..')) {
      return { kind: 'error', reason: 'local reference path traversal escapes portfolio root' };
    }
    return { kind: 'local', path: decodedPath.replace(/^\/+/, ''), rootRelative: true };
  }
  if (original.includes('\\') || original.startsWith('/')) {
    return { kind: 'error', reason: 'unsafe local reference is not file-compatible' };
  }
  const rawPath = original.split(/[?#]/, 1)[0];
  const decodedPath = decodePercentReference(rawPath);
  if (decodedPath === null) return { kind: 'error', reason: 'malformed encoded reference' };
  return { kind: 'local', path: decodedPath, rootRelative: false };
}

function parseHtmlAttributes(source) {
  const attributes = [];
  let index = 0;
  while (index < source.length) {
    while (/\s/.test(source[index] || '')) index++;
    if (index >= source.length || source[index] === '/') break;
    const nameStart = index;
    while (index < source.length && !/[\s=/>]/.test(source[index])) index++;
    if (index === nameStart) {
      index++;
      continue;
    }
    const name = source.slice(nameStart, index).toLowerCase();
    while (/\s/.test(source[index] || '')) index++;
    let value = '';
    let hasValue = false;
    if (source[index] === '=') {
      hasValue = true;
      index++;
      while (/\s/.test(source[index] || '')) index++;
      const quote = source[index];
      if (quote === '"' || quote === "'") {
        index++;
        const valueStart = index;
        while (index < source.length && source[index] !== quote) index++;
        value = source.slice(valueStart, index);
        if (source[index] === quote) index++;
      } else {
        const valueStart = index;
        while (index < source.length && !/[\s>]/.test(source[index])) index++;
        value = source.slice(valueStart, index);
      }
    }
    const rawValue = value;
    if (hasValue) value = decodeHtmlReferenceEntities(value);
    attributes.push({ name, value, rawValue, hasValue });
  }
  return attributes;
}

function htmlTagEnd(source, start) {
  let quote = '';
  for (let index = start; index < source.length; index++) {
    const character = source[index];
    if (quote) {
      if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === '>') return index;
  }
  return -1;
}

function htmlRawClosingStart(lower, name, start) {
  const prefix = `</${name}`;
  let searchFrom = start;
  while (searchFrom < lower.length) {
    const candidate = lower.indexOf(prefix, searchFrom);
    if (candidate === -1) return -1;
    const boundary = lower[candidate + prefix.length];
    if (boundary === undefined || /[\s/>]/.test(boundary)) return candidate;
    searchFrom = candidate + prefix.length;
  }
  return -1;
}

function htmlStartTags(html) {
  const source = String(html || '');
  const lower = source.toLowerCase();
  const rawTextTags = new Set(['iframe', 'noembed', 'noframes', 'script', 'style', 'textarea', 'title', 'xmp']);
  const tags = [];
  let index = 0;
  while (index < source.length) {
    const opening = source.indexOf('<', index);
    if (opening === -1) break;
    if (source.startsWith('<!--', opening)) {
      const closing = source.indexOf('-->', opening + 4);
      index = closing === -1 ? source.length : closing + 3;
      continue;
    }
    if (source.startsWith('<![CDATA[', opening)) {
      const closing = source.indexOf(']]>', opening + 9);
      index = closing === -1 ? source.length : closing + 3;
      continue;
    }
    if (source[opening + 1] === '!' || source[opening + 1] === '?' || source[opening + 1] === '/') {
      const closing = htmlTagEnd(source, opening + 2);
      index = closing === -1 ? source.length : closing + 1;
      continue;
    }
    const nameMatch = source.slice(opening + 1).match(/^([A-Za-z][A-Za-z0-9:-]*)/);
    if (!nameMatch) {
      index = opening + 1;
      continue;
    }
    const name = nameMatch[1].toLowerCase();
    const nameEnd = opening + 1 + nameMatch[1].length;
    const closing = htmlTagEnd(source, nameEnd);
    if (closing === -1) break;
    const raw = source.slice(opening, closing + 1);
    tags.push({
      name,
      attributes: parseHtmlAttributes(source.slice(nameEnd, closing)),
      raw,
      startOffset: opening,
      endOffset: closing + 1
    });
    index = closing + 1;
    if (rawTextTags.has(name) && !/\/\s*>$/.test(raw)) {
      const rawClosing = htmlRawClosingStart(lower, name, index);
      if (rawClosing === -1) break;
      const rawClosingEnd = htmlTagEnd(source, rawClosing + name.length + 2);
      index = rawClosingEnd === -1 ? source.length : rawClosingEnd + 1;
    }
  }
  return tags;
}

function htmlReferences(html) {
  const references = [];
  const allowedAttributes = {
    a: new Set(['href']),
    area: new Set(['href']),
    base: new Set(['href']),
    link: new Set(['href']),
    audio: new Set(['src']),
    embed: new Set(['src']),
    iframe: new Set(['src']),
    img: new Set(['src']),
    input: new Set(['src']),
    script: new Set(['src']),
    source: new Set(['src']),
    track: new Set(['src']),
    video: new Set(['src', 'poster']),
    object: new Set(['data'])
  };
  for (const tag of htmlStartTags(html)) {
    const allowed = allowedAttributes[tag.name];
    if (!allowed) continue;
    for (const attribute of tag.attributes) {
      if (allowed.has(attribute.name) && attribute.hasValue) {
        references.push({ tag: tag.name, attribute: attribute.name, value: attribute.value });
      }
    }
  }
  return references;
}

function htmlAttributeValue(tag, name) {
  const attribute = tag && tag.attributes.find((candidate) => candidate.name === name);
  return attribute && attribute.hasValue ? attribute.value : undefined;
}

function htmlRelTokens(tag) {
  return String(htmlAttributeValue(tag, 'rel') || '')
    .split(/[\t\n\f\r ]+/)
    .filter(Boolean)
    .map((token) => token.toLowerCase());
}

function htmlAttributeOccurrences(tags, name, value) {
  const occurrences = [];
  for (const tag of tags) {
    for (const attribute of tag.attributes) {
      if (attribute.name === name && attribute.hasValue && attribute.value === value) {
        occurrences.push({ tag, attribute });
      }
    }
  }
  return occurrences;
}

function hasExactValuedAttributes(tag, expectedNames) {
  if (!tag || tag.attributes.length !== expectedNames.length) return false;
  return expectedNames.every((name) => {
    const matches = tag.attributes.filter((attribute) => attribute.name === name);
    return matches.length === 1 && matches[0].hasValue;
  });
}

function htmlAttributeSummary(tag) {
  if (!tag || !tag.attributes.length) return '<none>';
  return tag.attributes
    .map((attribute) => attribute.hasValue ? attribute.name : `${attribute.name} (boolean)`)
    .join(', ');
}

function inspectExactSitePath(rootDir, relativePath) {
  const normalized = toPosix(relativePath).replace(/^\.\//, '');
  const segments = normalized.split('/').filter(Boolean);
  let current = path.resolve(rootDir);
  for (const segment of segments) {
    let names;
    try {
      names = fs.readdirSync(current);
    } catch {
      return { error: `${normalized}: missing local reference target.`, filePath: null };
    }
    if (!names.includes(segment)) {
      if (names.some((name) => name.toLowerCase() === segment.toLowerCase())) {
        return { error: `${normalized}: local reference must match exact filesystem case.`, filePath: null };
      }
      return { error: `${normalized}: missing local reference target.`, filePath: null };
    }
    current = path.join(current, segment);
    let stats;
    try {
      stats = fs.lstatSync(current);
    } catch {
      return { error: `${normalized}: missing local reference target.`, filePath: null };
    }
    if (stats.isSymbolicLink()) {
      return { error: `${normalized}: symbolic links are not allowed for local references.`, filePath: null };
    }
  }
  return { error: '', filePath: current };
}

function localReferenceErrors(file, html, rootDir) {
  const errors = [];
  const pageRelativePath = toPosix(file.relativePath);
  const pageDirectory = path.posix.dirname(pageRelativePath);
  for (const reference of htmlReferences(html)) {
    const original = reference.value;
    const normalized = normalizedReference(original, reference);
    if (normalized.kind === 'skip' || normalized.kind === 'external') continue;
    if (normalized.kind === 'error') {
      errors.push(`${file.relativePath}: ${normalized.reason}: ${original}`);
      continue;
    }

    const localPath = normalized.path;
    const resolved = normalized.rootRelative
      ? path.posix.normalize(localPath || '.')
      : path.posix.normalize(path.posix.join(pageDirectory, localPath));
    if (resolved === '..' || resolved.startsWith('../') || path.posix.isAbsolute(resolved)) {
      errors.push(`${file.relativePath}: local reference path traversal escapes portfolio root: ${original}`);
      continue;
    }
    const isSharedAsset = resolved === 'assets' || resolved.startsWith('assets/');
    if (reference.tag === 'a' && file.locale === 'en' && !isSharedAsset && resolved !== 'en' && !resolved.startsWith('en/')) {
      errors.push(`${file.relativePath}: English link leaves /en/: ${original}`);
    }
    if (reference.tag === 'a' && file.locale === 'ko' && (resolved === 'en' || resolved.startsWith('en/'))) {
      errors.push(`${file.relativePath}: Korean link enters /en/: ${original}`);
    }

    let targetRelativePath = resolved === '.' ? 'index.html' : resolved;
    if (localPath.endsWith('/')) targetRelativePath = path.posix.join(targetRelativePath, 'index.html');
    let inspection = inspectExactSitePath(rootDir, targetRelativePath);
    if (!inspection.error && inspection.filePath && fs.lstatSync(inspection.filePath).isDirectory()) {
      targetRelativePath = path.posix.join(targetRelativePath, 'index.html');
      inspection = inspectExactSitePath(rootDir, targetRelativePath);
    }
    if (inspection.error) errors.push(`${file.relativePath}: ${inspection.error}`);
  }
  return errors;
}

function pageDependencyErrors(file, html, parsedTags) {
  const errors = [];
  const relativePath = toPosix(file.relativePath);
  const depth = relativePath.split('/').length - 1;
  const base = '../'.repeat(depth);
  const isCase = file.route.startsWith('projects/') && file.route !== 'projects/';
  const requiredStyles = [`${base}css/site.css`, `${base}css/spatial-signal.css`];
  if (isCase) requiredStyles.push(`${base}css/case-study.css`);
  if (file.page === 'cv') requiredStyles.push(`${base}css/cv-pdf.css`);
  const requiredScripts = [`${base}js/site-i18n.js`, `${base}js/nav.js`];
  if (file.page === 'home' || file.page === 'projects') {
    requiredScripts.splice(1, 0, `${base}js/portfolio-data.js`, `${base}js/portfolio-render.js`);
  }

  const tags = parsedTags || htmlStartTags(html);
  const stylesheetTags = tags
    .filter((tag) => tag.name === 'link' && htmlRelTokens(tag).includes('stylesheet'));
  const pageDirectory = path.posix.dirname(relativePath);
  const stylesheetRecords = stylesheetTags.map((tag) => {
    const href = htmlAttributeValue(tag, 'href');
    const normalized = href === undefined
      ? { kind: 'error', reason: 'missing stylesheet href' }
      : normalizedReference(href, { tag: 'link', attribute: 'href' }, { allowRootRelative: true });
    const sitePath = normalized.kind === 'local'
      ? path.posix.normalize(normalized.rootRelative
        ? normalized.path || '.'
        : path.posix.join(pageDirectory, normalized.path))
      : '';
    return { tag, href, normalized, sitePath };
  });
  const scriptTags = tags
    .filter((tag) => tag.name === 'script' && tag.attributes.some((attribute) => attribute.name === 'src'));
  const scripts = scriptTags.map((tag) => htmlAttributeValue(tag, 'src') || '');
  const localScripts = scripts.filter((src) => !/^[a-z][a-z0-9+.-]*:/i.test(src));
  for (const tag of stylesheetTags) {
    const hrefAttributes = tag.attributes.filter((attribute) => attribute.name === 'href');
    if (hrefAttributes.length !== 1 || !hrefAttributes[0].hasValue) {
      errors.push(`${file.relativePath}: every parsed stylesheet link must contain exactly one valued href attribute (found ${htmlAttributeSummary(tag)}).`);
    }
  }
  const requiredStylePaths = new Map(requiredStyles.map((required) => [
    required,
    path.posix.normalize(path.posix.join(pageDirectory, required))
  ]));
  for (const required of requiredStyles) {
    const requiredSitePath = requiredStylePaths.get(required);
    const candidates = stylesheetRecords.filter((record) => (
      record.normalized.kind === 'local' && record.sitePath === requiredSitePath
    ));
    if (candidates.length === 0) {
      errors.push(`${file.relativePath}: missing required local stylesheet ${required}.`);
      continue;
    }
    if (candidates.length !== 1) {
      errors.push(`${file.relativePath}: required local stylesheet ${required} must appear exactly once (found ${candidates.length}).`);
      continue;
    }
    const { tag, href } = candidates[0];
    const relTokens = htmlRelTokens(tag);
    if (!hasExactValuedAttributes(tag, ['rel', 'href']) ||
        relTokens.length !== 1 || relTokens[0] !== 'stylesheet' || href !== required) {
      errors.push(`${file.relativePath}: required local stylesheet ${required} must use the exact file-compatible href "${required}" and only one valued rel="stylesheet" plus one valued href attribute (found ${htmlAttributeSummary(tag)}).`);
    }
  }
  const requiredSitePathSet = new Set(requiredStylePaths.values());
  for (const record of stylesheetRecords.filter((candidate) => (
    candidate.normalized.kind === 'local' && !requiredSitePathSet.has(candidate.sitePath)
  ))) {
    errors.push(`${file.relativePath}: unexpected local stylesheet dependency ${record.href}.`);
  }
  for (const required of requiredScripts) {
    if (!localScripts.includes(required)) errors.push(`${file.relativePath}: missing required local script ${required}.`);
  }
  for (const unexpected of localScripts.filter((item) => !requiredScripts.includes(item))) {
    errors.push(`${file.relativePath}: unexpected local script dependency ${unexpected}.`);
  }
  if (scripts.length !== requiredScripts.length || scripts.some((item, index) => item !== requiredScripts[index])) {
    errors.push(`${file.relativePath}: expected exact parsed script sequence ${requiredScripts.join(' -> ')}; found ${scripts.join(' -> ') || '<none>'}.`);
  }
  for (const required of requiredScripts) {
    const candidates = scriptTags.filter((tag) => tag.attributes.some((attribute) => (
      attribute.name === 'src' && attribute.hasValue && attribute.value === required
    )));
    for (const tag of candidates) {
      if (!hasExactValuedAttributes(tag, ['src']) || htmlAttributeValue(tag, 'src') !== required) {
        errors.push(`${file.relativePath}: required local script ${required} must be a classic executable script with exactly one valued src attribute and no other attributes (found ${htmlAttributeSummary(tag)}).`);
      }
    }
  }
  const liveMounts = pageMountContracts.map((contract) => {
    const occurrences = htmlAttributeOccurrences(tags, 'id', contract.id);
    return occurrences.length === 1 && occurrences[0].tag.name === contract.tag
      ? occurrences[0].tag
      : null;
  });
  if (liveMounts.every(Boolean)) {
    const finalMountOffset = Math.max(...liveMounts.map((tag) => tag.startOffset));
    for (const tag of scriptTags) {
      const source = htmlAttributeValue(tag, 'src') || '';
      if (requiredScripts.includes(source) && tag.startOffset <= finalMountOffset) {
        errors.push(`${file.relativePath}: required local script ${source} must appear after all live mounts, including footer#site-footer.`);
      }
    }
  }
  if (/bootstrap|fontawesome|fonts\.googleapis\.com|startbootstrap/i.test(html) ||
      /(?:^|[\/"'])(?:styles|cv-theme)\.css(?:[?#"']|$)|spatial-signal\.js/i.test(html)) {
    errors.push(`${file.relativePath}: contains an obsolete legacy dependency.`);
  }
  return errors;
}

function excludedRouteReferenceErrors(file, html) {
  const errors = [];
  const pageDirectory = path.posix.dirname(toPosix(file.relativePath));
  for (const reference of htmlReferences(html)) {
    const normalized = normalizedReference(reference.value, reference);
    if (normalized.kind !== 'local') continue;
    const resolved = normalized.rootRelative
      ? path.posix.normalize(normalized.path || '.')
      : path.posix.normalize(path.posix.join(pageDirectory, normalized.path));
    const segments = resolved.toLowerCase().split('/').filter((segment) => segment && segment !== '.');
    if (segments[0] === 'en') segments.shift();
    if (segments[0] === 'research') {
      errors.push(`${file.relativePath}: excluded route reference remains: ${reference.value} -> ${resolved}`);
    }
    for (const slug of excludedProjectSlugs) {
      if (segments[0] === 'projects' && segments[1] === slug) {
        errors.push(`${file.relativePath}: excluded route reference remains: ${reference.value} -> ${resolved}`);
      }
    }
  }
  return errors;
}

function portfolioHtmlInventoryErrors(rootDir) {
  const errors = [];
  const expected = new Set(publicPortfolioFiles(rootDir).map((file) => toPosix(file.relativePath)));
  const actual = [];
  function visit(directory, relativeDirectory) {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!relativeDirectory && ignoredHtmlInventoryRoots.has(entry.name)) continue;
      const relativePath = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolutePath, relativePath);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) actual.push(relativePath);
    }
  }
  visit(path.resolve(rootDir), '');
  for (const relativePath of actual) {
    if (!expected.has(relativePath)) errors.push(`${relativePath}: unexpected public HTML page outside the canonical twenty-route inventory.`);
  }
  for (const relativePath of expected) {
    if (!actual.includes(relativePath)) errors.push(`${relativePath}: missing canonical public HTML page.`);
  }
  for (const relativePath of standaloneLegacyFiles) {
    if (fs.existsSync(path.join(rootDir, ...relativePath.split('/')))) {
      errors.push(`${relativePath}: standalone legacy file must be removed.`);
    }
  }
  const diagramsRoot = path.join(rootDir, 'assets', 'diagrams');
  if (fs.existsSync(diagramsRoot)) {
    const pending = [diagramsRoot];
    while (pending.length) {
      const directory = pending.pop();
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const absolutePath = path.join(directory, entry.name);
        if (entry.isDirectory()) pending.push(absolutePath);
        else if (entry.isFile() && entry.name.toLowerCase().endsWith('.svg')) {
          errors.push(`${toPosix(path.relative(rootDir, absolutePath))}: legacy SVG must be removed.`);
        }
      }
    }
  }
  return errors;
}

function forbiddenSourceDocumentErrors(rootDir) {
  const errors = [];
  const ignoredDirectories = new Set(['.git', '.superpowers', 'node_modules']);
  const sourceExtensions = new Set(['.doc', '.docx', '.hwp', '.hwpx', '.odt', '.pages', '.rtf']);
  const sourceNamePattern = /(?:입사지원서|이력서|경력기술서|(?:resume|application)[-_. ]*(?:source|original))/i;
  const pending = [path.resolve(rootDir)];
  while (pending.length) {
    const directory = pending.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        pending.push(absolutePath);
        continue;
      }
      if (!entry.isFile()) continue;
      const relativePath = toPosix(path.relative(rootDir, absolutePath));
      const extension = path.extname(entry.name).toLowerCase();
      const privateResumeDirectory = /(?:^|\/)docs\/이력서(?:\/|$)/i.test(relativePath);
      if (sourceExtensions.has(extension) || privateResumeDirectory || sourceNamePattern.test(entry.name)) {
        errors.push(`Private source document must not enter the public tree: ${relativePath}.`);
      }
    }
  }
  return errors;
}

function publicHtmlVisibleText(html) {
  let visible = String(html || '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|title|textarea|xmp)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ');
  for (let index = 0; index < 6; index += 1) {
    const next = decodeHtmlReferenceEntities(visible);
    if (next === visible) break;
    visible = next;
  }
  return visible;
}

function publicHtmlSurfaceErrors(file, html) {
  const visible = publicHtmlVisibleText(html);
  const errors = [];
  if (proseContainsLocalPath(visible)) {
    errors.push(`${file.relativePath}: visible public HTML contains a private source path or local path.`);
  }
  for (const finding of publicPiiFindings(visible)) {
    errors.push(`${file.relativePath}: visible public HTML contains prohibited private PII (${finding}).`);
  }
  if (/(?:\b(?:PatientName|PatientID|StudyInstanceUID|SOPInstanceUID)\b|환자(?:명|번호|ID))\s*[:=]/i.test(visible)) {
    errors.push(`${file.relativePath}: visible public HTML contains a private patient identifier.`);
  }
  return errors;
}

function staticPageErrors(file, html, rootDir) {
  const errors = [];
  const koreanUrl = siteUrl + file.route;
  const englishUrl = siteUrl + 'en/' + file.route;
  const canonicalUrl = file.locale === 'en' ? englishUrl : koreanUrl;
  const expectedLang = file.locale;
  const tags = htmlStartTags(html);

  if (!new RegExp(`<html lang="${expectedLang}">`).test(html)) {
    errors.push(`${file.relativePath}: expected html lang ${expectedLang}.`);
  }
  if (tags.some((tag) => tag.name === 'base')) {
    errors.push(`${file.relativePath}: real base elements are not allowed.`);
  }
  for (const inertName of ['template', 'noscript']) {
    if (tags.some((tag) => tag.name === inertName)) {
      errors.push(`${file.relativePath}: real ${inertName} inert containers are not allowed.`);
    }
  }
  const bodyTags = tags.filter((tag) => tag.name === 'body');
  if (bodyTags.length !== 1) errors.push(`${file.relativePath}: expected exactly one real body start tag.`);
  const body = bodyTags.length === 1 ? bodyTags[0] : null;
  const actualLang = htmlAttributeValue(body, 'data-lang');
  if (actualLang !== expectedLang) errors.push(`${file.relativePath}: expected body data-lang="${expectedLang}".`);
  const actualRoute = htmlAttributeValue(body, 'data-route');
  if (actualRoute !== file.route) errors.push(`${file.relativePath}: expected body data-route="${file.route}".`);
  const expectedBase = '../'.repeat(toPosix(file.relativePath).split('/').length - 1);
  const actualBase = htmlAttributeValue(body, 'data-base');
  if (actualBase !== expectedBase) errors.push(`${file.relativePath}: expected data-base="${expectedBase}".`);
  const actualPage = htmlAttributeValue(body, 'data-page');
  if (!i18n.supportedNavigationPages.includes(actualPage)) errors.push(`${file.relativePath}: unsupported data-page "${actualPage || ''}".`);
  if (actualPage !== file.page) errors.push(`${file.relativePath}: expected data-page="${file.page}".`);
  for (const contract of pageMountContracts) {
    const occurrences = htmlAttributeOccurrences(tags, 'id', contract.id);
    if (occurrences.length !== 1) {
      const state = occurrences.length === 0 ? `missing ${contract.label}` : `duplicate ${contract.label}`;
      errors.push(`${file.relativePath}: ${state}; expected exactly one real ${contract.tag}#${contract.id} and exactly one real id="${contract.id}" occurrence across all parsed tags (found ${occurrences.length}).`);
    } else if (occurrences[0].tag.name !== contract.tag) {
      errors.push(`${file.relativePath}: real id="${contract.id}" must belong to <${contract.tag}>; found <${occurrences[0].tag.name}>.`);
    }
  }

  const linkTags = tags.filter((tag) => tag.name === 'link');
  const canonicalLinks = linkTags.filter((tag) => htmlRelTokens(tag).includes('canonical'));
  if (canonicalLinks.length !== 1 || htmlAttributeValue(canonicalLinks[0], 'href') !== canonicalUrl) {
    errors.push(`${file.relativePath}: expected exactly one correct parsed canonical link for ${canonicalUrl}.`);
  }
  const alternateLinks = linkTags.filter((tag) => htmlRelTokens(tag).includes('alternate'));
  for (const [language, expectedUrl] of [['ko', koreanUrl], ['en', englishUrl], ['x-default', koreanUrl]]) {
    const matches = alternateLinks.filter((tag) => htmlAttributeValue(tag, 'hreflang') === language);
    if (matches.length !== 1 || htmlAttributeValue(matches[0], 'href') !== expectedUrl) {
      errors.push(`${file.relativePath}: expected exactly one correct parsed alternate link with hreflang="${language}" for ${expectedUrl}.`);
    }
  }

  errors.push(...pageDependencyErrors(file, html, tags));
  errors.push(...excludedRouteReferenceErrors(file, html));
  errors.push(...localReferenceErrors(file, html, rootDir));
  return errors;
}

function validatePortfolio(rootDir) {
  const errors = portfolioDataErrors(data).slice();
  errors.push(...forbiddenSourceDocumentErrors(rootDir));
  errors.push(...portfolioHtmlInventoryErrors(rootDir));
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
    errors.push(...publicHtmlSurfaceErrors(file, html));
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
  portfolioHtmlInventoryErrors,
  forbiddenSourceDocumentErrors,
  htmlStartTags,
  htmlReferences,
  localReferenceErrors,
  pageDependencyErrors,
  parseEvidenceRegister,
  readEvidenceRegister,
  evidenceRegistryErrors,
  evidenceRootInventoryErrors,
  evidenceDirectoryErrors,
  imageDimensions,
  portfolioDataErrors,
  publicPiiFindings,
  publicCvDataErrors,
  cvSummaryRecoveryArtifactErrors,
  pdfArtifactErrors,
  visualAssetErrors,
  validatePortfolio
};
