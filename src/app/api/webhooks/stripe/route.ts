import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { database } from '@/services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_API_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (!endpointSecret || !sig) {
      console.error('❌ Webhook secret não configurado');
      return NextResponse.json(
        { error: 'Webhook secret não configurado' },
        { status: 400 }
      );
    }

    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Erro ao verificar assinatura do webhook:', err);
    return NextResponse.json(
      { error: 'Assinatura inválida' },
      { status: 400 }
    );
  }

  console.log('📦 Webhook recebido:', event.type);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      default:
        console.log('⚠️ Evento não tratado:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('💰 Payment Intent realizado com sucesso:', paymentIntent.id);
  
  const planId = paymentIntent.metadata?.planId;
  const customerEmail = paymentIntent.metadata?.customerEmail;
  
  if (!planId || !customerEmail) {
    console.error('❌ Metadata incompleta no Payment Intent');
    return;
  }

  // Buscar usuário pelo email
  const userRef = doc(database, 'users', customerEmail);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    console.error('❌ Usuário não encontrado:', customerEmail);
    return;
  }

  const userId = userDoc.data().uid;
  
  // Atualizar plano do usuário
  const planRef = doc(database, 'userPlans', userId);
  await setDoc(planRef, {
    planId,
    planName: planId === 'glow-pro' ? 'Glow Pro' : 'Glow Start',
    isActive: true,
    hasPaidPlan: planId !== 'glow-start',
    lastChecked: new Date(),
    paymentIntentId: paymentIntent.id,
    updatedAt: new Date(),
  });

  console.log('✅ Plano atualizado via webhook:', { userId, planId });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('📄 Fatura paga com sucesso:', invoice.id);
  
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    await handleSubscriptionUpdated(subscription);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Assinatura atualizada:', subscription.id);
  
  const planId = subscription.metadata?.planId;
  const customerEmail = subscription.customer_email;
  
  if (!planId || !customerEmail) {
    console.error('❌ Metadata incompleta na assinatura');
    return;
  }

  // Buscar usuário pelo email
  const userRef = doc(database, 'users', customerEmail);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    console.error('❌ Usuário não encontrado:', customerEmail);
    return;
  }

  const userId = userDoc.data().uid;
  
  // Atualizar plano do usuário
  const planRef = doc(database, 'userPlans', userId);
  await setDoc(planRef, {
    planId,
    planName: planId === 'glow-pro' ? 'Glow Pro' : 'Glow Start',
    isActive: subscription.status === 'active',
    hasPaidPlan: true,
    lastChecked: new Date(),
    subscriptionId: subscription.id,
    updatedAt: new Date(),
  });

  console.log('✅ Assinatura atualizada via webhook:', { userId, planId, status: subscription.status });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('🗑️ Assinatura cancelada:', subscription.id);
  
  const customerEmail = subscription.customer_email;
  
  if (!customerEmail) {
    console.error('❌ Email do cliente não encontrado');
    return;
  }

  // Buscar usuário pelo email
  const userRef = doc(database, 'users', customerEmail);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    console.error('❌ Usuário não encontrado:', customerEmail);
    return;
  }

  const userId = userDoc.data().uid;
  
  // Voltar para plano gratuito
  const planRef = doc(database, 'userPlans', userId);
  await setDoc(planRef, {
    planId: 'glow-start',
    planName: 'Glow Start',
    isActive: true,
    hasPaidPlan: false,
    lastChecked: new Date(),
    updatedAt: new Date(),
  });

  console.log('✅ Usuário voltou para plano gratuito:', userId);
}
