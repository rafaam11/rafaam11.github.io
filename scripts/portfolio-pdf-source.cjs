'use strict';

const crypto = require('node:crypto');

const PDF_SOURCE_SCHEMA_VERSION = 1;
const PDF_SOURCE_LOCALES = Object.freeze(['ko', 'en']);
const PDF_SOURCE_SITE = Object.freeze({
  name: 'Jinmin Kim',
  email: 'uiop3847@naver.com',
  portfolio: 'https://rafaam11.github.io',
  github: 'https://github.com/rafaam11',
  linkedin: 'https://www.linkedin.com/in/rlawlsals'
});

function canonicalPdfSource(portfolio, evidence, cv) {
  return {
    schemaVersion: PDF_SOURCE_SCHEMA_VERSION,
    locales: [...PDF_SOURCE_LOCALES],
    site: { ...PDF_SOURCE_SITE },
    capabilities: portfolio.capabilities,
    tiers: portfolio.tiers,
    projects: portfolio.projects,
    evidence,
    cv
  };
}

function pdfSourceDigest(source) {
  return crypto.createHash('sha256').update(JSON.stringify(source), 'utf8').digest('hex');
}

function withPdfSourceDigest(source) {
  return { ...source, sourceDigest: pdfSourceDigest(source) };
}

module.exports = {
  PDF_SOURCE_SCHEMA_VERSION,
  PDF_SOURCE_LOCALES,
  PDF_SOURCE_SITE,
  canonicalPdfSource,
  pdfSourceDigest,
  withPdfSourceDigest
};
