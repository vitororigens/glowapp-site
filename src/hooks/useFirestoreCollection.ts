/* eslint-disable @typescript-eslint/no-explicit-any */
import {useAuthContext } from "@/context/AuthContext";
import { database } from "@/services/firebase";
import { collection, onSnapshot, query, where, Query, CollectionReference } from "firebase/firestore";
import { useEffect, useState } from "react";


const useFirestoreCollection = (collectionName: string, queryParams?: { field: string, operator: any, value: any }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const collectionRef: CollectionReference = collection(database, collectionName);
    let collectionQuery: Query = collectionRef;

    // Sempre adiciona o filtro de uid
    collectionQuery = query(collectionRef, where("uid", "==", user.uid));

    // Adiciona filtros adicionais se existirem
    if (queryParams) {
      collectionQuery = query(collectionQuery, where(queryParams.field, queryParams.operator, queryParams.value));
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
  }, [collectionName, queryParams, user?.uid]);

  return { data, loading };
};

export default useFirestoreCollection;
