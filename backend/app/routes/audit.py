import sqlite3
from datetime import datetime
from fastapi import APIRouter, Query, HTTPException
from app.database import get_db_connection
from app.models import GuardrailUpdate

router = APIRouter(prefix="/api", tags=["audit_and_guardrails"])

@router.get("/audit/logs")
def get_audit_logs(limit: int = Query(50), offset: int = Query(0)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT a.id, a.case_id, a.agent_id, a.action, a.input_data, a.decision_data, a.status, a.timestamp
        FROM audit_logs a
        ORDER BY a.timestamp DESC
        LIMIT ? OFFSET ?
    """, (limit, offset))
    
    rows = cursor.fetchall()
    logs = [dict(r) for r in rows]
    
    cursor.execute("SELECT COUNT(*) FROM audit_logs")
    total = cursor.fetchone()[0]
    
    conn.close()
    return {"total": total, "items": logs}

@router.get("/guardrails")
def get_guardrails():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT config_key, config_value, description FROM guardrails_config")
    rows = cursor.fetchall()
    
    config_dict = {}
    descriptions = {}
    for r in rows:
        key = r["config_key"]
        val = r["config_value"]
        descriptions[key] = r["description"]
        if val.lower() == "true":
            config_dict[key] = True
        elif val.lower() == "false":
            config_dict[key] = False
        elif val.replace('.', '', 1).isdigit():
            config_dict[key] = float(val) if '.' in val else int(val)
        else:
            config_dict[key] = val
            
    conn.close()
    return {"config": config_dict, "descriptions": descriptions}

@router.put("/guardrails")
def update_guardrails(update: GuardrailUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    update_data = update.model_dump(exclude_none=True)
    now_str = datetime.now().isoformat()
    
    for key, val in update_data.items():
        val_str = str(val).lower() if isinstance(val, bool) else str(val)
        cursor.execute("""
            INSERT OR REPLACE INTO guardrails_config (config_key, config_value, updated_at)
            VALUES (?, ?, ?)
        """, (key, val_str, now_str))
        
    conn.commit()
    conn.close()
    
    return {"status": "SUCCESS", "message": "Guardrails configuration updated successfully", "updated": update_data}
