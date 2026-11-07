/* skadi: optical tracking principle. Two lenses with IR LED rings see four reflective spheres; the tool pose
 * (position and orientation, 6DoF) follows. No values are shown.
 * The whole set-up sits in the tracker frame G, turned so the tracker -> tool axis runs along world x and tilted
 * so the tracker looks down at the tool.
 */
(function (S) {
  'use strict';
  if (!S) return;
  S.register('skadi', {
    target: [60, -20, 0], dist: 130, yaw: 0.55, pitch: 0.4, fov: 30, autoYaw: 0.02, stillTime: 2.5,
    fit: { box: [[-14, -60, -28], [130, 22, 28]], fill: 0.98 },
    build(scene, THREE, box) {
      const D = S;
      const P = new THREE.Group(); P.rotation.z = -0.32; scene.add(P);      // tracker above, looking down at the tool
      const G = new THREE.Group(); G.rotation.y = Math.PI / 2; P.add(G);
      const trk = D.skadiCam(THREE);
      G.add(trk.root);
      P.updateMatrixWorld(true);
      const lp = trk.lenses.map(l => l.getWorldPosition(new THREE.Vector3()));

      // faint view cone per lens (tracker frame +z)
      trk.lenses.forEach(l => {
        const f = D.frustum(THREE, 40, 1.4, 150, 0xe5484d, 0.01);
        f.position.set(l.position.x, l.position.y, l.position.z); G.add(f);
      });

      // tool: the shared pointer (tip at its origin, marker plate at the far end). The rig turns the plate to face +z
      // of the tool frame and puts the plate centre on the tool origin, which is what the tracker follows.
      const tool = new THREE.Group(); G.add(tool);
      const ptr = D.pointer(THREE, { len: 44, marker: 3 }), mk = ptr.marker;
      const PHI = Math.PI / 2 - 0.45, LEN = 45.2;
      ptr.root.rotation.x = PHI; ptr.root.position.set(0, -LEN * Math.cos(PHI), -LEN * Math.sin(PHI));
      tool.add(ptr.root);
      ptr.root.add(D.mesh(THREE, new THREE.SphereGeometry(1.3, 14, 10), D.matLib(THREE, 'emissive-marker', { color: 0xe5484d }), 0, 0, 0));   // tracked tip point
      const ax = D.axes(THREE, 15);
      G.add(ax);

      const rays = D.segs(THREE, 8, 0xe5484d, 0.4);
      scene.add(rays);

      D.labels(box, [
        { t: { ko: 'SKADI<small>IR LED · 카메라 2</small>', en: 'SKADI<small>IR LEDs · 2 cameras</small>' }, c: 's n', at: [0, 5, 16] },
        { t: { ko: '반사 마커', en: 'Reflective marker' }, c: 's c', obj: 'tool', off: [0, 6, 1] },
        { t: '6DoF', c: 's o', obj: 'axes', off: [0, 0, 0] }
      ]);

      const read = box.querySelector('.readout');
      if (read) read.textContent = S.t({ ko: '위치·회전 6DoF 추적', en: '6DoF position and orientation tracking' });
      const sp = new THREE.Vector3();
      const T = 9;
      return {
        anchors: { tool, axes: ax },
        tick(s) {
          const w = s / T * Math.PI * 2;
          tool.position.set(10 * Math.sin(w), 1 + 3 * Math.sin(2 * w), 128 + 10 * Math.sin(w + 0.9));
          // marker plate turned between the tracker and the viewer; the handle lies in the plate plane and turns slowly
          tool.rotation.set(0.2 * Math.sin(w * 0.7), Math.PI + 0.8 + 0.25 * Math.sin(w), -1.25 + 0.25 * Math.sin(w * 1.3 + 0.5));
          tool.updateMatrixWorld(true);
          ax.position.copy(tool.position);
          ax.quaternion.copy(tool.quaternion);
          mk.spheres.forEach((b, i) => {
            b.getWorldPosition(sp);
            rays.set(i, lp[0], sp);
            rays.set(4 + i, lp[1], sp);
          });
        }
      };
    }
  });
})(typeof window !== 'undefined' ? window.Scene3D : null);
