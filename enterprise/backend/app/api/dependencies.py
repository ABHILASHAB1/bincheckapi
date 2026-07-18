from typing import Generator
from fastapi import Depends
from sqlalchemy.orm import Session
from app.infrastructure.database import SessionLocal
from app.core.services.merchant import MerchantService

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_merchant_service(db: Session = Depends(get_db)) -> MerchantService:
    return MerchantService(db)
