# Live Polling — Backend (Phase 1)

FastAPI + Postgres backend for the live polling app. No WebSockets — the
frontend will poll `GET /polls/{id}/results` every 2-3s instead.

## Setup

1. Create and activate a virtualenv:
   ```
   python3 -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Copy the env file and fill in your real Postgres URL:
   ```
   cp .env.example .env
   ```

4. Make sure the `pgcrypto` extension is enabled in your Postgres DB
   (needed for `gen_random_uuid()` if you run `schema.sql` manually):
   ```sql
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   ```

   Note: you don't have to run `schema.sql` by hand — `main.py` calls
   `Base.metadata.create_all()` on startup, which creates the tables
   from the SQLAlchemy models in `models.py`. `schema.sql` is there as a
   plain-SQL reference (useful for explaining the schema without reading
   Python, or for creating the DB manually on a host that doesn't like
   `create_all`).

5. Run the API:
   ```
   uvicorn main:app --reload
   ```

6. Visit the auto-generated docs to try the endpoints:
   ```
   http://localhost:8000/docs
   ```

## Endpoints

| Method | Path                     | Purpose                              |
|--------|--------------------------|---------------------------------------|
| POST   | /polls                   | Create a poll + options               |
| GET    | /polls/{id}              | Fetch poll (for the voting screen)    |
| POST   | /polls/{id}/vote         | Cast a vote                           |
| GET    | /polls/{id}/results      | Fetch current vote counts (polled)    |

## Files

```
backend/
├── main.py          # FastAPI app + routes
├── models.py        # SQLAlchemy models (Poll, Option, Vote)
├── schemas.py        # Pydantic request/response models
├── database.py       # DB engine/session setup
├── schema.sql        # Plain-SQL reference schema
├── requirements.txt
├── .env.example
└── .gitignore
```

## Not done yet (phase 2+)

- React frontend (CreatePoll, VotePage, ResultsPage, QRCode)
- Alembic migrations (currently using create_all, fine for now)
- Deployment configs (Render/Railway/Vercel)
- Rate limiting on poll creation
