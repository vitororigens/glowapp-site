import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_API_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { planId, customerEmail, customerName } = await request.json();

    // Mapeamento de planos para preços (em centavos)
    const planPrices: { [key: string]: number } = {
      'glow-start': 0, // Gratuito
      'glow-pro': 2990, // R$ 29,90 em centavos
    };

    const amount = planPrices[planId];
    
    if (amount === undefined) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 400 }
      );
    }

    // Se for o plano gratuito, retornar sucesso
    if (amount === 0) {
      return NextResponse.json({
        success: true,
        clientSecret: 'free_plan',
        amount: 0,
        message: 'Plano gratuito ativado com sucesso'
      });
    }

    // Buscar ou criar cliente no Stripe
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
      });
    }

    // Criar Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'brl',
      customer: customer.id,
      metadata: {
        planId: planId,
        customerEmail: customerEmail,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: amount,
      customerId: customer.id,
    });

  } catch (error) {
    console.error('Erro ao criar Payment Intent:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
