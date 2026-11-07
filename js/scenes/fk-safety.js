/* fk-safety: safety-manager policy for an unmanned forklift (vehicle built from primitives, no model files).
 * Per-sensor warning and stop zones around the vehicle: warning (slow down) -> stop -> innermost E-STOP zone
 * (E-STOP, latched). The latch holds for the rest of the loop (the figure ends on the latched state). Three safety 2D LiDARs (two front corners, one rear) scan the zones; the mast LiDAR and the ToF
 * sensor are devices without a zone of their own here. 12 s loop. The vehicle stays in place on screen; the floor
 * marks and the person move relative to it.
 */
(function (S) {
  'use strict';
  if (!S) return;
  S.register('fk-safety', {
    target: [0, 60, 40], dist: 700, yaw: -0.75, pitch: 0.45, fov: 30, autoYaw: 0.06,
    loop: 12,
    // t0/t1 come from sampling sim() at 1/60 s: ph 1 = [4.70, 5.12), ph 2 = [5.12, 5.47), ph 3 = [5.47, 6.40), ph 5 = [8.47, 10.37); every t1 sits inside its ph
    steps: [
      { id: 'warn', t0: 4, t1: 4.9, label: { ko: '경고 구역 감속', en: 'Warning zone: slow down' } },
      { id: 'stop', t0: 4.9, t1: 5.3, label: { ko: '정지 구역 정지', en: 'Stop zone: stop' } },
      { id: 'estop', t0: 5.3, t1: 6.1, label: { ko: 'E-STOP 래칭', en: 'E-STOP latched' } }
    ],
    fit: { box: [[-100, 0, -150], [120, 185, 232]], fill: 0.96 },
    build(scene, THREE, box) {
      const D = S, M = (c, o) => D.mat(THREE, c, o);
      const T = 12, HW = 46, Z0 = -126, Z1 = 132;
      // zone margins per direction (side / rear / front, inside -> out): E-STOP (red), stop (yellow), warning (green); the front is longest
      const BANDS = [{ s: 12, r: 16, f: 24, c: 0xe8392f }, { s: 30, r: 36, f: 56, c: 0xf2c230 }, { s: 52, r: 62, f: 96, c: 0x3fb06a }];

      // ---- lane marks flow past the vehicle (the engine adds the floor)
      const dashM = M(0xc4cfdd, { rough: 0.9 });
      const dashes = [];
      [-215, 255].forEach(x => { for (let i = 0; i < 7; i++) { const d = D.mesh(THREE, new THREE.BoxGeometry(7, 0.5, 50), dashM, x, 0.2, 0); d.userData.noShadow = true; scene.add(d); dashes.push(d); } });

      // ---- forklift built from primitives
      const fl = new THREE.Group(); scene.add(fl);
      const orange = D.matLib(THREE, 'plastic', { color: 0xe07b22 }), dark = D.matLib(THREE, 'anodized', { color: 0x2d3440 }), gray = D.matLib(THREE, 'anodized', { color: 0x4a5568 });
      const steel = D.matLib(THREE, 'steel'), tyre = D.matLib(THREE, 'anodized', { color: 0x1f2530 });
      fl.add(D.mesh(THREE, D.rbox(THREE, 88, 38, 120, 7), orange, 0, 36, -45));
      fl.add(D.mesh(THREE, D.rbox(THREE, 90, 54, 30, 6), gray, 0, 50, -108));
      fl.add(D.mesh(THREE, D.rbox(THREE, 80, 10, 90, 3), dark, 0, 58, -38));
      // wheels: tyre with three tread rings, steel rim, dark hub cap with lug nuts
      [[-50, -5, 18], [50, -5, 18], [-48, -82, 16], [48, -82, 16]].forEach(([x, z, r]) => {
        const wg = new THREE.Group(); wg.position.set(x, r, z); fl.add(wg);
        const tire = D.mesh(THREE, new THREE.CylinderGeometry(r, r, 13, 28), tyre); tire.rotation.z = Math.PI / 2; wg.add(tire);
        [-4, 0, 4].forEach(dx => { const tr = D.mesh(THREE, new THREE.TorusGeometry(r, 0.7, 6, 40), tyre, dx, 0, 0); tr.rotation.y = Math.PI / 2; wg.add(tr); });
        const side = Math.sign(x), rim = D.mesh(THREE, new THREE.CylinderGeometry(r * 0.58, r * 0.58, 13.6, 24), steel); rim.rotation.z = Math.PI / 2; wg.add(rim);
        const cap = D.mesh(THREE, new THREE.CylinderGeometry(r * 0.26, r * 0.26, 15, 16), dark); cap.rotation.z = Math.PI / 2; wg.add(cap);
        for (let k = 0; k < 5; k++) {
          const a = k / 5 * Math.PI * 2, lug = D.mesh(THREE, new THREE.CylinderGeometry(0.9, 0.9, 1.6, 8), steel, side * 7.4, Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42);
          lug.rotation.z = Math.PI / 2; wg.add(lug);
        }
      });
      [[-38, -75], [38, -75], [-38, -5], [38, -5]].forEach(([x, z]) => fl.add(D.mesh(THREE, new THREE.BoxGeometry(3.5, 100, 3.5), dark, x, 105, z)));
      [-38, 38].forEach(x => fl.add(D.mesh(THREE, new THREE.BoxGeometry(3.5, 3.5, 74), dark, x, 155, -40)));
      [-75, -5].forEach(z => fl.add(D.mesh(THREE, new THREE.BoxGeometry(80, 3.5, 3.5), dark, 0, 155, z)));
      // mast: two U channels (web at the back, flanges toward the front) with an inner rail, joined by a cross member
      [-30, 30].forEach(x => {
        fl.add(D.mesh(THREE, new THREE.BoxGeometry(10, 175, 2), dark, x, 88, 28));
        [-4, 4].forEach(dx => fl.add(D.mesh(THREE, new THREE.BoxGeometry(2, 175, 9), dark, x + dx, 88, 32)));
        fl.add(D.mesh(THREE, new THREE.BoxGeometry(4, 160, 5), steel, x, 84, 33));
      });
      fl.add(D.mesh(THREE, new THREE.BoxGeometry(70, 6, 7), dark, 0, 172, 32));
      const car = new THREE.Group(); car.position.set(0, 3, 0); fl.add(car);
      car.add(D.mesh(THREE, D.rbox(THREE, 76, 30, 4, 1.5), gray, 0, 14, 41));
      // forks: vertical shank plus a blade whose last 18 cm tapers to the tip
      const forkM = D.matLib(THREE, 'anodized', { color: 0x3a4250 });
      const blade = new THREE.Shape(); blade.moveTo(0, -2); blade.lineTo(72, -2); blade.lineTo(91, -0.4); blade.lineTo(91, 0.4); blade.lineTo(72, 2); blade.lineTo(0, 2); blade.lineTo(0, -2);
      const bladeG = new THREE.ExtrudeGeometry(blade, { depth: 12, bevelEnabled: false }); bladeG.rotateY(-Math.PI / 2); bladeG.translate(6, 0, 0);
      [-21, 21].forEach(x => {
        car.add(D.mesh(THREE, bladeG, forkM, x, 0, 41));
        car.add(D.mesh(THREE, D.rbox(THREE, 12, 24, 4, 1), forkM, x, 12, 41));
      });

      // ToF sensor box + faint view cone
      const sensor = new THREE.Group(); sensor.position.set(0, 37, 46); car.add(sensor);
      sensor.add(D.mesh(THREE, D.rbox(THREE, 24, 8, 8, 2), D.matLib(THREE, 'anodized', { color: 0x1a2b45 })));
      sensor.add(D.mesh(THREE, new THREE.BoxGeometry(18, 4, 0.8), M(0x05080f, { rough: 0.1 }), 0, 0, 4.2));
      const fr = D.frustum(THREE, 62, 1.3, 130, 0x00b7ff, 0.05); fr.rotation.x = 0.28; sensor.add(fr);

      // mast LiDAR: a device on top of the mast cross member, no scan sector of its own in this figure
      const lidar = new THREE.Group(); lidar.position.set(0, 175, 32); fl.add(lidar);
      lidar.add(D.mesh(THREE, new THREE.CylinderGeometry(6.5, 7, 8, 28), D.matLib(THREE, 'anodized', { color: 0x1a2b45 }), 0, 4, 0));
      lidar.add(D.mesh(THREE, new THREE.CylinderGeometry(6.7, 6.7, 1.8, 28), D.matLib(THREE, 'emissive-marker', { color: 0x00b7ff }), 0, 4.4, 0));

      // three safety 2D LiDARs low on the body (front left, front right, rear), each with a rotating scan sector
      // out to the outer edge of the zones it watches (front 190, rear 110)
      const scanM = M(0x00b7ff, { opacity: 0.2, side: true, emissive: 0x00b7ff });
      const edgeM = M(0x00b7ff, { opacity: 0.8, emissive: 0x00b7ff });
      const sweeps = [[-47, 24, 22, 190, 0], [47, 24, 22, 190, 2.1], [0, -125, 24, 110, 4.2]].map(([x, z, y, rad, ph]) => {
        const g = new THREE.Group(); g.position.set(x, y, z); g.userData.safetyLidar = true; fl.add(g);
        g.add(D.mesh(THREE, new THREE.CylinderGeometry(4.6, 5, 6, 22), D.matLib(THREE, 'anodized', { color: 0x1a2b45 }), 0, 0, 0));
        g.add(D.mesh(THREE, new THREE.CylinderGeometry(4.8, 4.8, 1.4, 22), D.matLib(THREE, 'emissive-marker', { color: 0x00b7ff }), 0, 1.5, 0));
        const sw = new THREE.Group(); sw.position.y = 2; g.add(sw);
        const sec = D.mesh(THREE, new THREE.CircleGeometry(rad, 40, 0, 0.9), scanM);
        sec.rotation.x = -Math.PI / 2; sec.userData.noShadow = true; sw.add(sec);
        const ed = D.mesh(THREE, new THREE.BoxGeometry(rad, 0.4, 0.8), edgeM, rad / 2, 0, 0); ed.userData.noShadow = true; sw.add(ed);
        return { sw, ph };
      });
      const safeLidar = fl.children.find(o => o.userData.safetyLidar && o.position.x > 0);

      // status lamps (green / yellow / red) + beacon
      const stack = new THREE.Group(); stack.position.set(38, 158, -5); fl.add(stack);
      stack.add(D.mesh(THREE, new THREE.CylinderGeometry(1.4, 1.4, 12, 12), dark, 0, 6, 0));
      const lamps = [0x3fb06a, 0xf2c230, 0xe8392f].map((c, i) => {
        const m = M(c, { rough: 0.3, emissive: c }); m.emissiveIntensity = 0.1;
        stack.add(D.mesh(THREE, new THREE.CylinderGeometry(4.4, 4.4, 5, 20), m, 0, 14 + i * 5.6, 0));
        return m;
      });
      const beaconM = M(0xe8392f, { rough: 0.3, emissive: 0xe8392f }); beaconM.emissiveIntensity = 0.05;
      const beacon = D.mesh(THREE, new THREE.SphereGeometry(7, 20, 12), beaconM, 0, 20, 0);
      beacon.position.set(-38, 163, -5);
      fl.add(D.mesh(THREE, new THREE.CylinderGeometry(5, 5.5, 5, 18), dark, -38, 158, -5));
      fl.add(beacon);
      const beaconGlow = D.mesh(THREE, new THREE.SphereGeometry(18, 18, 12), M(0xe8392f, { opacity: 0, emissive: 0xe8392f }), -38, 164, -5);
      beaconGlow.userData.noShadow = true; fl.add(beaconGlow);

      // ---- per-sensor warning / stop / E-STOP zones (move with the vehicle)
      const zones = new THREE.Group(); fl.add(zones);
      function rr(sh, hw, z0, z1, r, hole) {
        const p = hole ? new THREE.Path() : sh;
        p.moveTo(-hw + r, z0); p.lineTo(hw - r, z0); p.quadraticCurveTo(hw, z0, hw, z0 + r);
        p.lineTo(hw, z1 - r); p.quadraticCurveTo(hw, z1, hw - r, z1); p.lineTo(-hw + r, z1); p.quadraticCurveTo(-hw, z1, -hw, z1 - r);
        p.lineTo(-hw, z0 + r); p.quadraticCurveTo(-hw, z0, -hw + r, z0);
        if (hole) sh.holes.push(p);
      }
      const bandM = BANDS.map((B, i) => {
        const prev = BANDS[i - 1];
        const sh = new THREE.Shape();
        rr(sh, HW + B.s, Z0 - B.r, Z1 + B.f, 18 + B.s * 0.5, false);
        rr(sh, HW + (prev ? prev.s : 0), Z0 - (prev ? prev.r : 0), Z1 + (prev ? prev.f : 0), 18 + (prev ? prev.s : 0) * 0.5, true);
        const m = M(B.c, { opacity: 0.3, side: true, emissive: B.c, rough: 1 });
        const o = D.mesh(THREE, new THREE.ShapeGeometry(sh, 12), m, 0, 0.3 + i * 0.05, 0);
        o.rotation.x = Math.PI / 2; o.userData.noShadow = true; zones.add(o);
        return m;
      });

      // ---- a person in a high-visibility vest
      const pr = D.person(THREE, { color: 0x1f3a5f, skin: 0xe7bf9f, cap: true, capColor: 0xf4d21f });
      const worker = new THREE.Group(); worker.add(pr.root); worker.userData.worker = true; scene.add(worker);
      const vestM = M(0xd8ff1f, { rough: 0.7, emissive: 0x6a8000 });
      const vest = D.mesh(THREE, D.rbox(THREE, 37.6, 40, 23.6, 5.4), vestM, 0, 128, 0); pr.root.add(vest);
      const stripeM = M(0xe9eef5, { rough: 0.5 });
      [122, 134].forEach(y => pr.root.add(D.mesh(THREE, new THREE.BoxGeometry(38.4, 3, 24.4), stripeM, 0, y, 0)));

      // ---- simulation: replay 0..t in fixed steps so zone, speed and latch follow from the geometry
      const VMAX = 26, PZ = 205;
      const ease = u => u * u * (3 - 2 * u), clamp = u => Math.max(0, Math.min(1, u));
      function personX(t) {
        if (t < 0.8) return 300;
        if (t < 5.6) return 300 - 52 * (t - 0.8);
        if (t < 6.3) return 50;
        return Math.min(300, 50 + 90 * (t - 6.3));
      }
      function zoneOf(px, rz) {   // 0 none, 1 warning, 2 stop, 3 E-STOP zone
        for (let k = 0; k < 3; k++) {   // BANDS[0] is the innermost (E-STOP) band: test it first
          const B = BANDS[k];
          if (Math.abs(px) < HW + B.s && rz > Z0 - B.r && rz < Z1 + B.f) return 3 - k;
        }
        return 0;
      }
      function sim(t) {
        let Z = 0, v = VMAX, latched = false, zone = 0;
        const dt = 1 / 60, n = Math.floor(t / dt);
        for (let i = 0; i <= n; i++) {
          const px = personX(i * dt);
          zone = zoneOf(px, PZ - Z);
          if (zone === 3) latched = true;   // the latch holds for the rest of the loop
          const tgt = latched ? 0 : [1, 0.45, 0, 0][zone] * VMAX;
          v += (tgt - v) * Math.min(1, dt * (tgt < v ? 4 : 1.6));
          Z += v * dt;
        }
        const ph = latched ? 3 : zone;   // 0 normal, 1 warning, 2 stop, 3 E-STOP latched
        return { Z, v, latched, zone, ph, px: personX(t) };
      }
      // the step bar names warning, stop and E-STOP; the readout only covers the normal driving state (ph 0)
      const TXT = [S.t({ ko: '정상 주행', en: 'Driving' }), '', '', ''];

      D.labels(box, [
        { t: { ko: '센서별 경고·정지 구역', en: 'Per-sensor warn/stop zones' }, c: 's r', obj: 'zones', off: [HW + 40, 0, 190] },
        { t: { ko: '안전 2D LiDAR', en: 'Safety 2D LiDAR' }, c: 's c', obj: 'safe', off: [0, 6, 0] },
        { t: { ko: '마스트 LiDAR', en: 'Mast LiDAR' }, c: 's n', obj: 'lidar', off: [0, 12, 0] },
        { t: 'ToF', c: 's c', obj: 'sensor', off: [-18, 10, 30] }
      ]);
      const read = box.querySelector('.readout');
      let last = null;

      return {
        anchors: { lidar, safe: safeLidar, sensor, zones },
        tick(s) {
          const t = s % T, st = sim(t);
          const wrap = (st.Z % 360 + 360) % 360;
          dashes.forEach((d, i) => { d.position.z = ((i % 7) * 120 - wrap + 720 + 360) % 720 - 360; });
          // person in vehicle coordinates, walking motion
          const moving = st.px < 299 && (t < 5.6 || t > 6.3);
          const dir = t < 6.0 ? -1 : 1;
          worker.position.set(st.px, 0, PZ - st.Z);
          worker.visible = st.px < 295;
          worker.rotation.y = dir < 0 ? -Math.PI / 2 : Math.PI / 2;
          const sw = moving ? Math.sin(t * 7.5) * 0.5 : 0;
          pr.armL.sh.rotation.x = sw; pr.armR.sh.rotation.x = -sw;
          pr.root.position.y = moving ? Math.abs(Math.sin(t * 7.5)) * 1.2 : 0;
          // highlight the deepest zone entered (red while latched)
          const hot = st.latched ? 3 : st.zone;
          const blink = Math.floor(s * 5) % 2 ? 0.45 : 0.85;
          [3, 2, 1].forEach((z, k) => { // bandM[0] = E-STOP zone (3), [1] = stop (2), [2] = warning (1)
            const m = bandM[k];
            m.opacity = hot === z ? blink : 0.22;
            m.emissiveIntensity = hot === z ? 1.4 : 0.6;
          });
          // status lamps and beacon
          const lit = st.latched || st.zone === 3 ? 2 : (st.zone > 0 ? 1 : 0);
          lamps.forEach((m, i) => { m.emissiveIntensity = i === lit ? (st.latched ? (blink > 0.5 ? 1.6 : 0.5) : 1.6) : 0.08; });
          beaconM.emissiveIntensity = st.latched ? (blink > 0.5 ? 2.2 : 0.15) : 0.05;
          beaconGlow.material.opacity = st.latched && blink > 0.5 ? 0.3 : 0;
          // safety LiDAR scan sectors
          sweeps.forEach(o => { o.sw.rotation.y = -s * 2.6 + o.ph; });
          // fork height stays fixed
          car.position.y = 3;
          box.dataset.ph = st.ph;
          if (read && TXT[st.ph] !== last) { read.textContent = TXT[st.ph]; last = TXT[st.ph]; }
        }
      };
    }
  });
})(typeof window !== 'undefined' ? window.Scene3D : null);
