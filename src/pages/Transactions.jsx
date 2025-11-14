
import { useState, useEffect } from "react";
import { FinancialTransaction } from "@/entities/FinancialTransaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import TransactionsList from "../components/transactions/TransactionsList";
import TransactionForm from "../components/transactions/TransactionForm";
import TransactionFilters from "../components/transactions/TransactionFilters";

import { exportTransactionsExcel } from "@/functions/exportTransactionsExcel";
import { usePlanLimits } from "../components/limits/PlanLimitsChecker";
import LimitWarning from "../components/limits/LimitWarning";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filters, setFilters] = useState({ type: "all", category: "all" });
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  
  const { limits, usage, canCreate } = usePlanLimits();
  const primaryColor = typeof document !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--primary-hex').trim() : '#10b981';


  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    const data = await FinancialTransaction.list("-date");
    setTransactions(data);
    setIsLoading(false);
  };

  const handleSuccess = () => {
    setShowDialog(false);
    setEditingTransaction(null);
    loadTransactions();
  };

  const handleCreate = () => {
    if (!canCreate('transactions')) {
      alert('Você atingiu o limite de transações do seu plano. Faça upgrade para continuar.');
      return;
    }
    setEditingTransaction(null);
    setShowDialog(true);
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowDialog(true);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Pass filters to the export function
      const response = await exportTransactionsExcel(filters);
      
      // Criar blob e fazer download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transacoes_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Erro ao exportar:", error);
      alert("Erro ao exportar arquivo");
    }
    setIsExporting(false);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const typeMatch = filters.type === "all" || transaction.type === filters.type;
    const categoryMatch = filters.category === "all" || transaction.category === filters.category;
    // Assuming description and user_phone might be nullable or undefined, handle them gracefully
    const searchMatch = (transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                        (transaction.user_phone?.includes(searchTerm) || false);
    return typeMatch && categoryMatch && searchMatch;
  });

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Transações</h1>
            <p className="text-slate-600">
              Visualize e gerencie todas as transações financeiras
              {usage && limits && (
                <span className="ml-2 text-sm">
                  ({usage.transactions}/{limits.transactions} usadas)
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Excel
                </>
              )}
            </Button>
            <Button 
              onClick={handleCreate}
              style={{ backgroundColor: primaryColor }}
              className="text-white hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Transação
            </Button>
          </div>
        </div>

        {usage && limits && !canCreate('transactions') && (
          <LimitWarning 
            resource="transações"
            current={usage.transactions}
            limit={limits.transactions}
          />
        )}

        <Dialog open={showDialog} onOpenChange={(isOpen) => {
          setShowDialog(isOpen);
          if (!isOpen) setEditingTransaction(null);
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTransaction ? 'Editar Transação' : 'Adicionar Transação'}</DialogTitle>
            </DialogHeader>
            <TransactionForm onSuccess={handleSuccess} transactionToEdit={editingTransaction} />
          </DialogContent>
        </Dialog>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar transações..."
              className="pl-10 bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <TransactionFilters filters={filters} onFilterChange={setFilters} />
        </div>

        <TransactionsList 
          transactions={filteredTransactions} 
          isLoading={isLoading}
          onRefresh={loadTransactions}
          onEdit={handleEdit}
        />
      </div>
    </div>
  );
}
