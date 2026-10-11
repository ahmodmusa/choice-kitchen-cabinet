# Google Search Console Indexing Root Cause Analysis
**Project:** Choice Kitchen Cabinet  
**Website:** `https://www.mychoicecabinet.com/`  
**Date of Audit:** October 2026  
**Auditor Mode:** Read-Only Technical SEO Diagnostics  

---

## 1. Executive Summary & Verified Search Console Dataset

An exhaustive diagnostic audit was conducted on the Search Console performance and indexation dataset for **Choice Kitchen Cabinet**, cross-referenced directly against the local Eleventy (11ty) codebase, rendered output files, template architecture, and historical Search Console exports (`data-exports/Pages.csv`, `Queries.csv`).

### Verified Search Console Dataset:
* **Indexed URLs:** 117
* **Crawled - Currently Not Indexed:** 85
* **Alternate Page with Proper Canonical Tag:** 486
* **Total Excluded (Not Indexed):** 580
* **Remaining Excluded URLs:** 9 (580 total - 486 alternate canonical - 85 crawled-not-indexed = 9)
* **Total Discovered / Evaluated URLs:** 697 (117 indexed + 580 excluded)
* **Last 28 Days Performance:** 98 clicks, 4,692 impressions
* **Last 16 Months Historical Performance (`data-exports/Pages.csv`):** 183 URLs recorded, 128 URLs generating clicks, 100% of pages generating impressions.

```
Total Discovered / Crawled URLs Evaluated by Google (697)
├── Indexed (117)
│   ├── Clean Canonical Location Pages (~80–90)
│   ├── Client-Side Language Query Variants (e.g. ?lang=bm, ?lang=ta) (~20–30)
│   └── Core Static Pages (/, /contact-us/, /about-us/, /area-coverage/) (4)
└── Excluded / Not Indexed (580)
    ├── Alternate page with proper canonical (486) [Expected URL parameter consolidations]
    ├── Crawled - currently not indexed (85) [Canonical pages & variant pages rejected due to quality/conflict]
    └── Remaining Exclusions (9) [Legacy WordPress artifacts, 404 soft-errors, redirect remnants]
```

---

## 2. Root-Cause Hypothesis: The Anatomy of Canonical Inversion & Index Bloat

### The Core Paradox
Why are canonical base URLs (e.g., `/shah-alam/kota-kemuning/`, `/shah-alam/puncak-perdana/`) excluded under *"Crawled - currently not indexed"*, while their language query variants (e.g., `/shah-alam/kota-kemuning/?lang=bm`, `/shah-alam/puncak-perdana/?lang=ta`) are actively indexed in Google?

### The Root Cause: Conflicting Architectural Signals
The issue is driven by a fundamental conflict between three architectural layers:
1. **Contradictory Hreflang vs. Canonical Tags:**
   In `_includes/head.njk`, every page specifies:
   ```html
   <link rel="canonical" href="https://www.mychoicecabinet.com/shah-alam/kota-kemuning/">
   <link rel="alternate" hreflang="en-MY" href="https://www.mychoicecabinet.com/shah-alam/kota-kemuning/?lang=en">
   <link rel="alternate" hreflang="ms-MY" href="https://www.mychoicecabinet.com/shah-alam/kota-kemuning/?lang=bm">
   <link rel="alternate" hreflang="zh-MY" href="https://www.mychoicecabinet.com/shah-alam/kota-kemuning/?lang=zh">
   <link rel="alternate" hreflang="ta-MY" href="https://www.mychoicecabinet.com/shah-alam/kota-kemuning/?lang=ta">
   <link rel="alternate" hreflang="x-default" href="https://www.mychoicecabinet.com/shah-alam/kota-kemuning/">
   ```
   Under Google's International SEO guidelines, `hreflang` declares that alternate URLs contain distinct language content intended to be served to specific regional searchers. Google requires hreflang targets to be **indexable and self-canonicalizing**. However, the site attaches a `<link rel="canonical">` pointing back to the default English URL across all parameter pages.

