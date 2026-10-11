# Phase 2A Execution Report: Safe SEO Technical Cleanup
**Project:** Choice Kitchen Cabinet  
**Website:** `https://www.mychoicecabinet.com/`  
**Branch:** `feature/phase-2a-seo-technical-cleanup`  
**Execution Date:** October 2026  
**Auditor Mode:** Technical Implementation & Quality Assurance  

---

## 1. Executive Summary

Phase 2A ("Safe SEO Technical Cleanup") has been executed autonomously and verified locally under strict safety controls. 

All primary technical defects identified in the diagnostic audit—specifically **duplicated brand title suffixes**, **fabricated multi-branch LocalBusiness schemas**, and **unsupported location-specific stock photo claims**—have been permanently corrected across the codebase without modifying URLs, touching canonical architectures, or disrupting active organic traffic.

```
PHASE 2A SAFETY & STABILITY CHECKLIST:
  [x] URL structures unchanged (0 URL path modifications)
  [x] Existing canonical tags unchanged (183/183 verified)
  [x] Existing hreflang tags unchanged (5 tags per page verified)
  [x] Sitemap XML unchanged (183 canonical URLs verified)
  [x] Multilingual parameter system untouched (no URL rewrites in Phase 2A)
  [x] No pages deleted, mass-generated, or set to noindex
  [x] Automated regression test suite created and passing 100%
```

---

## 2. Exactly What Changed

### A. Fix Duplicated Brand Title Suffix (`_includes/head.njk`)
* **Problem:** In `_includes/head.njk`, line 3 was `<title>{{ title }} | {{ site.name }}</title>`. Because `area.njk`, `city.njk`, `index.njk`, and `area-coverage.njk` already included `| Choice Kitchen Cabinet` in their frontmatter `title` variable, Eleventy appended the brand name twice, producing:
  `Kitchen Cabinets Kota Kemuning, Shah Alam | Choice Kitchen Cabinet | Choice Kitchen Cabinet`
* **Fix Applied:**
  Introduced a deduplication check in `_includes/head.njk`:
  ```jinja2
  {% set metaTitle = title %}
  {% if site.name not in metaTitle %}
    {% set metaTitle = metaTitle ~ " | " ~ site.name %}
  {% endif %}
  <title>{{ metaTitle }}</title>
  ```
  Updated `<meta property="og:title" content="{{ metaTitle }}">` and `<meta name="twitter:title" content="{{ metaTitle }}">` to synchronize social metadata.
* **Result:** Eliminated the duplicated suffix across all pages. Clean, single-branded titles are now rendered site-wide (e.g., `Kitchen Cabinets Kota Kemuning, Shah Alam | Choice Kitchen Cabinet`).

---

### B. Business Schema Accuracy & Entity Integrity (`_includes/default.njk`)
* **Problem:** On `city` and `area` pages, `_includes/default.njk` injected a `LocalBusiness` JSON-LD schema that claimed Choice Kitchen Cabinet had independent physical business branches in each individual town (e.g., `addressLocality: "Kota Kemuning"`) with no street address. Choice Kitchen Cabinet operates from a single verified factory and headquarters in **Puchong, Selangor**.
* **Fix Applied:**
  Standardized all `LocalBusiness` schemas to represent the single verified business entity:
  * **Verified Physical Address:** Always points to `21, Jalan Meranti Permai 6, Meranit Permai, Puchong, Selangor 47120, MY`.
  * **Regional Targeting:** Accurately represented via the schema.org `areaServed` property:
    * For city pages: `"areaServed": { "@type": "City", "name": "{{ city.name }}" }`
    * For area pages:
      ```json
      "areaServed": [
        { "@type": "AdministrativeArea", "name": "{{ area.name }}" },
        { "@type": "City", "name": "{{ area.city.name }}" }
      ]
      ```
  * **Syntax Bug Fix:** Corrected Nunjucks loop syntax from `forloop.last` to `loop.last` in the homepage schema array, eliminating a pre-existing trailing comma syntax error.

---

