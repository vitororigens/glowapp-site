import { useState, useEffect } from 'react';
import { useUserAuth } from './useUserAuth';
import { usePlanContext } from '@/context/PlanContext';

export interface PlanLimits {
  clients: number;
  images: number;
  isActive: boolean;
  planName: string;
  planId: string;
}

export function usePlanLimitations() {
  const { user } = useUserAuth();
  const { currentPlan, currentPlanName, hasPaidPlan, isPlanActive, loading: planLoading } = usePlanContext();
  const [planLimits, setPlanLimits] = useState<PlanLimits>({
    clients: 10,
    images: 4,
    isActive: true,
    planName: 'Glow Start',
    planId: 'glow-start'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Só executar no lado do cliente
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    if (user?.email && !planLoading) {
      loadUserPlan();
    } else {
      setLoading(false);
    }
  }, [user, currentPlan, planLoading]); // Adicionar currentPlan como dependência

  const loadUserPlan = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      console.log('📋 Carregando limitações para plano:', currentPlan);
      
      // Definir limitações baseadas no plano atual
      const limits = getPlanLimits(currentPlan);
      
      setPlanLimits({
        ...limits,
        isActive: isPlanActive,
        planName: currentPlanName,
        planId: currentPlan
      });
      
      console.log('✅ Limitações atualizadas:', {
        plan: currentPlan,
        name: currentPlanName,
        limits: limits
      });
    } catch (error) {
      console.error('Erro ao carregar limitações do plano:', error);
      // Em caso de erro, usar plano gratuito
      setPlanLimits({
        clients: 10,
        images: 4,
        isActive: true,
        planName: 'Glow Start',
        planId: 'glow-start'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanLimits = (productId: string): Omit<PlanLimits, 'isActive' | 'planName' | 'planId'> => {
    const limits: { [key: string]: { clients: number; images: number } } = {
      'glow-start': { clients: 10, images: 4 },
      'glow-pro': { clients: 50, images: 8 },
    };
    return limits[productId] || { clients: 10, images: 4 };
  };

  const getPlanName = (productId: string): string => {
    const planNames: { [key: string]: string } = {
      'glow-start': 'Glow Start',
      'glow-pro': 'Glow Pro',
    };
    return planNames[productId] || 'Glow Start';
  };

  const canAddClient = (currentClientCount: number): boolean => {
    return planLimits.isActive && currentClientCount < planLimits.clients;
  };

  const canAddImage = (currentImageCount: number): boolean => {
    return planLimits.isActive && currentImageCount < planLimits.images;
  };

  const canAddImageToClient = (clientCurrentImages: number): boolean => {
    return planLimits.isActive && clientCurrentImages <= planLimits.images;
  };

  const getRemainingClients = (currentClientCount: number): number => {
    return Math.max(0, planLimits.clients - currentClientCount);
  };

  const getRemainingImages = (currentImageCount: number): number => {
    return Math.max(0, planLimits.images - currentImageCount);
  };

  const getRemainingImagesForClient = (clientCurrentImages: number): number => {
    return Math.max(0, planLimits.images - clientCurrentImages);
  };

  return {
    planLimits,
    loading,
    canAddClient,
    canAddImage,
    canAddImageToClient,
    getRemainingClients,
    getRemainingImages,
    getRemainingImagesForClient,
    refreshPlan: loadUserPlan
  };
}
