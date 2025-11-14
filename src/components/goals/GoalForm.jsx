
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Goal } from "@/entities/Goal";
import { UploadFile } from "@/integrations/Core";
import { Loader2 } from "lucide-react";
import { FinancialTransaction } from "@/entities/FinancialTransaction"; // New import for FinancialTransaction

export default function GoalForm({ onSuccess, goal }) {
  // Initial state for formData, preserving string type for form inputs
  const [formData, setFormData] = useState({
    user_phone: "",
    title: "",
    description: "",
    cover_image_url: "",
    target_amount: "",
    current_amount: "0",
    deadline: "",
    priority: "medium",
    timeline: "medium",
    status: "planning",
    category: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [users, setUsers] = useState([]); // New state for storing unique user phones

  // useEffect to populate formData when a 'goal' prop is provided or updated
  useEffect(() => {
    if (goal) {
      setFormData({
        user_phone: goal.user_phone || "",
        title: goal.title || "",
        description: goal.description || "",
        cover_image_url: goal.cover_image_url || "",
        target_amount: goal.target_amount?.toString() || "", // Ensure numbers are converted to strings for input fields
        current_amount: goal.current_amount?.toString() || "0", // Ensure numbers are converted to strings for input fields
        deadline: goal.deadline || "",
        priority: goal.priority || "medium",
        timeline: goal.timeline || "medium",
        status: goal.status || "planning",
        category: goal.category || ""
      });
    } else {
      // Reset form if goal prop becomes null/undefined (e.g., creating a new goal)
      setFormData({
        user_phone: "",
        title: "",
        description: "",
        cover_image_url: "",
        target_amount: "",
        current_amount: "0",
        deadline: "",
        priority: "medium",
        timeline: "medium",
        status: "planning",
        category: ""
      });
    }
  }, [goal]);

  // New useEffect to load users from FinancialTransactions on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const transactions = await FinancialTransaction.list();
        const uniquePhones = [...new Set(transactions.map(t => t.user_phone))];
        setUsers(uniquePhones);
      } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        // Optionally, add a user-facing error message here
      }
    };
    loadUsers();
  }, []); // Empty dependency array means this runs once on mount

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await UploadFile({ file });
      setFormData({...formData, cover_image_url: result.file_url});
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload da imagem");
    }
    setIsUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Parse target_amount and current_amount to float before sending to API
      // as input fields store values as strings.
      const dataToSave = {
        ...formData,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount)
      };

      if (goal) {
        await Goal.update(goal.id, dataToSave);
      } else {
        await Goal.create(dataToSave);
      }
      
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar meta:", error);
      alert("Erro ao salvar meta. Tente novamente.");
    }
    
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      {/* Replaced Input for user_phone with a Select component as per outline */}
      <div className="space-y-2">
        <Label>Usuário</Label> {/* Label htmlFor removed as per outline */}
        <Select 
          value={formData.user_phone} 
          onValueChange={(value) => setFormData({...formData, user_phone: value})}
          required // Added required prop
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o usuário" />
          </SelectTrigger>
          <SelectContent>
            {users.map(phone => (
              <SelectItem key={phone} value={phone}>{phone}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Título da Meta</Label>
        <Input
          id="title"
          placeholder="Ex: Reforma do Banheiro"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
        />
      </div>

      {/* Updated Image Upload section as per outline */}
      <div className="space-y-2">
        <Label>Imagem de Inspiração</Label> {/* Label htmlFor removed */}
        <div className="space-y-2">
          <Input
            // id="cover_image" removed as per outline
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUploading}
          />
          {isUploading && (
            // Updated p tag for upload message text and styling
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Fazendo upload...
            </p>
          )}
          {formData.cover_image_url && (
            // Updated img div styling
            <div className="relative w-full h-40 rounded-lg overflow-hidden">
              <img 
                src={formData.cover_image_url} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Detalhes sobre o objetivo..."
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="target_amount">Valor Alvo (R$)</Label>
          <Input
            id="target_amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.target_amount}
            onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="current_amount">Valor Atual (R$)</Label>
          <Input
            id="current_amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.current_amount}
            onChange={(e) => setFormData({...formData, current_amount: e.target.value})}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline">Prazo</Label>
        <Input
          id="deadline"
          type="date"
          value={formData.deadline}
          onChange={(e) => setFormData({...formData, deadline: e.target.value})}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Prioridade</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">Urgente</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeline">Prazo</Label>
          <Select value={formData.timeline} onValueChange={(value) => setFormData({...formData, timeline: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Curto (&lt;6m)</SelectItem>
              <SelectItem value="medium">Médio (6-24m)</SelectItem>
              <SelectItem value="long">Longo (&gt;24m)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="planning">Planejando</SelectItem>
            <SelectItem value="saving">Poupando</SelectItem>
            <SelectItem value="executing">Em andamento</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Added Category input field, which was present in formData state but missing from JSX */}
      <div className="space-y-2">
        <Label htmlFor="category">Categoria</Label>
        <Input
          id="category"
          placeholder="Ex: Viagem, Educação, Casa"
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
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
          goal ? 'Atualizar Meta' : 'Criar Meta'
        )}
      </Button>
    </form>
  );
}
