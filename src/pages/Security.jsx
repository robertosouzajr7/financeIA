
import { useState, useEffect } from "react";
import { AuthenticatedUser } from "@/entities/AuthenticatedUser";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Plus, Trash2, Key, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { usePlanLimits } from "../components/limits/PlanLimitsChecker";
import LimitWarning from "../components/limits/LimitWarning";

export default function Security() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({ user_name: "", user_phone: "", password: "" });

  const { limits, usage, canCreate } = usePlanLimits();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await AuthenticatedUser.list("-created_date");
    setUsers(data);
    setIsLoading(false);
  };

  const formatPhone = (phone) => {
    let cleaned = phone.replace(/\D/g, ''); // Remove non-digit characters
    // Ensure it starts with '55' if it's a Brazilian number and not already there
    if (cleaned.length > 0 && !cleaned.startsWith('55')) {
      if (cleaned.length === 11 || cleaned.length === 10) { // Assuming typical Brazilian numbers (DDD + 9/8 digits)
        cleaned = '55' + cleaned;
      }
    }
    return cleaned.slice(0, 12); // Max 12 digits (55 + DDD + 8/9 digits)
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setFormData({...formData, user_phone: formatted});
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!canCreate('authorized_users')) {
      alert('Você atingiu o limite de usuários autorizados do seu plano. Faça upgrade para continuar.');
      return;
    }

    if (formData.user_phone.length !== 12 || !formData.user_phone.startsWith('55')) {
      alert("Formato de telefone inválido. Use: 55 + DDD + número (ex: 557199999999) - 12 dígitos totais.");
      return;
    }

    // Criar hash simples da senha (em produção, use bcrypt no backend)
    const passwordHash = btoa(formData.password); // Base64 - APENAS PARA DEMO

    await AuthenticatedUser.create({
      user_name: formData.user_name,
      user_phone: formData.user_phone,
      password_hash: passwordHash,
      is_authenticated: false,
      conversation_started: false
    });

    setShowCreateDialog(false);
    setFormData({ user_name: "", user_phone: "", password: "" });
    loadUsers();
  };

  const handleDelete = async (userId) => {
    if (confirm("Tem certeza que deseja remover este usuário?")) {
      await AuthenticatedUser.delete(userId);
      loadUsers();
    }
  };

  const handleLogout = async (user) => {
    await AuthenticatedUser.update(user.id, {
      is_authenticated: false,
      authentication_expires: null,
      conversation_started: false
    });
    loadUsers();
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Shield className="w-8 h-8 text-emerald-600" />
              Segurança e Autenticação
            </h1>
            <p className="text-slate-600">
              Gerencie usuários autorizados a acessar dados financeiros via WhatsApp
              {usage && limits && (
                <span className="ml-2 text-sm">
                  ({usage.authorized_users}/{limits.authorized_users} usados)
                </span>
              )}
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Usuário Autorizado</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label>Nome do Usuário</Label>
                  <Input
                    placeholder="Ex: João Silva"
                    value={formData.user_name}
                    onChange={(e) => setFormData({...formData, user_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    placeholder="557199999999"
                    value={formData.user_phone}
                    onChange={handlePhoneChange}
                    required
                    maxLength={12}
                    type="tel"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Formato: 55 + DDD + número (12 dígitos). NÃO adicione o 9 extra inicial. Ex: 557199999999.
                  </p>
                </div>
                <div>
                  <Label>Senha de Acesso</Label>
                  <Input
                    type="password"
                    placeholder="Senha que o usuário usará no WhatsApp"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    O usuário precisará enviar esta senha no WhatsApp para acessar seus dados
                  </p>
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Criar Usuário
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {usage && limits && !canCreate('authorized_users') && (
          <LimitWarning
            resource="usuários autorizados"
            current={usage.authorized_users}
            limit={limits.authorized_users}
          />
        )}

        <Card className="border-none shadow-lg bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Como Funciona</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Usuário envia a palavra-chave <strong>"financeIA"</strong> para ativar o assistente</li>
                  <li>• Após ativação, precisa enviar senha para acessar dados financeiros</li>
                  <li>• A autenticação é válida por 24 horas</li>
                  <li>• Após 24h ou logout, precisa enviar "financeIA" novamente</li>
                  <li>• Use senhas fortes e únicas para cada usuário</li>
                  <li>• Para deslogar: enviar "sair" ou "logout"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {isLoading ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-6">Carregando...</CardContent>
            </Card>
          ) : users.length === 0 ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">Nenhum usuário autorizado</p>
                <p className="text-sm text-slate-500">Adicione usuários para permitir acesso aos dados financeiros</p>
              </CardContent>
            </Card>
          ) : (
            users.map((user) => {
              const isExpired = user.authentication_expires && new Date(user.authentication_expires) < new Date();
              const isActive = user.is_authenticated && !isExpired;

              return (
                <Card key={user.id} className="border-none shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isActive ? 'bg-emerald-100' : 'bg-slate-100'
                        }`}>
                          {isActive ? (
                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{user.user_name || user.user_phone}</p>
                          {user.user_name && <p className="text-sm text-slate-600">{user.user_phone}</p>}
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className={isActive ?
                              "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              "bg-slate-100 text-slate-600 border-slate-200"
                            }>
                              {isActive ? "Autenticado" : "Não autenticado"}
                            </Badge>
                            {user.last_authenticated && (
                              <Badge variant="outline" className="text-xs">
                                Último acesso: {format(new Date(user.last_authenticated), "dd/MM/yy HH:mm")}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLogout(user)}
                          >
                            <Key className="w-4 h-4 mr-2" />
                            Deslogar
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
