const fs = require('node:fs');
const path = require('node:path');
const data = require('../js/portfolio-data.js');
const render = require('../js/portfolio-render.js');
const i18n = require('../js/site-i18n.js');
const root = path.resolve(__dirname, '..');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const readCv = (rootDir = root) => JSON.parse(fs.readFileSync(path.join(rootDir, 'data/public-cv.json'), 'utf8'));
const href = (base, locale, route) => i18n.routeHref(base, locale, route, true);
const readActivityMedia = (rootDir = root) => JSON.parse(fs.readFileSync(path.join(rootDir, 'data/activity-media.json'), 'utf8'));
const publicMediaFields = ['id', 'type', 'path', 'poster', 'width', 'height', 'eventIds', 'order', 'translations'];
function publicMediaRecord(record) {
  const out = {};
  for (const key of publicMediaFields) if (record[key] !== undefined && record[key] !== null) out[key] = record[key];
  return out;
}
function localMediaSource(mediaJson) {
  // Only approved records reach the public bundle, and only their public fields.
  const media = {};
  for (const [id, record] of Object.entries(mediaJson.media)) if (record.approval === 'approved-public') media[id] = publicMediaRecord(record);
  return '/* Generated from data/activity-media.json by scripts/profile-home.cjs (node scripts/public-cv-summary.cjs --write). Do not edit. */\n' +
    '(function(r){const d=' + JSON.stringify({localOnly: false, media}, null, 2) + '; if(typeof module!=="undefined")module.exports=d;r.LocalMediaData=d;})(typeof globalThis!=="undefined"?globalThis:this);\n';
}
function activityMediaErrors(mediaJson = readActivityMedia(), news = data.news) {
  const errors = [], newsIds = new Set(news.map(item => item.id));
  if (!mediaJson || mediaJson.schema !== 1 || !mediaJson.media) return ['activity media: schema 1 with a media map is required'];
  for (const [key, record] of Object.entries(mediaJson.media)) {
    const label = 'activity media ' + key;
    if (record.id !== key) errors.push(label + ': id must match its key');
    if (!/^assets\/local-review\/[^/]+$/.test(record.path || '') || /\.\./.test(record.path || '')) errors.push(label + ': path must be a file directly under assets/local-review/');
    if (!['image', 'video'].includes(record.type)) errors.push(label + ': type must be image or video');
    if (!['approved-public', 'draft'].includes(record.approval)) errors.push(label + ': approval must be approved-public or draft');
    if (!Array.isArray(record.eventIds)) errors.push(label + ': eventIds must be an array');
    else for (const eventId of record.eventIds) if (!newsIds.has(eventId)) errors.push(label + ': unknown eventId ' + eventId);
    if (!Number.isInteger(record.order)) errors.push(label + ': order must be an integer');
    if (!Number.isInteger(record.width) || !Number.isInteger(record.height)) errors.push(label + ': width and height are required');
    if (record.type === 'video' && (!record.poster || !record.clip)) errors.push(label + ': video needs poster and clip');
    for (const locale of ['ko', 'en']) for (const field of ['caption', 'alt']) {
      const text = record.translations?.[locale]?.[field];
      if (typeof text !== 'string' || !text.trim()) errors.push(label + ': ' + locale + ' ' + field + ' is required');
      else if (/^TODO/i.test(text) && record.approval === 'approved-public') errors.push(label + ': ' + locale + ' ' + field + ' is still a TODO');
    }
  }
  return errors;
}

