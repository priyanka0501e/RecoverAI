import React, { useState } from 'react';
import { Zap, Lock, Mail, ShieldCheck, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('ops@recoverai.io');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      <div className="w-full max-w-md z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#0EA5E9] p-0.5 shadow-md mb-4">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
              <Zap className="w-8 h-8 text-[#7C3AED]" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Recover<span className="text-[#7C3AED]">AI</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Autonomous Revenue Recovery & Payment Intelligence Platform
          </p>
          <div className="mt-3 inline-flex items-center gap-2 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full text-xs font-semibold text-purple-700">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
            Razorpay Buildathon Track 3 Agent
          </div>
        </div>

        {/* Login Glass Card */}
        <div className="glass-card p-8 bg-white rounded-2xl border border-slate-200 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Merchant Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-purple-600 transition-all"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Control Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-purple-600 transition-all"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 justify-center text-sm font-bold tracking-wide mt-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating Agent Access...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Enter Control Center</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Bounded AI Agent Execution • Multi-Tenant Guardrails</span>
            </div>
          </div>

        </div>

        {/* Footnote */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Powered by LangGraph Workflow Orchestrator & Scikit-learn Risk Engine
        </p>

      </div>
    </div>
  );
};
