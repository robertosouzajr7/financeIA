import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RecurringExpense } from "@/entities/RecurringExpense";
import { Loader2 } from "lucide-react";

const initialFormData = {
  user_phone: "",
  name: "",
  amount: "",
  category: "outros",
  due_day: "",
  send_reminder: true,
  is_active: true,
  auto_create_transaction: false,
  notes: ""
};

export default function RecurringExpenseForm({ onSuccess, expenseToEdit, users }) {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (expenseToEdit) {
      setFormData({
        ...expenseToEdit,
        amount: expenseToEdit.amount.toString(),
        due_day: expenseToEdit.due_day.toString()
      });
    } else {
      setFormData(initialFormData);
    }
  }, [expenseToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        due_day: parseInt(formData.due_day)
      };

      if (expenseToEdit) {
        await RecurringExpense.update(expenseToEdit.id, expenseData);
      } else {
        await RecurringExpense.create(expenseData);
      }
      
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar despesa recorrente:", error);
      alert("Erro ao salvar. Tente novamente.");
    }
    
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="user_phone">Usuário</Label>
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
                {user.user_name || user.user_phone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome da Despesa</Label>
        <Input
          id="name"
          placeholder="Ex: Academia, Netflix, Aluguel"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Valor Mensal (R$)</Label>
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
          <Label htmlFor="due_day">Dia do Vencimento</Label>
          <Input
            id="due_day"
            type="number"
            min="1"
            max="31"
            placeholder="1-31"
            value={formData.due_day}
            onChange={(e) => setFormData({...formData, due_day: e.target.value})}
            required
          />
        </div>
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Enviar Lembrete</Label>
            <p className="text-xs text-slate-500">1 dia antes do vencimento</p>
          </div>
          <Switch
            checked={formData.send_reminder}
            onCheckedChange={(checked) => setFormData({...formData, send_reminder: checked})}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Criar Transação Automaticamente</Label>
            <p className="text-xs text-slate-500">No dia do vencimento</p>
          </div>
          <Switch
            checked={formData.auto_create_transaction}
            onCheckedChange={(checked) => setFormData({...formData, auto_create_transaction: checked})}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Ativa</Label>
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Textarea
          id="notes"
          placeholder="Informações adicionais..."
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          rows={2}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full bg-emerald-600 hover:bg-emerald-700"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {expenseToEdit ? 'Salvando...' : 'Criando...'}
          </>
        ) : (
          expenseToEdit ? 'Salvar Alterações' : 'Criar Despesa Recorrente'
        )}
      </Button>
    </form>
  );
}