from pydantic import BaseModel
from typing import Optional

class BINLookupResponse(BaseModel):
    bin: str
    brand: str
    type: str
    level: str
    issuer: str
    country_code: str
    country_name: str
    currency: str
    is_prepaid: bool
    is_commercial: bool

class RoutingValidationRequest(BaseModel):
    routing_number: str

class RoutingValidationResponse(BaseModel):
    is_valid: bool
    routing_number: Optional[str] = None
    error: Optional[str] = None

class IBANValidationRequest(BaseModel):
    iban: str

class IBANValidationResponse(BaseModel):
    is_valid: bool
    iban: Optional[str] = None
    country_code: Optional[str] = None
    error: Optional[str] = None
