import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css'; 

// Import AdminDashboard từ file bạn đã tạo
import { AdminDashboard, AuthProvider } from './Pages/AdminDashboard/AdminDashboard';
import AdminLoginPage from './Pages/AdminLogin/AdminLoginPage'; 
import { ToastContainer } from 'react-toastify';
import InvitationDesign from './Pages/InvitationDesign/InvitationDesign'
import InvitationPreviewPage from './Pages/InvitationPreview/InvitationPreviewPage'
import MaintenancePage from './Pages/Maintenance/MaintenancePage'

function App() {
  const MAINTENANCE_MODE = false; 

  if (MAINTENANCE_MODE) {
    return <MaintenancePage />;
  }
  return (
    <>
       <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <AuthProvider>
        <Routes>
          <Route path="/login-admin" element={<AdminLoginPage />} />
          
          <Route path="/dashboard/*" element={<AdminDashboard />} />

          <Route path="canvas/edit/:invitationId" element={<InvitationDesign />} />
          
          <Route path="/dashboard/templates/design/:templateId" element={<InvitationDesign />} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/template/preview" element={<InvitationPreviewPage />} /> {/* Thêm route này */}
        </Routes>
      </AuthProvider>
    </>
  );
}

export default App;
