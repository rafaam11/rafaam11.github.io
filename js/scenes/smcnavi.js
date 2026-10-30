/* smcnavi: the coordinate chain of the navigation platform (synthetic skull, no patient data).
 * Phase 1: tracker -> patient reference -> CT image frame. Phase 2: tracker -> pointer -> tool tip, and the
 * mandible marker following mandibular motion. The tracker is drawn closer than in a real room so that the whole
 * chain fits the figure. 9 s loop.
 */
(function (S) {
  'use strict';
  if (!S) return;
  S.register('smcnavi', {
    target: [42, 8, 55], dist: 245, yaw: -0.5, pitch: 0.2, fov: 28, autoYaw: 0.015, ground: false, stillTime: 5.6,
    fit: { box: [[-20, -19, -16], [70, 36, 84]], fill: 0.98, pad: [6, 0, -110, 0] },
    build(scene, THREE, box) {
      const D = S, K = 2.2, V = THREE.Vector3;
      const sk = D.skull(THREE);
      sk.root.scale.setScalar(K);
      scene.add(sk.root);

      const camPos = new V(56, 22, 74);
      const trk = D.skadiCam(THREE);
      trk.root.position.copy(camPos);
      trk.root.lookAt(0, 0, 0);
      scene.add(trk.root);
      trk.root.updateMatrixWorld(true);
      const camAx = D.axes(THREE, 8);
      camAx.position.copy(camPos).add(new V(0, 6, 0)); camAx.quaternion.copy(trk.root.quaternion);
      scene.add(camAx);

      // point on an ellipsoid around the skull (skull-local centre/radii -> world)
      const surf = (c, r, d) => {
        const u = new V().fromArray(d).normalize();
        const k = 1 / Math.hypot(u.x / r[0], u.y / r[1], u.z / r[2]);
        return new V(c[0] + u.x * k, c[1] + u.y * k, c[2] + u.z * k).multiplyScalar(K);
      };
      const CR = [[0, 3, -1], [7.3, 7.6, 9.3]], FA = [[0, -2.6, 4.6], [5.4, 4.6, 4.4]];
      const steel = D.mat(THREE, 0x9aa5b4, { rough: 0.3, metal: 0.6 });
      const rod = (a, b, r) => {
        const m = D.mesh(THREE, new THREE.CylinderGeometry(r, r, 1, 12), steel);
        const d = b.clone().sub(a);
        m.position.copy(a).addScaledVector(d, 0.5);
        m.scale.y = d.length();
        m.quaternion.setFromUnitVectors(new V(0, 1, 0), d.normalize());
        return m;
      };

      // patient reference marker clamped to the forehead
      const refBase = surf(CR[0], CR[1], [0.55, 0.55, 0.62]);
      const refPos = refBase.clone().add(new V(7, 8, 9));
      scene.add(rod(refBase, refPos, 0.55));
      const ref = D.marker4(THREE, 1.1, 0x4a5568);
      ref.position.copy(refPos); ref.lookAt(camPos); scene.add(ref);
      const refAx = D.axes(THREE, 6); refAx.position.copy(refPos); scene.add(refAx);

      // mandible marker inside the mandible group (local coordinates, parent scale K)
      const mm = D.marker4(THREE, 0.34, 0x4a5568);
      const mmBase = new V(4.3, -7.5, 4.6), mmPos = new V(7.2, -7.2, 7.4);
      mm.position.copy(mmPos); mm.rotation.y = 0.8;
      sk.mandible.add(rod(mmBase, mmPos, 0.25), mm);

      // CT image volume around the skull
      const ctC = new V(0, -0.5, 2.5).multiplyScalar(K);
      const ct = D.ctVolume(THREE, 36, 48, 42, 0.1);
      ct.position.copy(ctC); scene.add(ct);
      const ctAx = D.axes(THREE, 9); ctAx.position.copy(ctC); scene.add(ctAx);

      // tracked pointer: the tip visits three points on the face
      const pts = [
        surf(FA[0], FA[1], [-0.62, 0.05, 0.8]),
        surf(CR[0], CR[1], [-0.3, 0.5, 0.82]),
        surf(FA[0], FA[1], [0.4, -0.35, 0.85])
      ];
      const pdir = new V(0.5, 0.42, 0.9).normalize(), PL = 36;
      const shaft = D.mesh(THREE, new THREE.CylinderGeometry(0.7, 0.7, PL, 12), steel);
      const ptip = D.mesh(THREE, new THREE.ConeGeometry(0.7, 3, 12), D.mat(THREE, 0xe07b22, { rough: 0.4 }));
      scene.add(shaft, ptip);
      const pm = D.marker4(THREE, 1.1, 0x4a5568); scene.add(pm);
      const pAx = D.axes(THREE, 5); scene.add(pAx);
      const tipObj = new THREE.Object3D(); scene.add(tipObj);
      const up = new V(0, 1, 0);

      // dashed links of the transform chain
      const L = {
        camRef: D.dashLink(THREE, 0x00b7ff, 3), refCt: D.dashLink(THREE, 0x1e5aa8, 2.5),
        camPtr: D.dashLink(THREE, 0x00b7ff, 3), ptrTip: D.dashLink(THREE, 0xe07b22, 2)
      };
      Object.keys(L).forEach(k => scene.add(L[k]));

      D.labels(box, [
        { t: { ko: '트래커', en: 'Tracker' }, c: 's n', at: [camPos.x, camPos.y + 5, camPos.z], ph: '1 2' },
        { t: { ko: '환자 레퍼런스', en: 'Patient reference' }, c: 's c', at: [refPos.x, refPos.y + 4, refPos.z], ph: '1' },
        { t: 'CT', c: 's n', at: [ctC.x - 18, ctC.y + 24, ctC.z - 21], ph: '1' },
        { t: { ko: '도구 끝', en: 'Tool tip' }, c: 's o', obj: 'tip', off: [0, 0, 0], ph: '2' },
        { t: { ko: '하악 마커', en: 'Mandible marker' }, c: 's c', obj: 'mm', off: [0, 0, 0], ph: '2' }
      ]);

      const read = box.querySelector('.readout');
      const opening = S.t({ ko: '하악 개구 ', en: 'Mandible opening ' });
      const a = new V(), b = new V(), tp = new V(), pmPos = new V();
      const T = 9, ss = x => x * x * (3 - 2 * x);
      let last = '';
      return {
        anchors: { tip: tipObj, mm },
        tick(s) {
          const ph = s / T * Math.PI * 2;
          sk.mandible.rotation.x = 0.15 * (1 - Math.cos(ph));
          // pointer: three points, 3 s each (2 s dwell, 1 s move)
          const t = (s % T) / 3, i = Math.floor(t), f = t - i, g = ss(Math.min(1, Math.max(0, (f - 0.62) / 0.38)));
          a.copy(pts[i % 3]); b.copy(pts[(i + 1) % 3]);
          tp.lerpVectors(a, b, g).addScaledVector(pdir, 1.2 + 9 * Math.sin(Math.PI * g) + 0.4 * Math.sin(s * 5));
          tipObj.position.copy(tp);
          ptip.position.copy(tp).addScaledVector(pdir, 1.5);
          ptip.quaternion.setFromUnitVectors(up, pdir.clone().negate());
          shaft.position.copy(tp).addScaledVector(pdir, 3 + PL / 2);
          shaft.quaternion.setFromUnitVectors(up, pdir);
          pmPos.copy(tp).addScaledVector(pdir, 3 + PL + 1);
          pm.position.copy(pmPos); pm.lookAt(camPos);
          pAx.position.copy(pmPos); pAx.quaternion.copy(pm.quaternion);
          scene.updateMatrixWorld(true);
          L.camRef.set(camPos, refPos);
          L.refCt.set(refPos, ctC);
          L.camPtr.set(camPos, pmPos);
          L.ptrTip.set(pmPos, tp);
          box.dataset.ph = (s % T) < 4.5 ? 1 : 2;
          if (read) {
            const m = opening + (sk.mandible.rotation.x * 180 / Math.PI).toFixed(1) + '°';
            if (m !== last) { read.textContent = m; last = m; }
          }
        }
      };
    }
  });
})(typeof window !== 'undefined' ? window.Scene3D : null);
