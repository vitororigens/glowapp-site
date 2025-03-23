import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";

export default function AgendaPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Agenda</h1>
      <div className="flex flex-col lg:flex-col gap-6">
        <Card className="p-4 flex-shrink-0 lg:w-full">
          <Calendar mode="single" className="rounded-md border" />
        </Card>
        <Card className="p-4 flex-grow">
          <h2 className="mb-4 text-xl font-semibold">Agendamentos do Dia</h2>
          <div className="space-y-4">
            {/* Lista de agendamentos aqui */}
            <p className="text-muted-foreground">Nenhum agendamento para hoje.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}