/* sgrt-poc: breathing-tracking proof of concept (first-year sensor groundwork, generic geometry, no values).
 * A 3D depth sensor on a tripod looks at a seated subject; the mean depth of a chest ROI becomes a respiratory
 * waveform, and an example gating signal is derived from it. The waveform shape is illustrative only.
 */
(function (S) {
  'use strict';
  if (!S) return;
  S.register('sgrt-poc', {
    target: [0, 90, 40], dist: 300, yaw: 0.55, pitch: 0.2, fov: 30, autoYaw: 0.015, groundShadow: 0.16, stillTime: 3.4,
    fit: { box: [[-28, 2, -30], [80, 132, 100]], fill: 1, pad: [6, 0, -40, 0] },
    build(scene, THREE, box) {
      const D = S, M = (c, o) => D.mat(THREE, c, o), V = (x, y, z) => new THREE.Vector3(x, y, z);
      const steel = M(0x9aa5b4, { rough: 0.3, metal: 0.6 }), skinM = M(0xe7bf9f, { rough: 0.7 }), cloth = M(0x8fa9c9, { rough: 0.85 }), dk = M(0x2d3440, { rough: 0.5 });

      // ---- floor, chair, seated subject
      scene.add(D.mesh(THREE, D.rbox(THREE, 220, 2, 220, 1), M(0xeef2f6, { rough: 0.9 }), 20, -1, 30));
      const cm = M(0x47556b, { rough: 0.6 });
      scene.add(D.mesh(THREE, D.rbox(THREE, 46, 6, 46, 3), cm, 0, 41, 2));
      scene.add(D.mesh(THREE, D.rbox(THREE, 44, 62, 5, 3), cm, 0, 78, -16));
      scene.add(D.mesh(THREE, new THREE.CylinderGeometry(3, 3, 36, 14), steel, 0, 20, 0));
      scene.add(D.mesh(THREE, new THREE.CylinderGeometry(21, 21, 3, 32), steel, 0, 1.5, 0));
      // torso: lathe with an elliptical section; breathing changes its front-back depth
      const prof = [[0.001, 44], [0.78, 45], [0.82, 60], [0.9, 76], [0.97, 88], [0.92, 96], [0.62, 101], [0.3, 104], [0.001, 105]];
      const torso = new THREE.Mesh(new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 40), cloth);
      const TZ = 12; torso.scale.set(21, 1, TZ); torso.position.set(0, 0, -4); scene.add(torso);
      scene.add(D.mesh(THREE, new THREE.CylinderGeometry(4.6, 5.6, 12, 20), skinM, 0, 106, -1));
      [-1, 1].forEach(s => {
        scene.add(D.mesh(THREE, new THREE.SphereGeometry(6.2, 20, 14), cloth, s * 18.5, 93, -4));
        const upA = D.mesh(THREE, new THREE.CylinderGeometry(4.6, 4, 30, 16), cloth, s * 21, 79, -3); upA.rotation.z = s * 0.08; scene.add(upA);
        scene.add(D.mesh(THREE, new THREE.SphereGeometry(4.1, 14, 10), cloth, s * 22, 64, -2));
        const E = V(s * 22, 63, -1), Hd = V(s * 12, 53, 22), dir = Hd.clone().sub(E), L = dir.length();
        const fa = D.mesh(THREE, new THREE.CylinderGeometry(3.4, 3.0, L, 14), skinM); fa.position.copy(E).addScaledVector(dir, 0.5);
        fa.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize()); scene.add(fa);
        scene.add(D.mesh(THREE, D.rbox(THREE, 7, 3, 9, 1.4), skinM, Hd.x, Hd.y - 1, Hd.z + 3));
        scene.add(D.mesh(THREE, D.rbox(THREE, 16, 12, 40, 4), dk, s * 9, 48, 20));
        scene.add(D.mesh(THREE, new THREE.CylinderGeometry(5, 4.4, 42, 14), dk, s * 9, 24, 38));
        scene.add(D.mesh(THREE, D.rbox(THREE, 11, 5, 22, 2), dk, s * 9, 3, 46));
      });
      const Hc = V(0, 120, 2);
      const head = D.mesh(THREE, D.headGeometry(), skinM, Hc.x, Hc.y, Hc.z); head.scale.set(9, 11, 10.5); scene.add(head);
      const face = D.faceDetails(0xe7bf9f); face.position.copy(Hc); face.scale.set(0.95, 0.98, 1); scene.add(face);
      const hair = D.mesh(THREE, new THREE.SphereGeometry(1, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.5), M(0x3b3029, { rough: 0.9 }), Hc.x, Hc.y + 1.2, Hc.z - 1.2);
      hair.scale.set(9.5, 10.8, 11); hair.rotation.x = -0.32; scene.add(hair);

      // front of the chest at height y for a given front-back scale
      const rAt = y => { for (let i = 1; i < prof.length; i++) if (y <= prof[i][1]) { const a = prof[i - 1], b = prof[i], u = (y - a[1]) / (b[1] - a[1]); return a[0] + (b[0] - a[0]) * u; } return 0; };
      const frontZ = (y, tz) => -4 + rAt(y) * tz;

      // ---- chest ROI with its depth samples
      const RY0 = 78, RY1 = 92, RW = 18;
      const roiG = new THREE.Group(); scene.add(roiG);
      roiG.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([V(-RW / 2, RY0, 0), V(RW / 2, RY0, 0), V(RW / 2, RY1, 0), V(-RW / 2, RY1, 0)]),
        new THREE.LineBasicMaterial({ color: 0x1e5aa8 })));
      const roiFill = D.mesh(THREE, new THREE.PlaneGeometry(RW, RY1 - RY0), M(0x00b7ff, { opacity: 0.22, emissive: 0x0090d0, side: true }), 0, (RY0 + RY1) / 2, -0.1);
      roiFill.userData.noShadow = true; roiG.add(roiFill);
      const pM = M(0x1e5aa8, { emissive: 0x0c2d66 }), pG = new THREE.SphereGeometry(0.32, 8, 6);
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
        const m = D.mesh(THREE, pG, pM, -RW / 2 + 2 + i * (RW - 4) / 5, RY0 + 2 + j * (RY1 - RY0 - 4) / 3, 0.3); m.userData.noShadow = true; roiG.add(m);
      }
      const roiA = new THREE.Object3D(); roiA.position.set(RW / 2, RY1, 0); roiG.add(roiA);

      // ---- 3D depth sensor on a tripod in front of the subject (placement is conceptual)
      const CAMP = [22, 96, 104];
      const cam = D.cam(THREE, CAMP, [0, 85, 8], 0x00b7ff, 0.045, 0.2); scene.add(cam);
      const legH = CAMP[1] - 6;
      scene.add(D.mesh(THREE, new THREE.CylinderGeometry(1.2, 1.2, legH, 10), steel, CAMP[0], legH / 2, CAMP[2]));
      for (let i = 0; i < 3; i++) {
        const a = i / 3 * Math.PI * 2 + 0.4, leg = D.mesh(THREE, new THREE.CylinderGeometry(0.8, 0.8, 46, 8), steel);
        leg.position.set(CAMP[0] + Math.cos(a) * 12, 21, CAMP[2] + Math.sin(a) * 12); leg.rotation.set(-Math.sin(a) * 0.55, 0, Math.cos(a) * 0.55); scene.add(leg);
      }
      const camA = new THREE.Object3D(); camA.position.set(CAMP[0], CAMP[1] + 6, CAMP[2]); scene.add(camA);
      const rays = D.segs(THREE, 4, 0x00b7ff, 0.45); scene.add(rays);

      // ---- display on a stand: respiratory waveform (top) and example gating signal (bottom)
      const PW = 46, PH = 30;
      const mon = new THREE.Group(); mon.position.set(62, 0, -6); mon.rotation.y = -0.35; scene.add(mon);
      mon.add(D.mesh(THREE, D.rbox(THREE, 22, 2, 16, 1), dk, 0, 1, 0));
      mon.add(D.mesh(THREE, new THREE.CylinderGeometry(1.4, 1.4, 92, 12), steel, 0, 47, 0));
      const scr = new THREE.Group(); scr.position.set(0, 108, 2); mon.add(scr);
      scr.add(D.mesh(THREE, D.rbox(THREE, PW + 3, PH + 3, 2.2, 1), dk));
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ color: 0xfbfcfe, toneMapped: false }));
      screen.position.z = 1.15; screen.userData.noShadow = true; scr.add(screen);
      const NW = 90, WIN = 12, X0 = -PW / 2 + 2, X1 = PW / 2 - 2;
      const WY0 = -1, WY1 = PH / 2 - 3, GY0 = -PH / 2 + 3, GY1 = -PH / 2 + 8;
      const lineOf = (n, color) => {
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
        const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color })); l.frustumCulled = false; l.position.z = 1.3; scr.add(l); return l;
      };
      const wave = lineOf(NW, 0x1e5aa8), gate = lineOf(NW * 2, 0xe07b22);
      const axisM = new THREE.LineBasicMaterial({ color: 0xc8d0da });
      [WY0 - 1.5, GY0 - 0.8].forEach(y => { const a = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(X0, y, 1.25), V(X1, y, 1.25)]), axisM); scr.add(a); });
      const now = D.mesh(THREE, new THREE.SphereGeometry(0.7, 12, 8), M(0x1e5aa8, { emissive: 0x1e5aa8 }), X1, 0, 1.5); now.userData.noShadow = true; scr.add(now);
      const waveA = new THREE.Object3D(); waveA.position.set(-PW / 4, WY1, 1.3); scr.add(waveA);
      const gateA = new THREE.Object3D(); gateA.position.set(PW / 4, GY1, 1.3); scr.add(gateA);

      // breathing (about 4.6 s period, chest about 2 cm toward the sensor on inhalation): illustrative curve
      const br = t => 0.5 - 0.5 * Math.cos(2 * Math.PI * t / 4.6) + 0.04 * Math.sin(2 * Math.PI * t / 13);
      const gateOn = v => v < 0.3;                                     // example window near end-exhalation
      const AMP = 1.95;
      const rFront = rAt((RY0 + RY1) / 2);
      const read = box.querySelector('.readout');
      D.labels(box, [
        { t: { ko: '흉부 ROI 깊이', en: 'Chest ROI depth' }, c: 's c', obj: 'roi', off: [0, 0, 0] },
        { t: { ko: '3D 깊이 센서', en: '3D depth sensor' }, c: 's n', obj: 'cam', off: [0, 0, 0] },
        { t: { ko: '호흡 파형', en: 'Respiratory waveform' }, c: 's n', obj: 'wave', off: [0, 0, 0] },
        { t: { ko: '게이트 신호 예시', en: 'Example gating signal' }, c: 's o', obj: 'gate', off: [0, 0, 0] }
      ]);
      const inhale = S.t({ ko: '들숨', en: 'Inhalation' }), exhale = S.t({ ko: '날숨', en: 'Exhalation' });
      const flow = S.t({ ko: ' · 흉부 ROI 깊이 → 호흡 파형 → 게이트 신호', en: ' · chest ROI depth → respiratory waveform → gating signal' });
      const corner = [V(0, 0, 0), V(0, 0, 0), V(0, 0, 0), V(0, 0, 0)], cw = V(0, 0, 0);
      let last = '';

      return {
        anchors: { roi: roiA, cam: camA, wave: waveA, gate: gateA },
        tick(s) {
          const b = br(s), dz = AMP * b;
          torso.scale.z = TZ + dz / rFront;
          const zf = frontZ((RY0 + RY1) / 2, torso.scale.z) + 0.35;
          roiG.position.z = zf;
          cam.getWorldPosition(cw);
          [[-RW / 2, RY0], [RW / 2, RY0], [RW / 2, RY1], [-RW / 2, RY1]].forEach(([x, y], i) => { corner[i].set(x, y, zf); rays.set(i, cw, corner[i]); });
          // display: the last WIN seconds
          const wp = wave.geometry.attributes.position, gp = gate.geometry.attributes.position;
          for (let i = 0; i < NW; i++) {
            const u = i / (NW - 1), tt = s - WIN + u * WIN, x = X0 + (X1 - X0) * u, v = br(tt);
            wp.setXYZ(i, x, WY0 + (WY1 - WY0) * v, 0);
            const gy = gateOn(v) ? GY1 : GY0, xn = X0 + (X1 - X0) * Math.min(1, (i + 1) / (NW - 1));
            gp.setXYZ(2 * i, x, gy, 0); gp.setXYZ(2 * i + 1, xn, gy, 0);
          }
          wp.needsUpdate = gp.needsUpdate = true;
          now.position.y = WY0 + (WY1 - WY0) * b;
          const m = (b > 0.5 ? inhale : exhale) + flow;
          if (read && m !== last) { read.textContent = m; last = m; }
        }
      };
    }
  });
})(typeof window !== 'undefined' ? window.Scene3D : null);
