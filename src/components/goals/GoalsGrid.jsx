import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Calendar, Pencil, Trash2, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusColors = {
  planning: "bg-blue-100 text-blue-700 border-blue-200",
  saving: "bg-purple-100 text-purple-700 border-purple-200",
  executing: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-700 border-slate-200"
};

const statusLabels = {
  planning: "Planejando",
  saving: "Poupando",
  executing: "Em andamento",
  completed: "Concluída",
  cancelled: "Cancelada"
};

export default function GoalsGrid({ goals, isLoading, onEdit, onDelete }) {
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
              <Skeleton className="h-2 w-full mb-4" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))
      ) : goals.length === 0 ? (
        <Card className="col-span-full border-none shadow-lg">
          <CardContent className="p-12 text-center">
            <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Nenhuma meta cadastrada</p>
          </CardContent>
        </Card>
      ) : (
        goals.map((goal) => {
          const progress = (goal.current_amount / goal.target_amount) * 100;
          return (
            <Card key={goal.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-900 flex-1">{goal.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${statusColors[goal.status]}`}>
                      {statusLabels[goal.status]}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(goal)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete(goal.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {goal.description && (
                  <p className="text-sm text-slate-600 line-clamp-2">{goal.description}</p>
                )}
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Progresso</span>
                    <span className="text-sm font-semibold text-emerald-600">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-slate-500">R$ {goal.current_amount.toFixed(2)}</span>
                    <span className="text-xs font-medium text-slate-700">R$ {goal.target_amount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-600">
                  {goal.deadline && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(goal.deadline), "dd/MM/yyyy")}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {goal.user_phone}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}