### C. Project Photo Claims & Neutral Design Descriptions (`_includes/seo-extras.njk`)
* **Problem:** In `_includes/seo-extras.njk`, lines 6–65 displayed `<h2>Recent Work in {{ loc }}</h2>` followed by 14 stock gallery photos with programmatic alt text claiming each photo was an installation in that town (e.g., `alt="Modern custom kitchen cabinet project in Kota Kemuning"`). The exact same 14 photos were claimed as completed projects across 166 different towns.
* **Fix Applied:**
  Neutralized the section to represent authentic design inspiration without false provenance:
  * **Section Eyebrow:** `Design Inspiration` (with translations in BM, 中文, தமிழ்).
  * **Section Title:** `Featured Cabinet Designs & Styles` / `Rekaan Kabinet Pilihan & Gaya Popular`.
  * **Section Description:** "Explore custom kitchen cabinet styles, premium finishes, and smart storage layouts available for your home."
  * **Image Alt Attributes:** Replaced fabricated location claims with accurate, descriptive architectural alt tags:
    * Photo 1: `Modern custom kitchen cabinet layout with clean lines`
    * Photo 2: `Custom kitchen cabinet with warm walnut woodgrain finish`
    * Photo 3: `Contemporary custom kitchen cabinet design with integrated storage`
    * Photo 4: `Space-efficient L-shaped kitchen cabinet configuration`
    * Photo 5: `Spacious U-shaped kitchen cabinet arrangement`
    * Photo 6: `Kitchen island cabinet design with practical preparation counter`
    * Photo 7: `Custom kitchen drawers with smooth soft-close runners`
    * Photo 8: `Custom kitchen cabinet storage organizer and shelving`
    * Photo 9: `Premium cabinet handles and architectural hardware details`
    * Photo 10: `Kitchen cabinetry with warm integrated under-cabinet lighting`
    * Photo 11: `Spacious open-concept kitchen cabinet installation`
    * Photo 12: `Kitchen cabinets complemented by durable natural stone countertop`
    * Photo 13: `Minimalist handleless kitchen cabinet aesthetic`
    * Photo 14: `Classic shaker-style kitchen cabinet joinery`
  * Preserved the 14-image layout, overlay titles, and lightbox functionality.

---

### D. Build Output Isolation (`.eleventyignore`)
* **Problem:** Eleventy was parsing documentation markdown files (`README.md`, `docs/*.md`) as site pages, creating unstyled HTML artifacts in `_site/docs/` and `_site/README/`.
* **Fix Applied:** Created `.eleventyignore` specifying `README.md`, `docs/`, and `scripts/`.
* **Result:** Output strictly isolated to the 183 site canonical pages plus `sitemap.xml` (184 generated files).

---

## 3. Number of Generated Pages Affected

| Template Modified | Scope of Impact | Pages Affected |
| :--- | :--- | :--- |
| `_includes/head.njk` | Page titles, OG titles, Twitter titles | **183 pages** (100% of website pages) |
| `_includes/default.njk` | LocalBusiness JSON-LD schema | **179 location pages** (13 cities + 166 areas) + Homepage bugfix |
| `_includes/seo-extras.njk` | Gallery headers & image alt attributes | **179 location pages** (13 cities + 166 areas) |
| `.eleventyignore` | Output sanitization | Eliminated 4 erroneous documentation HTML files from `_site/` |

---

## 4. Staging QA & HTML Comparison Results (Before vs. After)

### A. Homepage (`/`)
* **URL:** `https://www.mychoicecabinet.com/`
* **File:** `_site/index.html`
* **Before `<title>`:**
  `Choice Kitchen Cabinet - Best Quality Kitchen Cabinet Manufacturer in Malaysia | Choice Kitchen Cabinet`
* **After `<title>`:**
  `Choice Kitchen Cabinet - Best Quality Kitchen Cabinet Manufacturer in Malaysia`
* **Canonical URL:** `https://www.mychoicecabinet.com/` *(Unchanged)*
* **Schema Address:** Puchong, Selangor *(Valid JSON, trailing comma bug eliminated)*

---

### B. City Hub (`/shah-alam/`)
* **URL:** `https://www.mychoicecabinet.com/shah-alam/`
* **File:** `_site/shah-alam/index.html`
* **Before `<title>`:**
  `Kitchen Cabinets Shah Alam | Choice Kitchen Cabinet | Choice Kitchen Cabinet`
