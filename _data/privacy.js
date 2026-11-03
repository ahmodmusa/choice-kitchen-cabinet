// Privacy Policy facts + approval switch. Gate logic lives in config/privacy-gate.js.
//
// Nothing is published until `approved` is true AND every fact is filled AND marked verified.
// Phase 1D evidence and open items: docs/PRIVACY_POLICY_OWNER_CHECKLIST.md and audit-output/08-PRIVACY-AND-RELEASE-READINESS.md.
// Do NOT set approved = true without the owner's explicit written approval.
const { evaluate } = require('../config/privacy-gate');

const facts = {
  // Exact registered name of the business operating mychoicecabinet.com. NOT "A&C Services" (that is Orked's legalName).
  legalEntityName: { value: null, verified: false, evidence: 'No Choice legal/SSM name found in code, WP export or live site' },
  // Published business email (site.json, contact page, live HTML). Owner must confirm it is the privacy-request mailbox.
  privacyContactEmail: { value: 'admin@mychoicecabinet.com', verified: false, evidence: 'Published in site.json/contact page/live HTML; privacy-contact designation needs owner confirmation' },
  // Published business telephone (site.json, contact page, footer, live tel: links).
  privacyContactPhone: { value: '+60 17-836 0455', verified: true, evidence: 'tel:+60178360455 in site.json, footer, contact page and live production HTML' },
  // Owner's real enquiry-record retention practice. Nothing documented.
  enquiryRetention: { value: null, verified: false, evidence: 'Not documented anywhere in project' },
  // GA4 property retention setting. GA property for G-WY69TY8LTH not reachable from available Google account.
  analyticsRetention: { value: null, verified: false, evidence: 'GA4 Admin > Data settings > Data retention not accessible' },
  // DNS/Server header show Cloudflare; Pages project association not visible without dashboard access.
  hostingProvider: { value: 'Cloudflare', verified: false, evidence: 'NS = cloudflare, Server: cloudflare, pages.dev alias 200; dashboard not accessible' },
  // ISO date (YYYY-MM-DD) of the owner's approval. Set only at approval time.
  effectiveDate: { value: null, verified: false, evidence: 'Set when owner approves' }
};
const approved = false;

module.exports = { ...evaluate(facts, approved, process.env.PRIVACY_PREVIEW === '1'), rawFacts: facts };
