import React from 'react';
import { LayoutDashboard, CreditCard, Activity, Briefcase, ShieldCheck, LogOut, Zap } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const navItems = [
    { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
    { id: 'payments', label: 'Payment Intelligence', icon: CreditCard },
    { id: 'observatory', label: 'Agent Observatory', icon: Activity, badge: 'LIVE' },
    { id: 'cases', label: 'Recovery Cases', icon: Briefcase },
    { id: 'audit', label: 'Audit & Guardrails', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('command-center')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#0EA5E9] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">Recover<span className="text-[#7C3AED]">AI</span></span>
              <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded">v2.4</span>
            </div>
            <p className="text-[11px] text-slate-500 tracking-wider uppercase font-medium">Payment Intelligence & Recovery</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#7C3AED] text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-1 text-[9px] bg-purple-200 text-purple-800 px-1 py-0.2 rounded font-mono font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User / Agent Status */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
            <span className="text-xs font-semibold text-purple-800">Razorpay Test Mode</span>
          </div>

          <button
            onClick={onLogout}
            title="Logout of Control Center"
            className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
