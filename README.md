# 三倉建設株式会社 — Equipment QR lookup

Public, read-only equipment lookup backed by Google Sheets through an Apps Script JSON endpoint. Visitors do not need a Google account. The server fetches the data; visitors stay on this site's domain.

Company contact: 三倉建設株式会社 / 03-3932-3225. The page includes a tap-to-call link and a message for people who find lost equipment.

## Source

- `worker/index.js`: Cloudflare Workers compatible server and Japanese HTML interface.
- `scripts/build.mjs`: copies the server and hosting manifest into `dist/`.
- `.openai/hosting.json`: existing Sites deployment identity; this is not a GitHub credential.

Run `node --check worker/index.js` and `node scripts/build.mjs` with Node.js. No npm dependencies are required.

Use `/?id=1` to look up a registered equipment number. Unknown numbers show a not-registered message while retaining the company contact information.

## Hosting

The live server is currently hosted through Sites. GitHub can store this source. GitHub Pages alone cannot execute `worker/index.js`: it requires a server runtime, such as Cloudflare Workers, to fetch the Apps Script endpoint on behalf of visitors.

The Apps Script public deployment must support `?format=json&id=1`, returning `{ "item": { ... } }` for a registered item or `{ "item": null }` for an unknown item. Its access remains read-only; this repository does not contain the Google Sheets editing interface.

## QR labels

QR codes must contain the public website URL plus `?id=<management number>`. Existing labels containing Apps Script URLs do not automatically change when this website is updated.
