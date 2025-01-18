/* eslint-disable @typescript-eslint/no-explicit-any */
import { database } from "@/services/firebase";
import { getDoc, doc } from "firebase/firestore";
import { useEffect, useState } from "react";

const useFirestoreCollectionById = (collectionName: string, id: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const getData = async () => {
      try {
        const docRef = doc(database, collectionName, id);
        const documentSnapshots = await getDoc(docRef);
        const datas = documentSnapshots.data();
        setData(datas || []);
      } catch (error) {
        console.log(error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      getData();
    } else {
      setLoading(false);
    }
  }, [collectionName, id]);

  return { data, loading };
};

export default useFirestoreCollectionById;
