"""Protected script to create (or promote) an admin account.

Admin accounts can NEVER be created through the public API or signup form.
The only safe ways to get an admin are this script or editing the database
directly. Run it from the backend folder:

    python create_admin.py admin@evolio.dev "StrongPassword123" "Site Admin"

If the email already exists, the account is promoted to admin and (optionally)
its password is updated.
"""

import os
import sys

# Make `from db... import ...` work regardless of the current directory.
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from auth.auth import hash_password, get_user_by_email  # noqa: E402
from db.models import User  # noqa: E402
from db.session import SessionLocal, init_db  # noqa: E402


def create_admin(email: str, password: str, name: str = "Administrator") -> None:
    if not email or not password:
        raise SystemExit("Usage: python create_admin.py <email> <password> [name]")
    if len(password) < 8:
        raise SystemExit("Password must be at least 8 characters.")

    init_db()
    db = SessionLocal()
    try:
        user = get_user_by_email(db, email)
        if user is None:
            user = User(
                email=email,
                full_name=name,
                password_hash=hash_password(password),
                role="admin",
            )
            db.add(user)
            action = "created"
        else:
            user.role = "admin"
            user.password_hash = hash_password(password)
            action = "promoted to admin"
        db.commit()
        print(f"Admin account {action}: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    args = sys.argv[1:]
    if len(args) < 2:
        raise SystemExit(
            'Usage: python create_admin.py <email> <password> ["Full Name"]'
        )
    email = args[0]
    password = args[1]
    name = args[2] if len(args) > 2 else "Administrator"
    create_admin(email, password, name)
