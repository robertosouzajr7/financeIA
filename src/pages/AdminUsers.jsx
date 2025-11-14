
import { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Subscription } from "@/entities/Subscription";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Crown, User as UserIcon, Mail, Calendar, Edit2, Check, X, RefreshCw } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [editingPlan, setEditingPlan] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
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
    const [usersData, subsData] = await Promise.all([
      User.list("-created_date"),
      Subscription.list()
    ]);
    setUsers(usersData);
    setSubscriptions(subsData);
    setIsLoading(false);
  };

  const getUserSubscription = (userEmail) => {
    return subscriptions.find(s => s.user_email === userEmail && s.status === 'active');
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await User.update(userId, { role: newRole });
      loadData();
    } catch (error) {
      console.error("Erro ao atualizar role:", error);
      alert("Erro ao atualizar permissão do usuário");
    }
  };

  const openPlanDialog = (user) => {
    const subscription = getUserSubscription(user.email);
    setEditingPlan(user);
    setSelectedPlan(subscription ? subscription.plan : 'none');
  };

  const handleSavePlan = async () => {
    if (!editingPlan || !selectedPlan) return;

    setIsSavingPlan(true);
    try {
      const existingSubs = subscriptions.filter(s => s.user_email === editingPlan.email);
      
      if (selectedPlan === 'none') {
        // Cancelar todas as assinaturas
        for (const sub of existingSubs) {
          await Subscription.update(sub.id, { status: 'cancelled' });
        }
        alert("Assinatura cancelada com sucesso!");
      } else {
        // Definir limites do plano
        const limits = selectedPlan === 'basic' ? {
          chatbots: 1,
          goals: 2,
          budgets: 5,
          alerts: 5,
          transactions: 10,
          authorized_users: 2
        } : {
          chatbots: 999999,
          goals: 999999,
          budgets: 999999,
          alerts: 999999,
          transactions: 999999,
          authorized_users: 999999
        };

        if (existingSubs.length > 0) {
          // Cancelar antigas e criar nova
          for (const sub of existingSubs) {
            await Subscription.update(sub.id, { status: 'cancelled' });
          }
        }

        // Criar nova subscription
        await Subscription.create({
          user_email: editingPlan.email,
          plan: selectedPlan,
          status: 'active',
          limits: limits,
          stripe_customer_id: null,
          stripe_subscription_id: null
        });

        alert(`Plano ${selectedPlan === 'basic' ? 'Básico' : 'Pro'} ativado com sucesso!`);
      }

      setEditingPlan(null);
      setSelectedPlan(null);
      loadData();
    } catch (error) {
      console.error("Erro ao atualizar plano:", error);
      alert("Erro ao atualizar plano do usuário");
    }
    setIsSavingPlan(false);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gerenciamento de Usuários</h1>
          <p className="text-slate-600">Visualize e gerencie todos os usuários do sistema</p>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar usuários..."
              className="pl-10 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-40 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="user">Usuários</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Permissão</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const subscription = getUserSubscription(user.email);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{user.full_name || 'Sem nome'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="w-4 h-4" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {subscription ? (
                              <Badge className={subscription.plan === 'pro' ? 
                                'bg-emerald-100 text-emerald-700' : 
                                'bg-blue-100 text-blue-700'
                              }>
                                <Crown className="w-3 h-3 mr-1" />
                                {subscription.plan === 'pro' ? 'Pro' : 'Básico'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-500">
                                Trial / Sem Plano
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openPlanDialog(user)}
                              className="h-7 px-2"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={user.role} 
                            onValueChange={(value) => handleRoleChange(user.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Usuário</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(user.created_date), 'dd/MM/yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPlanDialog(user)}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Editar Plano
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para editar plano */}
      <Dialog open={editingPlan !== null} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Plano do Usuário</DialogTitle>
            <DialogDescription>
              Defina manualmente o plano de <strong>{editingPlan?.email}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 mb-2">
                ℹ️ <strong>Atenção:</strong> Esta é uma alteração manual que substituirá qualquer assinatura do Stripe.
              </p>
              <p className="text-xs text-blue-700">
                Use para dar acesso gratuito, fazer upgrades manuais ou cancelar planos.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Selecione o Plano</label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4 text-red-500" />
                      <span>Sem Plano / Trial</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="basic">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-blue-500" />
                      <span>Plano Básico</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pro">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-emerald-500" />
                      <span>Plano Pro</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedPlan && selectedPlan !== 'none' && (
              <div className="bg-slate-50 rounded-lg p-4 border">
                <h4 className="font-semibold text-sm mb-2">
                  {selectedPlan === 'basic' ? '📦 Limites do Plano Básico' : '⚡ Limites do Plano Pro'}
                </h4>
                <ul className="text-sm space-y-1 text-slate-700">
                  {selectedPlan === 'basic' ? (
                    <>
                      <li>• 1 Chatbot WhatsApp</li>
                      <li>• 2 Metas</li>
                      <li>• 5 Orçamentos</li>
                      <li>• 5 Alertas</li>
                      <li>• 10 Transações/mês</li>
                      <li>• 2 Usuários autorizados</li>
                    </>
                  ) : (
                    <>
                      <li>• ✅ Chatbots ilimitados</li>
                      <li>• ✅ Metas ilimitadas</li>
                      <li>• ✅ Orçamentos ilimitados</li>
                      <li>• ✅ Alertas ilimitados</li>
                      <li>• ✅ Transações ilimitadas</li>
                      <li>• ✅ Usuários ilimitados</li>
                      <li>• ✅ Processamento de imagens (se ativado)</li>
                    </>
                  )}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingPlan(null)}
              disabled={isSavingPlan}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePlan}
              disabled={isSavingPlan || !selectedPlan}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSavingPlan ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar Alteração
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
