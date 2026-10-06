'use strict';

const fields = ['id', 'type', 'path', 'poster', 'width', 'height', 'eventIds', 'order', 'translations', 'takenAt', 'approval', 'derivativeSha256', 'bytes', 'posterSha256', 'posterBytes', 'duration'];
const hash = /^[a-f0-9]{64}$/;

function publicRecord(record) {
  const out = {};
  for (const field of fields) if (record[field] !== undefined && record[field] !== null) out[field] = record[field];
  out.translations = Object.fromEntries(['ko', 'en'].map(locale => [locale, Object.fromEntries(['caption', 'alt'].map(field => [field, record.translations?.[locale]?.[field]]))]));
  return out;
}

function publicSchemaErrors(data) {
  const errors = [];
  if (!data || data.schema !== 2 || !data.media || typeof data.media !== 'object' || Array.isArray(data.media)) return ['activity media: schema 2 with a media map is required'];
  for (const key of Object.keys(data)) if (!['schema', 'media'].includes(key)) errors.push(`activity media: unexpected public field ${key}`);
  for (const [id, record] of Object.entries(data.media)) {
    const fail = message => errors.push(`activity media ${id}: ${message}`);
    if (!record || typeof record !== 'object' || Array.isArray(record)) { fail('record must be an object'); continue; }
    for (const key of Object.keys(record)) if (!fields.includes(key)) fail(`unexpected public field ${key}`);
    if (!/^M\d{3,}$/.test(id) || id !== record.id) fail('id must match its key');
    if (!['image', 'video'].includes(record.type)) fail('type must be image or video');
    if (record.path !== `assets/local-review/${id}.${record.type === 'video' ? 'mp4' : 'webp'}`) fail('invalid public media path');
    if (record.approval !== 'approved-public') fail('approval must be approved-public');
    if (!hash.test(record.derivativeSha256 || '')) fail('invalid derivative hash');
    for (const key of ['width', 'height', 'bytes']) if (!Number.isSafeInteger(record[key]) || record[key] <= 0) fail(`${key} must be positive`);
    if (!Number.isSafeInteger(record.order) || record.order < 0) fail('order must be a nonnegative integer');
    if (!Array.isArray(record.eventIds) || !record.eventIds.length || record.eventIds.some(value => typeof value !== 'string' || !value)) fail('eventIds must be nonempty strings');
    if (!/^\d{4}(?:-\d{2}){0,2}$/.test(record.takenAt || '')) fail('public date is required');
    if (record.type === 'video') {
      if (record.poster !== `assets/local-review/${id}-poster.jpg`) fail('invalid poster path');
      if (!hash.test(record.posterSha256 || '')) fail('invalid poster hash');
      if (!Number.isSafeInteger(record.posterBytes) || record.posterBytes <= 0) fail('posterBytes must be positive');
      if (!Number.isFinite(record.duration) || record.duration <= 0 || record.duration > 30) fail('invalid public duration');
    } else if (['poster', 'posterBytes', 'posterSha256', 'duration'].some(key => key in record)) fail('image cannot carry video fields');
    const translations = record.translations;
    if (!translations || typeof translations !== 'object' || Array.isArray(translations)) { fail('translations required'); continue; }
    for (const locale of Object.keys(translations)) if (!['ko', 'en'].includes(locale)) fail(`unexpected translation ${locale}`);
    for (const locale of ['ko', 'en']) {
      const copy = translations[locale];
      if (!copy || typeof copy !== 'object' || Array.isArray(copy)) { fail(`${locale} copy required`); continue; }
      for (const key of Object.keys(copy)) if (!['caption', 'alt'].includes(key)) fail(`unexpected ${locale} field ${key}`);
      for (const key of ['caption', 'alt']) if (typeof copy[key] !== 'string' || !copy[key].trim() || /TODO|확인 필요|unconfirmed|pending/i.test(copy[key])) fail(`${locale} ${key} needs finished public copy`);
    }
  }
  return errors;
}

module.exports = { publicRecord, publicSchemaErrors };
