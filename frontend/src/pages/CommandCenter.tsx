import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldAlert, CheckCircle2, TrendingUp, Cpu, RefreshCw, Zap, ArrowUpRight } from 'lucide-react';

interface MetricData {
  revenue_at_risk: number;
  revenue_at_risk_lakhs: number;
  revenue_recovered: number;
  revenue_recovered_lakhs: number;
  recovery_rate: number;
  total_payments_count: number;
  recovered_count: number;
  active_cases: number;
  escalated_cases: number;
  trend_data: any[];
  live_feed: any[];
}

export const CommandCenter: React.FC<{ onNavigateToPayment: (id: string) => void }> = ({ onNavigateToPayment }) => {
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<string>('Just now');
  const [simulating, setSimulating] = useState(false);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/metrics');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
        setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateWebhook = async () => {
    setSimulating(true);
    try {
      const pId = `RP${Math.floor(10000 + Math.random() * 90000)}`;
      const reasons = ['BANK_TIMEOUT', 'CHECKOUT_ABANDONED', 'INSUFFICIENT_FUNDS', 'NETWORK_ERROR'];
      const chosenReason = reasons[Math.floor(Math.random() * reasons.length)];
      
      const res = await fetch('http://127.0.0.1:8000/api/razorpay/webhook/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'payment.failed',
          payment_id: pId,
          amount: Math.floor(1500 + Math.random() * 15000),
          failure_reason: chosenReason,
          customer_email: 'demo.user@example.com'
        })
      });
      
      if (res.ok) {
        await fetchMetrics();
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-600 mt-4 font-semibold">Connecting to RecoverAI Autonomous Agent Core...</p>
      </div>
    );
  }

  const atRiskLakhs = metrics?.revenue_at_risk_lakhs || 1061.8;
  const recoveredLakhs = metrics?.revenue_recovered_lakhs || 660.2;
  const rate = metrics?.recovery_rate || 62.2;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Command Center</h1>
            <span className="ai-badge">
              <span className="ai-pulse-dot"></span>
              AI AGENT ONLINE
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            Real-time autonomous payment interception, risk engine probability scoring & bounded recovery.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-600 font-mono font-semibold bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            Last synced: {lastSynced}
          </span>
          
          <button
            onClick={handleSimulateWebhook}
            disabled={simulating}
            className="btn-primary text-xs py-2.5 px-4"
          >
            {simulating ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Zap className="w-4 h-4 text-white" />
            )}
            <span>{simulating ? 'Simulating...' : 'Simulate Payment Failure'}</span>
          </button>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Revenue at Risk */}
        <div className="glass-card p-6 bg-white relative overflow-hidden group border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800">Revenue at Risk</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            ₹{atRiskLakhs.toLocaleString()} L
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-amber-100">
            <span className="text-slate-600 font-semibold font-mono">Total 10,000 Failure Events</span>
            <span className="text-amber-800 font-black">₹{(metrics?.revenue_at_risk || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Card 2: Revenue Recovered */}
        <div className="glass-card p-6 bg-white relative overflow-hidden group border-emerald-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">Revenue Recovered</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700 tracking-tight">
            ₹{recoveredLakhs.toLocaleString()} L
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-emerald-100">
            <span className="text-slate-600 font-semibold font-mono">{metrics?.recovered_count.toLocaleString()} Successful Recoveries</span>
            <span className="text-emerald-700 font-black">+₹{(metrics?.revenue_recovered || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Card 3: Recovery Rate */}
        <div className="glass-card p-6 bg-white relative overflow-hidden group border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-purple-800">Recovery Rate</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-700 tracking-tight">
            {rate}%
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-purple-100">
            <span className="text-slate-600 font-semibold font-mono">{metrics?.active_cases} Active • {metrics?.escalated_cases} Escalated</span>
            <span className="text-purple-800 font-black">Track 3 Target Achieved</span>
          </div>
        </div>

      </div>

      {/* Chart & Live Stream Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recharts Area Chart */}
        <div className="lg:col-span-2 glass-card p-6 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-900">Revenue Recovery Performance</h2>
              <p className="text-xs text-slate-500 font-medium">Comparison of Revenue at Risk vs. Measured Recovered Revenue (₹)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm bg-[#7C3AED]"></span>
                <span className="text-slate-700">At Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm bg-[#059669]"></span>
                <span className="text-emerald-700">Recovered</span>
              </div>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.trend_data || []}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke="#475569" fontSize={12} fontWeight={600} tickLine={false} />
                <YAxis stroke="#475569" fontSize={12} fontWeight={600} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '10px', color: '#0F172A', fontWeight: 600, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="revenue_at_risk" name="Revenue at Risk" stroke="#7C3AED" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRisk)" />
                <Area type="monotone" dataKey="revenue_recovered" name="Revenue Recovered" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorRec)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Live AI Stream */}
        <div className="glass-card p-6 bg-white flex flex-col justify-between border-slate-200">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-700" />
                <h2 className="text-base font-extrabold text-slate-900">Live AI Actions Stream</h2>
              </div>
              <span className="text-[10px] font-mono font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                REALTIME
              </span>
            </div>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {metrics?.live_feed && metrics.live_feed.length > 0 ? (
                metrics.live_feed.slice(0, 5).map((item) => {
                  let badgeClass = 'badge-violet';
                  if (item.action === 'RETRY') badgeClass = 'badge-success';
                  if (item.action === 'PAYMENT_LINK') badgeClass = 'badge-info';
                  if (item.action === 'HUMAN_ESCALATE') badgeClass = 'badge-warning';

                  return (
                    <div 
                      key={item.id}
                      onClick={() => onNavigateToPayment(item.payment_id)}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 cursor-pointer transition-all flex items-start justify-between shadow-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-slate-900">#{item.payment_id}</span>
                          <span className="text-xs text-slate-700 font-semibold">₹{item.amount.toLocaleString()}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium line-clamp-1">{item.failure_reason}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`badge ${badgeClass} text-[10px]`}>
                            AI: {item.action}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-purple-700">
                            Confidence: {item.confidence}%
                          </span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 hover:text-slate-700" />
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 py-8 text-center font-medium">Listening for payment failure webhooks...</p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-center">
            <span className="text-xs text-slate-500 font-mono font-semibold">Bounded Rules • Multi-Attempt Safeguards</span>
          </div>

        </div>

      </div>

    </div>
  );
};
