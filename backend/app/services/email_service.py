"""Email notification service using Python built-in smtplib."""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app import config


def is_configured() -> bool:
    """Check if SMTP settings are configured."""
    return bool(config.SMTP_HOST and config.SMTP_USER and config.SMTP_PASSWORD)


def send_email(
    to_email: str,
    subject: str,
    html_body: str,
    plain_body: str | None = None,
) -> None:
    """Send an email via SMTP.

    Raises:
        RuntimeError: If SMTP is not configured.
        smtplib.SMTPException: If sending fails.
    """
    if not is_configured():
        raise RuntimeError(
            "SMTP not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD environment variables."
        )

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{config.SMTP_FROM_NAME} <{config.SMTP_FROM_EMAIL}>"
    msg["To"] = to_email
    msg["Subject"] = subject

    if not plain_body:
        plain_body = subject

    msg.attach(MIMEText(plain_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    if config.SMTP_USE_TLS and config.SMTP_PORT == 465:
        with smtplib.SMTP_SSL(config.SMTP_HOST, config.SMTP_PORT) as server:
            server.login(config.SMTP_USER, config.SMTP_PASSWORD)
            server.send_message(msg)
    else:
        with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT) as server:
            if config.SMTP_USE_TLS:
                server.starttls()
            server.login(config.SMTP_USER, config.SMTP_PASSWORD)
            server.send_message(msg)
