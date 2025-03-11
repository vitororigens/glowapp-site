import { FiCopy, FiTrash, FiEdit, FiShare2, FiCamera } from "react-icons/fi";
import { 
    Container, 
    ContainerIcon, 
    ContainerImage, 
    ContainerItem, 
    ContainerOptions, 
    Button, 
    Title, 
    Icon 
} from "./styles";

type ItemOptions = {
    title: string;
    onDelete?: () => void;
    onEdit?: () => void;
    onCopy?: () => void;
    onShare?: () => void;
    image?: string;
    showCopy?: boolean;
    showDelete?: boolean;
    showEdit?: boolean;
    showShare?: boolean;
};

export function Options({ 
    onCopy, 
    onDelete, 
    onEdit, 
    title, 
    image, 
    showCopy, 
    showDelete, 
    showEdit, 
    showShare, 
    onShare 
}: ItemOptions) {
    return (
        <Container>
            <ContainerItem>
                {image ? (
                    <ContainerImage src={image} alt="Imagem" />
                ) : (
                    <ContainerIcon>
                        <FiCamera size={22} color="white" />
                    </ContainerIcon>
                )}
                <Title>{title}</Title>
            </ContainerItem>

            <ContainerOptions>
                {showCopy && (
                    <Button onClick={onCopy}>
                        <Icon><FiCopy /></Icon>
                        <Title>Copiar</Title>
                    </Button>
                )}
                {showShare && (
                    <Button onClick={onShare}>
                        <Icon><FiShare2 /></Icon>
                        <Title>Compartilhar</Title>
                    </Button>
                )}
                {showEdit && (
                    <Button onClick={onEdit}>
                        <Icon><FiEdit /></Icon>
                        <Title>Editar</Title>
                    </Button>
                )}
                {showDelete && (
                    <Button onClick={onDelete}>
                        <Icon><FiTrash /></Icon>
                        <Title>Excluir</Title>
                    </Button>
                )}
            </ContainerOptions>
        </Container>
    );
}
