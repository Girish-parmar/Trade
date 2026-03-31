"""
Mock HSM Implementation (Development & Testing)

WARNING: NOT FOR PRODUCTION USE

This mock implementation simulates HSM operations for development and testing.
In production, replace with actual HSM connector (AWS CloudHSM, Thales, etc.).

FIPS 140-2 Compliance:
- Uses standard Python cryptography library (not FIPS-certified)
- Simulates HSM behavior but keys stored in memory (not hardware)
- For testing formal verification and audit trail logic
"""

from .hsm_connector_interface import HSMConnectorInterface, HSMOperationResult, HSMOperationType
from typing import Dict, Any
from datetime import datetime, timezone
import uuid
import base64
import hashlib
import json

# Cryptography imports (standard Python library)
try:
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa, padding as asym_padding
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.backends import default_backend
    import secrets
except ImportError:
    raise ImportError(
        "cryptography library required. Install: pip install cryptography"
    )

class MockHSMConnector(HSMConnectorInterface):
    """
    Mock HSM Connector for Development/Testing
    
    Simulates HSM operations using in-memory key storage.
    
    WARNING: NOT SECURE FOR PRODUCTION
    - Keys stored in RAM (not tamper-resistant hardware)
    - No FIPS 140-2 certification
    - No physical security
    
    Use Cases:
    - Development environment
    - Automated testing
    - CI/CD pipeline
    - Formal verification testing
    
    Production Deployment:
    Replace this with actual HSM connector (AWS CloudHSM, Thales Luna, etc.)
    """
    
    def __init__(self, hsm_config: Dict[str, Any]):
        super().__init__(hsm_config)
        # In-memory key storage (NOT SECURE - only for testing)
        self._key_store: Dict[str, Any] = {}
        self.hsm_instance_id = f"mock-hsm-{uuid.uuid4().hex[:8]}"
    
    def sign_transaction(self, payload: bytes, key_identifier: str, algorithm: str = 'RSA_SHA256') -> HSMOperationResult:
        """
        Mock transaction signing using RSA-SHA256
        """
        try:
            # Retrieve private key from mock storage
            if key_identifier not in self._key_store:
                return HSMOperationResult(
                    success=False,
                    error_code="KEY_NOT_FOUND",
                    error_message=f"Key {key_identifier} not found in HSM"
                )
            
            key_data = self._key_store[key_identifier]
            private_key = key_data['private_key']
            
            # Sign payload
            if algorithm == 'RSA_SHA256':
                signature = private_key.sign(
                    payload,
                    asym_padding.PSS(
                        mgf=asym_padding.MGF1(hashes.SHA256()),
                        salt_length=asym_padding.PSS.MAX_LENGTH
                    ),
                    hashes.SHA256()
                )
            else:
                return HSMOperationResult(
                    success=False,
                    error_code="UNSUPPORTED_ALGORITHM",
                    error_message=f"Algorithm {algorithm} not supported in mock HSM"
                )
            
            # Encode signature as base64
            signature_b64 = base64.b64encode(signature).decode('utf-8')
            
            return HSMOperationResult(
                success=True,
                data=signature_b64,
                operation_id=str(uuid.uuid4()),
                timestamp=datetime.now(timezone.utc),
                hsm_instance_id=self.hsm_instance_id
            )
            
        except Exception as e:
            return HSMOperationResult(
                success=False,
                error_code="SIGNING_FAILED",
                error_message=str(e)
            )
    
    def verify_signature(self, payload: bytes, signature: bytes, key_identifier: str, algorithm: str = 'RSA_SHA256') -> HSMOperationResult:
        """
        Mock signature verification
        """
        try:
            if key_identifier not in self._key_store:
                return HSMOperationResult(
                    success=False,
                    error_code="KEY_NOT_FOUND",
                    error_message=f"Key {key_identifier} not found"
                )
            
            key_data = self._key_store[key_identifier]
            public_key = key_data['public_key']
            
            # Decode signature from base64 if string
            if isinstance(signature, str):
                signature = base64.b64decode(signature)
            
            # Verify signature
            try:
                if algorithm == 'RSA_SHA256':
                    public_key.verify(
                        signature,
                        payload,
                        asym_padding.PSS(
                            mgf=asym_padding.MGF1(hashes.SHA256()),
                            salt_length=asym_padding.PSS.MAX_LENGTH
                        ),
                        hashes.SHA256()
                    )
                    is_valid = True
                else:
                    return HSMOperationResult(
                        success=False,
                        error_code="UNSUPPORTED_ALGORITHM",
                        error_message=f"Algorithm {algorithm} not supported"
                    )
            except Exception:
                is_valid = False
            
            return HSMOperationResult(
                success=True,
                data=is_valid,
                operation_id=str(uuid.uuid4()),
                timestamp=datetime.now(timezone.utc),
                hsm_instance_id=self.hsm_instance_id
            )
            
        except Exception as e:
            return HSMOperationResult(
                success=False,
                error_code="VERIFICATION_FAILED",
                error_message=str(e)
            )
    
    def generate_root_key(self, key_type: str, key_alias: str, key_size: int = 2048) -> HSMOperationResult:
        """
        Mock key generation (stores in memory)
        """
        try:
            key_identifier = f"mock-key-{uuid.uuid4().hex}"
            
            if key_type == "RSA":
                # Generate RSA key pair
                private_key = rsa.generate_private_key(
                    public_exponent=65537,
                    key_size=key_size,
                    backend=default_backend()
                )
                public_key = private_key.public_key()
                
                # Store in mock key store
                self._key_store[key_identifier] = {
                    'alias': key_alias,
                    'type': key_type,
                    'size': key_size,
                    'private_key': private_key,
                    'public_key': public_key,
                    'created_at': datetime.now(timezone.utc),
                    'status': 'ACTIVE'
                }
                
                return HSMOperationResult(
                    success=True,
                    data=key_identifier,
                    operation_id=str(uuid.uuid4()),
                    timestamp=datetime.now(timezone.utc),
                    hsm_instance_id=self.hsm_instance_id
                )
            else:
                return HSMOperationResult(
                    success=False,
                    error_code="UNSUPPORTED_KEY_TYPE",
                    error_message=f"Key type {key_type} not supported in mock HSM"
                )
                
        except Exception as e:
            return HSMOperationResult(
                success=False,
                error_code="KEY_GENERATION_FAILED",
                error_message=str(e)
            )
    
    def rotate_key(self, old_key_identifier: str, key_type: str, key_size: int = 2048) -> HSMOperationResult:
        """
        Mock key rotation
        """
        try:
            if old_key_identifier not in self._key_store:
                return HSMOperationResult(
                    success=False,
                    error_code="KEY_NOT_FOUND",
                    error_message=f"Key {old_key_identifier} not found"
                )
            
            # Mark old key as retired
            old_key_data = self._key_store[old_key_identifier]
            old_key_data['status'] = 'RETIRED'
            old_alias = old_key_data['alias']
            
            # Generate new key
            result = self.generate_root_key(key_type, f"{old_alias}_rotated", key_size)
            
            if result.success:
                # Link new key to old key
                new_key_identifier = result.data
                self._key_store[new_key_identifier]['previous_key'] = old_key_identifier
            
            return result
            
        except Exception as e:
            return HSMOperationResult(
                success=False,
                error_code="KEY_ROTATION_FAILED",
                error_message=str(e)
            )
    
    def verify_integrity(self, data_hash: str, hsm_signature: str, key_identifier: str) -> HSMOperationResult:
        """
        Mock integrity verification
        """
        # Convert hex hash to bytes
        hash_bytes = bytes.fromhex(data_hash)
        
        # Verify signature of hash
        return self.verify_signature(hash_bytes, hsm_signature, key_identifier)
    
    def encrypt_sensitive_data(self, plaintext: bytes, key_identifier: str, algorithm: str = 'AES_256_GCM') -> HSMOperationResult:
        """
        Mock AES-GCM encryption
        """
        try:
            # Generate random encryption key (in real HSM, this would use stored key)
            key = secrets.token_bytes(32)  # AES-256
            iv = secrets.token_bytes(12)  # GCM nonce
            
            # Encrypt
            cipher = Cipher(
                algorithms.AES(key),
                modes.GCM(iv),
                backend=default_backend()
            )
            encryptor = cipher.encryptor()
            ciphertext = encryptor.update(plaintext) + encryptor.finalize()
            
            # Return encrypted data
            result_data = {
                'ciphertext': base64.b64encode(ciphertext).decode('utf-8'),
                'iv': base64.b64encode(iv).decode('utf-8'),
                'tag': base64.b64encode(encryptor.tag).decode('utf-8'),
                'key': base64.b64encode(key).decode('utf-8')  # In real HSM, key never exposed
            }
            
            return HSMOperationResult(
                success=True,
                data=result_data,
                operation_id=str(uuid.uuid4()),
                timestamp=datetime.now(timezone.utc),
                hsm_instance_id=self.hsm_instance_id
            )
            
        except Exception as e:
            return HSMOperationResult(
                success=False,
                error_code="ENCRYPTION_FAILED",
                error_message=str(e)
            )
    
    def decrypt_sensitive_data(self, ciphertext: bytes, key_identifier: str, iv: bytes, tag: bytes = None, algorithm: str = 'AES_256_GCM') -> HSMOperationResult:
        """
        Mock AES-GCM decryption
        
        Note: In mock mode, key must be provided in ciphertext metadata
        """
        try:
            # In real HSM, would retrieve key from secure storage
            # For mock, we need the key passed in metadata
            return HSMOperationResult(
                success=False,
                error_code="NOT_IMPLEMENTED",
                error_message="Mock decryption not fully implemented"
            )
            
        except Exception as e:
            return HSMOperationResult(
                success=False,
                error_code="DECRYPTION_FAILED",
                error_message=str(e)
            )
    
    def destroy_key(self, key_identifier: str, authorization_token: str) -> HSMOperationResult:
        """
        Mock key destruction (remove from memory)
        """
        try:
            if key_identifier not in self._key_store:
                return HSMOperationResult(
                    success=False,
                    error_code="KEY_NOT_FOUND",
                    error_message=f"Key {key_identifier} not found"
                )
            
            # Mark as destroyed (don't actually delete for audit trail)
            self._key_store[key_identifier]['status'] = 'DESTROYED'
            self._key_store[key_identifier]['destroyed_at'] = datetime.now(timezone.utc)
            
            return HSMOperationResult(
                success=True,
                data=True,
                operation_id=str(uuid.uuid4()),
                timestamp=datetime.now(timezone.utc),
                hsm_instance_id=self.hsm_instance_id
            )
            
        except Exception as e:
            return HSMOperationResult(
                success=False,
                error_code="KEY_DESTRUCTION_FAILED",
                error_message=str(e)
            )
    
    def get_public_key(self, key_identifier: str) -> HSMOperationResult:
        """
        Export public key in PEM format
        """
        try:
            if key_identifier not in self._key_store:
                return HSMOperationResult(
                    success=False,
                    error_code="KEY_NOT_FOUND",
                    error_message=f"Key {key_identifier} not found"
                )
            
            key_data = self._key_store[key_identifier]
            public_key = key_data['public_key']
            
            # Serialize to PEM format
            pem = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )
            
            return HSMOperationResult(
                success=True,
                data=pem.decode('utf-8'),
                operation_id=str(uuid.uuid4()),
                timestamp=datetime.now(timezone.utc),
                hsm_instance_id=self.hsm_instance_id
            )
            
        except Exception as e:
            return HSMOperationResult(
                success=False,
                error_code="PUBLIC_KEY_EXPORT_FAILED",
                error_message=str(e)
            )
    
    def health_check(self) -> HSMOperationResult:
        """
        Mock health check (always healthy)
        """
        return HSMOperationResult(
            success=True,
            data={
                'status': 'healthy',
                'latency_ms': 0.5,  # Mock latency
                'active_sessions': 1,
                'error_rate': 0.0,
                'total_keys': len(self._key_store)
            },
            operation_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc),
            hsm_instance_id=self.hsm_instance_id
        )
