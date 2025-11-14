
import { useState, useEffect } from "react";
import { Goal } from "@/entities/Goal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import GoalsGrid from "../components/goals/GoalsGrid";
import GoalForm from "../components/goals/GoalForm";
import { usePlanLimits } from "../components/limits/PlanLimitsChecker";
import LimitWarning from "../components/limits/LimitWarning";

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  
  const { limits, usage, canCreate } = usePlanLimits();

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setIsLoading(true);
    const data = await Goal.list("-created_date");
    setGoals(data);
    setIsLoading(false);
  };

  const handleGoalCreated = () => {
    setShowCreateDialog(false);
    setEditingGoal(null);
    loadGoals();
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setShowCreateDialog(true);
  };

  const handleCreate = () => {
    if (!canCreate('goals')) {
      alert('Você atingiu o limite de metas do seu plano. Faça upgrade para continuar.');
      return;
    }
    setEditingGoal(null);
    setShowCreateDialog(true);
  };

  const handleDelete = async (goalId) => {
    if (window.confirm("Tem certeza que deseja deletar esta meta?")) {
      await Goal.delete(goalId);
      loadGoals();
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Metas e Objetivos</h1>
            <p className="text-slate-600">
              Acompanhe o progresso dos usuários
              {usage && limits && (
                <span className="ml-2 text-sm">
                  ({usage.goals}/{limits.goals} usadas)
                </span>
              )}
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={(isOpen) => {
            setShowCreateDialog(isOpen);
            if (!isOpen) setEditingGoal(null);
          }}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingGoal ? 'Editar Meta' : 'Criar Meta'}</DialogTitle>
              </DialogHeader>
              <GoalForm onSuccess={handleGoalCreated} goal={editingGoal} />
            </DialogContent>
          </Dialog>
        </div>

        {usage && limits && !canCreate('goals') && (
          <LimitWarning 
            resource="metas"
            current={usage.goals}
            limit={limits.goals}
          />
        )}

        <GoalsGrid 
          goals={goals} 
          isLoading={isLoading} 
          onRefresh={loadGoals}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
