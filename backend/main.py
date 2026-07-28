import os
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import models
import schemas
from database import engine, get_db, Base

# In production, use Alembic migrations instead of create_all.
Base.metadata.create_all(bind=engine)

FRONTEND_BASE_URL = os.environ.get("FRONTEND_BASE_URL", "http://localhost:5173")

app = FastAPI(title="Live Polling API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/polls", response_model=schemas.PollCreateResponse, status_code=201)
def create_poll(payload: schemas.PollCreate, db: Session = Depends(get_db)):
    expires_at = None
    if payload.expires_in_minutes:
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=payload.expires_in_minutes)

    poll = models.Poll(question=payload.question, expires_at=expires_at)
    poll.options = [models.Option(text=text) for text in payload.options]

    db.add(poll)
    db.commit()
    db.refresh(poll)

    return schemas.PollCreateResponse(
        id=poll.id,
        share_url=f"{FRONTEND_BASE_URL}/poll/{poll.id}",
        results_url=f"{FRONTEND_BASE_URL}/poll/{poll.id}/results",
    )


@app.get("/polls/{poll_id}", response_model=schemas.PollOut)
def get_poll(poll_id: str, db: Session = Depends(get_db)):
    poll = db.get(models.Poll, poll_id)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    return poll


@app.post("/polls/{poll_id}/vote", status_code=201)
def cast_vote(poll_id: str, payload: schemas.VoteCreate, db: Session = Depends(get_db)):
    poll = db.get(models.Poll, poll_id)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")

    if poll.expires_at and poll.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Poll has closed")

    option = db.get(models.Option, payload.option_id)
    if not option or str(option.poll_id) != str(poll_id):
        raise HTTPException(status_code=400, detail="Option does not belong to this poll")

    vote = models.Vote(
        poll_id=poll_id,
        option_id=payload.option_id,
        voter_fingerprint=payload.voter_fingerprint,
    )
    db.add(vote)

    try:
        db.flush()

        db.execute(
            update(models.Option)
            .where(models.Option.id == payload.option_id)
            .values(vote_count=models.Option.vote_count + 1)
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="You've already voted on this poll")

    return {"status": "ok"}


@app.get("/polls/{poll_id}/results", response_model=schemas.PollResults)
def get_results(poll_id: str, db: Session = Depends(get_db)):
    poll = db.get(models.Poll, poll_id)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")

    total = sum(o.vote_count for o in poll.options)
    is_closed = bool(poll.expires_at and poll.expires_at < datetime.now(timezone.utc))

    return schemas.PollResults(
        id=poll.id,
        question=poll.question,
        total_votes=total,
        options=[
            schemas.OptionResult(id=o.id, text=o.text, vote_count=o.vote_count)
            for o in poll.options
        ],
        is_closed=is_closed,
    )
