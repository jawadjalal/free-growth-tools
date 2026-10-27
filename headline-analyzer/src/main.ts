/* Headline analyzer: runs in the browser only. Nothing typed here is sent or stored. */
import {
  check, passedLine, HEADLINE_ANALYZER_CONFIG as CFG, graphemeCount, type Check, type Format, type Result,
} from './core';

const TOOL = 'headline-analyzer';
/* No analytics in this copy: cap() is a no-op hook you can wire to your own tracking. */
const cap = (_event: string, _props: Record<string, unknown> = {}): void => {};

const MARKS: Record<Check['state'], string> = {
  fine: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="9" fill="currentColor"/><path d="m6 10.2 2.6 2.6L14 7.4" fill="none" stroke="var(--paper)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  look: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="8.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 5.8v5.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="14" r="1.2" fill="currentColor"/></svg>',
  skipped: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="8.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6.5 10h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
};

const root = document.querySelector<HTMLElement>('[data-ha]');
if (root) init(root);

function init(root: HTMLElement) {
  const q = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const input = q<HTMLTextAreaElement>('[data-ha-text]');
  const format = q<HTMLSelectElement>('[data-ha-format]');
  const counter = q<HTMLElement>('[data-ha-count]');
  const msg = q<HTMLElement>('[data-ha-msg]');
  const go = q<HTMLButtonElement>('[data-ha-go]');
  const goHint = q<HTMLElement>('[data-ha-go-hint]');
  const result = q<HTMLElement>('[data-ha-result]');
  const card = q<HTMLElement>('[data-ha-card]');
  const replay = q<HTMLElement>('[data-ha-replay]');

  let started = false, live = false, lastKey = '', lastAt = 0, timer = 0;
  let last: Result | null = null;

  cap('tool_viewed');

  const fmt = (): Format => {
    const v = format.value;
    return (v === 'x' || v === 'email' || v === 'video' || v === 'blog') ? v : 'blog';
  };

  function setCount() {
    const n = graphemeCount(input.value);
    counter.textContent = `${n} / ${CFG.maxChars}`;
    if (n >= CFG.maxChars) input.value = [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(input.value)]
      .slice(0, CFG.maxChars).map((s) => s.segment).join('');
  }

  function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '') {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function item(c: Check) {
    const li = el('li', `ha-check is-${c.state}`);
    const head = el('div', 'ha-check-head');
    const mark = el('span', 'tl-mark');
    mark.innerHTML = MARKS[c.state];
    head.append(
      mark,
      el('b', 'ha-check-name', c.name),
      el('span', 'ha-state', c.state === 'look' ? 'Worth a look' : c.state === 'fine' ? 'Looks fine' : 'Skipped'),
    );
    li.append(head, el('p', 'ha-found', c.found));
    if (c.marks?.length) {
      const m = el('p', 'ha-marks');
      c.marks.forEach((t, i) => { if (i) m.append(' '); m.append(el('mark', '', t)); });
      li.append(m);
    }
    if (c.fix && c.state === 'look') li.append(Object.assign(el('p', 'ha-fix'), { textContent: `Fix: ${c.fix}` }));
    else if (c.note) li.append(el('p', 'ha-fix', c.note));
    const rule = el('p', 'ha-rule', `Rule: ${c.rule} `);
    if (c.source.href) {
      const a = Object.assign(el('a', '', c.source.label), { href: c.source.href });
      if (/^https?:/.test(c.source.href)) a.rel = 'noopener';
      rule.append('(', a, ')');
    } else {
      rule.append('(', document.createTextNode(c.source.label), ')');
    }
    li.append(rule);
    return li;
  }

  function renderReplay(text: string, marks: string[]) {
    replay.replaceChildren();
    if (!text) return;
    if (!marks.length) { replay.textContent = text; return; }
    // Build a case-insensitive highlighter without innerHTML.
    const lower = text.toLowerCase();
    const ranges: { start: number; end: number }[] = [];
    for (const m of marks) {
      const needle = m.toLowerCase();
      if (!needle) continue;
      let from = 0;
      while (from < lower.length) {
        const i = lower.indexOf(needle, from);
        if (i < 0) break;
        ranges.push({ start: i, end: i + needle.length });
        from = i + needle.length;
      }
    }
    ranges.sort((a, b) => a.start - b.start || b.end - a.end);
    const merged: { start: number; end: number }[] = [];
    for (const r of ranges) {
      const lastR = merged[merged.length - 1];
      if (lastR && r.start <= lastR.end) lastR.end = Math.max(lastR.end, r.end);
      else merged.push({ ...r });
    }
    let cursor = 0;
    for (const r of merged) {
      if (r.start > cursor) replay.append(document.createTextNode(text.slice(cursor, r.start)));
      replay.append(el('mark', '', text.slice(r.start, r.end)));
      cursor = r.end;
    }
    if (cursor < text.length) replay.append(document.createTextNode(text.slice(cursor)));
  }

  function run() {
    const v = input.value;
    const trimmed = v.trim();
    go.disabled = !trimmed;
    goHint.hidden = !!trimmed;
    if (!trimmed) {
      msg.textContent = started ? 'Paste a headline to check it.' : '';
      result.hidden = true; card.hidden = true; last = null;
      return;
    }
    msg.textContent = '';
    if (!live) return;
    const r = check({ text: v, format: fmt() });
    q('[data-ha-numbers]').textContent = passedLine(r);
    const order = { look: 0, fine: 1, skipped: 2 } as const;
    q('[data-ha-checks]').replaceChildren(...[...r.checks].sort((a, b) => order[a.state] - order[b.state]).map(item));
    renderReplay(v.trim(), r.highlights);
    result.hidden = false; card.hidden = false;
    last = r;

    const props = {
      format: fmt(),
      length_chars: r.chars,
      checks_passed: r.passed,
    };
    const key = JSON.stringify(props) + '|' + v.trim();
    const now = Date.now();
    // Same headline re-run: no duplicate events within 2s.
    if (key !== lastKey || now - lastAt >= 2000) {
      lastKey = key;
      lastAt = now;
      // Never send the headline text.
      cap('tool_checked', props);
    }
  }

  const schedule = () => { clearTimeout(timer); timer = window.setTimeout(run, 280); };
  input.addEventListener('input', () => {
    if (!started && input.value.trim()) { started = true; }
    setCount();
    go.disabled = !input.value.trim();
    goHint.hidden = !!input.value.trim();
    if (live) schedule();
    else if (!input.value.trim()) msg.textContent = started ? 'Paste a headline to check it.' : '';
  });
  format.addEventListener('change', () => { if (live) run(); });
  go.addEventListener('click', () => {
    if (!input.value.trim()) return;
    live = true;
    run();
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  q('[data-ha-copy]').addEventListener('click', async () => {
    if (!last) return;
    try {
      await navigator.clipboard.writeText(last.summary);
      q('[data-ha-copied]').textContent = 'Copied.';
    } catch {
      q('[data-ha-copied]').textContent = 'Couldn’t copy. Select the report and copy it yourself.';
    }
  });
  document.querySelectorAll<HTMLAnchorElement>('[data-ha-cta]').forEach((a) =>
    a.addEventListener('click', () => cap('cta_clicked', { placement: a.dataset.haCta })));
  setCount();
}
