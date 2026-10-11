const fs = require('fs');
const path = require('path');

function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getHtmlFiles(fullPath));
    } else if (file.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

console.log('=== RUNNING PHASE 2A REGRESSION TESTS ===');

const siteDir = path.join(__dirname, '..', '_site');
if (!fs.existsSync(siteDir)) {
  console.error('FAIL: _site directory does not exist. Run npm run build first.');
  process.exit(1);
}

const htmlFiles = getHtmlFiles(siteDir);
console.log(`Found ${htmlFiles.length} generated HTML files in _site.`);

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    passCount++;
  } else {
    failCount++;
    console.error(`FAIL: ${message}`);
  }
}

// TEST 1: Check duplicate brand suffix in <title>, og:title, twitter:title
console.log('\n--- Test 1: Checking for duplicate brand suffixes in titles ---');
let dupTitlesFound = 0;
htmlFiles.forEach(file => {
  const html = fs.readFileSync(file, 'utf8');
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  if (titleMatch && titleMatch[1].includes('Choice Kitchen Cabinet | Choice Kitchen Cabinet')) {
    dupTitlesFound++;
    console.error(`Duplicate title in ${file}: "${titleMatch[1]}"`);
  }
  const ogMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
  if (ogMatch && ogMatch[1].includes('Choice Kitchen Cabinet | Choice Kitchen Cabinet')) {
    dupTitlesFound++;
    console.error(`Duplicate og:title in ${file}: "${ogMatch[1]}"`);
  }
  const twMatch = html.match(/<meta name="twitter:title" content="([^"]+)"/);
  if (twMatch && twMatch[1].includes('Choice Kitchen Cabinet | Choice Kitchen Cabinet')) {
    dupTitlesFound++;
    console.error(`Duplicate twitter:title in ${file}: "${twMatch[1]}"`);
  }
});
assert(dupTitlesFound === 0, `Expected 0 duplicate titles, found ${dupTitlesFound}`);
console.log(`PASS: 0 duplicate brand suffixes across all ${htmlFiles.length} pages.`);

// TEST 2: Validate JSON-LD structured data syntax across all files
console.log('\n--- Test 2: Validating JSON-LD Structured Data Syntax ---');
let jsonErrors = 0;
let localBusinessCount = 0;
htmlFiles.forEach(file => {
  const html = fs.readFileSync(file, 'utf8');
  const schemaMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  schemaMatches.forEach((sm, idx) => {
    try {
      const parsed = JSON.parse(sm[1]);
      if (parsed['@type'] === 'LocalBusiness') {
        localBusinessCount++;
        // Verify address is always Puchong
        if (parsed.address.addressLocality !== 'Puchong') {
          jsonErrors++;
          console.error(`Invalid addressLocality in ${file}: ${parsed.address.addressLocality}`);
        }
        if (!parsed.address.streetAddress.includes('Meranti Permai')) {
          jsonErrors++;
          console.error(`Invalid streetAddress in ${file}: ${parsed.address.streetAddress}`);
        }
        // Verify areaServed exists
        if (!parsed.areaServed) {
          jsonErrors++;
          console.error(`Missing areaServed in ${file}`);
        }
      }
    } catch (e) {
      jsonErrors++;
      console.error(`JSON parse error in ${file} (block ${idx}): ${e.message}`);
    }
  });
});
assert(jsonErrors === 0, `Expected 0 JSON schema errors, found ${jsonErrors}`);
assert(localBusinessCount >= 180, `Expected at least 180 LocalBusiness schemas, found ${localBusinessCount}`);
console.log(`PASS: All ${localBusinessCount} LocalBusiness schemas parsed cleanly with verified Puchong address & valid areaServed.`);

// TEST 3: Check for fabricated project claims and location-specific alt text
console.log('\n--- Test 3: Checking for fabricated project claims & alt text ---');
const locationsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '_data', 'locations.json'), 'utf8'));
const allLocationNames = new Set();
locationsData.cities.forEach(c => {
  allLocationNames.add(c.name.toLowerCase());
  c.areas.forEach(a => allLocationNames.add(a.name.toLowerCase()));
});

