import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/SignIn';
import UserType from './pages/UserType';
import EVOwnerInfoPage from './pages/EVOwnerInfo';
import ProviderInfoPage from './pages/ProviderInfo';
import ProviderDashboard from './pages/Provider_Dashboard';
import Dashboard from './pages/Dashboard';
import { AuthProvider } from './context/AuthContext';

function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
          <Route path="/sign-in" element={<SignInPage isDarkMode={isDarkMode} />} />
          <Route path="/user-type" element={<UserType isDarkMode={isDarkMode} />} />
          <Route path="/ev-user-signup" element={<EVOwnerInfoPage isDarkMode={isDarkMode} />} />
          <Route path="/provider-info" element={<ProviderInfoPage isDarkMode={isDarkMode} />} />
          <Route path="/Provider_Dashboard" element={<ProviderDashboard isDarkMode={isDarkMode} />} />
          <Route path="/Dashboard" element={<Dashboard isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;