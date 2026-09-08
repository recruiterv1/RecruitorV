// Experience is stored as a display string on the position ("5-8 years"), but it
// has been written 224 different ways across 592 live positions — "8-12 Yrs",
// "5 to 8 Yrs", "3 - 12", "5.5 - 8 Yrs", "6 month to 3 Yrs". A fixed dropdown of
// twelve ranges matched only 62 of them, which is why picking 3-8 or 9-14 was
// impossible.
//
// These helpers read any of those spellings back into {min,max} so the pickers
// can show an existing value, and write one canonical string back out.

const CANON = (min, max) => {
  if (max === null) return `${min}+ years`;
  // A position asking for exactly N years reads as "10 years", not "10-10 years".
  if (Number(max) === Number(min)) return `${min} ${Number(min) === 1 ? 'year' : 'years'}`;
  return `${min}-${max} years`;
};

// Months → years, so "6 month to 3 Yrs" lands on 0 rather than 6.
const monthsToYears = (n) => Math.round((n / 12) * 10) / 10;

export function parseExperience(raw) {
  const s = String(raw || '').trim();
  if (!s) return { min: '', max: '', ok: true, empty: true };

  const lower = s.toLowerCase();

  // "6 month to 3 Yrs" / "6 Month - 2 Yrs"
  const mMonth = lower.match(/(\d+(?:\.\d+)?)\s*month[s]?\s*(?:to|[-–—])\s*(\d+(?:\.\d+)?)/);
  if (mMonth) {
    return { min: monthsToYears(parseFloat(mMonth[1])), max: parseFloat(mMonth[2]), ok: true };
  }

  // Open-ended: "20+ years", "7+ years", "3 yrs+", "10+ yrs", "7 plus years"
  const mPlus = lower.match(/(\d+(?:\.\d+)?)\s*(?:\+|plus\b)/) || lower.match(/(\d+(?:\.\d+)?)\s*(?:yrs?|years?)\s*\+/);
  if (mPlus) return { min: parseFloat(mPlus[1]), max: null, ok: true };

  // A range: two numbers separated by -, –, —, or "to". Tolerates units and
  // spaces on either side ("5years - 6years", "8 – 15 Years in Wealth ...").
  const mRange = lower.match(
    /(\d+(?:\.\d+)?)\s*(?:yrs?|years?)?\s*(?:[-–—]|\bto\b)\s*(\d+(?:\.\d+)?)/
  );
  if (mRange) {
    const a = parseFloat(mRange[1]), b = parseFloat(mRange[2]);
    if (b >= a) return { min: a, max: b, ok: true };
  }

  // A single number: "5", "10 years", "4yrs", "Minimum 6 Years in Banking"
  const mOne = lower.match(/(\d+(?:\.\d+)?)/);
  if (mOne) {
    const n = parseFloat(mOne[1]);
    // "minimum N" is a floor, not an exact figure.
    if (/\bmin(?:imum)?\b|\bat least\b/.test(lower)) return { min: n, max: null, ok: true };
    return { min: n, max: n, ok: true };
  }

  return { min: '', max: '', ok: false };   // no numbers at all — keep verbatim
}

export function formatExperience(min, max) {
  if (min === '' || min === null || min === undefined) return '';
  const lo = Number(min);
  if (max === null || max === '' || max === undefined) return CANON(lo, null);
  return CANON(lo, Number(max));
}

export const EXPERIENCE_YEAR_OPTIONS = Array.from({ length: 41 }, (_, i) => i);
