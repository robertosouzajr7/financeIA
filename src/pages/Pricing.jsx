import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Pricing() {
  const [isLoading, setIsLoading] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [error, setError] = useState(null);

  const handleCheckout = async (plan) => {
    try {
      setIsLoading(plan);
      setError(null);
      
      // Verificar se usuário está logado
      const isAuthenticated = await base44.auth.isAuthenticated();
      
      if (!isAuthenticated) {
        // Redirecionar para login com retorno para esta página
        await base44.auth.redirectToLogin(window.location.href);
        return;
      }

      // Chamar função de checkout
      const response = await base44.functions.invoke('createCheckout', { plan });
      
      if (response.data.success && response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        setError(response.data.error || "Erro ao criar checkout. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro:", error);
      setError(error.message || "Erro ao processar pagamento. Tente novamente.");
    } finally {
      setIsLoading(null);
    }
  };

  const plans = {
    basic: {
      name: "Básico",
      monthlyPrice: "R$ 49",
      yearlyPrice: "R$ 490",
      description: "Ideal para começar a organizar suas finanças",
      features: [
        "1 Chatbot WhatsApp",
        "2 Metas e objetivos",
        "5 Orçamentos",
        "5 Alertas personalizados",
        "10 Transações por mês",
        "2 Usuários autorizados",
        "Suporte por email"
      ]
    },
    pro: {
      name: "Pro",
      monthlyPrice: "R$ 149",
      yearlyPrice: "R$ 1.490",
      description: "Solução completa e ilimitada",
      features: [
        "Chatbots ilimitados",
        "Metas ilimitadas",
        "Orçamentos ilimitados",
        "Alertas ilimitados",
        "Transações ilimitadas",
        "Usuários ilimitados",
        "Base de conhecimento personalizada",
        "Relatórios em Excel",
        "Suporte prioritário",
        "Treinamento da IA"
      ],
      highlighted: true
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Escolha seu plano
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Comece gratuitamente e faça upgrade quando precisar
          </p>

          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-md">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full transition-all ${
                billingCycle === "monthly" 
                  ? "bg-emerald-600 text-white shadow-md" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-full transition-all ${
                billingCycle === "yearly" 
                  ? "bg-emerald-600 text-white shadow-md" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Anual <Badge className="ml-2 bg-emerald-100 text-emerald-700">-17%</Badge>
            </button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {Object.entries(plans).map(([key, plan]) => (
            <Card 
              key={key} 
              className={`border-2 ${
                plan.highlighted 
                  ? "border-emerald-600 shadow-2xl scale-105" 
                  : "border-slate-200 shadow-lg"
              }`}
            >
              <CardContent className="p-8">
                {plan.highlighted && (
                  <Badge className="bg-emerald-600 text-white mb-4">
                    Mais Popular
                  </Badge>
                )}
                
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-slate-600 mb-6">{plan.description}</p>
                
                <div className="mb-6">
                  <div className="text-4xl font-bold text-slate-900">
                    {billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                  </div>
                  <div className="text-slate-600">
                    por {billingCycle === "monthly" ? "mês" : "ano"}
                  </div>
                </div>

                <Button 
                  onClick={() => handleCheckout(key)}
                  disabled={isLoading === key}
                  className={`w-full py-6 text-lg ${
                    plan.highlighted 
                      ? "bg-emerald-600 hover:bg-emerald-700" 
                      : "bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  {isLoading === key ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Assinar Agora"
                  )}
                </Button>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}