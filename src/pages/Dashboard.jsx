import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/api/client";
import { WhatsAppInstance } from "@/entities/WhatsAppInstance";
import { Alert } from "@/entities/Alert";
import { FinancialTransaction } from "@/entities/FinancialTransaction"; // Import here
import { Smartphone, Users, DollarSign, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

import MetricCard from "../components/dashboard/MetricCard";
import InstancesOverview from "../components/dashboard/InstancesOverview";
import RecentActivity from "../components/dashboard/RecentActivity";
import RecentTransactions from "../components/dashboard/RecentTransactions"; // Import here
import AlertsWidget from "../components/dashboard/AlertsWidget";
import AccountBalance from "../components/dashboard/AccountBalance";

export default function Dashboard() {
  const { currentOrganization } = useAuth();
  const [stats, setStats] = useState({
    instances: 0,
    activeInstances: 0,
    users: 0,
    transactions: 0,
    alerts: 0,
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [instances, setInstances] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]); // State for transactions

  useEffect(() => {
    if (currentOrganization) {
      loadDashboardData();
    }
  }, [currentOrganization]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch Analytics Summary
      const analyticsRes = await api.get('/analytics/summary');
      const analytics = analyticsRes.data;

      // Fetch other entities (Interceptor handles x-org-id)
      const [instancesData, allAlerts, transactionsList] = await Promise.all([
        WhatsAppInstance.list(),
        Alert.filter({ is_read: false }),
        FinancialTransaction.filter({ _sort: 'date', _order: 'desc', _limit: 10 }) // Fetch top 10 recent
      ]);

      const activeInstances = instancesData.filter(i => i.is_connected);
      
      // Sort and slice alerts
      const alertsData = allAlerts
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        .slice(0, 5);
        
      // Sort and slice transactions
      const txData = (Array.isArray(transactionsList) ? transactionsList : [])
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);

      setInstances(instancesData);
      setRecentAlerts(alertsData);
      setRecentTransactions(txData);
      
      setStats({
        instances: instancesData.length,
        activeInstances: activeInstances.length,
        users: analytics.memberCount || 0,
        transactions: analytics.transactionCount,
        alerts: alertsData.length,
        totalIncome: analytics.totalIncome,
        totalExpenses: analytics.totalExpense,
        balance: analytics.netIncome
      });

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentOrganization) {
    return <div className="p-8 flex justify-center">Please select an organization.</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Dashboard - {currentOrganization.name}
          </h1>
          <p className="text-slate-600">Visão geral financeira e operacional</p>
        </div>

        <AccountBalance 
          totalIncome={stats.totalIncome}
          totalExpenses={stats.totalExpenses}
          balance={stats.balance}
          isLoading={isLoading}
          users={[]} 
          selectedUser="all"
          onUserChange={() => {}}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Chatbots"
            value={stats.instances}
            subtitle={`${stats.activeInstances} ativos`}
            icon={Smartphone}
            iconColor="text-emerald-600"
            bgColor="bg-emerald-100"
            isLoading={isLoading}
          />
          <MetricCard
            title="Transações"
            value={stats.transactions}
            subtitle="No período"
            icon={DollarSign}
            iconColor="text-purple-600"
            bgColor="bg-purple-100"
            isLoading={isLoading}
          />
          <MetricCard
            title="Receita"
            value={`R$ ${stats.totalIncome.toFixed(2)}`}
            subtitle="Total entradas"
            icon={TrendingUp}
            iconColor="text-green-600"
            bgColor="bg-green-100"
            isLoading={isLoading}
          />
          <MetricCard
            title="Despesas"
            value={`R$ ${stats.totalExpenses.toFixed(2)}`}
            subtitle="Total saídas"
            icon={TrendingDown}
            iconColor="text-red-600"
            bgColor="bg-red-100"
            isLoading={isLoading}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <InstancesOverview instances={instances} isLoading={isLoading} onRefresh={loadDashboardData} />
            <RecentTransactions transactions={recentTransactions} isLoading={isLoading} />
          </div>

          <div className="space-y-6">
            <AlertsWidget alerts={recentAlerts} isLoading={isLoading} />
            <RecentActivity isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}