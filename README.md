# adfreeqr.com — Free Branded QR Code Generator

Live: **https://adfreeqr.com**

Free, open source, ad-free QR code generator with branded logos, custom colors, and a hosted link-page feature.

## Features

- **Single URL mode** — generate a styled QR for any URL
- **Multi-Link Page mode** — create a Linktree-style link page with multiple URLs
- **Free hosting** — link pages hosted on adfreeqr.com (data encoded in URL hash, no server storage)
- **Custom hosting** — download the HTML and host on your own server
- **Logo upload** — embed a logo in the QR center
- **Analytics dashboard** — admin panel at `/admin/` with generation count, country breakdown, daily charts

## Project structure

```
qr-generator/
├── index.html          # Main app
├── p/index.html        # Link page viewer (reads encoded data from URL hash)
├── admin/index.html    # Analytics dashboard
├── api/                # Analytics backend
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
└── README.md
```

## How free hosting works

When users choose "Host on adfreeqr.com":
1. Link page data is serialized → LZ-compressed → URL-safe base64
2. Result appended to `/p/#d=<encoded>`
3. Viewer at `/p/` decodes and renders client-side
4. No server storage, no database, links live forever

## Deployment

See the project for full Caddy + Docker setup. Auto-deploys via GitHub webhook → server.

## License

MIT