2. **Client-Side-Only Language Rendering (Static HTML vs. WRS):**
   * When Googlebot crawls the raw static HTML over HTTP GET, the server returns identical HTML regardless of `?lang=` parameter. All four languages are loaded in the DOM simultaneously inside `<span>` tags, with Malay, Chinese, and Tamil hidden via CSS `[data-lang] { display: none; }`.
   * When Google's Web Rendering Service (WRS) executes JavaScript (`_includes/default.njk`), `setLang(initialLang)` runs:
     ```javascript
     const urlParams = new URLSearchParams(window.location.search);
     const initialLang = urlParams.get('lang') || 'en';
     setLang(initialLang);
     ```
     This dynamically shows the Malay or Tamil spans and hides the English spans.
   * Google's WRS observes that the rendered content of `?lang=bm` is in Bahasa Malaysia, while the user-declared canonical target is English.

3. **Google-Selected Canonical Override (Canonicalization Inversion):**
   * Google treats `rel="canonical"` as a **hint**, not a command. When Google observes that a page's content is in Malay, but the canonical tag points to an English URL, Google's algorithms classify the canonical tag as *erroneous* or *contradictory*.
   * Google overrides the user-declared canonical:
     * **User-Declared Canonical:** `https://www.mychoicecabinet.com/shah-alam/kota-kemuning/`
     * **Google-Selected Canonical:** `https://www.mychoicecabinet.com/shah-alam/kota-kemuning/?lang=bm`
   * Google therefore indexes `?lang=bm`.

4. **Helpful Content / Doorway Evaluation Drops Canonical into "Crawled - Not Indexed":**
   * The site generates **166 area pages** and **13 city hub pages** (179 location pages total).
   * Exact code analysis reveals that location pages share **93.3% exact text similarity** (only 374 words differ out of 5,599 words between Kota Kemuning and Puncak Perdana).
   * When Google crawls the base URL `/shah-alam/kota-kemuning/` after having already evaluated or indexed a language variant, Google detects extreme boilerplate repetition across the 166 location pages.
   * Google deems the base URL redundant with the already-evaluated variant or of insufficient distinct value, placing it in **"Crawled - currently not indexed"**.

---

## 3. Grouping of the 85 "Crawled - Currently Not Indexed" URLs

The 85 URLs in "Crawled - currently not indexed" represent pages that Googlebot has successfully fetched and rendered, but deliberately decided not to add to the search index due to quality, duplication, or signal contradictions.

Based on our inventory of the site's 183 canonical URLs and query variants, these 85 URLs divide into four distinct structural groups:

| Group Category | Estimated URL Count | Representative URL Examples | Root Cause & Mechanism |
| :--- | :--- | :--- | :--- |
| **1. Primary Location URLs (Area Pages)** | **45 – 55 URLs** | `/shah-alam/kota-kemuning/`<br>`/shah-alam/puncak-perdana/`<br>`/petaling-jaya/ara-damansara/`<br>`/kajang/batu-14/` | **Thin Content / Doorway Filtering:** 93.3% boilerplate duplication across 166 area pages. Google crawled the clean canonical URL, determined it provides no unique regional value beyond the template, and withheld indexation. In cases like Kota Kemuning, Google selected a `?lang=` variant instead. |
| **2. Language Parameter URLs** | **20 – 30 URLs** | `/klang/kapar/?lang=ta`<br>`/sepang/dengkil/?lang=zh`<br>`/hulu-langat/cheras/?lang=bm` | **Failed Parameter Indexation:** Google crawled the language variant via hreflang, overrode the canonical tag, but subsequently decided the page had insufficient unique quality to justify indexing in that language. |
| **3. Region Hub URLs (City Pages)** | **4 – 6 URLs** | `/kuala-langat/`<br>`/hulu-selangor/`<br>`/kajang/`<br>`/sepang/` | **Weak Hub Differentiation:** City pages use the identical template as area pages (`city.njk` vs `area.njk`). Data exports show `/kuala-langat/` generated 0 impressions and was absent from `Pages.csv`. Without unique editorial city summaries, Google withholds indexation. |
| **4. Other URLs (Utility & Structural)** | **3 – 5 URLs** | `/area-coverage/?lang=bm`<br>`/about-us/?lang=ta`<br>`/contact-us/?lang=zh` | **Parameter Waste on Utility Pages:** Language parameter variants of static informational pages that offer no unique value over the canonical English utility pages. |

