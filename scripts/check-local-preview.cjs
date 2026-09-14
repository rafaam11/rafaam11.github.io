// Read-only route/reference smoke. This is not a substitute for visual browser QA.
const fs = require('node:fs');
const { pathToFileURL, fileURLToPath } = require('node:url');
const path = require('node:path');
const validator = require('./validate-portfolio.cjs');
const renderer = require('../js/portfolio-render.js');
const nav = require('../js/nav.js');
const data = require('../js/portfolio-data.js');

async function main() {
  const root = path.resolve(__dirname, '..');
  const origin = process.argv[2] || 'http://127.0.0.1:8000/';
  const resources = new Set();
  let fileReferences = 0;
  for (const page of validator.publicPortfolioFiles(root)) {
    const source = fs.readFileSync(page.absolutePath, 'utf8');
    const base = source.match(/data-base="([^"]*)"/)[1];
    let runtime = nav.navigationHtml({base, current: page.page, locale: page.locale, route: page.route, isFile: true});
    if (page.route.startsWith('projects/') && page.route !== 'projects/') runtime += renderer.caseStudyHtml(data, page.route.split('/')[1], base, true, page.locale);
    const documentUrl = pathToFileURL(page.absolutePath);
    resources.add(new URL(page.relativePath, origin).href);
    for (const {value} of validator.htmlReferences(source + runtime)) {
      if (/^(?:https?:|mailto:|data:|#)/i.test(value)) continue;
      const url = new URL(value.replaceAll('&amp;', '&'), documentUrl);
      const target = fileURLToPath(url);
      if (!fs.existsSync(target) || !fs.statSync(target).isFile()) throw new Error(`${page.relativePath}: unresolved file reference ${value}`);
      fileReferences++;
      resources.add(new URL(path.relative(root, target).replaceAll('\\', '/'), origin).href);
    }
  }
  for (const url of resources) {
    const response = await fetch(url, {method: 'HEAD'});
    if (!response.ok) throw new Error(`${response.status}: ${url}`);
  }
  console.log(`Preview smoke passed: 28 routes, ${fileReferences} file URL references, ${resources.size} HTTP resources. Visual layout is not tested.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
