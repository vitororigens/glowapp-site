"use client";

import { useState, useEffect } from "react";
import { FaCamera } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { database } from "@/services/firebase";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "./styles";
import { useAuthContext } from "@/context/AuthContext";

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

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Profissionais</h1>
        <Button onClick={handleNewLaunch}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Adicionar profissionais
        </Button>
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
            {professionals.map((professional) => (
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
                <td className="py-2 px-4 border">{professional.specialty}</td>
                <td className="py-2 px-4 border">{professional.phone}</td>
                <td className="py-2 px-4 border">{professional.email}</td>
                <td className="py-2 px-4 border">
                  <Button size="sm" onClick={(e) => {
                    e.stopPropagation();
                    handleSelectProfessional(professional);
                  }}>
                    Ver Detalhes
                  </Button>
                </td>
              </tr>
            ))}
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
              <p><strong>Telefone:</strong> {selectedProfessional.phone}</p>
              <p><strong>CNPJ/CPF:</strong> {selectedProfessional.cpfCnpj}</p>
              <p><strong>Registro:</strong> {selectedProfessional.registrationNumber}</p>
              <p><strong>Endereço:</strong> {selectedProfessional.address}</p>
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
