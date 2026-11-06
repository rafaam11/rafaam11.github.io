'use strict';
// Derives the five 640x360 home pipeline-map thumbnails from approved project images.
// Run: node scripts/pipeline-thumbs.cjs   (deterministic; overwrites existing files)
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const thumbs = [
  { out: 'assets/pipeline/stage-1.webp', src: 'assets/projects/unmanned-forklift/unmanned-forklift-poster-01.png' },
  { out: 'assets/pipeline/stage-2.webp', src: 'assets/projects/digital-occlusion-workflow/digital-occlusion-workflow-landmark-01.png' },
  { out: 'assets/pipeline/stage-3.webp', src: 'assets/projects/surgical-navigation/surgical-navigation-smcnavi-ui-01.png' },
  { out: 'assets/pipeline/stage-4.webp', src: 'assets/projects/skadi-tracking-software/skadi-desktop-tracker-6dof-01.png' },
  { out: 'assets/pipeline/stage-5.webp', src: 'assets/projects/surgical-navigation/surgical-navigation-hololens-poster-01.png' }
];

function filter(entry) {
  return 'scale=640:360:force_original_aspect_ratio=increase,' + (entry.crop || 'crop=640:360');
}

function build() {
  for (const entry of thumbs) {
    const result = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(root, entry.src), '-vf', filter(entry),
      '-quality', '78', '-map_metadata', '-1', path.join(root, entry.out)], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(`${entry.out}: ffmpeg failed: ${result.stderr || result.error}`);
  }
}

if (require.main === module) { build(); process.stdout.write(`Wrote ${thumbs.length} pipeline thumbnails.\n`); }
module.exports = { thumbs, build };
