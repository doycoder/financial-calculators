# Language Dropdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a flag-and-code language dropdown to the nav of every page, defaulting to English, persisting choice in localStorage, switching live without page reload.

**Architecture:** Each HTML page inlines the same dropdown markup (matching the existing `Calculators` dropdown pattern). `js/i18n.js` gains a `LANGUAGES` metadata table, renders menu items at startup, and exposes `setLocale(locale)` that persists the choice and updates `<html lang>` / `dir` / trigger label. CSS adds a 2-column grid for the menu. A pre-paint snippet in `<head>` reads the saved locale before first render to avoid flash.

**Tech Stack:** Plain HTML / CSS / vanilla JS (no build system). Static files served from `web/`.

---

## File Structure

**Modify:**
- `web/js/i18n.js` — add `LANGUAGES` table, render/persist logic, RTL handling, init function (self-bootstraps on DOMContentLoaded; no `site.js` change needed).
- `web/css/style.css` — add `.lang-dropdown` / `.lang-menu` / `.lang-current` rules.
- 13 HTML files (markup + pre-paint snippet + i18n.js script tag where missing):
  - Root: `index.html`, `calculators.html`, `loan-calculator.html`, `savings-goal-calculator.html`, `simple-interest-calculator.html`, `blog.html`, `about.html`, `contact.html`, `privacy.html`, `terms.html`, `disclaimer.html`
  - Blog: `blog/rule-of-72.html`, `blog/simple-vs-compound-interest.html`

**No new files.** All work fits in existing files.

---

## Task 1: Extend i18n.js with LANGUAGES table and render/persist layer

**Files:**
- Modify: `web/js/i18n.js`

- [ ] **Step 1: Replace the contents of `web/js/i18n.js` with the new version**

Open `web/js/i18n.js` and replace its entire contents with:

