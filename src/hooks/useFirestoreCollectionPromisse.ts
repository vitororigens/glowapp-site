/* eslint-disable @typescript-eslint/no-explicit-any */
import { database } from "@/services/firebase";
import { collection, getDocs } from "firebase/firestore";

const useFirestoreCollectionPromisse = async (collectionName: string): Promise<any> => {
  const querySnapshot = await getDocs(collection(database, collectionName))
  const collectionData: any = [];
  querySnapshot.docs.forEach((doc: any) => {
    collectionData.push({ id: doc.id, ...doc.data() });
  });

  return collectionData;
};

export default useFirestoreCollectionPromisse;
