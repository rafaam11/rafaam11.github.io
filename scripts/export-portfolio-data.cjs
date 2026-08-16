#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const portfolio = require('../js/portfolio-data.js');
const validator = require('./validate-portfolio.cjs');

function parseArguments(argv) {
  const options = { output: null };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--output' && argv[index + 1]) {
      options.output = path.resolve(argv[++index]);
      continue;
    }
    throw new Error(`Unknown or incomplete argument: ${argv[index]}`);
  }
  if (!options.output) throw new Error('Required argument: --output <path>');
  return options;
}

function exportData() {
  const cvPath = path.join(root, 'data', 'public-cv.json');
  const cv = JSON.parse(fs.readFileSync(cvPath, 'utf8'));
  const errors = [
    ...validator.portfolioDataErrors(portfolio),
    ...validator.evidenceRegistryErrors(portfolio, root),
    ...validator.publicCvDataErrors(cv)
  ];
  if (errors.length) throw new Error(`Public PDF export rejected:\n- ${errors.join('\n- ')}`);
  const evidence = validator.readEvidenceRegister(root).entries.map((entry) => ({
    id: entry.id,
    project: entry.project,
    type: entry.type,
    state: entry.state,
    source: entry.source,
    note: entry.note
  }));
  return {
    schemaVersion: 1,
    contentVersion: '2026-08-16',
    locales: ['ko', 'en'],
    site: {
      name: 'Jinmin Kim',
      email: 'uiop3847@naver.com',
      portfolio: 'https://rafaam11.github.io',
      github: 'https://github.com/rafaam11',
      linkedin: 'https://www.linkedin.com/in/rlawlsals'
    },
    capabilities: portfolio.capabilities,
    tiers: portfolio.tiers,
    projects: portfolio.projects,
    evidence,
    cv
  };
}

function main(argv) {
  const options = parseArguments(argv);
  const payload = `${JSON.stringify(exportData(), null, 2)}\n`;
  fs.mkdirSync(path.dirname(options.output), { recursive: true });
  fs.writeFileSync(options.output, payload, { encoding: 'utf8', flag: 'w' });
  process.stdout.write(`Exported public portfolio PDF data: ${options.output}\n`);
}

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { exportData, parseArguments };
