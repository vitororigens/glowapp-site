/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";

import { getParamsFromUrl } from '@/utils/router/get-url-params';

import { collection, query, getDocs, where, doc, limit, getDoc, updateDoc, arrayRemove, arrayUnion, startAfter, startAt } from "firebase/firestore";
import { database } from "@/services/firebase";
import { toast } from "react-toastify";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const useLogic = () => {
  const { user } = useAuthContext();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [property, setProperty] = useState<Array<any> | null>(null);

  const queryFilteredProperties = async () => {
    setIsLoading(true);
    
    const filters = [
      where("rented", "==", false),
      where("sold", "==", false),
      where("visible", "==", true),
    ];
    
    const propertiesRef = collection(database, "Immobile");
    try {
      // GET PROPERTIES
      const propertiesQuery = query(propertiesRef,
        ...filters,
        limit(6),
      );  
      const propertiesSnapshots = await getDocs(propertiesQuery);
      const datas = propertiesSnapshots.docs.map((doc: any) => {
        return { id: doc.id, ...doc.data() };
      });

      setProperty(!!datas.length ? datas : null);
    } catch (error) {
      console.error(error);
      toast('Ops nenhum imóvel foi encontrado, tente aplicar outros filtros', { type: 'info'} )
    }
    
    setIsLoading(false)
  };

  const addRemoveFavoriteProperties = async (id: string) => {
    if (!user){
      return router.push('/auth/login')
    }

    const docRef = doc(database, "Register", user?.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const favorites = docSnap.data().favorites || [];

      if (favorites.includes(id)) {
        await updateDoc(docRef, {
          favorites: arrayRemove(id),
        });
        toast("Imóvel removido dos favoritos", { type: "info" });
      } else {
        await updateDoc(docRef, {
          favorites: arrayUnion(id),
        });
        toast("Imóvel adicionado dos favoritos", { type: "info" });
      }
    } else {
      toast("Não foi possivel concluir está ação, tente novamente", {
        type: "error",
      });
    }
  };

  return {
    data: {
      isLoading,
      property,
    },
    methods: {
      queryFilteredProperties,
      addRemoveFavoriteProperties
    }
  }
}

export { useLogic };

