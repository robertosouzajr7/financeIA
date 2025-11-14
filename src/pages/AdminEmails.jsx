import { useState, useEffect } from "react";
import { EmailTemplate } from "@/entities/EmailTemplate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Edit, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import EmailTemplateForm from "../components/emails/EmailTemplateForm";
import EmailPreview from "../components/emails/EmailPreview";

export default function AdminEmails() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    const data = await EmailTemplate.list("-created_date");
    setTemplates(data);
    setIsLoading(false);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setShowCreateDialog(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowCreateDialog(true);
  };

  const handleDelete = async (templateId) => {
    if (window.confirm("Tem certeza que deseja deletar este template?")) {
      await EmailTemplate.delete(templateId);
      loadTemplates();
    }
  };

  const handleSuccess = () => {
    setShowCreateDialog(false);
    setEditingTemplate(null);
    loadTemplates();
  };

  const getCategoryColor = (category) => {
    const colors = {
      system: "bg-blue-100 text-blue-800",
      alerts: "bg-red-100 text-red-800",
      reports: "bg-purple-100 text-purple-800",
      reminders: "bg-amber-100 text-amber-800",
      authentication: "bg-emerald-100 text-emerald-800",
      other: "bg-slate-100 text-slate-800"
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Templates de Email</h1>
            <p className="text-slate-600">Gerencie os modelos de emails do sistema</p>
          </div>
          <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={(isOpen) => {
          setShowCreateDialog(isOpen);
          if (!isOpen) setEditingTemplate(null);
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Template' : 'Novo Template de Email'}
              </DialogTitle>
            </DialogHeader>
            <EmailTemplateForm onSuccess={handleSuccess} template={editingTemplate} />
          </DialogContent>
        </Dialog>

        <Dialog open={!!previewTemplate} onOpenChange={(isOpen) => {
          if (!isOpen) setPreviewTemplate(null);
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview do Email</DialogTitle>
            </DialogHeader>
            {previewTemplate && <EmailPreview template={previewTemplate} />}
          </DialogContent>
        </Dialog>

        <div className="grid gap-4">
          {isLoading ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <p className="text-slate-600">Carregando templates...</p>
              </CardContent>
            </Card>
          ) : templates.length === 0 ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <Mail className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">Nenhum template criado</p>
                <Button onClick={handleCreate} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            templates.map((template) => (
              <Card key={template.id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {template.display_name}
                        </h3>
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                        {template.is_active ? (
                          <Badge className="bg-emerald-100 text-emerald-800">Ativo</Badge>
                        ) : (
                          <Badge variant="outline">Inativo</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{template.description}</p>
                      <p className="text-xs text-slate-500">
                        <strong>Assunto:</strong> {template.subject}
                      </p>
                      {template.variables && template.variables.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-slate-500 mb-1">Variáveis disponíveis:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.variables.map((variable) => (
                              <code key={variable} className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                                {`{{${variable}}}`}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(template.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}