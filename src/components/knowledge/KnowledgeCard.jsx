import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, Eye, EyeOff } from "lucide-react";

const categoryLabels = {
  financial_tips: "Dicas Financeiras",
  product_info: "Info. Produto",
  policies: "Políticas",
  faq: "FAQ",
  guides: "Guias",
  other: "Outro"
};

export default function KnowledgeCard({ document, onDelete, onToggleActive }) {
  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg line-clamp-1">{document.title}</CardTitle>
              <Badge variant="outline" className="mt-1 text-xs">
                {categoryLabels[document.category]}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600 line-clamp-3 mb-4">{document.content}</p>
        
        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {document.tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleActive(document)}
            className="flex-1"
          >
            {document.is_active ? (
              <>
                <Eye className="w-4 h-4 mr-1" />
                Ativo
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 mr-1" />
                Inativo
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(document.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}