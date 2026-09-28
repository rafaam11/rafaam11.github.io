#!/usr/bin/env node
/*
 * scripts/activity-media.cjs — activity-feed media pipeline (Node + ffmpeg/ffprobe, no npm dependencies).
 *
 *   node scripts/activity-media.cjs catalog                         # index assets/usermedia → .superpowers/activity-media-catalog.json
 *   node scripts/activity-media.cjs sheet <folder|M010-M040|all> [--out DIR]
 *                                                                   # 240px thumbnails + 6x6 contact sheets + index.html for owner review
 *   node scripts/activity-media.cjs derive M012,M146 [--start S --duration D] [--crop x:y:w:h] [--audio] [--force]
 *                                                                   # WEBP (long edge 1280, metadata stripped) or H.264 720p clip (≤30 s, no audio)
 *   node scripts/activity-media.cjs check                           # re-verify every record: file, sha256, size caps, metadata leaks, orphans
 *
 * Rules
 *   - assets/usermedia/ (originals, git-ignored) is read-only. Writes go to assets/local-review/, data/activity-media.json,
 *     .superpowers/ or the --out directory only (assertWritable enforces this).
 *   - M-ids are frozen: an id is the 1-based position of the file in the code-point-sorted list of usermedia paths at the
 *     time the catalog was first built. derive refuses to run when a record's sourceSha256 no longer matches its id.
 *   - New records start as approval:"draft" with TODO captions; scripts/profile-home.cjs only publishes approved records.
 *   - Live Photo motion clips (a ≤4 s .mp4 next to a same-named .heic) are never derived; the HEIC still is the photo.
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const USERMEDIA_DIR = path.join(root, 'assets', 'usermedia');
const DERIVED_DIR = path.join(root, 'assets', 'local-review');
const DATA_FILE = path.join(root, 'data', 'activity-media.json');
const SCRATCH_DIR = path.join(root, '.superpowers');
const CATALOG_FILE = path.join(SCRATCH_DIR, 'activity-media-catalog.json');
const PUBLIC_PREFIX = 'assets/local-review/';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp']);
const VIDEO_EXT = new Set(['.mp4', '.mov', '.m4v']);
const LIMITS = {
  maxEdge: 1280,
  maxImageBytes: 300 * 1024,
  maxVideoBytes: 4 * 1024 * 1024,
  maxPosterBytes: 200 * 1024,
  maxClipSeconds: 30,
  maxTotalBytes: 16 * 1024 * 1024,
  livePhotoSeconds: 4,
  minDecodedEdge: 1000
};
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

let extraOutputDir = null;

// ---------------------------------------------------------------- catalog

function mediaId(index) {
  return 'M' + String(index).padStart(3, '0');
}

function kindOf(name) {
  const ext = path.extname(name).toLowerCase();
  if (IMAGE_EXT.has(ext)) return 'image';
  if (VIDEO_EXT.has(ext)) return 'video';
  return 'other';
}

function walk(dir, base, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, base, out);
    else out.push({ absPath: abs, relPath: path.relative(base, abs).split(path.sep).join('/') });
  }
}

// Code-unit order equals code-point order for the BMP characters used in these paths; it matches the frozen ids.
function listSources(dir = USERMEDIA_DIR) {
  const files = [];
  walk(dir, dir, files);
  files.sort((a, b) => (a.relPath < b.relPath ? -1 : a.relPath > b.relPath ? 1 : 0));
  return files.map((file, index) => ({
    id: mediaId(index + 1),
    relPath: file.relPath,
    absPath: file.absPath,
    size: fs.statSync(file.absPath).size,
    ext: path.extname(file.relPath).toLowerCase(),
    kind: kindOf(file.relPath)
  }));
}

function livePhotoPairs(list, durationOf) {
  const stills = new Set(list.filter((item) => /\.hei[cf]$/i.test(item.relPath)).map((item) => item.relPath.replace(/\.[^.]+$/, '').toLowerCase()));
  const pairs = new Set();
  for (const item of list) {
    if (!/\.(mp4|mov)$/i.test(item.relPath)) continue;
    const stem = item.relPath.replace(/\.[^.]+$/, '').toLowerCase();
    if (!stills.has(stem)) continue;
    const duration = durationOf ? durationOf(item) : null;
    if (duration == null || duration <= LIMITS.livePhotoSeconds) pairs.add(item.relPath);
  }
  return pairs;
}

// ---------------------------------------------------------------- metadata parsers

function parseTiff(t) {
  if (t.length < 8) return null;
  const order = t.toString('ascii', 0, 2);
  if (order !== 'II' && order !== 'MM') return null;
  const le = order === 'II';
  const u16 = (o) => (le ? t.readUInt16LE(o) : t.readUInt16BE(o));
  const u32 = (o) => (le ? t.readUInt32LE(o) : t.readUInt32BE(o));
  let orientation = null;
  let date = null;
  let exifOffset = null;
  const readIfd = (offset, handler) => {
    if (offset + 2 > t.length) return;
    const count = u16(offset);
    for (let i = 0; i < count; i += 1) {
      const entry = offset + 2 + i * 12;
      if (entry + 12 > t.length) break;
      handler(u16(entry), u16(entry + 2), u32(entry + 4), entry + 8);
    }
  };
  readIfd(u32(4), (tag, type, count, valueOffset) => {
    if (tag === 0x0112) orientation = u16(valueOffset);
    if (tag === 0x8769) exifOffset = u32(valueOffset);
  });
  if (exifOffset != null) {
    readIfd(exifOffset, (tag, type, count, valueOffset) => {
      if (tag !== 0x9003 || type !== 2) return;
      const start = count <= 4 ? valueOffset : u32(valueOffset);
      date = t.toString('ascii', start, Math.min(t.length, start + count)).replace(/\0[\s\S]*$/, '');
    });
  }
  const match = date && date.match(/^(\d{4}):(\d{2}):(\d{2})/);
  return { date: match ? `${match[1]}-${match[2]}-${match[3]}` : null, orientation };
}

function jpegExifDate(buf) {
  if (!buf || buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let off = 2;
  while (off + 4 <= buf.length) {
    if (buf[off] !== 0xff) return null;
    const marker = buf[off + 1];
    if (marker === 0xd9 || marker === 0xda) return null;
    const length = buf.readUInt16BE(off + 2);
    if (marker === 0xe1 && buf.toString('ascii', off + 4, off + 10) === 'Exif\0\0') {
      return parseTiff(buf.subarray(off + 10, off + 2 + length));
    }
    off += 2 + length;
  }
  return null;
}

function dateFromName(name) {
  let match = name.match(/(20\d{2})(\d{2})(\d{2})[_-](\d{6})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  match = name.match(/(20\d{2})-(\d{2})-(\d{2})-\d{2}-\d{2}-\d{2}/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  match = name.match(/^(1[3-9]\d{11})(?:-\d+)?\./);
  if (match) return new Date(Number(match[1]) + KST_OFFSET_MS).toISOString().slice(0, 10);
  return null;
}

function webpSize(buf) {
  if (!buf || buf.length < 25 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8X') return buf.length < 30 ? null : { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
  if (chunk === 'VP8 ') {
    if (buf.length < 30 || buf[23] !== 0x9d || buf[24] !== 0x01 || buf[25] !== 0x2a) return null;
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === 'VP8L') {
    if (buf[20] !== 0x2f) return null;
    const bits = buf.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  return null;
}

function metadataLeaks(buf, type) {
  const leaks = [];
  if (type === 'webp') {
    let off = 12;
    while (off + 8 <= buf.length) {
      const id = buf.toString('ascii', off, off + 4);
      const size = buf.readUInt32LE(off + 4);
      if (id === 'EXIF') leaks.push('EXIF chunk');
      if (id === 'XMP ') leaks.push('XMP chunk');
      off += 8 + size + (size % 2);
    }
  } else if (type === 'jpeg') {
    let off = 2;
    while (off + 4 <= buf.length && buf[off] === 0xff) {
      const marker = buf[off + 1];
      if (marker === 0xda || marker === 0xd9) break;
      const length = buf.readUInt16BE(off + 2);
      if (marker === 0xe1) {
        if (buf.toString('ascii', off + 4, off + 10) === 'Exif\0\0') leaks.push('APP1 Exif segment');
        else if (buf.toString('ascii', off + 4, off + 33).startsWith('http://ns.adobe.com/xap/1.0/')) leaks.push('APP1 XMP segment');
      }
      off += 2 + length;
    }
  } else if (type === 'mp4') {
    if (buf.indexOf(Buffer.from([0xa9, 0x78, 0x79, 0x7a])) !== -1) leaks.push('©xyz location');
    if (buf.indexOf('com.apple.quicktime.location') !== -1) leaks.push('quicktime location');
    if (buf.indexOf('com.apple.quicktime.creationdate') !== -1) leaks.push('quicktime creation date');
  }
  return leaks;
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function sha256File(file) {
  return sha256(fs.readFileSync(file));
}

// ---------------------------------------------------------------- write guard

function within(target, dir) {
  return target === dir || target.startsWith(dir + path.sep);
}

function assertWritable(target) {
  const resolved = path.resolve(target);
  if (within(resolved, USERMEDIA_DIR)) throw new Error(`refusing to write inside usermedia: ${resolved}`);
  if (resolved === DATA_FILE || within(resolved, DERIVED_DIR) || within(resolved, SCRATCH_DIR) || (extraOutputDir && within(resolved, extraOutputDir))) return resolved;
  throw new Error(`not an allowed output path: ${resolved}`);
}

function setExtraOutputDir(dir) {
  extraOutputDir = dir ? path.resolve(dir) : null;
}

// ---------------------------------------------------------------- ffmpeg

const transposeFor = { 2: 'hflip', 3: 'transpose=1,transpose=1', 4: 'vflip', 5: 'transpose=0', 6: 'transpose=1', 7: 'transpose=3', 8: 'transpose=2' };

function scaleFilter(maxEdge) {
  return `scale='if(gt(iw,ih),min(${maxEdge},iw),-2)':'if(gt(iw,ih),-2,min(${maxEdge},ih))'`;
}

function ffmpegArgsForImage({ src, out, orientation = null, crop = null, maxEdge = LIMITS.maxEdge, quality = 80 }) {
  const filters = [];
  if (orientation && transposeFor[orientation]) filters.push(transposeFor[orientation]);
  if (crop) {
    const [x, y, w, h] = crop.split(':');
    filters.push(`crop=${w}:${h}:${x}:${y}`);
  }
  filters.push(scaleFilter(maxEdge));
  return [
    '-v', 'error', '-y',
    ...(orientation ? ['-noautorotate'] : []),
    '-i', src, '-frames:v', '1',
    '-vf', filters.join(','),
    '-map_metadata', '-1',
    '-c:v', 'libwebp', '-quality', String(quality), '-compression_level', '6',
    out
  ];
}

function ffmpegArgsForVideo({ src, out, start = 0, duration, audio = false, maxEdge = 720, crf = 28 }) {
  return [
    '-v', 'error', '-y',
    '-ss', String(start), '-t', String(duration),
    '-i', src, '-map', '0:v:0',
    ...(audio ? ['-map', '0:a:0?', '-c:a', 'aac', '-b:a', '96k'] : ['-an']),
    '-vf', scaleFilter(maxEdge),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-map_metadata', '-1',
    out
  ];
}

function ffmpegArgsForPoster({ src, out, at = 1 }) {
  return ['-v', 'error', '-y', '-ss', String(at), '-i', src, '-frames:v', '1', '-vf', scaleFilter(720), '-map_metadata', '-1', '-q:v', '4', out];
}

function run(bin, args) {
  return execFileSync(bin, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
}

function probe(file) {
  try {
    const out = run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', file]);
    const json = JSON.parse(out);
    const stream = (json.streams || [])[0] || {};
    return { width: stream.width || null, height: stream.height || null, duration: json.format && json.format.duration ? Number(json.format.duration) : null };
  } catch (error) {
    return { width: null, height: null, duration: null };
  }
}

function orientationOf(src) {
  if (!/\.jpe?g$/i.test(src)) return null;
  const fd = fs.openSync(src, 'r');
  try {
    const head = Buffer.alloc(256 * 1024);
    const read = fs.readSync(fd, head, 0, head.length, 0);
    const exif = jpegExifDate(head.subarray(0, read));
    return exif ? exif.orientation : null;
  } finally {
    fs.closeSync(fd);
  }
}

function isHeif(file) {
  return /\.hei[cf]$/i.test(file);
}

// Tiled iPhone HEIC is assembled by an implicit complex filtergraph, which cannot be combined with -vf.
// Decode it to a temporary PNG first (default mapping = full grid, orientation applied), then filter that.
function decodeHeifToPng(src) {
  const tmp = path.join(os.tmpdir(), `activity-media-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.png`);
  run('ffmpeg', ['-v', 'error', '-y', '-i', src, '-frames:v', '1', '-map_metadata', '-1', tmp]);
  return tmp;
}

function convertImage({ src, out, crop = null, maxEdge = LIMITS.maxEdge, allowOutside = false }) {
  if (!allowOutside) assertWritable(out);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const decoded = isHeif(src) ? decodeHeifToPng(src) : null;
  const input = decoded || src;
  try {
    const source = probe(input);
    const orientation = orientationOf(input);
    run('ffmpeg', ffmpegArgsForImage({ src: input, out, crop, maxEdge }));
    let buf = fs.readFileSync(out);
    let size = webpSize(buf);
    // ffmpeg normally applies EXIF orientation itself; if a rotated source came out unrotated, redo it explicitly.
    if (orientation && orientation >= 5 && size && source.width && source.height && (source.width > source.height) === (size.width > size.height)) {
      run('ffmpeg', ffmpegArgsForImage({ src: input, out, orientation, crop, maxEdge }));
      buf = fs.readFileSync(out);
      size = webpSize(buf);
    }
    if (!size) throw new Error(`could not read WEBP dimensions of ${out}`);
    return { width: size.width, height: size.height, bytes: buf.length, sha256: sha256(buf), leaks: metadataLeaks(buf, 'webp') };
  } finally {
    if (decoded) fs.rmSync(decoded, { force: true });
  }
}

function convertVideo({ src, out, poster, start = 0, duration, audio = false, allowOutside = false }) {
  if (!allowOutside) { assertWritable(out); assertWritable(poster); }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const source = probe(src);
  const total = source.duration || 0;
  const clipDuration = Math.min(duration || LIMITS.maxClipSeconds, LIMITS.maxClipSeconds, Math.max(0, total - start) || LIMITS.maxClipSeconds);
  run('ffmpeg', ffmpegArgsForVideo({ src, out, start, duration: clipDuration, audio }));
  run('ffmpeg', ffmpegArgsForPoster({ src: out, out: poster, at: Math.min(1, clipDuration / 2) }));
  const buf = fs.readFileSync(out);
  const posterBuf = fs.readFileSync(poster);
  const dims = probe(out);
  return {
    width: dims.width, height: dims.height, bytes: buf.length, sha256: sha256(buf), duration: clipDuration,
    leaks: [...metadataLeaks(buf, 'mp4'), ...metadataLeaks(posterBuf, 'jpeg').map((leak) => `poster ${leak}`)],
    posterBytes: posterBuf.length
  };
}

// ---------------------------------------------------------------- catalog / data helpers

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(json) {
  assertWritable(DATA_FILE);
  const media = {};
  for (const id of Object.keys(json.media).sort()) media[id] = json.media[id];
  fs.writeFileSync(DATA_FILE, JSON.stringify({ schema: 1, media }, null, 2) + '\n');
}

function buildCatalog({ withHashes = true } = {}) {
  const list = listSources();
  const durationCache = new Map();
  const durationOf = (item) => {
    if (!durationCache.has(item.relPath)) durationCache.set(item.relPath, probe(item.absPath).duration);
    return durationCache.get(item.relPath);
  };
  const pairs = livePhotoPairs(list, durationOf);
  const items = list.map((item) => {
    let takenAt = null;
    let takenAtSource = null;
    if (item.ext === '.jpg' || item.ext === '.jpeg') {
      const exif = jpegExifDate(fs.readFileSync(item.absPath));
      if (exif && exif.date) { takenAt = exif.date; takenAtSource = 'exif'; }
    }
    if (!takenAt) {
      const fromName = dateFromName(path.basename(item.relPath));
      if (fromName) { takenAt = fromName; takenAtSource = 'filename'; }
    }
    return {
      id: item.id, relPath: item.relPath, size: item.size, kind: item.kind, ext: item.ext,
      sha256: withHashes ? sha256File(item.absPath) : null,
      livePhotoMotion: pairs.has(item.relPath),
      takenAt, takenAtSource
    };
  });
  return { generatedAt: new Date().toISOString(), count: items.length, items };
}

function loadCatalog({ rebuild = false } = {}) {
  if (!rebuild && fs.existsSync(CATALOG_FILE)) return JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));
  const catalog = buildCatalog();
  assertWritable(CATALOG_FILE);
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
  fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2) + '\n');
  return catalog;
}

function parseIdSelection(text, catalog) {
  const ids = new Set();
  for (const part of text.split(',').map((s) => s.trim()).filter(Boolean)) {
    const range = part.match(/^(M\d{3})-(M\d{3})$/);
    if (range) {
      const from = Number(range[1].slice(1)), to = Number(range[2].slice(1));
      for (let i = from; i <= to; i += 1) ids.add(mediaId(i));
    } else if (/^M\d{3}$/.test(part)) ids.add(part);
    else if (part === 'all') catalog.items.forEach((item) => ids.add(item.id));
    else catalog.items.filter((item) => item.relPath.split('/')[0] === part).forEach((item) => ids.add(item.id));
  }
  return [...ids].sort();
}

// ---------------------------------------------------------------- commands

function commandCatalog(args) {
  const catalog = loadCatalog({ rebuild: true });
  if (args.includes('--json')) { process.stdout.write(JSON.stringify(catalog, null, 2) + '\n'); return; }
  for (const item of catalog.items) {
    console.log(`${item.id}  ${String(item.kind).padEnd(5)}  ${item.takenAt || '----------'}  ${(item.size / 1024 / 1024).toFixed(1).padStart(6)} MB  ${item.livePhotoMotion ? '[live-photo motion] ' : ''}${item.relPath}`);
  }
  console.log(`\n${catalog.count} files → ${path.relative(root, CATALOG_FILE)}`);
}

function escapeDrawtext(text) {
  return text.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'");
}

function commandSheet(args) {
  const outFlag = args.indexOf('--out');
  const outDir = outFlag !== -1 ? path.resolve(args[outFlag + 1]) : path.join(SCRATCH_DIR, 'review');
  if (outFlag !== -1) setExtraOutputDir(outDir);
  const selection = args.filter((a, i) => !a.startsWith('--') && (outFlag === -1 || i !== outFlag + 1)).join(',') || 'all';
  const catalog = loadCatalog();
  const ids = parseIdSelection(selection, catalog);
  if (!ids.length) throw new Error(`no catalog entries match "${selection}"`);
  const byId = new Map(catalog.items.map((item) => [item.id, item]));
  const thumbsDir = path.join(outDir, 'thumbs');
  assertWritable(thumbsDir);
  fs.mkdirSync(thumbsDir, { recursive: true });
  // drawtext cannot take a drive letter (the colon breaks the filtergraph parser); copy the font next to the thumbs.
  let font = null;
  for (const candidate of ['C:/Windows/Fonts/arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']) {
    if (fs.existsSync(candidate)) {
      fs.copyFileSync(candidate, path.join(thumbsDir, 'label.ttf'));
      font = path.relative(root, path.join(thumbsDir, 'label.ttf')).split(path.sep).join('/');
      break;
    }
  }
  const usable = [];
  for (const id of ids) {
    const item = byId.get(id);
    if (!item || item.kind === 'other' || item.livePhotoMotion) continue;
    const src = path.join(USERMEDIA_DIR, item.relPath);
    const thumb = path.join(thumbsDir, `${id}.png`);
    if (!fs.existsSync(thumb)) {
      const label = font ? `,drawtext=fontfile=${font}:text='${escapeDrawtext(id)}':x=6:y=h-th-6:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=4` : '';
      const vf = `scale=240:240:force_original_aspect_ratio=decrease,pad=240:240:(ow-iw)/2:(oh-ih)/2:color=white${label}`;
      let decoded = null;
      try {
        decoded = isHeif(src) ? decodeHeifToPng(src) : null;
        const inputArgs = item.kind === 'video' ? ['-ss', '1', '-i', src] : ['-i', decoded || src];
        // One pixel format for every thumbnail: a format change mid-sequence resets the tile filter and drops frames.
        run('ffmpeg', ['-v', 'error', '-y', ...inputArgs, '-frames:v', '1', '-vf', vf, '-pix_fmt', 'rgb24', '-map_metadata', '-1', thumb]);
      } catch (error) {
        console.warn(`thumbnail failed for ${id} (${item.relPath}): ${String(error.message).split('\n')[0]}`);
        continue;
      } finally {
        if (decoded) fs.rmSync(decoded, { force: true });
      }
    }
    usable.push(item);
  }
  // Sheets: 36 per sheet, tiled from a numbered sequence copy.
  const sheets = [];
  for (let offset = 0; offset < usable.length; offset += 36) {
    const batch = usable.slice(offset, offset + 36);
    const seqDir = path.join(thumbsDir, `seq-${sheets.length + 1}`);
    fs.rmSync(seqDir, { recursive: true, force: true });
    fs.mkdirSync(seqDir, { recursive: true });
    batch.forEach((item, i) => fs.copyFileSync(path.join(thumbsDir, `${item.id}.png`), path.join(seqDir, `${String(i + 1).padStart(3, '0')}.png`)));
    const columns = Math.min(6, batch.length);
    const rows = Math.ceil(batch.length / columns);
    const sheet = path.join(outDir, `sheet-${String(sheets.length + 1).padStart(2, '0')}.png`);
    run('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(seqDir, '%03d.png'), '-vf', `tile=${columns}x${rows}:padding=6:margin=6:color=white`, '-frames:v', '1', sheet]);
    fs.rmSync(seqDir, { recursive: true, force: true });
    sheets.push({ file: path.basename(sheet), items: batch });
  }
  const html = ['<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Activity media review</title>',
    '<style>body{font-family:Pretendard,system-ui,sans-serif;margin:1.5rem;color:#1a1a1a}h2{margin-top:2rem}table{border-collapse:collapse;font-size:.9rem}td,th{border-bottom:1px solid #ddd;padding:.3rem .6rem;text-align:left;vertical-align:top}img.sheet{max-width:100%;border:1px solid #ddd}img.thumb{width:120px;height:120px;object-fit:cover}</style></head><body>',
    `<h1>Activity media review — ${selection}</h1><p>${usable.length} files. 시트의 라벨(M###)로 고르세요. 원본은 공개되지 않으며 파생본만 assets/local-review/ 에 생성됩니다.</p>`];
  sheets.forEach((sheet, i) => {
    html.push(`<h2>Sheet ${i + 1}</h2><img class="sheet" src="${sheet.file}" alt="sheet ${i + 1}">`);
    html.push('<table><tr><th></th><th>id</th><th>kind</th><th>taken</th><th>size</th><th>source</th></tr>');
    for (const item of sheet.items) html.push(`<tr><td><img class="thumb" src="thumbs/${item.id}.png" alt=""></td><td><strong>${item.id}</strong></td><td>${item.kind}</td><td>${item.takenAt || '?'}</td><td>${(item.size / 1024 / 1024).toFixed(1)} MB</td><td>${item.relPath}</td></tr>`);
    html.push('</table>');
  });
  html.push('</body></html>');
  const index = path.join(outDir, 'index.html');
  fs.writeFileSync(index, html.join('\n'));
  console.log(`${usable.length} thumbnails, ${sheets.length} sheet(s) → ${index}`);
}

function parseFlag(args, name, fallback = null) {
  const index = args.indexOf(name);
  return index !== -1 && args[index + 1] !== undefined ? args[index + 1] : fallback;
}

function commandDerive(args) {
  const selection = args.filter((a) => !a.startsWith('--') && !/^\d+(\.\d+)?$/.test(a) && !/^\d+:\d+:\d+:\d+$/.test(a)).join(',');
  if (!selection) throw new Error('derive needs at least one M-id');
  const start = Number(parseFlag(args, '--start', 0));
  const durationFlag = parseFlag(args, '--duration', null);
  const duration = durationFlag != null ? Number(durationFlag) : null;
  const crop = parseFlag(args, '--crop', null);
  const audio = args.includes('--audio');
  const force = args.includes('--force');
  const catalog = loadCatalog();
  const byId = new Map(catalog.items.map((item) => [item.id, item]));
  const data = readData();
  const ids = parseIdSelection(selection, catalog);
  const summary = [];
  for (const id of ids) {
    const item = byId.get(id);
    if (!item) throw new Error(`${id}: not in the catalog (run catalog first)`);
    if (item.kind === 'other') throw new Error(`${id}: unsupported file type ${item.relPath}`);
    if (item.livePhotoMotion) throw new Error(`${id}: ${item.relPath} is a Live Photo motion clip; derive its HEIC still instead`);
    const src = path.join(USERMEDIA_DIR, item.relPath);
    const sourceSha = item.sha256 || sha256File(src);
    const existing = data.media[id];
    if (existing && existing.sourceSha256 !== sourceSha) {
      throw new Error(`${id}: M-id drift — record sourceSha256 does not match ${item.relPath}; do not renumber, investigate usermedia changes`);
    }
    if (existing && !force && fs.existsSync(path.join(root, existing.path))) {
      const currentSha = sha256File(path.join(root, existing.path));
      if (currentSha === existing.derivativeSha256) { summary.push(`${id}: unchanged (use --force to rebuild)`); continue; }
    }
    const record = existing || {
      id, type: item.kind, path: `${PUBLIC_PREFIX}${id}.${item.kind === 'video' ? 'mp4' : 'webp'}`,
      sourceId: id, sourcePath: item.relPath, sourceSha256: sourceSha,
      takenAt: item.takenAt, takenAtSource: item.takenAtSource, eventIds: [], order: 1, approval: 'draft',
      translations: { ko: { caption: 'TODO: 캡션', alt: 'TODO: 대체 텍스트' }, en: { caption: 'TODO: caption', alt: 'TODO: alt text' } }
    };
    record.sourceSha256 = sourceSha;
    if (item.kind === 'image') {
      const result = convertImage({ src, out: path.join(root, record.path), crop });
      if (result.leaks.length) throw new Error(`${id}: metadata leak ${result.leaks.join(', ')}`);
      if (Math.max(result.width, result.height) < LIMITS.minDecodedEdge) throw new Error(`${id}: decoded image is only ${result.width}x${result.height}; check the HEIC grid/stream selection`);
      if (result.bytes > LIMITS.maxImageBytes) throw new Error(`${id}: ${result.bytes} bytes exceeds the ${LIMITS.maxImageBytes}-byte image cap`);
      Object.assign(record, { width: result.width, height: result.height, derivativeSha256: result.sha256 });
      if (crop) record.crop = crop; else delete record.crop;
      summary.push(`${id}: ${record.path} ${result.width}x${result.height} ${(result.bytes / 1024).toFixed(0)} KB`);
    } else {
      record.poster = `${PUBLIC_PREFIX}${id}-poster.jpg`;
      const result = convertVideo({ src, out: path.join(root, record.path), poster: path.join(root, record.poster), start, duration, audio });
      if (result.leaks.length) throw new Error(`${id}: metadata leak ${result.leaks.join(', ')}`);
      if (result.bytes > LIMITS.maxVideoBytes) throw new Error(`${id}: ${result.bytes} bytes exceeds the ${LIMITS.maxVideoBytes}-byte video cap; shorten --duration`);
      if (result.posterBytes > LIMITS.maxPosterBytes) throw new Error(`${id}: poster ${result.posterBytes} bytes exceeds the cap`);
      Object.assign(record, { width: result.width, height: result.height, derivativeSha256: result.sha256, clip: { start, duration: result.duration } });
      if (audio) record.audio = true; else delete record.audio;
      summary.push(`${id}: ${record.path} ${result.width}x${result.height} ${result.duration}s ${(result.bytes / 1024 / 1024).toFixed(2)} MB`);
    }
    data.media[id] = record;
  }
  writeData(data);
  summary.forEach((line) => console.log(line));
  console.log('\nRecords written. Fill captions/alt (ko/en), set eventIds/order, then approval:"approved-public" and run node scripts/public-cv-summary.cjs --write');
}

function checkRecords(data = readData(), { verifySources = false } = {}) {
  const errors = [];
  let total = 0;
  const referenced = new Set();
  for (const [id, record] of Object.entries(data.media)) {
    const label = `${id}`;
    const derived = path.join(root, record.path);
    if (!fs.existsSync(derived)) { errors.push(`${label}: missing ${record.path}`); continue; }
    const buf = fs.readFileSync(derived);
    total += buf.length;
    referenced.add(path.basename(record.path));
    if (sha256(buf) !== record.derivativeSha256) errors.push(`${label}: derivativeSha256 mismatch`);
    if (record.type === 'image') {
      const size = webpSize(buf);
      if (!size) errors.push(`${label}: not a readable WEBP`);
      else {
        if (size.width !== record.width || size.height !== record.height) errors.push(`${label}: recorded ${record.width}x${record.height}, file is ${size.width}x${size.height}`);
        if (Math.max(size.width, size.height) > 1600) errors.push(`${label}: long edge ${Math.max(size.width, size.height)} exceeds 1600`);
      }
      if (buf.length > LIMITS.maxImageBytes) errors.push(`${label}: ${buf.length} bytes exceeds the image cap`);
      const leaks = metadataLeaks(buf, 'webp');
      if (leaks.length) errors.push(`${label}: ${leaks.join(', ')}`);
    } else {
      if (buf.length > LIMITS.maxVideoBytes) errors.push(`${label}: ${buf.length} bytes exceeds the video cap`);
      const leaks = metadataLeaks(buf, 'mp4');
      if (leaks.length) errors.push(`${label}: ${leaks.join(', ')}`);
      if (!record.poster) errors.push(`${label}: video without poster`);
      else {
        const posterFile = path.join(root, record.poster);
        if (!fs.existsSync(posterFile)) errors.push(`${label}: missing poster ${record.poster}`);
        else {
          const poster = fs.readFileSync(posterFile);
          total += poster.length;
          referenced.add(path.basename(record.poster));
          if (poster.length > LIMITS.maxPosterBytes) errors.push(`${label}: poster ${poster.length} bytes exceeds the cap`);
          const posterLeaks = metadataLeaks(poster, 'jpeg');
          if (posterLeaks.length) errors.push(`${label}: poster ${posterLeaks.join(', ')}`);
        }
      }
    }
    if (verifySources) {
      const src = path.join(USERMEDIA_DIR, record.sourcePath);
      if (!fs.existsSync(src)) errors.push(`${label}: source ${record.sourcePath} not found`);
      else if (sha256File(src) !== record.sourceSha256) errors.push(`${label}: sourceSha256 mismatch for ${record.sourcePath}`);
    }
  }
  for (const name of fs.readdirSync(DERIVED_DIR)) if (!referenced.has(name)) errors.push(`orphan derivative ${name}`);
  if (total > LIMITS.maxTotalBytes) errors.push(`assets/local-review totals ${total} bytes, over the ${LIMITS.maxTotalBytes}-byte budget`);
  return { errors, totalBytes: total, count: Object.keys(data.media).length };
}

function commandCheck(args) {
  const result = checkRecords(readData(), { verifySources: args.includes('--sources') || fs.existsSync(USERMEDIA_DIR) });
  console.log(`${result.count} records, ${(result.totalBytes / 1024 / 1024).toFixed(2)} MiB in assets/local-review`);
  if (result.errors.length) { result.errors.forEach((e) => console.error(' - ' + e)); process.exitCode = 1; } else console.log('activity media check passed');
}

function main(argv) {
  const [command, ...args] = argv;
  if (command === 'catalog') return commandCatalog(args);
  if (command === 'sheet') return commandSheet(args);
  if (command === 'derive') return commandDerive(args);
  if (command === 'check') return commandCheck(args);
  console.error('usage: node scripts/activity-media.cjs <catalog|sheet|derive|check> [...]');
  process.exitCode = 2;
}

module.exports = {
  USERMEDIA_DIR, DERIVED_DIR, DATA_FILE, CATALOG_FILE, LIMITS,
  mediaId, kindOf, listSources, livePhotoPairs, jpegExifDate, dateFromName, webpSize, metadataLeaks, sha256, sha256File,
  assertWritable, setExtraOutputDir, ffmpegArgsForImage, ffmpegArgsForVideo, ffmpegArgsForPoster, convertImage, convertVideo,
  buildCatalog, loadCatalog, parseIdSelection, checkRecords, readData, writeData, main
};

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
