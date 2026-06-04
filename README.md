# Compound Interest Calculator

A free, modern, SEO-optimized compound interest calculator with monthly contribution support, interactive charts, dark mode, share-by-URL, and PNG export. 100% client-side — drop the folder on any static host. Designed to meet **Google AdSense** content and compliance requirements.

## Features

- **Compound math** — annual / monthly / daily compounding with the standard `A = P(1 + r/n)^(nt)` formula, generalized to monthly contributions via per-month simulation
- **SIP support** — adds a monthly contribution and compounds the running balance
- **Live chart** — Chart.js stacked area showing contributions vs. interest earned
- **Real-time UX** — sliders synced with number inputs, animated tweened result values
- **Dark mode** — respects `prefers-color-scheme`, persists choice in `localStorage`
- **Custom share modal** — copyable URL + X / LinkedIn / Facebook share links (no flaky `navigator.share`)
- **Export** — `Export Chart` saves the chart as PNG with a solid backdrop
- **Cookie consent banner** — GDPR-style accept / reject, persisted, fires `consentchange` event
- **AdSense-ready compliance** — Privacy Policy, Terms, Disclaimer, Contact pages
- **SEO** — semantic markup, structured data (WebApplication + FAQPage), 1000+ word content, FAQ accordion, sitemap, robots.txt
- **Responsive** — mobile-first, breakpoints at 880px and 480px
- **i18n scaffold** — `js/i18n.js` ready for additional locales (English + Chinese skeleton included)
- **Accessible** — ARIA labels, keyboard-friendly, reduced-motion support

## File Structure

```
web/
├── index.html                          # Compound Interest Calculator (main)
├── simple-interest-calculator.html     # Simple Interest Calculator
├── loan-calculator.html                # Loan / Mortgage Calculator
├── savings-goal-calculator.html        # Savings Goal Calculator
├── calculators.html                    # Hub: all calculators
├── blog.html                           # Blog index
├── blog/
│   ├── rule-of-72.html                 # Article: Rule of 72
│   └── simple-vs-compound-interest.html # Article: Simple vs Compound
├── about.html                          # About page
├── privacy.html                        # Privacy Policy (AdSense requirement)
├── terms.html                          # Terms of Service
├── disclaimer.html                     # Financial disclaimer (YMYL)
├── contact.html                        # Contact page (AdSense requirement)
├── robots.txt                          # Crawler rules
├── sitemap.xml                         # Sitemap (all pages)
├── deploy-config.js                    # One-shot domain replacement
├── README.md                           # This file
├── css/
│   └── style.css                       # Light + dark theme, all components
└── js/
    ├── site.js                         # Theme + nav + cookie banner (everywhere)
    ├── app.js                          # Compound interest logic
    ├── simple-interest.js              # Simple interest logic
    ├── loan.js                         # Loan amortization logic
    ├── savings-goal.js                 # Reverse-solve savings logic
    └── i18n.js                         # Translation scaffold
```

## What's on the Site

**4 fully working calculators**, each with chart, SEO content, FAQ, and JSON-LD:

| Calculator | Formula | What it solves |
|------------|---------|----------------|
| Compound Interest | `A = P(1 + r/n)^(nt)` + monthly contributions | Future value of investment with SIP |
| Simple Interest | `I = P × r × t` | Flat interest on loans, T-bills, CDs |
| Loan / Mortgage | Standard amortization | Monthly payment + full year-by-year schedule |
| Savings Goal | Annuity FV solved for payment | Required monthly contribution to hit a goal |

**Blog with 2 long-form articles** (~1,200 words each, ready for SEO):
- The Rule of 72: How to Estimate Compound Growth in Your Head
- Simple vs. Compound Interest: The Gap That Builds (or Drains) Wealth

**4 compliance pages**: Privacy, Terms, Disclaimer, Contact

## Run Locally

No build step. Just serve the directory:

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

