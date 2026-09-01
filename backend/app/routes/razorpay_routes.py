import uuid
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Header, Request
from app.config import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
from app.models import WebhookSimulateRequest
from app.database import get_db_connection
from agent.graph import RecoveryAgent

router = APIRouter(prefix="/api/razorpay", tags=["razorpay"])

@router.get("/config")
def get_razorpay_config():
    """
    Returns public Razorpay Test Mode configuration.
    """
    return {
        "mode": "TEST",
        "key_id": RAZORPAY_KEY_ID,
        "currency": "INR",
        "note": "Razorpay Test Mode key for simulated recovery transactions."
    }

@router.post("/create-order")
def create_test_order(amount: float = 2499.0, notes: str = "RecoverAI Test Payment"):
    """
    Simulates Razorpay Order API creation (Test Mode).
    """
    order_id = f"order_{uuid.uuid4().hex[:14]}"
    return {
        "id": order_id,
        "entity": "order",
        "amount": int(amount * 100), # Amount in paise
        "amount_paid": 0,
        "amount_due": int(amount * 100),
        "currency": "INR",
        "receipt": f"rcpt_{uuid.uuid4().hex[:8]}",
        "status": "created",
        "attempts": 0,
        "notes": {"info": notes},
        "created_at": int(datetime.now().timestamp())
    }

@router.post("/webhook/simulate")
def simulate_razorpay_webhook(req: WebhookSimulateRequest):
    """
    Simulates Razorpay Webhook Event (e.g. payment.failed) and immediately triggers RecoverAI workflow.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create or fetch payment
    payment_id = req.payment_id
    cursor.execute("SELECT id FROM payments WHERE id = ?", (payment_id,))
    if not cursor.fetchone():
        # Insert new mock payment
        cursor.execute("""
            INSERT INTO payments (id, customer_id, amount, currency, status, failure_reason, payment_method, retry_count, created_at)
            VALUES (?, 'CUST-10001', ?, 'INR', 'FAILED', ?, 'UPI', 0, CURRENT_TIMESTAMP)
        """, (payment_id, req.amount, req.failure_reason))
        conn.commit()
        
    cursor.execute("""
        SELECT p.id as payment_id, p.amount, p.failure_reason, p.payment_method, p.retry_count, p.customer_id,
               c.name, c.email, c.phone, c.customer_tenure_days, c.successful_payments, c.total_payments
        FROM payments p
        JOIN customers c ON p.customer_id = c.id
        WHERE p.id = ?
    """, (payment_id,))
    
    row = cursor.fetchone()
    payment_data = dict(row)
    succ_rate = (row["successful_payments"] / row["total_payments"]) if row["total_payments"] > 0 else 0.75
    customer_data = {
        "id": row["customer_id"],
        "name": row["name"],
        "email": req.customer_email or row["email"],
        "phone": row["phone"],
        "customer_tenure_days": row["customer_tenure_days"],
        "customer_success_rate": succ_rate
    }
    
    agent = RecoveryAgent()
    agent_result = agent.run_recovery_workflow(payment_data, customer_data, db_conn=conn)
    
    conn.close()
    
    return {
        "webhook_received": True,
        "event": req.event,
        "payment_id": payment_id,
        "agent_triggered": True,
        "agent_summary": agent_result
    }