```javascript
/* ==========================================================================
   i18n — language switcher + translation framework.
   - LANGUAGES drives the dropdown.
   - TRANSLATIONS holds dictionaries (skeleton for non-en; falls back to en).
   - I18n.init() renders menus marked with [data-lang-menu] and wires events.
   - I18n.setLocale(locale) persists choice, updates <html lang>/dir, and
     translates [data-i18n] elements.
   ========================================================================== */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'locale';
  const DEFAULT_LOCALE = 'en';
  const RTL_LOCALES = ['ar'];

  // Order matches the reference mockup.
  const LANGUAGES = [
    { code: 'en',      flag: '🇬🇧', label: 'EN' },
    { code: 'es',      flag: '🇪🇸', label: 'ES' },
    { code: 'de',      flag: '🇩🇪', label: 'DE' },
    { code: 'fr',      flag: '🇫🇷', label: 'FR' },
    { code: 'ru',      flag: '🇷🇺', label: 'RU' },
    { code: 'pt',      flag: '🇵🇹', label: 'PT' },
    { code: 'it',      flag: '🇮🇹', label: 'IT' },
    { code: 'zh-Hans', flag: '🇨🇳', label: '华语' },
    { code: 'zh-Hant', flag: '🇭🇰', label: '華語' },
    { code: 'th',      flag: '🇹🇭', label: 'TH' },
    { code: 'ar',      flag: '🇸🇦', label: 'عربي' },
    { code: 'ja',      flag: '🇯🇵', label: 'JP' },
    { code: 'vi',      flag: '🇻🇳', label: 'VI' },
    { code: 'my',      flag: '🇲🇲', label: 'MY' },
    { code: 'id',      flag: '🇮🇩', label: 'ID' },
    { code: 'tr',      flag: '🇹🇷', label: 'TR' },
  ];

  const VALID_CODES = LANGUAGES.map(l => l.code);

  // Skeleton dictionaries. Missing keys fall back to en via t().
  const TRANSLATIONS = {
    en: {
      brand: 'CompoundCalc',
      nav: { home: 'Home', calculator: 'Calculator', about: 'About' },
      hero: {
        title: 'Compound Interest Calculator',
        lede:  'Calculate your investment growth, SIP returns, and annual returns online. Free, instant, and accurate.',
      },
      labels: {
        initial: 'Initial Investment',
        rate: 'Annual Interest Rate',
        years: 'Investment Years',
        frequency: 'Compound Frequency',
        contribution: 'Monthly Contribution',
        finalValue: 'Final Value',
        totalContrib: 'Total Contributions',
        totalInterest: 'Total Interest',
        annualReturn: 'Annualized Return',
      },
      buttons: { reset: 'Reset', share: 'Share', export: 'Export Chart' },
      toast: { copied: 'Link copied to clipboard', exported: 'Chart exported', reset: 'Reset to defaults' },
    },
    es:      { brand: 'CompoundCalc', nav: { home: 'Inicio',   calculator: 'Calculadora', about: 'Acerca' } },
    de:      { brand: 'CompoundCalc', nav: { home: 'Start',    calculator: 'Rechner',     about: 'Info' } },
    fr:      { brand: 'CompoundCalc', nav: { home: 'Accueil',  calculator: 'Calculatrice',about: 'À propos' } },
    ru:      { brand: 'CompoundCalc', nav: { home: 'Главная',  calculator: 'Калькулятор', about: 'О нас' } },
    pt:      { brand: 'CompoundCalc', nav: { home: 'Início',   calculator: 'Calculadora', about: 'Sobre' } },
    it:      { brand: 'CompoundCalc', nav: { home: 'Home',     calculator: 'Calcolatrice',about: 'Info' } },
    'zh-Hans': { brand: '复利计算器', nav: { home: '首页',     calculator: '计算器',      about: '关于' } },
    'zh-Hant': { brand: '複利計算器', nav: { home: '首頁',     calculator: '計算器',      about: '關於' } },
    th:      { brand: 'CompoundCalc', nav: { home: 'หน้าแรก', calculator: 'เครื่องคิดเลข', about: 'เกี่ยวกับ' } },
    ar:      { brand: 'CompoundCalc', nav: { home: 'الرئيسية',calculator: 'الآلة الحاسبة', about: 'حول' } },
    ja:      { brand: 'CompoundCalc', nav: { home: 'ホーム',   calculator: '計算機',      about: '概要' } },
    vi:      { brand: 'CompoundCalc', nav: { home: 'Trang chủ',calculator: 'Máy tính',    about: 'Giới thiệu' } },
    my:      { brand: 'CompoundCalc', nav: { home: 'ပင်မ',     calculator: 'ဂဏန်းတွက်',   about: 'အကြောင်း' } },
    id:      { brand: 'CompoundCalc', nav: { home: 'Beranda',  calculator: 'Kalkulator',  about: 'Tentang' } },
    tr:      { brand: 'CompoundCalc', nav: { home: 'Ana Sayfa',calculator: 'Hesap Makinesi', about: 'Hakkında' } },
  };

  function getByPath(obj, path) {
    return path.split('.').reduce((acc, k) => (acc && acc[k] != null ? acc[k] : null), obj);
  }

  function readStoredLocale() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return VALID_CODES.includes(v) ? v : null;
    } catch (_) { return null; }
  }

  function writeStoredLocale(locale) {
    try { localStorage.setItem(STORAGE_KEY, locale); } catch (_) {}
  }

  function findLang(code) {
    return LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
  }

  const I18n = {
    locale: DEFAULT_LOCALE,
    languages: LANGUAGES,

    t(key) {
      const dict = TRANSLATIONS[this.locale] || TRANSLATIONS.en;
      const v = getByPath(dict, key);
      if (v != null) return v;
      return getByPath(TRANSLATIONS.en, key) || key;
    },

    setLocale(locale) {
      if (!VALID_CODES.includes(locale)) locale = DEFAULT_LOCALE;
      this.locale = locale;
      writeStoredLocale(locale);

      const html = document.documentElement;
      html.lang = locale;
      html.dir = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';

      document.querySelectorAll('[data-i18n]').forEach((el) => {
        el.textContent = this.t(el.dataset.i18n);
      });

      const lang = findLang(locale);
      document.querySelectorAll('[data-lang-current]').forEach((el) => {
        el.textContent = lang.flag + ' ' + lang.label;
      });

      document.querySelectorAll('[data-lang-menu] [data-locale]').forEach((btn) => {
        btn.setAttribute('aria-current', btn.dataset.locale === locale ? 'true' : 'false');
      });
    },

    init() {
      // Render menu items into every [data-lang-menu] container.
      document.querySelectorAll('[data-lang-menu]').forEach((menu) => {
        menu.innerHTML = '';
        LANGUAGES.forEach((lang) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.setAttribute('role', 'menuitem');
          btn.dataset.locale = lang.code;
          btn.innerHTML = '<span class="flag" aria-hidden="true">' + lang.flag + '</span><span class="lang-label">' + lang.label + '</span>';
          menu.appendChild(btn);
        });

        menu.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-locale]');
          if (!btn) return;
          e.preventDefault();
          I18n.setLocale(btn.dataset.locale);
          // Close the parent dropdown via the existing site.js mechanism.
          const dd = menu.closest('.nav-dropdown');
          if (dd) {
            dd.dataset.open = 'false';
            const toggle = dd.querySelector('.nav-dropdown-toggle');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
          }
        });
      });

      const stored = readStoredLocale();
      I18n.setLocale(stored || DEFAULT_LOCALE);
    },

    available() { return VALID_CODES.slice(); },
  };

  global.I18n = I18n;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => I18n.init());
  } else {
    I18n.init();
  }
})(window);
```

