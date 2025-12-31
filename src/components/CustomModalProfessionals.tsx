"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { database } from "@/services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "react-toastify";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { phoneMask } from "@/utils/maks/masks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

interface Professional {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  image?: string;
}

interface CustomModalProfessionalsProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedItems: string[]) => void;
  title: string;
}

export function CustomModalProfessionals({
  visible,
  onClose,
  onConfirm,
  title,
}: CustomModalProfessionalsProps) {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthContext();
  const uid = user?.uid;
  const router = useRouter();

  useEffect(() => {
    if (visible && uid) {
      fetchProfessionals();
    }
  }, [visible, uid]);

  const fetchProfessionals = async () => {
    try {
      const professionalsRef = collection(database, "Profissionals");
      const q = query(professionalsRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      
      const professionalsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Professional[];

      setProfessionals(professionalsData);
    } catch (error) {
      console.error("Erro ao buscar profissionais:", error);
      toast.error("Erro ao carregar profissionais!");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProfessionals = professionals.filter(professional =>
    professional.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professional.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleProfessional = (id: string) => {
    setSelectedProfessionals(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedProfessionals);
    setSelectedProfessionals([]);
    setSearchTerm("");
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <Button variant="outline" onClick={() => router.push('/dashboard/profissionais/novo')}>
            Adicionar Profissional
          </Button>
        </div>

        <div className="mb-4">
          <Label>Buscar</Label>
          <Input
            placeholder="Buscar por nome ou especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <ScrollArea className="h-[60vh] sm:h-[400px]">
          {isLoading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : filteredProfessionals.length === 0 ? (
            <div className="text-center py-4">Nenhum profissional encontrado.</div>
          ) : (
            <div className="space-y-2">
              {filteredProfessionals.map((professional) => (
                <div
                  key={professional.id}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded"
                >
                  <Checkbox
                    id={professional.id}
                    checked={selectedProfessionals.includes(professional.id)}
                    onCheckedChange={() => handleToggleProfessional(professional.id)}
                  />
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={professional.image} />
                    <AvatarFallback>
                      {professional.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Label htmlFor={professional.id} className="font-medium">
                      {professional.name}
                    </Label>
                    <p className="text-sm text-gray-500">
                      Especialidade: {professional.specialty}
                    </p>
                    <p className="text-sm text-gray-500">
                      Telefone: {phoneMask(professional.phone)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
} 