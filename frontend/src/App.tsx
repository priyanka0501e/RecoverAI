import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { CommandCenter } from './pages/CommandCenter';
import { PaymentIntel } from './pages/PaymentIntel';
import { AgentObservatory } from './pages/AgentObservatory';
import { RecoveryCases } from './pages/RecoveryCases';
import { AuditGuardrails } from './pages/AuditGuardrails';

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [activeTab, setActiveTab] = useState('command-center');
  const [targetObservatoryPaymentId, setTargetObservatoryPaymentId] = useState<string | undefined>(undefined);

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  const handleNavigateToObservatory = (paymentId: string) => {
    setTargetObservatoryPaymentId(paymentId);
    setActiveTab('observatory');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={() => setIsLoggedIn(false)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 pt-8">
        {activeTab === 'command-center' && (
          <CommandCenter onNavigateToPayment={handleNavigateToObservatory} />
        )}

        {activeTab === 'payments' && (
          <PaymentIntel onNavigateToObservatory={handleNavigateToObservatory} />
        )}

        {activeTab === 'observatory' && (
          <AgentObservatory initialPaymentId={targetObservatoryPaymentId} />
        )}

        {activeTab === 'cases' && (
          <RecoveryCases onNavigateToObservatory={handleNavigateToObservatory} />
        )}

        {activeTab === 'audit' && (
          <AuditGuardrails />
        )}
      </main>

    </div>
  );
}

export default App;
