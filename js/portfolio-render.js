(function (root, factory) {
  var value = factory();
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
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var evidenceStates = ['verified', 'ongoing', 'expected', 'research', 'completed'];
  var policy = {
    prohibitedPartnerPattern: /Digitrack|삼성서울병원|Samsung Medical|\b(?:KERI|KAERI|ANL|SNU|ETRI)\b|HD현대|Hyundai|계명대|동산병원|Genoray|제노레이|Megagen|메가젠|Hallym|한림|Argonne|서울대학교|서울대/i,
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

  function projectValidationErrors(project, capabilityKeys) {
    var errors = [];
    var slug = project && project.slug ? project.slug : 'unknown-project';
    var requiredStrings = ['slug', 'title', 'period', 'status', 'evidenceState', 'primaryCapability', 'problemSummary', 'ownedRole', 'verifiedEvidence'];
    if (!project || typeof project !== 'object') return [slug + ': project record must be an object.'];
    requiredStrings.forEach(function (field) {
      if (!project[field] || typeof project[field] !== 'string') errors.push(slug + ': missing required string ' + field + '.');
    });
    if (capabilityKeys.indexOf(project.primaryCapability) === -1) errors.push(slug + ': invalid primary capability.');
    if (evidenceStates.indexOf(project.evidenceState) === -1) errors.push(slug + ': invalid evidence state.');
    if (!Array.isArray(project.crossCapabilities) || project.crossCapabilities.some(function (key) { return capabilityKeys.indexOf(key) === -1; })) {
      errors.push(slug + ': invalid cross capabilities.');
    }
    if (!Array.isArray(project.tech) || project.tech.length === 0) errors.push(slug + ': missing technology list.');
    var serialized = JSON.stringify(project);
    if (policy.contributionPercentagePattern.test(serialized)) errors.push(slug + ': contains a contribution percentage.');
    if (policy.prohibitedPartnerPattern.test(serialized)) errors.push(slug + ': contains a nonpublic partner name.');
    return errors;
  }

  function validProjects(data) {
    if (!data || !Array.isArray(data.capabilities) || !Array.isArray(data.projects)) return [];
    var capabilityKeys = data.capabilities.map(function (capability) { return capability.key; });
    return data.projects.filter(function (project) { return projectValidationErrors(project, capabilityKeys).length === 0; });
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
    if (!Array.isArray(data.projects) || data.projects.length !== 12) {
      errors.push('Portfolio data must contain exactly twelve projects.');
      return errors;
    }

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

  function directoryHref(prefix, parts, isFile) {
    var cleanPrefix = prefix || '';
    var path = cleanPrefix + parts.join('/') + '/';
    return path + (isFile ? 'index.html' : '');
  }

  function capabilityAtlasHtml(data, base, isFile) {
    var projects = validProjects(data);
    return data.capabilities.map(function (capability, capabilityIndex) {
      var related = projects.filter(function (project) {
        return project.primaryCapability === capability.key || project.crossCapabilities.indexOf(capability.key) !== -1;
      });
      var links = related.slice(0, 4).map(function (project) {
        return '<a href="' + escapeHtml(directoryHref(base, ['projects', project.slug], isFile)) + '">' + escapeHtml(project.title) + '</a>';
      }).join('');
      var methods = capability.methods.map(function (method) {
        return '<span>' + escapeHtml(method) + '</span>';
      }).join('');
      return '<article class="capability-card capability-card--' + escapeHtml(capability.key) + '">' +
        '<span class="capability-number">0' + (capabilityIndex + 1) + '</span>' +
        '<div class="capability-label">Capability</div>' +
        '<h3>' + escapeHtml(capability.title) + '</h3>' +
        '<p>' + escapeHtml(capability.summary) + '</p>' +
        '<div class="capability-methods" aria-label="Methods">' + methods + '</div>' +
        '<p class="capability-validation"><strong>How I validate</strong> ' + escapeHtml(capability.validation) + '</p>' +
        '<div class="capability-links" aria-label="Related projects">' + links + '</div>' +
        '<span class="capability-meta">' + related.length + ' related project' + (related.length === 1 ? '' : 's') + '</span>' +
      '</article>';
    }).join('');
  }

  function projectChaptersHtml(data, base, isFile) {
    var valid = validProjects(data);
    return data.capabilities.map(function (capability) {
      var projects = valid.filter(function (project) {
        return project.primaryCapability === capability.key;
      });
      var cards = projects.map(function (project) {
        var crossLabels = project.crossCapabilities.map(function (key) {
          var match = data.capabilities.find(function (capabilityItem) { return capabilityItem.key === key; });
          return match ? match.title : key;
        });
        var tags = [capability.title].concat(crossLabels).map(function (label) {
          return '<span>' + escapeHtml(label) + '</span>';
        }).join('');
        return '<article class="project-card">' +
          '<div class="project-topline"><span class="status-pill status-pill--' + escapeHtml(project.evidenceState) + '" data-state="' + escapeHtml(project.evidenceState) + '">' + escapeHtml(project.status) + '</span><span class="project-period">' + escapeHtml(project.period) + '</span></div>' +
          '<h3><a href="' + escapeHtml(directoryHref('', [project.slug], isFile)) + '">' + escapeHtml(project.title) + '</a></h3>' +
          '<p class="project-problem">' + escapeHtml(project.problemSummary) + '</p>' +
          '<p class="project-owned project-role"><strong>Owned</strong> ' + escapeHtml(project.ownedRole) + '</p>' +
          '<p class="project-evidence"><strong>Evidence</strong> ' + escapeHtml(project.verifiedEvidence) + '</p>' +
          '<div class="project-tags">' + tags + '</div>' +
        '</article>';
      }).join('');
      return '<section class="project-chapter" id="capability-' + escapeHtml(capability.key) + '">' +
        '<header class="chapter-heading"><div><span>Capability chapter</span><h2>' + escapeHtml(capability.title) + '</h2></div><span class="chapter-count">' + projects.length + ' project' + (projects.length === 1 ? '' : 's') + '</span></header>' +
        '<p class="chapter-summary">' + escapeHtml(capability.summary) + '</p>' +
        '<div class="project-grid">' + cards + '</div>' +
      '</section>';
    }).join('');
  }

  function capabilityDetailsHtml(data, base, isFile) {
    var projects = validProjects(data);
    return data.capabilities.map(function (capability, index) {
      var related = projects.filter(function (project) {
        return project.primaryCapability === capability.key || project.crossCapabilities.indexOf(capability.key) !== -1;
      });
      var methods = capability.methods.map(function (method) { return '<span>' + escapeHtml(method) + '</span>'; }).join('');
      var links = related.map(function (project) {
        return '<a href="' + escapeHtml(directoryHref(base, ['projects', project.slug], isFile)) + '">' + escapeHtml(project.title) + '</a>';
      }).join(' · ');
      return '<section class="capability-detail" id="' + escapeHtml(capability.key) + '">' +
        '<div class="capability-detail-heading"><span class="capability-index">0' + (index + 1) + '</span><div><p>Transferable capability</p><h2>' + escapeHtml(capability.title) + '</h2></div></div>' +
        '<div class="capability-detail-grid"><div><h3>What I solve</h3><p>' + escapeHtml(capability.summary) + '</p></div>' +
        '<div><h3>How I validate</h3><p>' + escapeHtml(capability.validation) + '</p></div></div>' +
        '<div class="capability-methods capability-detail-methods" aria-label="Methods">' + methods + '</div>' +
        '<p class="evidence-links"><strong>Evidence:</strong> ' + links + '</p></section>';
    }).join('');
  }

  function mountAll(doc, data) {
    var errors = validatePortfolioData(data);
    var base = doc.body && doc.body.getAttribute ? (doc.body.getAttribute('data-base') || '') : '';
    var isFile = Boolean(doc.location && doc.location.protocol === 'file:');
    var atlasNodes = doc.querySelectorAll('[data-portfolio="capability-atlas"]');
    var chapterNodes = doc.querySelectorAll('[data-portfolio="project-chapters"]');
    var detailNodes = doc.querySelectorAll('[data-portfolio="capability-details"]');

    var fatal = !data || !Array.isArray(data.capabilities) || data.capabilities.length !== 5 || !Array.isArray(data.projects);
    if (fatal || validProjects(data).length === 0) {
      var errorHtml = '<p class="portfolio-error">Portfolio data could not be rendered. ' + escapeHtml(errors.join(' ')) + '</p>';
      Array.prototype.forEach.call(atlasNodes, function (node) { node.innerHTML = errorHtml; });
      Array.prototype.forEach.call(chapterNodes, function (node) { node.innerHTML = errorHtml; });
      Array.prototype.forEach.call(detailNodes, function (node) { node.innerHTML = errorHtml; });
      if (typeof console !== 'undefined' && console.error) console.error(errors.join('\n'));
      return;
    }

    if (errors.length && typeof console !== 'undefined' && console.warn) console.warn(errors.join('\n'));

    Array.prototype.forEach.call(atlasNodes, function (node) {
      node.innerHTML = capabilityAtlasHtml(data, base, isFile);
    });
    Array.prototype.forEach.call(chapterNodes, function (node) {
      node.innerHTML = projectChaptersHtml(data, '', isFile);
    });
    Array.prototype.forEach.call(detailNodes, function (node) {
      node.innerHTML = capabilityDetailsHtml(data, base, isFile);
    });
  }

  return {
    policy: policy,
    validatePortfolioData: validatePortfolioData,
    capabilityAtlasHtml: capabilityAtlasHtml,
    projectChaptersHtml: projectChaptersHtml,
    capabilityDetailsHtml: capabilityDetailsHtml,
    mountAll: mountAll
  };
});
