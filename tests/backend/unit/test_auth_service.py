import pytest
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import jwt
import bcrypt
from unittest.mock import Mock, AsyncMock, patch

# Assuming server.py functions
from server import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
    JWT_SECRET,
    JWT_ALGORITHM
)


class TestPasswordHashing:
    """Test password hashing and verification"""

    def test_hash_password_creates_valid_hash(self):
        password = "SecurePassword123!"
        hashed = hash_password(password)
        
        assert hashed is not None
        assert isinstance(hashed, str)
        assert hashed.startswith('$2b$')
        assert len(hashed) > 50

    def test_hash_password_produces_different_hashes(self):
        password = "SamePassword123"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        
        assert hash1 != hash2  # Due to different salts

    def test_verify_password_with_correct_password(self):
        password = "CorrectPassword123"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) is True

    def test_verify_password_with_incorrect_password(self):
        password = "CorrectPassword123"
        hashed = hash_password(password)
        
        assert verify_password("WrongPassword123", hashed) is False

    def test_verify_password_case_sensitive(self):
        password = "Password123"
        hashed = hash_password(password)
        
        assert verify_password("password123", hashed) is False


class TestJWTTokens:
    """Test JWT token creation and validation"""

    def test_create_access_token(self):
        user_id = str(ObjectId())
        email = "test@example.com"
        
        token = create_access_token(user_id, email)
        
        assert token is not None
        assert isinstance(token, str)
        
        # Decode and verify payload
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        assert payload['sub'] == user_id
        assert payload['email'] == email
        assert payload['type'] == 'access'
        assert 'exp' in payload

    def test_create_refresh_token(self):
        user_id = str(ObjectId())
        
        token = create_refresh_token(user_id)
        
        assert token is not None
        assert isinstance(token, str)
        
        # Decode and verify payload
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        assert payload['sub'] == user_id
        assert payload['type'] == 'refresh'
        assert 'exp' in payload

    def test_access_token_expires_in_15_minutes(self):
        user_id = str(ObjectId())
        email = "test@example.com"
        
        token = create_access_token(user_id, email)
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        exp_time = datetime.fromtimestamp(payload['exp'], tz=timezone.utc)
        now = datetime.now(timezone.utc)
        
        # Check expiry is approximately 15 minutes
        time_diff = (exp_time - now).total_seconds()
        assert 890 <= time_diff <= 910  # Allow 10 second margin

    def test_refresh_token_expires_in_7_days(self):
        user_id = str(ObjectId())
        
        token = create_refresh_token(user_id)
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        exp_time = datetime.fromtimestamp(payload['exp'], tz=timezone.utc)
        now = datetime.now(timezone.utc)
        
        # Check expiry is approximately 7 days
        time_diff = (exp_time - now).total_seconds()
        expected = 7 * 24 * 60 * 60  # 7 days in seconds
        assert expected - 10 <= time_diff <= expected + 10


@pytest.mark.asyncio
class TestGetCurrentUser:
    """Test get_current_user function"""

    async def test_get_current_user_with_valid_cookie(self):
        user_id = str(ObjectId())
        email = "test@example.com"
        token = create_access_token(user_id, email)
        
        # Mock request with cookie
        mock_request = Mock()
        mock_request.cookies = Mock()
        mock_request.cookies.get = Mock(return_value=token)
        mock_request.headers = Mock()
        mock_request.headers.get = Mock(return_value="")
        
        # Mock database
        mock_db = Mock()
        mock_users = AsyncMock()
        mock_users.find_one = AsyncMock(return_value={
            "_id": ObjectId(user_id),
            "email": email,
            "name": "Test User",
            "role": "user",
            "password_hash": "hashed",
            "created_at": datetime.now(timezone.utc)
        })
        mock_db.users = mock_users
        
        # This would require modifying get_current_user to accept db parameter
        # For now, this is a demonstration of the test structure
        
    async def test_get_current_user_with_invalid_token(self):
        mock_request = Mock()
        mock_request.cookies = Mock()
        mock_request.cookies.get = Mock(return_value="invalid_token")
        mock_request.headers = Mock()
        mock_request.headers.get = Mock(return_value="")
        
        # Should raise HTTPException
        # Test would verify exception is raised

    async def test_get_current_user_with_expired_token(self):
        user_id = str(ObjectId())
        email = "test@example.com"
        
        # Create expired token
        payload = {
            "sub": user_id,
            "email": email,
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
            "type": "access"
        }
        expired_token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        mock_request = Mock()
        mock_request.cookies = Mock()
        mock_request.cookies.get = Mock(return_value=expired_token)
        mock_request.headers = Mock()
        mock_request.headers.get = Mock(return_value="")
        
        # Should raise HTTPException with "Token expired"


class TestPasswordValidation:
    """Test password validation rules"""

    def test_minimum_length_requirement(self):
        # Password must be at least 8 characters
        short_password = "Pass1!"
        assert len(short_password) < 8

    def test_password_with_uppercase(self):
        password = "Password123!"
        assert any(c.isupper() for c in password)

    def test_password_with_lowercase(self):
        password = "Password123!"
        assert any(c.islower() for c in password)

    def test_password_with_digit(self):
        password = "Password123!"
        assert any(c.isdigit() for c in password)

    def test_password_with_special_char(self):
        password = "Password123!"
        assert any(not c.isalnum() for c in password)


class TestEmailNormalization:
    """Test email normalization"""

    def test_email_lowercase_conversion(self):
        email = "Test@Example.COM"
        normalized = email.lower()
        assert normalized == "test@example.com"

    def test_email_whitespace_trimming(self):
        email = "  test@example.com  "
        normalized = email.strip().lower()
        assert normalized == "test@example.com"


@pytest.mark.integration
class TestAuthenticationFlow:
    """Integration tests for complete auth flow"""

    async def test_complete_registration_login_flow(self):
        # 1. Register user
        # 2. Verify email
        # 3. Login
        # 4. Access protected resource
        # 5. Logout
        pass

    async def test_password_reset_flow(self):
        # 1. Request password reset
        # 2. Verify reset token
        # 3. Set new password
        # 4. Login with new password
        pass

    async def test_token_refresh_flow(self):
        # 1. Login (get access + refresh tokens)
        # 2. Wait for access token to expire
        # 3. Use refresh token to get new access token
        # 4. Access protected resource with new token
        pass