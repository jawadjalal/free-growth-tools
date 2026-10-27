/* Pure logic for the SERP preview. No DOM, no network. Pixel widths are measured in the browser with canvas
   measureText (see main.ts). Desktop only for now. The description uses a 652px × 2-line box rather than one
   summed pixel total. */
export const CHECKED = '2026-10-27';
export const CHECKED_LABEL = '27 October 2026';

/** Warn when the title passes this width (about). Cut at TITLE_CUTOFF_DESKTOP_PX. */
export const TITLE_WARN_DESKTOP_PX = 580;
/** Cut the title (one line) and append an ellipsis past this width. */
export const TITLE_CUTOFF_DESKTOP_PX = 600;
/** Description preview box width. Overflow is a 2-line clamp, not a summed pixel total. */
export const DESC_BOX_WIDTH_PX = 652;
/** About 22px line height at 14px Arial; used only for layout notes, not a cutoff constant. */
export const DESC_LINE_HEIGHT_PX = 22;
export const DESC_MAX_LINES = 2;
/** The day these widths were last checked (shown near the preview). */
export const CUTOFF_MEASURED_ON = '27 Oct 2026';
export const CUTOFF_MEASURED_LINE = 'Desktop widths measured on Google, 27 Oct 2026';

export const MAX_TITLE = 300;
export const MAX_DESC = 1000;
export const MAX_URL = 200;
export const MAX_SITE = 80;

/* Fonts: 20px Arial title, 14px Arial description (likely but not confirmed from Google's styles — say "about"). */
export const FONT_TITLE = '20px Arial, sans-serif';
export const FONT_DESC = '14px Arial, sans-serif';

export const TITLE_DOCS = 'https://developers.google.com/search/docs/appearance/title-link';
export const SNIPPET_DOCS = 'https://developers.google.com/search/docs/appearance/snippet';
export const POST_PATH = 'https://ignura.com/blog/seo-for-startups-no-budget';
export const LAYER_PATH = 'https://ignura.com/seo';

export type NoteId =
  | 'title_cut'
  | 'desc_cut'
  | 'empty_desc'
  | 'short_title'
  | 'repeat_word'
  | 'all_caps'
  | 'non_latin';

