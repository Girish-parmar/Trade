"""
HSM Connector Interface (Abstract Base Class)

FIPS 140-2 Compliance:
- All cryptographic operations must occur within HSM boundary
- Keys never leave HSM hardware
- Tamper-resistant key storage

SOC2 Compliance:
- Audit logging for all HSM operations
- Key lifecycle management
- Separation of duties

Supported HSM Providers:
- AWS CloudHSM (FIPS 140-2 Level 3)
- Thales Luna HSM (FIPS 140-2 Level 3)
- Gemalto SafeNet HSM
- Azure Dedicated HSM
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime
import enum

class HSMOperationType(str, enum.Enum):
    """HSM Operation Types for Audit Logging"""
    SIGN = "sign"
    VERIFY = "verify"
    ENCRYPT = "encrypt"
    DECRYPT = "decrypt"
    GENERATE_KEY = "generate_key"
    ROTATE_KEY = "rotate_key"
    DESTROY_KEY = "destroy_key"

@dataclass
class HSMOperationResult:
    """
    Result of HSM Operation
    
    Attributes:
        success: Whether operation succeeded
        data: Operation output (signature, encrypted data, key_id, etc.)
        error_code: HSM-specific error code if failed
        error_message: Human-readable error description
        operation_id: Unique identifier for audit trail
        timestamp: When operation occurred
        hsm_instance_id: Which HSM instance processed the request
    """
    success: bool
    data: Optional[Any] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    operation_id: Optional[str] = None
    timestamp: Optional[datetime] = None
    hsm_instance_id: Optional[str] = None

class HSMConnectorInterface(ABC):
    """
    Abstract HSM Connector Interface
    
    FIPS 140-2 Requirements:
    1. All private key operations must occur within HSM
    2. Key material must never be exposed to application layer
    3. Cryptographic operations must use FIPS-approved algorithms:
       - RSA (2048, 3072, 4096 bits)
       - ECDSA (P-256, P-384, P-521 curves)
       - AES (128, 192, 256 bits)
       - SHA-256, SHA-384, SHA-512
    
    SOC2 Requirements:
    1. Audit logging for all operations
    2. Key rotation every 90 days
    3. Separation of duties (key generation vs. usage)
    
    Security Model:
    - Application holds only key_identifier (reference to HSM key)
    - HSM performs cryptographic operations using key_identifier
    - Results returned to application (signatures, encrypted data)
    - Key material remains protected within HSM hardware
    
    Implementation Notes:
    - Subclass this interface for specific HSM providers
    - Use dependency injection to swap implementations
    - Mock implementation available for development/testing
    """
    
    def __init__(self, hsm_config: Dict[str, Any]):
        """
        Initialize HSM Connector
        
        Args:
            hsm_config: HSM-specific configuration
                Required keys:
                - hsm_provider: "aws_cloudhsm" | "thales" | "azure" | "mock"
                - cluster_id: HSM cluster identifier
                - credentials: HSM authentication credentials
                - fips_mode: True to enforce FIPS 140-2 algorithms
        """
        self.config = hsm_config
        self.fips_mode = hsm_config.get('fips_mode', True)
    
    @abstractmethod
    def sign_transaction(self, payload: bytes, key_identifier: str, algorithm: str = 'RSA_SHA256') -> HSMOperationResult:
        """
        Sign transaction payload using HSM private key
        
        FIPS 140-2 Approved Algorithms:
        - RSA_SHA256: RSA signature with SHA-256 hash
        - RSA_SHA384: RSA signature with SHA-384 hash
        - ECDSA_SHA256: ECDSA signature with SHA-256 hash
        
        SEBI Use Cases:
        - Sign audit log entries (tamper detection)
        - Sign regulatory reports (authenticity)
        - Sign order placement (non-repudiation)
        
        Args:
            payload: Data to sign (raw bytes)
            key_identifier: HSM key reference (NOT the actual key)
            algorithm: Signature algorithm (must be FIPS-approved)
            
        Returns:
            HSMOperationResult with signature in .data field (base64 encoded)
            
        Raises:
            ValueError: If algorithm is not FIPS-approved in FIPS mode
            HSMException: If HSM operation fails
        """
        pass
    
    @abstractmethod
    def verify_signature(self, payload: bytes, signature: bytes, key_identifier: str, algorithm: str = 'RSA_SHA256') -> HSMOperationResult:
        """
        Verify signature using HSM public key
        
        Args:
            payload: Original data that was signed
            signature: Signature to verify (base64 encoded)
            key_identifier: HSM key reference
            algorithm: Signature algorithm used
            
        Returns:
            HSMOperationResult with .data = True if valid, False if invalid
        """
        pass
    
    @abstractmethod
    def generate_root_key(self, key_type: str, key_alias: str, key_size: int = 2048) -> HSMOperationResult:
        """
        Generate root cryptographic key within HSM
        
        FIPS 140-2 Requirements:
        - Key generation must occur within HSM hardware
        - Use FIPS-approved random number generator
        - Key material never exported
        
        SOC2 Requirements:
        - Require multi-person authorization for root key generation
        - Audit log all key generation events
        - Set automatic expiry for key rotation
        
        Args:
            key_type: "RSA" | "ECDSA" | "AES"
            key_alias: Human-readable key name
            key_size: Key size in bits (RSA: 2048/3072/4096, AES: 128/192/256)
            
        Returns:
            HSMOperationResult with key_identifier in .data field
            
        Security Note:
            The actual key never leaves the HSM. Only the key_identifier
            (reference) is returned to the application.
        """
        pass
    
    @abstractmethod
    def rotate_key(self, old_key_identifier: str, key_type: str, key_size: int = 2048) -> HSMOperationResult:
        """
        Rotate existing key (generate new, retire old)
        
        SOC2 Requirement:
        - Keys must be rotated every 90 days
        - Old keys retired but retained for decryption of historical data
        - Rotation must be auditable
        
        Process:
        1. Generate new key with same parameters as old key
        2. Mark old key as RETIRED (still usable for decryption/verification)
        3. Return new key_identifier
        4. Update all references to use new key for new operations
        
        Args:
            old_key_identifier: Current key to rotate
            key_type: "RSA" | "ECDSA" | "AES"
            key_size: Key size for new key
            
        Returns:
            HSMOperationResult with new key_identifier in .data field
        """
        pass
    
    @abstractmethod
    def verify_integrity(self, data_hash: str, hsm_signature: str, key_identifier: str) -> HSMOperationResult:
        """
        Verify data integrity using HSM signature
        
        Use Cases:
        - Verify audit log chain integrity
        - Detect tampering in regulatory reports
        - Validate order immutability
        
        Process:
        1. HSM verifies signature of data_hash using stored public key
        2. Returns True if signature valid (data not tampered)
        3. Returns False if signature invalid (tampering detected)
        
        Args:
            data_hash: SHA-256 hash of data to verify (hex string)
            hsm_signature: HSM signature to verify (base64 string)
            key_identifier: HSM key used for original signing
            
        Returns:
            HSMOperationResult with .data = True/False
        """
        pass
    
    @abstractmethod
    def encrypt_sensitive_data(self, plaintext: bytes, key_identifier: str, algorithm: str = 'AES_256_GCM') -> HSMOperationResult:
        """
        Encrypt sensitive data using HSM encryption key
        
        FIPS 140-2 Algorithms:
        - AES_256_GCM: AES-256 in GCM mode (authenticated encryption)
        - AES_256_CBC: AES-256 in CBC mode with PKCS7 padding
        
        Use Cases:
        - Encrypt PII (PAN card, Aadhaar, bank account)
        - Encrypt API keys and credentials
        - Encrypt sensitive configuration
        
        Args:
            plaintext: Data to encrypt (raw bytes)
            key_identifier: HSM encryption key reference
            algorithm: Encryption algorithm (FIPS-approved)
            
        Returns:
            HSMOperationResult with encrypted data in .data field
            Format: {"ciphertext": base64, "iv": base64, "tag": base64}
        """
        pass
    
    @abstractmethod
    def decrypt_sensitive_data(self, ciphertext: bytes, key_identifier: str, iv: bytes, tag: bytes = None, algorithm: str = 'AES_256_GCM') -> HSMOperationResult:
        """
        Decrypt sensitive data using HSM encryption key
        
        Args:
            ciphertext: Encrypted data (base64 encoded)
            key_identifier: HSM encryption key reference
            iv: Initialization vector (base64 encoded)
            tag: Authentication tag for GCM mode (base64 encoded)
            algorithm: Encryption algorithm used
            
        Returns:
            HSMOperationResult with plaintext in .data field (bytes)
        """
        pass
    
    @abstractmethod
    def destroy_key(self, key_identifier: str, authorization_token: str) -> HSMOperationResult:
        """
        Permanently destroy key (compliance with data deletion requirements)
        
        SOC2 Requirement:
        - Requires multi-person authorization
        - Irreversible operation
        - Must be audited
        
        GDPR/Data Protection:
        - Support "right to be forgotten"
        - Crypto-shredding (destroy key makes data unrecoverable)
        
        Args:
            key_identifier: HSM key to destroy
            authorization_token: Multi-person authorization proof
            
        Returns:
            HSMOperationResult with success=True if destroyed
            
        Warning:
            This operation is IRREVERSIBLE. Any data encrypted with this key
            will be permanently unrecoverable.
        """
        pass
    
    @abstractmethod
    def get_public_key(self, key_identifier: str) -> HSMOperationResult:
        """
        Export public key (safe to share, used for signature verification)
        
        Args:
            key_identifier: HSM key pair reference
            
        Returns:
            HSMOperationResult with public key in PEM format in .data field
        """
        pass
    
    @abstractmethod
    def health_check(self) -> HSMOperationResult:
        """
        Check HSM connectivity and health
        
        Returns:
            HSMOperationResult with health status in .data field
            {
                "status": "healthy" | "degraded" | "unavailable",
                "latency_ms": float,
                "active_sessions": int,
                "error_rate": float
            }
        """
        pass