function sortedNews(entries = data.news) {
  // Partial dates are not expanded into invented event days. Unknown months follow known months in the same year.
  return entries.slice().sort((a, b) => b.eventDate.localeCompare(a.eventDate) || a.id.localeCompare(b.id));
}
const isReleaseNews = item => item.evidence?.path === 'data/news-software-sources.json';
function homeNews(entries = data.news, limit = 4) {
  // Home keeps the newest software release once, then the newest research, conference, award and career items.
  let releaseSeen = false;
  return sortedNews(entries).filter(item => !isReleaseNews(item) || (!releaseSeen && (releaseSeen = true))).slice(0, limit);
}
let activityMediaCache = null;
function activityMediaForNews() {
  if (!activityMediaCache) activityMediaCache = readActivityMedia();
  return activityMediaCache;
}
function newsErrors(entries = data.news) {
  const errors = [], ids = new Set();
  for (const item of entries) {
    if (!item.id || ids.has(item.id)) errors.push('News requires unique identifiers.');
    ids.add(item.id);
    const pattern = {year:/^\d{4}$/,month:/^\d{4}-(0[1-9]|1[0-2])$/,day:/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/}[item.datePrecision];
    if (!pattern || !pattern.test(item.eventDate)) errors.push(`Invalid News date: ${item.id}`);
    if (item.datePrecision === 'day' && pattern.test(item.eventDate)) {
      const date = new Date(item.eventDate);
      if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== item.eventDate) errors.push(`Invalid News calendar date: ${item.id}`);
    }
    if (!item.evidence?.path || !item.evidence?.locator || !fs.existsSync(path.join(root, item.evidence.path))) errors.push(`News requires public evidence: ${item.id}`);
    else if (item.evidence.path === 'data/activity-media.json') {
      // Photo-backed events: the cited record must be approved and must list this event.
      const record = activityMediaForNews().media[item.evidence.locator];
      if (!record || record.approval !== 'approved-public') errors.push(`News evidence must cite an approved activity media record: ${item.id} → ${item.evidence.locator}`);
      else if (!(record.eventIds || []).includes(item.id)) errors.push(`News evidence record ${item.evidence.locator} does not list ${item.id}`);
    }
    for (const locale of ['ko','en']) {
      if (!item.translations?.[locale]?.body) errors.push(`News requires ${locale}: ${item.id}`);
      for (const link of item.links || []) {
        if (!link.translations?.[locale]?.label || !(link.route ? i18n.routeDescriptors.some(r => r.route === link.route) : /^https:\/\//.test(link.href || ''))) errors.push(`Invalid News link: ${item.id}`);
      }
    }
  }
  return errors;
}
function renderNews(locale, entries = data.news, {base = locale === 'ko' ? '../' : '../../', limit, groupYears = true} = {}) {
  const ko = locale === 'ko';
  let sorted = sortedNews(entries);
  if (Number.isInteger(limit)) sorted = sorted.slice(0, limit);
  if (!sorted.length) return `<p class="sc-news-empty">${ko ? '아직 등록된 소식이 없습니다.' : 'No news yet.'}</p>`;
  const itemHtml = item => `<li class="sc-news-item" data-news-id="${esc(item.id)}"><time datetime="${esc(item.eventDate)}">${esc(item.eventDate.replaceAll('-', '.'))}</time><div><p>${esc(item.translations[locale].body)}</p><p class="sc-news-links">${(item.links || []).map(link => `<a href="${esc(link.route ? href(base, locale, link.route) : link.href)}">${esc(link.translations[locale].label)}</a>`).join(' · ')}</p></div></li>`;
  if (!groupYears) return `<ol class="sc-news-list">${sorted.map(itemHtml).join('')}</ol>`;
  return [...new Set(sorted.map(item => item.eventDate.slice(0, 4)))].map(year => `<section class="sc-news-year" aria-labelledby="news-${year}"><h2 id="news-${year}">${year}</h2><ol class="sc-news-list">${sorted.filter(item => item.eventDate.startsWith(year)).map(itemHtml).join('')}</ol></section>`).join('\n');
}
function selectedPublications(cv) {
  return ['OMFS VR Consultation App', 'A Proof of Concept:', 'Dental Occlusion Model Using Arch Line'].map(title => {
    const item = cv.publications.find(p => p.translations.en.title.includes(title));
    if (!item) throw new Error(`Missing selected CV publication: ${title}`);
    return item;
  });
}
function highlightsFromCv(cv) {
  return {
    publications: selectedPublications(cv).map(p => ({year:p.year,...(p.href ? {href:p.href} : {}),translations:Object.fromEntries(['ko','en'].map(locale => [locale,{title:p.translations[locale].title,venue:`${p.translations[locale].venue} · ${p.translations[locale].role}`}]))})),
    patents:{filed:cv.patents.length,registered:cv.patents.filter(p => p.status === 'granted').length,items:cv.patents.map(p => ({year:p.filed.slice(0,4),status:p.status === 'granted' ? 'registered' : 'filed',translations:p.translations}))},
    awards:cv.awards.map(a => ({year:a.year || a.date?.slice(0,4),translations:Object.fromEntries(['ko','en'].map(locale => [locale,{title:a.translations[locale].title}]))}))
  };
}
function achievementsHtml(locale, cv, base) {
  const ko = locale === 'ko', cvHref = href(base, locale, 'cv/');
  const publications = selectedPublications(cv).map(p => {
    const t = p.translations[locale], title = esc(t.title);
    const caseLink = p.projectSlug ? ` · <a href="${href(base, locale, `projects/${p.projectSlug}/`)}">${locale === 'ko' ? '관련 프로젝트' : 'Related project'}</a>` : '';
    return `<li><span class="sc-list__year">${esc(p.year)}</span> ${p.href ? `<a href="${esc(p.href)}">${title}</a>` : title}<p class="sc-list__venue">${esc(t.venue)} · ${esc(t.role)}${caseLink}</p></li>`;
  }).join('');
  const registered = cv.patents.filter(p => p.status === 'granted').length;
  return `<section aria-labelledby="publications-title"><h2 id="publications-title">${ko ? '주요 논문·학회 발표' : 'Selected publications & presentations'}</h2><ol class="sc-list">${publications}</ol><p><a href="${cvHref}">${ko ? `전체 연구 실적 ${cv.publications.length}건` : `All ${cv.publications.length} publications & presentations`}</a></p><div data-portfolio="home-highlights"><p>${ko ? `특허 출원 ${cv.patents.length}건 중 등록 ${registered}건 · 수상 ${cv.awards.length}건` : `${cv.patents.length} patent applications, including ${registered} granted · ${cv.awards.length} awards`} · <a href="${cvHref}">${ko ? '전체 목록과 상태' : 'Full list and status'}</a></p></div></section>`;
// The patents and awards line now closes the publications section; Home has no separate highlights heading.
}
function directionHtml(locale, cv) {
  if (!cv.interests) return '';
  const ko = locale === 'ko';
  return `\n<p class="sc-intro__direction"><strong>${ko ? '연구 방향' : 'Research direction'}</strong> — ${ko ? '추적·정합·내비게이션 경험을 바탕으로 넓혀 가려는 분야' : 'areas I aim to grow into from my tracking, registration and navigation work'}: ${cv.interests[locale].map(esc).join(' · ')}</p>`;
}
function renderHome(locale, cv = readCv()) {
  const ko = locale === 'ko', base = ko ? '' : '../';
  return `<!-- PROFILE:START -->
<section class="sc-intro" aria-labelledby="home-title"><div><h1 id="home-title">${ko ? '김진민 <span lang="en">Jinmin Kim</span>' : 'Jinmin Kim'}</h1>
<p class="sc-intro__role">${ko ? '수술 로보틱스·컴퓨터비전 R&amp;D 엔지니어' : 'Robotics &amp; Computer Vision R&amp;D Engineer'}</p>
<p class="sc-intro__keywords"${ko ? ' lang="en"' : ''}>Surgical Navigation · 3D Registration · Optical Tracking · Computer Vision · XR · Robotics Integration</p>
<p class="sc-intro__lede">${ko ? '3D 공간에서 해부학 구조, 수술 도구, 센서, 카메라, XR 기기, 로봇을 하나의 좌표계로 연결해 온 엔지니어입니다. 삼성서울병원 구강악안면외과와 3년 넘게 공동 R&amp;D를 하며 영상-환자 정합, 수술 도구 추적, 디지털 교합 워크플로우를 개발하고 있습니다.' : 'I connect anatomy, surgical instruments, sensors, cameras, XR devices, and robots in one 3D coordinate space. Through more than three years of collaborative R&amp;D with the oral and maxillofacial surgery team at Samsung Medical Center, I develop image-to-patient registration, surgical instrument tracking, and digital occlusion workflows.'}</p>
<p class="sc-intro__statement">${ko ? '광학 추적과 좌표계 정합에서 출발해 수술 내비게이션과 XR로, 다시 로봇과 비전 시스템 통합으로 작업 범위를 넓혀 왔습니다.' : 'My work grew from optical tracking and coordinate registration into surgical navigation and XR, and from there into robot and vision system integration.'}</p>
<p class="sc-intro__affiliation">${ko ? '㈜디지트랙 연구원 · 소프트웨어 R&amp;D<br>DGIST 로봇및기계전자공학 석사' : 'Research Engineer · Software R&amp;D, DIGITRACK Inc.<br>M.S. in Robotics and Mechatronics Engineering, DGIST'}</p>
<p class="sc-intro__links">${cv.contacts.map(c => `<a href="${esc(c.href)}">${esc(c.label)}</a>`).join(' · ')} · <a href="${base}assets/cv/jinmin-kim-cv-${locale}.pdf">CV (PDF)</a></p>${directionHtml(locale, cv)}</div><img class="sc-intro__photo" src="${base}assets/img/profile_square.webp" alt="${ko ? '김진민 프로필 사진' : 'Portrait of Jinmin Kim'}" width="160" height="160"></section>
${capabilitiesHtml(locale)}
<section aria-labelledby="projects-title"><h2 id="projects-title">${ko ? '대표 연구' : 'Selected research'}</h2><div data-portfolio="home-projects">${render.homeProjectGalleryHtml(data,base,true,locale)}</div><p><a href="${href(base,locale,'projects/')}">${ko ? '전체 프로젝트 9개' : 'All 9 projects'}</a></p></section>
${achievementsHtml(locale,cv,base)}
<section aria-labelledby="news-title"><h2 id="news-title">${ko ? '소식' : 'News'}</h2>${renderNews(locale, homeNews(), {base, groupYears:false})}<p><a href="${href(base,locale,'news/')}">${ko ? `모든 소식 (${data.news.length}건)` : `All news (${data.news.length})`}</a></p></section>
<section class="sc-contact" aria-labelledby="contact-title"><h2 id="contact-title">${ko ? '연락' : 'Contact'}</h2><p>${ko ? '공동연구와 연구 대화를 환영합니다.' : 'I welcome joint research and conversations about research.'} <a href="mailto:uiop3847@naver.com">uiop3847@naver.com</a> · <a href="${href(base,locale,'contact/')}">${ko ? '연락처 안내' : 'Contact information'}</a></p></section>
<!-- PROFILE:END -->`;
}
function newsPage(locale) {
  const ko = locale === 'ko', base = ko ? '../' : '../../', route = ko ? 'news/' : 'en/news/';
  return `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="author" content="Jinmin Kim"><meta name="description" content="${ko ? '김진민의 연구, 학회, 활동과 소프트웨어 소식.' : 'Research, conference, activity and software news from Jinmin Kim.'}"><title>${ko ? '소식 · 김진민' : 'News · Jinmin Kim'}</title><link rel="canonical" href="https://rafaam11.github.io/${route}"><link rel="alternate" hreflang="ko" href="https://rafaam11.github.io/news/"><link rel="alternate" hreflang="en" href="https://rafaam11.github.io/en/news/"><link rel="alternate" hreflang="x-default" href="https://rafaam11.github.io/news/"><link rel="icon" href="${base}assets/img/favicon.ico"><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"><link rel="stylesheet" href="${base}css/site.css"><link rel="stylesheet" href="${base}css/scholar.css"><link rel="stylesheet" href="${base}css/local-feed.css"><link rel="stylesheet" href="${base}css/local-projects.css"></head>
<body class="td-shell" data-base="${base}" data-page="news" data-lang="${locale}" data-route="news/"><header id="site-nav"></header><main id="main-content" tabindex="-1"><header class="sc-page-header"><h1>${ko ? '소식' : 'News'}</h1><p>${ko ? '연구·학회·커리어·대외활동과 소프트웨어 소식을 기록합니다.' : 'Updates on research, conferences, career, activities, and software.'}</p></header>${renderNews(locale)}<p><a href="${href(base,locale,'')}">${ko ? '홈으로' : 'Back to Home'}</a></p></main><footer id="site-footer"></footer><script src="${base}js/site-i18n.js"></script><script src="${base}js/nav.js"></script><script src="${base}js/portfolio-data.js"></script><script src="${base}js/local-media-data.js"></script><script src="${base}js/local-feed.js"></script><script src="${base}js/local-projects.js"></script></body></html>
`;
}
function capabilitiesHtml(locale) {
  return `<section aria-labelledby="implementation-title"><h2 id="implementation-title">${locale === 'ko' ? '현재 전문성' : 'Current expertise'}</h2><dl class="sc-capabilities">${data.capabilities.map(c => `<div><dt>${esc(c.translations[locale].title)}</dt><dd>${c.methods.map(esc).join(', ')}</dd></div>`).join('')}</dl></section>`;
}
function generationUpdates(cv, rootDir = root) {
  cv ||= readCv(rootDir);
  const updates = new Map();
  for (const locale of ['ko','en']) {
    const prefix = locale === 'ko' ? '' : 'en/', base = locale === 'ko' ? '../' : '../../';
    const homeFile = `${prefix}index.html`;
    const home = fs.readFileSync(path.join(rootDir,homeFile),'utf8').replace(/(<main\b[^>]*>)[\s\S]*?(<\/main>)/, `$1\n${renderHome(locale,cv)}\n  $2`);
    updates.set(homeFile,home);
    updates.set(`${prefix}news/index.html`,newsPage(locale));
    const projectsFile = `${prefix}projects/index.html`;
    const projects = fs.readFileSync(path.join(rootDir,projectsFile),'utf8').replace(/(<main\b[^>]*>)[\s\S]*?(<\/main>)/, `$1\n<header class="sc-page-header"><h1>${locale === 'ko' ? '프로젝트' : 'Projects'}</h1><p>${locale === 'ko' ? '수술 내비게이션·정합 연구에서 광학 추적, XR, 로봇 통합으로 이어지는 프로젝트입니다.' : 'Projects that run from surgical navigation and registration research through optical tracking, XR, and robot integration.'}</p></header>\n<div data-portfolio="project-groups">${render.projectGroupsHtml(data,base,true,locale)}</div>\n$2`);
    updates.set(projectsFile,projects);
  }
  const dataFile = 'js/portfolio-data.js';
  const source = fs.readFileSync(path.join(rootDir,dataFile),'utf8');
  updates.set(dataFile,source.replace(/  var highlights = \{[\s\S]*?\n  \};\n\n  var projects =/, `  var highlights = ${JSON.stringify(highlightsFromCv(cv),null,2)};\n\n  var projects =`));
  updates.set('js/local-media-data.js', localMediaSource(readActivityMedia(rootDir)));
  return updates;
}
function freshnessErrors(cv, rootDir = root) {
  return [...generationUpdates(cv, rootDir)].filter(([file,contents]) => !fs.existsSync(path.join(rootDir,file)) || fs.readFileSync(path.join(rootDir,file),'utf8') !== contents).map(([file]) => `${file}: generated profile content is stale; run node scripts/public-cv-summary.cjs --write`);
}
function generatePages({write = false, cv, rootDir = root} = {}) {
  const updates = generationUpdates(cv,rootDir);
  if (write) for (const [file,contents] of updates) { fs.mkdirSync(path.dirname(path.join(rootDir,file)),{recursive:true}); fs.writeFileSync(path.join(rootDir,file),contents); }
  return write ? [...updates.keys()] : freshnessErrors(cv,rootDir);
}
const writePages = (cv, rootDir = root) => generatePages({write:true,cv,rootDir});
module.exports = {sortedNews,homeNews,newsErrors,readActivityMedia,publicMediaRecord,localMediaSource,activityMediaErrors,renderNews,renderHome,selectedPublications,highlightsFromCv,achievementsHtml,generationUpdates,freshnessErrors,generatePages,writePages};
if (require.main === module) {
  const errors = [...newsErrors(), ...activityMediaErrors()];
  if (errors.length) throw new Error(errors.join('\n'));
  const result = generatePages({write:process.argv.includes('--write')});
  if (!process.argv.includes('--write') && result.length) { console.error(result.join('\n')); process.exitCode = 1; }
}
