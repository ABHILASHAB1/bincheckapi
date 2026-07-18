import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Float, Integer, JSON, Text, Enum
from sqlalchemy import UUID
from sqlalchemy.orm import relationship
from app.infrastructure.database import Base
import enum

class VerificationStatus(enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

class Merchant(Base):
    __tablename__ = "merchant"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    legal_name = Column(String(255), nullable=True)
    tax_id = Column(String(100), nullable=True, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    aliases = relationship("MerchantAlias", back_populates="merchant", cascade="all, delete-orphan")
    branches = relationship("MerchantBranch", back_populates="merchant", cascade="all, delete-orphan")
    locations = relationship("MerchantLocation", back_populates="merchant", cascade="all, delete-orphan")
    contacts = relationship("MerchantContact", back_populates="merchant", cascade="all, delete-orphan")
    ratings = relationship("MerchantRating", back_populates="merchant", cascade="all, delete-orphan", uselist=False)
    categories = relationship("MerchantCategory", back_populates="merchant", cascade="all, delete-orphan")
    payment_methods = relationship("MerchantPaymentMethod", back_populates="merchant", cascade="all, delete-orphan")
    ai_enrichment = relationship("MerchantAI", back_populates="merchant", cascade="all, delete-orphan", uselist=False)
    verification = relationship("MerchantVerification", back_populates="merchant", cascade="all, delete-orphan", uselist=False)
    risk = relationship("MerchantRisk", back_populates="merchant", cascade="all, delete-orphan", uselist=False)

class MerchantAlias(Base):
    __tablename__ = "merchant_alias"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchant.id"), nullable=False, index=True)
    alias_name = Column(String(255), nullable=False, index=True)
    merchant = relationship("Merchant", back_populates="aliases")

class MerchantLocation(Base):
    __tablename__ = "merchant_location"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchant.id"), nullable=False)
    address_line_1 = Column(String(255), nullable=True)
    address_line_2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(2), nullable=True, index=True) # ISO2
    postal_code = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    merchant = relationship("Merchant", back_populates="locations")

class MerchantBranch(Base):
    __tablename__ = "merchant_branch"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchant.id"), nullable=False)
    branch_name = Column(String(255), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("merchant_location.id"), nullable=True)
    merchant = relationship("Merchant", back_populates="branches")

class MerchantContact(Base):
    __tablename__ = "merchant_contact"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchant.id"), nullable=False)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    social_links = Column(JSON, nullable=True) # e.g. {"twitter": "...", "linkedin": "..."}
    merchant = relationship("Merchant", back_populates="contacts")

class MerchantCategory(Base):
    __tablename__ = "merchant_category"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchant.id"), nullable=False)
    mcc_code = Column(String(4), nullable=True, index=True)
    category_name = Column(String(100), nullable=True)
    is_inferred = Column(Boolean, default=False)
    merchant = relationship("Merchant", back_populates="categories")

class MerchantPaymentMethod(Base):
    __tablename__ = "merchant_payment_method"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchant.id"), nullable=False)
    method_name = Column(String(50), nullable=False, index=True) # Visa, Apple Pay, etc.
    merchant = relationship("Merchant", back_populates="payment_methods")

class MerchantRating(Base):
    __tablename__ = "merchant_rating"
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchant.id"), primary_key=True)
    average_rating = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)
    merchant = relationship("Merchant", back_populates="ratings")

class MerchantAI(Base):
    __tablename__ = "merchant_ai"
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchant.id"), primary_key=True)
    ai_summary = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True)
    enrichment_data = Column(JSON, nullable=True)
    last_enriched_at = Column(DateTime, nullable=True)
    merchant = relationship("Merchant", back_populates="ai_enrichment")

class MerchantVerification(Base):
    __tablename__ = "merchant_verification"
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchant.id"), primary_key=True)
    status = Column(String(50), default=VerificationStatus.PENDING.value)
    verified_by = Column(UUID(as_uuid=True), nullable=True) # User ID
    verified_at = Column(DateTime, nullable=True)
    merchant = relationship("Merchant", back_populates="verification")

class MerchantRisk(Base):
    __tablename__ = "merchant_risk"
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchant.id"), primary_key=True)
    risk_score = Column(Float, default=0.0)
    risk_factors = Column(JSON, nullable=True)
    merchant = relationship("Merchant", back_populates="risk")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_name = Column(String(100), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    action = Column(String(50), nullable=False) # CREATE, UPDATE, DELETE
    changes = Column(JSON, nullable=True)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
