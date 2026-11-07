// Headless harness for the 3D figures: three.js r128, the engine and every scene file run inside a Node vm
// against a tiny fake DOM. No browser, no WebGL: scenes build their geometry and tick on plain numbers.
// Not a test file (tests/helpers is outside the node --test patterns).
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', '..');

// getContext() answers with a Proxy that accepts any property read or call
const stub = () => new Proxy(function () {}, {
  get: (_, key) => (key === Symbol.toPrimitive ? () => 0 : key === 'then' ? undefined : stub()),
  apply: () => stub()
});

function matches(el, sel) {
  return sel.split(',').some((part) => {
    part = part.trim();
    let m;
    if ((m = /^\.([\w-]+)$/.exec(part))) return el.classList.contains(m[1]);
    if ((m = /^\[([\w-]+)\]$/.exec(part))) return el.hasAttribute(m[1]);
    if ((m = /^([a-z0-9]+)$/i.exec(part))) return el.tagName === m[1].toLowerCase();
    if ((m = /^\.([\w-]+)\[([\w-]+)\]$/.exec(part))) return el.classList.contains(m[1]) && el.hasAttribute(m[2]);
    return false;
  });
}

function fakeDocument(lang = 'ko') {
  function element(tag) {
    const listeners = {};
    const classes = new Set();
    const el = {
      tagName: String(tag).toLowerCase(), children: [], parent: null, dataset: {}, style: {}, attrs: {},
      innerHTML: '', textContent: '', width: 0, height: 0, clientWidth: 880, clientHeight: 550, offsetWidth: 40, offsetHeight: 18,
      get className() { return [...classes].join(' '); },
      set className(value) { classes.clear(); String(value).split(/\s+/).filter(Boolean).forEach((c) => classes.add(c)); },
      classList: {
        add: (...c) => c.forEach((x) => classes.add(x)), remove: (...c) => c.forEach((x) => classes.delete(x)),
        contains: (c) => classes.has(c), toggle(c, force) { const on = force === undefined ? !classes.has(c) : !!force; if (on) classes.add(c); else classes.delete(c); return on; }
      },
      setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
      hasAttribute(k) { return k in this.attrs; }, removeAttribute(k) { delete this.attrs[k]; },
      appendChild(c) { c.parent = this; this.children.push(c); return c; },
      insertBefore(c, ref) { c.parent = this; const i = this.children.indexOf(ref); if (i < 0) this.children.push(c); else this.children.splice(i, 0, c); return c; },
      get firstChild() { return this.children[0] || null; },
      remove() { if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null; },
      querySelectorAll(sel) { const out = []; (function walk(n) { n.children.forEach((c) => { if (matches(c, sel)) out.push(c); walk(c); }); })(this); return out; },
      querySelector(sel) { return this.querySelectorAll(sel)[0] || null; },
      getContext: () => stub(),
      addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
      removeEventListener(type, fn) { listeners[type] = (listeners[type] || []).filter((f) => f !== fn); },
      dispatch(type, event) { (listeners[type] || []).slice().forEach((fn) => fn(Object.assign({ type, target: el }, event))); },
      click() { el.dispatch('click'); }
    };
    return el;
  }
  const document = {
    documentElement: { lang }, readyState: 'loading', currentScript: null, hidden: false,
    addEventListener() {}, querySelectorAll: () => [],
    createElement: element, createElementNS: (_, tag) => element(tag)
  };
  return document;
}

const GLOBALS = ['URL', 'Map', 'Set', 'Math', 'Object', 'Array', 'Number', 'String', 'console', 'Float32Array', 'Uint16Array',
  'Uint32Array', 'Int32Array', 'Uint8Array', 'Int8Array', 'Int16Array', 'Uint8ClampedArray', 'Float64Array', 'ArrayBuffer',
  'DataView', 'Symbol', 'Error', 'TypeError', 'RangeError', 'JSON', 'Date', 'Promise', 'WeakMap', 'WeakSet', 'Proxy', 'Reflect',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'setTimeout', 'clearTimeout'];

// -> { S, THREE, document }: the engine and all of js/scenes/*.js registered on one vm context
function loadScene3d(lang = 'ko') {
  const document = fakeDocument(lang);
  const ctx = { document, addEventListener() {} };
  GLOBALS.forEach((name) => { ctx[name] = global[name]; });
  ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  const run = (file) => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
  run('js/vendor/three-r128.min.js');
  run('js/scene3d.js');
  fs.readdirSync(path.join(root, 'js', 'scenes')).filter((f) => f.endsWith('.js')).sort().forEach((f) => run(`js/scenes/${f}`));
  return { S: ctx.Scene3D, THREE: ctx.THREE, document };
}

const plain = (html) => String(html).replace(/<small>[\s\S]*?<\/small>/g, '').replace(/<[^>]+>/g, '').trim();
const smallText = (html) => { const m = /<small>([\s\S]*?)<\/small>/.exec(String(html)); return m ? m[1].replace(/<[^>]+>/g, '').trim() : ''; };

// builds one registered scene on a fake figure box and exposes what it wrote
function buildScene(env, name) {
  const { S, THREE, document } = env;
  const opts = S.registry[name];
  if (!opts) throw new Error(`scene ${name} is not registered`);
  const box = document.createElement('div');
  box.className = 'view3d'; box.dataset.scene = name; box.ownerDocument = document;
  const readoutEl = document.createElement('div');
  readoutEl.className = 'readout'; box.appendChild(readoutEl);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(opts.fov || 35, 1.6, 1, 20000);
  const api = opts.build(scene, THREE, box, camera, { goTo() {} }) || {};
  const labels = () => box.children.filter((c) => c.dataset.gen).map((c) => ({
    text: plain(c.innerHTML), small: smallText(c.innerHTML), cls: c.className.replace(/\blb\b|\boff\b/g, '').trim(), ph: c.dataset.ph
  }));
  let lights = 0;
  scene.traverse((o) => { if (o.isLight) lights += 1; });
  return {
    opts, api, box, scene, lights,
    get labels() { return labels(); },
    tick(t) { if (api.tick) api.tick(t); },
    readout: () => readoutEl.textContent,
    ph: () => box.dataset.ph
  };
}

module.exports = { loadScene3d, buildScene, fakeDocument, root };
