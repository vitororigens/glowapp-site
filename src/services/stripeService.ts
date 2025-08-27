// stripeService.ts
const STRIPE_SECRET_API_KEY = process.env.STRIPE_SECRET_API_KEY;

const STRIPE_API_URL = 'https://api.stripe.com/v1';

interface StripeSubscription {
  id: string;
  status: string;
  customer: string;
  [key: string]: any;
}

export async function fetchStripeProducts() {
  try {
    console.log('🔄 Buscando produtos do Stripe...');
    const response = await fetch(
      `${STRIPE_API_URL}/products?active=true&expand[]=data.default_price`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error('Erro ao buscar produtos');
    }

    const data = await response.json();
    console.log('✅ Produtos buscados com sucesso:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error);
    throw error;
  }
}

export async function createPaymentIntent(planId: string, customerEmail?: string, customerName?: string) {
  try {
    console.log('🔄 Criando Payment Intent para o plano:', planId);

    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId: planId,
        customerEmail: customerEmail,
        customerName: customerName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao criar Payment Intent');
    }

    const data = await response.json();
    console.log('✅ Payment Intent criado com sucesso:', data);
    return data.clientSecret;
  } catch (error) {
    console.error('❌ Erro ao criar Payment Intent:', error);
    throw error;
  }
}

export async function createPaymentIntentWithAmount(amountInCents: number) {
  try {
    console.log('🔄 Criando Payment Intent com valor:', amountInCents);

    // Validar o valor mínimo para BRL (R$ 0,50)
    if (!amountInCents || amountInCents < 50) {
      throw new Error('O valor do plano deve ser maior que R$ 0,50');
    }

    // Criar o Payment Intent com o valor especificado
    const paymentIntentResponse = await fetch(`${STRIPE_API_URL}/payment_intents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: amountInCents.toString(),
        currency: 'brl',
        'automatic_payment_methods[enabled]': 'true',
        'metadata[plan]': 'pro',
        'metadata[amount]': amountInCents.toString(),
        setup_future_usage: 'off_session',
      }).toString(),
    });

    if (!paymentIntentResponse.ok) {
      const errorData = await paymentIntentResponse.json();
      console.error('❌ Erro ao criar Payment Intent:', errorData);
      throw new Error(
        `Erro ao criar Payment Intent: ${errorData.error?.message || 'Erro desconhecido'}`,
      );
    }

    const data = await paymentIntentResponse.json();
    console.log('✅ Payment Intent criado com sucesso:', {
      id: data.id,
      amount: data.amount,
      status: data.status,
      clientSecret: data.client_secret,
    });
    return data.client_secret;
  } catch (error) {
    console.error('❌ Erro ao criar Payment Intent:', error);
    throw error;
  }
}

export async function createStripeCustomer(email: string, name: string) {
  try {
    console.log('🔄 Iniciando criação de cliente no Stripe:', { email, name });

    const body = new URLSearchParams({
      email,
      name,
    });

    const response = await fetch(`${STRIPE_API_URL}/customers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erro ao criar cliente no Stripe:', errorData);
      throw new Error(
        `Erro ao criar cliente no Stripe: ${errorData.error?.message || 'Erro desconhecido'}`,
      );
    }

    const data = await response.json();
    console.log('✅ Cliente criado com sucesso no Stripe:', {
      id: data.id,
      email: data.email,
      name: data.name,
    });

    return data.id;
  } catch (error) {
    console.error('❌ Erro ao criar cliente no Stripe:', error);
    throw error;
  }
}

export async function findStripeCustomerByEmail(email: string) {
  try {
    console.log('🔄 Buscando cliente no Stripe por email:', email);

    const response = await fetch(`${STRIPE_API_URL}/customers?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erro ao buscar cliente no Stripe:', errorData);
      throw new Error(
        `Erro ao buscar cliente no Stripe: ${errorData.error?.message || 'Erro desconhecido'}`,
      );
    }

    const data = await response.json();
    console.log('✅ Cliente encontrado no Stripe:', data);

    return data.data.length > 0 ? data.data[0] : null;
  } catch (error) {
    console.error('❌ Erro ao buscar cliente no Stripe:', error);
    throw error;
  }
}

export async function getCustomerSubscriptions(customerId: string) {
  try {
    console.log('🔄 Buscando assinaturas do cliente:', customerId);

    const response = await fetch(
      `${STRIPE_API_URL}/subscriptions?customer=${customerId}&status=active`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erro ao buscar assinaturas:', errorData);
      throw new Error(
        `Erro ao buscar assinaturas: ${errorData.error?.message || 'Erro desconhecido'}`,
      );
    }

    const data = await response.json();
    console.log('✅ Assinaturas encontradas:', data);

    return data.data;
  } catch (error) {
    console.error('❌ Erro ao buscar assinaturas:', error);
    throw error;
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    console.log('🔄 Cancelando assinatura:', subscriptionId);

    if (!STRIPE_SECRET_API_KEY) {
      throw new Error('Chave da API do Stripe não configurada');
    }

    const response = await fetch(`${STRIPE_API_URL}/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Resposta do Stripe:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erro ao cancelar assinatura:', errorData);
      
      // Verificar se é erro específico de cartão de teste
      if (errorData.error?.code === 'subscription_cannot_be_canceled') {
        throw new Error('Esta assinatura não pode ser cancelada no momento. Tente novamente mais tarde.');
      }
      
      throw new Error(
        `Erro ao cancelar assinatura: ${errorData.error?.message || 'Erro desconhecido'}`,
      );
    }

    const data = await response.json();
    console.log('✅ Assinatura cancelada com sucesso:', {
      id: data.id,
      status: data.status,
      canceled_at: data.canceled_at,
      current_period_end: data.current_period_end
    });

    return data;
  } catch (error) {
    console.error('❌ Erro ao cancelar assinatura:', error);
    throw error;
  }
}

export async function cancelAllCustomerSubscriptions(email: string) {
  try {
    console.log('🔄 Cancelando todas as assinaturas do cliente:', email);

    // Buscar cliente por email
    const customer = await findStripeCustomerByEmail(email);
    if (!customer) {
      console.log('ℹ Cliente não encontrado no Stripe:', email);
      return;
    }

    // Buscar assinaturas ativas
    const subscriptions = await getCustomerSubscriptions(customer.id);
    if (subscriptions.length === 0) {
      console.log('ℹ Nenhuma assinatura ativa encontrada para o cliente:', customer.id);
      return;
    }

    // Cancelar todas as assinaturas
    const cancelPromises = subscriptions.map((subscription: StripeSubscription) =>
      cancelSubscription(subscription.id),
    );

    await Promise.all(cancelPromises);
    console.log('✅ Todas as assinaturas foram canceladas com sucesso');
  } catch (error) {
    console.error('❌ Erro ao cancelar assinaturas do cliente:', error);
    throw error;
  }
}

// Função para sanitizar erros antes de lançá-los
const sanitizeError = (error: any): Error => {
  const message = error?.message || 'Erro desconhecido';
  
  // Verificar se o erro contém informações sensíveis
  if (message.includes('Invalid API Key') || 
      message.includes('pk_live') || 
      message.includes('pk_test') ||
      message.includes('webhook') ||
      message.includes('secret')) {
    return new Error('Falha temporária no sistema de pagamento');
  }
  
  return new Error(message);
};
