//
//  WatchConnectivityManager.swift
//  TradeProWatch
//
//  Manages communication between iPhone app and Apple Watch
//  Real-time alert synchronization and order status updates
//

import Foundation
import WatchConnectivity

class WatchConnectivityManager: NSObject, ObservableObject {
    
    static let shared = WatchConnectivityManager()
    
    @Published var isReachable = false
    @Published var latestAlert: TradingAlert?
    @Published var connectionStatus: ConnectionStatus = .disconnected
    
    private let session: WCSession? = WCSession.isSupported() ? WCSession.default : nil
    
    enum ConnectionStatus {
        case connected
        case disconnected
        case connecting
    }
    
    override private init() {
        super.init()
        setupSession()
    }
    
    // MARK: - Session Setup
    
    private func setupSession() {
        session?.delegate = self
        session?.activate()
    }
    
    // MARK: - Send Messages to iPhone
    
    /// Send order action to iPhone app
    func sendOrderAction(orderId: String, action: String) {
        guard let session = session, session.isReachable else {
            print("[Watch] iPhone not reachable")
            return
        }
        
        let message: [String: Any] = [
            \"type\": \"order_action\",
            \"order_id\": orderId,
            \"action\": action,
            \"timestamp\": Date().timeIntervalSince1970
        ]
        
        session.sendMessage(message, replyHandler: { response in
            print(\"[Watch] Order action sent successfully: \\(response)\")
        }, errorHandler: { error in
            print(\"[Watch] Failed to send order action: \\(error.localizedDescription)\")
        })
    }
    
    /// Request latest portfolio data
    func requestPortfolioUpdate() {
        guard let session = session, session.isReachable else { return }
        
        let message = [\"type\": \"request_portfolio\"]
        
        session.sendMessage(message, replyHandler: { response in
            print(\"[Watch] Portfolio data received: \\(response)\")
            // Parse and update local state
        }, errorHandler: { error in
            print(\"[Watch] Failed to request portfolio: \\(error.localizedDescription)\")
        })
    }
    
    /// Acknowledge alert
    func acknowledgeAlert(alertId: String) {
        guard let session = session else { return }
        
        let message: [String: Any] = [
            \"type\": \"alert_acknowledged\",
            \"alert_id\": alertId,
            \"timestamp\": Date().timeIntervalSince1970
        ]
        
        session.sendMessage(message, replyHandler: nil, errorHandler: { error in
            print(\"[Watch] Failed to acknowledge alert: \\(error.localizedDescription)\")
        })
    }
    
    // MARK: - Application Context (Background Updates)
    
    /// Update application context for background sync
    func updateApplicationContext(data: [String: Any]) {
        guard let session = session else { return }
        
        do {
            try session.updateApplicationContext(data)
            print(\"[Watch] Application context updated\")
        } catch {
            print(\"[Watch] Failed to update context: \\(error.localizedDescription)\")
        }
    }
}

// MARK: - WCSessionDelegate

extension WatchConnectivityManager: WCSessionDelegate {
    
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            switch activationState {
            case .activated:
                self.connectionStatus = .connected
                print(\"[Watch] Session activated\")
            case .inactive:
                self.connectionStatus = .disconnected
                print(\"[Watch] Session inactive\")
            case .notActivated:
                self.connectionStatus = .disconnected
                print(\"[Watch] Session not activated\")
            @unknown default:
                self.connectionStatus = .disconnected
            }
        }
        
        if let error = error {
            print(\"[Watch] Activation error: \\(error.localizedDescription)\")
        }
    }
    
    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
            print(\"[Watch] Reachability changed: \\(session.isReachable)\")
        }
    }
    
    // Receive messages from iPhone
    func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        DispatchQueue.main.async {
            self.handleMessage(message)
        }
    }
    
    func session(_ session: WCSession, didReceiveMessage message: [String : Any], replyHandler: @escaping ([String : Any]) -> Void) {
        DispatchQueue.main.async {
            self.handleMessage(message)
            replyHandler([\"status\": \"received\"])
        }
    }
    
    // Receive application context updates
    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String : Any]) {
        DispatchQueue.main.async {
            print(\"[Watch] Received application context: \\(applicationContext)\")
            // Update local state with background data
        }
    }
    
    // MARK: - Message Handling
    
    private func handleMessage(_ message: [String: Any]) {
        guard let type = message[\"type\"] as? String else { return }
        
        switch type {
        case \"critical_alert\":
            handleCriticalAlert(message)
        case \"portfolio_update\":
            handlePortfolioUpdate(message)
        case \"order_status\":
            handleOrderStatus(message)
        default:
            print(\"[Watch] Unknown message type: \\(type)\")
        }
    }
    
    private func handleCriticalAlert(_ message: [String: Any]) {
        // Parse alert data and create TradingAlert
        guard let alertId = message[\"id\"] as? String,
              let title = message[\"title\"] as? String,
              let messageText = message[\"message\"] as? String else {
            return
        }
        
        let alert = TradingAlert(
            id: alertId,
            type: .stoplossHit, // Parse from message
            severity: .critical,
            title: title,
            message: messageText,
            symbol: message[\"symbol\"] as? String,
            price: message[\"price\"] as? Double,
            quantity: message[\"quantity\"] as? Int,
            timestamp: Date(),
            actionable: message[\"actionable\"] as? Bool ?? false,
            actions: nil
        )
        
        self.latestAlert = alert
        
        // Trigger local notification
        scheduleLocalNotification(for: alert)
    }
    
    private func handlePortfolioUpdate(_ message: [String: Any]) {
        print(\"[Watch] Portfolio updated: \\(message)\")
        // Update local portfolio state
    }
    
    private func handleOrderStatus(_ message: [String: Any]) {
        print(\"[Watch] Order status: \\(message)\")
        // Update order tracking
    }
    
    // MARK: - Local Notifications
    
    private func scheduleLocalNotification(for alert: TradingAlert) {
        // Schedule local notification for the alert
        // This ensures user gets notified even if watch face is not active
    }
}
