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
        subscriptionId: 'free_plan',
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

    // Criar ou buscar produto no Stripe
    let product;
    const existingProducts = await stripe.products.list({
      limit: 100,
    });

    const productName = planId === 'glow-pro' ? 'Glow Pro' : 'Glow Start';
    product = existingProducts.data.find(p => p.name === productName);

    if (!product) {
      product = await stripe.products.create({
        name: productName,
        description: planId === 'glow-pro' ? 'Plano Pro com recursos avançados' : 'Plano gratuito básico',
      });
    }

    // Criar ou buscar preço recorrente
    let price;
    const existingPrices = await stripe.prices.list({
      product: product.id,
      active: true,
    });

    if (planId === 'glow-pro') {
      price = existingPrices.data.find(p => 
        p.unit_amount === 2990 && 
        p.currency === 'brl' && 
        p.recurring?.interval === 'month'
      );

      if (!price) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: 2990, // R$ 29,90 em centavos
          currency: 'brl',
          recurring: {
            interval: 'month',
          },
        });
      }
    }

    // Criar assinatura
    if (planId === 'glow-pro' && price) {
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [
          {
            price: price.id,
          },
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          planId: planId,
        },
      });

      return NextResponse.json({
        success: true,
        subscriptionId: subscription.id,
        customerId: customer.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        amount: amount,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
      });
    }

    return NextResponse.json(
      { error: 'Erro ao criar assinatura' },
      { status: 500 }
    );

  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
