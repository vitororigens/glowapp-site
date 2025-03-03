"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import useFirestoreCollection from "@/hooks/useFirestoreCollection";
import { toast } from "react-toastify";
import { collection, doc, deleteDoc } from "firebase/firestore";
import { database } from "@/services/firebase";

type ScheduleViewTypes = {
  open: boolean,
  type?: 'view' | 'create',
  id?: string
}

const useLogic = () => {
  const { data: contacts, loading: loadingContacts } = useFirestoreCollection("Contacts");
  const [scheduleView, setScheduleView] = useState<ScheduleViewTypes>({ open: false });

  const deleteContact = async (id: string) => {
    try {
      const collectionRef = collection(database, 'Contacts')
      const docRef = doc(collectionRef, id);
      await deleteDoc(docRef);
      toast('Contato deletado com sucesso', { type: 'success' })
    } catch (err) {
      console.error(err)
      toast('Não foi possivel excluir este contato', { type: 'error' })
    }
  }

  return {
    data: {
      contacts: contacts || [],
      loadingContacts,
      scheduleView,
    },
    methods: {
      setScheduleView,
      deleteContact
    }
  }
}

export { useLogic };

