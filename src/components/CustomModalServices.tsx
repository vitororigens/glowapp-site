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
import { currencyMask } from "@/utils/maks/masks";
import { useRouter } from "next/navigation";

interface Service {
  id: string;
  code: string;
  name: string;
  price: string;
  date?: string;
}

interface CustomModalServicesProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedItems: string[]) => void;
  title: string;
}

export function CustomModalServices({
  visible,
  onClose,
  onConfirm,
  title,
}: CustomModalServicesProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthContext();
  const uid = user?.uid;
  const router = useRouter();

  useEffect(() => {
    if (visible && uid) {
      fetchServices();
    }
  }, [visible, uid]);

  const fetchServices = async () => {
    try {
      const servicesRef = collection(database, "Procedures");
      const q = query(servicesRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      
      const servicesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];

      setServices(servicesData);
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
      toast.error("Erro ao carregar serviços!");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedServices);
    setSelectedServices([]);
    setSearchTerm("");
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <Button variant="outline" onClick={() => router.push('/dashboard/procedimentos/novo')}>
            Adicionar Procedimento
          </Button>
        </div>

        <div className="mb-4">
          <Label>Buscar</Label>
          <Input
            placeholder="Buscar por nome ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <ScrollArea className="h-[60vh] sm:h-[400px]">
          {isLoading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-4">Nenhum serviço encontrado.</div>
          ) : (
            <div className="space-y-2">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded"
                >
                  <Checkbox
                    id={service.id}
                    checked={selectedServices.includes(service.id)}
                    onCheckedChange={() => handleToggleService(service.id)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={service.id} className="font-medium">
                      {service.name}
                    </Label>
                    <p className="text-sm text-gray-500">
                      Código: {service.code} | Valor: {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(Number(service.price) / 100)}
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