Visit <http://localhost:8080>.

## Deploy to Production

### 1. Replace the domain placeholder

All canonical URLs, `og:url`, JSON-LD, sitemap, and contact email addresses use the placeholder `YOUR_DOMAIN.com`. Replace them with one command:

```bash
node deploy-config.js compoundcalc.io
```

To revert to the placeholder (e.g. before committing back to a template repo):

```bash
node deploy-config.js compoundcalc.io --revert
```

### 2. Upload to a static host

The `web/` folder works as-is on Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3 + CloudFront, or any Nginx box.

For pretty URLs (matching the canonical paths in `<head>`), configure your host:

| URL                                | File              |
|------------------------------------|-------------------|
| `/compound-interest-calculator`    | `index.html`      |
| `/simple-interest-calculator`      | `simple-interest-calculator.html` |
| `/loan-calculator`                 | `loan-calculator.html`            |
| `/savings-goal-calculator`         | `savings-goal-calculator.html`    |
| `/calculators`                     | `calculators.html` |
| `/blog`                            | `blog.html`        |
| `/blog/rule-of-72`                 | `blog/rule-of-72.html` |
| `/blog/simple-vs-compound-interest`| `blog/simple-vs-compound-interest.html` |
| `/about`                           | `about.html`      |
| `/privacy`                         | `privacy.html`    |
| `/terms`                           | `terms.html`      |
| `/disclaimer`                      | `disclaimer.html` |
| `/contact`                         | `contact.html`    |

On Netlify add a `_redirects` file. On Cloudflare Pages add `_redirects` or use the dashboard. On Nginx use `try_files` rewrites.

### 3. Verify before applying for AdSense

Run a quick checklist:

- [ ] HTTPS is enabled
- [ ] All 6 pages load and render without console errors
- [ ] No "YOUR_DOMAIN" string left anywhere (`grep -r YOUR_DOMAIN .`)
- [ ] Real contact email mailbox exists and is monitored
- [ ] Cookie banner appears on first visit and persists choice
- [ ] Lighthouse Performance / SEO / Accessibility / Best Practices all 90+
- [ ] Submit `sitemap.xml` to Google Search Console
- [ ] Site has been live ~2 weeks with at least some organic traffic

## Share URL Format

```
?p=10000   initial principal
&r=7       annual interest rate (%)
&y=20      investment years
&n=12      compound frequency (1=annual, 12=monthly, 365=daily)
&c=500     monthly contribution
```

Example: `index.html?p=5000&r=8&y=30&n=12&c=300`

## Cookie Consent Integration

The banner stores the user's choice (`accepted` / `rejected`) in `localStorage` and exposes it as `window.__consent`. To gate analytics or AdSense scripts:

```html
<script>
  document.addEventListener('consentchange', (e) => {
    if (e.detail === 'accepted') {
      // load Google Analytics, AdSense, etc.
    }
  });
  // Also handle the case where consent was already given on a previous visit:
  if (window.__consent === 'accepted') { /* load now */ }
</script>
```

## SEO Notes

- Title and description target "compound interest calculator", "investment calculator", "SIP calculator"
- Canonical + OG + Twitter cards on every page
- JSON-LD structured data (WebApplication + FAQPage) for rich results
- 1000+ word evergreen content section
- FAQ schema for "People also ask" eligibility
- All compliance pages set `<meta name="robots" content="index, follow">` so they count toward site quality signals

## AdSense Readiness Roadmap

This codebase covers the **technical** AdSense requirements, plus 4 working calculators and 2 seed blog posts. To maximize approval odds also:

1. Add 6–12 more long-form articles (1500+ words each) on related personal-finance topics
2. Run the site for at least 2–3 months with regular content updates and some organic traffic
3. Verify ownership in Google Search Console and submit the sitemap
4. Apply at <https://www.google.com/adsense/>

## License

MIT — free to use, modify, and deploy.
