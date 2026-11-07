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
      assert.match(gallery.match(/<figure[\s\S]*?<\/figure>/)[0], new RegExp('(그림|Figure) ' + (legacyKinds[slug] ? 3 : 2) + '\.'), `${slug}: lead follows the flow figure`);
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

// ---- Task 2: normalizeDiagram / diagramSvg ----
const legacyKinds = {
  'mandibular-fracture': { kind: 'optimization-loop', edges: 4, levels: [1, 1, 1, 1] },
  'life-careverse': { kind: 'sync-topology', edges: 3, levels: [1, 3] },
  'rtms-navigation': { kind: 'navigation-loop', edges: 4, levels: [1, 1, 1, 1] },
  'respiratory-surface-guidance': { kind: 'surface-gating-chain', edges: 4, levels: [1, 2, 1] },
  'unmanned-forklift': { kind: 'sensor-convergence', edges: 3, levels: [3, 1] },
  'ai-build-lab': { kind: 'product-loop', edges: 4, levels: [1, 1, 1, 1] }
};

function realDiagrams() {
  const out = [];
  for (const project of data.projects) {
    for (const section of project.storySections || []) {
      if (section.diagram && section.diagram.kind === 'system-flow') {
        out.push({ id: `${project.slug}:${section.diagram.translations.en.title}`, slug: project.slug, diagram: section.diagram, system: true });
      }
    }
    const legacy = project.pdfSequence && project.pdfSequence.diagram;
    if (legacy && legacyKinds[project.slug]) out.push({ id: `${project.slug}:${legacy.kind}`, slug: project.slug, diagram: legacy, system: false });
  }
  return out;
}
const svgTextOf = (svg) => [...svg.matchAll(/<tspan[^>]*>([^<]*)<\/tspan>/g)].map((m) => m[1]).join('');
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#039;/g, "'").replace(/&quot;/g, '"');
const squash = (s) => s.replace(/\s+/g, '');

test('normalizeDiagram covers 3 system-flow and 6 legacy diagrams, skadi is unsupported', () => {
  const diagrams = realDiagrams();
  assert.equal(diagrams.filter((d) => d.system).length, 3);
  assert.equal(diagrams.filter((d) => !d.system).length, 6);
  for (const locale of ['ko', 'en']) {
    for (const item of diagrams) {
      const model = render.normalizeDiagram(item.diagram, locale);
      assert.ok(model, item.id);
      assert.ok(model.title, `${item.id} title`);
      if (item.system) {
        assert.equal(model.nodes.length, item.diagram.nodes.length);
        assert.equal(model.edges.length, item.diagram.edges.length);
        assert.deepEqual(model.levels, render.systemFlowLevels(item.diagram).map((l) => l.map((n) => n.key)));
        assert.ok(model.boundary, `${item.id} boundary`);
      } else {
        const spec = legacyKinds[item.slug];
        assert.equal(model.nodes.length, 4);
        assert.equal(model.edges.length, spec.edges, item.id);
        assert.deepEqual(model.levels.map((l) => l.length), spec.levels, item.id);
        assert.deepEqual(model.nodes.map((n) => n.key), ['n0', 'n1', 'n2', 'n3']);
        assert.ok(model.edges.every((e) => e.label === ''));
        assert.equal(model.boundary, '');
      }
    }
  }
  const skadi = data.projects.find((p) => p.slug === 'skadi-tracking-software').pdfSequence.diagram;
  assert.equal(render.normalizeDiagram(skadi, 'en'), null);
  assert.equal(render.normalizeDiagram(null, 'en'), null);
});

test('legacy synthesis shapes: loop returns, bidirectional topology, planned detection', () => {
  const byKind = (kind) => realDiagrams().find((d) => !d.system && d.diagram.kind === kind).diagram;
  const loop = render.normalizeDiagram(byKind('optimization-loop'), 'en');
  assert.deepEqual(loop.edges.map((e) => e.from + '>' + e.to), ['n0>n1', 'n1>n2', 'n2>n3', 'n3>n0']);
  const sync = render.normalizeDiagram(byKind('sync-topology'), 'ko');
  assert.ok(sync.edges.every((e) => e.direction === 'bidirectional' && e.from === 'n0'));
  const sensor = render.normalizeDiagram(byKind('sensor-convergence'), 'en');
  assert.ok(sensor.edges.every((e) => e.to === 'n3' && e.direction === 'forward'));
  const sgrt = render.normalizeDiagram(byKind('surface-gating-chain'), 'ko');
  assert.deepEqual(sgrt.nodes.map((n) => n.planned), [false, false, false, true]);
  assert.equal(render.normalizeDiagram(byKind('surface-gating-chain'), 'en').nodes[3].planned, true);
  assert.ok(loop.nodes.every((n) => n.planned === false));
});

