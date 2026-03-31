"""
Tamper Detection Monitor

SOC2 Compliance:
- Detect tampering in audit logs
- Verify blockchain-style audit chain
- Alert on integrity violations
"""

from .hsm_connector_interface import HSMConnectorInterface
from typing import List, Dict, Any, Optional
from datetime import datetime
import hashlib
import json

class TamperDetectionResult:
    """Result of tamper detection check"""
    def __init__(self, is_valid: bool, issues: List[str] = None, details: Dict[str, Any] = None):
        self.is_valid = is_valid
        self.issues = issues or []
        self.details = details or {}
        self.checked_at = datetime.utcnow()

class TamperDetectionMonitor:
    """
    Tamper Detection Monitor for Audit Trail
    
    Implements:
    1. Blockchain-style chain verification (each entry references previous)
    2. HSM signature verification
    3. Merkle tree validation for batch verification
    
    Use Cases:
    - Periodic audit log integrity checks
    - Pre-regulatory report validation
    - Security incident investigation
    """
    
    def __init__(self, hsm_connector: HSMConnectorInterface, signing_key_id: str):
        """
        Initialize TamperDetectionMonitor
        
        Args:
            hsm_connector: HSM connector instance
            signing_key_id: HSM key used for audit log signing
        """
        self.hsm = hsm_connector
        self.signing_key_id = signing_key_id
    
    def verify_audit_chain(self, audit_entries: List[Dict[str, Any]]) -> TamperDetectionResult:
        """
        Verify blockchain-style audit log chain
        
        Checks:
        1. Each entry's previous_log_hash matches previous entry's current_log_hash
        2. Each entry's current_log_hash is correctly calculated
        3. HSM signatures are valid
        
        Args:
            audit_entries: List of audit log entries (ordered by id)
            
        Returns:
            TamperDetectionResult with validation status
        """
        issues = []
        
        if not audit_entries:
            return TamperDetectionResult(True, [], {'total_entries': 0})
        
        for i in range(len(audit_entries)):
            entry = audit_entries[i]
            
            # Check hash chain (except first entry)
            if i > 0:
                previous_entry = audit_entries[i - 1]
                if entry.get('previous_log_hash') != previous_entry.get('current_log_hash'):
                    issues.append(
                        f"Chain break at entry {entry.get('id')}: "
                        f"previous_log_hash mismatch"
                    )
            
            # Verify current_log_hash calculation
            calculated_hash = self._calculate_entry_hash(entry)
            if calculated_hash != entry.get('current_log_hash'):
                issues.append(
                    f"Hash mismatch at entry {entry.get('id')}: "
                    f"calculated {calculated_hash[:16]}... != stored {entry.get('current_log_hash', '')[:16]}..."
                )
            
            # Verify HSM signature (if present)
            if entry.get('hsm_signature'):
                result = self.hsm.verify_integrity(
                    entry.get('current_log_hash'),
                    entry.get('hsm_signature'),
                    self.signing_key_id
                )
                if not (result.success and result.data):
                    issues.append(
                        f"Invalid HSM signature at entry {entry.get('id')}"
                    )
        
        return TamperDetectionResult(
            is_valid=(len(issues) == 0),
            issues=issues,
            details={
                'total_entries': len(audit_entries),
                'verified_entries': len(audit_entries) - len(issues),
                'failed_entries': len(issues)
            }
        )
    
    def _calculate_entry_hash(self, entry: Dict[str, Any]) -> str:
        """
        Calculate SHA-256 hash of audit log entry
        
        Args:
            entry: Audit log entry dict
            
        Returns:
            Hexadecimal SHA-256 hash
        """
        # Extract fields for hashing (exclude hash and signature fields)
        hash_data = {
            k: v for k, v in entry.items()
            if k not in ['current_log_hash', 'hsm_signature', 'merkle_root', 'merkle_proof']
        }
        
        # Create canonical JSON
        canonical_json = json.dumps(hash_data, sort_keys=True, default=str)
        return hashlib.sha256(canonical_json.encode()).hexdigest()
    
    def calculate_merkle_root(self, audit_entries: List[Dict[str, Any]]) -> str:
        """
        Calculate Merkle tree root for batch of audit entries
        
        Used for efficient batch verification of large audit logs.
        
        Args:
            audit_entries: List of audit log entries
            
        Returns:
            Merkle root hash (hex string)
        """
        if not audit_entries:
            return hashlib.sha256(b'').hexdigest()
        
        # Get all entry hashes
        hashes = [entry.get('current_log_hash') for entry in audit_entries]
        
        # Build Merkle tree
        while len(hashes) > 1:
            if len(hashes) % 2 != 0:
                hashes.append(hashes[-1])  # Duplicate last hash if odd number
            
            new_level = []
            for i in range(0, len(hashes), 2):
                combined = hashes[i] + hashes[i + 1]
                parent_hash = hashlib.sha256(combined.encode()).hexdigest()
                new_level.append(parent_hash)
            
            hashes = new_level
        
        return hashes[0]
