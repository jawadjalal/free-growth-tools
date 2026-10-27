/* UTM builder: the pure logic (no DOM). The page and the script read from here, so the presets,
   Google's rules and the wording live in one place. Rules quoted only from the two Google Analytics Help pages below,
   checked on CHECKED. */

export const CHECKED = '2026-10-25';
export const CHECKED_LABEL = '25 October 2026';
export const URL_BUILDERS = 'https://support.google.com/analytics/answer/10917952';
export const URL_CHANNELS = 'https://support.google.com/analytics/answer/9756891';
export const SRC_BUILDERS = 'Google Analytics Help, “URL builders: Collect campaign data with custom URLs”';
export const SRC_CHANNELS = 'Google Analytics Help, “[GA4] Default channel group”';

export const MAX_URL = 2000;
export const MAX_TAG = 100;
export const MAX_ROWS = 200;
export const LONG_LINK = 2000;
export const QR_DENSE = 1000;

export type Channel = 'organic_social' | 'email' | 'referral' | 'unassigned_risk';
export const CHANNEL_LABEL: Record<Exclude<Channel, 'unassigned_risk'>, string> = {
  organic_social: 'Organic Social', email: 'Email', referral: 'Referral',
};

export type PresetId = 'x' | 'linkedin' | 'newsletter' | 'cold-email' | 'producthunt';
export const PRESETS: { id: PresetId; label: string; source: string; medium: string; channel: Exclude<Channel, 'unassigned_risk'> }[] = [
  { id: 'x', label: 'X post', source: 'x', medium: 'social', channel: 'organic_social' },
  { id: 'linkedin', label: 'LinkedIn post', source: 'linkedin', medium: 'social', channel: 'organic_social' },
  { id: 'newsletter', label: 'Newsletter', source: 'newsletter', medium: 'email', channel: 'email' },
  { id: 'cold-email', label: 'Cold email', source: 'cold-email', medium: 'email', channel: 'email' },
  { id: 'producthunt', label: 'Product Hunt', source: 'producthunt', medium: 'referral', channel: 'referral' },
];

export const TAGS = ['source', 'medium', 'campaign', 'content', 'term', 'id'] as const;
export type Tag = (typeof TAGS)[number];
export const REQUIRED: Tag[] = ['source', 'medium', 'campaign'];
export type Tags = Partial<Record<Tag, string>>;

/* ---------- Google's default channel rules (manual traffic), in Google's order, as far as tags alone can tell ----------
   Channel definitions aren't case sensitive. Google also matches the source against its own lists of social, search,
   video and shopping sites; we don't copy those lists, so a channel is only claimed when the medium (or, for Email, the
   source or medium) matches. */
const SOCIAL_MEDIUMS = ['social', 'social-network', 'social-media', 'sm', 'social network', 'social media'];
const REFERRAL_MEDIUMS = ['referral', 'app', 'link'];
const EMAIL_WORDS = ['email', 'e-mail', 'e_mail', 'e mail'];
const PAID = /^(.*cp.*|ppc|retargeting|paid.*)$/;
const DISPLAY = ['display', 'banner', 'expandable', 'interstitial', 'cpm'];
const SHOP = /^(.*(([^a-df-z]|^)shop|shopping).*)$/;

export type ChannelResult = { channel: Channel; label: string | null; earlier: boolean };
export function channelOf(t: Tags): ChannelResult {
  const s = (t.source ?? '').trim().toLowerCase();
  const m = (t.medium ?? '').trim().toLowerCase();
  const c = (t.campaign ?? '').trim().toLowerCase();
  // rules Google checks before Organic Social that tags alone can trip: cross-network, paid, display, shopping
  const earlier = c.includes('cross-network') || PAID.test(m) || DISPLAY.includes(m) || SHOP.test(c);
  if (earlier) return { channel: 'unassigned_risk', label: null, earlier: true };
  if (SOCIAL_MEDIUMS.includes(m)) return { channel: 'organic_social', label: CHANNEL_LABEL.organic_social, earlier: false };
  // Organic Video, Organic Search and AI Assistant sit between Organic Social and Referral
  if (m.includes('video') || m === 'organic' || m === 'ai-assistant') return { channel: 'unassigned_risk', label: null, earlier: true };
  if (REFERRAL_MEDIUMS.includes(m)) return { channel: 'referral', label: CHANNEL_LABEL.referral, earlier: false };
  if (EMAIL_WORDS.includes(s) || EMAIL_WORDS.includes(m)) return { channel: 'email', label: CHANNEL_LABEL.email, earlier: false };
  return { channel: 'unassigned_risk', label: null, earlier: false };
}

