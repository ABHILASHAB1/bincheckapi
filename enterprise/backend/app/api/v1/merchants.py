from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from typing import List
from uuid import UUID
from app.api.schemas.merchant import MerchantResponse, MerchantCreate, MerchantUpdate
from app.api.schemas.enrichment import UnifiedMerchantResponse
from app.api.dependencies import get_merchant_service
from app.core.services.merchant import MerchantService
from app.core.services.enrichment import EnrichmentService
from app.infrastructure.database import get_db
from sqlalchemy.orm import Session
from app.domain.models.jurisdiction import JurisdictionRegister

router = APIRouter()

@router.get("/jurisdictions", tags=["Enrichment"])
def get_jurisdictions(db: Session = Depends(get_db)):
    """
    Returns a list of all supported OpenCorporates jurisdictions and registers.
    """
    jurisdictions = db.query(JurisdictionRegister).order_by(JurisdictionRegister.name).all()
    return [{"code": j.code, "name": j.name, "company_count": j.company_count} for j in jurisdictions]

@router.get("/enrich", response_model=UnifiedMerchantResponse, tags=["Enrichment"])
def enrich_merchant(
    query: str = Query(..., description="Raw transaction string or merchant name"), 
    jurisdiction_code: str = Query(None, description="Optional OpenCorporates jurisdiction code (e.g. us_ca)"),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Takes a raw transaction string (e.g. 'AMZN MKTPLACE PMTS*AB123') and normalizes it into 
    a UnifiedMerchantResponse using AI and third-party data providers (Clearbit, Maps, MCC Explorer).
    """
    import time
    start_time = time.time()
    
    # Run the enrichment service
    result = EnrichmentService.enrich_merchant(query)
    
    latency_ms = int((time.time() - start_time) * 1000)

    # Track the activity
    if request:
        ip_address = request.client.host
        if request.headers.get("X-Forwarded-For"):
            ip_address = request.headers.get("X-Forwarded-For").split(",")[0].strip()
            
        from app.core.services.geolocation import GeolocationService
        from app.domain.models.activity import UserActivity
        import uuid
        
        geo = GeolocationService.get_geolocation(ip_address)
        activity = UserActivity(
            action="merchant_search",
            ip_address=ip_address,
            geo_data=geo.dict() if geo else None,
            search_query=query,
            latency_ms=latency_ms
        )
        db.add(activity)
        db.commit()
        
        # Trigger Admin Notification if it's a new IP or error (if error was caught)
        from app.api.v1.telegram import notify_admin
        
        # Determine if it's a new IP by checking count
        ip_count = db.query(UserActivity).filter(UserActivity.ip_address == ip_address).count()
        if ip_count == 1: # Just inserted
            country = geo.country if geo else "Unknown Country"
            notify_admin(f"🔔 *New User Alert*\nSomeone from `{ip_address}` ({country}) just used the sandbox!\nQuery: `{query}`\nLatency: `{latency_ms}ms`")

    return result

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
