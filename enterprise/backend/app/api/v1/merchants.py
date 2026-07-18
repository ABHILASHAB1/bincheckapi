from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from app.api.schemas.merchant import MerchantResponse, MerchantCreate, MerchantUpdate
from app.api.dependencies import get_merchant_service
from app.core.services.merchant import MerchantService

router = APIRouter()

@router.post("/", response_model=MerchantResponse, status_code=status.HTTP_201_CREATED)
def create_merchant(
    merchant: MerchantCreate,
    service: MerchantService = Depends(get_merchant_service)
):
    return service.create_merchant(merchant.model_dump())

@router.get("/", response_model=List[MerchantResponse])
def get_merchants(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    service: MerchantService = Depends(get_merchant_service)
):
    if search:
        return service.search(query=search, skip=skip, limit=limit)
    return service.get_all_merchants(skip=skip, limit=limit)

@router.get("/{merchant_id}", response_model=MerchantResponse)
def get_merchant(
    merchant_id: UUID,
    service: MerchantService = Depends(get_merchant_service)
):
    merchant = service.get_merchant(merchant_id)
    if not merchant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Merchant not found")
    return merchant

@router.put("/{merchant_id}", response_model=MerchantResponse)
def update_merchant(
    merchant_id: UUID,
    merchant_update: MerchantUpdate,
    service: MerchantService = Depends(get_merchant_service)
):
    updated = service.update_merchant(merchant_id, merchant_update.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Merchant not found")
    return updated
