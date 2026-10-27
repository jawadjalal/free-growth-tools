/* Pure checks for the headline analyzer. No DOM, no network, no AI: every check is a plain rule.
   Rules with no published platform source are labelled "Ignura editorial guide".
   Nothing here stores or sends the headline text. */

export const CHECKED = '2026-10-27';
export const CHECKED_LABEL = '27 October 2026';
export const FIX_CONTENT = 'https://ignura.com/content';
export const CONTENT_POST = 'https://ignura.com/blog/content-marketing-for-b2b-startups';

export type Format = 'blog' | 'x' | 'email' | 'video';

/* ==== EDIT HERE: thresholds, word lists, and FAQs. ==== */
export const HEADLINE_ANALYZER_CONFIG = {
  maxChars: 200,
  formats: {
    blog: { label: 'Blog title', kind: 'words' as const, minWords: 6, maxWords: 12 },
    x: { label: 'X post hook', kind: 'chars' as const, maxChars: 100 },
    email: { label: 'Email subject line', kind: 'chars' as const, maxChars: 50 },
    video: { label: 'Video hook', kind: 'words' as const, minWords: 1, maxWords: 12 },
  },
  /* Weak openers. "how to" is fine even though it starts with common words. */
  weakOpeners: ['the', 'a', 'an', 'introducing', 'announcing', 'we', 'our', 'check out', 'just'],
  weakOpenerOk: ['how to'],
  /* Specific detail: a number, a named audience, or a time frame. */
  audiencePhrases: [
    'for founders', 'for saas', 'for startups', 'for marketers', 'for creators',
    'for b2b', 'for b2c', 'for agencies', 'for engineers', 'for developers',
  ],
  timePhrases: [
    'this week', 'next week', 'this month', 'in a day', 'in a week', 'in an hour',
    'in minutes', 'in seconds', 'overnight', 'today', 'tomorrow', 'daily', 'weekly',
    'per day', 'per week', 'per month', '30 day', '30-day', '7 day', '7-day',
  ],
  /* Clear promise: outcome verbs, or a how / why / what question. */
  outcomeVerbs: ['get', 'cut', 'fix', 'stop', 'grow', 'save', 'find', 'avoid', 'learn', 'build'],
  /* Filler and hype. */
  hypePhrases: [
    'ultimate', 'amazing', 'revolutionary', 'game-changer', 'game changer',
    'unlock', 'supercharge', 'secret', 'best ever', 'insane',
  ],
  /* Caps: more than one ALL-CAPS word (after short acronyms), or !! / ?! */
  capsAllow: ['SEO', 'SaaS', 'B2B', 'B2C', 'API', 'FAQ', 'CTA', 'ROI', 'LTV', 'CAC', 'UGC', 'MVP', 'AI', 'CRM', 'ARR', 'MRR'],
  capsMaxAllowed: 1,
} as const;

/** FAQs shown on the live page. */
export const HEADLINE_FAQS: { q: string; a: string }[] = [
  {
    q: 'What is a hook analyzer?',
    a: 'A hook analyzer is the same tool aimed at X post hooks and video hooks. Pick "X post hook" or "Video hook" under Where it goes, and the length band changes. The other five checks stay the same.',
  },
  {
    q: 'Is this headline analyzer free?',
    a: "Yes. It runs in your browser, so you don't need an account and your headline isn't saved or sent anywhere.",
  },
  {
    q: 'Can I use it as a hook analyzer for TikTok or reels?',
    a: "Yes. Paste the first line you'll say or show on screen. It checks the same things that make a written headline work, like the first three words and how clear the promise is, but it doesn't watch the video.",
  },
  {
    q: 'What does "N of 6 checks passed" mean?',
    a: "Each check is one rule, and each one shows where it comes from. The count tells you how many rules your headline meets. It isn't a prediction of clicks or views.",
  },
];
/* ==== end of config ==== */

export type CheckId = 'length' | 'opener' | 'detail' | 'promise' | 'hype' | 'caps';
export type State = 'fine' | 'look' | 'skipped';
export interface Source { label: string; href?: string }
export interface Check {
  id: CheckId; name: string; state: State;
  found: string; rule: string; source: Source; fix: string;
  marks?: string[];
  note?: string;
}
export interface Input { text: string; format: Format }
export interface Result {
  checks: Check[];
  passed: number;
  total: number;
  chars: number;
  words: number;
  latin: boolean;
  summary: string;
  highlights: string[]; // words/phrases to mark in the replay
}

const C = HEADLINE_ANALYZER_CONFIG;
export const EDITORIAL: Source = { label: 'Ignura editorial guide' };

export function graphemeCount(s: string): number {
  try {
    return [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(s)].length;
  } catch {
    return [...s].length;
  }
}

export function isLatinScript(s: string): boolean {
  const letters = s.match(/\p{L}/gu) || [];
  if (!letters.length) return true;
  const latin = letters.filter((ch) => /\p{Script=Latin}/u.test(ch)).length;
  return latin / letters.length >= 0.8;
}

