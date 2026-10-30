/* ms-frac: mandibular fracture reduction as a planning-simulation concept (synthetic geometry, no patient data).
 * Loop (8 s): features on teeth and the fracture surface -> iterative pose optimization -> occlusion-based
 * reduction -> surface-distance colour, then the fragment drifts back. The mandible body and ramus are swept
 * from a flat cross-section so they read as a mandible rather than a round tube.
 */
(function (S) {
  'use strict';
  if (!S) return;
  S.register('ms-frac', {
    target: [0.4, -3.8, 3.5], dist: 30, yaw: 0.5, pitch: 0.3, fov: 30, autoYaw: 0.015, stillTime: 2.2,
    fit: { box: [[-6.4, -7.8, -1.6], [7.4, 2.2, 10]], fill: 0.92, pad: [18, 0, -14, 0] },
    build(scene, THREE, box) {
      const D = S, V = (a) => new THREE.Vector3().fromArray(a);
      const mpts = [[-5.3, 0.6, 0], [-5.1, -2.6, 0.3], [-4.8, -4.6, 1.4], [-4.1, -5.6, 4.4], [-2.3, -6.0, 7.6], [0, -6.2, 8.7], [2.3, -6.0, 7.6], [4.1, -5.6, 4.4], [4.8, -4.6, 1.4], [5.1, -2.6, 0.3], [5.3, 0.6, 0]].map(V);
      const curve = new THREE.CatmullRomCurve3(mpts);
      const N = 110, K = 66;
      const pts = curve.getPoints(N);
      const F = pts[K].clone();                                         // fracture point on the body
      const tan = pts[K + 1].clone().sub(pts[K - 1]).normalize();

      const arc = (y, zb, zf, xw) => new THREE.CatmullRomCurve3([[-xw, y, zb], [-xw * 0.85, y, (zb + zf) / 2], [-xw * 0.45, y, zf - 0.6], [0, y, zf], [xw * 0.45, y, zf - 0.6], [xw * 0.85, y, (zb + zf) / 2], [xw, y, zb]].map(V));

      const mA = D.mat(THREE, 0x1e5aa8, { rough: 0.5 }), mB = D.mat(THREE, 0x2fa36b, { rough: 0.5 });
      const mX = D.mat(THREE, 0xd3dae5, { rough: 0.5, opacity: 0.8 }), mT = D.mat(THREE, 0xfbfaf4, { rough: 0.35 });
      const lmk = new THREE.MeshBasicMaterial({ color: 0xe5484d, transparent: true, toneMapped: false });
      const fxm = new THREE.MeshBasicMaterial({ color: 0x00b7ff, transparent: true, toneMapped: false });

      // cross-section sweep: S = lateral direction, U = T × S (height on the body, depth on the ramus)
      const HW = 0.55, HH = 1.4, SEG = 22;
      const frames = pts.map((p, i) => {
        const T = pts[Math.min(N, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize();
        const lat = new THREE.Vector3(p.x, 0, p.z - 2.0);
        const Sv = lat.addScaledVector(T, -lat.dot(T)).normalize(), U = new THREE.Vector3().crossVectors(T, Sv).normalize();
        const bodyK = Math.max(0, Math.min(1, (-p.y - 3.6) / 1.4));   // body: lower the section so its top sits under the teeth
        return { p, S: Sv, U, h: HH * (1 - 0.1 * bodyK), off: -0.35 * bodyK };
      });
      const ring = (f, k, org) => {
        const a = k / SEG * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        const x = Math.sign(c) * Math.pow(Math.abs(c), 0.6) * HW, y = Math.sign(s) * Math.pow(Math.abs(s), 0.6) * f.h;
        const up = f.U.y >= 0 ? 1 : -1;
        return f.p.clone().sub(org).addScaledVector(f.S, x).addScaledVector(f.U, up * (y + f.off));
      };
      function sweep(i0, i1, org) {
        const P = [], I = [];
        for (let i = i0; i <= i1; i++) for (let k = 0; k < SEG; k++) P.push(ring(frames[i], k, org));
        const n = i1 - i0;
        for (let i = 0; i < n; i++) for (let k = 0; k < SEG; k++) {
          const a = i * SEG + k, b = i * SEG + (k + 1) % SEG, c = a + SEG, d = b + SEG;
          I.push(a, c, b, b, c, d);
        }
        const g = new THREE.BufferGeometry().setFromPoints(P); g.setIndex(I); g.computeVertexNormals();
        return g;
      }
      function cap(i, org, flip) {
        const P = [frames[i].p.clone().sub(org)], I = [];
        for (let k = 0; k < SEG; k++) P.push(ring(frames[i], k, org));
        for (let k = 0; k < SEG; k++) { if (flip) I.push(0, 1 + (k + 1) % SEG, 1 + k); else I.push(0, 1 + k, 1 + (k + 1) % SEG); }
        const g = new THREE.BufferGeometry().setFromPoints(P); g.setIndex(I); g.computeVertexNormals();
        return g;
      }
      // mandible: A (fixed) + B (fracture fragment, a group whose origin is the fracture point F)
      const root = new THREE.Group(); scene.add(root);
      const O0 = new THREE.Vector3();
      const tubeA = new THREE.Mesh(sweep(0, K, O0), mA);
      const tubeB = new THREE.Mesh(sweep(K, N, F), mB);
      const bG = new THREE.Group(); bG.add(tubeB); root.add(tubeA, bG);
      root.add(new THREE.Mesh(cap(0, O0, true), mA)); bG.add(new THREE.Mesh(cap(N, F, false), mB));
      // condyle and coronoid process at the end of each ramus
      [[0, root, O0, mA], [N, bG, F, mB]].forEach(([i, g, org, m]) => {
        const f = frames[i], top = f.p.clone().sub(org);
        const back = f.U.y >= 0 ? f.U.clone() : f.U.clone().negate();
        const fz = back.z < 0 ? back : back.clone().negate();
        const cond = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), m); cond.scale.set(1.0, 0.55, 0.62);
        cond.position.copy(top).addScaledVector(fz, 0.75).add(new THREE.Vector3(0, 0.35, 0)); g.add(cond);
        const cor = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), m); cor.scale.set(0.42, 1.05, 0.55);
        cor.position.copy(top).addScaledVector(fz, -0.9).add(new THREE.Vector3(0, 0.35, 0)); g.add(cor);
      });

      // fracture surfaces: section caps + eight feature points on each side
      const capA = new THREE.Mesh(cap(K, O0, false), mA), capB = new THREE.Mesh(cap(K, F, true), mB);
      root.add(capA); bG.add(capB);
      const fxA = [], fxB = [], dg = new THREE.SphereGeometry(0.2, 12, 8);
      for (let i = 0; i < 8; i++) {
        const k = Math.round(i / 8 * SEG), pa = ring(frames[K], k, O0).lerp(F, 0.25), pb = ring(frames[K], k, F).multiplyScalar(0.75);
        const n = tan.clone().multiplyScalar(0.02);
        const da = new THREE.Mesh(dg, fxm); da.position.copy(pa).sub(n); root.add(da); fxA.push(da);
        const db = new THREE.Mesh(dg, fxm); db.position.copy(pb).add(n); bG.add(db); fxB.push(db);
      }

      // dental arches: lower (split between A and B) and upper (maxilla, the reference)
      const lowRow = arc(-4.4, 2.8, 8.0, 3.5).getPoints(11), upRow = arc(-3.2, 2.4, 8.4, 3.75).getPoints(11);
      const tg = D.toothGeometry(4).scale(0.46, 0.50, 0.46), lg = new THREE.SphereGeometry(0.2, 10, 8);
      lowRow.forEach(p => {
        const inB = p.clone().sub(F).dot(tan) > 0;
        const tooth = new THREE.Mesh(tg, mT), l = new THREE.Mesh(lg, lmk);
        const q = inB ? p.clone().sub(F) : p;
        tooth.position.copy(q); l.position.copy(q).add(new THREE.Vector3(0, 0.48, 0));
        (inB ? bG : root).add(tooth, l);
      });
      const maxi = new THREE.Group(); root.add(maxi);
      upRow.forEach(p => {
        const tooth = new THREE.Mesh(tg, mT), l = new THREE.Mesh(lg, lmk);
        tooth.position.copy(p); l.position.copy(p).add(new THREE.Vector3(0, -0.48, 0));
        maxi.add(tooth, l);
      });
      maxi.add(new THREE.Mesh(new THREE.TubeGeometry(arc(-2.4, 2.4, 8.4, 3.85), 40, 0.55, 8), mX));

      // surface-distance colour: high near the fracture line, low elsewhere (blue -> cyan -> green -> yellow -> red)
      const stops = [[0, [44, 79, 214]], [0.35, [30, 182, 217]], [0.6, [107, 209, 111]], [0.8, [242, 201, 76]], [1, [229, 72, 77]]];
      const lin = (c) => Math.pow(c / 255, 2.2);
      const heat = (h) => {
        for (let i = 1; i < stops.length; i++) if (h <= stops[i][0]) { const a = stops[i - 1], b = stops[i], k = (h - a[0]) / (b[0] - a[0]); return a[1].map((v, j) => lin(v + (b[1][j] - v) * k)); }
        return stops[4][1].map(lin);
      };
      function heatMesh(tubeMesh, org) {
        const g = tubeMesh.geometry.clone(), p = g.attributes.position, c = new Float32Array(p.count * 3), v = new THREE.Vector3();
        for (let i = 0; i < p.count; i++) {
          v.fromArray(p.array, i * 3); const r = v.clone().add(org).sub(F).length();
          const h = Math.min(1, 0.08 + 0.78 * Math.exp(-Math.pow(r / 2.6, 2)) + 0.1 * (0.5 + 0.5 * Math.sin(v.y * 3 + v.x * 1.7)));
          heat(h).forEach((x, j) => { c[i * 3 + j] = x; });
        }
        g.setAttribute('color', new THREE.BufferAttribute(c, 3));
        const m = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
        const o = new THREE.Mesh(g, m); o.userData.noShadow = true; return o;
      }
      const hA = heatMesh(tubeA, new THREE.Vector3()), hB = heatMesh(tubeB, new THREE.Vector3());
      root.add(hA); bG.add(hB);

      // correspondence lines between the fracture-surface feature pairs during optimization
      const links = D.segs(THREE, 8, 0x00b7ff, 0.8); scene.add(links);

      D.labels(box, [
        { t: { ko: '골절편', en: 'Fracture fragment' }, c: 's c', obj: 'B', off: [2.4, -0.4, -4.2] },
        { t: { ko: '상악 치열(기준)', en: 'Upper dentition (reference)' }, c: 's n', obj: 'maxi', off: [-3.4, -2.4, 6.6] }
      ]);
      const read = box.querySelector('.readout');
      const steps = [
        S.t({ ko: '① 특징점: 치아와 골절 단면', en: '① Features: teeth and fracture surfaces' }),
        S.t({ ko: '② 골절편 위치 최적화', en: '② Fragment pose optimization' }),
        S.t({ ko: '③ 교합 기준 정복', en: '③ Occlusion-based reduction' }),
        S.t({ ko: '④ 표면 거리 비교', en: '④ Surface-distance check' })
      ];

      // displacement before reduction (fragment translation + rotation)
      const OFF = new THREE.Vector3(1.9, 1.0, 1.5), ROT = new THREE.Vector3(0.1, -0.24, 0.13);
      const sm = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
      const ramp = (t, a, b) => sm((t - a) / (b - a));
      const U = [1, 0.62, 0.38, 0.2, 0.09, 0.03, 0];
      const wa = new THREE.Vector3(), wb = new THREE.Vector3();
      let last = '';
      return {
        anchors: { B: bG, maxi },
        tick(s) {
          const t = s % 8;
          let u;
          if (t < 1.8) u = 1;
          else if (t < 4.8) { const x = (t - 1.8) / 0.5, i = Math.min(5, Math.floor(x)); u = U[i] + (U[i + 1] - U[i]) * sm(x - i); }
          else if (t < 7.4) u = 0;
          else u = sm((t - 7.4) / 0.6);
          bG.position.copy(F).addScaledVector(OFF, u);
          bG.rotation.set(ROT.x * u, ROT.y * u, ROT.z * u);
          bG.updateMatrixWorld(true);
          lmk.opacity = Math.min(ramp(t, 0.1, 0.8), 1 - ramp(t, 7.3, 7.8));
          fxm.opacity = Math.min(ramp(t, 0.6, 1.2), 1 - ramp(t, 7.3, 7.8));
          links.material.opacity = 0.8 * ramp(t, 1.2, 1.8) * (1 - ramp(t, 4.8, 5.4));
          for (let i = 0; i < 8; i++) { fxA[i].getWorldPosition(wa); fxB[i].getWorldPosition(wb); links.set(i, wa, wb); }
          const h = ramp(t, 5.5, 6.0) * (1 - ramp(t, 7.0, 7.4));
          hA.material.opacity = h; hB.material.opacity = h;
          if (read) {
            const m = t < 1.8 ? steps[0] : t < 4.8 ? steps[1] : t < 5.5 ? steps[2] : t < 7.2 ? steps[3] : '';
            if (m !== last) { read.textContent = m; last = m; }
          }
        }
      };
    }
  });
})(typeof window !== 'undefined' ? window.Scene3D : null);
