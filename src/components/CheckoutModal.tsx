"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createPaymentIntent } from '@/services/stripeService';
import { toast } from 'react-toastify';
import { useAuthContext } from '@/context/AuthContext';

// Função para sanitizar erros do Stripe e não expor informações sensíveis
const sanitizeStripeError = (error: any): string => {
  const message = error?.message || '';
  
  // Se a mensagem contém informações sobre API keys, retornar uma mensagem genérica
  if (message.includes('Invalid API Key') || message.includes('pk_live') || message.includes('pk_test')) {
    return 'Erro temporário no sistema de pagamento. Tente novamente em alguns instantes.';
  }
  
  // Se a mensagem contém informações sobre webhooks ou outras configurações internas
  if (message.includes('webhook') || message.includes('endpoint') || message.includes('secret')) {
    return 'Erro temporário no sistema de pagamento. Tente novamente em alguns instantes.';
  }
  
  // Erros relacionados ao cartão podem ser mostrados
  if (message.includes('card') || message.includes('declined') || message.includes('insufficient')) {
    return message;
  }
  
  // Para outros erros técnicos, mostrar mensagem genérica
  if (message.length > 100 || message.includes('Stripe')) {
    return 'Erro ao processar pagamento. Verifique os dados do cartão e tente novamente.';
  }
  
  return message || 'Erro ao processar pagamento';
};

// Carregar o Stripe (você precisará da sua chave pública)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

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

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      color: '#374151',
      fontFamily: 'Inter, system-ui, sans-serif',
      '::placeholder': {
        color: '#9CA3AF',
        fontSize: '14px',
      },
    },
    invalid: {
      color: '#DC2626',
    },
  },
  hidePostalCode: true,
};

function CheckoutForm({ plan, onSuccess, onClose }: { 
  plan: { id: string; name: string; price: number }; 
  onSuccess: () => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Criar o Payment Intent quando o componente montar
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
      return;
    }

    setLoading(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setLoading(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (error) {
      console.error('Erro no pagamento:', error);
      toast.error(sanitizeStripeError(error));
    } else if (paymentIntent.status === 'succeeded') {
      toast.success('Pagamento realizado com sucesso!');
      onSuccess();
      onClose();
    }

    setLoading(false);
  };

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5">
        <div>
          <Label htmlFor="plan-name">Plano</Label>
          <Input
            id="plan-name"
            value={plan.name}
            disabled
            className="bg-gray-50"
          />
        </div>
        
        <div>
          <Label htmlFor="plan-price">Valor</Label>
          <Input
            id="plan-price"
            value={formatPrice(plan.price)}
            disabled
            className="bg-gray-50"
          />
        </div>

        <div>
          <Label htmlFor="card-element" className="text-sm text-gray-600 mb-1 block">Informações do Cartão</Label>
          <div className="p-3 border border-gray-300 rounded-md">
            <CardElement
              id="card-element"
              options={CARD_ELEMENT_OPTIONS}
            />
          </div>
        </div>
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
          disabled={!stripe || loading}
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Finalizar Compra</DialogTitle>
        </DialogHeader>
        
        <Elements stripe={stripePromise}>
          <CheckoutForm 
            plan={plan} 
            onSuccess={onSuccess} 
            onClose={onClose}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}

