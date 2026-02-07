import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_API_KEY ? new Stripe(process.env.STRIPE_SECRET_API_KEY, {
    apiVersion: '2025-08-27.basil',
}) : null;

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe não configurado' },
        { status: 500 }
      );
    }

    const { planId, customerEmail, customerName } = await request.json();

    // Mapeamento de planos para preços (em centavos)
    const planPrices: { [key: string]: number } = {
      'glow-start': 0, // Gratuito
      'glow-pro': 7990, // R$ 79,90 em centavos
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
        p.unit_amount === 7990 && 
        p.currency === 'brl' && 
        p.recurring?.interval === 'month'
      );

      if (!price) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: 7990, // R$ 79,90 em centavos
          currency: 'brl',
          recurring: {
            interval: 'month',
          },
        });
      }
    }

    // Criar assinatura
    if (planId === 'glow-pro' && price) {
      const subscriptionResponse = await stripe.subscriptions.create({
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

      // Type guard to check if latest_invoice is an Invoice object
      const latestInvoice = subscriptionResponse.latest_invoice;
      let clientSecret: string | undefined;
      
      if (latestInvoice && typeof latestInvoice === 'object' && 'payment_intent' in latestInvoice) {
        const paymentIntent = latestInvoice.payment_intent;
        if (paymentIntent && typeof paymentIntent === 'object' && 'client_secret' in paymentIntent) {
          const secret = paymentIntent.client_secret;
          clientSecret = typeof secret === 'string' ? secret : undefined;
        }
      }

      return NextResponse.json({
        success: true,
        subscriptionId: subscriptionResponse.id,
        customerId: customer.id,
        clientSecret: clientSecret,
        amount: amount,
        status: subscriptionResponse.status,
        currentPeriodEnd: (subscriptionResponse as any).current_period_end * 1000, // Convert to milliseconds
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