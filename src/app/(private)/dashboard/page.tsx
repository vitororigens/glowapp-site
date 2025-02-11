import { Card } from "@/components/ui/card";

export default function DashboardHome() {
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <h3 className="text-lg font-medium">Total de Clientes</h3>
          <p className="mt-2 text-3xl font-bold">150</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-medium">Agendamentos Hoje</h3>
          <p className="mt-2 text-3xl font-bold">12</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-medium">Receita Mensal</h3>
          <p className="mt-2 text-3xl font-bold">R$ 15.000</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-medium">Profissionais Ativos</h3>
          <p className="mt-2 text-3xl font-bold">8</p>
        </Card>
      </div>
    </div>
  );
}