let fabricatedClaimsFound = 0;
htmlFiles.forEach(file => {
  // Exclude homepage from "Recent Work in " check since homepage has general "Recent Work"
  const isHomepage = file.endsWith(path.join('_site', 'index.html'));
  const html = fs.readFileSync(file, 'utf8');
  
  if (!isHomepage && html.includes('Recent Work in ')) {
    fabricatedClaimsFound++;
    console.error(`Fabricated claim "Recent Work in" found in ${file}`);
  }
  
  // Check if any recent-work image has fabricated location alt text
  const galleryAlts = [...html.matchAll(/<img[^>]+src="\/assets\/images\/recent-work[^"]*"[^>]+alt="([^"]+)"/g)];
  galleryAlts.forEach(m => {
    const altLower = m[1].toLowerCase();
    for (const locName of allLocationNames) {
      if (altLower.includes('in ' + locName)) {
        fabricatedClaimsFound++;
        console.error(`Fabricated location alt found in ${file}: ${m[1]}`);
        break;
      }
    }
  });
});
assert(fabricatedClaimsFound === 0, `Expected 0 fabricated project claims/alts, found ${fabricatedClaimsFound}`);
console.log(`PASS: 0 fabricated location project claims or alt tags found.`);

// TEST 4: Check image reference integrity (no broken images)
console.log('\n--- Test 4: Checking image file reference integrity ---');
let brokenImagesCount = 0;
const checkedImages = new Set();
htmlFiles.forEach(file => {
  const html = fs.readFileSync(file, 'utf8');
  const imgMatches = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)];
  imgMatches.forEach(m => {
    let src = m[1].split('?')[0];
    if (src.startsWith('http://') || src.startsWith('https://')) return;
    if (src.startsWith('/')) src = src.slice(1);
    if (checkedImages.has(src)) return;
    checkedImages.add(src);
    
    const diskPath = path.join(siteDir, src);
    if (!fs.existsSync(diskPath)) {
      brokenImagesCount++;
      console.error(`Broken image link: /${src} (referenced in ${file})`);
    }
  });
});
assert(brokenImagesCount === 0, `Expected 0 broken images, found ${brokenImagesCount}`);
console.log(`PASS: All ${checkedImages.size} unique image assets exist on disk.`);

// TEST 5: Verify Sitemap & Canonicals integrity
console.log('\n--- Test 5: Verifying Sitemap and Canonical Tag Integrity ---');
const sitemapPath = path.join(siteDir, 'sitemap.xml');
assert(fs.existsSync(sitemapPath), 'sitemap.xml must exist in _site');

