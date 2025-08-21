"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Calendar, 
  Users, 
  Image, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useUserAuth } from '@/hooks/useUserAuth';
import { usePlanLimitations } from '@/hooks/usePlanLimitations';
import { 
  findStripeCustomerByEmail, 
  getCustomerSubscriptions, 
  cancelSubscription 
} from '@/services/stripeService';
import { database } from '@/services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';

interface Subscription {
  id: string;
  status: string;
  current_period_end: number;
  items: {
    data: Array<{
      price: {
        product: string;
        unit_amount: number;
        currency: string;
      };
    }>;
  };
  [key: string]: any;
}

interface Customer {
  id: string;
  email: string;
  name: string;
  [key: string]: any;
}

export default function AssinaturaPage() {
  const { user } = useUserAuth();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [hasFreePlan, setHasFreePlan] = useState(false);
  const [currentUsage, setCurrentUsage] = useState({ clients: 0, images: 0 });
  const { planLimits } = usePlanLimitations();

  useEffect(() => {
    if (user?.email) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      // Por padrão, todos os usuários começam com plano gratuito
      setHasFreePlan(true);

      // Só buscar no Stripe se o usuário tiver uma assinatura ativa
      // Para evitar chamadas desnecessárias, vamos assumir que usuários novos têm plano gratuito
      // e só verificar Stripe se houver indicação de que o usuário tem plano pago
      
      // Por enquanto, vamos manter a lógica simples e só buscar no Stripe
      // se o usuário tiver uma assinatura ativa (isso será implementado quando
      // o usuário fizer upgrade para plano pago)

      // Buscar uso atual de clientes
      await loadCurrentUsage();
    } catch (error) {
      console.error('Erro ao carregar dados da assinatura:', error);
      // Em caso de erro, assume que tem o plano gratuito
      setHasFreePlan(true);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUsage = async () => {
    if (!user?.uid) return;

    try {
      // Buscar clientes do usuário
      const contactsRef = collection(database, "Contacts");
      const q = query(contactsRef, where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      setCurrentUsage({
        clients: querySnapshot.size,
        images: 0 // Por enquanto, assumindo 0 imagens. Pode ser implementado depois
      });
    } catch (error) {
      console.error('Erro ao carregar uso atual:', error);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura?')) {
      return;
    }

    setCancelling(true);
    try {
      await cancelSubscription(subscriptionId);
      toast.success('Assinatura cancelada com sucesso');
      await loadSubscriptionData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      toast.error('Erro ao cancelar assinatura');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
  };

  const formatPrice = (amount: number, currency: string) => {
    const value = amount / 100; // Stripe armazena em centavos
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(value);
  };

  // Funções para controle de vencimento e limites
  const getDaysUntilExpiration = (timestamp: number) => {
    const now = new Date();
    const expiration = new Date(timestamp * 1000);
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPlanStatus = () => {
    if (subscriptions.length > 0) {
      const subscription = subscriptions[0];
      const daysUntilExpiration = getDaysUntilExpiration(subscription.current_period_end);
      
      if (subscription.status === 'active') {
        if (daysUntilExpiration <= 0) {
          return { status: 'expired', message: 'Plano vencido', color: 'text-red-600' };
        } else if (daysUntilExpiration <= 7) {
          return { status: 'expiring', message: `Vence em ${daysUntilExpiration} dias`, color: 'text-orange-600' };
        } else {
          return { status: 'active', message: `Vence em ${daysUntilExpiration} dias`, color: 'text-green-600' };
        }
      } else {
        return { status: 'inactive', message: 'Plano inativo', color: 'text-red-600' };
      }
    } else {
      // Plano gratuito - sempre ativo
      return { status: 'active', message: 'Plano gratuito ativo', color: 'text-green-600' };
    }
  };

  const getUsageStatus = () => {
    const clientsUsage = (currentUsage.clients / planLimits.clients) * 100;
    // Para imagens, vamos mostrar que é por cliente, não total
    const imagesUsage = 0; // Não calculamos uso total de imagens, apenas por cliente
    
    return {
      clients: { current: currentUsage.clients, limit: planLimits.clients, usage: clientsUsage },
      images: { current: 0, limit: planLimits.images, usage: imagesUsage }
    };
  };

  const getPlanName = (productId: string) => {
    // Mapear IDs dos produtos para nomes
    const planNames: { [key: string]: string } = {
      'glow-start': 'Glow Start',
      'glow-pro': 'Glow Pro',
      // Adicione mais conforme necessário
    };
    return planNames[productId] || 'Plano Desconhecido';
  };

  const getPlanLimits = (productId: string) => {
    const limits: { [key: string]: { clients: number; images: number } } = {
      'glow-start': { clients: 10, images: 4 },
      'glow-pro': { clients: 50, images: 8 },
    };
    return limits[productId] || { clients: 0, images: 0 };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Carregando dados da assinatura...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gerenciar Assinatura
          </h1>
          <p className="text-gray-600">
            Visualize e gerencie seu plano atual
          </p>
        </div>

        {/* Status da Assinatura */}
        {subscriptions.length === 0 && !hasFreePlan ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Você não possui uma assinatura ativa. 
              <Button 
                variant="link" 
                className="p-0 h-auto font-semibold"
                onClick={() => window.location.href = '/dashboard/planos'}
              >
                Clique aqui para escolher um plano.
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Controle de Vencimento e Uso */}
            <Card className="border-2 border-blue-100">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-blue-600 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Controle do Plano
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status do Plano */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-semibold">Status do Plano</div>
                      <div className={`text-sm ${getPlanStatus().color}`}>
                        {getPlanStatus().message}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Users className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-semibold">Uso de Clientes</div>
                      <div className="text-sm text-gray-600">
                        {getUsageStatus().clients.current} de {getUsageStatus().clients.limit} utilizados
                        {getUsageStatus().clients.usage > 80 && (
                          <span className="text-orange-600 ml-2">• Próximo do limite</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso do Uso</span>
                    <span>{Math.round(getUsageStatus().clients.usage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        getUsageStatus().clients.usage > 90 ? 'bg-red-500' :
                        getUsageStatus().clients.usage > 80 ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(getUsageStatus().clients.usage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Alertas de Limite */}
                {getUsageStatus().clients.usage >= 100 && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      Você atingiu o limite de clientes! 
                      <Button 
                        variant="link" 
                        className="p-0 h-auto font-semibold text-red-800"
                        onClick={() => window.location.href = '/dashboard/planos'}
                      >
                        Faça upgrade para continuar.
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {getUsageStatus().clients.usage >= 80 && getUsageStatus().clients.usage < 100 && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      Você está próximo do limite de clientes ({Math.round(getUsageStatus().clients.usage)}% usado).
                      <Button 
                        variant="link" 
                        className="p-0 h-auto font-semibold text-orange-800"
                        onClick={() => window.location.href = '/dashboard/planos'}
                      >
                        Considere fazer upgrade.
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
                         </Card>
           </>
          )}
          
                    {(subscriptions.length > 0 || hasFreePlan) && (
            <div className="space-y-6">
              {subscriptions.map((subscription) => {
              const plan = subscription.items.data[0];
              const planName = getPlanName(plan.price.product);
              const limits = getPlanLimits(plan.price.product);
              
              return (
                <Card key={subscription.id} className="border-2 border-blue-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl font-bold text-blue-600">
                          {planName}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-gray-600">Status:</span>
                          <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                            {subscription.status === 'active' ? 'Ativo' : subscription.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatPrice(plan.price.unit_amount, plan.price.currency)}
                        </div>
                        <div className="text-sm text-gray-500">por mês</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Limites do Plano */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Users className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-semibold">Clientes</div>
                          <div className="text-sm text-gray-600">
                            Máximo: {limits.clients} por mês
                          </div>
                        </div>
                      </div>
                      
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Image className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-semibold">Imagens</div>
                      <div className="text-sm text-gray-600">
                        Máximo: {limits.images} por cliente
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        (2 antes + 2 depois no Start, 4 antes + 4 depois no Pro)
                      </div>
                    </div>
                  </div>
                    </div>

                    {/* Próxima Cobrança */}
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-semibold">Próxima Cobrança</div>
                        <div className="text-sm text-gray-600">
                          {formatDate(subscription.current_period_end)}
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => window.location.href = '/dashboard/planos'}
                      >
                        Alterar Plano
                      </Button>
                      
                      <Button 
                        variant="destructive" 
                        className="flex-1"
                        onClick={() => handleCancelSubscription(subscription.id)}
                        disabled={cancelling}
                      >
                        {cancelling ? 'Cancelando...' : 'Cancelar Assinatura'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {/* Plano Gratuito */}
            {hasFreePlan && (
              <Card className="border-2 border-green-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                                          <div>
                        <CardTitle className="text-2xl font-bold text-green-600">
                          Glow Start
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-gray-600">Status:</span>
                          <Badge variant="default" className="bg-green-500">
                            Ativo
                          </Badge>
                        </div>
                      </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        Grátis
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Limites do Plano */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Users className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-semibold">Clientes</div>
                        <div className="text-sm text-gray-600">
                          Máximo: 10 por mês
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Image className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-semibold">Imagens</div>
                        <div className="text-sm text-gray-600">
                          Máximo: 4 por cliente
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informação sobre Upgrade */}
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <div className="font-semibold">Plano Gratuito</div>
                      <div className="text-sm text-gray-600">
                        Após 30 dias, escolha um plano pago para continuar sem restrições
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => window.location.href = '/dashboard/planos'}
                    >
                      Fazer Upgrade
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      disabled
                    >
                      Cancelar (Gratuito)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Informações Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Informações Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <div className="font-semibold">Cancelamento</div>
                <div className="text-sm text-gray-600">
                  Você pode cancelar sua assinatura a qualquer momento. 
                  O acesso será mantido até o final do período atual.
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <div className="font-semibold">Alteração de Plano</div>
                <div className="text-sm text-gray-600">
                  Você pode alterar seu plano a qualquer momento. 
                  As mudanças serão aplicadas na próxima cobrança.
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <div className="font-semibold">Reembolso</div>
                <div className="text-sm text-gray-600">
                  Não oferecemos reembolso para assinaturas canceladas no meio do período.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
