import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "evolio.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _existing_columns(conn, table):
    rows = conn.exec_driver_sql(f'PRAGMA table_info("{table}")').fetchall()
    return {row[1] for row in rows}


def _existing_tables(conn):
    rows = conn.exec_driver_sql(
        "SELECT name FROM sqlite_master WHERE type='table'"
    ).fetchall()
    return {row[0] for row in rows}


def init_db():
 
    import db.models  

    Base.metadata.create_all(bind=engine)

    added_columns = {
        "student_profiles": [("github", "VARCHAR"), ("linkedin", "VARCHAR")],
        "projects": [("content", "TEXT")],
        "users": [("status", "VARCHAR")],
    }
    with engine.begin() as conn:
        tables = _existing_tables(conn)
        for table, columns in added_columns.items():
            if table not in tables:
                continue
            have = _existing_columns(conn, table)
            for name, col_type in columns:
                if name not in have:
                    conn.exec_driver_sql(
                        f'ALTER TABLE "{table}" ADD COLUMN {name} {col_type}'
                    )

        # Existing accounts have no status yet -> treat them as active.
        if "users" in tables:
            conn.exec_driver_sql(
                "UPDATE users SET status = 'active' WHERE status IS NULL"
            )

        # One-time migration: the old "role_upgrade_requests" table (from the
        # previous dashboard-application workflow) is replaced by "applications".
        # Copy any rows over, then drop the obsolete table.
        if "role_upgrade_requests" in tables and "applications" in tables:
            conn.exec_driver_sql(
                "INSERT INTO applications "
                "(id, user_id, requested_role, message, status, "
                " reviewed_by, created_at, updated_at) "
                "SELECT id, user_id, requested_role, message, status, "
                " reviewed_by, created_at, updated_at "
                "FROM role_upgrade_requests"
            )
            conn.exec_driver_sql("DROP TABLE role_upgrade_requests")