test('diagramSvg is deterministic, aria-hidden, and carries every label and edge', () => {
  for (const locale of ['ko', 'en']) {
    for (const item of realDiagrams()) {
      const model = render.normalizeDiagram(item.diagram, locale);
      for (const orientation of ['wide', 'tall']) {
        const svg = render.diagramSvg(model, { orientation, idPrefix: 'a' });
        assert.equal(svg, render.diagramSvg(model, { orientation, idPrefix: 'a' }), `${item.id} deterministic`);
        const width = orientation === 'wide' ? 1000 : 440;
        assert.match(svg, new RegExp(`^<svg class="sc-flow-svg sc-flow-svg--${orientation}" viewBox="0 0 ${width} [\\d.]+" role="presentation" aria-hidden="true" focusable="false">`), item.id);
        const text = squash(decode(svgTextOf(svg)));
        for (const node of model.nodes) {
          assert.ok(text.includes(squash(node.label)), `${item.id} ${locale} ${orientation}: label ${node.label}`);
        }
        assert.equal((svg.match(/<g class="sc-flow-svg__node/g) || []).length, model.nodes.length);
        assert.equal((svg.match(/<g class="sc-flow-svg__edge"/g) || []).length, model.edges.length);
        const planned = (svg.match(/sc-flow-svg__node is-planned/g) || []).length;
        assert.equal(planned, model.nodes.filter((n) => n.planned).length);
        assert.ok(!/…/.test(svg), `${item.id} ${locale} ${orientation}: real data must not be clipped`);
        assert.ok(!/ style=|font-size=|stroke="#|fill="#/.test(svg), 'no inline styling beyond geometry');
      }
    }
  }
});

test('diagramSvg marker ids follow the prefix and bidirectional edges mark both ends', () => {
  const model = render.normalizeDiagram(realDiagrams().find((d) => d.diagram.kind === 'sync-topology').diagram, 'en');
  const a = render.diagramSvg(model, { orientation: 'wide', idPrefix: 'one' });
  const b = render.diagramSvg(model, { orientation: 'wide', idPrefix: 'two' });
  assert.match(a, /id="one-wide-arrow"/);
  assert.match(b, /id="two-wide-arrow"/);
  const tall = render.diagramSvg(model, { orientation: 'tall', idPrefix: 'one' });
  assert.match(tall, /id="one-tall-arrow"/);
  assert.notEqual(a.match(/<marker id="([^"]+)"/)[1], tall.match(/<marker id="([^"]+)"/)[1]);
  assert.equal((a.match(/marker-start=/g) || []).length, 3);
  assert.equal((a.match(/marker-end=/g) || []).length, 3);
  assert.match(render.diagramSvg(model, { orientation: 'wide' }), /id="flow-wide-arrow"/);
});

function boxesOf(svg) {
  return [...svg.matchAll(/<rect class="sc-flow-svg__box" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)]
    .map((m) => ({ x: +m[1], y: +m[2], w: +m[3], h: +m[4] }));
}

test('all boxes of one diagram share the tallest height and never overlap or leave the viewBox', () => {
  for (const locale of ['ko', 'en']) {
    for (const item of realDiagrams()) {
      const model = render.normalizeDiagram(item.diagram, locale);
      for (const orientation of ['wide', 'tall']) {
        const svg = render.diagramSvg(model, { orientation });
        const boxes = boxesOf(svg);
        assert.equal(boxes.length, model.nodes.length);
        assert.equal(new Set(boxes.map((b) => b.h)).size, 1, `${item.id} heights`);
        const [, , vw, vh] = svg.match(/viewBox="([\d. ]+)"/)[1].split(' ').map(Number);
        for (const [i, a] of boxes.entries()) {
          assert.ok(a.x >= 0 && a.y >= 0 && a.x + a.w <= vw && a.y + a.h <= vh, `${item.id} inside viewBox`);
          for (const b of boxes.slice(i + 1)) {
            const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
            assert.ok(apart, `${item.id} ${locale} ${orientation}: boxes overlap`);
          }
        }
      }
    }
  }
});

test('real data: labels with a detail line wrap to at most two lines, others to three', () => {
  for (const locale of ['ko', 'en']) {
    for (const item of realDiagrams()) {
      const model = render.normalizeDiagram(item.diagram, locale);
      for (const orientation of ['wide', 'tall']) {
        const svg = render.diagramSvg(model, { orientation });
        for (const node of model.nodes) {
          const group = svg.split('<g class="sc-flow-svg__node').slice(1).find((part) => part.includes('data-node-key="' + node.key + '"')).split('</g>')[0];
          const labelText = group.match(/<text class="sc-flow-svg__label">([\s\S]*?)<\/text>/)[1];
          const lines = (labelText.match(/<tspan/g) || []).length;
          assert.ok(lines <= (node.detail ? 2 : 3), `${item.id} ${locale} ${orientation} ${node.key}: ${lines} label lines`);
          assert.ok(!group.includes('…'), `${item.id} ${locale} ${orientation} ${node.key}`);
        }
      }
    }
  }
});

test('long English labels wrap by word and overflow ends in an ellipsis', () => {
  const longest = realDiagrams().flatMap((d) => render.normalizeDiagram(d.diagram, 'en').nodes).sort((a, b) => b.label.length - a.label.length)[0];
  const model = {
    locale: 'en', title: 't', boundary: '',
    nodes: [
      { key: 'a', label: longest.label, detail: '', planned: false },
      { key: 'b', label: 'Short', detail: 'Detail text that stays short', planned: false }
    ],
    edges: [{ from: 'a', to: 'b', direction: 'forward', label: '' }],
    levels: [['a'], ['b']]
  };
  const nodeA = (svg) => svg.match(/<g class="sc-flow-svg__node"[^>]*data-node-key="a">[\s\S]*?<\/g>/)[0];
  for (const orientation of ['wide', 'tall']) {
    const node = nodeA(render.diagramSvg(model, { orientation }));
    assert.ok((node.match(/<tspan/g) || []).length <= 3, orientation);
    assert.ok(!node.includes('…'));
    assert.equal(squash(decode(svgTextOf(node))), squash(longest.label));
  }
  // synthetic overflow: detail-less labels get at most three lines, then an ellipsis
  const huge = { ...model, nodes: [{ key: 'a', label: 'word '.repeat(80).trim(), detail: '', planned: false }, model.nodes[1]] };
  const node = nodeA(render.diagramSvg(huge, { orientation: 'tall' }));
  assert.equal(node.match(/<tspan/g).length, 3);
  assert.ok(node.includes('…'));
});

test('loop-back edges route below the boxes (wide) and on a right rail (tall)', () => {
  const loops = realDiagrams().filter((d) => !d.system && /loop$/.test(d.diagram.kind));
  assert.equal(loops.length, 3);
  for (const item of loops) {
    const model = render.normalizeDiagram(item.diagram, 'en');
    const wide = render.diagramSvg(model, { orientation: 'wide' });
    const bottom = Math.max(...boxesOf(wide).map((b) => b.y + b.h));
    const edge = wide.match(/data-from="n3" data-to="n0"[\s\S]*?<path[^>]* d="([^"]+)"/)[1];
    const ys = [...edge.matchAll(/V ([\d.]+)/g)].map((m) => +m[1]);
    assert.ok(Math.max(...ys) > bottom, `${item.id}: loop-back below boxes`);
    const tall = render.diagramSvg(model, { orientation: 'tall' });
    const boxRight = Math.max(...boxesOf(tall).map((b) => b.x + b.w));
    const rail = tall.match(/data-from="n3" data-to="n0"[\s\S]*?<path[^>]* d="([^"]+)"/)[1];
    assert.ok(Math.max(...[...rail.matchAll(/H ([\d.]+)/g)].map((m) => +m[1])) > boxRight, `${item.id}: tall rail right of boxes`);
  }
});

test('edge paths are orthogonal and labelled edges get a white backing rect', () => {
  for (const item of realDiagrams()) {
    const model = render.normalizeDiagram(item.diagram, 'en');
    for (const orientation of ['wide', 'tall']) {
      const svg = render.diagramSvg(model, { orientation });
      for (const m of svg.matchAll(/class="sc-flow-svg__edge-line" d="([^"]+)"/g)) assert.match(m[1], /^M [\d.]+ [\d.]+( [HV] [\d.]+)+$/);
      const labelled = model.edges.filter((e) => e.label).length;
      assert.equal((svg.match(/sc-flow-svg__edge-label-bg/g) || []).length, labelled + (model.boundary ? 1 : 0), `${item.id} ${orientation}`);
      assert.equal((svg.match(/<text class="sc-flow-svg__edge-label"/g) || []).length, labelled);
      assert.equal(/sc-flow-svg__boundary-box/.test(svg), Boolean(model.boundary));
    }
  }
});

test('case pages carry wide and tall flow SVGs with a hidden sentence and unique marker ids', () => {
  const withFlow = all.filter((slug) => slug !== 'skadi-tracking-software');
  let pagesWithDiagram = 0;
  for (const locale of ['ko', 'en']) {
    for (const slug of withFlow) {
      const project = data.projects.find((p) => p.slug === slug);
      const html = render.caseStudyHtml(data, slug, '', true, locale);
      const figures = [...html.matchAll(/<figure class="sc-figure sc-flow sc-flow-figure">[\s\S]*?<\/figure>/g)].map((m) => m[0]);
      const expected = (project.storySections || []).filter((s) => s.diagram && s.diagram.kind === 'system-flow').length +
        (legacyKinds[slug] ? 1 : 0);
      assert.equal(figures.length, expected, `${slug} ${locale}: flow figure count`);
      if (!expected) continue;
      pagesWithDiagram += 1;
      for (const figure of figures) {
        assert.equal((figure.match(/sc-flow-svg--wide"/g) || []).length, 1);
        assert.equal((figure.match(/sc-flow-svg--tall"/g) || []).length, 1);
        assert.equal((figure.match(/aria-hidden="true"/g) || []).length, 2);
        const hidden = figure.match(/<p class="sc-visually-hidden">([^<]*)<\/p>/)[1];
        for (const m of figure.matchAll(/<g class="sc-flow-svg__node[^"]*" data-node-key="[^"]+">[\s\S]*?<\/g>/g)) {
          const label = decode(m[0].match(/<text class="sc-flow-svg__label">([\s\S]*?)<\/text>/)[1].replace(/<[^>]+>/g, ' '));
          assert.ok(squash(decode(hidden)).includes(squash(label)), `${slug} ${locale}: hidden sentence has ${label}`);
        }
        const spoken = squash(decode(hidden));
        for (const m of figure.matchAll(/<text class="sc-flow-svg__detail">([\s\S]*?)<\/text>/g)) {
          const detail = squash(decode(m[1].replace(/<[^>]+>/g, ' ')));
          assert.ok(spoken.includes(detail), `${slug} ${locale}: hidden sentence has node detail "${detail}"`);
        }
        // Edges are spoken in words: the only arrow glyphs left are the ones inside node text itself (counted once, from the wide SVG).
        const glyphs = (text) => (text.match(/[→⇄]/g) || []).length;
        const wide = figure.slice(0, figure.indexOf('sc-flow-svg--tall'));
        const nodeTexts = [...wide.matchAll(/<text class="sc-flow-svg__(?:label|detail)">([\s\S]*?)<\/text>/g)].map((m) => decode(m[1].replace(/<[^>]+>/g, ' '))).join(' ');
        assert.equal(glyphs(decode(hidden)), glyphs(nodeTexts), `${slug} ${locale}: no edge arrow glyphs in the hidden sentence`);
      }
      if (legacyKinds[slug]) {
        const title = project.pdfSequence.diagram.translations[locale].title;
        assert.ok(figures.some((f) => f.includes('<strong>' + title + '</strong>')), `${slug} ${locale}: legacy title`);
      }
      const ids = [...html.matchAll(/<marker id="([^"]+)"/g)].map((m) => m[1]);
      assert.equal(new Set(ids).size, ids.length, `${slug} ${locale}: marker ids unique`);
      assert.deepEqual(labels(html), labels(html).map((_, i) => i + 1), `${slug} ${locale}: consecutive labels`);
    }
  }
  assert.equal(pagesWithDiagram, 16, '8 cases x 2 locales');
  const skadi = render.caseStudyHtml(data, 'skadi-tracking-software', '', true, 'en');
  assert.doesNotMatch(skadi, /sc-flow-svg/);
});

test('flow CSS swaps wide for tall at 760px and avoids forbidden properties', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'scholar.css'), 'utf8');
  const media = css.slice(css.indexOf('@media (max-width: 760px)'));
  assert.match(media, /\.sc-flow-svg--wide \{ display: none/);
  assert.match(media, /\.sc-flow-svg--tall \{ display: block/);
  const flowRules = css.split('\n').filter((line) => line.includes('sc-flow')).join('\n');
  assert.doesNotMatch(flowRules, /box-shadow|gradient|uppercase|monospace/i);
  assert.ok(css.split(/\r?\n/).length <= 420);
});

test('product-console 3D poster is lazy because it sits below the fold', () => {
  for (const locale of ['ko', 'en']) {
    const html = render.caseStudyHtml(data, 'skadi-tracking-software', '', true, locale);
    const scene = html.match(/<figure class="sc-figure sc-figure3d"[\s\S]*?<\/figure>/)[0];
    assert.match(scene, /loading="lazy"/);
  }
});

test('tall flow viewBox width keeps the computed 390px text size of detail and edge text at 9px or more', () => {
  // Rendered px = user-unit size x (350px content width / viewBox width); 9px floor at a 390px viewport.
  for (const locale of ['ko', 'en']) {
    for (const item of realDiagrams()) {
      const svg = render.diagramSvg(render.normalizeDiagram(item.diagram, locale), { orientation: 'tall' });
      const width = Number(svg.match(/viewBox="0 0 ([\d.]+) /)[1]);
      assert.ok(width <= 440, `${item.id} ${locale}: tall viewBox width ${width} <= 440`);
      assert.ok(11.5 * 350 / width >= 9, `${item.id}: edge text >= 9px`);
      assert.ok(12.5 * 350 / width >= 9, `${item.id}: detail text >= 9px`);
    }
  }
});

test('tall rail edges each get their own lane with at least 10 units between vertical segments', () => {
  const sgrt = realDiagrams().find((d) => !d.system && d.diagram.kind === 'surface-gating-chain').diagram;
  for (const locale of ['ko', 'en']) {
    const svg = render.diagramSvg(render.normalizeDiagram(sgrt, locale), { orientation: 'tall' });
    const paths = [...svg.matchAll(/class="sc-flow-svg__edge-line" d="([^"]+)"/g)].map((m) => m[1]);
    const rails = paths.filter((d) => / H [\d.]+ V [\d.]+ H /.test(d)).map((d) => Number(d.match(/ H ([\d.]+) V /)[1]));
    assert.equal(rails.length, 2, `${locale}: two rail edges`);
    assert.ok(Math.abs(rails[0] - rails[1]) >= 10, `${locale}: rail x ${rails.join(' vs ')}`);
  }
});

// ---- Screenshot callouts ----
const { canonicalPdfSource, pdfSourceDigest } = require('../scripts/portfolio-pdf-source.cjs');
const clone = (value) => JSON.parse(JSON.stringify(value));
const callout = (n, x, y, ko, en) => ({ n, x, y, translations: { ko: { label: ko }, en: { label: en } } });
const threeCallouts = () => [
  callout(1, 0.42, 0.31, '추적 상태 패널', 'Tracking status panel'),
  callout(2, 0.1, 0.8, '장면 보기', 'Scene view'),
  callout(3, 0.925, 0.05, '워크플로 목록', 'Workflow list')
];
function findItem(root, id) {
  if (Array.isArray(root)) { for (const entry of root) { const hit = findItem(entry, id); if (hit) return hit; } return null; }
  if (!root || typeof root !== 'object') return null;
  if (root.id === id && root.type) return root;
  for (const key of Object.keys(root)) { const hit = findItem(root[key], id); if (hit) return hit; }
  return null;
}
function withCallouts(id, list) {
  const copy = clone(data);
  findItem(copy.projects, id).callouts = list || threeCallouts();
  return copy;
}
function figureOf(html, id) {
  const at = html.indexOf(findItem(data.projects, id).publicPath);
  assert.ok(at > 0, `${id} rendered`);
  return html.slice(html.lastIndexOf('<figure', at), html.indexOf('</figure>', at) + 9);
}
const errorsOf = (copy) => render.validatePortfolioData(copy);

test('callouts render pins at percentage positions and a list before the caption on all four image paths', () => {
  const cases = [
    ['surgical-navigation', 'surgical-navigation-smcnavi-ui-01'], // story media
    ['mandibular-fracture', 'mandibular-fracture-lead-01'], // lead moved into the gallery
    ['ai-build-lab', 'ai-build-lab-lead-01'], // image lead
    ['life-careverse', 'life-careverse-gallery-01'], // gallery
    ['skadi-tracking-software', 'skadi-desktop-tracker-6dof-01'] // product console
  ];
  for (const locale of ['ko', 'en']) {
    for (const [slug, id] of cases) {
      const html = render.caseStudyHtml(withCallouts(id), slug, '', true, locale);
      const figure = figureOf(html, id);
      assert.equal((figure.match(/<span class="sc-callout-pin"/g) || []).length, 3, `${id} ${locale}: pins`);
      assert.match(figure, /<span class="sc-callout-pin" style="left:42%;top:31%" aria-hidden="true">1<\/span>/);
      assert.match(figure, /style="left:10%;top:80%"/);
      assert.match(figure, /style="left:92\.5%;top:5%"/);
      assert.equal((figure.match(/<li>/g) || []).length, 3, `${id}: list items`);
      assert.ok(figure.includes(locale === 'ko' ? '<li>추적 상태 패널</li>' : '<li>Tracking status panel</li>'));
      assert.ok(figure.indexOf('sc-callout-list') < figure.indexOf('<figcaption>'), `${id}: list before caption`);
      assert.ok(figure.indexOf('<img') > figure.indexOf('sc-callout-frame'), `${id}: img inside frame`);
      assert.equal((figure.match(/<ol class="sc-callout-list">/g) || []).length, 1);
      assert.deepEqual(labels(html), labels(html).map((_, i) => i + 1), `${id} ${locale}: consecutive labels`);
    }
  }
});

test('items without callouts render exactly as before', () => {
  assert.equal(render.calloutFigureHtml('<img src="a">', {}, 'ko'), '<img src="a">');
  assert.equal(render.calloutFigureHtml('<img src="a">', { callouts: [] }, 'en'), '<img src="a">');
  assert.doesNotMatch(render.caseStudyHtml(data, 'ai-build-lab', '', true, 'ko'), /sc-callout/, 'ai-build-lab has no callouts');
  // adding callouts changes only the wrapped figure: removing the frame, pins and list gives back the plain page
  const bare = clone(data);
  delete findItem(bare.projects, 'life-careverse-gallery-01').callouts;
  const plain = render.caseStudyHtml(bare, 'life-careverse', '', true, 'ko');
  const pinned = render.caseStudyHtml(withCallouts('life-careverse-gallery-01'), 'life-careverse', '', true, 'ko');
  assert.notEqual(pinned, plain);
  const restored = pinned
    .replace('<div class="sc-callout-frame">', '')
    .replace(/<span class="sc-callout-pin"[^>]*>\d<\/span>/g, '')
    .replace(/<\/div><ol class="sc-callout-list">.*?<\/ol>/, '');
  assert.equal(restored, plain);
});

test('validation accepts the fixture and rejects each broken callout rule', () => {
  const id = 'life-careverse-gallery-01';
  assert.deepEqual(errorsOf(clone(data)), []);
  assert.deepEqual(errorsOf(withCallouts(id)), []);
  const bad = (mutate, pattern, message) => {
    const list = threeCallouts();
    mutate(list);
    const errors = errorsOf(withCallouts(id, list));
    assert.ok(errors.some((error) => pattern.test(error)), `${message}: ${errors.join(' | ')}`);
  };
  bad((l) => { l[2].n = 4; }, /n must run 1\.\.3/, 'n gap');
  bad((l) => { l[0].x = 1.2; }, /x must be a number from 0 through 1/, 'x > 1');
  bad((l) => { l[1].y = -0.1; }, /y must be a number from 0 through 1/, 'y < 0');
  bad((l) => { l[0].translations.ko.label = '가'.repeat(25); }, /exceeds 24 characters/, 'ko 25 chars');
  bad((l) => { l[0].translations.en.label = 'a'.repeat(49); }, /exceeds 48 characters/, 'en 49 chars');
  bad((l) => { l[0].translations.ko.label = '상태를 확인합니다'; }, /noun phrase/, 'ko sentence');
  bad((l) => { l[0].translations.ko.label = '상태 패널.'; }, /noun phrase/, 'ko period');
  bad((l) => { l[0].translations.en.label = 'Shows the status.'; }, /noun phrase/, 'en period');
  bad((l) => { delete l[1].translations.en; }, /missing en label/, 'missing en');
  bad((l) => { l[0].extra = 1; }, /only n, x, y and translations/, 'unknown key');
  bad((l) => { l.pop(); }, /needs 3-5 entries/, 'too few');
  bad((l) => { l.push(callout(4, 0.5, 0.5, '넷', 'Four'), callout(5, 0.5, 0.5, '다섯', 'Five'), callout(6, 0.5, 0.5, '여섯', 'Six')); }, /needs 3-5 entries/, 'too many');
  // callouts are image-only: a video item rejects them
  const video = clone(data);
  const lead = video.projects.find((p) => p.slug === 'surgical-navigation').media.lead;
  assert.equal(lead.type, 'video');
  lead.callouts = threeCallouts();
  assert.ok(errorsOf(video).some((error) => /allowed only on image media/.test(error)));
  // a video item inside story media or a gallery rejects them too, and posters never take callouts
  const story = clone(data);
  const storyVideo = story.projects.find((p) => p.slug === 'surgical-navigation').storySections.flatMap((section) => section.media || []).find((item) => item.type === 'video');
  assert.ok(storyVideo, 'story video exists');
  storyVideo.callouts = threeCallouts();
  assert.ok(errorsOf(story).some((error) => /allowed only on image media/.test(error)), 'story video');
  const posterCopy = clone(data);
  posterCopy.projects.find((p) => p.slug === 'surgical-navigation').media.poster.callouts = threeCallouts();
  assert.ok(errorsOf(posterCopy).some((error) => /not allowed on a poster/.test(error)), 'poster');
});

test('callouts are accepted on lead, gallery, story media and console slots', () => {
  for (const id of ['mandibular-fracture-lead-01', 'life-careverse-gallery-01', 'surgical-navigation-smcnavi-ui-01', 'skadi-desktop-tracker-6dof-01']) {
    assert.deepEqual(errorsOf(withCallouts(id)), [], id);
  }
});

test('PDF source digest ignores callouts at every depth', () => {
  const evidence = { items: [] };
  const cv = { identity: {} };
  const before = pdfSourceDigest(canonicalPdfSource(data, evidence, cv));
  const copy = clone(data);
  for (const id of ['mandibular-fracture-lead-01', 'life-careverse-gallery-01', 'surgical-navigation-smcnavi-ui-01', 'skadi-desktop-tracker-6dof-01']) findItem(copy.projects, id).callouts = threeCallouts();
  const source = canonicalPdfSource(copy, evidence, cv);
  assert.equal(pdfSourceDigest(source), before);
  assert.doesNotMatch(JSON.stringify(source), /callouts/);
  assert.notEqual(JSON.stringify(copy), JSON.stringify(data), 'fixture really has callouts');
});

test('callout CSS pins by percentage, ignores the pointer and avoids forbidden properties', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'scholar.css'), 'utf8');
  assert.match(css, /\.sc-callout-frame \{ position: relative;/);
  assert.match(css, /\.sc-product-figure \.sc-callout-frame img \{ height: auto; max-height: none; padding: 0; border: 0; \}/);
  assert.match(css, /\.sc-product-figure \.sc-callout-frame \{ align-self: start;/);
  const pin = css.split(/\r?\n/).find((line) => line.startsWith('.sc-callout-pin '));
  assert.match(pin, /position: absolute/);
  assert.match(pin, /pointer-events: none/);
  assert.match(pin, /translate\(-50%, -50%\)/);
  assert.match(pin, /border: 1px solid/);
  assert.match(pin, /background: var\(--sc-link\)/);
  assert.doesNotMatch(css.split(/\r?\n/).filter((line) => line.includes('sc-callout')).join('\n'), /box-shadow|gradient|uppercase|monospace/i);
  assert.ok(css.split(/\r?\n/).length <= 420);
});

// ---- Published callouts: one screenshot per case ----
const calloutTargets = {
  'surgical-navigation': 'surgical-navigation-smcnavi-ui-01',
  'mandibular-fracture': 'mandibular-fracture-lead-01',
  'digital-occlusion-workflow': 'digital-occlusion-workflow-landmark-01',
  'life-careverse': 'life-careverse-gallery-01',
  'rtms-navigation': 'rtms-navigation-lead-01',
  'respiratory-surface-guidance': 'respiratory-surface-guidance-lead-01',
  'skadi-tracking-software': 'skadi-desktop-tracker-6dof-01',
  'unmanned-forklift': 'unmanned-forklift-gallery-01'
};
function collectCallouts(root, found = []) {
  if (Array.isArray(root)) root.forEach((entry) => collectCallouts(entry, found));
  else if (root && typeof root === 'object') {
    if (root.callouts) found.push(root);
    Object.keys(root).forEach((key) => collectCallouts(root[key], found));
  }
  return found;
}

test('each case but ai-build-lab carries callouts on exactly one pinned image', () => {
  for (const project of data.projects) {
    const carriers = collectCallouts(project);
    if (!calloutTargets[project.slug]) { assert.equal(carriers.length, 0, `${project.slug}: no callouts`); continue; }
    assert.equal(carriers.length, 1, `${project.slug}: one image`);
    assert.equal(carriers[0].id, calloutTargets[project.slug], `${project.slug}: target id`);
    assert.equal(carriers[0].type, 'image');
    assert.ok(carriers[0].callouts.length >= 3 && carriers[0].callouts.length <= 5, `${project.slug}: 3-5 pins`);
  }
  assert.equal(Object.keys(calloutTargets).length, 8);
});

// Screens only the callout labels for the word "고객사" and digit-percent patterns; partner-name screening is the --private validator.
test('callout labels contain no "고객사" and no digit-percent pattern', () => {
  const banned = /고객사|\d\s*%/;
  for (const project of data.projects) {
    for (const item of collectCallouts(project)) {
      for (const pin of item.callouts) {
        for (const locale of ['ko', 'en']) assert.doesNotMatch(pin.translations[locale].label, banned, `${item.id} ${locale} ${pin.n}`);
      }
    }
  }
});

test('published callouts render as pins and a label list on every case page', () => {
  const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  for (const [slug, id] of Object.entries(calloutTargets)) {
    const item = findItem(data.projects, id);
    for (const locale of ['ko', 'en']) {
      const html = render.caseStudyHtml(data, slug, '', true, locale);
      const figure = figureOf(html, id);
      assert.equal((figure.match(/<span class="sc-callout-pin"/g) || []).length, item.callouts.length, `${id} ${locale}: pins`);
      const items = [...figure.matchAll(/<li>(.*?)<\/li>/g)].map((m) => m[1]);
      assert.deepEqual(items, item.callouts.map((c) => esc(c.translations[locale].label)), `${id} ${locale}: list`);
    }
  }
});

// ---- Final review fixes ----
test('flowReadableText speaks unlabelled edges in words, never as arrow glyphs', () => {
  const names = ['A', 'B', 'C', 'D'];
  const diagram = (kind) => ({ kind, nodes: names, translations: { ko: { title: 't', nodes: names }, en: { title: 't', nodes: names } } });
  const sync = (locale) => render.flowReadableText(render.normalizeDiagram(diagram('sync-topology'), locale));
  assert.match(sync('ko'), /A와 B 양방향/);
  assert.match(sync('en'), /A and B, both ways/);
  const loop = render.flowReadableText(render.normalizeDiagram(diagram('optimization-loop'), 'en'));
  assert.match(loop, /A to B/);
  assert.match(render.flowReadableText(render.normalizeDiagram(diagram('optimization-loop'), 'ko')), /A에서 B로/);
  assert.doesNotMatch(sync('ko') + sync('en') + loop, /[→⇄]/);
});

test('system-flow node details are spoken as "label (detail)"', () => {
  const item = realDiagrams().find((d) => d.system);
  for (const locale of ['ko', 'en']) {
    const model = render.normalizeDiagram(item.diagram, locale);
    const text = render.flowReadableText(model);
    const withDetail = model.nodes.filter((n) => n.detail);
    assert.ok(withDetail.length, 'fixture has node details');
    for (const n of withDetail) assert.ok(text.includes(n.label + ' (' + n.detail + ')'), `${locale}: ${n.label}`);
  }
});

test('surgical-navigation lead caption keeps the 2024-2025 context; other cases use mediaCaption', () => {
  const capOf = (html) => html.match(/<figcaption><span class="sc-figure__label">[^<]*<\/span> ([^<]*)<\/figcaption>/)[1];
  for (const locale of ['ko', 'en']) {
    const html = render.caseStudyHtml(data, 'surgical-navigation', '', true, locale);
    assert.match(capOf(html), /2024–2025/, locale);
    assert.ok(capOf(html).includes(locale === 'ko' ? 'HoloLens 확장(2024–2025, 종료)' : 'HoloLens extension (2024–2025, ended)'));
    // the 3D scene shows only the transform chain, so its short web caption names no HoloLens date
  }
  // without leadCaption the long mediaCaption is used, and nothing else changes
  const copy = clone(data);
  const nav = copy.projects.find((p) => p.slug === 'surgical-navigation');
  delete nav.web.ko.leadCaption; delete nav.web.en.leadCaption;
  const html = render.caseStudyHtml(copy, 'surgical-navigation', '', true, 'ko');
  assert.ok(capOf(html).includes(nav.translations.ko.mediaCaption));
  for (const slug of all.filter((s) => s !== 'surgical-navigation')) {
    assert.equal(render.caseStudyHtml(copy, slug, '', true, 'en'), render.caseStudyHtml(data, slug, '', true, 'en'), slug);
  }
});

test('leadCaption is web-only, budgeted and stripped from the PDF digest', () => {
  const copy = clone(data);
  const web = copy.projects.find((p) => p.slug === 'surgical-navigation').web;
  assert.deepEqual(errorsOf(copy), []);
  web.ko.leadCaption = 'x'.repeat(61);
  assert.ok(errorsOf(copy).some((e) => /leadCaption/.test(e) && /exceeds/.test(e)));
  web.ko.leadCaption = '짧은 캡션입니다.';
  assert.ok(errorsOf(copy).some((e) => /leadCaption/.test(e) && /noun phrase/.test(e)));
  const evidence = { items: [] }; const cv = { identity: {} };
  const source = canonicalPdfSource(data, evidence, cv);
  assert.doesNotMatch(JSON.stringify(source), /leadCaption/);
  const other = clone(data);
  other.projects.find((p) => p.slug === 'surgical-navigation').web.ko.leadCaption = '다른 캡션';
  assert.equal(pdfSourceDigest(canonicalPdfSource(other, evidence, cv)), pdfSourceDigest(source));
});

test('rtms-navigation bullseye callout label does not clash with the gallery caption', () => {
  const item = findItem(data.projects, 'rtms-navigation-lead-01');
  assert.equal(item.callouts[2].translations.en.label, 'Bullseye view');
});

test('callout images carry intrinsic width and height; the numbers are web-only and validated', () => {
  for (const [slug, id] of Object.entries(calloutTargets)) {
    const item = findItem(data.projects, id);
    assert.ok(Number.isInteger(item.width) && item.width > 0 && Number.isInteger(item.height) && item.height > 0, `${id}: stored size`);
    for (const locale of ['ko', 'en']) {
      const figure = figureOf(render.caseStudyHtml(data, slug, '', true, locale), id);
      assert.match(figure, new RegExp('<img [^>]*width="' + item.width + '" height="' + item.height + '"'), `${id} ${locale}`);
    }
  }
  const copy = clone(data);
  findItem(copy.projects, 'mandibular-fracture-lead-01').width = 0;
  assert.ok(errorsOf(copy).some((e) => /width/.test(e)));
  const half = clone(data);
  delete findItem(half.projects, 'mandibular-fracture-lead-01').height;
  assert.ok(errorsOf(half).some((e) => /width and height/.test(e)));
  const evidence = { items: [] }; const cv = { identity: {} };
  const bare = clone(data);
  collectCallouts(bare.projects).forEach((i) => { delete i.width; delete i.height; });
  assert.equal(pdfSourceDigest(canonicalPdfSource(data, evidence, cv)), pdfSourceDigest(canonicalPdfSource(bare, evidence, cv)));
  assert.doesNotMatch(JSON.stringify(canonicalPdfSource(data, evidence, cv).projects.find((p) => p.slug === 'rtms-navigation')), /"width":1471/);
});

test('console callout numerals use the accent token and pins survive printing', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'scholar.css'), 'utf8');
  assert.match(css, /\.sc-product-console \.sc-callout-list li::marker \{ color: var\(--pc-signal\);/);
  assert.match(css, /@media print \{[^}]*\.sc-callout-pin \{[^}]*print-color-adjust: exact;[^}]*-webkit-print-color-adjust: exact;/);
  assert.ok(css.split(/\r?\n/).length <= 420);
});
