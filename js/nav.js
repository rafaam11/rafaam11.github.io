/* nav.js — localized shared top navigation and footer.
 *
 * Every page declares data-base (path to site root), data-page (active nav key),
 * data-lang (ko | en), and data-route (semantic path inside a language tree).
 * Markup is built without fetch so both file:// and HTTP previews keep working.
 */
(function (root, factory) {
  var i18n = root.SiteI18n;
  if (typeof module === 'object' && module.exports) i18n = require('./site-i18n.js');
  var value = factory(i18n);
  if (typeof module === 'object' && module.exports) module.exports = value;
  root.SiteNav = value;
  if (root.document) value.mount(root.document, root.location);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (i18n) {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function navigationHtml(options) {
    var base = options.base || '';
    var current = options.current || 'home';
    var locale = i18n.normalizeLocale(options.locale);
    var route = options.route || '';
    var isFile = Boolean(options.isFile);
    var copy = i18n.ui[locale].nav;
    var routes = i18n.routeDescriptors;
    var home = routes.find(function (descriptor) { return descriptor.navigation === 'brand'; });
    var links = routes.filter(function (descriptor) { return descriptor.navigation === 'link'; });
    var navItems = links.map(function (link) {
      var active = link.page === current;
      return '<li class="nav-item">' +
        '<a class="nav-link' + (active ? ' active' : '') + '" href="' + escapeHtml(i18n.routeHref(base, locale, link.route, isFile)) + '"' +
        (active ? ' aria-current="page"' : '') + '>' +
        (active ? '<span class="visually-hidden">' + escapeHtml(copy.currentPage) + '</span>' : '') +
        escapeHtml(copy[link.page]) + '</a></li>';
    }).join('');
    var koreanHref = i18n.routeHref(base, 'ko', route, isFile);
    var englishHref = i18n.routeHref(base, 'en', route, isFile);
    var languageSwitch =
      '<div class="language-switch" role="group" aria-label="' + escapeHtml(copy.languageSwitcher) + '">' +
        '<a class="language-option' + (locale === 'ko' ? ' active' : '') + '" href="' + escapeHtml(koreanHref) + '" lang="ko" data-route="' + escapeHtml(route) + '"' +
          (locale === 'ko' ? ' aria-current="page"' : '') + '>' + escapeHtml(copy.korean) + '</a>' +
        '<span aria-hidden="true">|</span>' +
        '<a class="language-option' + (locale === 'en' ? ' active' : '') + '" href="' + escapeHtml(englishHref) + '" lang="en" data-route="' + escapeHtml(route) + '"' +
          (locale === 'en' ? ' aria-current="page"' : '') + '>' + escapeHtml(copy.english) + '</a>' +
      '</div>';

    return '<a class="ss-skip-link" href="#main-content">' + escapeHtml(copy.skipToContent) + '</a>' +
    '<nav class="td-site-nav" aria-label="' + escapeHtml(copy.primaryNavigation) + '">' +
      '<div class="td-site-nav__inner">' +
        '<a class="td-site-nav__brand" href="' + escapeHtml(i18n.routeHref(base, locale, home.route, isFile)) + '">Jinmin Kim</a>' +
        '<ul class="td-site-nav__links">' + navItems + '</ul>' +
        languageSwitch +
      '</div>' +
    '</nav>';
  }

  function footerHtml(locale) {
    var normalized = i18n.normalizeLocale(locale);
    var collaboration = normalized === 'en'
      ? 'Joint development across registration, sensing, medical workflows, and working software.'
      : '정합, 센싱, 의료 워크플로, 동작하는 소프트웨어를 연결하는 공동개발.';
    return '<div class="td-site-footer__inner">' +
      '<div><strong>Jinmin Kim</strong><p>' + escapeHtml(collaboration) + '</p></div>' +
      '<div class="td-site-footer__links"><a href="mailto:uiop3847@naver.com">Email</a><a href="https://github.com/rafaam11" target="_blank" rel="noopener">GitHub</a></div>' +
      '<div class="td-site-footer__meta">© 2026 · ' + escapeHtml(i18n.ui[normalized].footer) + '</div>' +
    '</div>';
  }

  function mount(doc, location) {
    var body = doc.body;
    if (!body) return;
    var base = body.getAttribute('data-base') || '';
    var current = body.getAttribute('data-page') || 'home';
    var locale = i18n.normalizeLocale(body.getAttribute('data-lang'));
    var route = body.getAttribute('data-route') || '';
    var isFile = Boolean(location && location.protocol === 'file:');

    Array.prototype.forEach.call(doc.querySelectorAll('a[data-root-dir]'), function (link) {
      link.setAttribute('href', i18n.routeHref(base, locale, link.getAttribute('data-root-dir'), isFile));
    });
    if (!isFile) {
      Array.prototype.forEach.call(doc.querySelectorAll('a[href$="/index.html"], a[href="index.html"]'), function (link) {
        link.setAttribute('href', link.getAttribute('href').replace(/index\.html$/, ''));
      });
    }

    var navMount = doc.getElementById('site-nav');
    if (navMount) navMount.innerHTML = navigationHtml({
      base: base,
      current: current,
      locale: locale,
      route: route,
      isFile: isFile
    });

    var footMount = doc.getElementById('site-footer');
    if (footMount) {
      footMount.className = 'td-site-footer';
      footMount.innerHTML = footerHtml(locale);
    }
  }

  return {
    navigationHtml: navigationHtml,
    footerHtml: footerHtml,
    mount: mount
  };
});
