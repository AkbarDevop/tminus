# New Tab (countdown)

A dead-simple Chrome new-tab page: one logo, one big number counting down to your
deadline in fractional days, and a row of links. Modeled on the YC startup
dashboard ("14.391769 days") that a founder pinned to their browser.

![New Tab](icons/icon128.png)

## What it shows

- A small **logo** (a letter in an accent square, an emoji, or your own image) with
  an optional **subtitle** underneath.
- One **big number**: days left until your featured deadline, with the fractional
  part ticking live beside it (`89.100286 days`).
- **Smaller secondary deadlines** below it (click one to make it the big number).
- A row of **quick links** (`Calendar | Mail | GitHub | Docs`), pipe-separated.

That's the whole page. Calm, centered. The countdown runs fully offline (no
accounts, no servers, no tracking). Favicons and image-URL logos are the only
things that touch the network, and only if you use them.

Optional extra (off by default): a faint "alive" age line below the links.

> The extension is named "New Tab" on purpose, so Chrome's little attribution chip
> at the bottom of the page blends in. Rename it in `manifest.json` if you like.

## Install (load unpacked, ~30 seconds)

This is the standard way to run a Chrome extension you have the files for. It does
not require the Chrome Web Store.

1. Open Chrome and go to `chrome://extensions`
2. Turn on **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select this folder: `deadline-tab`
5. Open a new tab.

To update later, edit the files and click the refresh icon on the extension card.

> Chrome only lets one extension own the new tab page at a time. If you already
> have a new-tab extension, disable it first.

### Chrome Web Store

Publishing to the store needs your own Google developer account (a one-time $5 fee)
and a short Google review. The packaged `deadline-os.zip` is ready to upload at
https://chrome.google.com/webstore/devconsole if you want to list it. Load unpacked
above is instant and free for personal use.

## Customize

Click **✎ Customize** in the top-right corner of the new tab.

- **Deadlines**: name, an optional subtitle (shows under the logo), a date (date
  only, your local timezone), which one is featured (the big number), and a logo.
  Click the icon button to open a picker: choose an **emoji** from the grid,
  **upload an image** (auto-shrunk, so size does not matter), or **paste an image
  URL**. Add or delete as many deadlines as you want.
- **Quick links**: label + URL, shown with the site's favicon in the editor. URLs
  without a scheme get `https://`; unsafe schemes are blocked.
- **Look**: background (Paper / Ink / Slate / Sage / Sand / Midnight / Match
  system) shown as color swatches, font (Sans / Rounded / Serif / Mono) shown as
  live previews, and how many fraction digits to show (3 / 6 / 9).
- **Age line** (optional): a faint "alive" readout, with a date-of-birth field.

Everything saves automatically.

## Files

```
manifest.json        MV3 manifest, overrides the new tab page
newtab.html          the page
newtab.css           styling (CSS variables per theme)
src/theme-init.js    applies the saved background before first paint (no flash)
src/time.js          pure date math (fractional-days countdown, age, formatting)
src/store.js         persistence (chrome.storage.local + localStorage fallback)
src/app.js           the rAF render loop and the settings panel
icons/               extension icons
src/time.test.mjs    unit tests (run: node src/time.test.mjs)
make_icons.py        regenerates the icons (run: python3 make_icons.py)
```

## Tech notes

- Manifest V3, vanilla JS, no build step, no dependencies.
- One `requestAnimationFrame` loop with write-on-diff: only the fractional digits
  that actually change touch the DOM each frame.
- `tabular-nums` so the number never jitters as it ticks.
- Honors `prefers-reduced-motion` (freezes the fractional digits).
- All scripts are external files (MV3 forbids inline scripts in extension pages).
- Link URLs are restricted to safe schemes; uploaded logos are validated.
