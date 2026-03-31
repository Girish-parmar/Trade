"""
Region Lock Enforcer (RBI Data Localization Compliance)

RBI (Reserve Bank of India) Requirements:
- All payment/financial data must be stored within India
- Cross-border data transfer prohibited without approval
- User geolocation validation
- Regional service restrictions

GDPR/CCPA Considerations:
- Data residency requirements
- Regional privacy law compliance
"""

from fastapi import Request, HTTPException, status, Depends
from typing import Optional, List, Callable
import re
from datetime import datetime, timezone

class RegionLockEnforcer:
    """
    Region-based Access Control and Data Localization
    
    RBI Compliance:
    - Enforce data storage within specified regions
    - Restrict cross-border data access
    - Validate user region eligibility
    
    Features:
    - IP-based geolocation (basic)
    - User account region validation
    - Service region restrictions
    """
    
    # Allowed regions for data storage (ISO 3166-1 alpha-2)
    ALLOWED_STORAGE_REGIONS = ['IN']  # India only for RBI compliance
    
    # Regions allowed to access the platform
    ALLOWED_ACCESS_REGIONS = ['IN', 'US', 'GB', 'SG', 'AE']  # Expand as needed
    
    # IP range to region mapping (simplified - use GeoIP database in production)
    # This is a basic example - in production, use MaxMind GeoIP2 or similar
    IP_REGION_MAP = {
        # Indian IP ranges (example - incomplete)
        r'^49\.': 'IN',
        r'^103\.': 'IN',
        r'^106\.': 'IN',
        
        # US IP ranges (example)
        r'^3\.': 'US',
        r'^52\.': 'US',
        
        # Default
        r'.*': 'UNKNOWN',
    }
    
    @classmethod
    def detect_region_from_ip(cls, ip_address: str) -> str:
        """
        Detect region from IP address (basic implementation)
        
        Production: Use GeoIP2 or IP2Location database
        
        Args:
            ip_address: Client IP address
            
        Returns:
            ISO 3166-1 alpha-2 region code
        """
        for pattern, region in cls.IP_REGION_MAP.items():
            if re.match(pattern, ip_address):
                return region
        
        return 'UNKNOWN'
    
    @classmethod
    def is_region_allowed_for_access(cls, region: str) -> bool:
        """
        Check if region is allowed to access platform
        
        Args:
            region: ISO 3166-1 alpha-2 region code
            
        Returns:
            True if region allowed
        """
        return region in cls.ALLOWED_ACCESS_REGIONS
    
    @classmethod
    def is_region_allowed_for_storage(cls, region: str) -> bool:
        """
        Check if region is allowed for data storage (RBI requirement)
        
        Args:
            region: ISO 3166-1 alpha-2 region code
            
        Returns:
            True if data can be stored in this region
        """
        return region in cls.ALLOWED_STORAGE_REGIONS
    
    @classmethod
    def validate_cross_border_transfer(cls, from_region: str, to_region: str, user_approved: bool = False) -> bool:
        """
        Validate cross-border data transfer
        
        RBI Requirement:
        - Payment data cannot be transferred outside India
        - Requires explicit user consent
        - Must be logged for audit
        
        Args:
            from_region: Source region
            to_region: Destination region
            user_approved: Whether user approved the transfer
            
        Returns:
            True if transfer allowed
        """
        # If both regions are in India, allow
        if from_region == 'IN' and to_region == 'IN':
            return True
        
        # If transferring out of India, requires approval
        if from_region == 'IN' and to_region != 'IN':
            return user_approved
        
        # If transferring into India, generally allowed
        if from_region != 'IN' and to_region == 'IN':
            return True
        
        # International transfers (non-India) generally allowed
        return True
    
    @classmethod
    def get_client_ip(cls, request: Request) -> str:
        """
        Extract client IP address from request
        
        Handles proxy headers (X-Forwarded-For, X-Real-IP)
        
        Args:
            request: FastAPI request object
            
        Returns:
            Client IP address
        """
        # Check proxy headers first
        forwarded_for = request.headers.get('X-Forwarded-For')
        if forwarded_for:
            # X-Forwarded-For can contain multiple IPs, first is client
            return forwarded_for.split(',')[0].strip()
        
        real_ip = request.headers.get('X-Real-IP')
        if real_ip:
            return real_ip
        
        # Fallback to direct client
        return request.client.host if request.client else 'UNKNOWN'
    
    @classmethod
    def audit_access(cls, user_id: str, region: str, ip_address: str, action: str):
        """
        Audit region-based access (for compliance reporting)
        
        Args:
            user_id: User making the request
            region: Detected region
            ip_address: Client IP
            action: Action being performed
        """
        # In production, log to AuditLog table
        audit_entry = {
            'timestamp': datetime.now(timezone.utc),
            'user_id': user_id,
            'region': region,
            'ip_address': ip_address,
            'action': action,
            'compliance_category': 'RBI_REGION_LOCK',
        }
        
        # TODO: Insert into AuditLog table
        print(f"[REGION_AUDIT] {audit_entry}")


# FastAPI Dependencies

async def check_region_access(request: Request) -> str:
    """
    FastAPI dependency to check region-based access
    
    Usage:
        @app.get("/api/data")
        async def get_data(region: str = Depends(check_region_access)):
            return {"region": region, "data": "..."}
    
    Args:
        request: FastAPI request object
        
    Returns:
        Detected region code
        
    Raises:
        HTTPException: If region not allowed
    """
    # Get client IP
    client_ip = RegionLockEnforcer.get_client_ip(request)
    
    # Detect region
    region = RegionLockEnforcer.detect_region_from_ip(client_ip)
    
    # Check if region allowed
    if not RegionLockEnforcer.is_region_allowed_for_access(region):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access from region '{region}' is not permitted. Service available in: {', '.join(RegionLockEnforcer.ALLOWED_ACCESS_REGIONS)}",
        )
    
    return region


def require_indian_region() -> Callable:
    """
    Require request to originate from India (RBI compliance)
    
    Usage:
        @app.post("/api/payment")
        async def process_payment(
            region: str = Depends(require_indian_region())
        ):
            # Only accessible from India
            return {"message": "Payment processed"}
    
    Returns:
        FastAPI dependency function
    """
    async def indian_region_checker(request: Request) -> str:
        client_ip = RegionLockEnforcer.get_client_ip(request)
        region = RegionLockEnforcer.detect_region_from_ip(client_ip)
        
        if region != 'IN':
            raise HTTPException(
                status_code=status.HTTP_451_UNAVAILABLE_FOR_LEGAL_REASONS,
                detail="This service is only available in India due to RBI regulations",
            )
        
        return region
    
    return indian_region_checker


async def validate_user_region(user_region: str, request: Request) -> bool:
    """
    Validate user's registered region matches access region
    
    SEBI Requirement:
    - Users should access platform from their registered region
    - Flag suspicious access patterns
    
    Args:
        user_region: User's registered region (from User model)
        request: FastAPI request
        
    Returns:
        True if region matches, False if suspicious
    """
    client_ip = RegionLockEnforcer.get_client_ip(request)
    access_region = RegionLockEnforcer.detect_region_from_ip(client_ip)
    
    # Exact match
    if user_region == access_region:
        return True
    
    # Allow access but log for monitoring (user might be traveling)
    # In production, this should create a ComplianceFlag
    print(f"[REGION_MISMATCH] User region: {user_region}, Access region: {access_region}, IP: {client_ip}")
    
    return True  # Allow but flagged
