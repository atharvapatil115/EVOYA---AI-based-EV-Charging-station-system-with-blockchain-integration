import React, { createContext, useContext, useState, useEffect } from 'react';

// Define types for user data
interface User {
  id: string;
  email: string;
  name?: string;
  userType: 'provider' | 'user';
  providerType?: 'commercial' | 'home';
  vehicle?: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (
    email: string,
    password: string,
    name: string,
    userType: 'provider' | 'user',
    extraData: any
  ) => Promise<User>;
  signOut: () => Promise<void>;
  setUserType: (type: 'provider' | 'user') => Promise<void>;
  setProviderType: (type: 'commercial' | 'home') => Promise<void>;
  switchUserMode: () => void;
  isAuthenticated: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation (at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'provider' | 'user'>('user');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing user session on load
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/current-user`, {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          const user = await response.json();
          setCurrentUser({
            id: user.user_id,
            email: user.email || '',
            name: user.name,
            userType: user.userType,
          });
          setIsAuthenticated(true);
          setActiveMode(user.userType);
          console.log('Loaded currentUser from API:', { ...user, password: '****' });
        } else {
          console.log('No active session found');
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        setError('Failed to fetch current user');
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    setError(null);

    // Validate email format
    if (!emailRegex.test(email)) {
      setLoading(false);
      setError('Invalid email format');
      console.log('Email validation failed:', email);
      throw new Error('Invalid email format');
    }

    console.log('Sign-in attempt with email:', email);

    try {
      const response = await fetch(`${API_BASE_URL}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Sign-in successful for:', email);
        const user = {
          id: data.user_id,
          email,
          name: data.name,
          userType: data.userType,
        };
        setCurrentUser(user);
        setActiveMode(data.userType);
        setIsAuthenticated(true);
        setLoading(false);
        return user;
      } else {
        console.log('Sign-in failed:', data.error);
        setError(data.error || 'Authentication failed');
        setLoading(false);
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Error during sign-in:', error);
      setError('Failed to sign in. Please check your connection or try again.');
      setLoading(false);
      throw error;
    }
  };

  // Sign up function
  const signUp = async (
    email: string,
    password: string,
    name: string,
    userType: 'provider' | 'user',
    extraData: any
  ): Promise<User> => {
    setLoading(true);
    setError(null);

    // Validate email format
    if (!emailRegex.test(email)) {
      setLoading(false);
      setError('Invalid email format');
      console.log('Email validation failed:', email);
      throw new Error('Invalid email format');
    }

    // Validate password strength
    if (!passwordRegex.test(password)) {
      setLoading(false);
      setError(
        'Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character'
      );
      console.log('Password validation failed:', password);
      throw new Error('Password does not meet requirements');
    }

    try {
      const endpoint = userType === 'provider' ? '/stations' : '/users';
      const payload = {
        email,
        password,
        name,
        userType,
        ...extraData,
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Sign-up successful for:', email);
        const user = {
          id: userType === 'provider' ? data.provider_id : data.user_id,
          email,
          name,
          userType,
        };
        setCurrentUser(user);
        setIsAuthenticated(true);
        setActiveMode(userType);
        setLoading(false);
        return user;
      } else {
        console.log('Sign-up failed:', data.error);
        setError(data.error || 'Registration failed');
        setLoading(false);
        throw new Error(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Error during sign-up:', error);
      setError('Failed to sign up. Please check your connection or try again.');
      setLoading(false);
      throw error;
    }
  };

  // Sign out function
  const signOut = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/signout`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        console.log('User signed out via API');
      } else {
        console.error('Sign-out failed:', await response.json());
      }
    } catch (error) {
      console.error('Error during sign-out:', error);
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveMode('user');
  };

  // Set user type
  const setUserType = async (type: 'provider' | 'user'): Promise<void> => {
    if (currentUser) {
      try {
        const response = await fetch(`${API_BASE_URL}/update-user-type`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userId: currentUser.id, userType: type }),
        });
        if (response.ok) {
          const updatedUser = { ...currentUser, userType: type };
          setCurrentUser(updatedUser);
          setActiveMode(type);
          console.log('User type updated via API:', { email: currentUser.email, userType: type });
        } else {
          console.error('Failed to update user type:', await response.json());
          setError('Failed to update user type');
        }
      } catch (error) {
        console.error('Error updating user type:', error);
        setError('Failed to update user type. Please check your connection.');
      }
    }
  };

  // Set provider type
  const setProviderType = async (type: 'commercial' | 'home'): Promise<void> => {
    if (currentUser) {
      try {
        const response = await fetch(`${API_BASE_URL}/update-provider-type`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userId: currentUser.id, providerType: type }),
        });
        if (response.ok) {
          const updatedUser = { ...currentUser, providerType: type };
          setCurrentUser(updatedUser);
          console.log('Provider type updated via API:', { email: currentUser.email, providerType: type });
        } else {
          console.error('Failed to update provider type:', await response.json());
          setError('Failed to update provider type');
        }
      } catch (error) {
        console.error('Error updating provider type:', error);
        setError('Failed to update provider type. Please check your connection.');
      }
    }
  };

  // Switch between user and provider mode
  const switchUserMode = () => {
    if (currentUser?.userType === 'provider') {
      setActiveMode(activeMode === 'provider' ? 'user' : 'provider');
      console.log('Switched mode to:', activeMode === 'provider' ? 'user' : 'provider');
    }
  };

  const value = {
    currentUser,
    loading,
    signIn,
    signUp,
    signOut,
    setUserType,
    setProviderType,
    switchUserMode,
    isAuthenticated,
    error,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};