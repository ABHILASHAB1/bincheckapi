from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import merchants, intelligence, telegram
from app.infrastructure.database import engine, Base
from app.domain.models import merchant, jurisdiction, activity

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RemitWise Enterprise API",
    description="Enterprise-grade Global Payment Intelligence API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(merchants.router, prefix="/api/v1/merchants", tags=["Merchants"])
app.include_router(intelligence.router, prefix="/api/v1/intelligence", tags=["Payment Intelligence"])
app.include_router(telegram.router, prefix="/api/v1/telegram", tags=["Telegram"])

@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint to verify API is running."""
    return {"status": "healthy", "service": "RemitWise Enterprise API"}

@app.get("/", tags=["System"])
async def root():
    return {"message": "Welcome to RemitWise Intelligence Platform"}
