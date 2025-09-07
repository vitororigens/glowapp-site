/* eslint-disable @typescript-eslint/no-explicit-any */
import {useAuthContext } from "@/context/AuthContext";
import { database } from "@/services/firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  Query, 
  CollectionReference,
  WhereFilterOp,
  DocumentData
} from "firebase/firestore";
import { useEffect, useState } from "react";

interface UseFirestoreCollectionResult<T> {
  data: T[] | null;
  loading: boolean;
  error: Error | null;
}

interface QueryParams {
  field: string;
  operator: WhereFilterOp;
  value: DocumentData;
}

interface FirestoreDocument extends DocumentData {
  id: string;
}

const useFirestoreCollection = <T extends FirestoreDocument>(
  collectionName: string, 
  queryParams?: QueryParams
): UseFirestoreCollectionResult<T> => {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuthContext();
  const uid = user?.uid;

  useEffect(() => {
    if (!uid) {
      console.log(`[${collectionName}] UID não disponível, não carregando dados`);
      setLoading(false);
      setData(null);
      return;
    }

    console.log(`[${collectionName}] Iniciando carregamento para UID:`, uid);
    setLoading(true);
    setError(null);

    const collectionRef: CollectionReference = collection(database, collectionName);
    let collectionQuery: Query = collectionRef;

    // Sempre adiciona o filtro de uid
    collectionQuery = query(collectionRef, where("uid", "==", uid));

    // Adiciona filtros adicionais se existirem
    if (queryParams) {
      collectionQuery = query(
        collectionQuery, 
        where(queryParams.field, queryParams.operator, queryParams.value)
      );
    }

    const unsubscribe = onSnapshot(
      collectionQuery,
      (snapshot) => {
        try {
          const collectionData: T[] = [];
          snapshot.docs.forEach((doc) => {
            const docData = { id: doc.id, ...doc.data() } as T;
            collectionData.push(docData);
          });
          
          // Debug: logs detalhados para verificar filtragem por usuário
          console.log(`[${collectionName}] UID do usuário atual:`, uid);
          console.log(`[${collectionName}] Query executada:`, collectionQuery);
          console.log(`[${collectionName}] Dados recebidos:`, collectionData);
          console.log(`[${collectionName}] Total de documentos:`, collectionData.length);
          
          // Verificar se todos os documentos têm o UID correto
          const wrongUidDocs = collectionData.filter(doc => (doc as any).uid !== uid);
          if (wrongUidDocs.length > 0) {
            console.error(`[${collectionName}] ATENÇÃO: Documentos com UID incorreto encontrados:`, wrongUidDocs);
            // Filtrar apenas documentos com UID correto
            const correctUidDocs = collectionData.filter(doc => (doc as any).uid === uid);
            console.log(`[${collectionName}] Filtrando ${wrongUidDocs.length} documentos com UID incorreto. Restam ${correctUidDocs.length} documentos válidos.`);
            setData(correctUidDocs);
          } else {
            setData(collectionData);
          }
        } catch (err) {
          console.error(`Erro ao processar dados de ${collectionName}:`, err);
          setError(err instanceof Error ? err : new Error('Erro desconhecido'));
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error(`Erro ao escutar ${collectionName}:`, err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, uid, queryParams?.field, queryParams?.operator, queryParams?.value]);

  return { data, loading, error };
};

export default useFirestoreCollection;
