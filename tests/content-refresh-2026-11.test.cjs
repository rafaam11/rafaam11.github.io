const test = require('node:test'); const assert = require('node:assert/strict');
const data = require('../js/portfolio-data.js');
const by = slug => data.projects.find(p => p.slug === slug);
const text = JSON.stringify(data.projects);
test('refresh 2026-11: no stale facts remain', () => {
  for (const stale of ['8개 3D 모델', 'eight 3D models', '3단 가상 범퍼', 'three-tier virtual bumper', 'three-zone virtual bumper', '계획 CT 정합', '계속 유지보수합니다', '2024 – present', 'v1.24 — 프로젝트 시작 화면']) {
    assert.ok(!text.includes(stale), stale);
  }
});

test('surgical-navigation: lineage title, XR status, mirror year', () => {
  const p = by('surgical-navigation');
  assert.equal(p.translations.ko.title, '구강악안면 수술 내비게이션 (SMCNavi → OprNavi → OmfsNavi)');
  assert.equal(p.translations.en.title, 'Oral and Maxillofacial Surgical Navigation (SMCNavi → OprNavi → OmfsNavi)');
  assert.ok(p.storySections.some(s => s.key === 'navigation-lineage'));
  assert.deepEqual(p.pdfSequence.middle, ['smcnavi-overview', 'smcnavi-workflows', 'registration-calibration', 'hololens-interface']);
  for (const locale of ['ko', 'en']) {
    const j = JSON.stringify(p.translations[locale]) + JSON.stringify(p.storySections) + JSON.stringify(p.web[locale]);
    assert.match(j, /OprNavi/); assert.match(j, /OmfsNavi/); assert.match(j, /Galaxy XR/);
    assert.match(j, /2024[–-]2025/);
  }
  assert.doesNotMatch(p.translations.ko.role, /2026년[^.]*미러 평면/);
  assert.match(p.translations.ko.role, /2025[^.]*미러 평면|미러 평면[^.]*2025/);
  assert.doesNotMatch(p.translations.ko.limitation, /패키징은 제품화 수준으로 마무리되지 않았습니다/);
  assert.ok(['C++', 'Qt 6', 'CTest'].every(t => p.tech.includes(t)));
});

test('rtms-navigation: handed over 2026-08, evaluation lives in a tool branch', () => {
  const p = by('rtms-navigation');
  assert.equal(p.period, '2024.07 – 2026.08'); assert.equal(p.lifecycleState, 'completed'); assert.equal(p.evidenceState, 'verified');
  assert.doesNotMatch(p.translations.ko.summary, /계속 유지보수/);
  assert.match(p.translations.ko.summary, /2026\.08|2026년 8월/);
  assert.doesNotMatch(JSON.stringify(p.web.ko.points), /표적별 거리·RMSE·CSV 비교 기능/);
  assert.match(JSON.stringify(p.web.ko.points) + JSON.stringify(p.blocks), /평가 전용 브랜치|평가 브랜치/);
  assert.match(p.translations.ko.role, /7\.1\.2/); assert.match(p.translations.ko.role, /어댑터/);
  assert.match(p.translations.ko.role, /NaviClient/);
  const cv = require('../data/public-cv.json'); const rows = JSON.stringify(cv, null, 2);
  assert.match(rows, /"slug": "rtms-navigation",\s*"period": "2024\.07–2026\.08"/);
  assert.equal(p.translations.en.status, 'Verified · Completed (handed over 2026.08)');
  assert.doesNotMatch(JSON.stringify(p.web.en.points), /Per-target distance, RMSE, CSV comparison/);
  assert.match(rows, /"slug": "rtms-navigation",\s*"period": "2024\.07–2026\.08"[\s\S]*?"Quantitative evaluation tool \(eval branch\)"/);
});

test('digital-occlusion-workflow: four source STLs, hospital-provided AI model, 2026 features', () => {
  const p = by('digital-occlusion-workflow'); const j = JSON.stringify(p);
  assert.doesNotMatch(j, /8개 (3D )?모델|eight[- ](3D )?model|Eight 3D/i);
  assert.match(j, /STL 4개/); assert.match(j, /Four source STLs/i);
  assert.match(p.translations.ko.teamResult, /삼성서울병원 연구팀이 제공한/);
  assert.doesNotMatch(p.translations.ko.teamResult, /DIGITRACK 협업 팀은 특징점 알고리즘/);
  assert.match(p.translations.en.teamResult, /Samsung Medical Center research team/i);
  for (const f of ['그라인딩', 'Overjet', 'Overbite', 'Midline', '622', 'Slicer 5.12.4', 'ONNX']) assert.ok(j.includes(f), f);
  assert.ok(['Qt 6', 'ONNX Runtime', 'CTest', 'NSIS'].every(t => p.tech.includes(t)));
});

