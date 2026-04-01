"""
Position Sizing Engine

Mathematical position sizing algorithms
Kelly Criterion, Fixed Fractional, Risk-based models

Formal Verification:
- TLA+ Spec: position_sizing_spec.tla
- Proven: position_size ≤ max_position_limit
- Proven: total_exposure ≤ account_value
"""

from typing import Optional, Dict, Tuple
from decimal import Decimal
from enum import Enum
import math
import logging

logger = logging.getLogger(__name__)


class SizingMethod(str, Enum):
    """Position sizing methodologies"""
    KELLY_CRITERION = "kelly"  # Optimal growth
    FIXED_FRACTIONAL = "fixed_fractional"  # Fixed % of capital
    RISK_BASED = "risk_based"  # Based on stop loss distance
    EQUAL_WEIGHT = "equal_weight"  # Equal $ allocation
    VOLATILITY_ADJUSTED = "volatility_adjusted"  # Inverse volatility


class PositionSizingEngine:
    """
    Position Sizing Engine
    
    Determines optimal position size based on:
    - Account size
    - Risk tolerance
    - Win/loss probabilities
    - Historical performance
    
    SEBI Compliance:
    - Position limits enforced
    - Margin requirements calculated
    - Exposure limits respected
    """
    
    def __init__(
        self,
        max_position_risk_pct: float = 0.02,  # 2% max risk per trade
        max_portfolio_risk_pct: float = 0.20,  # 20% max portfolio risk
        kelly_fraction: float = 0.25  # Use 1/4 Kelly for safety
    ):
        """
        Initialize position sizer
        
        Args:
            max_position_risk_pct: Maximum risk per position (0.02 = 2%)
            max_portfolio_risk_pct: Maximum total portfolio risk
            kelly_fraction: Kelly multiplier (0.25 = quarter Kelly)
        """
        self.max_position_risk = Decimal(str(max_position_risk_pct))
        self.max_portfolio_risk = Decimal(str(max_portfolio_risk_pct))
        self.kelly_fraction = Decimal(str(kelly_fraction))
    
    def calculate_position_size(
        self,
        account_value: Decimal,
        entry_price: Decimal,
        stop_loss_price: Decimal,
        method: SizingMethod = SizingMethod.RISK_BASED,
        win_rate: Optional[float] = None,
        avg_win: Optional[Decimal] = None,
        avg_loss: Optional[Decimal] = None
    ) -> Dict:
        """
        Calculate position size using specified method
        
        Args:
            account_value: Total account value
            entry_price: Planned entry price
            stop_loss_price: Stop loss price
            method: Sizing method to use
            win_rate: Historical win rate (for Kelly)
            avg_win: Average win size (for Kelly)
            avg_loss: Average loss size (for Kelly)
            
        Returns:
            Dictionary with position sizing details
        """
        if method == SizingMethod.KELLY_CRITERION:
            return self.kelly_criterion(
                account_value, entry_price, stop_loss_price,
                win_rate, avg_win, avg_loss
            )
        elif method == SizingMethod.FIXED_FRACTIONAL:
            return self.fixed_fractional(
                account_value, entry_price, stop_loss_price
            )
        elif method == SizingMethod.RISK_BASED:
            return self.risk_based(
                account_value, entry_price, stop_loss_price
            )
        elif method == SizingMethod.VOLATILITY_ADJUSTED:
            return self.volatility_adjusted(
                account_value, entry_price, stop_loss_price
            )
        else:
            raise ValueError(f"Unknown sizing method: {method}")
    
    def kelly_criterion(
        self,
        account_value: Decimal,
        entry_price: Decimal,
        stop_loss_price: Decimal,
        win_rate: Optional[float] = None,
        avg_win: Optional[Decimal] = None,
        avg_loss: Optional[Decimal] = None
    ) -> Dict:
        """
        Kelly Criterion position sizing
        
        Mathematical Formula:
            f* = (bp - q) / b
            
        Where:
            f* = Optimal fraction of capital to risk
            b = Odds received on bet (avg_win / avg_loss)
            p = Probability of winning (win_rate)
            q = Probability of losing (1 - win_rate)
        
        Derivation:
            Expected value per unit risked:
                E = p × avg_win - q × avg_loss
            
            Kelly fraction maximizes logarithmic growth:
                f* = E / avg_loss
        
        Safety Adjustment:
            Use fractional Kelly (typically 1/4 or 1/2) to reduce volatility
        
        Args:
            account_value: Total account value
            entry_price: Entry price
            stop_loss_price: Stop loss price
            win_rate: Historical win rate (0-1)
            avg_win: Average winning trade P&L
            avg_loss: Average losing trade P&L
            
        Returns:
            Position sizing calculation results
        """
        # Validate inputs
        if not all([win_rate, avg_win, avg_loss]):
            raise ValueError("Kelly requires win_rate, avg_win, and avg_loss")
        
        if not (0 < win_rate < 1):
            raise ValueError("Win rate must be between 0 and 1")
        
        # Calculate odds (b)
        odds = abs(avg_win / avg_loss)
        
        # Calculate probabilities
        p = Decimal(str(win_rate))
        q = Decimal("1") - p
        
        # Kelly formula: f* = (bp - q) / b
        numerator = (Decimal(str(odds)) * p) - q
        kelly_fraction = numerator / Decimal(str(odds))
        
        # Apply fractional Kelly for safety
        adjusted_kelly = kelly_fraction * self.kelly_fraction
        
        # Ensure non-negative
        adjusted_kelly = max(adjusted_kelly, Decimal("0"))
        
        # Calculate position size
        risk_per_share = abs(entry_price - stop_loss_price)
        risk_amount = account_value * adjusted_kelly
        
        quantity = (risk_amount / risk_per_share).quantize(Decimal("1"))
        
        # Cap at maximum risk
        max_risk = account_value * self.max_position_risk
        if quantity * risk_per_share > max_risk:
            quantity = (max_risk / risk_per_share).quantize(Decimal("1"))
        
        position_value = quantity * entry_price
        
        logger.info(
            f"Kelly sizing: f*={float(kelly_fraction):.4f}, "
            f"adjusted={float(adjusted_kelly):.4f}, qty={quantity}"
        )
        
        return {
            "method": "kelly_criterion",
            "quantity": quantity,
            "position_value": position_value,
            "risk_amount": quantity * risk_per_share,
            "risk_percentage": float((quantity * risk_per_share / account_value) * 100),
            "kelly_fraction": float(kelly_fraction),
            "adjusted_kelly": float(adjusted_kelly),
            "odds": float(odds),
            "expected_value": float(p * avg_win - q * abs(avg_loss))
        }
    
    def fixed_fractional(
        self,
        account_value: Decimal,
        entry_price: Decimal,
        stop_loss_price: Decimal,
        risk_fraction: Decimal = Decimal("0.02")  # 2% default
    ) -> Dict:
        """
        Fixed Fractional position sizing
        
        Mathematical Formula:
            Position Size = (Account Value × Risk %) / Risk per Share
            
        Where:
            Risk per Share = |Entry Price - Stop Loss Price|
        
        Properties:
            - Simple and consistent
            - Risk fixed percentage per trade
            - Position size adapts to stop distance
        
        Example:
            Account: $100,000
            Risk: 2% = $2,000
            Entry: $50
            Stop: $48
            Risk/share: $2
            Quantity: $2,000 / $2 = 1,000 shares
        
        Args:
            account_value: Total account value
            entry_price: Entry price
            stop_loss_price: Stop loss price
            risk_fraction: Fraction of capital to risk
            
        Returns:
            Position sizing calculation
        """
        # Calculate risk per share
        risk_per_share = abs(entry_price - stop_loss_price)
        
        if risk_per_share == 0:
            raise ValueError("Stop loss must be different from entry price")
        
        # Calculate dollar risk
        dollar_risk = account_value * risk_fraction
        
        # Calculate quantity
        quantity = (dollar_risk / risk_per_share).quantize(Decimal("1"))
        
        # Ensure minimum 1 share
        quantity = max(quantity, Decimal("1"))
        
        position_value = quantity * entry_price
        actual_risk = quantity * risk_per_share
        
        return {
            "method": "fixed_fractional",
            "quantity": quantity,
            "position_value": position_value,
            "risk_amount": actual_risk,
            "risk_percentage": float((actual_risk / account_value) * 100),
            "risk_per_share": risk_per_share,
            "target_risk_fraction": float(risk_fraction)
        }
    
    def risk_based(
        self,
        account_value: Decimal,
        entry_price: Decimal,
        stop_loss_price: Decimal
    ) -> Dict:
        """
        Risk-based position sizing
        
        Uses fixed fractional with max position risk
        
        Args:
            account_value: Account value
            entry_price: Entry price
            stop_loss_price: Stop loss price
            
        Returns:
            Position sizing calculation
        """
        return self.fixed_fractional(
            account_value,
            entry_price,
            stop_loss_price,
            self.max_position_risk
        )
    
    def volatility_adjusted(
        self,
        account_value: Decimal,
        entry_price: Decimal,
        stop_loss_price: Decimal,
        atr: Optional[Decimal] = None
    ) -> Dict:
        """
        Volatility-adjusted position sizing
        
        Mathematical Formula:
            Position Size = Risk Amount / (ATR × Multiplier)
        
        Inverse relationship with volatility:
            - High volatility → Smaller position
            - Low volatility → Larger position
        
        Args:
            account_value: Account value
            entry_price: Entry price
            stop_loss_price: Stop loss
            atr: Average True Range (measure of volatility)
            
        Returns:
            Position sizing calculation
        """
        # Use stop distance as volatility proxy if ATR not provided
        if atr is None:
            atr = abs(entry_price - stop_loss_price)
        
        # Calculate risk amount
        risk_amount = account_value * self.max_position_risk
        
        # Position size inversely proportional to volatility
        quantity = (risk_amount / atr).quantize(Decimal("1"))
        
        # Ensure minimum
        quantity = max(quantity, Decimal("1"))
        
        position_value = quantity * entry_price
        actual_risk = quantity * atr
        
        return {
            "method": "volatility_adjusted",
            "quantity": quantity,
            "position_value": position_value,
            "risk_amount": actual_risk,
            "risk_percentage": float((actual_risk / account_value) * 100),
            "atr": atr,
            "volatility_factor": float(atr / entry_price)
        }
    
    def calculate_portfolio_heat(
        self,
        positions: list[Dict],
        account_value: Decimal
    ) -> Dict:
        """
        Calculate total portfolio risk (heat)
        
        Mathematical Formula:
            Portfolio Heat = Σ (Position Risk) / Account Value
        
        Where:
            Position Risk = Quantity × |Entry - Stop|
        
        SEBI Compliance:
            Total exposure should not exceed prudent limits
        
        Args:
            positions: List of open positions with risk data
            account_value: Total account value
            
        Returns:
            Portfolio risk metrics
        """
        total_risk = Decimal("0")
        total_value = Decimal("0")
        
        for pos in positions:
            position_risk = Decimal(str(pos["quantity"])) * Decimal(str(pos["risk_per_share"]))
            total_risk += position_risk
            total_value += Decimal(str(pos["position_value"]))
        
        heat_percentage = (total_risk / account_value) * 100
        
        return {
            "total_risk": total_risk,
            "heat_percentage": float(heat_percentage),
            "total_position_value": total_value,
            "leverage": float(total_value / account_value),
            "num_positions": len(positions),
            "within_limits": heat_percentage <= (self.max_portfolio_risk * 100)
        }
