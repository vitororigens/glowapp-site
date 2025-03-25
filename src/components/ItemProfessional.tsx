"use client";
import { Button } from "@/components/ui/button";

interface ItemProfessionalProps {
  id: string;
  name: string;
  specialty: string;
  onRemove: (id: string) => void;
}

export function ItemProfessional({ id, name, specialty, onRemove }: ItemProfessionalProps) {
  return (
    <div className="flex items-center justify-between p-2 border rounded-lg mb-2">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-gray-500">
          Especialidade: {specialty}
        </p>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => onRemove(id)}
      >
        Remover
      </Button>
    </div>
  );
} 