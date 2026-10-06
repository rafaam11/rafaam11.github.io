const test = require('node:test');
const assert = require('node:assert/strict');
const data = require('../js/portfolio-data.js');
const renderer = require('../js/portfolio-render.js');
const profile = require('../scripts/profile-home.cjs');
const cv = require('../data/public-cv.json');

test('News sorts dates, groups years, limits Home to five, and handles an empty list', () => {
  const entries = Array.from({length:7},(_,i) => ({...data.news[0],id:`news-${i}`,eventDate:`202${i}`,datePrecision:'year'}));
  const home = profile.renderNews('en',entries,{base:'../',limit:5,groupYears:false});
  assert.equal((home.match(/data-news-id=/g)||[]).length,5);
  assert.ok(home.indexOf('news-6') < home.indexOf('news-5'));
  assert.doesNotMatch(home,/news-0|news-1/);
  assert.match(profile.renderNews('ko',entries),/id="news-2026"/);
  assert.match(profile.renderNews('ko',[]),/아직 등록된 소식이 없습니다/);
  assert.match(profile.renderNews('en',[]),/No news yet/);
  assert.deepEqual(profile.newsErrors(),[]);
});
test('News requires both languages, public evidence, and real dates', () => {
  const item = structuredClone(data.news[0]);
  item.eventDate='2026-02-31'; item.datePrecision='day';
  delete item.translations.en;
  item.evidence.path = 'missing-public-record';
  assert.equal(profile.newsErrors([item]).length,3);
});
test('Home selects three projects in research order while Projects retains nine concise entries', () => {
  for (const locale of ['ko','en']) {
    const home = profile.renderHome(locale,cv);
    const slugs = [...home.matchAll(/data-project="([^"]+)"/g)].map(m=>m[1]);
    assert.deepEqual(slugs,['digital-occlusion-workflow','mandibular-fracture','surgical-navigation']);
    const projects = renderer.projectGroupsHtml(data,'../',true,locale);
    assert.equal((projects.match(/data-project=/g)||[]).length,9);
    assert.doesNotMatch(projects,/sc-project__facts/);
    assert.match(home,/news\/index\.html/);
    assert.match(home,/cv\/index\.html/);
  }
});
test('Home achievements use CV publications and current patent status', () => {
  const derived = profile.highlightsFromCv(cv);
  assert.equal(derived.publications.length,3);
  assert.match(derived.publications[0].translations.en.title,/OMFS VR/);
  assert.match(derived.publications[2].translations.en.venue,/ACCAS 2022/);
  assert.doesNotMatch(derived.publications[2].translations.en.venue,/Bangkok/);
  const cup = derived.patents.items.find(p=>p.translations.ko.title.includes('종이컵'));
  assert.equal(cup.status,'filed');
  const changed = structuredClone(cv); changed.patents.pop();
  assert.notEqual(profile.achievementsHtml('en',cv,''),profile.achievementsHtml('en',changed,''));
});
test('generated profile pages and legacy compatibility highlights are fresh', () => {
  assert.deepEqual(profile.freshnessErrors(),[]);
});
test('mandibular descriptions distinguish the lingual and buccal figures', () => {
  const gallery = data.projects.find(p=>p.slug==='mandibular-fracture').media.gallery;
  assert.match(gallery[0].translations.ko.caption,/설측 교두/);
  assert.match(gallery[0].translations.en.caption,/lingual cusp/);
  assert.match(gallery[1].translations.en.alt,/buccal-cusp/);
});
test('case pages keep one shared boundary while preserving distinct OMFS validation status', () => {
  const rtms = renderer.caseStudyHtml(data,'rtms-navigation','../../',true,'en');
  assert.equal((rtms.match(/No clinical efficacy, quantitative accuracy, or regulatory status is claimed/g)||[]).length,1);
  const omfs = renderer.caseStudyHtml(data,'life-careverse','../../',true,'en');
  assert.match(omfs,/external-hospital validation is still planned/);
  assert.match(omfs,/My role/);
  assert.match(omfs,/team result/);
});
test('new distinct case limitations remain visible alongside the consolidated boundary', () => {
  const candidate = structuredClone(data);
  candidate.projects.find(p=>p.slug==='rtms-navigation').blocks.push({
    key:'additional-device-limit',type:'limitation',translations:{
      ko:{heading:'추가 장치 제한',body:'이 연결 방식에서는 추가 장치를 지원하지 않습니다.'},
      en:{heading:'Additional device limitation',body:'This connection does not support additional devices.'}
    }
  });
  const html = renderer.caseStudyHtml(candidate,'rtms-navigation','../../',true,'en');
  assert.match(html,/This connection does not support additional devices/);
  assert.equal((html.match(/No clinical efficacy, quantitative accuracy, or regulatory status is claimed/g)||[]).length,1);
});
test('software News dates match public release evidence in Asia/Seoul', () => {
  const sources = require('../data/news-software-sources.json');
  const software = data.news.filter(item=>item.evidence.path==='data/news-software-sources.json');
  assert.equal(software.length,sources.releases.length);
  for (const release of sources.releases) {
    const matches = software.filter(item=>item.evidence.dateSource===release.url);
    assert.equal(matches.length,1,`one News event for ${release.repository} ${release.tag}`);
    const item = matches[0];
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(release.publishedAt)).map(part=>[part.type,part.value]));
    assert.equal(item.eventDate,`${parts.year}-${parts.month}-${parts.day}`);
    assert.equal(item.datePrecision,'day');
    assert.equal(item.evidence.locator,`${release.repository} ${release.tag}`);
    assert.ok(item.links.some(link=>link.href===release.url));
    assert.ok(item.links.some(link=>link.route==='projects/ai-build-lab/'));
  }
  assert.equal(software.find(item=>item.id==='multi-cli-work-v1-0-0').eventDate,'2026-07-12');
});
test('historical News preserves filing dates, shared authorship, and coverage without duplicated conference awards', () => {
  const find = id => data.news.find(item=>item.id===id);
  assert.deepEqual(profile.newsErrors(),[]);
  for (const id of ['omfs-vr-poster-2026','digital-occlusion-redesign-2026','mandibular-paper-2024','dgist-masters-degree-2023','digitrack-researcher-2023','invention-excellence-award-2015']) assert.ok(find(id),id);
  for (const item of data.news.filter(item=>item.id.includes('patent-application'))) {
    assert.equal(item.datePrecision,'month');
    assert.match(item.translations.ko.body,/출원/);
    assert.doesNotMatch(item.translations.ko.body,/등록/);
    assert.doesNotMatch(JSON.stringify(item),/10-\d{4}-\d{7}/);
    const period = item.eventDate.replace('-','.');
    assert.ok(cv.patents.some(p=>p.filed===period));
  }
  assert.equal(data.news.filter(item=>item.id==='haptic-occlusion-poster-award-2024').length,1);
  assert.match(find('haptic-occlusion-poster-award-2024').translations.en.body,/Best Poster Award.*co-author/);
  assert.match(find('mandibular-conference-award-2023').translations.en.body,/Best Paper Award.*co-author/);
  assert.match(find('virtual-jawbone-presentation-2022').translations.en.body,/was presented orally/);
  assert.equal(data.news.filter(item=>item.id.includes('ai-build-start')).length,0);
});

