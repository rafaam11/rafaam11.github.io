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
  var lifecycleStates = ['ongoing', 'completed', 'expected', 'research'];
  var capabilityKeys = ['registration', 'sensor-fusion', 'medical-navigation', 'xr-engineering', 'ai-product-engineering'];
  var tierKeys = ['medical-core', 'industrial-spotlight', 'ai-build-lab'];
  var projectSlugs = ['surgical-navigation', 'mandibular-fracture', 'life-careverse', 'rtms-navigation', 'unmanned-forklift', 'ai-build-lab'];
  var pdfDiagramKindsBySlug = {
    'surgical-navigation': 'coordinate-chain',
    'mandibular-fracture': 'optimization-loop',
    'life-careverse': 'sync-topology',
    'rtms-navigation': 'navigation-loop',
    'unmanned-forklift': 'sensor-convergence',
    'ai-build-lab': 'product-loop'
  };
  var blockTypes = ['text', 'list', 'system', 'evidence', 'limitation'];
  var mediaTypes = ['video', 'image', 'repository', 'publication'];
  var leadMediaTypes = ['video', 'image', 'repository'];
  var referenceMediaTypes = ['repository', 'publication'];
  var aiBuildLabSubcaseKeys = ['llm-wiki', 'multi-cli-work', 'daegu-bus'];
  var projectTranslationFields = [
    'title', 'shortTitle', 'eyebrow', 'thesis', 'summary', 'problem', 'role', 'teamResult',
    'evidence', 'limitation', 'collaboration', 'mediaAlt', 'mediaCaption'
  ];
  var policy = {
    prohibitedPartnerPattern: /\b(?:KAERI|ANL|SNU)\b|HD현대|Hyundai|계명대|동산병원|울산대|이화여대|Genoray|제노레이|Megagen|메가젠|Hallym|한림|Argonne|서울대학교|서울대/i,
    contributionPercentagePattern: /(?:(?:contribution|ownership|owned|responsibility|role|기여(?:도)?|역할|담당)[\s\S]{0,80}\b\d{1,3}(?:\.\d+)?\s*%|\b\d{1,3}(?:\.\d+)?\s*%[\s\S]{0,80}(?:contribution|ownership|owned|responsibility|role|기여(?:도)?|역할|담당))/i,
    privateCopyPathPattern: /(?:[a-z]:[\\/]|\\\\[^\\/\s]+[\\/]|file:\/\/|\/(?:Users|home|mnt|tmp|var\/tmp)\/|(?:^|[\\/])(?:private|raw|extracted|manifest)(?=[\\/]|$)|\.(?:dcm|dicom)\b)/i,
    privateCopyPhonePattern: /(?:\+?82[- .]?(?:0)?10|010)[- .]?\d{3,4}[- .]?\d{4}/,
    privateCopyAgePattern: /(?:\b\d{1,3}(?:\s+years?\s+old|[-\s]year[-\s]old)\b|(?:만\s*)?\d{1,3}\s*세(?![가-힣]))/i,
    privateCopyAddressPattern: /(?:서울(?:특별시|시)?|부산(?:광역시|시)?|대구(?:광역시|시)?|인천(?:광역시|시)?|광주(?:광역시|시)?|대전(?:광역시|시)?|울산(?:광역시|시)?|세종(?:특별자치시|시)?)\s+[가-힣]{1,12}(?:구|군)(?![가-힣])|[가-힣]{2,12}(?:특별자치도|도|광역시|특별시)\s+[가-힣]{1,12}(?:시|군|구)(?![가-힣])|[가-힣]{2,12}(?:시|군|구)\s+[가-힣]{1,12}(?:구|읍|면|동|로|길)(?![가-힣])|[가-힣]{2,20}(?:읍|면|동|로|길)\s*\d{1,5}(?:-\d{1,5})?(?!\d)|\b\d{1,5}(?:-\d{1,5})?\s+[A-Za-z][A-Za-z0-9.'-]*(?:\s+[A-Za-z][A-Za-z0-9.'-]*){0,3}(?:-ro|-gil|\s(?:Road|Rd\.?|Street|St\.?|Avenue|Ave\.?|Boulevard|Blvd\.?|Lane|Ln\.?|Drive|Dr\.?))\s*,\s*[A-Za-z][A-Za-z.'-]*(?:-gu|-gun|-si)\s*,\s*(?:Seoul|Busan|Daegu|Incheon|Gwangju|Daejeon|Ulsan|Sejong|[A-Za-z][A-Za-z.'-]*-do)\b/i,
    privateCopyPatientPattern: /(?:\b(?:PatientName|PatientID|StudyInstanceUID|SOPInstanceUID)\b|환자(?:명|번호|ID))\s*[:=]/i
  };

  var pageCopy = {
    ko: {
      personalRole: '내 역할', teamResult: '팀 성과', period: '기간', technology: '기술',
      evidence: '근거', problem: '문제', approach: '접근', results: '결과와 근거', limits: '한계와 팀 성과',
      components: '구성', details: '자세히', pdf: 'PDF', openPdf: '사례 PDF 열기', figure: '그림', figures: '그림 모음',
      contact: '연락처', publications: '논문', patents: '특허', awards: '수상',
      patentSummary: function (filed, registered) { return '출원 ' + filed + '건 · 등록 ' + registered + '건'; }
    },
    en: {
      personalRole: 'My role', teamResult: 'Team result', period: 'Period', technology: 'Technology',
      evidence: 'Evidence', problem: 'Problem', approach: 'Approach', results: 'Results and evidence', limits: 'Limits and team result',
      components: 'Components', details: 'Details', pdf: 'PDF', openPdf: 'Open case PDF', figure: 'Figure', figures: 'Figures',
      contact: 'Contact', publications: 'Publications', patents: 'Patents', awards: 'Awards',
      patentSummary: function (filed, registered) { return filed + ' filed · ' + registered + ' registered'; }
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

  function collectStrings(value, output) {
    if (typeof value === 'string') {
      output.push(value);
      return output;
    }
    if (Array.isArray(value)) {
      value.forEach(function (item) { collectStrings(item, output); });
      return output;
    }
    if (value && typeof value === 'object') {
      Object.keys(value).forEach(function (key) { collectStrings(value[key], output); });
    }
    return output;
  }

  function decodedPublicCopy(value) {
    var result = String(value == null ? '' : value);
    for (var index = 0; index < 5; index += 1) {
      var next = result
        .replace(/&#x([0-9a-f]+);?/gi, function (_, code) { return String.fromCodePoint(parseInt(code, 16)); })
        .replace(/&#([0-9]+);?/g, function (_, code) { return String.fromCodePoint(parseInt(code, 10)); })
        .replace(/&sol;?/gi, '/')
        .replace(/&bsol;?/gi, '\\');
      try { next = decodeURIComponent(next); } catch (_) { /* keep the last safe representation */ }
      if (next === result) break;
      result = next;
    }
    return result;
  }

  function projectPublicCopy(project) {
    var surfaces = [project && project.tech, project && project.translations];
    (project && project.blocks || []).forEach(function (block) { surfaces.push(block && block.translations); });
    (project && project.subcases || []).forEach(function (subcase) { surfaces.push(subcase && subcase.translations); });
    (project && project.links || []).forEach(function (link) { surfaces.push(link && link.translations); });
    surfaces.push(project && project.pdfSequence && project.pdfSequence.diagram && project.pdfSequence.diagram.translations);
    return decodedPublicCopy(collectStrings(surfaces, []).join('\n'));
  }

  function portfolioPublicCopy(data) {
    var surfaces = [];
    (data && data.capabilities || []).forEach(function (capability) {
      surfaces.push(capability && capability.methods, capability && capability.translations);
    });
    (data && data.tiers || []).forEach(function (tier) { surfaces.push(tier && tier.translations); });
    (data && data.projects || []).forEach(function (project) { surfaces.push(projectPublicCopy(project)); });
    surfaces.push(data && data.highlights);
    return decodedPublicCopy(collectStrings(surfaces, []).join('\n'));
  }

  function publicCopySafetyErrors(data) {
    var copy = portfolioPublicCopy(data);
    var errors = [];
    if (policy.privateCopyPathPattern.test(copy)) errors.push('Shared public data contains a private source path.');
    if (policy.privateCopyPhonePattern.test(copy)) errors.push('Shared public data contains private phone PII.');
    if (policy.privateCopyAgePattern.test(copy)) errors.push('Shared public data contains private age PII.');
    if (policy.privateCopyAddressPattern.test(copy)) errors.push('Shared public data contains private address PII.');
    if (policy.privateCopyPatientPattern.test(copy)) errors.push('Shared public data contains a private patient identifier.');
    return errors;
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
    if (typeof value !== 'string' || value !== value.trim() || !/^https:\/\//i.test(value) || value.includes('\\')) return false;
    try {
      var url = new URL(value);
      var hostname = String(url.hostname || '').toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
      if (url.protocol !== 'https:' || url.username || url.password || !hostname ||
          hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') ||
          hostname.endsWith('.internal') || hostname.endsWith('.lan')) return false;
      var ipv4 = hostname.split('.');
      if (ipv4.length === 4 && ipv4.every(function (part) { return /^\d{1,3}$/.test(part) && Number(part) <= 255; })) {
        var first = Number(ipv4[0]);
        var second = Number(ipv4[1]);
        if (first === 0 || first === 10 || first === 127 || first >= 224 ||
            (first === 100 && second >= 64 && second <= 127) ||
            (first === 169 && second === 254) ||
            (first === 172 && second >= 16 && second <= 31) ||
            (first === 192 && second === 168)) return false;
      } else if (!hostname.includes('.') || hostname === '::' || hostname === '::1' ||
          hostname.startsWith('fc') || hostname.startsWith('fd') || /^fe[89ab]/.test(hostname)) {
        return false;
      }
      var decoded = fullyDecoded((url.pathname + url.search + url.hash).replace(/\+/g, '%20'));
      if (!decoded) return false;
      var surface = decoded.replace(/\\/g, '/');
      if (/[a-z]:\//i.test(surface) || /(?:^|[^:])\/\//.test(surface) || /file:\/\//i.test(surface) ||
          /(?:^|[/])(?:users|home|tmp|onedrive)(?:[/]|$)/i.test(surface) ||
          /(?:^|[/])private[/](?:raw|extracted|manifest)(?:[/]|$)/i.test(surface) ||
          /(?:^|[/])(?:extracted|manifest)(?:[/]|$)/i.test(surface)) return false;
      return true;
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
          lifecycleState: project.lifecycleState,
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

  var galleryMaxItems = 6;
  var patentNumberPattern = /\b10-\d{4}-\d{6,}\b/;

  function galleryErrors(project, slug) {
    var gallery = project.media && project.media.gallery;
    if (gallery === undefined) return [];
    if (!Array.isArray(gallery)) return [slug + ': media gallery must be an array.'];
    var errors = [];
    if (gallery.length > galleryMaxItems) errors.push(slug + ': media gallery allows at most six items.');
    var seen = [];
    gallery.forEach(function (item, index) {
      var label = slug + ' gallery ' + index;
      errors = errors.concat(mediaItemErrors(item, label, ['image']));
      if (item && typeof item.id === 'string') {
        if (seen.includes(item.id)) errors.push(label + ': duplicate gallery id.');
        seen.push(item.id);
      }
      if (item && item.status === 'approved') errors = errors.concat(translationErrors(item, ['caption', 'alt'], label));
    });
    return errors;
  }

  function yearErrors(item, label) {
    return item && typeof item.year === 'string' && /^\d{4}$/.test(item.year) ? [] : [label + ': requires a four-digit year.'];
  }

  function highlightsErrors(highlights) {
    if (highlights === undefined) return [];
    if (!highlights || typeof highlights !== 'object' || Array.isArray(highlights)) return ['Portfolio highlights must be an object.'];
    var errors = [];
    if (!Array.isArray(highlights.publications) || !highlights.publications.length) errors.push('Portfolio highlights require publications.');
    (Array.isArray(highlights.publications) ? highlights.publications : []).forEach(function (item, index) {
      var label = 'highlights publication ' + index;
      errors = errors.concat(yearErrors(item, label), translationErrors(item, ['title', 'venue'], label));
      if (item && item.href !== undefined && !isSafeProjectLink(item.href)) errors.push(label + ': unsafe link.');
    });
    var patents = highlights.patents;
    if (!patents || typeof patents !== 'object' || Array.isArray(patents)) {
      errors.push('Portfolio highlights require a patents summary.');
    } else {
      if (!Number.isInteger(patents.filed) || !Number.isInteger(patents.registered) || patents.registered > patents.filed) {
        errors.push('highlights patents: filed and registered must be integers with registered <= filed.');
      }
      if (!Array.isArray(patents.items)) errors.push('highlights patents: items must be an array.');
      (Array.isArray(patents.items) ? patents.items : []).forEach(function (item, index) {
        var label = 'highlights patent ' + index;
        errors = errors.concat(yearErrors(item, label), translationErrors(item, ['title'], label));
        if (!item || !['registered', 'filed'].includes(item.status)) errors.push(label + ': status must be registered or filed.');
      });
    }
    if (!Array.isArray(highlights.awards) || !highlights.awards.length) errors.push('Portfolio highlights require awards.');
    (Array.isArray(highlights.awards) ? highlights.awards : []).forEach(function (item, index) {
      var label = 'highlights award ' + index;
      errors = errors.concat(yearErrors(item, label), translationErrors(item, ['title'], label));
    });
    if (patentNumberPattern.test(JSON.stringify(highlights))) errors.push('Portfolio highlights must not include a patent number.');
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
      var seenPdfDiagramKinds = [];
      data.projects.forEach(function (project) {
        var slug = project && project.slug ? project.slug : 'unknown-project';
        if (!project || typeof project !== 'object') {
          errors.push(slug + ': project record must be an object.');
          return;
        }
        if (seenSlugs.includes(slug)) errors.push(slug + ': duplicate slug.');
        seenSlugs.push(slug);
        ['slug', 'tier', 'period', 'evidenceState', 'lifecycleState', 'route'].forEach(function (field) {
          if (typeof project[field] !== 'string' || !project[field]) errors.push(slug + ': missing required string ' + field + '.');
        });
        if (!tierKeys.includes(project.tier)) errors.push(slug + ': unknown tier.');
        if (!evidenceStates.includes(project.evidenceState)) errors.push(slug + ': unknown evidence state.');
        if (!lifecycleStates.includes(project.lifecycleState)) errors.push(slug + ': unknown lifecycle state.');
        if (project.route !== 'projects/' + slug + '/') errors.push(slug + ': invalid project route.');
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
          errors = errors.concat(galleryErrors(project, slug));
        }
        if (!Array.isArray(project.blocks) || project.blocks.length === 0) {
          errors.push(slug + ': missing structural blocks.');
        } else {
          project.blocks.forEach(function (block) { errors = errors.concat(blockErrors(block, slug)); });
        }
        var sequence = project.pdfSequence;
        if (!sequence || typeof sequence !== 'object' || Array.isArray(sequence)) {
          errors.push(slug + ': missing PDF sequence contract.');
        } else {
          if (JSON.stringify(Object.keys(sequence).sort()) !== JSON.stringify(['diagram', 'evidenceId', 'middle'])) {
            errors.push(slug + ': PDF sequence must contain exactly middle, evidenceId, and diagram.');
          }
          var blockKeys = Array.isArray(project.blocks) ? project.blocks.map(function (block) { return block && block.key; }) : [];
          if (!Array.isArray(sequence.middle) || sequence.middle.length !== 4 ||
              sequence.middle.some(function (key) { return typeof key !== 'string' || !key; }) ||
              new Set(sequence.middle).size !== 4 ||
              sequence.middle.some(function (key) { return !blockKeys.includes(key); })) {
            errors.push(slug + ': PDF sequence must reference exactly four distinct known middle blocks.');
          }
          var mediaIds = [];
          if (project.media && typeof project.media === 'object') {
            ['lead', 'video', 'poster'].forEach(function (slot) {
              if (project.media[slot] && typeof project.media[slot].id === 'string') mediaIds.push(project.media[slot].id);
            });
            (Array.isArray(project.media.references) ? project.media.references : []).forEach(function (item) {
              if (item && typeof item.id === 'string') mediaIds.push(item.id);
            });
          }
          if (typeof sequence.evidenceId !== 'string' || !sequence.evidenceId ||
              !project.media || !project.media.lead || sequence.evidenceId !== project.media.lead.id ||
              !mediaIds.includes(sequence.evidenceId)) {
            errors.push(slug + ': PDF sequence evidenceId must reference the canonical lead media.');
          }
          var diagram = sequence.diagram;
          if (!diagram || typeof diagram !== 'object' || Array.isArray(diagram)) {
            errors.push(slug + ': missing PDF sequence diagram contract.');
          } else {
            if (JSON.stringify(Object.keys(diagram).sort()) !== JSON.stringify(['kind', 'translations'])) {
              errors.push(slug + ': PDF sequence diagram must contain exactly kind and translations.');
            }
            if (diagram.kind !== pdfDiagramKindsBySlug[slug]) errors.push(slug + ': invalid PDF sequence diagram kind.');
            if (seenPdfDiagramKinds.includes(diagram.kind)) errors.push(slug + ': PDF sequence diagram kind must be unique.');
            if (typeof diagram.kind === 'string') seenPdfDiagramKinds.push(diagram.kind);
            if (!diagram.translations || typeof diagram.translations !== 'object' || Array.isArray(diagram.translations) ||
                JSON.stringify(Object.keys(diagram.translations).sort()) !== JSON.stringify(['en', 'ko'])) {
              errors.push(slug + ': PDF sequence diagram translations must contain exactly ko and en.');
            } else {
              ['ko', 'en'].forEach(function (locale) {
                var diagramCopy = diagram.translations[locale];
                if (!diagramCopy || typeof diagramCopy !== 'object' || Array.isArray(diagramCopy) ||
                    JSON.stringify(Object.keys(diagramCopy).sort()) !== JSON.stringify(['nodes', 'title']) ||
                    typeof diagramCopy.title !== 'string' || !diagramCopy.title.trim() ||
                    !Array.isArray(diagramCopy.nodes) || diagramCopy.nodes.length !== 4 ||
                    diagramCopy.nodes.some(function (node) { return typeof node !== 'string' || !node.trim(); })) {
                  errors.push(slug + ': ' + locale + ' PDF sequence diagram requires a title and exactly four nodes.');
                }
              });
            }
          }
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

    errors = errors.concat(highlightsErrors(data.highlights));
    errors = errors.concat(publicCopySafetyErrors(data));
    var serialized = JSON.stringify(data);
    if (policy.contributionPercentagePattern.test(serialized)) errors.push('Shared data contains a contribution percentage.');
    if (policy.prohibitedPartnerPattern.test(serialized)) errors.push('Shared data contains a nonpublic partner name.');
    return errors;
  }

  function validProjects(data, locale) {
    if (validatePortfolioData(data).length) return [];
    return localizePortfolioData(data, locale).projects.filter(function (project) {
      return project.slug && project.title && project.summary && project.role && project.teamResult &&
        project.evidence && project.limitation && evidenceStates.includes(project.evidenceState) &&
        lifecycleStates.includes(project.lifecycleState);
    });
  }

  function stateLabel(state, locale) {
    var normalized = localeOf(locale);
    return (i18n.ui[normalized].portfolio.evidenceStates || {})[state] || state;
  }

  function projectStateLabel(project, locale) {
    var states = [project.evidenceState, project.lifecycleState].filter(function (state, index, values) {
      return state && values.indexOf(state) === index;
    });
    return states.map(function (state) { return stateLabel(state, locale); }).join(' · ');
  }

  function isApprovedImage(item) {
    return Boolean(item && item.type === 'image' && item.status === 'approved' &&
      isSafePublicPath(item.publicPath) && isImagePath(item.publicPath));
  }

  function isApprovedVideo(item) {
    return Boolean(item && item.type === 'video' && item.status === 'approved' &&
      isSafePublicPath(item.publicPath) && isVideoPath(item.publicPath));
  }

  function thumbnailItem(project) {
    var media = project.media && project.media.lead ? project.media.lead : {};
    var posterItem = project.media && project.media.poster;
    if (isApprovedImage(media)) return media;
    if (isApprovedVideo(media) && isApprovedImage(posterItem)) return posterItem;
    return null;
  }

  function figureHtml(visual, label, caption, extraClass) {
    return '<figure class="sc-figure' + (extraClass ? ' ' + extraClass : '') + '" data-media-status="approved">' + visual +
      '<figcaption><span class="sc-figure__label">' + escapeHtml(label) + '</span> ' + escapeHtml(caption) + '</figcaption></figure>';
  }

  function evidenceMediaHtml(projectRecord, locale, base, isFile) {
    void isFile;
    var normalized = localeOf(locale);
    var copy = pageCopy[normalized];
    var sourceCopy = translation(projectRecord, normalized);
    var media = projectRecord && projectRecord.media && projectRecord.media.lead ? projectRecord.media.lead : {};
    var posterItem = projectRecord && projectRecord.media && projectRecord.media.poster;
    var alt = sourceCopy.mediaAlt || projectRecord.mediaAlt || '';
    var caption = sourceCopy.mediaCaption || projectRecord.mediaCaption || '';
    var visual = '';
    if (isApprovedVideo(media) && isApprovedImage(posterItem)) {
      visual = '<video controls preload="none" tabindex="0" poster="' + escapeHtml(assetHref(base, posterItem.publicPath)) + '"' +
        ' aria-label="' + escapeHtml(alt) + '"><source src="' + escapeHtml(assetHref(base, media.publicPath)) + '"></video>';
    } else if (isApprovedImage(media)) {
      visual = '<img src="' + escapeHtml(assetHref(base, media.publicPath)) + '" alt="' + escapeHtml(alt) + '" loading="lazy" decoding="async">';
    } else {
      return '';
    }
    return figureHtml(visual, copy.figure + ' 1.', caption, '');
  }

  function caseGalleryHtml(project, locale, base, firstFigureNumber) {
    var normalized = localeOf(locale);
    var copy = pageCopy[normalized];
    var items = (project.media && Array.isArray(project.media.gallery) ? project.media.gallery : []).filter(isApprovedImage);
    if (!items.length) return '';
    var figures = items.map(function (item, offset) {
      var itemCopy = translation(item, normalized);
      var visual = '<img src="' + escapeHtml(assetHref(base, item.publicPath)) + '" alt="' + escapeHtml(itemCopy.alt || project.mediaAlt || '') + '" loading="lazy" decoding="async">';
      return figureHtml(visual, copy.figure + ' ' + (firstFigureNumber + offset) + '.', itemCopy.caption || '', 'sc-figure--gallery');
    }).join('');
    return '<section class="sc-gallery" aria-label="' + escapeHtml(copy.figures) + '"><div class="sc-gallery__grid">' + figures + '</div></section>';
  }

  function capabilityIndexHtml(data, locale) {
    var localized = localizePortfolioData(data, locale);
    return '<p class="sc-capabilities">' + localized.capabilities.map(function (capability) {
      return '<strong>' + escapeHtml(capability.title) + '</strong> (' + capability.methods.map(escapeHtml).join(', ') + ')';
    }).join(' · ') + '</p>';
  }

  function projectLinksInline(project, locale) {
    return (project.links || []).filter(function (link) { return link && isSafeProjectLink(link.href); }).map(function (link) {
      return ' · <a href="' + escapeHtml(link.href) + '" target="_blank" rel="noopener">' + escapeHtml(translatedField(link, 'label', locale)) + '</a>';
    }).join('');
  }

  function projectItemHtml(project, base, isFile, locale, settings) {
    var normalized = localeOf(locale);
    var copy = pageCopy[normalized];
    var href = i18n.routeHref(base, normalized, project.route, Boolean(isFile));
    var thumb = thumbnailItem(project);
    var visual = thumb
      ? '<a class="sc-project__thumb" href="' + escapeHtml(href) + '" tabindex="-1" aria-hidden="true"><img src="' + escapeHtml(assetHref(base, thumb.publicPath)) + '" alt="" loading="lazy" decoding="async"></a>'
      : '';
    var facts = settings.detailed
      ? '<dl class="sc-project__facts">' +
          '<div><dt>' + escapeHtml(copy.problem) + '</dt><dd>' + escapeHtml(project.problem) + '</dd></div>' +
          '<div><dt>' + escapeHtml(copy.personalRole) + '</dt><dd>' + escapeHtml(project.role) + '</dd></div>' +
          '<div><dt>' + escapeHtml(copy.evidence) + '</dt><dd>' + escapeHtml(project.evidence) + '</dd></div>' +
        '</dl>'
      : '';
    var tag = settings.headingTag;
    return '<li class="sc-project' + (thumb ? '' : ' sc-project--text') + '" data-project="' + escapeHtml(project.slug) + '">' + visual +
      '<div class="sc-project__body">' +
        '<' + tag + ' class="sc-project__title"><a href="' + escapeHtml(href) + '">' + escapeHtml(project.title) + '</a></' + tag + '>' +
        '<p class="sc-project__meta">' + escapeHtml(project.period) + ' · ' + escapeHtml(projectStateLabel(project, normalized)) + '</p>' +
        '<p class="sc-project__summary">' + escapeHtml(project.summary) + '</p>' + facts +
        '<p class="sc-project__links"><a href="' + escapeHtml(href) + '">' + escapeHtml(copy.details) + '</a> · <a href="' + escapeHtml(assetHref(base, project.pdf[normalized])) + '">' + escapeHtml(copy.pdf) + '</a>' + projectLinksInline(project, normalized) + '</p>' +
      '</div></li>';
  }

  function projectListHtml(data, base, isFile, locale, settings) {
    var normalized = localeOf(locale);
    var localized = localizePortfolioData(data, normalized);
    var projects = validProjects(data, normalized);
    return localized.tiers.map(function (tier) {
      var tierProjects = projects.filter(function (project) { return project.tier === tier.key; });
      if (!tierProjects.length) return '';
      return '<section class="sc-group" data-tier="' + escapeHtml(tier.key) + '">' +
        '<' + settings.groupHeadingTag + ' class="sc-group__title">' + escapeHtml(tier.label) + '</' + settings.groupHeadingTag + '>' +
        '<ol class="sc-project-list">' + tierProjects.map(function (project) { return projectItemHtml(project, base, isFile, normalized, settings); }).join('') + '</ol>' +
      '</section>';
    }).join('');
  }

  function homeProjectGalleryHtml(data, base, isFile, locale) {
    return projectListHtml(data, base, isFile, locale, { detailed: false, groupHeadingTag: 'h3', headingTag: 'h4' });
  }

  function projectGroupsHtml(data, base, isFile, locale) {
    return projectListHtml(data, base, isFile, locale, { detailed: true, groupHeadingTag: 'h2', headingTag: 'h3' });
  }

  function highlightsHtml(data, locale) {
    var normalized = localeOf(locale);
    var copy = pageCopy[normalized];
    var highlights = data && data.highlights;
    if (!highlights || highlightsErrors(highlights).length) return '';
    function item(entry, withVenue) {
      var entryCopy = translation(entry, normalized);
      var title = escapeHtml(entryCopy.title || '');
      if (entry.href && isSafeProjectLink(entry.href)) title = '<a href="' + escapeHtml(entry.href) + '" target="_blank" rel="noopener">' + title + '</a>';
      var venue = withVenue && entryCopy.venue ? ' <span class="sc-list__venue">' + escapeHtml(entryCopy.venue) + '</span>' : '';
      return '<li><span class="sc-list__year">' + escapeHtml(entry.year) + '</span> ' + title + venue + '</li>';
    }
    function group(title, note, entries, withVenue) {
      return '<section class="sc-highlights__group"><h3>' + escapeHtml(title) + '</h3>' + (note ? '<p class="sc-highlights__note">' + escapeHtml(note) + '</p>' : '') +
        '<ol class="sc-list">' + entries.map(function (entry) { return item(entry, withVenue); }).join('') + '</ol></section>';
    }
    return '<div class="sc-highlights">' +
      group(copy.publications, '', highlights.publications, true) +
      group(copy.patents, copy.patentSummary(highlights.patents.filed, highlights.patents.registered), highlights.patents.items, false) +
      group(copy.awards, '', highlights.awards, false) +
    '</div>';
  }

  function blockHtml(block, locale) {
    var copy = translation(block, locale);
    var heading = escapeHtml(copy.heading || '');
    if (block.type === 'list') {
      return '<div class="sc-block" data-block-type="list"><h3>' + heading + '</h3><ul>' +
        (copy.items || []).map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('') + '</ul></div>';
    }
    return '<div class="sc-block" data-block-type="' + escapeHtml(block.type) + '"><h3>' + heading + '</h3><p>' + escapeHtml(copy.body || '') + '</p></div>';
  }

  function subcasesHtml(project, locale) {
    if (!project.subcases || !project.subcases.length) return '';
    var copy = pageCopy[localeOf(locale)];
    return '<section class="sc-case__section" aria-label="' + escapeHtml(copy.components) + '"><h2>' + escapeHtml(copy.components) + '</h2><ul class="sc-subcases">' + project.subcases.map(function (subcase) {
      var subcaseCopy = translation(subcase, locale);
      return '<li><strong>' + escapeHtml(subcaseCopy.title || '') + '</strong> — ' + escapeHtml(subcaseCopy.summary || '') + '</li>';
    }).join('') + '</ul></section>';
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
    var lead = evidenceMediaHtml(sourceProject, normalized, base, isFile);
    function blocksOfType(types) {
      return types.reduce(function (ordered, type) {
        return ordered.concat(project.blocks.filter(function (block) { return block.type === type; }));
      }, []).map(function (block) { return blockHtml(block, normalized); }).join('');
    }
    return '<article class="sc-case" data-case="' + escapeHtml(project.slug) + '">' +
      '<header class="sc-case__header"><h1>' + title + '</h1>' +
        '<p class="sc-case__meta"><span>' + escapeHtml(project.period) + '</span> · <span>' + escapeHtml(projectStateLabel(project, normalized)) + '</span> · <span>' + project.tech.map(escapeHtml).join(', ') + '</span></p>' +
        '<p class="sc-case__thesis">' + escapeHtml(project.thesis) + '</p></header>' +
      lead +
      '<section class="sc-case__section"><h2>' + escapeHtml(copy.problem) + '</h2><p>' + escapeHtml(project.problem) + '</p></section>' +
      '<section class="sc-case__section"><h2>' + escapeHtml(copy.approach) + '</h2><p>' + escapeHtml(project.summary) + '</p>' + blocksOfType(['system', 'text', 'list']) + '</section>' +
      '<section class="sc-case__section"><h2>' + escapeHtml(copy.personalRole) + '</h2><p>' + escapeHtml(project.role) + '</p></section>' +
      '<section class="sc-case__section"><h2>' + escapeHtml(copy.results) + '</h2><p>' + escapeHtml(project.evidence) + '</p>' + blocksOfType(['evidence']) + '</section>' +
      '<section class="sc-case__section"><h2>' + escapeHtml(copy.limits) + '</h2><p>' + escapeHtml(project.limitation) + '</p><p>' + escapeHtml(project.teamResult) + '</p>' + blocksOfType(['limitation']) + '</section>' +
      caseGalleryHtml(project, normalized, base, lead ? 2 : 1) +
      subcasesHtml(project, normalized) +
      '<p class="sc-case__links"><a href="' + escapeHtml(pdfHref) + '">' + escapeHtml(copy.openPdf) + '</a>' + projectLinksInline(project, normalized) +
        ' · <a href="' + escapeHtml(contactHref) + '">' + escapeHtml(copy.contact) + '</a></p>' +
    '</article>';
  }

  function mountAll(doc, data) {
    if (!doc || typeof doc.querySelectorAll !== 'function') return;
    var body = doc.body;
    var base = body && body.getAttribute ? (body.getAttribute('data-base') || '') : '';
    var locale = localeOf(body && body.getAttribute ? body.getAttribute('data-lang') : 'ko');
    var isFile = Boolean(doc.location && doc.location.protocol === 'file:');
    var mountedSlugs = validProjects(data, locale).map(function (project) { return project.slug; });

    function fill(selector, renderer) {
      Array.prototype.forEach.call(doc.querySelectorAll(selector), function (node) {
        var html = renderer(node);
        if (typeof html === 'string' && html) node.innerHTML = html;
      });
    }

    fill('[data-portfolio="home-projects"]', function () { return homeProjectGalleryHtml(data, base, isFile, locale); });
    fill('[data-portfolio="capability-index"]', function () { return capabilityIndexHtml(data, locale); });
    fill('[data-portfolio="home-highlights"]', function () { return highlightsHtml(data, locale); });
    fill('[data-portfolio="project-groups"]', function () { return projectGroupsHtml(data, base, isFile, locale); });
    fill('[data-portfolio="case-study"]', function (node) {
      var slug = node && node.getAttribute ? node.getAttribute('data-project') : '';
      return mountedSlugs.indexOf(slug) === -1 ? '' : caseStudyHtml(data, slug, base, isFile, locale);
    });
  }

  return {
    policy: policy,
    dataErrors: validatePortfolioData,
    isSafePublicPath: isSafePublicPath,
    localizePortfolioData: localizePortfolioData,
    validatePortfolioData: validatePortfolioData,
    homeProjectGalleryHtml: homeProjectGalleryHtml,
    capabilityIndexHtml: capabilityIndexHtml,
    highlightsHtml: highlightsHtml,
    projectGroupsHtml: projectGroupsHtml,
    evidenceMediaHtml: evidenceMediaHtml,
    caseGalleryHtml: caseGalleryHtml,
    caseStudyHtml: caseStudyHtml,
    mountAll: mountAll
  };
});
