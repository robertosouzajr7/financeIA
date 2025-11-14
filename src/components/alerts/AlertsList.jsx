
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Info, AlertCircle, Check, X } from "lucide-react";
import { format } from "date-fns";
import { Alert as AlertEntity } from "@/entities/Alert";
import { useAlerts } from "./AlertsContext"; // New import

const severityConfig = {
  info: {
    icon: Info,
    color: "bg-blue-50 border-blue-200 text-blue-700",
    iconColor: "text-blue-600",
    bgIcon: "bg-blue-100"
  },
  warning: {
    icon: AlertTriangle,
    color: "bg-amber-50 border-amber-200 text-amber-700",
    iconColor: "text-amber-600",
    bgIcon: "bg-amber-100"
  },
  critical: {
    icon: AlertCircle,
    color: "bg-red-50 border-red-200 text-red-700",
    iconColor: "text-red-600",
    bgIcon: "bg-red-100"
  }
};

export default function AlertsList({ alerts, isLoading, onRefresh }) {
  const { fetchUnreadCount } = useAlerts(); // New hook usage

  const handleMarkRead = async (id) => {
    await AlertEntity.update(id, { is_read: true });
    fetchUnreadCount(); // New call
    onRefresh();
  };

  const handleDelete = async (id) => {
    await AlertEntity.delete(id);
    fetchUnreadCount(); // New call
    onRefresh();
  };

  return (
    <div className="space-y-3">
      {isLoading ? (
        Array(5).fill(0).map((_, i) => (
          <Card key={i} className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : alerts.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="p-12 text-center">
            <Info className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Nenhum alerta encontrado</p>
          </CardContent>
        </Card>
      ) : (
        alerts.map((alert) => {
          const config = severityConfig[alert.severity] || severityConfig.info;
          const Icon = config.icon;
          
          return (
            <Card 
              key={alert.id} 
              className={`border shadow-lg hover:shadow-xl transition-all duration-300 ${
                alert.is_read ? 'opacity-60' : ''
              } ${config.color}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${config.bgIcon} flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-slate-900">{alert.title}</h3>
                      <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
                        {format(new Date(alert.created_date), "dd/MM HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-3">{alert.message}</p>
                    <div className="flex gap-2">
                      {!alert.is_read && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleMarkRead(alert.id)}
                          className="bg-white"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Marcar como lido
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDelete(alert.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
