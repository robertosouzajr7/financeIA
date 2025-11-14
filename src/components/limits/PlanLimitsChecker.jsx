import { useState, useEffect } from "react";
import { Subscription } from "@/entities/Subscription";
import { WhatsAppInstance } from "@/entities/WhatsAppInstance";
import { Goal } from "@/entities/Goal";
import { Budget } from "@/entities/Budget";
import { Alert } from "@/entities/Alert";
import { FinancialTransaction } from "@/entities/FinancialTransaction";
import { AuthenticatedUser } from "@/entities/AuthenticatedUser";
import { User } from "@/entities/User";

// Cache global para evitar múltiplas requisições
let limitsCache = null;
let usageCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60000; // 1 minuto

export const usePlanLimits = () => {
  const [limits, setLimits] = useState(null);
  const [usage, setUsage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLimits();
  }, []);

  const loadLimits = async () => {
    try {
      // Usar cache se disponível e válido
      const now = Date.now();
      if (limitsCache && usageCache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
        setLimits(limitsCache);
        setUsage(usageCache);
        setIsLoading(false);
        return;
      }

      const user = await User.me();
      
      // Buscar assinatura do usuário
      const subscriptions = await Subscription.filter({ user_email: user.email });
      
      let planLimits;
      if (subscriptions.length === 0 || subscriptions[0].status !== 'active') {
        // Sem plano ativo - usar trial ou limites básicos
        planLimits = {
          chatbots: 1,
          goals: 2,
          budgets: 5,
          alerts: 5,
          transactions: 10,
          authorized_users: 2
        };
      } else {
        planLimits = subscriptions[0].limits;
      }

      // Buscar uso atual - usar Promise.allSettled para não falhar se uma entidade der erro
      const results = await Promise.allSettled([
        WhatsAppInstance.list(),
        Goal.list(),
        Budget.list(),
        Alert.list(),
        FinancialTransaction.list(),
        AuthenticatedUser.list()
      ]);

      const currentUsage = {
        chatbots: results[0].status === 'fulfilled' ? results[0].value.length : 0,
        goals: results[1].status === 'fulfilled' ? results[1].value.length : 0,
        budgets: results[2].status === 'fulfilled' ? results[2].value.length : 0,
        alerts: results[3].status === 'fulfilled' ? results[3].value.length : 0,
        transactions: results[4].status === 'fulfilled' ? results[4].value.length : 0,
        authorized_users: results[5].status === 'fulfilled' ? results[5].value.length : 0
      };

      // Atualizar cache
      limitsCache = planLimits;
      usageCache = currentUsage;
      cacheTimestamp = Date.now();

      setLimits(planLimits);
      setUsage(currentUsage);
    } catch (error) {
      console.error("Erro ao carregar limites:", error);
      // Definir limites padrão em caso de erro
      const defaultLimits = {
        chatbots: 1,
        goals: 2,
        budgets: 5,
        alerts: 5,
        transactions: 10,
        authorized_users: 2
      };
      const defaultUsage = {
        chatbots: 0,
        goals: 0,
        budgets: 0,
        alerts: 0,
        transactions: 0,
        authorized_users: 0
      };
      
      setLimits(defaultLimits);
      setUsage(defaultUsage);
    }
    setIsLoading(false);
  };

  const canCreate = (resource) => {
    if (!limits || !usage) return false;
    return usage[resource] < limits[resource];
  };

  const getUsagePercentage = (resource) => {
    if (!limits || !usage) return 0;
    return Math.round((usage[resource] / limits[resource]) * 100);
  };

  const refresh = () => {
    // Limpar cache e recarregar
    limitsCache = null;
    usageCache = null;
    cacheTimestamp = null;
    loadLimits();
  };

  return {
    limits,
    usage,
    isLoading,
    canCreate,
    getUsagePercentage,
    refresh
  };
};