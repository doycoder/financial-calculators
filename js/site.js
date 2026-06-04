/* ==========================================================================
   Shared site behavior (used by all pages including the calculator).
   - Theme toggle with localStorage persistence
   - Cookie consent banner (GDPR-style: explicit accept / reject)
   - Canonical URL self-correction (in case domain wasn't replaced at deploy)
   ========================================================================== */
(function () {
  'use strict';

  // ---------- Theme ----------
  function initTheme() {
    const root = document.documentElement;
    let saved;
    try { saved = localStorage.getItem('theme'); } catch (_) {}
    const prefersDark = window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = saved || (prefersDark ? 'dark' : 'light');

    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (_) {}
      // Notify other scripts (e.g. Chart.js) that may need to recolor.
      document.dispatchEvent(new CustomEvent('themechange', { detail: next }));
    });
  }

  // ---------- Cookie consent ----------
  // Stores 'accepted' or 'rejected' in localStorage under 'cookie-consent'.
  // Tracking scripts (analytics / AdSense) should check window.__consent
  // before initializing.
  const CONSENT_KEY = 'cookie-consent';

  function readConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (_) { return null; }
  }
  function writeConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (_) {}
    window.__consent = value;
    document.dispatchEvent(new CustomEvent('consentchange', { detail: value }));
  }

  function buildBanner() {
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('data-i18n-attr', 'aria-label:cookie.ariaLabel');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = `
      <div class="cookie-banner-inner">
        <div class="cookie-text">
          <strong data-i18n="cookie.title">We value your privacy.</strong>
          <span data-i18n="cookie.body">We use cookies to remember your preferences and, with your consent, to measure traffic and serve relevant ads.</span>
          <span data-i18n="cookie.policyPrefix">See our</span> <a href="privacy.html" data-i18n="cookie.policyLink">Privacy Policy</a> <span data-i18n="cookie.policySuffix">for details.</span>
        </div>
        <div class="cookie-actions">
          <button type="button" class="btn btn-ghost" data-consent="rejected" data-i18n="cookie.reject">Reject</button>
          <button type="button" class="btn btn-primary" data-consent="accepted" data-i18n="cookie.accept">Accept</button>
        </div>
      </div>
    `;
    return banner;
  }

  function initCookieBanner() {
    const existing = readConsent();
    window.__consent = existing;
    if (existing) return;            // already decided — don't show again

    const banner = buildBanner();
    document.body.appendChild(banner);
    if (window.I18n && typeof window.I18n.applyTo === 'function') window.I18n.applyTo(banner);
    // Animate in on next frame so the CSS transition runs.
    requestAnimationFrame(() => banner.classList.add('show'));

    banner.addEventListener('click', (e) => {
      const target = e.target.closest('[data-consent]');
      if (!target) return;
      writeConsent(target.dataset.consent);
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 300);
    });
  }

  // ---------- Canonical fallback ----------
  // If the deploy step didn't replace the placeholder domain, rewrite
  // canonical and og:url at runtime so Googlebot still gets a sane URL.
  function fixCanonical() {
    const link = document.querySelector('link[rel="canonical"]');
    const og   = document.querySelector('meta[property="og:url"]');
    const path = location.pathname + location.search;
    const real = location.origin + path;
    if (link && link.href.includes('YOUR_DOMAIN')) link.href = real;
    if (og && og.content.includes('YOUR_DOMAIN'))  og.setAttribute('content', real);
  }

  // ---------- Navigation (dropdown + mobile toggle) ----------
  function initNav() {
    // Mobile hamburger toggle
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.site-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !toggle.contains(e.target)) {
          nav.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Dropdown menus
    document.querySelectorAll('.nav-dropdown').forEach((dd) => {
      const btn = dd.querySelector('.nav-dropdown-toggle');
      if (!btn) return;

      const isMobile = () => window.matchMedia('(max-width: 880px)').matches;

      const close = () => {
        dd.dataset.open = 'false';
        btn.setAttribute('aria-expanded', 'false');
      };
      const open = () => {
        // Close other dropdowns first
        document.querySelectorAll('.nav-dropdown[data-open="true"]').forEach((other) => {
          if (other !== dd) {
            other.dataset.open = 'false';
            const ob = other.querySelector('.nav-dropdown-toggle');
            if (ob) ob.setAttribute('aria-expanded', 'false');
          }
        });
        dd.dataset.open = 'true';
        btn.setAttribute('aria-expanded', 'true');
      };

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dd.dataset.open === 'true' ? close() : open();
      });

      // Desktop hover-open
      dd.addEventListener('mouseenter', () => { if (!isMobile()) open(); });
      dd.addEventListener('mouseleave', () => { if (!isMobile()) close(); });

      // Keyboard navigation
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
          const first = dd.querySelector('.nav-dropdown-menu a');
          if (first) first.focus();
        } else if (e.key === 'Escape') {
          close();
        }
      });
      dd.querySelectorAll('.nav-dropdown-menu a').forEach((a) => {
        a.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') { close(); btn.focus(); }
        });
      });

      // Close when clicking outside
      document.addEventListener('click', (e) => {
        if (!dd.contains(e.target)) close();
      });
    });
  }

  function init() {
    initTheme();
    initNav();
    initCookieBanner();
    fixCanonical();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
