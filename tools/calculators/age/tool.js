/**
 * EcrioX Exact Age & Birthday Calculator
 * Accurate chronological calculation including leap years and calendar variations.
 */

(function () {
  'use strict';

  const dtBirth = document.getElementById('dtBirth');
  const dtTarget = document.getElementById('dtTarget');
  const btnCalculateAge = document.getElementById('btnCalculateAge');

  const lblAgeYMD = document.getElementById('lblAgeYMD');
  const lblNextBday = document.getElementById('lblNextBday');
  const lblTotalMonths = document.getElementById('lblTotalMonths');
  const lblTotalWeeks = document.getElementById('lblTotalWeeks');
  const lblTotalDays = document.getElementById('lblTotalDays');
  const lblTotalHours = document.getElementById('lblTotalHours');

  // Set default target date to today
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  if (!dtTarget.value) {
    dtTarget.value = todayStr;
  }

  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function calculate() {
    if (!dtBirth.value || !dtTarget.value) return;

    const [bYear, bMonth, bDay] = dtBirth.value.split('-').map(Number);
    const [tYear, tMonth, tDay] = dtTarget.value.split('-').map(Number);

    const birthDate = new Date(bYear, bMonth - 1, bDay);
    const targetDate = new Date(tYear, tMonth - 1, tDay);

    if (birthDate > targetDate) {
      lblAgeYMD.textContent = 'Birth date is in the future!';
      lblNextBday.textContent = '--';
      lblTotalMonths.textContent = '0';
      lblTotalWeeks.textContent = '0';
      lblTotalDays.textContent = '0';
      lblTotalHours.textContent = '0';
      return;
    }

    // Chronological YMD
    let years = tYear - bYear;
    let months = tMonth - bMonth;
    let days = tDay - bDay;

    if (days < 0) {
      months--;
      // Days in previous month
      const prevMonth = (tMonth - 2 + 12) % 12;
      const prevMonthYear = prevMonth === 11 ? tYear - 1 : tYear;
      days += daysInMonth(prevMonthYear, prevMonth);
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    lblAgeYMD.textContent = `${years} year${years === 1 ? '' : 's'}, ${months} month${months === 1 ? '' : 's'}, ${days} day${days === 1 ? '' : 's'}`;

    // Total Epoch Units
    const diffMs = targetDate - birthDate;
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonthsCalc = years * 12 + months;
    const totalHours = totalDays * 24;

    lblTotalMonths.textContent = totalMonthsCalc.toLocaleString();
    lblTotalWeeks.textContent = totalWeeks.toLocaleString();
    lblTotalDays.textContent = totalDays.toLocaleString();
    lblTotalHours.textContent = totalHours.toLocaleString();

    // Next Birthday
    let nextBdayYear = tYear;
    let nextBday = new Date(nextBdayYear, bMonth - 1, bDay);
    if (nextBday < targetDate) {
      nextBdayYear++;
      nextBday = new Date(nextBdayYear, bMonth - 1, bDay);
    }

    const daysUntilBday = Math.ceil((nextBday - targetDate) / (1000 * 60 * 60 * 24));
    const weekdayName = nextBday.toLocaleDateString('en-US', { weekday: 'long' });

    if (daysUntilBday === 0) {
      lblNextBday.textContent = '🎉 Happy Birthday Today!';
    } else {
      lblNextBday.textContent = `In ${daysUntilBday} day${daysUntilBday === 1 ? '' : 's'} (on a ${weekdayName})`;
    }
  }

  // Listeners
  dtBirth.addEventListener('change', calculate);
  dtTarget.addEventListener('change', calculate);
  if (btnCalculateAge) btnCalculateAge.addEventListener('click', calculate);

  // Initial calculation
  calculate();
})();
