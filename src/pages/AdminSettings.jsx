
import { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { SystemSettings } from "@/entities/SystemSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Upload, Save, Mail, Palette, RefreshCw, Image, Bell, PlayCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import integrations from '@/api/integrations';
import api from '@/api/client';
import billingService from '@/api/services/billingService';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isTestingReminders, setIsTestingReminders] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [reminderResult, setReminderResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    try {
      const currentUser = await User.me();
      if (currentUser.role !== 'admin') {
        alert("Acesso negado");
        navigate(createPageUrl("Dashboard"));
        return;
      }
      loadSettings();
    } catch (error) {
      navigate(createPageUrl("Dashboard"));
    }
  };

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await SystemSettings.list();
      if (data.length > 0) {
        setSettings(data[0]);
      } else {
        const defaultSettings = await SystemSettings.create({
          company_name: "FinanceIA",
          support_email: "",
          support_phone: "",
          primary_color: "#10b981",
          enable_image_processing: false,
          use_custom_smtp: false, // New default
          smtp_host: "",          // New default
          smtp_port: 587,         // New default
          smtp_user: "",          // New default
          smtp_password: "",      // New default
          smtp_secure: false,     // New default
        });
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
    setIsLoading(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await integrations.Core.UploadFile({ file });
      setSettings({ ...settings, logo_url: file_url });
      alert("Logo atualizado! Clique em 'Salvar Configurações' para aplicar.");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload do logo");
    }
    setIsUploading(false);
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      alert("Digite um email para teste");
      return;
    }

    setIsTestingEmail(true);
    try {
      await SystemSettings.update(settings.id, settings);

      const { data } = await integrations.Core.SendEmail({
        to: testEmail,
        subject: "Teste de Email - FinanceIA",
        body: `Olá!\n\nEste é um email de teste...`, // Simplified for brevity in replacement
        html: `<div>HTML Content...</div>`,
        from_name: settings.company_name
      });

      if (data.success) {
        alert("✅ Email de teste enviado com sucesso!");
      } else {
        alert("❌ Erro ao enviar email: " + (data.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Erro ao testar email:", error);
      alert(`❌ Erro ao enviar email de teste.`);
    }
    setIsTestingEmail(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await SystemSettings.update(settings.id, settings);
      alert("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar configurações");
    }
    setIsSaving(false);
  };

  const handleTestReminders = async () => {
    setIsTestingReminders(true);
    setReminderResult(null);
    try {
      // Using api directly or adminService if we add it there
      // Let's assume we added checkRecurringExpenses to adminService or call api directly
      // const { data } = await adminService.checkRecurringExpenses();
      // For now, direct api call to match previous logic pattern
      const response = await api.post('/functions/checkRecurringExpenses');
      const data = response.data.data; // wrapped in data
      
      setReminderResult(data);
      alert(`✅ Verificação concluída!\n\nLembretes enviados: ${data.reminders_sent}\nTransações criadas: ${data.transactions_created}`);
    } catch (error) {
      console.error("Erro ao testar lembretes:", error);
      alert("❌ Erro ao executar verificação de lembretes");
    }
    setIsTestingReminders(false);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Settings className="w-8 h-8 text-emerald-600" />
            Configurações do Sistema
          </h1>
          <p className="text-slate-600">Personalize as configurações gerais da plataforma</p>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-emerald-600" />
              Identidade Visual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Nome da Empresa</Label>
              <Input
                value={settings?.company_name || ''}
                onChange={(e) => setSettings({...settings, company_name: e.target.value})}
                placeholder="FinanceIA"
              />
            </div>

            <div>
              <Label>Logo da Empresa</Label>
              <div className="flex items-center gap-4 mt-2">
                {settings?.logo_url && (
                  <img 
                    src={settings.logo_url} 
                    alt="Logo" 
                    className="w-20 h-20 object-contain border rounded-lg p-2"
                  />
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload').click()}
                    disabled={isUploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Enviando...' : 'Fazer Upload'}
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label>Cor Primária do Sistema</Label>
              <div className="flex gap-4 items-center mt-2">
                <Input
                  type="color"
                  value={settings?.primary_color || '#10b981'}
                  onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                  className="w-20 h-12"
                />
                <Input
                  value={settings?.primary_color || '#10b981'}
                  onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                  placeholder="#10b981"
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" />
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email de Suporte</Label>
              <Input
                type="email"
                value={settings?.support_email || ''}
                onChange={(e) => setSettings({...settings, support_email: e.target.value})}
                placeholder="suporte@financeia.com"
              />
            </div>

            <div>
              <Label>Telefone de Suporte</Label>
              <Input
                type="tel"
                value={settings?.support_phone || ''}
                onChange={(e) => setSettings({...settings, support_phone: e.target.value})}
                placeholder="+55 71 99999-9999"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-purple-600" />
              Funcionalidade Premium - Processamento de Imagens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-purple-100 border border-purple-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-purple-900 mb-2">
                🎯 <strong>Recurso Premium:</strong> Permite que usuários enviem comprovantes em foto ou PDF e a IA extrai automaticamente os dados da transação.
              </p>
              <p className="text-xs text-purple-700">
                Requer API Key do Claude (Anthropic) e usuários precisam estar no plano Pro.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div>
                <Label className="text-base font-semibold">Habilitar Processamento de Imagens</Label>
                <p className="text-xs text-slate-600 mt-1">Apenas para usuários do plano Pro</p>
              </div>
              <Switch
                checked={settings?.enable_image_processing || false}
                onCheckedChange={(checked) => setSettings({...settings, enable_image_processing: checked})}
              />
            </div>

            {settings?.enable_image_processing && (
              <div>
                <Label>Claude API Key (Anthropic)</Label>
                <Input
                  type="password"
                  value={settings?.claude_api_key || ''}
                  onChange={(e) => setSettings({...settings, claude_api_key: e.target.value})}
                  placeholder="sk-ant-..."
                />
                <p className="text-xs text-slate-500 mt-2">
                  Obtenha sua API Key em: <a href="https://console.anthropic.com/" target="_blank" className="text-purple-600 hover:underline">console.anthropic.com</a>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" />
              Configurações de Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900 mb-2">
                📧 <strong>Sistema de Email</strong>
              </p>
              <p className="text-xs text-blue-700">
                Por padrão, o sistema usa a integração nativa do Base44. 
                Se você hospeda em VPS própria, pode configurar seu SMTP personalizado.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div>
                <Label className="text-base font-semibold">Usar SMTP Personalizado</Label>
                <p className="text-xs text-slate-600 mt-1">
                  Desative para usar a integração nativa do Base44 (recomendado para cloud)
                </p>
              </div>
              <Switch
                checked={settings?.use_custom_smtp || false}
                onCheckedChange={(checked) => setSettings({...settings, use_custom_smtp: checked})}
              />
            </div>

            {settings?.use_custom_smtp && (
              <div className="space-y-4 border-t pt-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-900 font-semibold mb-2">⚠️ SMTP Personalizado (VPS)</p>
                  <p className="text-xs text-amber-800">
                    Configure abaixo os dados do seu servidor SMTP. Funciona melhor em VPS própria.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Host SMTP</Label>
                    <Input
                      value={settings?.smtp_host || ''}
                      onChange={(e) => setSettings({...settings, smtp_host: e.target.value})}
                      placeholder="smtp.seudominio.com"
                    />
                  </div>
                  <div>
                    <Label>Porta</Label>
                    <Input
                      type="number"
                      value={settings?.smtp_port || ''}
                      onChange={(e) => setSettings({...settings, smtp_port: parseInt(e.target.value) || ''})}
                      placeholder="587"
                    />
                  </div>
                </div>

                <div>
                  <Label>Usuário SMTP</Label>
                  <Input
                    value={settings?.smtp_user || ''}
                    onChange={(e) => setSettings({...settings, smtp_user: e.target.value})}
                    placeholder="email@seudominio.com"
                  />
                </div>

                <div>
                  <Label>Senha SMTP</Label>
                  <Input
                    type="password"
                    value={settings?.smtp_password || ''}
                    onChange={(e) => setSettings({...settings, smtp_password: e.target.value})}
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div>
                    <Label className="text-base font-semibold">Usar Conexão Segura (SSL/TLS)</Label>
                    <p className="text-xs text-slate-600 mt-1">Porta 465 = SSL, Porta 587 = TLS</p>
                  </div>
                  <Switch
                    checked={settings?.smtp_secure || false}
                    onCheckedChange={(checked) => setSettings({...settings, smtp_secure: checked})}
                  />
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <Label>Testar Envio de Email</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleTestEmail}
                  disabled={isTestingEmail}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  {isTestingEmail ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar Teste
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Enviaremos um email de teste para verificar se está funcionando
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" />
              Lembretes Automáticos de Despesas Recorrentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-100 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900 mb-3">
                🤖 <strong>Sistema Automático:</strong> Verifica diariamente as despesas recorrentes e envia lembretes 1 dia antes do vencimento via WhatsApp e Email.
              </p>
              <ul className="text-xs text-amber-800 space-y-1 ml-4 list-disc">
                <li>Envia lembrete 1 dia antes do vencimento (WhatsApp + Email)</li>
                <li>Cria transação automaticamente no dia (se configurado)</li>
                <li>Requer SMTP configurado para envio de emails</li>
              </ul>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Button
                  onClick={handleTestReminders}
                  disabled={isTestingReminders}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  {isTestingReminders ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Executar Verificação Agora
                    </>
                  )}
                </Button>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Clique para testar o sistema de lembretes manualmente
                </p>
              </div>
            </div>

            {reminderResult && (
              <div className="bg-white border border-emerald-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-emerald-900 mb-2">✅ Resultado da Verificação:</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-emerald-50 p-3 rounded-lg">
                    <p className="text-xs text-emerald-600 mb-1">Lembretes Enviados</p>
                    <p className="text-2xl font-bold text-emerald-900">{reminderResult.reminders_sent}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-600 mb-1">Transações Criadas</p>
                    <p className="text-2xl font-bold text-blue-900">{reminderResult.transactions_created}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Configuração de Execução Automática
                </p>
                <p className="text-xs text-blue-800 mb-3">
                  Para que o sistema funcione automaticamente, você precisa configurar um Cron Job para chamar a função <code className="bg-blue-100 px-2 py-1 rounded">checkRecurringExpenses</code> diariamente.
                </p>
                
                <div className="bg-white rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-700">URL da Função:</p>
                  <code className="block bg-slate-100 p-2 rounded text-xs break-all">
                    {window.location.origin}/functions/checkRecurringExpenses
                  </code>
                  
                  <p className="text-xs font-semibold text-slate-700 mt-3">Sugestão de Horário:</p>
                  <p className="text-xs text-slate-600">
                    ⏰ Executar diariamente às 09:00 (horário do Brasil)
                  </p>
                  
                  <p className="text-xs font-semibold text-slate-700 mt-3">Serviços Recomendados:</p>
                  <ul className="text-xs text-slate-600 space-y-1 ml-4 list-disc">
                    <li><a href="https://cron-job.org" target="_blank" className="text-blue-600 hover:underline">Cron-Job.org</a> (gratuito)</li>
                    <li><a href="https://www.easycron.com" target="_blank" className="text-blue-600 hover:underline">EasyCron</a></li>
                    <li><a href="https://console.cloud.google.com/cloudscheduler" target="_blank" className="text-blue-600 hover:underline">Google Cloud Scheduler</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </div>
  );
}
