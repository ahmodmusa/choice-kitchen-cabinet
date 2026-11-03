// Read-only HTTP verification of a deployed (staging or production) site.
// Usage: BASE_URL=https://<staging-host> node scripts/verify-staging.js
// Sends only GET/HEAD requests. Does not modify anything.
const base = (process.env.BASE_URL || '').replace(/\/$/, '');
if (!base) {
  console.error('Set BASE_URL, e.g. BASE_URL=https://xxxx.pages.dev node scripts/verify-staging.js');
  process.exit(2);
}
const ORIGIN = 'https://www.mychoicecabinet.com';

let pass = 0;
let fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error('FAIL: ' + m); } };

async function get(p) {
  return fetch(base + p, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (verify-staging)' } });
}

(async () => {
  // 1. Unknown URLs must be real 404s (never 200 + homepage)
  for (const p of ['/nonexistent-xyz/', '/blog/', '/tips-for-cleaning-kitchen-cabinets/', '/privacy-policy/', '/assets/missing.jpg']) {
    const r = await get(p);
    ok(r.status === 404, `${p} should be 404, got ${r.status}`);
  }
  const nf = await get('/nonexistent-xyz/');
  const body = await nf.text();
  ok(/Page Not Found/.test(body), '404 response should render the custom 404 page');
  ok(/name="robots" content="noindex"/.test(body), '404 page should be noindex');
  ok(!/rel="canonical"/.test(body), '404 page must not have a canonical');

  // 2. Legacy slug redirects: single-hop 301 to the corrected URL
  const map = {
    '/petaling-jaya/best-price-kitchen-cabinets-in-ara-damansara-month-year/': '/petaling-jaya/ara-damansara/',
    '/petaling-jaya/best-price-kitchen-cabinets-in-kota-damansara-month-year/': '/petaling-jaya/kota-damansara/',
    '/petaling-jaya/best-price-kitchen-cabinets-in-petaling-jaya-selatan-month-year/': '/petaling-jaya/petaling-jaya-selatan/',
    '/ampang-jaya/pandan-pandan-indah/': '/ampang-jaya/pandan-indah/',
    '/sepang/seri-kembangan-south-sepang-utara/': '/sepang/seri-kembangan-south/',
    '/sepang/kota-warisan-2/': '/sepang/kota-warisan/'
  };
  for (const [from, to] of Object.entries(map)) {
    const r = await get(from);
    const loc = (r.headers.get('location') || '').replace(base, '');
    ok(r.status === 301 && loc === to, `${from} should 301 -> ${to}, got ${r.status} ${loc}`);
    const t = await get(to);
    ok(t.status === 200, `${to} should be 200, got ${t.status}`);
  }

  // 3. Every sitemap URL stays 200 (sitemap fetched from the target itself)
  const smRes = await get('/sitemap.xml');
  ok(smRes.status === 200, 'sitemap.xml should be 200');
  const urls = [...(await smRes.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(ORIGIN, ''));
  ok(urls.length === 185, `sitemap should list 185 URLs, found ${urls.length}`);
  let bad = 0;
  for (const u of urls) {
    const r = await get(u);
    if (r.status !== 200) { bad++; console.error(`  ${u} -> ${r.status}`); }
  }
  ok(bad === 0, `all sitemap URLs must be 200 (${bad} bad)`);

  // 4. Existing behaviour preserved
  const t = await get('/how-to-organize-kitchen-cabinets');
  ok([301, 308].includes(t.status), 'trailing-slash redirect for article should be preserved');
  const l = await get('/?lang=bm');
  ok(l.status === 200, '?lang= URLs must keep working (no blocking)');
  const rb = await get('/robots.txt');
  ok(rb.status === 200, 'robots.txt should be 200');

  console.log(`\n=== STAGING VERIFICATION: ${pass} passed, ${fail} failed (${base}) ===`);
  process.exit(fail ? 1 : 0);
})();
