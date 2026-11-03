// Technical SEO regression tests (Phase 1) — run against the built site in _site.
// Usage: npm run build && node scripts/test-technical-seo.js
const fs = require('fs');
const path = require('path');

const siteDir = path.join(__dirname, '..', '_site');
const ORIGIN = 'https://www.mychoicecabinet.com';

if (!fs.existsSync(siteDir)) {
  console.error('FAIL: _site does not exist. Run npm run build first.');
  process.exit(1);
}

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; } else { fail++; console.error('FAIL: ' + msg); }
}
function section(t) { console.log('\n--- ' + t + ' ---'); }

function walk(dir) {
  let out = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) out = out.concat(walk(p));
    else out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(siteDir, p).split(path.sep).join('/');
const htmlFiles = walk(siteDir).filter((f) => f.endsWith('.html'));
const read = (p) => fs.readFileSync(p, 'utf8');

// Map a URL path (/a/b/) to the built file that serves it
function fileForPath(urlPath) {
  const clean = decodeURIComponent(urlPath.split('#')[0].split('?')[0]);
  const candidates = [];
  if (clean.endsWith('/')) candidates.push(clean + 'index.html');
  else candidates.push(clean, clean + '.html', clean + '/index.html');
  for (const c of candidates) {
    const p = path.join(siteDir, c);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  return null;
}
// page file -> its public URL path
function urlForFile(file) {
  const r = rel(file);
  if (r === 'index.html') return '/';
  if (r.endsWith('/index.html')) return '/' + r.slice(0, -'index.html'.length);
  return '/' + r;
}

// ---- Sitemap -------------------------------------------------------------
const sitemapXml = read(path.join(siteDir, 'sitemap.xml'));
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const sitemapPaths = sitemapUrls.map((u) => u.replace(ORIGIN, ''));

// ---- Redirects -----------------------------------------------------------
const redirectsFile = path.join(siteDir, '_redirects');
const redirects = fs.existsSync(redirectsFile)
  ? read(redirectsFile).split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => {
      const [from, to, status] = l.split(/\s+/);
      return { from, to, status };
    })
  : [];
const redirectSources = new Set(redirects.map((r) => r.from));

section('404 page');
const nf = path.join(siteDir, '404.html');
assert(fs.existsSync(nf), '_site/404.html must exist (Cloudflare Pages serves it with HTTP 404 for unknown URLs)');
if (fs.existsSync(nf)) {
  const h = read(nf);
  assert(/<meta name="robots" content="noindex">/.test(h), '404.html must be noindex');
  assert(!/rel="canonical"/.test(h), '404.html must not declare a canonical URL');
  assert(!/hreflang=/.test(h), '404.html must not declare hreflang');
  assert(/<h1>\s*Page Not Found/.test(h), '404.html must show a "Page Not Found" heading');
  assert(h.includes('href="/"') && h.includes('href="/area-coverage/"'), '404.html must link to home and service areas');
}
assert(!sitemapPaths.includes('/404.html') && !sitemapPaths.includes('/404/'), '404 page must not be in sitemap.xml');

section('Sitemap integrity');
assert(sitemapUrls.length === 186, `sitemap must contain 186 URLs, found ${sitemapUrls.length}`);
assert(new Set(sitemapUrls).size === sitemapUrls.length, 'sitemap URLs must be unique');
let badSitemap = 0;
sitemapUrls.forEach((u) => {
  const p = u.replace(ORIGIN, '');
  if (!u.startsWith(ORIGIN + '/') || u.includes('?') || !u.endsWith('/')) { badSitemap++; console.error('  bad sitemap URL form: ' + u); return; }
  const f = fileForPath(p);
  if (!f) { badSitemap++; console.error('  sitemap URL has no built page: ' + u); return; }
  const h = read(f);
  const canon = (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (canon !== u) { badSitemap++; console.error(`  canonical mismatch for ${u}: ${canon}`); }
  if (/<meta name="robots" content="[^"]*noindex/.test(h)) { badSitemap++; console.error('  noindex page in sitemap: ' + u); }
  if (redirectSources.has(p) || redirectSources.has(p.replace(/\/$/, ''))) { badSitemap++; console.error('  sitemap URL is a redirect source: ' + u); }
});
assert(badSitemap === 0, `all sitemap URLs must be built, self-canonical, indexable and not redirected (${badSitemap} problems)`);

