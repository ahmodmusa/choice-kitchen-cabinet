# Privacy Policy — মালিকের অনুমোদন চেকলিস্ট (Choice Kitchen Cabinet)

**স্ট্যাটাস: খসড়া তৈরি, প্রকাশিত নয়।** `/privacy-policy/` এখন production build-এ তৈরিই হয় না (সাইটম্যাপে নেই, footer-এ লিংক নেই)।
কারণ: আইনি লেখায় অমীমাংসিত তথ্য থাকলে প্রকাশ করা যাবে না। নিচের সব ঘর পূরণ ও অনুমোদন হলে তবেই চালু হবে।

## কীভাবে খসড়া দেখবেন (স্থানীয়, নিরাপদ)
```bash
PRIVACY_PREVIEW=1 npx eleventy --output=.privacy-preview
```
এতে `.privacy-preview/privacy-policy/index.html` তৈরি হয়: "DRAFT — NOT APPROVED" ব্যানার, `noindex`, ফাঁকা তথ্য `[OWNER TO CONFIRM: …]` হিসেবে দেখায়। `_site` বদলায় না।

## প্রকাশের দুটি শর্ত (দুটোই কোডে বাধ্যতামূলক)
1. `_data/privacy.js`-এর `facts`-এর সব ঘর পূরণ।
2. একই ফাইলে `approved = true`। কোনো ঘর ফাঁকা থেকে `approved = true` করলে build ব্যর্থ হয় (টেস্ট করা আছে)।

## A. মালিককে যে তথ্য দিতে হবে (আমি অনুমান করিনি)
| # | `facts` key | কী লাগবে | বর্তমান অবস্থা |
|---|---|---|---|
| 1 | `legalEntityName` | ওয়েবসাইট পরিচালনাকারী প্রতিষ্ঠানের নিবন্ধিত নাম (SSM অনুযায়ী) | অজানা — WP ডেটায় "A&C Services" নামটি পাওয়া গিয়েছিল কিন্তু এটি এই সাইটের বৈধ সত্তা কি না **যাচাই হয়নি** |
| 2 | `privacyContactEmail` | গোপনীয়তা-সংক্রান্ত অনুরোধ যে ইমেইলে আসবে | `admin@mychoicecabinet.com` সাইটে প্রকাশিত, কিন্তু এটিই privacy contact কি না আপনাকে নিশ্চিত করতে হবে |
| 3 | `privacyContactPhone` | ফোন (ঐচ্ছিক; না দিলে `none`) | `+60 17-836 0455` সাইটে আছে; নিশ্চিত করুন |
| 4 | `enquiryRetention` | WhatsApp/ফোন/ইমেইল enquiry রেকর্ড কতদিন রাখেন (আপনার প্রকৃত অনুশীলন) | অজানা — কোনো সময়সীমা বানানো হয়নি |
| 5 | `analyticsRetention` | GA4 property-তে সেট করা data retention (GA4 Admin → Data settings → Data retention) | অজানা — GA অ্যাক্সেস নেই |
| 6 | `hostingProvider` | হোস্টিং/CDN প্রদানকারী | বাহ্যিক প্রমাণে Cloudflare Pages; Cloudflare dashboard থেকে **নিশ্চিত হয়নি** |
| 7 | `effectiveDate` | আপনি যেদিন লেখা অনুমোদন করলেন (YYYY-MM-DD) | — |

## B. কোড পরিদর্শনে যা প্রমাণিত (খসড়ার ভিত্তি)
- কোনো ফর্ম নেই (`<form>` = 0); enquiry হয় WhatsApp (`wa.me`), `tel:`, `mailto:` দিয়ে।
- Google Analytics 4 (`G-WY69TY8LTH`) + Google Tag Manager স্ক্রিপ্ট সব পেজে; WhatsApp/ফোন/ইমেইল ক্লিক `gtag('event','contact')` হিসেবে পাঠানো হয় (বার্তার বিষয়বস্তু নয়)।
- Google Fonts (`fonts.googleapis.com`) ও Google Maps embed (footer iframe) — ব্রাউজার থেকে Google-এ IP যায়।
- সাইটের নিজস্ব কোড কুকি/`localStorage`/`sessionStorage` ব্যবহার করে না (`js/` ও টেমপ্লেট grep করা)। ভাষা বদলালে URL-এ `?lang=` যোগ হয়।
- Facebook Pixel ID placeholder (`YOUR_FACEBOOK_PIXEL_ID`) — **নিষ্ক্রিয়**, তাই নীতিতে উল্লেখ নেই। পরে চালু করলে নীতি হালনাগাদ করতে হবে।
- Facebook/YouTube/LinkedIn/TikTok শুধু আউটবাউন্ড লিংক।
- কোনো cookie consent banner নেই; নীতিতে কোনো "সম্মতি ব্যবস্থা" দাবি করা হয়নি।

## C. আপনার সিদ্ধান্ত/যাচাই দরকার
- [ ] PDPA 2010 অনুযায়ী Malay + English notice বজায় আছে — **আইনজীবীর পর্যালোচনা সুপারিশ করা হচ্ছে** (আমি আইনি পরামর্শদাতা নই; ধারা নম্বর ইচ্ছে করেই ব্যবহার করিনি)।
- [ ] Enquiry তথ্য কোথায় থাকে (শুধু ফোন/WhatsApp, নাকি CRM/স্প্রেডশিট/Google Drive)? অন্য কোনো টুল থাকলে তৃতীয়-পক্ষ তালিকায় যোগ করতে হবে।
- [ ] ইনস্টলেশন টিম/ঠিকাদারের কাছে গ্রাহকের তথ্য যায় কি না (খসড়ায় "প্রয়োজন হলে, যেমন installation team" বলা আছে) — সঠিক কি না।
- [ ] মার্কেটিং বার্তা (promotion) পাঠান কি না; পাঠালে সম্মতি/opt-out নিয়ম লাগবে।
- [ ] তথ্য-নিরাপত্তা সংক্রান্ত কোনো প্রতিশ্রুতি খসড়ায় নেই (ইচ্ছাকৃত)। যোগ করতে চাইলে শুধু বাস্তব ব্যবস্থার কথা লিখুন।
- [ ] আপনি কি চান আমরা Cookie banner যোগ করি? (এই ধাপে করা হয়নি।)
- [ ] ভাষা: নীতি EN ও BM দুটোই পেজে সবসময় দৃশ্যমান (ভাষা-সুইচারে নির্ভর করে না)। 中文/தமிழ் সংস্করণ নেই।

## D. অনুমোদনের পরের ধাপ (আমরা করব; এখন নয়)
1. `facts` পূরণ, `approved = true`, `npm run build`।
2. `npm test` — তখন sitemap-এ `/privacy-policy/` যোগ হয়ে মোট ১৮৭ URL হবে; টেস্টের প্রত্যাশা (১৮৬ ও "privacy গ্রহণযোগ্য নয়") **ইচ্ছাকৃতভাবে ব্যর্থ** হবে এবং সেগুলো তখন হালনাগাদ করতে হবে (`scripts/test-technical-seo.js`, `test-regression.js`, `test-privacy-gate.js`, `qa-http.mjs`, `verify-staging.js`)।
3. footer-এ "Privacy Policy / Dasar Privasi" লিংক স্বয়ংক্রিয়ভাবে আসবে।
4. production deploy আলাদা স্পষ্ট অনুমোদন সাপেক্ষে।

## E. Orked সম্পর্কে
Orked-এর আলাদা ওয়েবসাইটে ইতিমধ্যে একটি privacy modal আছে; Phase 1C-তে Orked বদলানো হয়নি।
