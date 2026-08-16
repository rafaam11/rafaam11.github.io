(function (root, factory) {
  var i18n = root.SiteI18n;
  if (typeof module === 'object' && module.exports) i18n = require('./site-i18n.js');
  var value = factory(i18n);
  if (typeof module === 'object' && module.exports) module.exports = value;
  root.PortfolioRender = value;
  if (root.document && root.PortfolioData) {
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', function () {
        value.mountAll(root.document, root.PortfolioData);
      });
    } else {
      value.mountAll(root.document, root.PortfolioData);
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (i18n) {
  var locales = ['ko', 'en'];
  var evidenceStates = ['verified', 'ongoing', 'expected', 'research', 'completed'];
  var visualKeys = [
    'nav-digitaltwin-pipeline',
    'hololens-ar-concept',
    'forklift-sim-to-real',
    'coordinate-signal',
    'decision-signal',
    'simulation-signal',
    'research-protocol'
  ];
  var policy = {
    prohibitedPartnerPattern: /Digitrack|삼성서울병원|Samsung Medical|\b(?:KERI|KAERI|ANL|SNU|ETRI)\b|HD현대|Hyundai|계명대|동산병원|울산대|이화여대|Genoray|제노레이|Megagen|메가젠|Hallym|한림|Argonne|서울대학교|서울대/i,
    contributionPercentagePattern: /(?:(?:contribution|ownership|owned|responsibility|role|기여(?:도)?|역할|담당)[\s\S]{0,80}\b\d{1,3}(?:\.\d+)?\s*%|\b\d{1,3}(?:\.\d+)?\s*%[\s\S]{0,80}(?:contribution|ownership|owned|responsibility|role|기여(?:도)?|역할|담당))/i
  };

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function translatedField(record, field, locale) {
    var normalized = i18n.normalizeLocale(locale);
    var translations = record && record.translations;
    var preferred = translations && translations[normalized];
    var fallback = translations && translations.en;
    if (preferred && typeof preferred[field] === 'string' && preferred[field]) return preferred[field];
    if (fallback && typeof fallback[field] === 'string' && fallback[field]) return fallback[field];
    return '';
  }

  function localizePortfolioData(data, locale) {
    var normalized = i18n.normalizeLocale(locale);
    if (!data || !Array.isArray(data.capabilities) || !Array.isArray(data.impactMetrics) || !Array.isArray(data.projects)) {
      return { capabilities: [], impactMetrics: [], projects: [] };
    }
    return {
      capabilities: data.capabilities.map(function (capability) {
        return {
          key: capability.key,
          title: translatedField(capability, 'title', normalized),
          summary: translatedField(capability, 'summary', normalized),
          cardSummary: translatedField(capability, 'cardSummary', normalized),
          methods: capability.methods,
          validation: translatedField(capability, 'validation', normalized),
          cardValidation: translatedField(capability, 'cardValidation', normalized)
        };
      }),
      impactMetrics: data.impactMetrics.map(function (metric) {
        return {
          value: translatedField(metric, 'value', normalized),
          label: translatedField(metric, 'label', normalized),
          state: metric.state
        };
      }),
      projects: data.projects.map(function (project) {
        return {
          slug: project.slug,
          title: translatedField(project, 'title', normalized),
          period: project.period,
          status: translatedField(project, 'status', normalized),
          evidenceState: project.evidenceState,
          visualKey: project.visualKey,
          primaryCapability: project.primaryCapability,
          crossCapabilities: project.crossCapabilities,
          problemSummary: translatedField(project, 'problemSummary', normalized),
          ownedRole: translatedField(project, 'ownedRole', normalized),
          verifiedEvidence: translatedField(project, 'verifiedEvidence', normalized),
          cardProblem: translatedField(project, 'cardProblem', normalized),
          cardOwnedRole: translatedField(project, 'cardOwnedRole', normalized),
          cardEvidence: translatedField(project, 'cardEvidence', normalized),
          visualAlt: translatedField(project, 'visualAlt', normalized),
          visualCaption: translatedField(project, 'visualCaption', normalized),
          tech: project.tech,
          links: (project.links || []).map(function (link) {
            return { href: link.href, label: translatedField(link, 'label', normalized) };
          })
        };
      })
    };
  }

  function translationErrors(record, fields, label) {
    var errors = [];
    locales.forEach(function (locale) {
      fields.forEach(function (field) {
        if (!record || !record.translations || !record.translations[locale] ||
            typeof record.translations[locale][field] !== 'string' || !record.translations[locale][field]) {
          errors.push(label + ': missing ' + locale + ' translation for ' + field + '.');
        }
      });
    });
    return errors;
  }

  function projectValidationErrors(project, capabilityKeys) {
    var errors = [];
    var slug = project && project.slug ? project.slug : 'unknown-project';
    var requiredStrings = ['slug', 'period', 'evidenceState', 'visualKey', 'primaryCapability'];
    if (!project || typeof project !== 'object') return [slug + ': project record must be an object.'];
    requiredStrings.forEach(function (field) {
      if (!project[field] || typeof project[field] !== 'string') errors.push(slug + ': missing required string ' + field + '.');
    });
    errors = errors.concat(translationErrors(project, [
      'title',
      'status',
      'problemSummary',
      'ownedRole',
      'verifiedEvidence',
      'cardProblem',
      'cardOwnedRole',
      'cardEvidence',
      'visualAlt',
      'visualCaption'
    ], slug));
    if (capabilityKeys.indexOf(project.primaryCapability) === -1) errors.push(slug + ': invalid primary capability.');
    if (evidenceStates.indexOf(project.evidenceState) === -1) errors.push(slug + ': invalid evidence state.');
    if (project.visualKey && visualKeys.indexOf(project.visualKey) === -1) errors.push(slug + ': invalid visual key.');
    if (!Array.isArray(project.crossCapabilities) || project.crossCapabilities.some(function (key) { return capabilityKeys.indexOf(key) === -1; })) {
      errors.push(slug + ': invalid cross capabilities.');
    }
    if (!Array.isArray(project.tech) || project.tech.length === 0) errors.push(slug + ': missing technology list.');
    (project.links || []).forEach(function (link, index) {
      if (!link.href || typeof link.href !== 'string') errors.push(slug + ': link ' + index + ' is missing href.');
      errors = errors.concat(translationErrors(link, ['label'], slug + ' link ' + index));
    });
    var serialized = JSON.stringify(project);
    if (policy.contributionPercentagePattern.test(serialized)) errors.push(slug + ': contains a contribution percentage.');
    if (policy.prohibitedPartnerPattern.test(serialized)) errors.push(slug + ': contains a nonpublic partner name.');
    return errors;
  }

  function validProjects(data, locale) {
    var localized = localizePortfolioData(data, locale);
    if (!localized.capabilities.length || !localized.projects.length) return [];
    var capabilityKeys = localized.capabilities.map(function (capability) { return capability.key; });
    return localized.projects.filter(function (project) {
      var strings = [
        'slug',
        'title',
        'period',
        'status',
        'evidenceState',
        'visualKey',
        'primaryCapability',
        'problemSummary',
        'ownedRole',
        'verifiedEvidence',
        'cardProblem',
        'cardOwnedRole',
        'cardEvidence',
        'visualAlt',
        'visualCaption'
      ];
      return strings.every(function (field) { return typeof project[field] === 'string' && project[field]; }) &&
        capabilityKeys.indexOf(project.primaryCapability) !== -1 &&
        evidenceStates.indexOf(project.evidenceState) !== -1 &&
        visualKeys.indexOf(project.visualKey) !== -1 &&
        Array.isArray(project.crossCapabilities) &&
        project.crossCapabilities.every(function (key) { return capabilityKeys.indexOf(key) !== -1; }) &&
        Array.isArray(project.tech) && project.tech.length > 0;
    });
  }

  function validatePortfolioData(data) {
    var errors = [];
    if (!data || !Array.isArray(data.capabilities) || data.capabilities.length !== 5) {
      errors.push('Portfolio data must contain exactly five capabilities.');
      return errors;
    }
    if (!Array.isArray(data.impactMetrics) || data.impactMetrics.length !== 3) {
      errors.push('Portfolio data must contain exactly three impact metrics.');
    }
    if (!Array.isArray(data.projects) || data.projects.length !== 13) {
      errors.push('Portfolio data must contain exactly thirteen projects.');
      return errors;
    }

    data.capabilities.forEach(function (capability) {
      errors = errors.concat(translationErrors(capability, ['title', 'summary', 'validation', 'cardSummary', 'cardValidation'], capability.key || 'unknown-capability'));
      if (!Array.isArray(capability.methods) || !capability.methods.length) errors.push((capability.key || 'unknown-capability') + ': missing methods.');
    });
    data.impactMetrics.forEach(function (metric, index) {
      errors = errors.concat(translationErrors(metric, ['value', 'label'], 'impact metric ' + index));
    });

    var capabilityKeys = data.capabilities.map(function (capability) { return capability.key; });
    var seenSlugs = {};
    data.projects.forEach(function (project) {
      errors = errors.concat(projectValidationErrors(project, capabilityKeys));
      if (project && seenSlugs[project.slug]) errors.push(project.slug + ': duplicate slug.');
      if (project) seenSlugs[project.slug] = true;
    });

    var serialized = JSON.stringify(data);
    if (policy.contributionPercentagePattern.test(serialized)) errors.push('Shared data contains contribution percentages.');
    if (policy.prohibitedPartnerPattern.test(serialized)) errors.push('Shared data contains a nonpublic partner name.');
    return errors;
  }

  function capabilityAtlasHtml(data, base, isFile, locale) {
    var normalized = i18n.normalizeLocale(locale);
    var copy = i18n.ui[normalized].portfolio;
    var localized = localizePortfolioData(data, normalized);
    var projects = validProjects(data, normalized);
    return localized.capabilities.map(function (capability, capabilityIndex) {
      var related = projects.filter(function (project) {
        return project.primaryCapability === capability.key || project.crossCapabilities.indexOf(capability.key) !== -1;
      });
      var links = related.slice(0, 4).map(function (project) {
        return '<a href="' + escapeHtml(i18n.routeHref(base, normalized, 'projects/' + project.slug + '/', isFile)) + '">' + escapeHtml(project.title) + '</a>';
      }).join('');
      var methods = capability.methods.map(function (method) {
        return '<span>' + escapeHtml(method) + '</span>';
      }).join('');
      return '<article class="capability-card capability-card--' + escapeHtml(capability.key) + '">' +
        '<span class="capability-number">0' + (capabilityIndex + 1) + '</span>' +
        '<div class="capability-label">' + escapeHtml(copy.capability) + '</div>' +
        '<h3>' + escapeHtml(capability.title) + '</h3>' +
        '<p>' + escapeHtml(capability.cardSummary) + '</p>' +
        '<div class="capability-methods" aria-label="' + escapeHtml(copy.methods) + '">' + methods + '</div>' +
        '<p class="capability-validation"><strong>' + escapeHtml(copy.howIValidate) + '</strong> ' + escapeHtml(capability.cardValidation) + '</p>' +
        '<div class="capability-links" aria-label="' + escapeHtml(copy.relatedProjects) + '">' + links + '</div>' +
        '<span class="capability-meta">' + escapeHtml(copy.relatedProjectCount(related.length)) + '</span>' +
      '</article>';
    }).join('');
  }

  function projectChaptersHtml(data, base, isFile, locale) {
    var normalized = i18n.normalizeLocale(locale);
    var copy = i18n.ui[normalized].portfolio;
    var localized = localizePortfolioData(data, normalized);
    var valid = validProjects(data, normalized);
    return localized.capabilities.map(function (capability, capabilityIndex) {
      var projects = valid.filter(function (project) { return project.primaryCapability === capability.key; });
      var cards = projects.map(function (project) {
        var crossLabels = project.crossCapabilities.map(function (key) {
          var match = localized.capabilities.find(function (capabilityItem) { return capabilityItem.key === key; });
          return match ? match.title : key;
        });
        var tags = [capability.title].concat(crossLabels).map(function (label) {
          return '<span>' + escapeHtml(label) + '</span>';
        }).join('');
        var visualSrc = String(base || '') + 'assets/diagrams/' + project.visualKey + (normalized === 'en' ? '-en' : '') + '.svg';
        return '<article class="project-card ss-project-card">' +
          '<div class="project-topline ss-project-card__meta"><span class="status-pill status-pill--' + escapeHtml(project.evidenceState) + ' ss-status ss-status--' + escapeHtml(project.evidenceState) + '" data-state="' + escapeHtml(project.evidenceState) + '">' + escapeHtml(copy.evidenceStates[project.evidenceState]) + '</span><span class="project-period ss-project-card__period">' + escapeHtml(project.period) + '</span></div>' +
          '<figure class="ss-project-card__figure"><img class="ss-project-card__image" src="' + escapeHtml(visualSrc) + '" alt="' + escapeHtml(project.visualAlt) + '" width="1180" height="664" loading="lazy" decoding="async"><figcaption class="ss-project-card__caption">' + escapeHtml(project.visualCaption) + '</figcaption></figure>' +
          '<div class="ss-project-card__body"><h3 class="ss-project-card__title"><a href="' + escapeHtml(i18n.routeHref(base, normalized, 'projects/' + project.slug + '/', isFile)) + '">' + escapeHtml(project.title) + '</a></h3>' +
          '<div class="project-facts ss-project-card__facts"><p class="project-problem ss-project-card__fact"><strong>' + escapeHtml(copy.problem) + '</strong> ' + escapeHtml(project.cardProblem) + '</p>' +
          '<p class="project-owned project-role ss-project-card__fact"><strong>' + escapeHtml(copy.owned) + '</strong> ' + escapeHtml(project.cardOwnedRole) + '</p>' +
          '<p class="project-evidence ss-project-card__fact"><strong>' + escapeHtml(copy.evidence) + '</strong> ' + escapeHtml(project.cardEvidence) + '</p></div>' +
          '<div class="project-tags">' + tags + '</div>' +
          '</div>' +
        '</article>';
      }).join('');
      return '<section class="project-chapter ss-project-chapter" id="capability-' + escapeHtml(capability.key) + '">' +
        '<div class="ss-project-chapter__rail"><header class="chapter-heading ss-project-chapter__header"><div><span class="ss-project-chapter__index">0' + (capabilityIndex + 1) + '</span><span class="ss-project-chapter__eyebrow">' + escapeHtml(copy.capabilityChapter) + '</span><h2>' + escapeHtml(capability.title) + '</h2></div><span class="chapter-count ss-project-chapter__count">' + escapeHtml(copy.projectCount(projects.length)) + '</span></header>' +
        '<p class="chapter-summary ss-project-chapter__summary">' + escapeHtml(capability.summary) + '</p></div>' +
        '<div class="project-grid ss-project-grid">' + cards + '</div>' +
      '</section>';
    }).join('');
  }

  function capabilityDetailsHtml(data, base, isFile, locale) {
    var normalized = i18n.normalizeLocale(locale);
    var copy = i18n.ui[normalized].portfolio;
    var localized = localizePortfolioData(data, normalized);
    var projects = validProjects(data, normalized);
    return localized.capabilities.map(function (capability, index) {
      var related = projects.filter(function (project) {
        return project.primaryCapability === capability.key || project.crossCapabilities.indexOf(capability.key) !== -1;
      });
      var methods = capability.methods.map(function (method) { return '<span>' + escapeHtml(method) + '</span>'; }).join('');
      var links = related.map(function (project) {
        return '<span class="ss-capability-panel__evidence-link"><a href="' + escapeHtml(i18n.routeHref(base, normalized, 'projects/' + project.slug + '/', isFile)) + '">' + escapeHtml(project.title) + '</a></span>';
      }).join('');
      return '<section class="capability-detail" id="' + escapeHtml(capability.key) + '"><div class="ss-capability-panel">' +
        '<div class="capability-detail-heading ss-capability-panel__header"><span class="capability-index ss-capability-panel__index">0' + (index + 1) + '</span><div><p class="ss-capability-panel__eyebrow">' + escapeHtml(copy.transferableCapability) + '</p><h2>' + escapeHtml(capability.title) + '</h2></div></div>' +
        '<div class="capability-detail-grid ss-capability-panel__matrix"><div class="ss-capability-panel__item"><h3>' + escapeHtml(copy.whatISolve) + '</h3><p>' + escapeHtml(capability.summary) + '</p></div>' +
        '<div class="ss-capability-panel__item"><h3>' + escapeHtml(copy.howIValidate) + '</h3><p>' + escapeHtml(capability.validation) + '</p></div></div>' +
        '<div class="capability-methods capability-detail-methods ss-capability-panel__methods" aria-label="' + escapeHtml(copy.methods) + '">' + methods + '</div>' +
        '<p class="evidence-links ss-capability-panel__evidence"><strong>' + escapeHtml(copy.evidence) + ':</strong> ' + links + '</p></div></section>';
    }).join('');
  }

  function mountAll(doc, data) {
    var errors = validatePortfolioData(data);
    var base = doc.body && doc.body.getAttribute ? (doc.body.getAttribute('data-base') || '') : '';
    var locale = i18n.normalizeLocale(doc.body && doc.body.getAttribute ? doc.body.getAttribute('data-lang') : 'ko');
    var isFile = Boolean(doc.location && doc.location.protocol === 'file:');
    var atlasNodes = doc.querySelectorAll('[data-portfolio="capability-atlas"]');
    var chapterNodes = doc.querySelectorAll('[data-portfolio="project-chapters"]');
    var detailNodes = doc.querySelectorAll('[data-portfolio="capability-details"]');

    var fatal = !data || !Array.isArray(data.capabilities) || data.capabilities.length !== 5 || !Array.isArray(data.projects);
    if (fatal || validProjects(data, locale).length === 0) {
      var errorHtml = '<p class="portfolio-error">' + escapeHtml(i18n.ui[locale].portfolio.renderError) + ' ' + escapeHtml(errors.join(' ')) + '</p>';
      Array.prototype.forEach.call(atlasNodes, function (node) { node.innerHTML = errorHtml; });
      Array.prototype.forEach.call(chapterNodes, function (node) { node.innerHTML = errorHtml; });
      Array.prototype.forEach.call(detailNodes, function (node) { node.innerHTML = errorHtml; });
      if (typeof console !== 'undefined' && console.error) console.error(errors.join('\n'));
      return;
    }

    if (errors.length && typeof console !== 'undefined' && console.warn) console.warn(errors.join('\n'));

    Array.prototype.forEach.call(atlasNodes, function (node) {
      node.innerHTML = capabilityAtlasHtml(data, base, isFile, locale);
    });
    Array.prototype.forEach.call(chapterNodes, function (node) {
      node.innerHTML = projectChaptersHtml(data, base, isFile, locale);
    });
    Array.prototype.forEach.call(detailNodes, function (node) {
      node.innerHTML = capabilityDetailsHtml(data, base, isFile, locale);
    });
  }

  return {
    policy: policy,
    localizePortfolioData: localizePortfolioData,
    validatePortfolioData: validatePortfolioData,
    capabilityAtlasHtml: capabilityAtlasHtml,
    projectChaptersHtml: projectChaptersHtml,
    capabilityDetailsHtml: capabilityDetailsHtml,
    mountAll: mountAll
  };
});
