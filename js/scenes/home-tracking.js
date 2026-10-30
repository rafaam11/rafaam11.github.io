/* home-tracking: optical tracking, patient registration and a HoloLens overlay in one concept view
 * (synthetic geometry, no patient data). A ceiling-mounted optical tracker sees the patient reference marker
 * and the marker of a navigation pointer whose tip touches a target on the head; a HoloLens-style headset
 * (with a plain stand-in head, no full figure) looks at a skull hologram overlaid in register on the head.
 * No CT slices and no robot. The tracker is drawn closer than in a real room so that the whole set fits the
 * figure. 8 s loop; the reduced-motion still shows the pointer touching the target.
 */
(function (S) {
  'use strict';
  if (!S) return;
  S.register('home-tracking', {
    yaw: 1.9, pitch: 0.45, fov: 30, autoYaw: 0.03, stillTime: 3.6, ground: false,
    fit: { box: [[-46, -14, -90], [26, 72, -30]], fill: 0.97 },
    build(scene, THREE, box) {
      const D = S, V = THREE.Vector3;
      const TOP = -18;

      // table and patient lying supine (head at -z, face up); the body runs out of the figure
      const table = new THREE.Group();
      table.add(D.mesh(THREE, D.rbox(THREE, 58, 4, 240, 1.5), D.mat(THREE, 0x6b7a90, { rough: 0.4, metal: 0.3 }), 0, TOP - 8, 0));
      table.add(D.mesh(THREE, D.rbox(THREE, 54, 6, 236, 2.5), D.mat(THREE, 0x2f4058, { rough: 0.8 }), 0, TOP - 3, 0));
      table.position.z = 62; scene.add(table);
      const patient = D.patient(THREE);
      scene.add(patient);
      // a point on the patient's head surface: d is a direction in head space (x left-right, y crown, z face)
      const HC = new V(0, -6, -52);
      const headPoint = (d) => {
        const u = new V().fromArray(d).normalize(), front = Math.max(0, u.z);
        const x = u.x * (1 - 0.25 * Math.pow(Math.max(0, -u.y), 0.6)), z = u.z * (u.z > 0 ? 0.88 : 1) + 0.1 * front * Math.exp(-Math.pow((u.y + 0.2) / 0.45, 2));
        return new V(HC.x + 9.5 * x, HC.y + 10 * z, HC.z - 11.5 * u.y);
      };

      // hologram: a synthetic skull in register with the head. The head skin is drawn see-through after it, so the
      // overlay shows on the head while other objects in front of it still hide it from any viewing angle.
      const holo = D.mat(THREE, 0x1ea7e4, { opacity: 0.85, rough: 0.45, emissive: 0x0b5f8c });
      holo.depthWrite = true;
      const sk = D.skull(THREE, { bone: holo });
      sk.root.position.copy(HC); sk.root.rotation.x = -Math.PI / 2; sk.root.scale.setScalar(0.96);
      scene.add(sk.root);
      sk.root.traverse(o => { if (o.isMesh) { o.material = holo; o.userData.noShadow = true; } });
      const skinSee = D.mat(THREE, 0xe7bf9f, { opacity: 0.3, rough: 0.7 });
      patient.traverse(o => {
        const head = o.isMesh && o.scale.x === 9.5 && o.scale.y === 11.5;          // the head mesh of D.patient()
        const face = o.isMesh && o.parent && o.parent.parent === patient && o.parent !== patient && o.material.color.getHex() === 0xe7bf9f;
        if (head || face) { o.material = skinSee; o.renderOrder = 2; }
      });

      // ceiling-mounted optical tracker looking down at the head
      const camPos = new V(-12, 64, -90);
      const trk = D.skadiCam(THREE);
      trk.root.position.copy(camPos);
      trk.root.lookAt(HC);
      scene.add(trk.root);
      trk.root.updateMatrixWorld(true);
      const lp = trk.lenses.map(l => l.getWorldPosition(new V()));
      const steel = D.mat(THREE, 0x9aa5b4, { rough: 0.3, metal: 0.6 });
      const rod = (a, b, r) => {
        const m = D.mesh(THREE, new THREE.CylinderGeometry(r, r, 1, 14), steel);
        const d = b.clone().sub(a);
        m.position.copy(a).addScaledVector(d, 0.5);
        m.scale.y = d.length();
        m.quaternion.setFromUnitVectors(new V(0, 1, 0), d.normalize());
        return m;
      };
      scene.add(rod(camPos.clone().add(new V(0, 4, 0)), new V(camPos.x, 190, camPos.z), 2));
      scene.add(D.mesh(THREE, D.rbox(THREE, 12, 3, 12, 1), steel, camPos.x, camPos.y + 6, camPos.z));

      // patient reference marker on a short post at the forehead, facing the tracker
      const refBase = headPoint([-0.1, 0.65, 0.6]);
      const refPos = refBase.clone().add(new V(-2, 10, -8));
      scene.add(rod(refBase, refPos, 0.5));
      const ref = D.marker4(THREE, 0.95, 0x4a5568);
      ref.position.copy(refPos); ref.lookAt(camPos); scene.add(ref);
      ref.updateMatrixWorld(true);

      // pointer target on the cheekbone facing the viewer
      const tgt = headPoint([0.62, -0.1, 0.75]);
      const ring = D.mesh(THREE, new THREE.TorusGeometry(1.5, 0.28, 10, 32), D.mat(THREE, 0xe07b22, { rough: 0.4, emissive: 0x5a2400 }));
      const tn = tgt.clone().sub(HC).normalize();
      ring.position.copy(tgt).addScaledVector(tn, 0.2);
      ring.quaternion.setFromUnitVectors(new V(0, 0, 1), tn);
      ring.userData.noShadow = true;
      scene.add(ring);

      // HoloLens-style headset above the far side of the table, its view cone on the head
      const hs = new THREE.Group();
      const visor = D.mat(THREE, 0x1b2230, { rough: 0.1, metal: 0.4, opacity: 0.88 });
      hs.add(D.mesh(THREE, D.rbox(THREE, 19, 7, 6, 2.5), visor, 0, 0, 9));
      hs.add(D.mesh(THREE, D.rbox(THREE, 19.5, 2.4, 4, 1), D.mat(THREE, 0xc9d0d8, { rough: 0.35, metal: 0.2 }), 0, 4.4, 8.4));
      const band = D.mesh(THREE, new THREE.TorusGeometry(10.2, 1.2, 10, 44), D.mat(THREE, 0x3d4756, { rough: 0.5 }), 0, 2.5, 0);
      band.rotation.x = Math.PI / 2 - 0.12; hs.add(band);
      hs.add(D.mesh(THREE, D.rbox(THREE, 9, 6, 3, 1.2), D.mat(THREE, 0x3d4756, { rough: 0.5 }), 0, 2, -10.5));
      // a plain stand-in head inside the band reads as the wearer without adding a full figure
      const ghost = D.mesh(THREE, D.headGeometry(), D.mat(THREE, 0x56677e, { opacity: 0.6, rough: 0.9 }), 0, 0, -1);
      ghost.scale.set(9.2, 11, 10.2); hs.add(ghost);
      const hsPos = new V(-46, 22, -42);
      hs.position.copy(hsPos); hs.lookAt(HC); scene.add(hs);
      hs.updateMatrixWorld(true);
      const eye = new V(0, 0, 12).applyMatrix4(hs.matrixWorld);
      const vf = D.frustum(THREE, 30, 1.35, eye.distanceTo(HC) + 8, 0x00a3e0, 0.06);
      vf.position.copy(eye); vf.lookAt(HC); scene.add(vf);

      // navigation pointer (free-held, as in the case figures)
      const pdir = new V(0.5, 0.62, 0.6).normalize(), PL = 26;
      const shaft = D.mesh(THREE, new THREE.CylinderGeometry(0.55, 0.55, PL, 12), steel);
      const grip = D.mesh(THREE, new THREE.CylinderGeometry(1.3, 1.3, 11, 16), D.mat(THREE, 0x2d3440, { rough: 0.5 }));
      const ptip = D.mesh(THREE, new THREE.ConeGeometry(0.55, 2.6, 12), D.mat(THREE, 0xe07b22, { rough: 0.4 }));
      scene.add(shaft, grip, ptip);
      const pm = D.marker4(THREE, 0.95, 0x4a5568); scene.add(pm);

      // tracker sight lines to the 8 marker spheres (2 lenses x 2 markers x 4 spheres)
      const rays = D.segs(THREE, 16, 0xe5484d, 0.4);
      scene.add(rays);

      D.labels(box, [
        { t: { ko: '광학 추적', en: 'Optical tracking' }, c: 's n', at: [camPos.x, camPos.y + 10, camPos.z] },
        { t: { ko: 'HoloLens 오버레이', en: 'HoloLens overlay' }, c: 's c', obj: 'eye', off: [0, 0, 0] },
        { t: { ko: '내비게이션 포인터', en: 'Navigation pointer' }, c: 's o', obj: 'ptr', off: [0, 0, 0] },
        { t: { ko: '환자 레퍼런스', en: 'Patient reference' }, c: 's c', at: [refPos.x, refPos.y + 3, refPos.z] }
      ]);
      const eyeAnchor = new THREE.Object3D(); eyeAnchor.position.copy(eye); scene.add(eyeAnchor);

      const T = 8, ss = x => x * x * (3 - 2 * x), up = new V(0, 1, 0), tp = new V(), sp = new V();
      const ringMat = ring.material;
      return {
        anchors: { eye: eyeAnchor, ptr: pm },
        tick(s) {
          const t = s % T;
          // approach 0-2 s, touch 2-5.5 s, lift 5.5-7 s, rest above the target 7-8 s
          const k = t < 2 ? ss(t / 2) : t < 5.5 ? 1 : t < 7 ? 1 - ss((t - 5.5) / 1.5) : 0;
          tp.copy(tgt).addScaledVector(pdir, (9 + 0.3 * Math.sin(s * Math.PI)) * (1 - k));
          ptip.position.copy(tp).addScaledVector(pdir, 1.3);
          ptip.quaternion.setFromUnitVectors(up, pdir.clone().negate());
          shaft.position.copy(tp).addScaledVector(pdir, 2.6 + PL / 2);
          shaft.quaternion.setFromUnitVectors(up, pdir);
          grip.position.copy(tp).addScaledVector(pdir, 2.6 + PL - 5.5);
          grip.quaternion.copy(shaft.quaternion);
          pm.position.copy(tp).addScaledVector(pdir, 2.6 + PL + 3);
          pm.lookAt(camPos);
          scene.updateMatrixWorld(true);
          ringMat.emissiveIntensity = 0.6 + 1.4 * k;
          rays.material.opacity = 0.22 + 0.26 * (0.5 + 0.5 * Math.sin(s * Math.PI * 2 / 1.6));
          let i = 0;
          [ref, pm].forEach(m => m.spheres.forEach(b => {
            b.getWorldPosition(sp);
            rays.set(i++, lp[0], sp);
            rays.set(i++, lp[1], sp);
          }));
          rays.geometry.attributes.position.needsUpdate = true;
        }
      };
    }
  });
})(typeof window !== 'undefined' ? window.Scene3D : null);
