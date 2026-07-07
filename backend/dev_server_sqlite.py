"""
Local-dev-only entrypoint for machines where `asyncpg` has no prebuilt wheel
(e.g. Windows ARM64) — swaps DATABASE_URL to a file-based SQLite DB *before*
app.db.session creates its engine, creates the schema if missing, and seeds
one Subject/Topic/Question so the frontend has something to render.

This is NOT how the app runs in production (Render uses real Postgres via
`uvicorn app.main:app`) — it exists purely so this workstation can preview
the frontend end-to-end. Real Supabase Auth is still used for parent/student
login; only the plain Postgres tables (students, subjects, questions, ...)
are swapped to SQLite here.
"""
import asyncio
import os
import sys
from pathlib import Path

DB_PATH = Path(__file__).parent / "dev_sqlite.db"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{DB_PATH.as_posix()}"

sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(Path(__file__).parent / ".env")
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{DB_PATH.as_posix()}"  # re-assert after load_dotenv

from app.db.orm import AnswerKey, Base, Question, Subject, Topic  # noqa: E402
from app.db.session import engine, SessionLocal  # noqa: E402


async def seed_if_empty():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        from sqlalchemy import select

        existing = (await db.execute(select(Subject))).scalars().first()
        if existing is not None:
            return

        subject = Subject(name="AP Calculus", description="Seeded for local preview")
        db.add(subject)
        await db.flush()

        topic = Topic(subject_id=subject.id, name="Related Rates", sort_order=0)
        db.add(topic)
        await db.flush()

        q1 = Question(
            topic_id=topic.id, prompt_text="What is 7 + 5?",
            question_type="multiple_choice", difficulty="easy",
        )
        db.add(q1)
        await db.flush()
        db.add_all([
            AnswerKey(question_id=q1.id, option_label="A", option_text="11", is_correct=False),
            AnswerKey(question_id=q1.id, option_label="B", option_text="12", is_correct=True),
            AnswerKey(question_id=q1.id, option_label="C", option_text="13", is_correct=False),
        ])

        q2 = Question(
            topic_id=topic.id, prompt_text="Solve for x: 2x + 3 = 11",
            question_type="free_response", difficulty="medium",
        )
        db.add(q2)
        await db.flush()
        db.add(AnswerKey(question_id=q2.id, option_label=None, option_text="4", is_correct=True))

        await db.commit()
        print(f"Seeded dev SQLite DB at {DB_PATH}")


if __name__ == "__main__":
    asyncio.run(seed_if_empty())

    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
