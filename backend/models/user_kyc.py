"""
User and KYC/AML Models

SEBI Compliance:
- KYC (Know Your Customer) as per SEBI guidelines
- PEP (Politically Exposed Persons) screening
- AML (Anti-Money Laundering) risk scoring

SOC2 Compliance:
- Encrypted sensitive fields (PII protection)
- Audit trail for all KYC status changes
- Role-based access control fields
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Enum as SQLEnum, ForeignKey, Text, Numeric, JSON
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin, SoftDeleteMixin, generate_uuid
import enum

class UserRole(str, enum.Enum):
    """RBAC Roles for TradePro platform"""
    ADMIN = "admin"  # Full system access
    COMPLIANCE_OFFICER = "compliance_officer"  # Audit and compliance access
    TRADER = "trader"  # Trading privileges
    VIEWER = "viewer"  # Read-only access
    RISK_MANAGER = "risk_manager"  # Risk monitoring access

class KYCStatus(str, enum.Enum):
    """KYC Verification Status (SEBI requirement)"""
    PENDING = "pending"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"  # KYC requires periodic renewal

class RiskLevel(str, enum.Enum):
    """AML Risk Classification"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    PROHIBITED = "prohibited"

class User(Base, TimestampMixin, SoftDeleteMixin):
    """
    User Account Model
    
    SEBI Compliance:
    - Mandatory KYC verification before trading
    - PAN card verification (Indian tax identifier)
    - Bank account verification
    
    RBI Compliance:
    - Region locking (data localization)
    - Cross-border transfer restrictions
    
    SOC2 Compliance:
    - Password hashing (never store plaintext)
    - MFA enforcement capability
    - Session management fields
    """
    __tablename__ = 'users'
    
    # Primary Key
    id = Column(String(36), primary_key=True, default=generate_uuid)
    
    # Authentication
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)  # bcrypt hashed
    mfa_enabled = Column(Boolean, default=False, nullable=False)
    mfa_secret = Column(String(255), nullable=True)  # TOTP secret (encrypted)
    
    # Personal Information (PII - must be encrypted at rest)
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    
    # Indian Compliance Fields
    pan_card = Column(String(10), unique=True, nullable=True, index=True)  # Permanent Account Number
    aadhaar_hash = Column(String(64), nullable=True)  # Hashed, never store plaintext (UIDAI compliance)
    
    # KYC Status
    kyc_status = Column(SQLEnum(KYCStatus), default=KYCStatus.PENDING, nullable=False)
    kyc_verified_at = Column(DateTime, nullable=True)
    kyc_expiry_date = Column(DateTime, nullable=True)  # SEBI requires periodic renewal
    
    # AML Risk Assessment
    risk_level = Column(SQLEnum(RiskLevel), default=RiskLevel.MEDIUM, nullable=False)
    pep_status = Column(Boolean, default=False, nullable=False)  # Politically Exposed Person
    pep_last_checked = Column(DateTime, nullable=True)
    
    # RBAC
    role = Column(SQLEnum(UserRole), default=UserRole.VIEWER, nullable=False)
    permissions = Column(JSON, default=list, nullable=False)  # Granular permissions
    
    # RBI Data Localization
    region = Column(String(50), nullable=False, default='IN')  # ISO 3166-1 alpha-2
    cross_border_allowed = Column(Boolean, default=False, nullable=False)
    
    # Account Status
    is_active = Column(Boolean, default=True, nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    trading_enabled = Column(Boolean, default=False, nullable=False)  # Requires KYC approval
    
    # Relationships
    kyc_documents = relationship('KYCDocument', back_populates='user', cascade='all, delete-orphan')
    pep_screenings = relationship('PEPScreening', back_populates='user', cascade='all, delete-orphan')
    orders = relationship('Order', back_populates='user')
    positions = relationship('Position', back_populates='user')
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role}, kyc={self.kyc_status})>"

class KYCDocument(Base, TimestampMixin):
    """
    KYC Document Storage
    
    SEBI Requirement:
    - Store proof of identity, address, and financial status
    - Maintain document version history
    - Ensure document integrity (HSM signatures)
    """
    __tablename__ = 'kyc_documents'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False, index=True)
    
    # Document Details
    document_type = Column(String(50), nullable=False)  # PAN, AADHAAR, PASSPORT, BANK_STATEMENT, etc.
    document_number = Column(String(100), nullable=True)  # Encrypted
    document_url = Column(String(500), nullable=False)  # S3/encrypted storage URL
    
    # Verification
    verification_status = Column(SQLEnum(KYCStatus), default=KYCStatus.PENDING, nullable=False)
    verified_by = Column(String(36), ForeignKey('users.id'), nullable=True)  # Compliance officer
    verified_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # HSM Integrity (SOC2 requirement)
    document_hash = Column(String(64), nullable=False)  # SHA-256 of document
    hsm_signature = Column(String(512), nullable=True)  # HSM signed hash
    
    # Relationship
    user = relationship('User', back_populates='kyc_documents', foreign_keys=[user_id])
    
    def __repr__(self):
        return f"<KYCDocument(id={self.id}, user_id={self.user_id}, type={self.document_type}, status={self.verification_status})>"

class PEPScreening(Base, TimestampMixin):
    """
    Politically Exposed Person Screening
    
    AML Compliance:
    - Mandatory PEP screening for all users
    - Periodic re-screening (every 6 months)
    - Source tracking for audit purposes
    """
    __tablename__ = 'pep_screenings'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False, index=True)
    
    # Screening Results
    is_pep = Column(Boolean, default=False, nullable=False)
    pep_category = Column(String(100), nullable=True)  # Government Official, Family Member, etc.
    screening_source = Column(String(255), nullable=True)  # Third-party screening provider
    
    # Match Details
    match_score = Column(Numeric(5, 2), nullable=True)  # Confidence score (0-100)
    matched_entities = Column(JSON, nullable=True)  # List of matched PEP records
    
    # Review
    manual_review_required = Column(Boolean, default=False, nullable=False)
    reviewed_by = Column(String(36), ForeignKey('users.id'), nullable=True)
    review_notes = Column(Text, nullable=True)
    
    # Relationship
    user = relationship('User', back_populates='pep_screenings', foreign_keys=[user_id])
    
    def __repr__(self):
        return f"<PEPScreening(id={self.id}, user_id={self.user_id}, is_pep={self.is_pep})>"
