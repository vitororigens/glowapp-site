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
import { useUserPlan } from '@/hooks/useUserPlan';
import { usePlanContext } from '@/context/PlanContext';
import { usePlanLimitations } from '@/hooks/usePlanLimitations';
import { 
  findStripeCustomerByEmail, 
  getCustomerSubscriptions, 
  cancelSubscription 
} from '@/services/stripeService';
import { database } from '@/services/firebase';
import CancelSubscriptionModal from '@/components/CancelSubscriptionModal';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';



export default function AssinaturaPage() {
  const { user } = useUserAuth();
  const { userPlan, getCurrentPlan, getCurrentPlanName, isPaidPlan, isPlanActive, loading: planLoading } = useUserPlan();
  const { currentPlan, currentPlanName, hasPaidPlan, isPlanActive: contextIsActive, refreshPlan } = usePlanContext();
  const { planLimits, loading: limitsLoading } = usePlanLimitations();
  
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [currentUsage, setCurrentUsage] = useState({ clients: 0, images: 0 });
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (user?.email && !planLoading && !limitsLoading) {
      console.log('🔄 Carregando dados da assinatura:', {
        currentPlan,
        currentPlanName,
        hasPaidPlan,
        contextIsActive
      });
      loadSubscriptionData();
    }
  }, [user, planLoading, limitsLoading]);

  const loadSubscriptionData = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      // Buscar uso atual de clientes
      await loadCurrentUsage();
      
      // Para planos pagos, buscar dados do Stripe para mostrar data de vencimento
      if (hasPaidPlan) {
        try {
          await loadStripeSubscriptionData();
        } catch (stripeError) {
          console.warn('Dados do Stripe não disponíveis:', stripeError);
          // Não é um erro crítico - o plano ainda é válido
        }
      }
      
      console.log('✅ Dados da assinatura carregados:', {
        plan: currentPlan,
        name: currentPlanName,
        hasPaidPlan,
        isActive: contextIsActive,
        hasStripeData: !!subscriptionData
      });
    } catch (error) {
      console.error('Erro ao carregar dados da assinatura:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStripeSubscriptionData = async () => {
    if (!user?.email) return;
    
    try {
      console.log('🔄 Buscando dados da assinatura no Stripe para:', user.email);
      
      const stripeCustomer = await findStripeCustomerByEmail(user.email);
      console.log('📋 Cliente encontrado:', stripeCustomer ? 'Sim' : 'Não');
      
      if (stripeCustomer) {
        const customerSubs = await getCustomerSubscriptions(stripeCustomer.id);
        console.log('📋 Assinaturas encontradas:', customerSubs.length);
        
        if (customerSubs.length > 0) {
          const subscription = customerSubs[0];
          console.log('📋 Dados da assinatura:', {
            id: subscription.id,
            status: subscription.status,
            current_period_end: subscription.current_period_end
          });
          setSubscriptionData(subscription);
        } else {
          console.log('⚠️ Nenhuma assinatura ativa encontrada');
        }
      } else {
        console.log('⚠️ Cliente não encontrado no Stripe');
      }
    } catch (error) {
      console.error('Erro ao carregar dados do Stripe:', error);
      throw error;
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



  const formatPrice = (amount: number, currency: string) => {
    const value = amount / 100; // Stripe armazena em centavos
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
  };

  const getDaysUntilExpiration = (timestamp: number) => {
    const now = new Date();
    const expiration = new Date(timestamp * 1000);
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleCancelSubscription = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!subscriptionData) {
      toast.error('Não foi possível cancelar a assinatura. Entre em contato com o suporte.');
      setShowCancelModal(false);
      return;
    }

    console.log('📋 Dados da assinatura para cancelamento:', {
      id: subscriptionData.id,
      status: subscriptionData.status,
      current_period_end: subscriptionData.current_period_end
    });

    setCancelling(true);
    try {
      console.log('🔄 Tentando cancelar assinatura:', subscriptionData.id);
      await cancelSubscription(subscriptionData.id);
      toast.success('Assinatura cancelada com sucesso! Você continuará com acesso até o final do período atual.');
      
      // Atualizar o contexto do plano
      await refreshPlan();
      
      // Recarregar dados da assinatura
      await loadSubscriptionData();
      
      setShowCancelModal(false);
    } catch (error: any) {
      console.error('Erro ao cancelar assinatura:', error);
      
      // Verificar se é erro de cartão de teste ou outros problemas específicos
      if (error.message && error.message.includes('test')) {
        toast.error('Cartões de teste podem ter limitações. Tente com um cartão real ou entre em contato com o suporte.');
      } else if (error.message && error.message.includes('não pode ser cancelada')) {
        toast.error(error.message);
      } else if (error.message && error.message.includes('Chave da API')) {
        toast.error('Erro de configuração. Entre em contato com o suporte.');
      } else {
        toast.error('Erro ao cancelar assinatura. Tente novamente ou entre em contato com o suporte.');
      }
    } finally {
      setCancelling(false);
    }
  };

  const getPlanStatus = () => {
    if (hasPaidPlan) {
      if (subscriptionData) {
        const daysUntilExpiration = getDaysUntilExpiration(subscriptionData.current_period_end);
        
        if (subscriptionData.status === 'active') {
          if (daysUntilExpiration <= 0) {
            return { status: 'expired', message: 'Plano vencido', color: 'text-red-600' };
          } else if (daysUntilExpiration <= 7) {
            return { status: 'expiring', message: `Vence em ${daysUntilExpiration} dias`, color: 'text-orange-600' };
          } else {
            return { status: 'active', message: `Vence em ${daysUntilExpiration} dias`, color: 'text-green-600' };
          }
        } else if (subscriptionData.status === 'canceled') {
          return { status: 'canceled', message: `Cancelado - Vence em ${daysUntilExpiration} dias`, color: 'text-orange-600' };
        } else {
          return { status: 'inactive', message: 'Plano inativo', color: 'text-red-600' };
        }
      } else {
        // Plano pago mas sem dados do Stripe - assumir ativo
        return { status: 'active', message: 'Plano pago ativo', color: 'text-green-600' };
      }
    } else {
      return { status: 'active', message: 'Plano gratuito ativo', color: 'text-green-600' };
    }
  };

  const getUsageStatus = () => {
    const clientsUsage = (currentUsage.clients / planLimits.clients) * 100;
    const imagesUsage = 0; // Não calculamos uso total de imagens, apenas por cliente
    
    return {
      clients: { current: currentUsage.clients, limit: planLimits.clients, usage: clientsUsage },
      images: { current: 0, limit: planLimits.images, usage: imagesUsage }
    };
  };

  const getPlanPrice = () => {
    if (hasPaidPlan) {
      const planPrices: { [key: string]: { amount: number; currency: string } } = {
        'glow-start': { amount: 0, currency: 'BRL' },
        'glow-pro': { amount: 2990, currency: 'BRL' }, // R$ 29,90
      };
      return planPrices[currentPlan] || { amount: 0, currency: 'BRL' };
    }
    return { amount: 0, currency: 'BRL' };
  };

  if (loading || planLoading || limitsLoading) {
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
        {!contextIsActive ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Seu plano não está ativo. 
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
          
        {/* Card do Plano Atual */}
        <Card className={`border-2 ${hasPaidPlan ? 'border-blue-200' : 'border-green-200'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={`text-2xl font-bold ${hasPaidPlan ? 'text-blue-600' : 'text-green-600'}`}>
                  {currentPlanName}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={contextIsActive ? 'default' : 'secondary'}>
                    {contextIsActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                  {hasPaidPlan && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Plano Pago
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {hasPaidPlan ? formatPrice(getPlanPrice().amount, getPlanPrice().currency) : 'Grátis'}
                </div>
                <div className="text-sm text-gray-500">
                  {hasPaidPlan ? 'por mês' : 'plano gratuito'}
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
                    Máximo: {planLimits.clients} por mês
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Image className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-semibold">Imagens</div>
                  <div className="text-sm text-gray-600">
                    Máximo: {planLimits.images} por cliente
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ({planLimits.images / 2} antes + {planLimits.images / 2} depois)
                  </div>
                </div>
              </div>
            </div>

                         {/* Próxima Cobrança - apenas para planos pagos */}
             {hasPaidPlan && (
               <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                 <Calendar className="h-5 w-5 text-blue-500" />
                 <div>
                   <div className="font-semibold">Próxima Cobrança</div>
                   <div className="text-sm text-gray-600">
                     {subscriptionData 
                       ? formatDate(subscriptionData.current_period_end)
                       : 'Mensal (renovação automática)'
                     }
                   </div>
                 </div>
               </div>
             )}

            {/* Informação sobre Upgrade - apenas para plano gratuito */}
            {!hasPaidPlan && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="font-semibold">Plano Gratuito</div>
                  <div className="text-sm text-gray-600">
                    Após 30 dias, escolha um plano pago para continuar sem restrições
                  </div>
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.location.href = '/dashboard/planos'}
              >
                {hasPaidPlan ? 'Alterar Plano' : 'Fazer Upgrade'}
              </Button>
              
                             {hasPaidPlan ? (
                 <Button 
                   variant="destructive" 
                   className="flex-1"
                   onClick={handleCancelSubscription}
                   disabled={cancelling}
                 >
                   {cancelling ? 'Cancelando...' : 'Cancelar Assinatura'}
                 </Button>
               ) : (
                 <Button 
                   variant="outline" 
                   className="flex-1"
                   disabled
                 >
                   Cancelar (Gratuito)
                 </Button>
               )}
            </div>
          </CardContent>
        </Card>

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

      {/* Modal de Cancelamento */}
      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
        subscriptionData={subscriptionData}
        loading={cancelling}
      />
    </div>
  );
}
