const test = require('node:test');
const assert = require('node:assert/strict');
const data = require('../js/portfolio-data.js');
const render = require('../js/portfolio-render.js');

const clone = () => structuredClone(data);

test('project groups show a technology line on Projects but not on Home', () => {
  for (const locale of ['ko', 'en']) {
    const groups = render.projectGroupsHtml(data, '../', true, locale);
    assert.equal((groups.match(/class="sc-project__tech"/g) || []).length, data.projects.length);
    assert.match(groups, /3D Slicer, Open3D|Python, Open3D, OpenCV/);
    assert.doesNotMatch(groups, /sc-project__facts/);
    assert.doesNotMatch(render.homeProjectGalleryHtml(data, './', true, locale), /sc-project__tech/);
  }
});

test('tier slugs set the order of cases inside a group', () => {
  const value = clone();
  const tier = value.tiers[0];
  const members = value.projects.filter((project) => project.tier === tier.key).map((project) => project.slug);
  tier.slugs = members.slice().reverse();
  assert.deepEqual(render.validatePortfolioData(value), []);
  const html = render.projectGroupsHtml(value, '../', true, 'en');
  const section = html.split('<section').find((part) => part.includes(`data-tier="${tier.key}"`));
  assert.deepEqual([...section.matchAll(/data-project="([^"]+)"/g)].map((match) => match[1]), tier.slugs);
  tier.slugs = members.slice(1);
  assert.match(render.validatePortfolioData(value).join('\n'), /slugs/);
});

test('capabilities name current expertise, not research direction', () => {
  const titles = data.capabilities.map((capability) => [capability.translations.ko.title, capability.translations.en.title]);
  assert.deepEqual(titles.slice(0, 4), [
    ['수술 내비게이션·광학 추적', 'Surgical Navigation & Optical Tracking'],
    ['3D 정합·컴퓨터비전', '3D Registration & Computer Vision'],
    ['XR·공간 컴퓨팅', 'XR & Spatial Computing'],
    ['로봇 비전·센서 통합', 'Robot Vision & Sensor Integration']
  ]);
  const xr = data.capabilities.find((capability) => capability.key === 'xr-engineering');
  for (const method of ['OpenXR', 'Galaxy XR', 'HoloLens 2']) assert.ok(xr.methods.includes(method), method);
  // Overclaims the owner ruled out: robot-assisted surgery development, SLAM, fusion-algorithm or Physical AI expertise.
  assert.doesNotMatch(JSON.stringify({ capabilities: data.capabilities, tiers: data.tiers, projects: data.projects }),
    /SLAM|sensor-fusion algorithm|Physical AI expert|robot-assisted surg|로봇 보조 수술/i);
});

test('case eyebrows carry the new group names', () => {
  const tierLabel = Object.fromEntries(data.tiers.map((tier) => [tier.key, tier.translations]));
  for (const project of data.projects) {
    for (const locale of ['ko', 'en']) {
      assert.ok(project.translations[locale].eyebrow.startsWith(tierLabel[project.tier][locale].label + ' · '), `${project.slug} ${locale}`);
    }
  }
});