---

## 4. Analysis of the 486 "Alternate Page with Proper Canonical" URLs

### Expected Exclusion Status
The **486 URLs** listed under *"Alternate page with proper canonical tag"* are **expected exclusions** and do not represent technical failures.

### The Mathematics Behind 486:
1. Total canonical pages generated by the site:
   * 1 Homepage (`/`)
   * 3 Static utility pages (`/about-us/`, `/contact-us/`, `/area-coverage/`)
   * 13 City hub pages (`/kuala-lumpur/`, `/shah-alam/`, etc.)
   * 166 Sub-area pages (`/shah-alam/kota-kemuning/`, etc.)
   * **Total Canonical URLs = 183**
2. For each of these 183 pages, `_includes/head.njk` generates **4 language parameter alternate links**:
   * `?lang=en`
   * `?lang=bm`
   * `?lang=zh`
   * `?lang=ta`
   * Total possible parameter URLs = 183 × 4 = **732 parameter URLs**.
3. When Google crawls these parameter URLs, each page serves `<link rel="canonical" href="{{ site.url }}{{ page.url }}">` pointing back to the clean URL.
4. For 486 of these URLs (approx. 162 pages × 3 alternate variants = 486), Google **correctly respected the user's canonical tag** and excluded the parameter URL from the index in favor of the base URL.

### Strategic Risk of the Current Setup:
While 486 exclusions are technically working as designed, generating 732 parameter variations through hreflang forces Googlebot to expend substantial crawl budget crawling nearly 500 duplicate parameter URLs instead of discovering, crawling, and indexing high-value canonical pages.

---

## 5. Investigation of the Remaining 9 Excluded URLs

Subtracting the known buckets from the Search Console total:
$$\text{Total Excluded (580)} - \text{Alternate Canonical (486)} - \text{Crawled Not Indexed (85)} = \mathbf{9\text{ URLs}}$$

### The Origin: Legacy WordPress Migration Artifacts & SPA Catch-All
An analysis of the codebase reveals that the site was migrated on **2024-07-29** from WordPress (`choicekitchencabinet.WordPress.2024-07-29.xml` in `data-exports/`).

A comparison between the current 183 canonical URLs and the 183 URLs recorded in historical GSC exports (`data-exports/Pages.csv`) identified **11 legacy WordPress URLs** that previously existed:

1. `https://www.mychoicecabinet.com/calculating-kitchen-cabinet-space/` (Blog post)
2. `https://www.mychoicecabinet.com/how-to-organize-kitchen-cabinets/` (Blog post)
3. `https://www.mychoicecabinet.com/tips-for-cleaning-kitchen-cabinets/` (Blog post)
4. `https://www.mychoicecabinet.com/category/kitchen-cabinet/` (Category archive)
5. `https://www.mychoicecabinet.com/wp-content/uploads/2024/04/kitchen-cabinets-demo.jpg` (Media attachment)
6. `https://www.mychoicecabinet.com/petaling-jaya/best-price-kitchen-cabinets-in-kota-damansara-month-year/` (Old permalink format)
7. `https://www.mychoicecabinet.com/petaling-jaya/best-price-kitchen-cabinets-in-ara-damansara-month-year/` (Old permalink format)
8. `https://www.mychoicecabinet.com/petaling-jaya/best-price-kitchen-cabinets-in-petaling-jaya-selatan-month-year/` (Old permalink format)
9. `https://www.mychoicecabinet.com/ampang-jaya/pandan-pandan-indah/` (Old slug)
10. `https://www.mychoicecabinet.com/sepang/seri-kembangan-south-sepang-utara/` (Old slug)
11. `https://www.mychoicecabinet.com/sepang/kota-warisan-2/` (Old duplicate slug)

