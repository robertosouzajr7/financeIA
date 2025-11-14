import { useState, useEffect } from "react";
import { EmailTemplate } from "@/entities/EmailTemplate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, X } from "lucide-react";
import ReactQuill from 'react-quill';

export default function EmailTemplateForm({ onSuccess, template }) {
  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    description: "",
    subject: "",
    body_html: "",
    body_text: "",
    signature: "",
    footer: "",
    variables: [],
    category: "other",
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newVariable, setNewVariable] = useState("");

  useEffect(() => {
    if (template) {
      setFormData(template);
    }
  }, [template]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (template) {
        await EmailTemplate.update(template.id, formData);
      } else {
        await EmailTemplate.create(formData);
      }
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar template:", error);
      alert("Erro ao salvar template. Tente novamente.");
    }
    
    setIsSubmitting(false);
  };

  const addVariable = () => {
    if (newVariable && !formData.variables.includes(newVariable)) {
      setFormData({
        ...formData,
        variables: [...formData.variables, newVariable]
      });
      setNewVariable("");
    }
  };

  const removeVariable = (variable) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter(v => v !== variable)
    });
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ]
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome Interno (identificador único)</Label>
          <Input
            id="name"
            placeholder="welcome_email"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          <p className="text-xs text-slate-500">Use snake_case, sem espaços</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="display_name">Nome de Exibição</Label>
          <Input
            id="display_name"
            placeholder="Email de Boas-Vindas"
            value={formData.display_name}
            onChange={(e) => setFormData({...formData, display_name: e.target.value})}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          placeholder="Enviado quando um novo usuário se cadastra"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">Sistema</SelectItem>
              <SelectItem value="alerts">Alertas</SelectItem>
              <SelectItem value="reports">Relatórios</SelectItem>
              <SelectItem value="reminders">Lembretes</SelectItem>
              <SelectItem value="authentication">Autenticação</SelectItem>
              <SelectItem value="other">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <Label htmlFor="is_active">Template Ativo</Label>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Assunto do Email</Label>
        <Input
          id="subject"
          placeholder="Bem-vindo ao {{company_name}}!"
          value={formData.subject}
          onChange={(e) => setFormData({...formData, subject: e.target.value})}
          required
        />
        <p className="text-xs text-slate-500">Use variáveis como {`{{user_name}}`}, {`{{amount}}`}, etc.</p>
      </div>

      <div className="space-y-2">
        <Label>Corpo do Email (HTML)</Label>
        <ReactQuill
          theme="snow"
          value={formData.body_html}
          onChange={(value) => setFormData({...formData, body_html: value})}
          modules={quillModules}
          className="bg-white"
        />
        <p className="text-xs text-slate-500">Você pode usar HTML e variáveis como {`{{user_name}}`}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="body_text">Versão em Texto Puro (fallback)</Label>
        <Textarea
          id="body_text"
          placeholder="Versão simplificada sem HTML..."
          value={formData.body_text}
          onChange={(e) => setFormData({...formData, body_text: e.target.value})}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signature">Assinatura</Label>
        <Textarea
          id="signature"
          placeholder="Atenciosamente,\nEquipe {{company_name}}"
          value={formData.signature}
          onChange={(e) => setFormData({...formData, signature: e.target.value})}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="footer">Rodapé</Label>
        <Textarea
          id="footer"
          placeholder="© 2025 {{company_name}}. Todos os direitos reservados."
          value={formData.footer}
          onChange={(e) => setFormData({...formData, footer: e.target.value})}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Variáveis Dinâmicas</Label>
        <div className="flex gap-2">
          <Input
            placeholder="user_name"
            value={newVariable}
            onChange={(e) => setNewVariable(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
          />
          <Button type="button" onClick={addVariable} variant="outline">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.variables.map((variable) => (
            <div key={variable} className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
              <code className="text-xs">{`{{${variable}}}`}</code>
              <button
                type="button"
                onClick={() => removeVariable(variable)}
                className="text-slate-500 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Exemplos: user_name, amount, date, transaction_description, budget_category
        </p>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-emerald-600 hover:bg-emerald-700"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Salvando...
          </>
        ) : (
          template ? 'Salvar Alterações' : 'Criar Template'
        )}
      </Button>
    </form>
  );
}