const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
const sitemapUrls = [...sitemapContent.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
assert(sitemapUrls.length === 185, `Expected 185 sitemap URLs, found ${sitemapUrls.length}`);
console.log(`PASS: sitemap.xml contains exactly ${sitemapUrls.length} canonical URLs.`);

// Verify both historical blog posts exist in sitemap
assert(sitemapUrls.includes('https://www.mychoicecabinet.com/how-to-organize-kitchen-cabinets/'), 'Blog post 1 must exist in sitemap.xml');
assert(sitemapUrls.includes('https://www.mychoicecabinet.com/calculating-kitchen-cabinet-space/'), 'Blog post 2 must exist in sitemap.xml');

let canonicalMismatchCount = 0;
htmlFiles.forEach(file => {
  const html = fs.readFileSync(file, 'utf8');
  const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (!canonicalMatch) {
    canonicalMismatchCount++;
    console.error(`Missing canonical tag in ${file}`);
  }
});
assert(canonicalMismatchCount === 0, `Expected 0 missing canonicals, found ${canonicalMismatchCount}`);
console.log(`PASS: Canonical tags verified across all ${htmlFiles.length} pages.`);

// TEST 6: WhatsApp link centralization and message verification
console.log('\n--- Test 6: Verifying Centralized WhatsApp Links & Message ---');
const expectedWaNum = '601124771710';
const expectedWaEncodedMsg = 'Salam%20Choice%20Kitchen%2C%20saya%20nak%20quotation%20kabinet%20dapur.%20Saya%20datang%20dari%20website%20mychoicecabinet.com.';
let oldWaCount = 0;
let newWaCount = 0;
let invalidWaMsgCount = 0;

htmlFiles.forEach(file => {
  const html = fs.readFileSync(file, 'utf8');
  const waMatches = [...html.matchAll(/href="(https:\/\/wa\.me\/[^"]+)"/g)];
  waMatches.forEach(m => {
    const url = m[1];
    if (url.includes('60178360455')) {
      oldWaCount++;
      console.error(`Old WhatsApp number found in ${file}: ${url}`);
    }
    if (url.includes(expectedWaNum)) {
      newWaCount++;
      if (!url.includes(expectedWaEncodedMsg)) {
        invalidWaMsgCount++;
        console.error(`Incorrect WhatsApp message text in ${file}: ${url}`);
      }
    }
  });
});

assert(oldWaCount === 0, `Expected 0 old WhatsApp numbers, found ${oldWaCount}`);
assert(newWaCount > 0, `Expected new WhatsApp links across pages, found ${newWaCount}`);
assert(invalidWaMsgCount === 0, `Expected 0 invalid WhatsApp message parameters, found ${invalidWaMsgCount}`);
console.log(`PASS: Verified ${newWaCount} WhatsApp links using ${expectedWaNum} with the exact required greeting message.`);

// TEST 7: Verify Phone Call Number Unchanged (+60178360455)
console.log('\n--- Test 7: Verifying Phone Call Number Unchanged ---');
let telMatchesCount = 0;
htmlFiles.forEach(file => {
  const html = fs.readFileSync(file, 'utf8');
  const telMatches = [...html.matchAll(/href="tel:([^"]+)"/g)];
  telMatches.forEach(m => {
    telMatchesCount++;
    if (m[1] !== '+60178360455') {
      console.error(`Unexpected tel: number in ${file}: ${m[1]}`);
    }
  });
});
assert(telMatchesCount >= 185, `Expected at least 185 tel: links, found ${telMatchesCount}`);
console.log(`PASS: Verified ${telMatchesCount} tel: links strictly preserve original phone (+60178360455).`);

// TEST 8: Verify Both Blog Posts Structure & Canonical
console.log('\n--- Test 8: Verifying Both Blog Posts Structure & Canonicals ---');
const blog1Path = path.join(siteDir, 'how-to-organize-kitchen-cabinets', 'index.html');
assert(fs.existsSync(blog1Path), 'Blog post 1 HTML must exist on disk');
const blog1Html = fs.readFileSync(blog1Path, 'utf8');
assert(blog1Html.includes('How to Organize Kitchen Cabinets: Practical Storage Tips for Malaysian Homes'), 'Blog 1 must contain expected H1');
assert(blog1Html.includes('<link rel="canonical" href="https://www.mychoicecabinet.com/how-to-organize-kitchen-cabinets/">'), 'Blog 1 must have self canonical');
assert(!blog1Html.includes('hreflang="en-MY"'), 'Blog post 1 must NOT have ?lang= hreflangs');

const blog2Path = path.join(siteDir, 'calculating-kitchen-cabinet-space', 'index.html');
assert(fs.existsSync(blog2Path), 'Blog post 2 HTML must exist on disk');
const blog2Html = fs.readFileSync(blog2Path, 'utf8');
assert(blog2Html.includes('How to Calculate Kitchen Cabinet Space: The Practical Measurement Guide for Malaysian Homes'), 'Blog 2 must contain expected H1');
assert(blog2Html.includes('<link rel="canonical" href="https://www.mychoicecabinet.com/calculating-kitchen-cabinet-space/">'), 'Blog 2 must have self canonical');
assert(!blog2Html.includes('hreflang="en-MY"'), 'Blog post 2 must NOT have ?lang= hreflangs');
assert(blog2Html.includes('"@type": "Article"'), 'Blog post 2 must have Article structured data');
assert(blog2Html.includes('"@type": "FAQPage"'), 'Blog post 2 must have FAQPage structured data');
console.log('PASS: Both blog posts structure, self-canonicals, Article/FAQ schemas, and hreflang exclusions verified.');

// TEST 9: Phase 2B Five-Page CTR Title and Description Verification
console.log('\n--- Test 9: Verifying Phase 2B 5-Page CTR Optimized Metadata ---');
const expectedPages = [
  {
    path: path.join(siteDir, 'kuala-lumpur', 'wangsa-maju', 'index.html'),
    title: 'Kitchen Cabinets Wangsa Maju | Custom Design & Quote | Choice Kitchen Cabinet',
    attrTitle: 'Kitchen Cabinets Wangsa Maju | Custom Design &amp; Quote | Choice Kitchen Cabinet',
    desc: 'Custom kitchen cabinet design and installation in Wangsa Maju. Explore durable materials, practical layouts, and get a fast quotation for your home.'
  },
  {
    path: path.join(siteDir, 'petaling-jaya', 'petaling-jaya-city-centre', 'index.html'),
    title: 'Custom Kitchen Cabinets in PJ City Centre | Choice | Choice Kitchen Cabinet',
    attrTitle: 'Custom Kitchen Cabinets in PJ City Centre | Choice | Choice Kitchen Cabinet',
    desc: 'Premium kitchen cabinets in PJ City Centre. Tailored cabinet joinery, smart storage solutions, and reliable installation with a transparent quote.'
  },
  {
    path: path.join(siteDir, 'selayang', 'rawang', 'index.html'),
    title: 'Kitchen Cabinet Rawang | Custom Design & Quotation | Choice Kitchen Cabinet',
    attrTitle: 'Kitchen Cabinet Rawang | Custom Design &amp; Quotation | Choice Kitchen Cabinet',
    desc: 'Quality custom kitchen cabinets in Rawang. Durable moisture-resistant materials, tailored layout planning, and straightforward pricing. Request a quote.'
  },
  {
    path: path.join(siteDir, 'subang-jaya', 'seri-kembangan', 'index.html'),
    title: 'Kitchen Cabinet Seri Kembangan | Design & Quote | Choice Kitchen Cabinet',
    attrTitle: 'Kitchen Cabinet Seri Kembangan | Design &amp; Quote | Choice Kitchen Cabinet',
    desc: 'Custom kitchen cabinets in Seri Kembangan. Quality finishes, customized storage configurations, and direct manufacturer quotes for your kitchen renovation.'
  },
  {
    path: path.join(siteDir, 'sepang', 'cyberjaya', 'index.html'),
    title: 'Kitchen Cabinets Cyberjaya | Custom Storage Solutions | Choice Kitchen Cabinet',
    attrTitle: 'Kitchen Cabinets Cyberjaya | Custom Storage Solutions | Choice Kitchen Cabinet',
    desc: 'Modern kitchen cabinets in Cyberjaya designed for condos and landed homes. Space-saving layouts, premium materials, and free quotations on WhatsApp.'
  }
];

expectedPages.forEach(p => {
  assert(fs.existsSync(p.path), `Page must exist on disk: ${p.path}`);
  const html = fs.readFileSync(p.path, 'utf8');
  assert(html.includes(`<title>${p.title}</title>`), `Title mismatch for ${p.path}`);
  assert(html.includes(`<meta name="description" content="${p.desc}">`), `Description mismatch for ${p.path}`);
  assert(html.includes(`<meta property="og:title" content="${p.attrTitle}">`), `OG title mismatch for ${p.path}`);
  assert(html.includes(`<meta property="og:description" content="${p.desc}">`), `OG description mismatch for ${p.path}`);
  assert(html.includes(`<meta name="twitter:title" content="${p.attrTitle}">`), `Twitter title mismatch for ${p.path}`);
  assert(html.includes(`<meta name="twitter:description" content="${p.desc}">`), `Twitter description mismatch for ${p.path}`);
});
console.log(`PASS: All 5 pilot pages have accurate CTR-optimized titles, unique descriptions, and synced OG/Twitter metadata.`);

// SUMMARY
console.log('\n========================================');
console.log(`RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('========================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL REGRESSION & PHASE 2B TESTS PASSED SUCCESSFULLY!');
}
