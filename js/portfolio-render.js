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
  var tierKeys = ['medical-core', 'platform', 'industrial-spotlight', 'ai-build-lab'];
  var projectSlugs = ['surgical-navigation', 'mandibular-fracture', 'digital-occlusion-workflow', 'life-careverse', 'rtms-navigation', 'respiratory-surface-guidance', 'skadi-tracking-software', 'unmanned-forklift', 'ai-build-lab'];
  var pdfDiagramKindsBySlug = {
    'surgical-navigation': 'system-flow',
    'mandibular-fracture': 'optimization-loop',
    'life-careverse': 'sync-topology',
    'rtms-navigation': 'navigation-loop',
    'respiratory-surface-guidance': 'surface-gating-chain',
    'skadi-tracking-software': 'tracking-sdk-stack',
    'unmanned-forklift': 'sensor-convergence',
    'ai-build-lab': 'product-loop'
  };
  var blockTypes = ['text', 'list', 'system', 'evidence', 'limitation'];
  var storyLayouts = ['wide', 'grid'];
  var storyPlacements = ['before-standard', 'after-standard'];
  var storyMediaTypes = ['image', 'video'];
  var storyDirections = ['forward', 'bidirectional'];
  var storyMediaKeys = ['id', 'poster', 'preload', 'publicPath', 'status', 'translations', 'type', 'videoPolicy'];
  var videoPolicyKeys = [
    'codec', 'height', 'maxBytes', 'requireFastStart', 'requireNoAudio',
    'targetDurationSeconds', 'toleranceSeconds', 'width'
  ];
  var optionalVideoPolicyKeys = ['frameRate', 'pixelFormat'];
  var mediaTypes = ['video', 'image', 'repository', 'publication'];
  var leadMediaTypes = ['video', 'image', 'repository'];
  var referenceMediaTypes = ['repository', 'publication'];
  var caseLayouts = ['standard', 'evidence-first'];
  var architectureStepKeys = ['define', 'open', 'track', 'apply'];
  var architectureStepLabels = ['Define', 'Open', 'Track', 'Apply'];
  var applicationTrackKeys = ['medical', 'industrial'];
  var applicationTrackKinds = ['primary', 'extension'];
  var publicResourceTypes = ['documentation', 'product'];
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
      evidenceGallery: '검증 가능한 증거', architecture: 'Define → Open → Track → Apply', roleAndStability: '내 역할과 API 안정성',
      publicResources: '공개 문서와 제품 정보', ownedRole: '내 역할', teamBoundary: '팀·협력자 경계', evidenceRefs: '연결 근거',
      relatedProjects: '관련 프로젝트',
      contact: '연락처', publications: '논문', patents: '특허', awards: '수상',
      patentSummary: function (filed, registered) { return '출원 ' + filed + '건 · 등록 ' + registered + '건'; }
    },
    en: {
      personalRole: 'My role', teamResult: 'Team result', period: 'Period', technology: 'Technology',
      evidence: 'Evidence', problem: 'Problem', approach: 'Approach', results: 'Results and evidence', limits: 'Limits and team result',
      components: 'Components', details: 'Details', pdf: 'PDF', openPdf: 'Open case PDF', figure: 'Figure', figures: 'Figures',
      evidenceGallery: 'Verifiable evidence', architecture: 'Define → Open → Track → Apply', roleAndStability: 'My role and API stability',
      publicResources: 'Public documentation and product information', ownedRole: 'My role', teamBoundary: 'Team and partner boundary', evidenceRefs: 'Linked evidence',
      relatedProjects: 'Related projects',
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
    (project && project.architectureSteps || []).forEach(function (step) { surfaces.push(step && step.translations); });
    (project && project.applicationTracks || []).forEach(function (track) { surfaces.push(track && track.translations); });
    (project && project.publicResources || []).forEach(function (resource) { surfaces.push(resource && resource.translations); });
    (project && Array.isArray(project.storySections) ? project.storySections : []).forEach(function (section) {
      surfaces.push(section && section.translations, section && section.diagram && section.diagram.translations);
      (section && Array.isArray(section.media) ? section.media : []).forEach(function (item) {
        surfaces.push(item && item.translations, item && item.poster);
      });
      (section && section.diagram && Array.isArray(section.diagram.nodes) ? section.diagram.nodes : []).forEach(function (node) { surfaces.push(node && node.translations); });
      (section && section.diagram && Array.isArray(section.diagram.edges) ? section.diagram.edges : []).forEach(function (edge) { surfaces.push(edge && edge.translations); });
    });
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
    // Highlights only surface `translations` here, not `href` values: an `https://` URL matches
    // the private-path pattern's `[a-z]:[\/]` clause as a false positive. Hrefs are validated separately by `isSafeProjectLink` in `highlightsErrors`.
    var highlights = data && data.highlights;
    if (highlights) {
      (highlights.publications || []).forEach(function (item) { surfaces.push(item && item.translations); });
      (highlights.patents && highlights.patents.items || []).forEach(function (item) { surfaces.push(item && item.translations); });
      (highlights.awards || []).forEach(function (item) { surfaces.push(item && item.translations); });
    }
    return decodedPublicCopy(collectStrings(surfaces, []).join('\n'));
  }

  function publicCopySafetyErrors(data) {
    var copy = portfolioPublicCopy(data);
    var addressCopy = copy.replace(/악안면 30개/g, '악안면 특징점');
    var errors = [];
    if (policy.privateCopyPathPattern.test(copy)) errors.push('Shared public data contains a private source path.');
    if (policy.privateCopyPhonePattern.test(copy)) errors.push('Shared public data contains private phone PII.');
    if (policy.privateCopyAgePattern.test(copy)) errors.push('Shared public data contains private age PII.');
    if (policy.privateCopyAddressPattern.test(addressCopy)) errors.push('Shared public data contains private address PII.');
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
          period: copy.periodLabel || project.period,
          evidenceState: project.evidenceState,
          lifecycleState: project.lifecycleState,
          statusLabel: copy.statusLabel || '',
          route: project.route,
          caseLayout: project.caseLayout,
          capabilityKeys: Array.isArray(project.capabilityKeys) ? project.capabilityKeys.slice() : [],
          tech: Array.isArray(project.tech) ? project.tech.slice() : [],
          media: project.media || {},
          pdf: project.pdf || {},
          blocks: Array.isArray(project.blocks) ? project.blocks.slice() : [],
          storySections: Array.isArray(project.storySections) ? project.storySections.slice() : [],
          relatedProjectSlugs: Array.isArray(project.relatedProjectSlugs) ? project.relatedProjectSlugs.slice() : [],
          subcases: Array.isArray(project.subcases) ? project.subcases.slice() : [],
          links: Array.isArray(project.links) ? project.links.slice() : [],
          title: copy.title || '',
          shortTitle: copy.shortTitle || copy.title || '',
          eyebrow: copy.eyebrow || '',
          thesis: copy.thesis || '',
          summary: copy.summary || '',
          problem: copy.problem || '',
          roleLabel: copy.roleLabel || '',
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
    if (item.preload !== undefined && (item.type !== 'video' || !['none', 'metadata'].includes(item.preload))) {
      errors.push(label + ': preload is allowed only for video as none or metadata.');
    }
    if (item.videoPolicy !== undefined) {
      var policyKeys = item.videoPolicy && typeof item.videoPolicy === 'object' && !Array.isArray(item.videoPolicy)
        ? Object.keys(item.videoPolicy).sort() : [];
      if (item.type !== 'video') errors.push(label + ': videoPolicy is allowed only for video.');
      var missingPolicyKeys = videoPolicyKeys.some(function (key) { return !policyKeys.includes(key); });
      var unknownPolicyKeys = policyKeys.some(function (key) {
        return !videoPolicyKeys.includes(key) && !optionalVideoPolicyKeys.includes(key);
      });
      if (missingPolicyKeys || unknownPolicyKeys) {
        errors.push(label + ': videoPolicy must contain all canonical keys and only supported optional keys.');
      } else {
        var videoPolicy = item.videoPolicy;
        if (videoPolicy.codec !== 'h264') errors.push(label + ': videoPolicy codec must be h264.');
        if (!Number.isInteger(videoPolicy.maxBytes) || videoPolicy.maxBytes < 1 || videoPolicy.maxBytes > 100000000) errors.push(label + ': videoPolicy maxBytes must be an integer from 1 through 100000000.');
        if (!Number.isFinite(videoPolicy.targetDurationSeconds) || videoPolicy.targetDurationSeconds <= 0) errors.push(label + ': videoPolicy targetDurationSeconds must be a finite positive number.');
        if (!Number.isFinite(videoPolicy.toleranceSeconds) || videoPolicy.toleranceSeconds < 0 || videoPolicy.toleranceSeconds > 1) errors.push(label + ': videoPolicy toleranceSeconds must be from 0 through 1.');
        ['width', 'height'].forEach(function (dimension) {
          if (!Number.isInteger(videoPolicy[dimension]) || videoPolicy[dimension] <= 0) errors.push(label + ': videoPolicy ' + dimension + ' must be a positive integer.');
        });
        if (videoPolicy.requireFastStart !== true || videoPolicy.requireNoAudio !== true) errors.push(label + ': videoPolicy requirements must both be true.');
        if (videoPolicy.frameRate !== undefined && (!Number.isInteger(videoPolicy.frameRate) || videoPolicy.frameRate <= 0)) {
          errors.push(label + ': videoPolicy frameRate must be a positive integer.');
        }
        if (videoPolicy.pixelFormat !== undefined && videoPolicy.pixelFormat !== 'yuv420p') {
          errors.push(label + ': videoPolicy pixelFormat must equal yuv420p.');
        }
      }
    }
    return errors;
  }

  function systemFlowDiagramErrors(diagram, label) {
    var errors = [];
    if (!diagram || typeof diagram !== 'object' || Array.isArray(diagram)) return [label + ': system-flow diagram must be an object.'];
    if (JSON.stringify(Object.keys(diagram).sort()) !== JSON.stringify(['boundary', 'edges', 'kind', 'nodes', 'translations'])) {
      errors.push(label + ': system-flow diagram must contain exactly boundary, edges, kind, nodes, and translations.');
    }
    if (diagram.kind !== 'system-flow') errors.push(label + ': diagram kind must be system-flow.');
    if (!['prototype', 'research-validation', 'ownership-boundary'].includes(diagram.boundary)) {
      errors.push(label + ': diagram boundary must be prototype, research-validation, or ownership-boundary.');
    }
    errors = errors.concat(translationErrors(diagram, ['title', 'caption', 'boundaryLabel'], label + ' diagram'));
    if (!Array.isArray(diagram.nodes) || diagram.nodes.length < 2) {
      errors.push(label + ': system-flow diagram requires at least two nodes.');
    }
    var nodeKeys = Array.isArray(diagram.nodes) ? diagram.nodes.map(function (node) { return node && node.key; }) : [];
    if (nodeKeys.some(function (key) { return typeof key !== 'string' || !key; }) || new Set(nodeKeys).size !== nodeKeys.length) {
      errors.push(label + ': system-flow diagram requires uniquely keyed nodes.');
    }
    (Array.isArray(diagram.nodes) ? diagram.nodes : []).forEach(function (node, index) {
      if (!node || typeof node !== 'object' || Array.isArray(node) || JSON.stringify(Object.keys(node).sort()) !== JSON.stringify(['key', 'translations'])) {
        errors.push(label + ': node ' + index + ' must contain exactly key and translations.');
      }
      errors = errors.concat(translationErrors(node, ['label', 'detail'], label + ' node ' + index));
    });
    if (!Array.isArray(diagram.edges) || diagram.edges.length === 0) {
      errors.push(label + ': system-flow diagram requires connected edges.');
    }
    var validEdges = [];
    var seenEdges = [];
    (Array.isArray(diagram.edges) ? diagram.edges : []).forEach(function (edge, index) {
      if (!edge || typeof edge !== 'object' || Array.isArray(edge) || JSON.stringify(Object.keys(edge).sort()) !== JSON.stringify(['direction', 'from', 'to', 'translations'])) {
        errors.push(label + ': edge ' + index + ' must contain exactly direction, from, to, and translations.');
      }
      if (!edge || !nodeKeys.includes(edge.from) || !nodeKeys.includes(edge.to)) {
        errors.push(label + ': edge endpoint must reference a known node.');
      } else if (edge.from === edge.to) {
        errors.push(label + ': edge self reference is not allowed.');
      } else {
        var edgeKey = edge.from + '\u0000' + edge.to;
        if (seenEdges.includes(edgeKey)) errors.push(label + ': duplicate edge is not allowed.');
        seenEdges.push(edgeKey);
        validEdges.push(edge);
      }
      if (!edge || !storyDirections.includes(edge.direction)) errors.push(label + ': edge direction must be forward or bidirectional.');
      errors = errors.concat(translationErrors(edge, ['label'], label + ' edge ' + index));
    });
    if (nodeKeys.length >= 2 && validEdges.length) {
      var neighbours = Object.fromEntries(nodeKeys.map(function (key) { return [key, []]; }));
      var indegree = Object.fromEntries(nodeKeys.map(function (key) { return [key, 0]; }));
      validEdges.forEach(function (edge) {
        neighbours[edge.from].push(edge.to);
        neighbours[edge.to].push(edge.from);
        indegree[edge.to] += 1;
      });
      var connected = [];
      var pending = [nodeKeys[0]];
      while (pending.length) {
        var current = pending.pop();
        if (connected.includes(current)) continue;
        connected.push(current);
        neighbours[current].forEach(function (next) { if (!connected.includes(next)) pending.push(next); });
      }
      if (connected.length !== nodeKeys.length) errors.push(label + ': system-flow diagram edges must connect every node.');

      var roots = nodeKeys.filter(function (key) { return indegree[key] === 0; });
      var processed = 0;
      while (roots.length) {
        var rootKey = roots.pop();
        processed += 1;
        validEdges.filter(function (edge) { return edge.from === rootKey; }).forEach(function (edge) {
          indegree[edge.to] -= 1;
          if (indegree[edge.to] === 0) roots.push(edge.to);
        });
      }
      if (processed !== nodeKeys.length) errors.push(label + ': system-flow diagram edges must remain acyclic.');
    }
    return errors;
  }

  function storySectionsErrors(project, slug) {
    if (project.storySections === undefined) return [];
    if (!Array.isArray(project.storySections) || !project.storySections.length) return [slug + ': storySections must be a non-empty array.'];
    var errors = [];
    var seenSectionKeys = [];
    var seenMediaIds = [];
    var sourceMedia = project.media || {};
    ['lead', 'poster'].forEach(function (slot) {
      if (sourceMedia[slot] && typeof sourceMedia[slot].id === 'string') seenMediaIds.push(sourceMedia[slot].id);
    });
    (Array.isArray(sourceMedia.references) ? sourceMedia.references : []).concat(Array.isArray(sourceMedia.gallery) ? sourceMedia.gallery : []).forEach(function (item) {
      if (item && typeof item.id === 'string') seenMediaIds.push(item.id);
    });
    project.storySections.forEach(function (section, sectionIndex) {
      var label = slug + ' story section ' + sectionIndex;
      if (!section || typeof section !== 'object' || Array.isArray(section)) {
        errors.push(label + ': story section must be an object.');
        return;
      }
      if (typeof section.key !== 'string' || !section.key) errors.push(label + ': story section requires a stable key.');
      if (seenSectionKeys.includes(section.key)) errors.push(label + ': duplicate story section key.');
      seenSectionKeys.push(section.key);
      if (!storyLayouts.includes(section.layout)) errors.push(label + ': unsupported story section layout.');
      if (section.placement !== undefined && !storyPlacements.includes(section.placement)) {
        errors.push(label + ': unsupported story section placement.');
      }
      ['ko', 'en'].forEach(function (locale) {
        var copy = section.translations && section.translations[locale];
        if (!copy || typeof copy.heading !== 'string' || !copy.heading.trim()) errors.push(label + ': missing ' + locale + ' story heading.');
        if (!copy || (!(typeof copy.body === 'string' && copy.body.trim()) &&
            !(Array.isArray(copy.items) && copy.items.length && copy.items.every(function (item) { return typeof item === 'string' && item.trim(); })))) {
          errors.push(label + ': missing ' + locale + ' story body or list copy.');
        }
      });
      if (section.media !== undefined && !Array.isArray(section.media)) {
        errors.push(label + ': story media must be an array.');
      }
      (Array.isArray(section.media) ? section.media : []).forEach(function (item, mediaIndex) {
        var mediaLabel = label + ' media ' + mediaIndex;
        if (!item || typeof item !== 'object' || Array.isArray(item) || Object.keys(item).some(function (key) { return !storyMediaKeys.includes(key); })) {
          errors.push(mediaLabel + ': story media contains an undeclared field.');
        }
        errors = errors.concat(mediaItemErrors(item, mediaLabel, storyMediaTypes));
        errors = errors.concat(translationErrors(item, ['caption', 'alt'], mediaLabel));
        if (item && item.status === 'approved' && (!isSafePublicPath(item.publicPath) || !item.publicPath.startsWith('assets/projects/' + slug + '/'))) {
          errors.push(mediaLabel + ': approved story media requires a repository-relative project path.');
        }
        if (item && typeof item.id === 'string') {
          if (seenMediaIds.includes(item.id)) errors.push(mediaLabel + ': duplicate story media id.');
          seenMediaIds.push(item.id);
        }
        if (item && item.poster !== undefined) {
          var posterLabel = mediaLabel + ' poster';
          errors = errors.concat(mediaItemErrors(item.poster, posterLabel, ['image']));
          if (item.poster && item.poster.status === 'approved' && (!isSafePublicPath(item.poster.publicPath) || !item.poster.publicPath.startsWith('assets/projects/' + slug + '/'))) {
            errors.push(posterLabel + ': approved story poster requires a repository-relative project path.');
          }
          if (item.poster && typeof item.poster.id === 'string') {
            if (seenMediaIds.includes(item.poster.id)) errors.push(posterLabel + ': duplicate story media id.');
            seenMediaIds.push(item.poster.id);
          }
        }
        if (item && item.type === 'video' && item.status === 'approved' && !isApprovedImage(item.poster)) {
          errors.push(mediaLabel + ': approved story video requires an approved image poster.');
        }
      });
      if (section.diagram !== undefined) errors = errors.concat(systemFlowDiagramErrors(section.diagram, label));
    });
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

  function evidenceFirstErrors(project, slug) {
    var errors = [];
    if (project.caseLayout !== undefined && !caseLayouts.includes(project.caseLayout)) {
      errors.push(slug + ': case layout must be standard or evidence-first.');
      return errors;
    }
    if (project.caseLayout !== 'evidence-first') return errors;

    var gallery = project.media && project.media.gallery;
    if (!Array.isArray(gallery) || gallery.length !== 6 || gallery.some(function (item) { return !isApprovedImage(item); })) {
      errors.push(slug + ': evidence-first media gallery requires exactly six approved images.');
    }

    var steps = project.architectureSteps;
    if (!Array.isArray(steps) || steps.length !== architectureStepKeys.length ||
        JSON.stringify(steps.map(function (step) { return step && step.key; })) !== JSON.stringify(architectureStepKeys) ||
        JSON.stringify(steps.map(function (step) { return step && step.label; })) !== JSON.stringify(architectureStepLabels)) {
      errors.push(slug + ': architecture steps must use ordered Define, Open, Track, Apply keys and labels.');
    }
    (Array.isArray(steps) ? steps : []).forEach(function (step, index) {
      var key = architectureStepKeys[index] || (step && step.key) || String(index);
      errors = errors.concat(translationErrors(step, ['description'], slug + ' architecture step ' + key));
    });

    var tracks = project.applicationTracks;
    if (!Array.isArray(tracks) || tracks.length !== applicationTrackKeys.length ||
        JSON.stringify(tracks.map(function (track) { return track && track.key; })) !== JSON.stringify(applicationTrackKeys)) {
      errors.push(slug + ': application tracks must use ordered medical and industrial keys.');
    }
    var approvedGalleryIds = (Array.isArray(gallery) ? gallery : []).filter(isApprovedImage).map(function (item) { return item.id; });
    (Array.isArray(tracks) ? tracks : []).forEach(function (track, index) {
      var key = applicationTrackKeys[index] || (track && track.key) || String(index);
      var label = slug + ' application track ' + key;
      if (!track || !applicationTrackKinds.includes(track.kind) || track.kind !== applicationTrackKinds[index]) {
        errors.push(label + ': kind must be primary or extension in canonical order.');
      }
      var evidenceIds = track && track.evidenceIds;
      if (!Array.isArray(evidenceIds) || evidenceIds.length === 0 || evidenceIds.some(function (id) { return typeof id !== 'string' || !id; })) {
        errors.push(label + ': requires evidence ids.');
      } else {
        if (new Set(evidenceIds).size !== evidenceIds.length) errors.push(label + ': duplicate evidence id.');
        if (evidenceIds.some(function (id) { return !approvedGalleryIds.includes(id); })) {
          errors.push(label + ': evidence ids must reference known approved gallery evidence.');
        }
      }
      errors = errors.concat(translationErrors(track, ['title', 'summary', 'ownedRole', 'teamBoundary'], label));
    });

    var resources = project.publicResources;
    if (!Array.isArray(resources) || resources.length !== 4) {
      errors.push(slug + ': evidence-first case requires exactly four public resources.');
    }
    (Array.isArray(resources) ? resources : []).forEach(function (resource, index) {
      var label = slug + ' public resource ' + index;
      if (!resource || !publicResourceTypes.includes(resource.type)) {
        errors.push(label + ': type must be documentation or product.');
      }
      if (!resource || !isSafeProjectLink(resource.href) || /(?:^|\.)github\.com$/i.test((function () {
        try { return new URL(resource.href).hostname; } catch (_) { return ''; }
      })())) {
        errors.push(label + ': unsafe public resource URL.');
      }
      errors = errors.concat(translationErrors(resource, ['title', 'description'], label));
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

  function resolvedPdfDiagram(project) {
    var contract = project && project.pdfSequence && project.pdfSequence.diagram;
    if (contract && typeof contract.storySectionKey === 'string') {
      var section = (project.storySections || []).find(function (item) {
        return item && item.key === contract.storySectionKey;
      });
      return section && section.diagram ? section.diagram : null;
    }
    return contract || null;
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
      errors.push('Portfolio data must contain exactly four tiers.');
    } else {
      if (JSON.stringify(data.tiers.map(function (tier) { return tier && tier.key; })) !== JSON.stringify(tierKeys)) {
        errors.push('Portfolio tiers must use the known ordered keys.');
      }
      data.tiers.forEach(function (tier) {
        errors = errors.concat(translationErrors(tier, ['label'], tier && tier.key ? tier.key : 'unknown-tier'));
      });
    }

    if (!Array.isArray(data.projects) || data.projects.length !== projectSlugs.length) {
      errors.push('Portfolio data must contain exactly nine projects.');
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
        ['roleLabel', 'periodLabel', 'statusLabel'].forEach(function (field) {
          var declared = ['ko', 'en'].some(function (locale) {
            return project.translations && project.translations[locale] && project.translations[locale][field] !== undefined;
          });
          if (declared) errors = errors.concat(translationErrors(project, [field], slug));
        });
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
        errors = errors.concat(evidenceFirstErrors(project, slug));
        var hasStorySections = Array.isArray(project.storySections) && project.storySections.length > 0;
        var storyErrors = storySectionsErrors(project, slug);
        errors = errors.concat(storyErrors);
        if ((!hasStorySections || storyErrors.length > 0) && (!Array.isArray(project.blocks) || project.blocks.length === 0)) {
          errors.push(slug + ': missing structural blocks.');
        } else if (Array.isArray(project.blocks)) {
          project.blocks.forEach(function (block) { errors = errors.concat(blockErrors(block, slug)); });
        }
        var sequence = project.pdfSequence;
        if (!sequence || typeof sequence !== 'object' || Array.isArray(sequence)) {
          errors.push(slug + ': missing PDF sequence contract.');
        } else {
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
          var diagram = resolvedPdfDiagram(project);
          if (hasStorySections) {
            var storyKeys = project.storySections.map(function (section) { return section && section.key; });
            if (!Array.isArray(sequence.middle) || sequence.middle.length !== 4 ||
                sequence.middle.some(function (key) { return typeof key !== 'string' || !key; }) ||
                new Set(sequence.middle).size !== 4 || sequence.middle.some(function (key) { return !storyKeys.includes(key); })) {
              errors.push(slug + ': story PDF sequence must reference exactly four distinct known story sections.');
            }
            var hasSingularDiagram = sequence.diagram !== undefined;
            var hasDiagramArray = sequence.diagrams !== undefined;
            if (hasSingularDiagram && hasDiagramArray) {
              errors.push(slug + ': story PDF sequence must never declare both diagram and diagrams.');
            }
            var expectedStorySequenceKeys = hasDiagramArray && !hasSingularDiagram
              ? ['diagrams', 'evidenceId', 'figureIds', 'middle']
              : ['diagram', 'evidenceId', 'figureIds', 'middle'];
            if (JSON.stringify(Object.keys(sequence).sort()) !== JSON.stringify(expectedStorySequenceKeys)) {
              errors.push(slug + ': story PDF sequence must contain exactly middle, evidenceId, figureIds, and one of diagram or diagrams.');
            }
            if (!hasSingularDiagram && !hasDiagramArray) {
              errors.push(slug + ': story PDF sequence requires diagram or diagrams.');
            }
            if (hasDiagramArray && (!Array.isArray(sequence.diagrams) || sequence.diagrams.length === 0)) {
              errors.push(slug + ': story PDF sequence diagrams must be a non-empty array.');
            }
            var diagramContracts = hasDiagramArray && Array.isArray(sequence.diagrams)
              ? sequence.diagrams
              : (hasSingularDiagram ? [sequence.diagram] : []);
            var referencedStoryKeys = [];
            diagramContracts.forEach(function (contract, index) {
              var diagramLabel = slug + ' story PDF sequence diagram ' + index;
              if (!contract || typeof contract !== 'object' || Array.isArray(contract) ||
                  JSON.stringify(Object.keys(contract).sort()) !== JSON.stringify(['storySectionKey']) ||
                  typeof contract.storySectionKey !== 'string' || !contract.storySectionKey) {
                errors.push(diagramLabel + ': must contain exactly one storySectionKey.');
                return;
              }
              if (referencedStoryKeys.includes(contract.storySectionKey)) {
                errors.push(slug + ': story PDF sequence contains a duplicate diagram reference.');
              }
              referencedStoryKeys.push(contract.storySectionKey);
              var storySection = project.storySections.find(function (section) {
                return section && section.key === contract.storySectionKey;
              });
              if (!storySection || !storySection.diagram || storySection.diagram.kind !== 'system-flow') {
                errors.push(diagramLabel + ': does not resolve to a known story section containing a system-flow diagram.');
              }
            });
            if (hasSingularDiagram && (!diagram || diagram.kind !== 'system-flow')) {
              errors.push(slug + ': story PDF sequence diagram must resolve to the expected system-flow section.');
            }
            var approvedStoryMediaIds = [];
            project.storySections.forEach(function (section) {
              (Array.isArray(section && section.media) ? section.media : []).forEach(function (item) {
                if ((isApprovedImage(item) || isApprovedVideo(item)) && typeof item.id === 'string') approvedStoryMediaIds.push(item.id);
              });
            });
            if (!Array.isArray(sequence.figureIds) || sequence.figureIds.length < 1 || sequence.figureIds.length > 6 ||
                sequence.figureIds.some(function (id) { return typeof id !== 'string' || !id; }) || new Set(sequence.figureIds).size !== sequence.figureIds.length ||
                sequence.figureIds.some(function (id) { return !approvedStoryMediaIds.includes(id); })) {
              errors.push(slug + ': story PDF sequence figureIds must contain one through six unique approved story media ids.');
            }
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
            if (!diagram || typeof diagram !== 'object' || Array.isArray(diagram)) {
              errors.push(slug + ': missing PDF sequence diagram contract.');
            } else {
            if (JSON.stringify(Object.keys(diagram).sort()) !== JSON.stringify(['kind', 'translations'])) {
              errors.push(slug + ': PDF sequence diagram must contain exactly kind and translations.');
            }
            var expectedLegacyKind = slug === 'surgical-navigation' ? 'coordinate-chain' : pdfDiagramKindsBySlug[slug];
            if (diagram.kind !== expectedLegacyKind) errors.push(slug + ': invalid PDF sequence diagram kind.');
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
          if (!hasStorySections && diagram && typeof diagram.kind === 'string') {
            if (seenPdfDiagramKinds.includes(diagram.kind)) errors.push(slug + ': PDF sequence diagram kind must be unique.');
            seenPdfDiagramKinds.push(diagram.kind);
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
      var canonicalSlugs = data.projects.map(function (project) { return project && project.slug; });
      data.projects.forEach(function (project) {
        if (!project || project.relatedProjectSlugs === undefined) return;
        var slug = project.slug || 'unknown-project';
        if (!Array.isArray(project.relatedProjectSlugs)) {
          errors.push(slug + ': relatedProjectSlugs must be an array.');
          return;
        }
        if (project.relatedProjectSlugs.some(function (relatedSlug) { return typeof relatedSlug !== 'string' || !relatedSlug; })) {
          errors.push(slug + ': related project slugs must be non-empty strings.');
        }
        if (new Set(project.relatedProjectSlugs).size !== project.relatedProjectSlugs.length) {
          errors.push(slug + ': duplicate related project reference.');
        }
        if (project.relatedProjectSlugs.includes(slug)) errors.push(slug + ': related project self reference is not allowed.');
        if (project.relatedProjectSlugs.some(function (relatedSlug) { return !canonicalSlugs.includes(relatedSlug); })) {
          errors.push(slug + ': unknown related project reference.');
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
    if (project && typeof project.statusLabel === 'string' && project.statusLabel.trim()) {
      return project.statusLabel.trim();
    }
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

  function figureHtml(visual, label, caption, extraClass, extraAttributes) {
    return '<figure class="sc-figure' + (extraClass ? ' ' + extraClass : '') + '" data-media-status="approved"' + (extraAttributes || '') + '>' + visual +
      '<figcaption><span class="sc-figure__label">' + escapeHtml(label) + '</span> ' + escapeHtml(caption) + '</figcaption></figure>';
  }

  function mediaPreload(item) {
    return item && item.type === 'video' && item.preload === 'metadata' ? 'metadata' : 'none';
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
      visual = '<video controls preload="' + escapeHtml(mediaPreload(media)) + '" tabindex="0" poster="' + escapeHtml(assetHref(base, posterItem.publicPath)) + '"' +
        ' aria-label="' + escapeHtml(alt) + '"><source src="' + escapeHtml(assetHref(base, media.publicPath)) + '"></video>';
    } else if (isApprovedImage(media)) {
      visual = '<img src="' + escapeHtml(assetHref(base, media.publicPath)) + '" alt="' + escapeHtml(alt) + '" loading="lazy" decoding="async">';
    } else {
      return '';
    }
    return figureHtml(visual, copy.figure + ' 1.', caption, '');
  }

  function storyMediaFigureHtml(item, locale, base, figureNumber) {
    var normalized = localeOf(locale);
    var itemCopy = translation(item, normalized);
    var visual = '';
    if (isApprovedImage(item)) {
      visual = '<img src="' + escapeHtml(assetHref(base, item.publicPath)) + '" alt="' + escapeHtml(itemCopy.alt) + '" loading="lazy" decoding="async">';
    } else if (isApprovedVideo(item) && isApprovedImage(item.poster)) {
      visual = '<video controls preload="' + escapeHtml(mediaPreload(item)) + '" tabindex="0" poster="' +
        escapeHtml(assetHref(base, item.poster.publicPath)) + '" aria-label="' + escapeHtml(itemCopy.alt) + '">' +
        '<source src="' + escapeHtml(assetHref(base, item.publicPath)) + '"></video>';
    } else {
      return '';
    }
    return figureHtml(visual, pageCopy[normalized].figure + ' ' + figureNumber + '.', itemCopy.caption, '');
  }

  function systemFlowLevels(diagram) {
    var nodes = Array.isArray(diagram && diagram.nodes) ? diagram.nodes : [];
    var edges = Array.isArray(diagram && diagram.edges) ? diagram.edges : [];
    var order = new Map(nodes.map(function (node, index) { return [node.key, index]; }));
    var indegree = new Map(nodes.map(function (node) { return [node.key, 0]; }));
    var outgoing = new Map(nodes.map(function (node) { return [node.key, []]; }));
    edges.forEach(function (edge) {
      if (!indegree.has(edge.from) || !indegree.has(edge.to)) return;
      indegree.set(edge.to, indegree.get(edge.to) + 1);
      outgoing.get(edge.from).push(edge.to);
    });
    var levelsByKey = new Map(nodes.map(function (node) { return [node.key, 0]; }));
    var ready = nodes.filter(function (node) { return indegree.get(node.key) === 0; }).map(function (node) { return node.key; });
    var visited = new Set();
    while (ready.length) {
      ready.sort(function (left, right) { return order.get(left) - order.get(right); });
      var key = ready.shift();
      if (visited.has(key)) continue;
      visited.add(key);
      outgoing.get(key).forEach(function (target) {
        levelsByKey.set(target, Math.max(levelsByKey.get(target), levelsByKey.get(key) + 1));
        indegree.set(target, indegree.get(target) - 1);
        if (indegree.get(target) === 0) ready.push(target);
      });
    }
    var fallbackLevel = Math.max(0, ...levelsByKey.values()) + 1;
    nodes.forEach(function (node) {
      if (!visited.has(node.key)) levelsByKey.set(node.key, fallbackLevel);
    });
    var levels = [];
    nodes.forEach(function (node) {
      var level = levelsByKey.get(node.key);
      if (!levels[level]) levels[level] = [];
      levels[level].push(node);
    });
    return levels.filter(Boolean);
  }

  function systemFlowDiagramHtml(diagram, locale, figureNumber) {
    if (!diagram || diagram.kind !== 'system-flow') return '';
    var normalized = localeOf(locale);
    var diagramCopy = translation(diagram, normalized);
    var figureLabel = Number.isInteger(figureNumber)
      ? '<span class="sc-figure__label">' + escapeHtml(pageCopy[normalized].figure + ' ' + figureNumber + '.') + '</span> '
      : '';
    var nodes = diagram.nodes || [];
    var nodeByKey = new Map(nodes.map(function (node) { return [node.key, node]; }));
    var ariaParts = [diagramCopy.title];
    var levels = systemFlowLevels(diagram);
    var levelHtml = levels.map(function (levelNodes, levelIndex) {
      var nodeHtml = levelNodes.map(function (node) {
        var nodeCopy = translation(node, normalized);
        ariaParts.push(nodeCopy.label);
        return '<div class="sc-flow__node" data-node-key="' + escapeHtml(node.key) + '" data-flow-level="' + levelIndex + '"><strong>' +
          escapeHtml(nodeCopy.label) + '</strong><small class="sc-flow__node-detail">' + escapeHtml(nodeCopy.detail) + '</small></div>';
      }).join('');
      return '<div class="sc-flow__level" data-flow-level="' + levelIndex + '">' + nodeHtml + '</div>';
    }).join('');
    var edgeHtml = (diagram.edges || []).map(function (edge) {
      var edgeCopy = translation(edge, normalized);
      var sourceCopy = translation(nodeByKey.get(edge.from), normalized);
      var targetCopy = translation(nodeByKey.get(edge.to), normalized);
      var arrow = edge.direction === 'bidirectional' ? '⇄' : '→';
      ariaParts.push(sourceCopy.label + ' ' + edgeCopy.label + ' ' + targetCopy.label);
      return '<li class="sc-flow__edge" data-from="' + escapeHtml(edge.from) + '" data-to="' + escapeHtml(edge.to) +
        '" data-direction="' + escapeHtml(edge.direction) + '"><span class="sc-flow__edge-endpoints"><span class="sc-flow__edge-from">' +
        escapeHtml(sourceCopy.label) + '</span><span class="sc-flow__arrow" aria-hidden="true">' + arrow +
        '</span><span class="sc-flow__edge-to">' + escapeHtml(targetCopy.label) + '</span></span><small class="sc-flow__edge-label">' +
        escapeHtml(edgeCopy.label) + '</small></li>';
    }).join('');
    ariaParts.push(diagramCopy.boundaryLabel);
    return '<figure class="sc-figure sc-flow-figure"><figcaption>' + figureLabel + '<strong>' + escapeHtml(diagramCopy.title) + '</strong> ' +
      escapeHtml(diagramCopy.caption) + '</figcaption><div class="sc-flow__graph" aria-label="' + escapeHtml(ariaParts.join(', ')) + '"><div class="sc-flow__track sc-flow__levels" style="--sc-flow-level-count:' +
      levels.length + '">' + levelHtml + '</div><ol class="sc-flow__edges">' + edgeHtml + '</ol></div><p class="sc-flow__boundary">' +
      escapeHtml(diagramCopy.boundaryLabel) + '</p></figure>';
  }

  function storyPlacement(section) {
    return section && section.placement ? section.placement : 'before-standard';
  }

  function storySectionsHtml(project, locale, base, firstFigureNumber, placement) {
    var normalized = localeOf(locale);
    var figureNumber = firstFigureNumber;
    var requestedPlacement = storyPlacements.includes(placement) ? placement : 'before-standard';
    var matchingSections = (project.storySections || []).filter(function (section) {
      return storyPlacement(section) === requestedPlacement;
    });
    if (!matchingSections.length) return '';
    var sections = matchingSections.map(function (section) {
      var sectionCopy = translation(section, normalized);
      var copyHtml = '<div class="sc-story__copy"><h2>' + escapeHtml(sectionCopy.heading) + '</h2>';
      if (typeof sectionCopy.body === 'string' && sectionCopy.body) copyHtml += '<p>' + escapeHtml(sectionCopy.body) + '</p>';
      if (Array.isArray(sectionCopy.items) && sectionCopy.items.length) {
        copyHtml += '<ul class="sc-story__list">' + sectionCopy.items.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('') + '</ul>';
      }
      copyHtml += '</div>';
      var mediaHtml = (section.media || []).map(function (item) {
        var html = storyMediaFigureHtml(item, normalized, base, figureNumber);
        if (html) figureNumber += 1;
        return html;
      }).join('');
      var diagramHtml = systemFlowDiagramHtml(section.diagram, normalized, figureNumber);
      if (diagramHtml) figureNumber += 1;
      mediaHtml += diagramHtml;
      return '<section class="sc-story__section sc-story__section--' + escapeHtml(section.layout) + '" data-story-section="' +
        escapeHtml(section.key) + '">' + copyHtml + '<div class="sc-story__media sc-story__media--' + escapeHtml(section.layout) + '">' + mediaHtml + '</div></section>';
    }).join('');
    return '<div class="sc-story">' + sections + '</div>';
  }

  function storyFigureCount(projectRecord, placement) {
    var requestedPlacement = storyPlacements.includes(placement) ? placement : 'before-standard';
    return (projectRecord && Array.isArray(projectRecord.storySections) ? projectRecord.storySections : [])
      .filter(function (section) { return storyPlacement(section) === requestedPlacement; })
      .reduce(function (total, section) {
        var mediaCount = (Array.isArray(section && section.media) ? section.media : []).filter(function (item) {
          return isApprovedImage(item) || isApprovedVideo(item);
        }).length;
        var diagramCount = section && section.diagram && section.diagram.kind === 'system-flow' ? 1 : 0;
        return total + mediaCount + diagramCount;
      }, 0);
  }

  function relatedProjectsHtml(data, project, locale, base, isFile) {
    var normalized = localeOf(locale);
    var relatedSlugs = project && Array.isArray(project.relatedProjectSlugs) ? project.relatedProjectSlugs : [];
    var links = relatedSlugs.map(function (slug) {
      var target = (data && Array.isArray(data.projects) ? data.projects : []).find(function (item) {
        return item && item.slug === slug;
      });
      if (!target) return '';
      var title = translatedField(target, 'title', normalized);
      var href = i18n.routeHref(base, normalized, target.route, Boolean(isFile));
      return '<li><a href="' + escapeHtml(href) + '">' + escapeHtml(title) + '</a></li>';
    }).filter(Boolean).join('');
    if (!links) return '';
    return '<section class="sc-case__section sc-related-projects"><h2>' + escapeHtml(pageCopy[normalized].relatedProjects) +
      '</h2><ul>' + links + '</ul></section>';
  }

  function caseGalleryHtml(project, locale, base, firstFigureNumber, settings) {
    var normalized = localeOf(locale);
    var copy = pageCopy[normalized];
    var options = settings || {};
    var items = (project.media && Array.isArray(project.media.gallery) ? project.media.gallery : []).filter(isApprovedImage);
    if (!items.length) return '';
    var figures = items.map(function (item, offset) {
      var itemCopy = translation(item, normalized);
      var visual = '<img src="' + escapeHtml(assetHref(base, item.publicPath)) + '" alt="' + escapeHtml(itemCopy.alt || project.mediaAlt || '') + '" loading="lazy" decoding="async">';
      var attributes = options.evidenceFirst ? ' id="evidence-' + escapeHtml(item.id) + '" data-evidence-id="' + escapeHtml(item.id) + '"' : '';
      return figureHtml(visual, copy.figure + ' ' + (firstFigureNumber + offset) + '.', itemCopy.caption || '', 'sc-figure--gallery', attributes);
    }).join('');
    var sectionAttributes = options.evidenceFirst ? ' data-evidence-first-section="gallery"' : '';
    var heading = options.evidenceFirst ? '<h2>' + escapeHtml(copy.evidenceGallery) + '</h2>' : '';
    return '<section class="sc-gallery" aria-label="' + escapeHtml(options.evidenceFirst ? copy.evidenceGallery : copy.figures) + '"' + sectionAttributes + '>' + heading + '<div class="sc-gallery__grid">' + figures + '</div></section>';
  }

  function capabilityIndexHtml(data, locale) {
    var localized = localizePortfolioData(data, locale);
    return '<dl class="sc-capabilities">' + localized.capabilities.map(function (capability) {
      return '<div><dt>' + escapeHtml(capability.title) + '</dt><dd>' + capability.methods.map(escapeHtml).join(', ') + '</dd></div>';
    }).join('') + '</dl>';
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

  function evidenceFirstArchitectureHtml(project, sourceProject, locale) {
    var copy = pageCopy[localeOf(locale)];
    var steps = (sourceProject.architectureSteps || []).map(function (step) {
      var stepCopy = translation(step, locale);
      return '<li class="sc-architecture__step" data-step="' + escapeHtml(step.key) + '"><span class="sc-architecture__label">' +
        escapeHtml(step.label) + '</span><p>' + escapeHtml(stepCopy.description || '') + '</p></li>';
    }).join('');
    return '<section class="sc-case__section sc-architecture" data-evidence-first-section="architecture"><h2>' + escapeHtml(copy.architecture) + '</h2>' +
      '<p>' + escapeHtml(project.problem) + '</p><p>' + escapeHtml(project.summary) + '</p><ol class="sc-architecture__steps">' + steps + '</ol></section>';
  }

  function evidenceFirstRoleHtml(project, sourceProject, locale) {
    var copy = pageCopy[localeOf(locale)];
    var details = (sourceProject.blocks || []).filter(function (block) {
      return block.key === 'api-stability' || block.key === 'viewer-delivery';
    }).map(function (block) { return blockHtml(block, locale); }).join('');
    var changeNote = (sourceProject.links || []).filter(function (link) { return link && isSafeProjectLink(link.href); }).map(function (link) {
      return '<p class="sc-change-note"><a href="' + escapeHtml(link.href) + '" target="_blank" rel="noopener">' +
        escapeHtml(translatedField(link, 'label', locale)) + '</a></p>';
    }).join('');
    return '<section class="sc-case__section" data-evidence-first-section="role"><h2>' + escapeHtml(copy.roleAndStability) + '</h2><p>' +
      escapeHtml(project.role) + '</p>' + details + changeNote + '</section>';
  }

  function evidenceFirstTrackHtml(sourceProject, track, locale) {
    var normalized = localeOf(locale);
    var copy = pageCopy[normalized];
    var trackCopy = translation(track, normalized);
    var gallery = sourceProject.media && Array.isArray(sourceProject.media.gallery) ? sourceProject.media.gallery : [];
    var references = (track.evidenceIds || []).map(function (id) {
      var index = gallery.findIndex(function (item) { return item.id === id; });
      return '<a href="#evidence-' + escapeHtml(id) + '">' + escapeHtml(copy.figure + ' ' + (index + 2)) + '</a>';
    }).join(', ');
    return '<section class="sc-case__section sc-application" data-track="' + escapeHtml(track.key) + '" data-track-kind="' + escapeHtml(track.kind) + '">' +
      '<h2>' + escapeHtml(trackCopy.title || '') + '</h2><p>' + escapeHtml(trackCopy.summary || '') + '</p>' +
      '<dl class="sc-application__boundary"><div><dt>' + escapeHtml(copy.ownedRole) + '</dt><dd>' + escapeHtml(trackCopy.ownedRole || '') + '</dd></div>' +
      '<div><dt>' + escapeHtml(copy.teamBoundary) + '</dt><dd>' + escapeHtml(trackCopy.teamBoundary || '') + '</dd></div></dl>' +
      '<p class="sc-application__evidence"><span>' + escapeHtml(copy.evidenceRefs) + ':</span> ' + references + '</p></section>';
  }

  function evidenceFirstResourcesHtml(sourceProject, locale) {
    var copy = pageCopy[localeOf(locale)];
    var resources = (sourceProject.publicResources || []).map(function (resource) {
      var resourceCopy = translation(resource, locale);
      return '<li class="sc-resource-card" data-resource-type="' + escapeHtml(resource.type) + '"><a href="' + escapeHtml(resource.href) +
        '" target="_blank" rel="noopener"><span class="sc-resource-card__type">' + escapeHtml(resource.type) + '</span><strong>' +
        escapeHtml(resourceCopy.title || '') + '</strong><span>' + escapeHtml(resourceCopy.description || '') + '</span></a></li>';
    }).join('');
    return '<section class="sc-case__section" data-evidence-first-section="resources"><h2>' + escapeHtml(copy.publicResources) +
      '</h2><ul class="sc-resource-list">' + resources + '</ul></section>';
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
    var header = '<header class="sc-case__header"><h1>' + title + '</h1>' +
      '<p class="sc-case__meta"><span>' + escapeHtml(project.period) + '</span> · <span>' + escapeHtml(projectStateLabel(project, normalized)) + '</span> · <span>' + project.tech.map(escapeHtml).join(', ') + '</span></p>' +
      '<p class="sc-case__thesis">' + escapeHtml(project.thesis) + '</p></header>';
    var hasStory = Boolean(sourceProject && Array.isArray(sourceProject.storySections) && sourceProject.storySections.length);
    function blocksOfType(types) {
      return types.reduce(function (ordered, type) {
        return ordered.concat(project.blocks.filter(function (block) { return block.type === type; }));
      }, []).map(function (block) { return blockHtml(block, normalized); }).join('');
    }
    if (sourceProject && sourceProject.caseLayout === 'evidence-first') {
      var tracks = (sourceProject.applicationTracks || []).map(function (track) {
        return evidenceFirstTrackHtml(sourceProject, track, normalized);
      }).join('');
      var limitationBlock = (sourceProject.blocks || []).filter(function (block) { return block.key === 'integration-boundary'; })
        .map(function (block) { return blockHtml(block, normalized); }).join('');
      return '<article class="sc-case sc-case--evidence-first" data-case="' + escapeHtml(project.slug) + '" data-case-layout="evidence-first">' +
        header + lead +
        caseGalleryHtml(sourceProject, normalized, base, lead ? 2 : 1, { evidenceFirst: true }) +
        evidenceFirstArchitectureHtml(project, sourceProject, normalized) +
        evidenceFirstRoleHtml(project, sourceProject, normalized) + tracks +
        evidenceFirstResourcesHtml(sourceProject, normalized) +
        '<section class="sc-case__section" data-evidence-first-section="limits"><h2>' + escapeHtml(copy.limits) + '</h2><p>' +
          escapeHtml(project.limitation) + '</p><p>' + escapeHtml(project.teamResult) + '</p>' + limitationBlock + '</section>' +
        '<p class="sc-case__links"><a href="' + escapeHtml(pdfHref) + '">' + escapeHtml(copy.openPdf) + '</a>' +
          ' · <a href="' + escapeHtml(contactHref) + '">' + escapeHtml(copy.contact) + '</a></p></article>';
    }
    var approach = '<section class="sc-case__section"><h2>' + escapeHtml(copy.approach) + '</h2><p>' +
      escapeHtml(project.summary) + '</p>' + blocksOfType(['system', 'text', 'list']) + '</section>';
    var roleLabel = project.roleLabel
      ? '<p class="sc-case__role-label">' + escapeHtml(project.roleLabel) + '</p>'
      : '';
    var problemSection = '<section class="sc-case__section"><h2>' + escapeHtml(copy.problem) + '</h2><p>' + escapeHtml(project.problem) + '</p></section>';
    var roleSection = '<section class="sc-case__section"><h2>' + escapeHtml(copy.personalRole) + '</h2>' + roleLabel + '<p>' + escapeHtml(project.role) + '</p></section>';
    var evidenceSection = '<section class="sc-case__section"><h2>' + escapeHtml(copy.results) + '</h2><p>' + escapeHtml(project.evidence) + '</p>' + blocksOfType(['evidence']) + '</section>';
    var limitSection = '<section class="sc-case__section"><h2>' + escapeHtml(copy.limits) + '</h2><p>' + escapeHtml(project.limitation) + '</p><p>' + escapeHtml(project.teamResult) + '</p>' + blocksOfType(['limitation']) + '</section>';
    var links = '<p class="sc-case__links"><a href="' + escapeHtml(pdfHref) + '">' + escapeHtml(copy.openPdf) + '</a>' + projectLinksInline(project, normalized) +
      ' · <a href="' + escapeHtml(contactHref) + '">' + escapeHtml(copy.contact) + '</a></p>';
    if (hasStory) {
      var firstStoryFigure = lead ? 2 : 1;
      return '<article class="sc-case" data-case="' + escapeHtml(project.slug) + '">' + header + lead + problemSection +
        storySectionsHtml(sourceProject, normalized, base, firstStoryFigure, 'before-standard') +
        roleSection + evidenceSection + limitSection +
        storySectionsHtml(sourceProject, normalized, base,
          firstStoryFigure + storyFigureCount(sourceProject, 'before-standard'), 'after-standard') +
        relatedProjectsHtml(data, sourceProject, normalized, base, isFile) + links + '</article>';
    }
    return '<article class="sc-case" data-case="' + escapeHtml(project.slug) + '">' + header + lead + problemSection + approach +
      roleSection + evidenceSection + limitSection +
      caseGalleryHtml(project, normalized, base, lead ? 2 : 1) +
      subcasesHtml(project, normalized) +
      relatedProjectsHtml(data, sourceProject, normalized, base, isFile) + links + '</article>';
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
    mediaPreload: mediaPreload,
    evidenceMediaHtml: evidenceMediaHtml,
    caseGalleryHtml: caseGalleryHtml,
    storySectionsErrors: storySectionsErrors,
    storySectionsHtml: storySectionsHtml,
    systemFlowDiagramHtml: systemFlowDiagramHtml,
    systemFlowLevels: systemFlowLevels,
    storyFigureCount: storyFigureCount,
    relatedProjectsHtml: relatedProjectsHtml,
    caseStudyHtml: caseStudyHtml,
    mountAll: mountAll
  };
});
