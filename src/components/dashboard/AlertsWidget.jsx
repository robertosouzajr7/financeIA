import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Bell, AlertTriangle, Info, AlertCircle as AlertCircleIcon } from "lucide-react";

const severityConfig = {
  info: {
    icon: Info,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    iconColor: "text-blue-500"
  },
  warning: {
    icon: AlertTriangle,
    color: "bg-amber-100 text-amber-700 border-amber-200",
    iconColor: "text-amber-500"
  },
  critical: {
    icon: AlertCircleIcon,
    color: "bg-red-100 text-red-700 border-red-200",
    iconColor: "text-red-500"
  }
};

export default function AlertsWidget({ alerts, isLoading }) {
  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="p-6 border-b border-slate-100">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" />
            Alertas Recentes
          </CardTitle>
          <Link to={createPageUrl("Alerts")}>
            <Button variant="ghost" size="sm">Ver Todos</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <p className="text-center text-slate-500 py-4">Nenhum alerta pendente</p>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => {
              const config = severityConfig[alert.severity] || severityConfig.info;
              const Icon = config.icon;
              
              return (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className={`p-2 rounded-full ${config.color}`}>
                    <Icon className={`w-4 h-4 ${config.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm mb-1">{alert.title}</p>
                    <p className="text-xs text-slate-600 line-clamp-2">{alert.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}