/* Pasted full tags like <title>X</title> or <meta ... content="X">: keep the inner text. */
export function stripPastedTags(raw: string): string {
  let s = String(raw ?? '');
  const title = s.match(/^\s*<title[^>]*>([\s\S]*?)<\/title>\s*$/i);
  if (title) return title[1];
  const meta = s.match(/^\s*<meta[^>]*\bcontent\s*=\s*(["'])([\s\S]*?)\1[^>]*\/?>\s*$/i);
  if (meta) return meta[2];
  return s;
}

/* Google collapses line breaks in titles and descriptions to spaces. */
export function flattenLines(raw: string): string {
  return String(raw ?? '').replace(/[\r\n]+/g, ' ').replace(/[ \t]{2,}/g, ' ');
}

export function prepareTitle(raw: string): string {
  return flattenLines(stripPastedTags(raw)).trimStart();
}

export function prepareDesc(raw: string): string {
  return flattenLines(stripPastedTags(raw)).trimStart();
}

export function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function copyTags(title: string, desc: string): string {
  const t = escapeHtml(title);
  const d = escapeHtml(desc);
  return `<title>${t}</title>\n<meta name="description" content="${d}">`;
}

/* Non-Latin / RTL / CJK: width is a rough guess with Arial. */
export function hasNonLatin(s: string): boolean {
  return /[^\u0000-\u024F\u1E00-\u1EFF]/.test(s);
}

export function isAllCaps(title: string): boolean {
  const letters = title.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, '');
  return letters.length >= 4 && letters === letters.toUpperCase() && /[A-ZÀ-ÖØ-Þ]/.test(letters);
}

export function repeatedWord(title: string): { word: string; n: number } | null {
  const words = title.toLowerCase().match(/[a-z0-9']+/g) ?? [];
  const counts = new Map<string, number>();
  for (const w of words) {
    if (w.length < 2) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  let best: { word: string; n: number } | null = null;
  for (const [word, n] of counts) {
    if (n >= 3 && (!best || n > best.n)) best = { word, n };
  }
  return best;
}

export type MeasureFn = (text: string, font: string) => number;

/* Truncate a one-line title to fit maxPx, appending an ellipsis. Binary search on character count. */
export function truncateToPx(text: string, maxPx: number, font: string, measure: MeasureFn): { shown: string; cut: boolean; lastWords: string } {
  if (!text) return { shown: '', cut: false, lastWords: '' };
  if (!(maxPx > 0) || measure(text, font) <= maxPx) return { shown: text, cut: false, lastWords: '' };
  const ell = '…';
  let lo = 0, hi = text.length, best = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const candidate = text.slice(0, mid).replace(/\s+$/, '') + ell;
    if (measure(candidate, font) <= maxPx) { best = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  const kept = text.slice(0, best).replace(/\s+$/, '');
  const shown = kept + ell;
  const tail = kept.trim().split(/\s+/).slice(-3).join(' ');
  return { shown, cut: true, lastWords: tail };
}

/* Word-wrap into lines that fit maxWidth (canvas measureText). */
export function wrapLines(text: string, maxWidth: number, font: string, measure: MeasureFn): string[] {
  if (!text) return [];
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  const pushHard = (word: string) => {
    let chunk = '';
    for (const ch of word) {
      if (!chunk || measure(chunk + ch, font) <= maxWidth) chunk += ch;
      else {
        if (chunk) lines.push(chunk);
        chunk = ch;
      }
    }
    current = chunk;
  };
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (measure(trial, font) <= maxWidth) {
      current = trial;
    } else if (!current) {
      pushHard(word);
    } else {
      lines.push(current);
      if (measure(word, font) <= maxWidth) current = word;
      else pushHard(word);
    }
  }
  if (current) lines.push(current);
  return lines;
}

/* Description overflow: more than DESC_MAX_LINES in the DESC_BOX_WIDTH_PX box. */
export function descOverflow(text: string, measure: MeasureFn): { cut: boolean; lastWords: string } {
  if (!text) return { cut: false, lastWords: '' };
  const lines = wrapLines(text, DESC_BOX_WIDTH_PX, FONT_DESC, measure);
  if (lines.length <= DESC_MAX_LINES) return { cut: false, lastWords: '' };
  const lastKept = lines[DESC_MAX_LINES - 1] ?? '';
  const lastWords = lastKept.trim().split(/\s+/).slice(-3).join(' ');
  return { cut: true, lastWords };
}

export function titlePxBucket(px: number, cutoff: number = TITLE_CUTOFF_DESKTOP_PX): '<300' | '300-500' | '500-cutoff' | 'over' {
  if (px < 300) return '<300';
  if (px < 500) return '300-500';
  if (px > cutoff) return 'over';
  return '500-cutoff';
}

export function descBucket(chars: number): 'none' | '<70' | '70-160' | '160+' {
  if (chars <= 0) return 'none';
  if (chars < 70) return '<70';
  if (chars <= 160) return '70-160';
  return '160+';
}

export interface Note { id: NoteId; text: string }

export function buildNotes(opts: {
  title: string;
  desc: string;
  titleCut: boolean;
  descCut: boolean;
  titleLastWords: string;
  descLastWords: string;
}): Note[] {
  const out: Note[] = [];
  if (opts.titleCut && opts.titleLastWords) {
    out.push({ id: 'title_cut', text: `The end of your title may be cut: '…${opts.titleLastWords}'. Put the main words first.` });
  } else if (opts.titleCut) {
    out.push({ id: 'title_cut', text: 'The end of your title may be cut. Put the main words first.' });
  }
  if (!opts.desc) {
    out.push({ id: 'empty_desc', text: 'No meta description, so Google will pick text from the page.' });
  } else if (opts.descCut && opts.descLastWords) {
    out.push({ id: 'desc_cut', text: `Google may cut your description after '${opts.descLastWords}'.` });
  } else if (opts.descCut) {
    out.push({ id: 'desc_cut', text: 'Google may cut your description to fit the screen.' });
  }
  const letterCount = opts.title.replace(/\s/g, '').length;
  if (opts.title && letterCount > 0 && letterCount < 10) {
    out.push({ id: 'short_title', text: 'A very short title gives Google little to show, and it may rewrite it.' });
  }
  const rep = repeatedWord(opts.title);
  if (rep) {
    out.push({ id: 'repeat_word', text: `'${rep.word}' appears ${rep.n} times. Repeated words read as keyword stuffing.` });
  }
  if (isAllCaps(opts.title)) {
    out.push({ id: 'all_caps', text: 'All-caps titles are harder to read in results.' });
  }
  if (hasNonLatin(opts.title) || hasNonLatin(opts.desc)) {
    out.push({ id: 'non_latin', text: 'Width for non-Latin text is a rough guess.' });
  }
  return out;
}

export function cutoffsReady(): boolean {
  return TITLE_CUTOFF_DESKTOP_PX != null && TITLE_WARN_DESKTOP_PX != null && !!CUTOFF_MEASURED_ON;
}

export function formatMeasuredLine(): string {
  return CUTOFF_MEASURED_LINE;
}

export function limitHit(kind: 'title' | 'desc', len: number): string | null {
  if (kind === 'title' && len > MAX_TITLE) return `Titles stop at ${MAX_TITLE} characters.`;
  if (kind === 'desc' && len > MAX_DESC) return `Descriptions stop at ${MAX_DESC} characters.`;
  return null;
}
