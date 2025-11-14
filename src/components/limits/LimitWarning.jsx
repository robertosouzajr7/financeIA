import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function LimitWarning({ resource, current, limit, onUpgrade }) {
  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900">Limite Atingido</AlertTitle>
      <AlertDescription className="text-amber-800">
        Você atingiu o limite de {limit} {resource} do plano atual ({current}/{limit}).
        <div className="mt-3">
          <Link to={createPageUrl("Pricing")}>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
              <Crown className="w-4 h-4 mr-2" />
              Fazer Upgrade para Pro
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  );
}