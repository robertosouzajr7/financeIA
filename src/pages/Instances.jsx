
import { useState, useEffect } from "react";
import { WhatsAppInstance } from "@/entities/WhatsAppInstance";
import { Button } from "@/components/ui/button";
import { Plus, Smartphone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import InstancesList from "../components/instances/InstancesList";
import CreateInstanceForm from "../components/instances/CreateInstanceForm";
import { usePlanLimits } from "../components/limits/PlanLimitsChecker";
import LimitWarning from "../components/limits/LimitWarning";

export default function Instances() {
  const [instances, setInstances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const { limits, usage, canCreate } = usePlanLimits();
  const primaryColor = typeof document !== 'undefined' 
    ? getComputedStyle(document.documentElement).getPropertyValue('--primary-hex').trim() 
    : '#10b981'; // Default fallback for SSR or initial load

  useEffect(() => {
    loadInstances();
  }, []);

  const loadInstances = async () => {
    setIsLoading(true);
    try {
      const data = await WhatsAppInstance.list("-created_date");
      setInstances(data);
    } catch (error) {
      console.error("Erro ao carregar instâncias:", error);
      setInstances([]);
    }
    setIsLoading(false);
  };

  const handleCreateClick = () => {
    if (!canCreate('chatbots')) {
      alert('Você atingiu o limite de chatbots do seu plano. Faça upgrade para continuar.');
      return;
    }
    setShowCreateDialog(true);
  };

  const handleInstanceCreated = () => {
    setShowCreateDialog(false);
    loadInstances();
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Chatbots WhatsApp</h1>
            <p className="text-slate-600">
              Gerencie as conexões WhatsApp do sistema
              {usage && limits && (
                <span className="ml-2 text-sm">
                  ({usage.chatbots}/{limits.chatbots} usados)
                </span>
              )}
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button 
                onClick={handleCreateClick}
                style={{ backgroundColor: primaryColor }}
                className="text-white hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Chatbot
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" style={{ color: primaryColor }} />
                  Criar Chatbot WhatsApp
                </DialogTitle>
              </DialogHeader>
              <CreateInstanceForm onSuccess={handleInstanceCreated} />
            </DialogContent>
          </Dialog>
        </div>

        {usage && limits && !canCreate('chatbots') && (
          <LimitWarning 
            resource="chatbots"
            current={usage.chatbots}
            limit={limits.chatbots}
          />
        )}

        <InstancesList instances={instances} isLoading={isLoading} onRefresh={loadInstances} />
      </div>
    </div>
  );
}
