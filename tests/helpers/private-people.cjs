// Names of private individuals that must never appear in public copy (CV, captions, news bodies).
// Shared by tests/portfolio.test.cjs and tests/activity-media.test.cjs.
const privatePeople = ['안재명', '강영남', '최현석'];
const privatePeoplePattern = new RegExp(privatePeople.join('|'));
// A Hangul word followed by a personal title implies a named third person; captions describe scenes, not people.
const honorificPattern = /[가-힣]{2,4}\s?(?:님|씨|교수)(?![가-힣])/;
// Internal review wording that must not reach public captions or alt text.
const reviewWordingPattern = /후보|candidate|원본\s*\d|확인 필요|unconfirmed|TODO|CV의|matches the CV|pending/i;
module.exports = { privatePeople, privatePeoplePattern, honorificPattern, reviewWordingPattern };
