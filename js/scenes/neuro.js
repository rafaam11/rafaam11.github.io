/* neuro: coil navigation concept (generic geometry, no patient data, no values).
 * (1) Landmark + ICP registration: three landmark pairs give the coarse alignment, then ICP iterations bring the
 *     surface points digitized with the tracked pointer onto the head model.
 * (2) Coil alignment: a generic arm (robot integration) brings the TMS coil onto two scalp targets.
 * Units cm, floor y = 0, the seated patient faces +z. 11 s loop.
 */
(function (S) {
  'use strict';
  if (!S) return;
  S.register('neuro', {
    target: [16, 106, 30], dist: 290, yaw: 0.5, pitch: 0.16, fov: 30, groundShadow: 0.18, autoYaw: 0.02, stillTime: 2.6,
    fit: { box: [[-50, 98, -10], [46, 152, 60]], fill: 0.98 },
    build(scene, THREE, box) {
      const D = S, V = (x, y, z) => new THREE.Vector3(x, y, z);
      const steel = D.mat(THREE, 0x9aa5b4, { rough: 0.3, metal: 0.6 });
      const skinM = D.mat(THREE, 0xe7bf9f, { rough: 0.7 });
      const cloth = D.mat(THREE, 0x9fb4cf, { rough: 0.85 });
      const dk = D.mat(THREE, 0x2d3440, { rough: 0.5 });

      // ---- floor, treatment chair, seated patient
      scene.add(D.mesh(THREE, D.rbox(THREE, 230, 2, 230, 1), D.mat(THREE, 0xeef2f6, { rough: 0.9 }), 22, -1, 20));
      const chair = new THREE.Group(); scene.add(chair);
      const cm = D.mat(THREE, 0x47556b, { rough: 0.6 });
      chair.add(D.mesh(THREE, D.rbox(THREE, 46, 6, 46, 3), cm, 0, 41, 2));
      chair.add(D.mesh(THREE, D.rbox(THREE, 44, 62, 5, 3), cm, 0, 78, -16));
      chair.add(D.mesh(THREE, D.rbox(THREE, 24, 14, 5, 2), cm, 0, 118, -15));
      chair.add(D.mesh(THREE, new THREE.CylinderGeometry(3, 3, 36, 14), steel, 0, 20, 0));
      [-1, 1].forEach(s => {
        chair.add(D.mesh(THREE, D.rbox(THREE, 8, 4, 36, 2), cm, s * 25, 58, 12));
        chair.add(D.mesh(THREE, D.rbox(THREE, 3, 14, 3, 1), steel, s * 25, 50, 2));
      });
      chair.add(D.mesh(THREE, new THREE.CylinderGeometry(21, 21, 3, 32), steel, 0, 1.5, 0));
      const body = new THREE.Group(); scene.add(body);
      const tg = new THREE.LatheGeometry([[0.001, 44], [0.78, 45], [0.82, 60], [0.9, 76], [0.97, 88], [0.92, 96], [0.62, 101], [0.3, 104], [0.001, 105]].map(p => new THREE.Vector2(p[0], p[1])), 40);
      const torso = new THREE.Mesh(tg, cloth); torso.scale.set(21, 1, 12); torso.position.set(0, 0, -4); body.add(torso);
      body.add(D.mesh(THREE, new THREE.CylinderGeometry(4.6, 5.6, 12, 20), skinM, 0, 106, -1));
      [-1, 1].forEach(s => {
        body.add(D.mesh(THREE, new THREE.SphereGeometry(6.2, 20, 14), cloth, s * 18.5, 93, -4));
        const upA = D.mesh(THREE, new THREE.CylinderGeometry(4.6, 4, 30, 16), cloth, s * 21, 79, -3); upA.rotation.z = s * 0.08; body.add(upA);
        body.add(D.mesh(THREE, new THREE.SphereGeometry(4.1, 14, 10), cloth, s * 22, 64, -2));
        body.add(D.mesh(THREE, new THREE.CylinderGeometry(3.6, 3.2, 28, 14), skinM, s * 21.5, 62, 12).rotateX(Math.PI / 2));
        body.add(D.mesh(THREE, D.rbox(THREE, 6, 3, 9, 1.4), skinM, s * 21.5, 62, 28));
        body.add(D.mesh(THREE, D.rbox(THREE, 16, 12, 40, 4), dk, s * 9, 48, 20));
        body.add(D.mesh(THREE, new THREE.CylinderGeometry(5, 4.4, 42, 14), dk, s * 9, 24, 38));
        body.add(D.mesh(THREE, D.rbox(THREE, 11, 5, 22, 2), dk, s * 9, 3, 46));
      });

      // head: ellipsoid (centre H, radii R)
      const H = V(0, 120, 2), R = V(9, 11, 10.5);
      const head = D.mesh(THREE, D.headGeometry(), skinM, H.x, H.y, H.z);
      head.scale.set(R.x, R.y, R.z); scene.add(head);
      const face = D.faceDetails(0xe7bf9f); face.position.copy(H); face.scale.set(0.95, 0.98, 1); scene.add(face);
      const hair = D.mesh(THREE, new THREE.SphereGeometry(1, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.5), D.mat(THREE, 0x3b3029, { rough: 0.9 }), H.x, H.y + 1.2, H.z - 1.2);
      hair.scale.set(R.x * 1.05, R.y * 0.98, R.z * 1.05); hair.rotation.x = -0.32; scene.add(hair);
      // head band + head marker
      const band = new THREE.Group(); band.position.set(H.x, H.y + 4.2, H.z); band.scale.set(R.x * 1.04, 1, R.z * 1.04);
      band.add(D.mesh(THREE, new THREE.TorusGeometry(1, 0.085, 8, 48), dk).rotateX(Math.PI / 2));
      scene.add(band);
      const hm = new THREE.Group(); hm.position.set(0, H.y + 12.5, H.z + 10.5); hm.rotation.x = -0.35;
      scene.add(hm);
      hm.add(D.marker4(THREE, 1.3, 0x4a5568));
      scene.add(D.mesh(THREE, new THREE.CylinderGeometry(0.45, 0.45, 9, 8), dk, 0, H.y + 8.4, H.z + 10.2));

      // ---- optical tracker on a stand
      const sk = D.skadiCam(THREE, -146); sk.root.position.set(-42, 146, 52); scene.add(sk.root);
      sk.root.updateMatrixWorld(true); sk.head.lookAt(V(0, 118, 4));
      const trackerAt = V(-42, 146, 52);

      // ---- sparse surface points digitized with the tracked pointer on the face and forehead (head-local)
      const ptM = D.mat(THREE, 0x00a6e8, { emissive: 0x00405a, rough: 0.4 });
      ptM.transparent = true;
      const ptG = new THREE.SphereGeometry(0.55, 12, 8);
      const cg = new THREE.Group(); scene.add(cg);
      let seed = 7;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let row = 0; row < 6; row++) {
        const el = -0.42 + row * 0.2, cols = row === 0 || row === 5 ? 5 : 7;
        for (let c = 0; c < cols; c++) {
          const az = (c / (cols - 1) - 0.5) * 1.7 + (rnd() - 0.5) * 0.12, e2 = el + (rnd() - 0.5) * 0.08;
          const d = V(Math.sin(az) * Math.cos(e2) * R.x, Math.sin(e2) * R.y, Math.cos(az) * Math.cos(e2) * R.z).multiplyScalar(1.03);
          const m = D.mesh(THREE, ptG, ptM, d.x, d.y, d.z); m.userData.noShadow = true; cg.add(m);
        }
      }

      // surface point and outward normal on the head ellipsoid (world)
      const surf = (dx, dy, dz) => {
        const d = V(dx, dy, dz).normalize();
        const s = 1 / Math.sqrt((d.x / R.x) ** 2 + (d.y / R.y) ** 2 + (d.z / R.z) ** 2);
        const p = d.clone().multiplyScalar(s);
        const n = V(p.x / (R.x * R.x), p.y / (R.y * R.y), p.z / (R.z * R.z)).normalize();
        return { p: p.add(H), n };
      };
      // three landmark pairs: on the head model and the same points among the digitized points
      const LM = [surf(0, -0.05, 1), surf(-0.45, 0.25, 0.85), surf(0.45, 0.25, 0.85)];
      const lmM = D.mat(THREE, 0xe07b22, { emissive: 0x7a3a00, rough: 0.4 });
      const lmG = new THREE.SphereGeometry(0.75, 12, 8);
      const lmHead = LM.map(l => { const m = D.mesh(THREE, lmG, lmM); m.position.copy(l.p).addScaledVector(l.n, 0.4); m.userData.noShadow = true; scene.add(m); return m; });
      const lmCloud = LM.map(l => { const m = D.mesh(THREE, lmG, lmM); m.position.copy(l.p).sub(H).addScaledVector(l.n, 0.6); m.userData.noShadow = true; cg.add(m); return m; });
      const lmLinks = D.segs(THREE, 3, 0xe07b22, 0.9); scene.add(lmLinks);

      // tracked pointer: during registration its tip rests on the face, moving between a few points
      const steelP = D.mat(THREE, 0x9aa5b4, { rough: 0.3, metal: 0.6 });
      const pointer = new THREE.Group(); scene.add(pointer);
      const PL = 30;
      pointer.add(D.mesh(THREE, new THREE.CylinderGeometry(0.45, 0.45, PL, 12), steelP, 0, 2 + PL / 2, 0));
      pointer.add(D.mesh(THREE, new THREE.ConeGeometry(0.45, 2, 12), D.mat(THREE, 0xe07b22, { rough: 0.4 }), 0, 1, 0).rotateX(Math.PI));
      const pmk = D.marker4(THREE, 0.9, 0x4a5568); pmk.position.set(0, 2 + PL + 1, 0); pmk.rotation.x = -Math.PI / 2; pointer.add(pmk);
      const PT = [surf(-0.5, 0.05, 0.86), surf(0.15, 0.45, 0.88), surf(0.55, -0.15, 0.82)];
      const pdir = V(0.95, 0.05, 0.32).normalize(), upY = V(0, 1, 0);
      const tipAt = V(0, 0, 0);

      // ---- generic arm on a cart + figure-eight TMS coil
      const RB = V(46, 40, -34);
      scene.add(D.mesh(THREE, D.rbox(THREE, 38, 40, 40, 3), D.mat(THREE, 0xa3afc0, { rough: 0.4, metal: 0.3 }), RB.x, 20, RB.z));
      const arm = D.arm6(THREE, { L: [9, 58, 52, 10, 9, 7] });
      arm.root.position.copy(RB); scene.add(arm.root);
      const coil = new THREE.Group(); arm.flange.add(coil);
      const ringM = D.mat(THREE, 0x1e5aa8, { rough: 0.35 });
      [-1, 1].forEach(s => coil.add(D.mesh(THREE, new THREE.TorusGeometry(4.2, 1.3, 14, 36), ringM, s * 4.4, 10, 0).rotateX(Math.PI / 2)));
      coil.add(D.mesh(THREE, D.rbox(THREE, 3, 2.6, 3.2, 1), dk, 0, 10, 0));
      coil.add(D.mesh(THREE, new THREE.CylinderGeometry(1.3, 1.3, 9, 14), dk, 0, 5, 0));
      const cmk = D.marker4(THREE, 1.1, 0x4a5568); cmk.position.set(0, 4, -5.2); cmk.rotation.y = Math.PI; coil.add(cmk);
      coil.add(D.mesh(THREE, new THREE.CylinderGeometry(0.4, 0.4, 5, 8), dk, 0, 4, -2.8).rotateX(Math.PI / 2));

      // scalp targets
      const TG = [surf(0.55, 0.72, 0.42), surf(0.97, 0.22, 0.04)];
      const dots = TG.map(t => {
        const m = D.mesh(THREE, new THREE.SphereGeometry(0.55, 14, 10), D.mat(THREE, 0xe5484d, { emissive: 0x7a1010, rough: 0.3 }), t.p.x, t.p.y, t.p.z);
        m.userData.noShadow = true; scene.add(m); return m;
      });
      const nh = V(0.85, 0.32, -0.25).normalize();       // waiting pose beside the head
      const HOME = { c: H.clone().addScaledVector(nh, 38), n: nh };
      const POSE = [HOME, ...TG.map(t => ({ c: t.p.clone().addScaledVector(t.n, 0.15), n: t.n }))];
      const cur = { c: HOME.c.clone(), n: HOME.n.clone() }, dneg = new THREE.Vector3();
      const solve = () => { dneg.copy(cur.n).negate(); return arm.reach(cur.c, dneg, 11.3, -1); };
      solve();

      D.labels(box, [
        { t: { ko: '포인터 표면점', en: 'Pointer surface points' }, c: 's c', obj: 'cloud', off: [-7, -7, 7.5], ph: '1' },
        { t: { ko: 'TMS 코일', en: 'TMS coil' }, c: 's n', obj: 'coil', off: [0, 10, 0], ph: '2' },
        { t: { ko: '광학 트래커', en: 'Optical tracker' }, c: 's n', obj: 'tracker', off: [0, 6, 0], ph: '1' },
        { t: { ko: '로봇 연동', en: 'Robot integration' }, c: 's o', obj: 'elbow', off: [0, 0, 0], ph: '2' },
        { t: { ko: '머리 마커', en: 'Head marker' }, c: 's', obj: 'hm', off: [0, 2, 0], ph: '1' }
      ]);

      const T = 11, tmpA = new THREE.Vector3(), wa = new THREE.Vector3(), wb = new THREE.Vector3();
      const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
      const E = [1, 0.4, 0.18, 0.07, 0];                   // residual misalignment after the landmark step and each ICP pass
      const OFF = { t: V(6, -3.5, 9), r: V(-0.24, 0.4, 0.18) };
      const read = box.querySelector('.readout');
      const OR = [0xf08a24, 0x00a6e8], mix = k => {
        const a = OR[0], b = OR[1], ch = sh => Math.round(((a >> sh) & 255) * (1 - k) + ((b >> sh) & 255) * k);
        return (ch(16) << 16) | (ch(8) << 8) | ch(0);
      };
      const reg = S.t({ ko: '① 랜드마크+ICP 정합', en: '① Landmark + ICP registration' });
      const lmTxt = reg + S.t({ ko: ' · 랜드마크', en: ' · landmarks' });
      const icpTxt = n => reg + S.t({ ko: ' · ICP 반복 ' + n, en: ' · ICP iteration ' + n });
      const alignTxt = n => S.t({ ko: '② 코일 정렬 · 표적 ' + n, en: '② Coil alignment · target ' + n });
      // timeline: [end time, from pose, to pose]
      const SEG = [[4.6, 0, 0], [6.1, 0, 1], [7.0, 1, 1], [8.5, 1, 2], [9.4, 2, 2], [10.6, 2, 0], [11, 0, 0]];
      let last = '';
      return {
        anchors: { elbow: arm.joints[2].g, coil: arm.flange, cloud: cg, hm, tracker: sk.head },
        tick(s) {
          const t = s % T;
          // (1) landmark step (0.6-1.2 s), then three ICP passes of 0.6 s each
          let e = 1, n = 0;
          for (let k = 0; k < 4; k++) {
            const t0 = 0.6 + 0.8 * k;
            if (t >= t0) { n = k; e = E[k] + (E[k + 1] - E[k]) * sm((t - t0) / 0.6); }
          }
          cg.position.copy(H).addScaledVector(OFF.t, e);
          cg.rotation.set(OFF.r.x * e, OFF.r.y * e, OFF.r.z * e);
          D.col(ptM.color, mix(1 - e));
          const stage2 = t >= 4.6;
          ptM.opacity = !stage2 ? 1 : Math.max(0.2, 1 - (t - 4.6) * 1.6);
          ptM.depthWrite = !stage2;
          // pointer: three points, 1.4 s each, hidden during coil alignment
          pointer.visible = !stage2;
          if (!stage2) {
            const q = t / 1.53, i0 = Math.floor(q) % 3, f = q - Math.floor(q), g = sm((f - 0.7) / 0.3);
            tipAt.lerpVectors(PT[i0].p, PT[(i0 + 1) % 3].p, g).addScaledVector(pdir, 0.3 + 4 * Math.sin(Math.PI * g));
            pointer.position.copy(tipAt);
            pointer.quaternion.setFromUnitVectors(upY, pdir); pointer.updateMatrixWorld(true);
            pmk.lookAt(trackerAt);
          }
          const lmOn = t < 1.4;
          lmHead.concat(lmCloud).forEach(m => { m.visible = !stage2 && t < 2.2; });
          lmLinks.visible = lmOn;
          if (lmOn) { cg.updateMatrixWorld(true); lmHead.forEach((m, i) => { m.getWorldPosition(wa); lmCloud[i].getWorldPosition(wb); lmLinks.set(i, wa, wb); }); }
          // (2) coil alignment
          let k0 = 0, k1 = 0, u = 0, from = 4.6;
          for (const sg of SEG) { if (t < sg[0]) { k0 = sg[1]; k1 = sg[2]; u = k0 === k1 ? 0 : sm((t - from) / (sg[0] - from)); break; } from = sg[0]; }
          const A = POSE[k0], B = POSE[k1];
          tmpA.copy(A.n).lerp(B.n, u).normalize();
          cur.c.copy(A.c).lerp(B.c, u).addScaledVector(tmpA, 9 * Math.sin(Math.PI * u));
          cur.n.copy(tmpA);
          solve();
          const active = stage2 ? (u > 0.5 || k1 === k0 ? k1 : k0) : -1;
          dots.forEach((d, i) => d.scale.setScalar(i === active - 1 ? 1.6 : 1));
          box.dataset.ph = stage2 ? 2 : 1;
          const m = stage2 ? alignTxt(active >= 1 ? active : (t < 6.1 ? 1 : 2)) : (t < 1.4 ? lmTxt : icpTxt(Math.max(1, n)));
          if (read && m !== last) { read.textContent = m; last = m; }
        }
      };
    }
  });
})(typeof window !== 'undefined' ? window.Scene3D : null);
