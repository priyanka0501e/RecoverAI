import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
root_dir = os.path.dirname(backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

import sqlite3
from fastapi import APIRouter, Depends, Query, HTTPException
from app.database import get_db_connection
from ml.predict import predict_recovery_probability

router = APIRouter(prefix="/api/payments", tags=["payments"])

@router.get("")
def list_payments(
    search: str = Query(None),
    status: str = Query(None),
    limit: int = Query(50),
    offset: int = Query(0)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT p.id, p.customer_id, c.name as customer_name, c.email as customer_email,
               p.amount, p.currency, p.status, p.failure_reason, p.payment_method,
               p.retry_count, p.created_at, rc.recommended_action, rc.recovery_probability, rc.risk_score
        FROM payments p
        JOIN customers c ON p.customer_id = c.id
        LEFT JOIN recovery_cases rc ON p.id = rc.payment_id
        WHERE 1=1
    """
    params = []
    
    if search:
        query += " AND (p.id LIKE ? OR c.name LIKE ? OR c.email LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])
        
    if status and status.upper() != "ALL":
        query += " AND p.status = ?"
        params.append(status.upper())
        
    query += " ORDER BY p.created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    payments = []
    for r in rows:
        rec_prob = r["recovery_probability"]
        if rec_prob is None:
            predict_input = {
                "amount": float(r["amount"]),
                "failure_reason": r["failure_reason"],
                "payment_method": r["payment_method"],
                "retry_count": int(r["retry_count"]),
                "customer_tenure_days": 30,
                "customer_success_rate": 0.75
            }
            prob, risk, risk_lvl = predict_recovery_probability(predict_input)
            rec_prob = prob
        
        payments.append({
            "id": r["id"],
            "customer_id": r["customer_id"],
            "customer_name": r["customer_name"],
            "customer_email": r["customer_email"],
            "amount": float(r["amount"]),
            "currency": r["currency"],
            "status": r["status"],
            "failure_reason": r["failure_reason"],
            "payment_method": r["payment_method"],
            "retry_count": r["retry_count"],
            "created_at": r["created_at"],
            "recommended_action": r["recommended_action"] or ("RETRY" if r["failure_reason"] in ["BANK_TIMEOUT", "NETWORK_ERROR"] else "PAYMENT_LINK"),
            "recovery_probability": float(rec_prob) if rec_prob else 75.0
        })
        
    # Get total count
    cursor.execute("SELECT COUNT(*) FROM payments")
    total_count = cursor.fetchone()[0]
    
    conn.close()
    return {"total": total_count, "items": payments}

@router.get("/{payment_id}")
def get_payment_detail(payment_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT p.id, p.customer_id, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
               c.customer_tenure_days, c.successful_payments, c.failed_payments, c.total_payments,
               p.amount, p.currency, p.status, p.failure_reason, p.payment_method, p.retry_count, p.created_at,
               rc.id as case_id, rc.recovery_probability, rc.risk_score, rc.recommended_action, rc.status as case_status
        FROM payments p
        JOIN customers c ON p.customer_id = c.id
        LEFT JOIN recovery_cases rc ON p.id = rc.payment_id
        WHERE p.id = ?
    """, (payment_id,))
    
    r = cursor.fetchone()
    if not r:
        conn.close()
        raise HTTPException(status_code=404, detail="Payment transaction not found")
        
    succ_rate = (r["successful_payments"] / r["total_payments"]) if r["total_payments"] > 0 else 0.75
    
    predict_input = {
        "amount": float(r["amount"]),
        "failure_reason": r["failure_reason"],
        "payment_method": r["payment_method"],
        "retry_count": int(r["retry_count"]),
        "customer_tenure_days": int(r["customer_tenure_days"]),
        "customer_success_rate": succ_rate
    }
    prob, risk_score, risk_lvl = predict_recovery_probability(predict_input)
    
    # Get recent actions for this payment case
    actions = []
    if r["case_id"]:
        cursor.execute("""
            SELECT id, action, reason, confidence, result, created_at
            FROM agent_actions WHERE case_id = ? ORDER BY created_at DESC
        """, (r["case_id"],))
        for act in cursor.fetchall():
            actions.append(dict(act))
            
    conn.close()
    
    return {
        "id": r["id"],
        "customer_id": r["customer_id"],
        "customer_name": r["customer_name"],
        "customer_email": r["customer_email"],
        "customer_phone": r["customer_phone"],
        "customer_tenure_days": r["customer_tenure_days"],
        "customer_success_rate": round(succ_rate * 100, 1),
        "amount": float(r["amount"]),
        "currency": r["currency"],
        "status": r["status"],
        "failure_reason": r["failure_reason"],
        "payment_method": r["payment_method"],
        "retry_count": r["retry_count"],
        "created_at": r["created_at"],
        "ai_analysis": {
            "recovery_probability": prob,
            "risk_score": risk_score,
            "risk_level": risk_lvl,
            "recommended_action": r["recommended_action"] or ("RETRY" if r["failure_reason"] in ["BANK_TIMEOUT", "NETWORK_ERROR"] else "PAYMENT_LINK"),
            "rationale": [
                f"Transaction value of ₹{float(r['amount']):,.2f} assessed.",
                f"Customer tenure of {r['customer_tenure_days']} days with {succ_rate*100:.1f}% historical payment completion rate.",
                f"Failure code '{r['failure_reason']}' analyzed with {r['retry_count']} prior retries.",
                f"Calculated recovery likelihood: {prob}% ({risk_lvl} RISK)."
            ]
        },
        "history_actions": actions
    }
