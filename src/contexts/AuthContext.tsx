import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthData, getAuthData, saveAuthData, clearAuthData, isAuthenticated, decodeJWT } from '@/lib/auth';
import { authApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  authData: AuthData | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const data = getAuthData();
    if (data && isAuthenticated()) {
      setAuthData(data);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      const decoded = decodeJWT(response.access_token);
      
      if (!decoded) {
        throw new Error('Invalid token');
      }

      const authData: AuthData = {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        userId: response.user.id,
        clientId: decoded.client_ids,
        user: response.user,
      };

      saveAuthData(authData);
      setAuthData(authData);
      
      toast({
        title: 'Login successful',
        description: `Welcome back, ${response.user.first_name}!`,
      });
      
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Please check your credentials',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = () => {
    clearAuthData();
    setAuthData(null);
    navigate('/login');
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully',
    });
  };

  return (
    <AuthContext.Provider value={{ authData, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
