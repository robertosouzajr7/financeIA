import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, TrendingUp, TrendingDown, Trash2 } from "lucide-react";

export default function UserCard({ user, isSelected, onClick, onClickDelete }) {
  return (
    <Card 
      className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
        isSelected ? 'ring-2 ring-emerald-500' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{user.phone}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {user.transactionsCount} transações
                </Badge>
                {user.goalsCount > 0 && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {user.goalsCount} metas
                  </Badge>
                )}
                {user.debtsCount > 0 && (
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                    {user.debtsCount} dívidas
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <div>
                <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-600">
                    R$ {user.income.toFixed(2)}
                </span>
                </div>
                <div className="flex items-center gap-1">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">
                    R$ {user.expenses.toFixed(2)}
                </span>
                </div>
            </div>
            {onClickDelete && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onClickDelete(user);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-600 transition-colors z-10"
                  title="Excluir Usuário e Dados"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}