export function wordsOf(s: string): string[] {
  return (s.match(/[A-Za-z0-9']+/g) || []);
}

/** Word count for length bands: Latin tokens when the text is Latin, otherwise whitespace tokens
    so CJK / RTL still get a length check (length still runs; word checks are English-only). */
export function lengthWordCount(s: string, latin: boolean): number {
  if (latin) return wordsOf(s).length;
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}


/** Drop leading quotes, brackets, punctuation, symbols and emoji before the opener's first word. */
export function stripLeadingOpenerNoise(s: string): string {
  // Letters and numbers stay; straight/curly quotes, [({<, * # - – — : « », emoji, etc. go.
  return s.replace(/^[^\p{L}\p{N}]+/u, '');
}


/** First-word tokens for the opener check: strip leading noise, then unwrap edge ' quotes. */
export function openerWords(s: string): string[] {
  return wordsOf(stripLeadingOpenerNoise(s))
    .map((w) => w.replace(/^'+|'+$/g, ''))
    .filter(Boolean);
}

export function firstLine(s: string): string {
  return s.split(/\r?\n/, 1)[0] ?? s;
}

function esc(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasNumber(s: string): boolean {
  return /(?:\d|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|dozen|hundred|thousand)/i.test(s);
}

function findPhrases(hay: string, phrases: readonly string[]): string[] {
  const lower = hay.toLowerCase();
  return phrases.filter((p) => lower.includes(p.toLowerCase()));
}

export function check(input: Input): Result {
  const raw = String(input.text ?? '').replace(/\u00a0/g, ' ');
  const text = raw.trim();
  const format = input.format in C.formats ? input.format : 'blog';
  const band = C.formats[format];
  const chars = graphemeCount(text);
  const latin = isLatinScript(text);
  const words = wordsOf(text);
  const wordCount = lengthWordCount(text, latin);
  const highlights: string[] = [];
  const checks: Check[] = [];

  // 1. Length
  let lengthLook = false;
  let lengthFound = '';
  let lengthFix = '';
  if (band.kind === 'words') {
    const min = 'minWords' in band ? band.minWords : 1;
    const max = band.maxWords;
    lengthLook = wordCount < min || wordCount > max;
    lengthFound = `${wordCount} word${wordCount === 1 ? '' : 's'} (${band.label} guide: ${min} to ${max} words).`;
    lengthFix = wordCount < min
      ? `Add a little more so it sits in the ${min} to ${max} word guide.`
      : `Cut it toward ${min} to ${max} words. This is our guide, not a platform limit.`;
  } else {
    const line = firstLine(text);
    const lineChars = graphemeCount(line);
    const max = band.maxChars;
    lengthLook = lineChars > max;
    lengthFound = `${lineChars} character${lineChars === 1 ? '' : 's'} on the first line (${band.label} guide: up to ${max}).`;
    lengthFix = `Shorten the first line to ${max} characters or fewer. This is our guide, not a platform limit.`;
  }
  checks.push({
    id: 'length', name: 'Length', state: lengthLook ? 'look' : 'fine',
    found: lengthFound,
    rule: 'Length is checked against our editorial band for the format you pick. Our guide, not a platform limit.',
    source: EDITORIAL,
    fix: lengthLook ? lengthFix : 'Keep it in this band.',
  });

  // Word checks need Latin script
  if (!latin) {
    for (const id of ['opener', 'detail', 'promise', 'hype', 'caps'] as CheckId[]) {
      const names: Record<CheckId, string> = {
        length: 'Length', opener: 'First three words', detail: 'Specific detail',
        promise: 'Clear promise', hype: 'Filler and hype words', caps: 'Caps and punctuation',
      };
      checks.push({
        id, name: names[id], state: 'skipped',
        found: 'Word checks support English only for now.',
        rule: 'Word checks run on Latin script text. Length still runs for every language.',
        source: EDITORIAL,
        fix: '',
        note: 'Word checks support English only for now.',
      });
    }
  } else {
    // 2. First three words / weak opener (strip leading quotes/brackets/symbols/emoji first)
    const openerTokens = openerWords(text);
    const opener = openerTokens.map((w) => w.toLowerCase()).join(' ');
    const okPrefix = C.weakOpenerOk.some((p) => opener.startsWith(p + ' ') || opener === p);
    let weak: string | null = null;
    if (!okPrefix) {
      for (const w of C.weakOpeners) {
        if (opener.startsWith(w + ' ') || opener === w) { weak = w; break; }
      }
    }
    if (weak) highlights.push(openerTokens[0] || weak);
    checks.push({
      id: 'opener', name: 'First three words', state: weak ? 'look' : 'fine',
      found: weak ? `Opens with “${weak}”.` : 'Opener looks specific enough.',
      rule: 'Skip weak openers such as the, a, an, introducing, announcing, we, our, check out, or just. “How to” is fine.',
      source: EDITORIAL,
      fix: weak ? 'Lead with the reader, the outcome, or a concrete detail.' : 'Keep leading with something specific.',
      marks: weak ? [weak] : undefined,
    });

    // 3. Specific detail
    const audiences = findPhrases(text, C.audiencePhrases);
    const times = findPhrases(text, C.timePhrases);
    const numbered = hasNumber(text);
    const detailOk = numbered || audiences.length > 0 || times.length > 0;
    const detailBits = [
      numbered ? 'a number' : '',
      audiences.length ? `audience (${audiences[0]})` : '',
      times.length ? `time frame (${times[0]})` : '',
    ].filter(Boolean);
    if (audiences[0]) highlights.push(audiences[0]);
    if (times[0]) highlights.push(times[0]);
    checks.push({
      id: 'detail', name: 'Specific detail', state: detailOk ? 'fine' : 'look',
      found: detailOk ? `Has ${detailBits.join(', ')}.` : 'No number, named audience, or time frame.',
      rule: 'Pass if the line has a number, a named audience (for example “for founders”), or a time frame.',
      source: EDITORIAL,
      fix: detailOk ? 'Keep the concrete detail.' : 'Add a number, who it is for, or when.',
    });

    // 4. Clear promise
    const verbHits = C.outcomeVerbs.filter((v) => new RegExp(`\\b${esc(v)}\\b`, 'i').test(text));
    const questionOk = /^(how|why|what)\b/i.test(opener) || /\b(how|why|what)\b.+\?/i.test(text);
    const promiseOk = verbHits.length > 0 || questionOk;
    if (verbHits[0]) highlights.push(verbHits[0]);
    checks.push({
      id: 'promise', name: 'Clear promise', state: promiseOk ? 'fine' : 'look',
      found: promiseOk
        ? (verbHits.length ? `Outcome verb: ${verbHits.slice(0, 3).join(', ')}.` : 'Framed as a how / why / what question.')
        : 'No clear outcome verb or how / why / what question.',
      rule: 'Pass if it uses an outcome verb (get, cut, fix, stop, grow, save, find, avoid, learn, build) or a how / why / what question.',
      source: EDITORIAL,
      fix: promiseOk ? 'Keep the promise plain.' : 'Name the outcome, or ask how / why / what.',
      marks: verbHits.slice(0, 3),
    });

    // 5. Filler and hype
    const hypeHits = findPhrases(text, C.hypePhrases);
    for (const h of hypeHits) highlights.push(h);
    checks.push({
      id: 'hype', name: 'Filler and hype words', state: hypeHits.length ? 'look' : 'fine',
      found: hypeHits.length ? `Flagged: ${hypeHits.join(', ')}.` : 'No listed hype words.',
      rule: 'Flag ultimate, amazing, revolutionary, game-changer, unlock, supercharge, secret, best ever, insane.',
      source: EDITORIAL,
      fix: hypeHits.length ? 'Swap the hype for a plain claim you can stand behind.' : 'Keep it plain.',
      marks: hypeHits,
    });

    // 6. Caps and punctuation
    const capsWords = words.filter((w) => {
      if (w.length <= 1) return false;
      if (w !== w.toUpperCase()) return false;
      if (!/[A-Z]/.test(w)) return false;
      if (w.length <= 4 && C.capsAllow.some((a) => a.toUpperCase() === w.toUpperCase())) return false;
      // short ALL-CAPS ≤4 letters treated as acronyms even if not listed
      if (w.length <= 4) return false;
      return true;
    });
    const bangs = (text.match(/!/g) || []).length;
    const qBang = /\?!/.test(text);
    const multiBang = bangs > 1;
    const capsLook = capsWords.length > C.capsMaxAllowed || multiBang || qBang;
    for (const w of capsWords) highlights.push(w);
    const capsBits = [
      capsWords.length > C.capsMaxAllowed ? `${capsWords.length} ALL-CAPS words` : '',
      multiBang ? 'more than one !' : '',
      qBang ? 'a ?!' : '',
    ].filter(Boolean);
    checks.push({
      id: 'caps', name: 'Caps and punctuation', state: capsLook ? 'look' : 'fine',
      found: capsLook ? `Flagged: ${capsBits.join(', ')}.` : 'Caps and punctuation look calm.',
      rule: 'Flag more than one ALL-CAPS word (short acronyms of 4 letters or fewer are fine), more than one !, or ?!.',
      source: EDITORIAL,
      fix: capsLook ? 'Drop the extra caps and keep at most one !.' : 'Keep it calm.',
      marks: capsWords,
    });
  }

  const passed = checks.filter((c) => c.state === 'fine').length;
  const total = 6;
  const summary = [
    `Headline check (${C.formats[format].label}): ${passed} of ${total} checks passed.`,
    '',
    ...checks.filter((c) => c.state !== 'skipped').map((c) =>
      `${c.state === 'look' ? 'Worth a look' : 'Looks fine'}: ${c.name}. ${c.found}${c.state === 'look' && c.fix ? ` Fix: ${c.fix}` : ''}`),
    '',
    `Rules: Ignura editorial guide. ignura.com/tools/headline-analyzer`,
  ].join('\n');

  return { checks, passed, total, chars, words: wordCount, latin, summary, highlights: [...new Set(highlights)] };
}

export const passedLine = (r: Result) => `${r.passed} of ${r.total} checks passed`;
