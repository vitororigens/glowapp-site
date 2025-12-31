"use client";

import { useState, useEffect } from "react";
import { FaCamera } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { database } from "@/services/firebase";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "./styles";
import { useAuthContext } from "@/context/AuthContext";
import { phoneMask, cpfMask, cnpjMask } from "@/utils/maks/masks";  // ✅ Importar máscaras

// Tipagem do profissional
type PropsCardProfessional = {
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
};

export default function Profissionais() {
  const [professionals, setProfessionals] = useState<PropsCardProfessional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<PropsCardProfessional | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');  // ✅ Adicionar busca
  const router = useRouter();
  const { user } = useAuthContext();
  const uid = user?.uid;

  const fetchProfessionals = async () => {
    if (!uid) return;

    const professionalsRef = collection(database, "Profissionals");
    const q = query(professionalsRef, where("uid", "==", uid));
    const querySnapshot = await getDocs(q);
    
    const fetchedProfessionals: PropsCardProfessional[] = [];
    querySnapshot.forEach((doc) => {
      fetchedProfessionals.push({ id: doc.id, ...doc.data() } as PropsCardProfessional);
    });
    setProfessionals(fetchedProfessionals);
  };

  useEffect(() => {
    fetchProfessionals();
  }, [uid]);

  const handleSelectProfessional = (professional: PropsCardProfessional) => {
    setSelectedProfessional(professional);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  function handleNewLaunch() {
    router.push("/dashboard/profissionais/novo");
  }

  const handleDeleteProfessional = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este profissional?")) {
      try {
        await deleteDoc(doc(database, "Profissionals", id));
        setProfessionals((prev) => prev.filter((p) => p.id !== id));
      } catch (error) {
        alert("Erro ao excluir profissional!");
      }
    }
  };

  // ✅ Filtrar profissionais pela busca
  const filteredProfessionals = professionals.filter((professional) => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      professional.name.toLowerCase().includes(searchLower) ||
      professional.email.toLowerCase().includes(searchLower) ||
      professional.specialty?.toLowerCase().includes(searchLower) ||
      professional.phone.includes(searchTerm)
    );
  });

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Profissionais</h1>
        <Button onClick={handleNewLaunch}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Adicionar profissionais
        </Button>
      </div>

      {/* ✅ Campo de Busca */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Pesquisar por nome, email, telefone ou especialidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="py-2 px-4 border">Imagem</th>
              <th className="py-2 px-4 border">Nome</th>
              <th className="py-2 px-4 border">Especialidade</th>
              <th className="py-2 px-4 border">Telefone</th>
              <th className="py-2 px-4 border">Email</th>
              <th className="py-2 px-4 border">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredProfessionals.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-500">
                  {searchTerm.trim() 
                    ? "Nenhum profissional encontrado para esta busca." 
                    : "Nenhum profissional cadastrado."}
                </td>
              </tr>
            ) : (
              filteredProfessionals.map((professional) => (
              <tr
                key={professional.id}
                className="text-center hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelectProfessional(professional)}
              >
                <td className="py-2 px-4 border">
                  <img
                    src={professional.imageUrl || "/default-image.png"}
                    alt={professional.name}
                    className="w-12 h-12 rounded-full object-cover mx-auto"
                  />
                </td>
                <td className="py-2 px-4 border">{professional.name}</td>
                <td className="py-2 px-4 border">{professional.specialty || '-'}</td>
                <td className="py-2 px-4 border">{phoneMask(professional.phone)}</td>
                <td className="py-2 px-4 border">{professional.email}</td>
                <td className="py-2 px-4 border">
                  <div className="flex gap-2 justify-center">
                  <Button size="sm" onClick={(e) => {
                      e.stopPropagation();
                      handleSelectProfessional(professional);
                    }}>
                      Ver Detalhes
                    </Button>
                    <Button size="sm" variant="outline" onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/profissionais/novo?id=${professional.id}`);
                    }}>
                      Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProfessional(professional.id);
                    }}>
                      Excluir
                    </Button>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && selectedProfessional && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 flex justify-center items-center bg-black bg-opacity-50"
        >
          <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-w-lg relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              X
            </button>

            <div className="text-center">
              {selectedProfessional.imageUrl ? (
                <img
                  src={selectedProfessional.imageUrl}
                  alt={selectedProfessional.name}
                  className="w-24 h-24 rounded-full object-cover mx-auto"
                />
              ) : (
                <FaCamera size={36} className="text-gray-400 mx-auto" />
              )}
              <h2 className="text-xl font-semibold mt-2">{selectedProfessional.name}</h2>
              <p className="text-gray-600">{selectedProfessional.specialty}</p>
            </div>

            <div className="mt-4 space-y-2">
              <p><strong>Email:</strong> {selectedProfessional.email}</p>
              <p><strong>Telefone:</strong> {phoneMask(selectedProfessional.phone)}</p>
              <p><strong>CPF/CNPJ:</strong> {
                selectedProfessional.cpfCnpj?.length > 11 
                  ? cnpjMask(selectedProfessional.cpfCnpj) 
                  : cpfMask(selectedProfessional.cpfCnpj)
              }</p>
              <p><strong>Registro:</strong> {selectedProfessional.registrationNumber || '-'}</p>
              <p><strong>Endereço:</strong> {selectedProfessional.address || '-'}</p>
              {selectedProfessional.observations && (
                <p><strong>Observações:</strong> {selectedProfessional.observations}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
