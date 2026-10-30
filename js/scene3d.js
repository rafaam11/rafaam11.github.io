/* Scene3D: shared three.js r128 engine for the numbered 3D figures.
 * Spec: docs/superpowers/specs/2026-10-30-3d-figures-design.md
 *
 * - A figure is <div class="view3d" data-scene="name"><img poster></div>. The poster stays visible until
 *   WebGL mounts (class "live"); without JavaScript, three.js or WebGL, or when a scene throws, it simply stays.
 * - three.js is not a static script: it is injected from js/vendor/ the first time a figure nears the viewport.
 * - At most two WebGL contexts live at once; a figure that leaves the viewport is released (context returned).
 * - Mouse drag orbits; one-finger touch scrolls the page, two fingers orbit. No wheel zoom.
 * - prefers-reduced-motion: no auto sway, scene time frozen at opts.stillTime (default 2.5 s).
 * - window.DECK3D_CLOCK (seconds) freezes scene time for deterministic captures.
 * - Scenes register by name: register(name, { fit, target, dist, yaw, pitch, fov, autoYaw, stillTime,
 *   build(scene, THREE, box, camera, ctl) -> { tick(s), anchors, dispose } }). Units: cm, y up.
 * Procedural geometry only: no model files, image textures or network loads.
 */
