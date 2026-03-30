from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import secrets
from bson import ObjectId
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE = timedelta(minutes=15)
REFRESH_TOKEN_EXPIRE = timedelta(days=7)

# Create the main app
app = FastAPI(title="TradePro AI API", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== ENUMS ====================
class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    MENTOR = "mentor"

class SubscriptionPlan(str, Enum):
    FREE = "free"
    BASIC = "basic"
    PRO = "pro"
    ENTERPRISE = "enterprise"

class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"

class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop_loss"
    STOP_LIMIT = "stop_limit"

class OrderStatus(str, Enum):
    PENDING = "pending"
    OPEN = "open"
    FILLED = "filled"
    PARTIALLY_FILLED = "partially_filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"

class StrategyStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    STOPPED = "stopped"

# ==================== MODELS ====================
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: datetime

class BrokerCreate(BaseModel):
    broker_name: str
    api_key: str
    api_secret: str
    additional_config: Optional[Dict[str, Any]] = None

class BrokerResponse(BaseModel):
    id: str
    broker_name: str
    status: str
    connected_at: datetime

class StrategyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    json_definition: Dict[str, Any]
    tags: Optional[List[str]] = None

class StrategyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    json_definition: Optional[Dict[str, Any]] = None
    status: Optional[StrategyStatus] = None
    tags: Optional[List[str]] = None

class StrategyResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str]
    status: str
    version: int
    tags: Optional[List[str]]
    created_at: datetime
    updated_at: datetime

class OrderCreate(BaseModel):
    broker_id: str
    strategy_id: Optional[str] = None
    symbol: str
    side: OrderSide
    quantity: float
    price: Optional[float] = None
    order_type: OrderType
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None

class OrderResponse(BaseModel):
    id: str
    symbol: str
    side: str
    quantity: float
    price: Optional[float]
    order_type: str
    status: str
    filled_quantity: float
    avg_price: Optional[float]
    created_at: datetime

class PositionResponse(BaseModel):
    id: str
    broker_id: str
    symbol: str
    quantity: float
    avg_price: float
    current_price: float
    pnl: float
    pnl_percent: float

class WatchlistCreate(BaseModel):
    name: str
    symbols: List[str]

class WatchlistResponse(BaseModel):
    id: str
    name: str
    symbols: List[str]
    created_at: datetime

class AlertCreate(BaseModel):
    symbol: str
    condition: str
    target_value: float
    message: Optional[str] = None

class AlertResponse(BaseModel):
    id: str
    symbol: str
    condition: str
    target_value: float
    status: str
    created_at: datetime

# ==================== PASSWORD & JWT UTILITIES ====================
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + ACCESS_TOKEN_EXPIRE,
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + REFRESH_TOKEN_EXPIRE,
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== AUTH ENDPOINTS ====================
@api_router.post("/auth/register", response_model=UserResponse)
async def register(user: UserRegister, response: Response):
    email_lower = user.email.lower()
    
    existing = await db.users.find_one({"email": email_lower})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    password_hash = hash_password(user.password)
    
    user_doc = {
        "email": email_lower,
        "password_hash": password_hash,
        "name": user.name,
        "role": UserRole.USER.value,
        "status": "active",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email_lower)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=900,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=604800,
        path="/"
    )
    
    return UserResponse(
        id=user_id,
        email=email_lower,
        name=user.name,
        role=UserRole.USER.value,
        created_at=user_doc["created_at"]
    )

