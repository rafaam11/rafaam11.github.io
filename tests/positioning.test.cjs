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
