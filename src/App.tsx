import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import PortalThemeInjector from './components/PortalThemeInjector';

// Base Pages
import Login from './pages/Login';
import { useAuthStore } from './store/authStore';

// Billing Portal
import BillingLayout from './pages/billing/BillingLayout';
import BillingDashboard from './pages/billing/BillingDashboard';
import ReadyForBill from './pages/billing/ReadyForBill';
import GeneratedBills from './pages/billing/GeneratedBills';
import CustomerFulfillment from './pages/shared/CustomerFulfillment';
import BillCreate from './pages/billing/BillCreate';
import BillView from './pages/billing/BillView';


const RoleRedirect: React.FC = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'billing' || user.role === 'admin') {
    return <Navigate to="/billing/dashboard" replace />;
  }
  return <Navigate to="/unauthorized" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <PortalThemeInjector />
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)' },
        success: { iconTheme: { primary: 'var(--success)', secondary: 'white' } },
        error: { iconTheme: { primary: 'var(--danger)', secondary: 'white' } },
      }} />
      <Routes>
        <Route path="/" element={<RoleRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={
          <div className="empty-state" style={{ minHeight: '100vh' }}>
            <div className="empty-icon">🚫</div>
            <div className="empty-title">Access Denied</div>
            <div className="empty-text">You don't have permission to view this portal</div>
            <button onClick={() => window.location.href = '/'} className="btn btn-primary" style={{ marginTop: '1rem' }}>Return to Portal</button>
          </div>
        } />

        {/* Billing Portal */}
        <Route path="/billing" element={<BillingLayout />}>
          <Route path="" element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<BillingDashboard />} />
          <Route path="ready" element={<ReadyForBill />} />
          <Route path="generated" element={<GeneratedBills />} />
          <Route path="fulfillment" element={<CustomerFulfillment />} />
          <Route path="create/:orderId" element={<BillCreate />} />

          <Route path=":billId" element={<BillView />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
