import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Circle, MoreVertical, Trash2, RotateCw, Smartphone, Edit } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WhatsAppInstance } from "@/entities/WhatsAppInstance";

export default function InstancesList({ instances, isLoading, onRefresh }) {
  const [editingInstance, setEditingInstance] = useState(null);
  const [newName, setNewName] = useState("");

  const handleDelete = async (id) => {
    if (confirm("Tem certeza que deseja deletar esta instância?")) {
      await WhatsAppInstance.delete(id);
      onRefresh();
    }
  };

  const handleEditClick = (instance) => {
    setEditingInstance(instance);
    setNewName(instance.instance_name);
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!editingInstance) return;

    try {
        await WhatsAppInstance.update(editingInstance.id, {
            instance_name: newName
        });
        setEditingInstance(null);
        onRefresh();
    } catch (error) {
        console.error("Erro ao renomear:", error);
        alert("Erro ao renomear instância");
    }
  };

  return (
    <div className="grid gap-4">
      {isLoading ? (
        Array(3).fill(0).map((_, i) => (
          <Card key={i} className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))
      ) : instances.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="p-12 text-center">
            <Smartphone className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">Nenhuma instância criada</p>
            <p className="text-sm text-slate-500">Crie sua primeira instância para começar</p>
          </CardContent>
        </Card>
      ) : (
        instances.map((instance) => (
          <Card key={instance.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    instance.status === 'connected' ? 'bg-emerald-100' : 'bg-slate-100'
                  }`}>
                    <Smartphone className={`w-6 h-6 ${
                      instance.status === 'connected' ? 'text-emerald-600' : 'text-slate-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">{instance.instance_name}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      {instance.phone_number && <span>{instance.phone_number}</span>}
                      {instance.updated_at && (
                        <span className="text-xs">
                          Atualizado: {format(new Date(instance.updated_at), "dd/MM/yy HH:mm")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant="outline" 
                    className={`border ${
                      instance.status === 'connected'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    <Circle className={`w-2 h-2 mr-2 fill-current ${instance.status === 'connected' ? 'text-emerald-500' : 'text-slate-400'}`} />
                    {instance.status === 'connected' ? 'Online' : instance.status === 'connecting' ? 'Conectando...' : 'Offline'}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditClick(instance)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Renomear
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <RotateCw className="w-4 h-4 mr-2" />
                        Reiniciar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDelete(instance.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
      <Dialog open={!!editingInstance} onOpenChange={(open) => !open && setEditingInstance(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Renomear Instância</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRename} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="instance_name">Nome da Instância</Label>
                    <Input 
                        id="instance_name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Ex: Instância Principal"
                        required
                    />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Salvar
                </Button>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
