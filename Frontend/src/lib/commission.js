// Formats a position's commission value according to its type: a fixed
// rupee amount ('fixed') or a percentage ('percentage').
//
// Legacy positions were created before commission_type existed, so the type is
// often missing. Those fall back to percentage — EXCEPT when the value is
// clearly not a percentage: commission can never exceed 100%, so anything above
// that is a rupee amount (e.g. a legacy fixed 40000 was rendering as "40000%").
export function formatCommission(value, type) {
  if (value === undefined || value === null || value === '') return '';
  const num = Number(value);
  const isFixed = type === 'fixed' || (!type && Number.isFinite(num) && num > 100);
  return isFixed
    ? `₹${Number.isFinite(num) ? num.toLocaleString('en-IN') : value}`
    : `${value}%`;
}
