# AI Email Triage Agent

Monitors Gmail, classifies incoming emails with Groq, writes results to Google Sheets, and shows a live React dashboard.

Built as a one-day MVP for an internship demo: end-to-end agent loop on Google Apps Script with no separate backend server.

## Layout

- `apps-script/` — Google Apps Script backend (Gmail, Groq, Sheets, web API)
- `frontend/` — Vite + React dashboard
- `DEMO.md` — sample emails to send during a live demo

## Architecture

```mermaid
flowchart LR
  subgraph backend [Apps Script]
    Trigger[1min trigger]
    Poll[pollInbox]
    Groq[Groq LLM]
    Sheet[Google Sheets]
    # ✉️ AI Email Triage Agent

    ![status](https://img.shields.io/badge/status-Prototype-yellow)
    ![version](https://img.shields.io/badge/version-1.0.0-blue)
    ![license](https://img.shields.io/badge/license-MIT-green)
    ![frontend](https://img.shields.io/badge/frontend-Vite%2BReact-purple)
    ![backend](https://img.shields.io/badge/backend-Apps%20Script-red)

    A lightweight, demo-grade agent that polls Gmail, classifies incoming messages using an LLM (Groq), logs results to Google Sheets, and exposes a small React dashboard for live monitoring.

    Why this repo exists: a fast, end-to-end MVP that demonstrates an automated triage loop without a separate server—ideal for demos and experiments.

    ## Table of Contents
    - [Features](#features)
    - [Quick Start](#quick-start)
    - [Architecture](#architecture)
    - [Configuration](#configuration)
    - [Development](#development)
    - [Demo & Testing](#demo--testing)
    - [Limitations & Production Checklist](#limitations--production-checklist)
    - [Contributing](#contributing)
    - [License](#license)

    ## Features
    - ⚡ Automated triage: auto-reply, clarify, or escalate decisions
    - 📝 Persisted audit: every processed email is written to Google Sheets
    - 🧭 Live dashboard: Vite + React frontend polling an Apps Script JSON endpoint
    - 🔒 Minimal surface for quick demos; easily extendable for production hardening

    ## Quick Start
    # ✉️ AI Email Triage Agent

    ![status](https://img.shields.io/badge/status-Prototype-yellow)
    ![version](https://img.shields.io/badge/version-1.0.0-blue)
    ![license](https://img.shields.io/badge/license-MIT-green)
    ![frontend](https://img.shields.io/badge/frontend-Vite%2BReact-purple)
    ![backend](https://img.shields.io/badge/backend-Apps%20Script-red)

    A lightweight, demo-grade agent that polls Gmail, classifies incoming messages using an LLM (Groq), logs results to Google Sheets, and exposes a small React dashboard for live monitoring.

    Why this repo exists: a fast, end-to-end MVP that demonstrates an automated triage loop without a separate server—ideal for demos and experiments.

    ## Table of Contents
    - [Features](#features)
    - [Quick Start](#quick-start)
    - [Architecture](#architecture)
    - [Configuration](#configuration)
    - [Development](#development)
    - [Demo & Testing](#demo--testing)
    - [Limitations & Production Checklist](#limitations--production-checklist)
    - [Contributing](#contributing)
    - [License](#license)

    ## Features
    - ⚡ Automated triage: auto-reply, clarify, or escalate decisions
    - 📝 Persisted audit: every processed email is written to Google Sheets
    - 🧭 Live dashboard: Vite + React frontend polling an Apps Script JSON endpoint
    - 🔒 Minimal surface for quick demos; easily extendable for production hardening

    ## Quick Start
    1. Create or choose a Google Sheet and note its ID.
    2. Open `apps-script/Code.gs` in the Google Apps Script editor and set Script Properties (see Configuration below).
    3. Deploy the Apps Script web app and copy the deployment URL.
    4. Set `VITE_APPS_SCRIPT_URL` in `frontend/.env` and run the frontend:

    ```bash
    cd frontend
    npm install
    npm run dev
    ```

    For production builds:

    ```bash
    npm run build
    ```



    ## Configuration
    Required script properties (set in Apps Script Project Settings):

    - `GROQ_API_KEY` — Groq API key
    - `SPREADSHEET_ID` — target Google Sheet ID
    - `HUMAN_SUPPORT_EMAIL` — escalation recipient
    - `POLL_LOOKBACK_MINUTES` — optional (default 10)

    Frontend environment:

    Create `frontend/.env` with:

    ```env
    VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/your-deployment-id/exec
    ```

    Notes:
    - Do not commit `.env` files or secrets.
    - Apps Script reads from Script Properties, not `.env`.

    ## Development

    Frontend commands:

    ```bash
    cd frontend
    npm install
    npm run dev   # local dev server
    npm run build # production build
    npm test      # run unit tests (Vitest)
    ```

    Source layout (quick):
    - `apps-script/` — Apps Script code (`Code.gs`)
    - `frontend/` — Vite + React app
    - `frontend/src/lib/` — triage helpers and tests

    ## Demo & Testing
    - See `DEMO.md` for example emails to send for each triage outcome.
    - Tests: `frontend/src/lib/*.test.js` run under Vitest.

    ## Limitations & Production Checklist
    This project is a demo MVP. Before using in production consider:

    - Add authentication to the Apps Script `doGet` endpoint
    - Use Gmail push notifications or Pub/Sub instead of frequent polling
    - Add server-side validation and idempotency guarantees
    - Introduce human approval workflows for outbound replies
    - Harden prompts and sanitize inputs to reduce prompt-injection risks

    ## Contributing
    - Open an issue for feature requests or bugs.
    - Create PRs against `main` with focused changes and tests where applicable.

    ## License
    This project is provided under the MIT license. See the `LICENSE` file for details.

    ---

    If you'd like, I can also add a small demo GIF or SVG screenshot placeholder, tighten the badges to reference a real GitHub repo, or add a short troubleshooting table copied from the previous README. Which would you prefer next?
