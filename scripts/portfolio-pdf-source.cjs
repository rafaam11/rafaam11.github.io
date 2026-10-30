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

// Web-only fields never reach the PDFs, so they stay out of the source digest.
const WEB_ONLY_PROJECT_FIELDS = Object.freeze(['scene3d', 'web']);

function pdfProject(project) {
  if (!project || typeof project !== 'object') return project;
  const copy = { ...project };
  for (const field of WEB_ONLY_PROJECT_FIELDS) delete copy[field];
  return copy;
}

// Web-only CV fields: the identity `brief` and each experience area's `rows`/`keywords`
// render only on the CV web page. The CV PDFs are the author's own documents.
const WEB_ONLY_CV_IDENTITY_FIELDS = Object.freeze(['brief']);
const WEB_ONLY_CV_AREA_FIELDS = Object.freeze(['rows', 'keywords']);

function withoutFields(record, fields) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return record;
  const copy = { ...record };
  for (const field of fields) delete copy[field];
  return copy;
}

function withLocalizedCopies(record, fields) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return record;
  const translations = record.translations;
  if (!translations || typeof translations !== 'object' || Array.isArray(translations)) return record;
  return { ...record, translations: Object.fromEntries(Object.entries(translations).map(([locale, copy]) => [locale, withoutFields(copy, fields)])) };
}

function pdfCv(cv) {
  if (!cv || typeof cv !== 'object' || Array.isArray(cv)) return cv;
  const copy = { ...cv };
  if (copy.identity !== undefined) copy.identity = withLocalizedCopies(copy.identity, WEB_ONLY_CV_IDENTITY_FIELDS);
  if (Array.isArray(copy.experience)) {
    copy.experience = copy.experience.map((entry) => {
      if (!entry || typeof entry !== 'object' || !Array.isArray(entry.areas)) return entry;
      return { ...entry, areas: entry.areas.map((area) => withLocalizedCopies(area, WEB_ONLY_CV_AREA_FIELDS)) };
    });
  }
  return copy;
}

function canonicalPdfSource(portfolio, evidence, cv) {
  return {
    schemaVersion: PDF_SOURCE_SCHEMA_VERSION,
    locales: [...PDF_SOURCE_LOCALES],
    site: { ...PDF_SOURCE_SITE },
    capabilities: portfolio.capabilities,
    tiers: portfolio.tiers,
    projects: Array.isArray(portfolio.projects) ? portfolio.projects.map(pdfProject) : portfolio.projects,
    evidence,
    cv: pdfCv(cv)
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
  pdfCv,
  pdfSourceDigest,
  withPdfSourceDigest
};
