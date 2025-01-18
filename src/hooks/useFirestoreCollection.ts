/* eslint-disable @typescript-eslint/no-explicit-any */
import { database } from "@/services/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

const useFirestoreCollection = (collectionName: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const collectionRef = collection(database, collectionName);

    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const collectionData: any = [];
      snapshot.docs.forEach((doc: any) => {
        collectionData.push({ id: doc.id, ...doc.data() });
      });

      setData(collectionData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName]);

  return { data, loading };
};

export default useFirestoreCollection;
