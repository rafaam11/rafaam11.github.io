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
    var links = [
      { key: 'projects', label: copy.projects, route: 'projects/' },
      { key: 'capabilities', label: copy.capabilities, route: 'research/' },
      { key: 'cv', label: copy.cv, route: 'cv/' },
      { key: 'contact', label: copy.contact, route: 'contact/' }
    ];
    var navItems = links.map(function (link) {
      var active = link.key === current;
      return '<li class="nav-item">' +
        '<a class="nav-link' + (active ? ' active' : '') + '" href="' + escapeHtml(i18n.routeHref(base, locale, link.route, isFile)) + '"' +
        (active ? ' aria-current="page"' : '') + '>' +
        (active ? '<span class="visually-hidden">' + escapeHtml(copy.currentPage) + '</span>' : '') +
        escapeHtml(link.label) + '</a></li>';
    }).join('');
    var koreanHref = i18n.routeHref(base, 'ko', route, isFile);
    var englishHref = i18n.routeHref(base, 'en', route, isFile);
    var languageSwitch =
      '<div class="language-switch" aria-label="' + escapeHtml(copy.languageSwitcher) + '">' +
        '<a class="language-option' + (locale === 'ko' ? ' active' : '') + '" href="' + escapeHtml(koreanHref) + '" lang="ko"' +
          (locale === 'ko' ? ' aria-current="true"' : '') + '>' + escapeHtml(copy.korean) + '</a>' +
        '<span aria-hidden="true">|</span>' +
        '<a class="language-option' + (locale === 'en' ? ' active' : '') + '" href="' + escapeHtml(englishHref) + '" lang="en"' +
          (locale === 'en' ? ' aria-current="true"' : '') + '>' + escapeHtml(copy.english) + '</a>' +
      '</div>';

    return '<nav class="navbar navbar-expand-md navbar-light topnav sticky-top">' +
      '<div class="container">' +
        '<a class="navbar-brand" href="' + escapeHtml(i18n.routeHref(base, locale, '', isFile)) + '">Jinmin Kim</a>' +
        '<div class="collapse navbar-collapse" id="siteNavLinks">' +
          '<ul class="navbar-nav ms-auto align-items-md-center">' + navItems +
            '<li class="nav-item"><a class="nav-link" href="https://github.com/rafaam11" target="_blank" rel="noopener" aria-label="GitHub">' +
              '<i class="fab fa-github"></i><span class="d-md-none"> GitHub</span></a></li>' +
          '</ul>' +
        '</div>' +
        languageSwitch +
        '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#siteNavLinks" ' +
          'aria-controls="siteNavLinks" aria-expanded="false" aria-label="' + escapeHtml(copy.toggleNavigation) + '">' +
          '<span class="navbar-toggler-icon"></span>' +
        '</button>' +
      '</div>' +
    '</nav>';
  }

  function footerHtml(locale) {
    var normalized = i18n.normalizeLocale(locale);
    return '<div class="foot-social">' +
      '<a href="https://github.com/rafaam11" target="_blank" rel="noopener" aria-label="GitHub"><i class="fab fa-github"></i></a>' +
      '<a href="https://www.linkedin.com/in/rlawlsals" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>' +
      '<a href="mailto:uiop3847@naver.com" aria-label="Email"><i class="fas fa-envelope"></i></a>' +
    '</div>' +
    '<div class="foot-meta">© 2026 Jinmin Kim · ' + escapeHtml(i18n.ui[normalized].footer) + '</div>';
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
      footMount.className = 'site-footer';
      footMount.innerHTML = footerHtml(locale);
    }
  }

  return {
    navigationHtml: navigationHtml,
    footerHtml: footerHtml,
    mount: mount
  };
});