test('2025 News records the confirmed DOTORI start and three public repository milestones', () => {
  const expected = [
    ['dotori-development-start-2025','2025-11','month','projects/unmanned-forklift/'],
    ['server-client-study-public-2025','2025-04-26','day','https://github.com/rafaam11/server-client-study'],
    ['lightglue-experiment-public-2025','2025-04-14','day','https://github.com/rafaam11/FeatureMatch_LightGlue'],
    ['samurai-yolo-experiment-public-2025','2025-04-14','day','https://github.com/rafaam11/samurai_test']
  ];
  const entries = data.news.filter(item=>item.eventDate.startsWith('2025'));
  assert.equal(entries.length,4);
  for (const [id,eventDate,datePrecision,target] of expected) {
    const item = entries.find(candidate=>candidate.id===id);
    assert.ok(item, id);
    assert.equal(item.eventDate,eventDate);
    assert.equal(item.datePrecision,datePrecision);
    assert.ok(item.links.some(link=>link.route===target || link.href===target));
    assert.ok(item.translations.ko.body);
    assert.ok(item.translations.en.body);
  }
  const forklift = data.projects.find(project=>project.slug==='unmanned-forklift');
  assert.equal(forklift.period,'2025.11 – present');
  assert.equal(data.news.length,55);
});
test('Home News keeps only the newest software release and then the newest other items', () => {
  const release = (id, date) => ({...data.news[0], id, eventDate: date, datePrecision: 'day', evidence: {...data.news[0].evidence, path: 'data/news-software-sources.json'}});
  const other = (id, date) => ({...data.news[0], id, eventDate: date, datePrecision: 'day', evidence: {...data.news[0].evidence, path: 'data/public-cv.json'}});
  const entries = [other('paper-a', '2026-06-01'), release('app-v3', '2026-09-04'), release('app-v2', '2026-09-02'), other('talk-b', '2026-04-03'), release('app-v1', '2026-08-16'), other('start-c', '2026-03-01'), other('old-d', '2025-11-01')];
  assert.deepEqual(profile.homeNews(entries, 4).map((item) => item.id), ['app-v3', 'paper-a', 'talk-b', 'start-c']);
  assert.equal(profile.homeNews(data.news).length, 4);
  assert.equal(profile.homeNews(data.news).filter((item) => item.evidence.path === 'data/news-software-sources.json').length, 1);
});
