"""
Base SQLAlchemy Model Configuration

SOC2 Compliance:
- All models inherit timestamp tracking
- UUID primary keys for distributed systems
- Soft delete capability for audit trail preservation
"""

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, String, DateTime, Boolean
from datetime import datetime, timezone
import uuid

Base = declarative_base()

class TimestampMixin:
    """Mixin for automatic timestamp tracking (SOC2 requirement)"""
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

class SoftDeleteMixin:
    """Mixin for soft delete (preserves audit trail - SEBI requirement)"""
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)

def generate_uuid():
    """Generate UUID v4 for distributed system compatibility"""
    return str(uuid.uuid4())
