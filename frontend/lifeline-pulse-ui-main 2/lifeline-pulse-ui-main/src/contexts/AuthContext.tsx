import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/integrations/firebase/config';
import { UserData, getCurrentUserData, signInUser, signUpUser, signOutUser } from '@/integrations/firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserData>;
  signUp: (email: string, password: string, role: 'patient' | 'family' | 'responder', displayName?: string) => Promise<UserData>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const signIn = async (email: string, password: string): Promise<UserData> => {
    const userData = await signInUser(email, password);
    setUserData(userData);
    return userData;
  };

  const signUp = async (
    email: string, 
    password: string, 
    role: 'patient' | 'family' | 'responder', 
    displayName?: string
  ): Promise<UserData> => {
    const userData = await signUpUser(email, password, role, displayName);
    setUserData(userData);
    return userData;
  };

  const logout = async (): Promise<void> => {
    await signOutUser();
    setUserData(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Get user data from Firestore
        const userData = await getCurrentUserData();
        setUserData(userData);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    signIn,
    signUp,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
