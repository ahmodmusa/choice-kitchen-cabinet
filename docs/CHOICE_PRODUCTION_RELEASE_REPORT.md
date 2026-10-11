# Choice Kitchen Cabinet — Production Release & Live Verification Report

> **Release Status:** **CHOICE PRODUCTION RELEASE SUCCESSFUL**  
> **Target Domain:** `https://www.mychoicecabinet.com/`  
> **Production Branch:** `main`  
> **Merged Feature Branch:** `feature/phase-2a-seo-technical-cleanup`  
> **Deployment Date:** October 11, 2026 (22:48 UTC+8)  
> **Hosting Platform:** Cloudflare Pages (Git-Integrated Auto-Deploy via GitHub `main`)

---

## 1. Executive Summary & Deployment Status

All Phase 2A technical cleanup fixes, Phase 2B five-page CTR title and meta description optimizations, two restored historical informational SEO articles, centralized WhatsApp configurations (`601124771710`), and business address corrections (`Meranti Permai`) have been safely merged into `main`, deployed via Cloudflare Pages, and verified live on `https://www.mychoicecabinet.com/`.

* **Production Deployment Status:** **SUCCESSFUL (HTTP 200 OK across all tested routes)**
* **Hosting Platform:** Cloudflare Pages
* **Connected Repository:** `https://github.com/ahmodmusa/choice-kitchen-cabinet`
* **Production Branch:** `main`
* **Production Release Commit SHA:** `b2f274a49c25e8a514d34db3ee752cf3a77197f2` (Short: `b2f274a`)
* **Previous Production Commit SHA (Rollback Reference):** `00f50f674e27ac1a7a938c80bf6f5e1db554bebf` (Short: `00f50f6`)

---

## 2. Pre-Deployment QA & Build Integrity (Local Verification)

Prior to merging and pushing to `main`, the build pipeline and automated regression suite were executed locally:

* **Static Generator Build (`npm run build`):**
  * Built using Eleventy v2.0.1 in **0.37 seconds**.
  * Generated **185 HTML pages** + 1 XML sitemap = **186 total files** (`_site/`).
  * Copied 26 static media and script assets.
* **Regression Suite (`npm test`):**
  * **59 Passed, 0 Failed.**
  * Verified 0 duplicate brand suffixes.
  * Verified 185 clean `LocalBusiness` schemas with single Puchong entity and `areaServed`.
  * Verified 0 fabricated project claims or false location alt text.
  * Verified 19 unique image assets on disk.
  * Verified 185 canonical URLs in `sitemap.xml`.
  * Verified 734 WhatsApp links centralized to `601124771710` with standard greeting.
  * Verified 186 `tel:` links preserving `+60178360455`.
  * Verified both blog posts with self-canonicals, Article/FAQ schemas, and no `?lang=` hreflangs.
  * Verified 5-page CTR pilot titles and descriptions.

---

## 3. Live Production Verification (Actual HTTPS Endpoints Tested)

Live network audit executed using automated HTTP inspection against `https://www.mychoicecabinet.com/`:

| Tested Production URL | HTTP Status | Live Page `<title>` | Canonical Tag Verified | Real Content Confirmed | Address: "Meranti Permai" |
| :--- | :---: | :--- | :---: | :---: | :---: |
| `https://www.mychoicecabinet.com/` | **200 OK** | `Choice Kitchen Cabinet - Best Quality Kitchen Cabinet Manufacturer in Malaysia` *(Duplicated brand suffix eliminated)* | `https://www.mychoicecabinet.com/` | Yes (Homepage Hub) | **VERIFIED** |
| `https://www.mychoicecabinet.com/how-to-organize-kitchen-cabinets/` | **200 OK** | `How to Organize Kitchen Cabinets \| Practical Storage Tips \| Choice Kitchen Cabinet` | `https://www.mychoicecabinet.com/how-to-organize-kitchen-cabinets/` | Yes (Full 6-section guide, NOT homepage fallback) | **VERIFIED** |
| `https://www.mychoicecabinet.com/calculating-kitchen-cabinet-space/` | **200 OK** | `How to Calculate Kitchen Cabinet Space \| Malaysia Guide \| Choice Kitchen Cabinet` | `https://www.mychoicecabinet.com/calculating-kitchen-cabinet-space/` | Yes (Full 13-section guide in mm, worked example) | **VERIFIED** |
| `https://www.mychoicecabinet.com/kuala-lumpur/wangsa-maju/` | **200 OK** | `Kitchen Cabinets Wangsa Maju \| Custom Design & Quote \| Choice Kitchen Cabinet` | `https://www.mychoicecabinet.com/kuala-lumpur/wangsa-maju/` | Yes (Location Area Page) | **VERIFIED** |
| `https://www.mychoicecabinet.com/petaling-jaya/petaling-jaya-city-centre/` | **200 OK** | `Custom Kitchen Cabinets in PJ City Centre \| Choice \| Choice Kitchen Cabinet` | `https://www.mychoicecabinet.com/petaling-jaya/petaling-jaya-city-centre/` | Yes (Location Area Page) | **VERIFIED** |
| `https://www.mychoicecabinet.com/selayang/rawang/` | **200 OK** | `Kitchen Cabinet Rawang \| Custom Design & Quotation \| Choice Kitchen Cabinet` | `https://www.mychoicecabinet.com/selayang/rawang/` | Yes (Location Area Page) | **VERIFIED** |
| `https://www.mychoicecabinet.com/subang-jaya/seri-kembangan/` | **200 OK** | `Kitchen Cabinet Seri Kembangan \| Design & Quote \| Choice Kitchen Cabinet` | `https://www.mychoicecabinet.com/subang-jaya/seri-kembangan/` | Yes (Location Area Page) | **VERIFIED** |
| `https://www.mychoicecabinet.com/sepang/cyberjaya/` | **200 OK** | `Kitchen Cabinets Cyberjaya \| Custom Storage Solutions \| Choice Kitchen Cabinet` | `https://www.mychoicecabinet.com/sepang/cyberjaya/` | Yes (Location Area Page) | **VERIFIED** |
| `https://www.mychoicecabinet.com/sitemap.xml` | **200 OK** | XML Sitemap — **Exactly 185 `<loc>` URLs** | N/A | Both restored articles present (`priority 0.7`) | N/A |

