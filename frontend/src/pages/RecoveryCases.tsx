import { useState, useEffect } from 'react';
import { Play, Eye, RefreshCw } from 'lucide-react';
import { PaymentDrawer } from '../components/PaymentDrawer';

export const RecoveryCases: React.FC<{ onNavigateToObservatory: (id: string) => void }> = ({ onNavigateToObservatory }) => {
  const [cases, setCases] = useState<any[]>([]);
  const [category, setCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [executingCaseId, setExecutingCaseId] = useState<string | null>(null);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/cases?category=${category}&limit=30`);
      if (res.ok) {
        const data = await res.json();
        setCases(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [category]);

  const handleExecuteCase = async (paymentId: string) => {
    setExecutingCaseId(paymentId);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/cases/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId })
      });
      if (res.ok) {
        await fetchCases();
      }
    } catch (err) {
      console.error('Execute case error:', err);
    } finally {
      setExecutingCaseId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Recovery Cases</h1>
          <p className="text-xs text-slate-500 mt-1">
            Active revenue recovery case queues categorized by status and recommended intervention policies.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          {['ALL', 'ACTIVE', 'RECOVERED', 'ESCALATED'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                category === cat
                  ? 'bg-[#7C3AED] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Cases Cards Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500">Loading Recovery Case Queues...</p>
        </div>
      ) : cases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c) => {
            const prob = c.recovery_probability || 75;
            const isExecuting = executingCaseId === c.payment_id;

            return (
              <div 
                key={c.case_id}
                className="glass-card p-5 bg-white flex flex-col justify-between space-y-4 hover:border-purple-300 transition-all"
              >
                
                {/* Top Section */}
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Case #{c.case_id}</span>
                      <h3 className="text-lg font-extrabold text-slate-900">Payment #{c.payment_id}</h3>
                    </div>
                    <span className={`badge ${
                      c.status === 'RECOVERED' ? 'badge-success' :
                      c.status === 'ESCALATED' ? 'badge-warning' : 'badge-info'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="text-2xl font-black text-emerald-600 my-2">
                    ₹{c.amount.toLocaleString()} <span className="text-xs font-normal text-slate-500">INR</span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Customer</span>
                      <span className="font-semibold text-slate-900">{c.customer_name}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Failure Code</span>
                      <span className="font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] border border-rose-200">
                        {c.failure_reason}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Recovery Probability</span>
                      <span className="font-bold text-purple-700">{prob.toFixed(0)}%</span>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-slate-500">Recommended Action</span>
                      <span className="badge badge-violet text-[10px]">
                        {c.recommended_action || 'RETRY'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleExecuteCase(c.payment_id)}
                    disabled={isExecuting || c.status === 'RECOVERED'}
                    className="flex-1 btn-primary justify-center text-xs py-2"
                  >
                    {isExecuting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-white" />
                    )}
                    <span>{c.status === 'RECOVERED' ? 'Recovered ✓' : isExecuting ? 'Running...' : 'Execute'}</span>
                  </button>

                  <button
                    onClick={() => setSelectedPaymentId(c.payment_id)}
                    className="btn-secondary py-2 px-3 text-xs"
                    title="View Details"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-slate-500 text-xs glass-card bg-white">
          No recovery cases found under category "{category}".
        </div>
      )}

      {/* Drawer */}
      <PaymentDrawer
        paymentId={selectedPaymentId}
        onClose={() => setSelectedPaymentId(null)}
        onRunWorkflow={(id) => onNavigateToObservatory(id)}
      />

    </div>
  );
};
