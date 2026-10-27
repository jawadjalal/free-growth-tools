/* Pure checks for the cold email checker. No DOM, no network, no AI model: every check is a plain rule with its
   source. Nothing here stores or sends text. */

export const CHECKED = '2026-10-25';
export const CHECKED_LABEL = '25 October 2026';
export const BOOMERANG_URL = 'https://blog.boomerangapp.com/2016/02/7-tips-for-getting-more-responses-to-your-emails-with-data/';
export const HUBSPOT_URL = 'https://blog.hubspot.com/blog/tabid/6307/bid/30684/the-ultimate-list-of-email-spam-trigger-words.aspx';
export const FK_URL = 'https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests';
export const FIX_OUTBOUND = 'https://ignura.com/email';
export const B2B_POST = 'https://ignura.com/blog/cold-email-for-b2b-startups';
export const DELIVERABILITY_POST = 'https://ignura.com/blog/cold-email-deliverability-checklist-2026';

/* ==== EDIT HERE: every threshold and word list the checker uses ===== */
export const COLD_EMAIL_CHECKER_CONFIG = {
  /* Boomerang: 50 to 125 words all had response rates above 50%. */
  wordsMin: 50,
  wordsMax: 125,
  /* House threshold: Flesch-Kincaid grade at or above this is flagged. Boomerang found grade 3 did best. */
  gradeFlagAt: 7,
  /* Below this many words the reading level is skipped. */
  minWordsForGrade: 10,
  /* Boomerang: 3 to 4 word subjects got the most responses. Over this many words is flagged (first emails only). */
  subjectMaxWords: 6,
  /* Boomerang: 1 to 3 questions did better than none. */
  questionsMin: 1,
  questionsMax: 3,
  /* House rule: any link in a first email is flagged, booking links included. */
  flagAnyLinkInFirstEmail: true,
  /* Input limits. */
  maxBodyChars: 5000,
  maxSubjectChars: 200,
  /* The ask: any of these in the last 3 sentences counts as an ask. */
  askPhrases: ['call', 'chat', 'talk', 'meet', 'minute', 'minutes', 'mins', 'next week', 'this week', 'worth a', 'open to', 'interested', 'demo'],
  /* Booking link hosts (house rule). */
  bookingHosts: ['cal.com', 'calendly.com', 'meetings.hubspot.com', 'hubspot.com/meetings', 'calendar.google.com', 'calendar.app.google'],
  /* ALL CAPS words this long or longer are flagged, except these common acronyms. */
  capsMinLetters: 4,
  capsAllow: ['GDPR', 'HTML', 'HTTP', 'HTTPS', 'JSON', 'NASA', 'SAAS', 'B2B', 'B2C', 'SOC2', 'HIPAA', 'ISO'],
  /* Spam phrases: a curated subset of HubSpot's list (81 entries). Whole phrase, any case. */
  spamPhrases: [
  "as seen on",
  "additional income",
  "be your own boss",
  "double your",
  "earn extra cash",
  "extra income",
  "make money",
  "money making",
  "potential earnings",
  "work from home",
  "best price",
  "big bucks",
  "cash bonus",
  "cents on the dollar",
  "fast cash",
  "incredible deal",
  "lowest price",
  "million dollars",
  "money back",
  "no cost",
  "no fees",
  "one hundred percent free",
  "pure profit",
  "save big money",
  "serious cash",
  "why pay more?",
  "full refund",
  "explode your business",
  "no hidden costs",
  "no investment",
  "get paid",
  "financially independent",
  "click below",
  "click here",
  "bulk email",
  "direct marketing",
  "increase sales",
  "increase traffic",
  "increase your sales",
  "more internet traffic",
  "mass email",
  "not spam",
  "this isn't spam",
  "we hate spam",
  "will not believe your eyes",
  "visit our website",
  "100% free",
  "100% satisfied",
  "50% off",
  "join millions",
  "one hundred percent guaranteed",
  "financial freedom",
  "giving away",
  "no catch",
  "no gimmick",
  "no obligation",
  "no questions asked",
  "no strings attached",
  "what are you waiting for?",
  "you have been selected",
  "sign up free today",
  "free gift",
  "free money",
  "free consultation",
  "cancel at any time",
  "drastically reduced",
  "fantastic deal",
  "promise you",
  "risk free",
  "satisfaction guaranteed",
  "act now",
  "call now",
  "do it today",
  "don't hesitate",
  "limited time",
  "offer expires",
  "once in lifetime",
  "order now",
  "take action now",
  "supplies are limited",
  "urgent",
  ],
} as const;
/* ==== end of config ==== */

