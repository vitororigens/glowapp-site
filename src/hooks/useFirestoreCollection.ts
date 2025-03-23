/* eslint-disable @typescript-eslint/no-explicit-any */
import { database } from "@/services/firebase";
import { collection, onSnapshot, query, where, Query, CollectionReference } from "firebase/firestore";
import { useEffect, useState } from "react";

const useFirestoreCollection = (collectionName: string, queryParams?: { field: string, operator: any, value: any }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const collectionRef: CollectionReference = collection(database, collectionName);
    let collectionQuery: Query = collectionRef;

    if (queryParams) {
      collectionQuery = query(collectionRef, where(queryParams.field, queryParams.operator, queryParams.value));
    }

    const unsubscribe = onSnapshot(collectionQuery, (snapshot) => {
      const collectionData: any = [];
      snapshot.docs.forEach((doc: any) => {
        collectionData.push({ id: doc.id, ...doc.data() });
      });

      setData(collectionData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, queryParams]);

  return { data, loading };
};

export default useFirestoreCollection;
