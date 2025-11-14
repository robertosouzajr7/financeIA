import { useState, useEffect } from "react";
import { KnowledgeDocument } from "@/entities/KnowledgeDocument";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, BookOpen, FileText, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import KnowledgeForm from "../components/knowledge/KnowledgeForm";
import KnowledgeCard from "../components/knowledge/KnowledgeCard";

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    const data = await KnowledgeDocument.list("-created_date");
    setDocuments(data);
    setIsLoading(false);
  };

  const handleDelete = async (id) => {
    if (confirm("Tem certeza que deseja excluir este documento?")) {
      await KnowledgeDocument.delete(id);
      loadDocuments();
    }
  };

  const handleToggleActive = async (doc) => {
    await KnowledgeDocument.update(doc.id, { is_active: !doc.is_active });
    loadDocuments();
  };

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-emerald-600" />
              Base de Conhecimento
            </h1>
            <p className="text-slate-600">Treine a IA com informações importantes para seu negócio</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Documento à Base de Conhecimento</DialogTitle>
              </DialogHeader>
              <KnowledgeForm 
                onSuccess={() => {
                  setShowCreateDialog(false);
                  loadDocuments();
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-lg bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Como Funciona</h3>
                <p className="text-sm text-blue-800">
                  Adicione documentos, políticas, FAQs e informações sobre seus produtos. A IA usará esse conteúdo para responder perguntas dos usuários de forma mais precisa e personalizada.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar documentos..."
            className="pl-10 bg-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="border-none shadow-lg">
                <CardContent className="p-6">Carregando...</CardContent>
              </Card>
            ))
          ) : filteredDocs.length === 0 ? (
            <Card className="border-none shadow-lg col-span-full">
              <CardContent className="p-12 text-center">
                <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">Nenhum documento encontrado</p>
                <p className="text-sm text-slate-500">Adicione documentos para treinar a IA</p>
              </CardContent>
            </Card>
          ) : (
            filteredDocs.map((doc) => (
              <KnowledgeCard
                key={doc.id}
                document={doc}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}