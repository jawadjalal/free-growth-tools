# Free growth tools

Five small tools for founders and marketers. Each one is a static page that runs in your browser: no sign-up, no server, no analytics, and nothing you type is sent or stored.

| Tool | What it does | Live |
| --- | --- | --- |
| [UTM builder](utm-builder/) | Build UTM links with presets, catch case and spacing mistakes, see the likely GA4 channel, bulk mode and QR code. | [ignura.com/tools/utm-builder](https://ignura.com/tools/utm-builder) |
| [Cold email checker](cold-email-checker/) | Check a cold email for length, reading level, spam words, links, questions and a clear ask. | [ignura.com/tools/cold-email-checker](https://ignura.com/tools/cold-email-checker) |
| [SERP preview](serp-preview/) | Preview a title and meta description as a Google result, with pixel widths and where they may get cut. | [ignura.com/tools/serp-preview](https://ignura.com/tools/serp-preview) |
| [Headline analyzer](headline-analyzer/) | Check a headline or hook against six plain editorial rules. No score. | [ignura.com/tools/headline-analyzer](https://ignura.com/tools/headline-analyzer) |
| [Sales funnel calculator](sales-funnel-calculator/) | Work back from a customer goal to the demos you need to hold, book and source, using your own rates. | [ignura.com/tools/sales-funnel-calculator](https://ignura.com/tools/sales-funnel-calculator) |

## Run locally

Open any tool's `index.html` in your browser. The built `app.js` is committed, so there's nothing to install.

Or serve the folder:

```sh
npx serve .
# or
python3 -m http.server 8000
```

## Change a tool

Each tool keeps its logic in `src/core.ts` (pure functions, no DOM) and its page wiring in `src/main.ts`. Rebuild with:

```sh
npm install
npm run build
```

This bundles each `src/main.ts` into that tool's `app.js` with esbuild. The UTM builder bundles the [qrcode](https://github.com/soldair/node-qrcode) package (MIT) for its QR codes.

## Notes

- The rules each tool uses, and where they come from, are listed on its live page.
- The SERP preview measures pixel widths with your browser's fonts, so results are estimates. Google can rewrite or cut titles and snippets differently.
- The headline analyzer's rules are an editorial guide, not a score.
- The sales funnel calculator uses only the rates you enter. It has no built-in benchmarks.

## Licence

MIT. See [LICENSE](LICENSE).

Ignura builds growth solutions for startups. [ignura.com](https://ignura.com)
