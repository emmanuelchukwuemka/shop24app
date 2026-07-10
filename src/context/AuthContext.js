import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, setAuthToken } from '../services/api';

const TOKEN_KEY = 'shop24_auth_token';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true while restoring token on boot

  // On app start, restore saved token and fetch user
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (savedToken) {
          setAuthToken(savedToken);
          const userData = await api.getUser();
          setUser(userData);
        }
      } catch {
        // Token expired or invalid — clear it
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setAuthToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (email, password) => {
    const { user: userData, token } = await api.login({ email, password });
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(userData);
  };

  const register = async (name, email, password) => {
    const { user: userData, token } = await api.register({ name, email, password });
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(userData);
  };

  const logout = async () => {
    await api.logout();
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setUser(null);
  };

  // Applies a session whose token was already issued by the backend
  // (e.g. vendor registration, which creates the account server-side).
  const applySession = async (userData, token) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, applySession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
