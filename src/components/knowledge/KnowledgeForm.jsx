import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KnowledgeDocument } from "@/entities/KnowledgeDocument";
import { UploadFile } from "@/api/integrations";
import { Loader2 } from "lucide-react";

export default function KnowledgeForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "other",
    tags: "",
    file_url: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await UploadFile({ file });
      setFormData({...formData, file_url: result.file_url});
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload do arquivo");
    }
    setIsUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await KnowledgeDocument.create({
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        is_active: true
      });
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
      alert("Erro ao salvar documento");
    }
    
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          placeholder="Ex: Política de Reembolso"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoria</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="financial_tips">Dicas Financeiras</SelectItem>
            <SelectItem value="product_info">Informações de Produto</SelectItem>
            <SelectItem value="policies">Políticas</SelectItem>
            <SelectItem value="faq">FAQ</SelectItem>
            <SelectItem value="guides">Guias</SelectItem>
            <SelectItem value="other">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Conteúdo</Label>
        <Textarea
          id="content"
          placeholder="Digite o conteúdo do documento..."
          value={formData.content}
          onChange={(e) => setFormData({...formData, content: e.target.value})}
          rows={8}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">Arquivo (Opcional)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="file"
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>
        {formData.file_url && (
          <p className="text-sm text-emerald-600">✓ Arquivo enviado</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
        <Input
          id="tags"
          placeholder="Ex: financeiro, política, reembolso"
          value={formData.tags}
          onChange={(e) => setFormData({...formData, tags: e.target.value})}
        />
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
          'Salvar Documento'
        )}
      </Button>
    </form>
  );
}