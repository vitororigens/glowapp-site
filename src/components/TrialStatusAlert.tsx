"use client";

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTrialPeriod } from '@/hooks/useTrialPeriod';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function TrialStatusAlert() {
  const { trialInfo, isTrialExpired, getDaysRemaining, isTrialActive, loading } = useTrialPeriod();

  if (loading || !trialInfo) {
    return null;
  }

  // Se o usuário tem plano pago, não mostrar alerta de trial
  // Isso será verificado pelo componente pai

  if (isTrialExpired()) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex items-center justify-between">
            <div>
              <strong>Seu período de teste gratuito expirou!</strong>
              <p className="text-sm mt-1">
                Para continuar usando o GlowApp sem restrições, escolha um plano pago.
              </p>
            </div>
            <Link href="/planos">
              <Button size="sm" className="bg-red-600 hover:bg-red-700">
                Ver Planos
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (isTrialActive() && getDaysRemaining() <= 7) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <strong>Seu período de teste está acabando!</strong>
              <p className="text-sm mt-1">
                Restam apenas {getDaysRemaining()} dias no seu teste gratuito.
              </p>
            </div>
            <Link href="/planos">
              <Button size="sm" variant="outline" className="border-yellow-600 text-yellow-700 hover:bg-yellow-100">
                Ver Planos
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (isTrialActive()) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <CheckCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <strong>Período de teste ativo</strong>
              <p className="text-sm mt-1">
                Restam {getDaysRemaining()} dias no seu teste gratuito.
              </p>
            </div>
            <Link href="/planos">
              <Button size="sm" variant="outline" className="border-blue-600 text-blue-700 hover:bg-blue-100">
                Ver Planos
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
