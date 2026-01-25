import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

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

export default function RecentTransactions({ transactions, isLoading }) {
  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
           <img src="https://img.icons8.com/fluency/48/cashbook.png" className="w-6 h-6" alt="Transactions" />
          Transações Recentes
        </CardTitle>
        <Link to={createPageUrl("Transactions")} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center">
            Ver todas <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
         <div className="divide-y divide-slate-100">
        {(isLoading) ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
               <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
               <Skeleton className="h-4 w-16" />
            </div>
          ))
        ) : transactions && transactions.length === 0 ? (
          <p className="text-center text-slate-500 py-8">Nenhuma transação recente</p>
        ) : (
          transactions && transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
               <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'income' ? 
                        <TrendingUp className="w-5 h-5 text-emerald-600" /> : 
                        <TrendingDown className="w-5 h-5 text-red-600" />
                    }
                  </div>
                  <div>
                      <p className="font-medium text-slate-900">{transaction.description}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{format(new Date(transaction.date), "dd/MM/yyyy")}</span>
                          <span>•</span>
                          <span className="capitalize">{transaction.category}</span>
                      </div>
                  </div>
               </div>
               <div className="text-right">
                   <p className={`font-semibold ${transaction.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                       {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
                   </p>
               </div>
            </div>
          ))
        )}
        </div>
      </CardContent>
    </Card>
  );
}
