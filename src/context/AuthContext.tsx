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
  signUp: (email: string, password: string, name: string) => Promise<User>;
  signOut: () => void;
  setUserType: (type: 'provider' | 'user') => void;
  setProviderType: (type: 'commercial' | 'home') => void;
  switchUserMode: () => void;
  isAuthenticated: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

// Mock database for users (in a real app, this would be a backend API)
let usersDB: User[] = [
  {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    userType: 'user',
    vehicle: 'Tesla Model 3'
  },
  {
    id: '2',
    email: 'provider@example.com',
    name: 'Test Provider',
    userType: 'provider',
    providerType: 'commercial',
    vehicle: 'Tesla Model S'
  }
];

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

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'provider' | 'user'>('user');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing user session on load
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      setActiveMode(JSON.parse(savedUser).userType);
    }
    setLoading(false);
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  // Sign in function
  const signIn = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    
    // In a real app, this would be an API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = usersDB.find(u => u.email === email);
        
        if (user) {
          setCurrentUser(user);
          setActiveMode(user.userType);
          setIsAuthenticated(true);
          setLoading(false);
          resolve(user);
        } else {
          setError('Invalid email or password');
          setLoading(false);
          reject(new Error('Invalid email or password'));
        }
      }, 1000);
    });
  };

  // Sign up function
  const signUp = async (email: string, password: string, name: string): Promise<User> => {
    setLoading(true);
    
    // In a real app, this would be an API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const existingUser = usersDB.find(u => u.email === email);
        
        if (existingUser) {
          setError('Email already in use');
          setLoading(false);
          reject(new Error('Email already in use'));
        } else {
          const newUser: User = {
            id: Date.now().toString(),
            email,
            name,
            userType: 'user' // Default type, will be updated later
          };
          
          usersDB.push(newUser);
          setCurrentUser(newUser);
          setIsAuthenticated(true);
          setLoading(false);
          resolve(newUser);
        }
      }, 1000);
    });
  };

  // Sign out function
  const signOut = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };

  // Set user type
  const setUserType = (type: 'provider' | 'user') => {
    if (currentUser) {
      const updatedUser = { ...currentUser, userType: type };
      setCurrentUser(updatedUser);
      setActiveMode(type);
      
      // Update in the "database"
      usersDB = usersDB.map(user => 
        user.id === currentUser.id ? updatedUser : user
      );
    }
  };

  // Set provider type
  const setProviderType = (type: 'commercial' | 'home') => {
    if (currentUser) {
      const updatedUser = { ...currentUser, providerType: type };
      setCurrentUser(updatedUser);
      
      // Update in the "database"
      usersDB = usersDB.map(user => 
        user.id === currentUser.id ? updatedUser : user
      );
    }
  };

  // Switch between user and provider mode (for providers)
  const switchUserMode = () => {
    if (currentUser?.userType === 'provider') {
      setActiveMode(activeMode === 'provider' ? 'user' : 'provider');
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
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};