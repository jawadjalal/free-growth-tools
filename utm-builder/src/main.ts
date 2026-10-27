/* UTM builder: runs in the browser only. Nothing typed here is sent or stored.
   The QR code uses the qrcode package (MIT), bundled into app.js. */
import {
  PRESETS, TAGS, URL_CHANNELS, W, QR_DENSE, MAX_ROWS, build, buildBulk, existingTags, fixSpaces, landsIn, parseUrl,
  rowsBucket, tagsBucket, toCsv, warningsBucket, type Built, type Bulk, type Tag, type Tags, type Warning,
} from './core';

const TOOL = 'utm-builder';
/* No analytics in this copy: cap() is a no-op hook you can wire to your own tracking. */
const cap = (_event: string, _props: Record<string, unknown> = {}): void => {};

const root = document.querySelector<HTMLElement>('[data-utm]');
if (root) init(root);

function init(root: HTMLElement) {
  const q = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const qa = <T extends HTMLElement>(s: string) => [...root.querySelectorAll<T>(s)];
  const urlIn = q<HTMLInputElement>('[data-ub-url]');
  const listIn = q<HTMLTextAreaElement>('[data-ub-list]');
  const tagIn = (t: Tag) => q<HTMLInputElement>(`[data-ub-tag="${t}"]`);
  const lower = q<HTMLInputElement>('[data-ub-lower]');
  const qrOn = q<HTMLInputElement>('[data-ub-qr]');
  const result = q<HTMLElement>('[data-ub-result]');
  const bulkRes = q<HTMLElement>('[data-ub-bulkres]');
  const empty = q<HTMLElement>('[data-ub-empty]');
  const card = q<HTMLElement>('[data-ub-card]');
  const missingEl = q<HTMLElement>('[data-ub-missing]');

  let started = false, touched = false, lastUrlFilled = '', current: Built | null = null, bulk: Bulk | null = null;
  const errSent = new Set<string>();
  let checkTimer = 0, lastChecked = '';

  cap('tool_viewed');

  const mode = () => (root.querySelector<HTMLInputElement>('[data-ub-mode]:checked')?.value === 'bulk' ? 'bulk' : 'single');
  const sep = () => (root.querySelector<HTMLInputElement>('[data-ub-sep]:checked')?.value === '_' ? '_' : '-') as '-' | '_';
  const presetId = () => root.querySelector<HTMLInputElement>('[data-ub-preset]:checked')?.value ?? 'none';
  const tags = (): Tags => Object.fromEntries(TAGS.map((t) => [t, tagIn(t).value])) as Tags;
  const err = (type: string) => { if (!errSent.has(type)) { errSent.add(type); cap('tool_error', { error_type: type }); } };
  const start = () => { if (!started) { started = true; cap('tool_started'); } };
  const checked = (props: Record<string, unknown>) => {
    const key = JSON.stringify(props);
    window.clearTimeout(checkTimer);
    checkTimer = window.setTimeout(() => { if (key !== lastChecked) { lastChecked = key; cap('tool_checked', props); } }, 900);
  };
  const ids = (ws: Warning[]) => [...new Set(ws.map((w) => w.id))].sort();

  /* presets: picking one fills source and medium; editing them away from a preset marks Custom */
  qa<HTMLInputElement>('[data-ub-preset]').forEach((r) => r.addEventListener('change', () => {
    const p = PRESETS.find((x) => x.id === r.value);
    if (p) { tagIn('source').value = p.source; tagIn('medium').value = p.medium; }
    touched = true;
    run();
  }));
  const syncPreset = () => {
    const s = tagIn('source').value.trim().toLowerCase(), m = tagIn('medium').value.trim().toLowerCase();
    const match = PRESETS.find((p) => p.source === s && p.medium === m);
    const cur = root.querySelector<HTMLInputElement>('[data-ub-preset]:checked');
    if (match) { const el = root.querySelector<HTMLInputElement>(`[data-ub-preset][value="${match.id}"]`); if (el) el.checked = true; }
    else if (cur && (s || m)) { const el = root.querySelector<HTMLInputElement>('[data-ub-preset][value="custom"]'); if (el) el.checked = true; }
  };

  root.addEventListener('input', (e) => {
    const t = e.target as HTMLElement;
    if (t.matches('[data-ub-tag]')) { touched = true; if (t.matches('[data-ub-tag="source"], [data-ub-tag="medium"]')) syncPreset(); }
    if (t === urlIn) fillFromUrl();
    if (t.matches('[data-ub-tag], [data-ub-url], [data-ub-list]')) run();
  });
  root.addEventListener('change', (e) => {
    const t = e.target as HTMLElement;
    if (t.matches('[data-ub-mode], [data-ub-lower], [data-ub-sep], [data-ub-qr]')) run();
  });

  /* a URL that's already a UTM link: its tags go into the empty fields */
  function fillFromUrl() {
    const pu = parseUrl(urlIn.value);
    if (!pu.ok || urlIn.value === lastUrlFilled) return;
    const had = existingTags(pu.url);
    if (!had.length) return;
    lastUrlFilled = urlIn.value;
    for (const h of had) {
      const k = h.key.toLowerCase().replace(/^utm_/, '') as Tag;
      if ((TAGS as readonly string[]).includes(k) && !tagIn(k).value.trim()) tagIn(k).value = h.value;
    }
    syncPreset();
  }

  /* one-click fixes */
  root.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-ub-fix]');
    if (!b) return;
    for (const t of TAGS) {
      const el = tagIn(t);
      el.value = b.dataset.ubFix === 'lowercase' ? el.value.toLowerCase() : fixSpaces(el.value, sep());
    }
    syncPreset();
    run();
  });

  function warnList(ul: HTMLElement, ws: Warning[]) {
    ul.replaceChildren(...ws.map((w) => {
      const li = document.createElement('li');
      const p = document.createElement('p'); p.textContent = w.text; li.append(p);
      for (const d of w.detail ?? []) { const x = document.createElement('p'); x.className = 'ub-detail'; x.textContent = d; li.append(x); }
      if (w.fix) {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'btn btn--paper ub-fix'; btn.dataset.ubFix = w.fix;
        btn.textContent = w.fix === 'lowercase' ? 'Make lowercase' : (sep() === '_' ? 'Use an underscore' : 'Use a hyphen');
        li.append(btn);
      }
      return li;
    }));
  }
  function landsLine(el: HTMLElement, b: Extract<Built, { ok: true }>) {
    const a = document.createElement('a');
    a.href = URL_CHANNELS; a.rel = 'noopener';
    if (b.channel.label) { a.textContent = 'Google’s rule'; el.replaceChildren(`${landsIn(b.channel)} (`, a, ').'); }
    else { a.textContent = 'Google’s default channel rules'; el.replaceChildren(`${landsIn(b.channel)} See `, a, '.'); }
  }
  const showMissing = (missing: Tag[] | undefined) => {
    missingEl.textContent = touched && missing?.length ? `Add ${missing.map((m) => `utm_${m}`).join(', ')}. ${W.missing_tag}` : '';
    if (touched && missing?.length) err('missing_tag');
  };

  function run() {
    const m = mode();
    qa('[data-ub-single]').forEach((el) => { el.hidden = m !== 'single'; });
    qa('[data-ub-bulk]').forEach((el) => { el.hidden = m !== 'bulk'; });
    const csvMode = m === 'bulk' && listIn.value.trimStart().toLowerCase().startsWith('url,');
    qa('[data-ub-tags]').forEach((el) => { el.hidden = csvMode; });
    q('.ub-presets').hidden = csvMode;
    q('[data-ub-csvnote]').hidden = !csvMode;
    if (m === 'single') runSingle(); else runBulk();
  }

  function runSingle() {
    bulkRes.hidden = true; bulk = null;
    const raw = urlIn.value;
    const urlErr = q('[data-ub-err="url"]'), note = q('[data-ub-urlnote]');
    const show = (ok: boolean) => { result.hidden = !ok; empty.hidden = ok; card.hidden = !ok; };
    if (!raw.trim()) { urlErr.textContent = ''; note.textContent = ''; urlIn.setAttribute('aria-invalid', 'false'); current = null; show(false); showMissing(undefined); return; }
    const b = build(raw, tags(), { lowercase: lower.checked, sep: sep() });
    if (!b.ok && (b.error === 'invalid_url' || b.error === 'empty_url' || b.error === 'too_long_url')) {
      urlErr.textContent = b.error === 'too_long_url' ? W.too_long : W.invalid; note.textContent = ''; urlIn.setAttribute('aria-invalid', 'true'); err('invalid_url');
      current = null; show(false); showMissing(undefined); return;
    }
    start();
    urlErr.textContent = ''; urlIn.setAttribute('aria-invalid', 'false');
    note.textContent = b.schemeAdded ? W.scheme : '';
    if (!b.ok) { current = null; show(false); showMissing(b.missing); return; }
    showMissing(undefined);
    current = b; show(true);
    q('[data-ub-link]').textContent = b.link;
    q('[data-ub-copied]').textContent = '';
    landsLine(q('[data-ub-lands]'), b);
    warnList(q('[data-ub-warns]'), b.warnings);
    renderQr(b.link);
    checked({ mode: 'single', preset: presetId(), tags_count: tagsBucket(b.tagsCount), warnings_bucket: warningsBucket(b.warnings.length), warning_types: ids(b.warnings), channel: b.channel.channel });
  }

  function runBulk() {
    result.hidden = true; current = null;
    const listErr = q('[data-ub-err="list"]');
    const text = listIn.value;
    if (!text.trim()) { bulkRes.hidden = true; empty.hidden = false; card.hidden = true; listErr.textContent = ''; showMissing(undefined); bulk = null; return; }
    const res = buildBulk(text, tags(), { lowercase: lower.checked, sep: sep() });
    bulk = res;
    const good = res.rows.filter((r) => r.built?.ok);
    if (res.rows.some((r) => parseUrl(r.input).ok)) start();
    // with a plain list, the shared tags must be set first
    const missing = !res.csv ? (['source', 'medium', 'campaign'] as Tag[]).filter((t) => !tagIn(t).value.trim()) : [];
    if (missing.length) { bulkRes.hidden = true; empty.hidden = false; card.hidden = true; listErr.textContent = ''; touched = touched || res.rows.length > 0; showMissing(missing); return; }
    showMissing(undefined);
    const msgs: string[] = [];
    if (res.headerError) { msgs.push(res.headerError); err('bad_csv'); }
    if (res.rows.some((r) => r.error && /column|looks like CSV/.test(r.error))) err('bad_csv');
    if (res.rows.some((r) => r.built && !r.built.ok && (r.built.error === 'invalid_url' || r.built.error === 'too_long_url'))) err('invalid_url');
    if (res.rows.some((r) => r.built && !r.built.ok && r.built.error === 'missing_tag')) err('missing_tag');
    if (res.truncated) { msgs.push(`You pasted ${res.total} lines. We built the first ${MAX_ROWS}.`); err('too_many_rows'); }
    listErr.textContent = msgs.join(' ');
    bulkRes.hidden = false; empty.hidden = true; card.hidden = !good.length;
    const bad = res.rows.length - good.length;
    q('[data-ub-bsum]').textContent = `${good.length} link${good.length === 1 ? '' : 's'} built${bad ? `, ${bad} line${bad === 1 ? '' : 's'} to fix` : ''}`;
    const notes: Warning[] = res.inconsistent.map((g) => ({ id: 'inconsistent', text: W.inconsistent, detail: [g.join(' and ')] }));
    if (res.truncated) notes.push({ id: 'long_link', text: `Only the first ${MAX_ROWS} lines were built.` });
    warnList(q('[data-ub-bnotes]'), notes);
    q('[data-ub-bcopied]').textContent = '';
    q('[data-ub-rows]').replaceChildren(...res.rows.map((r) => {
      const tr = document.createElement('tr');
      const td = (label: string, text: string, cls = '') => { const c = document.createElement('td'); c.dataset.label = label; if (cls) c.className = cls; c.textContent = text; return c; };
      if (r.built?.ok) {
        const w = r.built.warnings;
        const wt = td('Warnings', w.length ? `${w.length}: ${[...new Set(w.flatMap((x) => (x.id === 'mixed_case' ? [x.text, ...(x.detail ?? [])] : [x.text])))].join(' ')}` : 'None');
        tr.append(td('Line', String(r.line)), td('Tagged link', r.built.link, 'ub-cell-link'), wt);
      } else {
        tr.className = 'is-bad';
        tr.append(td('Line', String(r.line)), td('Input', r.input, 'ub-cell-link'), td('Problem', r.error ?? W.invalid));
      }
      return tr;
    }));
    q<HTMLButtonElement>('[data-ub-copyall]').disabled = !good.length;
    q<HTMLButtonElement>('[data-ub-csv]').disabled = !good.length;
    if (good.length) {
      const all = good.flatMap((r) => (r.built?.ok ? r.built.warnings : []));
      const first = good[0].built as Extract<Built, { ok: true }>;
      const maxTags = Math.max(...good.map((r) => (r.built?.ok ? r.built.tagsCount : 3)));
      checked({ mode: 'bulk', preset: res.csv ? 'none' : presetId(), tags_count: tagsBucket(maxTags), warnings_bucket: warningsBucket(all.length), warning_types: ids(all), rows_bucket: rowsBucket(res.rows.length), channel: first.channel.channel });
    }
  }

  /* copy and download */
  async function copy(text: string, out: HTMLElement, action: string) {
    try { await navigator.clipboard.writeText(text); out.textContent = 'Copied'; cap('tool_completed', { action }); }
    catch { out.textContent = 'Couldn’t copy. Select the link and copy it yourself.'; }
  }
  q('[data-ub-copy]').addEventListener('click', () => { if (current?.ok) copy(current.link, q('[data-ub-copied]'), 'copy'); });
  q('[data-ub-copyall]').addEventListener('click', () => {
    if (!bulk) return;
    const links = bulk.rows.flatMap((r) => (r.built?.ok ? [r.built.link] : []));
    if (links.length) copy(links.join('\n'), q('[data-ub-bcopied]'), 'copy_all');
  });
  const download = (blob: Blob, name: string) => {
    const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = name;
    document.body.append(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  q('[data-ub-csv]').addEventListener('click', () => {
    if (!bulk) return;
    download(new Blob([toCsv(bulk.rows)], { type: 'text/csv;charset=utf-8' }), 'utm-links.csv');
    cap('tool_completed', { action: 'csv' });
  });

  /* QR: single link only, off by default */
  type QR = typeof import('qrcode');
  let qrLib: Promise<QR> | null = null;
  const lib = () => (qrLib ??= import('qrcode').then((m) => ((m as unknown as { default?: QR }).default ?? m) as QR));
  const qrBox = q('[data-ub-qrbox]');
  const canvas = q<HTMLCanvasElement>('[data-ub-canvas]');
  const qrOpts = (link: string) => ({ errorCorrectionLevel: (link.length > 1200 ? 'L' : 'M') as 'L' | 'M', margin: 2 });
  let qrFor = '';
  function renderQr(link: string) {
    qrBox.hidden = !qrOn.checked;
    if (!qrOn.checked) return;
    q('[data-ub-qrdense]').hidden = link.length <= QR_DENSE;
    if (qrFor === link) return;
    qrFor = link;
    lib().then((QRCode) => QRCode.toCanvas(canvas, link, { ...qrOpts(link), width: 240 })).then(() => {
      q('[data-ub-qrnote]').textContent = W.qr_note;
      qa<HTMLButtonElement>('[data-ub-png], [data-ub-svg]').forEach((b) => { b.disabled = false; });
    }).catch(() => {
      q('[data-ub-qrnote]').textContent = 'This link is too long for a QR code. Try a shorter campaign name.';
      qa<HTMLButtonElement>('[data-ub-png], [data-ub-svg]').forEach((b) => { b.disabled = true; });
    });
  }
  q('[data-ub-png]').addEventListener('click', async () => {
    if (!current?.ok) return;
    const QRCode = await lib();
    const big = document.createElement('canvas');
    await QRCode.toCanvas(big, current.link, { ...qrOpts(current.link), width: 1024 });
    big.toBlob((blob) => { if (blob) { download(blob, 'utm-qr.png'); cap('tool_completed', { action: 'qr_png' }); } }, 'image/png');
  });
  q('[data-ub-svg]').addEventListener('click', async () => {
    if (!current?.ok) return;
    const QRCode = await lib();
    const svg = await QRCode.toString(current.link, { ...qrOpts(current.link), type: 'svg' });
    download(new Blob([svg], { type: 'image/svg+xml' }), 'utm-qr.svg');
    cap('tool_completed', { action: 'qr_svg' });
  });

  document.querySelectorAll<HTMLAnchorElement>('[data-ub-cta]').forEach((el) => el.addEventListener('click', () => cap('cta_clicked', { placement: el.dataset.ubCta })));
  run();
}
