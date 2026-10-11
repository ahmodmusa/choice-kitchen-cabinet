# Technical Canonical & Language Implementation Audit
**Project:** Choice Kitchen Cabinet  
**Target Domain:** `https://www.mychoicecabinet.com/`  
**Date of Audit:** October 2026  
**Focus:** Canonical Tags, Hreflang Tags, Robots.txt, XML Sitemap, and Multilingual Rendering Mechanics  

---

## 1. Architectural Overview: Static Generation vs. Client-Side State

Choice Kitchen Cabinet runs on **Eleventy (11ty)**, generating pure static HTML files at build time into `_site/`.

```
Eleventy Build Pipeline:
_data/locations.json (13 cities, 166 areas) 
  + area.njk / city.njk / index.njk 
  + _includes/head.njk & _includes/default.njk
      └──> 183 static index.html files generated in _site/
```

### The Rendering Pipeline:
1. **Build Time:** Eleventy compiles 183 canonical pages. For every location, all four languages (English, Bahasa Malaysia, Chinese, Tamil) are compiled directly into the HTML within `<span>` wrappers:
   ```html
   <span data-lang="en">Custom Kitchen Cabinets in Kota Kemuning</span>
   <span data-lang="bm">Kabinet Dapur Custom di Kota Kemuning</span>
   <span data-lang="zh">Kota Kemuning 定制厨房橱柜</span>
   <span data-lang="ta">Kota Kemuning இல் தனிப்பயன் சமையலறை அலமாரிகள்</span>
   ```
2. **Server Response:** The static web server (hosted behind Cloudflare) serves the **exact same HTML document** regardless of whether the incoming request is:
   * `https://www.mychoicecabinet.com/shah-alam/kota-kemuning/`
   * `https://www.mychoicecabinet.com/shah-alam/kota-kemuning/?lang=bm`
   * `https://www.mychoicecabinet.com/shah-alam/kota-kemuning/?lang=zh`
   * `https://www.mychoicecabinet.com/shah-alam/kota-kemuning/?lang=ta`
3. **CSS Visibility Control:** The CSS in `_includes/default.njk` hides all non-English elements by default:
   ```css
   [data-lang] { display: none; }
   [data-lang="en"] { display: block; }
   span[data-lang] { display: none; }
   span[data-lang="en"] { display: inline; }
   ```
4. **Client-Side Execution (JavaScript):** In `_includes/default.njk` (lines 1459–1535):
   ```javascript
   document.addEventListener('DOMContentLoaded', function() {
     const urlParams = new URLSearchParams(window.location.search);
     const initialLang = urlParams.get('lang') || 'en';
     setLang(initialLang);
   });
   ```
   When `setLang('bm')` executes, it sets `document.documentElement.lang = 'ms'`, applies `style.display = 'none'` to all `[data-lang]`, and restores `display = 'inline'/'block'` for `[data-lang="bm"]`.

---

## 2. In-Depth Tag Analysis: `<head>` Metadata Audit

The `<head>` section is generated uniformly via `_includes/head.njk`:

```html
<!-- Canonical URL -->
<link rel="canonical" href="{{ site.url }}{{ page.url }}">

<!-- Hreflang Tags for Multi-Language SEO -->
<link rel="alternate" hreflang="en-MY" href="{{ site.url }}{{ page.url }}?lang=en">
<link rel="alternate" hreflang="ms-MY" href="{{ site.url }}{{ page.url }}?lang=bm">
<link rel="alternate" hreflang="zh-MY" href="{{ site.url }}{{ page.url }}?lang=zh">
<link rel="alternate" hreflang="ta-MY" href="{{ site.url }}{{ page.url }}?lang=ta">
<link rel="alternate" hreflang="x-default" href="{{ site.url }}{{ page.url }}">
```

### Critical Flaws in the Implementation:

#### Flaw A: Direct Contradiction Between Canonical and Hreflang
According to Google's official documentation on localized versions:
> *"Each language version must have a rel="canonical" link pointing to itself (self-referential canonical). If you canonicalize page B (Malay) to page A (English), you are telling Google that page B is a duplicate and should NOT be indexed."*

Here, every parameter URL (`?lang=bm`, `?lang=zh`, `?lang=ta`) contains:
* An `hreflang` instruction telling Google: *"Serve this URL to Malaysian users searching in Bahasa Malaysia / Chinese / Tamil."*
* A `canonical` instruction telling Google: *"Do not index this URL; consolidate it into the English clean URL."*

#### Flaw B: Canonical Inversion Under Google's Web Rendering Service (WRS)
Because canonical tags are recommendations rather than directives, Google's algorithms will ignore or override canonical tags when strong contradictory signals are present:
1. When Googlebot crawls `/shah-alam/kota-kemuning/?lang=bm` with its rendering pipeline, it renders the page after JavaScript executes.
2. The rendered page displays Bahasa Malaysia text, and `document.documentElement.lang` is set to `ms`.
3. The `<link rel="canonical">` points to `/shah-alam/kota-kemuning/`, which in rendered state is in English.
4. Google identifies a language discrepancy between the page content and the canonical target. Google's indexer concludes that the canonical tag is an error, drops the canonical consolidation, and **selects `?lang=bm` as the primary indexable version**.
5. When Google later evaluates `/shah-alam/kota-kemuning/`, it observes that this content is largely duplicate of the 165 other location pages and clusters it with the already-processed `?lang=bm` version, assigning the base URL to **"Crawled - currently not indexed"**.

