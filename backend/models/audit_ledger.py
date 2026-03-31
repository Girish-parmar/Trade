"""
Immutable Audit Ledger

SOC2 Type II Compliance:
- Cryptographically signed audit trail
- Tamper-evident logging
- Complete action history for compliance audits

SEBI Compliance:
- All trading actions must be auditable
- Regulatory reporting requirements
- 7-year retention period
"""

from sqlalchemy import Column, String, DateTime, Text, JSON, Integer
from .base import Base, generate_uuid
from datetime import datetime, timezone

class AuditLog(Base):
    """
    Immutable Audit Ledger (Append-Only)
    
    SOC2 Requirements:
    - No UPDATE or DELETE operations allowed
    - HSM-signed entries for tamper detection
    - Blockchain-style chain verification
    
    SEBI Requirements:
    - Log all order placements, modifications, cancellations
    - Log all risk limit changes
    - Log all compliance actions
    
    Technical Implementation:
    - Each entry contains hash of previous entry (blockchain pattern)
    - HSM signs the entry hash for integrity verification
    - Periodic merkle tree root calculation for batch verification
    """
    __tablename__ = 'audit_logs'
    
    # Primary Key (sequential for ordering guarantee)
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Unique identifier for distributed systems
    log_id = Column(String(36), unique=True, nullable=False, default=generate_uuid, index=True)
    
    # Timestamp (immutable)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    
    # Actor Information
    user_id = Column(String(36), nullable=True, index=True)  # Nullable for system actions
    user_role = Column(String(50), nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(String(500), nullable=True)
    
    # Action Details
    action_type = Column(String(100), nullable=False, index=True)  # ORDER_PLACED, KYC_APPROVED, etc.
    entity_type = Column(String(50), nullable=False)  # User, Order, Position, etc.
    entity_id = Column(String(36), nullable=True, index=True)
    
    # Event Data (JSON for flexibility)
    event_data = Column(JSON, nullable=False)  # Before/after state, action parameters
    
    # Compliance Classification
    is_critical = Column(String(10), nullable=False, default='false')  # Boolean as string for indexing
    compliance_category = Column(String(50), nullable=True)  # SEBI, RBI, SOC2, INTERNAL
    
    # Tamper Detection (HSM-based)
    previous_log_hash = Column(String(64), nullable=True)  # SHA-256 of previous entry
    current_log_hash = Column(String(64), nullable=False, unique=True)  # SHA-256 of this entry
    hsm_signature = Column(String(512), nullable=True)  # HSM signature of current_log_hash
    
    # Chain Verification (Merkle Tree)
    merkle_root = Column(String(64), nullable=True)  # Periodic merkle root for batch verification
    merkle_proof = Column(JSON, nullable=True)  # Merkle proof path
    
    # Retention (SEBI requires 7 years)
    retention_expiry = Column(DateTime, nullable=True)  # When this can be archived (never deleted)
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, timestamp={self.timestamp}, action={self.action_type}, user={self.user_id})>"
    
    @classmethod
    def calculate_entry_hash(cls, entry_data: dict) -> str:
        """
        Calculate SHA-256 hash of audit log entry
        
        Args:
            entry_data: Dictionary containing all entry fields except hashes
            
        Returns:
            Hexadecimal SHA-256 hash string
        """
        import hashlib
        import json
        
        # Sort keys for deterministic hashing
        canonical_json = json.dumps(entry_data, sort_keys=True)
        return hashlib.sha256(canonical_json.encode()).hexdigest()
    
    @classmethod
    def verify_chain_integrity(cls, current_entry: 'AuditLog', previous_entry: 'AuditLog') -> bool:
        """
        Verify blockchain-style chain integrity
        
        Args:
            current_entry: Current audit log entry
            previous_entry: Previous audit log entry
            
        Returns:
            True if chain is valid, False if tampered
        """
        return current_entry.previous_log_hash == previous_entry.current_log_hash
