/* Cold email checker: runs in the browser only. Nothing typed here is sent or stored. */
import {
  check, numbersLine, wordsBucket, gradeBucket, flagsBucket, COLD_EMAIL_CHECKER_CONFIG as CFG, type Check, type Result,
} from './core';

const TOOL = 'cold-email-checker';
/* No analytics in this copy: cap() is a no-op hook you can wire to your own tracking. */
const cap = (_event: string, _props: Record<string, unknown> = {}): void => {};

/* Each check's state is led by its drawn mark: an ink tick (looks fine), an orange ring with a bar (worth a look) or a
   grey ring with a dash (skipped). The words beside it carry the meaning on their own. */
const MARKS: Record<Check['state'], string> = {
  fine: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="9" fill="currentColor"/><path d="m6 10.2 2.6 2.6L14 7.4" fill="none" stroke="var(--paper)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  look: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="8.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 5.8v5.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="14" r="1.2" fill="currentColor"/></svg>',
  skipped: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="8.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6.5 10h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
};

const root = document.querySelector<HTMLElement>('[data-cec]');
if (root) init(root);

function init(root: HTMLElement) {
  const q = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const subject = q<HTMLInputElement>('[data-ce-subject]');
  const subjectWrap = q<HTMLElement>('[data-ce-subject-wrap]');
  const body = q<HTMLTextAreaElement>('[data-ce-body]');
  const msg = q<HTMLElement>('[data-ce-msg]');
  const go = q<HTMLButtonElement>('[data-ce-go]');
  const goHint = q<HTMLElement>('[data-ce-go-hint]');
  const sigWrap = q<HTMLElement>('[data-ce-sig-wrap]');
  const sig = q<HTMLInputElement>('[data-ce-sig]');
  const result = q<HTMLElement>('[data-ce-result]');
  const card = q<HTMLElement>('[data-ce-card]');
  const types = [...root.querySelectorAll<HTMLInputElement>('[data-ce-type]')];

  let started = false, live = false, lastErr = '', lastChecked = '', timer = 0;
  let last: Result | null = null;
  const everFlagged = new Set<string>();
  const fixedSent = new Set<string>();

  cap('tool_viewed');
  const followUp = () => types.find((t) => t.checked)?.value === 'follow-up';
  const err = (type: string) => { if (type && type !== lastErr) cap('tool_error', { error_type: type }); lastErr = type; };

  const setMsg = () => {
    const v = body.value;
    const msgs: string[] = [];
    let e = '';
    if (!v.trim()) { if (started) { msgs.push('Paste an email to check it.'); e = 'empty'; } }
    else if (v.length >= CFG.maxBodyChars) { msgs.push(`This checker is for one email at a time, so it stops at ${CFG.maxBodyChars.toLocaleString('en-US')} characters.`); e = 'too_long'; }
    msg.textContent = msgs.join(' ');
    return e;
  };

  function run() {
    const v = body.value;
    go.disabled = !v.trim();
    goHint.hidden = !!v.trim();
    let e = setMsg();
    if (!v.trim()) { result.hidden = true; card.hidden = true; last = null; err(e); return; }
    if (!live) { err(e); return; }
    const r = check({ subject: subject.value, body: v, followUp: followUp(), includeSignature: sig.checked });
    if (!e && r.gradeSkip === 'too_short') e = 'too_short';
    if (!e && r.gradeSkip === 'non_english') e = 'non_english';
    err(e);
    render(r);

    const flagged = r.checks.filter((c) => c.state === 'look').map((c) => c.id);
    // a check that was flagged earlier and now looks fine after an edit
    for (const c of r.checks) {
      if (c.state === 'look') everFlagged.add(c.id);
      else if (c.state === 'fine' && everFlagged.has(c.id) && !fixedSent.has(c.id)) { fixedSent.add(c.id); cap('tool_completed', { action: 'fixed' }); }
    }
    const props = {
      words_bucket: wordsBucket(r.words), grade_bucket: gradeBucket(r.grade), flags_bucket: flagsBucket(flagged.length),
      flagged_checks: flagged, has_subject: !!subject.value.trim(), email_type: followUp() ? 'follow-up' : 'first',
    };
    const key = JSON.stringify(props);
    if (key !== lastChecked) { lastChecked = key; cap('tool_checked', props); }
    last = r;
  }

  function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '') {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function item(c: Check) {
    const li = el('li', `ce-check is-${c.state}`);
    const head = el('div', 'ce-check-head');
    const mark = el('span', 'tl-mark');
    mark.innerHTML = MARKS[c.state];
    head.append(mark, el('b', 'ce-check-name', c.name), el('span', 'ce-state', c.state === 'look' ? 'Worth a look' : c.state === 'fine' ? 'Looks fine' : 'Skipped'));
    li.append(head, el('p', 'ce-found', c.found));
    if (c.marks?.length) {
      const m = el('p', 'ce-marks');
      c.marks.forEach((t, i) => { if (i) m.append(' '); m.append(el('mark', '', t)); });
      li.append(m);
    }
    if (c.fix && c.state === 'look') li.append(Object.assign(el('p', 'ce-fix'), { textContent: `Fix: ${c.fix}` }));
    else if (c.note) li.append(el('p', 'ce-fix', c.note));
    const rule = el('p', 'ce-rule', `Rule: ${c.rule} `);
    const a = Object.assign(el('a', '', c.source.label), { href: c.source.href });
    if (/^https?:/.test(c.source.href)) a.rel = 'noopener';
    rule.append('(', a, ')');
    li.append(rule);
    return li;
  }

  function render(r: Result) {
    q('[data-ce-numbers]').textContent = numbersLine(r);
    const notes: string[] = [];
    if (r.strippedQuoted) notes.push('We left out quoted thread lines before counting.');
    q('[data-ce-notes]').textContent = notes.join(' ');
    sigWrap.hidden = r.signatureLines === 0 && !sig.checked;
    q('[data-ce-sig-text]').textContent = `We ignored what looks like your signature (${r.signatureLines} line${r.signatureLines === 1 ? '' : 's'}). Include it`;
    // flagged first, then fine, then skipped
    const order = { look: 0, fine: 1, skipped: 2 } as const;
    q('[data-ce-checks]').replaceChildren(...[...r.checks].sort((a, b) => order[a.state] - order[b.state]).map(item));
    result.hidden = false; card.hidden = false;
  }

  const schedule = () => { clearTimeout(timer); timer = window.setTimeout(run, 300); };
  body.addEventListener('input', () => {
    if (!started && body.value.trim()) { started = true; cap('tool_started'); }
    go.disabled = !body.value.trim(); goHint.hidden = !!body.value.trim();
    schedule();
  });
  subject.addEventListener('input', schedule);
  sig.addEventListener('change', run);
  types.forEach((t) => t.addEventListener('change', () => { subjectWrap.classList.toggle('is-off', followUp()); run(); }));
  go.addEventListener('click', () => { if (!body.value.trim()) return; live = true; run(); result.scrollIntoView({ behavior: 'smooth', block: 'start' }); });

  q('[data-ce-copy]').addEventListener('click', async () => {
    if (!last) return;
    try { await navigator.clipboard.writeText(last.summary); q('[data-ce-copied]').textContent = 'Copied.'; cap('tool_completed', { action: 'copy' }); }
    catch { q('[data-ce-copied]').textContent = 'Couldn’t copy. Select the report and copy it yourself.'; }
  });
  document.querySelectorAll<HTMLAnchorElement>('[data-ce-cta]').forEach((a) => a.addEventListener('click', () => cap('cta_clicked', { placement: a.dataset.ceCta })));
}