- [ ] **Step 2: Sanity-check the file in a browser console**

Open `web/index.html` in a browser. Open DevTools console and run:

```javascript
I18n.languages.length
I18n.available()
```

Expected: `16`, then an array of 16 codes starting with `'en'`.

If `I18n` is `undefined`, the script didn't load — re-check Step 1.

- [ ] **Step 3: Commit**

```bash
git add web/js/i18n.js
git commit -m "feat(i18n): add LANGUAGES table and render/persist layer"
```

---

## Task 2: Add CSS for the language dropdown

**Files:**
- Modify: `web/css/style.css` (append at end)

- [ ] **Step 1: Append the new rules to `web/css/style.css`**

Append the following block at the very end of `web/css/style.css`:

```css
/* ==========================================================================
   Language dropdown
   ========================================================================== */
.lang-dropdown .lang-current {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.lang-dropdown .nav-dropdown-menu.lang-menu {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 8px;
  min-width: 240px;
  width: 240px;
}

.lang-menu button[data-locale] {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  padding: 8px 10px;
  background: transparent;
  border: 0;
  border-radius: 8px;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.lang-menu button[data-locale]:hover,
.lang-menu button[data-locale]:focus-visible {
  background: var(--surface-2);
  outline: none;
}

.lang-menu button[data-locale][aria-current="true"] {
  background: var(--surface-2);
  font-weight: 700;
}

.lang-menu .flag {
  font-size: 1.1em;
  line-height: 1;
}

.lang-menu .lang-label {
  font-size: 0.95em;
}

@media (max-width: 880px) {
  .lang-dropdown .nav-dropdown-menu.lang-menu {
    width: 100%;
    min-width: 0;
  }
}
```

- [ ] **Step 2: Visual check**

Open `web/index.html` in a browser. The page should still render normally with no broken layout (the dropdown HTML hasn't been added yet, but CSS shouldn't break anything).

Expected: page renders normally. If anything is broken, double-check no existing rule was overwritten.

- [ ] **Step 3: Commit**

```bash
git add web/css/style.css
git commit -m "feat(css): add language dropdown styling"
```

---

## Task 3: Add the dropdown markup, pre-paint snippet, and i18n.js script tag to `index.html`

**Files:**
- Modify: `web/index.html`

This is the template task. Tasks 4–14 follow the same pattern; do this one carefully so the rest are mechanical.

- [ ] **Step 1: Add the pre-paint locale snippet at the end of `<head>`**

In `web/index.html`, find the closing `</head>` tag (around line 59). Immediately before `</head>`, insert:

```html
  <!-- Pre-paint locale: avoids English-flash before i18n.js runs -->
  <script>
    (function () {
      try {
        var v = localStorage.getItem('locale');
        var valid = ['en','es','de','fr','ru','pt','it','zh-Hans','zh-Hant','th','ar','ja','vi','my','id','tr'];
        if (valid.indexOf(v) === -1) v = 'en';
        document.documentElement.lang = v;
        document.documentElement.dir = (v === 'ar') ? 'rtl' : 'ltr';
      } catch (_) {}
    })();
  </script>
```

