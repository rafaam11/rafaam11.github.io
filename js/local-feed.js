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
  var selectedIds = ['quadruped-engineering-award-2020', 'ism-launcher-paper-2019', 'accas-occlusion-paper-2022'];
  // Media attach to events through each record's eventIds (data/activity-media.json), ordered by 'order'.
  function mediaIndex(mediaData) {
    var media = mediaData && (mediaData.media || mediaData) || {};
    var index = {};
    Object.keys(media).forEach(function (id) {
      var record = media[id];
      (record.eventIds || []).forEach(function (eventId) { (index[eventId] = index[eventId] || []).push(record); });
    });
    Object.keys(index).forEach(function (eventId) {
      index[eventId].sort(function (a, b) { return (a.order || 0) - (b.order || 0) || String(a.id).localeCompare(String(b.id)); });
    });
    return index;
  }
  // Editorial labels only. Event dates, prose, links and evidence stay canonical.
  var labels = {
    'neuropilot-evaluation-review-2026': ['research', 'NeuroPilot 평가 도구와 기준 데이터 검토', 'NeuroPilot evaluation and reference-data review'],
    'shanghai-field-trip-2018': ['activity', '상하이 로봇전시회·글로벌 기업 탐방', 'Shanghai robot show and company tour'],
    'club-mt-2018': ['activity', '발명동아리 봄 MT', 'Invention club spring trip'],
    'invention-club-camp-2018': ['activity', '2018 하계 발명·창의 캠프 운영', '2018 summer invention camp'],
    'club-exhibition-2018': ['activity', '동아리 연합 교내전시회', 'Joint club exhibition on campus'],
    'club-mt-2019': ['activity', '발명동아리 봄 MT 2019', 'Invention club spring trip 2019'],
    'invention-club-camp-2019': ['activity', '2019 하계 발명·창의 캠프 운영', '2019 summer invention camp'],
    'tmu-summer-school-2019': ['activity', 'TMU Japanese Summer School', 'TMU Japanese Summer School'],
    'printing-contest-2019': ['activity', '3D 프린팅 경진대회 참가', '3D printing contest'],
    'invention-club-general-meeting-2019': ['activity', '발명동아리 부회장 선출', 'Elected club vice-president'],
    'quadruped-build-start-2020': ['research', '4족 보행 로봇 제작 시작', 'Quadruped robot build begins'],
    'unist-internship-2020': ['research', 'UNIST 방학 연구 인턴', 'Summer research internship at UNIST'],
    'dgist-first-visit-2020': ['career', 'DGIST 캠퍼스 첫 방문', 'First visit to DGIST'],
    'motion-control-internship-2021': ['research', '겨울방학 연구인턴 수료 (DGIST)', 'Winter research internship at DGIST'],
    'ar-measure-prototype-2021': ['research', 'AR 마커 거리·각도 측정 프로토타입', 'AR marker measurement prototype'],
    'science-expo-booth-2021': ['activity', '과학기술대전 연구실 부스 운영', 'Lab booth at the science exhibition'],
    'mini-md-workshop-2022': ['conference', 'Mini-MD 워크숍 참가', 'Mini-MD workshop'],
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
    'haptic-occlusion-poster-award-2024': ['award', '햅틱 교합 연구 발표·우수포스터상', 'Haptic occlusion poster and Best Poster Award', ['conference']],
    'smcnavi-development-2023': ['research', 'SMCNavi 수술내비게이션 개발 시작', 'SMCNavi surgical-navigation development'],
    'omfs-vr-development-2023': ['research', 'OMFS VR 상담 애플리케이션 개발 시작', 'OMFS VR consultation application development'],
    'digitrack-researcher-2023': ['career', '디지트랙 소프트웨어 연구원 합류', 'Joined DIGITRACK as a software researcher'],
    'dgist-masters-degree-2023': ['career', 'DGIST 로봇및기계전자공학 석사 졸업', 'M.S. completed at DGIST'],
    'mandibular-conference-award-2023': ['award', '턱뼈 모델 최적화 발표·우수논문상', 'Jawbone optimisation presentation and Best Paper Award', ['conference']],
    'accas-occlusion-paper-2022': ['conference', 'ACCAS 2022 치열궁 기반 교합 연구 발표', 'Dental-arch occlusion research at ACCAS 2022'],
    'virtual-jawbone-presentation-2022': ['conference', '가상 턱뼈 모델 재구성 연구 발표', 'Virtual jawbone reconstruction presentation'],
    'mandibular-research-start-2021': ['research', '하악골 골절 정복 최적화 연구 시작', 'Mandibular fracture reduction research'],
    'ar-surgery-research-2021': ['research', '구강악안면 AR 수술 연구 참여', 'Joined oral and maxillofacial AR surgery research'],
    'dgist-masters-start-2021': ['career', 'DGIST 석사과정 시작', 'Started the M.S. programme at DGIST'],
    'kumoh-bachelors-degree-2021': ['career', '금오공과대학교 기계시스템공학 학사 졸업', 'B.S. completed at Kumoh National Institute of Technology'],
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
    ko: { title: '소식', intro: '연구, 발표, 수상, 대외활동과 소프트웨어 작업을 시간순으로 기록합니다.', selected: '선택한 활동', selectedIntro: '로봇 제작, 해외 심포지엄, 학회 발표의 기록입니다.', year: '연도', type: '분류', allYears: '모든 연도', allTypes: '모든 분류', reset: '필터 초기화', empty: '선택한 조건에 해당하는 소식이 없습니다.', mediaOnly: '사진·영상 있는 소식만', photos: '사진', close: '닫기', prev: '이전', next: '다음', play: '영상', local: '활동 기록에 연결된 공개 사진·영상입니다.', types: { research: '연구', conference: '학회·발표', award: '수상', career: '경력·학위', activity: '대외활동', patent: '특허 출원', software: '소프트웨어' }, tags: { research: '연구', conference: '학회', award: '수상', career: '경력·학위', activity: '대외활동', patent: '특허', software: '소프트웨어' } },
    en: { title: 'News', intro: 'Research, presentations, awards, activities and software work, in chronological order.', selected: 'Selected activities', selectedIntro: 'Records of building robots, an overseas symposium and a conference presentation.', year: 'Year', type: 'Type', allYears: 'All years', allTypes: 'All types', reset: 'Reset filters', empty: 'No news matches these filters.', mediaOnly: 'Only posts with photos or videos', photos: 'Photos', close: 'Close', prev: 'Previous', next: 'Next', play: 'Video', local: 'Public photos and videos linked to the activity records.', types: { research: 'Research', conference: 'Conferences', award: 'Awards', career: 'Career & degrees', activity: 'Activities', patent: 'Patent applications', software: 'Software' }, tags: { research: 'Research', conference: 'Conference', award: 'Award', career: 'Career', activity: 'Activity', patent: 'Patent', software: 'Software' } }
  };
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function locale(lang) { return lang === 'en' ? 'en' : 'ko'; }
  function routeHref(base, lang, route) { return (base || '') + (locale(lang) === 'en' ? 'en/' : '') + route + 'index.html'; }
  function titleFor(event, lang) {
    if (labels[event.id]) return labels[event.id][lang === 'en' ? 2 : 1];
    var release = event.id.match(/^(multi-cli-work|harness-manager|view-anything|bus-info)-v(\d+)-(\d+)-(\d+)$/);
    if (release) return (release[1] !== 'bus-info' ? release[1] : lang === 'en' ? 'Daegu bus app' : '대구 버스 정보 앱') + ' v' + release.slice(2).join('.') + (lang === 'en' ? ' release' : ' 공개');
    return event.translations[lang].body.split(/\.\s/)[0];
  }
  function paragraphs(text) { return String(text || '').split(/\n\s*\n/).map(function (part) { return part.trim(); }).filter(Boolean); }
  function buildModel(news, lang, mediaData) {
    lang = locale(lang);
    var mediaByEvent = mediaIndex(mediaData);
    var seen = new Set();
    return (news || []).filter(function (event) { if (seen.has(event.id)) return false; seen.add(event.id); return true; }).map(function (event, index) {
      var category = labels[event.id] ? labels[event.id][0] : 'software';
      return { id: event.id, eventDate: event.eventDate, datePrecision: event.datePrecision, year: event.eventDate.slice(0, 4), title: titleFor(event, lang), category: category,
        categories: labels[event.id] && labels[event.id][3] ? [category].concat(labels[event.id][3]) : [category],
        body: event.translations[lang].body, post: event.translations[lang].post || '', links: event.links || [], evidence: event.evidence, media: (mediaByEvent[event.id] || []).slice(), originalIndex: index };
    }).sort(function (a, b) { return b.eventDate.localeCompare(a.eventDate) || a.originalIndex - b.originalIndex; });
  }
  function filterEvents(events, filters) {
    filters = filters || {};
    return events.filter(function (event) { return (!filters.year || filters.year === 'all' || event.year === filters.year) && (!filters.type || filters.type === 'all' || event.categories.indexOf(filters.type) !== -1) && (!filters.mediaOnly || event.media.length > 0); });
  }
  function selectActivities(events) { return selectedIds.map(function (id) { return events.find(function (event) { return event.id === id; }); }).filter(Boolean); }
  function eventHref(event, options) { return routeHref(options.base, options.lang, 'news/') + '#news-' + event.id; }
  function linksHtml(event, options) {
    return event.links.map(function (link) { var href = link.route ? routeHref(options.base, options.lang, link.route) : link.href; return '<a href="' + esc(href) + '">' + esc(link.translations[options.lang].label) + '</a>'; }).join('<span aria-hidden="true"> · </span>');
  }
  // Rows sit under a year heading, so they show MM.DD, the month, or the year alone, as the record's precision allows.
  function dateLabel(event, lang) {
    var parts = String(event.eventDate).split('-');
    if (parts.length < 2) return parts[0];
    var month = Number(parts[1]);
    if (locale(lang) === 'en') return months[month - 1] + (parts.length > 2 ? ' ' + Number(parts[2]) : '');
    return parts.length > 2 ? parts[1] + '.' + parts[2] : month + '월';
  }
  // The first photo (or a video poster) of the event, as a small square beside the row.
  function thumbItem(event) {
    var media = event.media || [];
    return media.filter(function (item) { return item.type !== 'video'; })[0] || media.filter(function (item) { return item.type === 'video' && item.poster; })[0] || null;
  }
  function thumbSrc(item, options) { return (options.base || '') + (item.type === 'video' ? item.poster : item.path); }
  function mediaHtml(event, options) {
    var images = event.media.filter(function (item) { return item.type !== 'video'; });
    var video = event.media.filter(function (item) { return item.type === 'video'; }).slice(0, 1);
    // Grid: up to four tiles; the fourth carries a "+N" count and the rest stay reachable in the lightbox.
    var all = images.concat(video);
    if (!all.length) return '';
    var visible = Math.min(all.length, 4), extra = all.length - visible;
    var c = copy[options.lang];
    return '<div class="lf-grid lf-grid--' + visible + '" role="group" aria-label="' + esc((event.title ? event.title + ' — ' : '') + (options.lang === 'en' ? all.length + ' photos and videos' : '사진·영상 ' + all.length + '개')) + '">' + all.map(function (item, index) {
      var translation = item.translations[options.lang];
      var src = (options.base || '') + item.path;
      var size = item.width && item.height ? ' width="' + item.width + '" height="' + item.height + '"' : '';
      var isVideo = item.type === 'video';
      var still = isVideo ? (item.poster ? '<img src="' + esc((options.base || '') + item.poster) + '" alt="' + esc(translation.alt) + '"' + size + ' loading="lazy" decoding="async">' : '<video muted playsinline preload="metadata"' + size + ' aria-label="' + esc(translation.alt) + '"><source src="' + esc(src) + '" type="video/mp4"></video>') : '<img src="' + esc(src) + '" alt="' + esc(translation.alt) + '"' + size + ' loading="lazy" decoding="async">';
      var badge = isVideo ? '<span class="lf-play" aria-hidden="true"></span>' : '';
      var overlay = index === visible - 1 && extra > 0 ? '<span class="lf-tile-more" aria-hidden="true">+' + extra + '</span>' : '';
      return '<figure class="lf-tile' + (index >= visible ? ' lf-tile--extra' : '') + '" data-media-id="' + esc(item.id) + '" data-index="' + index + '" data-type="' + (isVideo ? 'video' : 'image') + '" data-src="' + esc(src) + '"' + (isVideo && item.poster ? ' data-poster="' + esc((options.base || '') + item.poster) + '"' : '') + (index >= visible ? ' hidden' : '') + '><a href="' + esc(src) + '" data-lightbox="' + index + '"' + (isVideo ? ' aria-label="' + esc(c.play + ': ' + translation.alt) + '"' : '') + '>' + still + badge + overlay + '</a><figcaption' + (all.length > 1 ? ' class="lf-sr"' : '') + '>' + esc(translation.caption) + '</figcaption></figure>';
    }).join('') + '</div>';
  }
  // One timeline row: date | tags | title and one-line body | links | thumbnail.
  // Rows with a post or media are native <details>; the summary is the row and the body holds the post and the media grid.
  function rowHtml(event, options) {
    var c = copy[options.lang];
    var parts = paragraphs(event.post);
    var expandable = parts.length > 0 || event.media.length > 0;
    var tag = expandable ? 'summary' : 'div';
    var head = '<' + tag + ' class="lf-sum"><time class="lf-date" datetime="' + esc(event.eventDate) + '">' + esc(dateLabel(event, options.lang)) + '</time><span class="lf-tags">' + event.categories.map(function (category) { return '<span class="sc-tag">' + esc(c.tags[category] || c.types[category] || category) + '</span>'; }).join('') + '</span><span class="lf-main"><h3 class="lf-title">' + esc(event.title) + '</h3><span class="lf-body">' + esc(event.body) + '</span></span></' + tag + '>';
    var detail = expandable
      ? '<details class="lf-detail">' + head + '<div class="lf-more">' + (parts.length ? '<div class="lf-post">' + parts.map(function (part) { return '<p>' + esc(part) + '</p>'; }).join('') + '</div>' : '') + mediaHtml(event, options) + '</div></details>'
      : '<div class="lf-detail">' + head + '</div>';
    var links = linksHtml(event, options);
    var thumb = thumbItem(event);
    return '<li class="lf-row" id="news-' + esc(event.id) + '" data-news-id="' + esc(event.id) + '">' + detail + (links ? '<p class="lf-links">' + links + '</p>' : '') +
      (thumb ? '<span class="lf-thumb"><img src="' + esc(thumbSrc(thumb, options)) + '" alt="' + esc(thumb.translations[options.lang].alt) + '" width="56" height="56" loading="lazy" decoding="async"></span>' : '') + '</li>';
  }
  function lightboxHtml(lang) {
    var c = copy[lang];
    return '<dialog class="lf-lightbox" aria-label="' + c.photos + '"><div class="lf-lightbox-stage"></div><p class="lf-lightbox-caption"></p><p class="lf-lightbox-count" aria-live="polite"></p><button type="button" class="lf-lightbox-prev" aria-label="' + c.prev + '">‹</button><button type="button" class="lf-lightbox-next" aria-label="' + c.next + '">›</button><button type="button" class="lf-lightbox-close" aria-label="' + c.close + '">×</button></dialog>';
  }
  function setupLightbox(doc, container, dialog) {
    if (!dialog || typeof dialog.showModal !== 'function') return;
    var stage = dialog.querySelector('.lf-lightbox-stage'), caption = dialog.querySelector('.lf-lightbox-caption'), count = dialog.querySelector('.lf-lightbox-count');
    var tiles = [], current = 0, opener = null, startX = null;
    function show(index) {
      current = (index + tiles.length) % tiles.length;
      var tile = tiles[current], still = tile.querySelector('img, video');
      var label = still ? still.getAttribute(still.tagName === 'IMG' ? 'alt' : 'aria-label') || '' : '';
      stage.innerHTML = tile.dataset.type === 'video'
        ? '<video controls autoplay muted playsinline' + (tile.dataset.poster ? ' poster="' + esc(tile.dataset.poster) + '"' : '') + ' aria-label="' + esc(label) + '"><source src="' + esc(tile.dataset.src) + '" type="video/mp4"></video>'
        : '<img src="' + esc(tile.dataset.src) + '" alt="' + esc(label) + '">';
      caption.textContent = tile.querySelector('figcaption').textContent;
      count.textContent = tiles.length > 1 ? (current + 1) + ' / ' + tiles.length : '';
      dialog.classList.toggle('is-single', tiles.length < 2);
    }
    container.addEventListener('click', function (event) {
      var link = event.target.closest('[data-lightbox]');
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      tiles = Array.prototype.slice.call(link.closest('.lf-grid').querySelectorAll('.lf-tile'));
      opener = link;
      show(Number(link.dataset.lightbox));
      dialog.showModal();
    });
    dialog.querySelector('.lf-lightbox-prev').addEventListener('click', function () { show(current - 1); });
    dialog.querySelector('.lf-lightbox-next').addEventListener('click', function () { show(current + 1); });
    dialog.querySelector('.lf-lightbox-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); }
    });
    dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('touchstart', function (event) { startX = event.touches[0].clientX; }, { passive: true });
    dialog.addEventListener('touchend', function (event) {
      if (startX === null) return;
      var dx = event.changedTouches[0].clientX - startX; startX = null;
      if (Math.abs(dx) > 40 && tiles.length > 1) show(current + (dx < 0 ? 1 : -1));
    });
    dialog.addEventListener('close', function () { stage.innerHTML = ''; if (opener) opener.focus(); });
  }
  // One chronological timeline, grouped by year (newest first).
  function feedHtml(events, options) {
    options = Object.assign({ lang: 'ko', base: '' }, options || {}); options.lang = locale(options.lang);
    if (!events.length) return '<div class="lf-empty"><p>' + copy[options.lang].empty + '</p><button type="button" data-feed-reset>' + copy[options.lang].reset + '</button></div>';
    var years = [], byYear = {};
    events.forEach(function (event) { if (!byYear[event.year]) { byYear[event.year] = []; years.push(event.year); } byYear[event.year].push(event); });
    return '<div class="lf-feed">' + years.map(function (year) {
      return '<section class="lf-year" aria-labelledby="news-' + esc(year) + '"><h2 id="news-' + esc(year) + '">' + esc(year) + '</h2><ol class="lf-list">' + byYear[year].map(function (event) { return rowHtml(event, options); }).join('') + '</ol></section>';
    }).join('') + '</div>';
  }
  // '#news-<id>' (or any fragment) → element id; percent-encoded fragments are decoded.
  function hashTargetId(hash) {
    if (!hash || hash.charAt(0) !== '#' || hash.length < 2) return '';
    try { return decodeURIComponent(hash.slice(1)); } catch (error) { return hash.slice(1); }
  }
  // Opens the timeline row a URL fragment points at and returns the element to scroll to.
  function openFromHash(doc, hash) {
    var id = hashTargetId(hash);
    var target = id ? doc.getElementById(id) : null;
    if (!target) return null;
    var details = target.getAttribute && target.getAttribute('data-news-id') !== null && target.querySelector('details');
    if (details) details.open = true;
    return target;
  }
  function selectedActivitiesHtml(events, options) {
    options = Object.assign({ lang: 'ko', base: '' }, options || {}); options.lang = locale(options.lang);
    var c = copy[options.lang];
    return '<section class="lf-selected" aria-labelledby="selected-activities-title"><h2 id="selected-activities-title">' + c.selected + '</h2><p class="lf-selected-intro">' + c.selectedIntro + '</p><div class="lf-activity-grid">' + selectActivities(events).map(function (event) {
      var href = esc(eventHref(event, options));
      var thumb = thumbItem(event);
      return '<article class="lf-activity" data-activity-id="' + esc(event.id) + '">' + (thumb ? '<a class="lf-activity-thumb" href="' + href + '"><img src="' + esc(thumbSrc(thumb, options)) + '" alt="' + esc(thumb.translations[options.lang].alt) + '"' + (thumb.width && thumb.height ? ' width="' + thumb.width + '" height="' + thumb.height + '"' : '') + ' loading="lazy" decoding="async"></a>' : '') + '<time datetime="' + esc(event.eventDate) + '">' + esc(event.eventDate.replace(/-/g, '.')) + '</time><h3><a href="' + href + '">' + esc(event.title) + '</a></h3></article>';
    }).join('') + '</div></section>';
  }
  function countText(shown, total, lang) { return lang === 'en' ? shown + ' of ' + total + ' entries' : '전체 ' + total + '건 중 ' + shown + '건'; }
  function controlsHtml(events, lang) {
    var c = copy[lang], years = Array.from(new Set(events.map(function (event) { return event.year; })));
    var withMedia = events.filter(function (event) { return event.media.length > 0; }).length;
    return '<div class="lf-filters" role="group" aria-label="' + (lang === 'en' ? 'Filter news' : '소식 필터') + '"><label for="feed-year">' + c.year + '<select id="feed-year"><option value="all">' + c.allYears + '</option>' + years.map(function (year) { return '<option value="' + year + '">' + year + '</option>'; }).join('') + '</select></label><label for="feed-type">' + c.type + '<select id="feed-type"><option value="all">' + c.allTypes + '</option>' + Object.keys(c.types).map(function (key) { return '<option value="' + key + '">' + c.types[key] + '</option>'; }).join('') + '</select></label><label class="lf-toggle" for="feed-media"><input type="checkbox" id="feed-media"> ' + c.mediaOnly + ' (' + withMedia + ')</label><p id="feed-count" role="status" aria-live="polite" aria-atomic="true">' + countText(events.length, events.length, lang) + '</p></div>';
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
      main.innerHTML = headerHtml + '<p class="lf-local-note">' + copy[options.lang].local + '</p>' + controlsHtml(events, options.lang) + '<div id="feed-results">' + feedHtml(events, options) + '</div>' + back + lightboxHtml(options.lang);
      var year = doc.getElementById('feed-year'), type = doc.getElementById('feed-type'), mediaOnly = doc.getElementById('feed-media'), results = doc.getElementById('feed-results'), count = doc.getElementById('feed-count');
      function render() { var filtered = filterEvents(events, { year: year.value, type: type.value, mediaOnly: mediaOnly.checked }); results.innerHTML = feedHtml(filtered, options); count.textContent = countText(filtered.length, events.length, options.lang); }
      function resetFilters() { year.value = 'all'; type.value = 'all'; mediaOnly.checked = false; render(); }
      year.addEventListener('change', render); type.addEventListener('change', render); mediaOnly.addEventListener('change', render);
      results.addEventListener('click', function (event) {
        if (event.target.closest('[data-feed-reset]')) { resetFilters(); year.focus(); return; }
        // The thumbnail sits outside the summary (links stay out of it too); clicking it toggles the row.
        var thumb = event.target.closest('.lf-thumb');
        var details = thumb && thumb.parentNode.querySelector('details');
        if (details) details.open = !details.open;
      });
      setupLightbox(doc, results, main.querySelector('.lf-lightbox'));
      var view = doc.defaultView;
      var reveal = function () {
        var hash = view.location.hash, target = openFromHash(doc, hash);
        if (!target && /^news-/.test(hashTargetId(hash)) && (year.value !== 'all' || type.value !== 'all' || mediaOnly.checked)) { resetFilters(); target = openFromHash(doc, hash); }
        if (target) view.requestAnimationFrame(function () { target.scrollIntoView(); });
      };
      if (view) { reveal(); view.addEventListener('hashchange', reveal); }
    }
    main.dataset.localFeedMounted = 'true';
  }
  return { selectedIds: selectedIds, mediaIndex: mediaIndex, labels: labels, buildModel: buildModel, filterEvents: filterEvents, selectActivities: selectActivities, titleFor: titleFor, dateLabel: dateLabel, feedHtml: feedHtml, selectedActivitiesHtml: selectedActivitiesHtml, mediaHtml: mediaHtml, lightboxHtml: lightboxHtml, hashTargetId: hashTargetId, openFromHash: openFromHash, routeHref: routeHref, mount: mount };
});
