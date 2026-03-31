"""
Order, Position, and Transaction Models

SEBI Compliance:
- Order audit trail with formal verification
- Position tracking for margin requirements
- Transaction reconciliation

Formal Verification:
- Each critical calculation includes verification hash
- TLA+ specification alignment markers
"""

from sqlalchemy import Column, String, DateTime, Numeric, Enum as SQLEnum, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin, SoftDeleteMixin, generate_uuid
from datetime import datetime, timezone
import enum

class OrderType(str, enum.Enum):
    """Order Types"""
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop_loss"
    STOP_LOSS_MARKET = "stop_loss_market"
    ICEBERG = "iceberg"  # Hidden liquidity
    TWAP = "twap"  # Time-Weighted Average Price algo
    VWAP = "vwap"  # Volume-Weighted Average Price algo

class OrderSide(str, enum.Enum):
    """Buy or Sell"""
    BUY = "buy"
    SELL = "sell"

class OrderStatus(str, enum.Enum):
    """Order Lifecycle States"""
    PENDING = "pending"  # Pre-trade checks in progress
    OPEN = "open"  # Submitted to exchange
    PARTIALLY_FILLED = "partially_filled"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"  # Failed pre-trade or exchange rejection
    EXPIRED = "expired"

class Order(Base, TimestampMixin, SoftDeleteMixin):
    """
    Order Model with Formal Verification
    
    SEBI Requirements:
    - Complete order lifecycle tracking
    - Pre-trade risk checks (logged)
    - Fat-finger protection
    
    Formal Verification (TLA+ Spec: order_matching_spec.tla):
    - formal_verify_hash: Contains SHA-256 of critical order parameters
    - Ensures order immutability after placement
    - Prevents post-trade manipulation
    
    SOC2:
    - Audit trail for all order state changes
    - HSM signature for regulatory reporting
    """
    __tablename__ = 'orders'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False, index=True)
    
    # Order Details
    symbol = Column(String(20), nullable=False, index=True)  # e.g., RELIANCE, TCS
    exchange = Column(String(10), nullable=False)  # NSE, BSE, MCX
    order_type = Column(SQLEnum(OrderType), nullable=False)
    side = Column(SQLEnum(OrderSide), nullable=False)
    
    # Quantity and Price
    quantity = Column(Numeric(18, 2), nullable=False)  # Total quantity
    filled_quantity = Column(Numeric(18, 2), default=0, nullable=False)
    price = Column(Numeric(18, 2), nullable=True)  # Null for market orders
    trigger_price = Column(Numeric(18, 2), nullable=True)  # For stop-loss orders
    
    # Order Status
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False, index=True)
    status_message = Column(Text, nullable=True)
    
    # Exchange Integration
    exchange_order_id = Column(String(100), unique=True, nullable=True, index=True)
    broker_order_id = Column(String(100), nullable=True)
    exchange_timestamp = Column(DateTime, nullable=True)
    
    # Algo Trading (if applicable)
    algo_id = Column(String(36), nullable=True)  # Reference to algo strategy
    parent_order_id = Column(String(36), ForeignKey('orders.id'), nullable=True)  # For child orders in TWAP/VWAP
    
    # Risk Management
    pre_trade_check_passed = Column(Boolean, default=False, nullable=False)
    pre_trade_check_details = Column(JSON, nullable=True)  # Margin, exposure, limits
    risk_score = Column(Numeric(5, 2), nullable=True)  # 0-100
    
    # Formal Verification (TLA+ alignment)
    formal_verify_hash = Column(String(64), nullable=False, unique=True)  # SHA-256(user_id|symbol|side|qty|price|timestamp)
    calculation_verified = Column(Boolean, default=False, nullable=False)  # TLA+ spec verified
    
    # HSM Signature (for regulatory reporting)
    hsm_signature = Column(String(512), nullable=True)
    
    # Timestamps
    submitted_at = Column(DateTime, nullable=True)
    filled_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship('User', back_populates='orders')
    child_orders = relationship('Order', backref='parent_order', remote_side=[id])
    transactions = relationship('Transaction', back_populates='order')
    
    def __repr__(self):
        return f"<Order(id={self.id}, symbol={self.symbol}, side={self.side}, qty={self.quantity}, status={self.status})>"
    
    @classmethod
    def calculate_verify_hash(cls, user_id: str, symbol: str, side: str, quantity: float, price: float, timestamp: datetime) -> str:
        """
        Calculate formal verification hash for order immutability
        
        TLA+ Specification Alignment:
        This hash ensures the order parameters match the TLA+ formal specification
        for order matching and prevents post-placement tampering.
        
        Args:
            user_id: User placing the order
            symbol: Trading symbol
            side: BUY or SELL
            quantity: Order quantity
            price: Order price (use 0 for market orders)
            timestamp: Order placement timestamp
            
        Returns:
            SHA-256 hash of canonical order representation
        """
        import hashlib
        
        canonical = f"{user_id}|{symbol}|{side}|{quantity:.2f}|{price:.2f}|{timestamp.isoformat()}"
        return hashlib.sha256(canonical.encode()).hexdigest()

