// Privacy Policy gate tests.
//  1. Unit tests of config/privacy-gate.js (every approved / verified combination).
//  2. The real repository state (_data/privacy.js) is internally consistent.
//  3. Three throw-away builds in repo-local temp folders (the real _site and real _data are never touched):
//       OFF        default      -> policy not built, no footer link, sitemap 186
//       PREVIEW    PRIVACY_PREVIEW=1 -> noindex draft with banner and placeholders, not in sitemap (190)
//       PUBLISHED  fixture with approved=true and fully verified FICTIONAL facts -> indexable page, footer link,
//                  sitemap 187, no placeholders. Fixture values exist only inside the temp copy.
// Usage: node scripts/test-privacy-gate.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const gate = require('../config/privacy-gate');

const root = path.join(__dirname, '..');
let pass = 0;
let fail = 0;
const assert = (c, m) => { if (c) pass++; else { fail++; console.error('FAIL: ' + m); } };
const threw = (fn, re) => { try { fn(); return false; } catch (e) { return re.test(e.message); } };

const good = () => ({
  legalEntityName: { value: 'Test Entity Sdn Bhd', verified: true },
  privacyContactEmail: { value: 'privacy@example.test', verified: true },
  privacyContactPhone: { value: '+60 12-345 6789', verified: true },
  enquiryRetention: { value: 'Test retention text.', verified: true },
  analyticsRetention: { value: '14 months', verified: true },
  hostingProvider: { value: 'Test Host', verified: true },
  effectiveDate: { value: '2026-12-01', verified: true }
});

// ---- 1. unit tests
{
  assert(gate.REQUIRED.length === 7, 'exactly seven required privacy facts');
  assert(gate.evaluate(good(), false, false).mode === 'off', 'approved=false, no preview -> off');
  assert(gate.evaluate(good(), false, true).mode === 'preview', 'approved=false, preview -> preview');
  assert(gate.evaluate(good(), true, false).mode === 'published', 'approved=true + all verified -> published');
  assert(gate.evaluate(good(), true, true).mode === 'published', 'approved=true wins over preview flag');
  assert(gate.evaluate(good(), false, false).approved === false, 'approved flag reflected');
  gate.REQUIRED.forEach((k) => {
    const missing = good(); missing[k] = { value: null, verified: false };
    assert(threw(() => gate.evaluate(missing, true, false), new RegExp(k + ': missing value')), `approved=true with missing ${k} must throw`);
    const unverified = good(); unverified[k].verified = false;
    assert(threw(() => gate.evaluate(unverified, true, false), new RegExp(k + ': not verified')), `approved=true with unverified ${k} must throw`);
    const blank = good(); blank[k].value = '   ';
    assert(threw(() => gate.evaluate(blank, true, false), /missing value/), `approved=true with blank ${k} must throw`);
    assert(gate.evaluate(missing, false, true).facts[k].includes('OWNER TO CONFIRM'), `unapproved missing ${k} must render a visible placeholder`);
    assert(!gate.evaluate(good(), true, false).facts[k].includes('OWNER TO CONFIRM'), `published ${k} must not contain a placeholder`);
  });
  ['2026-13-45', '01/12/2026', 'December 1'].forEach((d) => {
    const b = good(); b.effectiveDate.value = d;
    assert(threw(() => gate.evaluate(b, true, false), /effectiveDate/), `invalid effectiveDate "${d}" must throw`);
  });
  const proposed = good(); proposed.privacyContactEmail = { value: 'x@example.test', verified: false };
  assert(/proposed: x@example.test/.test(gate.evaluate(proposed, false, true).facts.privacyContactEmail), 'unverified proposed value is shown only inside a placeholder');
}

