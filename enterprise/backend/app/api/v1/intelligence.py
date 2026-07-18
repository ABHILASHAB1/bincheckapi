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
