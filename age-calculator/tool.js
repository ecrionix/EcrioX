/**
 * EcrioX - Age Calculator
 * Exact chronological date arithmetic with leap year precision, birthday countdown,
 * life metrics, and multi-person age comparison.
 */
(function() {
  'use strict';

  // Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.getAttribute('data-tab'));
      if (target) target.classList.add('active');
    });
  });

  // Default target date to today
  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];
  const targetDateInput = document.getElementById('target-date');
  const endDateInput = document.getElementById('end-date');
  if (targetDateInput) targetDateInput.value = todayISO;
  if (endDateInput) endDateInput.value = todayISO;

  // Zodiac calculator helper
  function getZodiacSign(month, day) {
    // month is 1-indexed (1 = Jan, 12 = Dec)
    const signs = [
      { name: "Capricorn", endDay: 19 },
      { name: "Aquarius", endDay: 18 },
      { name: "Pisces", endDay: 20 },
      { name: "Aries", endDay: 19 },
      { name: "Taurus", endDay: 20 },
      { name: "Gemini", endDay: 20 },
      { name: "Cancer", endDay: 22 },
      { name: "Leo", endDay: 22 },
      { name: "Virgo", endDay: 22 },
      { name: "Libra", endDay: 22 },
      { name: "Scorpio", endDay: 21 },
      { name: "Sagittarius", endDay: 21 },
      { name: "Capricorn", endDay: 31 }
    ];
    if (day <= signs[month - 1].endDay) {
      return signs[month - 1].name;
    } else {
      return signs[month % 12].name;
    }
  }

  // Days in month helper
  function daysInMonth(year, monthIndex0) {
    return new Date(year, monthIndex0 + 1, 0).getDate();
  }

  // Exact difference between start and end
  function getExactDateDiff(startY, startM, startD, endY, endM, endD) {
    let years = endY - startY;
    let months = endM - startM;
    let days = endD - startD;

    if (days < 0) {
      months--;
      const prevMonth = (endM - 2 + 12) % 12;
      const prevYear = prevMonth === 11 ? endY - 1 : endY;
      days += daysInMonth(prevYear, prevMonth);
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months, days };
  }

  // --- TAB 1: EXACT AGE CALCULATOR ---
  const birthInput = document.getElementById('birth-date');
  const targetInput = document.getElementById('target-date');
  const btnCalcAge = document.getElementById('btn-calc-age');
  const btnResetAge = document.getElementById('btn-reset-age');
  const btnCopyAge = document.getElementById('btn-copy-age');

  const heroAge = document.getElementById('res-hero-age');
  const heroSub = document.getElementById('res-hero-sub');
  const nextBday = document.getElementById('res-next-bday');
  const totalMonths = document.getElementById('res-total-months');
  const totalWeeks = document.getElementById('res-total-weeks');
  const totalDays = document.getElementById('res-total-days');
  const totalHours = document.getElementById('res-total-hours');
  const totalMinutes = document.getElementById('res-total-minutes');

  function calculateAge() {
    if (!birthInput.value || !targetInput.value) return;

    const [bY, bM, bD] = birthInput.value.split('-').map(Number);
    const [tY, tM, tD] = targetInput.value.split('-').map(Number);

    const bDate = new Date(bY, bM - 1, bD);
    const tDate = new Date(tY, tM - 1, tD);

    if (bDate > tDate) {
      heroAge.textContent = 'Invalid Date Range';
      heroSub.textContent = 'Date of birth must be earlier than the target comparison date.';
      nextBday.textContent = '--';
      totalMonths.textContent = '0';
      totalWeeks.textContent = '0';
      totalDays.textContent = '0';
      totalHours.textContent = '0';
      totalMinutes.textContent = '0';
      return;
    }

    const diff = getExactDateDiff(bY, bM, bD, tY, tM, tD);

    const yStr = `${diff.years} year${diff.years === 1 ? '' : 's'}`;
    const mStr = `${diff.months} month${diff.months === 1 ? '' : 's'}`;
    const dStr = `${diff.days} day${diff.days === 1 ? '' : 's'}`;

    heroAge.textContent = `${yStr}, ${mStr}, ${dStr}`;

    const birthDayOfWeek = bDate.toLocaleDateString('en-US', { weekday: 'long' });
    const zodiac = getZodiacSign(bM, bD);
    heroSub.textContent = `Born on a ${birthDayOfWeek} • Zodiac: ${zodiac}`;

    // Total Epoch Units
    const diffMs = tDate - bDate;
    const daysCount = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weeksCount = Math.floor(daysCount / 7);
    const monthsCount = diff.years * 12 + diff.months;
    const hoursCount = daysCount * 24;
    const minutesCount = hoursCount * 60;

    totalMonths.textContent = monthsCount.toLocaleString();
    totalWeeks.textContent = weeksCount.toLocaleString();
    totalDays.textContent = daysCount.toLocaleString();
    totalHours.textContent = hoursCount.toLocaleString();
    totalMinutes.textContent = minutesCount.toLocaleString();

    // Next Birthday calculation
    let nextBdayYear = tY;
    let nextBdayDate = new Date(nextBdayYear, bM - 1, bD);
    if (nextBdayDate < tDate) {
      nextBdayYear++;
      nextBdayDate = new Date(nextBdayYear, bM - 1, bD);
    }

    const bdayDaysRemaining = Math.ceil((nextBdayDate - tDate) / (1000 * 60 * 60 * 24));
    const nextBdayWeekday = nextBdayDate.toLocaleDateString('en-US', { weekday: 'long' });

    if (bdayDaysRemaining === 0) {
      nextBday.textContent = '🎉 Today!';
    } else {
      nextBday.textContent = `${bdayDaysRemaining}d (${nextBdayWeekday})`;
    }
  }

  btnCalcAge.addEventListener('click', calculateAge);
  birthInput.addEventListener('change', calculateAge);
  targetInput.addEventListener('change', calculateAge);

  btnResetAge.addEventListener('click', () => {
    birthInput.value = '2000-01-15';
    targetInput.value = todayISO;
    calculateAge();
  });

  // Copy Summary
  btnCopyAge.addEventListener('click', () => {
    const text = `EcrioX Exact Age Calculation:
----------------------------------------
Date of Birth : ${birthInput.value}
Calculated At : ${targetInput.value}
Exact Age     : ${heroAge.textContent}
Details       : ${heroSub.textContent}
Total Days    : ${totalDays.textContent} days
Total Weeks   : ${totalWeeks.textContent} weeks
Total Months  : ${totalMonths.textContent} months
Next Birthday : ${nextBday.textContent}
----------------------------------------
Calculated on EcrioX (https://ecriox.com/age-calculator/)`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        const orig = btnCopyAge.textContent;
        btnCopyAge.textContent = 'Copied!';
        setTimeout(() => { btnCopyAge.textContent = orig; }, 2000);
      });
    }
  });

  // --- TAB 2: COMPARE TWO AGES ---
  const p1Input = document.getElementById('p1-date');
  const p2Input = document.getElementById('p2-date');
  const btnCompare = document.getElementById('btn-compare-ages');
  const compResultBox = document.getElementById('comp-result');
  const compHeading = document.getElementById('comp-heading');
  const compSummary = document.getElementById('comp-summary');
  const compP1Age = document.getElementById('comp-p1-age');
  const compP2Age = document.getElementById('comp-p2-age');

  function compareAges() {
    if (!p1Input.value || !p2Input.value) return;

    const [y1, m1, d1] = p1Input.value.split('-').map(Number);
    const [y2, m2, d2] = p2Input.value.split('-').map(Number);

    const date1 = new Date(y1, m1 - 1, d1);
    const date2 = new Date(y2, m2 - 1, d2);
    const [nowY, nowM, nowD] = todayISO.split('-').map(Number);

    const age1 = getExactDateDiff(y1, m1, d1, nowY, nowM, nowD);
    const age2 = getExactDateDiff(y2, m2, d2, nowY, nowM, nowD);

    compP1Age.textContent = `${age1.years}y ${age1.months}m ${age1.days}d`;
    compP2Age.textContent = `${age2.years}y ${age2.months}m ${age2.days}d`;

    if (date1.getTime() === date2.getTime()) {
      compHeading.textContent = 'Identical Birthdays!';
      compSummary.textContent = 'Both individuals were born on the exact same date and have the identical age.';
    } else {
      const older = date1 < date2 ? 'Person 1' : 'Person 2';
      const younger = date1 < date2 ? 'Person 2' : 'Person 1';
      const earlierDate = date1 < date2 ? [y1, m1, d1] : [y2, m2, d2];
      const laterDate = date1 < date2 ? [y2, m2, d2] : [y1, m1, d1];

      const diff = getExactDateDiff(earlierDate[0], earlierDate[1], earlierDate[2], laterDate[0], laterDate[1], laterDate[2]);
      const totalGapDays = Math.abs(Math.floor((date2 - date1) / (1000 * 60 * 60 * 24)));

      compHeading.textContent = `${older} is older than ${younger}`;
      compSummary.innerHTML = `<strong>${older}</strong> was born earlier by <strong>${diff.years} years, ${diff.months} months, and ${diff.days} days</strong> (an exact gap of ${totalGapDays.toLocaleString()} days).`;
    }

    compResultBox.style.display = 'block';
  }

  btnCompare.addEventListener('click', compareAges);

  // --- TAB 3: DATE DURATION ---
  const startDateInput = document.getElementById('start-date');
  const btnCalcDiff = document.getElementById('btn-calc-diff');
  const diffResultBox = document.getElementById('diff-result');
  const diffSummary = document.getElementById('diff-summary');
  const diffSub = document.getElementById('diff-sub');

  function calculateDuration() {
    if (!startDateInput.value || !endDateInput.value) return;

    const [sY, sM, sD] = startDateInput.value.split('-').map(Number);
    const [eY, eM, eD] = endDateInput.value.split('-').map(Number);

    const sDate = new Date(sY, sM - 1, sD);
    const eDate = new Date(eY, eM - 1, eD);

    if (sDate > eDate) {
      diffSummary.textContent = 'Start date must be before end date';
      diffSub.textContent = '';
      diffResultBox.style.display = 'block';
      return;
    }

    const diff = getExactDateDiff(sY, sM, sD, eY, eM, eD);
    const totalDays = Math.floor((eDate - sDate) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;

    diffSummary.textContent = `${diff.years} years, ${diff.months} months, ${diff.days} days`;
    diffSub.textContent = `Total duration: ${totalDays.toLocaleString()} days (or ${totalWeeks} weeks and ${remainingDays} days).`;
    diffResultBox.style.display = 'block';
  }

  btnCalcDiff.addEventListener('click', calculateDuration);

  // Initial calculation
  calculateAge();
})();
