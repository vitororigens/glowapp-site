import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface PlanLimitationAlertProps {
  type: 'clients' | 'images';
  currentCount: number;
  limit: number;
  planName: string;
  show?: boolean;
}

export function PlanLimitationAlert({ 
  type, 
  currentCount, 
  limit, 
  planName, 
  show = true 
}: PlanLimitationAlertProps) {
  const router = useRouter();
  
  if (!show || currentCount < limit) return null;

  const messages = {
    clients: {
      title: 'Limite de Clientes Atingido',
      description: `Você atingiu o limite de ${limit} clientes do seu plano ${planName}.`,
      action: 'Faça upgrade para adicionar mais clientes.'
    },
    images: {
      title: 'Limite de Imagens Atingido',
      description: `Você atingiu o limite de ${limit} imagens por cliente do seu plano ${planName}.`,
      action: 'Faça upgrade para adicionar mais imagens.'
    }
  };

  const message = messages[type];

  return (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        {message.description}
        <Button 
          variant="link" 
          className="p-0 h-auto font-semibold text-yellow-800"
          onClick={() => router.push('/planos')}
        >
          {message.action}
        </Button>
      </AlertDescription>
    </Alert>
  );
}


