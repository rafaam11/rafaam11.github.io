/* foaa: digital occlusion workflow (procedural geometry only, no patient data).
 * Left: a synthetic skull whose mandible follows the occlusion. Right: the same dentition enlarged.
 * Loop (11 s): (1) 15 upper + 15 lower tooth landmarks -> (2) occlusal alignment: automatic occlusion and
 * 6-DOF adjustment of the lower dentition -> (3) occlusion evaluation: contact state and distance colour.
 * Upper dentition fixed, lower dentition moves. Units mm, front = +z, up = +y.
 */
(function (S) {
  'use strict';
  if (!S) return;
  S.register('foaa', {
    target: [0, -14, 0], dist: 740, yaw: 0, pitch: 0.2, fov: 22, autoYaw: 0.01, ground: false, stillTime: 9.6,
    fit: { box: [[-205, -60, -50], [288, 104, 80]], fill: 0.98, pad: [6, 0, 0, 0] },
    build(scene, THREE, box) {
      const D = S, V = (x, y, z) => new THREE.Vector3(x, y, z);
      const sm = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
      const lin = hex => new THREE.Color(hex).convertSRGBToLinear();
      const bone = D.mat(THREE, 0xe8dcc3, { rough: 0.62 }), boneMx = D.mat(THREE, 0xead9b8, { rough: 0.6 }), boneMn = D.mat(THREE, 0xe9d6b2, { rough: 0.6 });
      const dark = D.mat(THREE, 0x544a40, { rough: 1 }), enamel = D.mat(THREE, 0xf7f4ec, { rough: 0.28 });
      const ell = (m, sx, sy, sz, x, y, z, seg) => { const o = D.mesh(THREE, new THREE.SphereGeometry(1, seg || 32, seg ? Math.round(seg * 0.7) : 22), m, x, y, z); o.scale.set(sx, sy, sz); return o; };

      // ---- teeth: procedural crowns per tooth type
      const TYPES = {
        U: [
          { k: 'I', w: 8.6, d: 7.0, h: 10.5, thin: 0.7 },
          { k: 'I', w: 6.6, d: 6.0, h: 9.0, thin: 0.7 },
          { k: 'C', w: 7.6, d: 8.0, h: 10.0, thin: 0.45, c: 2.4, cusps: [[0, 0.15, 1]] },
          { k: 'P', w: 7.0, d: 9.0, h: 9.4, c: 2.0, cusps: [[0, 0.42, 1], [0, -0.42, 0.9]] },
          { k: 'P', w: 6.6, d: 9.0, h: 9.2, c: 1.9, cusps: [[0, 0.42, 1], [0, -0.42, 0.95]] },
          { k: 'M', w: 10.2, d: 11.0, h: 9.0, c: 1.9, cusps: [[0.45, 0.44, 1], [-0.45, 0.44, 0.9], [0.4, -0.44, 1.05], [-0.48, -0.44, 0.75]], lm: [1, 0, 2] },
          { k: 'M', w: 9.2, d: 10.6, h: 8.8, c: 1.8, cusps: [[0.45, 0.44, 1], [-0.45, 0.44, 0.85], [0.4, -0.44, 1.0], [-0.5, -0.44, 0.6]], lm: [1, 0, 2] }
        ],
        L: [
          { k: 'I', w: 5.4, d: 6.0, h: 9.0, thin: 0.65 },
          { k: 'I', w: 5.9, d: 6.2, h: 9.2, thin: 0.65 },
          { k: 'C', w: 7.0, d: 7.6, h: 10.0, thin: 0.45, c: 2.3, cusps: [[0, 0.1, 1]] },
          { k: 'P', w: 7.0, d: 7.6, h: 9.4, c: 2.0, cusps: [[0, 0.4, 1], [0, -0.42, 0.55]] },
          { k: 'P', w: 7.1, d: 8.0, h: 9.2, c: 1.9, cusps: [[0, 0.4, 1], [0, -0.42, 0.8]] },
          { k: 'M', w: 11.2, d: 10.4, h: 9.0, c: 1.8, cusps: [[0.5, 0.44, 1], [0.0, 0.48, 0.95], [-0.62, 0.3, 0.8], [0.45, -0.44, 1.05], [-0.4, -0.44, 1.0]], lm: [1, 0, 3] },
          { k: 'M', w: 10.6, d: 10.0, h: 8.8, c: 1.7, cusps: [[0.45, 0.44, 1], [-0.45, 0.44, 0.9], [0.45, -0.44, 1.0], [-0.45, -0.44, 0.9]], lm: [1, 0, 2] }
        ]
      };
      // arch x = W sin(th), z = F - Dp (1 - cos(th)); the upper arch is wider and slightly ahead
      const ARCH = { U: { W: 27.5, Dp: 31, F: 3.2, tip: -1.2, inc: -2.4 }, L: { W: 25.2, Dp: 29.5, F: 0, tip: 0.4, inc: 0.4 } };
      const archAt = (A, th, k) => V((k || 1) * A.W * Math.sin(th), 0, A.F - (k || 1) * A.Dp * (1 - Math.cos(th)));
      const archTan = (A, th) => V(A.W * Math.cos(th), 0, -A.Dp * Math.sin(th)).normalize();
      function thetaAtLength(A, s) {
        let th = 0, acc = 0; const dt = 0.002;
        while (acc < s && th < 2) { acc += archAt(A, th).distanceTo(archAt(A, th + dt)); th += dt; }
        return th;
      }
      function crown(T, c0, tan, occ, buc, ms) {
        const g = new THREE.SphereGeometry(1, 36, 24);
        const pos = g.attributes.position, hx = T.w / 2, hz = T.d / 2, H = T.h, cH = T.c || 0;
        const sig = T.k === 'C' ? 0.42 : T.k === 'P' ? 0.34 : 0.27, u0 = [];
        for (let i = 0; i < pos.count; i++) {
          const nx = pos.getX(i), ny = pos.getY(i), nz = pos.getZ(i), u = (ny + 1) / 2;
          const taper = 0.74 + 0.26 * sm(0, 0.7, u), thin = 1 - (T.thin || 0) * Math.pow(Math.max(0, u - 0.25) / 0.75, 1.4);
          const x = Math.sign(nx) * Math.pow(Math.abs(nx), 0.55) * hx * taper, z = Math.sign(nz) * Math.pow(Math.abs(nz), 0.6) * hz * taper * thin;
          let y = ((ny > 0 ? Math.pow(ny, 0.45) : ny) - 1) / 2 * H;
          const w = sm(0.3, 0.85, ny);
          if (T.cusps) {
            let b = 0;
            T.cusps.forEach(([cx, cz, a]) => { const dx = (x - cx * hx) / (sig * hx * 2), dz = (z - cz * hz) / (sig * hz * 2); b = Math.max(b, a * Math.exp(-(dx * dx + dz * dz) * 2)); });
            y -= w * cH * (1 - b);
          } else y -= w * 0.9 * Math.pow(Math.abs(x) / hx, 4);
          u0.push(y);
          const p = c0.clone().addScaledVector(tan, x * ms).addScaledVector(occ, y).addScaledVector(buc, z);
          pos.setXYZ(i, p.x, p.y, p.z);
        }
        if (new THREE.Matrix3().set(tan.x, occ.x, buc.x, tan.y, occ.y, buc.y, tan.z, occ.z, buc.z).determinant() < 0) {
          const idx = g.index.array;
          for (let i = 0; i < idx.length; i += 3) { const t = idx[i]; idx[i] = idx[i + 2]; idx[i + 2] = t; }
        }
        g.computeVertexNormals();
        g.userData.u = u0;
        g.userData.tips = (T.cusps || []).map(([cx, cz]) => c0.clone().addScaledVector(tan, cx * hx * ms).addScaledVector(buc, cz * hz).addScaledVector(occ, 0.15));
        g.userData.edge = c0.clone().addScaledVector(tan, (hx - 0.4) * ms).addScaledVector(occ, -0.2).addScaledVector(buc, hz * 0.3 * (1 - (T.thin || 0)) + 0.2);
        return g;
      }
      // 15 landmarks per dentition: molar and premolar cusps, canines and the incisal midpoint
      function dentition(key) {
        const A = ARCH[key], types = TYPES[key], occ = V(0, key === 'U' ? -1 : 1, 0), geos = [], per = { '-1': [], '1': [] };
        let thEnd = 0;
        [-1, 1].forEach(side => {
          let s = 0;
          types.forEach(T => {
            const th = side * thetaAtLength(A, s + T.w / 2 + 0.15); s += T.w + 0.3;
            const tan = archTan(A, th), buc = V(-tan.z, 0, tan.x);
            const geo = crown(T, archAt(A, th).setY(T.k === 'I' ? A.inc : A.tip), tan, occ, buc, side > 0 ? -1 : 1);
            geos.push(geo); per[side].push(geo.userData);
          });
          thEnd = thetaAtLength(A, s + 1);
        });
        const mol = (side, ti) => types[ti].lm.map(j => per[side][ti].tips[j]);
        const lm = [...mol(-1, 6), ...mol(-1, 5), per[-1][2].tips[0], per[-1][0].edge.clone().lerp(per[1][0].edge, 0.5),
          per[1][2].tips[0], ...mol(1, 5).reverse(), ...mol(1, 6).reverse()];
        return { A, geos, lm, thEnd };
      }
      const DU = dentition('U'), DL = dentition('L');

      // ---- swept band with a rounded-rectangle section (bone and gum)
      function sweep(pts, ax, a, b, M) {
        M = M || 64; const K = 18, n = pts.length;
        const curve = new THREE.CatmullRomCurve3(pts), P = [], I = [];
        const at = (arr, u) => { const f = u * (n - 1), i = Math.min(n - 2, Math.floor(f)), r = f - i; return arr[i] * (1 - r) + arr[i + 1] * r; };
        const atV = (u) => { const f = u * (n - 1), i = Math.min(n - 2, Math.floor(f)), r = f - i; return ax[i].clone().lerp(ax[i + 1], r); };
        for (let j = 0; j <= M; j++) {
          const u = j / M, c = curve.getPointAt(u), T = curve.getTangentAt(u);
          const Mv = atV(u); Mv.addScaledVector(T, -Mv.dot(T)).normalize();
          const Sv = new THREE.Vector3().crossVectors(T, Mv), A = at(a, u), B = at(b, u);
          for (let k = 0; k < K; k++) {
            const f = k / K * Math.PI * 2, cs = Math.cos(f), sn = Math.sin(f);
            const p = c.clone().addScaledVector(Sv, B * Math.sign(cs) * Math.pow(Math.abs(cs), 0.75)).addScaledVector(Mv, A * Math.sign(sn) * Math.pow(Math.abs(sn), 0.75));
            P.push(p.x, p.y, p.z);
          }
        }
        for (let j = 0; j < M; j++) for (let k = 0; k < K; k++) {
          const a0 = j * K + k, a1 = (j + 1) * K + k, b0 = j * K + (k + 1) % K, b1 = (j + 1) * K + (k + 1) % K;
          I.push(a0, a1, b0, a1, b1, b0);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setIndex(I); geo.computeVertexNormals();
        return geo;
      }
      const gumBand = (Dn, y) => { const pts = Array.from({ length: 15 }, (_, i) => archAt(Dn.A, -Dn.thEnd + 2 * Dn.thEnd * i / 14).setY(y)); return sweep(pts, pts.map(() => V(0, 1, 0)), pts.map(() => 3.0), pts.map(() => 4.7), 80); };

      // ---- left: synthetic skull for context
      const skull = new THREE.Group(); skull.position.set(-130, 0, 0); skull.rotation.y = 0.4; scene.add(skull);
      {
        const g = new THREE.SphereGeometry(1, 56, 40), p = g.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const nx = p.getX(i), ny = p.getY(i), nz = p.getZ(i);
          const x = 63 * nx * (0.9 + 0.1 * ny) * (1 - 0.06 * Math.exp(-(ny - 0.05) * (ny - 0.05) / 0.06));
          const z = 92 * nz - (nz > 0 ? 7 * nz * Math.max(0, ny) : 0);
          p.setXYZ(i, x, 70 * ny + 42, z - 12);
        }
        g.computeVertexNormals(); skull.add(new THREE.Mesh(g, bone));
      }
      skull.add(ell(bone, 54, 38, 30, 0, -2, 54));
      const tube = (pts, r) => skull.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, r, 12), bone));
      tube([V(-47, 21, 64), V(-27, 28, 79), V(0, 29, 85), V(27, 28, 79), V(47, 21, 64)], 5);
      [-1, 1].forEach(s => {
        skull.add(ell(dark, 15.5, 14.5, 3, s * 29, 10, 78.5, 28));
        tube([V(s * 12, 0, 84), V(s * 29, -5, 85), V(s * 43, 2, 78), V(s * 47, 17, 68)], 2.8);
        skull.add(ell(bone, 13, 13, 17, s * 47, -6, 58, 24));
        tube([V(s * 53, -5, 50), V(s * 58, -4, 26), V(s * 57, -4, 4)], 4.6);
        skull.add(ell(bone, 14, 21, 27, s * 45, 4, -6, 24));
        skull.add(ell(bone, 9, 13, 10, s * 50, -16, -20, 20));
        skull.add(ell(dark, 2.4, 4, 4, s * 58.2, -6.5, -6, 16));
      });
      skull.add(ell(dark, 8, 12, 4, 0, -13, 86, 20));
      const nb = ell(bone, 5, 10, 4, 0, 11, 88, 20); nb.rotation.x = -0.45; skull.add(nb);

      // dentition origin inside the skull
      const O = V(0, -58, 62);
      // maxilla: upper dentition + alveolar bone + palate (fixed)
      const mxIn = new THREE.Group(); mxIn.position.copy(O); skull.add(mxIn);
      DU.geos.forEach(g => mxIn.add(new THREE.Mesh(g, enamel)));
      const mxPath = Array.from({ length: 13 }, (_, i) => archAt(DU.A, -DU.thEnd * 0.97 + 2 * DU.thEnd * 0.97 * i / 12, 0.93).setY(16));
      mxIn.add(new THREE.Mesh(sweep(mxPath, mxPath.map(() => V(0, 1, 0)), mxPath.map(() => 11), mxPath.map(() => 6.2), 56), boneMx));
      mxIn.add(ell(boneMx, 21, 4, 24, 0, 14, -18, 24));
      // mandible: lower dentition + body, ramus, condyles, chin (moves with the occlusion)
      const PV = V(0, 44, -62);
      const mnPivot = new THREE.Group(); mnPivot.position.copy(O).add(PV); skull.add(mnPivot);
      const mnIn = new THREE.Group(); mnIn.position.copy(PV).negate(); mnPivot.add(mnIn);
      DL.geos.forEach(g => mnIn.add(new THREE.Mesh(g, enamel)));
      const bodyPts = [], axv = [], aa = [], bb = [];
      const push = (p, v, A, B) => { bodyPts.push(p); axv.push(v); aa.push(A); bb.push(B); };
      const Y = V(0, 1, 0), Z = V(0, 0, 1);
      push(V(-49, 40, -63), Z, 8, 4.2); push(V(-49, 14, -62), Z, 14, 4.6); push(V(-47, -14, -58), Z, 14, 5);
      push(V(-43, -24, -50), Y, 12, 5.6);
      for (let i = 0; i <= 8; i++) { const th = -DL.thEnd * 0.9 + 2 * DL.thEnd * 0.9 * i / 8; push(archAt(DL.A, th, 0.95).setY(-20).add(V(0, 0, -1.5)), Y, 14.5, 6.4); }
      push(V(43, -24, -50), Y, 12, 5.6);
      push(V(47, -14, -58), Z, 14, 5); push(V(49, 14, -62), Z, 14, 4.6); push(V(49, 40, -63), Z, 8, 4.2);
      mnIn.add(new THREE.Mesh(sweep(bodyPts, axv, aa, bb, 120), boneMn));
      mnIn.add(ell(boneMn, 12.5, 9, 7, 0, -30, 3.5, 24));
      [-1, 1].forEach(s => { const c = ell(boneMn, 10, 6.5, 7.5, s * 50, 44, -63, 20); c.rotation.y = s * 0.3; mnIn.add(c); });

      // ---- right: the dentition enlarged
      const dent = new THREE.Group(); dent.position.set(150, -12, 30); dent.scale.setScalar(3.7); dent.rotation.set(0.12, -0.42, 0); scene.add(dent);
      const gum = D.mat(THREE, 0xecb6b4, { rough: 0.7 }), gumU = D.mat(THREE, 0xecb6b4, { rough: 0.7 }), enamelU = D.mat(THREE, 0xf7f4ec, { rough: 0.28 });
      const dU = new THREE.Group(); dent.add(dU);
      DU.geos.forEach(g => dU.add(new THREE.Mesh(g, enamelU)));
      dU.add(new THREE.Mesh(gumBand(DU, 10.6), gumU));
      const dPivot = new THREE.Group(); dPivot.position.copy(PV); dent.add(dPivot);
      const dIn = new THREE.Group(); dIn.position.copy(PV).negate(); dPivot.add(dIn);
      dIn.add(new THREE.Mesh(gumBand(DL, -10.2), gum));
      // dashed guide from the skull dentition to the enlarged view
      scene.updateMatrixWorld(true);
      const zoom = D.dashLink(THREE, 0x8a97aa, 5); scene.add(zoom);
      zoom.set(skull.localToWorld(O.clone().add(V(0, 0, 14))), dent.localToWorld(V(-24, 0, 6)));

      // lower-crown distance colour to the upper dentition (vertex colours, linear)
      const lowMat = D.mat(THREE, 0xffffff, { rough: 0.34 }); lowMat.vertexColors = true;
      const cEn = lin(0xf7f4ec), stops = [[0.35, lin(0xd94436)], [0.9, lin(0xf2c230)], [1.6, lin(0x3fae5a)], [2.6, lin(0x3b7fd6)]];
      const heatOf = d => {
        if (d <= stops[0][0]) return stops[0][1].clone();
        for (let i = 1; i < stops.length; i++) if (d <= stops[i][0]) return stops[i - 1][1].clone().lerp(stops[i][1], (d - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
        return cEn.clone().lerp(stops[3][1], Math.max(0, 1 - (d - 2.6) / 1.2));
      };
      const upPts = [];
      DU.geos.forEach(g => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < 4) upPts.push(p.getX(i), p.getY(i), p.getZ(i)); });
      const heat = [];
      DL.geos.forEach(g => {
        const p = g.attributes.position, n = p.count, col = new Float32Array(n * 3), hc = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          let c = cEn;
          if (g.userData.u[i] > -3.5) {
            const x = p.getX(i), y = p.getY(i), z = p.getZ(i); let best = 1e9;
            for (let j = 0; j < upPts.length; j += 3) { const dx = upPts[j] - x, dy = upPts[j + 1] - y, dz = upPts[j + 2] - z, q = dx * dx + dy * dy + dz * dz; if (q < best) best = q; }
            c = heatOf(Math.sqrt(best));
          }
          hc.set([c.r, c.g, c.b], 3 * i); col.set([cEn.r, cEn.g, cEn.b], 3 * i);
        }
        const gl = g.clone();
        gl.setAttribute('color', new THREE.BufferAttribute(col, 3));
        heat.push({ col, hc, attr: gl.attributes.color });
        dIn.add(new THREE.Mesh(gl, lowMat));
      });
      let heatK = -1;
      const en = [cEn.r, cEn.g, cEn.b];
      function setHeat(k) {
        if (Math.abs(k - heatK) < 1e-3) return; heatK = k;
        heat.forEach(h => { for (let i = 0; i < h.col.length; i++) h.col[i] = en[i % 3] * (1 - k) + h.hc[i] * k; h.attr.needsUpdate = true; });
      }
      // tooth landmarks 15 + 15 and their correspondence lines (colour = remaining distance)
      const tg = new THREE.SphereGeometry(0.8, 14, 10);
      const mU = D.mat(THREE, 0x1e5aa8, { emissive: 0x0c2d66 }), mL = D.mat(THREE, 0xe07b22, { emissive: 0x6b3300 });
      const lmU = DU.lm.map(p => { const s = D.mesh(THREE, tg, mU); s.position.copy(p); s.userData.noShadow = true; dent.add(s); return s; });
      const lmL = DL.lm.map(p => { const s = D.mesh(THREE, tg, mL); s.position.copy(p); s.userData.noShadow = true; dIn.add(s); return s; });
      const lgeo = new THREE.BufferGeometry();
      lgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(90), 3));
      lgeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(90), 3));
      const links = new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 }));
      links.frustumCulled = false; scene.add(links);
      const lFinal = DU.lm.map((p, i) => p.distanceTo(DL.lm[i]) * 3.7);
      const cFar = lin(0xe8624a), cMid = lin(0xf0a030), cNear = lin(0x38a169);
      const anc = (p, parent) => { const o = new THREE.Object3D(); o.position.fromArray(p); parent.add(o); return o; };
      const aDent = anc([0, 20, -14], dent), aLow = anc([0, -14, 4], dIn);

      // ---- poses of the lower dentition (and the mandible)
      const Q = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
      const INIT = { p: V(2.5, -2.5, -3), q: Q(0.13, 0.07, -0.045) };
      const Sx = { x: 0.012, y: -0.03, z: 0.022, px: 1.1, pz: -1.0 };
      const yC = -0.8, pose = (f, y) => ({ p: V(Sx.px * f, y, Sx.pz * f), q: Q(Sx.x * f, Sx.y * f, Sx.z * f) });
      const seatY = [-1.2, -5.2, -4.0, -2.8, -1.6, -0.4, -1.0, -0.7, -0.85, yC], corr = [1, 0.42, 0.15, 0];
      const tP = V(0, 0, 0), tQ = new THREE.Quaternion(), I0 = { p: V(0, 0, 0), q: new THREE.Quaternion() };
      const lerpPose = (a, b, k) => { tP.copy(a.p).lerp(b.p, k); tQ.copy(a.q).slerp(b.q, k); };

      D.labels(box, [
        { t: { ko: '치아 랜드마크<small>상악 15 · 하악 15</small>', en: 'Tooth landmarks<small>15 upper · 15 lower</small>' }, c: 's', obj: 'dent', ph: '1' },
        { t: { ko: '하악 치열', en: 'Lower dentition' }, c: 's o', obj: 'low', ph: '2' },
        { t: { ko: '접촉 상태와 거리', en: 'Contact state and distance' }, c: 's r', obj: 'low', ph: '3' }
      ]);

      const TXT = [
        S.t({ ko: '① 치아 랜드마크', en: '① Tooth landmarks' }),
        S.t({ ko: '② 교합 정렬 — 자동 교합 · 6-DOF 조정', en: '② Occlusal alignment — automatic occlusion · 6-DOF adjustment' }),
        S.t({ ko: '③ 교합 평가', en: '③ Occlusion evaluation' })
      ];
      const read = box.querySelector('.readout');
      const a = V(0, 0, 0), b = V(0, 0, 0), cc = new THREE.Color(), lp = lgeo.attributes.position, lc = lgeo.attributes.color;
      let last = '';
      return {
        anchors: { dent: aDent, low: aLow },
        tick(s) {
          const t = s % 11;
          let step = 0, linkK = 0, heatT = 0;
          // (1) landmarks appear one by one
          lmU.forEach((o, i) => { const k = Math.max(0.001, t < 2.4 ? sm(0.2 + i * 0.1, 0.4 + i * 0.1, t) : 1); o.scale.setScalar(k); lmL[i].scale.setScalar(k); });
          // (3) evaluation: tilt the enlarged view toward the occlusal surface and fade the upper dentition
          const ev = sm(7.6, 8.3, t); dent.rotation.x = 0.12 + 0.36 * ev; dent.position.y = -12 - 16 * ev; D.fade(dU, 1 - 0.9 * ev); lmU.forEach(o => { o.visible = ev < 0.5; });
          if (t < 2.4) { step = 0; lerpPose(INIT, INIT, 0); }
          else if (t < 3.2) { step = 1; linkK = sm(2.4, 2.65, t); lerpPose(INIT, pose(1, seatY[0]), sm(2.75, 3.18, t)); }
          else if (t < 4.6) {
            step = 1; linkK = 1;
            const u = (t - 3.2) / 1.4 * (seatY.length - 1), k = Math.min(seatY.length - 2, Math.floor(u));
            const y = t >= 4.3 ? yC : seatY[k] + (seatY[k + 1] - seatY[k]) * sm(0, 0.55, u - k);
            lerpPose(pose(1, y), pose(1, y), 0);
          } else if (t < 7.6) {
            step = 1; linkK = 1;
            const u = Math.min(1, (t - 4.6) / 2.6) * 3, n = Math.min(2, Math.floor(u)), f = Math.min(1, u - n);
            const from = corr[n], to = corr[n + 1], y0 = yC * from, y1 = yC * to, yl = Math.min(y0, y1) - 1.1;
            if (f < 0.55) lerpPose(pose(from, y0), pose(to, yl), sm(0, 0.55, f)); else lerpPose(pose(to, yl), pose(to, y1), sm(0.55, 0.95, f));
          } else { step = 2; lerpPose(I0, I0, 0); linkK = 1 - sm(7.6, 8.0, t); heatT = sm(7.6, 8.3, t); }
          mnPivot.quaternion.copy(tQ); mnPivot.position.copy(O).add(PV).add(tP);
          dPivot.quaternion.copy(tQ); dPivot.position.copy(PV).add(tP);
          scene.updateMatrixWorld(true);
          links.visible = linkK > 0.01; links.material.opacity = 0.9 * linkK;
          lmU.forEach((su, i) => {
            su.getWorldPosition(a); lmL[i].getWorldPosition(b);
            lp.setXYZ(2 * i, a.x, a.y, a.z); lp.setXYZ(2 * i + 1, b.x, b.y, b.z);
            const r = Math.min(1, Math.max(0, (a.distanceTo(b) - lFinal[i] - 0.5) / 18));
            if (r < 0.5) cc.copy(cNear).lerp(cMid, r * 2); else cc.copy(cMid).lerp(cFar, (r - 0.5) * 2);
            lc.setXYZ(2 * i, cc.r, cc.g, cc.b); lc.setXYZ(2 * i + 1, cc.r, cc.g, cc.b);
          });
          lp.needsUpdate = lc.needsUpdate = true;
          setHeat(heatT);
          box.dataset.ph = step + 1;
          if (read && TXT[step] !== last) { read.textContent = TXT[step]; last = TXT[step]; }
        }
      };
    }
  });
})(typeof window !== 'undefined' ? window.Scene3D : null);
