/* Sales funnel calculator: runs in the browser only. Nothing typed here is sent or stored. */
import { EXAMPLE, WEEKS_PER_MONTH, bookedBucket, fmt, funnel, parseNum, type Field, type ParseErr } from './core';

const TOOL = 'sales-funnel-calculator';
/* No analytics in this copy: cap() is a no-op hook you can wire to your own tracking. */
const cap = (_event: string, _props: Record<string, unknown> = {}): void => {};
const MSG: Record<ParseErr, string> = {
  empty: '', not_number: 'Use a number, like 20 or 2.5.', not_above_zero: 'Use a number above 0.', over_100: 'Use a number up to 100.',
  not_whole: 'Use a whole number.', over_max: 'Use a number up to 1,000.',
};

const root = document.querySelector<HTMLElement>('[data-sfc]');
if (root) init(root);

function init(root: HTMLElement) {
  const q = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const input = (f: Field) => q<HTMLInputElement>(`[data-sf-in="${f}"]`);
  const result = q<HTMLElement>('[data-sf-result]');
  const card = q<HTMLElement>('[data-sf-card]');
  const empty = q<HTMLElement>('[data-sf-empty]');
  const toggle = q<HTMLInputElement>('[data-sf-outreach]');
  const outFields = q<HTMLElement>('[data-sf-outfields]');
  const exLabels = root.querySelectorAll<HTMLElement>('[data-sf-exlabel]');
  let exampleUsed = false, lastKey = '', lastAt = 0;

  cap('tool_viewed');

  const week = () => root.querySelector<HTMLInputElement>('[data-sf-per]:checked')?.value === 'week';
  const setErr = (f: Field, text: string) => {
    q(`[data-sf-err="${f}"]`).textContent = text;
    input(f).setAttribute('aria-invalid', text ? 'true' : 'false');
  };
  const showEx = (on: boolean) => exLabels.forEach((el) => { el.hidden = !on; });

  root.addEventListener('input', (e) => {
    const t = e.target as HTMLElement;
    if (t.matches('[data-sf-in]') && exampleUsed) { exampleUsed = false; showEx(false); }
    run();
  });
  root.addEventListener('change', (e) => { if ((e.target as HTMLElement).matches('[data-sf-per], [data-sf-outreach]')) run(); });
  q('[data-sf-example]').addEventListener('click', () => {
    (Object.keys(EXAMPLE) as Field[]).forEach((f) => { input(f).value = EXAMPLE[f]; });
    toggle.checked = true;
    exampleUsed = true; showEx(true);
    run();
  });
  document.querySelectorAll<HTMLAnchorElement>('[data-sf-cta]').forEach((el) => el.addEventListener('click', () => cap('cta_clicked', { placement: el.dataset.sfCta })));

  function row(text: string, n: number, label: string) {
    const li = document.createElement('li');
    li.className = 'sf-step';
    const top = document.createElement('p');
    top.className = 'sf-step-n';
    top.append(Object.assign(document.createElement('b'), { textContent: fmt(n) }), ` ${label}`);
    const f = Object.assign(document.createElement('p'), { className: 'tl-note sf-formula', textContent: text });
    li.append(top, f);
    return li;
  }

  function run() {
    const outreach = toggle.checked;
    outFields.hidden = !outreach;
    const fields: Field[] = outreach ? ['customers', 'close', 'show', 'reply', 'booked'] : ['customers', 'close', 'show'];
    if (!outreach) { setErr('reply', ''); setErr('booked', ''); }
    const parsed = {} as Record<Field, ReturnType<typeof parseNum>>;
    for (const f of fields) {
      const p = parseNum(input(f).value, f === 'customers' ? { whole: true, max: 1000 } : { pct: true });
      parsed[f] = p;
      setErr(f, !p.ok ? MSG[p.err] : '');
    }
    const prompt = q('[data-sf-prompt]');
    const hide = () => { result.hidden = true; card.hidden = true; empty.hidden = false; };
    if (fields.some((f) => !parsed[f].ok)) {
      const missing = fields.some((f) => !parsed[f].ok && (parsed[f] as { err: ParseErr }).err === 'empty');
      prompt.textContent = missing ? (outreach ? 'Add your goal, close rate, show rate, reply rate and booked rate to see the math.' : 'Add your close rate and show rate to see the math.') : '';
      return hide();
    }
    prompt.textContent = '';
    const n = (f: Field) => (parsed[f] as { ok: true; n: number }).n;
    const per = week() ? 'week' : 'month';
    const goalRaw = n('customers');
    const goal = week() ? goalRaw / WEEKS_PER_MONTH : goalRaw;
    const fu = funnel(goal, n('close'), n('show'), outreach ? { replyPct: n('reply'), bookedPct: n('booked') } : undefined);
    const goalTxt = fmt(Math.round(goal * 100) / 100);

    q('[data-sf-head]').textContent = `You need about ${fmt(fu.booked)} booked demos a ${per} to win ${goalTxt} customer${goal === 1 ? '' : 's'}.`;
    q('[data-sf-weeknote]').textContent = week() ? `Per week: ${fmt(goalRaw)} customers a month ÷ ${WEEKS_PER_MONTH} weeks = ${goalTxt} a week.` : '';
    const rows: HTMLElement[] = [];
    if (outreach) {
      rows.push(row(`${fmt(fu.replies!)} replies ÷ ${fmt(n('reply'))}% reply rate = ${fmt(fu.contacts!)} people to contact`, fu.contacts!, `people to contact a ${per}`));
      rows.push(row(`${fmt(fu.booked)} demos booked ÷ ${fmt(n('booked'))}% booked from replies = ${fmt(fu.replies!)} replies`, fu.replies!, `replies a ${per}`));
    }
    rows.push(row(`${fmt(fu.held)} demos held ÷ ${fmt(n('show'))}% show rate = ${fmt(fu.booked)} demos booked`, fu.booked, `demos booked a ${per}`));
    rows.push(row(`${goalTxt} customers ÷ ${fmt(n('close'))}% close rate = ${fmt(fu.held)} demos held`, fu.held, `demos held a ${per}`));
    rows.push(row(`Your goal for the ${per}`, Math.round(goal * 100) / 100, `customers a ${per}`));
    q('[data-sf-funnel]').replaceChildren(...rows);
    q('[data-sf-lost]').textContent = `${fmt(fu.booked - fu.held)}`;
    q('[data-sf-big]').hidden = !Math.max(fu.held, fu.booked, fu.replies ?? 0, fu.contacts ?? 0) || Math.max(fu.held, fu.booked, fu.replies ?? 0, fu.contacts ?? 0) <= 1_000_000;

    result.hidden = false; card.hidden = false; empty.hidden = true;

    const props = { period: per, outreach_on: outreach, example_used: exampleUsed, demos_booked_bucket: bookedBucket(fu.booked) };
    const key = JSON.stringify([props, fields.map((f) => n(f))]);
    const now = Date.now();
    if (key !== lastKey || now - lastAt > 2000) cap('tool_checked', props);
    lastKey = key; lastAt = now;
  }
  run();
}
