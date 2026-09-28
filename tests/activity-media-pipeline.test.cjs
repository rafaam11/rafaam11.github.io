// Contracts for scripts/activity-media.cjs: catalog numbering, metadata parsing, derivative hygiene.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const pipeline = require('../scripts/activity-media.cjs');

function hasFfmpeg() {
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch (error) { return false; }
}

function tempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('listSources numbers files by code-point order of their relative paths', () => {
  const dir = tempDir('am-sources-');
  for (const relative of ['b폴더/x.jpg', 'a 폴더/Y.PNG', 'a 폴더/z.png', 'Z/1.mp4', 'Z/2.HEIC']) {
    fs.mkdirSync(path.join(dir, path.dirname(relative)), { recursive: true });
    fs.writeFileSync(path.join(dir, relative), relative);
  }
  const list = pipeline.listSources(dir);
  assert.deepEqual(list.map((item) => item.relPath), ['Z/1.mp4', 'Z/2.HEIC', 'a 폴더/Y.PNG', 'a 폴더/z.png', 'b폴더/x.jpg']);
  assert.deepEqual(list.map((item) => item.id), ['M001', 'M002', 'M003', 'M004', 'M005']);
  assert.deepEqual(list.map((item) => item.kind), ['video', 'image', 'image', 'image', 'image']);
  assert.equal(list[0].size, Buffer.byteLength('Z/1.mp4'));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('listSources reproduces the frozen M-ids of the existing records', { skip: !fs.existsSync(path.join(root, 'assets', 'usermedia')) }, () => {
  const byId = Object.fromEntries(pipeline.listSources(pipeline.USERMEDIA_DIR).map((item) => [item.id, item.relPath]));
  const records = JSON.parse(fs.readFileSync(path.join(root, 'data/activity-media.json'), 'utf8')).media;
  for (const record of Object.values(records)) {
    assert.equal(byId[record.sourceId], record.sourcePath, `${record.id}: catalog path`);
  }
});

function tiffApp1(littleEndian, dateText, orientation) {
  const le = littleEndian;
  const u16 = (value) => { const b = Buffer.alloc(2); le ? b.writeUInt16LE(value) : b.writeUInt16BE(value); return b; };
  const u32 = (value) => { const b = Buffer.alloc(4); le ? b.writeUInt32LE(value) : b.writeUInt32BE(value); return b; };
  const header = Buffer.concat([Buffer.from(le ? 'II' : 'MM'), u16(42), u32(8)]);
  // IFD0 at 8: 2 entries (orientation, exif pointer) + next-IFD 0 = 2 + 24 + 4 = 30 bytes → Exif IFD at 38
  const exifIfdOffset = 8 + 2 + 12 * 2 + 4;
  const ifd0 = Buffer.concat([
    u16(2),
    u16(0x0112), u16(3), u32(1), Buffer.concat([u16(orientation), u16(0)]),
    u16(0x8769), u16(4), u32(1), u32(exifIfdOffset),
    u32(0)
  ]);
  // Exif IFD: 1 entry (DateTimeOriginal ASCII count 20 → offset) + next 0 = 2 + 12 + 4 = 18 → data at exifIfdOffset + 18
  const dateOffset = exifIfdOffset + 2 + 12 + 4;
  const exifIfd = Buffer.concat([u16(1), u16(0x9003), u16(2), u32(20), u32(dateOffset), u32(0)]);
  const dateBytes = Buffer.from(dateText + '\0', 'ascii');
  const tiff = Buffer.concat([header, ifd0, exifIfd, dateBytes]);
  const payload = Buffer.concat([Buffer.from('Exif\0\0', 'ascii'), tiff]);
  const length = Buffer.alloc(2); length.writeUInt16BE(payload.length + 2);
  return Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe1]), length, payload, Buffer.from([0xff, 0xd9])]);
}

test('jpegExifDate reads DateTimeOriginal and orientation in both byte orders', () => {
  assert.deepEqual(pipeline.jpegExifDate(tiffApp1(true, '2019:07:02 08:42:11', 6)), { date: '2019-07-02', orientation: 6 });
  assert.deepEqual(pipeline.jpegExifDate(tiffApp1(false, '2021:02:04 17:12:00', 1)), { date: '2021-02-04', orientation: 1 });
  assert.equal(pipeline.jpegExifDate(Buffer.from([0xff, 0xd8, 0xff, 0xd9])), null);
  assert.equal(pipeline.jpegExifDate(Buffer.from('not a jpeg')), null);
});

