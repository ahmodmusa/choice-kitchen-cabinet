// Pure publication-gate logic for the Privacy Policy (no I/O, unit-tested in scripts/test-privacy-gate.js).
//
//   mode "off"       approved=false, no preview            -> page NOT built, no footer link, not in sitemap
//   mode "preview"   approved=false, preview=true          -> draft page (noindex, banner, placeholders) for owner review
//   mode "published" approved=true AND all required facts present AND verified -> page + footer link + sitemap entry
//
// approved=true with any missing/unverified fact throws, so an unfinished policy can never be published.
const REQUIRED = [
  'legalEntityName',
  'privacyContactEmail',
  'privacyContactPhone',
  'enquiryRetention',
  'analyticsRetention',
  'hostingProvider',
  'effectiveDate'
];

function problems(facts) {
  const out = [];
  for (const k of REQUIRED) {
    const f = facts[k];
    if (!f || typeof f.value !== 'string' || !f.value.trim()) out.push(`${k}: missing value`);
    else if (f.verified !== true) out.push(`${k}: not verified by owner/evidence`);
  }
  const d = facts.effectiveDate && facts.effectiveDate.value;
  if (d && (!/^\d{4}-\d{2}-\d{2}$/.test(d) || Number.isNaN(Date.parse(d)))) out.push('effectiveDate: must be a valid YYYY-MM-DD date');
  return out;
}

function evaluate(facts, approved, preview) {
  const issues = problems(facts);
  if (approved && issues.length) {
    throw new Error('privacy gate: approved=true but facts are incomplete/unverified -> ' + issues.join('; '));
  }
  const mode = approved ? 'published' : (preview ? 'preview' : 'off');
  const flat = {};
  for (const k of REQUIRED) {
    const f = facts[k] || {};
    const ok = f.verified === true && typeof f.value === 'string' && f.value.trim();
    if (ok) flat[k] = f.value;
    else flat[k] = `[OWNER TO CONFIRM: ${k}${f.value ? ' — proposed: ' + f.value : ''}]`;
  }
  return { mode, approved: !!approved, missing: issues, facts: flat };
}

module.exports = { REQUIRED, problems, evaluate };
