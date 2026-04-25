import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './components/Auth/LandingPage';
import HomePage from './components/Landing/HomePage';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import PatientDashboard from './components/Patient/PatientDashboard';
import DoctorDashboard from './components/Doctor/DoctorDashboard';
import StaffDashboard from './components/Staff/StaffDashboard';
import PharmacyDashboard from './components/Pharmacy/PharmacyDashboard';
import LaboratoryDashboard from './components/Laboratory/LaboratoryDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import ClaimVerification from './components/Shared/ClaimVerification';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Landing Pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/old-landing" element={<LandingPage />} />
          <Route path="/verify-claim" element={<ClaimVerification />} />
          <Route path="/verify-claim/:ref" element={<ClaimVerification />} />

          {/* Unified Auth Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Forgot Password */}
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes by Role */}
          <Route
            path="/patient/*"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/*"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff/*"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pharmacy/*"
            element={
              <ProtectedRoute allowedRoles={['pharmacy']}>
                <PharmacyDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/laboratory/*"
            element={
              <ProtectedRoute allowedRoles={['laboratory']}>
                <LaboratoryDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Unauthorized Page */}
          <Route
            path="/unauthorized"
            element={
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <h1>Unauthorized</h1>
                <p>You don't have permission to access this page.</p>
                <a href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Go to Home</a>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
