"use client";

import { useState, useEffect } from "react";
import { FaCamera } from "react-icons/fa";
import { ImageContainer, StyledImage, SubTitle, Title, ContentItems, Header, Items, Container  } from "./styles";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { database } from "@/services/firebase";

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
  imageUrl?: string;  // Adicionado para a URL da imagem, caso tenha
};

export default function Profissionais() {
  const [professionals, setProfessionals] = useState<PropsCardProfessional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<PropsCardProfessional | null>(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  // Função para buscar os profissionais do Firestore
  const fetchProfessionals = async () => {
    const querySnapshot = await getDocs(collection(database, "Profissionals"));
    const fetchedProfessionals: PropsCardProfessional[] = [];
    querySnapshot.forEach((doc) => {
      fetchedProfessionals.push({ id: doc.id, ...doc.data() } as PropsCardProfessional);
    });
    setProfessionals(fetchedProfessionals);
  };

  useEffect(() => {
    fetchProfessionals();
  }, []);

  // Função para abrir o modal
  const handleSelectProfessional = (professional: PropsCardProfessional) => {
    setSelectedProfessional(professional);
    setShowModal(true);
  };

  // Função para fechar o modal
  const handleCloseModal = () => {
    setShowModal(false);
  };

  function handleNewLaunch() {
    router.push('/dashboard/profissionais/novo');
  }

  return (
    <Container>
      <div className="flex items-center justify-between" style={{ marginBottom: "30px" }}>
        <h1 className="text-3xl font-bold">Profissionais</h1>
        <Button onClick={handleNewLaunch}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Adicionar profissionais
        </Button>
      </div>

      <div className="cards-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {professionals.map((professional) => (
          <div
            key={professional.id}
            className="card"
            onClick={() => handleSelectProfessional(professional)}
            style={{
              cursor: "pointer",
              width: "100%",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "15px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              backgroundColor: "#fff",
            }}
          >
            <div>
              <ImageContainer>
                <StyledImage src={professional.imageUrl || "/default-image.png"} alt={professional.name} />
              </ImageContainer>
            </div>
            <Title>{professional.name}</Title>
            <SubTitle>{professional.specialty}</SubTitle>
          </div>
        ))}
      </div>

      {/* Modal para exibir os detalhes do profissional selecionado */}
      {showModal && selectedProfessional && (
        <div
          className="modal"
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              padding: "20px",
              width: "80%",
              maxWidth: "900px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              position: "relative",
              overflowY: "auto",
              maxHeight: "80vh",
            }}
          >
            <button
              onClick={handleCloseModal}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                backgroundColor: "transparent",
                border: "none",
                fontSize: "18px",
                color: "#333",
                cursor: "pointer",
              }}
            >
              X
            </button>

            <Header>
              {selectedProfessional.imageUrl ? (
                <ImageContainer>
                  <StyledImage src={selectedProfessional.imageUrl} alt="Profissional" />
                </ImageContainer>
              ) : (
                <ImageContainer>
                  <FaCamera size={36} color="white" />
                </ImageContainer>
              )}
            </Header>

            <ContentItems>
              <Items>
                <Title>Nome:</Title>
                <SubTitle>{selectedProfessional.name}</SubTitle>
              </Items>

              <Items>
                <Title>Email:</Title>
                <SubTitle>{selectedProfessional.email}</SubTitle>
              </Items>
              <Items>
                <Title>Telefone:</Title>
                <SubTitle>{selectedProfessional.phone}</SubTitle>
              </Items>
            </ContentItems>

            <ContentItems>
              <Items>
                <Title>CNPJ/CPF:</Title>
                <SubTitle>{selectedProfessional.cpfCnpj}</SubTitle>
              </Items>

              <Items>
                <Title>Registration Number:</Title>
                <SubTitle>{selectedProfessional.registrationNumber}</SubTitle>
              </Items>
              <Items>
                <Title>Especialidade:</Title>
                <SubTitle>{selectedProfessional.specialty}</SubTitle>
              </Items>
            </ContentItems>

            <Items>
              <Title>Historico</Title>
              <SubTitle>Sem historico desse profissional</SubTitle>
            </Items>

            <div style={{ width: "100%", overflowY: "auto", maxHeight: "400px" }}>
              {selectedProfessional.observations && (
                <Title style={{ textAlign: "center", marginBottom: 20 }}>
                  Observações: {selectedProfessional.observations}
                </Title>
              )}
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
