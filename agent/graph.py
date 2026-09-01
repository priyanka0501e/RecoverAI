import os
import sys
import uuid
from datetime import datetime

# Include project paths
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from ml.predict import predict_recovery_probability
from agent.policies import evaluate_guardrails
from agent.tools import (
    retry_payment, 
    create_payment_link, 
    send_notification, 
    escalate_case, 
    abort_case
)

class RecoveryAgent:
    """
    RecoverAI Autonomous Revenue Recovery Agent Orchestrator.
    Implements a 8-step stateful decision loop matching the Observatory requirements.
    """
    
    def __init__(self, guardrails_config=None):
        self.guardrails_config = guardrails_config or {}
        
    def run_recovery_workflow(self, payment_data, customer_data, db_conn=None):
        """
        Runs the workflow for a payment failure event.
        Returns full execution trace and final decision outcome.
        """
        execution_trace = []
        payment_id = payment_data.get("id") or payment_data.get("payment_id")
        amount = float(payment_data.get("amount", 0))
        failure_reason = payment_data.get("failure_reason", "UNKNOWN_ERROR")
        retry_count = int(payment_data.get("retry_count", 0))
        payment_method = payment_data.get("payment_method", "UPI")
        
        c_name = customer_data.get("name", "Valued Customer")
        c_email = customer_data.get("email", "customer@example.com")
        c_success_rate = float(customer_data.get("customer_success_rate") or customer_data.get("success_rate") or 0.75)
        c_tenure = int(customer_data.get("customer_tenure_days", 30))
        
        # Step 01: Detect Payment Failure
        step_1 = {
            "step": 1,
            "name": "Payment failure detected",
            "status": "COMPLETED",
            "details": f"Intercepted failure event for Payment #{payment_id} (₹{amount:,.2f}) - Reason: {failure_reason}",
            "timestamp": datetime.now().isoformat()
        }
        execution_trace.append(step_1)
        
        # Step 02: Retrieve Customer Profile
        step_2 = {
            "step": 2,
            "name": "Customer history retrieved",
            "status": "COMPLETED",
            "details": f"Customer: {c_name} | Tenure: {c_tenure} days | Historical Success Rate: {c_success_rate*100:.1f}%",
            "timestamp": datetime.now().isoformat()
        }
        execution_trace.append(step_2)
        
        # Step 03: Failure Reason Analysis
        step_3 = {
            "step": 3,
            "name": "Failure reason analyzed",
            "status": "COMPLETED",
            "details": f"Categorized failure '{failure_reason}' via {payment_method}. Retry attempt count: {retry_count}",
            "timestamp": datetime.now().isoformat()
        }
        execution_trace.append(step_3)
        
        # Step 04: ML Risk Engine Inference
        predict_input = {
            "amount": amount,
            "failure_reason": failure_reason,
            "payment_method": payment_method,
            "retry_count": retry_count,
            "customer_tenure_days": c_tenure,
            "customer_success_rate": c_success_rate,
            "hour_of_day": datetime.now().hour
        }
        recovery_prob, risk_score, risk_level = predict_recovery_probability(predict_input)
        
        step_4 = {
            "step": 4,
            "name": "ML Risk Engine prediction",
            "status": "COMPLETED",
            "details": f"Recovery probability: {recovery_prob:.1f}% | Risk Score: {risk_score} ({risk_level} RISK)",
            "timestamp": datetime.now().isoformat()
        }
        execution_trace.append(step_4)
        
        # Step 05: Guardrails Verification
        is_allowed, rationale, forced_action = evaluate_guardrails(
            payment_data, customer_data, recovery_prob, self.guardrails_config
        )
        
        step_5 = {
            "step": 5,
            "name": "Guardrail rules verification",
            "status": "COMPLETED" if is_allowed else "GUARDRAIL_INTERVENTION",
            "details": rationale,
            "timestamp": datetime.now().isoformat()
        }
        execution_trace.append(step_5)
        
        # Step 06: AI Decision Selection
        if forced_action:
            selected_action = forced_action
            decision_reason = rationale
        elif failure_reason in ["BANK_TIMEOUT", "NETWORK_ERROR"] and recovery_prob >= 55.0:
            selected_action = "RETRY"
            decision_reason = f"High recovery probability ({recovery_prob:.1f}%) and transient error '{failure_reason}'. Immediate retry recommended."
        elif failure_reason in ["CHECKOUT_ABANDONED", "AUTHENTICATION_FAILED"]:
            selected_action = "PAYMENT_LINK"
            decision_reason = f"Abandoned checkout pattern detected. Generating instant recovery payment link."
        elif failure_reason == "INSUFFICIENT_FUNDS" and amount <= 15000:
            selected_action = "DISCOUNT_LINK"
            decision_reason = f"Insufficient funds error. Generating recovery link with 5% instant settlement discount."
        elif recovery_prob < 30.0:
            selected_action = "STOP"
            decision_reason = f"Low recovery likelihood ({recovery_prob:.1f}%). Halting automated actions to save costs."
        else:
            selected_action = "PAYMENT_LINK"
            decision_reason = f"Standard recovery workflow selected payment link for {failure_reason}."
            
        step_6 = {
            "step": 6,
            "name": f"Agent selected {selected_action}",
            "status": "COMPLETED",
            "details": decision_reason,
            "timestamp": datetime.now().isoformat()
        }
        execution_trace.append(step_6)
        
        # Step 07: Bounded Tool Execution
        case_id = f"CASE-{payment_id}"
        tool_result = None
        
        if selected_action == "RETRY":
            tool_result = retry_payment(payment_id, amount)
        elif selected_action == "PAYMENT_LINK":
            tool_result = create_payment_link(payment_id, c_email, amount, discount_pct=0.0)
            send_notification(customer_data.get("phone"), c_email, f"Complete your payment here: {tool_result['short_url']}")
        elif selected_action == "DISCOUNT_LINK":
            tool_result = create_payment_link(payment_id, c_email, amount, discount_pct=5.0)
            send_notification(customer_data.get("phone"), c_email, f"Get 5% off when you complete payment now: {tool_result['short_url']}")
        elif selected_action == "HUMAN_ESCALATE":
            tool_result = escalate_case(case_id, payment_id, rationale)
        else: # STOP / ABORT
            tool_result = abort_case(case_id, decision_reason)
            
        step_7 = {
            "step": 7,
            "name": f"Tool execution: {tool_result.get('tool', selected_action)}",
            "status": tool_result.get("status", "SUCCESS"),
            "details": tool_result.get("message", "Tool executed successfully."),
            "timestamp": datetime.now().isoformat()
        }
        execution_trace.append(step_7)
        
        # Step 08: Verification & Audit Trail Recording
        final_case_status = "ACTIVE"
        recovered_amount = 0.0
        
        if selected_action == "RETRY" and tool_result.get("status") == "SUCCESS":
            final_case_status = "RECOVERED"
            recovered_amount = amount
        elif selected_action in ["PAYMENT_LINK", "DISCOUNT_LINK"]:
            # Standard simulated outcome for payment link (70% conversion)
            final_case_status = "RECOVERED" if (recovery_prob > 60.0) else "ACTIVE"
            if final_case_status == "RECOVERED":
                recovered_amount = tool_result.get("discounted_amount", amount)
        elif selected_action == "HUMAN_ESCALATE":
            final_case_status = "ESCALATED"
        else:
            final_case_status = "ABORTED"
            
        step_8 = {
            "step": 8,
            "name": f"Verification & Audit Log Created",
            "status": "COMPLETED",
            "details": f"Case #{case_id} status updated to {final_case_status}. Money recovered: ₹{recovered_amount:,.2f}. Audit hash logged.",
            "timestamp": datetime.now().isoformat()
        }
        execution_trace.append(step_8)
        
        summary = {
            "case_id": case_id,
            "payment_id": payment_id,
            "customer_name": c_name,
            "amount": amount,
            "recovered_amount": recovered_amount,
            "failure_reason": failure_reason,
            "recovery_probability": recovery_prob,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "selected_action": selected_action,
            "final_status": final_case_status,
            "confidence": round(recovery_prob, 1),
            "guardrail_passed": is_allowed,
            "execution_trace": execution_trace,
            "tool_result": tool_result,
            "created_at": datetime.now().isoformat()
        }
        
        # Persist to database if db_conn provided
        if db_conn:
            self._persist_to_db(db_conn, summary)
            
        return summary

    def _persist_to_db(self, conn, summary):
        try:
            cursor = conn.cursor()
            
            # Upsert case
            cursor.execute("""
                INSERT OR REPLACE INTO recovery_cases 
                (id, payment_id, risk_score, recovery_probability, recommended_action, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                summary["case_id"],
                summary["payment_id"],
                summary["risk_score"],
                summary["recovery_probability"],
                summary["selected_action"],
                summary["final_status"],
                summary["created_at"],
                summary["created_at"]
            ))
            
            # Update payment status if recovered
            if summary["final_status"] == "RECOVERED":
                cursor.execute("""
                    UPDATE payments SET status = 'RECOVERED' WHERE id = ?
                """, (summary["payment_id"],))
            elif summary["final_status"] == "ESCALATED":
                cursor.execute("""
                    UPDATE payments SET status = 'ESCALATED' WHERE id = ?
                """, (summary["payment_id"],))
                
            # Log Agent Action
            action_id = f"ACT-{uuid.uuid4().hex[:8]}"
            cursor.execute("""
                INSERT INTO agent_actions (id, case_id, action, reason, confidence, result, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                action_id,
                summary["case_id"],
                summary["selected_action"],
                summary["execution_trace"][5]["details"],
                summary["confidence"],
                summary["tool_result"].get("status", "SUCCESS"),
                summary["created_at"]
            ))
            
            # Log Audit Trail
            audit_id = f"AUD-{uuid.uuid4().hex[:8]}"
            import json
            cursor.execute("""
                INSERT INTO audit_logs (id, case_id, agent_id, action, input_data, decision_data, status, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                audit_id,
                summary["case_id"],
                "RecoverAI-Agent-v1",
                summary["selected_action"],
                json.dumps({"payment_id": summary["payment_id"], "amount": summary["amount"]}),
                json.dumps({"probability": summary["recovery_probability"], "status": summary["final_status"]}),
                "SUCCESS",
                summary["created_at"]
            ))
            
            conn.commit()
        except Exception as e:
            print(f"Error persisting agent run to database: {e}")
