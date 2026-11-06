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
        const width = orientation === 'wide' ? 1000 : 600;
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
