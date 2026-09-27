(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.LocalFeed = api;
  if (root.document) {
    var start = function () { api.mount(root.document, root.PortfolioData, root.LocalMediaData); };
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start);
    else start();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var selectedIds = ['accas-occlusion-paper-2022', 'quadruped-engineering-award-2020', 'ism-launcher-paper-2019'];
  var mediaIds = {
    'accas-occlusion-paper-2022': ['M012'],
    'quadruped-engineering-award-2020': ['M039', 'M043'],
    'ism-launcher-paper-2019': ['M185'],
    'invention-sponsor-award-2019': ['M146']
  };
  // Editorial labels only. Event dates, prose, links and evidence stay canonical.
  var labels = {
    'surface-guidance-research-2026': ['research', '표면유도 호흡추적 연구 시작', 'Surface-guided respiratory tracking research'],
    'omfs-vr-poster-2026': ['conference', 'OMFS VR 상담 플랫폼 포스터 발표', 'OMFS VR consultation poster'],
    'digital-occlusion-redesign-2026': ['research', '디지털 교합 워크플로우 재설계', 'Digital occlusion workflow redesign'],
    'dotori-development-start-2025': ['research', 'DOTORI 센서 정합·안전 소프트웨어 개발', 'DOTORI sensor registration and safety software'],
    'server-client-study-public-2025': ['software', '서버·클라이언트 학습 저장소 공개', 'Server-client study repository'],
    'lightglue-experiment-public-2025': ['software', 'LightGlue 특징점 매칭 실험 공개', 'LightGlue feature-matching experiments'],
    'samurai-yolo-experiment-public-2025': ['software', 'SAMURAI·YOLO 객체 추적 실험 공개', 'SAMURAI and YOLO tracking experiments'],
    'tracking-patent-applications-2024': ['patent', '3차원 위치추적 특허 2건 출원', 'Two 3D tracking patent applications'],
    'stereo-camera-patent-application-2024': ['patent', '스테레오 카메라 구동 특허 출원', 'Stereo-camera actuation patent application'],
    'rtms-navigation-development-2024': ['research', 'rTMS 코일 내비게이션 개발 시작', 'rTMS coil-navigation development'],
    'mandibular-paper-2024': ['research', '하악골 골절 정복 연구 논문 게재', 'Mandibular fracture reduction paper published'],
    'haptic-occlusion-poster-award-2024': ['award', '햅틱 교합 연구 발표·우수포스터상', 'Haptic occlusion poster and Best Poster Award'],
    'smcnavi-development-2023': ['research', 'SMCNavi 수술내비게이션 개발 시작', 'SMCNavi surgical-navigation development'],
    'omfs-vr-development-2023': ['research', 'OMFS VR 상담 애플리케이션 개발 시작', 'OMFS VR consultation application development'],
    'digitrack-researcher-2023': ['career', '디지트랙 소프트웨어 연구원 합류', 'Joined DIGITRACK as a software researcher'],
    'dgist-masters-degree-2023': ['career', 'DGIST 로봇및기계전자공학 석사 졸업', 'M.S. completed at DGIST'],
    'mandibular-conference-award-2023': ['award', '턱뼈 모델 최적화 발표·우수논문상', 'Jawbone optimisation presentation and Best Paper Award'],
    'accas-occlusion-paper-2022': ['conference', 'ACCAS 2022 치열궁 기반 교합 연구 발표', 'Dental-arch occlusion research at ACCAS 2022'],
    'virtual-jawbone-presentation-2022': ['conference', '가상 턱뼈 모델 재구성 연구 발표', 'Virtual jawbone reconstruction presentation'],
    'mandibular-research-start-2021': ['research', '하악골 골절 정복 최적화 연구 시작', 'Mandibular fracture reduction research'],
    'ar-surgery-research-2021': ['research', '구강악안면 AR 수술 연구 참여', 'Joined oral and maxillofacial AR surgery research'],
    'dgist-masters-start-2021': ['career', 'DGIST 석사과정 시작', 'Started the M.S. programme at DGIST'],
    'kumoh-bachelors-degree-2021': ['career', '금오공과대학교 기계시스템공학 학사 졸업', 'B.S. completed at Kumoh Institute of Technology'],
    'quadruped-patent-application-2021': ['patent', '4족 보행 로봇 특허 출원', 'Quadruped robot patent application'],
    'quadruped-engineering-award-2020': ['award', '4족 보행 로봇 프로젝트·엔지니어링 페어 장려상', 'Quadruped robot project and Engineering Fair prize'],
    'ros-training-award-2020': ['award', 'ROS 자율주행 교육 경진 동상', 'Bronze Prize in ROS autonomous-driving training'],
    'hanger-patent-application-2019': ['patent', '탄성부 옷걸이 특허 출원', 'Elastic-section hanger patent application'],
    'carrier-patent-application-2019': ['patent', '수납공간 조절 캐리어 특허 출원', 'Adjustable carrier patent application'],
    'ism-launcher-paper-2019': ['conference', 'ISM 2019 탁구공 발사장치 연구 발표', 'Ping-pong ball launcher research at ISM 2019'],
    'triz-grand-prize-2019': ['award', '국제 TRIZ 경진대회 대상', 'International TRIZ Competition Grand Prize'],
    'startup-idea-award-2019': ['award', '창업아이디어 경진대회 최우수상', 'Startup Idea Competition Grand Prize'],
    'invention-sponsor-award-2019': ['award', '대학창의발명대회 후원기관상', 'University Creative Invention Contest Sponsor’s Award'],
    'green-earth-award-2019': ['award', 'GREEN 지구 공모전 우수상', 'GREEN Earth Competition Excellence Award'],
    'undergraduate-research-2019': ['research', 'System & Vision Lab. 학부 연구 시작', 'Undergraduate research at System & Vision Lab.'],
    'paper-cup-patent-application-2015': ['patent', '종이컵 수거함 특허 출원', 'Paper-cup collection bin patent application'],
    'invention-excellence-award-2015': ['award', '대학창의발명대회 우수상', 'University Creative Invention Contest Excellence Award']
  };
  var copy = {
    ko: { title: '소식', intro: '연구, 발표, 수상과 소프트웨어 작업을 시간순으로 기록합니다.', selected: '선택한 활동', selectedIntro: '학회 발표와 로봇 제작의 기록입니다.', year: '연도', type: '분류', allYears: '모든 연도', allTypes: '모든 분류', reset: '필터 초기화', empty: '선택한 조건에 해당하는 소식이 없습니다.', detail: '소식에서 보기', local: '활동 기록에 연결된 공개 사진·영상입니다.', types: { research: '연구', conference: '학회·발표', award: '수상', career: '경력·학위', patent: '특허 출원', software: '소프트웨어' } },
    en: { title: 'News', intro: 'Research, presentations, awards and software work, in chronological order.', selected: 'Selected activities', selectedIntro: 'Records of conference presentations and building robots.', year: 'Year', type: 'Type', allYears: 'All years', allTypes: 'All types', reset: 'Reset filters', empty: 'No news matches these filters.', detail: 'View in News', local: 'Public photos and videos linked to the activity records.', types: { research: 'Research', conference: 'Conferences', award: 'Awards', career: 'Career & degrees', patent: 'Patent applications', software: 'Software' } }
  };
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function locale(lang) { return lang === 'en' ? 'en' : 'ko'; }
  function routeHref(base, lang, route) { return (base || '') + (locale(lang) === 'en' ? 'en/' : '') + route + 'index.html'; }
  function titleFor(event, lang) {
    if (labels[event.id]) return labels[event.id][lang === 'en' ? 2 : 1];
    var release = event.id.match(/^(multi-cli-work|bus-info)-v(\d+)-(\d+)-(\d+)$/);
    if (release) return (release[1] === 'multi-cli-work' ? 'multi-cli-work' : lang === 'en' ? 'Daegu bus app' : '대구 버스 정보 앱') + ' v' + release.slice(2).join('.') + (lang === 'en' ? ' release' : ' 공개');
    return event.translations[lang].body.split(/\.\s/)[0];
  }
  function buildModel(news, lang, mediaData) {
    lang = locale(lang);
    var media = mediaData && (mediaData.media || mediaData) || {};
    var seen = new Set();
    return (news || []).filter(function (event) { if (seen.has(event.id)) return false; seen.add(event.id); return true; }).map(function (event, index) {
      var category = labels[event.id] ? labels[event.id][0] : 'software';
      return { id: event.id, eventDate: event.eventDate, datePrecision: event.datePrecision, year: event.eventDate.slice(0, 4), title: titleFor(event, lang), category: category,
        categories: /(?:haptic-occlusion-poster-award|mandibular-conference-award)/.test(event.id) ? ['award', 'conference'] : [category],
        body: event.translations[lang].body, links: event.links || [], evidence: event.evidence, media: (mediaIds[event.id] || []).map(function (id) { return media[id]; }).filter(Boolean), originalIndex: index };
    }).sort(function (a, b) { return b.eventDate.localeCompare(a.eventDate) || a.originalIndex - b.originalIndex; });
  }
  function filterEvents(events, filters) {
    filters = filters || {};
    return events.filter(function (event) { return (!filters.year || filters.year === 'all' || event.year === filters.year) && (!filters.type || filters.type === 'all' || event.categories.indexOf(filters.type) !== -1); });
  }
  function selectActivities(events) { return selectedIds.map(function (id) { return events.find(function (event) { return event.id === id; }); }).filter(Boolean); }
  function eventHref(event, options) { return routeHref(options.base, options.lang, 'news/') + '#news-' + event.id; }
  function linksHtml(event, options) {
    return event.links.map(function (link) { var href = link.route ? routeHref(options.base, options.lang, link.route) : link.href; return '<a href="' + esc(href) + '">' + esc(link.translations[options.lang].label) + '</a>'; }).join('<span aria-hidden="true"> · </span>');
  }
  function mediaHtml(event, options) {
    var images = 0, videos = 0;
    var items = event.media.filter(function (item) { return item.type === 'video' ? ++videos <= 1 : ++images <= (options.compact ? 1 : 3); });
    if (options.compact) items = items.filter(function (item) { return item.type !== 'video'; }).slice(0, 1);
    if (!items.length) return '';
    return '<div class="lf-media">' + items.map(function (item) {
      var translation = item.translations[options.lang];
      var src = (options.base || '') + item.path;
      var visual = item.type === 'video' ? '<video controls muted playsinline preload="none"' + (item.poster ? ' poster="' + esc((options.base || '') + item.poster) + '"' : '') + ' aria-label="' + esc(translation.alt) + '"><source src="' + esc(src) + '" type="video/mp4"><a href="' + esc(src) + '">' + esc(translation.alt) + '</a></video>' : '<a href="' + esc(options.compact ? eventHref(event, options) : src) + '"><img src="' + esc(src) + '" alt="' + esc(translation.alt) + '" loading="lazy" decoding="async"></a>';
      return '<figure data-media-id="' + esc(item.id) + '">' + visual + '<figcaption>' + esc(translation.caption) + '</figcaption></figure>';
    }).join('') + '</div>';
  }
  function eventHtml(event, options) {
    var c = copy[options.lang];
    return '<li class="lf-event" id="news-' + esc(event.id) + '" data-news-id="' + esc(event.id) + '"><div class="lf-event-date"><time datetime="' + esc(event.eventDate) + '">' + esc(event.eventDate.replace(/-/g, '.')) + '</time><span class="lf-category">' + esc(event.categories.map(function (category) { return c.types[category]; }).join(' · ')) + '</span></div><article class="lf-event-content" aria-labelledby="title-' + esc(event.id) + '"><h2 id="title-' + esc(event.id) + '">' + esc(event.title) + '</h2><p>' + esc(event.body) + '</p><p class="lf-links">' + linksHtml(event, options) + '</p>' + mediaHtml(event, options) + '</article></li>';
  }
  function feedHtml(events, options) {
    options = Object.assign({ lang: 'ko', base: '' }, options || {}); options.lang = locale(options.lang);
    return events.length ? '<ol class="lf-feed">' + events.map(function (event) { return eventHtml(event, options); }).join('') + '</ol>' : '<div class="lf-empty"><p>' + copy[options.lang].empty + '</p><button type="button" data-feed-reset>' + copy[options.lang].reset + '</button></div>';
  }
  function selectedActivitiesHtml(events, options) {
    options = Object.assign({ lang: 'ko', base: '', compact: true }, options || {}); options.lang = locale(options.lang); options.compact = true;
    var c = copy[options.lang];
    return '<section class="lf-selected" aria-labelledby="selected-activities-title"><h2 id="selected-activities-title">' + c.selected + '</h2><p class="lf-selected-intro">' + c.selectedIntro + '</p><div class="lf-activity-grid">' + selectActivities(events).map(function (event) {
      return '<article class="lf-activity" data-activity-id="' + esc(event.id) + '"><time datetime="' + esc(event.eventDate) + '">' + esc(event.eventDate.replace(/-/g, '.')) + '</time><h3><a href="' + esc(eventHref(event, options)) + '">' + esc(event.title) + '</a></h3>' + mediaHtml(event, options) + '<p class="lf-links">' + linksHtml(event, options) + '</p><p class="lf-links"><a href="' + esc(eventHref(event, options)) + '">' + c.detail + '</a></p></article>';
    }).join('') + '</div></section>';
  }
  function countText(shown, total, lang) { return lang === 'en' ? shown + ' of ' + total + ' entries' : '전체 ' + total + '건 중 ' + shown + '건'; }
  function controlsHtml(events, lang) {
    var c = copy[lang], years = Array.from(new Set(events.map(function (event) { return event.year; })));
    return '<div class="lf-filters" role="group" aria-label="' + (lang === 'en' ? 'Filter news' : '소식 필터') + '"><label for="feed-year">' + c.year + '<select id="feed-year"><option value="all">' + c.allYears + '</option>' + years.map(function (year) { return '<option value="' + year + '">' + year + '</option>'; }).join('') + '</select></label><label for="feed-type">' + c.type + '<select id="feed-type"><option value="all">' + c.allTypes + '</option>' + Object.keys(c.types).map(function (key) { return '<option value="' + key + '">' + c.types[key] + '</option>'; }).join('') + '</select></label><p id="feed-count" role="status" aria-live="polite" aria-atomic="true">' + countText(events.length, events.length, lang) + '</p></div>';
  }
  function mount(doc, portfolio, mediaData) {
    if (!portfolio || !Array.isArray(portfolio.news)) return;
    var body = doc.body, page = body.dataset.page;
    if (page !== 'news' && page !== 'home') return;
    var main = doc.getElementById('main-content');
    if (!main || main.dataset.localFeedMounted) return;
    var options = { lang: locale(body.dataset.lang), base: body.dataset.base || '' };
    var events = buildModel(portfolio.news, options.lang, mediaData);
    if (page === 'home') {
      var news = main.querySelector('[aria-labelledby="news-title"]');
      if (news) news.insertAdjacentHTML('afterend', selectedActivitiesHtml(events, options));
      else { var contact = main.querySelector('.sc-contact'); if (contact) contact.insertAdjacentHTML('beforebegin', selectedActivitiesHtml(events, options)); }
    } else {
      var header = main.querySelector('.sc-page-header');
      var last = main.lastElementChild;
      var back = last && last.tagName === 'P' && last.querySelector('a') ? last.outerHTML : '';
      var headerHtml = header ? header.outerHTML : '<header class="sc-page-header"><h1>' + copy[options.lang].title + '</h1><p>' + copy[options.lang].intro + '</p></header>';
      main.innerHTML = headerHtml + '<p class="lf-local-note">' + copy[options.lang].local + '</p>' + controlsHtml(events, options.lang) + '<div id="feed-results">' + feedHtml(events, options) + '</div>' + back;
      var year = doc.getElementById('feed-year'), type = doc.getElementById('feed-type'), results = doc.getElementById('feed-results'), count = doc.getElementById('feed-count');
      function render() { var filtered = filterEvents(events, { year: year.value, type: type.value }); results.innerHTML = feedHtml(filtered, options); count.textContent = countText(filtered.length, events.length, options.lang); }
      year.addEventListener('change', render); type.addEventListener('change', render);
      results.addEventListener('click', function (event) { if (event.target.closest('[data-feed-reset]')) { year.value = 'all'; type.value = 'all'; render(); year.focus(); } });
      var view = doc.defaultView;
      if (view && view.location.hash) { var target = doc.getElementById(view.location.hash.slice(1)); if (target) view.requestAnimationFrame(function () { target.scrollIntoView(); }); }
    }
    main.dataset.localFeedMounted = 'true';
  }
  return { selectedIds: selectedIds, mediaIds: mediaIds, labels: labels, buildModel: buildModel, filterEvents: filterEvents, selectActivities: selectActivities, titleFor: titleFor, feedHtml: feedHtml, selectedActivitiesHtml: selectedActivitiesHtml, mediaHtml: mediaHtml, routeHref: routeHref, mount: mount };
});
