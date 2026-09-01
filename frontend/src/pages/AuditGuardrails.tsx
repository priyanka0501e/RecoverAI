import { useState, useEffect } from 'react';
import { ShieldCheck, FileText, CheckCircle2, Save, RefreshCw } from 'lucide-react';

export const AuditGuardrails: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  
  const [guardrails, setGuardrails] = useState<any>({
    MAX_RETRIES: 2,
    HIGH_VALUE_THRESHOLD: 25000,
    MAX_AUTOMATIC_ACTION: 50000,
    MAX_DISCOUNT_PERCENT: 10,
    AGENT_SPEND_LIMIT: 5000,
    AUTO_RECOVERY_ENABLED: true
  });
  const [savingGuardrails, setSavingGuardrails] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/audit/logs?limit=30');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchGuardrails = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/guardrails');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setGuardrails(data.config);
        }
      }
    } catch (err) {
      console.error('Failed to load guardrails:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchGuardrails();
  }, []);

  const handleSaveGuardrails = async () => {
    setSavingGuardrails(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/guardrails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guardrails)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update guardrails:', err);
    } finally {
      setSavingGuardrails(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Audit & Policy Guardrails</h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable agent action logs, bounded execution constraints & safety policy controls (Razorpay Track 3 compliant).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchLogs} className="btn-secondary text-xs py-2 px-3">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {/* Grid: Left Column Guardrail Settings, Right Column Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Guardrail Safety Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 bg-white border-purple-200 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-700" />
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Agent Guardrails</h2>
              </div>
              <span className="badge badge-success text-[10px]">ENFORCED</span>
            </div>

            <div className="space-y-5 text-xs">
              
              {/* Max Retries */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-semibold text-slate-900">Maximum Payment Retries</label>
                  <span className="font-mono text-purple-700 font-bold">{guardrails.MAX_RETRIES} Retries</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={guardrails.MAX_RETRIES}
                  onChange={(e) => setGuardrails({ ...guardrails, MAX_RETRIES: parseInt(e.target.value) })}
                  className="w-full accent-purple-600 bg-slate-200 h-1.5 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 mt-1">Halts automated gateway retries after threshold.</p>
              </div>

              {/* High Value Threshold */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-semibold text-slate-900">High-Value Escalation Threshold</label>
                  <span className="font-mono text-emerald-700 font-bold">₹{Number(guardrails.HIGH_VALUE_THRESHOLD).toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="100000"
                  step="5000"
                  value={guardrails.HIGH_VALUE_THRESHOLD}
                  onChange={(e) => setGuardrails({ ...guardrails, HIGH_VALUE_THRESHOLD: parseFloat(e.target.value) })}
                  className="w-full accent-purple-600 bg-slate-200 h-1.5 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 mt-1">Mandates human operations escalation above this amount.</p>
              </div>

              {/* Max Discount Allowed */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-semibold text-slate-900">Maximum Recovery Discount</label>
                  <span className="font-mono text-amber-700 font-bold">{guardrails.MAX_DISCOUNT_PERCENT}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={guardrails.MAX_DISCOUNT_PERCENT}
                  onChange={(e) => setGuardrails({ ...guardrails, MAX_DISCOUNT_PERCENT: parseFloat(e.target.value) })}
                  className="w-full accent-purple-600 bg-slate-200 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Spend Limit */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-semibold text-slate-900">Agent Spending Limit (Per Txn)</label>
                  <span className="font-mono text-slate-900 font-bold">₹{Number(guardrails.AGENT_SPEND_LIMIT).toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="25000"
                  step="1000"
                  value={guardrails.AGENT_SPEND_LIMIT}
                  onChange={(e) => setGuardrails({ ...guardrails, AGENT_SPEND_LIMIT: parseFloat(e.target.value) })}
                  className="w-full accent-purple-600 bg-slate-200 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Autonomous Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div>
                  <span className="font-semibold text-slate-900 block">Automatic Interventions</span>
                  <span className="text-[11px] text-slate-500">Autonomous agent execution state</span>
                </div>
                <button
                  type="button"
                  onClick={() => setGuardrails({ ...guardrails, AUTO_RECOVERY_ENABLED: !guardrails.AUTO_RECOVERY_ENABLED })}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${
                    guardrails.AUTO_RECOVERY_ENABLED ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    guardrails.AUTO_RECOVERY_ENABLED ? 'translate-x-6' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>

            </div>

            {/* Save Button */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={handleSaveGuardrails}
                disabled={savingGuardrails}
                className="w-full btn-primary justify-center text-xs py-2.5"
              >
                {savingGuardrails ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Save className="w-4 h-4 text-white" />
                )}
                <span>{savingGuardrails ? 'Saving...' : 'Save Guardrail Configuration'}</span>
              </button>
            </div>

            {saveSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs text-center font-medium">
                Guardrails policy updated & active across all workflow nodes!
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Immutable Audit Trail Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-700" />
              <span>Immutable Agent Audit Log</span>
            </h2>
            <span className="text-xs font-mono text-slate-500">
              {logs.length} Logged Interventions
            </span>
          </div>

          <div className="glass-card bg-white overflow-hidden">
            {loadingLogs ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-500">Reading Audit Ledger...</p>
              </div>
            ) : logs.length > 0 ? (
              <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Case ID</th>
                      <th>Agent Action</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {log.timestamp.split('T')[1]?.substring(0, 8) || log.timestamp}
                        </td>

                        <td className="font-mono text-xs font-bold text-slate-900">
                          #{log.case_id}
                        </td>

                        <td>
                          <div className="font-semibold text-slate-900 text-xs">{log.action}</div>
                          <div className="text-[10px] text-slate-500 font-mono line-clamp-1">{log.input_data}</div>
                        </td>

                        <td>
                          <span className="badge badge-success text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>AUDITED</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                No audit entries recorded yet.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
