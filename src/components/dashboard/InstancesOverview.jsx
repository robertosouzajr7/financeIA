import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { RefreshCw, Plus, Circle } from "lucide-react";
import { format } from "date-fns";

export default function InstancesOverview({ instances, isLoading, onRefresh }) {
  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="p-6 border-b border-slate-100">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-slate-900">Instâncias WhatsApp</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Link to={createPageUrl("Instances")}>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova Instância
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última Conexão</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : instances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    Nenhuma instância criada ainda
                  </TableCell>
                </TableRow>
              ) : (
                instances.map((instance) => (
                  <TableRow key={instance.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="font-medium">{instance.instance_name}</TableCell>
                    <TableCell className="text-slate-600">{instance.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`border ${
                          instance.is_connected 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <Circle className={`w-2 h-2 mr-2 fill-current ${instance.is_connected ? 'text-emerald-500' : 'text-slate-400'}`} />
                        {instance.is_connected ? 'Online' : 'Offline'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {instance.last_connection ? format(new Date(instance.last_connection), "dd/MM/yyyy HH:mm") : '-'}
                    </TableCell>
                    <TableCell>
                      <Link to={createPageUrl("Instances")}>
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}