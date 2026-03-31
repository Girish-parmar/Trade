"""
Payload Signer - High-level wrapper for HSM signing operations

Use Cases:
- Sign audit log entries
- Sign regulatory reports
- Sign order placements
- Sign API responses
"""

from .hsm_connector_interface import HSMConnectorInterface, HSMOperationResult
import hashlib
import json
from typing import Any, Dict

class PayloadSigner:
    """
    High-level payload signing utility
    
    Provides convenient methods for signing various payload types
    using HSM connector.
    """
    
    def __init__(self, hsm_connector: HSMConnectorInterface, default_key_id: str):
        """
        Initialize PayloadSigner
        
        Args:
            hsm_connector: HSM connector instance
            default_key_id: Default HSM key identifier for signing
        """
        self.hsm = hsm_connector
        self.default_key_id = default_key_id
    
    def sign_dict(self, payload: Dict[str, Any], key_id: str = None) -> HSMOperationResult:
        """
        Sign dictionary payload (converts to canonical JSON)
        
        Args:
            payload: Dictionary to sign
            key_id: HSM key identifier (uses default if None)
            
        Returns:
            HSMOperationResult with signature
        """
        # Convert to canonical JSON (sorted keys for deterministic hashing)
        canonical_json = json.dumps(payload, sort_keys=True)
        payload_bytes = canonical_json.encode('utf-8')
        
        key_identifier = key_id or self.default_key_id
        return self.hsm.sign_transaction(payload_bytes, key_identifier)
    
    def sign_string(self, payload: str, key_id: str = None) -> HSMOperationResult:
        """
        Sign string payload
        
        Args:
            payload: String to sign
            key_id: HSM key identifier
            
        Returns:
            HSMOperationResult with signature
        """
        payload_bytes = payload.encode('utf-8')
        key_identifier = key_id or self.default_key_id
        return self.hsm.sign_transaction(payload_bytes, key_identifier)
    
    def sign_hash(self, data_hash: str, key_id: str = None) -> HSMOperationResult:
        """
        Sign pre-computed hash
        
        Args:
            data_hash: SHA-256 hash (hex string)
            key_id: HSM key identifier
            
        Returns:
            HSMOperationResult with signature
        """
        hash_bytes = bytes.fromhex(data_hash)
        key_identifier = key_id or self.default_key_id
        return self.hsm.sign_transaction(hash_bytes, key_identifier)
    
    def verify_dict(self, payload: Dict[str, Any], signature: str, key_id: str = None) -> bool:
        """
        Verify signature of dictionary payload
        
        Args:
            payload: Dictionary that was signed
            signature: Signature to verify (base64)
            key_id: HSM key identifier
            
        Returns:
            True if signature valid, False otherwise
        """
        canonical_json = json.dumps(payload, sort_keys=True)
        payload_bytes = canonical_json.encode('utf-8')
        
        key_identifier = key_id or self.default_key_id
        result = self.hsm.verify_signature(payload_bytes, signature, key_identifier)
        
        return result.success and result.data
    
    @staticmethod
    def calculate_hash(data: Any) -> str:
        """
        Calculate SHA-256 hash of data
        
        Args:
            data: Data to hash (dict, str, or bytes)
            
        Returns:
            Hexadecimal SHA-256 hash
        """
        if isinstance(data, dict):
            canonical = json.dumps(data, sort_keys=True)
            data_bytes = canonical.encode('utf-8')
        elif isinstance(data, str):
            data_bytes = data.encode('utf-8')
        elif isinstance(data, bytes):
            data_bytes = data
        else:
            raise ValueError(f"Unsupported data type: {type(data)}")
        
        return hashlib.sha256(data_bytes).hexdigest()