---

## 4. Key Verification Checkpoints

### A. Restored Articles Content Integrity
* Neither article URL returns the legacy SPA homepage catch-all fallback.
* Both articles serve their own static HTML content with correct semantic `<article>`, `<h1>`, and illustrative diagrams.
* Both articles carry valid JSON-LD `Article` and `FAQPage` schemas detected in the live HTML response.

### B. Business Entity & Address Integrity
* Confirmed live street address: `21, Jalan Meranti Permai 6, Meranti Permai, 47120 Puchong, Selangor`.
* `0` occurrences of the typo `"Meranit Permai"` found on the live website.
* `LocalBusiness` JSON-LD correctly points to the single verified Puchong headquarters with relevant towns targeted via schema.org `areaServed`.

### C. Contact Settings & WhatsApp Integration
* Verified live WhatsApp button link target:  
  `https://wa.me/601124771710?text=Salam%20Choice%20Kitchen%2C%20saya%20nak%20quotation%20kabinet%20dapur.%20Saya%20datang%20dari%20website%20mychoicecabinet.com.`
* Verified WhatsApp phone number: `601124771710`.
* Verified exact quotation greeting message in live links:  
  *"Salam Choice Kitchen, saya nak quotation kabinet dapur. Saya datang dari website mychoicecabinet.com."*
* Verified voice call phone link: `tel:+60178360455` (strictly unchanged).

### D. Sitemap Verification
* Live sitemap at `https://www.mychoicecabinet.com/sitemap.xml` serves valid XML.
* Total discovered URLs: **185 canonical URLs** (183 canonical location & hub pages + 2 restored guides).
* Excludes all client-side query parameters (`?lang=bm`, `?lang=zh`, `?lang=ta`).

---

## 5. Rollback Reference & Procedures

If an unexpected production regression occurs:

1. **Hosting Platform Rollback (Cloudflare Pages):**
   * Log in to Cloudflare Dashboard > **Workers & Pages** > Project: `choice-kitchen-cabinet`.
   * Under **Deployments**, locate deployment for commit `00f50f6` (`update og-image`).
   * Click **Rollback to this deployment** to instantly restore the previous build.
2. **Git Rollback Reference:**
   * Working Release Commit SHA: `b2f274a49c25e8a514d34db3ee752cf3a77197f2`
   * Previous Baseline Commit SHA: `00f50f674e27ac1a7a938c80bf6f5e1db554bebf`
   * To revert cleanly via Git without rewriting history:
     ```bash
     git checkout main
     git revert -m 1 b2f274a  # Or create a revert commit
     git push origin main
     ```

---

## 6. Post-Release Operational Plan

Production deployment is fully active. Live Search Console monitoring and weekly auditing will commence following the workflow outlined in [`docs/CHOICE_SEO_MONITORING.md`](file:///e:/Others%20Website/Chioce%20Kitchen%20Cabinet/docs/CHOICE_SEO_MONITORING.md):
* **Next Monday Audit (7-Day Check):** Check Googlebot last crawl date on the 5 pilot location pages and submit restored URLs for indexing via URL Inspection.
* **Content Expansion Queue:** Topic A (`/tips-for-cleaning-kitchen-cabinets/`) and Topic B (`/kitchen-cabinet-price-malaysia/`) outlines are ready in [`docs/CHOICE_NEXT_CONTENT_PLAN.md`](file:///e:/Others%20Website/Chioce%20Kitchen%20Cabinet/docs/CHOICE_NEXT_CONTENT_PLAN.md) awaiting workshop pricing confirmation.
