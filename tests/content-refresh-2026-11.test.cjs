const test = require('node:test'); const assert = require('node:assert/strict');
const data = require('../js/portfolio-data.js');
const by = slug => data.projects.find(p => p.slug === slug);
const text = JSON.stringify(data.projects);
test('refresh 2026-11: no stale facts remain', () => {
  for (const stale of ['8개 3D 모델', 'eight 3D models', '게이팅 윈도우', 'gating window', '계획 CT 정합', '3단 가상 범퍼', 'three-tier virtual bumper', '계속 유지보수합니다', '2024 – present', 'v1.24 — 프로젝트 시작 화면']) {
    assert.ok(!text.includes(stale), stale);
  }
});
