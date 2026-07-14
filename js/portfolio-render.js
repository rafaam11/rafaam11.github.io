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
  var prohibitedSharedNames = /Digitrack|DIGITRACK|삼성서울병원|Samsung Medical|KERI|KAERI|HD현대|Hyundai|계명대|동산병원/i;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
    var requiredStrings = ['slug', 'title', 'period', 'status', 'evidenceState', 'primaryCapability', 'problemSummary', 'ownedRole', 'verifiedEvidence'];

    data.projects.forEach(function (project) {
      requiredStrings.forEach(function (field) {
        if (!project[field] || typeof project[field] !== 'string') {
          errors.push(project.slug + ': missing required string ' + field + '.');
        }
      });
      if (seenSlugs[project.slug]) errors.push(project.slug + ': duplicate slug.');
      seenSlugs[project.slug] = true;
      if (capabilityKeys.indexOf(project.primaryCapability) === -1) {
        errors.push(project.slug + ': invalid primary capability.');
      }
      if (evidenceStates.indexOf(project.evidenceState) === -1) {
        errors.push(project.slug + ': invalid evidence state.');
      }
      if (!Array.isArray(project.crossCapabilities) || project.crossCapabilities.some(function (key) { return capabilityKeys.indexOf(key) === -1; })) {
        errors.push(project.slug + ': invalid cross capabilities.');
      }
      if (!Array.isArray(project.tech) || project.tech.length === 0) {
        errors.push(project.slug + ': missing technology list.');
      }
    });

    var serialized = JSON.stringify(data);
    if (/\b(?:30|90|95|100)\s*%/.test(serialized)) errors.push('Shared data contains contribution percentages.');
    if (prohibitedSharedNames.test(serialized)) errors.push('Shared data contains a nonpublic partner name.');
    return errors;
  }

  function directoryHref(prefix, parts, isFile) {
    var cleanPrefix = prefix || '';
    var path = cleanPrefix + parts.join('/') + '/';
    return path + (isFile ? 'index.html' : '');
  }

  function capabilityAtlasHtml(data, base, isFile) {
    return data.capabilities.map(function (capability) {
      var related = data.projects.filter(function (project) {
        return project.primaryCapability === capability.key || project.crossCapabilities.indexOf(capability.key) !== -1;
      });
      var links = related.slice(0, 4).map(function (project) {
        return '<a href="' + escapeHtml(directoryHref(base, ['projects', project.slug], isFile)) + '">' + escapeHtml(project.title) + '</a>';
      }).join('');
      var methods = capability.methods.map(function (method) {
        return '<span>' + escapeHtml(method) + '</span>';
      }).join('');
      return '<article class="capability-card capability-card--' + escapeHtml(capability.key) + '">' +
        '<div class="capability-label">Capability</div>' +
        '<h3>' + escapeHtml(capability.title) + '</h3>' +
        '<p>' + escapeHtml(capability.summary) + '</p>' +
        '<div class="capability-methods" aria-label="Methods">' + methods + '</div>' +
        '<p class="capability-validation"><strong>How I validate</strong> ' + escapeHtml(capability.validation) + '</p>' +
        '<div class="capability-links" aria-label="Related projects">' + links + '</div>' +
      '</article>';
    }).join('');
  }

  function projectChaptersHtml(data, base, isFile) {
    return data.capabilities.map(function (capability) {
      var projects = data.projects.filter(function (project) {
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
          '<div class="project-topline"><span class="status-pill status-pill--' + escapeHtml(project.evidenceState) + '">' + escapeHtml(project.status) + '</span><span>' + escapeHtml(project.period) + '</span></div>' +
          '<h3><a href="' + escapeHtml(directoryHref('', [project.slug], isFile)) + '">' + escapeHtml(project.title) + '</a></h3>' +
          '<p class="project-problem">' + escapeHtml(project.problemSummary) + '</p>' +
          '<p class="project-owned"><strong>Owned</strong> ' + escapeHtml(project.ownedRole) + '</p>' +
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

  function mountAll(doc, data) {
    var errors = validatePortfolioData(data);
    var base = doc.body && doc.body.getAttribute ? (doc.body.getAttribute('data-base') || '') : '';
    var isFile = Boolean(doc.location && doc.location.protocol === 'file:');
    var atlasNodes = doc.querySelectorAll('[data-portfolio="capability-atlas"]');
    var chapterNodes = doc.querySelectorAll('[data-portfolio="project-chapters"]');

    if (errors.length) {
      var errorHtml = '<p class="portfolio-error">Portfolio data could not be rendered. ' + escapeHtml(errors.join(' ')) + '</p>';
      Array.prototype.forEach.call(atlasNodes, function (node) { node.innerHTML = errorHtml; });
      Array.prototype.forEach.call(chapterNodes, function (node) { node.innerHTML = errorHtml; });
      if (typeof console !== 'undefined' && console.error) console.error(errors.join('\n'));
      return;
    }

    Array.prototype.forEach.call(atlasNodes, function (node) {
      node.innerHTML = capabilityAtlasHtml(data, base, isFile);
    });
    Array.prototype.forEach.call(chapterNodes, function (node) {
      node.innerHTML = projectChaptersHtml(data, '', isFile);
    });
  }

  return {
    validatePortfolioData: validatePortfolioData,
    capabilityAtlasHtml: capabilityAtlasHtml,
    projectChaptersHtml: projectChaptersHtml,
    mountAll: mountAll
  };
});
