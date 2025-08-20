import { useState, useEffect } from 'react';
import { useUserAuth } from './useUserAuth';
import { database } from '@/services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface TrialInfo {
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  daysRemaining: number;
  isExpired: boolean;
}

export function useTrialPeriod() {
  const { user } = useUserAuth();
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      loadTrialInfo();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadTrialInfo = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      // Buscar informações do trial no Firestore
      const trialRef = doc(database, 'trials', user.uid);
      const trialDoc = await getDoc(trialRef);

      if (trialDoc.exists()) {
        const data = trialDoc.data();
        const startDate = data.startDate.toDate();
        const endDate = new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 dias
        const now = new Date();
        const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        const isExpired = now > endDate;

        setTrialInfo({
          startDate,
          endDate,
          isActive: !isExpired,
          daysRemaining,
          isExpired
        });
      } else {
        // Criar novo trial se não existir
        await createNewTrial();
      }
    } catch (error) {
      console.error('Erro ao carregar informações do trial:', error);
      // Em caso de erro, criar novo trial
      await createNewTrial();
    } finally {
      setLoading(false);
    }
  };

  const createNewTrial = async () => {
    if (!user?.uid) return;

    try {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 dias

      const trialData = {
        startDate,
        endDate,
        isActive: true,
        createdAt: new Date()
      };

      const trialRef = doc(database, 'trials', user.uid);
      await setDoc(trialRef, trialData);

      setTrialInfo({
        startDate,
        endDate,
        isActive: true,
        daysRemaining: 30,
        isExpired: false
      });
    } catch (error) {
      console.error('Erro ao criar trial:', error);
    }
  };

  const isTrialExpired = () => {
    return trialInfo?.isExpired || false;
  };

  const getDaysRemaining = () => {
    return trialInfo?.daysRemaining || 0;
  };

  const isTrialActive = () => {
    return trialInfo?.isActive || false;
  };

  return {
    trialInfo,
    loading,
    isTrialExpired,
    getDaysRemaining,
    isTrialActive,
    loadTrialInfo
  };
}
