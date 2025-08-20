"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';
import { fetchStripeProducts, createPaymentIntent } from '@/services/stripeService';
import { useUserAuth } from '@/hooks/useUserAuth';
import { useUserPlan } from '@/hooks/useUserPlan';
import { toast } from 'react-toastify';
import CheckoutModal from '@/components/CheckoutModal';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  limitations: string[];
  isPopular?: boolean;
  isCurrent?: boolean;
}

const plans: Plan[] = [
  {
    id: 'glow-start',
    name: 'Glow Start',
    description: 'Experimente todas as funcionalidades do GlowApp com algumas limitações.',
    price: 0,
    features: [
      'Imagem antes e depois',
      'Agenda',
      'Controle Financeiro',
      'Lista de Procedimentos',
      'Orçamentos',
      'Checklist',
      'Histórico de Tarefas',
      'Integração com WhatsApp'
    ],
    limitations: [
      'Máximo de 10 clientes cadastrados',
      'Máximo de 4 imagens por cliente (2 antes e 2 depois)',
      'Após 30 dias, escolha um plano pago para continuar sem restrições'
    ]
  },
  {
    id: 'glow-pro',
    name: 'Glow Pro',
    description: 'Todas as funcionalidades para profissionais que querem crescer.',
    price: 29.90,
    features: [
      'Imagem antes e depois',
      'Agenda',
      'Controle Financeiro',
      'Lista de Procedimentos',
      'Orçamentos',
      'Checklist',
      'Histórico de Tarefas',
      'Integração com WhatsApp',
      'Dashboard financeiro com filtros',
      'Customização de catálogo',
      'Link de agendamento online'
    ],
    limitations: [
      'Máximo de 50 novos clientes por mês',
      'Máximo de 8 fotos por cliente (4 antes e 4 depois)'
    ],
    isPopular: true
  }
];

export default function PlanosPage() {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const { user } = useUserAuth();
  const { getCurrentPlan, isPaidPlan } = useUserPlan();

  // O hook useUserPlan já gerencia o plano do usuário automaticamente

  const handleChoosePlan = async (plan: Plan) => {
    if (!user) {
      toast.error('Você precisa estar logado para escolher um plano');
      return;
    }

    // Verificar se já é o plano atual
    if (getCurrentPlan() === plan.id) {
      toast.info('Este já é seu plano atual!');
      return;
    }

    if (plan.price === 0) {
      // Plano gratuito - implementar lógica específica
      toast.success('Plano Glow Start ativado com sucesso!');
      // Recarregar o plano do usuário
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      return;
    }

    // Para planos pagos, abrir o modal de checkout
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  const handleCheckoutSuccess = () => {
    toast.success('Plano ativado com sucesso!');
    setShowCheckout(false);
    setSelectedPlan(null);
    // Recarregar o plano do usuário
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Grátis';
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-xl text-gray-600">
            Encontre o plano perfeito para o seu negócio
          </p>
        </div>

        {/* Restaurar Compras Button */}
        <div className="text-center mb-8">
          <Button 
            variant="outline" 
            className="bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            Restaurar Compras
          </Button>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                plan.isPopular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
                             {/* Badges */}
               <div className="absolute top-4 right-4 flex flex-col gap-2">
                 {plan.isPopular && (
                   <Badge className="bg-blue-500 text-white">
                     MAIS POPULAR
                   </Badge>
                 )}
                 {user && getCurrentPlan() === plan.id && (
                   <Badge className="bg-green-500 text-white">
                     PLANO ATUAL
                   </Badge>
                 )}
               </div>

              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-blue-600">
                  {plan.name}
                </CardTitle>
                <p className="text-gray-600 text-sm">
                  {plan.description}
                </p>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {formatPrice(plan.price)}
                  {plan.price > 0 && <span className="text-lg text-gray-500">/mês</span>}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Incluído:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limitations */}
                {plan.limitations.length > 0 && (
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-pink-500 mt-1">•</span>
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                                 {/* CTA Button */}
                 <Button
                   onClick={() => handleChoosePlan(plan)}
                   disabled={loading || (user && getCurrentPlan() === plan.id)}
                   className={`w-full py-3 text-lg font-semibold ${
                     user && getCurrentPlan() === plan.id
                       ? 'bg-green-600 hover:bg-green-700 cursor-not-allowed'
                       : plan.isPopular 
                         ? 'bg-blue-600 hover:bg-blue-700' 
                         : 'bg-gray-800 hover:bg-gray-900'
                   }`}
                 >
                   {loading ? 'Processando...' : 
                    (user && getCurrentPlan() === plan.id) ? 'Plano Atual' : 'Escolher este plano'}
                 </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Por que escolher o GlowApp?
            </h3>
            <p className="text-gray-600">
              Gerencie seu negócio de forma simples e eficiente. 
              Organize clientes, agenda, finanças e muito mais em um só lugar.
            </p>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {selectedPlan && (
        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => {
            setShowCheckout(false);
            setSelectedPlan(null);
          }}
          plan={selectedPlan}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  );
}
