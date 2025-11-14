import { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Subscription } from "@/entities/Subscription";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Crown, DollarSign, Calendar, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    try {
      const currentUser = await User.me();
      if (currentUser.role !== 'admin') {
        alert("Acesso negado");
        navigate(createPageUrl("Dashboard"));
        return;
      }
      loadData();
    } catch (error) {
      navigate(createPageUrl("Dashboard"));
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    const data = await Subscription.list("-created_date");
    setSubscriptions(data);
    setIsLoading(false);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: 'Ativa', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700', icon: XCircle },
      past_due: { label: 'Vencida', color: 'bg-amber-100 text-amber-700', icon: XCircle },
      trialing: { label: 'Trial', color: 'bg-blue-100 text-blue-700', icon: CheckCircle }
    };
    const config = statusMap[status] || statusMap.trialing;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPlanPrice = (plan) => {
    return plan === 'pro' ? 'R$ 149/mês' : 'R$ 49/mês';
  };

  const filteredSubs = subscriptions.filter(sub => 
    sub.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMRR = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, sub) => {
      const price = sub.plan === 'basic' ? 49 : 149;
      return sum + price;
    }, 0);

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gerenciamento de Assinaturas</h1>
          <p className="text-slate-600">Visualize todas as assinaturas e receita recorrente</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium mb-1">MRR Total</p>
                  <p className="text-3xl font-bold text-white">
                    R$ {totalMRR.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-1">Assinaturas Ativas</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {subscriptions.filter(s => s.status === 'active').length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-1">Planos Pro</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {subscriptions.filter(s => s.plan === 'pro' && s.status === 'active').length}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Crown className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar por email..."
            className="pl-10 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Início</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredSubs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      Nenhuma assinatura encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubs.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.user_email}</TableCell>
                      <TableCell>
                        <Badge className={sub.plan === 'pro' ? 
                          'bg-emerald-100 text-emerald-700' : 
                          'bg-blue-100 text-blue-700'
                        }>
                          <Crown className="w-3 h-3 mr-1" />
                          {sub.plan === 'pro' ? 'Pro' : 'Básico'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {getPlanPrice(sub.plan)}
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(sub.created_date), 'dd/MM/yyyy')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}