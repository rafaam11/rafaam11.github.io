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
  var evidenceStates = ['verified', 'ongoing', 'prototype'];
  var policy = {
    prohibitedPartnerPattern: /Digitrack|삼성서울병원|Samsung Medical|\b(?:KERI|KAERI|ANL|SNU|ETRI)\b|HD현대|Hyundai|계명대|동산병원|울산대|이화여대|Genoray|제노레이|Megagen|메가젠|Hallym|한림|Argonne|서울대학교|서울대/i,
    contributionPercentagePattern: /(?:(?:contribution|ownership|owned|responsibility|role|기여(?:도)?|역할|담당)[\s\S]{0,80}\b\d{1,3}(?:\.\d+)?\s*%|\b\d{1,3}(?:\.\d+)?\s*%[\s\S]{0,80}(?:contribution|ownership|owned|responsibility|role|기여(?:도)?|역할|담당))/i
  };

  var pageCopy = {
    ko: {
      mediaApproved: '공개 근거',
      mediaPending: '공개 승인 대기',
      fallback: '실제 근거 미디어는 승인 후 공개합니다.',
      personalRole: '개인 역할',
      teamResult: '팀 결과',
      period: '기간',
      technology: '기술 스택',
      evidence: '근거',
      evidenceLimits: '근거와 한계',
      deeperDocument: '더 깊은 사례 문서',
      pdfDescription: '구조, 결정, 검증 근거를 더 자세히 보려면 사례 PDF를 확인하세요.',
      openPdf: '사례 PDF 열기',
      collaboration: '공동개발',
      contact: '문제와 검증 범위를 함께 정의하기',
      medicalSummary: '정합, 추적, 의료영상, XR을 실제 워크플로에 연결한 네 가지 핵심 사례입니다.',
      industrialSummary: '다중 센서 좌표를 위치추정과 안전 판단, 차량 시스템까지 연결합니다.',
      aiSummary: '직접 겪은 문제를 요구사항, 테스트, 릴리스, 운영되는 도구로 전환합니다.',
      mediaType: { video: 'VIDEO', image: 'IMAGE', repository: 'REPOSITORY' }
    },
    en: {
      mediaApproved: 'Public evidence',
      mediaPending: 'Pending approval',
      fallback: 'Actual evidence media will be published only after approval.',
      personalRole: 'Personal role',
      teamResult: 'Team result',
      period: 'Period',
      technology: 'Technology stack',
      evidence: 'Evidence',
      evidenceLimits: 'Evidence & Limits',
      deeperDocument: 'Deeper case document',
      pdfDescription: 'Open the case-study PDF for the fuller structure, decisions, and validation evidence.',
      openPdf: 'Open case-study PDF',
      collaboration: 'Joint development',
      contact: 'Define the problem and validation scope together',
      medicalSummary: 'Four core cases connect registration, tracking, medical imaging, and XR to working workflows.',
      industrialSummary: 'Multi-sensor coordinates connect to localization, safety decisions, and the vehicle system.',
      aiSummary: 'Personally experienced problems become required, tested, released, and operated tools.',
      mediaType: { video: 'VIDEO', image: 'IMAGE', repository: 'REPOSITORY' }
    }
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function localeOf(locale) {
    return i18n.normalizeLocale(locale);
  }

  function translation(record, locale) {
    var normalized = localeOf(locale);
    if (!record || !record.translations) return {};
    return record.translations[normalized] || record.translations.en || {};
  }

  function translatedField(record, field, locale) {
    var copy = translation(record, locale);
    return typeof copy[field] === 'string' ? copy[field] : '';
  }

  function assetHref(base, publicPath) {
    var value = String(publicPath || '');
    if (/^https?:\/\//i.test(value)) return value;
    return String(base || '') + value;
  }

  function localizePortfolioData(data, locale) {
    var normalized = localeOf(locale);
    var source = data && typeof data === 'object' ? data : {};
    return {
      capabilities: (source.capabilities || []).map(function (capability) {
        var copy = translation(capability, normalized);
        return {
          key: capability.key,
          title: copy.title || '',
          summary: copy.summary || '',
          validation: copy.validation || '',
          methods: Array.isArray(capability.methods) ? capability.methods.slice() : []
        };
      }),
      tiers: (source.tiers || []).map(function (tier) {
        return { key: tier.key, label: translatedField(tier, 'label', normalized) };
      }),
      projects: (source.projects || []).map(function (project) {
        var copy = translation(project, normalized);
        return {
          slug: project.slug,
          tier: project.tier,
          period: project.period,
          evidenceState: project.evidenceState,
          route: project.route,
          capabilityKeys: Array.isArray(project.capabilityKeys) ? project.capabilityKeys.slice() : [],
          tech: Array.isArray(project.tech) ? project.tech.slice() : [],
          media: project.media || {},
          pdf: project.pdf || {},
          blocks: Array.isArray(project.blocks) ? project.blocks.slice() : [],
          subcases: Array.isArray(project.subcases) ? project.subcases.slice() : [],
          links: Array.isArray(project.links) ? project.links.slice() : [],
          title: copy.title || '',
          shortTitle: copy.shortTitle || copy.title || '',
          eyebrow: copy.eyebrow || '',
          thesis: copy.thesis || '',
          summary: copy.summary || '',
          problem: copy.problem || '',
          role: copy.role || '',
          teamResult: copy.teamResult || '',
          evidence: copy.evidence || '',
          limitation: copy.limitation || '',
          collaboration: copy.collaboration || '',
          mediaAlt: copy.mediaAlt || '',
          mediaCaption: copy.mediaCaption || '',
          status: copy.status || ''
        };
      })
    };
  }

  function validatePortfolioData(data) {
    var errors = [];
    if (!data || typeof data !== 'object') return ['Portfolio data must be an object.'];
    if (!Array.isArray(data.capabilities) || data.capabilities.length !== 5) errors.push('Portfolio data must contain exactly five capabilities.');
    if (!Array.isArray(data.tiers) || data.tiers.length !== 3) errors.push('Portfolio data must contain exactly three tiers.');
    if (!Array.isArray(data.projects) || data.projects.length !== 6) return errors.concat('Portfolio data must contain exactly six projects.');
    data.projects.forEach(function (project) {
      if (!project || !project.slug || !project.translations) {
        errors.push('Portfolio project is incomplete.');
        return;
      }
      if (!evidenceStates.includes(project.evidenceState)) errors.push(project.slug + ': invalid evidence state.');
      ['ko', 'en'].forEach(function (locale) {
        var copy = translation(project, locale);
        ['title', 'summary', 'role', 'teamResult', 'evidence', 'limitation'].forEach(function (field) {
          if (!copy[field]) errors.push(project.slug + ': missing ' + locale + ' translation for ' + field + '.');
        });
      });
    });
    var serialized = JSON.stringify(data);
    if (policy.contributionPercentagePattern.test(serialized)) errors.push('Shared data contains a contribution percentage.');
    if (policy.prohibitedPartnerPattern.test(serialized)) errors.push('Shared data contains a nonpublic partner name.');
    return errors;
  }

  function validProjects(data, locale) {
    return localizePortfolioData(data, locale).projects.filter(function (project) {
      return project.slug && project.title && project.summary && project.role && project.teamResult &&
        project.evidence && project.limitation && evidenceStates.includes(project.evidenceState);
    });
  }

  function stateLabel(state, locale) {
    var normalized = localeOf(locale);
    return (i18n.ui[normalized].portfolio.evidenceStates || {})[state] || state;
  }

  function mediaLedgerHtml(project, locale, displayStatus) {
    var normalized = localeOf(locale);
    var copy = pageCopy[normalized];
    var media = project.media && project.media.lead ? project.media.lead : {};
    var effectiveStatus = displayStatus || media.status;
    var mediaStatus = effectiveStatus === 'approved' ? copy.mediaApproved : copy.mediaPending;
    var modality = copy.mediaType[media.type] || String(media.type || 'EVIDENCE').toUpperCase();
    return '<div class="td-media-ledger">' +
      '<span>' + escapeHtml(stateLabel(project.evidenceState, normalized)) + '</span>' +
      '<span>' + escapeHtml(mediaStatus) + '</span>' +
      '<span>' + escapeHtml(modality) + '</span>' +
      '<span>' + escapeHtml(project.shortTitle || project.title || project.slug) + '</span>' +
    '</div>';
  }

  function evidenceMediaHtml(projectRecord, locale, base, isFile) {
    void isFile;
    var normalized = localeOf(locale);
    var copy = pageCopy[normalized];
    var sourceCopy = translation(projectRecord, normalized);
    var project = Object.assign({}, projectRecord, {
      title: sourceCopy.title || projectRecord.title || '',
      shortTitle: sourceCopy.shortTitle || sourceCopy.title || projectRecord.shortTitle || '',
      mediaAlt: sourceCopy.mediaAlt || projectRecord.mediaAlt || '',
      mediaCaption: sourceCopy.mediaCaption || projectRecord.mediaCaption || ''
    });
    var media = project.media && project.media.lead ? project.media.lead : {};
    var approvedPoster = media.type === 'video' && project.media && project.media.poster &&
      project.media.poster.status === 'approved' && project.media.poster.publicPath;
    var renderable = media.status === 'approved' && media.publicPath && (media.type !== 'video' || approvedPoster);
    var visual = '';
    if (!renderable) {
      visual = '<div class="td-evidence-placeholder" role="img" aria-label="' + escapeHtml(project.mediaAlt) + '">' +
        '<span class="td-evidence-placeholder__coordinate">X/Y/Z · ' + escapeHtml((media.type || 'evidence').toUpperCase()) + '</span>' +
        '<strong>' + escapeHtml(copy.mediaPending) + '</strong>' +
        '<p>' + escapeHtml(copy.fallback) + '</p>' +
      '</div>';
    } else if (media.type === 'video') {
      var poster = assetHref(base, approvedPoster);
      visual = '<video controls preload="none" tabindex="0" poster="' + escapeHtml(poster) + '"' +
        ' aria-label="' + escapeHtml(project.mediaAlt) + '"><source src="' + escapeHtml(assetHref(base, media.publicPath)) + '"></video>';
    } else if (media.type === 'image') {
      visual = '<img src="' + escapeHtml(assetHref(base, media.publicPath)) + '" alt="' + escapeHtml(project.mediaAlt) + '" loading="lazy" decoding="async">';
    } else {
      visual = '<a class="td-evidence-repository" href="' + escapeHtml(assetHref(base, media.publicPath)) + '" target="_blank" rel="noopener">' +
        '<span aria-hidden="true">&lt;/&gt;</span><strong>' + escapeHtml(project.shortTitle || project.title) + '</strong>' +
      '</a>';
    }
    var displayStatus = renderable ? 'approved' : 'pending-approval';
    return '<figure class="td-evidence-frame" data-media-status="' + displayStatus + '">' +
      '<div class="td-evidence-frame__visual">' + visual + '</div>' +
      mediaLedgerHtml(project, normalized, displayStatus) +
      '<p class="td-evidence-frame__caption">' + escapeHtml(project.mediaCaption) + '</p>' +
    '</figure>';
  }

  function compactLeadHtml(project, locale) {
    var normalized = localeOf(locale);
    var media = project.media && project.media.lead ? project.media.lead : {};
    var copy = pageCopy[normalized];
    var label = media.status === 'approved' && media.type === 'repository' ? copy.mediaApproved : copy.fallback;
    return '<figure class="td-home-project__visual" data-media-status="' + escapeHtml(media.status || 'pending-approval') + '">' +
      '<div class="td-home-project__fallback" role="img" aria-label="' + escapeHtml(project.mediaAlt) + '">' +
        '<span aria-hidden="true">' + escapeHtml((media.type || 'evidence').toUpperCase()) + ' / ' + escapeHtml(project.slug) + '</span>' +
        '<strong>' + escapeHtml(label) + '</strong>' +
      '</div>' +
      mediaLedgerHtml(project, normalized) +
    '</figure>';
  }

  function homeProjectGalleryHtml(data, base, isFile, locale) {
    var normalized = localeOf(locale);
    return validProjects(data, normalized).map(function (project) {
      var href = i18n.routeHref(base, normalized, project.route, Boolean(isFile));
      return '<article class="td-home-project"><a href="' + escapeHtml(href) + '">' +
        compactLeadHtml(project, normalized) +
        '<h3>' + escapeHtml(project.title) + '</h3>' +
      '</a></article>';
    }).join('');
  }

  function homeEvidenceMosaicHtml(data, locale) {
    var normalized = localeOf(locale);
    var projects = validProjects(data, normalized);
    var definitions = normalized === 'en'
      ? [
          { label: 'Registration', slug: 'mandibular-fracture' },
          { label: 'Surgical navigation', slug: 'surgical-navigation' },
          { label: 'Sensor fusion', slug: 'unmanned-forklift' }
        ]
      : [
          { label: '3D 정합', slug: 'mandibular-fracture' },
          { label: '수술내비게이션', slug: 'surgical-navigation' },
          { label: '센서 융합', slug: 'unmanned-forklift' }
        ];
    return definitions.map(function (definition) {
      var project = projects.find(function (item) { return item.slug === definition.slug; });
      if (!project) return '';
      var media = project.media && project.media.lead ? project.media.lead : {};
      return '<article class="td-mosaic-cell">' +
        '<p class="td-mosaic-cell__label">' + escapeHtml(definition.label) + '</p>' +
        '<div class="td-mosaic-cell__field" role="img" aria-label="' + escapeHtml(project.mediaAlt) + '">' +
          '<span>FRAME / ' + escapeHtml((media.type || 'evidence').toUpperCase()) + '</span>' +
          '<strong>' + escapeHtml(project.shortTitle) + '</strong>' +
          '<i aria-hidden="true"></i>' +
        '</div>' +
        mediaLedgerHtml(project, normalized) +
      '</article>';
    }).join('');
  }

  function capabilityIndexHtml(data, locale) {
    var localized = localizePortfolioData(data, locale);
    return localized.capabilities.map(function (capability, index) {
      return '<article class="td-capability-row">' +
        '<span class="td-capability-row__index">0' + (index + 1) + '</span>' +
        '<h3>' + escapeHtml(capability.title) + '</h3>' +
        '<p>' + capability.methods.map(escapeHtml).join(' · ') + '</p>' +
      '</article>';
    }).join('');
  }

  function projectCardHtml(project, base, isFile, locale, feature) {
    var normalized = localeOf(locale);
    var copy = pageCopy[normalized];
    var href = i18n.routeHref(base, normalized, project.route, Boolean(isFile));
    var className = feature ? 'td-project-row td-project-row--feature' : 'td-project-card';
    return '<article class="' + className + '">' +
      evidenceMediaHtml(project, normalized, base, isFile) +
      '<div class="td-project-entry__body">' +
        '<div class="td-project-entry__meta"><span class="td-status" data-state="' + escapeHtml(project.evidenceState) + '">' + escapeHtml(stateLabel(project.evidenceState, normalized)) + '</span><span>' + escapeHtml(project.period) + '</span></div>' +
        '<h3><a href="' + escapeHtml(href) + '">' + escapeHtml(project.title) + '</a></h3>' +
        '<p class="td-project-entry__summary">' + escapeHtml(project.summary) + '</p>' +
        '<dl class="td-project-entry__attribution"><div><dt>' + escapeHtml(copy.personalRole) + '</dt><dd>' + escapeHtml(project.role) + '</dd></div>' +
        '<div><dt>' + escapeHtml(copy.teamResult) + '</dt><dd>' + escapeHtml(project.teamResult) + '</dd></div></dl>' +
      '</div>' +
    '</article>';
  }

  function projectGroupsHtml(data, base, isFile, locale) {
    var normalized = localeOf(locale);
    var localized = localizePortfolioData(data, normalized);
    var projects = validProjects(data, normalized);
    var summaryByTier = {
      'medical-core': pageCopy[normalized].medicalSummary,
      'industrial-spotlight': pageCopy[normalized].industrialSummary,
      'ai-build-lab': pageCopy[normalized].aiSummary
    };
    return localized.tiers.map(function (tier) {
      var tierProjects = projects.filter(function (project) { return project.tier === tier.key; });
      var feature = tier.key !== 'medical-core';
      return '<section class="td-project-tier' + (feature ? ' td-project-tier--feature' : '') + '" data-tier="' + escapeHtml(tier.key) + '">' +
        '<header class="td-project-tier__header"><p>' + escapeHtml(tier.label) + '</p><h2>' + escapeHtml(tier.label) + '</h2><span>' + escapeHtml(summaryByTier[tier.key]) + '</span></header>' +
        '<div class="td-project-tier__entries">' + tierProjects.map(function (project) {
          return projectCardHtml(project, base, isFile, normalized, feature);
        }).join('') + '</div>' +
      '</section>';
    }).join('');
  }

  function blockHtml(block, locale) {
    var copy = translation(block, locale);
    var heading = escapeHtml(copy.heading || '');
    if (block.type === 'list') {
      return '<section class="td-case-block td-case-block--list" data-block-type="list"><h2>' + heading + '</h2><ul>' +
        (copy.items || []).map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('') +
      '</ul></section>';
    }
    var tag = block.type === 'limitation' ? 'aside' : 'section';
    return '<' + tag + ' class="td-case-block td-case-block--' + escapeHtml(block.type) + '" data-block-type="' + escapeHtml(block.type) + '">' +
      '<h2>' + heading + '</h2><p>' + escapeHtml(copy.body || '') + '</p></' + tag + '>';
  }

  function subcasesHtml(project, locale) {
    if (!project.subcases || !project.subcases.length) return '';
    return '<section class="td-case-subcases" aria-label="AI Build Lab"><div>' + project.subcases.map(function (subcase) {
      var copy = translation(subcase, locale);
      return '<article><h2>' + escapeHtml(copy.title || '') + '</h2><p>' + escapeHtml(copy.summary || '') + '</p></article>';
    }).join('') + '</div></section>';
  }

  function projectLinksHtml(project, locale) {
    if (!project.links || !project.links.length) return '';
    return '<p class="td-case-links">' + project.links.map(function (link) {
      return '<a href="' + escapeHtml(link.href) + '" target="_blank" rel="noopener">' + escapeHtml(translatedField(link, 'label', locale)) + '</a>';
    }).join(' · ') + '</p>';
  }

  function caseStudyHtml(data, slug, base, isFile, locale) {
    var normalized = localeOf(locale);
    var copy = pageCopy[normalized];
    var project = validProjects(data, normalized).find(function (item) { return item.slug === slug; });
    if (!project) return '';
    var sourceProject = (data.projects || []).find(function (item) { return item.slug === slug; });
    var englishTitle = sourceProject ? translatedField(sourceProject, 'title', 'en') : '';
    var title = '<span>' + escapeHtml(project.title) + '</span>';
    if (normalized === 'ko' && englishTitle) title += '<small lang="en">' + escapeHtml(englishTitle) + '</small>';
    var pdfHref = assetHref(base, project.pdf[normalized]);
    var contactHref = i18n.routeHref(base, normalized, 'contact/', Boolean(isFile));
    return '<article class="td-case" data-case="' + escapeHtml(project.slug) + '">' +
      '<header class="td-case__header"><p class="td-eyebrow">' + escapeHtml(project.eyebrow) + '</p><div class="td-case__title-line"><h1>' + title + '</h1><span class="td-status" data-state="' + escapeHtml(project.evidenceState) + '">' + escapeHtml(stateLabel(project.evidenceState, normalized)) + '</span></div></header>' +
      '<p class="td-case__thesis">' + escapeHtml(project.thesis) + '</p>' +
      '<dl class="td-fact-ledger"><div><dt>' + escapeHtml(copy.period) + '</dt><dd>' + escapeHtml(project.period) + '</dd></div>' +
        '<div><dt>' + escapeHtml(copy.personalRole) + '</dt><dd>' + escapeHtml(project.role) + '</dd></div>' +
        '<div><dt>' + escapeHtml(copy.technology) + '</dt><dd>' + project.tech.map(escapeHtml).join(' · ') + '</dd></div></dl>' +
      evidenceMediaHtml(sourceProject, normalized, base, isFile) +
      '<div class="td-case__blocks">' + project.blocks.map(function (block) { return blockHtml(block, normalized); }).join('') + '</div>' +
      subcasesHtml(project, normalized) +
      '<section class="td-team-result"><p class="td-eyebrow">' + escapeHtml(copy.teamResult) + '</p><h2>' + escapeHtml(copy.teamResult) + '</h2><p>' + escapeHtml(project.teamResult) + '</p></section>' +
      '<section class="td-evidence-limits"><p class="td-eyebrow">' + escapeHtml(copy.evidenceLimits) + '</p><div><article><h2>' + escapeHtml(copy.evidence) + '</h2><p>' + escapeHtml(project.evidence) + '</p></article>' +
        '<aside><h2>' + escapeHtml(normalized === 'ko' ? '한계' : 'Limits') + '</h2><p>' + escapeHtml(project.limitation) + '</p></aside></div>' + projectLinksHtml(project, normalized) + '</section>' +
      '<section class="td-pdf-cta"><div><p class="td-eyebrow">PDF</p><h2>' + escapeHtml(copy.deeperDocument) + '</h2><p>' + escapeHtml(copy.pdfDescription) + '</p></div><a href="' + escapeHtml(pdfHref) + '">' + escapeHtml(copy.openPdf) + '</a></section>' +
      '<section class="td-case-contact"><p class="td-eyebrow">' + escapeHtml(copy.collaboration) + '</p><p>' + escapeHtml(project.collaboration) + '</p><a href="' + escapeHtml(contactHref) + '">' + escapeHtml(copy.contact) + '</a></section>' +
    '</article>';
  }

  function mountAll(doc, data) {
    if (!doc || typeof doc.querySelectorAll !== 'function') return;
    var body = doc.body;
    var base = body && body.getAttribute ? (body.getAttribute('data-base') || '') : '';
    var locale = localeOf(body && body.getAttribute ? body.getAttribute('data-lang') : 'ko');
    var isFile = Boolean(doc.location && doc.location.protocol === 'file:');
    var projectSlugs = validProjects(data, locale).map(function (project) { return project.slug; });

    function fill(selector, renderer) {
      Array.prototype.forEach.call(doc.querySelectorAll(selector), function (node) {
        var html = renderer(node);
        if (typeof html === 'string' && html) node.innerHTML = html;
      });
    }

    fill('[data-portfolio="home-evidence"]', function () { return homeEvidenceMosaicHtml(data, locale); });
    fill('[data-portfolio="home-projects"]', function () { return homeProjectGalleryHtml(data, base, isFile, locale); });
    fill('[data-portfolio="capability-index"]', function () { return capabilityIndexHtml(data, locale); });
    fill('[data-portfolio="project-groups"]', function () { return projectGroupsHtml(data, base, isFile, locale); });
    fill('[data-portfolio="case-study"]', function (node) {
      var slug = node && node.getAttribute ? node.getAttribute('data-project') : '';
      return projectSlugs.indexOf(slug) === -1 ? '' : caseStudyHtml(data, slug, base, isFile, locale);
    });
  }

  return {
    policy: policy,
    localizePortfolioData: localizePortfolioData,
    validatePortfolioData: validatePortfolioData,
    homeProjectGalleryHtml: homeProjectGalleryHtml,
    homeEvidenceMosaicHtml: homeEvidenceMosaicHtml,
    capabilityIndexHtml: capabilityIndexHtml,
    projectGroupsHtml: projectGroupsHtml,
    evidenceMediaHtml: evidenceMediaHtml,
    caseStudyHtml: caseStudyHtml,
    mountAll: mountAll,
    capabilityAtlasHtml: function (data, base, isFile, locale) { void base; void isFile; return capabilityIndexHtml(data, locale); },
    projectChaptersHtml: projectGroupsHtml,
    capabilityDetailsHtml: function (data, base, isFile, locale) { void base; void isFile; return capabilityIndexHtml(data, locale); }
  };
});
