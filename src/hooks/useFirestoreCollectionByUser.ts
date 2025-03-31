/* eslint-disable @typescript-eslint/no-explicit-any */
import { database } from "@/services/firebase";
import { query, collection, where, onSnapshot, DocumentData } from "firebase/firestore";
import { useEffect, useState } from "react";

interface FirestoreDocument extends DocumentData {
  id: string;
}

interface UseFirestoreCollectionByUserResult<T> {
  data: T[] | null;
  loading: boolean;
}

const useFirestoreCollectionByUser = <T extends FirestoreDocument>(
  collectionName: string, 
  uid: string
): UseFirestoreCollectionByUserResult<T> => {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribe: () => void;

    const getData = () => {
      const propertiesRef = collection(database, collectionName);
      const q = query(propertiesRef, where('uid', '==', uid));

      unsubscribe = onSnapshot(
        q, 
        (snapshot) => {
          const datas = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];
          setData(datas || []);
          setLoading(false);
        }, 
        (error) => {
          console.error('Erro ao buscar dados:', error);
          setData([]);
          setLoading(false);
        }
      );
    };

    if (uid) {
      getData();
    } else {
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [collectionName, uid]);

  return { data, loading };
};

export default useFirestoreCollectionByUser;
