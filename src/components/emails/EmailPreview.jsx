import { Card, CardContent } from "@/components/ui/card";

export default function EmailPreview({ template }) {
  const renderWithVariables = (text) => {
    if (!text) return '';
    
    // Substituir variáveis por valores de exemplo
    return text
      .replace(/\{\{user_name\}\}/g, '<strong>João Silva</strong>')
      .replace(/\{\{company_name\}\}/g, '<strong>FinanceIA</strong>')
      .replace(/\{\{amount\}\}/g, '<strong>R$ 150,00</strong>')
      .replace(/\{\{date\}\}/g, '<strong>15/01/2025</strong>')
      .replace(/\{\{transaction_description\}\}/g, '<strong>Supermercado Extra</strong>')
      .replace(/\{\{budget_category\}\}/g, '<strong>Alimentação</strong>')
      .replace(/\{\{([^}]+)\}\}/g, '<span class="text-blue-600">{{$1}}</span>');
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 p-4 rounded-lg">
        <p className="text-xs text-slate-600 mb-1">Assunto:</p>
        <p className="font-semibold" dangerouslySetInnerHTML={{ 
          __html: renderWithVariables(template.subject) 
        }} />
      </div>

      <Card className="border-2">
        <CardContent className="p-6">
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: renderWithVariables(template.body_html) 
            }} 
          />

          {template.signature && (
            <div className="mt-6 pt-4 border-t">
              <div 
                className="text-sm whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ 
                  __html: renderWithVariables(template.signature) 
                }} 
              />
            </div>
          )}

          {template.footer && (
            <div className="mt-6 pt-4 border-t">
              <div 
                className="text-xs text-slate-500 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ 
                  __html: renderWithVariables(template.footer) 
                }} 
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-900">
          💡 <strong>Atenção:</strong> Este é um preview com valores de exemplo. 
          As variáveis serão substituídas pelos valores reais quando o email for enviado.
        </p>
      </div>
    </div>
  );
}