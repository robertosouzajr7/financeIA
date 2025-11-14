
import { useState, useEffect } from "react";
import { Budget, FinancialTransaction } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Plus, PiggyBank } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import BudgetsList from "../components/budgets/BudgetsList";
import BudgetForm from "../components/budgets/BudgetForm";
import { usePlanLimits } from "../components/limits/PlanLimitsChecker";
import LimitWarning from "../components/limits/LimitWarning";

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const { limits, usage, canCreate } = usePlanLimits();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [budgetsData, transactionsData] = await Promise.all([
      Budget.list("-created_date"),
      FinancialTransaction.list()
    ]);
    
    const uniqueUsers = [...new Set(transactionsData.map(t => t.user_phone))];
    
    setBudgets(budgetsData);
    setTransactions(transactionsData);
    setUsers(uniqueUsers);
    setIsLoading(false);
  };

  const handleSuccess = () => {
    setShowDialog(false);
    setEditingBudget(null);
    loadData();
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setShowDialog(true);
  };
  
  const handleCreate = () => {
    if (!canCreate('budgets')) {
      alert('Você atingiu o limite de orçamentos do seu plano. Faça upgrade para continuar.');
      return;
    }
    setEditingBudget(null);
    setShowDialog(true);
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Orçamentos</h1>
            <p className="text-slate-600">
              Acompanhe os limites de gastos definidos pelos usuários
              {usage && limits && (
                <span className="ml-2 text-sm">
                  ({usage.budgets}/{limits.budgets} usados)
                </span>
              )}
            </p>
          </div>
          <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Orçamento
          </Button>
        </div>

        {usage && limits && !canCreate('budgets') && (
          <LimitWarning 
            resource="orçamentos"
            current={usage.budgets}
            limit={limits.budgets}
          />
        )}

        <BudgetsList 
          budgets={budgets} 
          transactions={transactions} 
          isLoading={isLoading} 
          onRefresh={loadData}
          onEdit={handleEdit}
        />

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-emerald-600" />
                {editingBudget ? 'Editar Orçamento' : 'Criar Orçamento'}
              </DialogTitle>
            </DialogHeader>
            <BudgetForm onSuccess={handleSuccess} budget={editingBudget} users={users} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
