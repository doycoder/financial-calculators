/* ==========================================================================
   Compound Interest Calculator — Application Logic
   - Real-time calculation
   - Animated number transitions
   - Chart.js stacked area chart
   - Theme toggle (with localStorage persistence)
   - URL-based sharing
   - PNG chart export
   ========================================================================== */

(function () {
  'use strict';

  // ---------- DOM refs ----------
  const $ = (id) => document.getElementById(id);

  const els = {
    principal:      $('principal'),
    rate:           $('rate'),
    rateNumber:     $('rateNumber'),
    rateValue:      $('rateValue'),
    years:          $('years'),
    yearsNumber:    $('yearsNumber'),
    yearsValue:     $('yearsValue'),
    frequency:      $('frequency'),
    contribution:   $('contribution'),
    finalValue:     $('finalValue'),
    totalContrib:   $('totalContrib'),
    totalInterest:  $('totalInterest'),
    annualReturn:   $('annualReturn'),
    chart:          $('growthChart'),
    themeToggle:    $('themeToggle'),
    shareBtn:       $('shareBtn'),
    exportBtn:      $('exportBtn'),
    resetBtn:       $('resetBtn'),
    toast:          $('toast'),
    shareModal:     $('shareModal'),
    shareUrl:       $('shareUrl'),
    copyUrlBtn:     $('copyUrlBtn'),
    shareTwitter:   $('shareTwitter'),
    shareLinkedIn:  $('shareLinkedIn'),
    shareFacebook:  $('shareFacebook'),
  };

  // ---------- Defaults & state ----------
  const DEFAULTS = {
    principal: 10000,
    rate: 7,
    years: 20,
    frequency: 12,
    contribution: 500,
  };

  // animated value cache: holds last displayed numeric value per element
  const animCache = new WeakMap();
  let chart = null;

  // ---------- Helpers ----------
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function formatCurrency(value) {
    return '$' + Math.round(value).toLocaleString('en-US');
  }

  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(els.toast._t);
    els.toast._t = setTimeout(() => els.toast.classList.remove('show'), 2200);
  }

  // Tween a number from its previous displayed value to a new target.
  function animateNumber(el, target, formatter) {
    const start = animCache.get(el) || 0;
    const duration = 600;
    const startTime = performance.now();

    cancelAnimationFrame(el._raf);

    function tick(now) {
      const t = clamp((now - startTime) / duration, 0, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = start + (target - start) * eased;
      el.textContent = formatter(current);
      if (t < 1) {
        el._raf = requestAnimationFrame(tick);
      } else {
        animCache.set(el, target);
      }
    }
    el._raf = requestAnimationFrame(tick);
  }

  // ---------- Core math ----------
  /**
   * Simulate compound growth month-by-month so we can plot the curve.
   * Returns { labels, balanceSeries, contribSeries, interestSeries, summary }.
   *
   * Logic:
   *  - Compounding is applied n times per year on the running balance.
   *  - Monthly contributions are added at the end of each month before that
   *    month's compounding event(s) for that period.
   *  - For "annual" compounding, contributions still accrue monthly but
   *    interest is credited once per year on the year-end balance increment.
   *
   * For accuracy across all frequencies we use a per-period rate r/n applied
   * over the right number of sub-steps and treat contributions as monthly
   * deposits, summing into the balance at the start of each month.
   */
  function simulate({ principal, annualRate, years, n, monthlyContribution }) {
    const months = years * 12;
    const r = annualRate / 100;
    const periodsPerMonth = n / 12; // e.g. monthly => 1, daily => ~30.4, annual => 1/12
    const ratePerPeriod = r / n;

    let balance = principal;
    let totalContributed = principal;

    const labels = ['Year 0'];
    const balanceSeries = [balance];
    const contribSeries = [totalContributed];
    const interestSeries = [0];

    for (let month = 1; month <= months; month++) {
      // 1) deposit the monthly contribution at start of the month
      balance += monthlyContribution;
      totalContributed += monthlyContribution;

      // 2) compound for this month: apply (1 + r/n)^(n/12)
      balance = balance * Math.pow(1 + ratePerPeriod, periodsPerMonth);

      // record each year (or every month if <= 5 yrs for finer detail)
      const recordPoint = (months <= 60) || (month % 12 === 0);
      if (recordPoint) {
        const label = (months <= 60)
          ? `M${month}`
          : `Year ${month / 12}`;
        labels.push(label);
        balanceSeries.push(balance);
        contribSeries.push(totalContributed);
        interestSeries.push(Math.max(0, balance - totalContributed));
      }
    }

    const finalValue = balance;
    const totalInterest = Math.max(0, finalValue - totalContributed);

    // CAGR-style annualized return on the final dollar-weighted result.
    // For pure principal: (FV/PV)^(1/t) - 1. With contributions this is
    // an approximation; we present the input rate when contribs > 0, otherwise
    // compute from formula.
    let annualReturn;
    if (monthlyContribution > 0 || principal === 0) {
      annualReturn = annualRate;
    } else {
      annualReturn = (Math.pow(finalValue / principal, 1 / years) - 1) * 100;
    }

    return {
      labels,
      balanceSeries,
      contribSeries,
      interestSeries,
      summary: {
        finalValue,
        totalContributed,
        totalInterest,
        annualReturn,
      },
    };
  }

  // ---------- Read inputs ----------
  function readInputs() {
    return {
      principal: Math.max(0, parseFloat(els.principal.value) || 0),
      annualRate: clamp(parseFloat(els.rate.value) || 0, 0, 100),
      years: clamp(parseInt(els.years.value, 10) || 1, 1, 100),
      n: parseInt(els.frequency.value, 10) || 12,
      monthlyContribution: Math.max(0, parseFloat(els.contribution.value) || 0),
    };
  }

  // ---------- Chart ----------
  function chartColors() {
    const dark = document.documentElement.dataset.theme === 'dark';
    return {
      grid:       dark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.06)',
      tick:       dark ? '#94a3b8' : '#64748b',
      contribFill:dark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.35)',
      contribLine:dark ? '#94a3b8' : '#64748b',
      interestFill: 'rgba(79, 70, 229, 0.25)',
      interestLine: '#4f46e5',
      tooltipBg:  dark ? '#0f172a' : '#0f172a',
      tooltipText:'#f8fafc',
    };
  }

  function buildChart(result) {
    const c = chartColors();
    const ctx = els.chart.getContext('2d');

    const data = {
      labels: result.labels,
      datasets: [
        {
          label: 'Contributions',
          data: result.contribSeries,
          fill: true,
          backgroundColor: c.contribFill,
          borderColor: c.contribLine,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 5,
        },
        {
          label: 'Interest Earned',
          data: result.balanceSeries,
          fill: '-1',
          backgroundColor: c.interestFill,
          borderColor: c.interestLine,
          borderWidth: 2.5,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 5,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: c.tooltipBg,
          titleColor: c.tooltipText,
          bodyColor: c.tooltipText,
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function (ctx) {
              const v = ctx.parsed.y;
              return `${ctx.dataset.label}: ${formatCurrency(v)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: c.grid, drawTicks: false },
          ticks: { color: c.tick, maxTicksLimit: 8, font: { size: 11 } },
          border: { display: false },
        },
        y: {
          grid: { color: c.grid, drawTicks: false },
          ticks: {
            color: c.tick,
            font: { size: 11 },
            callback: (val) => {
              if (val >= 1e6) return '$' + (val / 1e6).toFixed(1) + 'M';
              if (val >= 1e3) return '$' + (val / 1e3).toFixed(0) + 'K';
              return '$' + val;
            },
          },
          border: { display: false },
        },
      },
    };

    if (chart) {
      chart.data = data;
      chart.options = options;
      chart.update('none');
    } else {
      chart = new Chart(ctx, { type: 'line', data, options });
    }
  }

  // ---------- Render ----------
  function recalc() {
    const inputs = readInputs();
    const result = simulate(inputs);
    const s = result.summary;

    animateNumber(els.finalValue,   s.finalValue,      formatCurrency);
    animateNumber(els.totalContrib, s.totalContributed, formatCurrency);
    animateNumber(els.totalInterest,s.totalInterest,    formatCurrency);
    animateNumber(els.annualReturn, s.annualReturn,
      (v) => v.toFixed(2));

    buildChart(result);
  }

  // ---------- Range / number sync ----------
  function bindSyncedPair(rangeEl, numberEl, valueEl) {
    rangeEl.addEventListener('input', () => {
      numberEl.value = rangeEl.value;
      if (valueEl) valueEl.textContent = rangeEl.value;
      recalc();
    });
    numberEl.addEventListener('input', () => {
      const v = parseFloat(numberEl.value);
      if (!Number.isNaN(v)) {
        rangeEl.value = clamp(v, parseFloat(rangeEl.min), parseFloat(rangeEl.max));
        if (valueEl) valueEl.textContent = numberEl.value;
      }
      recalc();
    });
  }

  // ---------- Theme (chart recolor only — site.js owns the toggle) ----------
  function onThemeChange() {
    if (chart) buildChart(simulate(readInputs()));
  }

  // ---------- Share via URL ----------
  function buildShareURL() {
    const i = readInputs();
    const params = new URLSearchParams({
      p: i.principal,
      r: i.annualRate,
      y: i.years,
      n: i.n,
      c: i.monthlyContribution,
    });
    return `${location.origin}${location.pathname}?${params.toString()}`;
  }

  function applyURLParams() {
    const params = new URLSearchParams(location.search);
    if (![...params.keys()].length) return;
    const get = (k, fallback) => {
      const v = params.get(k);
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : fallback;
    };
    els.principal.value    = get('p', DEFAULTS.principal);
    els.rate.value         = get('r', DEFAULTS.rate);
    els.rateNumber.value   = els.rate.value;
    els.rateValue.textContent = els.rate.value;
    els.years.value        = get('y', DEFAULTS.years);
    els.yearsNumber.value  = els.years.value;
    els.yearsValue.textContent = els.years.value;
    els.frequency.value    = get('n', DEFAULTS.frequency);
    els.contribution.value = get('c', DEFAULTS.contribution);
  }

  async function handleShare() {
    const url = buildShareURL();
    openShareModal(url);
  }

  // ---------- Share modal ----------
  function openShareModal(url) {
    els.shareUrl.value = url;
    const text = encodeURIComponent('Check out my compound interest projection');
    const enc  = encodeURIComponent(url);
    els.shareTwitter.href  = `https://twitter.com/intent/tweet?text=${text}&url=${enc}`;
    els.shareLinkedIn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${enc}`;
    els.shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${enc}`;

    els.shareModal.hidden = false;
    document.body.classList.add('modal-open');
    // Select the URL for quick manual copy
    requestAnimationFrame(() => {
      els.shareUrl.focus();
      els.shareUrl.select();
    });
  }

  function closeShareModal() {
    els.shareModal.hidden = true;
    document.body.classList.remove('modal-open');
  }

  async function copyShareUrl() {
    const url = els.shareUrl.value;
    try {
      await navigator.clipboard.writeText(url);
      els.copyUrlBtn.textContent = 'Copied!';
      showToast('Link copied to clipboard');
      setTimeout(() => { els.copyUrlBtn.textContent = 'Copy'; }, 1800);
      return;
    } catch (_) { /* fall through */ }

    // Fallback for older browsers / non-secure contexts
    els.shareUrl.focus();
    els.shareUrl.select();
    try {
      document.execCommand('copy');
      els.copyUrlBtn.textContent = 'Copied!';
      showToast('Link copied');
      setTimeout(() => { els.copyUrlBtn.textContent = 'Copy'; }, 1800);
    } catch (_) {
      showToast('Press Ctrl+C to copy');
    }
  }

  // ---------- Export PNG ----------
  function handleExport() {
    if (!chart) return;
    // Composite onto a backdrop so dark-mode PNGs are not transparent.
    const src = chart.canvas;
    const out = document.createElement('canvas');
    out.width = src.width;
    out.height = src.height;
    const ctx = out.getContext('2d');
    const dark = document.documentElement.dataset.theme === 'dark';
    ctx.fillStyle = dark ? '#131a2e' : '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(src, 0, 0);

    const link = document.createElement('a');
    link.download = 'compound-interest-chart.png';
    link.href = out.toDataURL('image/png');
    link.click();
    showToast('Chart exported');
  }

  // ---------- Reset ----------
  function handleReset() {
    els.principal.value = DEFAULTS.principal;
    els.rate.value = DEFAULTS.rate;
    els.rateNumber.value = DEFAULTS.rate;
    els.rateValue.textContent = DEFAULTS.rate;
    els.years.value = DEFAULTS.years;
    els.yearsNumber.value = DEFAULTS.years;
    els.yearsValue.textContent = DEFAULTS.years;
    els.frequency.value = DEFAULTS.frequency;
    els.contribution.value = DEFAULTS.contribution;
    history.replaceState(null, '', location.pathname);
    recalc();
    showToast('Reset to defaults');
  }

  // ---------- Wire up ----------
  function init() {
    applyURLParams();

    // simple inputs trigger recalc
    ['input', 'change'].forEach(evt => {
      els.principal.addEventListener(evt, recalc);
      els.frequency.addEventListener(evt, recalc);
      els.contribution.addEventListener(evt, recalc);
    });

    bindSyncedPair(els.rate,  els.rateNumber,  els.rateValue);
    bindSyncedPair(els.years, els.yearsNumber, els.yearsValue);

    // site.js owns the theme toggle; we just react to changes.
    document.addEventListener('themechange', onThemeChange);

    els.shareBtn.addEventListener('click', handleShare);
    els.exportBtn.addEventListener('click', handleExport);
    els.resetBtn.addEventListener('click', handleReset);

    // Share-modal wiring
    els.copyUrlBtn.addEventListener('click', copyShareUrl);
    els.shareModal.querySelectorAll('[data-close]').forEach(el => {
      el.addEventListener('click', closeShareModal);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !els.shareModal.hidden) closeShareModal();
    });

    recalc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
