import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PaymentSuccess() {
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Simular verificação do pagamento
    setTimeout(() => {
      setIsVerifying(false);
    }, 2000);
  }, []);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-2xl">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-16 h-16 text-emerald-600 mx-auto mb-6 animate-spin" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Verificando pagamento...</h2>
            <p className="text-slate-600">Aguarde um momento</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-none shadow-2xl">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-emerald-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Pagamento Confirmado! 🎉
          </h1>
          
          <p className="text-lg text-slate-600 mb-8">
            Sua assinatura foi ativada com sucesso. Agora você tem acesso completo a todos os recursos do FinanceIA!
          </p>

          <div className="space-y-3">
            <Link to={createPageUrl("Dashboard")}>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg">
                Ir para o Dashboard
              </Button>
            </Link>
            
            <Link to={createPageUrl("Instances")}>
              <Button variant="outline" className="w-full py-6 text-lg">
                Criar Primeiro Chatbot
              </Button>
            </Link>
          </div>

          <p className="text-sm text-slate-500 mt-8">
            Enviamos um email de confirmação com todos os detalhes da sua assinatura.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}