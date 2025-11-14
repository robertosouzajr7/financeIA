import { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { SupportTicket } from "@/entities/SupportTicket";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Ticket, MessageSquare, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("open");
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAndLoad();
  }, [filterStatus]);

  const checkAdminAndLoad = async () => {
    try {
      const currentUser = await User.me();
      if (currentUser.role !== 'admin') {
        alert("Acesso negado");
        navigate(createPageUrl("Dashboard"));
        return;
      }
      loadTickets();
    } catch (error) {
      navigate(createPageUrl("Dashboard"));
    }
  };

  const loadTickets = async () => {
    setIsLoading(true);
    const data = filterStatus === "all" 
      ? await SupportTicket.list("-created_date")
      : await SupportTicket.filter({ status: filterStatus }, "-created_date");
    setTickets(data);
    setIsLoading(false);
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-blue-100 text-blue-700'
    };
    return <Badge className={colors[priority]}>{priority}</Badge>;
  };

  const getStatusBadge = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-amber-100 text-amber-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-slate-100 text-slate-700'
    };
    const labels = {
      open: 'Aberto',
      in_progress: 'Em Andamento',
      resolved: 'Resolvido',
      closed: 'Fechado'
    };
    return <Badge className={colors[status]}>{labels[status]}</Badge>;
  };

  const handleRespond = async () => {
    if (!response.trim() || !selectedTicket) return;

    try {
      const currentUser = await User.me();
      await SupportTicket.update(selectedTicket.id, {
        response,
        assigned_to: currentUser.email,
        status: 'in_progress'
      });
      
      setResponse("");
      setSelectedTicket(null);
      loadTickets();
      alert("Resposta enviada com sucesso!");
    } catch (error) {
      console.error("Erro ao responder ticket:", error);
      alert("Erro ao enviar resposta");
    }
  };

  const handleResolve = async (ticketId) => {
    try {
      await SupportTicket.update(ticketId, { status: 'resolved' });
      loadTickets();
    } catch (error) {
      console.error("Erro ao resolver ticket:", error);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Ticket className="w-8 h-8 text-emerald-600" />
              Central de Suporte
            </h1>
            <p className="text-slate-600">Gerencie tickets de suporte dos clientes</p>
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Abertos</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="resolved">Resolvidos</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-6">Carregando...</CardContent>
            </Card>
          ) : tickets.length === 0 ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Nenhum ticket encontrado</p>
              </CardContent>
            </Card>
          ) : (
            tickets.map((ticket) => (
              <Card key={ticket.id} className="border-none shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-slate-900">
                          {ticket.subject}
                        </h3>
                        {getPriorityBadge(ticket.priority)}
                        {getStatusBadge(ticket.status)}
                      </div>
                      
                      <p className="text-slate-600 mb-3">{ticket.message}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>De: {ticket.user_email}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(ticket.created_date), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>

                      {ticket.response && (
                        <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                          <p className="text-sm font-medium text-emerald-900 mb-1">Resposta:</p>
                          <p className="text-slate-700">{ticket.response}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {ticket.status !== 'resolved' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Responder
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResolve(ticket.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Resolver
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Responder Ticket</DialogTitle>
            </DialogHeader>
            
            {selectedTicket && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="font-medium text-slate-900 mb-2">{selectedTicket.subject}</p>
                  <p className="text-slate-600 text-sm">{selectedTicket.message}</p>
                  <p className="text-xs text-slate-500 mt-2">De: {selectedTicket.user_email}</p>
                </div>

                <div>
                  <Textarea
                    placeholder="Digite sua resposta..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={6}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleRespond}
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={!response.trim()}
                  >
                    Enviar Resposta
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}