import React, { createContext, useState, useEffect } from 'react';
import api, { getItemAsync, setItemAsync, deleteItemAsync } from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedToken = await getItemAsync('token');
      const storedRole = await getItemAsync('role');
      const storedName = await getItemAsync('userName');
      const storedCompanyId = await getItemAsync('companyId');

      if (storedToken) {
        setToken(storedToken);
        setRole(storedRole ? storedRole.toUpperCase() : 'EMPLOYEE');
        setUser(storedName || 'User');
        setCompanyId(storedCompanyId);
      }
    } catch (e) {
      console.error('Session load failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      const { token: jwtToken, role: userRole, name, companyId: cId } = res.data;

      const normRole = userRole ? userRole.toUpperCase() : 'EMPLOYEE';

      await setItemAsync('token', jwtToken);
      await setItemAsync('role', normRole);
      await setItemAsync('userName', name || 'User');
      if (cId) await setItemAsync('companyId', cId);

      setToken(jwtToken);
      setRole(normRole);
      setUser(name || 'User');
      setCompanyId(cId);

      return { success: true, role: normRole };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    await deleteItemAsync('token');
    await deleteItemAsync('role');
    await deleteItemAsync('userName');
    await deleteItemAsync('companyId');

    setToken(null);
    setRole(null);
    setUser(null);
    setCompanyId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        companyId,
        loading,
        isLoggedIn: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
