const fs = require('node:fs');
const path = require('node:path');

const data = require('../js/portfolio-data.js');
const render = require('../js/portfolio-render.js');
const i18n = require('../js/site-i18n.js');

const contributionPattern = render.policy.contributionPercentagePattern;
const privatePartnerPattern = render.policy.prohibitedPartnerPattern;
const isSafePublicPath = render.isSafePublicPath;
const siteUrl = 'https://rafaam11.github.io/';
const fallbackVisualKeys = [
  'nav-digitaltwin-pipeline',
  'coordinate-signal',
  'hololens-ar-concept',
  'forklift-sim-to-real',
  'decision-signal'
];

function portfolioRoutes() {
  return i18n.routeDescriptors;
}

function publicPortfolioFiles(rootDir) {
  return portfolioRoutes().flatMap((page) => [
    {
      relativePath: page.file,
      absolutePath: path.join(rootDir, page.file),
      route: page.route,
      locale: 'ko',
      allowsNamedEmployer: Boolean(page.allowsNamedEmployer)
    },
    {
      relativePath: path.join('en', page.file),
      absolutePath: path.join(rootDir, 'en', page.file),
      route: page.route,
      locale: 'en',
      allowsNamedEmployer: Boolean(page.allowsNamedEmployer)
    }
  ]);
}

function publishedPortfolioHtmlFiles(rootDir) {
  const files = new Map(publicPortfolioFiles(rootDir).map((file) => [
    file.relativePath.replace(/\\/g, '/'),
    { relativePath: file.relativePath, absolutePath: file.absolutePath }
  ]));
  for (const relativePath of ['research/index.html', 'en/research/index.html']) {
    files.set(relativePath, { relativePath, absolutePath: path.join(rootDir, relativePath) });
  }
  for (const projectRoot of ['projects', path.join('en', 'projects')]) {
    const absoluteRoot = path.join(rootDir, projectRoot);
    if (!fs.existsSync(absoluteRoot)) continue;
    for (const entry of fs.readdirSync(absoluteRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const relativePath = path.join(projectRoot, entry.name, 'index.html');
      files.set(relativePath.replace(/\\/g, '/'), { relativePath, absolutePath: path.join(rootDir, relativePath) });
    }
  }
  return [...files.values()].filter((file) => fs.existsSync(file.absolutePath));
}

function isPathInsideRoot(rootDir, candidatePath) {
  const relativePath = path.relative(path.resolve(rootDir), path.resolve(candidatePath));
  return Boolean(relativePath) &&
    relativePath !== '..' &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath);
}

