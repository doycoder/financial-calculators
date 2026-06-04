# Language Dropdown — Design Spec

**Date:** 2026-05-24
**Scope:** Add a language switcher dropdown to the navigation bar across all pages of the `web/` static site.

## Goal

Let visitors switch the UI language from the site header. Visual style follows the reference mockup: a flag-and-code grid menu that opens from a flag-and-code trigger in the nav. Default is English. The choice is remembered across pages.

## Non-Goals

- Translating page bodies, calculator copy, blog posts, or legal pages. These remain English.
- Adding a build system, partials, or templating engine.
- Server-side locale negotiation.
- Auto-detecting the browser's preferred language. Default is always `en` until the user explicitly picks one.

## Approach (chosen)

Inline the dropdown markup in each page's `<nav>`, the same way the existing `Calculators` dropdown is duplicated across pages. Reuse the `.nav-dropdown` open/close, keyboard, and mobile behavior already in `js/site.js`. Extend `js/i18n.js` with a `LANGUAGES` metadata table and a small render/persist layer.

Rejected alternatives:
- **JS runtime injection** — would cause a flash before the dropdown mounts and breaks the existing "markup lives in HTML" pattern.
- **Build-time templating** (Eleventy / SSI) — disproportionate to a static site that currently deploys raw files.

## Component Markup

Slot the new dropdown into the primary `<nav>` of each page, after the `Calculators` dropdown and before `#themeToggle`.

```html
<div class="nav-dropdown lang-dropdown">
  <button class="nav-dropdown-toggle" aria-expanded="false" aria-haspopup="true" aria-label="Select language">
    <span class="lang-current" data-lang-current>🇬🇧 EN</span>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
  </button>
  <div class="nav-dropdown-menu lang-menu" role="menu" data-lang-menu>
    <!-- buttons rendered by js/i18n.js from LANGUAGES table -->
  </div>
</div>
```

The `lang-menu` is populated at startup from the `LANGUAGES` table so the language list lives in one place. Each item is a `<button role="menuitem" data-locale="...">` containing a flag emoji and label.

## Languages

Mirrors the reference mockup, 16 entries. Native labels for the Chinese variants follow the mockup convention (`华语` / `華語`). All flags are Unicode regional-indicator emoji.

| code | flag | label |
|---|---|---|
| en | 🇬🇧 | EN |
| es | 🇪🇸 | ES |
| de | 🇩🇪 | DE |
| fr | 🇫🇷 | FR |
| ru | 🇷🇺 | RU |
| pt | 🇵🇹 | PT |
| it | 🇮🇹 | IT |
| zh-Hans | 🇨🇳 | 华语 |
| zh-Hant | 🇭🇰 | 華語 |
| th | 🇹🇭 | TH |
| ar | 🇸🇦 | عربي |
| ja | 🇯🇵 | JP |
| vi | 🇻🇳 | VI |
| my | 🇲🇲 | MY |
| id | 🇮🇩 | ID |
| tr | 🇹🇷 | TR |

