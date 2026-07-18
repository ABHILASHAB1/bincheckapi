from typing import List, Optional, Any
from sqlalchemy.orm import Session
from app.infrastructure.repositories.merchant import merchant_repo
from app.domain.models.merchant import Merchant
import uuid

class MerchantService:
    def __init__(self, db: Session):
        self.db = db

    def get_merchant(self, merchant_id: uuid.UUID) -> Optional[Merchant]:
        return merchant_repo.get(self.db, id=merchant_id)

    def get_all_merchants(self, skip: int = 0, limit: int = 100) -> List[Merchant]:
        return merchant_repo.get_all(self.db, skip=skip, limit=limit)

    def create_merchant(self, merchant_data: dict) -> Merchant:
        # Business logic can go here (e.g. checking if already exists, emitting events)
        return merchant_repo.create(self.db, obj_in=merchant_data)

    def update_merchant(self, merchant_id: uuid.UUID, merchant_data: dict) -> Optional[Merchant]:
        db_obj = merchant_repo.get(self.db, id=merchant_id)
        if not db_obj:
            return None
        return merchant_repo.update(self.db, db_obj=db_obj, obj_in=merchant_data)

    def search(self, query: str, skip: int = 0, limit: int = 100) -> List[Merchant]:
        return merchant_repo.search_merchants(self.db, query, skip, limit)
