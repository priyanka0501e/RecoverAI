import os
import sys
import sqlite3
import random
import json
from datetime import datetime, timedelta

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from ml.dataset_generator import generate_synthetic_data

def init_database(db_path=None, num_transactions=10000):
    if db_path is None:
        db_path = os.path.join(project_root, "backend", "recoverai.db")
        
    print(f"Initializing RecoverAI SQLite Database at: {db_path}")
    
    schema_path = os.path.join(current_dir, "schema.sql")
    with open(schema_path, "r") as f:
        schema_sql = f.read()
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Execute Schema DDL
    cursor.executescript(schema_sql)
    conn.commit()
    
    # Check if database is already seeded
    cursor.execute("SELECT COUNT(*) FROM payments")
    existing_count = cursor.fetchone()[0]
    if existing_count >= num_transactions:
        print(f"Database already contains {existing_count} transactions. Skipping seed.")
        conn.close()
        return db_path
        
    print(f"Generating {num_transactions} synthetic payment records...")
    cust_dict, records = generate_synthetic_data(num_transactions)
    
    # 1. Insert Customers
    cust_rows = [
        (c["id"], c["name"], c["email"], c["phone"], c["total_payments"], 
         c["successful_payments"], c["failed_payments"], c["customer_tenure_days"])
        for c in cust_dict.values()
    ]
    cursor.executemany("""
        INSERT OR REPLACE INTO customers 
        (id, name, email, phone, total_payments, successful_payments, failed_payments, customer_tenure_days)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, cust_rows)
    
    # 2. Insert Payments & Recovery Cases
    payment_rows = []
    case_rows = []
    action_rows = []
    audit_rows = []
    
    actions_pool = ["RETRY", "PAYMENT_LINK", "DISCOUNT_LINK", "HUMAN_ESCALATE", "STOP"]
    
    total_at_risk = 0.0
    total_recovered = 0.0
    
    for r in records:
        pid = r["payment_id"]
        cid = r["customer_id"]
        amt = r["amount"]
        reason = r["failure_reason"]
        method = r["payment_method"]
        retries = r["retry_count"]
        created_at = r["created_at"]
        prob = r["recovery_prob_true"] * 100.0
        risk_score = round(100.0 - prob, 1)
        
        # Determine status
        if r["is_recovered"] == 1:
            status = "RECOVERED"
            case_status = "RECOVERED"
            total_recovered += amt
        else:
            if amt > 25000 or retries >= 2:
                status = "FAILED"
                case_status = "ESCALATED"
            elif reason == "CHECKOUT_ABANDONED":
                status = "ABANDONED"
                case_status = "ACTIVE"
            else:
                status = "FAILED"
                case_status = "ACTIVE"
                
        total_at_risk += amt
        
        payment_rows.append((pid, cid, amt, 'INR', status, reason, method, retries, created_at))
        
        # Recommended action logic
        if amt > 25000 or retries >= 2:
            rec_action = "HUMAN_ESCALATE"
        elif reason in ["BANK_TIMEOUT", "NETWORK_ERROR"]:
            rec_action = "RETRY"
        elif reason in ["CHECKOUT_ABANDONED", "AUTHENTICATION_FAILED"]:
            rec_action = "PAYMENT_LINK"
        elif reason == "INSUFFICIENT_FUNDS":
            rec_action = "DISCOUNT_LINK"
        else:
            rec_action = "STOP"
            
        case_id = f"CASE-{pid}"
        case_rows.append((case_id, pid, risk_score, prob, rec_action, case_status, created_at, created_at))
        
        # Create action row
        act_id = f"ACT-{pid}"
        action_result = "SUCCESS" if case_status == "RECOVERED" else ("ESCALATED" if case_status == "ESCALATED" else "PENDING")
        action_rows.append((act_id, case_id, rec_action, f"Executed {rec_action} for {reason}", prob, action_result, created_at))
        
        # Create audit row
        aud_id = f"AUD-{pid}"
        audit_rows.append((
            aud_id, case_id, "RecoverAI-Core-Agent", rec_action,
            json.dumps({"payment_id": pid, "amount": amt, "reason": reason}),
            json.dumps({"probability": prob, "decision": rec_action, "result": case_status}),
            "SUCCESS", created_at
        ))
        
    cursor.executemany("""
        INSERT OR REPLACE INTO payments (id, customer_id, amount, currency, status, failure_reason, payment_method, retry_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, payment_rows)
    
    cursor.executemany("""
        INSERT OR REPLACE INTO recovery_cases (id, payment_id, risk_score, recovery_probability, recommended_action, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, case_rows)
    
    cursor.executemany("""
        INSERT OR REPLACE INTO agent_actions (id, case_id, action, reason, confidence, result, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, action_rows)
    
    cursor.executemany("""
        INSERT OR REPLACE INTO audit_logs (id, case_id, agent_id, action, input_data, decision_data, status, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, audit_rows)
    
    conn.commit()
    conn.close()
    
    rec_rate = (total_recovered / total_at_risk * 100.0) if total_at_risk > 0 else 0
    print(f"Database successfully populated!")
    print(f"Total Transactions: {len(records):,}")
    print(f"Total Revenue at Risk: ₹{total_at_risk/100000:.2f} Lakhs (₹{total_at_risk:,.2f})")
    print(f"Total Revenue Recovered: ₹{total_recovered/100000:.2f} Lakhs (₹{total_recovered:,.2f})")
    print(f"Overall Recovery Rate: {rec_rate:.2f}%")
    
    return db_path

if __name__ == "__main__":
    init_database()
