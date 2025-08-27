import { useState, useEffect } from 'react';
import { useUserAuth } from './useUserAuth';
import { database } from '@/services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface UserPlan {
  planId: string;
  planName: string;
  isActive: boolean;
  hasPaidPlan: boolean;
  lastChecked: Date;
}

export function useUserPlan() {
  const { user } = useUserAuth();
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      loadUserPlan();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadUserPlan = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      // Buscar informações do plano no Firestore
      const planRef = doc(database, 'userPlans', user.uid);
      const planDoc = await getDoc(planRef);

      if (planDoc.exists()) {
        const data = planDoc.data();
        const lastChecked = data.lastChecked.toDate();
        
        // Sempre usar os dados mais recentes do Firestore
        setUserPlan({
          planId: data.planId,
          planName: data.planName,
          isActive: data.isActive,
          hasPaidPlan: data.hasPaidPlan,
          lastChecked: lastChecked
        });
        
        console.log('📋 Plano carregado do Firestore:', {
          planId: data.planId,
          planName: data.planName,
          hasPaidPlan: data.hasPaidPlan
        });
      } else {
        // Primeira vez - criar plano gratuito
        await createFreePlan();
      }
    } catch (error) {
      console.error('Erro ao carregar plano do usuário:', error);
      // Em caso de erro, criar plano gratuito
      await createFreePlan();
    } finally {
      setLoading(false);
    }
  };

  const createFreePlan = async () => {
    if (!user?.uid) return;

    try {
      const freePlan: UserPlan = {
        planId: 'glow-start',
        planName: 'Glow Start',
        isActive: true,
        hasPaidPlan: false,
        lastChecked: new Date()
      };

      const planRef = doc(database, 'userPlans', user.uid);
      await setDoc(planRef, {
        ...freePlan,
        lastChecked: new Date()
      });

      setUserPlan(freePlan);
    } catch (error) {
      console.error('Erro ao criar plano gratuito:', error);
    }
  };

  const checkPaidPlan = async () => {
    if (!user?.uid || !user?.email) return;

    try {
      // Importar dinamicamente para evitar chamadas desnecessárias
      const { findStripeCustomerByEmail, getCustomerSubscriptions } = await import('@/services/stripeService');
      
      const stripeCustomer = await findStripeCustomerByEmail(user.email);
      
      if (stripeCustomer) {
        const customerSubs = await getCustomerSubscriptions(stripeCustomer.id);
        
        if (customerSubs.length > 0) {
          const subscription = customerSubs[0];
          
          if (subscription.status === 'active') {
            const plan = subscription.items.data[0];
            const productId = plan.price.product;
            
            const paidPlan: UserPlan = {
              planId: productId,
              planName: productId === 'glow-pro' ? 'Glow Pro' : 'Glow Start',
              isActive: true,
              hasPaidPlan: true,
              lastChecked: new Date()
            };

            const planRef = doc(database, 'userPlans', user.uid);
            await setDoc(planRef, {
              ...paidPlan,
              lastChecked: new Date()
            });

            setUserPlan(paidPlan);
            return;
          }
        }
      }
      
      // Se chegou aqui, não tem plano pago ativo
      await createFreePlan();
    } catch (error) {
      console.error('Erro ao verificar plano pago:', error);
      // Em caso de erro, manter plano gratuito
      await createFreePlan();
    }
  };

  const updateToPaidPlan = async (planId: string, planName: string, paymentIntentId?: string) => {
    if (!user?.uid) return;

    try {
      console.log('🔄 Atualizando plano via API:', { planId, planName, paymentIntentId });

      // Chamar a API para atualizar o plano
      const response = await fetch('/api/update-user-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          planId,
          planName,
          paymentIntentId,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar plano via API');
      }

      const result = await response.json();
      console.log('✅ Plano atualizado via API:', result);

      // Atualizar o estado local
      const updatedPlan: UserPlan = {
        planId,
        planName,
        isActive: true,
        hasPaidPlan: planId !== 'glow-start',
        lastChecked: new Date()
      };

      setUserPlan(updatedPlan);
      
      // Forçar recarregamento do plano em todas as páginas
      await loadUserPlan();
      
      return result;
    } catch (error) {
      console.error('Erro ao atualizar para plano pago:', error);
      throw error;
    }
  };

  const isPaidPlan = () => {
    return userPlan?.hasPaidPlan || false;
  };

  const getCurrentPlan = () => {
    return userPlan?.planId || 'glow-start';
  };

  const getCurrentPlanName = () => {
    return userPlan?.planName || 'Glow Start';
  };

  const isPlanActive = () => {
    return userPlan?.isActive || false;
  };

  // Função para forçar atualização do plano em todas as páginas
  const refreshUserPlan = async () => {
    console.log('🔄 Forçando atualização do plano...');
    await loadUserPlan();
  };

  return {
    userPlan,
    loading,
    isPaidPlan,
    getCurrentPlan,
    getCurrentPlanName,
    isPlanActive,
    updateToPaidPlan,
    checkPaidPlan,
    refreshUserPlan
  };
}
