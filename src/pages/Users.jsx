
import { useState, useEffect } from "react";
import { FinancialTransaction } from "@/entities/FinancialTransaction";
import { Goal } from "@/entities/Goal";
import { Debt } from "@/entities/Debt";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import UserCard from "../components/users/UserCard";
import UserDetails from "../components/users/UserDetails";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    const transactions = await FinancialTransaction.list();
    
    const userPhones = [...new Set(transactions.map(t => t.user_phone))];
    
    const usersData = await Promise.all(
      userPhones.map(async (phone) => {
        const [userTransactions, userGoals, userDebts] = await Promise.all([
          FinancialTransaction.filter({ user_phone: phone }),
          Goal.filter({ user_phone: phone }),
          Debt.filter({ user_phone: phone })
        ]);

        const income = userTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = userTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          phone,
          transactionsCount: userTransactions.length,
          goalsCount: userGoals.length,
          debtsCount: userDebts.length,
          income,
          expenses,
          balance: income - expenses
        };
      })
    );

    setUsers(usersData);
    setIsLoading(false);
  };

  const filteredUsers = users.filter(user => 
    user.phone.includes(searchTerm)
  );

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Usuários</h1>
          <p className="text-slate-600">Gerencie e visualize dados dos usuários</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar por telefone..."
            className="pl-10 bg-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="grid gap-4">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <Card key={i} className="border-none shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-32 mb-2" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredUsers.length === 0 ? (
                <Card className="border-none shadow-lg">
                  <CardContent className="p-12 text-center">
                    <p className="text-slate-600">Nenhum usuário encontrado</p>
                  </CardContent>
                </Card>
              ) : (
                filteredUsers.map((user) => (
                  <UserCard
                    key={user.phone}
                    user={user}
                    isSelected={selectedUser?.phone === user.phone}
                    onClick={() => setSelectedUser(user)}
                  />
                ))
              )}
            </div>
          </div>

          <div>
            <UserDetails user={selectedUser} />
          </div>
        </div>
      </div>
    </div>
  );
}
