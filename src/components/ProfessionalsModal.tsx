import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, User } from "lucide-react";

interface Professional {
  id: string;
  name: string;
  cpfCnpj: string;
  phone: string;
  email: string;
  address: string;
  observations: string;
  registrationNumber: string;
  specialty: string;
  imageUrl?: string;
}

interface ProfessionalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionals: Professional[];
  onSelect: (professional: Professional) => void;
}

export function ProfessionalsModal({ isOpen, onClose, professionals, onSelect }: ProfessionalsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProfessionals = professionals.filter(professional =>
    professional.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (professional.specialty && professional.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">
            Selecionar Profissional
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar profissional..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ textIndent: '1.5rem' }}
            />
          </div>

          <ScrollArea className="h-64">
            <div className="space-y-2">
              {filteredProfessionals.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhum profissional encontrado
                </p>
              ) : (
                filteredProfessionals.map((professional) => (
                  <div
                    key={professional.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => onSelect(professional)}
                  >
                                         <div className="flex items-center space-x-3">
                       <User className="h-5 w-5 text-gray-400" />
                       <div>
                         <p className="font-medium">{professional.name}</p>
                         <p className="text-sm text-gray-500">{professional.specialty}</p>
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
