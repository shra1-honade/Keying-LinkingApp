"""BizMatch API - Enterprise B2B SaaS Application."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import CORS_ORIGINS
from app.database import init_db
from app.routers import configs, runs, preferences, snowflake, audit, datasource

app = FastAPI(
    title="BizMatch API",
    version="2.0.0",
    description="Enterprise B2B data matching platform by Equifax",
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": str(exc) if app.debug else "An unexpected error occurred",
        },
    )


app.include_router(configs.router)
app.include_router(runs.router)
app.include_router(preferences.router)
app.include_router(snowflake.router)
app.include_router(audit.router)
app.include_router(datasource.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {"message": "BizMatch API", "version": "2.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "2.0.0"}
