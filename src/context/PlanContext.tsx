"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUserPlan } from '@/hooks/useUserPlan';
import { useUserAuth } from '@/hooks/useUserAuth';

interface PlanContextType {
  currentPlan: string;
  currentPlanName: string;
  hasPaidPlan: boolean;
  isPlanActive: boolean;
  refreshPlan: () => Promise<void>;
  loading: boolean;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUserAuth();
  const { 
    userPlan, 
    getCurrentPlan, 
    getCurrentPlanName, 
    isPaidPlan, 
    isPlanActive, 
    refreshUserPlan,
    loading 
  } = useUserPlan();

  const [currentPlan, setCurrentPlan] = useState('glow-start');
  const [currentPlanName, setCurrentPlanName] = useState('Glow Start');
  const [hasPaidPlan, setHasPaidPlan] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (userPlan) {
      setCurrentPlan(getCurrentPlan());
      setCurrentPlanName(getCurrentPlanName());
      setHasPaidPlan(isPaidPlan());
      setIsActive(isPlanActive());
      
      console.log('🔄 Contexto do plano atualizado:', {
        plan: getCurrentPlan(),
        name: getCurrentPlanName(),
        hasPaidPlan: isPaidPlan(),
        isActive: isPlanActive()
      });
    }
  }, [userPlan, getCurrentPlan, getCurrentPlanName, isPaidPlan, isPlanActive]);

  const refreshPlan = async () => {
    console.log('🔄 Atualizando plano via contexto...');
    await refreshUserPlan();
  };

  const value: PlanContextType = {
    currentPlan,
    currentPlanName,
    hasPaidPlan,
    isPlanActive: isActive,
    refreshPlan,
    loading
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlanContext() {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlanContext must be used within a PlanProvider');
  }
  return context;
}

