import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Smartphone, QrCode } from "lucide-react";
import { createEvolutionInstance } from "@/functions/createEvolutionInstance";
import { checkInstanceConnection } from "@/functions/checkInstanceConnection";

export default function CreateInstanceForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    instance_name: "",
    phone: ""
  });
  const [isCreating, setIsCreating] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [instanceId, setInstanceId] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const { data } = await createEvolutionInstance(formData);

      if (data.success) {
        setQrCode(data.qr_code);
        setInstanceId(data.instance.instance_id);
        startConnectionCheck(data.instance.instance_id);
      } else {
        throw new Error(data.error || "Erro ao criar instância");
      }
    } catch (error) {
      console.error("Erro ao criar instância:", error);
      setError(error.message || "Erro ao criar instância. Tente novamente.");
    } finally {
      setIsCreating(false);
    }
  };

  const startConnectionCheck = (instId) => {
    setIsChecking(true);
    
    const checkInterval = setInterval(async () => {
      try {
        const response = await checkInstanceConnection({ instance_id: instId });
        
        if (response.data.success && response.data.is_connected) {
          setIsConnected(true);
          setIsChecking(false);
          clearInterval(checkInterval);
          
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } catch (error) {
        console.error("Erro ao verificar conexão:", error);
      }
    }, 3000);

    setTimeout(() => {
      clearInterval(checkInterval);
      if (!isConnected) {
        setIsChecking(false);
      }
    }, 300000);
  };

  if (isConnected) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Conectado com Sucesso!</h3>
          <p className="text-sm text-slate-600">A instância WhatsApp está online e pronta para uso.</p>
        </div>
      </div>
    );
  }

  if (qrCode) {
    return (
      <div className="text-center py-6 space-y-6">
        <div className="space-y-2">
          <QrCode className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="font-bold text-lg text-slate-900">Escaneie o QR Code</h3>
          <p className="text-sm text-slate-600">
            Abra o WhatsApp no seu celular e escaneie o código abaixo:
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border-2 border-slate-200 inline-block">
          <img 
            src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
            alt="QR Code WhatsApp" 
            className="w-64 h-64"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Aguardando conexão...</span>
          </div>
          <p className="text-xs text-slate-500">
            1. Abra WhatsApp no celular<br/>
            2. Toque em Mais opções (ou Configurações no iOS) → Aparelhos conectados<br/>
            3. Toque em Conectar um aparelho<br/>
            4. Aponte seu celular para esta tela
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="instance_name">Nome da Instância</Label>
        <Input
          id="instance_name"
          placeholder="Ex: Família Silva"
          value={formData.instance_name}
          onChange={(e) => setFormData({...formData, instance_name: e.target.value})}
          required
          disabled={isCreating}
        />
        <p className="text-xs text-slate-500">Use um nome descritivo para identificar a instância</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone (opcional)</Label>
        <Input
          id="phone"
          placeholder="Ex: 5571999999999"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          disabled={isCreating}
        />
        <p className="text-xs text-slate-500">Formato: código do país + DDD + número</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          <p>{error}</p>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full bg-emerald-600 hover:bg-emerald-700"
        disabled={isCreating}
      >
        {isCreating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Criando instância...
          </>
        ) : (
          <>
            <Smartphone className="w-4 h-4 mr-2" />
            Criar e Conectar
          </>
        )}
      </Button>
    </form>
  );
}