/* ---------- the URL ---------- */
export type UrlResult = { ok: true; url: URL; schemeAdded: boolean } | { ok: false; error: 'empty' | 'invalid' | 'too_long' };
export function parseUrl(raw: string): UrlResult {
  const v = raw.trim();
  if (!v) return { ok: false, error: 'empty' };
  if (v.length > MAX_URL) return { ok: false, error: 'too_long' };
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(v);
  let url: URL;
  try { url = new URL(hasScheme ? v : `https://${v}`); } catch { return { ok: false, error: 'invalid' }; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { ok: false, error: 'invalid' };
  const host = url.hostname;
  if (!host || !/^([a-z0-9_-]+\.)*[a-z0-9_-]+$|^\[[0-9a-f:.]+\]$/i.test(host) || (!host.includes('.') && host !== 'localhost') || host.startsWith('.') || host.endsWith('.')) return { ok: false, error: 'invalid' };
  return { ok: true, url, schemeAdded: !hasScheme };
}

/** the utm_* tags already in a URL, in order, repeats kept */
export function existingTags(url: URL): { key: string; value: string }[] {
  const out: { key: string; value: string }[] = [];
  url.searchParams.forEach((value, key) => { if (/^utm_/i.test(key)) out.push({ key, value }); });
  return out;
}

/* ---------- warnings ---------- */
export type WarnId = 'mixed_case' | 'spaces' | 'duplicate' | 'missing_tag' | 'special_chars' | 'not_https' | 'long_link' | 'non_latin' | 'inconsistent';
export type Warning = { id: WarnId; text: string; detail?: string[]; fix?: 'lowercase' | 'spaces' };

export const W = {
  mixed_case: 'Meta and meta show up as two separate sources in your reports. Use lowercase.', // shape only; mixedCase() fills in the typed value
  spaces: 'Spaces turn into %20 or +. Use a hyphen.',
  spaces_underscore: 'Spaces turn into %20 or +. Use an underscore.',
  missing_tag: 'Google says to always set source, medium and campaign.',
  special_chars: 'We’ve encoded it, but plain words read better in reports.',
  not_https: 'Use https so tags survive redirects.',
  long_link: 'This link is over 2,000 characters. Some apps may cut it off.',
  too_long: 'Keep the web address under 2,000 characters.',
  non_latin: 'That works, but plain ASCII names (a to z, 0 to 9) read better in reports.',
  inconsistent: 'These look like the same source spelled two ways.',
  invalid: 'That doesn’t look like a web address',
  scheme: 'We added https:// to the start.',
  unassigned: 'This may land in Unassigned.',
  earlier: 'These tags match one of Google’s earlier rules, so this may not land where you expect.',
  qr_dense: 'This link is over 1,000 characters, so the code will be dense and hard to scan. Try a shorter campaign name.',
  qr_note: 'Scan to test before you print.',
};

/** what a field's values are called in the mixed-case warning */
export const TAG_PLURAL: Record<Tag, string> = { source: 'sources', medium: 'mediums', campaign: 'campaigns', content: 'content values', term: 'terms', id: 'campaign IDs' };
/** "<Typed> and <lowercased> show up as two separate <field plural> in your reports. Use lowercase." */
export const mixedCase = (tag: Tag, typed: string) => `${typed} and ${typed.toLowerCase()} show up as two separate ${TAG_PLURAL[tag]} in your reports. Use lowercase.`;

export const landsIn = (r: ChannelResult) => (r.label ? `In GA4 this will most likely show as ${r.label}` : r.earlier ? W.earlier : W.unassigned);

/** sep: the separator picked for the spaces fix (hyphen by default); the spaces warning names it */
export type BuildOpts = { lowercase: boolean; sep?: '-' | '_' };
export type Built = {
  ok: true; link: string; url: URL; tags: Tags; warnings: Warning[]; channel: ChannelResult; schemeAdded: boolean; tagsCount: number;
} | { ok: false; error: 'empty_url' | 'invalid_url' | 'too_long_url' | 'missing_tag'; missing?: Tag[]; warnings: Warning[]; schemeAdded?: boolean };

const clean = (v: string | undefined) => (v ?? '').trim();

/** build one tagged link. Tags are taken as typed (trimmed); lowercase applies to the output when on. */
export function build(rawUrl: string, rawTags: Tags, opts: BuildOpts): Built {
  const pu = parseUrl(rawUrl);
  if (!pu.ok) return { ok: false, error: pu.error === 'empty' ? 'empty_url' : pu.error === 'too_long' ? 'too_long_url' : 'invalid_url', warnings: [] };
  const tags: Tags = {};
  for (const k of TAGS) { const v = clean(rawTags[k]).slice(0, MAX_TAG); if (v) tags[k] = opts.lowercase ? v.toLowerCase() : v; }
  const warnings: Warning[] = [];
  const missing = REQUIRED.filter((k) => !tags[k]);
  if (missing.length) {
    warnings.push({ id: 'missing_tag', text: W.missing_tag, detail: missing.map((k) => `utm_${k}`) });
    return { ok: false, error: 'missing_tag', missing, warnings, schemeAdded: pu.schemeAdded };
  }
  const url = new URL(pu.url.href);
  // duplicates: a utm_* tag already in the URL (or in it twice). Ours replace them.
  const had = existingTags(url);
  if (had.length) {
    const counts = new Map<string, number>();
    had.forEach((h) => counts.set(h.key.toLowerCase(), (counts.get(h.key.toLowerCase()) ?? 0) + 1));
    const detail: string[] = [];
    const seen = new Set<string>();
    for (const h of had) {
      const k = h.key.toLowerCase();
      if (seen.has(`${k}=${h.value}`)) continue;
      seen.add(`${k}=${h.value}`);
      const ours = tags[k.replace(/^utm_/, '') as Tag];
      // the same tag with the same value, once (often because the fields were filled from this URL): nothing changes
      if (ours === h.value && h.key === k && (counts.get(k) ?? 0) === 1) continue;
      detail.push(ours !== undefined
        ? `Your URL already has ${h.key}=${h.value}. We’ll replace it with ${ours}.`
        : `Your URL already has ${h.key}=${h.value}${(counts.get(k) ?? 0) > 1 ? ' more than once' : ''}. We’ll keep it.`);
    }
    const replaced = detail.length > 0 && (had.some((h) => tags[h.key.toLowerCase().replace(/^utm_/, '') as Tag] !== undefined) || [...counts.values()].some((n) => n > 1));
    if (replaced) warnings.push({ id: 'duplicate', text: detail[0], detail: detail.slice(1) });
    // remove every existing key we set (any case), then append ours in a fixed order
    for (const h of had) if (tags[h.key.toLowerCase().replace(/^utm_/, '') as Tag] !== undefined) url.searchParams.delete(h.key);
  }
  for (const k of TAGS) if (tags[k] !== undefined) url.searchParams.set(`utm_${k}`, tags[k]!);
  const values = TAGS.map((k) => tags[k]).filter(Boolean) as string[];
  if (!opts.lowercase) {
    // one warning (one fix button); the first mixed-case field leads, any others follow as detail lines
    const mixed = TAGS.filter((k) => tags[k] && tags[k] !== tags[k]!.toLowerCase()).map((k) => mixedCase(k, tags[k]!));
    if (mixed.length) warnings.push({ id: 'mixed_case', text: mixed[0], detail: mixed.slice(1), fix: 'lowercase' });
  }
  if (values.some((v) => /\s/.test(v))) warnings.push({ id: 'spaces', text: opts.sep === '_' ? W.spaces_underscore : W.spaces, fix: 'spaces' });
  if (values.some((v) => /[&=?#]/.test(v))) warnings.push({ id: 'special_chars', text: W.special_chars });
  if (url.protocol === 'http:') warnings.push({ id: 'not_https', text: W.not_https });
  if (values.some((v) => /[^\x00-\x7F]/.test(v))) warnings.push({ id: 'non_latin', text: W.non_latin });
  const link = url.href;
  if (link.length > LONG_LINK) warnings.push({ id: 'long_link', text: W.long_link });
  return { ok: true, link, url, tags, warnings, channel: channelOf(tags), schemeAdded: pu.schemeAdded, tagsCount: values.length };
}

/** the one-click space fix */
export const fixSpaces = (v: string, sep: '-' | '_') => v.trim().replace(/\s+/g, sep);

/* ---------- bulk ---------- */
export const CSV_HEADER = ['url', 'source', 'medium', 'campaign', 'content', 'term'] as const;
export type Row = { line: number; input: string; built: Built | null; error?: string };
export type Bulk = { rows: Row[]; truncated: boolean; total: number; csv: boolean; headerError?: string; inconsistent: string[][] };

/** split one CSV line, with "quoted, values" */
export function splitCsv(line: string): string[] {
  const out: string[] = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"' && cur.trim() === '') { q = true; cur = ''; }
    else if (ch === ',') { out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

const ERR_TEXT: Record<'empty_url' | 'invalid_url' | 'too_long_url' | 'missing_tag', string> = {
  empty_url: 'No URL on this line.', invalid_url: W.invalid, too_long_url: W.too_long, missing_tag: W.missing_tag,
};

export function buildBulk(text: string, shared: Tags, opts: BuildOpts): Bulk {
  const lines = text.split(/\r?\n/).map((l, i) => ({ line: i + 1, text: l })).filter((l) => l.text.trim() !== '');
  const first = lines[0]?.text.trim().toLowerCase() ?? '';
  const csv = first.startsWith('url,');
  let headerError: string | undefined;
  let body = lines;
  if (csv) {
    const head = splitCsv(lines[0].text).map((h) => h.trim().toLowerCase());
    if (head.length < 4 || head.length > CSV_HEADER.length || head.join(',') !== CSV_HEADER.slice(0, head.length).join(',')) headerError = `Line ${lines[0].line}: the header should be ${CSV_HEADER.join(',')}.`;
    body = lines.slice(1);
  }
  const total = body.length;
  const truncated = total > MAX_ROWS;
  body = body.slice(0, MAX_ROWS);
  const rows: Row[] = body.map(({ line, text: t }) => {
    if (csv) {
      if (headerError) return { line, input: t, built: null, error: `Line ${line}: fix the header on line ${lines[0].line} first.` };
      const cells = splitCsv(t);
      if (cells.length < 4 || cells.length > CSV_HEADER.length) {
        return { line, input: t, built: null, error: `Line ${line} has ${cells.length} column${cells.length === 1 ? '' : 's'}. Use url,source,medium,campaign and optionally content,term.` };
      }
      const [u, source, medium, campaign, content, term] = cells;
      const b = build(u, { source, medium, campaign, content, term }, opts);
      return b.ok ? { line, input: u, built: b } : { line, input: u, built: b, error: `Line ${line}: ${ERR_TEXT[b.error]}` };
    }
    const cells = t.includes(',') ? splitCsv(t) : [];
    if (cells.length >= 3 && parseUrl(cells[0]).ok && !parseUrl(t).ok) {
      return { line, input: t, built: null, error: `Line ${line} looks like CSV. Start with the header ${CSV_HEADER.join(',')}.` };
    }
    const b = build(t, shared, opts);
    return b.ok ? { line, input: t.trim(), built: b } : { line, input: t.trim(), built: b, error: `Line ${line}: ${ERR_TEXT[b.error]}` };
  });
  // the same source spelled two ways (x and twitter, linkedin and linkedin.com, Meta and meta)
  const groups = new Map<string, Set<string>>();
  for (const r of rows) {
    const s = r.built?.ok ? r.built.tags.source : undefined;
    if (!s) continue;
    const k = sourceKey(s);
    if (!groups.has(k)) groups.set(k, new Set());
    groups.get(k)!.add(s);
  }
  const inconsistent = [...groups.values()].filter((g) => g.size > 1).map((g) => [...g]);
  if (inconsistent.length) {
    const bad = new Set(inconsistent.flat());
    for (const r of rows) if (r.built?.ok && bad.has(r.built.tags.source!)) r.built.warnings.push({ id: 'inconsistent', text: W.inconsistent });
  }
  return { rows, truncated, total, csv, headerError, inconsistent };
}

const ALIAS: Record<string, string> = { twitter: 'x', 'x.com': 'x', 't.co': 'x', fb: 'facebook', ig: 'instagram', yt: 'youtube', lnkd: 'linkedin', 'lnkd.in': 'linkedin', 'product-hunt': 'producthunt', 'product hunt': 'producthunt', 'product_hunt': 'producthunt' };
export function sourceKey(s: string): string {
  let k = s.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
  if (ALIAS[k]) return ALIAS[k];
  k = k.replace(/\.(com|co|io|net|org|in|app)$/, '');
  return ALIAS[k] ?? k;
}

/** the CSV the user downloads: good rows only */
export function toCsv(rows: Row[]): string {
  const esc = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const out = ['url,tagged_url,source,medium,campaign,content,term,warnings'];
  for (const r of rows) {
    if (!r.built?.ok) continue;
    const b = r.built;
    out.push([r.input, b.link, b.tags.source ?? '', b.tags.medium ?? '', b.tags.campaign ?? '', b.tags.content ?? '', b.tags.term ?? '', String(b.warnings.length)].map(esc).join(','));
  }
  return out.join('\r\n') + '\r\n';
}

/* ---------- coarse buckets, handy if you add your own analytics (never raw values) ---------- */
export const tagsBucket = (n: number) => (n <= 3 ? '3' : n === 4 ? '4' : '5+');
export const warningsBucket = (n: number) => (n === 0 ? '0' : n === 1 ? '1' : n <= 3 ? '2-3' : '4+');
export const rowsBucket = (n: number) => (n < 10 ? '<10' : n <= 50 ? '10-50' : '51-200');
