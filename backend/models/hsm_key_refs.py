"""
HSM Key Reference Model

SOC2 Compliance:
- Hardware Security Module key metadata
- Key rotation tracking
- FIPS 140-2 compliance markers

Security:
- NEVER store actual keys in database
- Only store key identifiers and metadata
- HSM handles all cryptographic operations
"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, Enum as SQLEnum
from .base import Base, TimestampMixin, generate_uuid
from datetime import datetime, timezone
import enum

class KeyType(str, enum.Enum):
    """HSM Key Types"""
    ROOT_KEY = "root_key"  # Master encryption key
    SIGNING_KEY = "signing_key"  # For audit log signatures
    DATA_ENCRYPTION_KEY = "data_encryption_key"  # For PII encryption
    API_KEY = "api_key"  # For external API authentication

class KeyStatus(str, enum.Enum):
    """Key Lifecycle Status"""
    ACTIVE = "active"
    ROTATING = "rotating"  # In rotation process
    RETIRED = "retired"  # No longer used for new operations
    COMPROMISED = "compromised"  # Security incident
    DESTROYED = "destroyed"  # Permanently removed

class HSMKeyReference(Base, TimestampMixin):
    """
    HSM Key Metadata (NEVER stores actual keys)
    
    FIPS 140-2 Compliance:
    - Keys generated and stored in FIPS-certified HSM
    - Cryptographic operations performed within HSM boundary
    - Key material never exposed to application layer
    
    SOC2 Requirements:
    - Key rotation every 90 days
    - Audit trail for all key operations
    - Separation of duties (key generation vs. usage)
    
    Security Model:
    - Application holds only key_identifier (HSM reference)
    - HSM performs signing/encryption using key_identifier
    - Key material remains in tamper-resistant HSM hardware
    """
    __tablename__ = 'hsm_key_references'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    
    # HSM Key Identifier (NOT the actual key)
    key_identifier = Column(String(255), unique=True, nullable=False, index=True)  # HSM-provided reference
    key_alias = Column(String(100), unique=True, nullable=False)  # Human-readable name
    
    # Key Type and Purpose
    key_type = Column(SQLEnum(KeyType), nullable=False)
    purpose = Column(Text, nullable=False)  # Detailed description of key usage
    
    # Key Lifecycle
    status = Column(SQLEnum(KeyStatus), default=KeyStatus.ACTIVE, nullable=False, index=True)
    generation_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    activation_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True)  # For automatic rotation
    retirement_date = Column(DateTime, nullable=True)
    
    # Rotation Tracking
    rotation_counter = Column(Integer, default=0, nullable=False)  # Number of times rotated
    previous_key_id = Column(String(36), nullable=True)  # Reference to previous key version
    next_rotation_due = Column(DateTime, nullable=True)  # Scheduled rotation date
    
    # Compliance
    fips_140_2_certified = Column(Boolean, default=True, nullable=False)
    compliance_tags = Column(Text, nullable=True)  # SEBI, SOC2, PCI-DSS, etc.
    
    # HSM Metadata
    hsm_provider = Column(String(100), nullable=True)  # AWS CloudHSM, Thales, etc.
    hsm_cluster_id = Column(String(255), nullable=True)
    
    # Usage Statistics (for audit)
    total_operations = Column(Integer, default=0, nullable=False)
    last_used_at = Column(DateTime, nullable=True)
    
    # Access Control
    authorized_services = Column(Text, nullable=True)  # Comma-separated service names
    requires_approval = Column(Boolean, default=False, nullable=False)  # For critical operations
    
    def __repr__(self):
        return f"<HSMKeyReference(id={self.id}, alias={self.key_alias}, type={self.key_type}, status={self.status})>"
    
    def is_expired(self) -> bool:
        """Check if key has expired and needs rotation"""
        if self.expiry_date is None:
            return False
        return datetime.now(timezone.utc) > self.expiry_date
    
    def days_until_rotation(self) -> int:
        """Calculate days until next rotation is due"""
        if self.next_rotation_due is None:
            return 999  # No rotation scheduled
        delta = self.next_rotation_due - datetime.now(timezone.utc)
        return delta.days
