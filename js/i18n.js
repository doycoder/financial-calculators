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

  // English is the source of truth. Other locales fall back to en via t().
  // Phase A covers shared chrome (nav, footer, cookie banner, common buttons).
  // Page-specific keys (hero copy, calculator labels, blog content) get added in Phase B.
  const TRANSLATIONS = {
    en: {
      brand: 'FinancialCalc',
      nav: {
        home: 'Home',
        calculators: 'Calculators',
        blog: 'Blog',
        about: 'About',
        primaryAria: 'Primary',
        toggleMenuAria: 'Toggle menu',
        themeToggleAria: 'Toggle dark mode',
        languageAria: 'Select language',
        brandAria: 'Compound Interest Calculator home',
        items: {
          compound: 'Compound Interest',
          compoundDesc: 'Investment growth with SIP',
          simple: 'Simple Interest',
          simpleDesc: 'Flat-rate interest math',
          loan: 'Loan / Mortgage',
          loanDesc: 'Monthly payment & schedule',
          savings: 'Savings Goal',
          savingsDesc: 'Plan to hit a target',
          all: 'All calculators →',
          allDesc: 'Browse the full toolkit',
        },
      },
      footer: {
        ariaLabel: 'Footer',
        note: 'For educational purposes only. Not financial advice.',
        calculators: 'Calculators',
        blog: 'Blog',
        about: 'About',
        privacy: 'Privacy',
        terms: 'Terms',
        disclaimer: 'Disclaimer',
        contact: 'Contact',
      },
      cookie: {
        ariaLabel: 'Cookie consent',
        title: 'We value your privacy.',
        body: 'We use cookies to remember your preferences and, with your consent, to measure traffic and serve relevant ads.',
        policyPrefix: 'See our',
        policyLink: 'Privacy Policy',
        policySuffix: 'for details.',
        reject: 'Reject',
        accept: 'Accept',
      },
      buttons: {
        reset: 'Reset',
        share: 'Share',
        export: 'Export Chart',
      },
      toast: {
        copied: 'Link copied to clipboard',
        exported: 'Chart exported',
        reset: 'Reset to defaults',
      },

      // Share modal — appears on all 4 calculator pages.
      share: {
        title: 'Share your projection',
        sub: 'Anyone with this link will see the same calculation.',
        urlAria: 'Share URL',
        copy: 'Copy',
        closeAria: 'Close',
        twitterAria: 'Share on X / Twitter',
        linkedinAria: 'Share on LinkedIn',
        facebookAria: 'Share on Facebook',
      },

      pages: {
        home: {
          docTitle: 'Compound Interest Calculator - Calculate Investment Growth & Returns',
          hero: {
            h1: 'Compound Interest Calculator',
            lede: 'Calculate your investment growth, SIP returns, and annual returns online. Free, instant, and accurate.',
          },
          input: {
            cardTitle: 'Your Investment',
            principal: 'Initial Investment',
            rate: 'Annual Interest Rate',
            years: 'Investment Years',
            yearsBadge: 'yrs',
            frequency: 'Compound Frequency',
            freqAnnually: 'Annually',
            freqMonthly: 'Monthly',
            freqDaily: 'Daily',
            contribution: 'Monthly Contribution',
          },
          results: {
            cardTitle: 'Projected Results',
            finalValue: 'Final Value',
            totalContrib: 'Total Contributions',
            totalInterest: 'Total Interest',
            annualReturn: 'Annualized Return',
            chartAria: 'Investment growth chart',
            legendContrib: 'Contributions',
            legendInterest: 'Interest Earned',
          },
          prose: {
            h2: 'Understanding Compound Interest: The Engine of Long-Term Wealth',
            p1: 'Compound interest is one of the most powerful concepts in personal finance. Unlike simple interest, which is calculated only on your original principal, compound interest is calculated on both the principal <em>and</em> the accumulated interest from previous periods. This creates an exponential growth curve that turns modest savings into substantial wealth, given enough time. Albert Einstein is often (apocryphally) quoted as calling it the "eighth wonder of the world." Whether or not he said it, the math behind compounding is undeniably remarkable.',
            h3What: 'What Is Compound Interest?',
            pWhat: 'In plain terms, compound interest is interest earned on interest. Imagine you deposit $1,000 at a 10% annual rate. After year one you have $1,100. In year two, you earn 10% not just on the original $1,000 but on the full $1,100, giving you $1,210. By year ten, that same deposit grows to roughly $2,594 without any additional contributions. The longer your money is invested, the more dramatic the effect becomes.',
            h3How: 'How to Calculate Compound Interest',
            pHowIntro: 'The standard compound interest formula is:',
            pHowFormula: 'A = P (1 + r/n)<sup>nt</sup>',
            liA: '<strong>A</strong> — the future value of the investment',
            liP: '<strong>P</strong> — the initial principal',
            liR: '<strong>r</strong> — the annual interest rate (as a decimal)',
            liN: '<strong>n</strong> — the number of compounding periods per year',
            liT: '<strong>t</strong> — the number of years',
            pHowOutro: 'If you also make regular monthly contributions (a Systematic Investment Plan, or SIP), each contribution earns compound interest for the remaining time it stays invested. This calculator combines both formulas: it grows your initial principal while adding each monthly contribution and compounding the running balance at your chosen frequency.',
            h3Why: 'Why Compound Interest Matters',
            pWhy: 'Compounding rewards patience. Two investors who save the same total amount can end up with wildly different outcomes depending solely on when they started. Consider Alice and Bob: Alice invests $200 a month from age 25 to 35 and then stops, contributing a total of $24,000. Bob invests the same $200 a month from age 35 to 65, contributing $72,000 across thirty years. At a 7% annual return, Alice ends up with more money at age 65 than Bob, despite contributing one third of what he did. The reason is simple: Alice\'s money had ten extra years to compound.',
            h3Dca: 'The Power of Dollar-Cost Averaging',
            pDca: 'Dollar-cost averaging (DCA) is the practice of investing a fixed amount on a regular schedule, regardless of market conditions. When prices are high you buy fewer shares; when prices are low you buy more. Over time this smooths out volatility and removes the emotional pressure of trying to time the market. SIP investing is dollar-cost averaging in action, and combined with compound growth, it is one of the most reliable wealth-building strategies available to ordinary investors.',
            h3Example: 'A Real-World Example',
            pExample: 'Suppose you start with $10,000, contribute $500 every month, and earn an average annual return of 7% compounded monthly for 20 years. Your total contributions add up to $130,000, but the calculator will show that your final balance grows to roughly $300,000. That extra $170,000 is pure compound interest, money you did not have to earn at a job. Stretch the timeline to 30 years and the same plan grows past $660,000. This is why financial advisors stress starting early, even with small amounts.',
            h3Tips: 'Tips to Make Compounding Work for You',
            tipStart: '<strong>Start now.</strong> Time matters more than the amount. A small contribution today beats a large one tomorrow.',
            tipConsistent: '<strong>Stay consistent.</strong> Automate monthly contributions so investing happens without willpower.',
            tipReinvest: '<strong>Reinvest dividends.</strong> Letting earnings compound is what creates the exponential curve.',
            tipFees: '<strong>Mind the fees.</strong> A 1% expense ratio sounds small, but over 30 years it can erode a quarter of your returns.',
            tipIncrease: '<strong>Increase contributions over time.</strong> Raise your monthly amount as your income grows to accelerate the curve.',
          },
          faq: {
            title: 'Frequently Asked Questions',
            q1: 'What is compound interest?',
            a1: 'Compound interest is the interest you earn on both your original principal and the interest that has already accumulated. Over long periods, it produces exponential rather than linear growth.',
            q2: 'How much will my investment grow?',
            a2: 'Enter your initial investment, expected annual return, time horizon, compounding frequency, and monthly contribution above. The calculator updates instantly with the projected final value, total contributions, total interest, and annualized return.',
            q3: 'What is a good annual return?',
            a3: 'Historically, the U.S. stock market has averaged around 7 to 10 percent per year after inflation. Bonds typically return 3 to 5 percent. A reasonable assumption for long-term equity investing is 7 percent, but always tailor it to your risk tolerance and asset mix.',
            q4: 'How does compounding frequency affect my returns?',
            a4: 'The more often interest is compounded, the faster your money grows, because earnings start earning their own returns sooner. Daily compounding produces slightly higher results than monthly, which beats annual compounding, though the difference is usually a fraction of a percent.',
            q5: 'What is a SIP and how is it calculated?',
            a5: 'A Systematic Investment Plan (SIP) is a fixed monthly contribution to an investment account. Each contribution earns compound interest for the remaining time it stays invested. This calculator factors in both your lump-sum principal and your recurring SIP automatically.',
            q6: 'Does this calculator account for taxes or inflation?',
            a6: 'No. The results are gross, pre-tax, and not adjusted for inflation. To estimate real returns, subtract your expected inflation rate (often 2 to 3 percent) from the annual rate before calculating.',
          },
        },

        calculators: {
          docTitle: 'Free Financial Calculators - Compound Interest, Loan, Savings & More',
          h1: 'Free Financial Calculators',
          lede: 'A growing collection of accurate, no-signup calculators that run entirely in your browser. Pick the one that fits your question.',
          tiles: {
            compoundTitle: 'Compound Interest Calculator',
            compoundDesc: 'Project investment growth with an initial deposit, monthly contributions (SIP), and adjustable compounding frequency. Includes interactive chart and shareable results.',
            simpleTitle: 'Simple Interest Calculator',
            simpleDesc: 'Calculate interest using the classic <code>I = P × r × t</code> formula. Useful for short-term loans, T-bills, and bonds where interest doesn\'t compound.',
            loanTitle: 'Loan / Mortgage Calculator',
            loanDesc: 'Find your monthly payment, total interest paid, and full amortization schedule for any fixed-rate loan or mortgage. See exactly where each dollar goes.',
            savingsTitle: 'Savings Goal Calculator',
            savingsDesc: 'You have a target — how much do you need to save each month to hit it? Solve for monthly contribution given goal, time horizon, and expected return.',
            cta: 'Open calculator →',
          },
          choose: {
            h2: 'How to choose the right calculator',
            p1: 'If you\'re saving or investing money <strong>and earning interest on top of interest</strong>, use the <a href="index.html">Compound Interest Calculator</a>. This is the right tool for retirement accounts, index funds, dividend reinvestment, or any long-term savings plan.',
            p2: 'If interest is paid out instead of being added back to the principal — for example a short-term bond, certificate of deposit with simple-interest terms, or a friendly personal loan — use the <a href="simple-interest-calculator.html">Simple Interest Calculator</a>.',
            p3: 'If you\'re <strong>borrowing</strong> money instead of investing it, use the <a href="loan-calculator.html">Loan Calculator</a>. It produces the standard monthly payment and a full amortization table showing how much of each payment is interest versus principal.',
            p4: 'If you have a fixed dollar target (a down payment, an emergency fund, your child\'s college) and want to <strong>back-solve</strong> for the monthly contribution that gets you there, use the <a href="savings-goal-calculator.html">Savings Goal Calculator</a>.',
          },
          coming: {
            h2: 'What\'s coming next',
            p: 'We\'re working on a retirement calculator, an inflation-adjusted return calculator, and an ROI calculator. Check back, or <a href="contact.html">drop us a line</a> if you have a specific request.',
          },
        },

        loan: {
          docTitle: 'Loan & Mortgage Calculator - Monthly Payment & Amortization',
          hero: {
            h1: 'Loan & Mortgage Calculator',
            lede: 'Find your monthly payment, total interest, and full amortization schedule for any fixed-rate loan.',
          },
          input: {
            cardTitle: 'Loan Details',
            amount: 'Loan Amount',
            rate: 'Annual Interest Rate',
            years: 'Loan Term',
            yearsBadge: 'yrs',
            viewSchedule: 'View Schedule',
            hideSchedule: 'Hide Schedule',
          },
          results: {
            cardTitle: 'Your Payment',
            monthly: 'Monthly Payment',
            totalPaid: 'Total Paid',
            totalInterest: 'Total Interest',
            payoff: 'Payoff Date',
            chartAria: 'Loan balance over time',
            legendBalance: 'Remaining Balance',
            legendInterest: 'Cumulative Interest',
          },
          table: {
            title: 'Amortization Schedule',
            sub: 'Showing one row per year. Each row is the year-end snapshot.',
            year: 'Year',
            principal: 'Principal Paid',
            interest: 'Interest Paid',
            total: 'Total Paid',
            balance: 'Balance',
          },
          prose: {
            h2: 'How to Use a Loan Calculator',
            pIntro: 'Borrowing money is one of the largest financial commitments most people ever make. Whether it\'s a mortgage, auto loan, or personal loan, the math behind your monthly payment is the same: a single fixed-rate formula stretches the principal over many months, with interest accruing on whatever balance remains. This calculator does that math instantly so you can compare loan offers, plan a budget, and see the full lifetime cost before signing anything.',
            h3Formula: 'The Loan Payment Formula',
            pFormulaIntro: 'The standard fixed-rate (fully amortizing) loan payment is:',
            pFormula: 'M = P × i (1 + i)<sup>n</sup> / ((1 + i)<sup>n</sup> − 1)',
            liM: '<strong>M</strong> — your monthly payment',
            liP: '<strong>P</strong> — the loan amount (principal)',
            liI: '<strong>i</strong> — monthly interest rate (annual rate divided by 12)',
            liN: '<strong>n</strong> — total number of monthly payments (loan years × 12)',
            pFormulaOutro: 'The formula produces a payment that exactly pays off the loan over the term. The first payment is mostly interest because interest is charged on the (high) remaining balance; the final payment is mostly principal because the balance is nearly zero.',
            h3Wasted: 'Why Early Payments Look "Wasted"',
            pWasted: 'One of the most common surprises for new homeowners is opening their first mortgage statement and seeing how little of the payment went to principal. On a 30-year mortgage at 6.5%, the very first payment is roughly 87% interest and 13% principal. By year 15 it\'s about 50/50. Only in the final years does the principal portion dominate. This is unavoidable arithmetic, not a trick — interest is charged on whatever balance is outstanding, and early on the balance is high.',
            h3Levers: 'Three Levers to Reduce Total Interest',
            pLeversIntro: 'Once you\'ve used the calculator to see how much interest a loan will cost, you have three reliable ways to reduce that number:',
            liShorten: '<strong>Shorten the term.</strong> A 15-year mortgage costs more per month but saves enormous amounts of interest. On $300,000 at 6.5%, the 30-year option costs about $382,633 in interest. The 15-year option at the same rate costs just $170,367 — less than half.',
            liLower: '<strong>Lower the rate.</strong> Refinance when rates drop. Even a 1% reduction on a $300,000, 30-year mortgage saves roughly $70,000 over the life of the loan.',
            liExtra: '<strong>Make extra principal payments.</strong> Adding even an extra $200/month doesn\'t change your scheduled payment but shortens the loan and saves substantial interest. The amortization schedule above shows year-end balances — extra payments would compress the table.',
            h3Piti: 'Mortgages: What\'s Not Included Here',
            pPitiIntro: 'This calculator computes principal and interest (P&amp;I) only. A real mortgage payment, especially in the United States, often includes additional escrowed items abbreviated as PITI:',
            liPitiP: '<strong>P</strong> — principal',
            liPitiI: '<strong>I</strong> — interest',
            liPitiT: '<strong>T</strong> — property taxes (typically 0.5%–2.5% of home value annually, varies by state)',
            liPitiI2: '<strong>I</strong> — homeowners insurance (typically $1,000–$3,000/year)',
            liPitiPmi: 'Plus PMI (if down payment &lt; 20%) and HOA fees if applicable',
            pPitiOutro: 'For a quick estimate, add roughly 25%–35% to the P&amp;I shown above to approximate your total monthly housing cost. For a precise figure, get a Loan Estimate from your lender.',
            h3Reading: 'Reading the Amortization Table',
            pReading: 'Click <strong>View Schedule</strong> to see year-by-year breakdown. Each row shows how much principal and interest you paid that year, the cumulative total, and your remaining balance at year-end. The columns help answer questions like: "How much equity will I have in 10 years?" (Loan amount minus the year-10 balance.) Or: "What if I sell after year 7?" (Same principle: subtract the year-7 balance from the loan amount to see how much you\'ve paid down.)',
          },
          faq: {
            title: 'Frequently Asked Questions',
            q1: 'How is a monthly loan payment calculated?',
            a1: 'Using the fixed-rate amortization formula <code>M = P × i (1 + i)<sup>n</sup> / ((1 + i)<sup>n</sup> − 1)</code>, where <code>i</code> is the monthly rate and <code>n</code> is the total number of payments. The result is a payment that fully amortizes the loan over the term.',
            q2: 'What is amortization?',
            a2: 'Amortization is the gradual paydown of a loan through scheduled payments. Each payment is split between interest (charged on the remaining balance) and principal (which reduces the balance). Early payments are mostly interest; later payments are mostly principal.',
            q3: 'Why do early loan payments go mostly to interest?',
            a3: 'Because interest is charged on the outstanding balance. When the balance is at its highest — at the start — most of your fixed payment is consumed by interest, leaving little to chip away at principal.',
            q4: 'How can I save interest over the life of a mortgage?',
            a4: 'Pick a shorter term, refinance to a lower rate when possible, or make extra principal payments. Any of the three reduces the total interest paid significantly.',
            q5: 'Does this include taxes, insurance, and PMI?',
            a5: 'No. The calculator returns principal and interest only. Add property taxes, homeowners insurance, PMI (if applicable), and HOA fees separately to estimate your total monthly housing cost.',
          },
        },

        savings: {
          docTitle: 'Savings Goal Calculator - How Much to Save Per Month',
          hero: {
            h1: 'Savings Goal Calculator',
            lede: 'How much do you need to save each month to hit your target? Enter your goal — we\'ll do the math.',
          },
          input: {
            cardTitle: 'Your Goal',
            goal: 'Savings Goal',
            current: 'Current Savings',
            years: 'Time Horizon',
            yearsBadge: 'yrs',
            rate: 'Expected Annual Return',
          },
          results: {
            cardTitle: 'Your Plan',
            monthly: 'Save Per Month',
            contributed: 'Total Contributed',
            interest: 'Interest Earned',
            reached: 'Goal Reached',
            chartAria: 'Savings progress chart',
            legendContrib: 'Total Contributions',
            legendBalance: 'Account Balance',
            warnTemplate: 'Good news — your existing savings of {current} would already grow to about {projected} over {years} years at {rate}%. No additional contributions needed.',
          },
          prose: {
            h2: 'How a Savings Goal Calculator Works',
            pIntro: 'Most online savings calculators ask "how much will I have?" — this one inverts the question and answers "how much should I save?" That\'s the more practical question for almost everyone. You know roughly when you want the money (a down payment in 5 years, college in 18 years, retirement in 30) and you know roughly how much you need. The unknown is the monthly contribution. This tool solves for it instantly.',
            h3Math: 'The Math Behind It',
            pMath1: 'Saving toward a goal combines two streams of growth. First, your <strong>existing balance</strong> compounds on its own:',
            pFormula1: 'FV<sub>existing</sub> = P × (1 + i)<sup>n</sup>',
            pMath2: 'Second, each <strong>monthly contribution</strong> earns compound interest for the months remaining. Adding them up gives the future value of an annuity:',
            pFormula2: 'FV<sub>contributions</sub> = M × ((1 + i)<sup>n</sup> − 1) / i',
            pMath3: 'Setting the sum equal to your goal and solving for M (monthly contribution):',
            pFormula3: 'M = (Goal − P(1 + i)<sup>n</sup>) × i / ((1 + i)<sup>n</sup> − 1)',
            pMathOutro: 'Where <code>i</code> is the monthly rate (annual ÷ 12) and <code>n</code> is total months. The calculator does this in milliseconds for any combination of inputs.',
            h3Rate: 'Choosing a Realistic Return Rate',
            pRateIntro: 'The expected return assumption is the single biggest lever in this calculation, so it\'s worth thinking about carefully. Some sensible defaults for 2025:',
            liRateShort: '<strong>1–3 years (short-term goals):</strong> Use a high-yield savings account or T-bill rate, currently around 4–5%. Don\'t put short-term money in stocks.',
            liRateMid: '<strong>3–10 years (medium-term goals):</strong> A balanced portfolio of stocks and bonds typically targets 5–7%. The shorter the horizon, the more conservative you should be.',
            liRateLong: '<strong>10+ years (long-term goals):</strong> A diversified stock portfolio has historically returned 7–10% annually before inflation. Many planners use 7% as a "safe" long-term assumption.',
            pRateOutro: 'If in doubt, model it twice — once with an optimistic rate and once with a conservative one — and aim for the higher monthly contribution. Saving more than necessary is a much better failure mode than coming up short.',
            h3Examples: 'Practical Examples',
            pEx1: '<strong>Down payment in 5 years.</strong> You want $50,000 for a house, you have $5,000 saved, and you\'ll keep it in a 4% high-yield savings account. The calculator shows you\'ll need to save about $677 per month. Total contributions: $40,620. Interest: $4,300.',
            pEx2: '<strong>Emergency fund in 2 years.</strong> Target $15,000 starting from zero, in a 4.5% account. Required monthly contribution: about $599. Most of your $15,000 is principal, with only $623 from interest — that\'s normal for short horizons.',
            pEx3: '<strong>College in 18 years.</strong> You want $100,000 for a child\'s education, starting with $2,000 in a 529 plan invested at 6%. Required monthly contribution: about $233. Of the $100,000 you\'ll end up with, you\'ll have contributed only $52,300 — interest does almost half the work.',
            h3High: 'What If the Required Amount Is Too High?',
            pHighIntro: 'If the calculator demands more than you can realistically save, you have four levers to pull:',
            liLower: '<strong>Lower the goal.</strong> Maybe you need a $30,000 down payment instead of $50,000.',
            liExtend: '<strong>Extend the timeline.</strong> Going from 5 years to 7 years can dramatically reduce the monthly burden, both because the goal is spread across more payments and because compound growth gets more time to work.',
            liIncrease: '<strong>Increase the assumed return.</strong> Only do this if it matches your actual investment plan. Dialing the rate up on a calculator without changing your portfolio doesn\'t change your actual outcome.',
            liUpfront: '<strong>Save more upfront.</strong> If you can put a windfall (bonus, tax refund) into the "current savings" field, the required monthly drops noticeably.',
            h3Tip: 'Tip: Start with Whatever You Can',
            pTip: 'If the required monthly amount feels impossible, save what you can right now anyway. Even $50/month builds the habit, the dollars start compounding, and the goal feels less abstract. You can ratchet up the contribution as your income grows or expenses shrink. Compound interest is patient; the only mistake is not starting.',
          },
          faq: {
            title: 'Frequently Asked Questions',
            q1: 'How is the required monthly savings calculated?',
            a1: 'We solve the future-value-of-an-annuity formula for the monthly payment: <code>M = (Goal − P(1+i)<sup>n</sup>) × i / ((1+i)<sup>n</sup> − 1)</code>. This produces the contribution that reaches your goal exactly on schedule.',
            q2: 'What rate of return should I assume?',
            a2: 'For short-term cash goals, use a high-yield savings rate (~4%). For long-term stock investing, 7% is a common conservative assumption. Don\'t assume returns higher than what your actual portfolio can plausibly deliver.',
            q3: 'What if I already have some money saved?',
            a3: 'Enter the amount in "Current Savings". The calculator subtracts its projected future value from your goal and solves for the contribution needed to fill the gap.',
            q4: 'Does this account for inflation?',
            a4: 'No, results are in nominal dollars. To target real purchasing power, either inflate your goal upward (multiply by 1.03 per year) or use a real, inflation-adjusted return rate (try 4–5% instead of 7%).',
            q5: 'Can I use this for any goal?',
            a5: 'Yes — emergency funds, down payments, college, weddings, sabbatical, retirement supplements. Anywhere you have a fixed dollar target and a timeline, this is the right tool.',
          },
        },

        simple: {
          docTitle: 'Simple Interest Calculator - Calculate Flat-Rate Interest Online',
          hero: {
            h1: 'Simple Interest Calculator',
            lede: 'Compute flat-rate interest using the classic <code>I = P × r × t</code> formula. Instant, accurate, and free.',
          },
          input: {
            cardTitle: 'Your Inputs',
            principal: 'Principal Amount',
            rate: 'Annual Interest Rate',
            years: 'Time Period',
            yearsBadge: 'yrs',
          },
          results: {
            cardTitle: 'Results',
            total: 'Total Amount',
            principal: 'Principal',
            interest: 'Interest Earned',
            effective: 'Effective Annual',
            chartAria: 'Simple interest growth chart',
            legendPrincipal: 'Principal',
            legendInterest: 'Interest',
          },
          prose: {
            h2: 'Understanding Simple Interest',
            pIntro: 'Simple interest is the most basic form of interest. It\'s computed only on the original principal — never on accumulated interest — which makes it predictable, easy to calculate, and very different in long-term outcome from compound interest. Whenever you see a flat percentage attached to a loan or fixed-income product, there\'s a good chance simple interest is at work.',
            h3Formula: 'The Simple Interest Formula',
            pFormulaIntro: 'The formula is short and memorable:',
            pFormula: 'I = P × r × t',
            liI: '<strong>I</strong> — interest earned (or owed)',
            liP: '<strong>P</strong> — principal (the starting amount)',
            liR: '<strong>r</strong> — annual interest rate, as a decimal (so 6% becomes 0.06)',
            liT: '<strong>t</strong> — time in years',
            pFormulaOutro: 'The total amount you\'ll have at the end of the term is simply <code>A = P + I = P(1 + rt)</code>.',
            h3Example: 'A Worked Example',
            pExample1: 'Suppose you lend a friend $5,000 for 3 years at a flat annual rate of 6%. Plugging into the formula:',
            pExampleFormula: 'I = 5000 × 0.06 × 3 = $900',
            pExample2: 'Your friend pays you back $5,000 (the principal) plus $900 in interest, for a total of $5,900. The interest is the same in year 1, year 2, and year 3 — that\'s the defining feature of simple interest.',
            h3Where: 'Where Simple Interest Shows Up',
            pWhereIntro: 'Despite the name, simple interest isn\'t always the more common choice. You\'ll typically encounter it in:',
            liShortLoans: '<strong>Short-term personal loans</strong> — peer lending and informal arrangements often use simple interest because it\'s easy to compute and verify.',
            liAuto: '<strong>Auto loans (in some jurisdictions)</strong> — many car loans technically use simple interest with a daily accrual, though the practical effect resembles a simplified amortization schedule.',
            liTbills: '<strong>Treasury bills and short-dated bonds</strong> — most discount instruments quote yields using simple interest because the holding period is under a year.',
            liCds: '<strong>Some certificates of deposit</strong> — CDs that pay out interest periodically (rather than reinvesting) are effectively simple interest from the depositor\'s perspective.',
            h3VsCompound: 'Simple vs. Compound: Why It Matters',
            pVsIntro: 'Over a single year there\'s no difference between simple and compound interest. The gap appears as time stretches out. At 8% per year on $10,000:',
            li5y: 'After <strong>5 years</strong>: simple = $14,000, compound = $14,693 (gap = $693)',
            li15y: 'After <strong>15 years</strong>: simple = $22,000, compound = $31,722 (gap = $9,722)',
            li30y: 'After <strong>30 years</strong>: simple = $34,000, compound = $100,627 (gap = $66,627)',
            pVsOutro: 'This is why long-term savers always prefer compound interest, and why borrowers should be cautious about long-dated compound-interest debt. For a side-by-side, see our <a href="blog/simple-vs-compound-interest.html">simple vs. compound interest deep-dive</a>.',
            h3Tips: 'Tips for Using This Calculator',
            liTipPct: 'Enter the rate as a percentage (e.g. 6 for 6%), not a decimal — the calculator does the conversion.',
            liTipFraction: 'For sub-year periods, use a fractional year. 6 months is 0.5, 90 days is roughly 0.247.',
            liTipEff: 'The "Effective Annual" output shows what equivalent compound rate would have produced the same total — useful for comparing simple-interest products against compound-interest alternatives.',
          },
          faq: {
            title: 'Frequently Asked Questions',
            q1: 'What is simple interest?',
            a1: 'Simple interest is interest calculated only on the original principal. It does not earn interest on its own. The formula is <code>I = P × r × t</code>.',
            q2: 'When is simple interest used?',
            a2: 'It\'s common for short-term loans, Treasury bills, some auto loans, and informal personal loans. Most savings products and long-term investments use compound interest instead.',
            q3: 'What is the difference between simple and compound interest?',
            a3: 'Simple interest grows linearly. Compound interest grows exponentially because previously earned interest is reinvested and itself earns interest. Over decades the gap between the two becomes enormous.',
            q4: 'How do I calculate simple interest manually?',
            a4: 'Multiply principal × annual rate (as a decimal) × years. For example, $5,000 × 0.06 × 3 = $900 of interest.',
            q5: 'Can I use this for monthly or daily interest?',
            a5: 'Yes — convert your time period to years. Six months is 0.5; 90 days is ~0.247. The annual rate stays as you\'d quote it.',
          },
        },
		
		roi: {
          docTitle: 'Simple Interest Calculator - Calculate Flat-Rate Interest Online',
          hero: {
            h1: 'Simple Interest Calculator',
            lede: 'Compute flat-rate interest using the classic <code>I = P × r × t</code> formula. Instant, accurate, and free.',
          },
          input: {
            cardTitle: 'Your Inputs',
            principal: 'Principal Amount',
			finalVal: 'finalVal',
            //rate: 'Annual Interest Rate',
            years: 'Time Period',
            yearsBadge: 'yrs',
          },
          results: {
            cardTitle: 'Results',
            //total: 'Total Amount',
            //principal: 'Principal',
            interest: 'Interest Earned',
            effective: 'Effective Annual',
            chartAria: 'Simple interest growth chart',
            legendPrincipal: 'Principal',
            legendInterest: 'Interest',
          },
          prose: {
            h2: 'Understanding Simple Interest',
            pIntro: 'Simple interest is the most basic form of interest. It\'s computed only on the original principal — never on accumulated interest — which makes it predictable, easy to calculate, and very different in long-term outcome from compound interest. Whenever you see a flat percentage attached to a loan or fixed-income product, there\'s a good chance simple interest is at work.',
            h3Formula: 'The Simple Interest Formula',
            pFormulaIntro: 'The formula is short and memorable:',
            pFormula: 'I = P × r × t',
            liI: '<strong>I</strong> — interest earned (or owed)',
            liP: '<strong>P</strong> — principal (the starting amount)',
            liR: '<strong>r</strong> — annual interest rate, as a decimal (so 6% becomes 0.06)',
            liT: '<strong>t</strong> — time in years',
            pFormulaOutro: 'The total amount you\'ll have at the end of the term is simply <code>A = P + I = P(1 + rt)</code>.',
            h3Example: 'A Worked Example',
            pExample1: 'Suppose you lend a friend $5,000 for 3 years at a flat annual rate of 6%. Plugging into the formula:',
            pExampleFormula: 'I = 5000 × 0.06 × 3 = $900',
            pExample2: 'Your friend pays you back $5,000 (the principal) plus $900 in interest, for a total of $5,900. The interest is the same in year 1, year 2, and year 3 — that\'s the defining feature of simple interest.',
            h3Where: 'Where Simple Interest Shows Up',
            pWhereIntro: 'Despite the name, simple interest isn\'t always the more common choice. You\'ll typically encounter it in:',
            liShortLoans: '<strong>Short-term personal loans</strong> — peer lending and informal arrangements often use simple interest because it\'s easy to compute and verify.',
            liAuto: '<strong>Auto loans (in some jurisdictions)</strong> — many car loans technically use simple interest with a daily accrual, though the practical effect resembles a simplified amortization schedule.',
            liTbills: '<strong>Treasury bills and short-dated bonds</strong> — most discount instruments quote yields using simple interest because the holding period is under a year.',
            liCds: '<strong>Some certificates of deposit</strong> — CDs that pay out interest periodically (rather than reinvesting) are effectively simple interest from the depositor\'s perspective.',
            h3VsCompound: 'Simple vs. Compound: Why It Matters',
            pVsIntro: 'Over a single year there\'s no difference between simple and compound interest. The gap appears as time stretches out. At 8% per year on $10,000:',
            li5y: 'After <strong>5 years</strong>: simple = $14,000, compound = $14,693 (gap = $693)',
            li15y: 'After <strong>15 years</strong>: simple = $22,000, compound = $31,722 (gap = $9,722)',
            li30y: 'After <strong>30 years</strong>: simple = $34,000, compound = $100,627 (gap = $66,627)',
            pVsOutro: 'This is why long-term savers always prefer compound interest, and why borrowers should be cautious about long-dated compound-interest debt. For a side-by-side, see our <a href="blog/simple-vs-compound-interest.html">simple vs. compound interest deep-dive</a>.',
            h3Tips: 'Tips for Using This Calculator',
            liTipPct: 'Enter the rate as a percentage (e.g. 6 for 6%), not a decimal — the calculator does the conversion.',
            liTipFraction: 'For sub-year periods, use a fractional year. 6 months is 0.5, 90 days is roughly 0.247.',
            liTipEff: 'The "Effective Annual" output shows what equivalent compound rate would have produced the same total — useful for comparing simple-interest products against compound-interest alternatives.',
          },
          faq: {
            title: 'Frequently Asked Questions',
            q1: 'What is simple interest?',
            a1: 'Simple interest is interest calculated only on the original principal. It does not earn interest on its own. The formula is <code>I = P × r × t</code>.',
            q2: 'When is simple interest used?',
            a2: 'It\'s common for short-term loans, Treasury bills, some auto loans, and informal personal loans. Most savings products and long-term investments use compound interest instead.',
            q3: 'What is the difference between simple and compound interest?',
            a3: 'Simple interest grows linearly. Compound interest grows exponentially because previously earned interest is reinvested and itself earns interest. Over decades the gap between the two becomes enormous.',
            q4: 'How do I calculate simple interest manually?',
            a4: 'Multiply principal × annual rate (as a decimal) × years. For example, $5,000 × 0.06 × 3 = $900 of interest.',
            q5: 'Can I use this for monthly or daily interest?',
            a5: 'Yes — convert your time period to years. Six months is 0.5; 90 days is ~0.247. The annual rate stays as you\'d quote it.',
          },
        },

        blogIndex: {
          docTitle: 'Blog - Personal Finance & Compound Interest Insights',
          h1: 'The Blog',
          lede: 'Practical writing on compound interest, debt, and long-term planning. Each post includes worked examples and links to the relevant calculator.',
          posts: {
            rule72Meta: 'Math · 6 min read',
            rule72Title: 'The Rule of 72: How to Estimate Compound Growth in Your Head',
            rule72Desc: 'A 300-year-old approximation that lets you mentally compute how long it takes money to double at any rate. Surprisingly accurate up to about 20%.',
            simpleVsCompoundMeta: 'Concepts · 8 min read',
            simpleVsCompoundTitle: 'Simple vs. Compound Interest: The Gap That Builds (or Drains) Wealth',
            simpleVsCompoundDesc: 'The difference looks tiny at first and then becomes enormous. A side-by-side walk-through with worked numbers and where each type shows up in real products.',
            cta: 'Read post →',
          },
          coming: {
            h2: 'What\'s coming',
            p: 'We\'re working on more posts: how to retire by 50 starting at 30, why a 1% mortgage rate cut is worth more than you think, the math of dollar-cost averaging in volatile markets, and a deep dive on real (inflation-adjusted) returns. <a href="contact.html">Tell us what to write next.</a>',
          },
        },

        about: {
          docTitle: 'About - Compound Interest Calculator',
          h1: 'About CompoundCalc',
          pIntro: 'CompoundCalc is a free, no-signup tool built to help anyone visualize how compound interest and regular contributions transform modest savings into long-term wealth. We built it because most online calculators are either too simplistic to be useful or so cluttered with ads they obscure the math underneath.',
          h3Does: 'What this tool does',
          liDoesLump: 'Models lump-sum investments and recurring monthly contributions (SIP)',
          liDoesFreq: 'Supports annual, monthly, and daily compounding',
          liDoesViz: 'Visualizes the contribution-vs-interest split with an interactive chart',
          liDoesShare: 'Lets you share configurations via URL and export the chart as PNG',
          h3DoesNot: 'What this tool does not do',
          pDoesNot: 'It does not adjust for taxes, inflation, fees, or variable returns. Real markets fluctuate; this calculator assumes a constant annual rate so you can reason about the underlying mechanics. Nothing here constitutes financial advice — please consult a qualified advisor before making investment decisions.',
          h3Math: 'How the math works',
          pMath: 'The calculator simulates growth month-by-month. Each month the monthly contribution is added to the running balance, then the balance is compounded at the rate corresponding to your chosen frequency. The closed-form formula <code>A = P(1 + r/n)<sup>nt</sup></code> covers the lump-sum case; the simulation generalizes it to handle ongoing contributions correctly.',
          h3Privacy: 'Privacy',
          pPrivacy: 'All calculations happen in your browser. No data is sent to a server. Theme preference is stored locally so the app remembers your choice between visits.',
          back: '← Back to the calculator',
        },

        contact: {
          docTitle: 'Contact - Compound Interest Calculator',
          h1: 'Contact',
          updated: 'We\'d love to hear from you.',
          intro: 'Whether you\'ve found a bug, have feedback on the calculator, want to suggest a new feature, or have a partnership inquiry, the fastest way to reach us is by email.',
          general: {
            h3: 'General inquiries & support',
            email: 'Email:',
          },
          privacy: {
            h3: 'Privacy & data requests',
            body: 'For questions about our <a href="privacy.html">Privacy Policy</a>, GDPR / CCPA requests, or to exercise your data rights:',
            email: 'Email:',
          },
          partnerships: {
            h3: 'Advertising & partnerships',
            email: 'Email:',
          },
          response: {
            h2: 'Response Time',
            p: 'We aim to respond within 2 business days. For privacy requests subject to statutory deadlines (e.g. GDPR\'s 30-day window), we\'ll always meet the legal requirement.',
          },
          before: {
            h2: 'Before You Email',
            p: 'Common questions are already answered in the <a href="index.html#faq-title">FAQ section</a> at the bottom of the calculator page. Please skim it first — it\'ll often save you a wait.',
          },
        },

        privacy: {
          docTitle: 'Privacy Policy - Compound Interest Calculator',
          h1: 'Privacy Policy',
          updated: 'Last updated: 2026-05-23',
          intro: 'This Privacy Policy explains how CompoundCalc ("we", "us", "our") collects, uses, and shares information when you visit our website at <strong>fncalcs.com</strong> ("the Site"). By using the Site you agree to the practices described here.',
          h2Collect: '1. Information We Collect',
          h3Provide: '1.1 Information you provide',
          pProvide: 'The calculator runs entirely in your browser. The numbers you enter (initial investment, rate, years, contribution) are <strong>never transmitted to our servers</strong>. They live in the browser\'s memory and disappear when you close the tab. If you choose to share a link generated by the "Share" button, those values are encoded into the URL you share.',
          h3Auto: '1.2 Automatically collected information',
          pAutoIntro: 'When you visit the Site, our hosting provider and analytics tools may automatically collect:',
          liAutoIp: 'Your IP address (truncated where possible)',
          liAutoBrowser: 'Browser type, operating system, and device category',
          liAutoPages: 'The pages you visit and the time spent on each page',
          liAutoRef: 'Referring URL (the site you came from)',
          h3Cookies: '1.3 Cookies and local storage',
          pCookiesIntro: 'We use the following:',
          liCookiesNec: '<strong>Strictly necessary local storage</strong> — to remember your dark / light theme preference and your cookie consent choice. This works without your consent because it is essential to the Site\'s basic function.',
          liCookiesAna: '<strong>Analytics cookies</strong> — only loaded if you click "Accept" on the cookie banner. We use these to understand aggregate traffic patterns. Data is anonymized.',
          liCookiesAds: '<strong>Advertising cookies</strong> — if and when we display ads (for example via Google AdSense), Google and its partners may set cookies to serve relevant ads and measure performance. These only load after you accept on the banner.',
          pCookiesOutro: 'You can withdraw consent at any time by clearing your browser\'s local storage for this Site, which will cause the consent banner to reappear.',
          h2Use: '2. How We Use Information',
          liUseOp: 'To operate and maintain the Site',
          liUseImprove: 'To understand how visitors use the Site so we can improve it',
          liUseTech: 'To detect, prevent, and address technical issues or abuse',
          liUseAds: 'To serve advertisements (only with your consent)',
          liUseLegal: 'To comply with legal obligations',
          h2Third: '3. Third-Party Services',
          pThird: 'We rely on the following third parties; please review their privacy policies:',
          liThirdHost: '<strong>Hosting provider</strong> — serves the static files. Receives standard server logs.',
          liThirdGa: '<strong>Google Analytics</strong> (with consent) — usage analytics. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy Policy</a>',
          liThirdAds: '<strong>Google AdSense</strong> (with consent, when ads are enabled) — Google and its partners may use cookies to serve ads based on your visits to this and other websites. You can opt out of personalized advertising at <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">Google Ads Settings</a> or via <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener">aboutads.info</a> (US) and <a href="https://www.youronlinechoices.com/" target="_blank" rel="noopener">youronlinechoices.com</a> (EU).',
          liThirdChart: '<strong>Chart.js CDN (jsDelivr)</strong> — serves the charting library. May log standard CDN access information.',
          h2Rights: '4. Your Rights',
          pRights: 'Depending on your jurisdiction (GDPR for the EU/UK, CCPA for California, and similar laws elsewhere) you may have the right to:',
          liRightsAccess: 'Access the personal information we hold about you',
          liRightsCorrect: 'Request correction or deletion',
          liRightsObject: 'Object to or restrict certain processing',
          liRightsConsent: 'Withdraw consent at any time',
          liRightsComplaint: 'Lodge a complaint with your local data protection authority',
          pRightsContact: 'To exercise any of these rights, contact us at the address on the <a href="contact.html">Contact</a> page.',
          h2Retention: '5. Data Retention',
          pRetention: 'We retain server log data for up to 30 days for security and debugging. Aggregated, anonymized analytics data may be retained longer. Calculator inputs are never stored on our servers and have no retention period.',
          h2Children: '6. Children\'s Privacy',
          pChildren: 'The Site is not directed to children under 13 (or under 16 in the EU). We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will delete it.',
          h2Intl: '7. International Transfers',
          pIntl: 'Our hosting and analytics providers may process data in countries outside your own, including the United States. Where required, we rely on standard contractual clauses or equivalent safeguards.',
          h2Changes: '8. Changes to This Policy',
          pChanges: 'We may update this Privacy Policy from time to time. The "Last updated" date at the top of this page reflects the most recent revision. Material changes will be highlighted on the Site.',
          h2Contact: '9. Contact',
          pContact: 'Questions about this Privacy Policy? See the <a href="contact.html">Contact</a> page.',
        },

        terms: {
          docTitle: 'Terms of Service - Compound Interest Calculator',
          h1: 'Terms of Service',
          updated: 'Last updated: 2026-05-23',
          intro: 'These Terms of Service ("Terms") govern your access to and use of the CompoundCalc website at <strong>fncalcs.com</strong> ("the Site"). By using the Site, you agree to these Terms. If you do not agree, please do not use the Site.',
          h2Service: '1. The Service',
          pService: 'The Site provides a free online compound interest calculator and related educational content. All calculations are performed in your browser. We do not collect, transmit, or store the financial figures you enter.',
          h2Advice: '2. No Financial Advice',
          pAdvice1: 'The Site is for <strong>educational and informational purposes only</strong>. Nothing on the Site constitutes financial, investment, tax, legal, or accounting advice. The calculator\'s results are projections based on assumptions you provide and do not guarantee any actual outcome. See our <a href="disclaimer.html">Disclaimer</a> for full details.',
          pAdvice2: 'Always consult a qualified, licensed professional before making financial decisions.',
          h2Use: '3. Acceptable Use',
          pUseIntro: 'You agree not to:',
          liUseLawful: 'Use the Site in any unlawful manner or for any unlawful purpose',
          liUseAccess: 'Attempt to gain unauthorized access to any portion of the Site or its servers',
          liUseInterf: 'Interfere with or disrupt the integrity or performance of the Site',
          liUseScrape: 'Scrape, mirror, or systematically reproduce content without written permission',
          liUseBots: 'Use automated tools (bots, crawlers) in a way that places undue load on the Site',
          liUseRev: 'Reverse-engineer or attempt to extract source code beyond what is publicly served',
          h2Ip: '4. Intellectual Property',
          pIp1: 'All Site content (including text, graphics, logos, code, and the calculator implementation) is the property of CompoundCalc or its licensors and is protected by copyright and other intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to access and use the Site for personal, non-commercial purposes.',
          pIp2: 'Open-source libraries used on the Site (such as Chart.js) are licensed under their own terms.',
          h2ThirdLinks: '5. Third-Party Links and Services',
          pThirdLinks: 'The Site may contain links to third-party websites or services. We do not control these and are not responsible for their content, privacy practices, or availability. Your interactions with third parties are solely between you and them.',
          h2Ads: '6. Advertising',
          pAds: 'The Site may display advertisements provided by third-party networks (e.g., Google AdSense). We do not endorse advertised products or services and are not responsible for any transactions you enter into with advertisers.',
          h2Warr: '7. Disclaimer of Warranties',
          pWarr: 'THE SITE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, AND NON-INFRINGEMENT. We do not warrant that the Site will be uninterrupted, error-free, or free from harmful components.',
          h2Liab: '8. Limitation of Liability',
          pLiab: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL COMPOUNDCALC, ITS OPERATORS, OR ITS LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR INVESTMENT VALUE, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SITE. Our total aggregate liability shall not exceed USD 100.',
          h2Indem: '9. Indemnification',
          pIndem: 'You agree to indemnify and hold harmless CompoundCalc and its operators from any claim or demand, including reasonable attorneys\' fees, arising out of your use of the Site or your violation of these Terms.',
          h2Changes: '10. Changes to the Service and Terms',
          pChanges: 'We may modify or discontinue the Site at any time without notice. We may also revise these Terms; the "Last updated" date reflects the most recent change. Continued use of the Site after changes constitutes acceptance of the revised Terms.',
          h2Law: '11. Governing Law',
          pLaw: 'These Terms are governed by the laws applicable to the operator of the Site, without regard to conflict-of-law principles. Disputes shall be resolved in the courts having jurisdiction over the operator\'s location, unless mandatory consumer-protection laws of your country require otherwise.',
          h2Contact: '12. Contact',
          pContact: 'Questions about these Terms? See the <a href="contact.html">Contact</a> page.',
        },

        disclaimer: {
          docTitle: 'Disclaimer - Compound Interest Calculator',
          h1: 'Disclaimer',
          updated: 'Last updated: 2026-05-23',
          h2Edu: '1. Educational Purpose Only',
          pEdu: 'The information, calculator, and content on this Site are provided strictly for <strong>general informational and educational purposes</strong>. They do not constitute, and should not be interpreted as, financial advice, investment advice, tax advice, legal advice, accounting advice, or a recommendation of any kind.',
          h2Sub: '2. Not a Substitute for Professional Advice',
          pSub: 'Personal finance decisions depend on your individual circumstances, including income, expenses, risk tolerance, time horizon, tax situation, and goals. Before making any investment, retirement, or savings decision, please consult a licensed financial advisor, accountant, attorney, or other qualified professional.',
          h2Lim: '3. Calculator Limitations',
          pLimIntro: 'The compound interest calculator is a simplified model. In particular, it:',
          liLimRate: '<strong>Assumes a constant rate of return</strong>. Real markets fluctuate and returns vary widely year to year.',
          liLimInf: '<strong>Does not adjust for inflation</strong>. The "Final Value" is in nominal dollars, not real purchasing power.',
          liLimTax: '<strong>Does not account for taxes</strong>. Capital gains, dividends, and interest income are typically taxable.',
          liLimFee: '<strong>Does not account for fees</strong>. Fund expense ratios, advisory fees, and trading costs reduce real returns.',
          liLimRisk: '<strong>Does not model market risk</strong>. There is no guarantee that any given asset class will deliver the rate of return you input.',
          h2Guar: '4. No Guarantee of Results',
          pGuar: 'Past performance does not guarantee future results. Any historical return figures referenced in our content (for example, the long-run average return of the U.S. stock market) are statistical observations, not predictions. Your actual investment outcomes may be substantially higher or lower than the calculator\'s projections.',
          h2Risk: '5. Investment Risk',
          pRisk: 'All investments carry risk, including the possible loss of principal. Higher-return assets generally carry higher risk. You alone are responsible for evaluating the merits and risks associated with any investment decision.',
          h2Third: '6. Third-Party Content',
          pThird: 'References to third-party financial products, services, or sources are for illustrative purposes only and do not constitute an endorsement. We are not responsible for the accuracy, completeness, or availability of third-party information.',
          h2Liab: '7. Limitation of Liability',
          pLiab: 'To the fullest extent permitted by law, the operators of this Site disclaim all liability for any loss or damage arising from your use of, or reliance on, the calculator or any information presented on the Site. See our <a href="terms.html">Terms of Service</a> for the full liability framework.',
          h2Fid: '8. No Fiduciary Relationship',
          pFid: 'Use of this Site does not create a client, fiduciary, advisory, or professional relationship between you and the operators of CompoundCalc.',
          short: '<strong>In short:</strong> we built a math tool. Use it to learn, sketch scenarios, and make better decisions, but treat the numbers as illustrations rather than promises, and talk to a qualified professional before acting.',
        },

        ruleOf72: {
          docTitle: 'The Rule of 72: How to Estimate Compound Growth in Your Head',
          meta: 'Math · 6 min read · May 23, 2026',
          h1: 'The Rule of 72: How to Estimate Compound Growth in Your Head',
          lede: 'A 300-year-old shortcut that lets you mentally compute how long it takes money to double at any compound interest rate. Surprisingly accurate up to about 20%.',
          pIntro: 'If a friend asks how long it would take their savings to double at 8% per year, you don\'t need a calculator or a spreadsheet. You need one number: <strong>72</strong>. Divide 72 by the rate, and the answer is the doubling time. <em>Nine years.</em> That\'s it. The Rule of 72 is one of those rare pieces of financial folklore that\'s actually useful, technically defensible, and shows up in published mathematical literature dating back to 1494. It deserves a permanent spot in your mental toolkit.',
          h2What: 'What the Rule Says',
          pWhat1: 'The Rule of 72 estimates how many years it takes a compounding investment to double in value:',
          pWhatFormula: 'Doubling years ≈ 72 ÷ rate',
          pWhat2: 'So at 6%, money doubles in about 12 years. At 9%, it doubles in 8 years. At 12%, it doubles in 6 years. The rule also works in reverse: if you know how fast something doubled, you can estimate the rate. A balance that doubled in 10 years grew at roughly 7.2% per year.',
          h2Why: 'Why 72 (and Not Some Other Number)?',
          pWhy1: 'The exact answer comes from the natural logarithm:',
          pWhyFormula: 'Doubling time = ln(2) ÷ ln(1 + r) ≈ 0.693 ÷ r when r is small.',
          pWhy2: 'That gives <strong>69.3</strong>, not 72. So why 72? Two reasons:',
          liWhyDiv: '<strong>72 has many divisors.</strong> It divides cleanly by 2, 3, 4, 6, 8, 9, 12 — exactly the rates you\'re most likely to encounter. 69 only divides cleanly by 3 and 23.',
          liWhyAcc: '<strong>72 is more accurate at common rates.</strong> The pure formula 69.3 is most accurate near 0%. As the rate rises, the cleaner approximation drifts. By a happy accident, 72 happens to be more accurate at the rates people actually use (5–10%).',
          h2Acc: 'How Accurate Is It, Really?',
          pAccIntro: 'Here\'s the rule\'s predictions versus the actual doubling time computed precisely:',
          tableRate: 'Annual rate',
          tableRule: 'Rule of 72',
          tableActual: 'Actual',
          tableError: 'Error',
          pAccOutro: 'Within the 4%–12% range — where most realistic investment rates live — the rule is accurate to within about 1%. That\'s better than the precision of any growth assumption you could plausibly make about the future, so the rule "rounds to truth" for practical purposes.',
          h2Use: 'Five Ways to Use the Rule in Real Life',
          h3Sanity: '1. Sanity-check investment claims',
          pSanity: 'An ad says "double your money in 4 years." Plug in: 72 ÷ 4 = 18% per year. Is that plausible? For an index fund? No. For a single stock or a venture-stage startup? Maybe, with significant risk. The Rule of 72 turns ad copy into a checkable claim.',
          h3Retire: '2. Plan retirement milestones',
          pRetire: 'You\'re 35 with $100,000 saved, expecting 7% returns. Doubling time = 72 ÷ 7 ≈ 10.3 years. So at 45 you\'ll have about $200K, at 55 about $400K, at 65 about $800K — all without any further contributions. That mental staircase is far more useful than staring at an exponential curve.',
          h3Loans: '3. Compare loan offers',
          pLoans: 'A credit card charges 24% APR. Your debt\'s <em>doubling time</em> is 72 ÷ 24 = 3 years. If you don\'t make a real dent, you\'re looking at the balance doubling every 3 years through interest alone. Suddenly the "minimum payment" trap looks much scarier.',
          h3Inflation: '4. Understand inflation',
          pInflation: 'Inflation runs at 3%? Prices double every 24 years. At 6% inflation? Every 12 years. This is why retirees who don\'t hold inflation-protected assets often see purchasing power erode in ways that surprise them.',
          h3Halving: '5. Estimate "halving" too',
          pHalving: 'The same rule works for any exponential process — including decline. A 4% annual decline halves a value in 18 years. Useful when thinking about depreciating assets or the erosion of an over-leveraged portfolio in a downturn.',
          h2Breaks: 'When the Rule Breaks Down',
          pBreaksIntro: 'Three caveats worth knowing:',
          liBreakHigh: '<strong>Above ~20%, accuracy drops.</strong> For very high rates use 76 or 78 instead. (For 25%+, just use the actual formula or a calculator.)',
          liBreakCont: '<strong>Continuous compounding wants 69.3.</strong> If the rate is continuously compounded rather than annual, the cleaner approximation is the right one.',
          liBreakConst: '<strong>It assumes constant rates.</strong> Real markets fluctuate. The rule tells you the doubling time at a constant <em>average</em> return, not at the actual sequence of yearly returns you\'ll experience.',
          h2Try: 'Try It Yourself',
          pTry: 'Pick a rate. Divide 72 by it. That\'s how many years money doubles. Now plug the same numbers into our <a href="../index.html">Compound Interest Calculator</a> to see the actual curve, and notice how close the doubling points come to your mental estimate. That moment of agreement is when the rule clicks — it stops being a memorized shortcut and becomes a way of seeing.',
          ctaTitle: 'See compound growth in action',
          ctaBody: 'Use the calculator to plot your investment curve and verify the Rule of 72 with your own numbers.',
          ctaLink: 'Open the Compound Interest Calculator',
        },

        simpleVsCompound: {
          docTitle: 'Simple vs. Compound Interest: The Gap That Builds (or Drains) Wealth',
          meta: 'Concepts · 8 min read · May 23, 2026',
          h1: 'Simple vs. Compound Interest: The Gap That Builds (or Drains) Wealth',
          lede: 'The two formulas look almost identical at first glance. Over 30 years they produce wildly different outcomes — for savers, for borrowers, and for anyone holding a long-dated bond.',
          pIntro: 'Ask a hundred people the difference between simple and compound interest and ninety will say something true but vague: "compound is better." The interesting story isn\'t that compound interest grows faster. It\'s <em>how much</em> faster, on what timeline, and which financial products use which method. That\'s where the practical money is.',
          h2Formulas: 'The Formulas, Side by Side',
          pFormulas1: 'Both formulas use the same letters: <code>P</code> for principal, <code>r</code> for the annual rate as a decimal, <code>t</code> for time in years.',
          pFormulasSimple: '<strong>Simple interest</strong> charges or pays interest only on the original principal:',
          pFormulaSimple: 'I = P × r × t      A = P × (1 + r × t)',
          pFormulasComp: '<strong>Compound interest</strong> charges or pays interest on the principal <em>plus all previously accumulated interest</em>:',
          pFormulaComp: 'A = P × (1 + r/n)<sup>nt</sup>',
          pFormulasOutro: 'Where <code>n</code> is the number of compounding periods per year. The visible difference is one extra symbol. The functional difference is exponential vs. linear growth.',
          h2Gap: 'The Gap, in Numbers',
          pGapIntro: 'Take $10,000 at 8% per year and follow it through 30 years. Under simple interest you earn $800 every year — that\'s it. Under compound interest, year 1 also earns $800, but year 2 earns 8% of $10,800 instead of $10,000, and the gap widens every year.',
          tableYears: 'Years',
          tableSimple: 'Simple ($800/yr)',
          tableCompound: 'Compound (annual)',
          tableDiff: 'Difference',
          pGapOutro: 'By year 30, the compound version has nearly tripled the simple version. That gap — $66,627 in this example — is paid for by interest reinvesting itself. If you\'ve ever wondered why financial planners obsess over starting early, <em>this is the only reason that actually matters</em>.',
          quote: 'The longer the time horizon, the more the choice between simple and compound interest dominates every other variable, including the rate itself.',
          h2Where: 'Where You Actually See Each One',
          pWhereIntro: 'The two methods aren\'t competitors in the wild — they\'re used by different products. Knowing which is which helps you read the fine print correctly.',
          h3Simple: 'Simple interest shows up in:',
          liSimpleTbills: '<strong>Treasury bills.</strong> A 6-month T-bill quotes a yield computed via simple interest, since the holding period is too short for compounding to matter much.',
          liSimpleAuto: '<strong>Most auto loans.</strong> Many U.S. auto loans use simple interest with daily accrual. The schedule looks like an amortizing loan, but the underlying interest math is simple.',
          liSimpleP2p: '<strong>Personal loans between individuals.</strong> Friend lends friend $5,000 at 5% — almost always simple interest, because compound feels predatory in personal contexts.',
          liSimpleCd: '<strong>Some certificates of deposit (CDs).</strong> CDs that <em>pay out</em> interest periodically (monthly or quarterly) rather than reinvesting it are simple interest from the depositor\'s perspective.',
          h3Compound: 'Compound interest shows up in:',
          liCompSavings: '<strong>Savings accounts.</strong> Almost universally compound, often daily.',
          liCompMortgage: '<strong>Mortgages.</strong> Compounded monthly. This is why the early years of a 30-year mortgage are so brutal — you\'re paying interest on the prior month\'s already-compounded balance.',
          liCompCc: '<strong>Credit cards.</strong> Compounded daily on the average daily balance, which is why credit card debt becomes a death spiral so quickly. A 24% APR compounds to roughly 27% effective annual rate.',
          liCompInv: '<strong>Investment accounts (when reinvested).</strong> Stocks, ETFs, mutual funds, and dividend-reinvested portfolios all behave as compound interest, even though "interest" isn\'t the right word for stock returns.',
          liCompBonds: '<strong>Reinvested-coupon bonds.</strong> The bond itself pays simple coupons; reinvesting them at prevailing rates produces a compound result.',
          h2Sides: 'The Same Math, Different Sides of the Table',
          pSides1: 'Compound interest isn\'t morally good or bad — it\'s just exponential. When you\'re <em>saving</em>, that exponentiality works in your favor and you want as much of it as possible: more frequent compounding, longer time horizons, dividend reinvestment. When you\'re <em>borrowing</em>, the same exponentiality works against you and you want to minimize it: shorter terms, faster payoff, no carrying credit card balances.',
          pSides2: 'This is why two pieces of personal finance advice that sound contradictory are actually the same advice:',
          liSidesAsset: '"Start investing as early as possible." (Maximize compound growth on the asset side.)',
          liSidesLiab: '"Pay off high-interest debt before investing." (Minimize compound growth on the liability side.)',
          pSides3: 'Both are saying: compound interest is enormous over time, so make sure it\'s pointing in the direction you want.',
          h2Eff: 'The Effective Annual Rate Trap',
          pEff1: 'One more wrinkle: when comparing products, always compare effective annual rates (sometimes called APY for savings, APR for loans, but the conventions are inconsistent). A 6% rate compounded monthly is actually a 6.17% effective annual rate. Quoted rates are nominal; what matters is what your balance does in a year.',
          pEff2: 'Example: two CDs both quote 5.0%. CD A compounds monthly. CD B is simple interest with annual payouts. After one year you\'ll have:',
          liEffA: 'CD A (compounded): $10,000 × (1 + 0.05/12)<sup>12</sup> = $10,511.62',
          liEffB: 'CD B (simple): $10,000 × (1 + 0.05) = $10,500',
          pEff3: 'Same headline rate, $11.62 less for CD B. Trivial in one year. Over decades and at higher rates, this kind of detail compounds (literally) into real money.',
          h2Try: 'Try the Numbers Yourself',
          pTryIntro: 'Numbers always land harder when you punch them in. Plug in your own balance, rate, and time horizon to see how the two methods diverge:',
          liTrySimple: 'For simple interest, use our <a href="../simple-interest-calculator.html">Simple Interest Calculator</a>.',
          liTryComp: 'For compound, use our <a href="../index.html">Compound Interest Calculator</a> — it also handles monthly contributions, which is how most real-world investing works.',
          pTryOutro: 'Run the same numbers through both, watch the gap appear, and you\'ll never look at an APR fine print the same way again.',
          ctaTitle: 'Compare for yourself',
          ctaBody: 'Run identical inputs through both calculators and watch the gap open up year by year.',
          ctaLink: 'Browse all calculators',
        },
      },
    },
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

      this.applyTo(document);

      const lang = findLang(locale);
      document.querySelectorAll('[data-lang-current]').forEach((el) => {
        el.textContent = lang.flag + ' ' + lang.label;
      });

      document.querySelectorAll('[data-lang-menu] [data-locale]').forEach((btn) => {
        btn.setAttribute('aria-current', btn.dataset.locale === locale ? 'true' : 'false');
      });
    },

    applyTo(root) {
      if (!root) return;
      const scope = root.querySelectorAll ? root : document;

      scope.querySelectorAll('[data-i18n]').forEach((el) => {
        el.textContent = this.t(el.dataset.i18n);
      });

      // data-i18n-attr="aria-label:keyA;placeholder:keyB;title:keyC"
      scope.querySelectorAll('[data-i18n-attr]').forEach((el) => {
        el.dataset.i18nAttr.split(';').forEach((pair) => {
          const [attr, key] = pair.split(':').map(s => s && s.trim());
          if (attr && key) el.setAttribute(attr, this.t(key));
        });
      });

      // data-i18n-html: allow inline HTML (use sparingly, only for trusted dictionary content)
      scope.querySelectorAll('[data-i18n-html]').forEach((el) => {
        el.innerHTML = this.t(el.dataset.i18nHtml);
      });

      // <html data-i18n-title="pages.home.docTitle"> — sync document.title
      const titleKey = document.documentElement.dataset.i18nTitle;
      if (titleKey) {
        const v = this.t(titleKey);
        if (v && v !== titleKey) document.title = v;
      }
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
