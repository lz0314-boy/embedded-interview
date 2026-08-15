import secrets

from fastapi import HTTPException, status

from .config import Settings


def verify_access_token(x_assistant_token: str | None, settings: Settings) -> None:
    if settings.local_only:
        return
    configured = settings.assistant_access_token
    if configured is None or not configured.get_secret_value():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI assistant access token is not configured",
        )
    if not x_assistant_token or not secrets.compare_digest(
        x_assistant_token, configured.get_secret_value()
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid assistant access token",
        )
