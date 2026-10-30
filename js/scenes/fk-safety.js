/* fk-safety: safety-manager policy for an unmanned forklift (vehicle built from primitives, no model files).
 * Zones per direction from the vehicle: warning (slow down) -> stop -> virtual bumper (E-STOP, latched). The latch
 * holds after the person leaves and is released only by a reset input, then the vehicle moves again. 12 s loop.
 * The vehicle stays in place on screen; the floor marks and the person move relative to it.
 */
(function (S) {
  'use strict';
  if (!S) return;
  S.register('fk-safety', {
    target: [0, 60, 40], dist: 700, yaw: -0.75, pitch: 0.55, fov: 33, autoYaw: 0.06, stillTime: 5.2,
    fit: { box: [[-100, 0, -150], [120, 175, 232]], fill: 0.96 },
    build(scene, THREE, box) {
      const D = S, M = (c, o) => D.mat(THREE, c, o);
      const T = 12, HW = 46, Z0 = -126, Z1 = 132;
      // zone margins per direction (side / rear / front, inside -> out): E-STOP bumper (red), stop (yellow), warning (green); the front is longest
      const BANDS = [{ s: 12, r: 16, f: 24, c: 0xe8392f }, { s: 30, r: 36, f: 56, c: 0xf2c230 }, { s: 52, r: 62, f: 96, c: 0x3fb06a }];

      // ---- floor and lane marks (they flow past the vehicle)
      const floor = D.mesh(THREE, new THREE.BoxGeometry(620, 2, 760), M(0xe6ecf3, { rough: 0.9 }), 40, -1.05, 0);
      scene.add(D.outline(THREE, floor, 0x9fb0c4));
      const dashM = M(0xc4cfdd, { rough: 0.9 });
      const dashes = [];
      [-215, 255].forEach(x => { for (let i = 0; i < 7; i++) { const d = D.mesh(THREE, new THREE.BoxGeometry(7, 0.5, 50), dashM, x, 0.2, 0); d.userData.noShadow = true; scene.add(d); dashes.push(d); } });

      // ---- forklift built from primitives
      const fl = new THREE.Group(); scene.add(fl);
      const orange = M(0xe07b22, { rough: 0.5 }), dark = M(0x2d3440, { rough: 0.6 }), gray = M(0x4a5568, { rough: 0.6 });
      fl.add(D.mesh(THREE, D.rbox(THREE, 88, 38, 120, 7), orange, 0, 36, -45));
      fl.add(D.mesh(THREE, D.rbox(THREE, 90, 54, 30, 6), gray, 0, 50, -108));
      fl.add(D.mesh(THREE, D.rbox(THREE, 80, 10, 90, 3), dark, 0, 58, -38));
      [[-50, -5, 18], [50, -5, 18], [-48, -82, 16], [48, -82, 16]].forEach(([x, z, r]) => {
        const w = D.mesh(THREE, new THREE.CylinderGeometry(r, r, 13, 28), M(0x1f2530, { rough: 0.8 }), x, r, z);
        w.rotation.z = Math.PI / 2; fl.add(w);
        const hub = D.mesh(THREE, new THREE.CylinderGeometry(r * 0.5, r * 0.5, 14, 20), M(0xc9d1dc, { rough: 0.4 }), x, r, z);
        hub.rotation.z = Math.PI / 2; fl.add(hub);
      });
      [[-38, -75], [38, -75], [-38, -5], [38, -5]].forEach(([x, z]) => fl.add(D.mesh(THREE, new THREE.BoxGeometry(3.5, 100, 3.5), dark, x, 105, z)));
      [-38, 38].forEach(x => fl.add(D.mesh(THREE, new THREE.BoxGeometry(3.5, 3.5, 74), dark, x, 155, -40)));
      [-75, -5].forEach(z => fl.add(D.mesh(THREE, new THREE.BoxGeometry(80, 3.5, 3.5), dark, 0, 155, z)));
      [-30, 30].forEach(x => fl.add(D.mesh(THREE, D.rbox(THREE, 9, 175, 9, 2), dark, x, 88, 32)));
      fl.add(D.mesh(THREE, new THREE.BoxGeometry(70, 6, 7), dark, 0, 172, 32));
      const car = new THREE.Group(); car.position.set(0, 3, 0); fl.add(car);
      car.add(D.mesh(THREE, D.rbox(THREE, 76, 30, 4, 1.5), gray, 0, 14, 41));
      [-21, 21].forEach(x => {
        car.add(D.mesh(THREE, D.rbox(THREE, 12, 4, 92, 1.2), M(0x3a4250, { rough: 0.5, metal: 0.2 }), x, 0, 86));
        car.add(D.mesh(THREE, D.rbox(THREE, 12, 24, 4, 1), M(0x3a4250, { rough: 0.5, metal: 0.2 }), x, 12, 41));
      });

      // ToF sensor box + faint view cone
      const sensor = new THREE.Group(); sensor.position.set(0, 37, 46); car.add(sensor);
      sensor.add(D.mesh(THREE, D.rbox(THREE, 24, 8, 8, 2), M(0x1a2b45, { rough: 0.35, metal: 0.3 })));
      sensor.add(D.mesh(THREE, new THREE.BoxGeometry(18, 4, 0.8), M(0x05080f, { rough: 0.1 }), 0, 0, 4.2));
      const fr = D.frustum(THREE, 62, 1.3, 130, 0x00b7ff, 0.05); fr.rotation.x = 0.28; sensor.add(fr);

      // LiDAR + rotating horizontal scan sector + expanding floor ring
      const lidar = new THREE.Group(); lidar.position.set(0, 164, -40); fl.add(lidar);
      lidar.add(D.mesh(THREE, new THREE.CylinderGeometry(7, 7.5, 9, 28), M(0x1a2b45, { rough: 0.3, metal: 0.3 }), 0, 4.5, 0));
      lidar.add(D.mesh(THREE, new THREE.CylinderGeometry(7.2, 7.2, 2, 28), M(0x00b7ff, { emissive: 0x00648c }), 0, 5, 0));
      const sweep = new THREE.Group(); sweep.position.set(0, 5, 0); lidar.add(sweep);
      const sector = D.mesh(THREE, new THREE.CircleGeometry(190, 40, 0, 0.9), M(0x00b7ff, { opacity: 0.12, side: true, emissive: 0x00b7ff }));
      sector.rotation.x = -Math.PI / 2; sector.userData.noShadow = true; sweep.add(sector);
      const edge = D.mesh(THREE, new THREE.BoxGeometry(190, 0.4, 0.8), M(0x00b7ff, { opacity: 0.55, emissive: 0x00b7ff }), 95, 0, 0);
      edge.userData.noShadow = true; sweep.add(edge);
      const ringM = M(0x00b7ff, { opacity: 0.35, side: true, emissive: 0x00b7ff });
      const ring = D.mesh(THREE, new THREE.RingGeometry(0.985, 1, 72), ringM, 0, 0.6, -40);
      ring.rotation.x = -Math.PI / 2; ring.userData.noShadow = true; fl.add(ring);

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

      // ---- three-zone virtual bumper (moves with the vehicle)
      const bumper = new THREE.Group(); fl.add(bumper);
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
        o.rotation.x = Math.PI / 2; o.userData.noShadow = true; bumper.add(o);
        return m;
      });

      // reset switch on the side (lights green when pressed)
      const resetBtnM = M(0x2d3440, { rough: 0.4, emissive: 0x3fb06a }); resetBtnM.emissiveIntensity = 0;
      const resetPlate = D.mesh(THREE, D.rbox(THREE, 3, 16, 18, 2), M(0xe9eef5, { rough: 0.5 }), 45, 40, -30); fl.add(resetPlate);
      const resetBtn = D.mesh(THREE, new THREE.CylinderGeometry(5, 5, 4, 20), resetBtnM, 47.5, 40, -30); resetBtn.rotation.z = Math.PI / 2; fl.add(resetBtn);

      // ---- a person in a high-visibility vest
      const pr = D.person(THREE, { color: 0x1f3a5f, skin: 0xe7bf9f, cap: true, capColor: 0xf4d21f });
      const worker = new THREE.Group(); worker.add(pr.root); scene.add(worker);
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
      function zoneOf(px, rz) {   // 0 none, 1 warning, 2 stop, 3 E-STOP bumper
        for (let k = 2; k >= 0; k--) {
          const B = BANDS[k];
          if (Math.abs(px) < HW + B.s && rz > Z0 - B.r && rz < Z1 + B.f) return k + 1;
        }
        return 0;
      }
      const RESET_WAIT = 1.6, RESET_HOLD = 0.5;
      function sim(t) {
        let Z = 0, v = VMAX, latched = false, leave = -1, rel = -1, zone = 0, pressed = false;
        const dt = 1 / 60, n = Math.floor(t / dt);
        for (let i = 0; i <= n; i++) {
          const tt = i * dt, px = personX(tt);
          zone = zoneOf(px, PZ - Z);
          if (zone === 3) latched = true;
          pressed = false;
          if (latched) {
            // the latch holds after the cause is gone; only a new reset input releases it
            if (zone === 0) { if (leave < 0) leave = tt; if (tt - leave > RESET_WAIT) { pressed = true; if (tt - leave > RESET_WAIT + RESET_HOLD) { latched = false; rel = tt; } } }
            else leave = -1;
          }
          const tgt = latched ? 0 : [1, 0.45, 0, 0][zone] * VMAX;
          v += (tgt - v) * Math.min(1, dt * (tgt < v ? 4 : 1.6));
          Z += v * dt;
        }
        let ph;
        if (zone === 3) ph = 3;
        else if (latched) ph = pressed ? 5 : 4;
        else if (rel >= 0 && t - rel < 1.4) ph = 5;
        else ph = zone;   // 0 normal, 1 warning, 2 stop
        return { Z, v, latched, zone, ph, pressed, px: personX(t) };
      }
      const TXT = [
        S.t({ ko: '정상 주행', en: 'Driving' }),
        S.t({ ko: '경고 구역 · 감속', en: 'Warning zone · slow down' }),
        S.t({ ko: '정지 구역 · 정지', en: 'Stop zone · stop' }),
        S.t({ ko: '가상 범퍼 · E-STOP 래칭', en: 'Virtual bumper · E-STOP latched' }),
        S.t({ ko: '사람 이탈 · 래칭 유지', en: 'Person gone · latch held' }),
        S.t({ ko: '리셋 입력 · 해제 후 재출발', en: 'Reset input · released, moving again' })
      ];

      D.labels(box, [
        { t: { ko: '3단 가상 범퍼', en: 'Three-zone virtual bumper' }, c: 's r', obj: 'bumper', off: [HW + 40, 0, 190] },
        { t: 'LiDAR', c: 's n', obj: 'lidar', off: [0, 12, 0] },
        { t: 'ToF', c: 's c', obj: 'sensor', off: [-18, 10, 30] },
        { t: { ko: '리셋 입력', en: 'Reset input' }, c: 's o', obj: 'reset', off: [3, 0, 0], ph: '5' }
      ]);
      const read = box.querySelector('.readout');
      let last = '';

      return {
        anchors: { lidar, sensor, bumper, reset: resetBtn },
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
          [3, 2, 1].forEach((z, k) => { // bandM[0] = E-STOP bumper (3), [1] = stop (2), [2] = warning (1)
            const m = bandM[k];
            m.opacity = hot === z ? blink : 0.22;
            m.emissiveIntensity = hot === z ? 1.4 : 0.6;
          });
          resetBtnM.emissiveIntensity = st.pressed || (st.ph === 5) ? 1.8 : 0;
          resetBtn.position.x = st.pressed ? 46.5 : 47.5;
          // status lamps and beacon
          const lit = st.latched || st.zone === 3 ? 2 : (st.zone > 0 ? 1 : 0);
          lamps.forEach((m, i) => { m.emissiveIntensity = i === lit ? (st.latched ? (blink > 0.5 ? 1.6 : 0.5) : 1.6) : 0.08; });
          beaconM.emissiveIntensity = st.latched ? (blink > 0.5 ? 2.2 : 0.15) : 0.05;
          beaconGlow.material.opacity = st.latched && blink > 0.5 ? 0.3 : 0;
          // sensors
          sweep.rotation.y = -s * 2.6;
          const u = (s / 2.4) % 1; ring.scale.setScalar(20 + 150 * u); ringM.opacity = 0.35 * (1 - u);
          // fork height stays fixed
          car.position.y = 3;
          box.dataset.ph = st.ph;
          if (read && TXT[st.ph] !== last) { read.textContent = TXT[st.ph]; last = TXT[st.ph]; }
        }
      };
    }
  });
})(typeof window !== 'undefined' ? window.Scene3D : null);
