const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const locales = ['ko', 'en'];
const summaryStart = '<!-- PUBLIC CV SUMMARY:START -->';
const summaryEnd = '<!-- PUBLIC CV SUMMARY:END -->';

const publicPiiRules = [
  {
    label: 'phone number',
    pattern: /(?:\+82[\s()./·-]*\(?0?10\)?|\(?010\)?)[\s()./·-]*\d{3,4}[\s()./·-]*\d{4}(?!\d)/i
  },
  {
    label: 'explicit English age',
    pattern: /\b\d{1,3}(?:\s+years?\s+old|[-\s]year[-\s]old)\b/i
  },
  {
    label: 'explicit Korean age',
    pattern: /(?:만\s*)?\d{1,3}\s*세(?![가-힣])/i
  },
  {
    label: 'Korean address',
    pattern: /(?:서울(?:특별시|시)?|부산(?:광역시|시)?|대구(?:광역시|시)?|인천(?:광역시|시)?|광주(?:광역시|시)?|대전(?:광역시|시)?|울산(?:광역시|시)?|세종(?:특별자치시|시)?)\s+[가-힣]{1,12}(?:구|군)(?![가-힣])/i
  },
  {
    label: 'Korean address',
    pattern: /[가-힣]{2,12}(?:특별자치도|도|광역시|특별시)\s+[가-힣]{1,12}(?:시|군|구)(?![가-힣])/i
  },
  {
    label: 'Korean address',
    pattern: /[가-힣]{2,12}(?:시|군|구)\s+[가-힣]{1,12}(?:구|읍|면|동|로|길)(?![가-힣])/i
  },
  {
    label: 'Korean address',
    pattern: /[가-힣]{2,20}(?:읍|면|동|로|길)\s*\d{1,5}(?:-\d{1,5})?(?!\d)/i
  },
  {
    label: 'romanized street address',
    pattern: /\b\d{1,5}(?:-\d{1,5})?\s+[A-Za-z][A-Za-z0-9.'-]*(?:\s+[A-Za-z][A-Za-z0-9.'-]*){0,3}(?:-ro|-gil|\s(?:Road|Rd\.?|Street|St\.?|Avenue|Ave\.?|Boulevard|Blvd\.?|Lane|Ln\.?|Drive|Dr\.?))\s*,\s*[A-Za-z][A-Za-z.'-]*(?:-gu|-gun|-si)\s*,\s*(?:Seoul|Busan|Daegu|Incheon|Gwangju|Daejeon|Ulsan|Sejong|[A-Za-z][A-Za-z.'-]*-do)\b/i
  }
];

function collectStrings(value, output, seen) {
  if (typeof value === 'string') {
    output.push(value);
    return;
  }
  if (!value || (typeof value !== 'object' && typeof value !== 'function')) return;
  if (seen.has(value)) return;
  seen.add(value);
  let keys;
  try {
    keys = Reflect.ownKeys(value);
  } catch {
    return;
  }
  for (const key of keys) {
    if (typeof key === 'string') output.push(key);
    let nested;
    try {
      nested = value[key];
    } catch {
      continue;
    }
    collectStrings(nested, output, seen);
  }
}

function publicPiiFindings(value) {
  const strings = [];
  try {
    collectStrings(value, strings, new WeakSet());
  } catch {
    return [];
  }
  const findings = [];
  for (const text of strings) {
    for (const rule of publicPiiRules) {
      let match;
      try {
        match = text.match(rule.pattern);
      } catch {
        match = null;
      }
      if (match) findings.push(`${rule.label}: ${match[0]}`);
    }
  }
  return [...new Set(findings)];
}

function htmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function canonicalize(value, seen = new WeakSet()) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('Public CV contains a non-finite number.');
    return value;
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) throw new TypeError('Public CV must not contain circular values.');
    seen.add(value);
    const copy = value.map((entry) => canonicalize(entry, seen));
    seen.delete(value);
    return copy;
  }
  if (!value || typeof value !== 'object') throw new TypeError('Public CV contains a non-JSON value.');
  if (seen.has(value)) throw new TypeError('Public CV must not contain circular values.');
  seen.add(value);
  const copy = {};
  for (const key of Object.keys(value).sort()) copy[key] = canonicalize(value[key], seen);
  seen.delete(value);
  return copy;
}

