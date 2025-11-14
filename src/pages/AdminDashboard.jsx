import { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Subscription } from "@/entities/Subscription";
import { FinancialTransaction } from "@/entities/FinancialTransaction";
import { WhatsAppInstance } from "@/entities/WhatsAppInstance";
import { SupportTicket } from "@/entities/SupportTicket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, TrendingUp, Ticket, Crown, Smartphone } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { subMonths, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    mrr: 0,
    openTickets: 0,
    totalInstances: 0,
    totalTransactions: 0
  });
  const [mrrData, setMrrData] = useState([]);
  const [planDistribution, setPlanDistribution] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const user = await User.me();
      if (user.role !== 'admin') {
        alert("Acesso negado. Apenas administradores podem acessar esta página.");
        navigate(createPageUrl("Dashboard"));
        return;
      }
      setIsAdmin(true);
      loadAdminData();
    } catch (error) {
      console.error("Erro ao verificar acesso:", error);
      navigate(createPageUrl("Dashboard"));
    }
  };

  const loadAdminData = async () => {
    setIsLoading(true);

    try {
      const [users, subscriptions, tickets, instances, transactions] = await Promise.all([
        User.list(),
        Subscription.list(),
        SupportTicket.filter({ status: "open" }),
        WhatsAppInstance.list(),
        FinancialTransaction.list()
      ]);

      // Calcular MRR
      const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
      const mrr = activeSubscriptions.reduce((sum, sub) => {
        const price = sub.plan === 'basic' ? 49 : 149;
        return sum + price;
      }, 0);

      setStats({
        totalUsers: users.length,
        activeSubscriptions: activeSubscriptions.length,
        mrr: mrr,
        openTickets: tickets.length,
        totalInstances: instances.length,
        totalTransactions: transactions.length
      });

      // Dados de MRR dos últimos 6 meses
      const mrrByMonth = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthSubs = subscriptions.filter(s => {
          const created = new Date(s.created_date);
          return created.getMonth() === date.getMonth() && 
                 created.getFullYear() === date.getFullYear() &&
                 s.status === 'active';
        });
        
        const monthMrr = monthSubs.reduce((sum, sub) => {
          const price = sub.plan === 'basic' ? 49 : 149;
          return sum + price;
        }, 0);

        mrrByMonth.push({
          month: format(date, 'MMM'),
          mrr: monthMrr
        });
      }
      setMrrData(mrrByMonth);

      // Distribuição de planos
      const basicCount = activeSubscriptions.filter(s => s.plan === 'basic').length;
      const proCount = activeSubscriptions.filter(s => s.plan === 'pro').length;
      setPlanDistribution([
        { name: 'Básico', value: basicCount, color: '#3b82f6' },
        { name: 'Pro', value: proCount, color: '#10b981' }
      ]);

    } catch (error) {
      console.error("Erro ao carregar dados admin:", error);
    }

    setIsLoading(false);
  };

  if (!isAdmin) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Painel Administrativo
          </h1>
          <p className="text-slate-600">Visão geral do sistema SaaS</p>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium mb-1">MRR (Receita Mensal)</p>
                  {isLoading ? (
                    <Skeleton className="h-10 w-32 bg-white/20" />
                  ) : (
                    <p className="text-4xl font-bold text-white">
                      R$ {stats.mrr.toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-1">Usuários Totais</p>
                  {isLoading ? (
                    <Skeleton className="h-10 w-20" />
                  ) : (
                    <p className="text-4xl font-bold text-slate-900">{stats.totalUsers}</p>
                  )}
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-1">Assinaturas Ativas</p>
                  {isLoading ? (
                    <Skeleton className="h-10 w-20" />
                  ) : (
                    <p className="text-4xl font-bold text-slate-900">{stats.activeSubscriptions}</p>
                  )}
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Crown className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-1">Tickets Abertos</p>
                  {isLoading ? (
                    <Skeleton className="h-10 w-20" />
                  ) : (
                    <p className="text-4xl font-bold text-slate-900">{stats.openTickets}</p>
                  )}
                </div>
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Ticket className="w-8 h-8 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-1">Chatbots Ativos</p>
                  {isLoading ? (
                    <Skeleton className="h-10 w-20" />
                  ) : (
                    <p className="text-4xl font-bold text-slate-900">{stats.totalInstances}</p>
                  )}
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <Smartphone className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-1">Transações</p>
                  {isLoading ? (
                    <Skeleton className="h-10 w-20" />
                  ) : (
                    <p className="text-4xl font-bold text-slate-900">{stats.totalTransactions}</p>
                  )}
                </div>
                <div className="p-3 bg-indigo-100 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Evolução MRR (6 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mrrData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${value}`} />
                  <Line type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Distribuição de Planos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}