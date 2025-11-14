import { useState, useEffect } from "react";
import { WhatsAppInstance } from "@/entities/WhatsAppInstance";
import { FinancialTransaction } from "@/entities/FinancialTransaction";
import { Alert } from "@/entities/Alert";
import { Smartphone, Users, DollarSign, AlertCircle } from "lucide-react";

import MetricCard from "../components/dashboard/MetricCard";
import InstancesOverview from "../components/dashboard/InstancesOverview";
import RecentActivity from "../components/dashboard/RecentActivity";
import AlertsWidget from "../components/dashboard/AlertsWidget";
import AccountBalance from "../components/dashboard/AccountBalance";

export default function Dashboard() {
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
  const [allTransactions, setAllTransactions] = useState([]);
  const [userPhones, setUserPhones] = useState([]);
  const [selectedUser, setSelectedUser] = useState("all");

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (allTransactions.length > 0) {
      calculateStats();
    }
  }, [selectedUser, allTransactions]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    
    const [instancesData, transactionsData, alertsData] = await Promise.all([
      WhatsAppInstance.list(),
      FinancialTransaction.list(),
      Alert.filter({ is_read: false }, "-created_date", 5)
    ]);

    const activeInstances = instancesData.filter(i => i.is_connected);
    const uniqueUsers = [...new Set(transactionsData.map(t => t.user_phone))];

    setInstances(instancesData);
    setRecentAlerts(alertsData);
    setAllTransactions(transactionsData);
    setUserPhones(uniqueUsers);
    
    setIsLoading(false);
  };

  const calculateStats = () => {
    const filteredTransactions = selectedUser === "all" 
      ? allTransactions 
      : allTransactions.filter(t => t.user_phone === selectedUser);

    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    setStats({
      instances: instances.length,
      activeInstances: instances.filter(i => i.is_connected).length,
      users: userPhones.length,
      transactions: filteredTransactions.length,
      alerts: recentAlerts.length,
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses
    });
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">Visão geral do sistema FinanceIA</p>
        </div>

        <AccountBalance 
          totalIncome={stats.totalIncome}
          totalExpenses={stats.totalExpenses}
          balance={stats.balance}
          isLoading={isLoading}
          users={userPhones}
          selectedUser={selectedUser}
          onUserChange={setSelectedUser}
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
            title="Membros Ativos"
            value={stats.users}
            subtitle="Usuários únicos"
            icon={Users}
            iconColor="text-blue-600"
            bgColor="bg-blue-100"
            isLoading={isLoading}
          />
          <MetricCard
            title="Transações"
            value={stats.transactions}
            subtitle="Total registradas"
            icon={DollarSign}
            iconColor="text-purple-600"
            bgColor="bg-purple-100"
            isLoading={isLoading}
          />
          <MetricCard
            title="Alertas"
            value={stats.alerts}
            subtitle="Não lidos"
            icon={AlertCircle}
            iconColor="text-amber-600"
            bgColor="bg-amber-100"
            isLoading={isLoading}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <InstancesOverview instances={instances} isLoading={isLoading} onRefresh={loadDashboardData} />
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