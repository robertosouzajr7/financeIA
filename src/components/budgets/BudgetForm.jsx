
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Budget } from "@/entities/all";
import { Loader2 } from "lucide-react";

export default function BudgetForm({ onSuccess, budget, users }) {
  const [formData, setFormData] = useState({
    user_phone: "",
    category: "",
    limit_amount: "",
    period: "monthly",
    alert_threshold: 80,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (budget) {
      setFormData({
        ...budget,
        limit_amount: String(budget.limit_amount), // Ensure limit_amount is a string for the input field
        alert_threshold: budget.alert_threshold || 80, // Set default if not provided
      });
    } else {
      setFormData({
        user_phone: "",
        category: "",
        limit_amount: "",
        period: "monthly",
        alert_threshold: 80, // Reset to default for new form
      });
    }
  }, [budget]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const dataToSave = {
      ...formData,
      limit_amount: parseFloat(formData.limit_amount),
      alert_threshold: parseInt(formData.alert_threshold, 10),
      is_active: true, // Assuming budgets are active by default when created/updated
    };

    try {
      if (budget?.id) {
        // If budget prop has an ID, it means we are updating an existing budget
        await Budget.update(budget.id, dataToSave);
      } else {
        // Otherwise, create a new budget
        await Budget.create({
          ...dataToSave,
          start_date: new Date().toISOString().split('T')[0], // Set start_date only for new budgets
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error);
      alert("Erro ao salvar orçamento. Tente novamente.");
    }
    
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="user_phone">Usuário</Label>
        <Select 
          value={formData.user_phone} 
          onValueChange={(value) => setFormData({...formData, user_phone: value})} 
          required
          disabled={!!budget} // Disable user selection when editing an existing budget
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um usuário" />
          </SelectTrigger>
          <SelectContent>
            {users && users.map(userPhone => (
              <SelectItem key={userPhone} value={userPhone}>{userPhone}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoria</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})} required>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
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

      <div className="space-y-2">
        <Label htmlFor="limit_amount">Limite Mensal (R$)</Label>
        <Input
          id="limit_amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={formData.limit_amount}
          onChange={(e) => setFormData({...formData, limit_amount: e.target.value})}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="alert_threshold">Alertar ao atingir (%)</Label>
        <Input
          id="alert_threshold"
          type="number"
          min="1"
          max="100"
          placeholder="80"
          value={formData.alert_threshold}
          onChange={(e) => setFormData({...formData, alert_threshold: e.target.value})}
          required
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
            Salvando...
          </>
        ) : (
          'Salvar Orçamento'
        )}
      </Button>
    </form>
  );
}
