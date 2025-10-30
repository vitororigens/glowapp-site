'use client'

import { useEffect } from 'react';

// Forms
import { useForm } from 'react-hook-form';
import { schema, defaultValues, FormData } from './scheme';
import { zodResolver } from '@hookform/resolvers/zod';

import { toast } from 'react-toastify';

import { auth, database } from '@/services/firebase';
import { signOut, UserCredential, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import useFirestoreCollection from '@/hooks/useFirestoreCollection';
import { useRouter } from 'next/navigation';
import firebase from 'firebase/compat/app';
import { triggerNewClientJourney } from '@/services/automation';

const useLogic = () => {
  const router = useRouter();

  // Firebase

  // React Hook Forms
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues,
    mode: 'onSubmit',
    resolver: zodResolver(schema),
  });

  const handleLogout = () => signOut(auth);

  const onSubmit = async (data: FormData) => {
    await createUserWithEmailAndPassword(auth, data.email.trim(), data.password.trim())
      .then(async (userCredential) => {
        const { user }: UserCredential = userCredential!;
        const { uid } = user;

        return updateProfile(user, { displayName: data.name.trim() }).then(async () => {
          toast("Conta cadastrada com sucesso!", { type: 'success' });

          const docRef = doc(database, 'Register', uid);
          return setDoc(docRef, {
            phone: data.phone || "",
            name: data.name.trim(),
            email: data.email.trim(),
            createdAt: new Date(),
          })
        }).then(async () => {
          // Disparar automação (não bloqueante)
          try {
            await triggerNewClientJourney({
              userId: uid,
              name: data.name.trim(),
              email: data.email.trim(),
              phone: data.phone,
            });
          } catch {}
          console.log('Usuário adicionado ao banco de dados.');
          router.push('/auth/login');
          handleLogout();
        });
      })
      .catch((error: Error) => {
        const authError = error as firebase.auth.Error;
        const errorCode = authError.code;

        if (errorCode === 'auth/email-already-in-use'){
          return toast('Email já existe em novo sistema', { type: 'error'} )
        }
        return toast('Não foi possível criar uma conta tente novamente mais tarde', { type: 'error'} )
      })
      .finally(() => {
        reset();
      });
  };

  useEffect(() => {
    const firstKey = Object.keys(errors)[0] as keyof FormData | undefined;
    if (firstKey) {
      const error = errors[firstKey];
      if (error?.message) {
        toast(error.message, { type: 'error' });
      }
    }
  }, [errors]);

  return {
    data: {
      control,
      errors,
    },
    methods: {
      register,
      onSubmit,
      handleSubmit,
      setValue,
    },
  };
};

export { useLogic };
