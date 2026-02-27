import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '@/api/client';
import { getCurrentOrganizationRole } from '@/lib/organizationRole';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({});
  const [currentOrganization, setCurrentOrganization] = useState(null);

  useEffect(() => {
    checkUserAuth();
  }, []);

  // Setup Axios Interceptor to inject Organization ID
  useEffect(() => {
    const interceptor = api.interceptors.request.use((config) => {
      if (currentOrganization) {
        config.headers['x-org-id'] = currentOrganization.id;
      }
      return config;
    }, (error) => {
      return Promise.reject(error);
    });

    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [currentOrganization]);

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      const userData = response.data;
      setUser(userData);
      setIsAuthenticated(true);

      // Set default organization if not set
      if (userData.organizations && userData.organizations.length > 0) {
        const savedOrgId = localStorage.getItem('current_org_id');
        // userData.organizations is OrganizationMember[], so we look at member.organization.id
        const savedMember = userData.organizations.find(m => m.organization.id === savedOrgId);
        
        if (savedMember) {
          setCurrentOrganization(savedMember.organization);
        } else {
          // Default to first organization
          const firstOrg = userData.organizations[0].organization;
          setCurrentOrganization(firstOrg);
          localStorage.setItem('current_org_id', firstOrg.id);
        }
      }

    } catch (error) {
      console.error('User auth check failed:', error);
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
      setAuthError({
        type: 'auth_required',
        message: 'Authentication required'
      });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const login = async (phone, password) => {
    try {
      const response = await api.post('/auth/login', { phone, password });
      const { token, user } = response.data;
      
      localStorage.setItem('auth_token', token);
      setUser(user);
      setIsAuthenticated(true);
      setAuthError(null);

      // Set initial organization
      if (user.organizations && user.organizations.length > 0) {
        const firstOrg = user.organizations[0].organization;
        setCurrentOrganization(firstOrg);
        localStorage.setItem('current_org_id', firstOrg.id);
      }

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setAuthError({
        type: 'login_failed',
        message: error.response?.data?.message || 'Login failed'
      });
      return false;
    }
  };

  const logout = (shouldRedirect = true) => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_org_id');
    setUser(null);
    setCurrentOrganization(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const switchOrganization = (orgId) => {
    if (!user || !user.organizations) return;
    // Find member by organization ID
    const member = user.organizations.find(m => m.organization.id === orgId);
    if (member) {
      setCurrentOrganization(member.organization);
      localStorage.setItem('current_org_id', member.organization.id);
      // Optional: Reload page or trigger data refresh
      window.location.reload(); 
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/Login';
  };

  const checkAppState = async () => {
      await checkUserAuth();
  };

  const currentOrganizationRole = getCurrentOrganizationRole(user, currentOrganization);
  const isCurrentOrgAdmin = currentOrganizationRole === 'ADMIN';
  const isCurrentOrgAdminOrOwner = currentOrganizationRole === 'ADMIN' || currentOrganizationRole === 'OWNER';

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      currentOrganization, // Exposed
      currentOrganizationRole,
      isCurrentOrgAdmin,
      isCurrentOrgAdminOrOwner,
      logout,
      login,
      switchOrganization, // Exposed
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
