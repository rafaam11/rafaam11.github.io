(function (root, factory) {
  var value = factory();
  if (typeof module === 'object' && module.exports) module.exports = value;
  root.SiteI18n = value;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var canonicalCaseSlugs = [
    'surgical-navigation',
    'mandibular-fracture',
    'life-careverse',
    'rtms-navigation',
    'unmanned-forklift',
    'ai-build-lab'
  ];
  var routeDescriptors = [
    { page: 'home', route: '', file: 'index.html', navigation: 'brand' },
    { page: 'projects', route: 'projects/', file: 'projects/index.html', navigation: 'link' },
    { page: 'cv', route: 'cv/', file: 'cv/index.html', navigation: 'link', allowsNamedEmployer: true },
    { page: 'contact', route: 'contact/', file: 'contact/index.html', navigation: 'link' }
  ].concat(canonicalCaseSlugs.map(function (slug) {
    return { page: 'projects', route: 'projects/' + slug + '/', file: 'projects/' + slug + '/index.html' };
  }));
  var supportedNavigationPages = routeDescriptors
    .filter(function (descriptor) { return Boolean(descriptor.navigation); })
    .map(function (descriptor) { return descriptor.page; });

  var ui = {
    ko: {
      nav: {
        projects: '프로젝트',
        cv: 'CV',
        contact: '연락처',
        currentPage: '현재 페이지: ',
        skipToContent: '본문으로 건너뛰기',
        primaryNavigation: '주요 탐색',
        toggleNavigation: '메뉴 열기',
        languageSwitcher: '언어 선택',
        korean: '한국어',
        english: 'EN'
      },
      portfolio: {
        capability: '역량',
        methods: '방법',
        howIValidate: '검증 방법',
        relatedProjects: '관련 프로젝트',
        relatedProjectCount: function (count) { return '관련 프로젝트 ' + count + '개'; },
        capabilityChapter: '역량 챕터',
        projectCount: function (count) { return '프로젝트 ' + count + '개'; },
        transferableCapability: '전이 가능한 역량',
        whatISolve: '해결하는 문제',
        problem: '문제',
        owned: '내 범위',
        evidence: '근거',
        evidenceStates: {
          verified: '검증됨',
          ongoing: '진행 중',
          prototype: '프로토타입',
          expected: '예상',
          research: '연구',
          completed: '완료'
        },
        renderError: '포트폴리오 데이터를 표시할 수 없습니다.'
      },
      footer: '로봇SW 엔지니어 · 대한민국 대구'
    },
    en: {
      nav: {
        projects: 'Projects',
        cv: 'CV',
        contact: 'Contact',
        currentPage: 'Current page: ',
        skipToContent: 'Skip to main content',
        primaryNavigation: 'Primary navigation',
        toggleNavigation: 'Toggle menu',
        languageSwitcher: 'Choose language',
        korean: '한국어',
        english: 'EN'
      },
      portfolio: {
        capability: 'Capability',
        methods: 'Methods',
        howIValidate: 'How I validate',
        relatedProjects: 'Related projects',
        relatedProjectCount: function (count) { return count + ' related project' + (count === 1 ? '' : 's'); },
        capabilityChapter: 'Capability chapter',
        projectCount: function (count) { return count + ' project' + (count === 1 ? '' : 's'); },
        transferableCapability: 'Transferable capability',
        whatISolve: 'What I solve',
        problem: 'Problem',
        owned: 'My scope',
        evidence: 'Evidence',
        evidenceStates: {
          verified: 'Verified',
          ongoing: 'Ongoing',
          prototype: 'Prototype',
          expected: 'Expected',
          research: 'Research',
          completed: 'Completed'
        },
        renderError: 'Portfolio data could not be rendered.'
      },
      footer: 'Robot Software Engineer · Daegu, Korea'
    }
  };

  function normalizeLocale(locale) {
    return locale === 'en' ? 'en' : 'ko';
  }

  function normalizeRoute(route) {
    var value = String(route || '').replace(/^\/+/, '').replace(/index\.html$/, '');
    if (value && value.charAt(value.length - 1) !== '/') value += '/';
    return value;
  }

  function routeHref(base, locale, route, isFile) {
    var href = String(base || '') + (normalizeLocale(locale) === 'en' ? 'en/' : '') + normalizeRoute(route);
    if (isFile) return href + 'index.html';
    return href || './';
  }

  return {
    defaultLocale: 'ko',
    supportedLocales: ['ko', 'en'],
    supportedNavigationPages: supportedNavigationPages,
    canonicalCaseSlugs: canonicalCaseSlugs,
    routeDescriptors: routeDescriptors,
    ui: ui,
    normalizeLocale: normalizeLocale,
    routeHref: routeHref
  };
});
