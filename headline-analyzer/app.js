(() => {
  // headline-analyzer/src/core.ts
  var HEADLINE_ANALYZER_CONFIG = {
    maxChars: 200,
    formats: {
      blog: { label: "Blog title", kind: "words", minWords: 6, maxWords: 12 },
      x: { label: "X post hook", kind: "chars", maxChars: 100 },
      email: { label: "Email subject line", kind: "chars", maxChars: 50 },
      video: { label: "Video hook", kind: "words", minWords: 1, maxWords: 12 }
    },
    /* Weak openers. "how to" is fine even though it starts with common words. */
    weakOpeners: ["the", "a", "an", "introducing", "announcing", "we", "our", "check out", "just"],
    weakOpenerOk: ["how to"],
    /* Specific detail: a number, a named audience, or a time frame. */
    audiencePhrases: [
      "for founders",
      "for saas",
      "for startups",
      "for marketers",
      "for creators",
      "for b2b",
      "for b2c",
      "for agencies",
      "for engineers",
      "for developers"
    ],
    timePhrases: [
      "this week",
      "next week",
      "this month",
      "in a day",
      "in a week",
      "in an hour",
      "in minutes",
      "in seconds",
      "overnight",
      "today",
      "tomorrow",
      "daily",
      "weekly",
      "per day",
      "per week",
      "per month",
      "30 day",
      "30-day",
      "7 day",
      "7-day"
    ],
    /* Clear promise: outcome verbs, or a how / why / what question. */
    outcomeVerbs: ["get", "cut", "fix", "stop", "grow", "save", "find", "avoid", "learn", "build"],
    /* Filler and hype. */
    hypePhrases: [
      "ultimate",
      "amazing",
      "revolutionary",
      "game-changer",
      "game changer",
      "unlock",
      "supercharge",
      "secret",
      "best ever",
      "insane"
    ],
    /* Caps: more than one ALL-CAPS word (after short acronyms), or !! / ?! */
    capsAllow: ["SEO", "SaaS", "B2B", "B2C", "API", "FAQ", "CTA", "ROI", "LTV", "CAC", "UGC", "MVP", "AI", "CRM", "ARR", "MRR"],
    capsMaxAllowed: 1
  };
  var C = HEADLINE_ANALYZER_CONFIG;
  var EDITORIAL = { label: "Ignura editorial guide" };
  function graphemeCount(s) {
    try {
      return [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(s)].length;
    } catch {
      return [...s].length;
    }
  }
  function isLatinScript(s) {
    const letters = s.match(/\p{L}/gu) || [];
    if (!letters.length) return true;
    const latin = letters.filter((ch) => /\p{Script=Latin}/u.test(ch)).length;
    return latin / letters.length >= 0.8;
  }
  function wordsOf(s) {
    return s.match(/[A-Za-z0-9']+/g) || [];
  }
  function lengthWordCount(s, latin) {
    if (latin) return wordsOf(s).length;
    return s.trim() ? s.trim().split(/\s+/).length : 0;
  }
  function stripLeadingOpenerNoise(s) {
    return s.replace(/^[^\p{L}\p{N}]+/u, "");
  }
  function openerWords(s) {
    return wordsOf(stripLeadingOpenerNoise(s)).map((w) => w.replace(/^'+|'+$/g, "")).filter(Boolean);
  }
  function firstLine(s) {
    return s.split(/\r?\n/, 1)[0] ?? s;
  }
  function esc(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function hasNumber(s) {
    return /(?:\d|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|dozen|hundred|thousand)/i.test(s);
  }
  function findPhrases(hay, phrases) {
    const lower = hay.toLowerCase();
    return phrases.filter((p) => lower.includes(p.toLowerCase()));
  }
  function check(input) {
    const raw = String(input.text ?? "").replace(/\u00a0/g, " ");
    const text = raw.trim();
    const format = input.format in C.formats ? input.format : "blog";
    const band = C.formats[format];
    const chars = graphemeCount(text);
    const latin = isLatinScript(text);
    const words = wordsOf(text);
    const wordCount = lengthWordCount(text, latin);
    const highlights = [];
    const checks = [];
    let lengthLook = false;
    let lengthFound = "";
    let lengthFix = "";
    if (band.kind === "words") {
      const min = "minWords" in band ? band.minWords : 1;
      const max = band.maxWords;
      lengthLook = wordCount < min || wordCount > max;
      lengthFound = `${wordCount} word${wordCount === 1 ? "" : "s"} (${band.label} guide: ${min} to ${max} words).`;
      lengthFix = wordCount < min ? `Add a little more so it sits in the ${min} to ${max} word guide.` : `Cut it toward ${min} to ${max} words. This is our guide, not a platform limit.`;
    } else {
      const line = firstLine(text);
      const lineChars = graphemeCount(line);
      const max = band.maxChars;
      lengthLook = lineChars > max;
      lengthFound = `${lineChars} character${lineChars === 1 ? "" : "s"} on the first line (${band.label} guide: up to ${max}).`;
      lengthFix = `Shorten the first line to ${max} characters or fewer. This is our guide, not a platform limit.`;
    }
    checks.push({
      id: "length",
      name: "Length",
      state: lengthLook ? "look" : "fine",
      found: lengthFound,
      rule: "Length is checked against our editorial band for the format you pick. Our guide, not a platform limit.",
      source: EDITORIAL,
      fix: lengthLook ? lengthFix : "Keep it in this band."
    });
    if (!latin) {
      for (const id of ["opener", "detail", "promise", "hype", "caps"]) {
        const names = {
          length: "Length",
          opener: "First three words",
          detail: "Specific detail",
          promise: "Clear promise",
          hype: "Filler and hype words",
          caps: "Caps and punctuation"
        };
        checks.push({
          id,
          name: names[id],
          state: "skipped",
          found: "Word checks support English only for now.",
          rule: "Word checks run on Latin script text. Length still runs for every language.",
          source: EDITORIAL,
          fix: "",
          note: "Word checks support English only for now."
        });
      }
    } else {
      const openerTokens = openerWords(text);
      const opener = openerTokens.map((w) => w.toLowerCase()).join(" ");
      const okPrefix = C.weakOpenerOk.some((p) => opener.startsWith(p + " ") || opener === p);
      let weak = null;
      if (!okPrefix) {
        for (const w of C.weakOpeners) {
          if (opener.startsWith(w + " ") || opener === w) {
            weak = w;
            break;
          }
        }
      }
      if (weak) highlights.push(openerTokens[0] || weak);
      checks.push({
        id: "opener",
        name: "First three words",
        state: weak ? "look" : "fine",
        found: weak ? `Opens with \u201C${weak}\u201D.` : "Opener looks specific enough.",
        rule: "Skip weak openers such as the, a, an, introducing, announcing, we, our, check out, or just. \u201CHow to\u201D is fine.",
        source: EDITORIAL,
        fix: weak ? "Lead with the reader, the outcome, or a concrete detail." : "Keep leading with something specific.",
        marks: weak ? [weak] : void 0
      });
      const audiences = findPhrases(text, C.audiencePhrases);
      const times = findPhrases(text, C.timePhrases);
      const numbered = hasNumber(text);
      const detailOk = numbered || audiences.length > 0 || times.length > 0;
      const detailBits = [
        numbered ? "a number" : "",
        audiences.length ? `audience (${audiences[0]})` : "",
        times.length ? `time frame (${times[0]})` : ""
      ].filter(Boolean);
      if (audiences[0]) highlights.push(audiences[0]);
      if (times[0]) highlights.push(times[0]);
      checks.push({
        id: "detail",
        name: "Specific detail",
        state: detailOk ? "fine" : "look",
        found: detailOk ? `Has ${detailBits.join(", ")}.` : "No number, named audience, or time frame.",
        rule: "Pass if the line has a number, a named audience (for example \u201Cfor founders\u201D), or a time frame.",
        source: EDITORIAL,
        fix: detailOk ? "Keep the concrete detail." : "Add a number, who it is for, or when."
      });
      const verbHits = C.outcomeVerbs.filter((v) => new RegExp(`\\b${esc(v)}\\b`, "i").test(text));
      const questionOk = /^(how|why|what)\b/i.test(opener) || /\b(how|why|what)\b.+\?/i.test(text);
      const promiseOk = verbHits.length > 0 || questionOk;
      if (verbHits[0]) highlights.push(verbHits[0]);
      checks.push({
        id: "promise",
        name: "Clear promise",
        state: promiseOk ? "fine" : "look",
        found: promiseOk ? verbHits.length ? `Outcome verb: ${verbHits.slice(0, 3).join(", ")}.` : "Framed as a how / why / what question." : "No clear outcome verb or how / why / what question.",
        rule: "Pass if it uses an outcome verb (get, cut, fix, stop, grow, save, find, avoid, learn, build) or a how / why / what question.",
        source: EDITORIAL,
        fix: promiseOk ? "Keep the promise plain." : "Name the outcome, or ask how / why / what.",
        marks: verbHits.slice(0, 3)
      });
      const hypeHits = findPhrases(text, C.hypePhrases);
      for (const h of hypeHits) highlights.push(h);
      checks.push({
        id: "hype",
        name: "Filler and hype words",
        state: hypeHits.length ? "look" : "fine",
        found: hypeHits.length ? `Flagged: ${hypeHits.join(", ")}.` : "No listed hype words.",
        rule: "Flag ultimate, amazing, revolutionary, game-changer, unlock, supercharge, secret, best ever, insane.",
        source: EDITORIAL,
        fix: hypeHits.length ? "Swap the hype for a plain claim you can stand behind." : "Keep it plain.",
        marks: hypeHits
      });
      const capsWords = words.filter((w) => {
        if (w.length <= 1) return false;
        if (w !== w.toUpperCase()) return false;
        if (!/[A-Z]/.test(w)) return false;
        if (w.length <= 4 && C.capsAllow.some((a) => a.toUpperCase() === w.toUpperCase())) return false;
        if (w.length <= 4) return false;
        return true;
      });
      const bangs = (text.match(/!/g) || []).length;
      const qBang = /\?!/.test(text);
      const multiBang = bangs > 1;
      const capsLook = capsWords.length > C.capsMaxAllowed || multiBang || qBang;
      for (const w of capsWords) highlights.push(w);
      const capsBits = [
        capsWords.length > C.capsMaxAllowed ? `${capsWords.length} ALL-CAPS words` : "",
        multiBang ? "more than one !" : "",
        qBang ? "a ?!" : ""
      ].filter(Boolean);
      checks.push({
        id: "caps",
        name: "Caps and punctuation",
        state: capsLook ? "look" : "fine",
        found: capsLook ? `Flagged: ${capsBits.join(", ")}.` : "Caps and punctuation look calm.",
        rule: "Flag more than one ALL-CAPS word (short acronyms of 4 letters or fewer are fine), more than one !, or ?!.",
        source: EDITORIAL,
        fix: capsLook ? "Drop the extra caps and keep at most one !." : "Keep it calm.",
        marks: capsWords
      });
    }
    const passed = checks.filter((c) => c.state === "fine").length;
    const total = 6;
    const summary = [
      `Headline check (${C.formats[format].label}): ${passed} of ${total} checks passed.`,
      "",
      ...checks.filter((c) => c.state !== "skipped").map((c) => `${c.state === "look" ? "Worth a look" : "Looks fine"}: ${c.name}. ${c.found}${c.state === "look" && c.fix ? ` Fix: ${c.fix}` : ""}`),
      "",
      `Rules: Ignura editorial guide. ignura.com/tools/headline-analyzer`
    ].join("\n");
    return { checks, passed, total, chars, words: wordCount, latin, summary, highlights: [...new Set(highlights)] };
  }
  var passedLine = (r) => `${r.passed} of ${r.total} checks passed`;

  // headline-analyzer/src/main.ts
  var cap = (_event, _props = {}) => {
  };
  var MARKS = {
    fine: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="9" fill="currentColor"/><path d="m6 10.2 2.6 2.6L14 7.4" fill="none" stroke="var(--paper)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    look: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="8.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 5.8v5.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="14" r="1.2" fill="currentColor"/></svg>',
    skipped: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="8.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6.5 10h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
  };
  var root = document.querySelector("[data-ha]");
  if (root) init(root);
  function init(root2) {
    const q = (s) => root2.querySelector(s);
    const input = q("[data-ha-text]");
    const format = q("[data-ha-format]");
    const counter = q("[data-ha-count]");
    const msg = q("[data-ha-msg]");
    const go = q("[data-ha-go]");
    const goHint = q("[data-ha-go-hint]");
    const result = q("[data-ha-result]");
    const card = q("[data-ha-card]");
    const replay = q("[data-ha-replay]");
    let started = false, live = false, lastKey = "", lastAt = 0, timer = 0;
    let last = null;
    cap("tool_viewed");
    const fmt = () => {
      const v = format.value;
      return v === "x" || v === "email" || v === "video" || v === "blog" ? v : "blog";
    };
    function setCount() {
      const n = graphemeCount(input.value);
      counter.textContent = `${n} / ${HEADLINE_ANALYZER_CONFIG.maxChars}`;
      if (n >= HEADLINE_ANALYZER_CONFIG.maxChars) input.value = [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(input.value)].slice(0, HEADLINE_ANALYZER_CONFIG.maxChars).map((s) => s.segment).join("");
    }
    function el(tag, cls = "", text = "") {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text) n.textContent = text;
      return n;
    }
    function item(c) {
      const li = el("li", `ha-check is-${c.state}`);
      const head = el("div", "ha-check-head");
      const mark = el("span", "tl-mark");
      mark.innerHTML = MARKS[c.state];
      head.append(
        mark,
        el("b", "ha-check-name", c.name),
        el("span", "ha-state", c.state === "look" ? "Worth a look" : c.state === "fine" ? "Looks fine" : "Skipped")
      );
      li.append(head, el("p", "ha-found", c.found));
      if (c.marks?.length) {
        const m = el("p", "ha-marks");
        c.marks.forEach((t, i) => {
          if (i) m.append(" ");
          m.append(el("mark", "", t));
        });
        li.append(m);
      }
      if (c.fix && c.state === "look") li.append(Object.assign(el("p", "ha-fix"), { textContent: `Fix: ${c.fix}` }));
      else if (c.note) li.append(el("p", "ha-fix", c.note));
      const rule = el("p", "ha-rule", `Rule: ${c.rule} `);
      if (c.source.href) {
        const a = Object.assign(el("a", "", c.source.label), { href: c.source.href });
        if (/^https?:/.test(c.source.href)) a.rel = "noopener";
        rule.append("(", a, ")");
      } else {
        rule.append("(", document.createTextNode(c.source.label), ")");
      }
      li.append(rule);
      return li;
    }
    function renderReplay(text, marks) {
      replay.replaceChildren();
      if (!text) return;
      if (!marks.length) {
        replay.textContent = text;
        return;
      }
      const lower = text.toLowerCase();
      const ranges = [];
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
      const merged = [];
      for (const r of ranges) {
        const lastR = merged[merged.length - 1];
        if (lastR && r.start <= lastR.end) lastR.end = Math.max(lastR.end, r.end);
        else merged.push({ ...r });
      }
      let cursor = 0;
      for (const r of merged) {
        if (r.start > cursor) replay.append(document.createTextNode(text.slice(cursor, r.start)));
        replay.append(el("mark", "", text.slice(r.start, r.end)));
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
        msg.textContent = started ? "Paste a headline to check it." : "";
        result.hidden = true;
        card.hidden = true;
        last = null;
        return;
      }
      msg.textContent = "";
      if (!live) return;
      const r = check({ text: v, format: fmt() });
      q("[data-ha-numbers]").textContent = passedLine(r);
      const order = { look: 0, fine: 1, skipped: 2 };
      q("[data-ha-checks]").replaceChildren(...[...r.checks].sort((a, b) => order[a.state] - order[b.state]).map(item));
      renderReplay(v.trim(), r.highlights);
      result.hidden = false;
      card.hidden = false;
      last = r;
      const props = {
        format: fmt(),
        length_chars: r.chars,
        checks_passed: r.passed
      };
      const key = JSON.stringify(props) + "|" + v.trim();
      const now = Date.now();
      if (key !== lastKey || now - lastAt >= 2e3) {
        lastKey = key;
        lastAt = now;
        cap("tool_checked", props);
      }
    }
    const schedule = () => {
      clearTimeout(timer);
      timer = window.setTimeout(run, 280);
    };
    input.addEventListener("input", () => {
      if (!started && input.value.trim()) {
        started = true;
      }
      setCount();
      go.disabled = !input.value.trim();
      goHint.hidden = !!input.value.trim();
      if (live) schedule();
      else if (!input.value.trim()) msg.textContent = started ? "Paste a headline to check it." : "";
    });
    format.addEventListener("change", () => {
      if (live) run();
    });
    go.addEventListener("click", () => {
      if (!input.value.trim()) return;
      live = true;
      run();
      result.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    q("[data-ha-copy]").addEventListener("click", async () => {
      if (!last) return;
      try {
        await navigator.clipboard.writeText(last.summary);
        q("[data-ha-copied]").textContent = "Copied.";
      } catch {
        q("[data-ha-copied]").textContent = "Couldn\u2019t copy. Select the report and copy it yourself.";
      }
    });
    document.querySelectorAll("[data-ha-cta]").forEach((a) => a.addEventListener("click", () => cap("cta_clicked", { placement: a.dataset.haCta })));
    setCount();
  }
})();
