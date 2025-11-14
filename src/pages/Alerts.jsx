
import { useState, useEffect } from "react";
import { Alert as AlertEntity } from "@/entities/Alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";

import AlertsList from "../components/alerts/AlertsList";
import { useAlerts } from "../components/alerts/AlertsContext";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { fetchUnreadCount } = useAlerts();

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setIsLoading(true);
    const data = await AlertEntity.list("-created_date");
    setAlerts(data);
    setIsLoading(false);
    fetchUnreadCount(); // Refresh global count when loading alerts
  };

  const handleMarkAllRead = async () => {
    const unreadAlerts = alerts.filter(a => !a.is_read);
    if (unreadAlerts.length === 0) return;

    try {
      await Promise.all(
        unreadAlerts.map(alert => AlertEntity.update(alert.id, { is_read: true }))
      );
      // Optimistically update UI and global count
      setAlerts(alerts.map(a => ({ ...a, is_read: true })));
      fetchUnreadCount();
      // Refetch to ensure consistency
      // loadAlerts(); // Can be removed if optimistic update is trusted
    } catch (error) {
      console.error("Erro ao marcar todos como lidos:", error);
    }
  };

  const filteredAlerts = filter === "all" 
    ? alerts 
    : filter === "unread"
    ? alerts.filter(a => !a.is_read)
    : alerts.filter(a => a.severity === filter);

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Alertas</h1>
            <p className="text-slate-600">Notificações e alertas do sistema</p>
          </div>
          <Button variant="outline" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Marcar Todos como Lidos
          </Button>
        </div>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="unread">Não Lidos</TabsTrigger>
            <TabsTrigger value="critical">Críticos</TabsTrigger>
            <TabsTrigger value="warning">Avisos</TabsTrigger>
            <TabsTrigger value="info">Informativos</TabsTrigger>
          </TabsList>
        </Tabs>

        <AlertsList alerts={filteredAlerts} isLoading={isLoading} onRefresh={loadAlerts} />
      </div>
    </div>
  );
}
