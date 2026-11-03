// Read-only HTTP QA against a deployed site (staging/preview/local emulator). GET/HEAD only.
// Usage: SITE=choice|orked BASE_URL=https://host node scripts/qa-http.mjs
const SITE = process.env.SITE;
const BASE = (process.env.BASE_URL || '').replace(/\/$/, '');
const PROFILES = {
  choice: {
    origin: 'https://www.mychoicecabinet.com', sitemap: '/sitemap.xml', expectUrls: 186,
    ga: 'G-WY69TY8LTH', wa: 'wa.me/601124771710', tel: 'tel:+60178360455', mail: 'mailto:admin@mychoicecabinet.com',
    hreflang: 'choice',
    legacy: {
      '/petaling-jaya/best-price-kitchen-cabinets-in-ara-damansara-month-year/': '/petaling-jaya/ara-damansara/',
      '/petaling-jaya/best-price-kitchen-cabinets-in-kota-damansara-month-year/': '/petaling-jaya/kota-damansara/',
      '/petaling-jaya/best-price-kitchen-cabinets-in-petaling-jaya-selatan-month-year/': '/petaling-jaya/petaling-jaya-selatan/',
      '/ampang-jaya/pandan-pandan-indah/': '/ampang-jaya/pandan-indah/',
      '/sepang/seri-kembangan-south-sepang-utara/': '/sepang/seri-kembangan-south/',
      '/sepang/kota-warisan-2/': '/sepang/kota-warisan/'
    },
    notFound: ['/nonexistent-xyz/', '/blog/', '/assets/missing.jpg', '/privacy-policy/', '/category/kitchen-cabinet/'],
    separately: [],
    protect: ['/klang/port-klang/', '/shah-alam/sungai-buloh/', '/selayang/rawang/', '/kuala-lumpur/wangsa-maju/', '/selayang/gombak/', '/subang-jaya/puchong/', '/petaling-jaya/petaling-jaya-city-centre/']
  },
  orked: {
    origin: 'https://orkedcabinet.com', sitemap: '/sitemap-0.xml', expectUrls: 80,
    ga: 'G-MVL0WBRQKH', wa: 'wa.me/601124771710', tel: null, mail: null,
    hreflang: 'orked',
    legacy: { '/home-2/': '/', '/home-2': '/', '/gallery/': '/projects/', '/gallery': '/projects/', '/contact/': '/#contact', '/contact': '/#contact', '/sitemap_index.xml': '/sitemap-index.xml' },
    notFound: ['/nonexistent-xyz/', '/feed/', '/wp-login.php'],
    separately: [],
    protect: ['/', '/services/', '/projects/', '/service-areas/']
  }
};
const P = PROFILES[SITE];
if (!P || !BASE) { console.error('Set SITE=choice|orked and BASE_URL'); process.exit(2); }

