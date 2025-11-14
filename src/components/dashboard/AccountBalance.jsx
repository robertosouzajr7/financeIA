
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AccountBalance({ totalIncome, totalExpenses, balance, isLoading, users, selectedUser, onUserChange }) {
  const isPositive = balance >= 0;
  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-hex').trim() || '#10b981';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card 
        className="relative overflow-hidden border-none shadow-2xl"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />
        
        <CardHeader className="relative z-10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white text-lg font-semibold">Saldo da Conta</CardTitle>
            </div>
            
            {users && users.length > 0 && (
              <Select value={selectedUser || "all"} onValueChange={onUserChange}>
                <SelectTrigger className="w-48 bg-white/20 border-white/30 text-white backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Usuários</SelectItem>
                  {users.map(phone => (
                    <SelectItem key={phone} value={phone}>{phone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-6">
          {isLoading ? (
            <>
              <Skeleton className="h-16 w-48 bg-white/20" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20 bg-white/20" />
                <Skeleton className="h-20 bg-white/20" />
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-white/80 text-sm font-medium mb-2">Saldo Total</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">
                    R$ {Math.abs(balance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {!isPositive && <span className="text-2xl text-white/90">-</span>}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {isPositive ? (
                    <div className="flex items-center gap-1 text-white/90">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">Saldo Positivo</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-200">
                      <TrendingDown className="w-4 h-4" />
                      <span className="text-sm font-medium">Saldo Negativo</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-emerald-400/30 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-white/80 text-sm font-medium">Receitas</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-red-400/30 rounded-lg">
                      <TrendingDown className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-white/80 text-sm font-medium">Despesas</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
