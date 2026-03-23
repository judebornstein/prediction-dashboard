# Prediction Dashboard

A real-time analytics tool that tracks the top 100 most profitable Polymarket traders, identifies consensus signals from whale activity, and compares sports betting odds across major bookmakers.

Built with zero dependencies — vanilla HTML, CSS, and JavaScript with a lightweight Node.js proxy server.

![Prediction Dashboard](preview.png)

## Features

### Polymarket Whale Tracker

- **Leaderboard Scraping** — Pulls the top 100 all-time most profitable traders from Polymarket's Data API
- **Parallel Position Fetching** — Retrieves open positions for each trader in batches of 10 to stay within rate limits
- **Signal Engine** — Detects markets where 5+ top traders hold the same position, ranked by consensus strength
- **Noise Filtering** — Only surfaces positions above $500 to focus on high-conviction bets
- **Live Metrics** — Dashboard cards showing traders analyzed, signals found, strongest signal, and total positions tracked

### Odds Analyzer

- **Multi-Sport Support** — NBA, NFL, MLB, and NHL odds from The Odds API
- **Bookmaker Comparison** — Side-by-side odds from every available US bookmaker
- **Value Detection** — Best available line highlighted per team
- **Implied Probability** — Calculated and displayed for every line
- **Persistent API Key** — Stored in localStorage, enter it once

### Telegram Alerts

- **Real-Time Notifications** — Automatically sends a Telegram message when the signal engine detects a new whale consensus (5+ traders aligned)
- **Easy Setup** — Enter your bot token and chat ID in the dashboard UI, hit Save
- **Test Button** — Verify the connection with a single click before going live
- **Persistent Config** — Bot token and chat ID saved to a local config file, survives server restarts

## Quick Start

```bash
git clone https://github.com/judebornstein/prediction-dashboard.git
cd prediction-dashboard
./start.sh
```

This starts the Node.js server on `http://localhost:3000` and opens the dashboard in your browser.

**Requirements:** Node.js (no npm install needed)

### Odds Analyzer Setup

The Odds Analyzer tab requires a free API key from [The Odds API](https://the-odds-api.com/). Enter it in the input field — it's saved to localStorage automatically.

### Telegram Setup

1. Create a bot via [@BotFather](https://t.me/BotFather) on Telegram and copy the bot token
2. Send `/start` to your new bot so it can message you
3. Enter the bot token and your chat ID in the Telegram Alerts section at the bottom of the Whale Tracker tab
4. Click **Send Test Message** to confirm it works

## Architecture

```
prediction-dashboard/
├── index.html              # Single-file frontend (HTML + CSS + JS)
├── server.js               # Node.js server (static files + API proxy + Telegram)
├── telegram-config.json    # Local Telegram credentials (gitignored)
├── start.sh                # One-command launcher
└── README.md
```

The Node.js server handles CORS by proxying external API calls and provides Telegram integration endpoints:

| Route | Purpose |
|---|---|
| `/api/polymarket-data/*` | Proxy to `data-api.polymarket.com` |
| `/api/odds/*` | Proxy to `api.the-odds-api.com/v4` |
| `/api/setup-telegram` | Save bot token + chat ID |
| `/api/test-telegram` | Send a test message |
| `/api/send-signal` | Send a whale signal alert |

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript — no frameworks, no build step
- **Backend:** Node.js `http` + `https` modules — zero dependencies
- **APIs:** [Polymarket Data API](https://docs.polymarket.com), [The Odds API](https://the-odds-api.com/), [Telegram Bot API](https://core.telegram.org/bots/api)
- **Design:** Dark theme, responsive layout, modern card-based UI

## License

MIT
