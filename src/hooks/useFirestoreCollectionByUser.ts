/* eslint-disable @typescript-eslint/no-explicit-any */
import { database } from "@/services/firebase";
import { query, collection, where, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

const useFirestoreCollectionByUser = (collectionName: string, uid: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribe: () => void;

    const getData = () => {
      const propertiesRef = collection(database, collectionName);
      const q = query(propertiesRef, where('uid', '==', uid));

      unsubscribe = onSnapshot(q, (snapshot) => {
        const datas = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setData(datas || []);
        setLoading(false);
      }, (error) => {
        console.error(error);
        setData([]);
        setLoading(false);
      });
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
