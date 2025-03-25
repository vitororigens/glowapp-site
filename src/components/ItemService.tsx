"use client";

import { Button } from "@/components/ui/button";
import { currencyMask } from "@/utils/maks/masks";

interface ItemServiceProps {
  id: string;
  code: string;
  name: string;
  price: string;
  onRemove: (id: string) => void;
}

export function ItemService({ id, code, name, price, onRemove }: ItemServiceProps) {
  return (
    <div className="flex items-center justify-between p-2 border rounded-lg mb-2">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-gray-500">
          Código: {code} | Valor: {currencyMask(price)}
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