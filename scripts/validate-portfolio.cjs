const fs = require('node:fs');
const path = require('node:path');

const data = require('../js/portfolio-data.js');
const render = require('../js/portfolio-render.js');
const i18n = require('../js/site-i18n.js');

const contributionPattern = render.policy.contributionPercentagePattern;
const privatePartnerPattern = render.policy.prohibitedPartnerPattern;
const siteUrl = 'https://rafaam11.github.io/';
const locales = ['ko', 'en'];
const capabilityKeys = ['registration', 'sensor-fusion', 'medical-navigation', 'xr-engineering', 'ai-product-engineering'];
const tierKeys = ['medical-core', 'industrial-spotlight', 'ai-build-lab'];
const projectSlugs = ['surgical-navigation', 'mandibular-fracture', 'life-careverse', 'rtms-navigation', 'unmanned-forklift', 'ai-build-lab'];
const evidenceStates = ['verified', 'ongoing', 'prototype'];
const blockTypes = ['text', 'list', 'system', 'evidence', 'limitation'];
const projectTranslationFields = [
  'title', 'shortTitle', 'eyebrow', 'thesis', 'summary', 'problem', 'role', 'teamResult',
  'evidence', 'limitation', 'collaboration', 'mediaAlt', 'mediaCaption'
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

function publicPortfolioVisualFiles(rootDir) {
  const mediaItems = data.projects.flatMap((project) => {
    const media = project.media || {};
    return [media.lead, media.video, media.poster].concat(media.references || []).filter(Boolean);
  });
  return mediaItems
    .filter((item) => item.status === 'approved' && typeof item.publicPath === 'string' && !/^[a-z][a-z0-9+.-]*:/i.test(item.publicPath))
    .map((item) => ({
      relativePath: path.normalize(item.publicPath),
      absolutePath: path.join(rootDir, item.publicPath),
      evidenceId: item.id
    }));
}

function translationErrors(record, fields, label) {
  const errors = [];
  for (const locale of locales) {
    for (const field of fields) {
      if (!record || !record.translations || !record.translations[locale] ||
          typeof record.translations[locale][field] !== 'string' || !record.translations[locale][field].trim()) {
        errors.push(`${label}: missing ${locale} translation for ${field}.`);
      }
    }
  }
  return errors;
}

function mediaItemErrors(item, label) {
  const errors = [];
  if (!item || typeof item !== 'object') return [`${label}: media item must be an object.`];
  if (typeof item.id !== 'string' || !item.id) errors.push(`${label}: media item requires a stable id.`);
  if (typeof item.type !== 'string' || !item.type) errors.push(`${label}: media item requires a type.`);
  if (!['approved', 'pending-approval'].includes(item.status)) errors.push(`${label}: unknown media status.`);
  const hasPublicPath = typeof item.publicPath === 'string' && item.publicPath.length > 0;
  if (item.status === 'pending-approval' && hasPublicPath) errors.push(`${label}: pending-approval media must not declare a public path.`);
  if (item.status === 'approved' && !hasPublicPath) errors.push(`${label}: approved media requires a public path.`);
  return errors;
}

function blockErrors(block, projectSlug) {
  const label = `${projectSlug}/${block && block.key ? block.key : 'unknown-block'}`;
  const errors = [];
  if (!block || typeof block !== 'object') return [`${label}: block must be an object.`];
  if (typeof block.key !== 'string' || !block.key) errors.push(`${label}: block requires a stable key.`);
  if (!blockTypes.includes(block.type)) errors.push(`${label}: unsupported block type.`);
  for (const locale of locales) {
    const copy = block.translations && block.translations[locale];
    if (!copy || typeof copy.heading !== 'string' || !copy.heading.trim()) {
      errors.push(`${label}: missing ${locale} block heading.`);
      continue;
    }
    if (block.type === 'list') {
      if (!Array.isArray(copy.items) || copy.items.length === 0 || copy.items.some((item) => typeof item !== 'string' || !item.trim())) {
        errors.push(`${label}: missing ${locale} block list copy.`);
      }
    } else if (typeof copy.body !== 'string' || !copy.body.trim()) {
      errors.push(`${label}: missing ${locale} block body.`);
    }
  }
  return errors;
}

function portfolioDataErrors(candidate) {
  const errors = [];
  if (!candidate || typeof candidate !== 'object') return ['Portfolio data must be an object.'];

  if (!Array.isArray(candidate.capabilities) || candidate.capabilities.length !== capabilityKeys.length) {
    errors.push('Portfolio data must contain exactly five capabilities.');
  } else {
    const actualKeys = candidate.capabilities.map((capability) => capability && capability.key);
    if (JSON.stringify(actualKeys) !== JSON.stringify(capabilityKeys)) errors.push('Portfolio capabilities must use the known ordered keys.');
    for (const capability of candidate.capabilities) {
      const label = capability && capability.key ? capability.key : 'unknown-capability';
      errors.push(...translationErrors(capability, ['title', 'summary', 'validation', 'cardSummary', 'cardValidation'], label));
      if (!Array.isArray(capability && capability.methods) || capability.methods.length === 0 || capability.methods.some((method) => typeof method !== 'string' || !method)) {
        errors.push(`${label}: missing implementation-derived methods.`);
      }
    }
  }

  if (!Array.isArray(candidate.tiers) || candidate.tiers.length !== tierKeys.length) {
    errors.push('Portfolio data must contain exactly three tiers.');
  } else {
    const actualKeys = candidate.tiers.map((tier) => tier && tier.key);
    if (JSON.stringify(actualKeys) !== JSON.stringify(tierKeys)) errors.push('Portfolio tiers must use the known ordered keys.');
    for (const tier of candidate.tiers) errors.push(...translationErrors(tier, ['label'], tier && tier.key ? tier.key : 'unknown-tier'));
  }

  if (!Array.isArray(candidate.projects) || candidate.projects.length !== projectSlugs.length) {
    errors.push('Portfolio data must contain exactly six projects.');
  } else {
    const actualSlugs = candidate.projects.map((project) => project && project.slug);
    if (JSON.stringify(actualSlugs) !== JSON.stringify(projectSlugs)) errors.push('Portfolio projects must use the known ordered slugs.');
    const seenSlugs = new Set();
    for (const project of candidate.projects) {
      const slug = project && project.slug ? project.slug : 'unknown-project';
      if (!project || typeof project !== 'object') {
        errors.push(`${slug}: project record must be an object.`);
        continue;
      }
      if (seenSlugs.has(slug)) errors.push(`${slug}: duplicate slug.`);
      seenSlugs.add(slug);
      for (const field of ['slug', 'tier', 'period', 'evidenceState', 'route']) {
        if (typeof project[field] !== 'string' || !project[field]) errors.push(`${slug}: missing required string ${field}.`);
      }
      if (!tierKeys.includes(project.tier)) errors.push(`${slug}: unknown tier.`);
      if (!evidenceStates.includes(project.evidenceState)) errors.push(`${slug}: unknown evidence state.`);
      if (project.route !== `projects/${slug}/`) errors.push(`${slug}: invalid project route.`);
      if (!Array.isArray(project.capabilityKeys) || project.capabilityKeys.length === 0) {
        errors.push(`${slug}: missing capability mappings.`);
      } else if (project.capabilityKeys.some((key) => !capabilityKeys.includes(key))) {
        errors.push(`${slug}: unknown capability mapping.`);
      }
      errors.push(...translationErrors(project, projectTranslationFields, slug));
      for (const locale of locales) {
        const copy = project.translations && project.translations[locale];
        if (copy && copy.role === copy.teamResult) errors.push(`${slug}: ${locale} role and team result must remain separate.`);
      }
      if (!project.pdf || typeof project.pdf !== 'object') {
        errors.push(`${slug}: missing PDF paths.`);
      } else {
        for (const locale of locales) {
          const expectedPath = `assets/pdfs/${slug}-${locale}.pdf`;
          if (project.pdf[locale] !== expectedPath) errors.push(`${slug}: invalid ${locale} PDF path.`);
        }
      }
      if (!project.media || !project.media.lead) {
        errors.push(`${slug}: missing lead media declaration.`);
      } else {
        errors.push(...mediaItemErrors(project.media.lead, `${slug} lead`));
        for (const key of ['video', 'poster']) {
          if (project.media[key]) errors.push(...mediaItemErrors(project.media[key], `${slug} ${key}`));
        }
        for (const [index, item] of (project.media.references || []).entries()) {
          errors.push(...mediaItemErrors(item, `${slug} reference ${index}`));
        }
      }
      if (!Array.isArray(project.blocks) || project.blocks.length === 0) {
        errors.push(`${slug}: missing structural blocks.`);
      } else {
        for (const block of project.blocks) errors.push(...blockErrors(block, slug));
      }
    }
  }

  const serialized = JSON.stringify(candidate);
  if (contributionPattern.test(serialized)) errors.push('Shared data contains a contribution percentage.');
  if (privatePartnerPattern.test(serialized)) errors.push('Shared data contains a nonpublic partner name.');
  return errors;
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
    if (file.locale === 'en' && resolved !== '/en' && !resolved.startsWith('/en/')) {
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
