# TradePro AI V3.0 - Quick Start Guide

## Phase 1: Database Schema & HSM Security

### 🗄️ Database Setup

#### 1. Install PostgreSQL (if not already installed)
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql

# Start PostgreSQL
sudo service postgresql start  # Linux
brew services start postgresql  # macOS
```

#### 2. Create Database and User
```bash
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE tradepro_db;
CREATE USER tradepro WITH PASSWORD 'tradepro123';
GRANT ALL PRIVILEGES ON DATABASE tradepro_db TO tradepro;
\q
```

#### 3. Initialize Database Tables
```python
# Run this in Python/FastAPI startup
from core.database import init_database

# In your FastAPI app startup event:
@app.on_event("startup")
async def startup():
    await init_database()
```

### 🔐 Using HSM Security

#### Initialize Mock HSM (Development)
```python
from security_enhanced.hsm import MockHSMConnector

# Configure mock HSM
hsm_config = {
    'hsm_provider': 'mock',
    'cluster_id': 'dev-cluster',
    'fips_mode': True
}

hsm = MockHSMConnector(hsm_config)

# Generate signing key
result = hsm.generate_root_key(
    key_type='RSA',
    key_alias='audit_signing_key',
    key_size=2048
)

if result.success:
    key_id = result.data
    print(f"Generated key: {key_id}")
```

#### Sign Audit Log Entry
```python
from security_enhanced.hsm import PayloadSigner

# Create signer
signer = PayloadSigner(hsm, key_id)

# Sign audit data
audit_data = {
    'user_id': 'user-123',
    'action': 'ORDER_PLACED',
    'timestamp': '2025-08-15T10:30:00Z'
}

result = signer.sign_dict(audit_data)
if result.success:
    signature = result.data  # Base64 encoded signature
```

#### Verify Audit Chain Integrity
```python
from security_enhanced.hsm import TamperDetectionMonitor

# Create monitor
monitor = TamperDetectionMonitor(hsm, key_id)

# Verify audit log chain
audit_entries = [...]  # List of audit log dicts
result = monitor.verify_audit_chain(audit_entries)

if result.is_valid:
    print("Audit chain intact - no tampering detected")
else:
    print(f"Tampering detected: {result.issues}")
```

### 🛡️ Using RBAC

#### Create JWT Token
```python
from core.rbac import RBACManager
from models.user_kyc import UserRole

# Create token for admin user
token = RBACManager.create_access_token(
    user_id='admin-001',
    role=UserRole.ADMIN,
    permissions=['orders.place', 'users.manage']
)

print(f"JWT Token: {token}")
```

#### Protect API Routes
```python
from fastapi import FastAPI, Depends
from core.rbac import require_role, require_permission, get_current_user
from models.user_kyc import UserRole

app = FastAPI()

# Require admin role
@app.post("/admin/users")
async def create_user(
    current_user: dict = Depends(require_role(UserRole.ADMIN))
):
    return {"message": f"User created by {current_user['sub']}"}

# Require specific permission
@app.post("/orders/place")
async def place_order(
    current_user: dict = Depends(require_permission("orders.place"))
):
    return {"message": "Order placed"}

# Just require authentication
@app.get("/profile")
async def get_profile(
    current_user: dict = Depends(get_current_user)
):
    return {"user_id": current_user['sub']}
```

### 🌍 Using Region Lock

#### Check Region Access
```python
from fastapi import Request, Depends
from core.region_lock_enforcer import check_region_access, require_indian_region

# Allow access from whitelisted regions
@app.get("/api/data")
async def get_data(region: str = Depends(check_region_access)):
    return {"region": region, "data": "..."}

# Require India-only access (RBI compliance)
@app.post("/api/payment")
async def process_payment(
    region: str = Depends(require_indian_region())
):
    return {"message": "Payment processed in India"}
```

#### Validate User Region
```python
from core.region_lock_enforcer import validate_user_region