* **After `<title>`:**
  `Kitchen Cabinets Shah Alam | Choice Kitchen Cabinet`
* **Canonical URL:** `https://www.mychoicecabinet.com/shah-alam/` *(Unchanged)*
* **Before Schema:** `addressLocality: "Shah Alam"`, no street address
* **After Schema:**
  ```json
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "21, Jalan Meranti Permai 6, Meranit Permai",
    "addressLocality": "Puchong",
    "addressRegion": "Selangor",
    "postalCode": "47120",
    "addressCountry": "MY"
  },
  "areaServed": {
    "@type": "City",
    "name": "Shah Alam"
  }
  ```
* **Before Gallery Title:** `Recent Work in Shah Alam`
* **After Gallery Title:** `Featured Cabinet Designs & Styles`

---

### C. Location Page 1 — Puchong Home Base (`/subang-jaya/puchong/`)
* **URL:** `https://www.mychoicecabinet.com/subang-jaya/puchong/`
* **File:** `_site/subang-jaya/puchong/index.html`
* **Before `<title>`:**
  `Kitchen Cabinets Puchong, Subang Jaya | Choice Kitchen Cabinet | Choice Kitchen Cabinet`
* **After `<title>`:**
  `Kitchen Cabinets Puchong, Subang Jaya | Choice Kitchen Cabinet`
* **Canonical URL:** `https://www.mychoicecabinet.com/subang-jaya/puchong/` *(Unchanged)*
* **After Schema `areaServed`:**
  ```json
  "areaServed": [
    { "@type": "AdministrativeArea", "name": "Puchong" },
    { "@type": "City", "name": "Subang Jaya" }
  ]
  ```
* **Gallery Alt Tag Sample:** `Modern custom kitchen cabinet layout with clean lines`

---

### D. Location Page 2 — Bandar Baru Selayang (`/selayang/bandar-baru-selayang/`)
* **URL:** `https://www.mychoicecabinet.com/selayang/bandar-baru-selayang/`
* **File:** `_site/selayang/bandar-baru-selayang/index.html`
* **Before `<title>`:**
  `Kitchen Cabinets Bandar Baru Selayang, Selayang | Choice Kitchen Cabinet | Choice Kitchen Cabinet`
* **After `<title>`:**
  `Kitchen Cabinets Bandar Baru Selayang, Selayang | Choice Kitchen Cabinet`
* **Canonical URL:** `https://www.mychoicecabinet.com/selayang/bandar-baru-selayang/` *(Unchanged)*
* **After Schema `areaServed`:** `[{"@type":"AdministrativeArea","name":"Bandar Baru Selayang"},{"@type":"City","name":"Selayang"}]`

---

### E. Location Page 3 — Port Klang (`/klang/port-klang/`)
* **URL:** `https://www.mychoicecabinet.com/klang/port-klang/`
* **File:** `_site/klang/port-klang/index.html`
* **Before `<title>`:**
  `Kitchen Cabinets Port Klang, Klang | Choice Kitchen Cabinet | Choice Kitchen Cabinet`
* **After `<title>`:**
  `Kitchen Cabinets Port Klang, Klang | Choice Kitchen Cabinet`
* **Canonical URL:** `https://www.mychoicecabinet.com/klang/port-klang/` *(Unchanged)*
* **After Schema `areaServed`:** `[{"@type":"AdministrativeArea","name":"Port Klang"},{"@type":"City","name":"Klang"}]`

---

### F. Location Page 4 — Cyberjaya (`/sepang/cyberjaya/`)
* **URL:** `https://www.mychoicecabinet.com/sepang/cyberjaya/`
* **File:** `_site/sepang/cyberjaya/index.html`
* **Before `<title>`:**
  `Kitchen Cabinets Cyberjaya, Sepang | Choice Kitchen Cabinet | Choice Kitchen Cabinet`
* **After `<title>`:**
  `Kitchen Cabinets Cyberjaya, Sepang | Choice Kitchen Cabinet`
