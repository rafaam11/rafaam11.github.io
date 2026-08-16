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
  var capabilityKeys = ['registration', 'sensor-fusion', 'medical-navigation', 'xr-engineering', 'ai-product-engineering'];
  var tierKeys = ['medical-core', 'industrial-spotlight', 'ai-build-lab'];
  var projectSlugs = ['surgical-navigation', 'mandibular-fracture', 'life-careverse', 'rtms-navigation', 'unmanned-forklift', 'ai-build-lab'];
  var blockTypes = ['text', 'list', 'system', 'evidence', 'limitation'];
  var mediaTypes = ['video', 'image', 'repository', 'publication'];
  var leadMediaTypes = ['video', 'image', 'repository'];
  var referenceMediaTypes = ['repository', 'publication'];
  var fallbackVisualKeys = ['nav-digitaltwin-pipeline', 'coordinate-signal', 'hololens-ar-concept', 'forklift-sim-to-real', 'decision-signal'];
  var aiBuildLabSubcaseKeys = ['llm-wiki', 'multi-cli-work', 'daegu-bus'];
  var projectTranslationFields = [
    'title', 'shortTitle', 'eyebrow', 'thesis', 'summary', 'problem', 'role', 'teamResult',
    'evidence', 'limitation', 'collaboration', 'mediaAlt', 'mediaCaption'
  ];
  var policy = {
    prohibitedPartnerPattern: /Digitrack|삼성서울병원|Samsung Medical|\b(?:KERI|KAERI|ANL|SNU|ETRI)\b|HD현대|Hyundai|계명대|동산병원|울산대|이화여대|Genoray|제노레이|Megagen|메가젠|Hallym|한림|Argonne|서울대학교|서울대/i,
    contributionPercentagePattern: /(?:(?:contribution|ownership|owned|responsibility|role|기여(?:도)?|역할|담당)[\s\S]{0,80}\b\d{1,3}(?:\.\d+)?\s*%|\b\d{1,3}(?:\.\d+)?\s*%[\s\S]{0,80}(?:contribution|ownership|owned|responsibility|role|기여(?:도)?|역할|담당))/i
  };

  var pageCopy = {
    ko: {
      mediaApproved: '공개 근거',
      mediaPending: '공개 승인 대기',
      fallback: '실제 근거 미디어는 승인 후 공개합니다.',
      pendingAccessible: '공개 시각 자료 승인 대기: 실제 데모 또는 사진을 표시하지 않습니다.',
      representativeAccessible: '대표 기술 패널: 실제 데모 또는 사진을 표시하지 않습니다.',
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
      pendingAccessible: 'Public visual pending approval; no actual demo or photograph is shown.',
      representativeAccessible: 'Representative technical panel; no actual demo or photograph is shown.',
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

  function fullyDecoded(value) {
    var decoded = value;
    try {
      for (var index = 0; index < 5; index += 1) {
        var next = decodeURIComponent(decoded);
        if (next === decoded) return decoded;
        decoded = next;
      }
    } catch (error) {
      return null;
    }
    return /%[0-9a-f]{2}/i.test(decoded) ? null : decoded;
  }

  function isSafeHttpUrl(value) {
    if (!/^https?:\/\//i.test(value)) return false;
    try {
      var url = new URL(value);
      return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
    } catch (error) {
      return false;
    }
  }

  function isSafePublicPath(value) {
    if (typeof value !== 'string' || value !== value.trim() || !value) return false;
    if (/^https?:\/\//i.test(value)) return isSafeHttpUrl(value);
    if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('/') || value.startsWith('\\') || value.includes('\\') || /[?#]/.test(value)) return false;
    var decoded = fullyDecoded(value);
    if (!decoded || /^[a-z][a-z0-9+.-]*:/i.test(decoded) || decoded.startsWith('/') || decoded.includes('\\') || /[?#]/.test(decoded)) return false;
    var segments = decoded.split('/');
    if (!decoded.startsWith('assets/') || segments.some(function (segment) { return !segment || segment === '.' || segment === '..'; })) return false;
    if (segments.some(function (segment) { return /^(?:private|raw)(?:$|[-_.])/i.test(segment); })) return false;
    return segments.join('/') === decoded;
  }

  function isSafeProjectLink(value) {
    return typeof value === 'string' && value === value.trim() && isSafeHttpUrl(value);
  }

  function publicPathname(value) {
    if (isSafeHttpUrl(value)) {
      try { return new URL(value).pathname; } catch (error) { return ''; }
    }
    return String(value || '');
  }

  function isImagePath(value) {
    return /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(publicPathname(value));
  }

  function isVideoPath(value) {
    return /\.(?:mp4|webm)$/i.test(publicPathname(value));
  }

  function assetHref(base, publicPath) {
    var value = String(publicPath || '');
    if (!isSafePublicPath(value)) return '';
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

  function translationErrors(record, fields, label) {
    var errors = [];
    ['ko', 'en'].forEach(function (locale) {
      fields.forEach(function (field) {
        if (!record || !record.translations || !record.translations[locale] ||
            typeof record.translations[locale][field] !== 'string' || !record.translations[locale][field].trim()) {
          errors.push(label + ': missing ' + locale + ' translation for ' + field + '.');
        }
      });
    });
    return errors;
  }

  function mediaItemErrors(item, label, allowedTypes) {
    var errors = [];
    if (!item || typeof item !== 'object') return [label + ': media item must be an object.'];
    if (typeof item.id !== 'string' || !item.id) errors.push(label + ': media item requires a stable id.');
    if (!mediaTypes.includes(item.type)) errors.push(label + ': unknown media type.');
    else if (allowedTypes && !allowedTypes.includes(item.type)) errors.push(label + ': unsupported ' + item.type + ' media type for this slot.');
    if (!['approved', 'pending-approval'].includes(item.status)) errors.push(label + ': unknown media status.');
    var hasPublicPath = typeof item.publicPath === 'string' && item.publicPath.trim().length > 0;
    if (item.status === 'pending-approval' && hasPublicPath) errors.push(label + ': pending-approval media must not declare a public path.');
    if (item.status === 'approved' && !hasPublicPath) errors.push(label + ': approved media requires a public path.');
    if (hasPublicPath && !isSafePublicPath(item.publicPath)) errors.push(label + ': unsafe public path.');
    if (item.status === 'approved' && hasPublicPath && item.type === 'repository' && !isSafeHttpUrl(item.publicPath)) {
      errors.push(label + ': repository media requires an HTTP(S) public URL.');
    }
    if (item.status === 'approved' && hasPublicPath && item.type === 'image' && !isImagePath(item.publicPath)) {
      errors.push(label + ': image media requires an image file.');
    }
    if (item.status === 'approved' && hasPublicPath && item.type === 'video' && !isVideoPath(item.publicPath)) {
      errors.push(label + ': video media requires a video file.');
    }
    return errors;
  }

  function blockErrors(block, projectSlug) {
    var label = projectSlug + '/' + (block && block.key ? block.key : 'unknown-block');
    var errors = [];
    if (!block || typeof block !== 'object') return [label + ': block must be an object.'];
    if (typeof block.key !== 'string' || !block.key) errors.push(label + ': block requires a stable key.');
    if (!blockTypes.includes(block.type)) errors.push(label + ': unsupported block type.');
    ['ko', 'en'].forEach(function (locale) {
      var copy = block.translations && block.translations[locale];
      if (!copy || typeof copy.heading !== 'string' || !copy.heading.trim()) {
        errors.push(label + ': missing ' + locale + ' block heading.');
      } else if (block.type === 'list') {
        if (!Array.isArray(copy.items) || copy.items.length === 0 || copy.items.some(function (item) { return typeof item !== 'string' || !item.trim(); })) {
          errors.push(label + ': missing ' + locale + ' block list copy.');
        }
      } else if (typeof copy.body !== 'string' || !copy.body.trim()) {
        errors.push(label + ': missing ' + locale + ' block body.');
      }
    });
    return errors;
  }

  function validatePortfolioData(data) {
    var errors = [];
    if (!data || typeof data !== 'object') return ['Portfolio data must be an object.'];

    if (!Array.isArray(data.capabilities) || data.capabilities.length !== capabilityKeys.length) {
      errors.push('Portfolio data must contain exactly five capabilities.');
    } else {
      if (JSON.stringify(data.capabilities.map(function (capability) { return capability && capability.key; })) !== JSON.stringify(capabilityKeys)) {
        errors.push('Portfolio capabilities must use the known ordered keys.');
      }
      data.capabilities.forEach(function (capability) {
        var label = capability && capability.key ? capability.key : 'unknown-capability';
        errors = errors.concat(translationErrors(capability, ['title', 'summary', 'validation', 'cardSummary', 'cardValidation'], label));
        if (!Array.isArray(capability && capability.methods) || capability.methods.length === 0 || capability.methods.some(function (method) { return typeof method !== 'string' || !method; })) {
          errors.push(label + ': missing implementation-derived methods.');
        }
      });
    }

    if (!Array.isArray(data.tiers) || data.tiers.length !== tierKeys.length) {
      errors.push('Portfolio data must contain exactly three tiers.');
    } else {
      if (JSON.stringify(data.tiers.map(function (tier) { return tier && tier.key; })) !== JSON.stringify(tierKeys)) {
        errors.push('Portfolio tiers must use the known ordered keys.');
      }
      data.tiers.forEach(function (tier) {
        errors = errors.concat(translationErrors(tier, ['label'], tier && tier.key ? tier.key : 'unknown-tier'));
      });
    }

    if (!Array.isArray(data.projects) || data.projects.length !== projectSlugs.length) {
      errors.push('Portfolio data must contain exactly six projects.');
    } else {
      if (JSON.stringify(data.projects.map(function (project) { return project && project.slug; })) !== JSON.stringify(projectSlugs)) {
        errors.push('Portfolio projects must use the known ordered slugs.');
      }
      var seenSlugs = [];
      data.projects.forEach(function (project) {
        var slug = project && project.slug ? project.slug : 'unknown-project';
        if (!project || typeof project !== 'object') {
          errors.push(slug + ': project record must be an object.');
          return;
        }
        if (seenSlugs.includes(slug)) errors.push(slug + ': duplicate slug.');
        seenSlugs.push(slug);
        ['slug', 'tier', 'period', 'evidenceState', 'route'].forEach(function (field) {
          if (typeof project[field] !== 'string' || !project[field]) errors.push(slug + ': missing required string ' + field + '.');
        });
        if (!tierKeys.includes(project.tier)) errors.push(slug + ': unknown tier.');
        if (!evidenceStates.includes(project.evidenceState)) errors.push(slug + ': unknown evidence state.');
        if (project.route !== 'projects/' + slug + '/') errors.push(slug + ': invalid project route.');
        if (!fallbackVisualKeys.includes(project.visualKey)) errors.push(slug + ': invalid visual key.');
        if (!Array.isArray(project.capabilityKeys) || project.capabilityKeys.length === 0) {
          errors.push(slug + ': missing capability mappings.');
        } else if (project.capabilityKeys.some(function (key) { return !capabilityKeys.includes(key); })) {
          errors.push(slug + ': unknown capability mapping.');
        }
        if (!Array.isArray(project.tech) || project.tech.length === 0 || project.tech.some(function (technology) { return typeof technology !== 'string' || !technology.trim(); })) {
          errors.push(slug + ': missing technologies.');
        }
        errors = errors.concat(translationErrors(project, projectTranslationFields, slug));
        ['ko', 'en'].forEach(function (locale) {
          var copy = project.translations && project.translations[locale];
          if (copy && copy.role === copy.teamResult) errors.push(slug + ': ' + locale + ' role and team result must remain separate.');
        });
        if (!project.pdf || typeof project.pdf !== 'object') {
          errors.push(slug + ': missing PDF paths.');
        } else {
          ['ko', 'en'].forEach(function (locale) {
            if (project.pdf[locale] !== 'assets/pdfs/' + slug + '-' + locale + '.pdf') errors.push(slug + ': invalid ' + locale + ' PDF path.');
          });
        }
        if (!project.media || !project.media.lead) {
          errors.push(slug + ': missing lead media declaration.');
        } else {
          errors = errors.concat(mediaItemErrors(project.media.lead, slug + ' lead', leadMediaTypes));
          if (project.media.video) errors = errors.concat(mediaItemErrors(project.media.video, slug + ' video', ['video']));
          if (project.media.poster) errors = errors.concat(mediaItemErrors(project.media.poster, slug + ' poster', ['image']));
          if (project.media.references !== undefined && !Array.isArray(project.media.references)) {
            errors.push(slug + ': media references must be an array.');
          } else {
            (project.media.references || []).forEach(function (item, index) {
              errors = errors.concat(mediaItemErrors(item, slug + ' reference ' + index, referenceMediaTypes));
            });
          }
        }
        if (!Array.isArray(project.blocks) || project.blocks.length === 0) {
          errors.push(slug + ': missing structural blocks.');
        } else {
          project.blocks.forEach(function (block) { errors = errors.concat(blockErrors(block, slug)); });
        }
        if (project.links !== undefined && !Array.isArray(project.links)) {
          errors.push(slug + ': project links must be an array.');
        } else {
          (project.links || []).forEach(function (link, index) {
            var label = slug + ' link ' + index;
            if (!link || typeof link !== 'object' || !isSafeProjectLink(link.href)) errors.push(label + ': unsafe project link.');
            errors = errors.concat(translationErrors(link, ['label'], label));
          });
        }
        if (slug === 'ai-build-lab') {
          if (!Array.isArray(project.subcases) || project.subcases.length !== aiBuildLabSubcaseKeys.length) {
            errors.push(slug + ': must contain exactly three subcases.');
          } else {
            if (JSON.stringify(project.subcases.map(function (subcase) { return subcase && subcase.key; })) !== JSON.stringify(aiBuildLabSubcaseKeys)) {
              errors.push(slug + ': subcases must use the known ordered subcase keys.');
            }
            project.subcases.forEach(function (subcase) {
              errors = errors.concat(translationErrors(subcase, ['title', 'summary'], subcase && subcase.key ? subcase.key : slug + ' unknown-subcase'));
            });
          }
        }
      });
    }

    var serialized = JSON.stringify(data);
    if (policy.contributionPercentagePattern.test(serialized)) errors.push('Shared data contains a contribution percentage.');
    if (policy.prohibitedPartnerPattern.test(serialized)) errors.push('Shared data contains a nonpublic partner name.');
    return errors;
  }

  function validProjects(data, locale) {
    if (validatePortfolioData(data).length) return [];
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

  function isApprovedImage(item) {
    return Boolean(item && item.type === 'image' && item.status === 'approved' &&
      isSafePublicPath(item.publicPath) && isImagePath(item.publicPath));
  }

  function isApprovedVideo(item) {
    return Boolean(item && item.type === 'video' && item.status === 'approved' &&
      isSafePublicPath(item.publicPath) && isVideoPath(item.publicPath));
  }

  function isApprovedRepository(item) {
    return Boolean(item && item.type === 'repository' && item.status === 'approved' && isSafeHttpUrl(item.publicPath));
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
    var posterItem = project.media && project.media.poster;
    var approvedPoster = isApprovedVideo(media) && isApprovedImage(posterItem) ? posterItem.publicPath : '';
    var renderable = isApprovedImage(media) || isApprovedRepository(media) || Boolean(approvedPoster);
    var visual = '';
    if (!renderable) {
      visual = '<div class="td-evidence-placeholder" role="img" aria-label="' + escapeHtml(copy.pendingAccessible) + '">' +
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

  function compactLeadHtml(project, locale, base) {
    var normalized = localeOf(locale);
    var media = project.media && project.media.lead ? project.media.lead : {};
    var copy = pageCopy[normalized];
    var approvedLeadImage = isApprovedImage(media);
    var approvedLeadRepository = isApprovedRepository(media);
    var posterItem = project.media && project.media.poster;
    var approvedPoster = isApprovedVideo(media) && isApprovedImage(posterItem);
    var displayStatus = approvedLeadImage || approvedLeadRepository || approvedPoster ? 'approved' : 'pending-approval';
    var visual = '';
    if (approvedLeadImage) {
      visual = '<img class="td-home-project__image" src="' + escapeHtml(assetHref(base, media.publicPath)) + '" alt="' +
        escapeHtml(project.mediaAlt) + '" loading="lazy" decoding="async">';
    } else if (approvedPoster) {
      visual = '<img class="td-home-project__image td-home-project__poster" src="' +
        escapeHtml(assetHref(base, posterItem.publicPath)) + '" alt="' + escapeHtml(project.mediaAlt) +
        '" loading="lazy" decoding="async">';
    } else {
      var accessibleName = displayStatus === 'approved' ? project.mediaAlt : copy.pendingAccessible;
      var label = displayStatus === 'approved' ? copy.mediaApproved : copy.mediaPending;
      visual = '<div class="td-home-project__fallback" role="img" aria-label="' + escapeHtml(accessibleName) + '">' +
          '<span aria-hidden="true">' + escapeHtml((media.type || 'evidence').toUpperCase()) + ' / ' + escapeHtml(project.slug) + '</span>' +
          '<strong>' + escapeHtml(label) + '</strong>' +
        '</div>';
    }
    return '<figure class="td-home-project__visual" data-media-status="' + displayStatus + '">' +
      visual + mediaLedgerHtml(project, normalized, displayStatus) +
    '</figure>';
  }

  function homeProjectGalleryHtml(data, base, isFile, locale) {
    var normalized = localeOf(locale);
    return validProjects(data, normalized).map(function (project) {
      var href = i18n.routeHref(base, normalized, project.route, Boolean(isFile));
      return '<article class="td-home-project"><a href="' + escapeHtml(href) + '">' +
        compactLeadHtml(project, normalized, base) +
        '<h3>' + escapeHtml(project.title) + '</h3>' +
      '</a></article>';
    }).join('');
  }

  function homeEvidenceMosaicHtml(data, locale, base) {
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
      var posterItem = project.media && project.media.poster;
      var approvedImage = isApprovedImage(media) ? media : (isApprovedVideo(media) && isApprovedImage(posterItem) ? posterItem : null);
      var displayStatus = approvedImage || isApprovedRepository(media) ? 'approved' : 'pending-approval';
      var visual = '';
      if (approvedImage) {
        var imageClass = 'td-mosaic-cell__image' + (media.type === 'video' ? ' td-mosaic-cell__poster' : '');
        visual = '<div class="td-mosaic-cell__field td-mosaic-cell__field--media"><img class="' + imageClass +
          '" src="' + escapeHtml(assetHref(base, approvedImage.publicPath)) + '" alt="' + escapeHtml(project.mediaAlt) +
          '" loading="lazy" decoding="async"></div>';
      } else {
        var accessibleName = media.status === 'approved' ? pageCopy[normalized].representativeAccessible : pageCopy[normalized].pendingAccessible;
        visual = '<div class="td-mosaic-cell__field" role="img" aria-label="' + escapeHtml(accessibleName) + '">' +
          '<span>FRAME / ' + escapeHtml((media.type || 'evidence').toUpperCase()) + '</span>' +
          '<strong>' + escapeHtml(project.shortTitle) + '</strong>' +
          '<i aria-hidden="true"></i>' +
        '</div>';
      }
      return '<article class="td-mosaic-cell">' +
        '<p class="td-mosaic-cell__label">' + escapeHtml(definition.label) + '</p>' +
        visual +
        mediaLedgerHtml(project, normalized, displayStatus) +
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
    var safeLinks = project.links.filter(function (link) { return link && isSafeProjectLink(link.href); });
    if (!safeLinks.length) return '';
    return '<p class="td-case-links">' + safeLinks.map(function (link) {
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

    fill('[data-portfolio="home-evidence"]', function () { return homeEvidenceMosaicHtml(data, locale, base); });
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
    dataErrors: validatePortfolioData,
    isSafePublicPath: isSafePublicPath,
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
