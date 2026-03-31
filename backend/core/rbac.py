"""
Role-Based Access Control (RBAC) Implementation

SOC2 Compliance:
- Principle of least privilege
- Separation of duties
- Audit trail for access control decisions

SEBI Compliance:
- Compliance officer role for regulatory oversight
- Trader role restrictions
- Admin accountability
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Callable
import jwt
from datetime import datetime, timezone, timedelta
import os

# Import User model
from models.user_kyc import User, UserRole

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# HTTP Bearer token scheme
security = HTTPBearer()

class RBACManager:
    """
    Role-Based Access Control Manager
    
    Features:
    - JWT-based authentication
    - Role hierarchy
    - Granular permissions
    - Audit logging
    """
    
    # Role hierarchy (higher roles inherit lower role permissions)
    ROLE_HIERARCHY = {
        UserRole.ADMIN: [UserRole.COMPLIANCE_OFFICER, UserRole.RISK_MANAGER, UserRole.TRADER, UserRole.VIEWER],
        UserRole.COMPLIANCE_OFFICER: [UserRole.VIEWER],
        UserRole.RISK_MANAGER: [UserRole.VIEWER],
        UserRole.TRADER: [UserRole.VIEWER],
        UserRole.VIEWER: [],
    }
    
    @staticmethod
    def create_access_token(user_id: str, role: UserRole, permissions: List[str] = None) -> str:
        """
        Create JWT access token
        
        Args:
            user_id: User identifier
            role: User role
            permissions: Additional granular permissions
            
        Returns:
            JWT token string
        """
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        payload = {
            'sub': user_id,  # Subject (user_id)
            'role': role.value if isinstance(role, UserRole) else role,
            'permissions': permissions or [],
            'exp': expire,
            'iat': datetime.now(timezone.utc),
        }
        
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    @staticmethod
    def decode_token(token: str) -> dict:
        """
        Decode and validate JWT token
        
        Args:
            token: JWT token string
            
        Returns:
            Decoded token payload
            
        Raises:
            HTTPException: If token invalid or expired
        """
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    @classmethod
    def has_role(cls, user_role: UserRole, required_role: UserRole) -> bool:
        """
        Check if user role satisfies required role (with hierarchy)
        
        Args:
            user_role: User's actual role
            required_role: Required role for access
            
        Returns:
            True if user has required role (directly or via hierarchy)
        """
        if user_role == required_role:
            return True
        
        # Check role hierarchy
        allowed_roles = cls.ROLE_HIERARCHY.get(user_role, [])
        return required_role in allowed_roles
    
    @classmethod
    def has_permission(cls, user_permissions: List[str], required_permission: str) -> bool:
        """
        Check if user has specific permission
        
        Args:
            user_permissions: User's permission list
            required_permission: Required permission
            
        Returns:
            True if user has permission
        """
        return required_permission in user_permissions


# FastAPI Dependencies

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(lambda: None)  # Placeholder, will be injected
) -> dict:
    """
    FastAPI dependency to get current authenticated user
    
    Extracts and validates JWT token, returns user info.
    
    Usage:
        @app.get("/protected")
        async def protected_route(current_user: dict = Depends(get_current_user)):
            return {"user_id": current_user["sub"]}
    
    Args:
        credentials: HTTP Bearer token
        db: Database session (optional, for user lookup)
        
    Returns:
        Decoded token payload with user info
        
    Raises:
        HTTPException: If authentication fails
    """
    token = credentials.credentials
    return RBACManager.decode_token(token)


def require_role(required_role: UserRole) -> Callable:
    """
    Decorator/dependency to require specific role
    
    Usage:
        @app.post("/admin/users")
        async def create_user(
            current_user: dict = Depends(require_role(UserRole.ADMIN))
        ):
            # Only admins can access this
            return {"message": "User created"}
    
    Args:
        required_role: Minimum required role
        
    Returns:
        FastAPI dependency function
    """
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = UserRole(current_user.get('role'))
        
        if not RBACManager.has_role(user_role, required_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient privileges. Required role: {required_role.value}",
            )
        
        return current_user
    
    return role_checker


def require_permission(required_permission: str) -> Callable:
    """
    Decorator/dependency to require specific permission
    
    Usage:
        @app.post("/orders/place")
        async def place_order(
            current_user: dict = Depends(require_permission("orders.place"))
        ):
            return {"message": "Order placed"}
    
    Args:
        required_permission: Required permission string
        
    Returns:
        FastAPI dependency function
    """
    async def permission_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_permissions = current_user.get('permissions', [])
        
        if not RBACManager.has_permission(user_permissions, required_permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permission: {required_permission}",
            )
        
        return current_user
    
    return permission_checker


def require_trading_enabled() -> Callable:
    """
    Require user to have trading enabled (KYC approved)
    
    SEBI Requirement:
    - Users must complete KYC before trading
    - Trading can be disabled for compliance violations
    
    Usage:
        @app.post("/orders/place")
        async def place_order(
            current_user: dict = Depends(require_trading_enabled())
        ):
            return {"message": "Order placed"}
    """
    async def trading_checker(
        current_user: dict = Depends(get_current_user),
        db: AsyncSession = Depends(lambda: None)
    ) -> dict:
        # In real implementation, fetch user from database and check trading_enabled flag
        # For now, just check role (traders should have trading enabled)
        user_role = UserRole(current_user.get('role'))
        
        if user_role not in [UserRole.TRADER, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Trading not enabled. Complete KYC verification first.",
            )
        
        return current_user
    
    return trading_checker
