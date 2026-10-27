(() => {
  // cold-email-checker/src/core.ts
  var BOOMERANG_URL = "https://blog.boomerangapp.com/2016/02/7-tips-for-getting-more-responses-to-your-emails-with-data/";
  var HUBSPOT_URL = "https://blog.hubspot.com/blog/tabid/6307/bid/30684/the-ultimate-list-of-email-spam-trigger-words.aspx";
  var FIX_OUTBOUND = "https://ignura.com/email";
  var B2B_POST = "https://ignura.com/blog/cold-email-for-b2b-startups";
  var COLD_EMAIL_CHECKER_CONFIG = {
    /* Boomerang: 50 to 125 words all had response rates above 50%. */
    wordsMin: 50,
    wordsMax: 125,
    /* House threshold: Flesch-Kincaid grade at or above this is flagged. Boomerang found grade 3 did best. */
    gradeFlagAt: 7,
    /* Below this many words the reading level is skipped. */
    minWordsForGrade: 10,
    /* Boomerang: 3 to 4 word subjects got the most responses. Over this many words is flagged (first emails only). */
    subjectMaxWords: 6,
    /* Boomerang: 1 to 3 questions did better than none. */
    questionsMin: 1,
    questionsMax: 3,
    /* House rule: any link in a first email is flagged, booking links included. */
    flagAnyLinkInFirstEmail: true,
    /* Input limits. */
    maxBodyChars: 5e3,
    maxSubjectChars: 200,
    /* The ask: any of these in the last 3 sentences counts as an ask. */
    askPhrases: ["call", "chat", "talk", "meet", "minute", "minutes", "mins", "next week", "this week", "worth a", "open to", "interested", "demo"],
    /* Booking link hosts (house rule). */
    bookingHosts: ["cal.com", "calendly.com", "meetings.hubspot.com", "hubspot.com/meetings", "calendar.google.com", "calendar.app.google"],
    /* ALL CAPS words this long or longer are flagged, except these common acronyms. */
    capsMinLetters: 4,
    capsAllow: ["GDPR", "HTML", "HTTP", "HTTPS", "JSON", "NASA", "SAAS", "B2B", "B2C", "SOC2", "HIPAA", "ISO"],
    /* Spam phrases: a curated subset of HubSpot's list (81 entries). Whole phrase, any case. */
    spamPhrases: [
      "as seen on",
      "additional income",
      "be your own boss",
      "double your",
      "earn extra cash",
      "extra income",
      "make money",
      "money making",
      "potential earnings",
      "work from home",
      "best price",
      "big bucks",
      "cash bonus",
      "cents on the dollar",
      "fast cash",
      "incredible deal",
      "lowest price",
      "million dollars",
      "money back",
      "no cost",
      "no fees",
      "one hundred percent free",
      "pure profit",
      "save big money",
      "serious cash",
      "why pay more?",
      "full refund",
      "explode your business",
      "no hidden costs",
      "no investment",
      "get paid",
      "financially independent",
      "click below",
      "click here",
      "bulk email",
      "direct marketing",
      "increase sales",
      "increase traffic",
      "increase your sales",
      "more internet traffic",
      "mass email",
      "not spam",
      "this isn't spam",
      "we hate spam",
      "will not believe your eyes",
      "visit our website",
      "100% free",
      "100% satisfied",
      "50% off",
      "join millions",
      "one hundred percent guaranteed",
      "financial freedom",
      "giving away",
      "no catch",
      "no gimmick",
      "no obligation",
      "no questions asked",
      "no strings attached",
      "what are you waiting for?",
      "you have been selected",
      "sign up free today",
      "free gift",
      "free money",
      "free consultation",
      "cancel at any time",
      "drastically reduced",
      "fantastic deal",
      "promise you",
      "risk free",
      "satisfaction guaranteed",
      "act now",
      "call now",
      "do it today",
      "don't hesitate",
      "limited time",
      "offer expires",
      "once in lifetime",
      "order now",
      "take action now",
      "supplies are limited",
      "urgent"
    ]
  };
  var C = COLD_EMAIL_CHECKER_CONFIG;
  var SRC = {
    boomerang: { label: "Boomerang, 40 million emails (2016)", href: BOOMERANG_URL },
    boomerangHouse: { label: "Boomerang, plus an Ignura house threshold", href: BOOMERANG_URL },
    hubspot: { label: "HubSpot\u2019s list of spam trigger words", href: HUBSPOT_URL },
    houseOutbound: { label: "Ignura house rule", href: FIX_OUTBOUND },
    houseB2B: { label: "Ignura house rule", href: B2B_POST }
  };
  var normalise = (s2) => s2.replace(/\r\n?/g, "\n").replace(/[‘’‚‛′]/g, "'").replace(/[“”„‟″]/g, '"').replace(/\u00a0/g, " ");
  function htmlToText(raw) {
    const images = (raw.match(/<img\b/gi) || []).length;
    if (!/<\/?[a-z][^>]*>/i.test(raw)) return { text: raw, images };
    const text = raw.replace(/<img\b[^>]*>/gi, " ").replace(/<(br|\/p|\/div|\/li|\/h\d)\b[^>]*>/gi, "\n").replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi, " $1 ").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    return { text, images };
  }
  function stripQuoted(text) {
    const lines = text.split("\n");
    const out = [];
    let stripped = false;
    for (const l of lines) {
      if (/^\s*On\b.{3,200}\bwrote:\s*$/i.test(l) || /^-{2,}\s*(Original|Forwarded) Message\s*-{2,}/i.test(l)) {
        stripped = true;
        break;
      }
      if (/^\s*>/.test(l)) {
        stripped = true;
        continue;
      }
      out.push(l);
    }
    return { text: out.join("\n"), stripped };
  }
  var SIGNOFF = /^(best|best wishes|best regards|kind regards|warm regards|regards|thanks|thanks again|thank you|many thanks|cheers|all the best|warmly|talk soon|speak soon|sincerely)[,.!]?$/i;
  var NAME_ONLY = /^[A-Z][a-zA-Z'.]*( [A-Z][a-zA-Z'.]*){0,2}$/;
  function splitSignature(text) {
    const lines = text.replace(/\s+$/, "").split("\n");
    const n = lines.length;
    const dash = lines.findIndex((l) => /^\s*--\s*$/.test(l));
    let cut = dash >= 0 ? dash : -1;
    if (cut < 0) {
      const from = Math.max(1, n - 7);
      for (let i = from; i < n; i++) {
        const t = lines[i].trim();
        if (!t) continue;
        const rest = lines.slice(i + 1).filter((l) => l.trim());
        const restShort = rest.every((l) => l.trim().split(/\s+/).length <= 8 && !/\?/.test(l)) && rest.length <= 5;
        if (SIGNOFF.test(t) && restShort) {
          cut = i;
          break;
        }
        if (NAME_ONLY.test(t) && t.split(" ").length <= 3 && restShort && i >= n - 6 && !SIGNOFF.test(t)) {
          cut = i;
          break;
        }
      }
    }
    if (cut < 0) return { body: text, sigLines: 0 };
    const sig = lines.slice(cut).filter((l) => l.trim()).length;
    return { body: lines.slice(0, cut).join("\n"), sigLines: sig };
  }
  var TOKEN_RES = {
    "{{\u2026}}": /\{\{\s*[^{}\n]{1,40}?\s*\}\}/g,
    "{\u2026}": /(?<!\{)\{[A-Za-z_][^{}\n]{0,40}\}(?!\})/g,
    "[\u2026]": /\[[A-Za-z][^\[\]\n]{0,40}\](?!\()/g,
    "%\u2026%": /%[A-Za-z_][A-Za-z0-9_ ]{0,40}%/g
  };
  function findTokens(text) {
    const found = [];
    for (const [style, re] of Object.entries(TOKEN_RES)) for (const m of text.matchAll(re)) found.push({ style, token: m[0] });
    return found;
  }
  var TOKEN_ANY = new RegExp(Object.values(TOKEN_RES).map((r) => r.source).join("|"), "g");
  var TOKEN_MARK = "\u2063TOKEN\u2063";
  var withTokens = (t) => t.replace(TOKEN_ANY, TOKEN_MARK);
  function words(text) {
    return withTokens(text).split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w) || w.includes(TOKEN_MARK));
  }
  function sentences(text) {
    return withTokens(text).split(/\n+|(?<=[.!?…])["')\]]*\s+/u).map((s2) => s2.trim()).filter((s2) => /[\p{L}\p{N}]/u.test(s2) || s2.includes(TOKEN_MARK)).map((s2) => s2.replaceAll(TOKEN_MARK, "[token]"));
  }
  function syllables(word) {
    let w = word.toLowerCase().replace(/[^a-z]/g, "");
    if (!w) return 0;
    if (w.length <= 3) return 1;
    w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
    const m = w.match(/[aeiouy]{1,2}/g);
    return Math.max(1, m ? m.length : 1);
  }
  function fkGrade(text) {
    const ws = words(text).filter((w) => !w.includes(TOKEN_MARK)).map((w) => w.replace(/[^\p{L}\p{N}'-]/gu, "")).filter(Boolean);
    const ss = Math.max(1, sentences(text).length);
    if (!ws.length) return 0;
    const syl = ws.reduce((a, w) => a + syllables(w), 0);
    return Math.max(0, 0.39 * (ws.length / ss) + 11.8 * (syl / ws.length) - 15.59);
  }
  var BASIC = new Set("the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us is are was were am has had did been being does call week chat talk meet hi hello thanks thank team help sell sales email emails reply saw noticed quick worth open next minutes hiring company product customers startup founder build list run send let here more much very really sure love great happy best regards cheers".split(" "));
  function looksEnglish(text) {
    const ws = words(text).map((w) => w.toLowerCase().replace(/[^a-z']/g, "")).filter(Boolean);
    if (ws.length < 10) return true;
    const hit = ws.filter((w) => BASIC.has(w) || BASIC.has(w.replace(/'s$/, ""))).length;
    return hit / ws.length >= 0.15;
  }
  var URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"')\]]+/gi;
  var BARE_RE = /(?<![@\w.\/-])(?:[a-z0-9-]+\.)+(?:com|io|co|ai|app|net|org|dev|so|xyz|me|ly|gg|to|tech|tools|uk|us|de|fr|eu|example)(?:\/[^\s<>"')\]]*)?(?![\w@])/gi;
  function findLinks(text) {
    const t = text.replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, " ");
    const full = t.match(URL_RE) || [];
    const rest = t.replace(URL_RE, " ");
    const bare = (rest.match(BARE_RE) || []).filter((d) => !/^\d+(\.\d+)+$/.test(d));
    return [...full, ...bare].map((l) => l.replace(/[.,;:!?]+$/, ""));
  }
  var isBooking = (link) => C.bookingHosts.some((h) => link.toLowerCase().includes(h));
  var esc = (s2) => s2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function findSpam(text) {
    const t = normalise(text);
    const hits = [];
    for (const p of C.spamPhrases) {
      const re = new RegExp(`(?<![\\p{L}\\p{N}])${esc(p)}(?![\\p{L}\\p{N}])`, "giu");
      for (const m of t.matchAll(re)) hits.push(m[0]);
    }
    const caps = (t.replace(TOKEN_ANY, " ").match(/\b[A-Z][A-Z0-9']+\b/g) || []).filter((w) => (w.match(/[A-Z]/g) || []).length >= C.capsMinLetters && !C.capsAllow.includes(w));
    hits.push(...caps);
    hits.push(...t.match(/!{2,}/g) || []);
    hits.push(...t.match(/\${2,}/g) || []);
    return [...new Set(hits)];
  }
  var s = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
  function check(inp) {
    const { text: rawText, images } = htmlToText(normalise(inp.body));
    const { text: unquoted, stripped } = stripQuoted(rawText);
    const sig = splitSignature(unquoted);
    const body = inp.includeSignature ? unquoted : sig.body;
    const subject = normalise(inp.subject).trim();
    const first = !inp.followUp;
    const checks = [];
    const wc = words(body).length;
    checks.push({
      id: "words",
      name: "Word count",
      state: wc > C.wordsMax || wc < C.wordsMin ? "look" : "fine",
      found: `${s(wc, "word")} in the body${sig.sigLines && !inp.includeSignature ? ", not counting the signature" : ""}.`,
      rule: `Emails of ${C.wordsMin} to ${C.wordsMax} words all had response rates above 50%.`,
      source: SRC.boomerang,
      fix: wc > C.wordsMax ? "Cut it to the one reason you\u2019re writing and one question." : wc < C.wordsMin ? "Add one line on why them, and why now." : "Keep it this length."
    });
    let grade = null;
    let gradeSkip = "";
    if (wc < C.minWordsForGrade) gradeSkip = "too_short";
    else if (!looksEnglish(body)) gradeSkip = "non_english";
    if (gradeSkip) {
      checks.push({
        id: "grade",
        name: "Reading level",
        state: "skipped",
        found: gradeSkip === "too_short" ? "Too short to check reading level." : "Reading level only works for English, and most of these words aren\u2019t in our basic English list, so we skipped it.",
        rule: `Grade ${C.gradeFlagAt} or higher is worth a look (our house threshold). Boomerang found emails at a 3rd grade reading level did best.`,
        source: SRC.boomerangHouse,
        fix: ""
      });
    } else {
      grade = Math.round(fkGrade(body));
      const ss = sentences(body);
      const longest = ss.reduce((a, b) => words(b).length > words(a).length ? b : a, "");
      const look = grade >= C.gradeFlagAt;
      checks.push({
        id: "grade",
        name: "Reading level",
        state: look ? "look" : "fine",
        found: `Flesch-Kincaid grade ${grade}.`,
        rule: `Grade ${C.gradeFlagAt} or higher is worth a look (our house threshold). Boomerang found emails at a 3rd grade reading level got 36% more replies than college level.`,
        source: SRC.boomerangHouse,
        fix: look ? "Use shorter sentences and everyday words. Your longest sentence is highlighted." : "Keep the sentences this short.",
        marks: look && longest ? [longest] : void 0
      });
    }
    const spam = findSpam(`${first ? subject + "\n" : ""}${body}`);
    checks.push({
      id: "spam",
      name: "Spam words",
      state: spam.length ? "look" : "fine",
      found: spam.length ? `${s(spam.length, "match", "matches")}.` : "No words from the list, no ALL CAPS words, no !! or $$.",
      rule: "Phrases from HubSpot\u2019s spam trigger list, ALL CAPS words, !! and $$. Spam words alone don\u2019t decide where an email lands.",
      source: SRC.hubspot,
      fix: spam.length ? "Swap these for plain words." : "Nothing to swap.",
      marks: spam.length ? spam : void 0
    });
    const links = findLinks(body);
    const booking = links.filter(isBooking);
    const linkLook = first && C.flagAnyLinkInFirstEmail && links.length > 0;
    checks.push({
      id: "links",
      name: "Links",
      state: linkLook ? "look" : "fine",
      found: links.length ? `${s(links.length, "link")} in the body${first ? " of a first email" : ""}.` : "No links in the body.",
      rule: "No link in a first email. Ask in words, and send the link once they reply.",
      source: SRC.houseOutbound,
      fix: linkLook ? "Take the link out of the first email. Send it once they reply." : links.length ? "Fine in a follow-up once they\u2019ve replied." : "Keep it link free."
    });
    checks.push({
      id: "booking",
      name: "Booking link",
      state: booking.length ? "look" : "fine",
      found: booking.length ? `${s(booking.length, "booking link")} found.` : "No booking links.",
      rule: "Ask for the call in words. A booking link asks a stranger to do the work before they\u2019ve said yes.",
      source: SRC.houseOutbound,
      fix: booking.length ? "Ask for the call in words instead of sending a booking link." : "Keep asking in words."
    });
    const md = (body.match(/!\[[^\]]*\]\([^)]*\)/g) || []).length;
    const att = (body.replace(/strings attached/gi, "").match(/\battach(?:ed|ment|ments)\b/gi) || []).length;
    const imgN = images + md;
    checks.push({
      id: "images",
      name: "Images and attachments",
      state: imgN + att ? "look" : "fine",
      found: imgN + att ? [imgN ? s(imgN, "image") : "", att ? `${imgN ? "the" : "The"} word \u201Cattached\u201D or \u201Cattachment\u201D ${s(att, "time")}` : ""].filter(Boolean).join(" and ") + "." : "No images and no mention of attachments.",
      rule: "Plain text only in the first email, with no images and no attachments.",
      source: SRC.houseB2B,
      fix: imgN + att ? "Send plain text only. No images or attachments in the first email." : "Keep it plain text."
    });
    const toks = findTokens(`${subject}
${body}`);
    const styles = new Set(toks.map((t) => t.style));
    const unfilled = toks.filter((t) => t.style === "[\u2026]" || /\b(first|last)\s*name|company|name\b/i.test(t.token) && t.style !== "{{\u2026}}");
    let tokState = "fine", tokFound, tokFix, tokNote;
    if (!toks.length) {
      tokFound = "No merge tokens.";
      tokFix = "Add one line that shows you looked at them.";
      tokNote = "A soft note: make sure one line is about them, not you.";
    } else if (styles.size > 1) {
      tokState = "look";
      tokFound = `Mixed token styles: ${[...styles].join(" and ")}.`;
      tokFix = "Check each token has a fallback, or fill it in.";
    } else if (unfilled.length) {
      tokState = "look";
      tokFound = `${s(unfilled.length, "token")} that look${unfilled.length === 1 ? "s" : ""} unfilled.`;
      tokFix = "Check each token has a fallback, or fill it in.";
    } else {
      tokFound = `${s(toks.length, "token")}, one style.`;
      tokFix = "Check each token has a fallback.";
    }
    checks.push({ id: "tokens", name: "Personalisation tokens", state: tokState, found: tokFound, rule: "One token style, each with a fallback, and one line that shows you looked at them.", source: SRC.houseOutbound, fix: tokFix, note: tokNote });
    const qn = (body.match(/\?/g) || []).length;
    checks.push({
      id: "questions",
      name: "Questions",
      state: qn < C.questionsMin || qn > C.questionsMax ? "look" : "fine",
      found: `${s(qn, "question")}.`,
      rule: `Emails asking ${C.questionsMin} to ${C.questionsMax} questions were 50% more likely to get a response than emails asking none.`,
      source: SRC.boomerang,
      fix: qn < C.questionsMin ? "End with one clear question." : qn > C.questionsMax ? `Cut it to one to three questions.` : "Keep the one clear question."
    });
    const last3 = sentences(body).slice(-3).join(" ").toLowerCase();
    const asked = C.askPhrases.some((p) => new RegExp(`\\b${esc(p)}\\b`, "i").test(last3));
    checks.push({
      id: "ask",
      name: "The ask",
      state: asked ? "fine" : "look",
      found: asked ? "An ask in the last three sentences." : "No ask in the last three sentences.",
      rule: "Ask for a call in plain words at the end, with no link.",
      source: SRC.houseOutbound,
      fix: asked ? "Keep it to one clear ask." : "Ask for a call in plain words, like: Worth a 15-minute call next week?"
    });
    if (first) {
      const clean = subject.replace(/^((re|fwd?|aw|wg)\s*:\s*)+/i, "").trim();
      const sw = clean ? clean.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;
      const allCaps = /[A-Z]{2,}/.test(clean) && clean === clean.toUpperCase() && /[A-Z]/.test(clean);
      const look = !clean || sw > C.subjectMaxWords || allCaps;
      checks.push({
        id: "subject",
        name: "Subject length",
        state: look ? "look" : "fine",
        found: !clean ? "No subject line." : `${s(sw, "word")}${allCaps ? ", in ALL CAPS" : ""}.`,
        rule: `Subjects of 3 to 4 words got the most responses. Over ${C.subjectMaxWords} words, empty or ALL CAPS is worth a look.`,
        source: SRC.boomerang,
        fix: look ? "Aim for 3 or 4 plain words." : "Keep it short and plain."
      });
      const fake = /^\s*(re|fwd?)\s*:/i.test(subject);
      checks.push({
        id: "fake_reply",
        name: "Fake reply",
        state: fake ? "look" : "fine",
        found: fake ? "The subject starts with Re: or Fwd: in a first email." : "No Re: or Fwd: on a first email.",
        rule: "A first email doesn\u2019t start with Re: or Fwd:.",
        source: SRC.houseOutbound,
        fix: fake ? "Take Re: or Fwd: out of the subject. It reads as a trick." : "Keep it that way."
      });
    }
    const flagged = checks.filter((c) => c.state === "look");
    const summary = [
      `Cold email check (${first ? "first email" : "follow-up"}): ${numbersLine({ words: wc, grade, questions: qn, links: links.length })}`,
      "",
      ...checks.filter((c) => c.state !== "skipped").map((c) => `${c.state === "look" ? "Worth a look" : "Looks fine"}: ${c.name}. ${c.found}${c.state === "look" ? ` Fix: ${c.fix}` : ""}`),
      "",
      `${s(flagged.length, "check")} worth a look. Rules and sources: ignura.com/tools/cold-email-checker`
    ].join("\n");
    return { checks, words: wc, grade, questions: qn, links: links.length, signatureLines: sig.sigLines, strippedQuoted: stripped, gradeSkip, summary };
  }
  var numbersLine = (r) => [s(r.words, "word"), r.grade === null ? "grade skipped" : `grade ${r.grade}`, s(r.questions, "question"), s(r.links, "link")].join(" \xB7 ");
  var wordsBucket = (n) => n < 50 ? "<50" : n <= 125 ? "50-125" : n <= 200 ? "126-200" : "200+";
  var gradeBucket = (g) => g === null ? "skipped" : g <= 4 ? "<=4" : g <= 6 ? "5-6" : g <= 9 ? "7-9" : "10+";
  var flagsBucket = (n) => n === 0 ? "0" : n <= 2 ? "1-2" : n <= 4 ? "3-4" : "5+";

  // cold-email-checker/src/main.ts
  var cap = (_event, _props = {}) => {
  };
  var MARKS = {
    fine: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="9" fill="currentColor"/><path d="m6 10.2 2.6 2.6L14 7.4" fill="none" stroke="var(--paper)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    look: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="8.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 5.8v5.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="14" r="1.2" fill="currentColor"/></svg>',
    skipped: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="8.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6.5 10h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
  };
  var root = document.querySelector("[data-cec]");
  if (root) init(root);
  function init(root2) {
    const q = (s2) => root2.querySelector(s2);
    const subject = q("[data-ce-subject]");
    const subjectWrap = q("[data-ce-subject-wrap]");
    const body = q("[data-ce-body]");
    const msg = q("[data-ce-msg]");
    const go = q("[data-ce-go]");
    const goHint = q("[data-ce-go-hint]");
    const sigWrap = q("[data-ce-sig-wrap]");
    const sig = q("[data-ce-sig]");
    const result = q("[data-ce-result]");
    const card = q("[data-ce-card]");
    const types = [...root2.querySelectorAll("[data-ce-type]")];
    let started = false, live = false, lastErr = "", lastChecked = "", timer = 0;
    let last = null;
    const everFlagged = /* @__PURE__ */ new Set();
    const fixedSent = /* @__PURE__ */ new Set();
    cap("tool_viewed");
    const followUp = () => types.find((t) => t.checked)?.value === "follow-up";
    const err = (type) => {
      if (type && type !== lastErr) cap("tool_error", { error_type: type });
      lastErr = type;
    };
    const setMsg = () => {
      const v = body.value;
      const msgs = [];
      let e = "";
      if (!v.trim()) {
        if (started) {
          msgs.push("Paste an email to check it.");
          e = "empty";
        }
      } else if (v.length >= COLD_EMAIL_CHECKER_CONFIG.maxBodyChars) {
        msgs.push(`This checker is for one email at a time, so it stops at ${COLD_EMAIL_CHECKER_CONFIG.maxBodyChars.toLocaleString("en-US")} characters.`);
        e = "too_long";
      }
      msg.textContent = msgs.join(" ");
      return e;
    };
    function run() {
      const v = body.value;
      go.disabled = !v.trim();
      goHint.hidden = !!v.trim();
      let e = setMsg();
      if (!v.trim()) {
        result.hidden = true;
        card.hidden = true;
        last = null;
        err(e);
        return;
      }
      if (!live) {
        err(e);
        return;
      }
      const r = check({ subject: subject.value, body: v, followUp: followUp(), includeSignature: sig.checked });
      if (!e && r.gradeSkip === "too_short") e = "too_short";
      if (!e && r.gradeSkip === "non_english") e = "non_english";
      err(e);
      render(r);
      const flagged = r.checks.filter((c) => c.state === "look").map((c) => c.id);
      for (const c of r.checks) {
        if (c.state === "look") everFlagged.add(c.id);
        else if (c.state === "fine" && everFlagged.has(c.id) && !fixedSent.has(c.id)) {
          fixedSent.add(c.id);
          cap("tool_completed", { action: "fixed" });
        }
      }
      const props = {
        words_bucket: wordsBucket(r.words),
        grade_bucket: gradeBucket(r.grade),
        flags_bucket: flagsBucket(flagged.length),
        flagged_checks: flagged,
        has_subject: !!subject.value.trim(),
        email_type: followUp() ? "follow-up" : "first"
      };
      const key = JSON.stringify(props);
      if (key !== lastChecked) {
        lastChecked = key;
        cap("tool_checked", props);
      }
      last = r;
    }
    function el(tag, cls = "", text = "") {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text) n.textContent = text;
      return n;
    }
    function item(c) {
      const li = el("li", `ce-check is-${c.state}`);
      const head = el("div", "ce-check-head");
      const mark = el("span", "tl-mark");
      mark.innerHTML = MARKS[c.state];
      head.append(mark, el("b", "ce-check-name", c.name), el("span", "ce-state", c.state === "look" ? "Worth a look" : c.state === "fine" ? "Looks fine" : "Skipped"));
      li.append(head, el("p", "ce-found", c.found));
      if (c.marks?.length) {
        const m = el("p", "ce-marks");
        c.marks.forEach((t, i) => {
          if (i) m.append(" ");
          m.append(el("mark", "", t));
        });
        li.append(m);
      }
      if (c.fix && c.state === "look") li.append(Object.assign(el("p", "ce-fix"), { textContent: `Fix: ${c.fix}` }));
      else if (c.note) li.append(el("p", "ce-fix", c.note));
      const rule = el("p", "ce-rule", `Rule: ${c.rule} `);
      const a = Object.assign(el("a", "", c.source.label), { href: c.source.href });
      if (/^https?:/.test(c.source.href)) a.rel = "noopener";
      rule.append("(", a, ")");
      li.append(rule);
      return li;
    }
    function render(r) {
      q("[data-ce-numbers]").textContent = numbersLine(r);
      const notes = [];
      if (r.strippedQuoted) notes.push("We left out quoted thread lines before counting.");
      q("[data-ce-notes]").textContent = notes.join(" ");
      sigWrap.hidden = r.signatureLines === 0 && !sig.checked;
      q("[data-ce-sig-text]").textContent = `We ignored what looks like your signature (${r.signatureLines} line${r.signatureLines === 1 ? "" : "s"}). Include it`;
      const order = { look: 0, fine: 1, skipped: 2 };
      q("[data-ce-checks]").replaceChildren(...[...r.checks].sort((a, b) => order[a.state] - order[b.state]).map(item));
      result.hidden = false;
      card.hidden = false;
    }
    const schedule = () => {
      clearTimeout(timer);
      timer = window.setTimeout(run, 300);
    };
    body.addEventListener("input", () => {
      if (!started && body.value.trim()) {
        started = true;
        cap("tool_started");
      }
      go.disabled = !body.value.trim();
      goHint.hidden = !!body.value.trim();
      schedule();
    });
    subject.addEventListener("input", schedule);
    sig.addEventListener("change", run);
    types.forEach((t) => t.addEventListener("change", () => {
      subjectWrap.classList.toggle("is-off", followUp());
      run();
    }));
    go.addEventListener("click", () => {
      if (!body.value.trim()) return;
      live = true;
      run();
      result.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    q("[data-ce-copy]").addEventListener("click", async () => {
      if (!last) return;
      try {
        await navigator.clipboard.writeText(last.summary);
        q("[data-ce-copied]").textContent = "Copied.";
        cap("tool_completed", { action: "copy" });
      } catch {
        q("[data-ce-copied]").textContent = "Couldn\u2019t copy. Select the report and copy it yourself.";
      }
    });
    document.querySelectorAll("[data-ce-cta]").forEach((a) => a.addEventListener("click", () => cap("cta_clicked", { placement: a.dataset.ceCta })));
  }
})();
