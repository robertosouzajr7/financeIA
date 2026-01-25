import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2, Smartphone, User, ArrowRight, ShieldCheck } from "lucide-react";
import { api } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import { QRCodeCanvas } from "qrcode.react";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '', // Optional for now based on backend, but good for SaaS
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [instanceStatus, setInstanceStatus] = useState('disconnected');
  const navigate = useNavigate();
  const { login } = useAuth();

  // Step 1: Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // 1. Register User (This endpoint needs to be updated to handle trial logic on backend)
      // We'll trust the plan to update the backend next.
      const registerRes = await api.post('/auth/register', {
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
        // email: formData.email // Add to backend if needed
      });

      // 2. Auto Login
      await login(formData.phone, formData.password);
      
      setStep(2);
    } catch (error) {
      console.error("Registration failed:", error);
      const msg = error.response?.data?.message || "Erro ao criar conta. Verifique os dados.";
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Connect WhatsApp
  useEffect(() => {
    let interval;
    if (step === 2) {
        // Start polling for QR Code or Instance creation
        const createInstance = async () => {
            try {
                // Determine instance name (e.g., user phone)
                const instanceName = formData.phone;
                
                // Create or Get instance
                // Note: This matches the "create" logic in Instances.jsx but automated
                // Create or Get instance
                let instanceId;
                try {
                    const res = await api.post('/whatsapp-instances', {
                        instance_name: instanceName
                    });
                    instanceId = res.data.id;
                } catch (e) {
                    // If already exists or error, try to fetch to get ID
                    try {
                        const res = await api.get(`/whatsapp-instances/name/${instanceName}`);
                        instanceId = res.data.id;
                    } catch (innerE) {
                        console.error("Could not find instance", innerE);
                    }
                }

                if (instanceId) {
                    // Start the session!
                    await api.post(`/whatsapp-instances/${instanceId}/start`).catch(console.error);
                }

                // Poll status
                interval = setInterval(async () => {
                    try {
                        const res = await api.get(`/whatsapp-instances/name/${instanceName}`);
                        const instance = res.data;
                        
                        if (instance.qr) {
                            setQrCode(instance.qr);
                        }
                        
                        if (instance.status === 'connected') {
                            setInstanceStatus('connected');
                            setStep(3);
                            clearInterval(interval);
                        }
                    } catch (err) {
                        console.error("Polling error", err);
                    }
                }, 3000);

            } catch (error) {
                console.error("Failed to init whatsapp", error);
            }
        };
        createInstance();
    }
    return () => clearInterval(interval);
  }, [step, formData.phone]);


  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-none shadow-xl">
        <CardHeader className="text-center bg-white border-b rounded-t-xl py-8">
            <div className="flex justify-center mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200'} transition-colors`}>1</div>
                <div className="w-16 h-1 bg-slate-200 mt-4 mx-2 relative">
                    <div className={`absolute top-0 left-0 h-full bg-emerald-600 transition-all duration-500`} style={{width: step > 1 ? '100%' : '0%'}}></div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200'} transition-colors`}>2</div>
                <div className="w-16 h-1 bg-slate-200 mt-4 mx-2 relative">
                    <div className={`absolute top-0 left-0 h-full bg-emerald-600 transition-all duration-500`} style={{width: step > 2 ? '100%' : '0%'}}></div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200'} transition-colors`}>3</div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
                {step === 1 && "Criar sua Conta Grátis"}
                {step === 2 && "Conectar WhatsApp"}
                {step === 3 && "Tudo Pronto!"}
            </CardTitle>
            <CardDescription className="text-lg">
                {step === 1 && "Experimente o Plano Pro por 7 dias. Sem cartão de crédito."}
                {step === 2 && "Escaneie o QR Code para ativar seu assistente."}
                {step === 3 && "Seu assistente financeiro está ativo."}
            </CardDescription>
        </CardHeader>

        <CardContent className="p-8 bg-white rounded-b-xl">
            {step === 1 && (
                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Seu Nome</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input 
                                    id="name" 
                                    placeholder="João Silva" 
                                    className="pl-9" 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">WhatsApp (com DDD)</Label>
                            <div className="relative">
                                <Smartphone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input 
                                    id="phone" 
                                    placeholder="5511999999999" 
                                    className="pl-9" 
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Senha de Acesso</Label>
                        <Input 
                            id="password" 
                            type="password" 
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            required
                        />
                    </div>
                    
                    <Button type="submit" className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Continuar"} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </form>
            )}

            {step === 2 && (
                <div className="flex flex-col items-center space-y-6 animate-in fade-in duration-500">
                    <div className="w-64 h-64 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 relative overflow-hidden">
                        {instanceStatus === 'connected' ? (
                            <div className="bg-emerald-50 w-full h-full flex flex-col items-center justify-center text-emerald-600">
                                <Check className="w-16 h-16 mb-2" />
                            </div>
                        ) : qrCode ? (
                            <QRCodeCanvas 
                                value={qrCode} 
                                size={256}
                                level={"H"}
                                className="w-full h-full object-contain p-4"
                            />
                        ) : (
                            <div className="text-center p-4">
                                <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-2" />
                                <p className="text-sm text-slate-500">Gerando QR Code...</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="text-center max-w-sm">
                        <p className="text-slate-600 mb-2">Abra o WhatsApp no seu celular, vá em <strong>Aparelhos Conectados &gt; Conectar Aparelho</strong></p>
                    </div>

                    {/* Fallback button if stuck */}
                    <div className="pt-4 border-t w-full flex justify-between items-center">
                        <Button variant="ghost" onClick={() => setStep(3)}>Pular por enquanto</Button>
                        {instanceStatus === 'connected' && (
                             <Button onClick={() => setStep(3)} className="bg-emerald-600">Continuar <ArrowRight className="ml-2 w-4 h-4" /></Button>
                        )}
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="text-center space-y-6 animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Parabéns, {formData.name}!</h3>
                    <p className="text-lg text-slate-600 max-w-md mx-auto">
                        Você agora tem <strong>7 dias grátis</strong> do Plano Pro.
                        <br/>
                        Envie uma mensagem para o seu próprio número ou comece a configurar suas metas.
                    </p>
                    
                    <Button onClick={() => navigate('/Dashboard')} className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700">
                        Ir para o Dashboard
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>
      
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-200/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
