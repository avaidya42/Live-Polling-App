-- Live Polling App — Postgres schema

CREATE TABLE polls (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question    TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at  TIMESTAMPTZ
);

CREATE TABLE options (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id     UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    vote_count  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE votes (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id           UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id         UUID NOT NULL REFERENCES options(id) ON DELETE CASCADE,
    voter_fingerprint TEXT NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (poll_id, voter_fingerprint)
);

-- Indexes that matter once traffic is non-trivial:
CREATE INDEX idx_options_poll_id ON options(poll_id);
CREATE INDEX idx_votes_poll_id ON votes(poll_id);

-- Note: gen_random_uuid() requires the pgcrypto extension:
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;