### Server Response Verification:
When testing legacy endpoints on the live Cloudflare production server:
```bash
curl -I https://www.mychoicecabinet.com/how-to-organize-kitchen-cabinets/
# HTTP/1.1 200 OK
# Content-Type: text/html; charset=utf-8
```
Inspection of the HTML body revealed:
```html
<title>Choice Kitchen Cabinet - Best Quality Kitchen Cabinet Manufacturer in Malaysia | Choice Kitchen Cabinet</title>
<link rel="canonical" href="https://www.mychoicecabinet.com/">
```
**Finding:** The hosting environment (Cloudflare Pages/Static host) has a SPA catch-all rewrite enabled. When a legacy WordPress URL is requested, instead of returning an HTTP 404 or 410, the server returns **HTTP 200 OK** and serves the homepage HTML with canonical to `https://www.mychoicecabinet.com/`.

In Google Search Console, these 9 URLs are categorized under:
* **Soft 404** (Google recognizes the content does not match the URL), or
* **Duplicate without user-selected canonical** / **Page with redirect**.

---

## 6. Content Similarity & Doorway Page Audit

### Quantitative Text Similarity:
A programmatic comparison between rendered HTML files was conducted across representative locations:
* **Kota Kemuning (`_site/shah-alam/kota-kemuning/index.html`)** vs. **Puncak Perdana (`_site/shah-alam/puncak-perdana/index.html`)**:
  * Total Words: 5,599
  * Words Differing: 374
  * **Exact Text Similarity: 93.3%**
* **Kota Kemuning** vs. **Cyberjaya (`_site/sepang/cyberjaya/index.html`)**:
  * Total Words: 5,599 vs 5,212
  * Words Differing: 875
  * **Exact Text Similarity: 84.4%** (the sole difference is the number of neighbor links in the city grid).

### Qualitative Boilerplate Analysis:
1. **Unsupported Local Project Claims:**
   In `_includes/seo-extras.njk` (lines 6–65), every location page includes:
   ```html
   <h2 class="section-title">Recent Work in {{ loc }}</h2>
   ```
   Followed by **14 identical stock photos** (`recent-work-1.jpg` through `recent-work-14.jpg`).
   The image `alt` tags are programmatically generated:
   * `alt="Modern custom kitchen cabinet project in Kota Kemuning"`
   * `alt="Modern custom kitchen cabinet project in Puncak Perdana"`
   * `alt="Modern custom kitchen cabinet project in Batang Kali"`
   * `alt="Modern custom kitchen cabinet project in Tanjung Karang"`
   The exact same 14 photos are claimed as recent local installations in 166 separate neighborhoods across Malaysia.

2. **Repetitive Value Propositions:**
   The four feature cards in `area.njk` and `city.njk` use identical copy:
   * *Local Expertise:* "We know {{ area.name }} well and provide tailored solutions for homes in this area."
   * *Fast Installation:* "Most installations in {{ area.name }} are completed within 2-7 days with minimal disruption."
   * *Competitive Pricing:* "Custom kitchen cabinets in {{ area.name }} from RM4,500. No hidden fees, transparent quotes."
   * *1-Year Warranty:* "Every kitchen cabinet project in {{ area.name }} comes with our comprehensive 1-year warranty."

3. **Repetitive FAQ Section:**
   The exact same 4 FAQ questions and answers are repeated on all 179 location pages with variable substitution.

4. **Identical Testimonials:**
   The same 4 customer testimonials (Norizawati Binti Hus, SeowYim Phoon, Muhammad Hafizi, Jessica Tan) appear on all 179 pages.

