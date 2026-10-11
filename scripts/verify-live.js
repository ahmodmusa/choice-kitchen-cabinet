const https = require('https');

const urls = [
  'https://www.mychoicecabinet.com/',
  'https://www.mychoicecabinet.com/how-to-organize-kitchen-cabinets/',
  'https://www.mychoicecabinet.com/calculating-kitchen-cabinet-space/',
  'https://www.mychoicecabinet.com/kuala-lumpur/wangsa-maju/',
  'https://www.mychoicecabinet.com/petaling-jaya/petaling-jaya-city-centre/',
  'https://www.mychoicecabinet.com/selayang/rawang/',
  'https://www.mychoicecabinet.com/subang-jaya/seri-kembangan/',
  'https://www.mychoicecabinet.com/sepang/cyberjaya/',
  'https://www.mychoicecabinet.com/sitemap.xml'
];

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (url.endsWith('.xml')) {
          const locCount = (data.match(/<loc>/g) || []).length;
          const hasOrg = data.includes('how-to-organize-kitchen-cabinets');
          const hasCalc = data.includes('calculating-kitchen-cabinet-space');
          return resolve({
            url,
            status: res.statusCode,
            locCount,
            hasOrgArticle: hasOrg,
            hasCalcArticle: hasCalc,
            length: data.length
          });
        }
        const titleMatch = data.match(/<title>([^<]+)<\/title>/);
        const title = titleMatch ? titleMatch[1] : 'No Title';
        const h1Match = data.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
        const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().substring(0, 60) : 'None';
        const canonicalMatch = data.match(/<link rel="canonical" href="([^"]+)"/);
        const canonical = canonicalMatch ? canonicalMatch[1] : 'None';
        const metaDescMatch = data.match(/<meta name="description" content="([^"]+)"/);
        const metaDesc = metaDescMatch ? metaDescMatch[1] : 'None';
        const hasMerantiPermai = data.includes('Meranti Permai');
        const hasMeranitPermai = data.includes('Meranit Permai');
        const hasWhatsAppNum = data.includes('601124771710');
        const hasExactGreeting = data.includes(encodeURIComponent('Salam Choice Kitchen, saya nak quotation kabinet dapur. Saya datang dari website mychoicecabinet.com.'));
        const hasPhone = data.includes('+60 17-836 0455') || data.includes('+60178360455');
        resolve({
          url,
          status: res.statusCode,
          title,
          h1,
          canonical,
          metaDesc: metaDesc.substring(0, 70) + '...',
          hasMerantiPermai,
          hasMeranitPermai,
          hasWhatsAppNum,
          hasExactGreeting,
          hasPhone,
          length: data.length
        });
      });
    }).on('error', (e) => {
      resolve({ url, status: 'ERROR', error: e.message });
    });
  });
}

(async () => {
  console.log('=== STARTING LIVE PRODUCTION AUDIT ===\n');
  for (const u of urls) {
    const res = await checkUrl(u);
    console.log(JSON.stringify(res, null, 2));
  }
  console.log('\n=== LIVE PRODUCTION AUDIT COMPLETED ===');
})();
