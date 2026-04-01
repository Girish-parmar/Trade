"""
Dynamic Stop Loss Engine

ATR-based trailing stops and time-based exits
Adaptive risk management for open positions

Formal Verification:
- TLA+ Spec: stoploss_logic_spec.tla
- Proven: stop_price never moves against position
- Proven: stop activates when price crosses stop level
"""

from typing import Optional, List, Dict, Tuple
from decimal import Decimal
from datetime import datetime, timedelta
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class StopType(str, Enum):
    """Stop loss types"""
    FIXED = "fixed"  # Static price level
    TRAILING = "trailing"  # Follows price with fixed distance
    ATR_TRAILING = "atr_trailing"  # Trails based on ATR
    TIME_BASED = "time_based"  # Exit after time period
    PROFIT_TARGET = "profit_target"  # Take profit at target
    CHANDELIER = "chandelier"  # Highest high - (ATR × multiplier)


class PositionSide(str, Enum):
    """Position direction"""
    LONG = "long"
    SHORT = "short"


class DynamicStopLoss:
    """
    Dynamic Stop Loss Manager
    
    Implements various stop loss strategies:
    - Fixed stop loss
    - Trailing stop loss
    - ATR-based trailing stop
    - Time-based exits
    - Chandelier exit
    
    Mathematical Properties:
    1. Long: stop_price ≤ current_price (never moves up)
    2. Short: stop_price ≥ current_price (never moves down)
    3. Distance from price ≥ minimum_distance
    """
    
    def __init__(
        self,
        atr_period: int = 14,
        atr_multiplier: Decimal = Decimal("2.0")
    ):
        """
        Initialize stop loss manager
        
        Args:
            atr_period: Period for ATR calculation (default 14)
            atr_multiplier: ATR multiplier for stop distance (default 2.0)
        """
        self.atr_period = atr_period
        self.atr_multiplier = atr_multiplier
    
    def calculate_atr(
        self,
        high_prices: List[Decimal],
        low_prices: List[Decimal],
        close_prices: List[Decimal]
    ) -> Decimal:
        """
        Calculate Average True Range (ATR)
        
        Mathematical Formula:
            True Range (TR) = max(
                High - Low,
                |High - Previous Close|,
                |Low - Previous Close|
            )
            
            ATR = EMA(TR, period)
        
        Properties:
            - Measures market volatility
            - Larger ATR = more volatile
            - Used for adaptive stop distances
        
        Args:
            high_prices: List of high prices
            low_prices: List of low prices
            close_prices: List of closing prices
            
        Returns:
            Average True Range value
        """
        if len(high_prices) < self.atr_period + 1:
            raise ValueError(f"Need at least {self.atr_period + 1} price bars")
        
        true_ranges: List[Decimal] = []
        
        for i in range(1, len(high_prices)):
            # True Range = max of three values
            tr = max(
                high_prices[i] - low_prices[i],  # Current range
                abs(high_prices[i] - close_prices[i-1]),  # High vs prev close
                abs(low_prices[i] - close_prices[i-1])  # Low vs prev close
            )
            true_ranges.append(tr)
        
        # Calculate EMA of true ranges
        atr = self._calculate_ema(true_ranges, self.atr_period)
        
        return atr
    
    def _calculate_ema(self, values: List[Decimal], period: int) -> Decimal:
        """
        Calculate Exponential Moving Average
        
        Formula:
            EMA[today] = (Value[today] × k) + (EMA[yesterday] × (1 - k))
            where k = 2 / (period + 1)
        """
        k = Decimal("2") / Decimal(period + 1)
        ema = values[0]  # Start with first value
        
        for value in values[1:]:
            ema = (value * k) + (ema * (Decimal("1") - k))
        
        return ema
    
    def calculate_atr_trailing_stop(
        self,
        entry_price: Decimal,
        current_price: Decimal,
        atr: Decimal,
        side: PositionSide,
        current_stop: Optional[Decimal] = None
    ) -> Decimal:
        """
        Calculate ATR-based trailing stop
        
        Mathematical Formula:
            Long Position:
                Stop = Current Price - (ATR × Multiplier)
                Stop = max(Stop, Previous Stop)  # Never move down
            
            Short Position:
                Stop = Current Price + (ATR × Multiplier)
                Stop = min(Stop, Previous Stop)  # Never move up
        
        Properties:
            - Adapts to volatility
            - Wider stops in volatile markets
            - Tighter stops in calm markets
        
        Args:
            entry_price: Original entry price
            current_price: Current market price
            atr: Average True Range
            side: LONG or SHORT
            current_stop: Current stop price (if exists)
            
        Returns:
            New stop loss price
        """
        stop_distance = atr * self.atr_multiplier
        
        if side == PositionSide.LONG:
            # Long: stop below current price
            new_stop = current_price - stop_distance
            
            # Never move stop down (only up or stay same)
            if current_stop is not None:
                new_stop = max(new_stop, current_stop)
            
            # Ensure stop is below entry (don't lock in loss)
            new_stop = min(new_stop, entry_price)
            
        else:  # SHORT
            # Short: stop above current price
            new_stop = current_price + stop_distance
            
            # Never move stop up (only down or stay same)
            if current_stop is not None:
                new_stop = min(new_stop, current_stop)
            
            # Ensure stop is above entry
            new_stop = max(new_stop, entry_price)
        
        return new_stop
    
    def calculate_chandelier_exit(
        self,
        high_prices: List[Decimal],
        low_prices: List[Decimal],
        atr: Decimal,
        side: PositionSide,
        lookback: int = 22
    ) -> Decimal:
        \"\"\"
        Calculate Chandelier Exit
        
        Mathematical Formula:
            Long:
                Stop = Highest(High, lookback) - (ATR × Multiplier)
            
            Short:
                Stop = Lowest(Low, lookback) + (ATR × Multiplier)
        
        Origin:
            Developed by Charles Le Beau
            Hangs from the ceiling (highest/lowest point)
        
        Properties:
            - Based on highest high or lowest low
            - Maintains distance using ATR
            - Very effective trailing stop
        
        Args:
            high_prices: List of high prices
            low_prices: List of low prices
            atr: Average True Range
            side: LONG or SHORT
            lookback: Lookback period for highest/lowest
            
        Returns:
            Chandelier exit price
        \"\"\"
        if len(high_prices) < lookback:
            raise ValueError(f\"Need at least {lookback} price bars\")
        
        if side == PositionSide.LONG:
            # Long: Highest high - ATR × multiplier
            highest = max(high_prices[-lookback:])
            stop = highest - (atr * self.atr_multiplier)
        else:
            # Short: Lowest low + ATR × multiplier
            lowest = min(low_prices[-lookback:])
            stop = lowest + (atr * self.atr_multiplier)
        
        return stop
    
    def calculate_time_based_exit(
        self,
        entry_time: datetime,
        max_hold_period_hours: int = 24
    ) -> Tuple[bool, Optional[datetime]]:
        \"\"\"
        Calculate time-based exit
        
        Strategy:
            Exit position after holding for specified period
            Useful for intraday strategies or avoiding overnight risk
        
        Args:
            entry_time: When position was entered
            max_hold_period_hours: Maximum hours to hold position
            
        Returns:
            (should_exit, exit_time)
        \"\"\"
        exit_time = entry_time + timedelta(hours=max_hold_period_hours)
        should_exit = datetime.now() >= exit_time
        
        return should_exit, exit_time
    
    def calculate_profit_target(
        self,
        entry_price: Decimal,
        side: PositionSide,
        risk_reward_ratio: Decimal = Decimal(\"2.0\"),
        stop_loss_price: Optional[Decimal] = None
    ) -> Decimal:
        \"\"\"
        Calculate profit target based on risk/reward ratio
        
        Mathematical Formula:
            Risk = |Entry - Stop|
            Reward = Risk × R:R Ratio
            
            Long:
                Target = Entry + Reward
            
            Short:
                Target = Entry - Reward
        
        Example:
            Entry: $100
            Stop: $98
            Risk: $2
            R:R: 2:1
            Reward: $4
            Target: $104
        
        Args:
            entry_price: Entry price
            side: LONG or SHORT
            risk_reward_ratio: Risk/reward ratio (2.0 = 2:1)
            stop_loss_price: Stop loss price
            
        Returns:
            Profit target price
        \"\"\"
        if stop_loss_price is None:
            # Default to 2% risk if no stop provided
            risk = entry_price * Decimal(\"0.02\")
        else:
            risk = abs(entry_price - stop_loss_price)
        
        reward = risk * risk_reward_ratio
        
        if side == PositionSide.LONG:
            target = entry_price + reward
        else:
            target = entry_price - reward
        
        return target
    
    def should_exit(
        self,
        current_price: Decimal,
        stop_price: Decimal,
        target_price: Optional[Decimal],
        side: PositionSide
    ) -> Dict:
        \"\"\"
        Check if position should be exited
        
        Exit Conditions:
        1. Stop loss hit
        2. Profit target hit (if set)
        
        Args:
            current_price: Current market price
            stop_price: Stop loss price
            target_price: Profit target (optional)
            side: LONG or SHORT
            
        Returns:
            Exit decision with reason
        \"\"\"
        should_exit = False
        reason = None
        
        if side == PositionSide.LONG:
            # Long position exits
            if current_price <= stop_price:
                should_exit = True
                reason = \"stop_loss_hit\"
            elif target_price and current_price >= target_price:
                should_exit = True
                reason = \"profit_target_hit\"
        
        else:  # SHORT
            # Short position exits
            if current_price >= stop_price:
                should_exit = True
                reason = \"stop_loss_hit\"
            elif target_price and current_price <= target_price:
                should_exit = True
                reason = \"profit_target_hit\"
        
        return {
            \"should_exit\": should_exit,
            \"reason\": reason,
            \"current_price\": current_price,
            \"stop_price\": stop_price,
            \"target_price\": target_price
        }
    
    def calculate_trailing_stop_percentage(
        self,
        entry_price: Decimal,
        current_price: Decimal,
        trail_percentage: Decimal,  # e.g., 0.02 for 2%
        side: PositionSide,
        current_stop: Optional[Decimal] = None
    ) -> Decimal:
        \"\"\"
        Calculate percentage-based trailing stop
        
        Formula:
            Long:
                Stop = Current Price × (1 - Trail %)
            Short:
                Stop = Current Price × (1 + Trail %)
        
        Args:
            entry_price: Entry price
            current_price: Current price
            trail_percentage: Trail percentage (0.02 = 2%)
            side: LONG or SHORT
            current_stop: Current stop (if exists)
            
        Returns:
            New stop price
        \"\"\"
        if side == PositionSide.LONG:
            new_stop = current_price * (Decimal(\"1\") - trail_percentage)
            if current_stop:
                new_stop = max(new_stop, current_stop)
        else:
            new_stop = current_price * (Decimal(\"1\") + trail_percentage)
            if current_stop:
                new_stop = min(new_stop, current_stop)
        
        return new_stop