export type CheckId = 'words' | 'grade' | 'spam' | 'links' | 'booking' | 'images' | 'tokens' | 'questions' | 'ask' | 'subject' | 'fake_reply';
export type State = 'fine' | 'look' | 'skipped';
export interface Source { label: string; href: string }
export interface Check {
  id: CheckId; name: string; state: State;
  found: string; rule: string; source: Source; fix: string;
  marks?: string[]; // text to show highlighted (spam matches, longest sentence)
  note?: string;
}
export interface Input { subject: string; body: string; followUp: boolean; includeSignature: boolean }
export interface Result {
  checks: Check[]; words: number; grade: number | null; questions: number; links: number;
  signatureLines: number; strippedQuoted: boolean; gradeSkip: '' | 'too_short' | 'non_english';
  summary: string;
}

const C = COLD_EMAIL_CHECKER_CONFIG;
const SRC = {
  boomerang: { label: 'Boomerang, 40 million emails (2016)', href: BOOMERANG_URL },
  boomerangHouse: { label: 'Boomerang, plus an Ignura house threshold', href: BOOMERANG_URL },
  hubspot: { label: 'HubSpot’s list of spam trigger words', href: HUBSPOT_URL },
  houseOutbound: { label: 'Ignura house rule', href: FIX_OUTBOUND },
  houseB2B: { label: 'Ignura house rule', href: B2B_POST },
} satisfies Record<string, Source>;

/* ---------- text prep ---------- */
export const normalise = (s: string) => s
  .replace(/\r\n?/g, '\n')
  .replace(/[‘’‚‛′]/g, "'").replace(/[“”„‟″]/g, '"')
  .replace(/\u00a0/g, ' ');

/** Count images first, then turn pasted HTML into plain text. */
export function htmlToText(raw: string): { text: string; images: number } {
  const images = (raw.match(/<img\b/gi) || []).length;
  if (!/<\/?[a-z][^>]*>/i.test(raw)) return { text: raw, images };
  const text = raw
    .replace(/<img\b[^>]*>/gi, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/h\d)\b[^>]*>/gi, '\n')
    .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi, ' $1 ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return { text, images };
}

/** Strip quoted thread lines (> ...) and everything from an "On ... wrote:" line. */
export function stripQuoted(text: string): { text: string; stripped: boolean } {
  const lines = text.split('\n');
  const out: string[] = [];
  let stripped = false;
  for (const l of lines) {
    if (/^\s*On\b.{3,200}\bwrote:\s*$/i.test(l) || /^-{2,}\s*(Original|Forwarded) Message\s*-{2,}/i.test(l)) { stripped = true; break; }
    if (/^\s*>/.test(l)) { stripped = true; continue; }
    out.push(l);
  }
  return { text: out.join('\n'), stripped };
}

const SIGNOFF = /^(best|best wishes|best regards|kind regards|warm regards|regards|thanks|thanks again|thank you|many thanks|cheers|all the best|warmly|talk soon|speak soon|sincerely)[,.!]?$/i;
const NAME_ONLY = /^[A-Z][a-zA-Z'.]*( [A-Z][a-zA-Z'.]*){0,2}$/;

