from cryptography.fernet import Fernet
import os
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2

class EncryptionUtils:
    @staticmethod
    def get_encryption_key():
        secret = os.environ.get('JWT_SECRET', 'default-secret-key')
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'tradepro_salt',
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(secret.encode()))
        return key
    
    @staticmethod
    def encrypt(data: str) -> str:
        key = EncryptionUtils.get_encryption_key()
        f = Fernet(key)
        encrypted = f.encrypt(data.encode())
        return encrypted.decode()
    
    @staticmethod
    def decrypt(encrypted_data: str) -> str:
        key = EncryptionUtils.get_encryption_key()
        f = Fernet(key)
        decrypted = f.decrypt(encrypted_data.encode())
        return decrypted.decode()
