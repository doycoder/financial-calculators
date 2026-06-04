/* Loan / Mortgage Calculator — fixed-rate amortization */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const els = {
    amount:        $('ln-amount'),
    rate:          $('ln-rate'),
    rateNumber:    $('ln-rateNumber'),
    rateValue:     $('ln-rateValue'),
    years:         $('ln-years'),
    yearsNumber:   $('ln-yearsNumber'),
    yearsValue:    $('ln-yearsValue'),
    monthly:       $('ln-monthly'),
    totalPaid:     $('ln-totalPaid'),
    totalInterest: $('ln-totalInterest'),
    payoff:        $('ln-payoff'),
    chart:         $('ln-chart'),
    resetBtn:      $('ln-resetBtn'),
    toggleTable:   $('ln-toggleTable'),
    tableWrap:     $('ln-tableWrap'),
    tableBody:     document.querySelector('#ln-table tbody'),
  };

  const DEFAULTS = { amount: 300000, rate: 6.5, years: 30 };
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
      P: Math.max(0, parseFloat(els.amount.value) || 0),
      annualRate: clamp(parseFloat(els.rate.value) || 0, 0, 100),
      years: clamp(parseInt(els.years.value, 10) || 1, 1, 100),
    };
  }

  // Returns full amortization: monthly payment, balance series by month,
  // cumulative interest series, and a year-end summary array.
  function amortize(P, annualRate, years) {
    const i = (annualRate / 100) / 12;
    const n = years * 12;

    let monthly;
    if (i === 0) {
      monthly = P / n;
    } else {
      monthly = P * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    }

    let balance = P;
    let cumInterest = 0;
    const balanceSeries = [balance];
    const interestSeries = [0];
    const yearSummary = [];
    let yearPrincipal = 0;
    let yearInterest = 0;

    for (let m = 1; m <= n; m++) {
      const interest = balance * i;
      const principal = Math.min(balance, monthly - interest);
      balance = Math.max(0, balance - principal);
      cumInterest += interest;
      yearPrincipal += principal;
      yearInterest += interest;

      // Sample balance & cumulative interest yearly for the chart
      if (m % 12 === 0 || m === n) {
        balanceSeries.push(balance);
        interestSeries.push(cumInterest);

        const yearIndex = Math.ceil(m / 12);
        yearSummary.push({
          year: yearIndex,
          principal: yearPrincipal,
          interest: yearInterest,
          totalPaid: yearPrincipal + yearInterest,
          balance,
        });
        yearPrincipal = 0;
        yearInterest = 0;
      }
    }

    return {
      monthly,
      totalPaid: monthly * n,
      totalInterest: cumInterest,
      balanceSeries,
      interestSeries,
      yearSummary,
    };
  }

  function chartColors() {
    const dark = document.documentElement.dataset.theme === 'dark';
    return {
      grid:   dark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.06)',
      tick:   dark ? '#94a3b8' : '#64748b',
      bFill:  dark ? 'rgba(148, 163, 184, 0.20)' : 'rgba(148, 163, 184, 0.30)',
      bLine:  dark ? '#94a3b8' : '#64748b',
      iFill:  'rgba(79, 70, 229, 0.20)',
      iLine:  '#4f46e5',
      bg:     '#0f172a',
      fg:     '#f8fafc',
    };
  }

  function buildChart(result, years) {
    const labels = ['Y0'];
    for (let y = 1; y <= years; y++) labels.push('Y' + y);

    const c = chartColors();
    const data = {
      labels,
      datasets: [
        { label: 'Remaining Balance', data: result.balanceSeries,
          fill: true, backgroundColor: c.bFill, borderColor: c.bLine,
          borderWidth: 2, tension: 0.25, pointRadius: 0, pointHoverRadius: 4 },
        { label: 'Cumulative Interest', data: result.interestSeries,
          fill: true, backgroundColor: c.iFill, borderColor: c.iLine,
          borderWidth: 2.5, tension: 0.25, pointRadius: 0, pointHoverRadius: 4 },
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

  function renderTable(yearSummary) {
    const rows = yearSummary.map(row => `
      <tr>
        <td>${row.year}</td>
        <td style="text-align:right;">${fmt(row.principal)}</td>
        <td style="text-align:right;">${fmt(row.interest)}</td>
        <td style="text-align:right;">${fmt(row.totalPaid)}</td>
        <td style="text-align:right;">${fmt(row.balance)}</td>
      </tr>
    `).join('');
    els.tableBody.innerHTML = rows;
  }

  function payoffDate(years) {
    const d = new Date();
    d.setMonth(d.getMonth() + years * 12);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  function recalc() {
    const { P, annualRate, years } = read();
    const result = amortize(P, annualRate, years);

    animate(els.monthly,       result.monthly,       fmt2);
    animate(els.totalPaid,     result.totalPaid,     fmt);
    animate(els.totalInterest, result.totalInterest, fmt);
    els.payoff.textContent = payoffDate(years);

    buildChart(result, years);
    renderTable(result.yearSummary);
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
    els.amount.value = DEFAULTS.amount;
    els.rate.value = DEFAULTS.rate;
    els.rateNumber.value = DEFAULTS.rate;
    els.rateValue.textContent = DEFAULTS.rate;
    els.years.value = DEFAULTS.years;
    els.yearsNumber.value = DEFAULTS.years;
    els.yearsValue.textContent = DEFAULTS.years;
    recalc();
  }

  function toggleTable() {
    const open = els.tableWrap.style.display !== 'none';
    els.tableWrap.style.display = open ? 'none' : 'block';
    const key = open ? 'pages.loan.input.viewSchedule' : 'pages.loan.input.hideSchedule';
    const fallback = open ? 'View Schedule' : 'Hide Schedule';
    els.toggleTable.textContent = (window.I18n && typeof window.I18n.t === 'function') ? window.I18n.t(key) : fallback;
  }

  function init() {
    els.amount.addEventListener('input', recalc);
    bindPair(els.rate, els.rateNumber, els.rateValue);
    bindPair(els.years, els.yearsNumber, els.yearsValue);
    els.resetBtn.addEventListener('click', reset);
    els.toggleTable.addEventListener('click', toggleTable);
    document.addEventListener('themechange', () => { if (chart) recalc(); });
    recalc();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
