// time.js - pure, dependency-free time math for the new-tab countdown page.
// No DOM, no storage. Everything here is unit-testable with plain Node.

/**
 * Parse a value into a Date in the user's LOCAL timezone.
 * Accepts:
 *   - "2026-08-15T17:00"        (from <input type="datetime-local">) -> local
 *   - "2026-08-15T17:00:30.500" (with seconds/ms)                    -> local
 *   - "2026-08-15"              (date only)                          -> local midnight
 *   - a number (epoch ms) or an existing Date
 * Returns a Date, or null if unparseable.
 *
 * Note: we intentionally do NOT use `new Date("2026-08-15")` for date-only
 * strings, because the spec parses bare date-only ISO strings as UTC, which
 * shifts the day for users west of GMT. We always want "the time the user typed,
 * in their own clock."
 */
export function parseLocal(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) return isNaN(value) ? null : value;
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d) ? null : d;
  }
  const s = String(value).trim();

  // datetime-local / full local timestamp without an explicit zone.
  const m = s.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/
  );
  if (m) {
    const [, y, mo, d, hh = '0', mm = '0', ss = '0', frac = '0'] = m;
    const ms = Number((frac + '000').slice(0, 3));
    const date = new Date(
      Number(y), Number(mo) - 1, Number(d),
      Number(hh), Number(mm), Number(ss), ms
    );
    if (isNaN(date)) return null;
    // Reject out-of-range components (e.g. "2026-13-40") that JS would
    // silently roll over into a different, wrong day.
    if (date.getFullYear() !== Number(y) || date.getMonth() !== Number(mo) - 1
        || date.getDate() !== Number(d)) return null;
    return date;
  }

  // Fallback: let the engine try (handles ISO strings with explicit zones).
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

/**
 * Break a non-negative duration in ms into d/h/m/s/ms parts.
 * Days are not rolled up into larger units here - the caller decides
 * whether to show "423 days" or convert. We expose total* as well so a
 * compact row can choose its own largest unit.
 */
export function splitDuration(totalMs) {
  const sign = totalMs < 0 ? -1 : 1;
  let t = Math.abs(Math.trunc(totalMs));
  const ms = t % 1000; t = Math.floor(t / 1000);
  const seconds = t % 60; t = Math.floor(t / 60);
  const minutes = t % 60; t = Math.floor(t / 60);
  const hours = t % 24; t = Math.floor(t / 24);
  const days = t;
  return {
    sign, days, hours, minutes, seconds, ms,
    totalSeconds: Math.floor(Math.abs(totalMs) / 1000),
    totalDays: Math.floor(Math.abs(totalMs) / 86400000),
  };
}

/**
 * Time remaining until `target` from `now`.
 * Returns { overdue, ...splitDuration } where `overdue` is true once the
 * deadline has passed (the parts then describe how long ago it was).
 */
export function countdown(target, now = new Date()) {
  const t = parseLocal(target);
  if (!t) return null;
  const diff = t.getTime() - now.getTime();
  return { overdue: diff < 0, targetMs: t.getTime(), ...splitDuration(diff) };
}

/**
 * Countdown expressed as fractional DAYS (the reference look: "14.391769 days").
 * Returns { overdue, whole, fraction } where `fraction` is the part of the day
 * remaining as a 0..1 float. The caller formats the digits.
 */
export function daysCountdown(target, now = new Date()) {
  const t = parseLocal(target);
  if (!t) return null;
  const ms = t.getTime() - now.getTime();
  const abs = Math.abs(ms) / 86400000;
  const whole = Math.floor(abs);
  return { overdue: ms < 0, whole, fraction: abs - whole, totalDays: abs };
}

/** Format a 0..1 fraction into `digits` zero-padded decimal digits ("391769"). */
export function fractionDigits(fraction, digits = 6) {
  const scaled = Math.floor(fraction * Math.pow(10, digits));
  return String(scaled).padStart(digits, '0');
}

/**
 * Calendar-accurate age from a birth date.
 * Returns full years + the remainder broken into days/h/m/s/ms, plus a
 * smooth decimalYears value for an optional "20.31 years" readout.
 *
 * Method: find the most recent birthday on/before `now`, count whole years to
 * it, then the remainder is simply (now - thatBirthday). This is leap-year and
 * month-length accurate without any 365.25 fudge factor.
 */
export function age(birth, now = new Date()) {
  const b = parseLocal(birth);
  if (!b) return null;
  if (now.getTime() < b.getTime()) {
    // Not born yet (future DOB) - count down to birth instead.
    return { unborn: true, ...splitDuration(b.getTime() - now.getTime()) };
  }

  let years = now.getFullYear() - b.getFullYear();
  // Build this year's birthday at the same clock time as the birth moment.
  const birthdayThisCycle = new Date(
    b.getFullYear() + years, b.getMonth(), b.getDate(),
    b.getHours(), b.getMinutes(), b.getSeconds(), b.getMilliseconds()
  );
  if (birthdayThisCycle.getTime() > now.getTime()) {
    years -= 1;
  }
  const lastBirthday = new Date(
    b.getFullYear() + years, b.getMonth(), b.getDate(),
    b.getHours(), b.getMinutes(), b.getSeconds(), b.getMilliseconds()
  );
  const remainderMs = now.getTime() - lastBirthday.getTime();

  // Decimal years: years + (elapsed this cycle / length of this cycle).
  const nextBirthday = new Date(
    b.getFullYear() + years + 1, b.getMonth(), b.getDate(),
    b.getHours(), b.getMinutes(), b.getSeconds(), b.getMilliseconds()
  );
  const cycleMs = nextBirthday.getTime() - lastBirthday.getTime();
  const decimalYears = years + remainderMs / cycleMs;

  return {
    unborn: false,
    years,
    decimalYears,
    totalDaysLived: Math.floor((now.getTime() - b.getTime()) / 86400000),
    ...splitDuration(remainderMs),
  };
}

/** Zero-pad a number to `width` digits. */
export function pad(n, width = 2) {
  return String(Math.abs(n)).padStart(width, '0');
}

/**
 * Format a countdown/age split into display fields. `showMs` toggles the
 * millisecond field. Returns strings already zero-padded for tabular display.
 */
export function formatParts(split, { showMs = true } = {}) {
  return {
    days: String(split.days),
    hours: pad(split.hours),
    minutes: pad(split.minutes),
    seconds: pad(split.seconds),
    ms: pad(split.ms, 3),
    clock: `${pad(split.hours)}:${pad(split.minutes)}:${pad(split.seconds)}`,
    clockMs: `${pad(split.hours)}:${pad(split.minutes)}:${pad(split.seconds)}.${pad(split.ms, 3)}`,
  };
}
