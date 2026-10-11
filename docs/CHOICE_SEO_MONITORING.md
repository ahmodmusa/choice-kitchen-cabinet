# Choice Kitchen Cabinet — Google Search Console Monitoring Framework & Baseline

> **Document Status:** Active SEO Operations Document  
> **Target Cycle:** Weekly Performance Audits (Starting Next Monday)  
> **Domain:** `https://mychoicecabinet.com/` (Historical WordPress -> Eleventy Static SSG)  
> **Feature Branch:** `feature/phase-2a-seo-technical-cleanup`

---

## 1. Verified Historical Baselines (Search Console Data Exports)

Data sourced directly from verified Google Search Console exports preserved in `data-exports/Pages.csv` (aggregated 28-day performance window prior to Phase 2A technical changes).

### 1.1 Overall Site Performance Baseline
* **Verified Total Organic Clicks (28 Days):** 98 clicks
* **Verified Total Organic Impressions (28 Days):** 4,556 impressions *(Note: Initial preliminary audit export showed 4,692 impressions across the full rolling window; 4,556 represents the strict row-level sum in `data-exports/Pages.csv`)*
* **Average CTR:** ~2.15%
* **Average Position:** ~16.8

### 1.2 Five-Page CTR Optimization Pilot Baseline
These five key location pages were optimized in Phase 2B with unique, non-duplicative SEO titles and natural meta descriptions emphasizing genuine design, materials, and quotation requests without keyword stuffing or false claims:

| URL Path | Historical Clicks | Historical Impressions | Baseline CTR | Baseline Position | Optimized Phase 2B SEO Title |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `/sepang/cyberjaya/` | **39** | 1,034 | 3.77% | 17.21 | `Kitchen Cabinets Cyberjaya \| Custom Storage Solutions` |
| `/selayang/rawang/` | **38** | 2,167 | 1.75% | 11.25 | `Kitchen Cabinet Rawang \| Custom Design & Quotation` |
| `/kuala-lumpur/wangsa-maju/` | **28** | 535 | 5.23% | 6.72 | `Kitchen Cabinets Wangsa Maju \| Custom Design & Quote` |
| `/petaling-jaya/petaling-jaya-city-centre/` | **23** | 1,693 | 1.36% | 18.12 | `Custom Kitchen Cabinets in PJ City Centre \| Choice` |
| `/subang-jaya/seri-kembangan/` | **15** | 623 | 2.41% | 15.67 | `Kitchen Cabinet Seri Kembangan \| Design & Quote` |

### 1.3 Informational & Historical Blog Articles Baseline
Historical WordPress URLs identified from Search Console query/page data:

| Historical / Restored URL | Historical Clicks | Historical Impressions | Historical CTR | Historical Position | Current Restoration Status |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `/calculating-kitchen-cabinet-space/` | **6** | **676** | 0.89% | 42.01 | **Restored (Task 1)** — Real static page, 13 sections in mm, self-canonical, sitemap. |
| `/how-to-organize-kitchen-cabinets/` | **3** | **17,202** | 0.02% | 65.71 | **Restored (Phase 2A)** — Real static page, practical organization advice, sitemap. |
| `/tips-for-cleaning-kitchen-cabinets/` | **0** | **2,856** | 0.00% | 60.52 | *Planned for Next Cycle* — Outline documented in `docs/CHOICE_NEXT_CONTENT_PLAN.md`. |

### 1.4 Coverage & Indexing Status Baseline
Recorded during the initial diagnostic audit (`docs/CHOICE_INDEXING_ROOT_CAUSE.md`):

* **Indexed URLs:** 117
* **Crawled - Currently Not Indexed:** 85 (Includes primary location pages, parameter variants, and hub pages)
* **Alternate Page with Proper Canonical Tag:** 486 (Expected exclusions representing query parameter variants correctly pointing to canonical URLs)
* **Other Excluded / Discovered / Soft 404:** 9
* **Total Excluded / Not Indexed:** 580

---

## 2. Monday Search Console Monitoring Checklist

Execute this checklist every Monday following production deployment to track search performance and Googlebot crawl behavior.

```
+-----------------------------------------------------------------------------------+
|                        WEEKLY GSC AUDIT WORKFLOW (MONDAYS)                        |
|                                                                                   |
|  [Step 1] Server Health  -->  [Step 2] Sitemap Processing  -->  [Step 3] URL Insp|
|       (HTTP 200/404)               (Success / URL count)         (5 pilot pages)  |
|                                                                                   |
|  [Step 4] Last Crawl Date --> [Step 5] SERP Snippet Check  -->  [Step 6] Metrics |
|       (Googlebot cache)            (Rendered title/meta)         (Clicks/Impr/CTR)|
|                                                                                   |
|  [Step 7] Coverage Shifts --> [Step 8] Business Impact                            |
|       (Indexed vs Crawled)         (WhatsApp leads vs clicks)                     |
+-----------------------------------------------------------------------------------+
```

### Step 1: Live HTTP Response Check
* **Objective:** Ensure all key pages return clean HTTP 200 OK headers with intact static content.
* **URLs to test:**
  * Root homepage: `https://mychoicecabinet.com/`
  * 5 CTR pilot URLs: `/sepang/cyberjaya/`, `/selayang/rawang/`, `/kuala-lumpur/wangsa-maju/`, `/petaling-jaya/petaling-jaya-city-centre/`, `/subang-jaya/seri-kembangan/`
  * 2 restored informational articles: `/how-to-organize-kitchen-cabinets/`, `/calculating-kitchen-cabinet-space/`
* **Verification:** Confirm no unexpected 5xx server errors, redirect loops, or 404s.