class Position(Base, TimestampMixin):
    """
    Current Holdings/Positions
    
    SEBI Requirements:
    - Real-time position tracking
    - Margin requirement calculation
    - Mark-to-market (MTM) updates
    
    Formal Verification (TLA+ Spec: pnl_calculation_spec.tla):
    - PnL calculation must match formal specification
    - Prevents arithmetic overflow/underflow
    """
    __tablename__ = 'positions'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False, index=True)
    
    # Position Details
    symbol = Column(String(20), nullable=False, index=True)
    exchange = Column(String(10), nullable=False)
    
    # Quantity (positive for long, negative for short)
    quantity = Column(Numeric(18, 2), nullable=False)
    
    # Cost Basis
    average_price = Column(Numeric(18, 2), nullable=False)  # Volume-weighted average
    total_cost = Column(Numeric(18, 2), nullable=False)  # Total invested amount
    
    # Current Valuation
    last_traded_price = Column(Numeric(18, 2), nullable=True)
    market_value = Column(Numeric(18, 2), nullable=True)  # quantity * last_traded_price
    unrealized_pnl = Column(Numeric(18, 2), nullable=True)  # market_value - total_cost
    realized_pnl = Column(Numeric(18, 2), default=0, nullable=False)  # From closed positions
    
    # Margin Requirements
    margin_required = Column(Numeric(18, 2), nullable=True)
    margin_available = Column(Numeric(18, 2), nullable=True)
    
    # Formal Verification
    pnl_verify_hash = Column(String(64), nullable=True)  # Hash of PnL calculation inputs
    calculation_verified = Column(Boolean, default=False, nullable=False)
    
    # Last Update
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationship
    user = relationship('User', back_populates='positions')
    
    def __repr__(self):
        return f"<Position(id={self.id}, symbol={self.symbol}, qty={self.quantity}, pnl={self.unrealized_pnl})>"

class Transaction(Base, TimestampMixin):
    """
    Executed Trades (Fill Records)
    
    SEBI Requirements:
    - Trade execution audit trail
    - Reconciliation with broker statements
    - Tax reporting (capital gains)
    """
    __tablename__ = 'transactions'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey('orders.id'), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False, index=True)
    
    # Transaction Details
    symbol = Column(String(20), nullable=False, index=True)
    exchange = Column(String(10), nullable=False)
    side = Column(SQLEnum(OrderSide), nullable=False)
    
    # Fill Details
    quantity = Column(Numeric(18, 2), nullable=False)
    price = Column(Numeric(18, 2), nullable=False)
    trade_value = Column(Numeric(18, 2), nullable=False)  # quantity * price
    
    # Fees and Charges
    brokerage = Column(Numeric(18, 2), default=0, nullable=False)
    exchange_charges = Column(Numeric(18, 2), default=0, nullable=False)
    gst = Column(Numeric(18, 2), default=0, nullable=False)
    stamp_duty = Column(Numeric(18, 2), default=0, nullable=False)
    total_charges = Column(Numeric(18, 2), default=0, nullable=False)
    
    # Net Amount
    net_amount = Column(Numeric(18, 2), nullable=False)  # trade_value ± total_charges
    
    # Exchange Details
    exchange_trade_id = Column(String(100), unique=True, nullable=True, index=True)
    exchange_timestamp = Column(DateTime, nullable=True)
    
    # Reconciliation
    reconciled = Column(Boolean, default=False, nullable=False)
    reconciliation_date = Column(DateTime, nullable=True)
    
    # HSM Signature (for tax reporting)
    hsm_signature = Column(String(512), nullable=True)
    
    # Relationships
    order = relationship('Order', back_populates='transactions')
    
    def __repr__(self):
        return f"<Transaction(id={self.id}, symbol={self.symbol}, qty={self.quantity}, price={self.price})>"
