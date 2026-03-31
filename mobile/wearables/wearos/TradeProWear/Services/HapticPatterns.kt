/*
 * HapticPatterns.kt
 * TradeProWear
 *
 * Distinct vibration patterns for different trading events
 * SEBI Compliance: Differentiated feedback for critical vs non-critical events
 */

package com.tradepro.wear.services

import android.content.Context
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

/**
 * Haptic Patterns for Trading Alerts
 */
class HapticPatternsService(private val context: Context) {
    
    private val vibrator: Vibrator by lazy {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
    }
    
    /**
     * Alert Types
     */
    enum class AlertType {
        STOPLOSS_HIT,
        TARGET_HIT,
        CIRCUIT_BREAKER,
        MARGIN_CALL,
        ORDER_FILLED,
        ORDER_REJECTED,
        WARNING,
        INFO
    }
    
    /**
     * Play haptic pattern for alert type
     */
    fun playPattern(type: AlertType) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            val effect = when (type) {
                AlertType.STOPLOSS_HIT -> stoplossPattern()
                AlertType.TARGET_HIT -> targetPattern()
                AlertType.CIRCUIT_BREAKER -> emergencyPattern()
                AlertType.MARGIN_CALL -> urgentPattern()
                AlertType.ORDER_FILLED -> successPattern()
                AlertType.ORDER_REJECTED -> errorPattern()
                AlertType.WARNING -> warningPattern()
                AlertType.INFO -> infoPattern()
            }
            
            vibrator.vibrate(effect)
        } else {
            // Fallback for older Android versions
            @Suppress("DEPRECATION")
            vibrator.vibrate(longArrayOf(0, 200, 100, 200), -1)
        }
    }
    
    /**
     * Simple click feedback
     */
    fun playClick() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            vibrator.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK))
        }
    }
    
    /**
     * Success feedback
     */
    fun playSuccess() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            vibrator.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_DOUBLE_CLICK))
        }
    }
    
    // MARK: - Pattern Definitions
    
    /**
     * Stoploss Hit Pattern
     * Three strong pulses with increasing intensity (building urgency)
     * 
     * Pattern: STRONG - pause - STRONGER - pause - STRONGEST
     * Total duration: ~1.2 seconds
     */
    private fun stoplossPattern(): VibrationEffect {
        return if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            // Timings: [delay, vibrate, pause, vibrate, pause, vibrate]
            val timings = longArrayOf(0, 150, 100, 200, 100, 250)
            // Amplitudes: [-, medium, -, strong, -, very strong]
            val amplitudes = intArrayOf(0, 180, 0, 220, 0, 255)
            
            VibrationEffect.createWaveform(timings, amplitudes, -1)
        } else {
            VibrationEffect.createOneShot(500, VibrationEffect.DEFAULT_AMPLITUDE)
        }
    }
    
    /**
     * Target Hit Pattern
     * Two celebratory pulses (success rhythm)
     * 
     * Pattern: MEDIUM - quick pause - MEDIUM
     * Total duration: ~400ms
     */
    private fun targetPattern(): VibrationEffect {
        return if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            val timings = longArrayOf(0, 150, 100, 150)
            val amplitudes = intArrayOf(0, 200, 0, 200)
            
            VibrationEffect.createWaveform(timings, amplitudes, -1)
        } else {
            VibrationEffect.createOneShot(300, VibrationEffect.DEFAULT_AMPLITUDE)
        }
    }
    
    /**
     * Emergency Pattern (Circuit Breaker)
     * Continuous strong pulses (maximum urgency)
     * 
     * Pattern: Five rapid strong pulses
     * Total duration: ~1 second
     */
    private fun emergencyPattern(): VibrationEffect {
        return if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            val timings = longArrayOf(0, 100, 80, 100, 80, 100, 80, 100, 80, 100)
            val amplitudes = intArrayOf(0, 255, 0, 255, 0, 255, 0, 255, 0, 255)
            
            VibrationEffect.createWaveform(timings, amplitudes, -1)
        } else {
            VibrationEffect.createOneShot(800, VibrationEffect.DEFAULT_AMPLITUDE)
        }
    }
    
    /**
     * Urgent Pattern (Margin Call)
     * Three rapid taps (immediate attention required)
     * 
     * Pattern: TAP-TAP-TAP (quick succession)
     * Total duration: ~500ms
     */
    private fun urgentPattern(): VibrationEffect {
        return if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            val timings = longArrayOf(0, 100, 80, 100, 80, 100)
            val amplitudes = intArrayOf(0, 220, 0, 220, 0, 220)
            
            VibrationEffect.createWaveform(timings, amplitudes, -1)
        } else {
            VibrationEffect.createOneShot(400, VibrationEffect.DEFAULT_AMPLITUDE)
        }
    }
    
    /**
     * Success Pattern (Order Filled)
     * Single strong confirmation pulse
     * 
     * Pattern: One satisfying pulse
     * Total duration: ~200ms
     */
    private fun successPattern(): VibrationEffect {
        return if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            VibrationEffect.createOneShot(200, 200)
        } else {
            VibrationEffect.createOneShot(200, VibrationEffect.DEFAULT_AMPLITUDE)
        }
    }
    
    /**
     * Error Pattern (Order Rejected)
     * Two distinct failure pulses
     * 
     * Pattern: BUZZ - pause - BUZZ
     * Total duration: ~500ms
     */
    private fun errorPattern(): VibrationEffect {
        return if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            val timings = longArrayOf(0, 150, 200, 150)
            val amplitudes = intArrayOf(0, 180, 0, 180)
            
            VibrationEffect.createWaveform(timings, amplitudes, -1)
        } else {
            VibrationEffect.createOneShot(350, VibrationEffect.DEFAULT_AMPLITUDE)
        }
    }
    
    /**
     * Warning Pattern (KYC Expiring, etc.)
     * Single moderate pulse
     * 
     * Pattern: One gentle alert
     * Total duration: ~150ms
     */
    private fun warningPattern(): VibrationEffect {
        return if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            VibrationEffect.createOneShot(150, 150)
        } else {
            VibrationEffect.createOneShot(150, VibrationEffect.DEFAULT_AMPLITUDE)
        }
    }
    
    /**
     * Info Pattern (General Notification)
     * Subtle single pulse
     * 
     * Pattern: Soft tap
     * Total duration: ~100ms
     */
    private fun infoPattern(): VibrationEffect {
        return if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            VibrationEffect.createOneShot(100, 100)
        } else {
            VibrationEffect.createOneShot(100, VibrationEffect.DEFAULT_AMPLITUDE)
        }
    }
    
    /**
     * Cancel any ongoing vibration
     */
    fun cancel() {
        vibrator.cancel()
    }
}

/**
 * Haptic Pattern Tester
 * Test all patterns in sequence (for development/debugging)
 */
class HapticPatternTester(private val service: HapticPatternsService) {
    
    suspend fun testAllPatterns() {
        val patterns = HapticPatternsService.AlertType.values()
        
        for (pattern in patterns) {
            println(\"Testing pattern: ${pattern.name}\")
            service.playPattern(pattern)
            kotlinx.coroutines.delay(2000) // Wait 2 seconds between patterns
        }
    }
}