5. **Structured Data Violations:**
   `_includes/default.njk` injects a `LocalBusiness` schema for every single area:
   ```json
   {
     "@context": "https://schema.org",
     "@type": "LocalBusiness",
     "name": "Choice Kitchen Cabinet",
     "address": {
       "@type": "PostalAddress",
       "addressLocality": "{{ area.name }}",
       "addressRegion": "{{ area.city.name }}",
       "addressCountry": "MY"
     }
   }
   ```
   This claims that Choice Kitchen Cabinet maintains a physical local business establishment in 166 different neighborhoods, with no street addresses provided. Choice Kitchen Cabinet's sole physical facility is located in Puchong (`21, Jalan Meranti Permai 6, Meranti Permai, 47120 Puchong, Selangor`).

---

## 7. Rendered Multilingual HTML & Language Switching Audit

### Rendered HTML Structure:
* **All 4 languages are present in the DOM simultaneously.**
  Every translatable element contains 4 sibling `<span>` tags:
  ```html
  <span data-lang="en">Custom Kitchen Cabinets in Kota Kemuning</span>
  <span data-lang="bm">Kabinet Dapur Custom di Kota Kemuning</span>
  <span data-lang="zh">Kota Kemuning 定制厨房橱柜</span>
  <span data-lang="ta">Kota Kemuning இல் தனிப்பயன் சமையலறை அலமாரிகள்</span>
  ```
* **Raw Static Delivery:**
  The server delivers raw HTML with `<html lang="en">`. CSS hides all non-English spans:
  ```css
  [data-lang] { display: none; }
  [data-lang="en"] { display: block; }
  span[data-lang] { display: none; }
  span[data-lang="en"] { display: inline; }
  ```
* **Client-Side Switch:**
  When a user or Googlebot visits `?lang=bm`, the browser executes JavaScript, toggles `display: inline/block` on `[data-lang="bm"]`, and sets `document.documentElement.lang = 'ms'`.

### What Changes vs. What Remains English:
| Element | Changes with `?lang=`? | Notes |
| :--- | :--- | :--- |
| **Headline & Sub-headline** | **Yes** (Client-side JS) | Switched via `[data-lang]` spans |
| **Why Choose Us Features** | **Yes** (Client-side JS) | Switched via `[data-lang]` spans |
| **FAQ Questions & Answers** | **Yes** (Client-side JS) | Switched via `[data-lang]` spans |
| **Product Categories** | **Yes** (Client-side JS) | Switched via `[data-lang]` spans |
| **Page `<title>`** | **No** (Remains 100% English) | Raw HTML title remains `Kitchen Cabinets [Area]...` |
| **Meta Description** | **No** (Remains 100% English) | `description` tag remains English |
| **Header Navigation** | **No** (Remains 100% English) | "Home", "Service Areas", "About Us", "Contact" |
| **Footer & Contact Info** | **No** (Remains 100% English) | "Quick Links", "Our Location", company description |
| **Customer Testimonials** | **No** (Remains 100% English) | Quotes and reviewer text are English-only |
| **Gallery Alt Text & Overlays**| **No** (Remains 100% English) | Alt attributes remain English |
| **Schema JSON-LD** | **No** (Remains 100% English) | Structured data is English-only |
| **Canonical URL** | **No** (Points to English URL)| Always points to clean base URL |

**Audit Conclusion:** Language switching does **not** change the primary document metadata, title, navigation, footer, reviews, or canonical status. It is a client-side display toggle layered on top of an English document.

---

## 8. Summary of Findings & Next Steps

1. **The 486 alternate canonical URLs** are working as designed, but create crawl waste.
2. **The 85 crawled-not-indexed URLs** are caused by doorway template penalties and canonical conflicts.
3. **The 9 remaining excluded URLs** are legacy WordPress URLs handled by SPA fallback rewrites.
4. **Canonical inversion** occurs because Google resolves conflicting hreflang and canonical directives by indexing the rendered variant over the unindexed base URL.
5. All 117 currently indexed URLs and the site's 98 monthly clicks must be strictly safeguarded.

*(Refer to `docs/CHOICE_CANONICAL_LANGUAGE_AUDIT.md` for technical deep-dives on the tags, and `docs/CHOICE_FIRST_10_PAGES.md` for the recommended pilot improvement program.)*
