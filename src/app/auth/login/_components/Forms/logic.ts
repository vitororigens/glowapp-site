'use client'
import { useEffect } from 'react';

// Forms
import { useForm } from 'react-hook-form';
import { schema, defaultValues, FormData } from './scheme';
import { zodResolver } from '@hookform/resolvers/zod';

import { signInWithEmailAndPassword } from "firebase/auth";
import { toast } from 'react-toastify';
import { auth } from '@/services/firebase';
import { useRouter } from 'next/navigation';

import Cookies from 'js-cookie';

const useLogic = () => {
  const router = useRouter();

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
    await signInWithEmailAndPassword(auth, data.email, data.password)
      .then((userCredential) => {
        const user = userCredential.user;
        Cookies.set('session', user.uid, { expires: 1 })
        router.push('/')
      })
      .catch((error) => {
        console.error(error);
        toast('Email ou senha incorretos!', { type: 'error' })
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