* **Canonical URL:** `https://www.mychoicecabinet.com/sepang/cyberjaya/` *(Unchanged)*
* **After Schema `areaServed`:** `[{"@type":"AdministrativeArea","name":"Cyberjaya"},{"@type":"City","name":"Sepang"}]`

---

### G. Location Page 5 / Diagnostic Case — Kota Kemuning (`/shah-alam/kota-kemuning/`)
* **URL:** `https://www.mychoicecabinet.com/shah-alam/kota-kemuning/`
* **File:** `_site/shah-alam/kota-kemuning/index.html`
* **Before `<title>`:**
  `Kitchen Cabinets Kota Kemuning, Shah Alam | Choice Kitchen Cabinet | Choice Kitchen Cabinet`
* **After `<title>`:**
  `Kitchen Cabinets Kota Kemuning, Shah Alam | Choice Kitchen Cabinet`
* **Canonical URL:** `https://www.mychoicecabinet.com/shah-alam/kota-kemuning/` *(Unchanged)*
* **Indexed Parameter Variant (`?lang=bm`):** Served from the same clean HTML; `<title>` and schema are clean, language switcher operates identically without code conflict.

---

### H. Previously Crawled-Not-Indexed URL — Puncak Perdana (`/shah-alam/puncak-perdana/`)
* **URL:** `https://www.mychoicecabinet.com/shah-alam/puncak-perdana/`
* **File:** `_site/shah-alam/puncak-perdana/index.html`
* **Before `<title>`:**
  `Kitchen Cabinets Puncak Perdana, Shah Alam | Choice Kitchen Cabinet | Choice Kitchen Cabinet`
* **After `<title>`:**
  `Kitchen Cabinets Puncak Perdana, Shah Alam | Choice Kitchen Cabinet`
* **Canonical URL:** `https://www.mychoicecabinet.com/shah-alam/puncak-perdana/` *(Unchanged)*
* **After Schema:** Address is Puchong headquarters; `areaServed` is Puncak Perdana & Shah Alam.
* **Photo Claim:** Neutralized to "Featured Cabinet Designs & Styles".

---

## 5. Task 4: Historical Legacy WordPress URL Audit

A cross-reference of the historical Google Search Console 16-month data export (`data-exports/Pages.csv`) against current site URLs identified **11 legacy WordPress URLs**.

Live curl testing was performed on the production server (`curl -I --max-time 5`):

```
+------------------------------------------------------------------------------------------------------------------------------------+
| Legacy WordPress URL                                                      | HTTP | Live Content Returned | Historical GSC Metrics  | Recommended Future Action   |
+------------------------------------------------------------------------------------------------------------------------------------+
| /how-to-organize-kitchen-cabinets/                                        | 200  | Full Homepage HTML    | 17,202 Impr, 3 Clicks   | Recreate as Blog / 301 Hub  |
| /tips-for-cleaning-kitchen-cabinets/                                      | 200  | Full Homepage HTML    | 2,856 Impr, 0 Clicks    | Recreate as Blog / 301 Hub  |
| /calculating-kitchen-cabinet-space/                                       | 200  | Full Homepage HTML    | 676 Impr, 6 Clicks      | Recreate as Blog / 301 Hub  |
| /petaling-jaya/best-price-kitchen-cabinets-in-kota-damansara-month-year/  | 200  | Full Homepage HTML    | 157 Impr, 2 Clicks      | 301 to /kota-damansara/     |
| /petaling-jaya/best-price-kitchen-cabinets-in-ara-damansara-month-year/   | 200  | Full Homepage HTML    | 57 Impr, 2 Clicks       | 301 to /ara-damansara/      |
| /sepang/seri-kembangan-south-sepang-utara/                                | 200  | Full Homepage HTML    | 259 Impr, 0 Clicks      | 301 to /seri-kembangan-south|
| /sepang/kota-warisan-2/                                                   | 200  | Full Homepage HTML    | 36 Impr, 0 Clicks       | 301 to /sepang/kota-warisan/|
| /ampang-jaya/pandan-pandan-indah/                                         | 200  | Full Homepage HTML    | 26 Impr, 3 Clicks       | 301 to /pandan-indah/       |
| /petaling-jaya/best-price-kitchen-cabinets-in-petaling-jaya-selatan-month/| 200  | Full Homepage HTML    | 2 Impr, 0 Clicks        | 301 to /pj-selatan/         |
| /category/kitchen-cabinet/                                                | 200  | Full Homepage HTML    | 3 Impr, 0 Clicks        | 410 Gone                    |
| /wp-content/uploads/2024/04/kitchen-cabinets-demo.jpg                     | 200  | Full Homepage HTML    | 1 Impr, 0 Clicks        | 410 Gone                    |
+------------------------------------------------------------------------------------------------------------------------------------+
```

