//
//  CriticalAlertView.swift
//  TradeProWatch
//
//  Critical trading alert display for Apple Watch
//  SEBI Compliance: Real-time alert delivery for circuit breakers and stoploss
//

import SwiftUI
import WatchKit

/// Alert severity levels
enum AlertSeverity: String {
    case critical = "CRITICAL"
    case warning = "WARNING"
    case info = "INFO"
    case success = "SUCCESS"
    
    var color: Color {
        switch self {
        case .critical: return .red
        case .warning: return .orange
        case .info: return .blue
        case .success: return .green
        }
    }
    
    var icon: String {
        switch self {
        case .critical: return "exclamationmark.triangle.fill"
        case .warning: return "exclamationmark.circle.fill"
        case .info: return "info.circle.fill"
        case .success: return "checkmark.circle.fill"
        }
    }
}

/// Alert types for trading events
enum AlertType: String {
    case stoplossHit = "STOPLOSS_HIT"
    case targetHit = "TARGET_HIT"
    case circuitBreaker = "CIRCUIT_BREAKER"
    case marginCall = "MARGIN_CALL"
    case orderFilled = "ORDER_FILLED"
    case orderRejected = "ORDER_REJECTED"
    case kycExpiring = "KYC_EXPIRING"
    
    var hapticPattern: HapticPattern {
        switch self {
        case .stoplossHit:
            return .stoplossAlert
        case .targetHit:
            return .targetAlert
        case .circuitBreaker:
            return .emergencyAlert
        case .marginCall:
            return .urgentAlert
        case .orderFilled:
            return .successAlert
        case .orderRejected:
            return .errorAlert
        case .kycExpiring:
            return .warningAlert
        }
    }
}

/// Trading alert model
struct TradingAlert: Identifiable {
    let id: String
    let type: AlertType
    let severity: AlertSeverity
    let title: String
    let message: String
    let symbol: String?
    let price: Double?
    let quantity: Int?
    let timestamp: Date
    let actionable: Bool
    let actions: [AlertAction]?
    
    struct AlertAction {
        let id: String
        let label: String
        let type: ActionType
        
        enum ActionType {
            case closePosition
            case modifyOrder
            case viewDetails
            case dismiss
        }
    }
}

/// Critical Alert View for Apple Watch
struct CriticalAlertView: View {
    let alert: TradingAlert
    let onAction: (TradingAlert.AlertAction) -> Void
    let onDismiss: () -> Void
    
    @State private var isExpanded = false
    @State private var hasTriggeredHaptic = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                // Alert Header
                alertHeader
                
                // Alert Icon
                alertIcon
                
                // Alert Details
                alertDetails
                
                // Trading Information (if available)
                if let symbol = alert.symbol {
                    tradingInfo(symbol: symbol)
                }
                
                // Action Buttons
                if alert.actionable, let actions = alert.actions {
                    actionButtons(actions: actions)
                }
                
                // Dismiss Button
                dismissButton
            }
            .padding()
        }
        .background(alert.severity.color.opacity(0.1))
        .onAppear {
            triggerHapticFeedback()
        }
    }
    
    // MARK: - View Components
    
    private var alertHeader: some View {
        VStack(spacing: 4) {
            Text(alert.severity.rawValue)
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundColor(alert.severity.color)
            
            Text(alert.title)
                .font(.headline)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)
        }
    }
    
    private var alertIcon: some View {
        Image(systemName: alert.severity.icon)
            .font(.system(size: 50))
            .foregroundColor(alert.severity.color)
            .padding(.vertical, 8)
    }
    
    private var alertDetails: some View {
        VStack(spacing: 8) {
            Text(alert.message)
                .font(.footnote)
                .multilineTextAlignment(.center)
            
            Text(formatTimestamp(alert.timestamp))
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }
    
    private func tradingInfo(symbol: String) -> some View {
        VStack(spacing: 6) {
            Divider()
            
            HStack {
                Text("Symbol:")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text(symbol)
                    .font(.caption)
                    .fontWeight(.semibold)
            }
            
            if let price = alert.price {
                HStack {
                    Text("Price:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("₹\(String(format: "%.2f", price))")
                        .font(.caption)
                        .fontWeight(.semibold)
                }
            }
            
            if let quantity = alert.quantity {
                HStack {
                    Text("Quantity:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("\(quantity)")
                        .font(.caption)
                        .fontWeight(.semibold)
                }
            }
        }
        .padding(.vertical, 8)
    }
    
    private func actionButtons(actions: [TradingAlert.AlertAction]) -> some View {
        VStack(spacing: 8) {
            ForEach(actions, id: \.id) { action in
                Button(action: {
                    onAction(action)
                }) {
                    HStack {
                        Image(systemName: iconForAction(action.type))
                        Text(action.label)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                }
                .buttonStyle(.borderedProminent)
                .tint(colorForAction(action.type))
            }
        }
    }
    
    private var dismissButton: some View {
        Button(action: onDismiss) {
            Text("Dismiss")
                .frame(maxWidth: .infinity)
        }
        .buttonStyle(.bordered)
        .padding(.top, 8)
    }
    
    // MARK: - Helper Methods
    
    private func triggerHapticFeedback() {
        guard !hasTriggeredHaptic else { return }
        hasTriggeredHaptic = true
        
        HapticFeedbackEngine.shared.playPattern(alert.type.hapticPattern)
    }
    
    private func formatTimestamp(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        formatter.dateStyle = .none
        return formatter.string(from: date)
    }
    
    private func iconForAction(_ type: TradingAlert.AlertAction.ActionType) -> String {
        switch type {
        case .closePosition: return "xmark.circle"
        case .modifyOrder: return "pencil.circle"
        case .viewDetails: return "info.circle"
        case .dismiss: return "checkmark.circle"
        }
    }
    
    private func colorForAction(_ type: TradingAlert.AlertAction.ActionType) -> Color {
        switch type {
        case .closePosition: return .red
        case .modifyOrder: return .orange
        case .viewDetails: return .blue
        case .dismiss: return .gray
        }
    }
}

// MARK: - Preview

#if DEBUG
struct CriticalAlertView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Stoploss Hit Alert
            CriticalAlertView(
                alert: TradingAlert(
                    id: "alert-1",
                    type: .stoplossHit,
                    severity: .critical,
                    title: "Stop Loss Hit",
                    message: "Your stoploss order for RELIANCE has been triggered.",
                    symbol: "RELIANCE",
                    price: 2450.00,
                    quantity: 100,
                    timestamp: Date(),
                    actionable: true,
                    actions: [
                        TradingAlert.AlertAction(
                            id: "action-1",
                            label: "View Position",
                            type: .viewDetails
                        )
                    ]
                ),
                onAction: { _ in },
                onDismiss: {}
            )
            .previewDisplayName("Stoploss Alert")
            
            // Target Hit Alert
            CriticalAlertView(
                alert: TradingAlert(
                    id: "alert-2",
                    type: .targetHit,
                    severity: .success,
                    title: "Target Achieved! 🎯",
                    message: "Your target price for TCS has been reached.",
                    symbol: "TCS",
                    price: 3650.00,
                    quantity: 50,
                    timestamp: Date(),
                    actionable: true,
                    actions: [
                        TradingAlert.AlertAction(
                            id: "action-1",
                            label: "Close Position",
                            type: .closePosition
                        ),
                        TradingAlert.AlertAction(
                            id: "action-2",
                            label: "Hold",
                            type: .dismiss
                        )
                    ]
                ),
                onAction: { _ in },
                onDismiss: {}
            )
            .previewDisplayName("Target Alert")
        }
    }
}
#endif
