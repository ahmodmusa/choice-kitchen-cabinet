const fs = require('fs');
const path = require('path');

const sampleFiles = [
  '_site/index.html',
  '_site/shah-alam/index.html',
  '_site/subang-jaya/puchong/index.html',
  '_site/selayang/bandar-baru-selayang/index.html',
  '_site/klang/port-klang/index.html',
  '_site/sepang/cyberjaya/index.html',
  '_site/shah-alam/kota-kemuning/index.html',
  '_site/shah-alam/puncak-perdana/index.html'
];

sampleFiles.forEach(file => {
  console.log('==================================================');
  console.log('FILE:', file);
  const html = fs.readFileSync(file, 'utf8');
  
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  console.log('TITLE:', titleMatch ? titleMatch[1] : 'NONE');
  
  const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/);
  console.log('OG:TITLE:', ogTitle ? ogTitle[1] : 'NONE');

  const twTitle = html.match(/<meta name="twitter:title" content="([^"]+)"/);
  console.log('TW:TITLE:', twTitle ? twTitle[1] : 'NONE');
  
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  console.log('CANONICAL:', canonical ? canonical[1] : 'NONE');
  
  const hreflangs = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(m => m[1] + ' -> ' + m[2]);
  console.log('HREFLANG COUNT:', hreflangs.length);
  
  // Check LocalBusiness
  const schemaMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  schemaMatches.forEach((sm, i) => {
    try {
      const parsed = JSON.parse(sm[1]);
      if (parsed['@type'] === 'LocalBusiness') {
        console.log('SCHEMA LocalBusiness StreetAddress:', parsed.address?.streetAddress);
        console.log('SCHEMA LocalBusiness AddressLocality:', parsed.address?.addressLocality);
        console.log('SCHEMA LocalBusiness areaServed:', JSON.stringify(parsed.areaServed));
      }
    } catch(e) {
      console.log('SCHEMA PARSE ERROR in block', i, e.message);
    }
  });

  // Check gallery section title & alt tags
  const galleryMatches = [...html.matchAll(/<h2 class="section-title"><span data-lang="en">([^<]+)<\/span>/g)];
  if (galleryMatches.length) {
    console.log('SECTION TITLES (EN):', galleryMatches.map(m => m[1]).join(' | '));
  }
  const altTags = [...html.matchAll(/<img[^>]+src="\/assets\/images\/recent-work[^"]*"[^>]+alt="([^"]+)"/g)].map(m => m[1]);
  if (altTags.length) {
    console.log('SAMPLE ALT TAGS (first 3):', altTags.slice(0, 3));
  }
});
