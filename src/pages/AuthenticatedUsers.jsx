import { useState, useEffect } from "react";
import { AuthenticatedUser } from "@/entities/AuthenticatedUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, CheckCircle, XCircle, Key, Trash2, RefreshCw } from "lucide-react";
import { format } from "date-fns";

// Função para formatar e validar telefone (sem o 9 extra)
const formatPhone = (phone) => {
  // Remove tudo exceto números
  let cleaned = phone.replace(/\D/g, '');
  
  // Se começar com 55, usar como está
  // Se não começar, adicionar 55
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  // Formato esperado: 55 + DDD (2 dígitos) + número (8 dígitos)
  // Total: 12 dígitos (5571XXXXXXXX)
  
  return cleaned.slice(0, 12); // Limitar a 12 dígitos
};

export default function AuthenticatedUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    user_name: "",
    user_phone: "",
    password: ""
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await AuthenticatedUser.list("-created_date");
    setUsers(data);
    setIsLoading(false);
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setFormData({...formData, user_phone: formatted});
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    // Validar formato do telefone
    if (formData.user_phone.length !== 12 || !formData.user_phone.startsWith('55')) {
      alert("Formato de telefone inválido. Use: 55 + DDD + número (ex: 557199999999)");
      return;
    }
    
    // Criar hash da senha (Base64 - em produção use bcrypt)
    const passwordHash = btoa(formData.password);
    
    await AuthenticatedUser.create({
      user_name: formData.user_name,
      user_phone: formData.user_phone,
      password_hash: passwordHash,
      is_authenticated: false,
      conversation_started: false
    });

    setFormData({ user_name: "", user_phone: "", password: "" });
    setShowCreateDialog(false);
    loadUsers();
  };

  const handleResetAuth = async (user) => {
    await AuthenticatedUser.update(user.id, {
      is_authenticated: false,
      conversation_started: false,
      authentication_expires: null
    });
    loadUsers();
  };

  const handleDelete = async (id) => {
    if (confirm("Tem certeza que deseja remover este usuário?")) {
      await AuthenticatedUser.delete(id);
      loadUsers();
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Usuários WhatsApp Autenticados</h1>
            <p className="text-slate-600">Gerencie os usuários que podem acessar o bot via WhatsApp</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user_name">Nome do Usuário</Label>
                  <Input
                    id="user_name"
                    placeholder="Ex: João Silva"
                    value={formData.user_name}
                    onChange={(e) => setFormData({...formData, user_name: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_phone">Telefone</Label>
                  <Input
                    id="user_phone"
                    placeholder="557199999999"
                    value={formData.user_phone}
                    onChange={handlePhoneChange}
                    required
                    maxLength={12}
                  />
                  <p className="text-xs text-slate-500">
                    Formato: 55 + DDD + número (12 dígitos)<br/>
                    Exemplo: 557199999999 (Salvador)<br/>
                    <strong>NÃO</strong> adicione o 9 extra antes do número
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha de Acesso</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Senha segura"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                  <p className="text-xs text-slate-500">O usuário usará esta senha para se autenticar no WhatsApp</p>
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Cadastrar Usuário
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <div className="flex justify-between items-center">
              <CardTitle>Usuários Cadastrados</CardTitle>
              <Button variant="outline" size="sm" onClick={loadUsers}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status Autenticação</TableHead>
                    <TableHead>Conversa Iniciada</TableHead>
                    <TableHead>Última Autenticação</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        Nenhum usuário cadastrado. Crie o primeiro usuário para permitir acesso ao bot.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => {
                      const isAuthValid = user.is_authenticated && 
                                         user.authentication_expires && 
                                         new Date(user.authentication_expires) > new Date();
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.user_name || "-"}</TableCell>
                          <TableCell>{user.user_phone}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              isAuthValid 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }>
                              {isAuthValid ? (
                                <><CheckCircle className="w-3 h-3 mr-1" /> Autenticado</>
                              ) : (
                                <><XCircle className="w-3 h-3 mr-1" /> Não Autenticado</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.conversation_started ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Sim
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                Não
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {user.last_authenticated 
                              ? format(new Date(user.last_authenticated), "dd/MM/yy HH:mm")
                              : "-"
                            }
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {user.authentication_expires && isAuthValid
                              ? format(new Date(user.authentication_expires), "dd/MM/yy HH:mm")
                              : "-"
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResetAuth(user)}
                              >
                                <Key className="w-3 h-3 mr-1" />
                                Resetar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDelete(user.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 mb-3">📱 Como Funciona o Sistema de Autenticação:</h3>
            <ol className="space-y-2 text-sm text-slate-700">
              <li><strong>1.</strong> Cadastre o nome e telefone do usuário (formato: 55 + DDD + número, SEM o 9 extra).</li>
              <li><strong>2.</strong> O usuário deve enviar a palavra-chave <code className="bg-blue-100 px-2 py-1 rounded">financeIA</code> no WhatsApp para iniciar a conversa.</li>
              <li><strong>3.</strong> O bot pedirá a senha cadastrada.</li>
              <li><strong>4.</strong> Após autenticação bem-sucedida, o usuário poderá usar o bot por 24 horas.</li>
              <li><strong>5.</strong> Para sair, basta enviar <code className="bg-blue-100 px-2 py-1 rounded">sair</code>.</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}