let pass = 0, fail = 0;
const failures = [];
const ok = (c, m) => { if (c) pass++; else { fail++; failures.push(m); console.error('FAIL: ' + m); } };
const get = (p, opts = {}) => fetch(BASE + p, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (qa-http)' }, ...opts });
const loc = (r, p) => { const l = r.headers.get('location'); return l ? new URL(l, BASE + p).href.replace(BASE, '') : ''; };

// ---- sitemap
const smRes = await get(P.sitemap);
ok(smRes.status === 200, `${P.sitemap} -> 200 (got ${smRes.status})`);
const smXml = await smRes.text();
const paths = [...smXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(P.origin, ''));
ok(paths.length === P.expectUrls, `sitemap lists ${P.expectUrls} URLs (got ${paths.length})`);
ok(new Set(paths).size === paths.length, 'sitemap URLs unique');

// ---- every sitemap URL
const pages = {};
let k = 0;
for (const p of paths) {
  const r = await get(p);
  if (r.status !== 200) { ok(false, `${p} -> ${r.status}`); continue; }
  const h = await r.text();
  pages[p] = h;
  k++;
}
ok(k === paths.length, `all ${paths.length} sitemap URLs return 200 directly (${k} ok)`);

let canon = 0, noidx = 0, ld = 0, ldBad = 0, hre = 0, cta = 0, ga = 0, tel = 0, mail = 0, ent = 0;
const internal = new Set();
const images = new Set();
for (const [p, h] of Object.entries(pages)) {
  const c = (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (c === P.origin + p) canon++; else ok(false, `canonical ${p}: ${c}`);
  if (!/<meta name="robots" content="[^"]*noindex/.test(h)) noidx++; else ok(false, `noindex in sitemap page ${p}`);
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    ld++;
    try { JSON.parse(m[1]); } catch (e) { ldBad++; ok(false, `JSON-LD parse ${p}: ${e.message}`); }
    if (/&(amp|quot|lt|gt|#\d+);/.test(m[1])) { ent++; ok(false, `HTML entity in JSON-LD ${p}`); }
  }
  const tags = [...h.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]);
  if (P.hreflang === 'choice') {
    const article = /how-to-organize|calculating-kitchen|tips-for-cleaning/.test(p);
    const exp = article ? 0 : 5;
    if (tags.length === exp && (article || tags.find((t) => t[0] === 'x-default')[1] === P.origin + p)) hre++; else ok(false, `hreflang ${p}: ${tags.length} tags`);
  } else {
    const set = tags.map((t) => t[0]).sort().join();
    if (set === ['en-MY', 'ms-MY', 'ta-MY', 'x-default', 'zh-Hans'].sort().join() && tags.some((t) => t[1] === P.origin + p)) hre++; else ok(false, `hreflang ${p}: ${set}`);
  }
  if (h.includes(P.wa)) cta++; else ok(false, `WhatsApp CTA missing ${p}`);
  if (h.includes(P.ga)) ga++; else ok(false, `GA tag ${P.ga} missing ${p}`);
  if (P.tel) { if (h.includes(P.tel)) tel++; else ok(false, `tel missing ${p}`); }
  if (P.mail && p === '/contact-us/') { if (h.includes(P.mail)) mail++; else ok(false, `mailto missing ${p}`); }
  for (const m of h.matchAll(/<a\s[^>]*href="(\/[^"]*)"/g)) { if (!m[1].startsWith('//') && !m[1].startsWith('/cdn-cgi/')) internal.add(m[1].split('#')[0].split('?')[0] || '/'); }
  for (const m of h.matchAll(/<img[^>]+src="(\/[^"]+)"/g)) images.add(m[1].split('?')[0]);
}
const n = paths.length;
ok(canon === n, `canonical correct on ${canon}/${n}`);
ok(noidx === n, `no noindex on ${noidx}/${n}`);
ok(ldBad === 0 && ent === 0, `JSON-LD: ${ld} blocks, ${ldBad} unparsable, ${ent} with HTML entities`);
ok(hre === n, `hreflang correct on ${hre}/${n}`);
ok(cta === n, `WhatsApp CTA on ${cta}/${n}`);
ok(ga === n, `analytics tag ${P.ga} on ${ga}/${n}`);
if (P.tel) ok(tel === n, `tel link on ${tel}/${n}`);

// ---- internal links + images resolve (HEAD/GET, follow at most 1 redirect hop reported)
let brokenLinks = 0, redirLinks = 0;
for (const l of internal) {
  const r = await get(l);
  if (r.status === 200) continue;
  if ([301, 308].includes(r.status) && (r.headers.get('location') || '')) { redirLinks++; continue; } // trailing-slash style
  brokenLinks++; ok(false, `internal link ${l} -> ${r.status}`);
}
ok(brokenLinks === 0, `${internal.size} unique internal links: ${brokenLinks} broken, ${redirLinks} redirecting`);
let brokenImg = 0;
for (const i of images) { const r = await get(i); if (r.status !== 200) { brokenImg++; ok(false, `image ${i} -> ${r.status}`); } }
ok(brokenImg === 0, `${images.size} unique images load (${brokenImg} broken)`);

// ---- 404 behaviour
for (const p of P.notFound) {
  const r = await get(p);
  ok(r.status === 404, `${p} -> 404 (got ${r.status})`);
}
const nf = await (await get('/nonexistent-xyz/')).text();
ok(/Page Not Found|404/i.test(nf) && nf.length < 120000, 'unknown URL renders a 404 page (not the homepage)');
ok(!/<title>[^<]*Best Quality Kitchen Cabinet Manufacturer in Malaysia/.test(nf) && !/<title>Custom Kitchen Cabinets Selangor/.test(nf), '404 body is not the homepage');

// ---- legacy redirects (single hop, no loops, not to homepage unless expected)
for (const [from, to] of Object.entries(P.legacy)) {
  const r = await get(from);
  ok(r.status === 301 && loc(r, from) === to, `${from} -> 301 ${to} (got ${r.status} ${loc(r, from)})`);
  if (to !== '/' && !to.startsWith('/#')) { const t = await get(to); ok(t.status === 200 || t.status === 200, `redirect target ${to} -> ${t.status}`); }
}

// ---- protected / separately-reported URLs
for (const p of P.protect) {
  const r = await get(p);
  const h = r.status === 200 ? await r.text() : '';
  const c = (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  ok(r.status === 200 && c === P.origin + p && /LocalBusiness|HomeAndConstructionBusiness/.test(h), `protected ${p}: ${r.status}, canonical ${c}, schema present`);
}
for (const p of P.separately) { const r = await get(p); console.log(`INFO separately-reviewed ${p} -> ${r.status}`); }

console.log(`\n=== QA ${SITE} @ ${BASE}: ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
