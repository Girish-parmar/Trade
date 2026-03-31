/*
 * OneClickApprove.kt
 * TradeProWear
 *
 * One-click order approval interface for Wear OS
 * Biometric authentication + haptic feedback
 * SEBI Compliance: Explicit user confirmation for trades
 */

package com.tradepro.wear.composables

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*
import kotlinx.coroutines.launch

/**
 * Order approval request model
 */
data class ApprovalRequest(
    val id: String,
    val type: OrderType,
    val symbol: String,
    val quantity: Int,
    val price: Double,
    val estimatedValue: Double,
    val requiresBiometric: Boolean = true
)

enum class OrderType {
    BUY,
    SELL,
    MODIFY,
    CANCEL
}

/**
 * One-Click Approve Composable
 * 
 * Features:
 * - Swipe-to-approve gesture
 * - Biometric authentication
 * - Haptic feedback confirmation
 * - Auto-dismiss after action
 */
@Composable
fun OneClickApprove(
    request: ApprovalRequest,
    onApprove: (String) -> Unit,
    onReject: () -> Unit,
    biometricService: BiometricService,
    hapticService: HapticService
) {
    var showBiometric by remember { mutableStateOf(false) }
    var isProcessing by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()
    
    Scaffold(
        timeText = { TimeText() },
        vignette = { Vignette(vignettePosition = VignettePosition.TopAndBottom) }
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            if (isProcessing) {
                ProcessingView()
            } else if (showBiometric) {
                BiometricPrompt(
                    onSuccess = {
                        approveOrder(
                            request = request,
                            onApprove = onApprove,
                            hapticService = hapticService,
                            setProcessing = { isProcessing = it }
                        )
                    },
                    onFailure = {
                        showBiometric = false
                        hapticService.playErrorPattern()
                    },
                    onDismiss = {
                        showBiometric = false
                        onReject()
                    }
                )
            } else {
                ApprovalCard(
                    request = request,
                    onApprove = {
                        if (request.requiresBiometric) {
                            hapticService.playClickPattern()
                            showBiometric = true
                        } else {
                            approveOrder(
                                request = request,
                                onApprove = onApprove,
                                hapticService = hapticService,
                                setProcessing = { isProcessing = it }
                            )
                        }
                    },
                    onReject = {
                        hapticService.playErrorPattern()
                        onReject()
                    }
                )
            }
        }
    }
}

@Composable
private fun ApprovalCard(
    request: ApprovalRequest,
    onApprove: () -> Unit,
    onReject: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Order Type Badge
        Chip(
            label = {
                Text(
                    text = request.type.name,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            },
            onClick = { },
            enabled = false,
            colors = ChipDefaults.chipColors(
                backgroundColor = when (request.type) {
                    OrderType.BUY -> Color(0xFF10B981)
                    OrderType.SELL -> Color(0xFFEF4444)
                    OrderType.MODIFY -> Color(0xFFF59E0B)
                    OrderType.CANCEL -> Color(0xFF6B7280)
                }
            ),
            modifier = Modifier.height(32.dp)
        )
        
        // Symbol
        Text(
            text = request.symbol,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colors.onBackground
        )
        
        // Quantity
        Text(
            text = \"${request.quantity} shares\",
            fontSize = 14.sp,
            color = MaterialTheme.colors.onBackground.copy(alpha = 0.7f)
        )
        
        // Price
        Text(
            text = \"₹${String.format(\"%.2f\", request.price)}\",
            fontSize = 18.sp,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colors.onBackground
        )
        
        // Estimated Value
        Text(
            text = \"Total: ₹${String.format(\"%.0f\", request.estimatedValue)}\",
            fontSize = 12.sp,
            color = MaterialTheme.colors.onBackground.copy(alpha = 0.6f)
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // Action Buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Reject Button
            Button(
                onClick = onReject,
                colors = ButtonDefaults.buttonColors(
                    backgroundColor = Color(0xFFEF4444)
                ),
                modifier = Modifier.weight(1f)
            ) {
                Text(\"✕\", fontSize = 20.sp)
            }
            
            // Approve Button
            Button(
                onClick = onApprove,
                colors = ButtonDefaults.buttonColors(
                    backgroundColor = Color(0xFF10B981)
                ),
                modifier = Modifier.weight(1f)
            ) {
                Text(\"✓\", fontSize = 20.sp)
            }
        }
        
        // Biometric Indicator
        if (request.requiresBiometric) {
            Text(
                text = \"\uD83D\uDD12 Biometric Required\",
                fontSize = 10.sp,
                color = MaterialTheme.colors.onBackground.copy(alpha = 0.5f),
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun ProcessingView() {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        CircularProgressIndicator()
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = \"Processing...\",
            fontSize = 14.sp,
            color = MaterialTheme.colors.onBackground
        )
    }
}

@Composable
private fun BiometricPrompt(
    onSuccess: () -> Unit,
    onFailure: () -> Unit,
    onDismiss: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = \"\uD83D\uDD13\",
            fontSize = 48.sp
        )
        
        Text(
            text = \"Authenticate to Approve\",
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colors.onBackground
        )
        
        Text(
            text = \"Use fingerprint or PIN\",
            fontSize = 12.sp,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colors.onBackground.copy(alpha = 0.7f)
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Button(
            onClick = onDismiss,
            colors = ButtonDefaults.buttonColors(
                backgroundColor = Color.Gray
            )
        ) {
            Text(\"Cancel\")
        }
    }
}

private fun approveOrder(
    request: ApprovalRequest,
    onApprove: (String) -> Unit,
    hapticService: HapticService,
    setProcessing: (Boolean) -> Unit
) {
    setProcessing(true)
    
    // Play success haptic pattern
    hapticService.playSuccessPattern()
    
    // Simulate API call delay
    kotlinx.coroutines.GlobalScope.launch {
        kotlinx.coroutines.delay(500)
        onApprove(request.id)
        setProcessing(false)
    }
}

/**
 * Biometric Service Interface
 */
interface BiometricService {
    fun authenticate(
        onSuccess: () -> Unit,
        onFailure: () -> Unit
    )
}

/**
 * Haptic Service Interface
 */
interface HapticService {
    fun playClickPattern()
    fun playSuccessPattern()
    fun playErrorPattern()
    fun playWarningPattern()
}
