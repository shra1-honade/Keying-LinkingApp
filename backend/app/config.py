"""Application configuration."""
import os
from dotenv import load_dotenv

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_BASE_DIR, ".env"))
_DB_PATH = os.path.join(_BASE_DIR, "bizmatch.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{_DB_PATH}")
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
ORG_ID_DEFAULT = "demo_org"

# Email Configuration (SMTP)
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "") or os.getenv("SMTP_USER", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "BizMatch Notifications")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