test('dateFromName recognises camera, epoch and screen-recording names', () => {
  assert.equal(pipeline.dateFromName('20191126_145010.mp4'), '2019-11-26');
  assert.equal(pipeline.dateFromName('1649774994953.png'), '2022-04-12');
  assert.equal(pipeline.dateFromName('1650026162719-0.png'), '2022-04-15');
  assert.equal(pipeline.dateFromName('Screen_Recording_20210513-103718_Measure_Dist_Ang.mp4'), '2021-05-13');
  assert.equal(pipeline.dateFromName('2020-10-23-13-03-13-363.jpg'), '2020-10-23');
  assert.equal(pipeline.dateFromName('IMG_5794.JPG'), null);
});

function webpHeader(chunk, payload) {
  const riffSize = Buffer.alloc(4); riffSize.writeUInt32LE(4 + 8 + payload.length);
  const chunkSize = Buffer.alloc(4); chunkSize.writeUInt32LE(payload.length);
  return Buffer.concat([Buffer.from('RIFF'), riffSize, Buffer.from('WEBP'), Buffer.from(chunk), chunkSize, payload]);
}

test('webpSize reads VP8X, VP8 and VP8L headers', () => {
  const real = fs.readFileSync(path.join(root, 'assets/local-review/M012.webp'));
  assert.deepEqual(pipeline.webpSize(real), { width: 1400, height: 1050 });
  const vp8x = Buffer.alloc(10); vp8x.writeUIntLE(1399, 4, 3); vp8x.writeUIntLE(1049, 7, 3);
  assert.deepEqual(pipeline.webpSize(webpHeader('VP8X', vp8x)), { width: 1400, height: 1050 });
  const vp8 = Buffer.concat([Buffer.from([0, 0, 0, 0x9d, 0x01, 0x2a]), Buffer.from([0x20, 0x03, 0x58, 0x02])]);
  assert.deepEqual(pipeline.webpSize(webpHeader('VP8 ', vp8)), { width: 800, height: 600 });
  const vp8l = Buffer.alloc(5); vp8l[0] = 0x2f; vp8l.writeUInt32LE((3 - 1) | ((2 - 1) << 14), 1);
  assert.deepEqual(pipeline.webpSize(webpHeader('VP8L', vp8l)), { width: 3, height: 2 });
  assert.equal(pipeline.webpSize(Buffer.from('RIFF....WEBPXXXX')), null);
});

test('metadataLeaks finds nothing in the shipped derivatives and flags synthetic leaks', () => {
  const dir = path.join(root, 'assets', 'local-review');
  for (const name of fs.readdirSync(dir)) {
    const type = name.endsWith('.webp') ? 'webp' : name.endsWith('.mp4') ? 'mp4' : name.endsWith('.jpg') ? 'jpeg' : null;
    if (!type) continue;
    assert.deepEqual(pipeline.metadataLeaks(fs.readFileSync(path.join(dir, name)), type), [], name);
  }
  assert.deepEqual(pipeline.metadataLeaks(webpHeader('EXIF', Buffer.from('MM\0*')), 'webp'), ['EXIF chunk']);
  assert.deepEqual(pipeline.metadataLeaks(tiffApp1(true, '2019:07:02 08:42:11', 1), 'jpeg'), ['APP1 Exif segment']);
  assert.deepEqual(pipeline.metadataLeaks(Buffer.concat([Buffer.from('....moov....'), Buffer.from([0xa9]), Buffer.from('xyz+37.5+127.0/')]), 'mp4'), ['©xyz location']);
});

test('livePhotoPairs marks the short mp4 that sits next to a same-named HEIC', () => {
  const list = [
    { relPath: 'a/IMG_1.HEIC', kind: 'image' },
    { relPath: 'a/IMG_1.MP4', kind: 'video' },
    { relPath: 'a/clip.mp4', kind: 'video' },
    { relPath: 'b/IMG_2.MP4', kind: 'video' }
  ];
  const durations = { 'a/IMG_1.MP4': 2.7, 'a/clip.mp4': 24, 'b/IMG_2.MP4': 3 };
  assert.deepEqual([...pipeline.livePhotoPairs(list, (item) => durations[item.relPath])], ['a/IMG_1.MP4']);
});

test('assertWritable refuses the originals folder and anything outside the allowed outputs', () => {
  assert.throws(() => pipeline.assertWritable(path.join(pipeline.USERMEDIA_DIR, 'x.webp')), /usermedia/);
  assert.throws(() => pipeline.assertWritable(path.join(root, 'index.html')), /not an allowed output/);
  assert.doesNotThrow(() => pipeline.assertWritable(path.join(pipeline.DERIVED_DIR, 'M999.webp')));
  assert.doesNotThrow(() => pipeline.assertWritable(pipeline.DATA_FILE));
  assert.doesNotThrow(() => pipeline.assertWritable(path.join(root, '.superpowers', 'thumbs', 'x.png')));
});

