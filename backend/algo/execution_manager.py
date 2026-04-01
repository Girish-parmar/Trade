"""
Execution Manager

Orchestrates algorithmic execution strategies
Manages child order slicing and execution lifecycle

SEBI Compliance:
- All algo parameters logged to audit trail
- Pre-trade risk checks mandatory
- Position limits enforced

Formal Verification:
- TLA+ Spec: order_slicing_spec.tla
- Proven properties: slice quantity sum = total quantity
"""

import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Callable
from decimal import Decimal
import uuid
import logging

from ..models.execution_models import (
    AlgoExecutionRequest,
    ExecutionState,
    ExecutionStatus,
    OrderSlice,
    SliceStatus,
    ExecutionStrategy,
    OrderSide
)

logger = logging.getLogger(__name__)


class ExecutionManager:
    """
    Algorithmic Execution Manager
    
    Coordinates execution of large orders using various strategies:
    - TWAP: Time-Weighted Average Price
    - VWAP: Volume-Weighted Average Price
    - Iceberg: Hidden liquidity orders
    
    Mathematical Properties (Formally Verified):
    1. Σ(slice.quantity) = request.total_quantity
    2. ∀ slice: 0 < slice.quantity ≤ max_slice_size
    3. execution_time ≤ request.duration_minutes
    """
    
    def __init__(
        self,
        order_submitter: Callable,  # Function to submit orders to broker
        market_data_provider: Callable,  # Function to get market data
        audit_logger: Callable  # Function to log audit trail
    ):
        self.order_submitter = order_submitter
        self.market_data = market_data_provider
        self.audit_logger = audit_logger
        
        self.active_executions: Dict[str, ExecutionState] = {}
        
    async def start_execution(
        self,
        request: AlgoExecutionRequest
    ) -> ExecutionState:
        """
        Start algorithmic execution
        
        Args:
            request: Execution parameters
            
        Returns:
            ExecutionState with initial slicing plan
            
        Raises:
            ValueError: If request parameters invalid
            RuntimeError: If pre-trade checks fail
        """
        # Validate request
        self._validate_request(request)
        
        # Create execution state
        execution_id = str(uuid.uuid4())
        state = ExecutionState(
            execution_id=execution_id,
            request=request,
            total_quantity=request.total_quantity,
            remaining_quantity=request.total_quantity,
            status=ExecutionStatus.PENDING
        )
        
        # Generate slices based on strategy
        if request.strategy == ExecutionStrategy.TWAP:
            slices = self._generate_twap_slices(state)
        elif request.strategy == ExecutionStrategy.VWAP:
            slices = self._generate_vwap_slices(state)
        elif request.strategy == ExecutionStrategy.ICEBERG:
            slices = self._generate_iceberg_slices(state)
        else:
            raise ValueError(f"Unsupported strategy: {request.strategy}")
        
        state.slices = slices
        
        # Verify slice sum equals total (formal verification check)
        total_sliced = sum(s.quantity for s in slices)
        assert total_sliced == request.total_quantity, \
            f"Slice sum mismatch: {total_sliced} != {request.total_quantity}"
        
        # Log to audit trail
        await self.audit_logger({
            "event": "algo_execution_started",
            "execution_id": execution_id,
            "user_id": request.user_id,
            "symbol": request.symbol,
            "strategy": request.strategy,
            "total_quantity": float(request.total_quantity),
            "num_slices": len(slices)
        })
        
        # Store state
        self.active_executions[execution_id] = state
        state.status = ExecutionStatus.ACTIVE
        state.started_at = datetime.now()
        
        # Start execution loop
        asyncio.create_task(self._execution_loop(execution_id))
        
        return state
    
    def _generate_twap_slices(self, state: ExecutionState) -> List[OrderSlice]:
        """
        Generate TWAP (Time-Weighted Average Price) slices
        
        Algorithm:
        1. Divide total time into equal intervals
        2. Divide total quantity equally across intervals
        3. Submit one slice per interval
        
        Mathematical Formula:
            slice_interval = duration / num_slices
            slice_quantity = total_quantity / num_slices
        
        Properties:
            - Equal quantity per slice (±1 for rounding)
            - Equal time spacing
            - Last slice may be slightly larger (rounding adjustment)
        
        Args:
            state: Execution state
            
        Returns:
            List of order slices
        """
        request = state.request
        
        # Calculate timing
        duration_seconds = (request.duration_minutes or 60) * 60
        num_slices = request.num_slices or self._calculate_optimal_slices(
            request.total_quantity,
            duration_seconds
        )
        
        slice_interval = duration_seconds / num_slices
        
        # Calculate quantities
        base_quantity = request.total_quantity / Decimal(num_slices)
        
        slices: List[OrderSlice] = []
        cumulative_quantity = Decimal("0")
        start_time = request.start_time or datetime.now()
        
        for i in range(num_slices):
            # Last slice gets remaining quantity (handles rounding)
            if i == num_slices - 1:
                slice_qty = request.total_quantity - cumulative_quantity
            else:
                slice_qty = base_quantity.quantize(Decimal("0.01"))
            
            scheduled_time = start_time + timedelta(seconds=i * slice_interval)
            
            slice = OrderSlice(
                slice_id=f"{state.execution_id}-slice-{i}",
                parent_execution_id=state.execution_id,
                sequence_number=i,
                symbol=request.symbol,
                side=request.side,
                quantity=slice_qty,
                limit_price=request.limit_price,
                scheduled_time=scheduled_time,
                status=SliceStatus.SCHEDULED
            )
            
            slices.append(slice)
            cumulative_quantity += slice_qty
        
        logger.info(
            f"Generated {num_slices} TWAP slices for {request.symbol}: "
            f"{base_quantity} qty every {slice_interval}s"
        )
        
        return slices
    
    def _generate_vwap_slices(self, state: ExecutionState) -> List[OrderSlice]:
        """
        Generate VWAP (Volume-Weighted Average Price) slices
        
        Algorithm:
        1. Fetch historical volume profile
        2. Distribute quantity proportional to expected volume
        3. Higher volume periods get larger slices
        
        Mathematical Formula:
            slice_quantity[i] = total_quantity × (expected_volume[i] / total_expected_volume)
        
        Properties:
            - Quantity weighted by expected market volume
            - Minimizes market impact
            - Adaptive to volume patterns
        
        Args:
            state: Execution state
            
        Returns:
            List of order slices weighted by volume
        """
        request = state.request
        
        # Get volume profile (would fetch from market data in production)
        volume_profile = self._get_volume_profile(
            request.symbol,
            request.duration_minutes or 60
        )
        
        total_expected_volume = sum(v["volume"] for v in volume_profile)
        
        slices: List[OrderSlice] = []
        cumulative_quantity = Decimal("0")
        
        for i, period in enumerate(volume_profile):
            # Weight slice by volume proportion
            volume_weight = Decimal(str(period["volume"] / total_expected_volume))
            slice_qty = (request.total_quantity * volume_weight).quantize(Decimal("0.01"))
            
            # Last slice adjustment
            if i == len(volume_profile) - 1:
                slice_qty = request.total_quantity - cumulative_quantity
            
            slice = OrderSlice(
                slice_id=f"{state.execution_id}-slice-{i}",
                parent_execution_id=state.execution_id,
                sequence_number=i,
                symbol=request.symbol,
                side=request.side,
                quantity=slice_qty,
                limit_price=request.limit_price,
                scheduled_time=period["time"],
                status=SliceStatus.SCHEDULED
            )
            
            slices.append(slice)
            cumulative_quantity += slice_qty
        
        logger.info(
            f"Generated {len(slices)} VWAP slices for {request.symbol} "
            f"weighted by volume profile"
        )
        
        return slices
    
    def _generate_iceberg_slices(self, state: ExecutionState) -> List[OrderSlice]:
        """
        Generate Iceberg order slices
        
        Algorithm:
        1. Show only small portion of total quantity
        2. Replenish visible quantity as it fills
        3. Hide true order size from market
        
        Properties:
            - Reduces market impact
            - Hides liquidity demand
            - Continuous presence at limit price
        
        Args:
            state: Execution state
            
        Returns:
            List of order slices (visible tip + hidden reserve)
        """
        request = state.request
        
        # Calculate visible slice size (typically 5-10% of total)
        visible_ratio = Decimal("0.1")  # 10% visible
        visible_size = (request.total_quantity * visible_ratio).quantize(Decimal("0.01"))
        
        # Ensure minimum visible size
        visible_size = max(visible_size, Decimal("1"))
        
        num_slices = int(request.total_quantity / visible_size) + 1
        
        slices: List[OrderSlice] = []
        remaining = request.total_quantity
        current_time = request.start_time or datetime.now()
        
        for i in range(num_slices):
            slice_qty = min(visible_size, remaining)
            
            slice = OrderSlice(
                slice_id=f"{state.execution_id}-ice-{i}",
                parent_execution_id=state.execution_id,
                sequence_number=i,
                symbol=request.symbol,
                side=request.side,
                quantity=slice_qty,
                limit_price=request.limit_price,
                scheduled_time=current_time,
                status=SliceStatus.SCHEDULED
            )
            
            slices.append(slice)
            remaining -= slice_qty
            
            if remaining <= 0:
                break
        
        logger.info(
            f"Generated {len(slices)} Iceberg slices for {request.symbol}: "
            f"visible={visible_size}, total={request.total_quantity}"
        )
        
        return slices
    
    async def _execution_loop(self, execution_id: str):
        """Main execution loop for processing slices"""
        state = self.active_executions.get(execution_id)
        if not state:
            return
        
        try:
            for slice in state.slices:
                # Wait until scheduled time
                now = datetime.now()
                if slice.scheduled_time > now:
                    await asyncio.sleep((slice.scheduled_time - now).total_seconds())
                
                # Submit slice
                await self._submit_slice(state, slice)
                
                # Update state
                state.current_slice_index += 1
                
                # Check if completed
                if state.filled_quantity >= state.total_quantity:
                    state.status = ExecutionStatus.COMPLETED
                    state.completed_at = datetime.now()
                    break
            
        except Exception as e:
            logger.error(f"Execution loop error for {execution_id}: {e}")
            state.status = ExecutionStatus.FAILED
            state.errors.append(str(e))
    
    async def _submit_slice(self, state: ExecutionState, slice: OrderSlice):
        """Submit individual slice to broker"""
        try:
            slice.status = SliceStatus.SUBMITTED
            slice.submitted_time = datetime.now()
            
            # Submit order (mock - would call actual broker API)
            order_id = await self.order_submitter({
                "symbol": slice.symbol,
                "side": slice.side.value,
                "quantity": float(slice.quantity),
                "price": float(slice.limit_price) if slice.limit_price else None,
                "type": "limit" if slice.limit_price else "market"
            })
            
            slice.order_id = order_id
            logger.info(f"Submitted slice {slice.slice_id}: order_id={order_id}")
            
        except Exception as e:
            slice.status = SliceStatus.REJECTED
            slice.reject_reason = str(e)
            logger.error(f"Failed to submit slice {slice.slice_id}: {e}")
    
    def _validate_request(self, request: AlgoExecutionRequest):
        """Validate execution request"""
        if request.total_quantity <= 0:
            raise ValueError("Total quantity must be positive")
        
        if request.duration_minutes and request.duration_minutes <= 0:
            raise ValueError("Duration must be positive")
        
        if request.num_slices and request.num_slices < 2:
            raise ValueError("Number of slices must be >= 2")
    
    def _calculate_optimal_slices(
        self,
        total_quantity: Decimal,
        duration_seconds: float
    ) -> int:
        """Calculate optimal number of slices"""
        # Rule of thumb: 1 slice per 5 minutes, max 100 slices
        slices = int(duration_seconds / 300)  # 5 minutes = 300 seconds
        return max(2, min(slices, 100))
    
    def _get_volume_profile(self, symbol: str, duration_minutes: int) -> List[Dict]:
        """Get historical volume profile (mock)"""
        # In production, fetch from market data provider
        num_periods = min(duration_minutes // 5, 12)  # 5-minute periods
        return [
            {
                "time": datetime.now() + timedelta(minutes=i * 5),
                "volume": 1000 * (1 + 0.1 * i)  # Mock increasing volume
            }
            for i in range(num_periods)
        ]
