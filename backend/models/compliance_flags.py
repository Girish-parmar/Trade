"""
Compliance Flag and Regulatory Reporting Models

SEBI Compliance:
- Circuit breaker triggers
- Suspicious activity flagging
- Regulatory report generation

RBI Compliance:
- Cross-border transaction monitoring
- Data localization enforcement
"""

from sqlalchemy import Column, String, DateTime, Boolean, Text, JSON, Enum as SQLEnum, ForeignKey, Numeric
from .base import Base, TimestampMixin, generate_uuid
import enum

class FlagSeverity(str, enum.Enum):
    """Compliance Flag Severity"""
    INFO = "info"  # Informational, no action required
    WARNING = "warning"  # Review recommended
    CRITICAL = "critical"  # Immediate action required
    REGULATORY = "regulatory"  # Must report to regulator

class FlagType(str, enum.Enum):
    """Types of Compliance Flags"""
    SUSPICIOUS_ACTIVITY = "suspicious_activity"  # AML alert
    CIRCUIT_BREAKER = "circuit_breaker"  # Price limit hit
    POSITION_LIMIT_BREACH = "position_limit_breach"  # SEBI position limits
    CROSS_BORDER_VIOLATION = "cross_border_violation"  # RBI data localization
    FAT_FINGER = "fat_finger"  # Abnormal order size
    RAPID_TRADING = "rapid_trading"  # Potential manipulation
    PRICE_MANIPULATION = "price_manipulation"  # Pump and dump detection
    INSIDER_TRADING_ALERT = "insider_trading_alert"  # Unusual timing
    KYC_EXPIRED = "kyc_expired"  # KYC renewal required

class ComplianceFlag(Base, TimestampMixin):
    """
    Compliance Violation Tracking
    
    SEBI Requirements:
    - Flag suspicious trading patterns
    - Circuit breaker enforcement
    - Position limit monitoring
    
    AML Requirements:
    - Transaction monitoring alerts
    - PEP transaction tracking
    - High-risk jurisdiction alerts
    
    SOC2:
    - Security incident tracking
    - Access violation logging
    """
    __tablename__ = 'compliance_flags'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    
    # Flag Details
    flag_type = Column(SQLEnum(FlagType), nullable=False, index=True)
    severity = Column(SQLEnum(FlagSeverity), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    
    # Related Entities
    user_id = Column(String(36), ForeignKey('users.id'), nullable=True, index=True)
    order_id = Column(String(36), ForeignKey('orders.id'), nullable=True, index=True)
    entity_type = Column(String(50), nullable=True)  # User, Order, Transaction, etc.
    entity_id = Column(String(36), nullable=True)
    
    # Detection Details
    detection_algorithm = Column(String(100), nullable=True)  # Which rule/algo detected this
    detection_confidence = Column(Numeric(5, 2), nullable=True)  # 0-100 confidence score
    detection_data = Column(JSON, nullable=True)  # Supporting evidence
    
    # Review and Resolution
    status = Column(String(50), default='open', nullable=False, index=True)  # open, investigating, resolved, false_positive
    assigned_to = Column(String(36), ForeignKey('users.id'), nullable=True)  # Compliance officer
    reviewed_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # Regulatory Reporting
    requires_regulatory_report = Column(Boolean, default=False, nullable=False)
    reported_to_regulator = Column(Boolean, default=False, nullable=False)
    regulator_reference = Column(String(100), nullable=True)  # SEBI case number
    reported_at = Column(DateTime, nullable=True)
    
    # Actions Taken
    auto_action_taken = Column(String(100), nullable=True)  # ORDER_BLOCKED, ACCOUNT_SUSPENDED, etc.
    manual_action_required = Column(Boolean, default=False, nullable=False)
    
    def __repr__(self):
        return f"<ComplianceFlag(id={self.id}, type={self.flag_type}, severity={self.severity}, status={self.status})>"

class RegulatoryReport(Base, TimestampMixin):
    """
    Regulatory Reporting (SEBI, RBI, Tax Authorities)
    
    SEBI Requirements:
    - Daily trading summary reports
    - Suspicious activity reports (SAR)
    - Position limit breach reports
    
    Tax Reporting:
    - Annual capital gains statement
    - TDS deduction certificates
    """
    __tablename__ = 'regulatory_reports'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    
    # Report Details
    report_type = Column(String(100), nullable=False, index=True)  # SEBI_DAILY, SAR, ANNUAL_TAX, etc.
    report_title = Column(String(255), nullable=False)
    reporting_period_start = Column(DateTime, nullable=False, index=True)
    reporting_period_end = Column(DateTime, nullable=False, index=True)
    
    # Regulator Information
    regulator = Column(String(50), nullable=False)  # SEBI, RBI, INCOME_TAX, etc.
    report_format = Column(String(50), nullable=False)  # XML, JSON, PDF, CSV
    
    # Report Data
    report_data = Column(JSON, nullable=True)  # Structured report content
    report_file_url = Column(String(500), nullable=True)  # S3/storage URL for large reports
    report_hash = Column(String(64), nullable=False)  # SHA-256 for integrity
    hsm_signature = Column(String(512), nullable=True)  # HSM signature for authenticity
    
    # Submission Status
    status = Column(String(50), default='draft', nullable=False)  # draft, submitted, acknowledged, rejected
    generated_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    
    # Regulator Response
    acknowledgment_number = Column(String(100), nullable=True)
    regulator_feedback = Column(Text, nullable=True)
    
    # Audit Trail
    generated_by = Column(String(36), ForeignKey('users.id'), nullable=True)
    approved_by = Column(String(36), ForeignKey('users.id'), nullable=True)
    
    def __repr__(self):
        return f"<RegulatoryReport(id={self.id}, type={self.report_type}, regulator={self.regulator}, status={self.status})>"
