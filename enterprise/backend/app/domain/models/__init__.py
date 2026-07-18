from app.infrastructure.database import Base

# Import all models here so Alembic can find them
from .merchant import (
    Merchant, MerchantAlias, MerchantLocation, MerchantBranch,
    MerchantContact, MerchantCategory, MerchantPaymentMethod,
    MerchantRating, MerchantAI, MerchantVerification, MerchantRisk,
    AuditLog
)
from .user import (
    User, Role, ApiKey, ApiUsage, Subscription, Billing
)

# All models are now registered with Base.metadata
