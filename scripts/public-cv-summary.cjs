const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const locales = ['ko', 'en'];
const summaryStart = '<!-- PUBLIC CV SUMMARY:START -->';
const summaryEnd = '<!-- PUBLIC CV SUMMARY:END -->';
const htmlEntityMap = {
  amp: '&',
  apos: "'",
  bsol: '\\',
  centerdot: '·',
  colon: ':',
  comma: ',',
  dash: '-',
  emsp: ' ',
  ensp: ' ',
  gt: '>',
  hairsp: ' ',
  hyphen: '-',
  lpar: '(',
  lt: '<',
  mdash: '-',
  middot: '·',
  minus: '-',
  nbsp: '\u00a0',
  ndash: '-',
  newline: '\n',
  period: '.',
  plus: '+',
  quot: '"',
  rpar: ')',
  semi: ';',
  sol: '/',
  tab: '\t',
  thinsp: ' '
};
const knownHtmlEntityPattern = new RegExp(`&(${Object.keys(htmlEntityMap).sort((left, right) => right.length - left.length).join('|')});?`, 'gi');

const publicPiiRules = [
  {
    label: 'phone number',
    // The leading lookbehind keeps KIPO patent numbers (10-2019-0100328) from reading as 010-xxxx-xxxx.
    pattern: /(?<![\d-])(?:\+82[\s()./·-]*\(?0?10\)?|\(?010\)?)[\s()./·-]*\d{3,4}[\s()./·-]*\d{4}(?!\d)/i
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

function normalizePublicSeparators(value) {
  return value
    .replace(/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g, ' ')
    .replace(/[\u200b-\u200d\u2060\ufeff]/g, '')
    .replace(/[\u058a\u1806\u2010-\u2015\u2212\u2e17\u2e3a-\u2e3b\ufe58\ufe63\uff0d]/g, '-')
    .replace(/[\u2044\u2215\uff0f]/g, '/')
    .replace(/[\u2022\u2027\u30fb]/g, '·')
    .replace(/\uff08/g, '(')
    .replace(/\uff09/g, ')')
    .replace(/\uff0b/g, '+')
    .replace(/\s+/g, ' ');
}

function publicTextScanVariants(value) {
  let text = String(value);
  for (let pass = 0; pass < 6; pass += 1) {
    const decoded = text
      .replace(/&#(?:x([0-9a-f]{1,6})|(\d{1,7}));?/gi, (entity, hexadecimal, decimal) => {
        const codePoint = Number.parseInt(hexadecimal || decimal, hexadecimal ? 16 : 10);
        if (!Number.isInteger(codePoint) || codePoint < 1 || codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) return ' ';
        return String.fromCodePoint(codePoint);
      })
      .replace(knownHtmlEntityPattern, (entity, name) => htmlEntityMap[name.toLowerCase()]);
    if (decoded === text) break;
    text = decoded;
  }
  const decoded = normalizePublicSeparators(text
    .replace(/&#(?:x)?[^;\s<]{1,24};?/gi, ' ')
    .replace(/&[a-z][a-z0-9]{0,31};?/gi, ' '));
  const flattenVisibleText = (separator) => normalizePublicSeparators(decoded
    .replace(/<!--[\s\S]*?-->/g, separator)
    .replace(/<[^>]*>/g, separator)
    .replace(/<[^>]*$/g, separator));
  const visibleWithSpaces = flattenVisibleText(' ');
  const visibleJoined = flattenVisibleText('');
  return [...new Set([decoded, visibleWithSpaces, visibleJoined])];
}

function publicPiiFindings(value) {
  const strings = [];
  try {
    collectStrings(value, strings, new WeakSet());
  } catch {
    return [];
  }
  const findings = [];
  for (const rawText of strings) {
    for (const text of publicTextScanVariants(rawText)) {
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
  const location = requireRecord(identity.location, 'Public CV identity location');
  const education = requireArray(cv.education, 'Public CV education');
  const experience = requireArray(cv.experience, 'Public CV experience');
  const publications = requireArray(cv.publications, 'Public CV publications');
  const patents = requireArray(cv.patents, 'Public CV patents');
  const awards = requireArray(cv.awards, 'Public CV awards');
  const skills = requireArray(cv.skills, 'Public CV skills');
  const languages = requireArray(cv.languages, 'Public CV languages');
  const contacts = requireArray(cv.contacts, 'Public CV contacts');
  const sourceDigest = digest(cv);
  const grantedCount = patents.filter((entry) => requireRecord(entry, 'Public CV patent').status === 'granted').length;
  const copy = locale === 'ko' ? {
    education: '학력',
    experience: '경력',
    publications: '연구 실적',
    patents: '특허',
    awards: '수상',
    skills: '기술 및 어학',
    languages: '어학',
    contacts: '공개 연락처',
    patentCount: `출원 ${patents.length}건 · 등록 ${grantedCount}건`,
    awardCount: `총 ${awards.length}건`,
    statuses: { granted: '등록', filed: '출원' },
    groups: { work: '직무', undergraduate: '학부', academic: '학회' },
    filedSuffix: '출원',
    boundary: '공개 승인된 사실만 싣습니다. 타인 개인정보와 미검증 성과 주장은 포함하지 않습니다.'
  } : {
    education: 'Education',
    experience: 'Experience',
    publications: 'Publications and presentations',
    patents: 'Patents',
    awards: 'Honours and awards',
    skills: 'Skills and languages',
    languages: 'Languages',
    contacts: 'Public contacts',
    patentCount: `${patents.length} applications · ${grantedCount} granted`,
    awardCount: `${awards.length} total`,
    statuses: { granted: 'Granted', filed: 'Filed' },
    groups: { work: 'Employment', undergraduate: 'Undergraduate', academic: 'Academic society' },
    filedSuffix: 'filed',
    boundary: 'Only approved public facts appear here. Personal information about other people and unverified outcome claims are excluded.'
  };

  const entryHead = (organization, period) => `<p class="sc-cv__head"><strong>${htmlEscape(organization)}</strong><time>${htmlEscape(period)}</time></p>`;
  const listItems = (items, label) => items.map((item, index) => `            <li>${htmlEscape(requireText(item, `${label} item ${index + 1}`))}</li>`).join('\n');

  const educationHtml = education.map((entry, index) => {
    const label = `Public CV education entry ${index + 1}`;
    const record = requireRecord(entry, label);
    const entryCopy = localized(record, locale, ['degree'], label);
    const notes = requireArray(requireRecord(record.translations, `${label} translations`)[locale].notes, `${label} notes`);
    return `        <li>
          ${entryHead(requireText(record.organization, `${label} organization`), requireText(record.period, `${label} period`))}
          <p class="sc-cv__role">${htmlEscape(entryCopy.degree)}</p>
          <ul>
${listItems(notes, `${label} note`)}
          </ul>
        </li>`;
  }).join('\n');

  const experienceHtml = experience.map((entry, index) => {
    const label = `Public CV experience entry ${index + 1}`;
    const record = requireRecord(entry, label);
    const entryCopy = localized(record, locale, ['role', 'context'], label);
    const areas = requireArray(record.areas, `${label} areas`).map((area, areaIndex) => {
      const areaLabel = `Public CV experience area ${areaIndex + 1}`;
      const areaRecord = requireRecord(area, areaLabel);
      const areaCopy = localized(areaRecord, locale, ['title'], areaLabel);
      const items = requireArray(requireRecord(areaRecord.translations, `${areaLabel} translations`)[locale].items, `${areaLabel} items`);
      return `          <div class="sc-cv__area">
            <h4>${htmlEscape(areaCopy.title)}</h4>
            <ul>
${listItems(items, `${areaLabel} item`)}
            </ul>
          </div>`;
    }).join('\n');
    return `        <li>
          ${entryHead(requireText(record.organization, `${label} organization`), requireText(record.period, `${label} period`))}
          <p class="sc-cv__role">${htmlEscape(entryCopy.role)}</p>
          <p class="sc-cv__note">${htmlEscape(entryCopy.context)}</p>
${areas}
        </li>`;
  }).join('\n');

  const publicationHtml = publications.map((entry, index) => {
    const label = `Public CV publication ${index + 1}`;
    const record = requireRecord(entry, label);
    const entryCopy = localized(record, locale, ['title', 'venue', 'role'], label);
    const title = htmlEscape(entryCopy.title);
    const titleHtml = record.href === undefined
      ? `<span class="sc-cv__title">${title}</span>`
      : `<a class="sc-cv__title" href="${htmlEscape(safePublicHref(record.href, `${label} href`))}" target="_blank" rel="noopener">${title}</a>`;
    return `          <li><time>${htmlEscape(requireText(record.year, `${label} year`))}</time>${titleHtml}<span class="sc-cv__meta">${htmlEscape(entryCopy.venue)} · ${htmlEscape(entryCopy.role)}</span></li>`;
  }).join('\n');

  const patentHtml = patents.map((entry, index) => {
    const label = `Public CV patent ${index + 1}`;
    const record = requireRecord(entry, label);
    const entryCopy = localized(record, locale, ['title'], label);
    const status = copy.statuses[requireText(record.status, `${label} status`)];
    const group = copy.groups[requireText(record.group, `${label} group`)];
    if (!status || !group) throw new TypeError(`${label} has an unknown status or group.`);
    const meta = `${requireText(record.number, `${label} number`)} · ${requireText(record.filed, `${label} filed`)} ${copy.filedSuffix} · ${group}`;
    return `          <li><span class="sc-cv__state">${htmlEscape(status)}</span><span class="sc-cv__title">${htmlEscape(entryCopy.title)}</span><span class="sc-cv__meta">${htmlEscape(meta)}</span></li>`;
  }).join('\n');

  const awardHtml = awards.map((entry, index) => {
    const label = `Public CV award ${index + 1}`;
    const record = requireRecord(entry, label);
    const entryCopy = localized(record, locale, ['title', 'organization'], label);
    return `          <li><time>${htmlEscape(requireText(record.year, `${label} year`))}</time><span class="sc-cv__title">${htmlEscape(entryCopy.title)}</span><span class="sc-cv__meta">${htmlEscape(entryCopy.organization)}</span></li>`;
  }).join('\n');

  const skillHtml = skills.map((entry, index) => {
    const label = `Public CV skill ${index + 1}`;
    const entryCopy = localized(requireRecord(entry, label), locale, ['category', 'items'], label);
    return `          <div><dt>${htmlEscape(entryCopy.category)}</dt><dd>${htmlEscape(entryCopy.items)}</dd></div>`;
  }).join('\n');

  const languageHtml = languages.map((entry, index) => {
    const record = requireRecord(entry, `Public CV language ${index + 1}`);
    const translations = requireRecord(record.translations, `Public CV language ${index + 1} translations`);
    return htmlEscape(requireText(translations[locale], `Public CV language ${index + 1} ${locale}`));
  }).join(' · ');

  const contactHtml = contacts.map((entry, index) => {
    const record = requireRecord(entry, `Public CV contact ${index + 1}`);
    const label = requireText(record.label, `Public CV contact ${index + 1} label`);
    const href = safePublicHref(record.href, `Public CV contact ${index + 1} href`, true);
    return `      <li><a href="${htmlEscape(href)}">${htmlEscape(label)}: ${htmlEscape(requireText(record.value, `Public CV contact ${index + 1} value`))}</a></li>`;
  }).join('\n');

  const body = `  <header class="sc-cv__intro">
    <h2 id="cv-summary-title">${htmlEscape(identityCopy.displayName)}<small lang="${locale === 'ko' ? 'en' : 'ko'}">${htmlEscape(locale === 'ko' ? requireText(identity.name, 'Public CV identity name') : requireText(requireRecord(identity.translations, 'Public CV identity translations').ko.displayName, 'Public CV identity ko displayName'))}</small></h2>
    <p class="sc-cv__headline">${htmlEscape(identityCopy.headline)}</p>
    <p class="sc-cv__summary">${htmlEscape(identityCopy.summary)}</p>
    <address class="sc-cv__contacts" aria-label="${htmlEscape(copy.contacts)}">
      <ul>
        <li>${htmlEscape(requireText(location[locale], 'Public CV identity location'))}</li>
${contactHtml}
      </ul>
    </address>
  </header>
  <section data-cv-section="education" aria-labelledby="cv-education-title">
    <h3 id="cv-education-title">${copy.education}</h3>
    <ol class="sc-cv__entries">
${educationHtml}
    </ol>
  </section>
  <section data-cv-section="experience" aria-labelledby="cv-experience-title">
    <h3 id="cv-experience-title">${copy.experience}</h3>
    <ol class="sc-cv__entries">
${experienceHtml}
    </ol>
  </section>
  <section data-cv-section="publications" aria-labelledby="cv-publications-title">
    <h3 id="cv-publications-title">${copy.publications}</h3>
    <ol class="sc-cv__list">
${publicationHtml}
    </ol>
  </section>
  <section data-cv-section="patents" aria-labelledby="cv-patents-title">
    <h3 id="cv-patents-title">${copy.patents}<small>${copy.patentCount}</small></h3>
    <ol class="sc-cv__list">
${patentHtml}
    </ol>
  </section>
  <section data-cv-section="awards" aria-labelledby="cv-awards-title">
    <h3 id="cv-awards-title">${copy.awards}<small>${copy.awardCount}</small></h3>
    <ol class="sc-cv__list">
${awardHtml}
    </ol>
  </section>
  <section data-cv-section="skills" aria-labelledby="cv-skills-title">
    <h3 id="cv-skills-title">${copy.skills}</h3>
    <dl class="sc-cv__skills">
${skillHtml}
          <div><dt>${copy.languages}</dt><dd>${languageHtml}</dd></div>
    </dl>
    <p class="sc-cv__note">${copy.boundary}</p>
  </section>`;
  const summaryDigest = digest(`${locale}\n${sourceDigest}\n${body}`);
  const html = `<section class="sc-cv" data-cv-summary data-cv-source-digest="${sourceDigest}" data-cv-summary-digest="${summaryDigest}" aria-labelledby="cv-summary-title">\n${body}\n</section>`;
  const envelope = `${' '.repeat(4)}${summaryStart}\n${html.split('\n').map((line) => `${' '.repeat(4)}${line}`).join('\n')}\n${' '.repeat(4)}${summaryEnd}`;
  return { html, envelope, sourceDigest, summaryDigest };
}

function extractPublicCvSummary(htmlValue) {
  if (typeof htmlValue !== 'string') throw new TypeError('CV HTML must be a string.');
  const startCount = htmlValue.split(summaryStart).length - 1;
  const endCount = htmlValue.split(summaryEnd).length - 1;
  const summarySections = [...htmlValue.matchAll(/<([a-z][\w:-]*)\b[^>]*\bdata-cv-summary(?=\s|=|>)[^>]*>/gi)];
  if (startCount !== 1 || endCount !== 1 || summarySections.length !== 1 || summarySections[0][1].toLowerCase() !== 'section') {
    throw new Error(`CV HTML must contain exactly one start marker, one end marker, and one data-cv-summary section (found ${startCount}/${endCount}/${summarySections.length}).`);
  }
  const start = htmlValue.indexOf(summaryStart);
  const end = htmlValue.indexOf(summaryEnd);
  const summaryStartIndex = summarySections[0].index;
  if (!(start < summaryStartIndex && summaryStartIndex < end)) {
    throw new Error('CV summary markers must enclose exactly one data-cv-summary section.');
  }
  const enclosed = htmlValue.slice(start + summaryStart.length, end).trim();
  if (!/^<section\b[^>]*\bdata-cv-summary(?=\s|=|>)[^>]*>[\s\S]*<\/section>$/i.test(enclosed)) {
    throw new Error('CV summary markers must enclose exactly one complete data-cv-summary section.');
  }
  const startLine = htmlValue.lastIndexOf('\n', start - 1) + 1;
  const endLine = htmlValue.indexOf('\n', end + summaryEnd.length);
  if (!/^[ \t]*$/.test(htmlValue.slice(startLine, start)) || !/^[ \t]*(?:\r)?$/.test(htmlValue.slice(end + summaryEnd.length, endLine === -1 ? htmlValue.length : endLine))) {
    throw new Error('CV summary markers must occupy their own lines.');
  }
  return htmlValue.slice(startLine, end + summaryEnd.length);
}

function refreshCvSummaries(rootDir, options = {}) {
  const resolvedRoot = path.resolve(rootDir);
  const cv = JSON.parse(fs.readFileSync(path.join(resolvedRoot, 'data', 'public-cv.json'), 'utf8'));
  const sourcePii = publicPiiFindings(cv);
  if (sourcePii.length) throw new Error(`Public CV data contains prohibited private PII (${sourcePii.join('; ')}).`);
  const renderedByLocale = new Map(locales.map((locale) => {
    const rendered = renderPublicCvSummary(cv, locale);
    const renderedPii = publicPiiFindings(rendered.html);
    if (renderedPii.length) throw new Error(`Rendered ${locale} public CV summary contains prohibited private PII (${renderedPii.join('; ')}).`);
    if (extractPublicCvSummary(rendered.envelope) !== rendered.envelope) throw new Error(`Rendered ${locale} public CV summary has an invalid marker envelope.`);
    return [locale, rendered];
  }));
  const pages = locales.map((locale) => {
    const filePath = path.join(resolvedRoot, locale === 'ko' ? path.join('cv', 'index.html') : path.join('en', 'cv', 'index.html'));
    const before = fs.readFileSync(filePath, 'utf8');
    const current = extractPublicCvSummary(before);
    const expected = renderedByLocale.get(locale).envelope;
    const after = before.slice(0, before.indexOf(current)) + expected + before.slice(before.indexOf(current) + current.length);
    return { locale, filePath, before, after, changed: before !== after };
  });
  if (pages.every((page) => !page.changed)) {
    return pages.map((page) => ({ locale: page.locale, file: path.relative(resolvedRoot, page.filePath), changed: false }));
  }

  const transactionId = crypto.randomUUID();
  for (const page of pages) {
    page.tempPath = `${page.filePath}.public-cv-summary-${transactionId}-${page.locale}.tmp`;
    page.backupPath = `${page.filePath}.public-cv-summary-${transactionId}-${page.locale}.bak`;
    page.restoreTempPath = `${page.filePath}.public-cv-summary-${transactionId}-${page.locale}.restore.tmp`;
    page.backedUp = false;
    page.published = false;
    page.restored = false;
  }
  const renameFile = typeof options.renameFile === 'function' ? options.renameFile : fs.renameSync;
  const syncFile = (filePath) => {
    const descriptor = fs.openSync(filePath, 'r+');
    try {
      fs.fsyncSync(descriptor);
    } finally {
      fs.closeSync(descriptor);
    }
  };
  const cleanup = (includeBackups) => {
    const errors = [];
    for (const page of pages) {
      const artifacts = [page.tempPath, page.restoreTempPath];
      if (includeBackups) artifacts.push(page.backupPath);
      for (const artifact of artifacts) {
        try {
          fs.rmSync(artifact, { force: true });
        } catch (error) {
          errors.push(`${artifact}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    return errors;
  };

  let publicationError;
  try {
    for (const page of pages) {
      fs.writeFileSync(page.tempPath, page.after, { encoding: 'utf8', flag: 'wx' });
      syncFile(page.tempPath);
    }
    for (const page of pages) {
      renameFile(page.filePath, page.backupPath);
      page.backedUp = true;
      syncFile(page.backupPath);
      renameFile(page.tempPath, page.filePath);
      page.published = true;
      syncFile(page.filePath);
    }
    for (const page of pages) {
      if (fs.readFileSync(page.filePath, 'utf8') !== page.after) throw new Error(`${page.filePath}: published CV summary verification failed.`);
    }
  } catch (error) {
    publicationError = error;
  }

  if (publicationError) {
    const rollbackErrors = [];
    for (const page of pages.slice().reverse().filter((candidate) => candidate.backedUp)) {
      try {
        fs.copyFileSync(page.backupPath, page.restoreTempPath, fs.constants.COPYFILE_EXCL);
        syncFile(page.restoreTempPath);
        renameFile(page.restoreTempPath, page.filePath);
        syncFile(page.filePath);
        if (fs.readFileSync(page.filePath, 'utf8') !== page.before) throw new Error(`${page.filePath}: restored CV summary verification failed.`);
        page.restored = true;
      } catch (rollbackError) {
        rollbackErrors.push(`${page.filePath}: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`);
      }
    }
    const detail = publicationError instanceof Error ? publicationError.message : String(publicationError);
    if (rollbackErrors.length) {
      const recoveryPaths = pages.filter((page) => page.backedUp && fs.existsSync(page.backupPath)).map((page) => page.backupPath);
      const transactionArtifacts = pages.flatMap((page) => [page.tempPath, page.restoreTempPath, page.backupPath]).filter((artifact) => fs.existsSync(artifact));
      throw new Error(`Atomic CV summary refresh failed: ${detail}; rollback failed: ${rollbackErrors.join('; ')}. Recovery backups preserved at: ${recoveryPaths.join(', ')}. Incomplete transaction artifacts preserved at: ${transactionArtifacts.join(', ')}.`);
    }
    const cleanupErrors = cleanup(true);
    if (cleanupErrors.length) throw new Error(`Atomic CV summary refresh failed: ${detail}; rollback completed but cleanup failed: ${cleanupErrors.join('; ')}.`);
    throw new Error(`Atomic CV summary refresh failed: ${detail}`);
  }
  const cleanupErrors = cleanup(true);
  if (cleanupErrors.length) throw new Error(`CV summary publication succeeded but transaction cleanup failed: ${cleanupErrors.join('; ')}.`);
  return pages.map((page) => ({ locale: page.locale, file: path.relative(resolvedRoot, page.filePath), changed: page.changed }));
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
