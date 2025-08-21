import { useState, useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { database } from "@/services/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

interface UserData {
  id: string;
  name?: string;
  email?: string;
  imageUrl?: string;
  [key: string]: any;
}

export const useUserData = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuthContext();
  const uid = user?.uid;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const docRef = doc(database, "User", uid);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({ id: docSnap.id, ...data } as UserData);
          } else {
            setUserData(null);
          }
        } catch (err) {
          console.error("Erro ao processar dados do usuário:", err);
          setError(err instanceof Error ? err : new Error('Erro desconhecido'));
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Erro ao escutar dados do usuário:", err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  return { userData, loading, error };
};