function publicPortfolioVisualFiles(rootDir) {
  const mediaItems = data.projects.flatMap((project) => {
    const media = project.media || {};
    const references = Array.isArray(media.references) ? media.references : [];
    return [media.lead, media.video, media.poster].concat(references).filter(Boolean);
  });
  const declaredFiles = mediaItems
    .filter((item) => item.status === 'approved' && isSafePublicPath(item.publicPath) && !/^https?:\/\//i.test(item.publicPath))
    .map((item) => ({
      relativePath: path.normalize(item.publicPath),
      absolutePath: path.join(rootDir, item.publicPath),
      evidenceId: item.id
    }));
  const rendererFallbackFiles = [...new Set(data.projects
    .map((project) => project.visualKey)
    .filter((visualKey) => fallbackVisualKeys.includes(visualKey)))]
    .flatMap((visualKey) => ['', '-en'].map((suffix) => {
      const relativePath = path.join('assets', 'diagrams', `${visualKey}${suffix}.svg`);
      return { relativePath, absolutePath: path.resolve(rootDir, relativePath), evidenceId: `renderer:${visualKey}` };
    }));

  const referencedFiles = [];
  for (const file of publishedPortfolioHtmlFiles(rootDir)) {
    const html = fs.readFileSync(file.absolutePath, 'utf8');
    for (const match of html.matchAll(/\b(?:src|href)="([^"?#]+\.svg)(?:[?#][^"]*)?"/gi)) {
      const href = match[1];
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) continue;
      const absolutePath = path.resolve(path.dirname(file.absolutePath), href.replace(/\//g, path.sep));
      const relativePath = path.relative(rootDir, absolutePath);
      if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) continue;
      referencedFiles.push({ relativePath, absolutePath, evidenceId: `html:${file.relativePath}` });
    }
  }

  const unique = new Map();
  for (const file of declaredFiles.concat(rendererFallbackFiles, referencedFiles)) {
    if (!isPathInsideRoot(rootDir, file.absolutePath)) continue;
    const key = file.relativePath.replace(/\\/g, '/').toLowerCase();
    if (!unique.has(key)) unique.set(key, file);
  }
  return [...unique.values()];
}

function portfolioDataErrors(candidate) {
  return render.validatePortfolioData(candidate);
}

function visualAssetErrors(assets) {
  const errors = [];
  for (const asset of assets) {
    const content = typeof asset.content === 'string' ? asset.content : '';
    const prohibitedPartner = content.match(privatePartnerPattern)?.[0];
    if (prohibitedPartner) {
      errors.push(`${asset.relativePath}: contains a nonpublic partner or company-project name: ${prohibitedPartner}.`);
    }
  }
  return errors;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function localAnchorErrors(file, html, rootDir) {
  const errors = [];
  const pageDirectory = path.posix.dirname('/' + file.relativePath.replace(/\\/g, '/'));
  for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>/g)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|tel:|#)/.test(href)) continue;
    const localHref = href.split(/[?#]/, 1)[0];
    const resolved = path.posix.normalize(path.posix.join(pageDirectory, localHref));
    const isSharedAsset = resolved === '/assets' || resolved.startsWith('/assets/');
    if (file.locale === 'en' && !isSharedAsset && resolved !== '/en' && !resolved.startsWith('/en/')) {
      errors.push(`${file.relativePath}: English link leaves /en/: ${href}`);
    }
    if (file.locale === 'ko' && (resolved === '/en' || resolved.startsWith('/en/'))) {
      errors.push(`${file.relativePath}: Korean link enters /en/: ${href}`);
    }
    if (localHref.endsWith('index.html')) {
      const target = path.join(rootDir, resolved.replace(/^\//, '').replace(/\//g, path.sep));
      if (!fs.existsSync(target)) errors.push(`${file.relativePath}: missing local link target ${href}`);
    }
  }
  return errors;
}

function staticPageErrors(file, html, rootDir) {
  const errors = [];
  const koreanUrl = siteUrl + file.route;
  const englishUrl = siteUrl + 'en/' + file.route;
  const canonicalUrl = file.locale === 'en' ? englishUrl : koreanUrl;
  const expectedLang = file.locale;

  if (!new RegExp(`<html lang="${expectedLang}">`).test(html)) {
    errors.push(`${file.relativePath}: expected html lang ${expectedLang}.`);
  }
  if (!new RegExp(`data-lang="${expectedLang}"`).test(html)) {
    errors.push(`${file.relativePath}: expected data-lang ${expectedLang}.`);
  }
  if (!new RegExp(`data-route="${escapeRegExp(file.route)}"`).test(html)) {
    errors.push(`${file.relativePath}: semantic route does not match ${file.route}.`);
  }
  if (!new RegExp(`<link rel="canonical" href="${escapeRegExp(canonicalUrl)}"`).test(html)) {
    errors.push(`${file.relativePath}: canonical URL does not match locale route.`);
  }
  if (!new RegExp(`hreflang="ko" href="${escapeRegExp(koreanUrl)}"`).test(html) ||
      !new RegExp(`hreflang="en" href="${escapeRegExp(englishUrl)}"`).test(html) ||
      !new RegExp(`hreflang="x-default" href="${escapeRegExp(koreanUrl)}"`).test(html)) {
    errors.push(`${file.relativePath}: incomplete hreflang pair.`);
  }
  if (html.indexOf('site-i18n.js') === -1 || html.indexOf('site-i18n.js') > html.indexOf('nav.js')) {
    errors.push(`${file.relativePath}: site-i18n.js must load before nav.js.`);
  }
  if (html.includes('portfolio-render.js') && html.indexOf('site-i18n.js') > html.indexOf('portfolio-render.js')) {
    errors.push(`${file.relativePath}: site-i18n.js must load before portfolio-render.js.`);
  }
  return errors.concat(localAnchorErrors(file, html, rootDir));
}

function validatePortfolio(rootDir) {
  const errors = portfolioDataErrors(data).slice();

  for (const file of publicPortfolioFiles(rootDir)) {
    if (!fs.existsSync(file.absolutePath)) {
      errors.push(`${file.relativePath}: missing public page.`);
      continue;
    }
    const html = fs.readFileSync(file.absolutePath, 'utf8');
    if (contributionPattern.test(html)) {
      errors.push(`${file.relativePath}: contains a contribution percentage.`);
    }
    if (!file.allowsNamedEmployer && privatePartnerPattern.test(html)) {
      errors.push(`${file.relativePath}: contains a nonpublic partner or company-project name.`);
    }
    errors.push(...staticPageErrors(file, html, rootDir));
  }

  const visualAssets = [];
  for (const file of publicPortfolioVisualFiles(rootDir)) {
    if (!isPathInsideRoot(rootDir, file.absolutePath)) {
      errors.push(`${file.relativePath}: public evidence asset resolves outside repository root.`);
      continue;
    }
    if (!fs.existsSync(file.absolutePath)) {
      errors.push(`${file.relativePath}: missing public evidence SVG.`);
      continue;
    }
    visualAssets.push({
      ...file,
      content: fs.readFileSync(file.absolutePath, 'utf8')
    });
  }
  errors.push(...visualAssetErrors(visualAssets));

  return errors;
}

if (require.main === module) {
  const rootDir = path.join(__dirname, '..');
  const errors = validatePortfolio(rootDir);
  if (errors.length) {
    for (const error of errors) process.stderr.write(`- ${error}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`Portfolio validation passed: ${i18n.canonicalCaseSlugs.length} projects, ${data.capabilities.length} capabilities, ${publicPortfolioFiles(rootDir).length} localized pages.\n`);
  }
}

module.exports = {
  portfolioRoutes,
  publicPortfolioFiles,
  publicPortfolioVisualFiles,
  portfolioDataErrors,
  visualAssetErrors,
  validatePortfolio
};
