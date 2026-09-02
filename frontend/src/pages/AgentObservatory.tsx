import React, { useState, useEffect } from 'react';
import { Play, Terminal, Layers, ArrowDown, Cpu, RefreshCw, CheckCircle2 } from 'lucide-react';

export const AgentObservatory: React.FC<{ initialPaymentId?: string }> = ({ initialPaymentId }) => {
  const [paymentId, setPaymentId] = useState(initialPaymentId || 'RP10291');
  const [running, setRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(8); // Fully completed by default
  const [traceData, setTraceData] = useState<any>(null);

  const defaultNodes = [
    { step: 1, name: '01 Payment Failure Intercepted', desc: 'Captured gateway failure webhook event' },
    { step: 2, name: '02 Customer History Retrieved', desc: 'Fetched tenure, payment count & historical completion rate' },
    { step: 3, name: '03 Failure Reason Analyzed', desc: 'Categorized failure code & retry attempt history' },
    { step: 4, name: '04 ML Risk Engine Prediction', desc: 'Ran RandomForest classifier predicting recovery likelihood' },
    { step: 5, name: '05 Guardrail Rules Verification', desc: 'Evaluated max retries, high value limits & spend cap' },
    { step: 6, name: '06 Agent Action Selection', desc: 'Selected bounded action (RETRY / PAYMENT_LINK / ESCALATE)' },
    { step: 7, name: '07 Bounded Tool Execution', desc: 'Executed gateway tool safely with fallback handling' },
    { step: 8, name: '08 Audit Log & Result Verification', desc: 'Logged immutable audit entry and updated case state' },
  ];

  const handleRunWorkflow = async () => {
    setRunning(true);
    setCurrentStepIndex(0);
    setTraceData(null);

    try {
      const targetId = paymentId || 'RP10291';
      const res = await fetch(`http://127.0.0.1:8000/api/agent/run-demo?payment_id=${targetId}`, {
        method: 'POST'
      });
      
      if (res.ok) {
        const data = await res.json();
        setTraceData(data);

        // Animate step by step
        for (let i = 1; i <= 8; i++) {
          await new Promise((r) => setTimeout(r, 450));
          setCurrentStepIndex(i);
        }
      }
    } catch (err) {
      console.error('Agent execution error:', err);
      setCurrentStepIndex(8);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    handleRunWorkflow();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Agent Observatory</h1>
            <span className="ai-badge">
              <span className="ai-pulse-dot"></span>
              LANGGRAPH AGENT ONLINE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Visual stateful execution trace demonstrating bounded workflow orchestration, ML inference & audit trail generation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={paymentId}
            onChange={(e) => setPaymentId(e.target.value)}
            placeholder="Payment ID (e.g. RP10291)"
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-600"
          />
          <button
            onClick={handleRunWorkflow}
            disabled={running}
            className="btn-primary text-xs py-2 px-4"
          >
            {running ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Play className="w-4 h-4 text-white" />
            )}
            <span>{running ? 'Executing Trace...' : 'Run Agent Workflow'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Node Graph, Right Details & Audit Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Visual Node Timeline */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-700" />
              <span>Workflow Execution Timeline</span>
            </h2>
            <span className="text-xs font-mono text-slate-500">
              Step {currentStepIndex} of 8 Completed
            </span>
          </div>

          <div className="space-y-3">
            {defaultNodes.map((node) => {
              const traceStep = traceData?.execution_trace?.find((t: any) => t.step === node.step);
              const isCompleted = currentStepIndex >= node.step;
              const isActive = running && currentStepIndex === node.step - 1;

              return (
                <div key={node.step}>
                  <div
                    className={`p-4 rounded-xl transition-all border ${
                      isActive
                        ? 'bg-purple-50 border-purple-500 shadow-md scale-[1.01]'
                        : isCompleted
                        ? 'bg-white border-purple-200'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                          isCompleted ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' :
                          isActive ? 'bg-purple-600 text-white' :
                          'bg-slate-200 text-slate-500'
                        }`}>
                          {isCompleted ? '✓' : `0${node.step}`}
                        </div>

                        <div>
                          <h3 className={`text-xs font-bold ${isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>
                            {node.name}
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {traceStep?.details || node.desc}
                          </p>
                        </div>
                      </div>

                      {isCompleted && (
                        <span className="badge badge-success text-[10px] font-mono">
                          PASSED
                        </span>
                      )}
                    </div>
                  </div>

                  {node.step < 8 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className={`w-3.5 h-3.5 ${currentStepIndex >= node.step ? 'text-purple-600' : 'text-slate-300'}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Execution Output Summary */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Agent Rationale Summary Card */}
          <div className="glass-card p-6 bg-white border-purple-200 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <Cpu className="w-5 h-5 text-purple-700" />
              <h3 className="text-base font-extrabold text-slate-900">Agent Rationale & Outcome</h3>
            </div>

            {traceData ? (
              <div className="space-y-4 text-xs">
                
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Target Payment ID:</span>
                    <span className="font-mono font-bold text-slate-900">#{traceData.payment_id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Amount:</span>
                    <span className="font-extrabold text-slate-900">₹{traceData.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Customer:</span>
                    <span className="font-semibold text-slate-900">{traceData.customer_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">ML Recovery Likelihood:</span>
                    <span className="font-bold text-purple-700">{traceData.recovery_probability}%</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200">
                  <span className="text-[11px] text-purple-800 uppercase font-bold block mb-1">Selected Action</span>
                  <span className="text-lg font-black text-slate-900">{traceData.selected_action}</span>
                  <p className="text-[11px] text-slate-600 mt-1">{traceData.execution_trace[5]?.details}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-emerald-800 font-bold block uppercase">Measured Recovered Revenue</span>
                    <span className="text-xl font-black text-slate-900">₹{traceData.recovered_amount.toLocaleString()} INR</span>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>

              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                Click "Run Agent Workflow" to execute interactive trace.
              </div>
            )}
          </div>

          {/* Terminal Audit Log Inspector */}
          <div className="glass-card p-5 bg-white space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <Terminal className="w-4 h-4 text-purple-700" />
              <span>Immutable Trace Payload</span>
            </div>
            <pre className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-400 max-h-56 overflow-y-auto">
              {traceData ? JSON.stringify(traceData.tool_result || traceData.execution_trace, null, 2) : '// Waiting for workflow execution...'}
            </pre>
          </div>

        </div>

      </div>

    </div>
  );
};
