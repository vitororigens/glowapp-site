"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createPaymentIntent } from '@/services/stripeService';
import { toast } from 'react-toastify';
import { useAuthContext } from '@/context/AuthContext';
import { useUserPlan } from '@/hooks/useUserPlan';
import { usePlanContext } from '@/context/PlanContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js';

// Carregar o Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// Função para sanitizar erros do Stripe e não expor informações sensíveis
const sanitizeStripeError = (error: any): string => {
  if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
    return 'Erro temporário no sistema de pagamento. Tente novamente em alguns instantes.';
  }
  
  const message = error?.message || error?.toString() || '';
  
  if (message.includes('Invalid API Key') || message.includes('pk_live') || message.includes('pk_test')) {
    return 'Erro temporário no sistema de pagamento. Tente novamente em alguns instantes.';
  }
  
  if (message.includes('webhook') || message.includes('endpoint') || message.includes('secret')) {
    return 'Erro temporário no sistema de pagamento. Tente novamente em alguns instantes.';
  }
  
  if (message.includes('card') || message.includes('declined') || message.includes('insufficient')) {
    return message;
  }
  
  if (message.length > 100 || message.includes('Stripe')) {
    return 'Erro ao processar pagamento. Verifique os dados do cartão e tente novamente.';
  }
  
  return message || 'Erro ao processar pagamento';
};

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: string;
    name: string;
    price: number;
  };
  onSuccess: () => void;
}

function CheckoutForm({ plan, onSuccess, onClose }: { 
  plan: { id: string; name: string; price: number }; 
  onSuccess: () => void;
  onClose: () => void;
}) {
  const { user } = useAuthContext();
  const { updateToPaidPlan } = useUserPlan();
  const { refreshPlan } = usePlanContext();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    const createIntent = async () => {
      try {
        if (!user?.email) {
          toast.error('Usuário não autenticado');
          return;
        }
        
        const secret = await createPaymentIntent(plan.id, user.email, user.displayName || '');
        setClientSecret(secret);
      } catch (error) {
        console.error('Erro ao criar Payment Intent:', error);
        toast.error(sanitizeStripeError(error));
      }
    };

    if (plan.id && user?.email) {
      createIntent();
    }
  }, [plan.id, user?.email]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      console.error('Stripe não está pronto ou clientSecret não disponível');
      return;
    }

    if (clientSecret === 'free_plan') {
      toast.success('Plano gratuito ativado com sucesso!');
      onSuccess();
      onClose();
      return;
    }

    setLoading(true);

    try {
      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) {
        throw new Error('Elemento do cartão não encontrado');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberElement,
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao processar pagamento');
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ Pagamento realizado com sucesso:', paymentIntent);
        
        try {
          // Atualizar o plano do usuário no banco de dados
          await updateToPaidPlan(plan.id, plan.name, paymentIntent.id);
          console.log('✅ Plano atualizado com sucesso');
          
          // Forçar atualização do plano em todas as páginas
          await refreshPlan();
          console.log('✅ Plano sincronizado em todas as páginas');
          
          toast.success('Pagamento realizado e plano ativado com sucesso!');
          onSuccess();
          onClose();
        } catch (updateError) {
          console.error('❌ Erro ao atualizar plano:', updateError);
          toast.error('Pagamento realizado, mas houve erro ao ativar o plano. Entre em contato com o suporte.');
          onClose();
        }
      } else {
        throw new Error('Pagamento não foi confirmado');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar pagamento. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  const cardStyle = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>Número do Cartão</Label>
          <div className="mt-1 p-3 border border-gray-300 rounded-md">
            <CardNumberElement options={cardStyle} />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <Label>Validade (MM/AA)</Label>
            <div className="mt-1 p-3 border border-gray-300 rounded-md">
              <CardExpiryElement options={cardStyle} />
            </div>
          </div>
          <div className="flex-1">
            <Label>CVC</Label>
            <div className="mt-1 p-3 border border-gray-300 rounded-md">
              <CardCvcElement options={cardStyle} />
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
        <div>ClientSecret: {clientSecret ? '✅ Presente' : '❌ Ausente'}</div>
        <div>Usuário: {user?.email || 'Não logado'}</div>
        <div>Plano: {plan.id}</div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={!clientSecret || loading || clientSecret === 'free_plan' || !stripe}
        >
          {loading ? 'Processando...' : `Pagar ${formatPrice(plan.price)}`}
        </Button>
      </div>
    </form>
  );
}

export default function CheckoutModal({ isOpen, onClose, plan, onSuccess }: CheckoutModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar Compra - {plan.name}</DialogTitle>
        </DialogHeader>
        <Elements stripe={stripePromise}>
          <CheckoutForm plan={plan} onSuccess={onSuccess} onClose={onClose} />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}
