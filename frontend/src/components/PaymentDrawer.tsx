import React, { useState, useEffect } from 'react';
import { X, Cpu, User, CreditCard } from 'lucide-react';

interface PaymentDrawerProps {
  paymentId: string | null;
  onClose: () => void;
  onRunWorkflow: (paymentId: string) => void;
}

export const PaymentDrawer: React.FC<PaymentDrawerProps> = ({ paymentId, onClose, onRunWorkflow }) => {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!paymentId) return;
    setLoading(true);
    fetch(`http://127.0.0.1:8000/api/payments/${paymentId}`)
      .then(res => res.json())
      .then(data => {
        setDetail(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load payment detail:', err);
        setLoading(false);
      });
  }, [paymentId]);

  if (!paymentId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xl bg-white border-l border-slate-200 h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900 font-mono">#{paymentId}</h2>
                  <span className={`badge ${
                    detail?.status === 'RECOVERED' ? 'badge-success' :
                    detail?.status === 'ESCALATED' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {detail?.status || 'FAILED'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Transaction Detail & Risk Intelligence</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500">Running ML Risk Engine Analysis...</p>
            </div>
          ) : detail ? (
            <div className="space-y-6">
              
              {/* Payment Summary Box */}
              <div className="glass-card-static p-5 bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-xs text-slate-500">Amount</span>
                  <span className="text-xl font-extrabold text-slate-900">₹{detail.amount.toLocaleString()} <span className="text-xs font-normal text-slate-500">INR</span></span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                  <div>
                    <span className="text-slate-500 block mb-0.5">Failure Code</span>
                    <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block font-mono">
                      {detail.failure_reason}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Payment Method</span>
                    <span className="font-semibold text-slate-800 bg-slate-200 px-2 py-0.5 rounded inline-block font-mono">
                      {detail.payment_method}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Retry Count</span>
                    <span className="font-semibold text-slate-900">{detail.retry_count} / 2 Allowed</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Created Time</span>
                    <span className="text-slate-900 font-mono text-[11px]">{detail.created_at}</span>
                  </div>
                </div>
              </div>

              {/* Customer Profile Box */}
              <div className="glass-card-static p-5 bg-white border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-700 mb-2 uppercase tracking-wider">
                  <User className="w-4 h-4" />
                  <span>Customer Profile</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Customer Name</span>
                    <span className="font-semibold text-slate-900">{detail.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Email</span>
                    <span className="font-mono text-slate-900 text-[11px]">{detail.customer_email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tenure</span>
                    <span className="text-slate-900">{detail.customer_tenure_days} Days</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Historical Success</span>
                    <span className="text-emerald-600 font-semibold">{detail.customer_success_rate}%</span>
                  </div>
                </div>
              </div>

              {/* AI Analysis Box */}
              <div className="glass-card p-5 border-purple-200 space-y-4 bg-purple-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-purple-700" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">AI Recovery Analysis</h3>
                  </div>
                  <span className={`badge ${
                    detail.ai_analysis.risk_level === 'LOW' ? 'badge-success' :
                    detail.ai_analysis.risk_level === 'MEDIUM' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {detail.ai_analysis.risk_level} RISK
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-sm">
                    <span className="text-[11px] text-slate-500 block">Recovery Probability</span>
                    <span className="text-2xl font-black text-purple-700">{detail.ai_analysis.recovery_probability}%</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-sm">
                    <span className="text-[11px] text-slate-500 block">Recommended Action</span>
                    <span className="text-sm font-bold text-purple-800 mt-1 block">{detail.ai_analysis.recommended_action}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-600 mb-2">Decision Rationale & Drivers:</h4>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {detail.ai_analysis.rationale.map((r: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-purple-600 font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action History */}
              {detail.history_actions && detail.history_actions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Agent Action Audit History</h4>
                  <div className="space-y-2">
                    {detail.history_actions.map((act: any) => (
                      <div key={act.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-900">{act.action}</span>
                          <span className="text-[10px] font-mono text-slate-500">{act.created_at}</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{act.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : null}
        </div>

        {/* Footer Trigger Action */}
        <div className="pt-4 border-t border-slate-200 mt-6 flex gap-3">
          <button
            onClick={() => {
              onClose();
              onRunWorkflow(paymentId);
            }}
            className="flex-1 btn-primary justify-center text-xs py-3"
          >
            <Cpu className="w-4 h-4 text-white" />
            <span>Execute AI Workflow on Agent Observatory</span>
          </button>
        </div>

      </div>
    </div>
  );
};
