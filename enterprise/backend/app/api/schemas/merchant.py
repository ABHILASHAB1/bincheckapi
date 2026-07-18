from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class MerchantBase(BaseModel):
    name: str
    legal_name: Optional[str] = None
    tax_id: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True

class MerchantCreate(MerchantBase):
    pass

class MerchantUpdate(BaseModel):
    name: Optional[str] = None
    legal_name: Optional[str] = None
    tax_id: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class MerchantResponse(MerchantBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
