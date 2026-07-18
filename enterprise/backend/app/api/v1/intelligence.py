from fastapi import APIRouter, HTTPException, status
from app.api.schemas.intelligence import (
    BINLookupResponse, 
    RoutingValidationRequest, 
    RoutingValidationResponse,
    IBANValidationRequest,
    IBANValidationResponse
)
from app.core.services.bin_lookup import BINService
from app.core.services.validation import ValidationService

router = APIRouter()

@router.get("/bin/{bin_number}", response_model=BINLookupResponse)
def lookup_bin(bin_number: str):
    result = BINService.lookup_bin(bin_number)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="BIN not found or invalid.")
    return result

@router.post("/validate/routing", response_model=RoutingValidationResponse)
def validate_routing(request: RoutingValidationRequest):
    return ValidationService.validate_routing_number(request.routing_number)

@router.post("/validate/iban", response_model=IBANValidationResponse)
def validate_iban(request: IBANValidationRequest):
    return ValidationService.validate_iban(request.iban)

from fastapi import Request, Depends
from sqlalchemy.orm import Session
from app.infrastructure.database import get_db
from app.api.schemas.activity import ActivityTrackRequest, ActivityTrackResponse, NormalizedGeoData
from app.core.services.geolocation import GeolocationService
from app.domain.models.activity import UserActivity
import uuid

@router.get("/geo/{ip_address}", response_model=NormalizedGeoData)
def get_geo(ip_address: str):
    geo = GeolocationService.get_geolocation(ip_address)
    if not geo:
        raise HTTPException(status_code=404, detail="Geolocation not found")
    return geo

@router.post("/activity", response_model=ActivityTrackResponse)
def track_activity(payload: ActivityTrackRequest, request: Request, db: Session = Depends(get_db)):
    ip_address = request.client.host
    if request.headers.get("X-Forwarded-For"):
        ip_address = request.headers.get("X-Forwarded-For").split(",")[0].strip()

    geo = GeolocationService.get_geolocation(ip_address)
    
    activity = UserActivity(
        user_id=uuid.UUID(payload.user_id) if payload.user_id else None,
        action=payload.action,
        ip_address=ip_address,
        geo_data=geo.dict() if geo else None
    )
    db.add(activity)
    db.commit()
    
    return ActivityTrackResponse(
        success=True,
        action=payload.action,
        ip_address=ip_address,
        geo_data=geo
    )

from typing import List

@router.get("/activity")
def get_recent_activities(limit: int = 50, db: Session = Depends(get_db)):
    """Fetch recent user activities for the admin console."""
    activities = db.query(UserActivity).order_by(UserActivity.created_at.desc()).limit(limit).all()
    return [{
        "id": str(act.id),
        "action": act.action,
        "ip_address": act.ip_address,
        "search_query": act.search_query,
        "latency_ms": act.latency_ms,
        "geo_data": act.geo_data,
        "created_at": act.created_at.isoformat()
    } for act in activities]
