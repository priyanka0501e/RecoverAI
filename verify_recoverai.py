import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"

endpoints = [
    ("/", "Root API Status"),
    ("/api/metrics", "Command Center Metrics"),
    ("/api/payments?limit=5", "Payment Intelligence Directory"),
    ("/api/payments/RP10001", "Payment Detail & ML Risk Analysis"),
    ("/api/cases?category=ACTIVE&limit=5", "Active Recovery Cases"),
    ("/api/agent/observatory", "Agent Observatory Nodes"),
    ("/api/agent/run-demo?payment_id=RP10001", "Agent 8-Step Execution Trace"),
    ("/api/audit/logs?limit=5", "Immutable Audit Logs Ledger"),
    ("/api/guardrails", "Guardrails Configuration")
]

print("==================================================")
print("     RecoverAI Full-Stack Verification Suite")
print("==================================================")

all_passed = True
for ep, name in endpoints:
    url = BASE_URL + ep
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "RecoverAI-Tester"})
        if ep == "/api/agent/run-demo?payment_id=RP10001":
            req.method = "POST"
            
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f"[✓ PASS] {name} ({ep})")
            if ep == "/api/metrics":
                print(f"       -> Revenue at Risk: ₹{data['revenue_at_risk_lakhs']} Lakhs")
                print(f"       -> Revenue Recovered: ₹{data['revenue_recovered_lakhs']} Lakhs ({data['recovery_rate']}%)")
                print(f"       -> Total Analyzed: {data['total_payments_count']} payments")
            elif ep == "/api/agent/run-demo?payment_id=RP10001":
                print(f"       -> Agent Selected Action: {data['selected_action']}")
                print(f"       -> Steps Trace Count: {len(data['execution_trace'])}")
    except Exception as e:
        print(f"[✗ FAIL] {name} ({ep}) - Error: {e}")
        all_passed = False

print("==================================================")
if all_passed:
    print("SUCCESS: All RecoverAI Endpoints Verified Cleanly!")
else:
    print("WARNING: Some endpoints failed verification.")
print("==================================================")