@api_router.post("/auth/login", response_model=UserResponse)
async def login(credentials: UserLogin, response: Response):
    email_lower = credentials.email.lower()
    
    user = await db.users.find_one({"email": email_lower})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email_lower)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=900,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=604800,
        path="/"
    )
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc)}}
    )
    
    return UserResponse(
        id=user_id,
        email=email_lower,
        name=user["name"],
        role=user["role"],
        created_at=user["created_at"]
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(request: Request):
    user = await get_current_user(request)
    return UserResponse(
        id=user["_id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        created_at=user["created_at"]
    )

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== BROKER ENDPOINTS ====================
@api_router.post("/brokers", response_model=BrokerResponse)
async def connect_broker(broker: BrokerCreate, request: Request):
    user = await get_current_user(request)
    
    broker_doc = {
        "user_id": ObjectId(user["_id"]),
        "broker_name": broker.broker_name,
        "api_key_encrypted": broker.api_key,
        "api_secret_encrypted": broker.api_secret,
        "additional_config": broker.additional_config or {},
        "status": "connected",
        "connected_at": datetime.now(timezone.utc)
    }
    
    result = await db.user_brokers.insert_one(broker_doc)
    
    return BrokerResponse(
        id=str(result.inserted_id),
        broker_name=broker.broker_name,
        status="connected",
        connected_at=broker_doc["connected_at"]
    )

@api_router.get("/brokers", response_model=List[BrokerResponse])
async def get_brokers(request: Request):
    user = await get_current_user(request)
    
    brokers = await db.user_brokers.find(
        {"user_id": ObjectId(user["_id"])},
        {"api_key_encrypted": 0, "api_secret_encrypted": 0}
    ).to_list(100)
    
    return [
        BrokerResponse(
            id=str(b["_id"]),
            broker_name=b["broker_name"],
            status=b["status"],
            connected_at=b["connected_at"]
        )
        for b in brokers
    ]

@api_router.delete("/brokers/{broker_id}")
async def disconnect_broker(broker_id: str, request: Request):
    user = await get_current_user(request)
    
    result = await db.user_brokers.delete_one({
        "_id": ObjectId(broker_id),
        "user_id": ObjectId(user["_id"])
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Broker not found")
    
    return {"message": "Broker disconnected"}

# ==================== STRATEGY ENDPOINTS ====================
@api_router.post("/strategies", response_model=StrategyResponse)
async def create_strategy(strategy: StrategyCreate, request: Request):
    user = await get_current_user(request)
    
    strategy_doc = {
        "user_id": ObjectId(user["_id"]),
        "name": strategy.name,
        "description": strategy.description,
        "json_definition": strategy.json_definition,
        "status": StrategyStatus.DRAFT.value,
        "version": 1,
        "tags": strategy.tags or [],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await db.strategies.insert_one(strategy_doc)
    
    return StrategyResponse(
        id=str(result.inserted_id),
        user_id=user["_id"],
        name=strategy.name,
        description=strategy.description,
        status=strategy_doc["status"],
        version=1,
        tags=strategy.tags,
        created_at=strategy_doc["created_at"],
        updated_at=strategy_doc["updated_at"]
    )

@api_router.get("/strategies", response_model=List[StrategyResponse])
async def get_strategies(request: Request, status: Optional[str] = None):
    user = await get_current_user(request)
    
    query = {"user_id": ObjectId(user["_id"])}
    if status:
        query["status"] = status
    
    strategies = await db.strategies.find(query).to_list(100)
    
    return [
        StrategyResponse(
            id=str(s["_id"]),
            user_id=user["_id"],
            name=s["name"],
            description=s.get("description"),
            status=s["status"],
            version=s["version"],
            tags=s.get("tags", []),
            created_at=s["created_at"],
            updated_at=s["updated_at"]
        )
        for s in strategies
    ]

@api_router.get("/strategies/{strategy_id}")
async def get_strategy(strategy_id: str, request: Request):
    user = await get_current_user(request)
    
    strategy = await db.strategies.find_one({
        "_id": ObjectId(strategy_id),
        "user_id": ObjectId(user["_id"])
    })
    
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    strategy["_id"] = str(strategy["_id"])
    strategy["user_id"] = str(strategy["user_id"])
    return strategy

@api_router.put("/strategies/{strategy_id}", response_model=StrategyResponse)
async def update_strategy(strategy_id: str, update: StrategyUpdate, request: Request):
    user = await get_current_user(request)
    
    update_data = {k: v for k, v in update.model_dump(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.strategies.find_one_and_update(
        {"_id": ObjectId(strategy_id), "user_id": ObjectId(user["_id"])},
        {"$set": update_data},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    return StrategyResponse(
        id=str(result["_id"]),
        user_id=user["_id"],
        name=result["name"],
        description=result.get("description"),
        status=result["status"],
        version=result["version"],
        tags=result.get("tags", []),
        created_at=result["created_at"],
        updated_at=result["updated_at"]
    )

@api_router.delete("/strategies/{strategy_id}")
async def delete_strategy(strategy_id: str, request: Request):
    user = await get_current_user(request)
    
    result = await db.strategies.delete_one({
        "_id": ObjectId(strategy_id),
        "user_id": ObjectId(user["_id"])
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    return {"message": "Strategy deleted"}

# ==================== ORDER ENDPOINTS ====================
@api_router.post("/orders", response_model=OrderResponse)
async def create_order(order: OrderCreate, request: Request):
    user = await get_current_user(request)
    
    broker = await db.user_brokers.find_one({
        "_id": ObjectId(order.broker_id),
        "user_id": ObjectId(user["_id"])
    })
    
    if not broker:
        raise HTTPException(status_code=404, detail="Broker not found")
    
    order_doc = {
        "user_id": ObjectId(user["_id"]),
        "broker_id": ObjectId(order.broker_id),
        "strategy_id": ObjectId(order.strategy_id) if order.strategy_id else None,
        "symbol": order.symbol,
        "side": order.side.value,
        "quantity": order.quantity,
        "price": order.price,
        "order_type": order.order_type.value,
        "status": OrderStatus.PENDING.value,
        "filled_quantity": 0,
        "avg_price": None,
        "stop_loss": order.stop_loss,
        "take_profit": order.take_profit,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await db.orders.insert_one(order_doc)
    
    return OrderResponse(
        id=str(result.inserted_id),
        symbol=order.symbol,
        side=order.side.value,
        quantity=order.quantity,
        price=order.price,
        order_type=order.order_type.value,
        status=order_doc["status"],
        filled_quantity=0,
        avg_price=None,
        created_at=order_doc["created_at"]
    )

@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(request: Request, status: Optional[str] = None):
    user = await get_current_user(request)
    
    query = {"user_id": ObjectId(user["_id"])}
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query).sort("created_at", -1).to_list(100)
    
    return [
        OrderResponse(
            id=str(o["_id"]),
            symbol=o["symbol"],
            side=o["side"],
            quantity=o["quantity"],
            price=o.get("price"),
            order_type=o["order_type"],
            status=o["status"],
            filled_quantity=o["filled_quantity"],
            avg_price=o.get("avg_price"),
            created_at=o["created_at"]
        )
        for o in orders
    ]

@api_router.delete("/orders/{order_id}")
async def cancel_order(order_id: str, request: Request):
    user = await get_current_user(request)
    
    result = await db.orders.find_one_and_update(
        {"_id": ObjectId(order_id), "user_id": ObjectId(user["_id"])},
        {"$set": {"status": OrderStatus.CANCELLED.value, "updated_at": datetime.now(timezone.utc)}},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order cancelled"}

# ==================== POSITION ENDPOINTS ====================
@api_router.get("/positions", response_model=List[PositionResponse])
async def get_positions(request: Request):
    user = await get_current_user(request)
    
    positions = await db.positions.find({"user_id": ObjectId(user["_id"])}).to_list(100)
    
    return [
        PositionResponse(
            id=str(p["_id"]),
            broker_id=str(p["broker_id"]),
            symbol=p["symbol"],
            quantity=p["quantity"],
            avg_price=p["avg_price"],
            current_price=p.get("current_price", p["avg_price"]),
            pnl=p.get("pnl", 0),
            pnl_percent=p.get("pnl_percent", 0)
        )
        for p in positions
    ]

# ==================== WATCHLIST ENDPOINTS ====================
@api_router.post("/watchlists", response_model=WatchlistResponse)
async def create_watchlist(watchlist: WatchlistCreate, request: Request):
    user = await get_current_user(request)
    
    watchlist_doc = {
        "user_id": ObjectId(user["_id"]),
        "name": watchlist.name,
        "symbols": watchlist.symbols,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.watchlists.insert_one(watchlist_doc)
    
    return WatchlistResponse(
        id=str(result.inserted_id),
        name=watchlist.name,
        symbols=watchlist.symbols,
        created_at=watchlist_doc["created_at"]
    )

@api_router.get("/watchlists", response_model=List[WatchlistResponse])
async def get_watchlists(request: Request):
    user = await get_current_user(request)
    
    watchlists = await db.watchlists.find({"user_id": ObjectId(user["_id"])}).to_list(100)
    
    return [
        WatchlistResponse(
            id=str(w["_id"]),
            name=w["name"],
            symbols=w["symbols"],
            created_at=w["created_at"]
        )
        for w in watchlists
    ]

# ==================== ALERT ENDPOINTS ====================
@api_router.post("/alerts", response_model=AlertResponse)
async def create_alert(alert: AlertCreate, request: Request):
    user = await get_current_user(request)
    
    alert_doc = {
        "user_id": ObjectId(user["_id"]),
        "symbol": alert.symbol,
        "condition": alert.condition,
        "target_value": alert.target_value,
        "message": alert.message,
        "status": "active",
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.alerts.insert_one(alert_doc)
    
    return AlertResponse(
        id=str(result.inserted_id),
        symbol=alert.symbol,
        condition=alert.condition,
        target_value=alert.target_value,
        status="active",
        created_at=alert_doc["created_at"]
    )

@api_router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(request: Request):
    user = await get_current_user(request)
    
    alerts = await db.alerts.find({"user_id": ObjectId(user["_id"])}).to_list(100)
    
    return [
        AlertResponse(
            id=str(a["_id"]),
            symbol=a["symbol"],
            condition=a["condition"],
            target_value=a["target_value"],
            status=a["status"],
            created_at=a["created_at"]
        )
        for a in alerts
    ]

# ==================== MARKET DATA ENDPOINTS (MOCK) ====================
@api_router.get("/market/quote/{symbol}")
async def get_quote(symbol: str, request: Request):
    await get_current_user(request)
    
    import random
    base_price = random.uniform(100, 5000)
    
    return {
        "symbol": symbol,
        "price": round(base_price, 2),
        "change": round(random.uniform(-5, 5), 2),
        "change_percent": round(random.uniform(-2, 2), 2),
        "volume": random.randint(100000, 10000000),
        "high": round(base_price * 1.02, 2),
        "low": round(base_price * 0.98, 2),
        "open": round(base_price * 0.99, 2),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/market/candles/{symbol}")
async def get_candles(symbol: str, interval: str = "1d", limit: int = 100, request: Request = None):
    await get_current_user(request)
    
    import random
    candles = []
    base_time = datetime.now(timezone.utc)
    base_price = random.uniform(100, 1000)
    
    for i in range(limit):
        open_price = base_price + random.uniform(-5, 5)
        close_price = open_price + random.uniform(-3, 3)
        high_price = max(open_price, close_price) + random.uniform(0, 2)
        low_price = min(open_price, close_price) - random.uniform(0, 2)
        
        candles.append({
            "time": (base_time - timedelta(days=limit-i)).isoformat(),
            "open": round(open_price, 2),
            "high": round(high_price, 2),
            "low": round(low_price, 2),
            "close": round(close_price, 2),
            "volume": random.randint(10000, 1000000)
        })
        
        base_price = close_price
    
    return candles

# ==================== DASHBOARD ENDPOINTS ====================
@api_router.get("/dashboard/summary")
async def get_dashboard_summary(request: Request):
    user = await get_current_user(request)
    user_id = ObjectId(user["_id"])
    
    total_strategies = await db.strategies.count_documents({"user_id": user_id})
    active_strategies = await db.strategies.count_documents({"user_id": user_id, "status": "active"})
    total_orders = await db.orders.count_documents({"user_id": user_id})
    open_positions = await db.positions.count_documents({"user_id": user_id})
    
    return {
        "total_strategies": total_strategies,
        "active_strategies": active_strategies,
        "total_orders": total_orders,
        "open_positions": open_positions,
        "portfolio_value": 50000.00,
        "total_pnl": 2500.50,
        "pnl_percent": 5.25,
        "win_rate": 65.5
    }

# ==================== STARTUP & SHUTDOWN ====================
@app.on_event("startup")
async def startup_event():
    await db.users.create_index("email", unique=True)
    await db.strategies.create_index("user_id")
    await db.orders.create_index("user_id")
    await db.orders.create_index("status")
    await db.positions.create_index("user_id")
    await db.user_brokers.create_index("user_id")
    
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@tradepro.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        admin_doc = {
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": UserRole.ADMIN.value,
            "status": "active",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(admin_doc)
        logger.info(f"Admin user created: {admin_email}")
    
    Path("/app/memory").mkdir(parents=True, exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"""# Test Credentials

## Admin Account
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout
""")
    
    logger.info("TradePro AI API started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    client.close()

# Include router and CORS
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.environ.get('FRONTEND_URL', 'http://localhost:3000'), os.environ.get('REACT_APP_BACKEND_URL', '')],
    allow_methods=["*"],
    allow_headers=["*"],
)
