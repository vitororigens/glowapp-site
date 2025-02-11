import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

export default function ServicosPage() {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Serviços</h1>
        <Button asChild>
          <Link href="/dashboard/servicos/novo">
            <PlusIcon className="mr-2 h-4 w-4" />
            Novo Serviço
          </Link>
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-lg font-medium">Corte de Cabelo</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Duração: 30 minutos
          </p>
          <p className="mt-1 text-2xl font-bold">R$ 50,00</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-medium">Manicure</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Duração: 45 minutos
          </p>
          <p className="mt-1 text-2xl font-bold">R$ 35,00</p>
        </Card>
      </div>
    </div>
  );
}