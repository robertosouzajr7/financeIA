import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Check, X, Shield, Activity, CreditCard } from 'lucide-react';

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    interval: 'month',
    features: '', // Comma separated for simplicity in UI
    limits_instances: 1,
    limits_users: 1,
    limits_transactions: 100
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/plans');
      setPlans(res.data);
    } catch (error) {
      console.error("Error loading plans", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const featuresArray = formData.features.split(',').map(f => f.trim()).filter(f => f);
      const limitsObj = {
        max_instances: parseInt(formData.limits_instances),
        max_users: parseInt(formData.limits_users),
        max_transactions: parseInt(formData.limits_transactions)
      };

      await api.post('/plans', {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        interval: formData.interval,
        features: featuresArray,
        limits: limitsObj
      });

      setShowCreateDialog(false);
      setFormData({
        name: '', description: '', price: '', interval: 'month', features: '',
        limits_instances: 1, limits_users: 1, limits_transactions: 100
      });
      loadPlans();
      alert("Plano criado e sincronizado com Stripe!");
    } catch (error) {
      console.error("Error creating plan", error);
      alert("Erro ao criar plano: " + (error.response?.data?.error || error.message));
    }
  };

  const handleDeactivate = async (id) => {
    if (confirm("Tem certeza que deseja desativar este plano?")) {
        try {
            await api.delete(`/plans/${id}`);
            loadPlans();
        } catch (error) {
            alert("Erro ao desativar");
        }
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gerenciar Planos SaaS</h1>
          <p className="text-slate-600">Crie planos, defina limites e sincronize com Stripe</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Plano (Stripe + DB)</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nome do Plano</Label>
                    <Input id="name" placeholder="Ex: Enterprise" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input id="price" type="number" placeholder="99.90" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição Curta</Label>
                <Input id="description" placeholder="Para grandes empresas..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Intervalo</Label>
                    <select 
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.interval}
                        onChange={e => setFormData({...formData, interval: e.target.value})}
                    >
                        <option value="month">Mensal</option>
                        <option value="year">Anual</option>
                    </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Limites do Sistema (JSON)</Label>
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <Label className="text-xs text-slate-500">Max Instâncias Zap</Label>
                        <Input type="number" value={formData.limits_instances} onChange={e => setFormData({...formData, limits_instances: e.target.value})} />
                    </div>
                    <div>
                        <Label className="text-xs text-slate-500">Max Usuários</Label>
                        <Input type="number" value={formData.limits_users} onChange={e => setFormData({...formData, limits_users: e.target.value})} />
                    </div>
                    <div>
                        <Label className="text-xs text-slate-500">Max Transações/mês</Label>
                        <Input type="number" value={formData.limits_transactions} onChange={e => setFormData({...formData, limits_transactions: e.target.value})} />
                    </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Features (Visual - Lista separada por vírgula)</Label>
                <Input placeholder="Suporte VIP, IA Avançada, etc" value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} />
              </div>

              <Button type="submit" className="w-full bg-emerald-600">Criar Plano</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => {
            const limits = typeof plan.limits === 'string' ? JSON.parse(plan.limits || '{}') : plan.limits;
            
            return (
                <Card key={plan.id} className={`border-l-4 ${plan.is_active ? 'border-l-emerald-500' : 'border-l-slate-300 opacity-70'}`}>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    {plan.name}
                                    {!plan.is_active && <Badge variant="outline">Inativo</Badge>}
                                </CardTitle>
                                <p className="text-sm text-slate-500">{plan.description}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-bold">R$ {plan.price.toFixed(2)}</div>
                                <div className="text-xs text-slate-500 capitalize">/{plan.interval}</div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-3 rounded-md text-sm space-y-1">
                                <div className="font-semibold text-slate-700 mb-2 flex items-center"><Shield className="w-3 h-3 mr-1"/> Limites:</div>
                                <div className="flex justify-between"><span>WhatsApp:</span> <strong>{limits?.max_instances || '∞'}</strong></div>
                                <div className="flex justify-between"><span>Usuários:</span> <strong>{limits?.max_users || '∞'}</strong></div>
                                <div className="flex justify-between"><span>Transações:</span> <strong>{limits?.max_transactions || '∞'}</strong></div>
                            </div>
                            
                            <div className="text-xs text-slate-400 font-mono truncate">
                                Stripe ID: {plan.stripe_price_id || 'Não sincronizado'}
                            </div>

                            {plan.is_active && (
                                <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDeactivate(plan.id)}>
                                    <Trash2 className="w-3 h-3 mr-2" /> Desativar
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            );
        })}
      </div>
    </div>
  );
}
