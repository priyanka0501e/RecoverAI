# Guardrail Policies & Bounded Execution Rules

DEFAULT_GUARDRAILS = {
    "MAX_RETRIES": 2,
    "HIGH_VALUE_THRESHOLD": 25000.0,      # ₹25,000 - Require human escalation
    "MAX_AUTOMATIC_ACTION": 50000.0,     # ₹50,000
    "MAX_DISCOUNT_PERCENT": 10.0,         # Max 10% discount offered in recovery links
    "AGENT_SPEND_LIMIT": 5000.0,          # ₹5,000 promo cost cap
    "AUTO_RECOVERY_ENABLED": True
}

def evaluate_guardrails(payment, customer, recovery_prob, config=None):
    """
    Evaluates policy guardrails for a given payment recovery candidate.
    Returns: (is_allowed: bool, rationale: str, forced_action: str | None)
    """
    cfg = DEFAULT_GUARDRAILS.copy()
    if config:
        cfg.update(config)

    amount = float(payment.get("amount", 0))
    retry_count = int(payment.get("retry_count", 0))
    
    # Rule 1: High Value Escalation Rule
    if amount > cfg["HIGH_VALUE_THRESHOLD"]:
        return (
            False,
            f"Transaction amount (₹{amount:,.2f}) exceeds High-Value Guardrail Threshold (₹{cfg['HIGH_VALUE_THRESHOLD']:,.2f}). Human escalation mandated.",
            "HUMAN_ESCALATE"
        )

    # Rule 2: Max Retries Exceeded Rule
    if retry_count >= cfg["MAX_RETRIES"]:
        return (
            False,
            f"Payment retry count ({retry_count}) has reached the maximum allowed retry guardrail limit ({cfg['MAX_RETRIES']}). Automated retries halted.",
            "HUMAN_ESCALATE" if amount > 10000 else "STOP"
        )

    # Rule 3: Autonomous Engine Disabled Rule
    if not cfg.get("AUTO_RECOVERY_ENABLED", True):
        return (
            False,
            "Autonomous recovery engine is disabled via Guardrail Safety Switch.",
            "HUMAN_ESCALATE"
        )

    # Rule 4: Very Low Probability Rule
    if recovery_prob < 25.0:
        return (
            False,
            f"Recovery probability ({recovery_prob:.1f}%) is below minimum viable threshold (25.0%). Case flagged for manual review.",
            "HUMAN_ESCALATE"
        )

    return (True, "Passed all safety guardrails.", None)
