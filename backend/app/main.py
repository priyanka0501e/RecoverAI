import os
import sys

# Add both backend and RecoverAI root to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
root_dir = os.path.dirname(backend_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.payments import router as payments_router
from app.routes.cases import router as cases_router
from app.routes.agent import router as agent_router
from app.routes.audit import router as audit_router
from app.routes.razorpay_routes import router as razorpay_router
from app.services.metrics import get_command_center_metrics

app = FastAPI(
    title="RecoverAI Backend API",
    description="Autonomous Revenue Recovery & Payment Intelligence Platform API",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(payments_router)
app.include_router(cases_router)
app.include_router(agent_router)
app.include_router(audit_router)
app.include_router(razorpay_router)

@app.get("/")
def read_root():
    return {
        "status": "ONLINE",
        "app": "RecoverAI Autonomous Revenue Recovery Platform",
        "docs": "/docs"
    }

@app.get("/api/metrics")
def read_metrics():
    return get_command_center_metrics()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