/** A guess at the signature: from a "--" line, a sign-off line, or a name-only line near the end. */
export function splitSignature(text: string): { body: string; sigLines: number } {
  const lines = text.replace(/\s+$/, '').split('\n');
  const n = lines.length;
  const dash = lines.findIndex((l) => /^\s*--\s*$/.test(l));
  let cut = dash >= 0 ? dash : -1;
  if (cut < 0) {
    const from = Math.max(1, n - 7);
    for (let i = from; i < n; i++) {
      const t = lines[i].trim();
      if (!t) continue;
      const rest = lines.slice(i + 1).filter((l) => l.trim());
      const restShort = rest.every((l) => l.trim().split(/\s+/).length <= 8 && !/\?/.test(l)) && rest.length <= 5;
      if (SIGNOFF.test(t) && restShort) { cut = i; break; }
      if (NAME_ONLY.test(t) && t.split(' ').length <= 3 && restShort && i >= n - 6 && !SIGNOFF.test(t)) { cut = i; break; }
    }
  }
  if (cut < 0) return { body: text, sigLines: 0 };
  const sig = lines.slice(cut).filter((l) => l.trim()).length;
  return { body: lines.slice(0, cut).join('\n'), sigLines: sig };
}

/* ---------- tokens, words, sentences ---------- */
const TOKEN_RES: Record<string, RegExp> = {
  '{{…}}': /\{\{\s*[^{}\n]{1,40}?\s*\}\}/g,
  '{…}': /(?<!\{)\{[A-Za-z_][^{}\n]{0,40}\}(?!\})/g,
  '[…]': /\[[A-Za-z][^\[\]\n]{0,40}\](?!\()/g,
  '%…%': /%[A-Za-z_][A-Za-z0-9_ ]{0,40}%/g,
};
export function findTokens(text: string) {
  const found: { style: string; token: string }[] = [];
  for (const [style, re] of Object.entries(TOKEN_RES)) for (const m of text.matchAll(re)) found.push({ style, token: m[0] });
  return found;
}
const TOKEN_ANY = new RegExp(Object.values(TOKEN_RES).map((r) => r.source).join('|'), 'g');
const TOKEN_MARK = '\u2063TOKEN\u2063';
const withTokens = (t: string) => t.replace(TOKEN_ANY, TOKEN_MARK);

export function words(text: string): string[] {
  return withTokens(text).split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w) || w.includes(TOKEN_MARK));
}
export function sentences(text: string): string[] {
  return withTokens(text)
    .split(/\n+|(?<=[.!?…])["')\]]*\s+/u)
    .map((s) => s.trim())
    .filter((s) => /[\p{L}\p{N}]/u.test(s) || s.includes(TOKEN_MARK))
    .map((s) => s.replaceAll(TOKEN_MARK, '[token]'));
}
export function syllables(word: string): number {
  let w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const m = w.match(/[aeiouy]{1,2}/g);
  return Math.max(1, m ? m.length : 1);
}
/** Flesch-Kincaid grade: 0.39 × (words ÷ sentences) + 11.8 × (syllables ÷ words) − 15.59. Tokens are left out. */
export function fkGrade(text: string): number {
  const ws = words(text).filter((w) => !w.includes(TOKEN_MARK)).map((w) => w.replace(/[^\p{L}\p{N}'-]/gu, '')).filter(Boolean);
  const ss = Math.max(1, sentences(text).length);
  if (!ws.length) return 0;
  const syl = ws.reduce((a, w) => a + syllables(w), 0);
  return Math.max(0, 0.39 * (ws.length / ss) + 11.8 * (syl / ws.length) - 15.59);
}
const BASIC = new Set(('the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us is are was were am has had did been being does call week chat talk meet hi hello thanks thank team help sell sales email emails reply saw noticed quick worth open next minutes hiring company product customers startup founder build list run send let here more much very really sure love great happy best regards cheers').split(' '));
/** Rough English test: share of words found in a short basic word list. */
export function looksEnglish(text: string): boolean {
  const ws = words(text).map((w) => w.toLowerCase().replace(/[^a-z']/g, '')).filter(Boolean);
  if (ws.length < 10) return true;
  const hit = ws.filter((w) => BASIC.has(w) || BASIC.has(w.replace(/'s$/, ''))).length;
  return hit / ws.length >= 0.15;
}

/* ---------- links ---------- */
const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"')\]]+/gi;
const BARE_RE = /(?<![@\w.\/-])(?:[a-z0-9-]+\.)+(?:com|io|co|ai|app|net|org|dev|so|xyz|me|ly|gg|to|tech|tools|uk|us|de|fr|eu|example)(?:\/[^\s<>"')\]]*)?(?![\w@])/gi;
export function findLinks(text: string): string[] {
  const t = text.replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, ' '); // email addresses are not links
  const full = t.match(URL_RE) || [];
  const rest = t.replace(URL_RE, ' ');
  const bare = (rest.match(BARE_RE) || []).filter((d) => !/^\d+(\.\d+)+$/.test(d));
  return [...full, ...bare].map((l) => l.replace(/[.,;:!?]+$/, ''));
}
export const isBooking = (link: string) => C.bookingHosts.some((h) => link.toLowerCase().includes(h));

/* ---------- spam ---------- */
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function findSpam(text: string): string[] {
  const t = normalise(text);
  const hits: string[] = [];
  for (const p of C.spamPhrases) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${esc(p)}(?![\\p{L}\\p{N}])`, 'giu');
    for (const m of t.matchAll(re)) hits.push(m[0]);
  }
  const caps = (t.replace(TOKEN_ANY, ' ').match(/\b[A-Z][A-Z0-9']+\b/g) || [])
    .filter((w) => (w.match(/[A-Z]/g) || []).length >= C.capsMinLetters && !(C.capsAllow as readonly string[]).includes(w));
  hits.push(...caps);
  hits.push(...(t.match(/!{2,}/g) || []));
  hits.push(...(t.match(/\${2,}/g) || []));
  return [...new Set(hits)];
}

/* ---------- the checks ---------- */
const s = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function check(inp: Input): Result {
  const { text: rawText, images } = htmlToText(normalise(inp.body));
  const { text: unquoted, stripped } = stripQuoted(rawText);
  const sig = splitSignature(unquoted);
  const body = inp.includeSignature ? unquoted : sig.body;
  const subject = normalise(inp.subject).trim();
  const first = !inp.followUp;
  const checks: Check[] = [];

  // Word count
  const wc = words(body).length;
  checks.push({
    id: 'words', name: 'Word count',
    state: wc > C.wordsMax || wc < C.wordsMin ? 'look' : 'fine',
    found: `${s(wc, 'word')} in the body${sig.sigLines && !inp.includeSignature ? ', not counting the signature' : ''}.`,
    rule: `Emails of ${C.wordsMin} to ${C.wordsMax} words all had response rates above 50%.`,
    source: SRC.boomerang,
    fix: wc > C.wordsMax ? 'Cut it to the one reason you’re writing and one question.' : wc < C.wordsMin ? 'Add one line on why them, and why now.' : 'Keep it this length.',
  });

  // Reading level
  let grade: number | null = null;
  let gradeSkip: Result['gradeSkip'] = '';
  if (wc < C.minWordsForGrade) gradeSkip = 'too_short';
  else if (!looksEnglish(body)) gradeSkip = 'non_english';
  if (gradeSkip) {
    checks.push({
      id: 'grade', name: 'Reading level', state: 'skipped',
      found: gradeSkip === 'too_short' ? 'Too short to check reading level.' : 'Reading level only works for English, and most of these words aren’t in our basic English list, so we skipped it.',
      rule: `Grade ${C.gradeFlagAt} or higher is worth a look (our house threshold). Boomerang found emails at a 3rd grade reading level did best.`,
      source: SRC.boomerangHouse, fix: '',
    });
  } else {
    grade = Math.round(fkGrade(body));
    const ss = sentences(body);
    const longest = ss.reduce((a, b) => (words(b).length > words(a).length ? b : a), '');
    const look = grade >= C.gradeFlagAt;
    checks.push({
      id: 'grade', name: 'Reading level', state: look ? 'look' : 'fine',
      found: `Flesch-Kincaid grade ${grade}.`,
      rule: `Grade ${C.gradeFlagAt} or higher is worth a look (our house threshold). Boomerang found emails at a 3rd grade reading level got 36% more replies than college level.`,
      source: SRC.boomerangHouse,
      fix: look ? 'Use shorter sentences and everyday words. Your longest sentence is highlighted.' : 'Keep the sentences this short.',
      marks: look && longest ? [longest] : undefined,
    });
  }

  // Spam words
  const spam = findSpam(`${first ? subject + '\n' : ''}${body}`);
  checks.push({
    id: 'spam', name: 'Spam words', state: spam.length ? 'look' : 'fine',
    found: spam.length ? `${s(spam.length, 'match', 'matches')}.` : 'No words from the list, no ALL CAPS words, no !! or $$.',
    rule: 'Phrases from HubSpot’s spam trigger list, ALL CAPS words, !! and $$. Spam words alone don’t decide where an email lands.',
    source: SRC.hubspot,
    fix: spam.length ? 'Swap these for plain words.' : 'Nothing to swap.',
    marks: spam.length ? spam : undefined,
  });

  // Links and booking links
  const links = findLinks(body);
  const booking = links.filter(isBooking);
  const linkLook = first && C.flagAnyLinkInFirstEmail && links.length > 0;
  checks.push({
    id: 'links', name: 'Links', state: linkLook ? 'look' : 'fine',
    found: links.length ? `${s(links.length, 'link')} in the body${first ? ' of a first email' : ''}.` : 'No links in the body.',
    rule: 'No link in a first email. Ask in words, and send the link once they reply.',
    source: SRC.houseOutbound,
    fix: linkLook ? 'Take the link out of the first email. Send it once they reply.' : links.length ? 'Fine in a follow-up once they’ve replied.' : 'Keep it link free.',
  });
  checks.push({
    id: 'booking', name: 'Booking link', state: booking.length ? 'look' : 'fine',
    found: booking.length ? `${s(booking.length, 'booking link')} found.` : 'No booking links.',
    rule: 'Ask for the call in words. A booking link asks a stranger to do the work before they’ve said yes.',
    source: SRC.houseOutbound,
    fix: booking.length ? 'Ask for the call in words instead of sending a booking link.' : 'Keep asking in words.',
  });

  // Images and attachments
  const md = (body.match(/!\[[^\]]*\]\([^)]*\)/g) || []).length;
  const att = (body.replace(/strings attached/gi, '').match(/\battach(?:ed|ment|ments)\b/gi) || []).length;
  const imgN = images + md;
  checks.push({
    id: 'images', name: 'Images and attachments', state: imgN + att ? 'look' : 'fine',
    found: imgN + att ? [imgN ? s(imgN, 'image') : '', att ? `${imgN ? 'the' : 'The'} word “attached” or “attachment” ${s(att, 'time')}` : ''].filter(Boolean).join(' and ') + '.' : 'No images and no mention of attachments.',
    rule: 'Plain text only in the first email, with no images and no attachments.',
    source: SRC.houseB2B,
    fix: imgN + att ? 'Send plain text only. No images or attachments in the first email.' : 'Keep it plain text.',
  });

  // Personalisation tokens
  const toks = findTokens(`${subject}\n${body}`);
  const styles = new Set(toks.map((t) => t.style));
  const unfilled = toks.filter((t) => t.style === '[…]' || /\b(first|last)\s*name|company|name\b/i.test(t.token) && t.style !== '{{…}}');
  let tokState: State = 'fine', tokFound: string, tokFix: string, tokNote: string | undefined;
  if (!toks.length) {
    tokFound = 'No merge tokens.';
    tokFix = 'Add one line that shows you looked at them.';
    tokNote = 'A soft note: make sure one line is about them, not you.';
  } else if (styles.size > 1) {
    tokState = 'look'; tokFound = `Mixed token styles: ${[...styles].join(' and ')}.`; tokFix = 'Check each token has a fallback, or fill it in.';
  } else if (unfilled.length) {
    tokState = 'look'; tokFound = `${s(unfilled.length, 'token')} that look${unfilled.length === 1 ? 's' : ''} unfilled.`; tokFix = 'Check each token has a fallback, or fill it in.';
  } else {
    tokFound = `${s(toks.length, 'token')}, one style.`; tokFix = 'Check each token has a fallback.';
  }
  checks.push({ id: 'tokens', name: 'Personalisation tokens', state: tokState, found: tokFound, rule: 'One token style, each with a fallback, and one line that shows you looked at them.', source: SRC.houseOutbound, fix: tokFix, note: tokNote });

  // Questions
  const qn = (body.match(/\?/g) || []).length;
  checks.push({
    id: 'questions', name: 'Questions', state: qn < C.questionsMin || qn > C.questionsMax ? 'look' : 'fine',
    found: `${s(qn, 'question')}.`,
    rule: `Emails asking ${C.questionsMin} to ${C.questionsMax} questions were 50% more likely to get a response than emails asking none.`,
    source: SRC.boomerang,
    fix: qn < C.questionsMin ? 'End with one clear question.' : qn > C.questionsMax ? `Cut it to one to three questions.` : 'Keep the one clear question.',
  });

  // The ask
  const last3 = sentences(body).slice(-3).join(' ').toLowerCase();
  const asked = C.askPhrases.some((p) => new RegExp(`\\b${esc(p)}\\b`, 'i').test(last3));
  checks.push({
    id: 'ask', name: 'The ask', state: asked ? 'fine' : 'look',
    found: asked ? 'An ask in the last three sentences.' : 'No ask in the last three sentences.',
    rule: 'Ask for a call in plain words at the end, with no link.',
    source: SRC.houseOutbound,
    fix: asked ? 'Keep it to one clear ask.' : 'Ask for a call in plain words, like: Worth a 15-minute call next week?',
  });

  // Subject length and fake reply (first emails only)
  if (first) {
    const clean = subject.replace(/^((re|fwd?|aw|wg)\s*:\s*)+/i, '').trim();
    const sw = clean ? clean.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;
    const allCaps = /[A-Z]{2,}/.test(clean) && clean === clean.toUpperCase() && /[A-Z]/.test(clean);
    const look = !clean || sw > C.subjectMaxWords || allCaps;
    checks.push({
      id: 'subject', name: 'Subject length', state: look ? 'look' : 'fine',
      found: !clean ? 'No subject line.' : `${s(sw, 'word')}${allCaps ? ', in ALL CAPS' : ''}.`,
      rule: `Subjects of 3 to 4 words got the most responses. Over ${C.subjectMaxWords} words, empty or ALL CAPS is worth a look.`,
      source: SRC.boomerang,
      fix: look ? 'Aim for 3 or 4 plain words.' : 'Keep it short and plain.',
    });
    const fake = /^\s*(re|fwd?)\s*:/i.test(subject);
    checks.push({
      id: 'fake_reply', name: 'Fake reply', state: fake ? 'look' : 'fine',
      found: fake ? 'The subject starts with Re: or Fwd: in a first email.' : 'No Re: or Fwd: on a first email.',
      rule: 'A first email doesn’t start with Re: or Fwd:.',
      source: SRC.houseOutbound,
      fix: fake ? 'Take Re: or Fwd: out of the subject. It reads as a trick.' : 'Keep it that way.',
    });
  }

  const flagged = checks.filter((c) => c.state === 'look');
  const summary = [
    `Cold email check (${first ? 'first email' : 'follow-up'}): ${numbersLine({ words: wc, grade, questions: qn, links: links.length })}`,
    '',
    ...checks.filter((c) => c.state !== 'skipped').map((c) => `${c.state === 'look' ? 'Worth a look' : 'Looks fine'}: ${c.name}. ${c.found}${c.state === 'look' ? ` Fix: ${c.fix}` : ''}`),
    '',
    `${s(flagged.length, 'check')} worth a look. Rules and sources: ignura.com/tools/cold-email-checker`,
  ].join('\n');

  return { checks, words: wc, grade, questions: qn, links: links.length, signatureLines: sig.sigLines, strippedQuoted: stripped, gradeSkip, summary };
}

export const numbersLine = (r: { words: number; grade: number | null; questions: number; links: number }) =>
  [s(r.words, 'word'), r.grade === null ? 'grade skipped' : `grade ${r.grade}`, s(r.questions, 'question'), s(r.links, 'link')].join(' · ');

/* ---------- coarse buckets, handy if you add your own analytics: never raw text or exact counts ---------- */
export const wordsBucket = (n: number) => (n < 50 ? '<50' : n <= 125 ? '50-125' : n <= 200 ? '126-200' : '200+');
export const gradeBucket = (g: number | null) => (g === null ? 'skipped' : g <= 4 ? '<=4' : g <= 6 ? '5-6' : g <= 9 ? '7-9' : '10+');
export const flagsBucket = (n: number) => (n === 0 ? '0' : n <= 2 ? '1-2' : n <= 4 ? '3-4' : '5+');
