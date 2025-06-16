import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignInPage from './pages/SignIn';
import UserType from './pages/UserType';
import EVOwnerInfoPage from './pages/EVOwnerInfo';
import ProviderInfoPage from './pages/ProviderInfo';
import ProviderDashboard from './pages/Provider_Dashboard';
import Dashboard from './pages/Dashboard'; // New import
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/user-type" element={<UserType />} />
          <Route path="/ev-user-signup" element={<EVOwnerInfoPage />} />
          <Route path="/provider-info" element={<ProviderInfoPage />} />
          <Route path="/Provider_Dashboard" element={<ProviderDashboard />} />
          <Route path="/Dashboard" element={<Dashboard />} /> {/* New route */}
          <Route path="/" element={<SignInPage />} /> {/* Default route */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;