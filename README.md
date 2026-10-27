# Heurekka web

The web side of Heurekka (Next.js): the staff admin site, Creator Studio, the business portal, and public pages for threads shared from the app.

```bash
npm install
npm run dev        # http://localhost:3000
```

## Settings

| Variable | What |
|---|---|
| `HEUREKKA_API` | The API, server-side only. Defaults to `http://localhost:4000/api/v1`; on staging, `https://heurekka-server.onrender.com/api/v1`. |

## What's real and what's prototype

| Part | State |
|---|---|
| `/thread/<id>` | Real. Shared links from the app (Share on a thread) land here: the post, the top replies, a link preview, and "Open in the app" (`heurekka://app/thread/<id>`). Only public Spaces and open Labs. |
| Admin sign-in | Real. Staff email and password, then a 6-digit authenticator code (set up with a QR code the first time). The session lives in httpOnly cookies; the browser never holds API tokens. |
| Admin dashboard, Users, Spaces, Review queue → Reports, Appeals, Clips and Leader candidates, Live Buzz, Rules, Audit log | Real. Staff can dismiss reports, remove posts, warn, mute, suspend and ban (with a reason the person sees), decide appeals (not their own decisions), and admins tune the automatic rules. Live Buzz lists running sessions; staff can listen in silently (LiveKit, hidden), warn the host, end it, or stop the host going live. Every action is in the audit log. Users show friends, who blocked them (a count), and DM activity as counts. Staff only ever see a DM when the person it was sent to reports it. |
| Other admin sections (Shop, Quests, certificates, advertisers, payouts, finance, economy), Studio, business portal | Prototype data until their stages ship. Marked "Prototype data" on screen where they sit next to real data. |

## Staff accounts

Staff sign up in the app like anyone else, then the server makes them staff (run in the `server` repo, against the right `DATABASE_URL`):

```bash
npm run staff -- add someone@example.com admin      # or moderator, finance
npm run staff -- reset-2fa someone@example.com      # lost their authenticator
npm run staff -- remove someone@example.com
npm run staff -- list
```

Admins see every section. Moderators: queue, users, Spaces, live Buzz. Finance: queue (Quests, advertisers, payouts), users, finance and economy. The server enforces the same rules.

## How it talks to the API

Browser code calls this app's own route handlers under `/api/admin/…` (`src/app/api/admin`). They attach the session from the cookies, refresh it when it expires, and pass the call to the API (`src/lib/hk-server.ts`). Public pages fetch the API's `/public/…` endpoints directly on the server.