function digest(value) {
  return crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(canonicalize(value)), 'utf8').digest('hex');
}

function requireRecord(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} must be an object.`);
  return value;
}

function requireArray(value, label) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array.`);
  return value;
}

function requireText(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${label} must be a non-empty string.`);
  return value;
}

function localized(record, locale, fields, label) {
  const translations = requireRecord(requireRecord(record, label).translations, `${label} translations`);
  const copy = requireRecord(translations[locale], `${label} ${locale} translation`);
  return Object.fromEntries(fields.map((field) => [field, requireText(copy[field], `${label} ${locale} ${field}`)]));
}

function safePublicHref(value, label, allowMailto = false) {
  const href = requireText(value, label);
  let safe = false;
  if (allowMailto && /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(href)) safe = true;
  if (!safe) {
    try {
      const parsed = new URL(href);
      safe = parsed.protocol === 'https:' && Boolean(parsed.hostname);
    } catch {
      safe = false;
    }
  }
  if (!safe) throw new TypeError(`${label} must use a safe HTTPS or approved mailto link.`);
  return href;
}

function renderPublicCvSummary(cvValue, locale) {
  if (!locales.includes(locale)) throw new TypeError('CV summary locale must be ko or en.');
  const cv = requireRecord(cvValue, 'Public CV');
  const identity = requireRecord(cv.identity, 'Public CV identity');
  const identityCopy = localized(identity, locale, ['displayName', 'headline', 'summary'], 'Public CV identity');
  const timeline = requireArray(cv.timeline, 'Public CV timeline');
  const capabilities = requireArray(cv.capabilities, 'Public CV capabilities');
  const research = requireArray(cv.research, 'Public CV research');
  const achievements = requireRecord(cv.achievements, 'Public CV achievements');
  const selectedAwards = requireArray(achievements.selectedAwards, 'Public CV selected awards');
  const languages = requireArray(cv.languages, 'Public CV languages');
  const contacts = requireArray(cv.contacts, 'Public CV contacts');
  const sourceDigest = digest(cv);
  const copy = locale === 'ko' ? {
    kicker: 'HTML 요약',
    titleSuffix: '공개 경력 요약',
    timeline: '경력 및 학력',
    capabilities: '구현 기반 역량',
    evidence: '연구 및 공개 근거',
    achievements: '성과 신호와 해석 경계',
    contacts: '공개 연락처',
    patents: '특허',
    awards: '수상',
    languages: '언어',
    selectedAwards: '대표 수상',
    patentValue: `${achievements.patentApplications}건 출원 · ${achievements.patentGrants}건 등록`,
    awardValue: `총 ${achievements.awardTotal}건`,
    signalSummary: `공개 누적 신호: 특허 출원 ${achievements.patentApplications}건 · 등록 ${achievements.patentGrants}건 · 수상 ${achievements.awardTotal}건`,
    boundary: '승인된 공개 누적 신호이며, 단독 소유나 개별 프로젝트 효과를 주장하지 않습니다.',
    roleSuffix: (role) => role === 'Joint first author' ? 'Joint first author · 공동 제1저자' : role === 'International conference presentation' ? 'International conference presentation · 국제학회 발표' : role
  } : {
    kicker: 'HTML SUMMARY',
    titleSuffix: 'Public career summary',
    timeline: 'Experience and education',
    capabilities: 'Implementation-based capabilities',
    evidence: 'Research and public evidence',
    achievements: 'Achievement signals and boundary',
    contacts: 'Public contacts',
    patents: 'Patents',
    awards: 'Awards',
    languages: 'Languages',
    selectedAwards: 'Selected awards',
    patentValue: `${achievements.patentApplications} applications · ${achievements.patentGrants} grants`,
    awardValue: `${achievements.awardTotal} awards`,
    signalSummary: `Public cumulative signals: ${achievements.patentApplications} applications · ${achievements.patentGrants} grants · ${achievements.awardTotal} awards`,
    boundary: 'These are approved public cumulative signals, not claims of sole ownership or project-level effect.',
    roleSuffix: (role) => role
  };

  const timelineHtml = timeline.map((entry, index) => {
    const record = requireRecord(entry, `Public CV timeline entry ${index + 1}`);
    const entryCopy = localized(record, locale, ['role', 'summary'], `Public CV timeline entry ${index + 1}`);
    return `          <li><time>${htmlEscape(requireText(record.period, `Public CV timeline entry ${index + 1} period`))}</time><strong>${htmlEscape(requireText(record.organization, `Public CV timeline entry ${index + 1} organization`))}</strong><span>${htmlEscape(entryCopy.role)} · ${htmlEscape(entryCopy.summary)}</span></li>`;
  }).join('\n');
  const capabilityHtml = capabilities.map((entry, index) => {
    const entryCopy = localized(entry, locale, ['title', 'body'], `Public CV capability ${index + 1}`);
    return `          <li><strong>${htmlEscape(entryCopy.title)}</strong><span>${htmlEscape(entryCopy.body)}</span></li>`;
  }).join('\n');
  const researchHtml = research.map((entry, index) => {
    const record = requireRecord(entry, `Public CV research entry ${index + 1}`);
    const title = htmlEscape(requireText(record.title, `Public CV research entry ${index + 1} title`));
    const titleHtml = record.href === undefined
      ? `<strong>${title}</strong>`
      : `<a href="${htmlEscape(safePublicHref(record.href, `Public CV research entry ${index + 1} href`))}" target="_blank" rel="noopener">${title}</a>`;
    return `          <li><time>${htmlEscape(requireText(record.year, `Public CV research entry ${index + 1} year`))}</time>${titleHtml}<span>${htmlEscape(requireText(record.venue, `Public CV research entry ${index + 1} venue`))} · ${htmlEscape(copy.roleSuffix(requireText(record.role, `Public CV research entry ${index + 1} role`)))}</span></li>`;
  }).join('\n');
  const languageHtml = languages.map((entry, index) => {
    const record = requireRecord(entry, `Public CV language ${index + 1}`);
    const translations = requireRecord(record.translations, `Public CV language ${index + 1} translations`);
    return htmlEscape(requireText(translations[locale], `Public CV language ${index + 1} ${locale}`));
  }).join(' · ');
  const awardHtml = selectedAwards.map((entry, index) => {
    const record = requireRecord(entry, `Public CV selected award ${index + 1}`);
    const translations = requireRecord(record.translations, `Public CV selected award ${index + 1} translations`);
    return `          <li><time>${htmlEscape(requireText(record.year, `Public CV selected award ${index + 1} year`))}</time><span>${htmlEscape(requireText(translations[locale], `Public CV selected award ${index + 1} ${locale}`))}</span></li>`;
  }).join('\n');
  const contactHtml = contacts.map((entry, index) => {
    const record = requireRecord(entry, `Public CV contact ${index + 1}`);
    const label = requireText(record.label, `Public CV contact ${index + 1} label`);
    const href = safePublicHref(record.href, `Public CV contact ${index + 1} href`, true);
    return `        <li><a href="${htmlEscape(href)}">${htmlEscape(label)}: ${htmlEscape(requireText(record.value, `Public CV contact ${index + 1} value`))}</a></li>`;
  }).join('\n');

  const body = `  <div class="td-section-heading">
    <p class="hero-kicker">${copy.kicker}</p>
    <h2 id="cv-summary-title">${htmlEscape(identityCopy.displayName)} · ${copy.titleSuffix}</h2>
    <p><strong>${htmlEscape(identityCopy.headline)}</strong><span> · ${htmlEscape(identityCopy.summary)}</span></p>
    <address class="td-cv-summary-contacts" aria-label="${htmlEscape(copy.contacts)}">
      <ul>
${contactHtml}
      </ul>
    </address>
  </div>
  <div class="td-cv-summary-grid">
    <section data-cv-section="timeline" aria-labelledby="cv-timeline-title">
      <h3 id="cv-timeline-title">${copy.timeline}</h3>
      <ol>
${timelineHtml}
      </ol>
    </section>
    <section data-cv-section="capabilities" aria-labelledby="cv-capabilities-title">
      <h3 id="cv-capabilities-title">${copy.capabilities}</h3>
      <ul>
${capabilityHtml}
      </ul>
    </section>
    <section data-cv-section="evidence" aria-labelledby="cv-evidence-title">
      <h3 id="cv-evidence-title">${copy.evidence}</h3>
      <ol>
${researchHtml}
      </ol>
    </section>
    <section data-cv-section="achievements" aria-labelledby="cv-achievements-title">
      <h3 id="cv-achievements-title">${copy.achievements}</h3>
      <p>${copy.signalSummary}</p>
      <dl>
        <div><dt>${copy.patents}</dt><dd>${copy.patentValue}</dd></div>
        <div><dt>${copy.awards}</dt><dd>${copy.awardValue}</dd></div>
        <div><dt>${copy.languages}</dt><dd>${languageHtml}</dd></div>
      </dl>
      <h4>${copy.selectedAwards}</h4>
      <ul>
${awardHtml}
      </ul>
      <p>${copy.boundary}</p>
    </section>
  </div>`;
  const summaryDigest = digest(`${locale}\n${sourceDigest}\n${body}`);
  const html = `<section class="td-cv-summary" data-cv-summary data-cv-source-digest="${sourceDigest}" data-cv-summary-digest="${summaryDigest}" aria-labelledby="cv-summary-title">\n${body}\n</section>`;
  const envelope = `${' '.repeat(4)}${summaryStart}\n${html.split('\n').map((line) => `${' '.repeat(4)}${line}`).join('\n')}\n${' '.repeat(4)}${summaryEnd}`;
  return { html, envelope, sourceDigest, summaryDigest };
}

function extractPublicCvSummary(htmlValue) {
  if (typeof htmlValue !== 'string') return null;
  const start = htmlValue.indexOf(`${' '.repeat(4)}${summaryStart}`);
  if (start === -1) return null;
  const endMarker = `${' '.repeat(4)}${summaryEnd}`;
  const end = htmlValue.indexOf(endMarker, start);
  if (end === -1) return null;
  return htmlValue.slice(start, end + endMarker.length);
}

function refreshCvSummaries(rootDir) {
  const resolvedRoot = path.resolve(rootDir);
  const cv = JSON.parse(fs.readFileSync(path.join(resolvedRoot, 'data', 'public-cv.json'), 'utf8'));
  const results = [];
  for (const locale of locales) {
    const filePath = path.join(resolvedRoot, locale === 'ko' ? path.join('cv', 'index.html') : path.join('en', 'cv', 'index.html'));
    const before = fs.readFileSync(filePath, 'utf8');
    const current = extractPublicCvSummary(before);
    if (!current) throw new Error(`${path.relative(resolvedRoot, filePath)} is missing the public CV summary markers.`);
    const expected = renderPublicCvSummary(cv, locale).envelope;
    const after = before.slice(0, before.indexOf(current)) + expected + before.slice(before.indexOf(current) + current.length);
    fs.writeFileSync(filePath, after, 'utf8');
    results.push({ locale, file: path.relative(resolvedRoot, filePath), changed: before !== after });
  }
  return results;
}

function main(argv) {
  let rootDir = path.resolve(__dirname, '..');
  let write = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--root') rootDir = path.resolve(argv[++index] || '');
    else if (argument === '--write') write = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!write) throw new Error('Use --write to refresh the canonical KO/EN CV summaries.');
  const results = refreshCvSummaries(rootDir);
  process.stdout.write(`Public CV summaries refreshed: ${results.map((result) => `${result.locale}:${result.changed ? 'updated' : 'unchanged'}`).join(', ')}.\n`);
}

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`Public CV summary refresh failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  extractPublicCvSummary,
  htmlEscape,
  publicPiiFindings,
  refreshCvSummaries,
  renderPublicCvSummary
};
