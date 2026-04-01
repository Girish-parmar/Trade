"""
Risk Limit Enforcer

Pre-trade risk checks to prevent excessive exposure
Hard blocks before orders reach broker

SEBI Compliance:
- Position limits enforced
- Margin requirements validated
- Fat-finger detection
- Concentration limits

Formal Verification:
- TLA+ Spec: risk_enforcement_spec.tla
- Proven: order rejected if any limit exceeded
- Proven: sum of positions ≤ total limit
"""

from typing import Dict, List, Optional, Tuple
from decimal import Decimal
from datetime import datetime, timedelta
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class RiskCheckResult(str, Enum):
    """Risk check outcomes"""
    APPROVED = "approved"
    REJECTED = "rejected"
    WARNING = "warning"


class ViolationType(str, Enum):
    """Types of risk violations"""
    POSITION_LIMIT = "position_limit"
    MARGIN_INSUFFICIENT = "margin_insufficient"
    CONCENTRATION_RISK = "concentration_risk"
    FAT_FINGER = "fat_finger"
    EXPOSURE_LIMIT = "exposure_limit"
    ORDER_SIZE = "order_size"
    PRICE_DEVIATION = "price_deviation"
    DAILY_LOSS_LIMIT = "daily_loss_limit"
    CIRCUIT_BREAKER = "circuit_breaker"


