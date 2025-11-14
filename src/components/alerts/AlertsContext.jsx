import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Alert as AlertEntity } from '@/entities/Alert';
import { User } from '@/entities/User';

const AlertsContext = createContext();

export const AlertsProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLandingPage, setIsLandingPage] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    // Verificar se é landing page
    if (typeof window !== 'undefined' && window.location.pathname.includes('Landing')) {
      setIsLandingPage(true);
      setIsAuthenticated(false);
      setUnreadCount(0);
      return;
    }

    try {
      const user = await User.me();
      if (!user) {
        setIsAuthenticated(false);
        setUnreadCount(0);
        return;
      }

      setIsAuthenticated(true);

      const unreadAlerts = await AlertEntity.filter({ is_read: false });
      setUnreadCount(unreadAlerts.length);
    } catch (error) {
      console.log("Erro ao buscar alertas:", error.message);
      setIsAuthenticated(false);
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    // Não buscar alertas na landing page
    if (typeof window !== 'undefined' && window.location.pathname.includes('Landing')) {
      return;
    }

    fetchUnreadCount();
    
    // Polling reduzido para 2 minutos (120 segundos)
    const intervalId = setInterval(() => {
      if (isAuthenticated && !isLandingPage) {
        fetchUnreadCount();
      }
    }, 120000);

    return () => clearInterval(intervalId);
  }, [fetchUnreadCount, isAuthenticated, isLandingPage]);

  const value = { unreadCount, fetchUnreadCount };

  return (
    <AlertsContext.Provider value={value}>
      {children}
    </AlertsContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error('useAlerts must be used within AlertsProvider');
  }
  return context;
};