test('respiratory-surface-guidance: no gating or CT-registration claims; first-year sensor validation done', () => {
  const p = by('respiratory-surface-guidance'); const j = JSON.stringify(p);
  assert.doesNotMatch(j, /게이팅 신호|게이팅 윈도우(?! 단계는 다음 단계\(계획\)|\(계획)|계획 CT 정합|gating signal|gating window|CT registration(?! \(planned)/i);
  assert.match(j, /게이팅\(계획\)|gating \(planned\)/);
  assert.match(j, /STL 기준/); assert.match(j, /point-to-surface ICP/);
  const t = p.translations;
  assert.match(t.ko.summary, /1차년도[^"]*완료/); assert.match(t.en.summary, /first-year[^"]*complete/i);
  assert.match(t.ko.summary, /2차년도/); assert.match(t.en.summary, /second year/i);
  assert.ok(!p.tech.includes('Python') && !p.tech.includes('4DCT'));
  const cv = JSON.stringify(require('../data/public-cv.json'));
  assert.doesNotMatch(cv, /"4DCT 정합"|"4DCT registration"/);
  const fs = require('fs');
  for (const f of ['projects/respiratory-surface-guidance/index.html', 'en/projects/respiratory-surface-guidance/index.html']) {
    const html = fs.readFileSync(require('path').join(__dirname, '..', f), 'utf8');
    assert.doesNotMatch(html, /게이트 신호|gating signal/i, f);
    assert.ok(html.includes(f.startsWith('en/') ? p.scene3d.translations.en.alt : p.scene3d.translations.ko.alt), f);
  }
});

test('life-careverse: preprocessing tool 2026.07 then maintenance', () => {
  const j = JSON.stringify(by('life-careverse'));
  assert.match(j, /2026\.07[^"]*유지보수|maintenance/); assert.match(j, /슬라이드 에디터|slide editor/i);
});
test('skadi: 2026-07 desktop stabilisation and API 7 python binding', () => {
  const j = JSON.stringify(by('skadi-tracking-software'));
  assert.match(j, /연결 진단 로그|connection diagnostic log/i); assert.match(j, /API 7/);
});

test('unmanned-forklift: cart recognition/classification workflow, field trial status, safety wording', () => {
  const p = by('unmanned-forklift'); const j = JSON.stringify(p);
  assert.doesNotMatch(j, /3단 가상 범퍼|three-(tier|zone) virtual bumper/i);
  assert.match(j, /E-STOP 래칭|E-STOP latch/i);
  for (const f of ['DINOv2', 'top-3', '99.5', '2,010', '4.66', 'Isaac Sim', 'ChArUco', '24종', '8묶음']) assert.ok(j.includes(f), f);
  assert.match(j, /고객 현장 시험 운용|customer-site trial/i);
  assert.doesNotMatch(p.translations.ko.limitation, /공개 클립과 사진은 시험장 테스트입니다/);
  assert.ok(p.tech.includes('DINOv2') && p.tech.includes('Isaac Sim'));
});

test('ai-build-lab: period from Claude Code launch, eight subcases, community line, caption date', () => {
  const p = by('ai-build-lab');
  assert.equal(p.period, '2025.05 – present');
  assert.deepEqual(p.subcases.map(s => s.key), ['llm-wiki', 'multi-cli-work', 'harness-manager', 'view-anything', 'daegu-bus', 'deck', 'bolt', 'jk-video-editor']);
  const j = JSON.stringify(p);
  assert.match(j, /Claude Code in Daegu/); assert.match(j, /약 160명|about 160 people/);
  assert.doesNotMatch(j, /네 앱의 공개 저장소|Four apps with public repos/);
  assert.match(p.translations.ko.mediaCaption, /2026\.07 촬영|v1\.24 \(2026/);
  for (const f of ['모바일 원격', 'doctor', 'LAS', '정류장 중심']) assert.ok(j.includes(f), f);
  assert.doesNotMatch(j, /github\.com\/rafaam11\/(deck|bolt|jk-video-editor)/);
  assert.match(p.translations.en.mediaCaption, /\(captured 2026\.07\)/);
  for (const k of ['deck', 'bolt', 'jk-video-editor']) { const t = p.subcases.find(s => s.key === k).translations; assert.match(t.ko.summary, /비공개/, k); assert.match(t.en.summary, /private/, k); }
});