section('Redirect rules');
assert(redirects.length > 0, '_redirects must be copied to _site');
let badRedirects = 0;
redirects.forEach((r) => {
  const toPath = r.to;
  if (r.status !== '301') { badRedirects++; console.error('  non-301 rule: ' + r.from); }
  if (toPath === '/' || toPath === ORIGIN + '/') { badRedirects++; console.error('  redirect to homepage not allowed: ' + r.from); }
  if (/\*/.test(r.from)) { badRedirects++; console.error('  wildcard rule not allowed in this phase: ' + r.from); }
  if (!/^\//.test(toPath) || !fileForPath(toPath)) { badRedirects++; console.error(`  target does not exist: ${r.from} -> ${toPath}`); }
  if (!sitemapPaths.includes(toPath)) { badRedirects++; console.error(`  target not in sitemap: ${toPath}`); }
  if (redirectSources.has(toPath) || redirectSources.has(toPath.replace(/\/$/, ''))) { badRedirects++; console.error(`  redirect chain: ${r.from} -> ${toPath}`); }
  if (r.from === toPath) { badRedirects++; console.error('  self redirect: ' + r.from); }
  // a source must not be a live page
  if (fileForPath(r.from.replace(/\/?$/, '/'))) { badRedirects++; console.error('  redirect source is a real page: ' + r.from); }
});
assert(badRedirects === 0, `redirect rules must be valid 301s to existing, non-chained pages (${badRedirects} problems)`);

section('Canonical tags (all pages)');
let canonProblems = 0;
htmlFiles.forEach((f) => {
  if (rel(f) === '404.html') return;
  const h = read(f);
  const canons = [...h.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map((m) => m[1]);
  const expected = ORIGIN + urlForFile(f);
  if (canons.length !== 1) { canonProblems++; console.error(`  ${rel(f)} has ${canons.length} canonical tags`); }
  else if (canons[0] !== expected) { canonProblems++; console.error(`  ${rel(f)} canonical ${canons[0]} != ${expected}`); }
  else if (canons[0].includes('?')) { canonProblems++; console.error(`  ${rel(f)} canonical has a query string`); }
});
assert(canonProblems === 0, `every page needs exactly one self-referencing, query-free canonical (${canonProblems} problems)`);

section('Hreflang consistency (current ?lang= implementation — see docs/PHASE1_TECHNICAL_SEO_REPORT)');
let hrefProblems = 0;
const LANGS = { 'en-MY': 'en', 'ms-MY': 'bm', 'zh-MY': 'zh', 'ta-MY': 'ta' };
htmlFiles.forEach((f) => {
  if (rel(f) === '404.html') return;
  const h = read(f);
  const tags = [...h.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];
  const url = ORIGIN + urlForFile(f);
  const isArticle = /how-to-organize-kitchen-cabinets|calculating-kitchen-cabinet-space|tips-for-cleaning-kitchen-cabinets|privacy-policy/.test(url);
  if (isArticle) {
    if (tags.length) { hrefProblems++; console.error(`  article ${url} must not carry hreflang (single-language article)`); }
    return;
  }
  if (tags.length !== 5) { hrefProblems++; console.error(`  ${url} has ${tags.length} hreflang tags (expected 5)`); return; }
  const map = Object.fromEntries(tags.map((t) => [t[1], t[2]]));
  for (const [code, lang] of Object.entries(LANGS)) {
    if (map[code] !== `${url}?lang=${lang}`) { hrefProblems++; console.error(`  ${url} hreflang ${code} -> ${map[code]}`); }
  }
  if (map['x-default'] !== url) { hrefProblems++; console.error(`  ${url} x-default -> ${map['x-default']}`); }
});
assert(hrefProblems === 0, `hreflang sets must be complete and consistent (${hrefProblems} problems)`);

section('Structured data');
let ldProblems = 0;
let ldBlocks = 0;
htmlFiles.forEach((f) => {
  const h = read(f);
  const visible = h.replace(/<script[\s\S]*?<\/script>/g, '');
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    ldBlocks++;
    let j;
    try { j = JSON.parse(m[1]); } catch (e) { ldProblems++; console.error(`  ${rel(f)}: invalid JSON-LD: ${e.message}`); continue; }
    if (j['@context'] !== 'https://schema.org') { ldProblems++; console.error(`  ${rel(f)}: missing @context`); }
    if (/&(amp|quot|lt|gt|#\d+);/.test(m[1])) { ldProblems++; console.error(`  ${rel(f)}: HTML entity inside JSON-LD (${j['@type']})`); }
    if (/aggregateRating|"review"|ratingValue/i.test(m[1])) { ldProblems++; console.error(`  ${rel(f)}: unsupported rating/review markup`); }
    if (j['@type'] === 'FAQPage') {
      (j.mainEntity || []).forEach((q) => {
        if (!visible.includes(q.name.replace(/&/g, '&amp;')) && !visible.includes(q.name)) {
          ldProblems++; console.error(`  ${rel(f)}: FAQ question not visible on page: "${q.name}"`);
        }
      });
    }
  }
});
assert(ldBlocks > 0 && ldProblems === 0, `${ldBlocks} JSON-LD blocks must parse, be entity-free and match visible content (${ldProblems} problems)`);
['how-to-organize-kitchen-cabinets', 'calculating-kitchen-cabinet-space'].forEach((slug) => {
  const h = read(path.join(siteDir, slug, 'index.html'));
  assert(/"@type": "Article"/.test(h), `${slug} must have Article structured data`);
});

section('Internal links');
let brokenLinks = 0;
const seen = new Set();
htmlFiles.forEach((f) => {
  const h = read(f);
  for (const m of h.matchAll(/<a\s[^>]*href="(\/[^"/][^"]*|\/)"/g)) {
    const href = m[1];
    if (seen.has(href)) continue;
    seen.add(href);
    const p = href.split('#')[0].split('?')[0];
    if (!p) continue;
    if (!fileForPath(p) && !redirectSources.has(p) && !redirectSources.has(p.replace(/\/$/, ''))) {
      brokenLinks++; console.error(`  broken internal link ${href} (first seen in ${rel(f)})`);
    }
  }
});
assert(brokenLinks === 0, `internal links must resolve (${brokenLinks} broken of ${seen.size} unique)`);

section('Conversion paths (WhatsApp / phone / email)');
let convProblems = 0;
htmlFiles.forEach((f) => {
  if (rel(f) === '404.html') return;
  const h = read(f);
  if (!h.includes('https://wa.me/601124771710?text=')) { convProblems++; console.error(`  ${rel(f)} lost WhatsApp CTA`); }
  if (!h.includes('href="tel:+60178360455"')) { convProblems++; console.error(`  ${rel(f)} lost tel: link`); }
});
assert(convProblems === 0, `all pages must keep WhatsApp and tel: paths (${convProblems} problems)`);
assert(read(path.join(siteDir, 'contact-us', 'index.html')).includes('mailto:admin@mychoicecabinet.com'), 'contact page must keep mailto link');
assert(/wa\.me\/601124771710/.test(read(nf)), '404 page header must keep the WhatsApp CTA');

section('Phase 1C: restored cleaning article, privacy gate, legacy category');
{
  const slug = 'tips-for-cleaning-kitchen-cabinets';
  const fp = path.join(siteDir, slug, 'index.html');
  assert(fs.existsSync(fp), 'cleaning article page must be built');
  const h = fs.existsSync(fp) ? read(fp) : '';
  assert(h.includes('<link rel="canonical" href="' + ORIGIN + '/' + slug + '/">'), 'cleaning article must be self-canonical');
  assert(sitemapPaths.includes('/' + slug + '/'), 'cleaning article must be in sitemap.xml');
  assert(!/name="robots"[^>]*noindex/.test(h), 'cleaning article must be indexable');
  assert(!/hreflang=/.test(h), 'cleaning article must not carry hreflang (single-language article)');
  let j = null;
  for (const b of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { const o = JSON.parse(b[1]); if (o['@type'] === 'BlogPosting') j = o; } catch (e) { /* parse failures are caught by the JSON-LD test above */ } }
  assert(j && j['@type'] === 'BlogPosting' && j.datePublished === '2024-05-16' && /^\d{4}-\d{2}-\d{2}$/.test(j.dateModified) && j.dateModified >= j.datePublished, 'cleaning article needs BlogPosting JSON-LD with original datePublished 2024-05-16 and a valid dateModified');
  assert(j && j.mainEntityOfPage && j.mainEntityOfPage['@id'] === ORIGIN + '/' + slug + '/', 'cleaning article JSON-LD mainEntityOfPage must be the canonical URL');
  ['/how-to-organize-kitchen-cabinets/', '/calculating-kitchen-cabinet-space/', '/area-coverage/', '/contact-us/'].forEach((l) => assert(h.includes('href="' + l + '"'), 'cleaning article must link to ' + l));
  assert(!/(we tested|our testing|in our experience|we personally)/i.test(h), 'cleaning article must not claim testing or personal experience');
  assert(read(path.join(siteDir, 'index.html')).includes('href="/' + slug + '/"'), 'footer must link to the cleaning article');
  assert(!redirectSources.has('/' + slug + '/') && !redirectSources.has('/' + slug), 'cleaning article must not be redirected');

  // Privacy policy is gated: in the default build it must not exist anywhere (see _data/privacy.js)
  assert(!fs.existsSync(path.join(siteDir, 'privacy-policy')), 'privacy policy must NOT be built until the owner approves it');
  assert(!sitemapPaths.includes('/privacy-policy/'), 'unapproved privacy policy must not be in sitemap');
  assert(!htmlFiles.some((f) => /href="\/privacy-policy\/"/.test(read(f))), 'no page may link to an unpublished privacy policy');
  assert(!redirectSources.has('/privacy-policy/') && !redirectSources.has('/privacy-policy') && !redirectSources.has('/category/kitchen-cabinet/') && !redirectSources.has('/category/kitchen-cabinet'), 'privacy-policy and legacy category must not be redirected to the homepage');
  assert(!fs.existsSync(path.join(siteDir, 'category')), 'legacy /category/ has no equivalent page and must stay 404');
}

console.log(`\n=== TECHNICAL SEO TESTS: ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
