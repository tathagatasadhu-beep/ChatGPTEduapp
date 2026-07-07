"""Subjects/topics router — real implementation. Read-only, global library
(not scoped by parent — every family shares the same subject/topic catalog)."""
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.orm import Subject, Topic as TopicOrm
from app.db.session import get_db
from app.models.schemas import SubjectOut, Topic

router = APIRouter()


@router.get("", response_model=list[SubjectOut])
async def list_subjects(db: AsyncSession = Depends(get_db)):
    subjects = (await db.execute(select(Subject).order_by(Subject.name))).scalars().all()
    return [SubjectOut(id=s.id, name=s.name, description=s.description) for s in subjects]


@router.get("/{subject_id}/topics", response_model=list[Topic])
async def list_topics(subject_id: UUID, db: AsyncSession = Depends(get_db)):
    topics = (
        await db.execute(
            select(TopicOrm).where(TopicOrm.subject_id == subject_id).order_by(TopicOrm.sort_order, TopicOrm.name)
        )
    ).scalars().all()
    return [Topic(id=t.id, subject_id=t.subject_id, name=t.name) for t in topics]
