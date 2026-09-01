# 🚀 RecoverAI — Autonomous Revenue Recovery & Payment Intelligence Platform

> **Razorpay Buildathon Track 3 Submission** — Autonomous agent detecting revenue at risk, evaluating recovery probability, executing bounded recovery workflows, measuring recovered revenue, and recording immutable audit trails.

---

## 📌 Problem & Solution

E-commerce merchants lose **15–20% of GMV** due to payment failure events (bank timeouts, network drops, checkout abandonments, insufficient funds). Static retry engines spam customers or fail to recover revenue.

**RecoverAI** operates a 5-stage bounded workflow loop:
```
👀 Detect ➔ 🧠 Understand ➔ 🎯 Decide ➔ ⚡ Act ➔ ✅ Verify
```

1. **Risk Intelligence**: Intercepts failed transactions and calculates ML-powered recovery probability scores using Scikit-Learn.
2. **Bounded Action Tools**: Dispatches targeted interventions (`retry_payment`, `create_payment_link`, `send_notification`, `escalate_case`).
3. **Safety Guardrails**: Enforces hard policy constraints (Max 2 retries, mandatory human escalation above ₹25,000, 10% max discount).
4. **Audit Trail**: Logs every step, decision rationale, and outcome into an immutable SQLite audit ledger.

---

## 📊 Measured Recovery Performance (10,000 Transactions Dataset)

| Metric | Measured Value |
| :--- | :--- |
| **Total Revenue at Risk** | **₹1,061.8 Lakhs (₹10.61 Cr)** |
| **Measured Revenue Recovered** | **₹660.2 Lakhs (₹6.60 Cr)** |
| **Overall Recovery Rate** | **62.2%** |
| **Total Analyzed Transactions** | **10,000 Payments** |
| **Successful Interventions** | **6,882 Payments** |
| **Guardrail Escalations to Ops** | **1,268 Cases** |

---

## 🛠️ Project Structure

```
RecoverAI/
├── backend/                  # FastAPI Python Server
│   ├── app/
│   │   ├── main.py           # FastAPI entrypoint & CORS
│   │   ├── routes/           # REST API route handlers
│   │   └── services/         # Metrics & Agent services
│   └── requirements.txt
├── frontend/                 # React 18 + Vite + TypeScript Web App
│   ├── src/
│   │   ├── pages/            # 6 Core Control Center Pages
│   │   └── components/       # Drawer & Navbar components
├── ml/                       # Scikit-learn Risk Classifier
│   ├── train.py              # ML model trainer (0.795 ROC-AUC)
│   └── predict.py            # Real-time probability inference engine
├── agent/                    # LangGraph-style Workflow & Policies
│   ├── graph.py              # 8-Step stateful decision orchestrator
│   ├── policies.py           # Safety Guardrail policy rules
│   └── tools.py              # Bounded recovery execution tools
├── database/                 # SQLite DDL Schema & 10,000 Seed Script
│   ├── schema.sql
│   └── init_db.py
└── verify_recoverai.py       # Full-stack verification test suite
```

---

## 💻 Quick Start Guide

### 1. Start Backend Server (Python FastAPI)
```bash
cd backend
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*API Swagger Docs available at `http://127.0.0.1:8000/docs`*

### 2. Start Frontend App (React + Vite)
```bash
cd frontend
npx vite --port 5173 --host 127.0.0.1
```
*Web Dashboard available at `http://127.0.0.1:5173`*

### 3. Run Verification Suite
```bash
python3 verify_recoverai.py
```

---

## 🛡️ License
Built for Razorpay Buildathon 2026 (Track 3).