### Step 2: XML Sitemap Processing Status
* **Tool:** GSC > Sitemaps (`/sitemap.xml`)
* **Verification:**
  * Status must show **"Success"**.
  * Discovered URLs count must match the built sitemap count: exactly **185 valid URLs** (183 canonical location & hub pages + 2 blog posts).
  * Confirm `lastmod` dates reflect recent releases.

### Step 3: Googlebot URL Inspection on Restored Articles
* **Tool:** GSC > URL Inspection
* **Test Targets:**
  * `https://mychoicecabinet.com/calculating-kitchen-cabinet-space/`
  * `https://mychoicecabinet.com/how-to-organize-kitchen-cabinets/`
* **Checkpoints:**
  * Google-selected canonical vs. User-declared canonical (must both be the exact URL, self-referencing).
  * Mobile Usability / Page Experience: Core Web Vitals clean, text readable, no clipping.
  * Structured Data Detected: `Article` and `FAQPage` schemas validated without warnings or syntax errors.
  * If status shows "URL is not on Google" (formerly 404 during WordPress deprecation), submit a polite "Request Indexing" request.

### Step 4: Verify Googlebot Crawl Dates
* **Tool:** GSC > URL Inspection > Coverage Details
* **Checkpoint:** Record the **"Last Crawl"** timestamp for each of the 5 pilot location pages and the 2 blog posts.
* **Rule:** If the last crawl date is *prior* to the deployment timestamp, Googlebot has not yet fetched the updated `<title>` and `<meta name="description">` tags; do not evaluate CTR changes until a new crawl date is confirmed.

### Step 5: SERP Title & Snippet Inspection
* **Method:** Run search queries in Google Search (e.g. `site:mychoicecabinet.com/calculating-kitchen-cabinet-space/` and location queries e.g. `kitchen cabinet wangsa maju choice`).
* **Verification:**
  * Has Google adopted the new Phase 2B title (e.g. `Kitchen Cabinets Wangsa Maju | Custom Design & Quote`) or is it still showing the old duplicated brand title (`... - Choice Cabinet Malaysia - Choice Cabinet Malaysia`)?
  * Is Google showing the custom meta description or generating an automated snippet?
  * Record date of snippet transition.

### Step 6: 7-Day vs. 28-Day Clicks, Impressions, and CTR Comparison
* **Tool:** GSC > Performance > Search Results (Date: Compare last 7 days to previous period; and 28-day trends).
* **Metric Extraction:**
  * Export performance table filtered by Page URL.
  * Compare current CTR against baseline CTR for each pilot page:
    * `/sepang/cyberjaya/` (Target: maintain or exceed 3.77%)
    * `/selayang/rawang/` (Target: increase from 1.75% towards 2.5%+)
    * `/kuala-lumpur/wangsa-maju/` (Target: maintain strong 5.23% CTR, grow impressions)
    * `/petaling-jaya/petaling-jaya-city-centre/` (Target: increase from 1.36% towards 2.0%+)
    * `/subang-jaya/seri-kembangan/` (Target: increase from 2.41% towards 3.0%+)
  * Record impressions for `/calculating-kitchen-cabinet-space/` (Baseline: 676 impressions over 28 days).
  * Record impressions for `/how-to-organize-kitchen-cabinets/` (Baseline: 17,202 impressions over 28 days).

### Step 7: Index Coverage Shifts
* **Tool:** GSC > Indexing > Pages
* **Verification:**
  * Track movement between **"Crawled - currently not indexed"** (baseline: 85) and **"Indexed"** (baseline: 117).
  * Check whether restored historical URLs move out of "Excluded / Not indexed" into "Indexed".
  * Verify that "Alternate page with proper canonical tag" (baseline: 486) remains steady and does not cannibalize indexed canonicals.

### Step 8: WhatsApp Inquiries vs. Organic Web Clicks
* **Metric Alignment:**
  * Total weekly organic clicks from GSC.
  * Total weekly incoming WhatsApp inquiries with the standardized tracking text:  
    `"Salam Choice Kitchen, saya nak quotation kabinet dapur. Saya datang dari website mychoicecabinet.com."`
  * Ratio: Determine conversion rate of organic web visitors to WhatsApp quotation leads.

---

## 3. Data Governance: Verified Historical Data vs. Future GSC Exports

To ensure data integrity, team members must distinguish verified project records from metrics requiring future live exports:

| Data Element | Status | Source / Requirement |
| :--- | :--- | :--- |
| **Historical 98 clicks / 4,556 impressions** | **VERIFIED HISTORICAL** | Hardcoded in `data-exports/Pages.csv`. Locked baseline. |
| **Historical 5-Page Pilot Metrics** | **VERIFIED HISTORICAL** | Extracted from `data-exports/Pages.csv`. Locked baseline. |
| **Historical Article Impressions (17.2k, 676, 2.8k)** | **VERIFIED HISTORICAL** | Recorded from previous WordPress GSC exports. Locked baseline. |
| **Historical 117 Indexed / 85 Crawled-Not-Indexed** | **VERIFIED HISTORICAL** | Recorded in `docs/CHOICE_INDEXING_ROOT_CAUSE.md`. |
| **Post-Deployment Crawl Timestamps** | *FUTURE EXPORT* | Requires live GSC URL Inspection after production deploy. |
| **SERP Title Replacement Speed** | *FUTURE EXPORT* | Requires weekly visual / cache SERP audits. |
| **Post-Cleanup CTR Changes** | *FUTURE EXPORT* | Requires next Monday's 7-day GSC Performance export. |
| **Coverage Shift (85 non-indexed pool)** | *FUTURE EXPORT* | Requires monthly GSC Page Indexing status update. |
| **WhatsApp Quotation Conversion Rate** | *FUTURE TRACKING* | Requires sales team log of WhatsApp messages received at `601124771710`. |
