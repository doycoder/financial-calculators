
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const els = {
    principal:    $('CAGR-principal'),
	finalVal:        $('CAGR-final'),
    years:        $('CAGR-years'),
    yearsNumber:  $('CAGR-yearsNumber'),
    yearsValue:   $('CAGR-yearsValue'),
    interest:     $('CAGR-interest'),
    effective:    $('CAGR-effective'),
    chart:        $('CAGR-chart'),
    resetBtn:     $('CAGR-resetBtn'),
  };

  const DEFAULTS = { principal: 5000, finalVal:7000, years: 3 };
  const animCache = new WeakMap();
  let chart = null;

  const fmt = (v) => '$' + Math.round(v).toLocaleString('en-US');
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  function animate(el, target, formatter) {
    const start = animCache.get(el) || 0;
    const dur = 500;
    const t0 = performance.now();
    cancelAnimationFrame(el._raf);
    function tick(now) {
      const t = clamp((now - t0) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatter(start + (target - start) * eased);
      if (t < 1) el._raf = requestAnimationFrame(tick);
      else animCache.set(el, target);
    }
    el._raf = requestAnimationFrame(tick);
  }

  function read() {
    return {
      P: Math.max(0, parseFloat(els.principal.value) || 0),
      f: Math.max(0, parseFloat(els.finalVal.value) || 0),
      t: Math.max(0.01, parseFloat(els.years.value) || 0.01),
    };
  }

  function chartColors() {
    const dark = document.documentElement.dataset.theme === 'dark';
    return {
      grid:   dark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.06)',
      tick:   dark ? '#94a3b8' : '#64748b',
      pFill:  dark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.35)',
      pLine:  dark ? '#94a3b8' : '#64748b',
      iFill:  'rgba(79, 70, 229, 0.25)',
      iLine:  '#4f46e5',
      bg:     '#0f172a',
      fg:     '#f8fafc',
    };
  }

  function buildChart(P, f, t) {
    const points = Math.max(2, Math.min(30, Math.ceil(t * 4)));
    const labels = [];
    const principalLine = [];
    const totalLine = [];
    for (let i = 0; i <= points; i++) {
      const yr = (t * i) / points;
      labels.push(yr.toFixed(yr < 1 ? 2 : 1) + ' yr');
      principalLine.push(P);
	  totalLine.push(P + (f - P) * yr / t);
    }

    const c = chartColors();
    const data = {
      labels,
      datasets: [
        { label: 'Principal', data: principalLine,
          fill: true, backgroundColor: c.pFill, borderColor: c.pLine,
          borderWidth: 2, tension: 0, pointRadius: 0, pointHoverRadius: 4 },
        { label: 'Total', data: totalLine,
          fill: '-1', backgroundColor: c.iFill, borderColor: c.iLine,
          borderWidth: 2.5, tension: 0, pointRadius: 0, pointHoverRadius: 4 },
      ],
    };
    const options = {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: c.bg, titleColor: c.fg, bodyColor: c.fg,
          padding: 12, cornerRadius: 8,
          callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` },
        },
      },
      scales: {
        x: { grid: { color: c.grid, drawTicks: false }, ticks: { color: c.tick, maxTicksLimit: 6, font: { size: 11 } }, border: { display: false } },
        y: {
          grid: { color: c.grid, drawTicks: false },
          ticks: {
            color: c.tick, font: { size: 11 },
            callback: (v) => v >= 1e6 ? '$' + (v/1e6).toFixed(1) + 'M' : v >= 1e3 ? '$' + (v/1e3).toFixed(0) + 'K' : '$' + v,
          },
          border: { display: false },
        },
      },
    };
    if (chart) { chart.data = data; chart.options = options; chart.update('none'); }
    else chart = new Chart(els.chart.getContext('2d'), { type: 'line', data, options });
  }

  function recalc() {
    const { P, f, t } = read();
    const I = f - P;
    const eff = P > 0?(Math.pow((f / P), (1 / t)) - 1) * 100:0;
    animate(els.interest,     I,            fmt);
	els.interest.style.color =
  I >= 0
    ? '#10B981'
    : '#EF4444';
    animate(els.effective,    eff,          (v) => (v.toFixed(2).toLocaleString('en-US') +'%'));
	els.effective.style.color =
  eff >= 0
    ? '#10B981'
    : '#EF4444';

    buildChart(P, f, t);
  }

  function bindPair(rangeEl, numEl, valueEl) {
    rangeEl.addEventListener('input', () => {
      numEl.value = rangeEl.value;
      if (valueEl) valueEl.textContent = rangeEl.value;
      recalc();
    });
    numEl.addEventListener('input', () => {
      const v = parseFloat(numEl.value);
      if (!Number.isNaN(v)) {
        rangeEl.value = clamp(v, parseFloat(rangeEl.min), parseFloat(rangeEl.max));
        if (valueEl) valueEl.textContent = numEl.value;
      }
      recalc();
    });
  }

  function reset() {
    els.principal.value = DEFAULTS.principal;
	els.finalVal.value = DEFAULTS.finalVal;
    //els.rate.value = DEFAULTS.rate;
    //els.rateNumber.value = DEFAULTS.rate;
    //els.rateValue.textContent = DEFAULTS.rate;
    els.years.value = DEFAULTS.years;
    els.yearsNumber.value = DEFAULTS.years;
    els.yearsValue.textContent = DEFAULTS.years;
    recalc();
  }

  function init() {
    els.principal.addEventListener('input', recalc);
	els.finalVal.addEventListener('input', recalc);
    //bindPair(els.rate, els.rateNumber, els.rateValue);
    bindPair(els.years, els.yearsNumber, els.yearsValue);
    els.resetBtn.addEventListener('click', reset);
    document.addEventListener('themechange', () => { if (chart) recalc(); });
    recalc();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
