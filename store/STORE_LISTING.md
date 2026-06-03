# tminus - Chrome Web Store submission kit

Everything you need to paste into the Chrome Web Store dashboard. Upload package:
`tminus-store.zip` (in the project root).

---

## Account + cost (one time)
1. Go to https://chrome.google.com/webstore/devconsole
2. Sign in with your Google account.
3. Pay the one-time $5 developer registration fee (Google charges this once, ever).
4. Click "New Item" and upload `tminus-store.zip`.

Review usually takes a few days. You will get an email when it is approved.

---

## Store listing fields

**Item name**
```
tminus
```

**Summary** (short description, max 132 chars)
```
Replace your new tab with a live countdown to the deadline that matters. Your logo, subtitle, and links. Minimal and fully yours.
```

**Description** (detailed)
```
tminus turns every new tab into a single, calm countdown to the thing you are working toward.

One big number, counting down in days with the fraction ticking live. Your own logo or emoji. An optional subtitle. A few quick links. That is the whole page. No feeds, no widgets, no clutter.

Inspired by a YC founder who pinned a live demo-day timer to their browser, tminus lets anyone do the same for any deadline.

FEATURES
- A featured deadline shown as one large countdown, with smaller secondary deadlines underneath
- Pick a logo: choose an emoji, upload an image, or paste an image URL
- An optional subtitle under the logo
- Quick links shown as a clean, pipe-separated row
- Six minimalist backgrounds (Paper, Ink, Slate, Sage, Sand, Midnight) and four fonts (Sans, Rounded, Serif, Mono)
- Everything saves automatically and stays on your device

PRIVATE BY DESIGN
tminus has no account and no server. Your deadlines, links, and settings are stored locally in your browser. The only network requests are loading favicons for the links you add and any image-URL logo you choose. Nothing about you is collected or sent anywhere.

Open source: https://github.com/AkbarDevop/tminus
```

**Category**: Productivity  (subcategory: Workflow & Planning)

**Language**: English

**Screenshots** (1280x800, in this folder): upload all four
- screenshot-1-paper.png
- screenshot-2-ink.png
- screenshot-3-midnight-serif.png
- screenshot-4-customize.png

**Small promo tile** (440x280, optional): promo-440x280.png

**Store icon**: uses the 128x128 in the package (icons/icon128.png).

**Homepage URL**: https://github.com/AkbarDevop/tminus

---

## Privacy tab (required to publish)

**Single purpose**
```
tminus replaces the browser's new tab page with a customizable countdown to the user's chosen deadlines, plus a logo and quick links.
```

**Permission justification - storage**
```
Used to save the user's deadlines, quick links, logo, subtitle, and appearance settings locally so they persist across new tabs and sessions.
```

**Are you using remote code?**  No (all code is bundled in the package).

**Host permissions**: none requested.

**Data usage** (check these):
- Does NOT collect or use user data.
- Tick: "I do not sell or transfer user data to third parties, outside of the approved use cases."
- Tick: "I do not use or transfer user data for purposes that are unrelated to my item's single purpose."
- Tick: "I do not use or transfer user data to determine creditworthiness or for lending purposes."

**Privacy policy URL**
```
https://github.com/AkbarDevop/tminus/blob/main/PRIVACY.md
```

---

## Note on favicons
The settings panel fetches small site icons from Google's public favicon service
for the links you add. This is a standard image request and sends only the link's
domain. It is disclosed in PRIVACY.md. If a reviewer ever objects, the favicon
feature can be removed in one small change with no effect on the countdown.
