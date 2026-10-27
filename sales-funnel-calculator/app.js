(() => {
  // sales-funnel-calculator/src/core.ts
  var WEEKS_PER_MONTH = 4.33;
  var EXAMPLE = { customers: "5", close: "20", show: "80", reply: "3", booked: "40" };
  function parseNum(raw, opts = {}) {
    let s = raw.trim().replace(/%/g, "").replace(/\s+/g, "");
    if (!s) return { ok: false, err: "empty" };
    if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
    else s = s.replace(",", ".");
    if (!/^-?\d*\.?\d+$/.test(s)) return { ok: false, err: "not_number" };
    const n = Number(s);
    if (!Number.isFinite(n)) return { ok: false, err: "not_number" };
    if (n <= 0) return { ok: false, err: "not_above_zero" };
    if (opts.pct && n > 100) return { ok: false, err: "over_100" };
    if (opts.whole && !Number.isInteger(n)) return { ok: false, err: "not_whole" };
    if (opts.max && n > opts.max) return { ok: false, err: "over_max" };
    return { ok: true, n };
  }
  var up = (x) => Math.ceil(x - 1e-9);
  function funnel(goal, closePct, showPct, outreach) {
    const held = up(goal / (closePct / 100));
    const booked = up(held / (showPct / 100));
    if (!outreach) return { goal, held, booked, replies: null, contacts: null };
    const replies = up(booked / (outreach.bookedPct / 100));
    const contacts = up(replies / (outreach.replyPct / 100));
    return { goal, held, booked, replies, contacts };
  }
  var bookedBucket = (n) => n <= 10 ? "1-10" : n <= 50 ? "11-50" : n <= 200 ? "51-200" : "200+";
  var fmt = (n) => n.toLocaleString("en-GB", { maximumFractionDigits: 2 });

  // sales-funnel-calculator/src/main.ts
  var cap = (_event, _props = {}) => {
  };
  var MSG = {
    empty: "",
    not_number: "Use a number, like 20 or 2.5.",
    not_above_zero: "Use a number above 0.",
    over_100: "Use a number up to 100.",
    not_whole: "Use a whole number.",
    over_max: "Use a number up to 1,000."
  };
  var root = document.querySelector("[data-sfc]");
  if (root) init(root);
  function init(root2) {
    const q = (s) => root2.querySelector(s);
    const input = (f) => q(`[data-sf-in="${f}"]`);
    const result = q("[data-sf-result]");
    const card = q("[data-sf-card]");
    const empty = q("[data-sf-empty]");
    const toggle = q("[data-sf-outreach]");
    const outFields = q("[data-sf-outfields]");
    const exLabels = root2.querySelectorAll("[data-sf-exlabel]");
    let exampleUsed = false, lastKey = "", lastAt = 0;
    cap("tool_viewed");
    const week = () => root2.querySelector("[data-sf-per]:checked")?.value === "week";
    const setErr = (f, text) => {
      q(`[data-sf-err="${f}"]`).textContent = text;
      input(f).setAttribute("aria-invalid", text ? "true" : "false");
    };
    const showEx = (on) => exLabels.forEach((el) => {
      el.hidden = !on;
    });
    root2.addEventListener("input", (e) => {
      const t = e.target;
      if (t.matches("[data-sf-in]") && exampleUsed) {
        exampleUsed = false;
        showEx(false);
      }
      run();
    });
    root2.addEventListener("change", (e) => {
      if (e.target.matches("[data-sf-per], [data-sf-outreach]")) run();
    });
    q("[data-sf-example]").addEventListener("click", () => {
      Object.keys(EXAMPLE).forEach((f) => {
        input(f).value = EXAMPLE[f];
      });
      toggle.checked = true;
      exampleUsed = true;
      showEx(true);
      run();
    });
    document.querySelectorAll("[data-sf-cta]").forEach((el) => el.addEventListener("click", () => cap("cta_clicked", { placement: el.dataset.sfCta })));
    function row(text, n, label) {
      const li = document.createElement("li");
      li.className = "sf-step";
      const top = document.createElement("p");
      top.className = "sf-step-n";
      top.append(Object.assign(document.createElement("b"), { textContent: fmt(n) }), ` ${label}`);
      const f = Object.assign(document.createElement("p"), { className: "tl-note sf-formula", textContent: text });
      li.append(top, f);
      return li;
    }
    function run() {
      const outreach = toggle.checked;
      outFields.hidden = !outreach;
      const fields = outreach ? ["customers", "close", "show", "reply", "booked"] : ["customers", "close", "show"];
      if (!outreach) {
        setErr("reply", "");
        setErr("booked", "");
      }
      const parsed = {};
      for (const f of fields) {
        const p = parseNum(input(f).value, f === "customers" ? { whole: true, max: 1e3 } : { pct: true });
        parsed[f] = p;
        setErr(f, !p.ok ? MSG[p.err] : "");
      }
      const prompt = q("[data-sf-prompt]");
      const hide = () => {
        result.hidden = true;
        card.hidden = true;
        empty.hidden = false;
      };
      if (fields.some((f) => !parsed[f].ok)) {
        const missing = fields.some((f) => !parsed[f].ok && parsed[f].err === "empty");
        prompt.textContent = missing ? outreach ? "Add your goal, close rate, show rate, reply rate and booked rate to see the math." : "Add your close rate and show rate to see the math." : "";
        return hide();
      }
      prompt.textContent = "";
      const n = (f) => parsed[f].n;
      const per = week() ? "week" : "month";
      const goalRaw = n("customers");
      const goal = week() ? goalRaw / WEEKS_PER_MONTH : goalRaw;
      const fu = funnel(goal, n("close"), n("show"), outreach ? { replyPct: n("reply"), bookedPct: n("booked") } : void 0);
      const goalTxt = fmt(Math.round(goal * 100) / 100);
      q("[data-sf-head]").textContent = `You need about ${fmt(fu.booked)} booked demos a ${per} to win ${goalTxt} customer${goal === 1 ? "" : "s"}.`;
      q("[data-sf-weeknote]").textContent = week() ? `Per week: ${fmt(goalRaw)} customers a month \xF7 ${WEEKS_PER_MONTH} weeks = ${goalTxt} a week.` : "";
      const rows = [];
      if (outreach) {
        rows.push(row(`${fmt(fu.replies)} replies \xF7 ${fmt(n("reply"))}% reply rate = ${fmt(fu.contacts)} people to contact`, fu.contacts, `people to contact a ${per}`));
        rows.push(row(`${fmt(fu.booked)} demos booked \xF7 ${fmt(n("booked"))}% booked from replies = ${fmt(fu.replies)} replies`, fu.replies, `replies a ${per}`));
      }
      rows.push(row(`${fmt(fu.held)} demos held \xF7 ${fmt(n("show"))}% show rate = ${fmt(fu.booked)} demos booked`, fu.booked, `demos booked a ${per}`));
      rows.push(row(`${goalTxt} customers \xF7 ${fmt(n("close"))}% close rate = ${fmt(fu.held)} demos held`, fu.held, `demos held a ${per}`));
      rows.push(row(`Your goal for the ${per}`, Math.round(goal * 100) / 100, `customers a ${per}`));
      q("[data-sf-funnel]").replaceChildren(...rows);
      q("[data-sf-lost]").textContent = `${fmt(fu.booked - fu.held)}`;
      q("[data-sf-big]").hidden = !Math.max(fu.held, fu.booked, fu.replies ?? 0, fu.contacts ?? 0) || Math.max(fu.held, fu.booked, fu.replies ?? 0, fu.contacts ?? 0) <= 1e6;
      result.hidden = false;
      card.hidden = false;
      empty.hidden = true;
      const props = { period: per, outreach_on: outreach, example_used: exampleUsed, demos_booked_bucket: bookedBucket(fu.booked) };
      const key = JSON.stringify([props, fields.map((f) => n(f))]);
      const now = Date.now();
      if (key !== lastKey || now - lastAt > 2e3) cap("tool_checked", props);
      lastKey = key;
      lastAt = now;
    }
    run();
  }
})();
