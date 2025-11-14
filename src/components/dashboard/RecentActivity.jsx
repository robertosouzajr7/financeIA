import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, TrendingUp, TrendingDown } from "lucide-react";
import { ConversationMessage } from "@/entities/ConversationMessage";

export default function RecentActivity({ isLoading }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    const allMessages = await ConversationMessage.list("-created_date", 20);
    
    // Filtrar apenas mensagens diretas (não de grupos)
    // Grupos tem formato: 123456789-123456789@g.us
    // Diretas tem formato: 5571999999999 ou 5571999999999@s.whatsapp.net
    const directMessages = allMessages.filter(msg => {
      const phone = msg.user_phone;
      // Se tem "-" ou "@g.us", é grupo - ignorar
      if (phone.includes('-') || phone.includes('@g.us')) {
        return false;
      }
      return true;
    });
    
    setMessages(directMessages.slice(0, 5));
    setLoading(false);
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="p-6 border-b border-slate-100">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {(isLoading || loading) ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-slate-500 py-4">Nenhuma atividade recente</p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 text-sm">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-blue-100' : 'bg-emerald-100'
                }`}>
                  {msg.role === 'user' ? 
                    <TrendingUp className="w-4 h-4 text-blue-600" /> : 
                    <TrendingDown className="w-4 h-4 text-emerald-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 font-medium truncate">{msg.user_phone}</p>
                  <p className="text-slate-600 text-xs truncate">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}