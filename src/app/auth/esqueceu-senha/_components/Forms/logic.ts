'use client'
import { useEffect } from 'react';

// Forms
import { useForm } from 'react-hook-form';
import { schema, defaultValues, FormData } from './scheme';
import { zodResolver } from '@hookform/resolvers/zod';

import { sendPasswordResetEmail } from "firebase/auth";
import { toast } from 'react-toastify';
import { auth } from '@/services/firebase';

const useLogic = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues,
    mode: 'onSubmit',
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await sendPasswordResetEmail(auth, data.email)
      .then(() => {
        toast('Link enviado, verifique seu email', { type: 'success' })
      })
      .catch((error) => {
        console.error(error);
        toast('Não foi possivel enviar o email de recuperação!', { type: 'error' })
      })
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
      errors,
    },
    methods: {
      register,
      onSubmit,
      handleSubmit,
    },
  };
};

export { useLogic };