### Analysis & Recommendations:
1. **The Root Cause:** Cloudflare / static hosting has a single-page application (SPA) catch-all rewrite enabled. Non-existent URLs serve HTTP 200 with the homepage content and `<link rel="canonical" href="https://www.mychoicecabinet.com/">`. In Google Search Console, these register as **Soft 404** or **Alternate with proper canonical**.
2. **Old Location Permalinks:** In a future phase (Phase 2B/3), add explicit 301 redirects mapping old permalinks to their active area pages.
3. **High-Impression Blog Posts:** The three blog articles generated over **20,700 search impressions**. In Phase 3, rebuilding these three articles as static guides will recapture valuable top-of-funnel traffic without risking location page indexation.
4. **Phase 2A Compliance:** No redirect rules or server rewrites were altered during this phase.

---

## 6. Automated Regression Test Suite Results

A dedicated automated test suite was developed at `scripts/test-regression.js` and wired into `npm test`.

```
> npm test

=== RUNNING PHASE 2A REGRESSION TESTS ===
Found 183 generated HTML files in _site.

--- Test 1: Checking for duplicate brand suffixes in titles ---
PASS: 0 duplicate brand suffixes across all 183 pages.

--- Test 2: Validating JSON-LD Structured Data Syntax ---
PASS: All 183 LocalBusiness schemas parsed cleanly with verified Puchong address & valid areaServed.

--- Test 3: Checking for fabricated project claims & alt text ---
PASS: 0 fabricated location project claims or alt tags found.

--- Test 4: Checking image file reference integrity ---
PASS: All 19 unique image assets exist on disk.

--- Test 5: Verifying Sitemap and Canonical Tag Integrity ---
PASS: sitemap.xml contains exactly 183 canonical URLs.
PASS: Canonical tags verified across all 183 pages.

========================================
RESULTS: 8 PASSED, 0 FAILED
========================================
ALL PHASE 2A REGRESSION TESTS PASSED SUCCESSFULLY!
```

---

## 7. Remaining Issues & Next Phase Recommendations

While Phase 2A successfully eliminated technical title defects, deceptive schemas, and fabricated photo claims, the following structural challenges remain for subsequent phases:

1. **Multilingual Architecture (Phase 2B):**
   * Currently, language variations rely on client-side JavaScript (`?lang=bm`, `?lang=zh`, `?lang=ta`) while canonical tags point back to English base URLs.
   * *Future Recommendation:* Evaluate either migrating to dedicated static multilingual directories (e.g., `/ms/`, `/zh/`) or safely consolidating language parameters if multilingual traffic is negligible.
2. **Doorway Boilerplate Differentiation (Phase 2C / Phase 3 Pilot):**
   * The 166 location pages still share ~93% body text similarity in features and FAQs.
   * *Future Recommendation:* Deploy Phase 2C to enrich the first 10 pilot pages (identified in `docs/CHOICE_FIRST_10_PAGES.md`) with genuine local context, property typologies, and true factory logistics from Puchong.
3. **Legacy URL Routing:**
   * Configure Cloudflare Pages `_redirects` to return 301 status codes for the 6 old location slugs and 410 status codes for deleted WordPress media.

---

## 8. Rollback Instructions

All modifications in Phase 2A are contained on the isolated Git branch `feature/phase-2a-seo-technical-cleanup`. If an immediate rollback is required prior to deployment:

```bash
# To discard changes and return to the original main branch:
git checkout main

# To delete the feature branch:
git branch -D feature/phase-2a-seo-technical-cleanup
```
