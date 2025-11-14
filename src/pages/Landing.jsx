
import { useState, useEffect } from "react";
import { LandingPageSettings } from "@/entities/LandingPageSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, MessageSquare, Shield, TrendingUp, Zap, Users, BarChart3, Crown, Smartphone, PiggyBank, Bell, Target } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Landing() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await LandingPageSettings.list();
      if (data.length > 0) {
        setSettings(data[0]);
      }
    } catch (error) {
      console.log("Usando configurações padrão");
    }
    setIsLoading(false);
  };

  const primaryColor = settings?.primary_color || '#10b981';

  const features = [
    {
      icon: MessageSquare,
      title: "Assistente WhatsApp Inteligente",
      description: "Gestão financeira via chat com IA treinada"
    },
    {
      icon: Shield,
      title: "Segurança LGPD",
      description: "Autenticação por senha e proteção de dados"
    },
    {
      icon: TrendingUp,
      title: "Análise em Tempo Real",
      description: "Dashboards e relatórios instantâneos"
    },
    {
      icon: Zap,
      title: "Automação Inteligente",
      description: "Alertas automáticos de orçamento e metas"
    },
    {
      icon: Users,
      title: "Multi-usuário",
      description: "Equipe completa com acessos controlados"
    },
    {
      icon: BarChart3,
      title: "Relatórios Excel",
      description: "Exportação profissional de dados"
    }
  ];

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

  const useCases = [
    {
      icon: Smartphone,
      title: "Registre Despesas por Foto",
      description: "Tire foto do comprovante e deixe a IA extrair os dados automaticamente"
    },
    {
      icon: PiggyBank,
      title: "Controle de Orçamentos",
      description: "Defina limites e receba alertas antes de estourar o orçamento"
    },
    {
      icon: Target,
      title: "Metas Financeiras",
      description: "Crie objetivos e acompanhe seu progresso em tempo real"
    },
    {
      icon: Bell,
      title: "Alertas Inteligentes",
      description: "Notificações automáticas sobre suas finanças"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section 
        className="relative overflow-hidden pt-20 pb-32"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd, ${primaryColor}bb)` 
        }}
      >
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:40px_40px]" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: `${primaryColor}30` }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: `${primaryColor}20` }} />
        
        <div className="relative max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="bg-white/20 text-white border-white/30 mb-4">
                {settings?.hero_badge_text || "🚀 IA Financeira no WhatsApp"}
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                {settings?.hero_title || "Gestão Financeira"}<br />
                <span className="text-white/90">{settings?.hero_subtitle || "Inteligente e Simples"}</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8">
                {settings?.hero_description || "Controle suas finanças conversando no WhatsApp. IA treinada, segura e poderosa."}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link to={createPageUrl("Pricing")}>
                <Button 
                  size="lg" 
                  className="bg-white text-slate-900 hover:bg-white/90 shadow-2xl text-lg px-8 py-6"
                >
                  {settings?.hero_primary_cta || "Começar Agora"}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-slate-900 transition-all text-lg px-8 py-6"
              >
                {settings?.hero_secondary_cta || "Ver Demonstração"}
              </Button>
            </motion.div>

            {settings?.hero_image_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-16"
              >
                <Card className="max-w-4xl mx-auto border-none shadow-2xl">
                  <CardContent className="p-0">
                    <img 
                      src={settings.hero_image_url}
                      alt="Dashboard FinanceIA"
                      className="w-full h-auto rounded-xl"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-center">
            <div>
              <div className="text-4xl font-bold" style={{ color: primaryColor }}>
                {settings?.stats_users || "500+"}
              </div>
              <div className="text-slate-600">Empresas Ativas</div>
            </div>
            <div>
              <div className="text-4xl font-bold" style={{ color: primaryColor }}>
                {settings?.stats_transactions || "10k+"}
              </div>
              <div className="text-slate-600">Transações/Dia</div>
            </div>
            <div>
              <div className="text-4xl font-bold" style={{ color: primaryColor }}>
                {settings?.stats_satisfaction || "98%"}
              </div>
              <div className="text-slate-600">Satisfação</div>
            </div>
            <div>
              <div className="text-4xl font-bold" style={{ color: primaryColor }}>
                {settings?.stats_rating || "4.9⭐"}
              </div>
              <div className="text-slate-600">Avaliação</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
              Recursos Poderosos
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Ferramentas profissionais para gestão financeira completa
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="border-2 border-slate-100 hover:shadow-xl transition-all duration-300" style={{ '--hover-border-color': primaryColor }}>
                  <CardContent className="p-8">
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <feature.icon className="w-7 h-7" style={{ color: primaryColor }} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
              Como Funciona
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Gestão financeira nunca foi tão fácil
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="border-none shadow-lg hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex gap-6">
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                        style={{ 
                          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` 
                        }}
                      >
                        <useCase.icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">{useCase.title}</h3>
                        <p className="text-slate-600 text-lg">{useCase.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
              Planos e Preços
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Escolha o plano ideal para você
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Comece gratuitamente e faça upgrade quando precisar
            </p>

            <div className="inline-flex items-center bg-slate-100 rounded-full p-1 shadow-md">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-full transition-all ${
                  billingCycle === "monthly" 
                    ? "bg-white text-slate-900 shadow-md" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-2 rounded-full transition-all ${
                  billingCycle === "yearly" 
                    ? "bg-white text-slate-900 shadow-md" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Anual <Badge className="ml-2 text-white" style={{ backgroundColor: primaryColor }}>-17%</Badge>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {Object.entries(plans).map(([key, plan]) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Card className={`border-2 ${
                  plan.highlighted 
                    ? "shadow-2xl scale-105 relative" 
                    : "border-slate-200 shadow-lg"
                }`} style={plan.highlighted ? { borderColor: primaryColor } : {}}>
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="px-6 py-1 shadow-lg text-white" style={{ backgroundColor: primaryColor }}>
                        <Crown className="w-4 h-4 mr-1 inline" />
                        Mais Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                    <p className="text-slate-600 mb-6">{plan.description}</p>
                    
                    <div className="mb-8">
                      <div className="text-5xl font-bold text-slate-900 mb-2">
                        {billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                      </div>
                      <div className="text-slate-600">
                        por {billingCycle === "monthly" ? "mês" : "ano"}
                      </div>
                    </div>

                    <Link to={createPageUrl("Pricing")}>
                      <Button 
                        className={`w-full py-6 text-lg mb-8 ${
                          plan.highlighted 
                            ? "shadow-lg text-white" 
                            : "bg-slate-900 hover:bg-slate-800"
                        }`}
                        style={plan.highlighted ? { backgroundColor: primaryColor } : {}}
                      >
                        Começar Agora
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </Link>

                    <ul className="space-y-4">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div 
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: `${primaryColor}20` }}
                          >
                            <Check className="w-3 h-3" style={{ color: primaryColor }} />
                          </div>
                          <span className="text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {settings?.testimonials && settings.testimonials.length > 0 && (
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <Badge className="mb-4" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                Depoimentos
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Quem usa aprova
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {settings.testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div 
                          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
                          style={{ 
                            background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` 
                          }}
                        >
                          {testimonial.avatar}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{testimonial.name}</div>
                          <div className="text-sm text-slate-600">{testimonial.role}</div>
                        </div>
                      </div>
                      <p className="text-slate-700 text-lg leading-relaxed">"{testimonial.content}"</p>
                      <div className="mt-4 text-yellow-500">⭐⭐⭐⭐⭐</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Final */}
      <section 
        className="py-24 relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` 
        }}
      >
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:40px_40px]" />
        <div className="relative max-w-4xl mx-auto px-4 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Pronto para transformar suas finanças?
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Junte-se a centenas de empresas que já usam FinanceIA
            </p>
            <Link to={createPageUrl("Pricing")}>
              <Button size="lg" className="bg-white hover:bg-white/90 shadow-2xl text-lg px-10 py-6" style={{ color: primaryColor }}>
                Começar Gratuitamente
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-white/80 mt-6">
              Sem cartão de crédito • Cancele quando quiser
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-6 h-6" style={{ color: primaryColor }} />
                <span className="font-bold text-white text-lg">FinanceIA</span>
              </div>
              <p className="text-sm">{settings?.footer_description || "Gestão financeira inteligente via WhatsApp"}</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="transition-colors" style={{ ':hover': { color: primaryColor } }}>Recursos</a></li>
                <li><a href="#" className="transition-colors" style={{ ':hover': { color: primaryColor } }}>Preços</a></li>
                <li><a href="#" className="transition-colors" style={{ ':hover': { color: primaryColor } }}>Segurança</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="transition-colors" style={{ ':hover': { color: primaryColor } }}>Sobre</a></li>
                <li><a href="#" className="transition-colors" style={{ ':hover': { color: primaryColor } }}>Blog</a></li>
                <li><a href="#" className="transition-colors" style={{ ':hover': { color: primaryColor } }}>Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Contato</h4>
              <ul className="space-y-2 text-sm">
                {settings?.contact_email && <li>{settings.contact_email}</li>}
                {settings?.contact_phone && <li>{settings.contact_phone}</li>}
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>&copy; 2025 FinanceIA. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
