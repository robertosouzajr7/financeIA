
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialTransaction } from "@/entities/FinancialTransaction";
import { Goal } from "@/entities/Goal";
import { Debt } from "@/entities/Debt";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, CreditCard } from "lucide-react";

export default function UserDetails({ user }) {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserDetails();
    }
  }, [user]);

  const loadUserDetails = async () => {
    setIsLoading(true);
    const [transactions, goals, debts] = await Promise.all([
      FinancialTransaction.filter({ user_phone: user.phone }, "-date", 10),
      Goal.filter({ user_phone: user.phone }),
      Debt.filter({ user_phone: user.phone })
    ]);
    setDetails({ transactions, goals, debts });
    setIsLoading(false);
  };

  if (!user) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-12 text-center">
          <p className="text-slate-500">Selecione um usuário para ver detalhes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-lg">
        <CardHeader className="p-6 border-b border-slate-100">
          <CardTitle className="text-lg font-bold">Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Receitas</span>
            <span className="font-semibold text-emerald-600">R$ {user.income.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Despesas</span>
            <span className="font-semibold text-red-600">R$ {user.expenses.toFixed(2)}</span>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-900">Saldo</span>
              <span className={`font-bold text-lg ${user.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                R$ {user.balance.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ) : details && (
        <>
          {details.goals.length > 0 && (
            <Card className="border-none shadow-lg">
              <CardHeader className="p-6 border-b border-slate-100">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  Metas Ativas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {details.goals.slice(0, 3).map((goal) => {
                  const progress = (goal.current_amount / goal.target_amount) * 100;
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 text-sm">{goal.title}</p>
                          <p className="text-xs text-slate-600 mt-1">
                            R$ {goal.current_amount.toFixed(2)} / R$ {goal.target_amount.toFixed(2)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {progress.toFixed(0)}%
                        </Badge>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {details.debts.length > 0 && (
            <Card className="border-none shadow-lg">
              <CardHeader className="p-6 border-b border-slate-100">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                  Dívidas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {details.debts.map((debt) => (
                  <div key={debt.id} className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{debt.creditor}</p>
                      <p className="text-xs text-slate-600">
                        Pago: R$ {debt.paid_amount.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold text-amber-700">
                      R$ {(debt.total_amount - debt.paid_amount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
