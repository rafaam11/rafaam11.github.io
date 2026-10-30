/* omfsvr: three-user VR consultation room as a procedural cutaway (no patient data, generic avatars).
 * Clinician 1 (master), the patient and clinician 2 sit at an oval desk wearing headsets and look at one shared
 * segmented 3D jaw model; a wall panel shows 2D measurement pages. Model pose and page number are shared through a
 * synchronization service (dashed lines from each headset). 8 s loop.
 */
(function (S) {
  'use strict';
  if (!S) return;
  S.register('omfsvr', {
    target: [-26, 130, 46], dist: 575, yaw: Math.PI + 0.5, pitch: 0.55, fov: 30, autoYaw: 0.015, ground: false, stillTime: 1.6,
    fit: { box: [[-140, 40, -95], [140, 226, 90]], fill: 1 },
    build(scene, THREE, box) {
      const D = S, V = (x, y, z) => new THREE.Vector3(x, y, z), doc = box.ownerDocument;
      const XL = -203, XR = 204, ZF = -188, ZB = 190, H = 270, CX = (XL + XR) / 2, CZ = (ZF + ZB) / 2, W = XR - XL, L = ZB - ZF;
      const textures = [];

      // ---- procedural canvas textures (drawn here, no image files)
      function canvasTex(w, h, draw, rep) {
        const c = doc.createElement('canvas'); c.width = w; c.height = h;
        draw(c.getContext('2d'), w, h);
        const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
        if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
        textures.push(t);
        return t;
      }
      function rnd(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
      function texMat(map, o) {
        const m = new THREE.MeshStandardMaterial({ map, roughness: o.rough, metalness: 0, envMapIntensity: 0.35 });
        if (o.emissive) { m.emissive = new THREE.Color(o.emissive); m.emissiveMap = map; }
        return m;
      }

      // ---- floor: grey ceramic tiles
      const floorTex = canvasTex(512, 512, (x, w) => {
        const r = rnd(7);
        for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
          const g = 138 + Math.floor(r() * 10);
          x.fillStyle = `rgb(${g + 3},${g},${g - 4})`; x.fillRect(i * 256, j * 256, 256, 256);
          for (let k = 0; k < 90; k++) {
            const a = r() * 0.05; x.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,38,35'},${a})`;
            x.beginPath(); x.ellipse(i * 256 + 20 + r() * 216, j * 256 + 20 + r() * 216, 10 + r() * 26, 6 + r() * 14, 0, 0, 7); x.fill();
          }
        }
        x.fillStyle = '#c4c1bb'; [0, 256].forEach(q => { x.fillRect(0, q, w, 4); x.fillRect(q, 0, 4, w); });
      }, [W / 136, L / 136]);
      const floor = D.mesh(THREE, new THREE.PlaneGeometry(W, L), texMat(floorTex, { rough: 0.42 }), CX, 0, CZ);
      floor.rotation.x = -Math.PI / 2; scene.add(floor);
      const slab = D.mesh(THREE, new THREE.BoxGeometry(W + 28, 12, L + 28), D.mat(THREE, 0xd9dde3, { rough: 0.8 }), CX, -6.05, CZ);
      slab.userData.noShadow = true; scene.add(slab);

      // ---- walls: fabric wall (+x) and the white panel wall (+z)
      const wallTex = canvasTex(256, 256, (x) => {
        const r = rnd(11);
        x.fillStyle = '#a0968a'; x.fillRect(0, 0, 256, 256);
        for (let yy = 0; yy < 256; yy += 4) for (let xx = 0; xx < 256; xx += 4) {
          const on = ((xx + yy) / 4) % 2 === 0, v = 150 + Math.floor(r() * 40);
          x.fillStyle = on ? `rgb(${v + 12},${v + 6},${v - 6})` : `rgb(${v - 30},${v - 34},${v - 40})`;
          x.fillRect(xx, yy, on ? 4 : 3, on ? 3 : 4);
        }
        for (let k = 0; k < 400; k++) { x.fillStyle = `rgba(${r() < 0.5 ? '200,215,225' : '60,50,40'},0.25)`; x.fillRect(r() * 256, r() * 256, 1, 2 + r() * 3); }
      }, [L / 60, H / 60]);
      const wallR = D.mesh(THREE, new THREE.PlaneGeometry(L, H), texMat(wallTex, { rough: 0.95, emissive: 0x2a2724 }), XR, H / 2, CZ);
      wallR.rotation.y = -Math.PI / 2; scene.add(wallR);
      const wallB = D.mesh(THREE, new THREE.PlaneGeometry(W, H), D.mat(THREE, 0xeeebe6, { rough: 0.9, emissive: 0x3a3836 }), CX, H / 2, ZB);
      wallB.rotation.y = Math.PI; scene.add(wallB);
      const capM = D.mat(THREE, 0xf6f6f4, { rough: 0.7 });
      const cap = (w, h, d, x, y, z) => { const m = D.mesh(THREE, new THREE.BoxGeometry(w, h, d), capM, x, y, z); m.userData.noShadow = true; scene.add(m); return m; };
      cap(14, 4, L + 14, XR + 7, H - 2, CZ);
      cap(W + 28, 4, 14, CX, H - 2, ZB + 7);
      cap(14, H, 14, XR + 7, H / 2, ZB + 7);
      const CUT = 26;                                   // cut walls (-x, window side -z) drawn low
      cap(14, CUT, L + 14, XL - 7, CUT / 2, CZ);
      cap(W + 28, CUT, 14, CX, CUT / 2, ZF - 7);
      cap(14, H, 14, XR + 7, H / 2, ZF - 7);
      cap(14, H, 14, XL - 7, H / 2, ZB + 7);
      const alu = D.mat(THREE, 0xb9bec4, { rough: 0.35, metal: 0.6 });
      [[-157, -89], [-85, -12], [5, 79], [83, 151]].forEach(([a, b]) => {
        scene.add(D.mesh(THREE, new THREE.BoxGeometry(b - a, 3, 5), alu, (a + b) / 2, CUT + 1.5, ZF - 3));
        [a, b].forEach(x => scene.add(D.mesh(THREE, new THREE.BoxGeometry(3, 10, 5), alu, x, CUT + 5, ZF - 3)));
      });
      const glass = D.mesh(THREE, new THREE.PlaneGeometry(310, 8), D.mat(THREE, 0x9fb4c4, { opacity: 0.35, side: true }), -3, CUT + 6, ZF - 3);
      glass.userData.noShadow = true; scene.add(glass);
      const base = D.mat(THREE, 0xdedbd6, { rough: 0.6 });
      [[W, CX, ZB - 0.6, 0], [L, XR - 0.6, CZ, 1]].forEach(([len, x, z, r]) => {
        const m = D.mesh(THREE, new THREE.BoxGeometry(r ? 1.2 : len, 8, r ? len : 1.2), base, x, 4, z); m.userData.noShadow = true; scene.add(m);
      });

      // ---- wall panel (+z wall): 2D measurement pages, the page number is shared
      const SCX = -72, SCW = 228, SCY0 = 84, SCY1 = 224, SCZ = 182;
      function pageTex(kind) {
        return canvasTex(512, 320, (x, w, h) => {
          x.fillStyle = '#fbfbfd'; x.fillRect(0, 0, w, h);
          x.fillStyle = '#4b5bb8'; x.fillRect(14, h - 16, w - 28, 5);
          x.fillStyle = '#2f3f9a'; x.fillRect(22, 24, 120, 8);
          x.fillStyle = '#c9cede'; x.fillRect(22, 42, 150, 1.5);
          const arch = (cx, cy, s, col) => {
            x.strokeStyle = '#4a5466'; x.lineWidth = 2;
            x.beginPath(); x.ellipse(cx, cy, 40 * s, 52 * s, 0, Math.PI, 0); x.lineTo(cx + 40 * s, cy + 18 * s); x.moveTo(cx - 40 * s, cy); x.lineTo(cx - 40 * s, cy + 18 * s); x.stroke();
            x.beginPath(); x.ellipse(cx, cy, 26 * s, 36 * s, 0, Math.PI, 0); x.stroke();
            x.strokeStyle = col; x.setLineDash([4, 3]); x.beginPath(); x.moveTo(cx - 48 * s, cy - 18 * s); x.lineTo(cx + 48 * s, cy - 18 * s); x.stroke(); x.setLineDash([]);
            x.fillStyle = '#e04848'; [[-20, -40], [20, -40], [0, -50]].forEach(([dx, dy]) => { x.beginPath(); x.arc(cx + dx * s, cy + dy * s, 2.6, 0, 7); x.fill(); });
          };
          const profile = (cx, cy, s) => {                 // side outline with measurement lines (yellow cranium, purple maxilla, blue mandible)
            const P = (pts, fill) => { x.beginPath(); pts.forEach(([px, py], i) => (i ? x.lineTo : x.moveTo).call(x, cx + px * s, cy + py * s)); x.closePath(); x.fillStyle = fill; x.fill(); x.lineWidth = 1.2; x.strokeStyle = 'rgba(40,44,60,0.55)'; x.stroke(); };
            P([[-30, 6], [-32, -10], [-24, -24], [-8, -31], [10, -29], [24, -20], [30, -8], [31, 4], [27, 10], [24, 18], [10, 18], [-6, 14], [-18, 16], [-28, 14]], '#e8d43a');
            P([[8, 18], [26, 18], [29, 25], [12, 26]], '#8f72d8');
            P([[-12, 14], [-6, 14], [-4, 30], [22, 30], [26, 36], [22, 40], [-2, 40], [-12, 34]], '#3aa0e8');
            x.strokeStyle = '#e04848'; x.lineWidth = 1.6;
            x.beginPath(); x.moveTo(cx - 30 * s, cy + 2 * s); x.lineTo(cx + 30 * s, cy - 2 * s); x.moveTo(cx + 20 * s, cy - 6 * s); x.lineTo(cx + 22 * s, cy + 40 * s); x.stroke();
          };
          const table = (rows, hi) => {
            for (let i = 0; i < rows; i++) {
              const y = 54 + i * 19;
              x.fillStyle = hi.indexOf(i) !== -1 ? '#f4ea6c' : (i % 2 ? '#f1f2f6' : '#ffffff'); x.fillRect(22, y, 270, 16);
              x.fillStyle = '#5b6474'; x.fillRect(28, y + 6, 70 + (i * 37) % 60, 4);
              [196, 236, 270].forEach(cx => x.fillRect(cx - 12, y + 6, 18, 4));
            }
            x.strokeStyle = '#cfd4df'; x.lineWidth = 1; x.strokeRect(22, 54, 270, rows * 19);
          };
          if (kind === 0) { table(12, [0, 1, 3]); arch(400, 128, 0.95, '#2f8fe0'); arch(400, 250, 0.95, '#e04848'); x.strokeStyle = '#d5d9e3'; x.strokeRect(318, 52, 168, 116); x.strokeRect(318, 178, 168, 116); }
          else if (kind === 1) { table(12, [4, 5, 6]); profile(402, 160, 2.2); x.strokeStyle = '#d5d9e3'; x.strokeRect(318, 52, 168, 242); }
          else { table(12, [8, 9]); arch(400, 170, 1.15, '#00a6e8'); x.strokeStyle = '#d5d9e3'; x.strokeRect(318, 70, 168, 200); }
        });
      }
      const pages = [0, 1, 2].map(pageTex);
      const scr = new THREE.Group(); scene.add(scr);
      const metal = D.mat(THREE, 0xc9ced4, { rough: 0.3, metal: 0.7 }), dk = D.mat(THREE, 0x2b2e33, { rough: 0.5 });
      const housing = D.mesh(THREE, new THREE.CylinderGeometry(4.2, 4.2, SCW + 14, 24), metal, SCX, SCY1 + 7, SCZ + 1); housing.rotation.z = Math.PI / 2; scr.add(housing);
      [-1, 1].forEach(s => scr.add(D.mesh(THREE, new THREE.CylinderGeometry(4.8, 4.8, 3, 20), dk, SCX + s * (SCW / 2 + 8), SCY1 + 7, SCZ + 1).rotateZ(Math.PI / 2)));
      scr.add(D.mesh(THREE, new THREE.BoxGeometry(SCW + 6, SCY1 - SCY0 + 6, 0.8), dk, SCX, (SCY0 + SCY1) / 2, SCZ + 1.4));
      const screenMat = new THREE.MeshBasicMaterial({ map: pages[0], toneMapped: false });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCW, SCY1 - SCY0), screenMat);
      screen.position.set(SCX, (SCY0 + SCY1) / 2, SCZ + 0.9); screen.rotation.y = Math.PI; screen.userData.noShadow = true; scr.add(screen);
      scr.add(D.mesh(THREE, new THREE.BoxGeometry(SCW + 2, 2.4, 2.4), dk, SCX, SCY0 - 2, SCZ));

      // ---- oval desk (304 x 123, top at 79)
      const TZ = 10.5, TA = 152, TB = 61.5, TY = 79;
      const white = D.mat(THREE, 0xf7f8fa, { rough: 0.22 });
      const top = D.mesh(THREE, new THREE.CylinderGeometry(1, 1, 1, 96), white, 0, TY - 2.5, TZ); top.scale.set(TA, 5, TB); scene.add(top);
      const lip = D.mesh(THREE, new THREE.CylinderGeometry(1, 0.92, 1, 96), white, 0, TY - 7, TZ); lip.scale.set(TA - 3, 4, TB - 3); scene.add(lip);
      [-1, 1].forEach(s => {
        const leg = D.mesh(THREE, new THREE.CylinderGeometry(1, 1.25, 1, 48), white, s * 88, (TY - 9) / 2, TZ); leg.scale.set(30, TY - 9, 24); scene.add(leg);
      });
      const pad = D.mesh(THREE, new THREE.TorusGeometry(26, 0.6, 8, 72), D.mat(THREE, 0x00b7ff, { emissive: 0x00b7ff, opacity: 0.6 }), 0, TY + 0.4, TZ);
      pad.rotation.x = Math.PI / 2; pad.userData.noShadow = true; scene.add(pad);

      // ---- three chairs on the window side
      const seatM = D.mat(THREE, 0x2f3134, { rough: 0.85 }), wood = D.mat(THREE, 0xd2b183, { rough: 0.6 });
      function chair() {
        const g = new THREE.Group();
        g.add(D.mesh(THREE, D.rbox(THREE, 48, 7, 46, 3), seatM, 0, 45, 0));
        const back = D.mesh(THREE, D.rbox(THREE, 48, 36, 6, 3), seatM, 0, 66, -21); back.rotation.x = -0.16; g.add(back);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
          const l = D.mesh(THREE, new THREE.CylinderGeometry(1.5, 1.0, 44, 10), wood, sx * 18, 21, sz * 17);
          l.rotation.z = -sx * 0.1; l.rotation.x = sz * 0.1; g.add(l);
        });
        return g;
      }
      const SKZ = TZ;
      const seats = [[120, -46], [0, -70], [-110, -48]].map(([x, z]) => {
        const ry = Math.atan2(0 - x, SKZ - z);
        const c = chair(); c.position.set(x, 0, z); c.rotation.y = ry; scene.add(c);
        return { x, z, ry };
      });

      // ---- seated participants (standing person helper with the legs re-posed)
      function seated(p, s) {
        for (let i = 0; i < 4; i++) p.root.remove(p.root.children[0]);
        const cloth = p.root.children[0].material, shoe = D.mat(THREE, 0x2d3440, { rough: 0.5 });
        [-1, 1].forEach(k => {
          const th = D.mesh(THREE, new THREE.CylinderGeometry(6.4, 6.0, 44, 16), cloth, k * 9, 84, 18); th.rotation.x = Math.PI / 2; p.root.add(th);
          const sh = D.mesh(THREE, new THREE.CylinderGeometry(5.0, 4.4, 46, 16), cloth, k * 9, 61, 40); p.root.add(sh);
          p.root.add(D.mesh(THREE, D.rbox(THREE, 10, 6, 24, 2.5), shoe, k * 9, 35, 46));
        });
        p.root.position.set(s.x - Math.sin(s.ry) * 4, -31, s.z - Math.cos(s.ry) * 4);
        p.root.rotation.y = s.ry;
        scene.add(p.root);
        return p;
      }
      const gear = { gear: 'quest', cap: true };
      const docA = seated(D.person(THREE, Object.assign({ color: 0xf1f4f8, capColor: 0x2e2620 }, gear)), seats[0]);
      const pat = seated(D.person(THREE, Object.assign({ color: 0x7fb5a4, skin: 0xe2b99a, capColor: 0x3b3029 }, gear)), seats[1]);
      const docB = seated(D.person(THREE, Object.assign({ color: 0x1c3b69, capColor: 0x23201d }, gear)), seats[2]);
      [docA, pat, docB].forEach(p => { p.head.rotation.x = -0.12; });
      [docA.armL, docB.armL, docB.armR, pat.armL, pat.armR].forEach(a => { a.sh.rotation.x = -0.75; a.el.rotation.x = -0.85; });
      docA.armR.sh.rotation.x = -1.25; docA.armR.sh.rotation.z = 0.12; docA.armR.el.rotation.x = -0.25;
      const ctrl = new THREE.Group(); ctrl.position.set(0, -2, 0); docA.armR.hand.add(ctrl);
      ctrl.add(D.mesh(THREE, new THREE.CylinderGeometry(1.6, 2.0, 10, 12), D.mat(THREE, 0x2d3440, { rough: 0.5 }), 0, -3, 0));
      const ring = D.mesh(THREE, new THREE.TorusGeometry(3.6, 0.7, 8, 24), D.mat(THREE, 0x2d3440, { rough: 0.5 }), 0, -9, 0); ring.rotation.x = 0.4; ctrl.add(ring);
      const tip = new THREE.Object3D(); tip.position.set(0, -9, 0); ctrl.add(tip);

      // ---- shared 3D jaw model: segments in colour (yellow cranium, purple maxilla, blue mandible)
      const yellow = D.mat(THREE, 0xe8d43a, { rough: 0.5 });
      const skull = D.skull(THREE, { bone: yellow });
      const blue = D.mat(THREE, 0x3aa0e8, { rough: 0.45 }), purple = D.mat(THREE, 0x8f72d8, { rough: 0.5 });
      skull.mandible.traverse(o => { if (o.isMesh && o.material === yellow) o.material = blue; });
      const maxilla = D.mesh(THREE, new THREE.SphereGeometry(1, 24, 16), purple, 0, -5.0, 5.2); maxilla.scale.set(5.0, 2.3, 4.0); skull.root.add(maxilla);
      const hitList = []; skull.root.traverse(o => { if (o.isMesh) hitList.push(o); });
      const SC = 3.3, SY = 138;
      skull.root.scale.setScalar(SC); skull.root.position.set(0, SY, SKZ); scene.add(skull.root);

      // ---- controller ray and pointed spot
      const rayM = D.mat(THREE, 0x00b7ff, { emissive: 0x00b7ff, opacity: 0.85 });
      const ray = D.mesh(THREE, new THREE.CylinderGeometry(0.9, 0.9, 1, 8), rayM); ray.userData.noShadow = true; scene.add(ray);
      const spot = D.mesh(THREE, new THREE.SphereGeometry(1.8, 14, 10), D.mat(THREE, 0x00b7ff, { emissive: 0x00b7ff })); spot.userData.noShadow = true; scene.add(spot);
      const rc = new THREE.Raycaster(), tgt = V(0, 0, 0), dir = V(0, 0, 0), aim = V(0, 0, 0), hv = V(0, 0, 0), up = V(0, 1, 0);

      // ---- synchronization: each headset -> a small sphere, dashed lines with moving dots
      const srv = new THREE.Group(); srv.position.set(118, 178, 40); scene.add(srv);
      srv.add(D.mesh(THREE, new THREE.SphereGeometry(6, 24, 16), D.mat(THREE, 0x00b7ff, { emissive: 0x00648c, rough: 0.25 })));
      const sr = D.mesh(THREE, new THREE.TorusGeometry(10, 0.45, 8, 48), D.mat(THREE, 0x1e5aa8, { opacity: 0.6 })); sr.rotation.x = Math.PI / 2; srv.add(sr);
      const heads = [docA, pat, docB].map(p => p.head);
      const links = heads.map(() => { const l = D.dashLink(THREE, 0x00b7ff, 4); l.material.opacity = 0.5; scene.add(l); return l; });
      const dotM = D.mat(THREE, 0x00b7ff, { emissive: 0x00b7ff, opacity: 0.85 });
      const dots = [];
      heads.forEach((h, i) => { for (let k = 0; k < 2; k++) { const d = D.mesh(THREE, new THREE.SphereGeometry(1.6, 10, 8), dotM); d.userData.noShadow = true; scene.add(d); dots.push({ d, i, k }); } });

      // soft window light on the walls and the panel (no shadows)
      const win = new THREE.DirectionalLight(0xfff8ee, 0.38); win.position.set(-120, 260, -420); win.target.position.set(0, 80, 60);
      scene.add(win, win.target);

      // first half: the three participants; second half: model, measurement panel, synchronization
      D.labels(box, [
        { t: { ko: 'CT 기반 3D 악골 모델', en: 'CT-derived 3D jaw model' }, c: 's c', at: [0, SY + 22, SKZ] },
        { t: { ko: '의사1(Master)', en: 'Clinician 1 (master)' }, c: 's n', obj: 'docA', off: [0, 14, 0], ph: '1' },
        { t: { ko: '환자', en: 'Patient' }, c: 's', obj: 'pat', off: [0, 14, 0], ph: '1' },
        { t: { ko: '의사2', en: 'Clinician 2' }, c: 's n', obj: 'docB', off: [0, 14, 0], ph: '1' },
        { t: { ko: '2D 계측 패널', en: '2D measurement panel' }, c: 's', at: [SCX + 40, SCY0 + 30, SCZ - 2], ph: '2' },
        { t: { ko: '상태 동기화', en: 'State synchronization' }, c: 's n', at: [srv.position.x, srv.position.y + 8, srv.position.z], ph: '2' }
      ]);
      const read = box.querySelector('.readout');
      if (read) read.textContent = S.t({ ko: '참여 3명 · 모델 자세와 페이지 동기화', en: 'Three participants · shared model pose and page' });

      let pageNo = 0;
      return {
        anchors: { docA: docA.head, pat: pat.head, docB: docB.head },
        tick(s) {
          const T = Math.PI * 2 * s / 8, ph = (s % 8) / 8;
          box.dataset.ph = ph < 0.5 ? 1 : 2;
          // model: turns slowly toward the participants (shared pose)
          skull.root.rotation.y = Math.PI - 0.5 + 0.7 * Math.sin(T);
          skull.root.position.y = SY + Math.sin(T * 2) * 1.2;
          // shared page number
          const pn = Math.min(2, Math.floor(ph * 3));
          if (pn !== pageNo) { pageNo = pn; screenMat.map = pages[pn]; screenMat.needsUpdate = true; }
          pad.rotation.z = T;
          // ray: controller tip -> a point on the model
          skull.root.updateMatrixWorld(true); docA.root.updateMatrixWorld(true);
          tip.getWorldPosition(hv);
          aim.set(Math.sin(T) * 12, SY - 8 + Math.sin(T * 2) * 8, SKZ - 8);
          dir.copy(aim).sub(hv).normalize();
          rc.set(hv, dir);
          const hit = rc.intersectObjects(hitList, false)[0];
          tgt.copy(hit ? hit.point : aim);
          ray.position.copy(hv).add(tgt).multiplyScalar(0.5);
          ray.scale.set(1, hv.distanceTo(tgt), 1);
          ray.quaternion.setFromUnitVectors(up, dir.copy(tgt).sub(hv).normalize());
          spot.position.copy(tgt);
          spot.scale.setScalar(1 + 0.25 * Math.sin(T * 4));
          // synchronization lines and moving dots
          heads.forEach((h, i) => { h.getWorldPosition(hv); hv.y += 16; links[i].set(hv, srv.position); });
          dots.forEach(o => {
            heads[o.i].getWorldPosition(hv); hv.y += 16;
            const u = (s / 2 + o.k / 2 + o.i * 0.17) % 1;
            o.d.position.copy(hv).lerp(srv.position, u);
            o.d.scale.setScalar(0.5 + 0.6 * Math.sin(Math.PI * u));
          });
          sr.rotation.z = T;
        },
        dispose() { textures.forEach(t => t.dispose()); }
      };
    }
  });
})(typeof window !== 'undefined' ? window.Scene3D : null);
