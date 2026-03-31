//
//  HapticFeedbackEngine.swift
//  TradeProWatch
//
//  Distinct haptic patterns for different trading alerts
//  SEBI Compliance: Differentiated feedback for critical vs non-critical events
//

import WatchKit
import Foundation

/// Haptic pattern definitions
enum HapticPattern {
    case stoplossAlert      // Urgent, negative event
    case targetAlert        // Positive achievement
    case emergencyAlert     // Circuit breaker, system critical
    case urgentAlert        // Margin call
    case successAlert       // Order filled
    case errorAlert         // Order rejected
    case warningAlert       // KYC expiring, etc.
    case infoAlert          // General notification
}

/// Haptic Feedback Engine
/// Provides distinct haptic patterns for different trading events
class HapticFeedbackEngine {
    
    static let shared = HapticFeedbackEngine()
    
    private init() {}
    
    /// Play haptic pattern for alert type
    func playPattern(_ pattern: HapticPattern) {
        switch pattern {
        case .stoplossAlert:
            playStoplossPattern()
        case .targetAlert:
            playTargetPattern()
        case .emergencyAlert:
            playEmergencyPattern()
        case .urgentAlert:
            playUrgentPattern()
        case .successAlert:
            playSuccessPattern()
        case .errorAlert:
            playErrorPattern()
        case .warningAlert:
            playWarningPattern()
        case .infoAlert:
            playInfoPattern()
        }
    }
    
    // MARK: - Pattern Implementations
    
    /// Stoploss Hit Pattern
    /// 3 strong clicks with increasing intensity (building urgency)
    private func playStoplossPattern() {
        WKInterfaceDevice.current().play(.notification)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            WKInterfaceDevice.current().play(.directionUp)
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
            WKInterfaceDevice.current().play(.notification)
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.9) {
            WKInterfaceDevice.current().play(.directionUp)
        }
    }
    
    /// Target Hit Pattern
    /// 2 celebratory taps (success rhythm)
    private func playTargetPattern() {
        WKInterfaceDevice.current().play(.success)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            WKInterfaceDevice.current().play(.success)
        }
    }
    
    /// Emergency Pattern (Circuit Breaker)
    /// Continuous strong pulses (maximum urgency)
    private func playEmergencyPattern() {
        for i in 0..<5 {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * 0.2) {
                WKInterfaceDevice.current().play(.notification)
            }
        }
    }
    
    /// Urgent Pattern (Margin Call)
    /// 3 rapid taps (immediate attention required)
    private func playUrgentPattern() {
        WKInterfaceDevice.current().play(.notification)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
            WKInterfaceDevice.current().play(.notification)
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            WKInterfaceDevice.current().play(.notification)
        }
    }
    
    /// Success Pattern (Order Filled)
    /// Single strong confirmation tap
    private func playSuccessPattern() {
        WKInterfaceDevice.current().play(.success)
    }
    
    /// Error Pattern (Order Rejected)
    /// 2 distinct failure taps
    private func playErrorPattern() {
        WKInterfaceDevice.current().play(.failure)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            WKInterfaceDevice.current().play(.failure)
        }
    }
    
    /// Warning Pattern (KYC Expiring)
    /// Single moderate tap
    private func playWarningPattern() {
        WKInterfaceDevice.current().play(.click)
    }
    
    /// Info Pattern (General Notification)
    /// Subtle single tap
    private func playInfoPattern() {
        WKInterfaceDevice.current().play(.click)
    }
}

/// Custom haptic feedback patterns for complex sequences
extension WKHapticType {
    /// Urgent trading alert (ascending intensity)
    static func urgentTrading() -> [WKHapticType] {
        return [.start, .click, .stop, .start, .notification, .stop]
    }
    
    /// Success celebration (rhythmic pattern)
    static func celebration() -> [WKHapticType] {
        return [.success, .click, .success]
    }
}
