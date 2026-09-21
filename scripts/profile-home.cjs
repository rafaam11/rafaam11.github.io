const fs = require('node:fs');
const path = require('node:path');
const data = require('../js/portfolio-data.js');
const render = require('../js/portfolio-render.js');
const i18n = require('../js/site-i18n.js');
const root = path.resolve(__dirname, '..');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const readCv = (rootDir = root) => JSON.parse(fs.readFileSync(path.join(rootDir, 'data/public-cv.json'), 'utf8'));
const href = (base, locale, route) => i18n.routeHref(base, locale, route, true);

function sortedNews(entries = data.news) {
  // Partial dates are not expanded into invented event days. Unknown months follow known months in the same year.
  return entries.slice().sort((a, b) => b.eventDate.localeCompare(a.eventDate) || a.id.localeCompare(b.id));
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
    return `<li><span class="sc-list__year">${esc(p.year)}</span> ${p.href ? `<a href="${esc(p.href)}">${title}</a>` : title}<p class="sc-list__venue">${esc(t.venue)} · ${esc(t.role)}</p></li>`;
  }).join('');
  const registered = cv.patents.filter(p => p.status === 'granted').length;
  return `<section aria-labelledby="publications-title"><h2 id="publications-title">${ko ? '주요 논문·학회 발표' : 'Selected publications & presentations'}</h2><ol class="sc-list">${publications}</ol><p><a href="${cvHref}">${ko ? `전체 연구 실적 ${cv.publications.length}건` : `All ${cv.publications.length} publications & presentations`}</a></p></section>
<section aria-labelledby="highlights-title"><h2 id="highlights-title">${ko ? '특허·수상' : 'Patents & awards'}</h2><div data-portfolio="home-highlights"><p>${ko ? `특허 출원 ${cv.patents.length}건 중 등록 ${registered}건 · 수상 ${cv.awards.length}건` : `${cv.patents.length} patent applications, including ${registered} granted · ${cv.awards.length} awards`} · <a href="${cvHref}">${ko ? '전체 목록과 상태' : 'Full list and status'}</a></p></div></section>`;
}
function renderHome(locale, cv = readCv()) {
  const ko = locale === 'ko', base = ko ? '' : '../';
  return `<!-- PROFILE:START -->
<section class="sc-intro" aria-labelledby="home-title"><div><h1 id="home-title">${ko ? '김진민 <span lang="en">Jinmin Kim</span>' : 'Jinmin Kim'}</h1>
<p class="sc-intro__lede">${ko ? '의료영상과 3D 형상에서 수술계획에 필요한 좌표 관계를 연구합니다. 치아 교합 기반의 하악골 정복 최적화와 디지털 교합 워크플로우를 중심으로, 정합 알고리즘을 내비게이션 소프트웨어와 실제 장치에 연결합니다.' : 'I study coordinate relationships in medical images and 3D geometry for surgical planning. My work focuses on dental-occlusion-based mandibular reduction and digital occlusion workflows, connecting registration algorithms to navigation software and physical devices.'}</p>
<p class="sc-intro__affiliation">${ko ? '㈜디지트랙 연구원 · 소프트웨어 개발<br>DGIST 로봇및기계전자공학 석사' : 'Researcher · Software Development, DIGITRACK Inc.<br>M.S. in Robotics and Mechatronics Engineering, DGIST'}</p>
<p class="sc-intro__links">${cv.contacts.map(c => `<a href="${esc(c.href)}">${esc(c.label)}</a>`).join(' · ')} · <a href="${base}assets/cv/jinmin-kim-cv-${locale}.pdf">CV (PDF)</a></p></div><img class="sc-intro__photo" src="${base}assets/img/profile_square.webp" alt="${ko ? '김진민 프로필 사진' : 'Portrait of Jinmin Kim'}" width="160" height="160"></section>
${capabilitiesHtml(locale)}
<section aria-labelledby="news-title"><h2 id="news-title">${ko ? '소식' : 'News'}</h2>${renderNews(locale, data.news, {base, limit:5, groupYears:false})}<p><a href="${href(base,locale,'news/')}">${ko ? `모든 소식 (${data.news.length}건)` : `All news (${data.news.length})`}</a></p></section>
<section aria-labelledby="projects-title"><h2 id="projects-title">${ko ? '대표 연구' : 'Selected research'}</h2><div data-portfolio="home-projects">${render.homeProjectGalleryHtml(data,base,true,locale)}</div><p><a href="${href(base,locale,'projects/')}">${ko ? '전체 프로젝트 9개' : 'All 9 projects'}</a></p></section>
${achievementsHtml(locale,cv,base)}
<section class="sc-contact" aria-labelledby="contact-title"><h2 id="contact-title">${ko ? '연락' : 'Contact'}</h2><p>${ko ? '공동연구와 연구 대화를 환영합니다.' : 'I welcome joint research and conversations about research.'} <a href="mailto:uiop3847@naver.com">uiop3847@naver.com</a> · <a href="${href(base,locale,'contact/')}">${ko ? '연락처 안내' : 'Contact information'}</a></p></section>
<!-- PROFILE:END -->`;
}
function newsPage(locale) {
  const ko = locale === 'ko', base = ko ? '../' : '../../', route = ko ? 'news/' : 'en/news/';
  return `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="author" content="Jinmin Kim"><meta name="description" content="${ko ? '김진민의 연구, 학회와 소프트웨어 소식.' : 'Research, conference and software news from Jinmin Kim.'}"><title>${ko ? '소식 · 김진민' : 'News · Jinmin Kim'}</title><link rel="canonical" href="https://rafaam11.github.io/${route}"><link rel="alternate" hreflang="ko" href="https://rafaam11.github.io/news/"><link rel="alternate" hreflang="en" href="https://rafaam11.github.io/en/news/"><link rel="alternate" hreflang="x-default" href="https://rafaam11.github.io/news/"><link rel="icon" href="${base}assets/img/favicon.ico"><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"><link rel="stylesheet" href="${base}css/site.css"><link rel="stylesheet" href="${base}css/scholar.css"><link rel="stylesheet" href="${base}css/local-feed.css"><link rel="stylesheet" href="${base}css/local-projects.css"></head>
<body class="td-shell" data-base="${base}" data-page="news" data-lang="${locale}" data-route="news/"><header id="site-nav"></header><main id="main-content" tabindex="-1"><header class="sc-page-header"><h1>${ko ? '소식' : 'News'}</h1><p>${ko ? '연구·학회·커리어와 소프트웨어 소식을 기록합니다.' : 'Updates on research, conferences, career, and software.'}</p></header>${renderNews(locale)}<p><a href="${href(base,locale,'')}">${ko ? '홈으로' : 'Back to Home'}</a></p></main><footer id="site-footer"></footer><script src="${base}js/site-i18n.js"></script><script src="${base}js/nav.js"></script><script src="${base}js/portfolio-data.js"></script><script src="${base}js/local-media-data.js"></script><script src="${base}js/local-feed.js"></script><script src="${base}js/local-projects.js"></script></body></html>
`;
}
function capabilitiesHtml(locale) {
  return `<section aria-labelledby="implementation-title"><h2 id="implementation-title">${locale === 'ko' ? '구현 역량' : 'Implementation capabilities'}</h2><dl class="sc-capabilities">${data.capabilities.map(c => `<div><dt>${esc(c.translations[locale].title)}</dt><dd>${c.methods.map(esc).join(', ')}</dd></div>`).join('')}</dl></section>`;
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
    const projects = fs.readFileSync(path.join(rootDir,projectsFile),'utf8').replace(/(<main\b[^>]*>)[\s\S]*?(<\/main>)/, `$1\n<header class="sc-page-header"><h1>${locale === 'ko' ? '프로젝트' : 'Projects'}</h1><p>${locale === 'ko' ? '의료영상·3D 정합 연구와 이를 연결하는 플랫폼·로봇 소프트웨어 프로젝트입니다.' : 'Medical imaging and 3D registration research, with platform and robot software that connects the work to applications.'}</p></header>\n<div data-portfolio="project-groups">${render.projectGroupsHtml(data,base,true,locale)}</div>\n$2`);
    updates.set(projectsFile,projects);
  }
  const dataFile = 'js/portfolio-data.js';
  const source = fs.readFileSync(path.join(rootDir,dataFile),'utf8');
  updates.set(dataFile,source.replace(/  var highlights = \{[\s\S]*?\n  \};\n\n  var projects =/, `  var highlights = ${JSON.stringify(highlightsFromCv(cv),null,2)};\n\n  var projects =`));
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
module.exports = {sortedNews,newsErrors,renderNews,renderHome,selectedPublications,highlightsFromCv,achievementsHtml,generationUpdates,freshnessErrors,generatePages,writePages};
if (require.main === module) {
  const errors = newsErrors();
  if (errors.length) throw new Error(errors.join('\n'));
  const result = generatePages({write:process.argv.includes('--write')});
  if (!process.argv.includes('--write') && result.length) { console.error(result.join('\n')); process.exitCode = 1; }
}