test('ffmpeg argument builders strip metadata, cap size and honour orientation', () => {
  const image = pipeline.ffmpegArgsForImage({ src: 'in.jpg', out: 'out.webp', orientation: 6, maxEdge: 1280 });
  assert.ok(image.includes('-map_metadata') && image[image.indexOf('-map_metadata') + 1] === '-1');
  assert.ok(image.includes('libwebp'));
  const filter = image[image.indexOf('-vf') + 1];
  assert.match(filter, /^transpose=1,scale=/);
  assert.match(filter, /1280/);
  const cropped = pipeline.ffmpegArgsForImage({ src: 'in.jpg', out: 'out.webp', crop: '10:20:300:200', maxEdge: 1280 });
  assert.match(cropped[cropped.indexOf('-vf') + 1], /^crop=300:200:10:20,scale=/);
  const video = pipeline.ffmpegArgsForVideo({ src: 'in.mp4', out: 'out.mp4', start: 4, duration: 12 });
  assert.ok(video.includes('-an'), 'audio dropped by default');
  assert.ok(video.includes('libx264') && video.includes('+faststart'));
  assert.equal(video[video.indexOf('-ss') + 1], '4');
  assert.equal(video[video.indexOf('-t') + 1], '12');
  const withAudio = pipeline.ffmpegArgsForVideo({ src: 'in.mp4', out: 'out.mp4', start: 0, duration: 10, audio: true });
  assert.ok(!withAudio.includes('-an'));
});

test('convertImage produces a clean WEBP no larger than the edge cap', { skip: !hasFfmpeg() }, () => {
  const dir = tempDir('am-convert-');
  const src = path.join(dir, 'test.jpg');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=size=1600x900:rate=1', '-frames:v', '1', src]);
  const out = path.join(dir, 'test.webp');
  const result = pipeline.convertImage({ src, out, maxEdge: 1280, allowOutside: true });
  assert.deepEqual({ width: result.width, height: result.height }, { width: 1280, height: 720 });
  const buf = fs.readFileSync(out);
  assert.deepEqual(pipeline.webpSize(buf), { width: 1280, height: 720 });
  assert.deepEqual(pipeline.metadataLeaks(buf, 'webp'), []);
  assert.equal(result.sha256, pipeline.sha256(buf));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('frozen ids keep existing files stable and give new files the next free id', () => {
  const list = [
    { relPath: '0새폴더/a.jpg', sha256: 'new-a' },
    { relPath: 'x/b.jpg', sha256: 'sha-b' },
    { relPath: 'y/c.jpg', sha256: 'sha-c' },
    { relPath: 'y/copy-of-c.jpg', sha256: 'sha-c' }
  ];
  const frozen = { 'sha-b': 'M001', 'sha-c': 'M002', 'sha-gone': 'M217' };
  const { items, ids } = pipeline.assignFrozenIds(list, frozen);
  assert.deepEqual(items.map((item) => [item.relPath, item.id]), [['0새폴더/a.jpg', 'M218'], ['x/b.jpg', 'M001'], ['y/c.jpg', 'M002'], ['y/copy-of-c.jpg', 'M219']]);
  assert.equal(ids['new-a'], 'M218');
  assert.equal(ids['sha-gone'], 'M217', 'ids of removed files are never reused');
});

test('the committed id map covers every published record', () => {
  const map = JSON.parse(fs.readFileSync(path.join(root, 'data/activity-media-ids.json'), 'utf8'));
  assert.equal(map.schema, 1);
  assert.ok(Object.keys(map.ids).length >= 217);
  const records = JSON.parse(fs.readFileSync(path.join(root, 'data/activity-media.json'), 'utf8')).media;
  for (const record of Object.values(records)) assert.equal(map.ids[record.sourceSha256], record.id, `${record.id} is frozen`);
  assert.equal(new Set(Object.values(map.ids)).size, Object.keys(map.ids).length, 'no id is assigned twice');
});

test('write guard ignores letter case on Windows and rejects traversal', { skip: process.platform !== 'win32' }, () => {
  assert.throws(() => pipeline.assertWritable(path.join(root, 'assets', 'UserMedia', 'x.png')), /usermedia/i);
  pipeline.setExtraOutputDir(path.join(root, 'assets'));
  try {
    assert.throws(() => pipeline.assertWritable(path.join(root, 'assets', 'USERMEDIA', 'review', 'x.png')), /usermedia/i);
  } finally {
    pipeline.setExtraOutputDir(null);
  }
  assert.throws(() => pipeline.assertWritable(path.join(pipeline.DERIVED_DIR, '..', 'usermedia', 'x.webp')), /usermedia/i);
});