The trigger always shows `flag + uppercase code` for the active locale (the code is uppercased even when stored lowercase, to match the mockup's `EN` style). For `ar`, the trigger label is `عربي`.

## Data Flow

1. **Pre-paint locale read.** A small synchronous snippet at the end of `<head>` reads `localStorage.locale`, falls back to `en`, and sets `document.documentElement.lang` and (for `ar`) `dir="rtl"`. This avoids a flash from English to the saved locale.
2. **Hydration.** When `js/i18n.js` runs on `DOMContentLoaded`, it:
   - Renders the `lang-menu` items from `LANGUAGES`.
   - Marks the active item with `aria-current="true"`.
   - Updates `[data-lang-current]` to show the active flag + code.
   - Calls `I18n.setLocale(currentLocale)` to translate any `[data-i18n]` elements (currently very few — most copy stays English via fallback).
3. **User selects.** Click handler reads `data-locale`, writes `localStorage.locale`, calls `I18n.setLocale(newLocale)`, updates the trigger label, toggles `dir` on `<html>`, closes the menu. No page reload.
4. **Cross-page persistence.** On the next page load, step 1 restores the same locale from `localStorage`.

## i18n.js Changes

- Add `LANGUAGES` array (the 16 rows above) exported on `I18n.languages`.
- Add stub entries to `TRANSLATIONS` for each new locale containing only `brand` and `nav.*` keys. Missing keys fall through to `TRANSLATIONS.en` via the existing fallback in `t()`. No need to translate hero/labels/buttons/toast in this scope.
- Extend `setLocale(locale)`:
  - Persist to `localStorage.locale`.
  - Update `document.documentElement.lang` (use the locale string as-is, e.g., `zh-Hans`).
  - Update `document.documentElement.dir` to `rtl` for `ar`, else `ltr`.
  - Update every `[data-lang-current]` trigger to `flag + UPPER(code)` (or native label for `ar`).
- Add `I18n.init()` that reads localStorage, renders any `[data-lang-menu]` it finds, wires click handlers, and calls `setLocale`.

## CSS

Add to `css/style.css`, reusing existing `.nav-dropdown` rules. Only new styling needed:

- `.lang-dropdown .nav-dropdown-menu` — switch to a two-column grid (`grid-template-columns: 1fr 1fr`), tighter padding, fixed compact width (~220px) so it looks like the mockup card.
- `.lang-menu button` — flat, no border, hover background, flag emoji at 1.1em with right margin.
- `.lang-menu button[aria-current="true"]` — bold or accent color to mark active.
- Mobile (`max-width: 880px`) — keep the existing collapse-into-stack behavior, but stay 2-column inside the panel.
- `.lang-current` — inline-flex with small gap so flag and code don't collide.

No changes to existing dropdown rules.

## Pages to Modify

All 13 HTML files served by the site:

Root (`web/`):
- `index.html`
- `calculators.html`
- `loan-calculator.html`
- `savings-goal-calculator.html`
- `simple-interest-calculator.html`
- `blog.html`
- `about.html`
- `contact.html`
- `privacy.html`
- `terms.html`
- `disclaimer.html`

Blog (`web/blog/`):
- `rule-of-72.html`
- `simple-vs-compound-interest.html`

Each gets:
1. The pre-paint locale snippet at the end of `<head>`.
2. The new `<div class="nav-dropdown lang-dropdown">…</div>` block in `<nav>`.

If the blog pages don't currently include `js/i18n.js`, add it alongside `js/site.js`.

`js/site.js` and `js/i18n.js` are shared, so JS/CSS work happens once.

## Edge Cases

- **No `localStorage`** (private mode strict settings): `try/catch` around reads/writes, fall back to in-memory `en`. Existing code already uses this pattern.
- **Unknown locale in `localStorage`** (e.g., user edits it manually): `setLocale` validates against `LANGUAGES` and falls back to `en`.
- **RTL on non-RTL pages:** Setting `dir="rtl"` flips layout direction. Acceptable for `ar`; we accept that the calculator UI is not specifically RTL-tuned in this scope.
- **Emoji flags on Windows:** Windows renders regional-indicator emoji as letter pairs (e.g., `GB`) in default fonts. We accept this — adding a webfont or image set is out of scope for this iteration.
- **Outside-click and Escape:** Inherited from existing `.nav-dropdown` handlers — no new code needed.

## Manual Verification Checklist

- [ ] Trigger shows `🇬🇧 EN` on first visit, no flash.
- [ ] Click opens a 2-column flag grid matching the mockup.
- [ ] Hover-open works on desktop; tap-open works on mobile.
- [ ] Keyboard: `Enter`/`Space`/`ArrowDown` opens, `Escape` closes, `Tab` moves through items.
- [ ] Click outside closes.
- [ ] Selecting `🇨🇳 华语` updates trigger to `🇨🇳 华语`, `<html lang>` to `zh-Hans`, persists to `localStorage`.
- [ ] Selecting `🇸🇦 عربي` adds `dir="rtl"` to `<html>`; switching to another locale removes it.
- [ ] Reload preserves the locale.
- [ ] Navigate from `index.html` to `about.html` — trigger still shows the chosen locale.
- [ ] All 13 pages render the dropdown in the same nav slot without breaking layout on desktop or mobile.

## Out of Scope (Follow-up Candidates)

- Filling in full translation dictionaries for the 14 added locales.
- Adding `data-i18n` attributes throughout page bodies.
- Switching to image-based flags for consistent Windows rendering.
- Auto-detect via `navigator.language` on first visit.
- RTL-tuned calculator layouts.
