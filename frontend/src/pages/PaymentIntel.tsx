import { useState, useEffect } from 'react';
import { Search, RefreshCw, Eye } from 'lucide-react';
import { PaymentDrawer } from '../components/PaymentDrawer';

export const PaymentIntel: React.FC<{ onNavigateToObservatory: (id: string) => void }> = ({ onNavigateToObservatory }) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let url = `http://127.0.0.1:8000/api/payments?limit=50&status=${statusFilter}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchPayments, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payment Intelligence</h1>
          <p className="text-xs text-slate-500 mt-1">
            Directory of transaction events with ML-calculated recovery likelihood & recommended intervention actions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPayments}
            className="btn-secondary text-xs py-2 px-3"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 bg-white flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payment ID, customer name or email..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 transition-all"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {['ALL', 'FAILED', 'RECOVERED', 'ABANDONED', 'ESCALATED'].map((cat) => (
            <button
              key={cat}
              onClick={() => setStatusFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === cat
                  ? 'bg-[#7C3AED] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Transactions Table */}
      <div className="glass-card bg-white overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500">Querying Payment Intelligence Database...</p>
          </div>
        ) : payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Failure Reason</th>
                  <th>Recovery Prob</th>
                  <th>AI Action</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  let statusBadge = 'badge-danger';
                  if (p.status === 'RECOVERED') statusBadge = 'badge-success';
                  if (p.status === 'ABANDONED') statusBadge = 'badge-warning';
                  if (p.status === 'ESCALATED') statusBadge = 'badge-violet';

                  const prob = p.recovery_probability || 75;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      
                      <td className="font-mono text-xs font-bold text-slate-900">
                        #{p.id}
                      </td>

                      <td>
                        <div className="font-semibold text-slate-900 text-xs">{p.customer_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{p.customer_email}</div>
                      </td>

                      <td className="font-extrabold text-slate-900 text-xs">
                        ₹{p.amount.toLocaleString()}
                      </td>

                      <td>
                        <span className={`badge ${statusBadge}`}>
                          {p.status}
                        </span>
                      </td>

                      <td>
                        <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {p.failure_reason}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                prob >= 70 ? 'bg-emerald-500' : prob >= 45 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${prob}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-900">{prob.toFixed(0)}%</span>
                        </div>
                      </td>

                      <td>
                        <span className="badge badge-info text-[10px]">
                          {p.recommended_action || 'RETRY'}
                        </span>
                      </td>

                      <td>
                        <button
                          onClick={() => setSelectedPaymentId(p.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-purple-700 hover:bg-[#7C3AED] hover:text-white transition-all text-xs font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 text-xs">
            No payments matched your query parameters.
          </div>
        )}
      </div>

      {/* Payment Slide-over Drawer */}
      <PaymentDrawer
        paymentId={selectedPaymentId}
        onClose={() => setSelectedPaymentId(null)}
        onRunWorkflow={(id) => onNavigateToObservatory(id)}
      />

    </div>
  );
};
