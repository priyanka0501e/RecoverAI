from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class PaymentDetail(BaseModel):
    id: str
    customer_id: str
    customer_name: str
    customer_email: str
    amount: float
    currency: str = "INR"
    status: str
    failure_reason: str
    payment_method: str
    retry_count: int
    created_at: str
    recovery_probability: Optional[float] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    recommended_action: Optional[str] = None

class GuardrailUpdate(BaseModel):
    MAX_RETRIES: Optional[int] = 2
    HIGH_VALUE_THRESHOLD: Optional[float] = 25000.0
    MAX_AUTOMATIC_ACTION: Optional[float] = 50000.0
    MAX_DISCOUNT_PERCENT: Optional[float] = 10.0
    AGENT_SPEND_LIMIT: Optional[float] = 5000.0
    AUTO_RECOVERY_ENABLED: Optional[bool] = True

class TriggerRecoveryRequest(BaseModel):
    payment_id: str
    force_action: Optional[str] = None

class WebhookSimulateRequest(BaseModel):
    event: str = "payment.failed"
    payment_id: str
    amount: float = 2499.0
    failure_reason: str = "BANK_TIMEOUT"
    customer_email: str = "customer@example.com"
