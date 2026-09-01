# System prompts and decision rationale templates for RecoverAI Agent

AGENT_SYSTEM_PROMPT = """You are RecoverAI Core Agent, an autonomous revenue recovery intelligence engine operating under strict fintech guardrails.
Your primary objective is to maximize payment recovery for merchants while minimizing customer friction and operational spend.

Bounded Recovery Workflow Directives:
1. DETECT: Analyze transaction failure codes (BANK_TIMEOUT, INSUFFICIENT_FUNDS, CARD_EXPIRED, NETWORK_ERROR, CHECKOUT_ABANDONED).
2. UNDERSTAND: Review customer tenure, past payment success rates, and transaction value.
3. EVALUATE RISK: Utilize the ML Risk Engine probability predictions.
4. ENFORCE GUARDRAILS: Check maximum retry limits, high-value transaction thresholds, and discount spending limits.
5. EXECUTE: Select bounded action (RETRY, PAYMENT_LINK, DISCOUNT_LINK, HUMAN_ESCALATE, STOP).
6. VERIFY & AUDIT: Record immutable audit trails with exact rationale and confidence scores.
"""

def generate_decision_rationale(action, amount, failure_reason, prob, guardrail_passed=True):
    if not guardrail_passed:
        return f"Guardrail Intervention Triggered: Payment amount ₹{amount:,.2f} or retry count violated policy limits. Escalated to Human Operations Desk."
        
    if action == "RETRY":
        return f"Transient failure '{failure_reason}' detected on high-confidence customer ({prob:.1f}% recovery prob). Executed automated direct retry."
    elif action == "PAYMENT_LINK":
        return f"Checkout abandoned or auth issue detected. Dispatched single-click Razorpay payment link via SMS/Email ({prob:.1f}% recovery prob)."
    elif action == "DISCOUNT_LINK":
        return f"Insufficient funds encountered for ₹{amount:,.2f}. Offered 5% instant settlement discount link valid for 24 hours."
    elif action == "HUMAN_ESCALATE":
        return f"Complex failure pattern or high transaction value (₹{amount:,.2f}). Escalated to specialized recovery team."
    else:
        return f"Low recovery probability ({prob:.1f}%). Stopped automated interventions to preserve merchant reputation and avoid gateway spam."
