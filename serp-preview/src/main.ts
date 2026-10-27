/* SERP preview: runs in the browser only. Nothing typed here is sent or stored. */
import {
  DESC_BOX_WIDTH_PX, FONT_DESC, FONT_TITLE, MAX_DESC, MAX_TITLE, TITLE_CUTOFF_DESKTOP_PX, TITLE_WARN_DESKTOP_PX,
  buildNotes, copyTags, descBucket, descOverflow, formatMeasuredLine, prepareDesc, prepareTitle, titlePxBucket,
  truncateToPx, type NoteId,
} from './core';

const TOOL = 'serp-preview';
/* No analytics in this copy: cap() is a no-op hook you can wire to your own tracking. */
const cap = (_event: string, _props: Record<string, unknown> = {}): void => {};

const root = document.querySelector<HTMLElement>('[data-sp]');
if (root) {
  const start = () => init(root);
  if (document.fonts?.ready) void document.fonts.ready.then(start).catch(start);
  else start();
}

function measureFactory(): (text: string, font: string) => number {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  return (text, font) => {
    if (!ctx) return text.length * 8;
    ctx.font = font;
    return ctx.measureText(text).width;
  };
}

function init(root: HTMLElement) {
  const q = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const titleIn = q<HTMLInputElement>('[data-sp-title]');
  const descIn = q<HTMLTextAreaElement>('[data-sp-desc]');
  const urlIn = q<HTMLInputElement>('[data-sp-url]');
  const siteIn = q<HTMLInputElement>('[data-sp-site]');
  const result = q<HTMLElement>('[data-sp-result]');
  const cta = q<HTMLElement>('[data-sp-card-cta]');
  const scaleHost = q<HTMLElement>('[data-sp-scale]');
  const scaleInner = q<HTMLElement>('[data-sp-scale-inner]');
  const measure = measureFactory();
  let started = false;
  let lastErr = '';
  let lastChecked = '';
  let lastCheckedAt = 0;
  let debounce: ReturnType<typeof setTimeout> | null = null;
  let copyPayload = '';
  let pendingProps: Record<string, unknown> | null = null;

  cap('tool_viewed');

  const setErr = (el: HTMLElement, box: Element | null, msg: string) => {
    if (box) box.textContent = msg;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
  };
  const err = (type: string) => { if (type !== lastErr) { lastErr = type; cap('tool_error', { error_type: type }); } };

  const fitScale = () => {
    if (!scaleHost || !scaleInner) return;
    const avail = scaleHost.clientWidth;
    // Scale against the full card outer width (652px text + padding/border), not the text column alone.
    scaleInner.style.setProperty('--sp-scale', '1');
    const naturalW = scaleInner.offsetWidth || DESC_BOX_WIDTH_PX;
    const naturalH = scaleInner.offsetHeight;
    const scale = avail > 0 ? Math.min(1, avail / naturalW) : 1;
    scaleInner.style.setProperty('--sp-scale', String(scale));
    scaleHost.style.height = `${Math.ceil(naturalH * scale)}px`;
  };

  const flushChecked = () => {
    if (!pendingProps) return;
    const now = Date.now();
    if (now - lastCheckedAt < 10_000) return;
    const key = JSON.stringify(pendingProps);
    if (key === lastChecked) return;
    lastChecked = key;
    lastCheckedAt = now;
    cap('tool_checked', pendingProps);
    pendingProps = null;
  };

  const run = () => {
    let title = prepareTitle(titleIn.value);
    let desc = prepareDesc(descIn.value);
    if (title.length > MAX_TITLE) {
      title = title.slice(0, MAX_TITLE);
      titleIn.value = title;
      err('title_limit');
      setErr(titleIn, root.querySelector('[data-sp-err="title"]'), `Titles stop at ${MAX_TITLE} characters.`);
    } else setErr(titleIn, root.querySelector('[data-sp-err="title"]'), '');
    if (desc.length > MAX_DESC) {
      desc = desc.slice(0, MAX_DESC);
      descIn.value = desc;
      err('desc_limit');
      setErr(descIn, root.querySelector('[data-sp-err="desc"]'), `Descriptions stop at ${MAX_DESC} characters.`);
    } else setErr(descIn, root.querySelector('[data-sp-err="desc"]'), '');

    if (!started && title.trim()) { started = true; cap('tool_started'); }

    if (!title.trim()) {
      result.hidden = true; cta.hidden = true; copyPayload = ''; pendingProps = null;
      return;
    }
    lastErr = '';

    const titlePx = measure(title, FONT_TITLE);
    const tTrunc = truncateToPx(title, TITLE_CUTOFF_DESKTOP_PX, FONT_TITLE, measure);
    const dOver = desc ? descOverflow(desc, measure) : { cut: false, lastWords: '' };

    const siteOut = q('[data-sp-site-out]');
    const site = siteIn.value.trim();
    if (site) { siteOut.hidden = false; siteOut.textContent = site; }
    else { siteOut.hidden = true; siteOut.textContent = ''; }
    q('[data-sp-url-out]').textContent = urlIn.value.trim() || 'example.com › page';
    q('[data-sp-title-out]').textContent = tTrunc.shown;
    const descOut = q('[data-sp-desc-out]');
    descOut.textContent = desc;
    descOut.hidden = !desc;

    q('[data-sp-cutoff]').textContent = formatMeasuredLine();

    q('[data-sp-title-readout]').textContent =
      `Title: ${Math.round(titlePx)}px of about ${TITLE_WARN_DESKTOP_PX}px, ${title.length} characters.`;
    q('[data-sp-desc-readout]').textContent = desc
      ? (dOver.cut
        ? `Description: overflows the two-line preview, ${desc.length} characters.`
        : `Description: fits the two-line preview, ${desc.length} characters.`)
      : 'Description: none entered.';

    const notes = buildNotes({
      title, desc, titleCut: tTrunc.cut, descCut: dOver.cut,
      titleLastWords: tTrunc.lastWords, descLastWords: dOver.lastWords,
    });
    const ul = q('[data-sp-notes]');
    ul.replaceChildren(...notes.map((n) => {
      const li = document.createElement('li');
      li.textContent = n.text;
      return li;
    }));

    result.hidden = false; cta.hidden = false;
    copyPayload = copyTags(title, desc);
    requestAnimationFrame(fitScale);

    const noteIds = notes.map((n) => n.id) as NoteId[];
    pendingProps = {
      title_px_bucket: titlePxBucket(titlePx, TITLE_CUTOFF_DESKTOP_PX),
      desc_bucket: descBucket(desc.length),
      title_cut: tTrunc.cut,
      desc_cut: dOver.cut,
      notes: noteIds,
    };
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(flushChecked, 1500);
  };

  root.addEventListener('input', run);

  q('[data-sp-copy]').addEventListener('click', async () => {
    if (!copyPayload) return;
    try {
      await navigator.clipboard.writeText(copyPayload);
      q('[data-sp-copied]').textContent = 'Copied.';
      cap('tool_completed', { action: 'copy' });
    } catch {
      q('[data-sp-copied]').textContent = 'Couldn’t copy. Select the tags and copy them yourself.';
    }
  });

  document.querySelectorAll<HTMLAnchorElement>('[data-sp-cta]').forEach((el) => {
    el.addEventListener('click', () => cap('cta_clicked', { placement: el.dataset.spCta }));
  });

  window.addEventListener('resize', fitScale);
  if (typeof ResizeObserver !== 'undefined' && scaleHost) {
    new ResizeObserver(fitScale).observe(scaleHost);
  }
}
