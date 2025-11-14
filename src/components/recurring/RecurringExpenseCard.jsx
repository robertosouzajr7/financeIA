import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Bell, BellOff, Edit, Trash2, CheckCircle2, XCircle } from "lucide-react";

const categoryIcons = {
  moradia: "🏠",
  alimentacao: "🛒",
  transporte: "🚗",
  saude: "💊",
  educacao: "📚",
  familia: "👶",
  lazer: "🎮",
  dividas: "💳",
  investimentos: "📈",
  outros: "💰"
};

export default function RecurringExpenseCard({ expense, onEdit, onDelete }) {
  const getDaysUntilDue = () => {
    const today = new Date();
    const currentDay = today.getDate();
    const dueDay = expense.due_day;
    
    if (currentDay < dueDay) {
      return dueDay - currentDay;
    } else {
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      return (lastDay - currentDay) + dueDay;
    }
  };

  const daysUntilDue = getDaysUntilDue();
  const isUrgent = daysUntilDue <= 3;

  return (
    <Card className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 ${
      !expense.is_active ? 'opacity-60' : ''
    } ${isUrgent && expense.is_active ? 'border-2 border-amber-400' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{categoryIcons[expense.category]}</span>
              <h3 className="font-bold text-lg text-slate-900">{expense.name}</h3>
            </div>
            <Badge variant="outline" className="text-xs">
              {expense.category}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(expense)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(expense.id)}>
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <DollarSign className="w-4 h-4" />
            <span>Valor</span>
          </div>
          <span className="text-lg font-bold text-slate-900">
            R$ {expense.amount.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            <span>Vencimento</span>
          </div>
          <Badge variant={isUrgent ? "destructive" : "secondary"}>
            Dia {expense.due_day} {isUrgent && `(${daysUntilDue} dias)`}
          </Badge>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {expense.send_reminder ? (
              <Bell className="w-4 h-4 text-emerald-600" />
            ) : (
              <BellOff className="w-4 h-4 text-slate-400" />
            )}
            <span className="text-xs text-slate-600">
              {expense.send_reminder ? 'Com lembrete' : 'Sem lembrete'}
            </span>
          </div>
          
          {expense.is_active ? (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Ativa
            </Badge>
          ) : (
            <Badge variant="secondary">
              <XCircle className="w-3 h-3 mr-1" />
              Inativa
            </Badge>
          )}
        </div>

        {expense.notes && (
          <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
            {expense.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}