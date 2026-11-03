// Privacy Policy publication gate.
//
// The policy text is built from what the website code actually does, but several facts can only be
// supplied by the business owner (legal entity, retention periods, privacy contact, hosting confirmation).
// Nothing is published until `approved` is true AND every fact below is filled in.
//
//   mode "off"       -> /privacy-policy/ is NOT generated, footer link hidden, not in sitemap (default)
//   mode "preview"   -> only when PRIVACY_PREVIEW=1: page generated with visible "NOT APPROVED" banner,
//                       noindex, unfilled facts shown as [OWNER TO CONFIRM: ...]; for owner review only
//   mode "published" -> approved === true and all facts filled; page + footer link + sitemap entry
//
// See docs/PRIVACY_POLICY_OWNER_CHECKLIST.md.
const facts = {
  legalEntityName: null,       // exact registered name of the business that operates the website
  privacyContactEmail: null,   // mailbox that will receive privacy requests (may equal site.email if the owner confirms)
  privacyContactPhone: null,   // optional channel; set to "none" if not offered
  enquiryRetention: null,      // how long WhatsApp / phone / email enquiry records are kept (owner's real practice)
  analyticsRetention: null,    // Google Analytics 4 data-retention setting actually configured in the GA property
  hostingProvider: null,       // confirmed hosting / CDN provider (external evidence suggests Cloudflare)
  effectiveDate: null          // ISO date (YYYY-MM-DD) the owner approved the text
};
const approved = false;        // owner sign-off; flip to true only after checklist is complete

const missing = Object.keys(facts).filter((k) => !facts[k]);
if (approved && missing.length) {
  throw new Error('privacy.js: approved=true but facts missing: ' + missing.join(', '));
}

const mode = approved ? 'published' : (process.env.PRIVACY_PREVIEW === '1' ? 'preview' : 'off');
const f = {};
for (const k of Object.keys(facts)) f[k] = facts[k] || `[OWNER TO CONFIRM: ${k}]`;

module.exports = { mode, approved, missing, facts: f };