// ---- 2. real repository state
const real = require('../_data/privacy.js');
const realSrc = fs.readFileSync(path.join(root, '_data', 'privacy.js'), 'utf8');
assert(['off', 'preview', 'published'].includes(real.mode), 'real privacy mode must be a known value');
assert(real.mode !== 'published' || real.missing.length === 0, 'a published real policy must have zero unresolved facts');
assert(!/legalEntityName:\s*\{\s*value:\s*'A&C/i.test(realSrc), "Choice legal name must never be Orked's 'A&C Services'");

// ---- 3. throw-away builds
const EXCLUDE = new Set(['node_modules', '_site', 'data-exports', '.git', '.privacy-off-test', '.privacy-preview-test', '.privacy-published-test']);
function copyRepo(dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(root)) {
    if (EXCLUDE.has(e)) continue;
    fs.cpSync(path.join(root, e), path.join(dest, e), { recursive: true, filter: (src) => !EXCLUDE.has(path.basename(src)) });
  }
}
function build(dest, env) {
  execSync('node ' + JSON.stringify(path.join(root, 'node_modules', '@11ty', 'eleventy', 'cmd.js')), { cwd: dest, env: { ...process.env, PRIVACY_PREVIEW: '', ...env }, stdio: 'pipe' });
  return path.join(dest, '_site');
}
const rd = (p) => fs.readFileSync(p, 'utf8');
const sitemapCount = (site) => [...rd(path.join(site, 'sitemap.xml')).matchAll(/<loc>/g)].length;
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
const TOPICS = ['Google Analytics', 'Google Fonts', 'Google Maps', 'WhatsApp', 'PDPA'];

const dirs = ['.privacy-off-test', '.privacy-preview-test', '.privacy-published-test'].map((d) => path.join(root, d));
try {
  // OFF
  copyRepo(dirs[0]);
  const off = build(dirs[0], {});
  assert(!fs.existsSync(path.join(off, 'privacy-policy')), 'OFF: policy must not be built');
  assert(sitemapCount(off) === 190, 'OFF: sitemap must have 190 URLs, found ' + sitemapCount(off));
  assert(!rd(path.join(off, 'index.html')).includes('/privacy-policy/'), 'OFF: footer must not link to the policy');

  // PREVIEW
  copyRepo(dirs[1]);
  const pv = build(dirs[1], { PRIVACY_PREVIEW: '1' });
  const pvPage = rd(path.join(pv, 'privacy-policy', 'index.html'));
  assert(/<meta name="robots" content="noindex">/.test(pvPage), 'PREVIEW: must be noindex');
  assert(/NOT APPROVED/.test(pvPage) && /OWNER TO CONFIRM/.test(pvPage), 'PREVIEW: banner and placeholders must be visible');
  assert(sitemapCount(pv) === 190 && !rd(path.join(pv, 'sitemap.xml')).includes('/privacy-policy/'), 'PREVIEW: not in sitemap (186)');
  assert(rd(path.join(pv, 'index.html')).includes('href="/privacy-policy/"'), 'PREVIEW: footer links to the draft for owner review');

  // PUBLISHED (fixture)
  copyRepo(dirs[2]);
  const f = path.join(dirs[2], '_data', 'privacy.js');
  const fixture = `const { evaluate } = require('../config/privacy-gate');
const v = (value) => ({ value, verified: true });
const facts = { legalEntityName: v('Fixture Cabinet Sdn Bhd'), privacyContactEmail: v('privacy@fixture.test'), privacyContactPhone: v('+60 12-000 0000'), enquiryRetention: v('Fixture retention statement.'), analyticsRetention: v('Fixture 14 months'), hostingProvider: v('Fixture Host'), effectiveDate: v('2026-12-01') };
module.exports = evaluate(facts, true, false);\n`;
  fs.writeFileSync(f, fixture);
  const pub = build(dirs[2], {});
  const page = rd(path.join(pub, 'privacy-policy', 'index.html'));
  const text = strip(page);
  assert(!/name="robots"[^>]*noindex/.test(page), 'PUBLISHED: must be indexable');
  assert(page.includes('<link rel="canonical" href="https://www.mychoicecabinet.com/privacy-policy/">'), 'PUBLISHED: self-canonical');
  assert(!/<link rel="alternate" hreflang/.test(page), 'PUBLISHED: no hreflang tags');
  assert(!/OWNER TO CONFIRM|DRAFT|NOT APPROVED|\[OWNER/.test(page), 'PUBLISHED: no placeholder or draft marker may reach production');
  assert(text.includes('Fixture Cabinet Sdn Bhd') && text.includes('privacy@fixture.test') && text.includes('2026-12-01') && text.includes('Fixture retention statement.'), 'PUBLISHED: all supplied facts appear in the policy');
  assert(/id="english"[^>]*lang="en"/.test(page) && /id="bahasa-malaysia"[^>]*lang="ms"/.test(page), 'PUBLISHED: EN and BM versions present');
  TOPICS.forEach((k) => assert(text.includes(k), 'PUBLISHED: policy mentions ' + k));
  assert(sitemapCount(pub) === 191, 'PUBLISHED: sitemap must have 191 URLs, found ' + sitemapCount(pub));
  assert(rd(path.join(pub, 'sitemap.xml')).includes('<loc>https://www.mychoicecabinet.com/privacy-policy/</loc>'), 'PUBLISHED: policy in sitemap');
  ['index.html', 'about-us/index.html', 'tips-for-cleaning-kitchen-cabinets/index.html', 'petaling-jaya/index.html'].forEach((p) => {
    assert(rd(path.join(pub, p)).includes('href="/privacy-policy/"'), 'PUBLISHED: footer links to policy on ' + p);
  });
  assert(!/OWNER TO CONFIRM/.test(rd(path.join(pub, 'index.html'))), 'PUBLISHED: no placeholder on homepage');
  // The ordinary suites must also pass in the approved state (no test may fail merely because approval was granted)
  ['test-regression.js', 'test-technical-seo.js'].forEach((s) => {
    let okRun = true;
    try { execSync('node scripts/' + s, { cwd: dirs[2], stdio: 'pipe' }); } catch (e) { okRun = false; console.error(String(e.stdout || '').split(/\r?\n/).filter((l) => /FAIL/.test(l)).join(' | ')); }
    assert(okRun, 'PUBLISHED: ' + s + ' must pass with approved=true (expects 191 sitemap URLs)');
  });
} catch (e) {
  fail++;
  console.error('FAIL: temp build error: ' + (e.stderr ? e.stderr.toString().slice(0, 600) : e.message));
} finally {
  dirs.forEach((d) => fs.rmSync(d, { recursive: true, force: true }));
}

// Draft-only content must not appear anywhere in the real build
const realSite = path.join(root, '_site');
if (fs.existsSync(realSite)) {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const leaked = walk(realSite).filter((p) => p.endsWith('.html') && /OWNER TO CONFIRM|NOT APPROVED/.test(rd(p)));
  assert(leaked.length === 0, 'no placeholder/draft text in the real _site build: ' + leaked.join(', '));
}

console.log(`\n=== PRIVACY GATE TESTS: ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
