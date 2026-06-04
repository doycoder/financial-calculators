/* Savings Goal Calculator — solves for monthly contribution given goal/years/rate/current */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const els = {
    goal:        $('sg-goal'),
    current:     $('sg-current'),
    years:       $('sg-years'),
    yearsNumber: $('sg-yearsNumber'),
    yearsValue:  $('sg-yearsValue'),
    rate:        $('sg-rate'),
    rateNumber:  $('sg-rateNumber'),
    rateValue:   $('sg-rateValue'),
    monthly:     $('sg-monthly'),
    contributed: $('sg-contributed'),
    interest:    $('sg-interest'),
    reached:     $('sg-reached'),
    warn:        $('sg-warn'),
    chart:       $('sg-chart'),
    resetBtn:    $('sg-resetBtn'),
  };

  const DEFAULTS = { goal: 50000, current: 5000, years: 5, rate: 5 };
  const animCache = new WeakMap();
  let chart = null;

  const fmt   = (v) => '$' + Math.round(v).toLocaleString('en-US');
  const fmt2  = (v) => '$' + (Math.round(v * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
      goal: Math.max(0, parseFloat(els.goal.value) || 0),
      current: Math.max(0, parseFloat(els.current.value) || 0),
      years: clamp(parseInt(els.years.value, 10) || 1, 1, 100),
      annualRate: clamp(parseFloat(els.rate.value) || 0, 0, 100),
    };
  }

  /**
   * Solve for monthly contribution.
   * Goal = current*(1+i)^n + M * ((1+i)^n - 1) / i
   * => M = (Goal - current*(1+i)^n) * i / ((1+i)^n - 1)
   * Returns negative M if current already exceeds goal (no contributions needed).
   */
  function solve({ goal, current, years, annualRate }) {
    const n = years * 12;
    const i = (annualRate / 100) / 12;
    const fvCurrent = current * Math.pow(1 + i, n);

    let monthly;
    if (i === 0) {
      monthly = (goal - current) / n;
    } else {
      monthly = (goal - fvCurrent) * i / (Math.pow(1 + i, n) - 1);
    }

    // Build the projected balance series (yearly)
    const labels = ['Y0'];
    const contribSeries = [current];
    const balanceSeries = [current];

    let balance = current;
    let totalContrib = current;
    const M = Math.max(0, monthly);

    for (let m = 1; m <= n; m++) {
      // Ordinary annuity: compound first, then deposit at month-end.
      // This matches the closed-form formula above so the chart's final
      // value lines up exactly with the goal.
      balance = balance * (1 + i);
      balance += M;
      totalContrib += M;
      if (m % 12 === 0) {
        labels.push('Y' + (m / 12));
        contribSeries.push(totalContrib);
        balanceSeries.push(balance);
      }
    }

    return {
      monthly,
      finalBalance: balance,
      totalContributed: totalContrib,
      interestEarned: Math.max(0, balance - totalContrib),
      labels,
      contribSeries,
      balanceSeries,
    };
  }

  function chartColors() {
    const dark = document.documentElement.dataset.theme === 'dark';
    return {
      grid:   dark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.06)',
      tick:   dark ? '#94a3b8' : '#64748b',
      cFill:  dark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.35)',
      cLine:  dark ? '#94a3b8' : '#64748b',
      bFill:  'rgba(79, 70, 229, 0.25)',
      bLine:  '#4f46e5',
      bg:     '#0f172a',
      fg:     '#f8fafc',
    };
  }

  function buildChart(result) {
    const c = chartColors();
    const data = {
      labels: result.labels,
      datasets: [
        { label: 'Total Contributions', data: result.contribSeries,
          fill: true, backgroundColor: c.cFill, borderColor: c.cLine,
          borderWidth: 2, tension: 0.3, pointRadius: 0, pointHoverRadius: 4 },
        { label: 'Account Balance', data: result.balanceSeries,
          fill: '-1', backgroundColor: c.bFill, borderColor: c.bLine,
          borderWidth: 2.5, tension: 0.3, pointRadius: 0, pointHoverRadius: 4 },
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
        x: { grid: { color: c.grid, drawTicks: false }, ticks: { color: c.tick, maxTicksLimit: 8, font: { size: 11 } }, border: { display: false } },
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

  function reachedDate(years) {
    const d = new Date();
    d.setMonth(d.getMonth() + years * 12);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  function recalc() {
    const inputs = read();
    const result = solve(inputs);

    // Handle edge cases: goal already met by current savings + interest
    if (result.monthly <= 0) {
      els.warn.style.display = 'block';
      const projected = inputs.current * Math.pow(1 + (inputs.annualRate / 100) / 12, inputs.years * 12);
      const tpl = (window.I18n && typeof window.I18n.t === 'function')
        ? window.I18n.t('pages.savings.results.warnTemplate')
        : 'Good news — your existing savings of {current} would already grow to about {projected} over {years} years at {rate}%. No additional contributions needed.';
      els.warn.textContent = tpl
        .replace('{current}', fmt(inputs.current))
        .replace('{projected}', fmt(projected))
        .replace('{years}', inputs.years)
        .replace('{rate}', inputs.annualRate);
      animate(els.monthly, 0, fmt2);
    } else {
      els.warn.style.display = 'none';
      animate(els.monthly, result.monthly, fmt2);
    }

    animate(els.contributed, result.totalContributed, fmt);
    animate(els.interest,    result.interestEarned,    fmt);
    els.reached.textContent = reachedDate(inputs.years);

    buildChart(result);
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
    els.goal.value = DEFAULTS.goal;
    els.current.value = DEFAULTS.current;
    els.years.value = DEFAULTS.years;
    els.yearsNumber.value = DEFAULTS.years;
    els.yearsValue.textContent = DEFAULTS.years;
    els.rate.value = DEFAULTS.rate;
    els.rateNumber.value = DEFAULTS.rate;
    els.rateValue.textContent = DEFAULTS.rate;
    recalc();
  }

  function init() {
    els.goal.addEventListener('input', recalc);
    els.current.addEventListener('input', recalc);
    bindPair(els.years, els.yearsNumber, els.yearsValue);
    bindPair(els.rate, els.rateNumber, els.rateValue);
    els.resetBtn.addEventListener('click', reset);
    document.addEventListener('themechange', () => { if (chart) recalc(); });
    recalc();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
