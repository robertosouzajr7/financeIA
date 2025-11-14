
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PiggyBank, MoreVertical, Edit, Trash2 } from "lucide-react";
import { startOfMonth, endOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { Budget } from "@/entities/all";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export default function BudgetsList({ budgets, transactions, isLoading, onRefresh, onEdit }) {
  const getSpentAmount = (budget) => {
    const today = new Date();
    const startDate = startOfMonth(today);
    const endDate = endOfMonth(today);
    
    return transactions
      .filter(t => 
        t.user_phone === budget.user_phone &&
        t.category === budget.category &&
        t.type === 'expense' &&
        new Date(t.date) >= startDate &&
        new Date(t.date) <= endDate
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleDelete = async (budgetId) => {
    if (window.confirm("Tem certeza que deseja excluir este orçamento?")) {
      await Budget.delete(budgetId);
      onRefresh();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {isLoading ? (
        Array(6).fill(0).map((_, i) => (
          <Card key={i} className="border-none shadow-lg">
            <CardHeader className="p-6">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-5 w-full" />
            </CardContent>
          </Card>
        ))
      ) : budgets.length === 0 ? (
        <Card className="col-span-full border-none shadow-lg">
          <CardContent className="p-12 text-center">
            <PiggyBank className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Nenhum orçamento cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        budgets.map((budget) => {
          const spentAmount = getSpentAmount(budget);
          const progress = (spentAmount / budget.limit_amount) * 100;
          const remaining = budget.limit_amount - spentAmount;
          
          let progressColor = "bg-emerald-500";
          if (progress > budget.alert_threshold) progressColor = "bg-amber-500";
          if (progress >= 100) progressColor = "bg-red-500";

          return (
            <Card key={budget.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col">
              <CardHeader className="p-6">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{categoryIcons[budget.category]}</span>
                    <h3 className="font-bold text-slate-900 capitalize">{budget.category}</h3>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(budget)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(budget.id)} className="text-red-500">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Excluir</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                 <p className="text-sm text-slate-600">
                  <Badge variant="outline" className="text-xs">{budget.user_phone}</Badge>
                </p>
                <p className="text-sm text-slate-600 pt-2">
                  Limite Mensal: <span className="font-semibold text-slate-800">R$ {budget.limit_amount.toFixed(2)}</span>
                </p>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-3 flex-grow flex flex-col justify-end">
                <div>
                  <div className="flex justify-between items-center mb-1 text-sm">
                    <span className="text-slate-600">Gasto Atual</span>
                    <span className="font-semibold text-slate-800">R$ {spentAmount.toFixed(2)}</span>
                  </div>
                  <Progress value={progress} className="h-3" indicatorClassName={progressColor} />
                </div>

                <div className={`text-sm font-medium p-2 rounded-md text-center ${remaining >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {remaining >= 0 ? 'Disponível: ' : 'Excedido: '}
                  R$ {Math.abs(remaining).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