(function (root) {
  'use strict';
  var doc = root.document || null;
  var selfSrc = doc && doc.currentScript && doc.currentScript.src ? doc.currentScript.src : '';
  var MAX_LIVE = 2;
  var RELEASE_DELAY = 1500;
  var DWELL = 250;               // a figure must stay near the viewport this long (ms) before three.js is fetched

  // ---- language -------------------------------------------------------------------------------
  function lang() {
    var value = doc && doc.documentElement ? String(doc.documentElement.lang || '') : '';
    return /^en\b/i.test(value) ? 'en' : 'ko';
  }
  // t({ko, en}) picks the page language; plain strings pass through.
  function t(pair) {
    if (pair === null || pair === undefined) return '';
    if (typeof pair !== 'object') return String(pair);
    var value = pair[lang()];
    if (value === undefined) value = pair.ko !== undefined ? pair.ko : pair.en;
    return value === undefined ? '' : String(value);
  }

  // ---- pure helpers: animation clock and leader-line label layout -----------------------------
  var Layout = (function () {
    function clock() {
      let start = null, stopped = null, offset = 0;
      return {
        time(now) { if (start === null) start = now; return ((stopped === null ? now : stopped) - start - offset) / 1000; },
        pause(now) { if (start === null) start = now; if (stopped === null) stopped = now; },
        resume(now) { if (stopped !== null) { offset += now - stopped; stopped = null; } },
        get paused() { return stopped !== null; }
      };
    }
    // Labels stay next to their anchor: candidates are 8 directions at a few short distances.
    // Input order = priority; a label with no free slot is hidden instead of drifting away.
    const DIRS = [[0, -1], [1, -1], [-1, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [0, 1]];
    const GAPS = [10, 22, 38];
    function slots(a) {
      const out = [];
      GAPS.forEach(g => DIRS.forEach(([dx, dy]) => {
        const cx = a.ax + dx * (a.w / 2 + g * (dy ? 0.6 : 1)), cy = a.ay + dy * (a.h / 2 + g);
        out.push({ x: cx - a.w / 2, y: cy - a.h / 2 });
      }));
      return out;
    }
    function labels(input, width, height, obstacles, pad) {
      pad = pad === undefined ? 4 : pad;
      const placed = [], gap = 4, out = [];
      const hit = (b, p) => b.x < p.x + p.w + gap && p.x < b.x + b.w + gap && b.y < p.y + p.h + gap && p.y < b.y + b.h + gap;
      const dots = input.map(a => ({ x: a.ax - 3, y: a.ay - 3, w: 6, h: 6 }));
      input.forEach((a, i) => {
        const cand = slots(a);
        const ok = s => {
          const b = { x: s.x, y: s.y, w: a.w, h: a.h };
          if (b.x < pad || b.y < pad || b.x + b.w > width - pad || b.y + b.h > height - pad) return null;
          if (placed.some(p => hit(b, p)) || (obstacles || []).some(p => hit(b, p))) return null;
          if (dots.some((d, j) => j !== i && hit(b, d))) return null;
          return b;
        };
        let best = null, slot = -1;
        if (a.prev !== undefined && a.prev >= 0 && cand[a.prev]) { best = ok(cand[a.prev]); if (best) slot = a.prev; }
        for (let k = 0; !best && k < cand.length; k++) { best = ok(cand[k]); if (best) slot = k; }
        if (best) { placed.push(best); out.push(Object.assign(best, { hidden: false, slot })); }
        else out.push({ x: a.ax - a.w / 2, y: a.ay - a.h - 10, w: a.w, h: a.h, hidden: true, slot: -1 });
      });
      return out;
    }
    // end point of a leader line: the point of rect r closest to (ax, ay)
    function edge(r, ax, ay) {
      return { x: Math.max(r.x, Math.min(r.x + r.w, ax)), y: Math.max(r.y, Math.min(r.y + r.h, ay)) };
    }
    return { clock, labels, edge };
  })();

  // ---- capability probes ----------------------------------------------------------------------
  let webGL;
  function hasWebGL() {
    if (webGL !== undefined) return webGL;
    try {
      const c = doc.createElement('canvas');
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      webGL = !!gl;
      // hand the probe context straight back so it never counts against the browser's context limit
      if (gl) { const ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); }
    } catch (_) { webGL = false; }
    return webGL;
  }
  function media(query) { return !!(root.matchMedia && root.matchMedia(query).matches); }
  function reducedMotion() { return media('(prefers-reduced-motion: reduce)'); }

  // quality tier, decided once: 'lo' = coarse pointer on a small screen, or WebGL1
  let tierC = null;
  function tier(renderer) {
    if (tierC) return tierC;
    const scr = root.screen || { width: 1920, height: 1080 };
    const small = media('(pointer: coarse)') && Math.min(scr.width, scr.height) < 900;
    tierC = small || !renderer.capabilities.isWebGL2 || /[?&]lowfx\b/.test((root.location && root.location.search) || '') ? 'lo' : 'hi';
    return tierC;
  }

  // soft studio environment (sky dome + soft boxes), prefiltered for PBR reflections and ambient
  function studioEnv(renderer) {
    const THREE = root.THREE;
    const es = new THREE.Scene();
    const g = new THREE.SphereGeometry(100, 48, 24), cols = [], top = new THREE.Color(0xfffdf8), mid = new THREE.Color(0xc2ccda), bot = new THREE.Color(0x7d8aa0);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 100;
      const c = y > 0 ? mid.clone().lerp(top, Math.pow(y, 0.6)) : mid.clone().lerp(bot, Math.pow(-y, 0.5));
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    es.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const box = (w, h, x, y, z, k, tint) => {
      const c = new THREE.Color(tint || 0xffffff).multiplyScalar(k);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); es.add(m);
    };
    box(60, 40, 30, 70, 40, 2.6, 0xfff3e2);      // key, above-front (warm)
    box(50, 30, -70, 30, -30, 1.1, 0xe6eeff);    // fill, left (cool)
    box(120, 10, -10, 45, -80, 1.8);             // rim strip, behind
    box(30, 30, 0, 95, 0, 0.6);                  // weak overhead
    const pm = new THREE.PMREMGenerator(renderer);
    const rt = pm.fromScene(es, 0.04);
    pm.dispose();
    es.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    return rt;
  }

  // scene code writes plain sRGB hex colours; they are converted to linear once after build()
  function linearize(m) {
    if (m.userData.lin) return;
    m.userData.lin = true;
    if (m.color) m.color.convertSRGBToLinear();
    if (m.emissive) m.emissive.convertSRGBToLinear();
  }
  // runtime colour change in sRGB hex, e.g. D.col(lamp.color, 0x38a169)
  function col(c, hex) { return c.setHex(hex).convertSRGBToLinear(); }

  function isFlat(o) { return o.geometry && /Plane|Circle/.test(o.geometry.type); }
  function shown(o) { for (; o; o = o.parent) if (!o.visible) return false; return true; }

  // ---- one live figure ------------------------------------------------------------------------
  function mount(box, opts, state) {
    const THREE = root.THREE;
    // per-box camera override, e.g. data-view='{"dist":900,"target":[0,0,0]}'
    if (box.dataset.view) { try { opts = Object.assign({}, opts, JSON.parse(box.dataset.view)); } catch (_) { /* keep scene defaults */ } }
    let renderer = null, envRT = null;
    const generated = [];
    try {
      let W = box.clientWidth, H = box.clientHeight;
      if (W < 2 || H < 2) return null;
      const nativeAspect = W / H; let fitScale = 1;
      const HQ = root.DECK3D_HQ || null;
      const capture = root.SCENE3D_CAPTURE || null;
      const still = reducedMotion();
      // loop state is declared first: ctl.goTo() may wake the loop while build() runs
      let first = true, lastS = 0, lastTick = NaN, raf = 0, alive = true, snap = false;
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!capture });
      const TIER = tier(renderer);
      renderer.setPixelRatio(HQ && HQ.pr ? HQ.pr : Math.min(TIER === 'lo' ? 1.5 : 2, root.devicePixelRatio || 1));
      renderer.setSize(W, H, false);
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = opts.exposure || 0.92;
      renderer.shadowMap.enabled = opts.shadows !== false;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.physicallyCorrectLights = false;

      const scene = new THREE.Scene();
      envRT = studioEnv(renderer);
      scene.environment = envRT.texture;
      const camera = new THREE.PerspectiveCamera(opts.fov || 35, W / H, opts.near || 1, opts.far || 20000);
      if (opts.fog) scene.fog = new THREE.Fog(opts.fog[0], opts.fog[1], opts.fog[2]);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x8f9db3, 0.08));
      const key = new THREE.DirectionalLight(0xfff4e6, 1.45);
      const fill = new THREE.DirectionalLight(0xdfe9ff, 0.22);
      const rim = new THREE.DirectionalLight(0xffffff, 0.4);
      scene.add(key, key.target, fill, rim);

      // step readout (scenes write their current step into .readout)
      let readout = box.querySelector('.readout');
      if (!readout) {
        readout = doc.createElement('div'); readout.className = 'readout'; readout.setAttribute('aria-hidden', 'true');
        box.appendChild(readout); generated.push(readout);
      }

      const target = new THREE.Vector3().fromArray(opts.target || [0, 0, 0]), tgoal = target.clone();
      const dflt = (v, d) => (v === undefined ? d : v);
      const home = { yaw: dflt(opts.yaw, 0.8), pitch: dflt(opts.pitch, 0.45), dist: dflt(opts.dist, 600) };
      const goal = Object.assign({}, home), cur = Object.assign({}, home);
      // fit: a world box [[x0,y0,z0],[x1,y1,z1]] (cm) is framed to fill the figure at a given yaw/pitch,
      // solved against the real aspect and again on every resize.
      const fitCam = new THREE.PerspectiveCamera();
      function fitView(fb, yaw, pitch, fillK) {
        const B = new THREE.Box3(new THREE.Vector3().fromArray(fb[0]), new THREE.Vector3().fromArray(fb[1]));
        const P = [], v = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
        for (let i = 0; i < 8; i++) P.push(new THREE.Vector3(i & 1 ? B.max.x : B.min.x, i & 2 ? B.max.y : B.min.y, i & 4 ? B.max.z : B.min.z));
        fillK = fillK || (opts.fit && opts.fit.fill) || 0.9;
        const pad = (opts.fit && opts.fit.pad) || [0, 0, 0, 0];   // extra px reserved [top, right, bottom, left]
        // narrow figures also keep the top row free for the reset button (captures hide it)
        const bot = (readout ? 34 : 8) + pad[2], top = 8 + pad[0] + (W < 520 && !capture ? 24 : 0);
        const AX0 = (-1 + 2 * (8 + pad[3]) / W) * fillK, AX1 = (1 - 2 * (8 + pad[1]) / W) * fillK;
        const AY0 = (-1 + 2 * bot / H) * fillK, AY1 = (1 - 2 * top / H) * fillK;
        const tanV = Math.tan(camera.fov * Math.PI / 360), tanH = tanV * W / H;
        fitCam.fov = camera.fov; fitCam.aspect = W / H; fitCam.near = 0.01; fitCam.far = 1e7; fitCam.updateProjectionMatrix();
        const tg = B.getCenter(new THREE.Vector3());
        let d = B.getSize(new THREE.Vector3()).length() / Math.min(tanV, tanH);
        for (let it = 0; it < 10; it++) {
          fitCam.position.set(tg.x + d * Math.cos(pitch) * Math.sin(yaw), tg.y + d * Math.sin(pitch), tg.z + d * Math.cos(pitch) * Math.cos(yaw));
          fitCam.lookAt(tg); fitCam.updateMatrixWorld();
          let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
          P.forEach(p => { v.copy(p).project(fitCam); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); });
          right.setFromMatrixColumn(fitCam.matrixWorld, 0); up.setFromMatrixColumn(fitCam.matrixWorld, 1);
          tg.addScaledVector(right, ((x0 + x1) / 2 - (AX0 + AX1) / 2) * tanH * d)
            .addScaledVector(up, ((y0 + y1) / 2 - (AY0 + AY1) / 2) * tanV * d);
          d *= Math.max((x1 - x0) / (AX1 - AX0), (y1 - y0) / (AY1 - AY0));
        }
        return { dist: d, target: tg };
      }
      let curFit = null;
      let homeTarget = target.clone();
      const applyFit = (snapNow) => {
        if (!curFit) return;
        const f = fitView(curFit.box, curFit.yaw, curFit.pitch, curFit.fill);
        home.yaw = goal.yaw = curFit.yaw; home.pitch = goal.pitch = curFit.pitch; home.dist = goal.dist = f.dist;
        tgoal.copy(f.target); homeTarget = f.target.clone();
        if (snapNow) { cur.yaw = goal.yaw; cur.pitch = goal.pitch; cur.dist = goal.dist; target.copy(tgoal); }
      };
      const ctl = {
        // goTo({yaw, pitch, dist, target}) or goTo({yaw, pitch, box, fill}): glides there; it also becomes the home view
        goTo(v) {
          if (v.box) { curFit = { box: v.box, yaw: dflt(v.yaw, home.yaw), pitch: dflt(v.pitch, home.pitch), fill: v.fill }; applyFit(still); return; }
          curFit = null;
          ['yaw', 'pitch', 'dist'].forEach(k => { if (v[k] !== undefined) home[k] = goal[k] = v[k] * (k === 'dist' ? fitScale : 1); });
          if (v.target) tgoal.fromArray(v.target);
          homeTarget = tgoal.clone();
          wake();
        }
      };

      const api = opts.build(scene, THREE, box, camera, ctl) || {};
      if (!curFit && opts.fit && opts.fit.box) curFit = { box: opts.fit.box, yaw: home.yaw, pitch: home.pitch, fill: opts.fit.fill };
      applyFit(true);

      // after build: linear colours, shadow flags, light rig and a contact-shadow ground fitted to the content
      const bb = new THREE.Box3(), tmp = new THREE.Box3(), envK = dflt(opts.env, 1);
      scene.traverse(o => {
        if (o.material) [].concat(o.material).forEach(m => {
          linearize(m);
          if (m.envMapIntensity !== undefined && !m.userData.envK) { m.userData.envK = true; m.envMapIntensity *= envK; }
        });
        if (!o.isMesh) return;
        const opaque = [].concat(o.material).every(m => !m.transparent);
        o.castShadow = opaque && !isFlat(o) && !o.userData.noShadow;
        o.receiveShadow = !o.userData.noShadow;
        if (opaque && !isFlat(o)) { o.updateWorldMatrix(true, false); if (o.geometry) { o.geometry.computeBoundingBox(); tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); bb.union(tmp); } }
      });
      if (bb.isEmpty()) bb.set(new THREE.Vector3(-100, -100, -100), new THREE.Vector3(100, 100, 100));
      const c = bb.getCenter(new THREE.Vector3()), R = Math.max(40, bb.getSize(new THREE.Vector3()).length() / 2);
      const kd = new THREE.Vector3(0.45, 1, 0.55).normalize();
      key.position.copy(c).addScaledVector(kd, R * 2.2); key.target.position.copy(c);
      fill.position.copy(c).add(new THREE.Vector3(-1, 0.4, 0.3).multiplyScalar(R * 2));
      rim.position.copy(c).add(new THREE.Vector3(-0.2, 0.6, -1).multiplyScalar(R * 2));
      if (renderer.shadowMap.enabled) {
        key.castShadow = true;
        const maxTex = renderer.capabilities.maxTextureSize;
        const sm = Math.min(maxTex, HQ && HQ.shadow ? HQ.shadow : (opts.shadowMap || (TIER === 'hi' ? 2048 : 1024)));
        key.shadow.mapSize.set(sm, sm);
        const sc = key.shadow.camera;
        if (opts.shadowR) {                                 // shadowR: limit the shadow box on very large scenes
          const SR = opts.shadowR;
          sc.left = sc.bottom = -SR * 1.05; sc.right = sc.top = SR * 1.05; sc.near = R * 0.5; sc.far = R * 4;
          key.shadow.normalBias = R * 0.004;
        } else {
          const lc = new THREE.OrthographicCamera(); lc.position.copy(key.position); lc.lookAt(c); lc.updateMatrixWorld();
          const lb = new THREE.Box3(), p = new THREE.Vector3(), m = R * 0.12;
          for (let i = 0; i < 8; i++) lb.expandByPoint(p.set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z).applyMatrix4(lc.matrixWorldInverse));
          sc.left = lb.min.x - m; sc.right = lb.max.x + m; sc.bottom = lb.min.y - m; sc.top = lb.max.y + m;
          sc.near = Math.max(1, -lb.max.z - m); sc.far = -lb.min.z + m;
          key.shadow.normalBias = Math.max(sc.right - sc.left, sc.top - sc.bottom) / key.shadow.mapSize.x * 1.2;
        }
        sc.updateProjectionMatrix();
        key.shadow.bias = -0.0003; key.shadow.radius = 3;
      }
      if (opts.ground !== false && renderer.shadowMap.enabled) {
        const gr = new THREE.Mesh(new THREE.PlaneGeometry(R * 6, R * 6), new THREE.ShadowMaterial({ opacity: opts.groundShadow || 0.22 }));
        gr.rotation.x = -Math.PI / 2;
        gr.position.set(c.x, bb.min.y - 0.3, c.z);
        gr.receiveShadow = true;
        scene.add(gr);
      }

      const canvas = renderer.domElement;
      canvas.setAttribute('role', 'img');
      const poster = box.querySelector('img');
      if (poster && poster.alt) canvas.setAttribute('aria-label', poster.alt);
      box.appendChild(canvas);

      // ---- input: mouse/pen drag orbits; touch: one finger scrolls the page, two fingers orbit
      let dragging = false, touched = false, px = 0, py = 0, vy = 0, vp = 0;
      const touches = new Map();
      const tAvg = () => { let x = 0, y = 0; touches.forEach(p => { x += p.x; y += p.y; }); return [x / touches.size, y / touches.size]; };
      const orbitBy = (x, y) => {
        vy = -(x - px) * 0.008; vp = (y - py) * 0.006;
        goal.yaw += vy;
        goal.pitch = Math.max(0.05, Math.min(1.45, goal.pitch + vp));
        px = x; py = y;
      };
      const goHome = () => { Object.assign(goal, home); tgoal.copy(homeTarget); vy = vp = 0; touched = false; wake(); };
      const on = (el, type, fn, o) => { el.addEventListener(type, fn, o); generated.push(() => el.removeEventListener(type, fn, o)); };
      on(canvas, 'pointerdown', e => {
        if (e.pointerType === 'touch') {
          touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (touches.size === 2) { dragging = touched = true; vy = vp = 0; [px, py] = tAvg(); wake(); }
          return;
        }
        if (e.button !== 0) return;
        dragging = touched = true; vy = vp = 0; px = e.clientX; py = e.clientY;
        try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* capture is optional */ }
        wake();
      });
      const lift = e => { if (e.pointerType === 'touch') { touches.delete(e.pointerId); if (touches.size < 2) dragging = false; } else dragging = false; };
      on(canvas, 'pointerup', lift);
      on(canvas, 'pointercancel', lift);
      on(canvas, 'pointermove', e => {
        if (e.pointerType === 'touch') {
          if (!touches.has(e.pointerId)) return;
          touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (touches.size < 2 || !dragging) return;
          const [x, y] = tAvg(); orbitBy(x, y); wake();
          return;
        }
        if (!dragging) return;
        orbitBy(e.clientX, e.clientY); wake();
      });
      on(canvas, 'dblclick', goHome);

      const reset = doc.createElement('button');
      reset.type = 'button'; reset.className = 'view3d__reset';
      reset.textContent = t({ ko: '원위치', en: 'Reset view' });
      on(reset, 'click', goHome);
      box.appendChild(reset); generated.push(reset);

      // ---- labels: .lb[data-at="x,y,z"] pins to a scene point; .lb[data-obj] follows api.anchors[name]
      // (+ optional data-off). DOM order = priority. data-ph="0 2" = shown only while box.dataset.ph is 0 or 2.
      const anchors = api.anchors || {};
      const labels = Array.prototype.slice.call(box.querySelectorAll('.lb[data-at], .lb[data-obj]')).map(el => ({
        el, slot: -1,
        p: new THREE.Vector3().fromArray((el.dataset.at || el.dataset.off || '0,0,0').split(',').map(Number)),
        o: el.dataset.obj ? anchors[el.dataset.obj] : null,
        ph: el.dataset.ph ? el.dataset.ph.split(/\s+/) : null
      }));
      const SVGNS = 'http://www.w3.org/2000/svg', lead = doc.createElementNS(SVGNS, 'svg');
      lead.setAttribute('class', 'lead3d'); lead.setAttribute('aria-hidden', 'true'); box.appendChild(lead); generated.push(lead);
      labels.forEach(l => {
        l.el.setAttribute('aria-hidden', 'true');
        const cls = (l.el.className.match(/\b(c|r|n|o|g)\b/) || ['', 'k'])[1];
        l.line = doc.createElementNS(SVGNS, 'line'); l.dot = doc.createElementNS(SVGNS, 'circle');
        l.line.setAttribute('class', 'ld ' + cls); l.dot.setAttribute('class', 'ld ' + cls); l.dot.setAttribute('r', '2.6');
        lead.appendChild(l.line); lead.appendChild(l.dot);
      });
      const v = new THREE.Vector3();
      const obstacle = el => { if (!el || !el.offsetWidth || getComputedStyle(el).display === 'none') return null; return { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }; };
      function layoutLabels() {
        if (!labels.length) return;
        const cand = [], vis = [], ph = box.dataset.ph;
        labels.forEach(l => {
          if (l.o) { l.o.updateWorldMatrix(true, false); v.copy(l.p).applyMatrix4(l.o.matrixWorld).project(camera); }
          else v.copy(l.p).project(camera);
          const phOn = !l.ph || (ph !== undefined && l.ph.indexOf(String(ph)) !== -1);
          const visible = phOn && v.z >= -1 && v.z <= 1 && Math.abs(v.x) < 1.02 && Math.abs(v.y) < 1.02 && (!l.o || shown(l.o)) && l.el.offsetWidth > 0;
          if (!visible) { l.el.classList.add('off'); l.line.style.display = l.dot.style.display = 'none'; l.slot = -1; return; }
          cand.push({ ax: (v.x + 1) / 2 * W, ay: (1 - v.y) / 2 * H, w: l.el.offsetWidth, h: l.el.offsetHeight, prev: l.slot });
          vis.push(l);
        });
        const obs = [obstacle(readout), obstacle(reset), obstacle(box.querySelector('.cap3')), obstacle(box.querySelector('.inset3d'))].filter(Boolean);
        Layout.labels(cand, W, H, obs).forEach((p, i) => {
          const l = vis[i], el = l.el, a = cand[i];
          l.slot = p.slot;
          if (p.hidden) { el.classList.add('off'); l.line.style.display = l.dot.style.display = 'none'; return; }
          el.classList.remove('off');
          el.style.transform = 'none'; el.style.left = p.x + 'px'; el.style.top = p.y + 'px';
          const e = Layout.edge(p, a.ax, a.ay), far = Math.hypot(e.x - a.ax, e.y - a.ay) > 3;
          l.line.style.display = far ? '' : 'none'; l.dot.style.display = '';
          if (far) { l.line.setAttribute('x1', a.ax); l.line.setAttribute('y1', a.ay); l.line.setAttribute('x2', e.x); l.line.setAttribute('y2', e.y); }
          l.dot.setAttribute('cx', a.ax); l.dot.setAttribute('cy', a.ay);
        });
      }

      // ---- render loop: runs only while the figure is near the viewport and the tab is visible
      const clock = Layout.clock();
      const stillTime = typeof opts.stillTime === 'number' ? opts.stillTime : 2.5;
      function sceneTime(now) {
        if (typeof root.DECK3D_CLOCK === 'number') return root.DECK3D_CLOCK;
        if (still) return stillTime;
        return Math.max(0, clock.time(now));
      }
      function draw(now) {
        const s = sceneTime(now);
        lastS = s;
        if (snap) { first = true; snap = false; }
        if (opts.autoYaw && !touched && !still) goal.yaw = home.yaw + opts.autoYaw * Math.sin(s * 0.25);
        if (!dragging && (vy || vp)) {          // inertia after release
          vy *= 0.9; vp *= 0.9;
          goal.yaw += vy; goal.pitch = Math.max(0.05, Math.min(1.45, goal.pitch + vp));
          if (Math.abs(vy) + Math.abs(vp) < 1e-4) vy = vp = 0;
        }
        const snapNow = first, k = snapNow ? 1 : 0.16;
        first = false;
        cur.yaw += (goal.yaw - cur.yaw) * k; cur.pitch += (goal.pitch - cur.pitch) * k; cur.dist += (goal.dist - cur.dist) * k;
        target.lerp(tgoal, snapNow ? 1 : k * 0.6);
        if (api.tick && s !== lastTick) { api.tick(s); lastTick = s; }
        camera.position.set(
          target.x + cur.dist * Math.cos(cur.pitch) * Math.sin(cur.yaw),
          target.y + cur.dist * Math.sin(cur.pitch),
          target.z + cur.dist * Math.cos(cur.pitch) * Math.cos(cur.yaw));
        camera.lookAt(target);
        renderer.render(scene, camera);
        layoutLabels();
      }
      // a frozen scene (reduced motion or fixed clock) stops drawing once the camera has settled
      function settled() {
        if (!(still || typeof root.DECK3D_CLOCK === 'number') || dragging || vy || vp) return false;
        const d = Math.abs(goal.yaw - cur.yaw) + Math.abs(goal.pitch - cur.pitch) + Math.abs(goal.dist - cur.dist) / Math.max(1, goal.dist) + target.distanceTo(tgoal) / Math.max(1, goal.dist);
        return d < 1e-4;
      }
      function frame(now) {
        raf = 0;
        if (!alive || !state.visible || (doc.hidden && !capture)) return;
        draw(now);
        if (!box.hasAttribute('data-scene3d-ready')) {
          box.setAttribute('data-scene3d-ready', '');
          box.dispatchEvent(new CustomEvent('scene3d:ready', { bubbles: true }));
        }
        if (!settled()) raf = root.requestAnimationFrame(frame);
      }
      function wake() { if (alive && !raf && state.visible) raf = root.requestAnimationFrame(frame); }

      const resize = () => {
        if (!alive) return;
        const nw = box.clientWidth, nh = box.clientHeight;
        if (nw < 2 || nh < 2 || (nw === W && nh === H)) return;
        W = nw; H = nh;
        renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
        if (curFit) applyFit(true);
        else {                                              // keep the horizontal extent when the figure gets relatively taller
          const nextFit = Math.max(1, nativeAspect / (W / H)), ratio = nextFit / fitScale;
          home.dist *= ratio; goal.dist *= ratio; cur.dist *= ratio; fitScale = nextFit;
        }
        draw(root.performance.now());
        wake();
      };
      let ro = null;
      if (root.ResizeObserver) { ro = new root.ResizeObserver(resize); ro.observe(box); }
      else on(root, 'resize', resize);

      // hooks for the capture script and QA: box.__scene3d.set({yaw, pitch, dist, target, fov}) snaps the view
      const hooks = {
        renderer, scene, camera, tier: TIER,
        home: Object.assign({}, home, { target: target.toArray(), fov: opts.fov || 35 }),
        presets: opts.presets || [],
        preset(i) {
          const p = (opts.presets || [])[i]; if (!p) return false;
          this.set(p); return true;
        },
        orbit(dy) { goal.yaw = cur.yaw = cur.yaw + dy; touched = true; snap = true; wake(); },
        set(view) {
          ['yaw', 'pitch', 'dist'].forEach(k => { if (view[k] !== undefined) goal[k] = cur[k] = view[k]; });
          if (view.target) { tgoal.fromArray(view.target); target.copy(tgoal); }
          if (view.fov && camera.fov !== view.fov) { camera.fov = view.fov; camera.updateProjectionMatrix(); }
          touched = true; snap = true; wake();
        },
        render() { draw(root.performance.now()); },
        time: () => lastS,
        get view() { return { yaw: cur.yaw, pitch: cur.pitch, dist: cur.dist, target: target.toArray(), fov: camera.fov }; },
        fitCheck() {
          if (!curFit) return null;
          const B = curFit.box, q = new THREE.Vector3(); let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
          for (let i = 0; i < 8; i++) { q.set(B[i & 1][0], B[(i >> 1) & 1][1], B[(i >> 2) & 1][2]).project(camera); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
          return { x0: +x0.toFixed(3), x1: +x1.toFixed(3), y0: +y0.toFixed(3), y1: +y1.toFixed(3), inside: x0 >= -1.001 && x1 <= 1.001 && y0 >= -1.001 && y1 <= 1.001 };
        }
      };
      box.__scene3d = box.__deck3d = hooks;

      box.classList.add('live');
      clock.time(root.performance.now());
      draw(root.performance.now());
      wake();
      return {
        wake,
        destroy() {
          alive = false;
          if (raf) root.cancelAnimationFrame(raf);
          raf = 0;
          if (ro) ro.disconnect();
          delete box.__scene3d; delete box.__deck3d;
          if (api.dispose) { try { api.dispose(); } catch (_) { /* scene cleanup is best effort */ } }
          disposeScene(scene);
          cleanup();
          envRT.dispose();
          renderer.dispose();
          renderer.forceContextLoss();
          canvas.remove();
          box.removeAttribute('data-scene3d-ready');
          box.classList.remove('live');
        }
      };
    } catch (err) {
      cleanup();
      if (envRT) envRT.dispose();
      if (renderer) { try { renderer.dispose(); renderer.forceContextLoss(); } catch (_) { /* context already gone */ } }
      box.classList.remove('live');
      box.querySelectorAll('canvas').forEach(cv => cv.remove());
      if (root.console) root.console.warn('3D figure disabled:', err);
      return null;
    }
    function cleanup() {
      generated.forEach(g => { if (typeof g === 'function') g(); else if (g && g.remove) g.remove(); });
      generated.length = 0;
      box.querySelectorAll('.lb[data-gen]').forEach(e => e.remove());
    }
  }

  function disposeScene(scene) {
    scene.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach(m => {
        Object.keys(m).forEach(k => { const value = m[k]; if (value && value.isTexture) value.dispose(); });
        m.dispose();
      });
    });
  }

  // ---- lifecycle: lazy three.js, IntersectionObserver, at most MAX_LIVE contexts -------------
  const registry = Object.create(null);
  const states = new Map();
  let io = null, threeState = 0;   // 0 idle, 1 loading, 2 ready, -1 failed

  function threeUrl() {
    if (root.SCENE3D_THREE_URL) return root.SCENE3D_THREE_URL;
    if (selfSrc) { try { return new URL('vendor/three-r128.min.js', selfSrc).href; } catch (_) { /* fall through */ } }
    const base = doc.body && doc.body.getAttribute('data-base') || '';
    return base + 'js/vendor/three-r128.min.js';
  }
  function loadThree() {
    if (root.THREE) { threeState = 2; return true; }
    if (threeState !== 0) return false;
    threeState = 1;
    const s = doc.createElement('script');
    s.src = threeUrl();
    s.onload = () => { threeState = root.THREE ? 2 : -1; pump(); };
    s.onerror = () => { threeState = -1; };
    (doc.head || doc.documentElement).appendChild(s);
    return false;
  }

  function observe(box) {
    if (states.has(box)) return;
    const state = { box, visible: !io, live: null, failed: false, timer: 0, seen: 0 };
    states.set(box, state);
    if (io) io.observe(box);
  }
  function scan() {
    if (!doc) return;
    if (!io && root.IntersectionObserver) io = new root.IntersectionObserver(onIntersect, { rootMargin: '200px 0px' });
    doc.querySelectorAll('.view3d[data-scene]').forEach(observe);
    states.forEach((state, box) => { if (!box.isConnected) { release(state); if (io) io.unobserve(box); states.delete(box); } });
    pump();
  }
  function onIntersect(entries) {
    const now = root.performance.now();
    entries.forEach(e => {
      const state = states.get(e.target);
      if (!state) return;
      state.visible = e.isIntersecting;
      clearTimeout(state.timer);
      if (state.visible) { state.seen = now; if (state.live) state.live.wake(); else root.setTimeout(pump, DWELL + 20); }
      else if (state.live) state.timer = setTimeout(() => { if (!state.visible) { release(state); pump(); } }, RELEASE_DELAY);
    });
    pump();
  }
  function release(state) {
    clearTimeout(state.timer);
    if (state.live) { state.live.destroy(); state.live = null; }
  }
  function pump() {
    const wanted = [], now = root.performance.now();
    states.forEach(state => {
      if (state.visible && now - state.seen >= DWELL && !state.live && !state.failed && registry[state.box.dataset.scene]) wanted.push(state);
    });
    if (!wanted.length || threeState === -1) return;
    if (!hasWebGL()) { wanted.forEach(state => { state.failed = true; }); return; }   // no WebGL: never fetch three.js
    if (!loadThree()) return;                     // pump() runs again once three.js has loaded
    wanted.forEach(state => {
      const live = [];
      states.forEach(other => { if (other.live) live.push(other); });
      if (live.length >= MAX_LIVE) {
        const idle = live.filter(other => !other.visible).sort((a, b) => a.seen - b.seen)[0];
        if (!idle) return;                          // every live figure is on screen: this one keeps its poster for now
        release(idle);
      }
      state.live = mount(state.box, registry[state.box.dataset.scene], state);
      if (!state.live) state.failed = true;
    });
  }

  function register(name, opts) {
    registry[name] = opts;
    if (started) scan();
  }

  // Observation starts after the window load event: images above a figure have their final size by then,
  // so a figure far below the fold is not mistaken for a visible one while the layout is still settling.
  let started = false;
  function start() {
    if (started) return;
    started = true;
    scan();
    root.setTimeout(scan, 500);                   // late renderers (overlays that move figures)
  }
  if (doc) {
    if (doc.readyState === 'complete') start();
    else root.addEventListener('load', start);
    doc.addEventListener('visibilitychange', () => { if (!doc.hidden) states.forEach(state => { if (state.live) state.live.wake(); }); });
  }

  // =============================================================================================
  // Prop library (units: cm, y up, "forward" = +z). Every helper takes THREE first.
  // =============================================================================================

  // o: {opacity, emissive, side, rough, metal}
  function mat(THREE, color, o) {
    o = o || {};
    const m = new THREE.MeshStandardMaterial({
      color: color, roughness: o.rough === undefined ? 0.55 : o.rough, metalness: o.metal === undefined ? 0.05 : o.metal,
      envMapIntensity: 0.45
    });
    if (o.opacity !== undefined) { m.transparent = true; m.opacity = o.opacity; m.depthWrite = false; }
    if (o.emissive) m.emissive = new THREE.Color(o.emissive);
    if (o.side) m.side = THREE.DoubleSide;
    return m;
  }
  function mesh(THREE, geo, m, x, y, z) {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x || 0, y || 0, z || 0);
    return o;
  }

  // box with rounded edges (w × h × d, corner radius r), centred on the origin
  function rbox(THREE, w, h, d, r) {
    r = Math.min(r, w / 2 - 0.01, h / 2 - 0.01, d / 2 - 0.01);
    const b = r * 0.55, a = r - b;
    const x = w / 2 - b, y = h / 2 - b, sh = new THREE.Shape();
    sh.moveTo(-x + a, -y);
    sh.lineTo(x - a, -y); sh.quadraticCurveTo(x, -y, x, -y + a);
    sh.lineTo(x, y - a); sh.quadraticCurveTo(x, y, x - a, y);
    sh.lineTo(-x + a, y); sh.quadraticCurveTo(-x, y, -x, y - a);
    sh.lineTo(-x, -y + a); sh.quadraticCurveTo(-x, -y, -x + a, -y);
    const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(0.01, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 4, curveSegments: 6 });
    g.translate(0, 0, -(d - 2 * b) / 2);
    g.computeVertexNormals();
    return g;
  }

  // thin dark outlines on every mesh under obj (technical-drawing look)
  function outline(THREE, obj, color) {
    const lm = new THREE.LineBasicMaterial({ color: color || 0x6b7a90, transparent: true, opacity: 0.4 });
    const ms = [];
    obj.traverse(o => { if (o.isMesh) ms.push(o); });
    ms.forEach(m => m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 30), lm)));
    return obj;
  }

  // LINAC with isocenter at origin; couch axis = z. Returns {root, gantry}; gantry rotates about z.
  function linac(THREE, floorY) {
    const root3 = new THREE.Group();
    const white = mat(THREE, 0xe4e9f0, { rough: 0.35 }), grey = mat(THREE, 0xa3afc0, { rough: 0.45 }),
      navy = mat(THREE, 0x1e3a8a, { rough: 0.4 }), dk = mat(THREE, 0x3d4756, { rough: 0.5, metal: 0.3 }),
      carbon = mat(THREE, 0x2d3440, { rough: 0.6 }), steel = mat(THREE, 0x9aa5b4, { rough: 0.3, metal: 0.6 });
    const standH = 95 - floorY;
    root3.add(mesh(THREE, rbox(THREE, 150, standH, 50, 10), white, 0, floorY + standH / 2, -175));
    root3.add(mesh(THREE, rbox(THREE, 170, 8, 70, 3), grey, 0, floorY + 4, -175));
    const drum = mesh(THREE, new THREE.CylinderGeometry(78, 78, 26, 72), grey, 0, 0, -140);
    drum.rotation.x = Math.PI / 2;
    root3.add(drum);
    root3.add(mesh(THREE, new THREE.TorusGeometry(78, 2.2, 12, 96), navy, 0, 0, -127));
    const gantry = new THREE.Group();
    gantry.add(mesh(THREE, rbox(THREE, 58, 26, 140, 9), white, 0, 108, -62));
    gantry.add(mesh(THREE, rbox(THREE, 62, 34, 54, 10), white, 0, 92, 0));
    gantry.add(mesh(THREE, rbox(THREE, 64, 5, 56, 2.2), navy, 0, 110.5, 0));
    gantry.add(mesh(THREE, new THREE.CylinderGeometry(15, 19, 14, 48), dk, 0, 70, 0));
    gantry.add(mesh(THREE, new THREE.CylinderGeometry(11, 11, 1.2, 40), mat(THREE, 0x0b1220, { rough: 0.15, metal: 0.4 }), 0, 62.6, 0));
    gantry.add(mesh(THREE, rbox(THREE, 44, 4, 44, 2), dk, 0, -78, 0));
    gantry.add(mesh(THREE, rbox(THREE, 8, 40, 8, 2), grey, 0, -60, -32));
    root3.add(gantry);
    root3.add(mesh(THREE, rbox(THREE, 52, 6, 240, 3), carbon, 0, -21, 45));
    root3.add(mesh(THREE, rbox(THREE, 54, 2, 242, 1), steel, 0, -24.5, 45));
    const colH = -24 - floorY;
    root3.add(mesh(THREE, rbox(THREE, 34, colH, 46, 6), grey, 0, floorY + colH / 2, 105));
    root3.add(mesh(THREE, rbox(THREE, 80, 6, 90, 3), grey, 0, floorY + 3, 105));
    outline(THREE, root3, 0x8492a6);
    return { root: root3, gantry };
  }

  // smooth limb/torso: lathe profile [[radius, length], ...] along +z
  function body(THREE, prof, m) {
    const g = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 40);
    g.rotateX(Math.PI / 2);
    g.computeVertexNormals();
    return new THREE.Mesh(g, m);
  }

  // stylised head: sphere with narrowed jaw and a forward face plane (synthetic, no patient data)
  function headGeometry() {
    const THREE = root.THREE;
    const g = new THREE.SphereGeometry(1, 48, 32), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), jaw = 1 - 0.25 * Math.pow(Math.max(0, -y), 0.6);
      const front = Math.max(0, z), cheek = 0.07 * Math.exp(-Math.pow((y + 0.08) / 0.26, 2)) * front;
      p.setXYZ(i, x * (jaw + cheek), y, z * (z > 0 ? 0.88 : 1) + 0.1 * front * Math.exp(-Math.pow((y + 0.2) / 0.45, 2)));
    }
    g.computeVertexNormals();
    return g;
  }
  function tube(THREE, points, r, m, segments) {
    return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a => new THREE.Vector3().fromArray(a))), segments || 48, r, 10, false), m);
  }
  function ell(THREE, m, x, y, z, sx, sy, sz) {
    const o = mesh(THREE, new THREE.SphereGeometry(1, 40, 28), m, x, y, z); o.scale.set(sx, sy, sz); return o;
  }
  // nose, ears, brows and mouth line for headGeometry() heads
  function faceDetails(color) {
    const THREE = root.THREE;
    const g = new THREE.Group(), skin = mat(THREE, color || 0xe7bf9f, { rough: 0.76, metal: 0 }), dark = mat(THREE, 0x8a6657, { rough: 0.85, metal: 0 });
    g.add(ell(THREE, skin, 0, -0.4, 9.1, 1.65, 2.3, 2.2));
    g.add(ell(THREE, skin, 0, -3.2, 8.1, 2.1, 0.7, 1.1));
    [-1, 1].forEach(s => {
      g.add(ell(THREE, skin, s * 9.15, -0.3, 0.6, 1.15, 2.6, 1.4));
      g.add(tube(THREE, [[s * 1.8, 1.8, 8.8], [s * 3.2, 2.1, 8.5], [s * 4.8, 1.8, 7.8]], 0.11, dark, 12));
    });
    g.add(tube(THREE, [[-1.8, -3.5, 8.8], [0, -3.65, 9], [1.8, -3.5, 8.8]], 0.1, dark, 12));
    return g;
  }
  // unit tooth crown; index > 3 = molar, 3 = canine
  function toothGeometry(index) {
    const THREE = root.THREE;
    index = index || 0;
    const g = new THREE.SphereGeometry(1, 28, 20), p = g.attributes.position;
    const molar = index > 3, canine = index === 3;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), z = p.getZ(i);
      const y = p.getY(i);
      const taper = 0.76 + 0.24 * (y + 1) / 2;
      x = Math.sign(x) * Math.pow(Math.abs(x), 0.58) * taper;
      z = Math.sign(z) * Math.pow(Math.abs(z), 0.62) * taper * (molar ? 0.92 : 0.56);
      let yy = y > 0 ? Math.pow(y, 0.36) : y;
      if (molar && y > 0.25) yy -= 0.16 * Math.exp(-(x * x + z * z) * 8);
      if (canine && y > 0) yy += 0.13 * Math.exp(-(x * x + z * z) * 6);
      p.setXYZ(i, x, yy, z);
    }
    g.computeVertexNormals();
    return g;
  }

  // patient lying supine on the couch, chest roughly at the isocenter. Returns group (+ .chest mesh).
  function patient(THREE, opacity) {
    const g = new THREE.Group();
    const op = opacity === undefined ? {} : { opacity: opacity };
    const skin = mat(THREE, 0xe7bf9f, Object.assign({ rough: 0.7 }, op));
    const gown = mat(THREE, 0xa9c7e8, Object.assign({ rough: 0.85 }, op));
    const torso = body(THREE, [[0.001, 0], [0.42, 1], [0.8, 5], [0.97, 14], [1, 30], [0.96, 52], [0.86, 70], [0.9, 88], [0.92, 102], [0.75, 112], [0.001, 116]], gown);
    torso.geometry.translate(0, 0, -58);
    torso.position.set(0, -6, 22);
    torso.scale.set(22, 12, 1);
    const legP = [[0.001, 0], [0.85, 2], [1, 10], [0.9, 40], [0.62, 55], [0.66, 66], [0.5, 90], [0.001, 94]];
    const legs = [-1, 1].map(sx => { const l = body(THREE, legP, gown); l.position.set(sx * 9.5, -10, 76); l.scale.set(9, 7, 1); return l; });
    const feet = [-1, 1].map(sx => mesh(THREE, new THREE.SphereGeometry(1, 20, 14), skin, sx * 10, -2, 168));
    feet.forEach(f => f.scale.set(4.5, 8, 4));
    const armP = [[0.001, 0], [0.9, 3], [1, 10], [0.8, 34], [0.7, 50], [0.6, 70], [0.001, 80]];
    const arms = [-1, 1].map(sx => { const a = body(THREE, armP, skin); a.position.set(sx * 27, -12, -28); a.scale.set(5.2, 5, 1); return a; });
    const neck = mesh(THREE, new THREE.CylinderGeometry(5.5, 6.5, 12, 24), skin, 0, -8, -38);
    neck.rotation.x = Math.PI / 2;
    const head = mesh(THREE, headGeometry(), skin, 0, -6, -52);
    head.rotation.x = -Math.PI / 2; head.scale.set(9.5, 11.5, 10);
    g.add(torso, ...legs, ...feet, ...arms, neck, head);
    const f = faceDetails(); f.position.copy(head.position); f.rotation.x = -Math.PI / 2; g.add(f);
    if (opacity !== undefined) f.traverse(o => { if (o.material) { o.material.transparent = opacity < 1; o.material.opacity = opacity; o.material.depthWrite = opacity >= 1; } });
    const seam = mat(THREE, 0x7f9db1, Object.assign({ rough: 0.9, metal: 0 }, opacity !== undefined && opacity < 1 ? { opacity: opacity } : {}));
    g.add(tube(THREE, [[-15, -0.4, -18], [-9, 4, -23], [0, 5, -26], [9, 4, -23], [15, -0.4, -18]], 0.36, seam, 24));
    g.chest = torso;
    return g;
  }

  // arrow from `from` along unit `dir` (arrays), shaft + head, one material
  function arrow(THREE, from, dir, len, m, r) {
    r = r || 2;
    const g = new THREE.Group();
    const head = r * 4.5;
    g.add(mesh(THREE, new THREE.CylinderGeometry(r, r, len - head, 16), m, 0, (len - head) / 2, 0));
    g.add(mesh(THREE, new THREE.ConeGeometry(r * 2.6, head, 24), m, 0, len - head / 2, 0));
    g.position.fromArray(from);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().fromArray(dir).normalize());
    return g;
  }

  // vertical alpha ramp for view cones (procedural canvas, no image file)
  let rampCanvas = null;
  function rampTex(THREE) {
    if (!rampCanvas) {
      rampCanvas = doc.createElement('canvas');
      rampCanvas.width = 4; rampCanvas.height = 128;
      const x = rampCanvas.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 128);
      gr.addColorStop(0, '#fff'); gr.addColorStop(0.55, '#999'); gr.addColorStop(1, '#3a3a3a');
      x.fillStyle = gr; x.fillRect(0, 0, 4, 128);
    }
    return new THREE.CanvasTexture(rampCanvas);
  }

  // depth camera (housing, glass front, lens + IR emitter) + soft view cone aimed at `aim`
  function cam(THREE, pos, aim, coneColor, coneOpacity, spread) {
    const g = new THREE.Group();
    g.position.fromArray(pos);
    g.add(mesh(THREE, rbox(THREE, 26, 9, 12, 2.5), mat(THREE, 0x1a2b45, { rough: 0.35, metal: 0.3 })));
    g.add(mesh(THREE, rbox(THREE, 22, 6, 1, 0.4), mat(THREE, 0x05080f, { rough: 0.08, metal: 0.2 }), 0, 0, 6.2));
    const lens = mesh(THREE, new THREE.CylinderGeometry(2.6, 2.6, 2, 24), mat(THREE, 0x00b7ff, { emissive: 0x00648c, rough: 0.1 }), 4, 0, 6.8);
    lens.rotation.x = Math.PI / 2;
    const ir = mesh(THREE, new THREE.CylinderGeometry(1.4, 1.4, 1.6, 16), mat(THREE, 0x7a1f1f, { emissive: 0x3a0a0a, rough: 0.2 }), -6, 0, 6.8);
    ir.rotation.x = Math.PI / 2;
    g.add(lens, ir);
    const metal = mat(THREE, 0x8c9fac, { rough: 0.3, metal: 0.7 });
    for (let x = -10; x <= 10; x += 4) g.add(mesh(THREE, rbox(THREE, 1.2, 0.4, 6, 0.08), metal, x, 4.6, -1));
    [-10, 10].forEach(x => [-2.5, 2.5].forEach(y => g.add(mesh(THREE, new THREE.CylinderGeometry(0.38, 0.38, 0.3, 12), metal, x, y, 6.8).rotateX(Math.PI / 2))));
    const len = new THREE.Vector3().fromArray(aim).distanceTo(g.position) + 10;
    const cm = mat(THREE, coneColor, { opacity: Math.min(1, coneOpacity * 1.7), side: true, rough: 1 });
    cm.alphaMap = rampTex(THREE);
    cm.emissive = new THREE.Color(coneColor).multiplyScalar(0.35);
    const cone = mesh(THREE, new THREE.ConeGeometry(len * spread, len, 48, 1, true), cm, 0, 0, len / 2);
    cone.rotation.x = -Math.PI / 2;
    g.add(cone);
    const rp = [];
    for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; rp.push(new THREE.Vector3(Math.cos(a) * len * spread, Math.sin(a) * len * spread, len)); }
    g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(rp),
      new THREE.LineBasicMaterial({ color: coneColor, transparent: true, opacity: Math.min(1, coneOpacity * 2.5) })));
    g.lookAt(new THREE.Vector3().fromArray(aim));
    return g;
  }

  const V3 = (THREE, a) => Array.isArray(a) ? new THREE.Vector3().fromArray(a) : a.clone();

  // RGB coordinate triad (x red, y green, z blue)
  function axes(THREE, len, r) {
    r = r || len * 0.035;
    const g = new THREE.Group();
    [[[1, 0, 0], 0xe5484d], [[0, 1, 0], 0x30a46c], [[0, 0, 1], 0x0091ff]].forEach(([d, c]) => {
      const a = arrow(THREE, [0, 0, 0], d, len, mat(THREE, c, { rough: 0.4 }), r);
      a.traverse(o => { o.userData.noShadow = true; });
      g.add(a);
    });
    return g;
  }

  // passive marker array: 4 retro-reflective spheres on a cross plate, in the local xy plane facing +z
  function marker4(THREE, s, plateColor) {
    s = s || 1;
    const g = new THREE.Group();
    const P = [[0, 0], [5.2, 1.6], [-3.6, 4.2], [1.2, -6]];
    const arm = mat(THREE, plateColor || 0x4a5568, { rough: 0.45, metal: 0.4 });
    const ball = mat(THREE, 0xf4f6f8, { rough: 0.22, metal: 0.05, emissive: 0x2a2a2a });
    g.add(mesh(THREE, new THREE.CylinderGeometry(1.1 * s, 1.1 * s, 0.8 * s, 20), arm).rotateX(Math.PI / 2));
    g.spheres = [];
    P.forEach(([x, y]) => {
      const L = Math.hypot(x, y) * s;
      if (L > 0) {
        const a = mesh(THREE, new THREE.CylinderGeometry(0.32 * s, 0.32 * s, L, 10), arm, x * s / 2, y * s / 2, 0);
        a.rotation.z = Math.atan2(y, x) - Math.PI / 2;
        g.add(a);
      }
      const b = mesh(THREE, new THREE.SphereGeometry(0.78 * s, 24, 16), ball, x * s, y * s, 0.6 * s);
      g.add(b); g.spheres.push(b);
    });
    return g;
  }

  // optical tracker bar: two lenses with IR LED rings (±21 cm), front = +z; optional floor stand at floorY
  function skadiCam(THREE, floorY, standX) {
    const root3 = new THREE.Group(), head = new THREE.Group();
    root3.add(head);
    const shell = mat(THREE, 0x2b313b, { rough: 0.4, metal: 0.35 }), glass = mat(THREE, 0x0a0f18, { rough: 0.08, metal: 0.3 });
    const metal = mat(THREE, 0x78909d, { rough: 0.32, metal: 0.7 });
    head.add(mesh(THREE, rbox(THREE, 54, 9, 11, 3), shell));
    head.add(mesh(THREE, rbox(THREE, 12, 2.2, 0.6, 0.5), mat(THREE, 0x00b7ff, { emissive: 0x005577 }), 0, 0, 5.6));
    for (let x = -15; x <= 15; x += 3) head.add(mesh(THREE, rbox(THREE, 1.1, 0.18, 3.5, 0.06), metal, x, 4.6, -1));
    const lenses = [-21, 21].map(x => {
      const l = new THREE.Group(); l.position.set(x, 0, 5.6);
      l.add(mesh(THREE, new THREE.CylinderGeometry(2.6, 2.8, 2, 28), glass).rotateX(Math.PI / 2));
      l.add(mesh(THREE, new THREE.TorusGeometry(3.6, 0.55, 10, 36), mat(THREE, 0xc0392b, { emissive: 0x7a1010, rough: 0.3 })));
      const ring = mesh(THREE, new THREE.TorusGeometry(2.55, 0.13, 10, 40), metal); ring.rotation.x = Math.PI / 2; l.add(ring);
      head.add(l);
      return l;
    });
    if (floorY !== undefined) {
      const steel = mat(THREE, 0x9aa5b4, { rough: 0.3, metal: 0.6 });
      const h = -floorY - 6;
      root3.add(mesh(THREE, new THREE.CylinderGeometry(1.6, 1.6, h, 16), steel, standX || 0, -6 - h / 2, -2));
      for (let i = 0; i < 3; i++) {
        const a = i / 3 * Math.PI * 2, leg = mesh(THREE, new THREE.CylinderGeometry(1, 1, 40, 10), steel);
        leg.position.set((standX || 0) + Math.cos(a) * 14, floorY + 9, -2 + Math.sin(a) * 14);
        leg.rotation.set(Math.sin(a) * 0.75, 0, -Math.cos(a) * 0.75);
        root3.add(leg);
      }
    }
    return { root: root3, head, lenses };
  }

  // translucent view pyramid from the origin along +z (fov in degrees, vertical)
  function frustum(THREE, fov, aspect, len, color, opacity) {
    const tt = Math.tan(fov * Math.PI / 360) * len, w = tt * aspect;
    const P = [[0, 0, 0], [-w, -tt, len], [w, -tt, len], [w, tt, len], [-w, tt, len]].map(p => new THREE.Vector3().fromArray(p));
    const idx = [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1];
    const geo = new THREE.BufferGeometry().setFromPoints(idx.map(i => P[i]));
    geo.computeVertexNormals();
    const g = new THREE.Group();
    const fm = mat(THREE, color, { opacity: opacity === undefined ? 0.12 : opacity, side: true, rough: 1, emissive: color });
    g.add(new THREE.Mesh(geo, fm));
    const e = [0, 1, 0, 2, 0, 3, 0, 4, 1, 2, 2, 3, 3, 4, 4, 1].map(i => P[i]);
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(e),
      new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: Math.min(1, (opacity || 0.12) * 4) })));
    g.faceMat = fm;
    return g;
  }

  // dashed segment a→b; .set(a, b) moves it
  function dashLink(THREE, color, dash) {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 1, 0)]);
    const l = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: color, dashSize: dash || 3, gapSize: (dash || 3) * 0.7, transparent: true, opacity: 0.95 }));
    l.set = (a, b) => {
      const p = geo.attributes.position;
      p.setXYZ(0, a.x, a.y, a.z); p.setXYZ(1, b.x, b.y, b.z); p.needsUpdate = true;
      geo.computeBoundingSphere(); l.computeLineDistances();
    };
    l.frustumCulled = false;
    return l;
  }

  // n independent segments; .set(i, a, b)
  function segs(THREE, n, color, opacity) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 6), 3));
    const l = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity === undefined ? 0.8 : opacity }));
    l.frustumCulled = false;
    l.set = (i, a, b) => { const p = geo.attributes.position; p.setXYZ(2 * i, a.x, a.y, a.z); p.setXYZ(2 * i + 1, b.x, b.y, b.z); p.needsUpdate = true; };
    return l;
  }

  // generic 6-axis arm on a base at the origin: yaw · pitch · pitch · pitch · pitch · roll.
  // .flange is the tool mount (tool axis = flange +y). .solve(points, iters) is damped least squares;
  // .reach(T, d, tipLen, elbow) is closed-form IK for this geometry.
  function arm6(THREE, o) {
    o = o || {};
    const white = mat(THREE, o.color || 0xdfe5ec, { rough: 0.35 }), capM = mat(THREE, o.cap || 0x5b6b82, { rough: 0.4, metal: 0.25 }),
      ringM = mat(THREE, o.accent || 0x1e5aa8, { rough: 0.4 }), metal = mat(THREE, 0x8e9ca8, { rough: 0.32, metal: 0.65 }),
      rubber = mat(THREE, 0x263541, { rough: 0.7, metal: 0 });
    const root3 = new THREE.Group();
    root3.add(mesh(THREE, new THREE.CylinderGeometry(9, 10, 8, 40), capM, 0, 4, 0));
    const L = o.L || [9, 42, 39, 10, 9, 7];
    const AX = [[0, 1, 0], [0, 0, 1], [0, 0, 1], [0, 0, 1], [1, 0, 0], [0, 1, 0]];
    const joints = [];
    let parent = root3;
    AX.forEach((ax, i) => {
      const j = new THREE.Group();
      j.position.set(0, i === 0 ? 8 : L[i - 1], 0);
      parent.add(j);
      const axis = new THREE.Vector3().fromArray(ax);
      const r = i < 3 ? 6.2 : 4.6, hous = mesh(THREE, new THREE.CylinderGeometry(r, r, r * 2.1, 32), white);
      if (ax[2]) hous.rotation.x = Math.PI / 2; else if (ax[0]) hous.rotation.z = Math.PI / 2;
      j.add(hous);
      const band = mesh(THREE, new THREE.CylinderGeometry(r * 1.01, r * 1.01, r * 0.35, 32), ringM);
      band.rotation.copy(hous.rotation); j.add(band);
      if (L[i] > 0) j.add(mesh(THREE, new THREE.CylinderGeometry(i < 3 ? 4.3 : 3.4, i < 3 ? 4.3 : 3.4, L[i], 28), white, 0, L[i] / 2, 0));
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), axis), radius = i < 3 ? 5.6 : 3.7;
      const seal = mesh(THREE, new THREE.TorusGeometry(radius, 0.22, 10, 40), rubber); seal.quaternion.copy(q); j.add(seal);
      const trim = mesh(THREE, new THREE.TorusGeometry(radius * 0.8, 0.12, 8, 36), metal); trim.quaternion.copy(q); j.add(trim);
      joints.push({ g: j, axis: axis, a: 0, min: -Math.PI * 1.9, max: Math.PI * 1.9 });
      parent = j;
    });
    const flange = new THREE.Group();
    flange.position.set(0, L[5], 0);
    flange.add(mesh(THREE, new THREE.CylinderGeometry(3.2, 3.2, 1.2, 28), capM, 0, 0.6, 0));
    parent.add(flange);

    function set(angles) {
      angles.forEach((a, i) => { joints[i].a = a; joints[i].g.quaternion.setFromAxisAngle(joints[i].axis, a); });
      root3.updateMatrixWorld(true);
    }
    const q = new THREE.Quaternion(), e = new THREE.Vector3(), u = new THREE.Vector3(), w = new THREE.Vector3(), cc = new THREE.Vector3();
    const O = joints.map(() => new THREE.Vector3()), A = joints.map(() => new THREE.Vector3());
    function solve(pts, iters, damp) {
      const lam2 = Math.pow(damp === undefined ? 2 : damp * 2.5, 2), n = joints.length, m = pts.length * 3;
      for (let it = 0; it < (iters || 8); it++) {
        joints.forEach((J, i) => { J.g.getWorldPosition(O[i]); J.g.getWorldQuaternion(q); A[i].copy(J.axis).applyQuaternion(q).normalize(); });
        const Jm = [], E = [];
        pts.forEach(P => {
          const k = Math.sqrt(P.w === undefined ? 1 : P.w);
          e.copy(P.p); flange.localToWorld(e);
          w.copy(P.t).sub(e);
          E.push(w.x * k, w.y * k, w.z * k);
          const rows = [[], [], []];
          for (let i = 0; i < n; i++) { cc.crossVectors(A[i], u.copy(e).sub(O[i])); rows[0].push(cc.x * k); rows[1].push(cc.y * k); rows[2].push(cc.z * k); }
          Jm.push(...rows);
        });
        const M = [];
        for (let r = 0; r < m; r++) { M.push([]); for (let tt = 0; tt < m; tt++) { let sum = r === tt ? lam2 : 0; for (let i = 0; i < n; i++) sum += Jm[r][i] * Jm[tt][i]; M[r].push(sum); } M[r].push(E[r]); }
        for (let cI = 0; cI < m; cI++) {
          let piv = cI; for (let r = cI + 1; r < m; r++) if (Math.abs(M[r][cI]) > Math.abs(M[piv][cI])) piv = r;
          const tmpRow = M[cI]; M[cI] = M[piv]; M[piv] = tmpRow;
          for (let r = 0; r < m; r++) { if (r === cI) continue; const f = M[r][cI] / M[cI][cI]; for (let tt = cI; tt <= m; tt++) M[r][tt] -= f * M[cI][tt]; }
        }
        let big = 0;
        const dq = joints.map((J, i) => { let sum = 0; for (let r = 0; r < m; r++) sum += Jm[r][i] * M[r][m] / M[r][r]; big = Math.max(big, Math.abs(sum)); return sum; });
        const sc = big > 0.25 ? 0.25 / big : 1;
        joints.forEach((J, i) => { J.a = Math.max(J.min, Math.min(J.max, J.a + dq[i] * sc)); J.g.quaternion.setFromAxisAngle(J.axis, J.a); });
        root3.updateMatrixWorld(true);
      }
    }
    const iq = new THREE.Quaternion(), Tl = new THREE.Vector3(), dl = new THREE.Vector3(), Wv = new THREE.Vector3(),
      X = new THREE.Vector3(), Z = new THREE.Vector3(), U = new THREE.Vector3();
    function reach(T, d, tipLen, elbow) {
      root3.updateMatrixWorld(true);
      Tl.copy(T); root3.worldToLocal(Tl);
      root3.getWorldQuaternion(iq); iq.invert();
      dl.copy(d).applyQuaternion(iq).normalize();
      Wv.copy(Tl).addScaledVector(dl, -((tipLen || 0) + L[5] + L[4]));
      const r = Math.hypot(Wv.x, Wv.z);
      if (r < 1e-3) return false;
      const psi = Math.atan2(-Wv.z, Wv.x);
      X.set(Math.cos(psi), 0, -Math.sin(psi)); Z.set(Math.sin(psi), 0, Math.cos(psi));
      const sphi = Math.max(-1, Math.min(1, dl.dot(Z))), phi = Math.asin(sphi), cphi = Math.cos(phi);
      U.copy(dl).addScaledVector(Z, -sphi).divideScalar(Math.max(1e-6, cphi));
      const ux = U.dot(X), uy = U.y, Th3 = Math.atan2(-ux, uy);
      const px = Wv.dot(X) - ux * L[3], py = Wv.y - uy * L[3] - (8 + L[0]);
      const l1 = L[1], l2 = L[2], D2 = px * px + py * py;
      const cz = (D2 - l1 * l1 - l2 * l2) / (2 * l1 * l2);
      if (cz > 1 || cz < -1) return false;
      const t2 = (elbow || 1) * Math.acos(cz);
      const t1 = Math.atan2(-px, py) - Math.atan2(l2 * Math.sin(t2), l1 + l2 * Math.cos(t2));
      set([psi, t1, t2, Th3 - t1 - t2, phi, joints[5].a]);
      return true;
    }
    set([0, 0, 0, 0, 0, 0]);
    return { root: root3, joints, flange, set, solve, reach };
  }

  // stylised synthetic skull (≈18 cm long), face toward +z. .mandible pivots about x at the condyles
  function skull(THREE, o) {
    o = o || {};
    const bone = o.bone || mat(THREE, 0xe5d6ba, { rough: 0.72, metal: 0 }), tooth = mat(THREE, 0xf7f1df, { rough: 0.3, metal: 0 }), shade = mat(THREE, 0x594b40, { rough: 0.95, metal: 0 });
    const root3 = new THREE.Group();
    root3.add(ell(THREE, bone, 0, 3.3, -1.6, 7.25, 7.5, 8.8));
    root3.add(ell(THREE, bone, 0, -3.7, 4.1, 4.6, 2.6, 3.6));
    [-1, 1].forEach(s => {
      const rimM = mesh(THREE, new THREE.TorusGeometry(1.8, 0.43, 14, 48), bone, s * 2.7, 0.5, 6.5); rimM.scale.set(1.12, 0.9, 0.68); rimM.rotation.y = s * 0.13; root3.add(rimM);
      root3.add(ell(THREE, shade, s * 2.7, 0.55, 6.05, 1.68, 1.38, 0.75));
      root3.add(tube(THREE, [[s * 1.05, 2.2, 6.2], [s * 3, 2.3, 6.3], [s * 4.8, 1.5, 5.6], [s * 5.5, -1.3, 4.6]], 0.48, bone));
      root3.add(tube(THREE, [[s * 4.9, -1.7, 5.5], [s * 6.4, -1.8, 3.7], [s * 6.8, -1.2, 0.8], [s * 6.3, -0.6, -1.5]], 0.56, bone));
      root3.add(ell(THREE, bone, s * 1.0, -0.7, 7.2, 0.65, 2.5, 0.9));
    });
    const cavity = mesh(THREE, new THREE.ConeGeometry(0.95, 2.5, 3), shade, 0, -2.45, 7.6); cavity.rotation.z = Math.PI; root3.add(cavity);
    root3.add(tube(THREE, [[-3.7, -5.7, 2.8], [-3.6, -5.7, 5.6], [0, -6.0, 7.5], [3.6, -5.7, 5.6], [3.7, -5.7, 2.8]], 0.58, bone));
    const mand = new THREE.Group(); mand.position.set(0, -3.2, -1.6); root3.add(mand);
    const arc = [[-5.3, 0, 0], [-5.3, -3.5, 0.6], [-4.7, -6.4, 1.6], [-4.0, -7.4, 4.6], [0, -8.0, 8.4], [4, -7.4, 4.6], [4.7, -6.4, 1.6], [5.3, -3.5, 0.6], [5.3, 0, 0]];
    mand.add(tube(THREE, arc, 0.84, bone, 80));
    [-1, 1].forEach(s => { mand.add(ell(THREE, bone, s * 5.3, 0, 0, 1.2, 0.8, 0.9)); mand.add(ell(THREE, bone, s * 4.8, -4.2, 1.2, 0.65, 2.9, 1.2)); });
    for (let i = 0; i < 14; i++) {
      const a = (i / 13 - 0.5) * Math.PI * 0.93, x = 3.35 * Math.sin(a), z = 3.1 + 4.55 * Math.cos(a);
      const index = Math.min(i, 13 - i), geo = toothGeometry(6 - index);
      const up = mesh(THREE, geo, tooth, x, -6.05, z); up.scale.set(0.43, 0.55, 0.45); up.rotation.y = -a; root3.add(up);
      const lo = mesh(THREE, geo.clone(), tooth, x, -3.9, z + 0.7); lo.scale.set(0.4, 0.5, 0.42); lo.rotation.y = -a; mand.add(lo);
    }
    root3.userData.synthetic = true;
    return { root: root3, mandible: mand };
  }

  // standing person (≈172 cm), feet at y=0, facing +z. gear: 'quest' | 'glasses' | 'hololens'
  function person(THREE, o) {
    o = o || {};
    const cloth = mat(THREE, o.color || 0x5f9ea0, { rough: 0.85 }), skin = mat(THREE, o.skin || 0xe7bf9f, { rough: 0.7 }),
      dk = mat(THREE, 0x2d3440, { rough: 0.5 });
    const root3 = new THREE.Group();
    [-1, 1].forEach(s => {
      root3.add(mesh(THREE, new THREE.CylinderGeometry(6.2, 5.2, 80, 20), cloth, s * 8.5, 42, 0));
      root3.add(mesh(THREE, rbox(THREE, 10, 6, 24, 2.5), dk, s * 8.5, 3, 4));
    });
    root3.add(mesh(THREE, rbox(THREE, 36, 54, 22, 9), cloth, 0, 108, 0));
    root3.add(mesh(THREE, new THREE.CylinderGeometry(5, 5.5, 10, 16), skin, 0, 139, 0));
    const head = new THREE.Group(); head.position.set(0, 155, 0); root3.add(head);
    const hd = mesh(THREE, headGeometry(), skin); hd.scale.set(9.5, 11.2, 10.5); head.add(hd);
    if (o.cap !== false) { const cp = mesh(THREE, new THREE.SphereGeometry(10.4, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), mat(THREE, o.capColor || o.color || 0x5f9ea0, { rough: 0.9 }), 0, 1.5, -0.5); cp.scale.set(0.95, 1.12, 1.05); head.add(cp); }
    head.add(faceDetails(o.skin));
    const eye = new THREE.Object3D(); eye.position.set(0, 3, 10.5); head.add(eye);
    if (o.gear === 'quest') {
      head.add(mesh(THREE, rbox(THREE, 19, 10, 9, 3), mat(THREE, 0xf2f4f7, { rough: 0.4 }), 0, 2.5, 11.5));
      head.add(mesh(THREE, rbox(THREE, 17, 7, 0.6, 2), dk, 0, 2.5, 16.1));
      const st = mesh(THREE, new THREE.TorusGeometry(10.6, 0.9, 8, 40), dk, 0, 3, 0); st.rotation.x = Math.PI / 2; head.add(st);
    } else if (o.gear === 'glasses') {
      head.add(mesh(THREE, rbox(THREE, 16, 3.6, 1.4, 0.7), mat(THREE, 0x1b2230, { rough: 0.2, metal: 0.3 }), 0, 3, 11.2));
      [-1, 1].forEach(s => head.add(mesh(THREE, rbox(THREE, 0.8, 1.2, 11, 0.3), dk, s * 8, 3.3, 5.6)));
    } else if (o.gear === 'hololens') {
      head.add(mesh(THREE, rbox(THREE, 19, 7, 6, 2.5), mat(THREE, 0x1b2230, { rough: 0.1, metal: 0.4, opacity: 0.85 }), 0, 2.5, 11));
      const band = mesh(THREE, new THREE.TorusGeometry(10.8, 1.3, 8, 40), mat(THREE, 0x3d4756, { rough: 0.5 }), 0, 6.5, 0); band.rotation.x = Math.PI / 2 - 0.15; head.add(band);
    }
    const trim = mat(THREE, 0xd2e2e4, { rough: 0.8, metal: 0 }), glove = mat(THREE, 0xc8dfdf, { rough: 0.62, metal: 0 });
    root3.add(tube(THREE, [[-8, 134, 9.6], [0, 124, 12], [8, 134, 9.6]], 0.4, trim, 18));
    root3.add(mesh(THREE, rbox(THREE, 8, 9, 0.5, 1), mat(THREE, o.color || 0x5f9ea0, { rough: 0.9, metal: 0 }), -8, 112, 11.3));
    function limb(x) {
      const sh = new THREE.Group(); sh.position.set(x, 131, 0);
      sh.add(mesh(THREE, new THREE.SphereGeometry(5.6, 16, 12), cloth));
      sh.add(mesh(THREE, new THREE.CylinderGeometry(4.8, 4.2, 28, 14), cloth, 0, -14, 0));
      const el = new THREE.Group(); el.position.set(0, -28, 0); sh.add(el);
      el.add(mesh(THREE, new THREE.CylinderGeometry(3.8, 3.2, 26, 14), skin, 0, -13, 0));
      const hand = new THREE.Object3D(); hand.position.set(0, -28, 0); el.add(hand);
      el.add(mesh(THREE, new THREE.SphereGeometry(3.6, 14, 10), skin, 0, -28, 0));
      el.add(mesh(THREE, new THREE.CylinderGeometry(3.4, 3.4, 2.4, 24), glove, 0, -24, 0));
      for (let i = 0; i < 4; i++) el.add(ell(THREE, glove, -2.1 + i * 1.4, -30.4, 0, 0.65, 2.8, 1.0));
      root3.add(sh);
      return { sh, el, hand };
    }
    return { root: root3, head, eye, armL: limb(-22), armR: limb(22) };
  }

  // two-armed mobile humanoid (generic), facing +z. .cam = head stereo camera (+z), arms {sh, el, hand}
  function humanoid(THREE) {
    const wh = mat(THREE, 0xe9edf2, { rough: 0.35 }), dk = mat(THREE, 0x2d3440, { rough: 0.45, metal: 0.25 }),
      ac = mat(THREE, 0x1e5aa8, { rough: 0.4 }), glass = mat(THREE, 0x0a0f18, { rough: 0.08, metal: 0.3 });
    const root3 = new THREE.Group();
    root3.add(mesh(THREE, rbox(THREE, 56, 22, 62, 8), wh, 0, 17, 0));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => root3.add(mesh(THREE, new THREE.CylinderGeometry(7, 7, 6, 24), dk, sx * 25, 7, sz * 20).rotateZ(Math.PI / 2)));
    root3.add(mesh(THREE, rbox(THREE, 16, 58, 16, 4), dk, 0, 56, -4));
    root3.add(mesh(THREE, rbox(THREE, 40, 42, 26, 7), wh, 0, 104, 0));
    root3.add(mesh(THREE, rbox(THREE, 41, 4, 27, 1.5), ac, 0, 112, 0));
    const head = new THREE.Group(); head.position.set(0, 140, 2); root3.add(head);
    head.add(mesh(THREE, new THREE.CylinderGeometry(3.5, 3.5, 10, 14), dk, 0, -9, 0));
    head.add(mesh(THREE, rbox(THREE, 24, 16, 18, 5), wh));
    head.add(mesh(THREE, rbox(THREE, 20, 7, 1, 2), glass, 0, 1, 9.1));
    [-5, 5].forEach(x => head.add(mesh(THREE, new THREE.CylinderGeometry(1.6, 1.6, 1, 16), mat(THREE, 0x00b7ff, { emissive: 0x00648c }), x, 1, 9.7).rotateX(Math.PI / 2)));
    const camO = new THREE.Object3D(); camO.position.set(0, 1, 10); head.add(camO);
    function limb(x) {
      const sh = new THREE.Group(); sh.position.set(x, 118, 0);
      sh.add(mesh(THREE, new THREE.SphereGeometry(6, 18, 12), dk));
      sh.add(mesh(THREE, new THREE.CylinderGeometry(4.2, 4.2, 28, 18), wh, 0, -14, 0));
      const el = new THREE.Group(); el.position.set(0, -28, 0); sh.add(el);
      el.add(mesh(THREE, new THREE.SphereGeometry(4.6, 16, 12), dk));
      el.add(mesh(THREE, new THREE.CylinderGeometry(3.6, 3.6, 24, 18), wh, 0, -12, 0));
      const hand = new THREE.Group(); hand.position.set(0, -26, 0); el.add(hand);
      hand.add(mesh(THREE, rbox(THREE, 7, 4, 5, 1.2), dk));
      [-1, 1].forEach(s => hand.add(mesh(THREE, rbox(THREE, 1.4, 7, 3, 0.5), dk, s * 2.6, -5, 0)));
      root3.add(sh);
      return { sh, el, hand };
    }
    return { root: root3, head, cam: camO, armL: limb(-26), armR: limb(26) };
  }

  // operating table, top surface at y = topY, length along z
  function orTable(THREE, floorY, topY, len) {
    len = len || 200;
    const g = new THREE.Group(), steel = mat(THREE, 0xa3afc0, { rough: 0.35, metal: 0.5 }), metal = mat(THREE, 0xa8b2ba, { rough: 0.26, metal: 0.8 });
    g.add(mesh(THREE, rbox(THREE, 56, 8, 80, 3), steel, 0, floorY + 4, 0));
    const h = topY - 10 - floorY - 8;
    g.add(mesh(THREE, rbox(THREE, 26, h, 34, 4), steel, 0, floorY + 8 + h / 2, 0));
    g.add(mesh(THREE, rbox(THREE, 58, 4, len, 1.5), mat(THREE, 0x6b7a90, { rough: 0.4, metal: 0.3 }), 0, topY - 8, 0));
    g.add(mesh(THREE, rbox(THREE, 54, 6, len - 4, 2.5), mat(THREE, 0x2f4058, { rough: 0.8 }), 0, topY - 3, 0));
    [-1, 1].forEach(s => {
      g.add(mesh(THREE, rbox(THREE, 2.5, 3, 130, 0.8), metal, s * 29, topY - 5, 0));
      [-45, 45].forEach(z => g.add(mesh(THREE, new THREE.CylinderGeometry(3.2, 3.2, 5, 20), metal, s * 22, floorY + 4, z).rotateZ(Math.PI / 2)));
    });
    return g;
  }

  // CT-like slice texture drawn on a canvas: dark field, bright bone ring, grey tissue (seeded noise)
  function ctTex(THREE, kind) {
    const c = doc.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    let sd = 11; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    x.fillStyle = '#05070a'; x.fillRect(0, 0, 128, 128);
    const el = (cx, cy, rx, ry, fillC, stroke, lw) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); if (fillC) { x.fillStyle = fillC; x.fill(); } if (stroke) { x.lineWidth = lw; x.strokeStyle = stroke; x.stroke(); } };
    if (kind === 'sag') { el(60, 56, 44, 40, '#6b6f75', '#f2efe6', 5); el(92, 92, 18, 14, '#7a7e84', '#f2efe6', 4); }
    else if (kind === 'cor') { el(64, 58, 42, 44, '#6b6f75', '#f2efe6', 5); el(46, 70, 9, 8, '#111', null); el(82, 70, 9, 8, '#111', null); }
    else { el(64, 64, 40, 48, '#6b6f75', '#f2efe6', 6); el(64, 64, 22, 30, '#7d8187', null); }
    for (let i = 0; i < 600; i++) { x.fillStyle = 'rgba(255,255,255,' + (rnd() * 0.06) + ')'; x.fillRect(rnd() * 128, rnd() * 128, 2, 2); }
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  // CT volume: cyan box edges + faint fill + three orthogonal slices (axial xz, coronal xy, sagittal yz)
  function ctVolume(THREE, w, h, d, opacity) {
    const g = new THREE.Group();
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), new THREE.LineBasicMaterial({ color: 0x00b7ff, transparent: true, opacity: 0.9 })));
    g.add(mesh(THREE, new THREE.BoxGeometry(w, h, d), mat(THREE, 0x00b7ff, { opacity: 0.06, rough: 1 })));
    const op = opacity === undefined ? 0.8 : opacity;
    const sl = (geo, kind) => {
      const m = new THREE.MeshBasicMaterial({ map: ctTex(THREE, kind), transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false });
      m.userData.lin = true;
      const p = new THREE.Mesh(geo, m); p.userData.noShadow = true; g.add(p); return p;
    };
    const ax = sl(new THREE.PlaneGeometry(w, d), 'ax'); ax.rotation.x = -Math.PI / 2;
    const co = sl(new THREE.PlaneGeometry(w, h), 'cor');
    const sa = sl(new THREE.PlaneGeometry(d, h), 'sag'); sa.rotation.y = Math.PI / 2;
    g.slices = [ax, co, sa];
    return g;
  }

  // point cloud from a Float32Array of xyz
  function cloud(THREE, pts, color, size) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({ color: color, size: size || 1.5 }));
  }

  // labels created from scene code (removed again when the figure is released):
  // list = [{t: 'text' | {ko, en}, c: 's c', at: [x,y,z]} | {t, c, obj: 'anchorName', off: [x,y,z]}, ph: '1 3'?]
  function labels(box, list) {
    const gen = [];
    list.forEach(l => {
      const d = doc.createElement('div');
      d.className = 'lb ' + (l.c || '');
      d.dataset.gen = '1';
      if (l.at) d.dataset.at = l.at.join(',');
      if (l.obj) d.dataset.obj = l.obj;
      if (l.off) d.dataset.off = l.off.join(',');
      if (l.mode) d.dataset.mode = l.mode;
      if (l.ph !== undefined) d.dataset.ph = String(l.ph);
      d.innerHTML = t(l.t);
      d.classList.add('off');
      gen.push(d);
    });
    // list order = layout priority: keep them in that order, before any hand-written labels
    gen.reverse().forEach(d => box.insertBefore(d, box.firstChild));
  }

  // set opacity of every material under obj (dimming); remembers the original
  function fade(obj, k) {
    obj.traverse(o => {
      if (!o.material) return;
      [].concat(o.material).forEach(m => {
        if (m.userData.op0 === undefined) { m.userData.op0 = m.transparent ? m.opacity : 1; m.userData.tr0 = m.transparent; m.userData.dw0 = m.depthWrite; }
        m.transparent = m.userData.tr0 || k < 0.999;
        m.opacity = m.userData.op0 * k;
        m.depthWrite = k < 0.999 ? false : m.userData.dw0;
      });
    });
  }

  // de-emphasise without transparency: colours drift toward a neutral grey and emissive dims (k = 1 normal, 0 muted)
  const MUTE = { r: 0.56, g: 0.62, b: 0.7 };
  function mute(obj, k) {
    obj.traverse(o => {
      if (!o.material || o.isLine || o.isPoints) return;
      [].concat(o.material).forEach(m => {
        if (!m.color) return;
        if (!m.userData.c0) { m.userData.c0 = m.color.clone(); if (m.emissive) m.userData.e0 = m.emissive.clone(); }
        const c0 = m.userData.c0, u = 1 - k;
        m.color.setRGB(c0.r + (MUTE.r - c0.r) * u * 0.8, c0.g + (MUTE.g - c0.g) * u * 0.8, c0.b + (MUTE.b - c0.b) * u * 0.8);
        if (m.emissive && m.userData.e0) m.emissive.copy(m.userData.e0).multiplyScalar(k);
      });
    });
  }

  const api = {
    register: register, scan: scan, t: t, lang: lang, layout: Layout, registry: registry,
    // live state for QA and the capture script
    get liveCount() { let n = 0; states.forEach(state => { if (state.live) n += 1; }); return n; },
    get threeState() { return threeState; },
    mat: mat, mesh: mesh, rbox: rbox, outline: outline, linac: linac, patient: patient, col: col, arrow: arrow, cam: cam,
    V3: V3, axes: axes, marker4: marker4, skadiCam: skadiCam, frustum: frustum, dashLink: dashLink, segs: segs, arm6: arm6,
    skull: skull, person: person, humanoid: humanoid, orTable: orTable, ctTex: ctTex, ctVolume: ctVolume, cloud: cloud,
    labels: labels, fade: fade, mute: mute, headGeometry: headGeometry, faceDetails: faceDetails, toothGeometry: toothGeometry
  };
  root.Scene3D = api;
  root.Deck3D = api;            // deck scene files port with minimal edits
  root.Deck3DLayout = Layout;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
