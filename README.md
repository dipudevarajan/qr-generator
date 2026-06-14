# QRCraft — Free Branded QR Code Generator

A fully self-contained, single-file QR code generator with no backend, no sign-up, and no watermarks.

## Features

- **Single URL mode** — Paste any URL and generate a styled QR instantly
- **Multi-Link Page mode** — Build a Linktree-style landing page with multiple links, download the HTML, host it, then generate a QR pointing to it
- **Logo upload** — Upload any PNG/SVG/JPG to embed in the center of your QR code
- **Color customization** — Pick QR dot color, background color, and button accent color
- **Live preview** — See the phone preview update in real time
- **Download QR** — Exports as a high-resolution PNG (520×520)
- **Download link page** — Self-contained HTML file, ready to host anywhere
- **No external dependencies** — Only uses `qrcode.js` from cdnjs (no backend needed)

## Hosting with Caddy

```caddyfile
yourdomain.com {
    root * /var/www/qrcraft
    file_server
}
```

Drop `index.html` into `/var/www/qrcraft/` and you're done.

## Multi-Link Page Workflow

1. Fill in your brand name, tagline, logo, and links
2. Click **Download link page (HTML)** — save as `links.html`
3. Host `links.html` on your server (e.g. `yourdomain.com/links`)
4. Paste the live URL into the **Hosting URL** field
5. Click **Generate QR Code** — download the PNG

## Self-hosting the link page alongside the generator

If you want both on the same server:

```
/var/www/qrcraft/
  index.html      ← QR generator
  links.html      ← Generated link page (upload after creating)
```

Then your QR points to `https://yourdomain.com/links`.

## Domain suggestions

- `qrcraft.io` ✨
- `linkqr.io`
- `qrhub.app`
- `qrpages.io`
- `snaplink.app`

## Tech stack

- Pure HTML + CSS + Vanilla JS
- [qrcodejs](https://github.com/davidshimjs/qrcodejs) via cdnjs
- Google Fonts (Inter + Space Grotesk)
- Zero build step — deploy as-is

## License

MIT
