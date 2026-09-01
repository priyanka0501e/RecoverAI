import sqlite3
from fastapi import APIRouter, Query, HTTPException
from app.database import get_db_connection
from agent.graph import RecoveryAgent

router = APIRouter(prefix="/api/agent", tags=["agent"])

@router.get("/observatory")
def get_observatory_status():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get last 5 executed cases with full traces
    cursor.execute("""
        SELECT rc.id as case_id, rc.payment_id, rc.recovery_probability, rc.recommended_action,
               rc.status, rc.created_at, p.amount, p.failure_reason, c.name as customer_name
        FROM recovery_cases rc
        JOIN payments p ON rc.payment_id = p.id
        JOIN customers c ON p.customer_id = c.id
        ORDER BY rc.created_at DESC
        LIMIT 5
    """)
    recent_cases = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    
    return {
        "agent_name": "RecoverAI Core Intelligence Agent",
        "version": "2.4.0-buildathon",
        "status": "ONLINE",
        "mode": "AUTONOMOUS",
        "nodes": [
            {"id": "01", "name": "Payment Failure Detected", "type": "trigger"},
            {"id": "02", "name": "Customer History Retrieved", "type": "data_fetch"},
            {"id": "03", "name": "Failure Reason Analyzed", "type": "analysis"},
            {"id": "04", "name": "ML Risk Engine Prediction", "type": "ml_inference"},
            {"id": "05", "name": "Guardrail Verification", "type": "guardrail"},
            {"id": "06", "name": "Agent Action Selection", "type": "decision"},
            {"id": "07", "name": "Bounded Tool Execution", "type": "action"},
            {"id": "08", "name": "Verification & Audit Trail", "type": "audit"}
        ],
        "recent_executions": recent_cases
    }

@router.post("/run-demo")
def run_demo_execution(payment_id: str = Query(None)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if not payment_id:
        cursor.execute("SELECT id FROM payments WHERE status != 'RECOVERED' ORDER BY RANDOM() LIMIT 1")
        row = cursor.fetchone()
        payment_id = row[0] if row else "RP10001"
        
    cursor.execute("""
        SELECT p.id as payment_id, p.amount, p.failure_reason, p.payment_method, p.retry_count, p.customer_id,
               c.name, c.email, c.phone, c.customer_tenure_days, c.successful_payments, c.total_payments
        FROM payments p
        JOIN customers c ON p.customer_id = c.id
        WHERE p.id = ?
    """, (payment_id,))
    
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Payment #{payment_id} not found")
        
    payment_data = dict(row)
    succ_rate = (row["successful_payments"] / row["total_payments"]) if row["total_payments"] > 0 else 0.75
    customer_data = {
        "id": row["customer_id"],
        "name": row["name"],
        "email": row["email"],
        "phone": row["phone"],
        "customer_tenure_days": row["customer_tenure_days"],
        "customer_success_rate": succ_rate
    }
    
    agent = RecoveryAgent()
    result = agent.run_recovery_workflow(payment_data, customer_data, db_conn=conn)
    conn.close()
    
    return result
