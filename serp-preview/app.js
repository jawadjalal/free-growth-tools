(() => {
  // serp-preview/src/core.ts
  var TITLE_WARN_DESKTOP_PX = 580;
  var TITLE_CUTOFF_DESKTOP_PX = 600;
  var DESC_BOX_WIDTH_PX = 652;
  var DESC_MAX_LINES = 2;
  var CUTOFF_MEASURED_LINE = "Desktop widths measured on Google, 27 Oct 2026";
  var MAX_TITLE = 300;
  var MAX_DESC = 1e3;
  var FONT_TITLE = "20px Arial, sans-serif";
  var FONT_DESC = "14px Arial, sans-serif";
  function stripPastedTags(raw) {
    let s = String(raw ?? "");
    const title = s.match(/^\s*<title[^>]*>([\s\S]*?)<\/title>\s*$/i);
    if (title) return title[1];
    const meta = s.match(/^\s*<meta[^>]*\bcontent\s*=\s*(["'])([\s\S]*?)\1[^>]*\/?>\s*$/i);
    if (meta) return meta[2];
    return s;
  }
  function flattenLines(raw) {
    return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/[ \t]{2,}/g, " ");
  }
  function prepareTitle(raw) {
    return flattenLines(stripPastedTags(raw)).trimStart();
  }
  function prepareDesc(raw) {
    return flattenLines(stripPastedTags(raw)).trimStart();
  }
  function escapeHtml(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function copyTags(title, desc) {
    const t = escapeHtml(title);
    const d = escapeHtml(desc);
    return `<title>${t}</title>
<meta name="description" content="${d}">`;
  }
  function hasNonLatin(s) {
    return /[^\u0000-\u024F\u1E00-\u1EFF]/.test(s);
  }
  function isAllCaps(title) {
    const letters = title.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "");
    return letters.length >= 4 && letters === letters.toUpperCase() && /[A-ZÀ-ÖØ-Þ]/.test(letters);
  }
  function repeatedWord(title) {
    const words = title.toLowerCase().match(/[a-z0-9']+/g) ?? [];
    const counts = /* @__PURE__ */ new Map();
    for (const w of words) {
      if (w.length < 2) continue;
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
    let best = null;
    for (const [word, n] of counts) {
      if (n >= 3 && (!best || n > best.n)) best = { word, n };
    }
    return best;
  }
  function truncateToPx(text, maxPx, font, measure) {
    if (!text) return { shown: "", cut: false, lastWords: "" };
    if (!(maxPx > 0) || measure(text, font) <= maxPx) return { shown: text, cut: false, lastWords: "" };
    const ell = "\u2026";
    let lo = 0, hi = text.length, best = 0;
    while (lo <= hi) {
      const mid = lo + hi >> 1;
      const candidate = text.slice(0, mid).replace(/\s+$/, "") + ell;
      if (measure(candidate, font) <= maxPx) {
        best = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    const kept = text.slice(0, best).replace(/\s+$/, "");
    const shown = kept + ell;
    const tail = kept.trim().split(/\s+/).slice(-3).join(" ");
    return { shown, cut: true, lastWords: tail };
  }
  function wrapLines(text, maxWidth, font, measure) {
    if (!text) return [];
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let current = "";
    const pushHard = (word) => {
      let chunk = "";
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
  function descOverflow(text, measure) {
    if (!text) return { cut: false, lastWords: "" };
    const lines = wrapLines(text, DESC_BOX_WIDTH_PX, FONT_DESC, measure);
    if (lines.length <= DESC_MAX_LINES) return { cut: false, lastWords: "" };
    const lastKept = lines[DESC_MAX_LINES - 1] ?? "";
    const lastWords = lastKept.trim().split(/\s+/).slice(-3).join(" ");
    return { cut: true, lastWords };
  }
  function titlePxBucket(px, cutoff = TITLE_CUTOFF_DESKTOP_PX) {
    if (px < 300) return "<300";
    if (px < 500) return "300-500";
    if (px > cutoff) return "over";
    return "500-cutoff";
  }
  function descBucket(chars) {
    if (chars <= 0) return "none";
    if (chars < 70) return "<70";
    if (chars <= 160) return "70-160";
    return "160+";
  }
  function buildNotes(opts) {
    const out = [];
    if (opts.titleCut && opts.titleLastWords) {
      out.push({ id: "title_cut", text: `The end of your title may be cut: '\u2026${opts.titleLastWords}'. Put the main words first.` });
    } else if (opts.titleCut) {
      out.push({ id: "title_cut", text: "The end of your title may be cut. Put the main words first." });
    }
    if (!opts.desc) {
      out.push({ id: "empty_desc", text: "No meta description, so Google will pick text from the page." });
    } else if (opts.descCut && opts.descLastWords) {
      out.push({ id: "desc_cut", text: `Google may cut your description after '${opts.descLastWords}'.` });
    } else if (opts.descCut) {
      out.push({ id: "desc_cut", text: "Google may cut your description to fit the screen." });
    }
    const letterCount = opts.title.replace(/\s/g, "").length;
    if (opts.title && letterCount > 0 && letterCount < 10) {
      out.push({ id: "short_title", text: "A very short title gives Google little to show, and it may rewrite it." });
    }
    const rep = repeatedWord(opts.title);
    if (rep) {
      out.push({ id: "repeat_word", text: `'${rep.word}' appears ${rep.n} times. Repeated words read as keyword stuffing.` });
    }
    if (isAllCaps(opts.title)) {
      out.push({ id: "all_caps", text: "All-caps titles are harder to read in results." });
    }
    if (hasNonLatin(opts.title) || hasNonLatin(opts.desc)) {
      out.push({ id: "non_latin", text: "Width for non-Latin text is a rough guess." });
    }
    return out;
  }
  function formatMeasuredLine() {
    return CUTOFF_MEASURED_LINE;
  }

  // serp-preview/src/main.ts
  var cap = (_event, _props = {}) => {
  };
  var root = document.querySelector("[data-sp]");
  if (root) {
    const start = () => init(root);
    if (document.fonts?.ready) void document.fonts.ready.then(start).catch(start);
    else start();
  }
  function measureFactory() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    return (text, font) => {
      if (!ctx) return text.length * 8;
      ctx.font = font;
      return ctx.measureText(text).width;
    };
  }
  function init(root2) {
    const q = (s) => root2.querySelector(s);
    const titleIn = q("[data-sp-title]");
    const descIn = q("[data-sp-desc]");
    const urlIn = q("[data-sp-url]");
    const siteIn = q("[data-sp-site]");
    const result = q("[data-sp-result]");
    const cta = q("[data-sp-card-cta]");
    const scaleHost = q("[data-sp-scale]");
    const scaleInner = q("[data-sp-scale-inner]");
    const measure = measureFactory();
    let started = false;
    let lastErr = "";
    let lastChecked = "";
    let lastCheckedAt = 0;
    let debounce = null;
    let copyPayload = "";
    let pendingProps = null;
    cap("tool_viewed");
    const setErr = (el, box, msg) => {
      if (box) box.textContent = msg;
      el.setAttribute("aria-invalid", msg ? "true" : "false");
    };
    const err = (type) => {
      if (type !== lastErr) {
        lastErr = type;
        cap("tool_error", { error_type: type });
      }
    };
    const fitScale = () => {
      if (!scaleHost || !scaleInner) return;
      const avail = scaleHost.clientWidth;
      scaleInner.style.setProperty("--sp-scale", "1");
      const naturalW = scaleInner.offsetWidth || DESC_BOX_WIDTH_PX;
      const naturalH = scaleInner.offsetHeight;
      const scale = avail > 0 ? Math.min(1, avail / naturalW) : 1;
      scaleInner.style.setProperty("--sp-scale", String(scale));
      scaleHost.style.height = `${Math.ceil(naturalH * scale)}px`;
    };
    const flushChecked = () => {
      if (!pendingProps) return;
      const now = Date.now();
      if (now - lastCheckedAt < 1e4) return;
      const key = JSON.stringify(pendingProps);
      if (key === lastChecked) return;
      lastChecked = key;
      lastCheckedAt = now;
      cap("tool_checked", pendingProps);
      pendingProps = null;
    };
    const run = () => {
      let title = prepareTitle(titleIn.value);
      let desc = prepareDesc(descIn.value);
      if (title.length > MAX_TITLE) {
        title = title.slice(0, MAX_TITLE);
        titleIn.value = title;
        err("title_limit");
        setErr(titleIn, root2.querySelector('[data-sp-err="title"]'), `Titles stop at ${MAX_TITLE} characters.`);
      } else setErr(titleIn, root2.querySelector('[data-sp-err="title"]'), "");
      if (desc.length > MAX_DESC) {
        desc = desc.slice(0, MAX_DESC);
        descIn.value = desc;
        err("desc_limit");
        setErr(descIn, root2.querySelector('[data-sp-err="desc"]'), `Descriptions stop at ${MAX_DESC} characters.`);
      } else setErr(descIn, root2.querySelector('[data-sp-err="desc"]'), "");
      if (!started && title.trim()) {
        started = true;
        cap("tool_started");
      }
      if (!title.trim()) {
        result.hidden = true;
        cta.hidden = true;
        copyPayload = "";
        pendingProps = null;
        return;
      }
      lastErr = "";
      const titlePx = measure(title, FONT_TITLE);
      const tTrunc = truncateToPx(title, TITLE_CUTOFF_DESKTOP_PX, FONT_TITLE, measure);
      const dOver = desc ? descOverflow(desc, measure) : { cut: false, lastWords: "" };
      const siteOut = q("[data-sp-site-out]");
      const site = siteIn.value.trim();
      if (site) {
        siteOut.hidden = false;
        siteOut.textContent = site;
      } else {
        siteOut.hidden = true;
        siteOut.textContent = "";
      }
      q("[data-sp-url-out]").textContent = urlIn.value.trim() || "example.com \u203A page";
      q("[data-sp-title-out]").textContent = tTrunc.shown;
      const descOut = q("[data-sp-desc-out]");
      descOut.textContent = desc;
      descOut.hidden = !desc;
      q("[data-sp-cutoff]").textContent = formatMeasuredLine();
      q("[data-sp-title-readout]").textContent = `Title: ${Math.round(titlePx)}px of about ${TITLE_WARN_DESKTOP_PX}px, ${title.length} characters.`;
      q("[data-sp-desc-readout]").textContent = desc ? dOver.cut ? `Description: overflows the two-line preview, ${desc.length} characters.` : `Description: fits the two-line preview, ${desc.length} characters.` : "Description: none entered.";
      const notes = buildNotes({
        title,
        desc,
        titleCut: tTrunc.cut,
        descCut: dOver.cut,
        titleLastWords: tTrunc.lastWords,
        descLastWords: dOver.lastWords
      });
      const ul = q("[data-sp-notes]");
      ul.replaceChildren(...notes.map((n) => {
        const li = document.createElement("li");
        li.textContent = n.text;
        return li;
      }));
      result.hidden = false;
      cta.hidden = false;
      copyPayload = copyTags(title, desc);
      requestAnimationFrame(fitScale);
      const noteIds = notes.map((n) => n.id);
      pendingProps = {
        title_px_bucket: titlePxBucket(titlePx, TITLE_CUTOFF_DESKTOP_PX),
        desc_bucket: descBucket(desc.length),
        title_cut: tTrunc.cut,
        desc_cut: dOver.cut,
        notes: noteIds
      };
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(flushChecked, 1500);
    };
    root2.addEventListener("input", run);
    q("[data-sp-copy]").addEventListener("click", async () => {
      if (!copyPayload) return;
      try {
        await navigator.clipboard.writeText(copyPayload);
        q("[data-sp-copied]").textContent = "Copied.";
        cap("tool_completed", { action: "copy" });
      } catch {
        q("[data-sp-copied]").textContent = "Couldn\u2019t copy. Select the tags and copy them yourself.";
      }
    });
    document.querySelectorAll("[data-sp-cta]").forEach((el) => {
      el.addEventListener("click", () => cap("cta_clicked", { placement: el.dataset.spCta }));
    });
    window.addEventListener("resize", fitScale);
    if (typeof ResizeObserver !== "undefined" && scaleHost) {
      new ResizeObserver(fitScale).observe(scaleHost);
    }
  }
})();
