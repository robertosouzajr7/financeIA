
import { useState } from "react";
import { WhatsAppInstance } from "@/entities/WhatsAppInstance";
import { AuthenticatedUser } from "@/entities/AuthenticatedUser";
import { whatsappService } from "@/api/services/whatsappService";
import { adminService } from "@/api/services/adminService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle, Send, Loader2, Settings, RefreshCw } from "lucide-react";

export default function TestWhatsApp() {
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Olá! Este é um teste do FinanceIA.");
  const [diagnostics, setDiagnostics] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isConfiguringWebhook, setIsConfiguringWebhook] = useState(false);
  const [isResetting, setIsResetting] = useState(false); // New state for reset operation
  const [testResult, setTestResult] = useState(null);
  const [webhookError, setWebhookError] = useState(null);
  const [webhookTest, setWebhookTest] = useState(null);

  const runDiagnostics = async () => {
    setIsChecking(true);
    setWebhookError(null);
    const results = {
      instances: { status: "checking", data: null },
      users: { status: "checking", data: null },
      webhook: { status: "checking", data: null }
    };

    try {
      // 1. Verificar instâncias
      const instances = await WhatsAppInstance.list();
      const activeInstances = instances.filter(i => i.is_connected);
      
      results.instances = {
        status: activeInstances.length > 0 ? "ok" : "error",
        data: {
          total: instances.length,
          active: activeInstances.length,
          instances: instances
        },
        message: activeInstances.length > 0 
          ? `${activeInstances.length} instância(s) conectada(s)`
          : "Nenhuma instância conectada! Conecte uma instância primeiro."
      };

      // 2. Verificar usuários autenticados
      const users = await AuthenticatedUser.list();
      
      results.users = {
        status: users.length > 0 ? "ok" : "warning",
        data: {
          total: users.length,
          users: users
        },
        message: users.length > 0 
          ? `${users.length} usuário(s) cadastrado(s)`
          : "Nenhum usuário cadastrado! Cadastre usuários na página 'Segurança'."
      };

      // 3. Verificar configuração do webhook
      if (activeInstances.length > 0) {
        try {
          const webhookCheck = await adminService.checkWebhookConfig();
          results.webhook = {
            status: webhookCheck.data.success ? "ok" : "error",
            data: webhookCheck.data,
            message: webhookCheck.data.success 
              ? "Webhook configurado corretamente"
              : "Webhook não configurado! Clique em 'Reconfigurar Webhook' ou 'RESETAR Webhook' abaixo."
          };
        } catch (error) {
          results.webhook = {
            status: "error",
            data: null,
            message: `Erro ao verificar webhook: ${error.message}`
          };
        }
      } else {
        results.webhook = {
          status: "warning",
          data: null,
          message: "Não foi possível verificar webhook - nenhuma instância ativa"
        };
      }

      setDiagnostics(results);
    } catch (error) {
      console.error("Erro no diagnóstico:", error);
    }
    setIsChecking(false);
  };

  const testWebhookConnection = async () => {
    try {
      const response = await adminService.testWebhookConnection();
      console.log("Teste de webhook:", response.data);
      setWebhookTest(response.data);
    } catch (error) {
      console.error("Erro no teste:", error);
      setWebhookTest({ success: false, error: error.message });
    }
  };

  const configureWebhook = async () => {
    setIsConfiguringWebhook(true);
    setWebhookError(null);
    
    try {
      const response = await adminService.setupWebhook();
      
      console.log("Resposta do webhook:", response.data);
      
      if (response.data.success) {
        alert("✅ Webhook configurado com sucesso! O bot agora deve responder às mensagens.");
        runDiagnostics();
      } else {
        // Capturar e exibir erro detalhado
        const errorDetails = {
          error: response.data.error || "Erro desconhecido",
          details: response.data.details || {},
          status: response.data.details?.status || "N/A",
          response: response.data.details?.response || "N/A"
        };
        
        console.error("Detalhes completos do erro:", errorDetails);
        setWebhookError(errorDetails);
      }
    } catch (error) {
      console.error("Erro ao configurar webhook:", error);
      setWebhookError({
        error: error.message,
        stack: error.stack,
        fullError: error.toString()
      });
    }
    
    setIsConfiguringWebhook(false);
  };

  const resetWebhook = async () => {
    setIsResetting(true);
    setWebhookError(null);
    
    try {
      const response = await adminService.resetWebhook();
      
      console.log("Resposta do reset:", response.data);
      
      if (response.data.success) {
        alert("✅ Webhook resetado com sucesso! Um novo webhook foi criado. Por favor, verifique o status novamente e teste o envio de uma mensagem.");
        runDiagnostics();
      } else {
        const errorDetails = {
          error: response.data.error || "Erro desconhecido ao resetar webhook",
          details: response.data.details || {},
          status: response.data.details?.status || "N/A",
          response: response.data.details?.response || "N/A"
        };
        console.error("Detalhes completos do erro ao resetar webhook:", errorDetails);
        setWebhookError(errorDetails);
      }
    } catch (error) {
      console.error("Erro ao resetar webhook:", error);
      setWebhookError({
        error: error.message,
        stack: error.stack,
        fullError: error.toString()
      });
    }
    
    setIsResetting(false);
  };

  const sendTestMessage = async () => {
    if (!testPhone) {
      alert("Digite um número de telefone");
      return;
    }

    setIsSending(true);
    setTestResult(null);

    try {
      const response = await whatsappService.sendMessage(testPhone, testMessage);

      setTestResult({
        success: response.data.success,
        message: response.data.success 
          ? "Mensagem enviada com sucesso!"
          : `Erro: ${response.data.error}`,
        details: response.data
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Erro ao enviar: ${error.message}`,
        details: error
      });
    }
    setIsSending(false);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "ok": return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case "error": return <XCircle className="w-5 h-5 text-red-600" />;
      case "warning": return <AlertCircle className="w-5 h-5 text-amber-600" />;
      default: return <Loader2 className="w-5 h-5 animate-spin text-blue-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "ok": return "bg-emerald-50 border-emerald-200";
      case "error": return "bg-red-50 border-red-200";
      case "warning": return "bg-amber-50 border-amber-200";
      default: return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Diagnóstico do WhatsApp</h1>
          <p className="text-slate-600">Verifique a saúde do sistema e teste o envio de mensagens</p>
        </div>

        {/* Erro do Webhook */}
        {webhookError && (
          <Card className="border-2 border-red-200 bg-red-50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Erro ao Configurar Webhook
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-red-900 mb-1">Mensagem de Erro:</p>
                  <p className="text-sm text-red-800 bg-white p-2 rounded">
                    {webhookError.fullError ? webhookError.fullError : 
                     (typeof webhookError.error === 'string' ? webhookError.error : JSON.stringify(webhookError.error))}
                  </p>
                </div>
                
                {webhookError.details && (
                  <div>
                    <p className="font-semibold text-red-900 mb-1">Detalhes:</p>
                    <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-64 text-red-800">
                      {JSON.stringify(webhookError.details, null, 2)}
                    </pre>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWebhookError(null)}
                  className="mt-2"
                >
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Diagnóstico do Sistema */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Status do Sistema</CardTitle>
              <Button onClick={runDiagnostics} disabled={isChecking}>
                {isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar Status"
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!diagnostics ? (
              <p className="text-center text-slate-500 py-8">
                Clique em "Verificar Status" para diagnosticar o sistema
              </p>
            ) : (
              <>
                {/* Instâncias */}
                <Alert className={getStatusColor(diagnostics.instances.status)}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(diagnostics.instances.status)}
                    <div className="flex-1">
                      <div className="font-semibold mb-1">Instâncias WhatsApp</div>
                      <AlertDescription>{diagnostics.instances.message}</AlertDescription>
                      {diagnostics.instances.data?.instances && (
                        <div className="mt-2 space-y-1">
                          {diagnostics.instances.data.instances.map(inst => (
                            <div key={inst.id} className="text-sm flex items-center gap-2">
                              <Badge variant="outline" className={inst.is_connected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100"}>
                                {inst.instance_name}
                              </Badge>
                              <span className="text-slate-600">{inst.phone || "Sem número"}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>

                {/* Usuários */}
                <Alert className={getStatusColor(diagnostics.users.status)}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(diagnostics.users.status)}
                    <div className="flex-1">
                      <div className="font-semibold mb-1">Usuários Autenticados</div>
                      <AlertDescription>{diagnostics.users.message}</AlertDescription>
                      {diagnostics.users.data?.users && diagnostics.users.data.users.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {diagnostics.users.data.users.map(user => (
                            <div key={user.id} className="text-sm flex items-center gap-2">
                              <Badge variant="outline">
                                {user.user_phone}
                              </Badge>
                              <span className="text-xs text-slate-600">
                                {user.is_authenticated ? "✅ Autenticado" : "⏸️ Aguardando"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>

                {/* Webhook */}
                <Alert className={getStatusColor(diagnostics.webhook.status)}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(diagnostics.webhook.status)}
                    <div className="flex-1">
                      <div className="font-semibold mb-1">Configuração do Webhook</div>
                      <AlertDescription>{diagnostics.webhook.message}</AlertDescription>
                      {diagnostics.webhook.status === "error" && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={configureWebhook}
                            disabled={isConfiguringWebhook}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            size="sm"
                          >
                            {isConfiguringWebhook ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Reconfigurando...
                              </>
                            ) : (
                              <>
                                <Settings className="w-4 h-4 mr-2" />
                                Reconfigurar
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={resetWebhook}
                            disabled={isResetting}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            size="sm"
                          >
                            {isResetting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Resetando...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                RESETAR Webhook
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                      {diagnostics.webhook.data && (
                        <div className="mt-2 text-xs bg-white p-2 rounded">
                          <p><strong>URL Esperada:</strong> {diagnostics.webhook.data.expected_url}</p>
                          <p><strong>URL Configurada:</strong> {diagnostics.webhook.data.configured_url || "Nenhuma"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              </>
            )}
          </CardContent>
        </Card>

        {/* Novo Card: Teste Avançado */}
        <Card className="border-none shadow-lg bg-blue-50">
          <CardHeader>
            <CardTitle>🔧 Teste Avançado do Webhook</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Clique abaixo para ver a configuração completa do webhook na Evolution API. Isso pode ajudar a diagnosticar problemas de comunicação entre a Evolution API e o FinanceIA.
            </p>
            <Button onClick={testWebhookConnection} variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Testar Conexão do Webhook
            </Button>

            {webhookTest && (
              <div className="mt-4">
                <p className="font-semibold mb-2">Resultado do Teste:</p>
                <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-96 border">
                  {JSON.stringify(webhookTest, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teste de Envio */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Testar Envio de Mensagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test_phone">Número do WhatsApp</Label>
              <Input
                id="test_phone"
                placeholder="5571999999999"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">
                Formato: código país + DDD + número (ex: 5571999999999)
              </p>
            </div>

            <div>
              <Label htmlFor="test_message">Mensagem de Teste</Label>
              <Input
                id="test_message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
            </div>

            <Button 
              onClick={sendTestMessage} 
              disabled={isSending || !testPhone}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Mensagem de Teste
                </>
              )}
            </Button>

            {testResult && (
              <Alert className={testResult.success ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}>
                <div className="flex items-start gap-3">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <AlertDescription className="font-semibold">{testResult.message}</AlertDescription>
                    {testResult.details && (
                      <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto">
                        {JSON.stringify(testResult.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card className="border-none shadow-lg bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 mb-3">🔧 Checklist para o Bot Funcionar:</h3>
            <ol className="space-y-2 text-sm text-slate-700">
              <li><strong>1.</strong> ✅ Pelo menos 1 instância WhatsApp conectada (verde)</li>
              <li><strong>2.</strong> ✅ Webhook configurado na Evolution API</li>
              <li><strong>3.</strong> ✅ Usuário cadastrado em "Segurança" com telefone e senha</li>
              <li><strong>4.</strong> ✅ No WhatsApp, enviar: <code className="bg-blue-100 px-2 py-1 rounded">financeIA</code></li>
              <li><strong>5.</strong> ✅ Digitar a senha cadastrada quando solicitado</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
