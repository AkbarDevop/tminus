import { parseLocal, splitDuration, countdown, age, formatParts, pad, daysCountdown, fractionDigits } from './time.js';

let pass = 0, fail = 0;
const eq = (got, want, msg) => {
  const a = JSON.stringify(got), b = JSON.stringify(want);
  if (a === b) { pass++; }
  else { fail++; console.error(`FAIL ${msg}\n  got:  ${a}\n  want: ${b}`); };
};
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.error(`FAIL ${msg}`); } };

// --- parseLocal: datetime-local is LOCAL, not UTC ---
const dt = parseLocal('2026-08-15T17:00');
eq([dt.getFullYear(), dt.getMonth(), dt.getDate(), dt.getHours(), dt.getMinutes()],
   [2026, 7, 15, 17, 0], 'datetime-local parses as local wall-clock');

// date-only must be local midnight (not UTC-shifted to previous day)
const d0 = parseLocal('2026-08-15');
eq([d0.getHours(), d0.getMinutes(), d0.getSeconds()], [0, 0, 0], 'date-only -> local midnight');
eq(d0.getDate(), 15, 'date-only keeps the typed day regardless of timezone');

// with seconds + ms
const dms = parseLocal('2026-01-02T03:04:05.250');
eq([dms.getSeconds(), dms.getMilliseconds()], [5, 250], 'parses seconds + ms');

eq(parseLocal(''), null, 'empty -> null');
eq(parseLocal('not a date'), null, 'garbage -> null');
eq(parseLocal('2026-13-40'), null, 'impossible date -> null (no silent rollover)');
eq(parseLocal('2026-02-30'), null, 'Feb 30 -> null');
ok(parseLocal('2004-02-29') !== null, 'real leap day 2004-02-29 is valid');
eq(parseLocal('2026-02-29'), null, 'Feb 29 in a common year -> null');
ok(parseLocal(1700000000000) instanceof Date, 'epoch number -> Date');

// --- splitDuration ---
eq(splitDuration(0), { sign: 1, days: 0, hours: 0, minutes: 0, seconds: 0, ms: 0, totalSeconds: 0, totalDays: 0 }, 'zero');
const oneDayPlus = splitDuration(86400000 + 3600000 + 61000 + 7); // 1d 1h 1m 1s 7ms
eq([oneDayPlus.days, oneDayPlus.hours, oneDayPlus.minutes, oneDayPlus.seconds, oneDayPlus.ms],
   [1, 1, 1, 1, 7], '1d1h1m1s7ms split');

// --- countdown: future and overdue ---
const now = new Date(2026, 0, 1, 12, 0, 0, 0);
const cFut = countdown('2026-01-01T12:00:10.000', now);
eq([cFut.overdue, cFut.seconds, cFut.ms], [false, 10, 0], 'countdown 10s out');
const cPast = countdown('2026-01-01T11:59:55.000', now);
eq([cPast.overdue, cPast.seconds], [true, 5], 'overdue shows elapsed magnitude');

// --- age: simple ---
const a1 = age('2005-03-14T00:00:00', new Date(2026, 2, 14, 0, 0, 0, 0)); // exactly 21st birthday
eq([a1.years, a1.days, a1.hours, a1.minutes, a1.seconds], [21, 0, 0, 0, 0], 'exact birthday -> n years, 0 remainder');

// day before 21st birthday -> still 20
const a2 = age('2005-03-14', new Date(2026, 2, 13, 12, 0, 0, 0));
eq(a2.years, 20, 'day before birthday is still 20');

// --- age: leap-day birthday (Feb 29) ---
// Born 2004-02-29. On 2026-02-28 they have NOT had their 2026 "birthday" yet
// (Feb 29 doesn't exist in 2026 -> JS rolls to Mar 1), so age should be 21.
const leap = age('2004-02-29', new Date(2026, 1, 28, 12, 0, 0, 0)); // Feb 28, 2026
eq(leap.years, 21, 'leap-day baby: 21 on 2026-02-28 (next bday rolls to Mar 1)');
const leap2 = age('2004-02-29', new Date(2026, 2, 1, 12, 0, 0, 0)); // Mar 1, 2026
eq(leap2.years, 22, 'leap-day baby: turns 22 once Mar 1 arrives in non-leap year');

// decimalYears is monotonic-ish and sane
const a3 = age('2000-01-01T00:00:00', new Date(2026, 0, 1, 0, 0, 0, 0));
ok(Math.abs(a3.decimalYears - 26) < 1e-6, `decimalYears ~26 (got ${a3.decimalYears})`);
const a4 = age('2000-01-01T00:00:00', new Date(2026, 6, 2, 0, 0, 0, 0)); // ~half a year in
ok(a4.decimalYears > 26.4 && a4.decimalYears < 26.6, `mid-year decimalYears ~26.5 (got ${a4.decimalYears})`);

// future DOB
const a5 = age('2099-01-01', new Date(2026, 0, 1, 0, 0, 0, 0));
ok(a5.unborn === true, 'future DOB -> unborn flag');

// totalDaysLived sanity
ok(a3.totalDaysLived >= 26 * 365 && a3.totalDaysLived <= 26 * 366, `~26y of days (got ${a3.totalDaysLived})`);

// --- formatting ---
eq(pad(7), '07', 'pad 2');
eq(pad(7, 3), '007', 'pad 3');
const f = formatParts(splitDuration(86400000 + 3600000 * 2 + 60000 * 3 + 4000 + 56), { showMs: true });
eq([f.days, f.clockMs], ['1', '02:03:04.056'], 'formatParts clockMs');

// --- daysCountdown + fractionDigits (the reference "14.391769 days") ---
const dcNow = new Date(2026, 0, 1, 0, 0, 0, 0);
// exactly 14.5 days out
const dc = daysCountdown(new Date(dcNow.getTime() + 14.5 * 86400000), dcNow);
eq([dc.overdue, dc.whole], [false, 14], 'daysCountdown whole part');
ok(Math.abs(dc.fraction - 0.5) < 1e-9, `daysCountdown fraction ~0.5 (got ${dc.fraction})`);
eq(fractionDigits(0.5, 6), '500000', 'fractionDigits 0.5 -> 500000');
eq(fractionDigits(0.391769, 6), '391769', 'fractionDigits 0.391769 -> 391769');
eq(fractionDigits(0.5, 3), '500', 'fractionDigits 3 digits');
const dcPast = daysCountdown(new Date(dcNow.getTime() - 2.25 * 86400000), dcNow);
eq([dcPast.overdue, dcPast.whole], [true, 2], 'overdue daysCountdown whole part');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
