from typing import Optional, List
from sqlalchemy.orm import Session
from app.infrastructure.repositories.base import BaseRepository
from app.domain.models.merchant import Merchant

class MerchantRepository(BaseRepository[Merchant]):
    def __init__(self):
        super().__init__(Merchant)

    def get_by_name(self, db: Session, name: str) -> Optional[Merchant]:
        return db.query(self.model).filter(self.model.name == name).first()
        
    def search_merchants(self, db: Session, query: str, skip: int = 0, limit: int = 100) -> List[Merchant]:
        return db.query(self.model).filter(
            self.model.name.ilike(f"%{query}%") |
            self.model.legal_name.ilike(f"%{query}%")
        ).offset(skip).limit(limit).all()

merchant_repo = MerchantRepository()