#### Flaw C: Duplicate Title Suffix Bug
In `_includes/head.njk` line 3:
```html
<title>{{ title }} | {{ site.name }}</title>
```
In `area.njk` line 9:
```yaml
title: "Kitchen Cabinets {{ area.name }}, {{ area.city.name }} | Choice Kitchen Cabinet"
```
Because the template variable `title` already includes `| Choice Kitchen Cabinet`, the rendered `<title>` contains an unnecessary duplicate brand suffix:
```html
<title>Kitchen Cabinets Kota Kemuning, Shah Alam | Choice Kitchen Cabinet | Choice Kitchen Cabinet</title>
```
This wastes 26 characters of SERP title real estate across all 166 area pages.

---

## 3. Case Studies: Representative Indexed vs. Non-Indexed Pages

### Case Study 1: Kota Kemuning
* **Base Canonical URL:** `https://www.mychoicecabinet.com/shah-alam/kota-kemuning/` (Status: *Crawled - currently not indexed*)
* **Variant URL:** `https://www.mychoicecabinet.com/shah-alam/kota-kemuning/?lang=bm` (Status: *Indexed*)

#### The Crawler Journey:
1. Googlebot discovered `/shah-alam/kota-kemuning/?lang=bm` through the `hreflang` tags on the homepage or city hub.
2. Googlebot fetched and rendered the URL via WRS.
3. WRS executed JavaScript: the DOM updated to Bahasa Malaysia text.
4. Googlebot detected that the user-declared canonical was the English base URL.
5. Google's algorithms overrode the user canonical because indexing an English page for a Malay search query would provide poor user experience.
6. Google added `/shah-alam/kota-kemuning/?lang=bm` to the search index.
7. Googlebot fetched the base URL `/shah-alam/kota-kemuning/`. Finding that the cluster was already represented by the Malay variant, and recognizing that 93.3% of the content was identical to Puncak Perdana, Bukit Jelutong, and Setia Alam, Googlebot relegated the base URL to **Crawled - currently not indexed**.

---

### Case Study 2: Puncak Perdana
* **Base Canonical URL:** `https://www.mychoicecabinet.com/shah-alam/puncak-perdana/` (Status: *Crawled - currently not indexed*)
* **Variant URL:** `https://www.mychoicecabinet.com/shah-alam/puncak-perdana/?lang=ta` (Status: *Indexed*)

#### The Crawler Journey:
1. Similar to Kota Kemuning, Googlebot crawled the Tamil `hreflang` variant (`?lang=ta`).
2. Tamil text was rendered in the DOM via client-side JavaScript.
3. Google overrode the canonical pointing to the English base URL and indexed the Tamil query variant.
4. The base URL `/shah-alam/puncak-perdana/` had low historical impressions (only 21 impressions in 16 months, 0 clicks). Google saw no distinct local utility to justify indexing both, leaving the canonical base page in **Crawled - currently not indexed**.

---

## 4. Robots.txt & XML Sitemap Audit

### Robots.txt Audit (`robots.txt`):
```
User-agent: *
Allow: /

Disallow: /_site/
Disallow: /admin/
Disallow: /.well-known/

Sitemap: https://www.mychoicecabinet.com/sitemap.xml
```

#### Assessment:
* **Syntax:** Valid standard syntax.
* **Crawl Allowance:** All query parameters (`?lang=*`) are completely unrestricted. Googlebot is permitted to crawl all 732 parameter URLs.
* **Sitemap Reference:** Correctly points to `https://www.mychoicecabinet.com/sitemap.xml`.

---

### Sitemap Audit (`sitemap.njk`):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>{{ site.url }}/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>{{ site.url }}/area-coverage/</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>{{ site.url }}/about-us/</loc>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>{{ site.url }}/contact-us/</loc>
    <priority>0.5</priority>
  </url>
  {% for city in locations.cities %}
  <url>
    <loc>{{ site.url }}/{{ city.slug }}/</loc>
    <priority>0.7</priority>
  </url>
  {% for area in city.areas %}
  <url>
    <loc>{{ site.url }}/{{ city.slug }}/{{ area.slug }}/</loc>
    <priority>0.6</priority>
  </url>
  {% endfor %}
  {% endfor %}
