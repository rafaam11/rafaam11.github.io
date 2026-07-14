/* nav.js — single source of truth for the shared top nav + footer.
 *
 * Builds the markup with the DOM API so it works both over file://
 * (local preview, where fetch() of a partial would be blocked) and
 * over http(s) on GitHub Pages.
 *
 * Each page declares two attributes on <body>:
 *   data-base   relative path back to site root ("" on root, "../" one level deep)
 *   data-page   active page key: home | projects | capabilities | cv | contact
 * and provides empty placeholders:
 *   <header id="site-nav"></header> ... <footer id="site-footer"></footer>
 */
(function () {
  var body = document.body;
  var base = body.getAttribute('data-base') || '';
  var current = body.getAttribute('data-page') || 'home';

  // Clean directory URLs on a real server; explicit index.html for file:// preview.
  var isFile = window.location.protocol === 'file:';
  function dir(path) { return base + path + (isFile ? 'index.html' : ''); }

  var home = base + (isFile ? 'index.html' : '');
  if (home === '') home = './'; // avoid empty href on the home page over http(s)
  var links = [
    { key: 'projects',     label: 'Projects',        href: dir('projects/') },
    { key: 'capabilities', label: 'Capabilities',    href: dir('research/') },
    { key: 'cv',           label: 'CV',              href: dir('cv/') },
    { key: 'contact',      label: 'Contact',         href: dir('contact/') }
  ];

  // Authored directory links keep an explicit index.html fallback for file://,
  // then switch to clean directory URLs when served over HTTP(S).
  Array.prototype.forEach.call(document.querySelectorAll('a[data-root-dir]'), function (link) {
    link.setAttribute('href', dir(link.getAttribute('data-root-dir')));
  });
  if (!isFile) {
    Array.prototype.forEach.call(document.querySelectorAll('a[href$="/index.html"], a[href="index.html"]'), function (link) {
      link.setAttribute('href', link.getAttribute('href').replace(/index\.html$/, ''));
    });
  }

  /* ── Navigation ── */
  var navItems = links.map(function (l) {
    return '<li class="nav-item">' +
      '<a class="nav-link' + (l.key === current ? ' active' : '') + '" href="' + l.href + '"' +
      (l.key === current ? ' aria-current="page"' : '') + '>' +
      (l.key === current ? '<span class="visually-hidden">Current page: </span>' : '') +
      l.label + '</a></li>';
  }).join('');

  var navHtml =
    '<nav class="navbar navbar-expand-md navbar-light topnav sticky-top">' +
      '<div class="container">' +
        '<a class="navbar-brand" href="' + home + '">Jinmin Kim</a>' +
        '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" ' +
          'data-bs-target="#siteNavLinks" aria-controls="siteNavLinks" ' +
          'aria-expanded="false" aria-label="Toggle navigation">' +
          '<span class="navbar-toggler-icon"></span>' +
        '</button>' +
        '<div class="collapse navbar-collapse" id="siteNavLinks">' +
          '<ul class="navbar-nav ms-auto align-items-md-center">' +
            navItems +
            '<li class="nav-item">' +
              '<a class="nav-link" href="https://github.com/rafaam11" target="_blank" rel="noopener" aria-label="GitHub">' +
                '<i class="fab fa-github"></i><span class="d-md-none"> GitHub</span>' +
              '</a></li>' +
          '</ul>' +
        '</div>' +
      '</div>' +
    '</nav>';

  var navMount = document.getElementById('site-nav');
  if (navMount) navMount.innerHTML = navHtml;

  /* ── Footer ── */
  var year = '2026'; // static (no Date.* needed); update if regenerating yearly
  var footHtml =
    '<div class="foot-social">' +
      '<a href="https://github.com/rafaam11" target="_blank" rel="noopener" aria-label="GitHub"><i class="fab fa-github"></i></a>' +
      '<a href="https://www.linkedin.com/in/rlawlsals" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>' +
      '<a href="mailto:uiop3847@naver.com" aria-label="Email"><i class="fas fa-envelope"></i></a>' +
    '</div>' +
    '<div class="foot-meta">© ' + year + ' Jinmin Kim · 3D Spatial Computing · Research Engineer · Daegu, Korea</div>';

  var footMount = document.getElementById('site-footer');
  if (footMount) {
    footMount.className = 'site-footer';
    footMount.innerHTML = footHtml;
  }
})();
