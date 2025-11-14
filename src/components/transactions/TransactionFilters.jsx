import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TransactionFilters({ filters, onFilterChange }) {
  return (
    <div className="flex gap-3">
      <Tabs value={filters.type} onValueChange={(value) => onFilterChange({...filters, type: value})}>
        <TabsList className="bg-white shadow-sm">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
          <TabsTrigger value="expense">Despesas</TabsTrigger>
        </TabsList>
      </Tabs>

      <Select value={filters.category} onValueChange={(value) => onFilterChange({...filters, category: value})}>
        <SelectTrigger className="w-40 bg-white">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="moradia">Moradia</SelectItem>
          <SelectItem value="alimentacao">Alimentação</SelectItem>
          <SelectItem value="transporte">Transporte</SelectItem>
          <SelectItem value="saude">Saúde</SelectItem>
          <SelectItem value="educacao">Educação</SelectItem>
          <SelectItem value="familia">Família</SelectItem>
          <SelectItem value="lazer">Lazer</SelectItem>
          <SelectItem value="dividas">Dívidas</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}