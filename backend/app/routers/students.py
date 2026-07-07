"""
Students router — REAL implementation. This is the reference pattern:
copy this shape (real DB queries via SQLAlchemy async session, real
response models) when filling in the other stubbed routers.

Every query below is scoped by parent_user_id, using the logged-in parent's
id from `get_current_parent_id` (see auth.py for the Supabase JWT verification).
"""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, cast, Integer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.orm import Student, Attempt, Question, Topic
from app.models.schemas import StudentCreate, StudentCreateOut, StudentOut, MasteryStat
from app.routers.auth import get_current_parent_id, get_current_student

router = APIRouter()


async def _mastery_for_student(db: AsyncSession, student_id: UUID) -> list[MasteryStat]:
    stmt = (
        select(
            Topic.id.label("topic_id"),
            Topic.name.label("topic_name"),
            func.count(Attempt.id).label("total_first_attempts"),
            func.sum(cast(Attempt.is_correct, Integer)).label("correct_first_attempts"),
        )
        .join(Question, Question.topic_id == Topic.id)
        .join(Attempt, Attempt.question_id == Question.id)
        .where(Attempt.student_id == student_id, Attempt.attempt_number == 1)
        .group_by(Topic.id, Topic.name)
    )
    rows = (await db.execute(stmt)).all()
    return [
        MasteryStat(
            topic_id=r.topic_id,
            topic_name=r.topic_name,
            total_first_attempts=r.total_first_attempts,
            accuracy_rate=round((r.correct_first_attempts or 0) / r.total_first_attempts * 100, 1)
            if r.total_first_attempts else 0.0,
        )
        for r in rows
    ]


@router.post("", response_model=StudentCreateOut)
async def create_student(
    payload: StudentCreate,
    db: AsyncSession = Depends(get_db),
    parent_id: UUID = Depends(get_current_parent_id),
):
    raw_code = secrets.token_hex(3)  # e.g. "a1b2c3" — shown to parent once, given to the child
    code_hash = hashlib.sha256(raw_code.encode()).hexdigest()

    student = Student(
        parent_user_id=parent_id,
        display_name=payload.display_name,
        grade_level=payload.grade_level,
        login_code_hash=code_hash,
        login_code_expires_at=datetime.now(timezone.utc) + timedelta(days=90),
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)

    return StudentCreateOut(
        id=student.id,
        display_name=student.display_name,
        grade_level=student.grade_level,
        xp_total=student.xp_total,
        streak_days=student.streak_days,
        login_code=raw_code,
    )


@router.get("", response_model=list[StudentOut])
async def list_students(
    db: AsyncSession = Depends(get_db),
    parent_id: UUID = Depends(get_current_parent_id),
):
    result = await db.execute(select(Student).where(Student.parent_user_id == parent_id))
    students = result.scalars().all()
    return [
        StudentOut(
            id=s.id, display_name=s.display_name, grade_level=s.grade_level,
            xp_total=s.xp_total, streak_days=s.streak_days,
        )
        for s in students
    ]


@router.get("/me", response_model=StudentOut)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    student: dict = Depends(get_current_student),
):
    """The student-side counterpart to list_students — used by the student
    dashboard, authenticated with the student's own login-code session.

    Registered ahead of `/{student_id}/mastery` below: FastAPI matches routes
    in registration order, and `/{student_id}` is a wildcard that would
    otherwise swallow `/me` requests first and 422 on the UUID parse.
    """
    s = await db.get(Student, student["student_id"])
    if s is None:
        raise HTTPException(status_code=404, detail="Student not found.")
    return StudentOut(
        id=s.id, display_name=s.display_name, grade_level=s.grade_level,
        xp_total=s.xp_total, streak_days=s.streak_days,
    )


@router.get("/me/mastery", response_model=list[MasteryStat])
async def get_my_mastery(
    db: AsyncSession = Depends(get_db),
    student: dict = Depends(get_current_student),
):
    return await _mastery_for_student(db, student["student_id"])


@router.get("/{student_id}/mastery", response_model=list[MasteryStat])
async def get_mastery(
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
    parent_id: UUID = Depends(get_current_parent_id),
):
    """
    Implements the spec's mastery formula:
        accuracy_rate = (correct first attempts / total first attempts) * 100
    grouped by topic, using only attempt_number = 1 rows (first tries only —
    retries from the review queue don't count toward mastery).
    """
    # Ownership check: student must belong to this parent.
    owns = await db.execute(
        select(Student.id).where(Student.id == student_id, Student.parent_user_id == parent_id)
    )
    if owns.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Student not found.")

    return await _mastery_for_student(db, student_id)
