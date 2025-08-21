import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import "./styles.css"; // Importando o arquivo de estilos

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  limitations: string[];
  isPopular?: boolean;
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

export default function SubscriptionPlans() {
  const formatPrice = (price: number) => {
    if (price === 0) return 'Grátis';
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  return (
    <div id="plans" className="mt-20">
      <div className="container mx-auto py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Escolha seu Plano</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={plan.id} 
              className={`card shadow-lg p-4 rounded-2xl border border-gray-200 flex flex-col h-full relative ${
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
              </div>

              <CardHeader>
                <CardTitle className="text-xl font-bold text-center text-blue-600">{plan.name}</CardTitle>
                <p className="text-center text-sm text-gray-600">{plan.description}</p>
                <p className="text-center text-2xl font-semibold text-gray-700">
                  {formatPrice(plan.price)}
                  {plan.price > 0 && <span className="text-lg text-gray-500">/mês</span>}
                </p>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                <div className="space-y-3 flex-grow">
                  <h4 className="font-semibold text-gray-900">Incluído:</h4>
                  <ul className="space-y-2 text-gray-600">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limitations */}
                {plan.limitations.length > 0 && (
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mt-4">
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


              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
