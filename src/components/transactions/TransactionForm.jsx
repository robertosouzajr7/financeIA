import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FinancialTransaction } from "@/entities/FinancialTransaction";
import { AuthenticatedUser } from "@/entities/AuthenticatedUser";
import { Budget } from "@/entities/Budget";
import { Alert } from "@/entities/Alert";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import { useAlerts } from "../alerts/AlertsContext";

const checkAndCreateBudgetAlert = async (transaction, fetchUnreadCount) => {
  if (transaction.type !== 'expense') {
    return;
  }

  const [budget] = await Budget.filter({
    user_phone: transaction.user_phone,
    category: transaction.category,
    is_active: true,
  });

  if (!budget) {
    return;
  }

  const monthTransactions = await FinancialTransaction.filter({
    user_phone: transaction.user_phone,
    category: transaction.category,
    type: 'expense',
  });

  const totalSpent = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
  const spentPercentage = (totalSpent / budget.limit_amount) * 100;

  if (spentPercentage < budget.alert_threshold) {
    return;
  }

  let alertPayload;
  let whatsappMessage;
  
  if (spentPercentage >= 100) {
    alertPayload = {
      user_phone: transaction.user_phone,
      title: `Orçamento Excedido: ${budget.category}`,
      message: `Você gastou R$ ${totalSpent.toFixed(2)} de um limite de R$ ${budget.limit_amount.toFixed(2)}.`,
      severity: 'critical'
    };
    whatsappMessage = `🚨 *ALERTA CRÍTICO - Orçamento Excedido*\n\n` +
                     `📂 Categoria: *${budget.category}*\n` +
                     `💰 Gasto: R$ ${totalSpent.toFixed(2)}\n` +
                     `🎯 Limite: R$ ${budget.limit_amount.toFixed(2)}\n` +
                     `⚠️ Você ultrapassou seu orçamento em ${(spentPercentage - 100).toFixed(0)}%!\n\n` +
                     `Considere revisar seus gastos nesta categoria.`;
  } else {
    alertPayload = {
      user_phone: transaction.user_phone,
      title: `Alerta de Orçamento: ${budget.category}`,
      message: `Você já utilizou ${spentPercentage.toFixed(0)}% do seu orçamento de R$ ${budget.limit_amount.toFixed(2)}.`,
      severity: 'warning'
    };
    whatsappMessage = `⚠️ *ALERTA - Atenção ao Orçamento*\n\n` +
                     `📂 Categoria: *${budget.category}*\n` +
                     `💰 Gasto: R$ ${totalSpent.toFixed(2)}\n` +
                     `🎯 Limite: R$ ${budget.limit_amount.toFixed(2)}\n` +
                     `📊 Você já utilizou ${spentPercentage.toFixed(0)}% do seu orçamento.\n\n` +
                     `Fique atento aos seus gastos!`;
  }

  try {
    await Alert.create(alertPayload);
    fetchUnreadCount();

    try {
      await base44.functions.invoke('sendWhatsAppMessage', {
        user_phone: transaction.user_phone,
        message: whatsappMessage
      });
      console.log("✅ Alerta enviado pelo WhatsApp");
    } catch (whatsappError) {
      console.error("❌ Erro ao enviar alerta pelo WhatsApp:", whatsappError);
    }
  } catch (error) {
    console.error("❌ Erro ao criar alerta:", error);
  }
};

const initialFormData = {
  user_phone: "",
  description: "",
  amount: "",
  date: new Date().toISOString().split('T')[0],
  category: "outros",
  type: "expense",
  is_recurring: false,
  priority: "medium",
  source: "manual",
  notes: ""
};

export default function TransactionForm({ onSuccess, transactionToEdit }) {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const { fetchUnreadCount } = useAlerts();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (transactionToEdit) {
      setFormData({
        ...transactionToEdit,
        amount: transactionToEdit.amount.toString(),
        date: new Date(transactionToEdit.date).toISOString().split('T')[0],
      });
    } else {
      setFormData(initialFormData);
    }
  }, [transactionToEdit]);

  const loadUsers = async () => {
    try {
      const authUsers = await AuthenticatedUser.list();
      setUsers(authUsers);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
    setIsLoadingUsers(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (transactionToEdit) {
        await FinancialTransaction.update(transactionToEdit.id, transactionData);
      } else {
        await FinancialTransaction.create(transactionData);
      }
      
      await checkAndCreateBudgetAlert(transactionData, fetchUnreadCount);

      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      alert("Erro ao salvar transação. Tente novamente.");
    }
    
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="user_phone">Usuário</Label>
        {isLoadingUsers ? (
          <div className="text-sm text-slate-500">Carregando usuários...</div>
        ) : users.length === 0 ? (
          <div className="text-sm text-amber-600">
            Nenhum usuário cadastrado. Cadastre usuários na aba "Segurança".
          </div>
        ) : (
          <Select 
            value={formData.user_phone} 
            onValueChange={(value) => setFormData({...formData, user_phone: value})}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o usuário" />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={user.user_phone}>
                  {user.user_name || user.user_phone} ({user.user_phone})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Receita</SelectItem>
              <SelectItem value="expense">Despesa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="moradia">🏠 Moradia</SelectItem>
              <SelectItem value="alimentacao">🛒 Alimentação</SelectItem>
              <SelectItem value="transporte">🚗 Transporte</SelectItem>
              <SelectItem value="saude">💊 Saúde</SelectItem>
              <SelectItem value="educacao">📚 Educação</SelectItem>
              <SelectItem value="familia">👶 Família</SelectItem>
              <SelectItem value="lazer">🎮 Lazer</SelectItem>
              <SelectItem value="dividas">💳 Dívidas</SelectItem>
              <SelectItem value="investimentos">📈 Investimentos</SelectItem>
              <SelectItem value="outros">💰 Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          placeholder="Ex: Supermercado Extra"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Valor (R$)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea
          id="notes"
          placeholder="Observações adicionais..."
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          rows={3}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full bg-emerald-600 hover:bg-emerald-700"
        disabled={isSubmitting || users.length === 0}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {transactionToEdit ? 'Salvando...' : 'Criando...'}
          </>
        ) : (
          transactionToEdit ? 'Salvar Alterações' : 'Criar Transação'
        )}
      </Button>
    </form>
  );
}