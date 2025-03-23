import { useState } from "react";
import Modal from "react-modal";
import { toast } from "react-toastify";
import { doc, deleteDoc } from "firebase/firestore"; 
import { database } from "../../services/firebase";
import { Options } from "../Options/index";
import { currencyMask } from "../../utils/maks/masks";
import {
  Button,
  Container,
  ContainerIcon,
  ContainerText,
  Divider,
  IconCheck,
  SubTitle,
  Title,
} from "./styles";
import { FaInfoCircle } from "react-icons/fa";

type ItemsNotebookProps = {
  id?: string;
  title: string;
  date: string;
  time: string;
  price: string;
  priority: string;
  image?: string;
  isChecked?: boolean;
  showButton?: boolean;
  onToggle?: () => void;
  showButtonCheck?: boolean;
  onEdit?: () => void;
  onCard?: () => void;
};

export function ItemsHistory({
  id,
  date,
  title,
  showButtonCheck,
  image,
  isChecked,
  price,
  priority,
  time,
  onToggle,
  onEdit,
  onCard,
}: ItemsNotebookProps) {
  const [popoverVisible, setPopoverVisible] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Informações de contato`,
          text: `Nome: ${title}\nTelefone: ${date}`,
        });
      } catch (error) {
        console.error("Erro ao compartilhar:", error);
      }
    } else {
      alert("Compartilhamento não suportado neste navegador.");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `Contact Information:\nName: ${title}\nPhone: ${date}`
      );
      alert("Copiado com sucesso!");
      setPopoverVisible(false);
    } catch (error) {
      console.error("Erro ao copiar:", error);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteDoc(doc(database, "Contacts", id));
      toast.success("Contato excluído!");
      setPopoverVisible(false);
    } catch (error) {
      console.error("Erro ao excluir contato:", error);
      toast.error("Erro ao excluir contato!");
    }
  };

  return (
    <Container
      onClick={onCard}
      onContextMenu={(e) => {
        e.preventDefault();
        setPopoverVisible(true);
      }}
    >
      <Modal
        isOpen={popoverVisible}
        onRequestClose={() => setPopoverVisible(false)}
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <Options
          title={title}
          image={image}
          onCopy={handleCopy}
          onDelete={handleDelete}
          onEdit={() => {
            onEdit && onEdit();
            setPopoverVisible(false);
          }}
          showCopy
          showEdit
          showDelete
        />
      </Modal>

      <ContainerIcon>
        <FaInfoCircle size={22} color="white" />
      </ContainerIcon>

      <div style={{ flex: 1, justifyContent: "center", padding: 5, height: 40 }}>
        <ContainerText>
          <Title>{title}</Title>
          <SubTitle>
            {date} - {time}
          </SubTitle>
        </ContainerText>
        <Divider />
        <ContainerText>
          <Title>R$ {currencyMask(price)}</Title>
          <SubTitle>{priority}</SubTitle>
        </ContainerText>
      </div>

      {showButtonCheck && (
        <Button onClick={onToggle}>
          <IconCheck
            className={isChecked ? "checked-icon" : "unchecked-icon"}
          />
        </Button>
      )}
    </Container>
  );
}
