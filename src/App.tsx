import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignInPage from './pages/SignIn';
import UserType from './pages/UserType';
import ProviderTypePage from './pages/ProviderType';
import ProviderInfoPage from './pages/ProviderInfo';
import EVOwnerInfoPage from './pages/EVOwnerInfo';
import Dashboard from './pages/Dashboard';
import ProviderDashboard from './pages/Provider_Dashboard'; // Import ProviderDashboard
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import 'leaflet/dist/leaflet.css';
import './App.css';

const App = () => (
  <AuthProvider>
    <Router>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />

        <Route
          path="/user-type"
          element={
            <ProtectedRoute>
              <UserType />
            </ProtectedRoute>
          }
        />

        <Route
          path="/provider-type"
          element={
            <ProtectedRoute>
              <ProviderTypePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/provider-info"
          element={
            <ProtectedRoute>
              <ProviderInfoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ev-owner-info"
          element={
            <ProtectedRoute>
              <EVOwnerInfoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/Provider_Dashboard"
          element={
            <ProtectedRoute>
              <ProviderDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/sign-in" />} />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;