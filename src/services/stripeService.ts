// Serviço para integração com Stripe
import { loadStripe } from '@stripe/stripe-js';

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

// Carregar o Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

/**
 * Cria um Payment Intent no Stripe
 * @param planId - ID do plano selecionado
 * @param customerEmail - Email do cliente
 * @param customerName - Nome do cliente
 * @returns Promise com o client secret do Payment Intent
 */
export const createPaymentIntent = async (planId: string, customerEmail: string, customerName: string): Promise<string> => {
  try {
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
      throw new Error('Erro ao criar Payment Intent');
    }

    const data = await response.json();
    return data.clientSecret;
  } catch (error) {
    console.error('Erro ao criar Payment Intent:', error);
    throw sanitizeError(error);
  }
};

/**
 * Confirma um pagamento com o Stripe
 * @param clientSecret - Client secret do Payment Intent
 * @param paymentMethod - Método de pagamento
 * @returns Promise com o resultado da confirmação
 */
export const confirmPayment = async (
  clientSecret: string,
  paymentMethod: any
): Promise<any> => {
  try {
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe não foi inicializado');
    }

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod,
    });

    return result;
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
    throw error;
  }
};

/**
 * Recupera informações de um Payment Intent
 * @param paymentIntentId - ID do Payment Intent
 * @returns Promise com os dados do Payment Intent
 */
export const retrievePaymentIntent = async (paymentIntentId: string): Promise<any> => {
  try {
    const response = await fetch(`/api/payment-intent/${paymentIntentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao recuperar Payment Intent');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao recuperar Payment Intent:', error);
    throw error;
  }
};

/**
 * Busca um cliente do Stripe por email
 * @param email - Email do cliente
 * @returns Promise com os dados do cliente ou null
 */
export const findStripeCustomerByEmail = async (email: string): Promise<any> => {
  try {
    const response = await fetch(`/api/stripe/customer?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return null;
  }
};

/**
 * Busca assinaturas de um cliente
 * @param customerId - ID do cliente no Stripe
 * @returns Promise com as assinaturas do cliente
 */
export const getCustomerSubscriptions = async (customerId: string): Promise<any[]> => {
  try {
    const response = await fetch(`/api/stripe/subscriptions?customerId=${customerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.subscriptions || [];
  } catch (error) {
    console.error('Erro ao buscar assinaturas:', error);
    return [];
  }
};

/**
 * Cancela uma assinatura
 * @param subscriptionId - ID da assinatura
 * @returns Promise com o resultado do cancelamento
 */
export const cancelSubscription = async (subscriptionId: string): Promise<any> => {
  try {
    const response = await fetch('/api/stripe/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId: subscriptionId,
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao cancelar assinatura');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    throw error;
  }
};

/**
 * Cancela todas as assinaturas de um cliente
 * @param customerId - ID do cliente
 * @returns Promise com o resultado do cancelamento
 */
export const cancelAllCustomerSubscriptions = async (customerId: string): Promise<any> => {
  try {
    const response = await fetch('/api/stripe/cancel-all-subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId: customerId,
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao cancelar assinaturas');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao cancelar assinaturas:', error);
    throw error;
  }
};

/**
 * Cria um cliente no Stripe
 * @param email - Email do cliente
 * @param name - Nome do cliente
 * @returns Promise com os dados do cliente criado
 */
export const createStripeCustomer = async (email: string, name: string): Promise<any> => {
  try {
    const response = await fetch('/api/stripe/create-customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        name: name,
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao criar cliente');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    throw error;
  }
};

/**
 * Busca produtos do Stripe
 * @returns Promise com os produtos disponíveis
 */
export const fetchStripeProducts = async (): Promise<any[]> => {
  try {
    const response = await fetch('/api/stripe/products', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
};

export default {
  createPaymentIntent,
  confirmPayment,
  retrievePaymentIntent,
  findStripeCustomerByEmail,
  getCustomerSubscriptions,
  cancelSubscription,
  cancelAllCustomerSubscriptions,
  createStripeCustomer,
  fetchStripeProducts,
};
