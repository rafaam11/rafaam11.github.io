const fs = require('node:fs');
const path = require('node:path');

const data = require('../js/portfolio-data.js');
const render = require('../js/portfolio-render.js');

const contributionPattern = render.policy.contributionPercentagePattern;
const privatePartnerPattern = render.policy.prohibitedPartnerPattern;

function publicPortfolioFiles(rootDir) {
  return [
    'index.html',
    'projects/index.html',
    'research/index.html',
    'contact/index.html'
  ].concat(data.projects.map((project) => `projects/${project.slug}/index.html`))
    .map((relativePath) => ({ relativePath, absolutePath: path.join(rootDir, relativePath) }));
}

function validatePortfolio(rootDir) {
  const errors = render.validatePortfolioData(data).slice();

  for (const project of data.projects) {
    const relativePath = `projects/${project.slug}/index.html`;
    if (!fs.existsSync(path.join(rootDir, relativePath))) {
      errors.push(`${relativePath}: missing project detail page.`);
    }
  }

  for (const file of publicPortfolioFiles(rootDir)) {
    if (!fs.existsSync(file.absolutePath)) {
      errors.push(`${file.relativePath}: missing public page.`);
      continue;
    }
    const html = fs.readFileSync(file.absolutePath, 'utf8');
    if (contributionPattern.test(html)) {
      errors.push(`${file.relativePath}: contains a contribution percentage.`);
    }
    if (privatePartnerPattern.test(html)) {
      errors.push(`${file.relativePath}: contains a nonpublic partner or company-project name.`);
    }
  }

  return errors;
}

if (require.main === module) {
  const rootDir = path.join(__dirname, '..');
  const errors = validatePortfolio(rootDir);
  if (errors.length) {
    for (const error of errors) process.stderr.write(`- ${error}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`Portfolio validation passed: ${data.projects.length} projects, ${data.capabilities.length} capabilities.\n`);
  }
}

module.exports = { publicPortfolioFiles, validatePortfolio };
