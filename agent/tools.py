import time
import random
import uuid
from datetime import datetime

def retry_payment(payment_id: str, amount: float) -> dict:
    """
    Executes a bounded, direct payment gateway retry.
    """
    time.sleep(0.1) # Simulate gateway latency
    
    # 85% success rate on retry for timeout/network cases
    is_success = random.random() < 0.85
    
    if is_success:
        return {
            "tool": "retry_payment",
            "status": "SUCCESS",
            "transaction_ref": f"pay_retry_{uuid.uuid4().hex[:10]}",
            "recovered_amount": amount,
            "message": f"Payment #{payment_id} retry succeeded via Razorpay gateway."
        }
    else:
        return {
            "tool": "retry_payment",
            "status": "FAILED",
            "transaction_ref": None,
            "recovered_amount": 0.0,
            "message": f"Payment #{payment_id} retry failed: Secondary bank timeout."
        }

def create_payment_link(payment_id: str, customer_email: str, amount: float, discount_pct: float = 0.0) -> dict:
    """
    Generates a smart Razorpay recovery payment link with optional instant discount.
    """
    time.sleep(0.1)
    final_amount = amount * (1.0 - (discount_pct / 100.0))
    link_id = f"plink_{uuid.uuid4().hex[:12]}"
    short_url = f"https://rzp.io/i/{link_id[:8]}"
    
    return {
        "tool": "create_payment_link",
        "status": "SUCCESS",
        "link_id": link_id,
        "short_url": short_url,
        "original_amount": amount,
        "discounted_amount": round(final_amount, 2),
        "discount_pct": discount_pct,
        "sent_to": customer_email,
        "expires_in_hours": 24,
        "message": f"Recovery payment link generated ({short_url}) and dispatched to {customer_email}."
    }

def send_notification(customer_phone: str, customer_email: str, message: str, channel: str = "SMS_AND_WHATSAPP") -> dict:
    """
    Dispatches automated SMS/WhatsApp/Email notification to the customer.
    """
    time.sleep(0.05)
    return {
        "tool": "send_notification",
        "status": "DELIVERED",
        "channel": channel,
        "recipient": customer_email or customer_phone,
        "timestamp": datetime.now().isoformat(),
        "message": f"Notification sent via {channel}."
    }

def escalate_case(case_id: str, payment_id: str, reason: str) -> dict:
    """
    Escalates case to human revenue recovery team dashboard with full context log.
    """
    time.sleep(0.05)
    return {
        "tool": "escalate_case",
        "status": "ESCALATED",
        "case_id": case_id,
        "assigned_queue": "High-Value Operations Desk",
        "reason": reason,
        "escalated_at": datetime.now().isoformat(),
        "message": f"Case #{case_id} successfully escalated to Operations Desk."
    }

def abort_case(case_id: str, reason: str) -> dict:
    """
    Aborts automated recovery for non-viable or unsafe payments.
    """
    return {
        "tool": "abort_case",
        "status": "ABORTED",
        "case_id": case_id,
        "reason": reason,
        "message": f"Recovery attempt stopped: {reason}"
    }