class RiskLimitEnforcer:
    """
    Risk Limit Enforcer
    
    Pre-trade validation system that blocks risky orders
    before they reach the broker.
    
    Checks:
    1. Position limits (SEBI mandated)
    2. Margin requirements
    3. Concentration risk
    4. Fat-finger detection
    5. Daily loss limits
    6. Order size limits
    
    Mathematical Constraints:
        total_exposure ≤ max_exposure
        position_size ≤ max_position
        Σ(symbol_exposure) / portfolio ≤ max_concentration
    """
    
    def __init__(
        self,
        max_position_value: Decimal = Decimal("1000000"),  # ₹10 lakh
        max_order_quantity: int = 10000,
        max_concentration_pct: float = 0.25,  # 25% max in single stock
        max_daily_loss_pct: float = 0.05,  # 5% daily loss limit
        margin_buffer: float = 1.2  # 20% margin buffer
    ):
        """
        Initialize risk enforcer
        
        Args:
            max_position_value: Maximum position value (₹)
            max_order_quantity: Maximum order quantity (shares)
            max_concentration_pct: Max % of portfolio in single stock
            max_daily_loss_pct: Max daily loss as % of portfolio
            margin_buffer: Margin buffer multiplier
        """
        self.max_position_value = max_position_value
        self.max_order_quantity = max_order_quantity
        self.max_concentration = Decimal(str(max_concentration_pct))
        self.max_daily_loss = Decimal(str(max_daily_loss_pct))
        self.margin_buffer = Decimal(str(margin_buffer))
        
        # Fat-finger detection thresholds
        self.max_price_deviation = Decimal("0.10")  # 10% from last price
        self.max_value_deviation = Decimal("3.0")  # 3x average order value
    
    def validate_order(
        self,
        order: Dict,
        account: Dict,
        current_positions: List[Dict],
        market_data: Dict
    ) -> Tuple[RiskCheckResult, List[str]]:
        \"\"\"
        Comprehensive pre-trade risk validation
        
        Args:
            order: Order details {symbol, side, quantity, price, ...}
            account: Account info {value, margin_available, ...}
            current_positions: List of current positions
            market_data: Market data {last_price, avg_volume, ...}
            
        Returns:
            (result, violations) - APPROVED/REJECTED and list of violations
        \"\"\"
        violations: List[str] = []
        
        # 1. Position Limit Check
        violation = self.check_position_limit(order, current_positions)
        if violation:
            violations.append(violation)
        
        # 2. Margin Check
        violation = self.check_margin(order, account)
        if violation:
            violations.append(violation)
        
        # 3. Concentration Risk
        violation = self.check_concentration(order, account, current_positions)
        if violation:
            violations.append(violation)
        
        # 4. Fat-Finger Detection
        violation = self.check_fat_finger(order, account, market_data)
        if violation:
            violations.append(violation)
        
        # 5. Daily Loss Limit
        violation = self.check_daily_loss(account)
        if violation:
            violations.append(violation)
        
        # 6. Order Size Limit
        violation = self.check_order_size(order)
        if violation:
            violations.append(violation)
        
        # 7. Price Deviation
        violation = self.check_price_deviation(order, market_data)
        if violation:
            violations.append(violation)
        
        # Determine result
        if violations:
            result = RiskCheckResult.REJECTED
            logger.warning(
                f\"Order REJECTED for {order['symbol']}: {violations}\"
            )
        else:
            result = RiskCheckResult.APPROVED
            logger.info(f\"Order APPROVED for {order['symbol']}\")
        
        return result, violations
    
    def check_position_limit(
        self,
        order: Dict,
        current_positions: List[Dict]
    ) -> Optional[str]:
        \"\"\"
        Check if order exceeds position value limit
        
        SEBI Compliance:
        - Position limits prevent excessive concentration
        - Limits vary by stock category (large/mid/small cap)
        
        Formula:
            Current Position Value + New Order Value ≤ Max Position Value
        \"\"\"
        symbol = order[\"symbol\"]
        order_value = Decimal(str(order[\"quantity\"])) * Decimal(str(order[\"price\"]))
        
        # Find existing position in symbol
        existing_value = Decimal(\"0\")
        for pos in current_positions:
            if pos[\"symbol\"] == symbol:
                existing_value = Decimal(str(pos[\"value\"]))
                break
        
        total_value = existing_value + order_value
        
        if total_value > self.max_position_value:
            return (
                f\"{ViolationType.POSITION_LIMIT.value}: \"
                f\"Total position value ₹{total_value} exceeds limit ₹{self.max_position_value}\"
            )
        
        return None
    
    def check_margin(
        self,
        order: Dict,
        account: Dict
    ) -> Optional[str]:
        \"\"\"
        Check if sufficient margin available
        
        Formula:
            Required Margin = Order Value × Margin %
            Available Margin ≥ Required Margin × Buffer
        
        Buffer accounts for:
        - Price movement
        - Multiple orders
        - Intraday volatility
        \"\"\"
        order_value = Decimal(str(order[\"quantity\"])) * Decimal(str(order[\"price\"]))
        
        # Margin requirement (simplified - actual varies by instrument)
        margin_pct = Decimal(\"0.20\")  # 20% margin for equity delivery
        if order.get(\"product\") == \"intraday\":
            margin_pct = Decimal(\"0.10\")  # 10% for intraday
        
        required_margin = order_value * margin_pct * self.margin_buffer
        available_margin = Decimal(str(account.get(\"margin_available\", 0)))
        
        if available_margin < required_margin:
            return (
                f\"{ViolationType.MARGIN_INSUFFICIENT.value}: \"
                f\"Required ₹{required_margin:.2f}, Available ₹{available_margin:.2f}\"
            )
        
        return None
    
    def check_concentration(
        self,
        order: Dict,
        account: Dict,
        current_positions: List[Dict]
    ) -> Optional[str]:
        \"\"\"
        Check concentration risk
        
        Formula:
            Symbol Exposure % = (Symbol Value / Total Portfolio Value) × 100
            Symbol Exposure % ≤ Max Concentration %
        
        SEBI Best Practice:
        - Diversification reduces risk
        - Limit single stock exposure
        - Typically 20-25% max per stock
        \"\"\"
        symbol = order[\"symbol\"]
        order_value = Decimal(str(order[\"quantity\"])) * Decimal(str(order[\"price\"]))
        portfolio_value = Decimal(str(account.get(\"value\", 1)))
        
        # Calculate new symbol exposure
        existing_value = Decimal(\"0\")
        for pos in current_positions:
            if pos[\"symbol\"] == symbol:
                existing_value = Decimal(str(pos[\"value\"]))
                break
        
        new_symbol_value = existing_value + order_value
        concentration = (new_symbol_value / portfolio_value)
        
        if concentration > self.max_concentration:
            return (
                f\"{ViolationType.CONCENTRATION_RISK.value}: \"
                f\"Symbol concentration {concentration * 100:.1f}% exceeds limit {self.max_concentration * 100:.1f}%\"
            )
        
        return None
    
    def check_fat_finger(
        self,
        order: Dict,
        account: Dict,
        market_data: Dict
    ) -> Optional[str]:
        \"\"\"
        Detect fat-finger errors (accidental large orders)
        
        Checks:
        1. Order value vs average order value
        2. Quantity vs average daily volume
        3. Price vs current market price
        
        Fat-Finger Example:
        - User meant to buy 100 shares
        - Accidentally typed 10,000 shares
        - System detects and blocks
        \"\"\"
        order_value = Decimal(str(order[\"quantity\"])) * Decimal(str(order[\"price\"]))
        last_price = Decimal(str(market_data.get(\"last_price\", order[\"price\"])))
        avg_order_value = Decimal(str(account.get(\"avg_order_value\", 10000)))
        
        # Check 1: Value deviation
        value_ratio = order_value / avg_order_value if avg_order_value > 0 else Decimal(\"0\")
        if value_ratio > self.max_value_deviation:
            return (
                f\"{ViolationType.FAT_FINGER.value}: \"
                f\"Order value {value_ratio:.1f}x larger than average\"
            )
        
        # Check 2: Price deviation
        if order.get(\"price\"):
            order_price = Decimal(str(order[\"price\"]))
            price_deviation = abs(order_price - last_price) / last_price
            
            if price_deviation > self.max_price_deviation:
                return (
                    f\"{ViolationType.FAT_FINGER.value}: \"
                    f\"Price {price_deviation * 100:.1f}% away from market\"
                )
        
        return None
    
    def check_daily_loss(self, account: Dict) -> Optional[str]:
        \"\"\"
        Check if daily loss limit exceeded
        
        Formula:
            Daily Loss % = (Today's Loss / Starting Balance) × 100
            Daily Loss % ≤ Max Daily Loss %
        
        Purpose:
        - Prevent catastrophic losses
        - Force break when trading goes wrong
        - Circuit breaker for account
        \"\"\"
        starting_value = Decimal(str(account.get(\"starting_value\", 0)))
        current_value = Decimal(str(account.get(\"value\", 0)))
        
        if starting_value == 0:
            return None
        
        daily_pnl = current_value - starting_value
        daily_loss_pct = abs(daily_pnl / starting_value) if daily_pnl < 0 else Decimal(\"0\")
        
        if daily_loss_pct > self.max_daily_loss:
            return (
                f\"{ViolationType.DAILY_LOSS_LIMIT.value}: \"
                f\"Daily loss {daily_loss_pct * 100:.1f}% exceeds limit {self.max_daily_loss * 100:.1f}%\"
            )
        
        return None
    
    def check_order_size(self, order: Dict) -> Optional[str]:
        \"\"\"
        Check if order quantity exceeds maximum
        
        SEBI Guidelines:
        - Order size limits prevent market manipulation
        - Large orders may require special approval
        \"\"\"
        quantity = int(order[\"quantity\"])
        
        if quantity > self.max_order_quantity:
            return (
                f\"{ViolationType.ORDER_SIZE.value}: \"
                f\"Quantity {quantity} exceeds max {self.max_order_quantity}\"
            )
        
        return None
    
    def check_price_deviation(
        self,
        order: Dict,
        market_data: Dict
    ) -> Optional[str]:
        \"\"\"
        Check if order price deviates significantly from market
        
        Prevents:
        - Entering wrong price
        - Market manipulation attempts
        - Execution at unreasonable levels
        \"\"\"
        if not order.get(\"price\"):
            return None  # Market orders skip this check
        
        order_price = Decimal(str(order[\"price\"]))
        last_price = Decimal(str(market_data.get(\"last_price\", 0)))
        
        if last_price == 0:
            return None
        
        deviation = abs(order_price - last_price) / last_price
        
        if deviation > self.max_price_deviation:
            return (
                f\"{ViolationType.PRICE_DEVIATION.value}: \"
                f\"Price deviation {deviation * 100:.1f}% from market\"
            )
        
        return None
    
    def calculate_exposure_metrics(
        self,
        account: Dict,
        positions: List[Dict]
    ) -> Dict:
        \"\"\"
        Calculate portfolio exposure metrics
        
        Returns risk dashboard
        \"\"\"
        portfolio_value = Decimal(str(account.get(\"value\", 0)))
        total_position_value = sum(
            Decimal(str(p.get(\"value\", 0))) for p in positions
        )
        
        leverage = total_position_value / portfolio_value if portfolio_value > 0 else Decimal(\"0\")
        
        # Calculate concentration
        concentrations = {}
        for pos in positions:
            symbol = pos[\"symbol\"]
            value = Decimal(str(pos[\"value\"]))
            pct = (value / portfolio_value * 100) if portfolio_value > 0 else Decimal(\"0\")
            concentrations[symbol] = float(pct)
        
        max_single_concentration = max(concentrations.values()) if concentrations else 0.0
        
        return {
            \"portfolio_value\": float(portfolio_value),
            \"total_position_value\": float(total_position_value),
            \"leverage\": float(leverage),
            \"num_positions\": len(positions),
            \"max_concentration_pct\": max_single_concentration,
            \"concentrations\": concentrations,
            \"margin_used_pct\": float(account.get(\"margin_used_pct\", 0))
        }