@app.get("/api/trading")
async def trading_endpoint(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get user from database
    user = await db.get(User, current_user['sub'])
    
    # Validate region match
    is_valid = await validate_user_region(user.region, request)
    if not is_valid:
        # Log compliance flag
        pass
    
    return {"data": "..."}
```

### 📊 Database Operations

#### Create User with KYC
```python
from sqlalchemy.ext.asyncio import AsyncSession
from models.user_kyc import User, KYCStatus, UserRole, RiskLevel
from passlib.hash import bcrypt

async def create_user_example(db: AsyncSession):
    # Hash password
    password_hash = bcrypt.hash("SecurePassword123!")
    
    # Create user
    user = User(
        email="trader@example.com",
        password_hash=password_hash,
        full_name="John Doe",
        phone_number="+91-9876543210",
        pan_card="ABCDE1234F",
        kyc_status=KYCStatus.PENDING,
        risk_level=RiskLevel.MEDIUM,
        role=UserRole.TRADER,
        region='IN',
        trading_enabled=False  # Enable after KYC approval
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return user
```

#### Create Audit Log Entry
```python
from models.audit_ledger import AuditLog
from datetime import datetime, timezone, timedelta

async def create_audit_entry(db: AsyncSession, hsm_signer):
    # Get previous entry for chaining
    previous_entry = await db.execute(
        select(AuditLog).order_by(AuditLog.id.desc()).limit(1)
    )
    previous = previous_entry.scalar_one_or_none()
    
    # Prepare entry data
    entry_data = {
        'user_id': 'user-123',
        'action_type': 'ORDER_PLACED',
        'entity_type': 'Order',
        'entity_id': 'order-456',
        'event_data': {'symbol': 'RELIANCE', 'quantity': 100},
        'is_critical': 'true',
        'compliance_category': 'SEBI'
    }
    
    # Calculate hash
    current_hash = AuditLog.calculate_entry_hash(entry_data)
    
    # Sign with HSM
    sign_result = hsm_signer.sign_hash(current_hash)
    
    # Create entry
    audit_log = AuditLog(
        user_id=entry_data['user_id'],
        action_type=entry_data['action_type'],
        entity_type=entry_data['entity_type'],
        entity_id=entry_data['entity_id'],
        event_data=entry_data['event_data'],
        is_critical=entry_data['is_critical'],
        compliance_category=entry_data['compliance_category'],
        previous_log_hash=previous.current_log_hash if previous else None,
        current_log_hash=current_hash,
        hsm_signature=sign_result.data if sign_result.success else None,
        retention_expiry=datetime.now(timezone.utc) + timedelta(days=7*365)  # 7 years
    )
    
    db.add(audit_log)
    await db.commit()
    
    return audit_log
```

#### Place Order with Formal Verification
```python
from models.orders import Order, OrderType, OrderSide, OrderStatus
from datetime import datetime, timezone

async def place_order_example(db: AsyncSession, user_id: str):
    # Calculate verification hash
    timestamp = datetime.now(timezone.utc)
    verify_hash = Order.calculate_verify_hash(
        user_id=user_id,
        symbol='RELIANCE',
        side='BUY',
        quantity=100,
        price=2500.50,
        timestamp=timestamp
    )
    
    # Create order
    order = Order(
        user_id=user_id,
        symbol='RELIANCE',
        exchange='NSE',
        order_type=OrderType.LIMIT,
        side=OrderSide.BUY,
        quantity=100,
        price=2500.50,
        status=OrderStatus.PENDING,
        formal_verify_hash=verify_hash,
        submitted_at=timestamp
    )
    
    db.add(order)
    await db.commit()
    
    return order
```

### 🧪 Testing HSM Operations

```python
# test_hsm.py
import asyncio
from security_enhanced.hsm import MockHSMConnector, PayloadSigner

async def test_hsm():
    # Initialize HSM
    hsm = MockHSMConnector({'hsm_provider': 'mock', 'fips_mode': True})
    
    # Generate key
    key_result = hsm.generate_root_key('RSA', 'test_key', 2048)
    assert key_result.success
    key_id = key_result.data
    print(f"✅ Key generated: {key_id}")
    
    # Sign data
    payload = b"Hello TradePro AI"
    sign_result = hsm.sign_transaction(payload, key_id)
    assert sign_result.success
    signature = sign_result.data
    print(f"✅ Data signed: {signature[:50]}...")
    
    # Verify signature
    verify_result = hsm.verify_signature(payload, signature, key_id)
    assert verify_result.success and verify_result.data
    print("✅ Signature verified")
    
    # Test tampering detection
    tampered_payload = b"Hello TradePro AI (tampered)"
    verify_tampered = hsm.verify_signature(tampered_payload, signature, key_id)
    assert not verify_tampered.data
    print("✅ Tampering detected correctly")
    
    # Health check
    health = hsm.health_check()
    print(f"✅ HSM Health: {health.data['status']}")

if __name__ == "__main__":
    asyncio.run(test_hsm())
```

### 📝 Environment Variables Checklist

Ensure these are set in `/backend/.env`:

```bash
✅ DATABASE_URL          # PostgreSQL connection string
✅ JWT_SECRET_KEY        # Strong secret for JWT tokens
✅ HSM_PROVIDER          # 'mock' for dev, 'aws_cloudhsm' for prod
✅ HSM_CLUSTER_ID        # HSM cluster identifier
✅ HSM_FIPS_MODE         # 'true' to enforce FIPS algorithms
✅ ALLOWED_REGIONS       # Comma-separated region codes
✅ DATA_STORAGE_REGION   # Primary data storage region (IN for RBI)
```

### 🚀 FastAPI Integration Example

```python
# server.py
from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager
from core.database import init_database, get_db
from security_enhanced.hsm import MockHSMConnector, PayloadSigner
from core.rbac import get_current_user
from core.region_lock_enforcer import check_region_access

# Initialize HSM on startup
hsm_instance = None
signer_instance = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global hsm_instance, signer_instance
    
    # Initialize database
    await init_database()
    print("✅ Database initialized")
    
    # Initialize HSM
    hsm_instance = MockHSMConnector({'hsm_provider': 'mock', 'fips_mode': True})
    key_result = hsm_instance.generate_root_key('RSA', 'system_signing_key', 2048)
    if key_result.success:
        signer_instance = PayloadSigner(hsm_instance, key_result.data)
        print(f"✅ HSM initialized with key: {key_result.data}")
    
    yield
    
    # Shutdown
    print("🔒 Shutting down...")

app = FastAPI(lifespan=lifespan)

# Protected route example
@app.get("/api/secure-data")
async def get_secure_data(
    current_user: dict = Depends(get_current_user),
    region: str = Depends(check_region_access),
    db: AsyncSession = Depends(get_db)
):
    return {
        "user_id": current_user['sub'],
        "role": current_user['role'],
        "region": region,
        "data": "Secure trading data"
    }
```

### 📚 Next Steps

1. **Run Database Migrations**:
   ```bash
   # Generate migration
   cd /app/backend
   alembic revision --autogenerate -m "Initial schema"
   
   # Apply migration
   alembic upgrade head
   ```

2. **Test HSM Operations**: Run `test_hsm.py`

3. **Create Admin User**: Use `create_user_example()` function

4. **Test Authentication**: Generate JWT token and test protected routes

5. **Proceed to Phase 2**: Choose next component to implement

---

## 🆘 Troubleshooting

**PostgreSQL Connection Error:**
- Check DATABASE_URL format
- Ensure PostgreSQL is running
- Verify user credentials

**HSM Import Error:**
- Install cryptography: `pip install cryptography`
- Check Python version (requires 3.8+)

**JWT Token Invalid:**
- Check JWT_SECRET_KEY matches
- Verify token not expired (60 min default)
- Check token format in Authorization header

**Region Access Denied:**
- Check client IP detection
- Verify region in ALLOWED_REGIONS list
- Check proxy headers (X-Forwarded-For)
