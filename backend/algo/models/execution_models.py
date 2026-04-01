"""
Algorithmic Execution Models

Type definitions and data structures for algo execution
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal


class ExecutionStrategy(str, Enum):
    """Execution strategy types"""
    TWAP = "twap"  # Time-Weighted Average Price
    VWAP = "vwap"  # Volume-Weighted Average Price
    ICEBERG = "iceberg"  # Hidden liquidity
    POV = "pov"  # Percentage of Volume
    MARKET = "market"  # Immediate execution
    LIMIT = "limit"  # Passive limit order


class ExecutionStatus(str, Enum):
    """Execution lifecycle status"""
    PENDING = "pending"  # Awaiting start
    ACTIVE = "active"  # Currently executing
    PAUSED = "paused"  # Temporarily paused
    COMPLETED = "completed"  # Fully filled
    CANCELLED = "cancelled"  # User cancelled
    FAILED = "failed"  # Error occurred
    EXPIRED = "expired"  # Time limit exceeded


class SliceStatus(str, Enum):
    """Individual slice status"""
    SCHEDULED = "scheduled"
    SUBMITTED = "submitted"
    PARTIALLY_FILLED = "partially_filled"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class OrderSide(str, Enum):
    """Buy or Sell"""
    BUY = "buy"
    SELL = "sell"


class AlgoExecutionRequest(BaseModel):
    """
    Algorithmic execution request
    
    SEBI Compliance:
    - All algo parameters must be logged for audit
    - Maximum order size limits apply
    - Time-in-force restrictions
    """
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    user_id: str = Field(..., description="User placing the order")
    symbol: str = Field(..., description="Trading symbol (e.g., RELIANCE)")
    exchange: str = Field(..., description="Exchange (NSE, BSE)")
    side: OrderSide = Field(..., description="Buy or Sell")
    total_quantity: Decimal = Field(..., gt=0, description="Total quantity to execute")
    
    strategy: ExecutionStrategy = Field(..., description="Execution strategy")
    
    # Strategy Parameters
    duration_minutes: Optional[int] = Field(None, ge=1, le=1440, description="Execution duration (max 24 hours)")
    num_slices: Optional[int] = Field(None, ge=2, le=1000, description="Number of slices")
    participation_rate: Optional[float] = Field(None, ge=0.01, le=0.5, description="Target % of market volume")
    
    # Price Limits
    limit_price: Optional[Decimal] = Field(None, description="Limit price (None for market)")
    price_tolerance: Optional[Decimal] = Field(Decimal("0.01"), description="Acceptable price deviation (1%)")
    
    # Risk Controls
    max_slice_size: Optional[Decimal] = Field(None, description="Maximum single slice quantity")
    min_slice_size: Optional[Decimal] = Field(None, description="Minimum single slice quantity")
    
    # Time Controls
    start_time: Optional[datetime] = Field(None, description="Scheduled start time")
    end_time: Optional[datetime] = Field(None, description="Hard stop time")
    
    # Advanced
    aggressive_on_close: bool = Field(False, description="Execute remaining qty at market close")
    adapt_to_volume: bool = Field(True, description="Adapt slicing to market volume")


class OrderSlice(BaseModel):
    """Individual child order slice"""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    slice_id: str
    parent_execution_id: str
    sequence_number: int
    
    symbol: str
    side: OrderSide
    quantity: Decimal
    limit_price: Optional[Decimal]
    
    scheduled_time: datetime
    submitted_time: Optional[datetime] = None
    filled_time: Optional[datetime] = None
    
    status: SliceStatus = SliceStatus.SCHEDULED
    filled_quantity: Decimal = Decimal("0")
    average_price: Optional[Decimal] = None
    
    order_id: Optional[str] = None  # Exchange order ID
    reject_reason: Optional[str] = None


class ExecutionState(BaseModel):
    """Current execution state"""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    execution_id: str
    request: AlgoExecutionRequest
    
    status: ExecutionStatus = ExecutionStatus.PENDING
    
    # Progress
    total_quantity: Decimal
    filled_quantity: Decimal = Decimal("0")
    remaining_quantity: Decimal
    
    # Pricing
    average_fill_price: Optional[Decimal] = None
    total_value: Decimal = Decimal("0")
    
    # Slices
    slices: List[OrderSlice] = Field(default_factory=list)
    current_slice_index: int = 0
    
    # Performance
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Metrics
    vwap_benchmark: Optional[Decimal] = None  # Market VWAP for comparison
    slippage: Optional[Decimal] = None  # Actual vs benchmark
    
    # Errors
    errors: List[str] = Field(default_factory=list)
    
    def progress_percentage(self) -> float:
        """Calculate execution progress"""
        if self.total_quantity == 0:
            return 0.0
        return float((self.filled_quantity / self.total_quantity) * 100)
    
    def estimated_completion_time(self) -> Optional[datetime]:
        """Estimate when execution will complete"""
        if not self.started_at or self.filled_quantity == 0:
            return None
        
        elapsed = (datetime.now() - self.started_at).total_seconds()
        fill_rate = float(self.filled_quantity) / elapsed  # qty per second
        
        if fill_rate == 0:
            return None
        
        remaining_seconds = float(self.remaining_quantity) / fill_rate
        return datetime.now() + timedelta(seconds=remaining_seconds)


class ExecutionMetrics(BaseModel):
    """Execution performance metrics"""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    execution_id: str
    
    # Fill Metrics
    fill_rate: Decimal  # Filled / Total
    average_fill_price: Decimal
    total_value: Decimal
    
    # Performance vs Benchmarks
    arrival_price: Decimal  # Price when algo started
    vwap: Decimal  # Volume-weighted average price
    twap: Decimal  # Time-weighted average price
    
    # Slippage Analysis
    slippage_vs_arrival: Decimal  # (Fill - Arrival) / Arrival
    slippage_vs_vwap: Decimal  # (Fill - VWAP) / VWAP
    slippage_bps: Decimal  # Slippage in basis points
    
    # Timing
    total_duration_seconds: float
    time_to_first_fill: Optional[float]
    time_to_completion: Optional[float]
    
    # Execution Quality
    num_slices: int
    num_fills: int
    average_slice_size: Decimal
    participation_rate_achieved: Optional[float]
    
    # Cost Analysis
    estimated_market_impact: Decimal
    opportunity_cost: Decimal


from datetime import timedelta
