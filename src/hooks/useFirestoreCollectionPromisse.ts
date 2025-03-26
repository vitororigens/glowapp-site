/* eslint-disable @typescript-eslint/no-explicit-any */
import { database } from "@/services/firebase";
import { collection, getDocs, DocumentData } from "firebase/firestore";

interface FirestoreDocument extends DocumentData {
  id: string;
}

const useFirestoreCollectionPromisse = async <T extends FirestoreDocument>(
  collectionName: string
): Promise<T[]> => {
  const querySnapshot = await getDocs(collection(database, collectionName));
  const collectionData: T[] = [];
  
  querySnapshot.docs.forEach((doc) => {
    collectionData.push({ id: doc.id, ...doc.data() } as T);
  });

  return collectionData;
};

export default useFirestoreCollectionPromisse;
