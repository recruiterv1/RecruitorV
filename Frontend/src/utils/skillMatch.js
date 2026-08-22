// Shared skill-category matching.
//
// Positions carry `skill_category` (and often `skill_sub_category`); recruiters,
// coaches and experts carry `skillCategory` (a string or an array). Matching used
// to be exact string equality on the category alone, which quietly produced an
// empty "Skill Fit" for anyone whose profile wording differed even slightly from
// the position's — a Finance recruiter never saw Banking roles, and a Retail
// recruiter never saw a position filed under Sales with a "retail" sub-category.
//
// This module is mirrored in Backend/utils/skillMatch.js — keep the two in
// step.

// Punctuation, connectors and pluralisation are noise, not meaning.
const norm = (v) => String(v || '')
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[/,._-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// Families of names that mean the same line of work in practice. Every member of
// a group matches every other member; anything not listed only matches itself.
const SYNONYM_GROUPS = [
  ['technology', 'tech', 'it', 'information technology', 'software', 'ites', 'engineering and technology'],
  ['banking', 'bfsi', 'finance', 'financial services', 'nbfc', 'fintech', 'capital markets', 'wealth'],
  ['insurance', 'general insurance', 'life insurance'],
  ['sales', 'business development', 'bd', 'inside sales', 'field sales', 'b2b', 'b2c'],
  ['marketing', 'digital marketing', 'brand', 'growth'],
  ['healthcare', 'health care', 'health', 'pharma', 'pharmaceutical', 'medical', 'hospital', 'life sciences'],
  ['media', 'advertising', 'entertainment', 'digital media', 'publishing'],
  ['manufacturing', 'production', 'industrial', 'plant', 'operations and manufacturing'],
  ['automotive', 'auto', 'automobile', 'ev'],
  ['retail', 'ecommerce', 'e commerce', 'fmcg', 'fmcd', 'consumer'],
  ['telecom', 'telecommunications', 'telecommunication'],
  ['education', 'edtech', 'teaching', 'academics', 'training'],
  ['logistics', 'supply chain', 'scm', 'warehousing', 'transportation'],
  ['infrastructure', 'construction', 'real estate', 'epc', 'civil'],
  ['hospitality', 'hotel', 'hotels', 'travel', 'tourism', 'food and beverage'],
  ['hr', 'human resources', 'talent acquisition', 'recruitment', 'staffing'],
  ['legal', 'compliance', 'company secretary'],
  ['energy', 'power', 'oil and gas', 'renewables', 'utilities'],
  ['agriculture', 'agri', 'agritech', 'farming'],
];

// name -> canonical family label
const FAMILY = (() => {
  const m = {};
  SYNONYM_GROUPS.forEach(group => group.forEach(name => { m[norm(name)] = group[0]; }));
  return m;
})();

const familyOf = (v) => {
  const n = norm(v);
  return n ? (FAMILY[n] || n) : '';
};

/**
 * Do two skill names refer to the same line of work?
 * Exact after normalising, same synonym family, or one wholly contains the other
 * as a word ("technology" vs "technology and product").
 */
function namesMatch(a, b) {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (familyOf(x) === familyOf(y)) return true;
  const xw = ` ${x} `, yw = ` ${y} `;
  return xw.includes(` ${y} `) || yw.includes(` ${x} `);
}

/** Normalise a user's skillCategory (string | array | undefined) to a clean list. */
function userSkillList(skillCategory) {
  const raw = Array.isArray(skillCategory) ? skillCategory : (skillCategory ? [skillCategory] : []);
  return [...new Set(raw.map(s => String(s).trim()).filter(Boolean))];
}

/**
 * Does this position suit any of the user's skill categories? The position's
 * sub-category counts too — a role filed under Sales with a "retail"
 * sub-category is a fair match for a Retail recruiter.
 */
function positionMatchesSkills(position, userCats) {
  const cats = userSkillList(userCats);
  if (!cats.length) return false;
  const posSides = [position?.skill_category, position?.skill_sub_category]
    .flatMap(v => String(v || '').split(',')) // sub-categories are sometimes "wealth, retail"
    .map(s => s.trim())
    .filter(Boolean);
  if (!posSides.length) return false;
  return cats.some(c => posSides.some(p => namesMatch(c, p)));
}

export { norm, familyOf, namesMatch, userSkillList, positionMatchesSkills };
