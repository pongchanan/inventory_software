from fastapi import HTTPException, status


def require_kmitl_email(email: str) -> str:
    """Normalise and enforce the allowed university email domain server-side."""
    clean_email = email.strip().lower()
    if not clean_email.endswith("@kmitl.ac.th"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only @kmitl.ac.th email addresses may register",
        )
    return clean_email
