import sqlite3
from fastapi import APIRouter, HTTPException, Query
from app.database import get_db_connection
from app.models import TriggerRecoveryRequest
from agent.graph import RecoveryAgent

router = APIRouter(prefix="/api/cases", tags=["cases"])

@router.get("")
def list_cases(category: str = Query("ALL"), limit: int = Query(50)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT rc.id as case_id, rc.payment_id, rc.risk_score, rc.recovery_probability,
               rc.recommended_action, rc.status as case_status, rc.created_at,
               p.amount, p.failure_reason, p.retry_count, p.payment_method,
               c.name as customer_name, c.email as customer_email
        FROM recovery_cases rc
        JOIN payments p ON rc.payment_id = p.id
        JOIN customers c ON p.customer_id = c.id
        WHERE 1=1
    """
    params = []
    
    if category.upper() != "ALL":
        query += " AND rc.status = ?"
        params.append(category.upper())
        
    query += " ORDER BY rc.created_at DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    cases = []
    for r in rows:
        cases.append({
            "case_id": r["case_id"],
            "payment_id": r["payment_id"],
            "risk_score": float(r["risk_score"] or 0),
            "recovery_probability": float(r["recovery_probability"] or 75.0),
            "recommended_action": r["recommended_action"],
            "status": r["case_status"],
            "amount": float(r["amount"]),
            "failure_reason": r["failure_reason"],
            "retry_count": r["retry_count"],
            "payment_method": r["payment_method"],
            "customer_name": r["customer_name"],
            "customer_email": r["customer_email"],
            "created_at": r["created_at"]
        })
        
    conn.close()
    return {"category": category, "count": len(cases), "items": cases}

@router.post("/trigger")
def trigger_recovery(req: TriggerRecoveryRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get payment and customer info
    cursor.execute("""
        SELECT p.id as payment_id, p.amount, p.failure_reason, p.payment_method, p.retry_count, p.customer_id,
               c.name, c.email, c.phone, c.customer_tenure_days, c.successful_payments, c.total_payments
        FROM payments p
        JOIN customers c ON p.customer_id = c.id
        WHERE p.id = ?
    """, (req.payment_id,))
    
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Payment #{req.payment_id} not found")
        
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
    
    # Load Guardrails Config from DB
    cursor.execute("SELECT config_key, config_value FROM guardrails_config")
    cfg_rows = cursor.fetchall()
    guardrails_cfg = {}
    for cr in cfg_rows:
        val = cr["config_value"]
        if val.lower() == "true":
            val = True
        elif val.lower() == "false":
            val = False
        elif val.replace('.', '', 1).isdigit():
            val = float(val) if '.' in val else int(val)
        guardrails_cfg[cr["config_key"]] = val
        
    # Execute Agent
    agent = RecoveryAgent(guardrails_config=guardrails_cfg)
    result = agent.run_recovery_workflow(payment_data, customer_data, db_conn=conn)
    
    conn.close()
    return result
