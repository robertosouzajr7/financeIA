
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MetricCard({ title, value, subtitle, icon: Icon, iconColor, bgColor, isLoading }) {
  const primaryColor = typeof document !== 'undefined' 
    ? getComputedStyle(document.documentElement).getPropertyValue('--primary-hex').trim() || '#10b981'
    : '#10b981'; // Fallback for SSR or non-browser environments
  
  // Usar cor primária se for especificado
  const cardIconColor = iconColor === 'text-emerald-600' ? primaryColor : iconColor;
  const cardBgColor = bgColor === 'bg-emerald-100' ? `${primaryColor}20` : bgColor;

  return (
    <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300">
      <div 
        className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 rounded-full opacity-20"
        style={{ backgroundColor: cardBgColor }}
      />
      <CardHeader className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
            {isLoading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <p className="text-4xl font-bold text-slate-900">{value}</p>
            )}
            {subtitle && (
              <p className="text-sm text-slate-500 mt-2">{subtitle}</p>
            )}
          </div>
          <div 
            className="p-3 rounded-xl shadow-sm"
            style={{ backgroundColor: cardBgColor }}
          >
            <Icon className="w-6 h-6" style={{ color: typeof cardIconColor === 'string' && cardIconColor.startsWith('#') ? cardIconColor : undefined }} />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
