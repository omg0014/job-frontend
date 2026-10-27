import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { request, tokenStore, setUnauthorizedHandler } from '../api/client.js';
import { endpoints } from '../api/endpoints.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // `loading` covers the initial token check, so protected routes do not
  // redirect a signed-in user to /login during the first render.
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));
  const queryClient = useQueryClient();

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  // A 401 anywhere in the app drops the session exactly once.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      queryClient.clear();
    });
  }, [queryClient]);

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      if (!tokenStore.get()) {
        setLoading(false);
        return;
      }
      try {
        const data = await request(endpoints.auth.me);
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) tokenStore.clear();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await request(endpoints.auth.login, credentials);
    tokenStore.set(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (details) => {
    const data = await request(endpoints.auth.register, details);
    tokenStore.set(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await request(endpoints.auth.logout);
    } catch {
      // Signing out locally must succeed even if the call fails.
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      isCandidate: user?.role === 'candidate',
    }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
};
