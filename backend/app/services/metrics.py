import sqlite3
from app.database import get_db_connection

def get_command_center_metrics():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Total revenue at risk (Sum of all payments with status FAILED, RECOVERED, ABANDONED, ESCALATED)
    cursor.execute("SELECT SUM(amount), COUNT(*) FROM payments")
    row_total = cursor.fetchone()
    total_revenue_at_risk = float(row_total[0] or 0.0)
    total_payments_count = int(row_total[1] or 0)
    
    # Total revenue recovered
    cursor.execute("SELECT SUM(amount), COUNT(*) FROM payments WHERE status = 'RECOVERED'")
    row_rec = cursor.fetchone()
    total_revenue_recovered = float(row_rec[0] or 0.0)
    recovered_count = int(row_rec[1] or 0)
    
    recovery_rate = round((total_revenue_recovered / total_revenue_at_risk * 100.0), 1) if total_revenue_at_risk > 0 else 0.0
    
    # Active & Escalated counts
    cursor.execute("SELECT COUNT(*) FROM recovery_cases WHERE status = 'ACTIVE'")
    active_cases = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM recovery_cases WHERE status = 'ESCALATED'")
    escalated_cases = cursor.fetchone()[0]
    
    # Daily trend data (last 7 days simulation)
    # Formats for Recharts graph: { day: 'Mon', at_risk: 120000, recovered: 78000 }
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    trend_data = []
    base_risk = total_revenue_at_risk / 90 # 90 days total
    for d in days:
        day_risk = round(base_risk * (0.85 + (hash(d) % 30) / 100.0), 2)
        day_rec = round(day_risk * (recovery_rate / 100.0) * (0.9 + (hash(d) % 20) / 100.0), 2)
        trend_data.append({
            "day": d,
            "revenue_at_risk": day_risk,
            "revenue_recovered": day_rec
        })
        
    # Live agent actions feed
    cursor.execute("""
        SELECT a.id, c.payment_id, a.action, a.reason, a.confidence, a.result, a.created_at, p.failure_reason, p.amount
        FROM agent_actions a
        JOIN recovery_cases c ON a.case_id = c.id
        JOIN payments p ON c.payment_id = p.id
        ORDER BY a.created_at DESC
        LIMIT 10
    """)
    rows_actions = cursor.fetchall()
    
    live_feed = []
    for r in rows_actions:
        live_feed.append({
            "id": r["id"],
            "payment_id": r["payment_id"],
            "action": r["action"],
            "reason": r["reason"],
            "confidence": r["confidence"],
            "result": r["result"],
            "failure_reason": r["failure_reason"],
            "amount": float(r["amount"]),
            "timestamp": r["created_at"]
        })
        
    conn.close()
    
    return {
        "revenue_at_risk": round(total_revenue_at_risk, 2),
        "revenue_at_risk_lakhs": round(total_revenue_at_risk / 100000.0, 1),
        "revenue_recovered": round(total_revenue_recovered, 2),
        "revenue_recovered_lakhs": round(total_revenue_recovered / 100000.0, 1),
        "recovery_rate": recovery_rate,
        "total_payments_count": total_payments_count,
        "recovered_count": recovered_count,
        "active_cases": active_cases,
        "escalated_cases": escalated_cases,
        "trend_data": trend_data,
        "live_feed": live_feed
    }
