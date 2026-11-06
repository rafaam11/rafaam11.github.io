const test = require('node:test'); const assert = require('node:assert/strict');
const data = require('../js/portfolio-data.js');
const by = slug => data.projects.find(p => p.slug === slug);
const text = JSON.stringify(data.projects);
test('refresh 2026-11: no stale facts remain', () => {
  for (const stale of ['8개 3D 모델', 'eight 3D models', '게이팅 윈도우', 'gating window', '계획 CT 정합', '3단 가상 범퍼', 'three-tier virtual bumper', '계속 유지보수합니다', '2024 – present', 'v1.24 — 프로젝트 시작 화면']) {
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
