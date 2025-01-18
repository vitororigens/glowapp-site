import { database } from "@/services/firebase";
import { collection, getDocs } from "firebase/firestore";

// Função para ser usada no servidor
export const generateStaticParams = async () => {
  const collectionRef = collection(database, "Immobile");
  const snapshot = await getDocs(collectionRef);

  const params = snapshot.docs.map((doc) => ({
    id: doc.id,
  }));

  return params;
};
