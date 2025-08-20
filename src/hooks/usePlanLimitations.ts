import { useState, useEffect } from 'react';
import { useUserAuth } from './useUserAuth';
import { findStripeCustomerByEmail, getCustomerSubscriptions } from '@/services/stripeService';
import { useTrialPeriod } from './useTrialPeriod';

export interface PlanLimits {
  clients: number;
  images: number;
  isActive: boolean;
  planName: string;
  planId: string;
}

export function usePlanLimitations() {
  const { user } = useUserAuth();
  const { trialInfo, isTrialExpired, getDaysRemaining, isTrialActive } = useTrialPeriod();
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

    if (user?.email) {
      loadUserPlan();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadUserPlan = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      // Primeiro, verificar se o trial está ativo
      const trialActive = isTrialActive();
      const trialExpired = isTrialExpired();
      
      // Se o trial está ativo e não expirou, usar plano gratuito sem buscar no Stripe
      if (trialActive && !trialExpired) {
        setPlanLimits({
          clients: 10,
          images: 4,
          isActive: true,
          planName: 'Glow Start (Trial)',
          planId: 'glow-start'
        });
        setLoading(false);
        return;
      }
      
      // Se o trial expirou, verificar se tem plano pago no Stripe
      if (trialExpired) {
        try {
          const stripeCustomer = await findStripeCustomerByEmail(user.email);
          
          if (stripeCustomer) {
            const customerSubs = await getCustomerSubscriptions(stripeCustomer.id);
            
            if (customerSubs.length > 0) {
              const subscription = customerSubs[0];
              const plan = subscription.items.data[0];
              const productId = plan.price.product;
              
              // Verificar se a assinatura está ativa
              if (subscription.status === 'active') {
                const limits = getPlanLimits(productId);
                setPlanLimits({
                  ...limits,
                  isActive: true,
                  planName: getPlanName(productId),
                  planId: productId
                });
                setLoading(false);
                return;
              }
            }
          }
        } catch (error) {
          // Se der erro 404, significa que não tem plano pago
          console.log('Usuário não possui plano pago ativo:', user.email);
        }
        
        // Se chegou aqui, trial expirado e sem plano pago
        setPlanLimits({
          clients: 0,
          images: 0,
          isActive: false,
          planName: 'Glow Start (Expirado)',
          planId: 'glow-start'
        });
      } else {
        // Fallback para plano gratuito (caso trial não esteja carregado ainda)
        setPlanLimits({
          clients: 10,
          images: 4,
          isActive: true,
          planName: 'Glow Start',
          planId: 'glow-start'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar plano do usuário:', error);
      // Em caso de erro, assume plano gratuito
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
    return planLimits.isActive && clientCurrentImages < planLimits.images;
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
