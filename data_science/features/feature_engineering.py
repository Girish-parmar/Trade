"""
Feature Engineering for Trading

Technical indicators and candlestick pattern recognition
No lookahead bias - all calculations use only historical data

Indicators:
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
- Bollinger Bands
- ATR (Average True Range)
- Volume indicators

Patterns:
- Doji, Hammer, Shooting Star
- Engulfing patterns
- Morning/Evening Star
"""

import numpy as np
import pandas as pd
from typing import Optional, Dict, List, Tuple
from enum import Enum


class CandlestickPattern(str, Enum):
    """Recognized candlestick patterns"""
    DOJI = "doji"
    HAMMER = "hammer"
    SHOOTING_STAR = "shooting_star"
    BULLISH_ENGULFING = "bullish_engulfing"
    BEARISH_ENGULFING = "bearish_engulfing"
    MORNING_STAR = "morning_star"
    EVENING_STAR = "evening_star"
    THREE_WHITE_SOLDIERS = "three_white_soldiers"
    THREE_BLACK_CROWS = "three_black_crows"


class TechnicalIndicators:
    """
    Technical Indicator Calculator
    
    All calculations are vectorized using NumPy for performance
    Strictly no lookahead bias - uses only historical data
    """
    
    @staticmethod
    def rsi(
        prices: np.ndarray,
        period: int = 14
    ) -> np.ndarray:
        """
        Relative Strength Index (RSI)
        
        Mathematical Formula:
            RS = Average Gain / Average Loss
            RSI = 100 - (100 / (1 + RS))
        
        Interpretation:
            RSI > 70: Overbought (potential sell signal)
            RSI < 30: Oversold (potential buy signal)
        
        Properties:
            - Oscillates between 0 and 100
            - Momentum indicator
            - Identifies overbought/oversold conditions
        
        Args:
            prices: Close prices array
            period: Lookback period (default 14)
            
        Returns:
            RSI values array
        """
        deltas = np.diff(prices)
        
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        
        # Use Wilder's smoothing (EMA-like)
        avg_gain = np.zeros_like(prices)
        avg_loss = np.zeros_like(prices)
        
        # First average is simple mean
        avg_gain[period] = np.mean(gains[:period])
        avg_loss[period] = np.mean(losses[:period])
        
        # Subsequent values use exponential smoothing
        for i in range(period + 1, len(prices)):
            avg_gain[i] = (avg_gain[i-1] * (period - 1) + gains[i-1]) / period
            avg_loss[i] = (avg_loss[i-1] * (period - 1) + losses[i-1]) / period
        
        # Calculate RS and RSI
        rs = np.divide(avg_gain, avg_loss, out=np.zeros_like(avg_gain), where=avg_loss!=0)
        rsi = 100 - (100 / (1 + rs))
        
        # Set NaN for initial period
        rsi[:period] = np.nan
        
        return rsi
    
    @staticmethod
    def macd(
        prices: np.ndarray,
        fast_period: int = 12,
        slow_period: int = 26,
        signal_period: int = 9
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        MACD (Moving Average Convergence Divergence)
        
        Mathematical Formula:
            MACD Line = EMA(12) - EMA(26)
            Signal Line = EMA(MACD, 9)
            Histogram = MACD Line - Signal Line
        
        Interpretation:
            MACD > Signal: Bullish
            MACD < Signal: Bearish
            Histogram increasing: Momentum strengthening
        
        Args:
            prices: Close prices array
            fast_period: Fast EMA period (12)
            slow_period: Slow EMA period (26)
            signal_period: Signal line period (9)
            
        Returns:
            (macd_line, signal_line, histogram)
        """
        ema_fast = TechnicalIndicators._ema(prices, fast_period)
        ema_slow = TechnicalIndicators._ema(prices, slow_period)
        
        macd_line = ema_fast - ema_slow
        signal_line = TechnicalIndicators._ema(macd_line, signal_period)
        histogram = macd_line - signal_line
        
        return macd_line, signal_line, histogram
    
    @staticmethod
    def bollinger_bands(
        prices: np.ndarray,
        period: int = 20,
        num_std: float = 2.0
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Bollinger Bands
        
        Mathematical Formula:
            Middle Band = SMA(period)
            Upper Band = Middle Band + (std × num_std)
            Lower Band = Middle Band - (std × num_std)
        
        Interpretation:
            Price > Upper Band: Overbought
            Price < Lower Band: Oversold
            Bands squeezing: Volatility decreasing (breakout coming)
        
        Args:
            prices: Close prices
            period: Moving average period (20)
            num_std: Number of standard deviations (2.0)
            
        Returns:
            (upper_band, middle_band, lower_band)
        """
        middle = TechnicalIndicators._sma(prices, period)
        std = TechnicalIndicators._rolling_std(prices, period)
        
        upper = middle + (num_std * std)
        lower = middle - (num_std * std)
        
        return upper, middle, lower
    
    @staticmethod
    def atr(
        high: np.ndarray,
        low: np.ndarray,
        close: np.ndarray,
        period: int = 14
    ) -> np.ndarray:
        """
        Average True Range (ATR)
        
        Mathematical Formula:
            True Range = max(
                High - Low,
                |High - Previous Close|,
                |Low - Previous Close|
            )
            ATR = EMA(True Range, period)
        
        Interpretation:
            Higher ATR = Higher volatility
            Lower ATR = Lower volatility
            Used for stop loss distance
        
        Args:
            high: High prices
            low: Low prices
            close: Close prices
            period: ATR period (14)
            
        Returns:
            ATR values
        """
        # True Range calculation
        tr1 = high - low
        tr2 = np.abs(high - np.roll(close, 1))
        tr3 = np.abs(low - np.roll(close, 1))
        
        tr = np.maximum(tr1, np.maximum(tr2, tr3))
        tr[0] = tr1[0]  # First value uses only high-low
        
        # EMA of True Range
        atr = TechnicalIndicators._ema(tr, period)
        
        return atr
    
    @staticmethod
    def obv(
        close: np.ndarray,
        volume: np.ndarray
    ) -> np.ndarray:
        """
        On-Balance Volume (OBV)
        
        Mathematical Formula:
            If Close > Previous Close: OBV = OBV + Volume
            If Close < Previous Close: OBV = OBV - Volume
            If Close = Previous Close: OBV = OBV
        
        Interpretation:
            OBV rising with price: Confirming uptrend
            OBV falling with price: Confirming downtrend
            OBV diverging from price: Warning signal
        
        Args:
            close: Close prices
            volume: Volume
            
        Returns:
            OBV values
        """
        price_change = np.diff(close, prepend=close[0])
        
        obv = np.zeros_like(volume, dtype=float)
        obv[0] = volume[0]
        
        for i in range(1, len(volume)):
            if price_change[i] > 0:
                obv[i] = obv[i-1] + volume[i]
            elif price_change[i] < 0:
                obv[i] = obv[i-1] - volume[i]
            else:
                obv[i] = obv[i-1]
        
        return obv
    
    @staticmethod
    def _sma(prices: np.ndarray, period: int) -> np.ndarray:
        """Simple Moving Average"""
        sma = np.full_like(prices, np.nan)
        for i in range(period - 1, len(prices)):
            sma[i] = np.mean(prices[i - period + 1:i + 1])
        return sma
    
    @staticmethod
    def _ema(prices: np.ndarray, period: int) -> np.ndarray:
        """Exponential Moving Average"""
        ema = np.zeros_like(prices)
        ema[0] = prices[0]
        
        multiplier = 2 / (period + 1)
        
        for i in range(1, len(prices)):
            ema[i] = (prices[i] * multiplier) + (ema[i-1] * (1 - multiplier))
        
        return ema
    
    @staticmethod
    def _rolling_std(prices: np.ndarray, period: int) -> np.ndarray:
        """Rolling Standard Deviation"""
        std = np.full_like(prices, np.nan)
        for i in range(period - 1, len(prices)):
            std[i] = np.std(prices[i - period + 1:i + 1])
        return std


class CandlestickPatternRecognizer:
    """
    Candlestick Pattern Recognition
    
    Detects classical Japanese candlestick patterns
    Used for reversal and continuation signals
    """
    
    @staticmethod
    def is_doji(
        open_price: float,
        close: float,
        high: float,
        low: float,
        threshold: float = 0.1
    ) -> bool:
        """
        Doji Pattern
        
        Characteristics:
            - Open ≈ Close (within threshold)
            - Indicates indecision
            - Potential reversal signal
        
        Formula:
            |Close - Open| / (High - Low) < threshold
        """
        body_size = abs(close - open_price)
        total_range = high - low
        
        if total_range == 0:
            return False
        
        return (body_size / total_range) < threshold
    
    @staticmethod
    def is_hammer(
        open_price: float,
        close: float,
        high: float,
        low: float
    ) -> bool:
        """
        Hammer Pattern
        
        Characteristics:
            - Small body at top of range
            - Long lower shadow (2x body)
            - Little/no upper shadow
            - Bullish reversal at bottom
        
        Formula:
            Lower Shadow ≥ 2 × Body
            Upper Shadow ≤ 0.5 × Body
        """
        body = abs(close - open_price)
        lower_shadow = min(open_price, close) - low
        upper_shadow = high - max(open_price, close)
        
        if body == 0:
            return False
        
        return (lower_shadow >= 2 * body and
                upper_shadow <= 0.5 * body)
    
    @staticmethod
    def is_engulfing(
        open1: float, close1: float,
        open2: float, close2: float
    ) -> Optional[str]:
        """
        Engulfing Pattern
        
        Bullish Engulfing:
            - Previous candle bearish (close < open)
            - Current candle bullish (close > open)
            - Current body engulfs previous body
        
        Bearish Engulfing:
            - Previous candle bullish
            - Current candle bearish
            - Current body engulfs previous body
        
        Returns:
            'bullish' | 'bearish' | None
        """
        prev_bullish = close1 > open1
        curr_bullish = close2 > open2
        
        # Bullish Engulfing
        if not prev_bullish and curr_bullish:
            if close2 > open1 and open2 < close1:
                return 'bullish'
        
        # Bearish Engulfing
        if prev_bullish and not curr_bullish:
            if open2 > close1 and close2 < open1:
                return 'bearish'
        
        return None
    
    @staticmethod
    def detect_patterns(
        df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Detect all patterns in DataFrame
        
        Args:
            df: DataFrame with OHLC columns
            
        Returns:
            DataFrame with pattern columns added
        """
        df = df.copy()
        
        # Doji
        df['doji'] = df.apply(
            lambda row: CandlestickPatternRecognizer.is_doji(
                row['open'], row['close'], row['high'], row['low']
            ),
            axis=1
        )
        
        # Hammer
        df['hammer'] = df.apply(
            lambda row: CandlestickPatternRecognizer.is_hammer(
                row['open'], row['close'], row['high'], row['low']
            ),
            axis=1
        )
        
        # Engulfing (requires previous candle)
        engulfing = []
        for i in range(len(df)):
            if i == 0:
                engulfing.append(None)
            else:
                pattern = CandlestickPatternRecognizer.is_engulfing(
                    df.iloc[i-1]['open'], df.iloc[i-1]['close'],
                    df.iloc[i]['open'], df.iloc[i]['close']
                )
                engulfing.append(pattern)
        
        df['engulfing'] = engulfing
        
        return df


def create_feature_set(
    df: pd.DataFrame
) -> pd.DataFrame:
    """
    Create complete feature set for ML models
    
    Features Generated:
    1. Technical Indicators (RSI, MACD, Bollinger, ATR, OBV)
    2. Price-based features (returns, volatility)
    3. Candlestick patterns
    4. Volume features
    
    Args:
        df: OHLCV DataFrame
        
    Returns:
        DataFrame with all features
    """
    df = df.copy()
    
    # Technical Indicators
    df['rsi'] = TechnicalIndicators.rsi(df['close'].values)
    
    macd_line, signal_line, histogram = TechnicalIndicators.macd(df['close'].values)
    df['macd'] = macd_line
    df['macd_signal'] = signal_line
    df['macd_hist'] = histogram
    
    upper, middle, lower = TechnicalIndicators.bollinger_bands(df['close'].values)
    df['bb_upper'] = upper
    df['bb_middle'] = middle
    df['bb_lower'] = lower
    df['bb_width'] = (upper - lower) / middle  # Normalized width
    
    df['atr'] = TechnicalIndicators.atr(
        df['high'].values,
        df['low'].values,
        df['close'].values
    )
    
    df['obv'] = TechnicalIndicators.obv(df['close'].values, df['volume'].values)
    
    # Price-based features
    df['returns'] = df['close'].pct_change()
    df['log_returns'] = np.log(df['close'] / df['close'].shift(1))
    df['volatility'] = df['returns'].rolling(20).std()
    
    # Moving averages
    df['sma_20'] = df['close'].rolling(20).mean()
    df['sma_50'] = df['close'].rolling(50).mean()
    df['ema_12'] = TechnicalIndicators._ema(df['close'].values, 12)
    
    # Volume features
    df['volume_sma'] = df['volume'].rolling(20).mean()
    df['volume_ratio'] = df['volume'] / df['volume_sma']
    
    # Candlestick patterns
    df = CandlestickPatternRecognizer.detect_patterns(df)
    
    return df
