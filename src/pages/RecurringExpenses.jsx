import { useState, useEffect } from "react";
import { RecurringExpense } from "@/entities/RecurringExpense";
import { AuthenticatedUser } from "@/entities/AuthenticatedUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, Repeat } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

import RecurringExpenseForm from "../components/recurring/RecurringExpenseForm";
import RecurringExpenseCard from "../components/recurring/RecurringExpenseCard";

export default function RecurringExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [expensesData, usersData] = await Promise.all([
      RecurringExpense.list("-created_date"),
      AuthenticatedUser.list()
    ]);
    setExpenses(expensesData);
    setUsers(usersData);
    setIsLoading(false);
  };

  const handleSuccess = () => {
    setShowDialog(false);
    setEditingExpense(null);
    loadData();
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Tem certeza que deseja excluir esta despesa recorrente?")) {
      await RecurringExpense.delete(id);
      loadData();
    }
  };

  const filteredExpenses = selectedUser === "all" 
    ? expenses 
    : expenses.filter(e => e.user_phone === selectedUser);

  const totalMonthly = filteredExpenses
    .filter(e => e.is_active)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Repeat className="w-8 h-8 text-emerald-600" />
              Despesas Recorrentes
            </h1>
            <p className="text-slate-600">
              Gerencie suas contas fixas e receba lembretes automáticos
            </p>
          </div>
          <Button 
            onClick={() => {
              setEditingExpense(null);
              setShowDialog(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Despesa Recorrente
          </Button>
        </div>

        <Dialog open={showDialog} onOpenChange={(isOpen) => {
          setShowDialog(isOpen);
          if (!isOpen) setEditingExpense(null);
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'Editar Despesa Recorrente' : 'Nova Despesa Recorrente'}
              </DialogTitle>
            </DialogHeader>
            <RecurringExpenseForm 
              onSuccess={handleSuccess} 
              expenseToEdit={editingExpense}
              users={users}
            />
          </DialogContent>
        </Dialog>

        <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-6 h-6" />
              Resumo Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">
              R$ {totalMonthly.toFixed(2)}
            </div>
            <p className="text-emerald-100">
              Total de despesas recorrentes ativas
            </p>
            <div className="mt-4 flex gap-4 text-sm">
              <div>
                <div className="text-2xl font-bold">{filteredExpenses.filter(e => e.is_active).length}</div>
                <div className="text-emerald-100">Ativas</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{filteredExpenses.filter(e => e.send_reminder).length}</div>
                <div className="text-emerald-100">Com Lembrete</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i} className="border-none shadow-lg">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredExpenses.length === 0 ? (
          <Card className="border-none shadow-lg">
            <CardContent className="p-12 text-center">
              <Repeat className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">Nenhuma despesa recorrente cadastrada</p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Primeira Despesa
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExpenses.map((expense) => (
              <RecurringExpenseCard
                key={expense.id}
                expense={expense}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}