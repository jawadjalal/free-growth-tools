/* Pure maths for the sales funnel calculator. No DOM, no network, no benchmarks: the founder brings every rate.
   Each step rounds up (Math.ceil) so the plan never falls short. */
export const CHECKED = '2026-10-27';
export const WEEKS_PER_MONTH = 4.33;
export const EXAMPLE = { customers: '5', close: '20', show: '80', reply: '3', booked: '40' } as const;

export type Field = 'customers' | 'close' | 'show' | 'reply' | 'booked';
export type ParseErr = 'empty' | 'not_number' | 'not_above_zero' | 'over_100' | 'not_whole' | 'over_max';
export type Parsed = { ok: true; n: number } | { ok: false; err: ParseErr };

/* accepts "2.5", "2,5", "20%" and "1,000" (a comma followed by exactly three digits is a thousands separator) */
export function parseNum(raw: string, opts: { pct?: boolean; whole?: boolean; max?: number } = {}): Parsed {
  let s = raw.trim().replace(/%/g, '').replace(/\s+/g, '');
  if (!s) return { ok: false, err: 'empty' };
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
  else s = s.replace(',', '.');
  if (!/^-?\d*\.?\d+$/.test(s)) return { ok: false, err: 'not_number' };
  const n = Number(s);
  if (!Number.isFinite(n)) return { ok: false, err: 'not_number' };
  if (n <= 0) return { ok: false, err: 'not_above_zero' };
  if (opts.pct && n > 100) return { ok: false, err: 'over_100' };
  if (opts.whole && !Number.isInteger(n)) return { ok: false, err: 'not_whole' };
  if (opts.max && n > opts.max) return { ok: false, err: 'over_max' };
  return { ok: true, n };
}

/* ceil with a tiny tolerance so 5 / 0.2 = 25 stays 25, not 26 from float noise */
export const up = (x: number) => Math.ceil(x - 1e-9);

export type Funnel = { goal: number; held: number; booked: number; replies: number | null; contacts: number | null };
export function funnel(goal: number, closePct: number, showPct: number, outreach?: { replyPct: number; bookedPct: number }): Funnel {
  const held = up(goal / (closePct / 100));
  const booked = up(held / (showPct / 100));
  if (!outreach) return { goal, held, booked, replies: null, contacts: null };
  const replies = up(booked / (outreach.bookedPct / 100));
  const contacts = up(replies / (outreach.replyPct / 100));
  return { goal, held, booked, replies, contacts };
}

export const bookedBucket = (n: number) => (n <= 10 ? '1-10' : n <= 50 ? '11-50' : n <= 200 ? '51-200' : '200+');
export const fmt = (n: number) => n.toLocaleString('en-GB', { maximumFractionDigits: 2 });
