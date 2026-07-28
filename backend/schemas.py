import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class PollCreate(BaseModel):
    question: str = Field(..., min_length=1, max_length=280)
    options: List[str] = Field(..., min_length=2, max_length=10)
    expires_in_minutes: Optional[int] = Field(None, description="Poll closes this many minutes from creation")


class OptionOut(BaseModel):
    id: uuid.UUID
    text: str

    class Config:
        from_attributes = True


class PollOut(BaseModel):
    id: uuid.UUID
    question: str
    created_at: datetime
    expires_at: Optional[datetime]
    options: List[OptionOut]

    class Config:
        from_attributes = True


class PollCreateResponse(BaseModel):
    id: uuid.UUID
    share_url: str
    results_url: str


class VoteCreate(BaseModel):
    option_id: uuid.UUID
    voter_fingerprint: str = Field(..., min_length=8, max_length=128)


class OptionResult(BaseModel):
    id: uuid.UUID
    text: str
    vote_count: int


class PollResults(BaseModel):
    id: uuid.UUID
    question: str
    total_votes: int
    options: List[OptionResult]
    is_closed: bool