- [ ] **Step 2: Add the language dropdown to `<nav>`**

In `web/index.html`, find this block (around lines 83–85):

```html
        <a href="blog.html">Blog</a>
        <a href="about.html">About</a>
      </nav>
```

Replace it with:

```html
        <a href="blog.html">Blog</a>
        <a href="about.html">About</a>
        <div class="nav-dropdown lang-dropdown">
          <button class="nav-dropdown-toggle" aria-expanded="false" aria-haspopup="true" aria-label="Select language">
            <span class="lang-current" data-lang-current>🇬🇧 EN</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="nav-dropdown-menu lang-menu" role="menu" data-lang-menu></div>
        </div>
      </nav>
```

- [ ] **Step 3: Confirm `js/i18n.js` is loaded**

`index.html` already loads `js/i18n.js` at line 331. No change needed.

- [ ] **Step 4: Manual test in browser**

Open `web/index.html` in a browser. Verify:

1. Trigger button shows `🇬🇧 EN` (or letter pair `GB EN` on Windows Chrome — that's expected per spec).
2. Click it: a 2-column grid menu opens with all 16 entries, current row (EN) is bold.
3. Click `🇨🇳 华语`: trigger updates to `🇨🇳 华语`, menu closes, `<html lang>` becomes `zh-Hans`. Verify in DevTools Elements panel.
4. Reload the page: trigger still shows `🇨🇳 华语`. `<html lang>` is `zh-Hans`. No flash of English.
5. Click `🇸🇦 عربي`: page flips to RTL (header layout mirrors). Verify `<html dir="rtl">` in DevTools.
6. Switch back to `🇬🇧 EN`: `dir` returns to `ltr`.
7. Press `Esc` while the menu is open: it closes.
8. Click somewhere outside: menu closes.

If any of these fail, debug before moving on (the rest of the tasks repeat this same pattern).

- [ ] **Step 5: Reset locale before committing**

Open DevTools console:

```javascript
localStorage.removeItem('locale');
```

Reload to confirm the trigger goes back to `🇬🇧 EN`.

- [ ] **Step 6: Commit**

```bash
git add web/index.html
git commit -m "feat(nav): add language dropdown to index.html"
```

---

## Task 4: Add dropdown to `calculators.html`

**Files:**
- Modify: `web/calculators.html`

- [ ] **Step 1: Add the pre-paint snippet before `</head>`**

Insert the same `<script>` block from Task 3 Step 1 immediately before `</head>` in `web/calculators.html`.

- [ ] **Step 2: Add the language dropdown at the end of `<nav>`**

Find the closing `</nav>` tag (the one inside `.site-nav`, around line 41). Immediately before that `</nav>`, insert:

```html
        <div class="nav-dropdown lang-dropdown">
          <button class="nav-dropdown-toggle" aria-expanded="false" aria-haspopup="true" aria-label="Select language">
            <span class="lang-current" data-lang-current>🇬🇧 EN</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="nav-dropdown-menu lang-menu" role="menu" data-lang-menu></div>
        </div>
```

(Indentation: match the surrounding nav links — typically 8 spaces.)

- [ ] **Step 3: Add `js/i18n.js` script tag**

Find the line `<script src="js/site.js"></script>` (around line 122). Immediately after it, insert:

```html
  <script src="js/i18n.js"></script>
```

- [ ] **Step 4: Manual test**

Open `web/calculators.html`. Confirm trigger shows `🇬🇧 EN`, dropdown opens, choosing `🇨🇳 华语` updates `<html lang>` to `zh-Hans` and persists across reload. Reset with `localStorage.removeItem('locale')` and reload.

- [ ] **Step 5: Cross-page persistence test**

While trigger shows the chosen locale on `calculators.html`, navigate to `index.html`. The trigger on `index.html` should also show the chosen locale.

- [ ] **Step 6: Commit**

```bash
git add web/calculators.html
git commit -m "feat(nav): add language dropdown to calculators.html"
```

---

## Task 5: Add dropdown to `loan-calculator.html`

**Files:**
- Modify: `web/loan-calculator.html`

- [ ] **Step 1: Add the pre-paint snippet before `</head>`**

Insert the same `<script>` block from Task 3 Step 1 immediately before `</head>` in `web/loan-calculator.html`.

- [ ] **Step 2: Add the language dropdown at the end of `<nav>`**

Find the closing `</nav>` of `.site-nav`. Immediately before that `</nav>`, insert the same dropdown block from Task 4 Step 2.

- [ ] **Step 3: Add `js/i18n.js` script tag**

After `<script src="js/site.js"></script>` (around line 269), insert:

```html
  <script src="js/i18n.js"></script>
```

- [ ] **Step 4: Manual test**

Open `web/loan-calculator.html`. Confirm trigger shows correct flag/code, dropdown opens, selecting a language persists. Reset locale.

- [ ] **Step 5: Commit**

```bash
git add web/loan-calculator.html
git commit -m "feat(nav): add language dropdown to loan-calculator.html"
```

---

## Task 6: Add dropdown to `savings-goal-calculator.html`

**Files:**
- Modify: `web/savings-goal-calculator.html`

- [ ] **Step 1: Add the pre-paint snippet before `</head>`**

Insert the snippet from Task 3 Step 1 immediately before `</head>`.

- [ ] **Step 2: Add the language dropdown at the end of `<nav>`**

Insert the dropdown block from Task 4 Step 2 immediately before `</nav>` of `.site-nav`.

- [ ] **Step 3: Add `js/i18n.js` script tag**

After `<script src="js/site.js"></script>` (around line 257), insert:

```html
  <script src="js/i18n.js"></script>
```

- [ ] **Step 4: Manual test**

Open `web/savings-goal-calculator.html`. Verify dropdown works. Reset locale.

- [ ] **Step 5: Commit**

```bash
git add web/savings-goal-calculator.html
git commit -m "feat(nav): add language dropdown to savings-goal-calculator.html"
```

---

## Task 7: Add dropdown to `simple-interest-calculator.html`

**Files:**
- Modify: `web/simple-interest-calculator.html`

- [ ] **Step 1: Add the pre-paint snippet before `</head>`**

Insert the snippet from Task 3 Step 1 immediately before `</head>`.

- [ ] **Step 2: Add the language dropdown at the end of `<nav>`**

Insert the dropdown block from Task 4 Step 2 immediately before `</nav>` of `.site-nav`.

- [ ] **Step 3: Add `js/i18n.js` script tag**

After `<script src="js/site.js"></script>` (around line 258), insert:

```html
  <script src="js/i18n.js"></script>
```

- [ ] **Step 4: Manual test**

Open `web/simple-interest-calculator.html`. Verify dropdown works. Reset locale.

- [ ] **Step 5: Commit**

```bash
git add web/simple-interest-calculator.html
git commit -m "feat(nav): add language dropdown to simple-interest-calculator.html"
```

---

## Task 8: Add dropdown to `blog.html`

**Files:**
- Modify: `web/blog.html`

- [ ] **Step 1: Add the pre-paint snippet before `</head>`**

Insert the snippet from Task 3 Step 1 immediately before `</head>`.

- [ ] **Step 2: Add the language dropdown at the end of `<nav>`**

Insert the dropdown block from Task 4 Step 2 immediately before `</nav>` of `.site-nav`.

- [ ] **Step 3: Add `js/i18n.js` script tag**

After `<script src="js/site.js"></script>` (around line 102), insert:

```html
  <script src="js/i18n.js"></script>
```

- [ ] **Step 4: Manual test**

Open `web/blog.html`. Verify dropdown works. Reset locale.

- [ ] **Step 5: Commit**

```bash
git add web/blog.html
git commit -m "feat(nav): add language dropdown to blog.html"
```

---

## Task 9: Add dropdown to `about.html`

**Files:**
- Modify: `web/about.html`

- [ ] **Step 1: Add the pre-paint snippet before `</head>`**

Insert the snippet from Task 3 Step 1 immediately before `</head>`.

- [ ] **Step 2: Add the language dropdown at the end of `<nav>`**

Insert the dropdown block from Task 4 Step 2 immediately before `</nav>` of `.site-nav`.

- [ ] **Step 3: Add `js/i18n.js` script tag**

After `<script src="js/site.js"></script>` (around line 97), insert:

```html
  <script src="js/i18n.js"></script>
```

- [ ] **Step 4: Manual test**

Open `web/about.html`. Verify dropdown works. Reset locale.

- [ ] **Step 5: Commit**

```bash
git add web/about.html
git commit -m "feat(nav): add language dropdown to about.html"
```

---

## Task 10: Add dropdown to `contact.html`

**Files:**
- Modify: `web/contact.html`

- [ ] **Step 1: Add the pre-paint snippet before `</head>`**

Insert the snippet from Task 3 Step 1 immediately before `</head>`.

- [ ] **Step 2: Add the language dropdown at the end of `<nav>`**

Insert the dropdown block from Task 4 Step 2 immediately before `</nav>` of `.site-nav`.

- [ ] **Step 3: Add `js/i18n.js` script tag**

After `<script src="js/site.js"></script>` (around line 99), insert:

```html
  <script src="js/i18n.js"></script>
```

- [ ] **Step 4: Manual test**

Open `web/contact.html`. Verify dropdown works. Reset locale.

- [ ] **Step 5: Commit**

```bash
git add web/contact.html
git commit -m "feat(nav): add language dropdown to contact.html"
```

---

## Task 11: Add dropdown to `privacy.html`

**Files:**
- Modify: `web/privacy.html`

- [ ] **Step 1: Add the pre-paint snippet before `</head>`**

Insert the snippet from Task 3 Step 1 immediately before `</head>`.

- [ ] **Step 2: Add the language dropdown at the end of `<nav>`**

Insert the dropdown block from Task 4 Step 2 immediately before `</nav>` of `.site-nav`.

- [ ] **Step 3: Add `js/i18n.js` script tag**

After `<script src="js/site.js"></script>` (around line 144), insert:

```html
  <script src="js/i18n.js"></script>
```

- [ ] **Step 4: Manual test**

Open `web/privacy.html`. Verify dropdown works. Reset locale.

- [ ] **Step 5: Commit**

```bash
git add web/privacy.html
git commit -m "feat(nav): add language dropdown to privacy.html"
```

---

## Task 12: Add dropdown to `terms.html`

**Files:**
- Modify: `web/terms.html`

- [ ] **Step 1: Add the pre-paint snippet before `</head>`**

Insert the snippet from Task 3 Step 1 immediately before `</head>`.

- [ ] **Step 2: Add the language dropdown at the end of `<nav>`**

Insert the dropdown block from Task 4 Step 2 immediately before `</nav>` of `.site-nav`.

- [ ] **Step 3: Add `js/i18n.js` script tag**

After `<script src="js/site.js"></script>` (around line 123), insert:

```html
  <script src="js/i18n.js"></script>
```

- [ ] **Step 4: Manual test**

Open `web/terms.html`. Verify dropdown works. Reset locale.

- [ ] **Step 5: Commit**

```bash
git add web/terms.html
git commit -m "feat(nav): add language dropdown to terms.html"
```

---

## Task 13: Add dropdown to `disclaimer.html`

**Files:**
- Modify: `web/disclaimer.html`

- [ ] **Step 1: Add the pre-paint snippet before `</head>`**

Insert the snippet from Task 3 Step 1 immediately before `</head>`.

- [ ] **Step 2: Add the language dropdown at the end of `<nav>`**

Insert the dropdown block from Task 4 Step 2 immediately before `</nav>` of `.site-nav`.

- [ ] **Step 3: Add `js/i18n.js` script tag**

After `<script src="js/site.js"></script>` (around line 108), insert:

```html
  <script src="js/i18n.js"></script>
```

- [ ] **Step 4: Manual test**

Open `web/disclaimer.html`. Verify dropdown works. Reset locale.

- [ ] **Step 5: Commit**

```bash
git add web/disclaimer.html
git commit -m "feat(nav): add language dropdown to disclaimer.html"
```

---

## Task 14: Add dropdown to `blog/rule-of-72.html`

**Files:**
- Modify: `web/blog/rule-of-72.html`

Note the relative paths — this file lives one directory deeper, so scripts are loaded as `../js/site.js`.

- [ ] **Step 1: Add the pre-paint snippet before `</head>`**

Insert the snippet from Task 3 Step 1 immediately before `</head>`. The snippet is path-agnostic — no changes needed.

- [ ] **Step 2: Add the language dropdown at the end of `<nav>`**

Insert the dropdown block from Task 4 Step 2 immediately before `</nav>` of `.site-nav`.

- [ ] **Step 3: Add `js/i18n.js` script tag (use relative path `../js/i18n.js`)**

After `<script src="../js/site.js"></script>` (around line 167), insert:

```html
  <script src="../js/i18n.js"></script>
```

- [ ] **Step 4: Manual test**

Open `web/blog/rule-of-72.html`. Verify trigger shows the flag/code, dropdown opens, selection persists, `<html lang>` updates. Reset locale.

- [ ] **Step 5: Commit**

```bash
git add web/blog/rule-of-72.html
git commit -m "feat(nav): add language dropdown to blog/rule-of-72.html"
```

---

## Task 15: Add dropdown to `blog/simple-vs-compound-interest.html`

**Files:**
- Modify: `web/blog/simple-vs-compound-interest.html`

- [ ] **Step 1: Add the pre-paint snippet before `</head>`**

Insert the snippet from Task 3 Step 1 immediately before `</head>`.

- [ ] **Step 2: Add the language dropdown at the end of `<nav>`**

Insert the dropdown block from Task 4 Step 2 immediately before `</nav>` of `.site-nav`.

- [ ] **Step 3: Add `js/i18n.js` script tag (use relative path `../js/i18n.js`)**

After `<script src="../js/site.js"></script>` (around line 180), insert:

```html
  <script src="../js/i18n.js"></script>
```

- [ ] **Step 4: Manual test**

Open `web/blog/simple-vs-compound-interest.html`. Verify dropdown works. Reset locale.

- [ ] **Step 5: Commit**

```bash
git add web/blog/simple-vs-compound-interest.html
git commit -m "feat(nav): add language dropdown to blog/simple-vs-compound-interest.html"
```

---

## Task 16: Final cross-cutting verification

**Files:** none (verification only)

- [ ] **Step 1: Run the spec's manual verification checklist end-to-end**

Open `web/index.html` and walk through every item in the spec's "Manual Verification Checklist" (lines 141–150 of `web/docs/superpowers/specs/2026-05-24-language-dropdown-design.md`).

For the "all 13 pages render" item, open each page in turn and confirm:
- Trigger appears in the nav.
- Trigger shows the correct flag/code (matches whatever the persisted locale is).
- Layout is not broken on desktop.
- Resize window to mobile width (< 880px) and confirm the dropdown collapses gracefully into the existing mobile nav stack.

- [ ] **Step 2: Reset to defaults**

In the browser console:

```javascript
localStorage.removeItem('locale');
```

Reload one page to confirm trigger reverts to `🇬🇧 EN`.

- [ ] **Step 3: No commit needed for this task**

This is a verification-only task. If anything failed, return to the relevant task and fix it.

---

## Self-Review Notes

- Spec section "Component Markup" (lines 25–41) → covered by Tasks 3–15 (markup) and Task 1 (menu rendering).
- Spec section "Languages" (lines 43–66) → covered by `LANGUAGES` array in Task 1.
- Spec section "Data Flow" (lines 68–77) — Pre-paint → Tasks 3–15 Step 1; Hydration → Task 1 (`I18n.init`); User selects → Task 1 (menu click handler); Cross-page persistence → exercised in Task 4 Step 5 and Task 16.
- Spec section "i18n.js Changes" (lines 79–88) → covered by Task 1.
- Spec section "CSS" (lines 90–99) → covered by Task 2.
- Spec section "Pages to Modify" (lines 103–127) → 13 tasks (Tasks 3–15), one per page.
- Spec section "Edge Cases" — `try/catch` for localStorage, validation against LANGUAGES, RTL flip, outside-click via existing handlers → all in Task 1.
- Spec section "Manual Verification Checklist" → Task 16.