</urlset>
```

#### Assessment:
* **Included URLs:** Exactly **183 canonical URLs** (1 home, 3 utility, 13 city hubs, 166 areas).
* **Missing Elements:**
  * No `lastmod` dates are provided, preventing Google from determining content freshness.
  * No `<xhtml:link rel="alternate" hreflang="...">` elements are present in the sitemap. All hreflang declarations are handled exclusively via HTML `<head>` tags.
  * No `?lang=` URLs are listed in the sitemap (which is correct practice, as non-canonical variants should never be submitted in sitemaps).

---

## 5. Language Switching Functionality & Content Completeness Audit

### Detailed Element-by-Element Language Audit:

```
HTML Page Component Breakdown:
├── Document Language: <html lang="en"> (Hardcoded English in raw HTML)
├── Head Metadata:
│   ├── <title>: English-only (never translates)
│   ├── <meta name="description">: English-only (never translates)
│   └── <meta name="keywords">: English-only (never translates)
├── Header & Navigation:
│   ├── Brand Name: English-only
│   ├── Menu Links ("Home", "Service Areas", "About Us", "Contact"): English-only
│   └── CTA Button ("Get Free Quote"): English-only
├── Primary Body Content:
│   ├── Hero Headline & Sub-headline: 4 languages present via data-lang
│   ├── Features ("Why Choose Us"): 4 languages present via data-lang
│   ├── FAQs (Questions & Answers): 4 languages present via data-lang
│   ├── Products ("Kitchen Cabinet", "Wardrobe", etc.): 4 languages present via data-lang
│   ├── Process Steps ("Chat With Us", "Site Visit", etc.): 4 languages present via data-lang
│   └── CTA Banner: 4 languages present via data-lang
├── Non-Translated Secondary Content:
│   ├── Customer Reviews (Norizawati, SeowYim, etc.): English-only
│   ├── Portfolio Overlay ("Modern Kitchen", "Walnut Finish"): English-only
│   ├── Portfolio Image Alt Attributes: English-only
│   └── Breadcrumbs ("Home > Shah Alam > Kota Kemuning"): English-only
├── Footer Content:
│   ├── Brand Summary: English-only
│   ├── Navigation & Contact Hours ("Mon - Sat: 9:00 AM..."): English-only
│   └── Copyright & Developer Credit: English-only
└── Structured Data (JSON-LD):
    └── LocalBusiness, Organization, FAQPage, BreadcrumbList: English-only
```

### Key Technical Findings:
1. **Partial Translation:** When a user selects BM, 中文, or தமிழ், less than 45% of the total on-page textual content changes language. The surrounding frame (header, footer, breadcrumbs, reviews, image alts) remains English.
2. **Hidden Content DOM Inflation:** Because all 4 translations are inlined into every paragraph and headline, every location page carries redundant DOM nodes. Kota Kemuning contains 5,599 words in rendered source, of which ~4,000 words are hidden via CSS `display: none`.
3. **No Dedicated Server-Side URLs:** True multilingual SEO requires independent, crawlable URLs (such as `/ms/shah-alam/kota-kemuning/` or `/zh/shah-alam/kota-kemuning/`) where the entire HTML document (including `<title>`, `<meta description>`, and headers) is prerendered in the target language.

---

## 6. Structured Data & Schema Markup Audit

### LocalBusiness Schema Markup (`_includes/default.njk` lines 1293–1315):
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Choice Kitchen Cabinet",
  "description": "Custom kitchen cabinets in Kota Kemuning, Shah Alam. Premium design, delivery & installation. Free quote on WhatsApp. Trusted by 500+ families.",
  "url": "https://www.mychoicecabinet.com",
  "telephone": "+60178360455",
  "email": "admin@mychoicecabinet.com",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Kota Kemuning",
    "addressRegion": "Shah Alam",
    "addressCountry": "MY"
  },
  "areaServed": {
    "@type": "City",
    "name": "Kota Kemuning"
  },
  "image": "https://www.mychoicecabinet.com/assets/images/og-image.png"
}
```

### Issues Identified:
1. **Missing Street Address:** Google guidelines state that `LocalBusiness` schema should represent a real, physical establishment where customers can visit or staff are stationed. Specifying only `addressLocality: "Kota Kemuning"` with no `streetAddress` triggers warnings and signals programmatic generation.
2. **Inaccurate Headquarter Location:** Choice Kitchen Cabinet has a single manufacturing/office address in Puchong:
   * `21, Jalan Meranti Permai 6, Meranti Permai, 47120 Puchong, Selangor`.
   Marking all 166 areas as independent LocalBusiness locations creates conflicting business identity signals across Google's Knowledge Graph.

---

## 7. Traffic & Index Preservation Principles (Safety Guardrails)

During this diagnosis phase and any future implementation, the following safety constraints must be adhered to:

```
TRAFFIC PRESERVATION MANDATE:
Current Performance: 117 Indexed Pages | 98 Clicks/28 Days | 4,692 Impressions
  DO NOT apply bulk noindex tags to location pages.
  DO NOT mass-delete location pages.
  DO NOT alter canonical URLs across the 117 currently indexed pages.
  DO NOT implement 301 redirect chains for active ranking URLs.
  DO NOT block ?lang= parameters in robots.txt abruptly (avoids trapping crawled URLs).
```

### Preservation Strategy for Existing Indexed Pages:
* **Protect What Works:** The top 20 performing pages currently generate over 75% of the site's organic search clicks. These URLs must remain intact with zero structural modifications.
* **Controlled Isolation:** Any fixes to canonicals or content enhancements must be tested exclusively on a small, monitored pilot cohort (see `docs/CHOICE_FIRST_10_PAGES.md`).
