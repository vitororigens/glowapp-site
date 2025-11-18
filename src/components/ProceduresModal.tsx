import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, FileText } from "lucide-react";
import { formatCurrencyFromCents } from "@/utils/maks/masks";

interface Procedure {
  id: string;
  code: string;
  name: string;
  duration: number;
  price: number;
}

interface ProceduresModalProps {
  isOpen: boolean;
  onClose: () => void;
  procedures: Procedure[];
  onSelect: (procedure: Procedure) => void;
}

export function ProceduresModal({ isOpen, onClose, procedures, onSelect }: ProceduresModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProcedures = procedures.filter(procedure =>
    procedure.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold" >
            Selecionar Procedimento
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar procedimento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ textIndent: '1.5rem' }}
            />
          </div>

          <ScrollArea className="h-64">
            <div className="space-y-2">
              {filteredProcedures.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhum procedimento encontrado
                </p>
              ) : (
                filteredProcedures.map((procedure) => (
                  <div
                    key={procedure.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => onSelect(procedure)}
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{procedure.name}</p>
                         <p className="text-sm text-gray-500">
                           {formatCurrencyFromCents(procedure.price)}
                         </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
