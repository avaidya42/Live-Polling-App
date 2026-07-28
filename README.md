# Live Polling App

Full-stack live poll/voting app. No WebSockets — the results page re-fetches
`GET /polls/{id}/results` every 2.5 seconds to fake real-time.

```
live-polling-app/
├── backend/     FastAPI + Postgres
└── frontend/    React + Vite + Tailwind
```

## 0. Finish the Postgres setup (if you haven't already)

You should already have Postgres 16 installed locally. Confirm these are done:

1. `polls` database created, `pgcrypto` extension enabled on it
2. `pg_hba.conf` reverted back to `scram-sha-256` (not left on `trust`)
3. You know the `postgres` user's password

If any of that is unfinished, go back and finish it before continuing — the
backend won't start without a reachable database.

## 1. Install Node.js (needed for the frontend)

Frontend needs Node 18+. Easiest on Windows:

```
winget install OpenJS.NodeJS.LTS
```

Open a **new** terminal window afterward so PATH picks it up, then confirm:

```
node -v
npm -v
```

## 2. Run the backend

Open a terminal in `backend/`:

```
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` and set your real Postgres password:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/polls
```

Then start it:
```
uvicorn main:app --reload
```

Leave this terminal running. Check it worked by visiting
`http://localhost:8000/docs` in a browser — you should see the interactive
API docs.

## 3. Run the frontend

Open a **second** terminal in `frontend/`:

```
npm install
copy .env.example .env
npm run dev
```

`.env` should already point at the right place by default:
```
VITE_API_BASE_URL=http://localhost:8000
```

Then open the URL it prints — typically `http://localhost:5173`.

## 4. Try it end to end

1. On the homepage, create a poll with a question + a couple options
2. You'll land on a share screen with a link + QR code
3. Open that link (a different browser, or an incognito window, works well
   for simulating a second voter) and cast a vote
4. Open "View live results" — vote again from another window/incognito
   session and watch the bar chart update within ~2.5 seconds without
   refreshing the page

## Notes on how a few things work

- **Duplicate-vote prevention**: each browser gets a random ID stored in
  `localStorage` (see `frontend/src/lib/fingerprint.js`), sent with every
  vote. The backend enforces a uniqueness constraint on `(poll_id,
  voter_fingerprint)` — so even if the frontend check is bypassed, the DB
  still rejects a second vote with a 409. This is a lightweight deterrent,
  not a security boundary — clearing localStorage resets it. Worth
  mentioning as a known, deliberate limitation if asked.
- **Race conditions on concurrent votes**: `vote_count` is updated with an
  atomic `UPDATE ... SET vote_count = vote_count + 1`, not a read-then-write,
  so simultaneous votes can't clobber each other (see `backend/main.py`).
- **No WebSockets**: the results page just polls every 2.5s
  (`frontend/src/pages/ResultsPage.jsx`). Deliberate simplicity tradeoff —
  see the design doc / prior discussion for the reasoning.

## Not done yet

- Deployment configs (Render/Railway for backend+DB, Vercel/Netlify for
  frontend)
- Alembic migrations (currently `Base.metadata.create_all` on startup)
- Rate limiting on poll creation
