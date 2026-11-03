// Privacy Policy gate tests (Phase 1C).
// Builds a PREVIEW copy of the site (PRIVACY_PREVIEW=1) into a throw-away folder inside the repo and checks the
// draft policy; also checks that approving without the owner facts fails the build. Does not touch _site.
// Usage: node scripts/test-privacy-gate.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const out = path.join(root, '.privacy-preview');
let pass = 0;
let fail = 0;
const assert = (c, m) => { if (c) pass++; else { fail++; console.error('FAIL: ' + m); } };

try {
  fs.rmSync(out, { recursive: true, force: true });
  execSync('npx eleventy --output=.privacy-preview', { cwd: root, env: { ...process.env, PRIVACY_PREVIEW: '1' }, stdio: 'pipe' });
  const page = fs.readFileSync(path.join(out, 'privacy-policy', 'index.html'), 'utf8');
  const text = page.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');

  assert(/<meta name="robots" content="noindex">/.test(page), 'preview must be noindex');
  assert(!/rel="canonical"/.test(page) || /noindex/.test(page), 'preview must not be indexable');
  assert(/DRAFT/.test(page) && /NOT APPROVED/.test(page), 'preview must show the draft / not-approved banner');
  assert(/OWNER TO CONFIRM/.test(page), 'unfilled owner facts must be visibly marked');
  assert(!/<link rel="alternate" hreflang/.test(page), 'policy must not carry hreflang');
  assert(/id="english"[^>]*lang="en"/.test(page) && /id="bahasa-malaysia"[^>]*lang="ms"/.test(page), 'English and Bahasa Malaysia versions must both be present');
  ['Google Analytics', 'Google Fonts', 'Google Maps', 'WhatsApp', 'PDPA'].forEach((k) => {
    assert(text.includes(k), 'policy must mention ' + k);
  });
  ['Google Analytics', 'Google Fonts', 'Google Maps', 'WhatsApp', 'PDPA'].forEach((k) => {
    const ms = text.slice(text.indexOf('Dasar Privasi (Bahasa Malaysia)'));
    assert(ms.includes(k), 'Bahasa Malaysia version must mention ' + k);
  });
  assert(!/facebook pixel|meta pixel|YOUR_FACEBOOK/i.test(text), 'policy must not describe the inactive Meta/Facebook Pixel');
  assert(!/\bSSM\b|registration no|company no/i.test(text), 'policy must not invent company registration details');
  assert(!/(guarantee|100% secure|fully secure)/i.test(text), 'policy must not make security guarantees');
  assert(!/data-lang=/.test(page.slice(page.indexOf('id="english"'), page.indexOf('</section>', page.indexOf('id="english"')))), 'policy text must not depend on the language switcher');
  const sm = fs.readFileSync(path.join(out, 'sitemap.xml'), 'utf8');
  assert(!sm.includes('/privacy-policy/'), 'draft policy must not be in the sitemap');
  assert(fs.readFileSync(path.join(out, 'index.html'), 'utf8').includes('href="/privacy-policy/"'), 'preview footer must link to the policy');
} catch (e) {
  fail++;
  console.error('FAIL: preview build/inspection error: ' + (e.stderr ? e.stderr.toString().slice(0, 500) : e.message));
} finally {
  fs.rmSync(out, { recursive: true, force: true });
}

// Approving without owner facts must be impossible.
{
  const src = fs.readFileSync(path.join(root, '_data', 'privacy.js'), 'utf8');
  assert(/const approved = false;/.test(src), 'privacy.js must ship with approved = false until the owner signs off');
  const Module = require('module');
  const m = new Module(path.join(root, '_data', 'privacy-test.js'));
  m.filename = path.join(root, '_data', 'privacy-test.js');
  m.paths = Module._nodeModulePaths(root);
  let threw = false;
  try { m._compile(src.replace('const approved = false;', 'const approved = true;'), m.filename); } catch (e) { threw = /facts missing/.test(e.message); }
  assert(threw, 'approved=true with missing owner facts must throw at build time');
}

console.log(`\n=== PRIVACY GATE TESTS: ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
