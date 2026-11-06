// Stage 3: the first visual of every dense case page sits between the header and the summary grid.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const render = require('../js/portfolio-render.js');

const data = require('../js/portfolio-data.js');
const videoLead = ['surgical-navigation', 'digital-occlusion-workflow', 'life-careverse', 'rtms-navigation', 'unmanned-forklift'];
const sceneFirst = ['mandibular-fracture', 'respiratory-surface-guidance'];
const all = data.projects.map((p) => p.slug);

function afterHeader(html) {
  const end = html.indexOf('</header>') + '</header>'.length;
  return html.slice(end);
}
function labels(html) {
  return [...html.matchAll(/sc-figure__label">[^<]*?(\d+)\./g)].map((m) => Number(m[1]));
}

test('first figure follows the header and precedes the summary grid', () => {
  for (const locale of ['ko', 'en']) {
    for (const slug of all) {
      const html = render.caseStudyHtml(data, slug, '', true, locale);
      const rest = afterHeader(html);
      if (slug === 'skadi-tracking-software') {
        assert.match(html.match(/<figure\b[\s\S]*?<\/figure>/)[0], /data-scene3d/, `${slug}: console first figure is 3D`);
        continue;
      }
      assert.ok(rest.startsWith('<figure'), `${slug} ${locale}: figure directly after header`);
      const brief = rest.indexOf('sc-brief');
      assert.ok(brief > rest.indexOf('</figure>'), `${slug} ${locale}: figure before brief`);
      const first = rest.slice(0, rest.indexOf('</figure>'));
      if (videoLead.includes(slug)) assert.match(first, /<video/, `${slug}: video first`);
      if (sceneFirst.includes(slug)) {
        assert.match(first, /data-scene3d/, `${slug}: 3D first`);
        assert.doesNotMatch(first, /loading="lazy"/, `${slug}: figure 1 poster is eager`);
      }
      assert.deepEqual(labels(html), labels(html).map((_, i) => i + 1), `${slug} ${locale}: consecutive labels`);
      assert.match(first, /(그림|Figure) 1\./);
    }
  }
});

test('video lead cases keep the 3D figure as figure 2; image lead + 3D cases move the lead to the gallery', () => {
  for (const locale of ['ko', 'en']) {
    for (const slug of videoLead) {
      const html = render.caseStudyHtml(data, slug, '', true, locale);
      const scene = html.match(/<figure class="sc-figure sc-figure3d"[\s\S]*?<\/figure>/);
      if (scene) assert.match(scene[0], /(그림|Figure) 2\./, `${slug}: 3D is figure 2`);
    }
    for (const slug of sceneFirst) {
      const project = data.projects.find((p) => p.slug === slug);
      const html = render.caseStudyHtml(data, slug, '', true, locale);
      const gallery = html.slice(html.indexOf('class="sc-gallery"'));
      assert.ok(gallery.includes(project.media.lead.publicPath), `${slug}: lead image in gallery`);
      assert.match(gallery.match(/<figure[\s\S]*?<\/figure>/)[0], /(그림|Figure) 2\./, `${slug}: lead is figure 2`);
      assert.ok(html.split(project.media.lead.publicPath).length === 2, `${slug}: lead image appears once`);
    }
  }
  const ai = render.caseStudyHtml(data, 'ai-build-lab', '', true, 'ko');
  assert.match(afterHeader(ai), /^<figure[\s\S]*?<img/);
});

test('local-projects no longer relocates lead media or carries a placement table', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'local-projects.js'), 'utf8');
  for (const dead of ['leadTargets', 'const placement', 'const move', 'hololens-interface', 'integrated-workflow']) assert.ok(!src.includes(dead), dead);
  assert.ok(src.includes("sc-figure__label"), 'renumbering kept');
});
