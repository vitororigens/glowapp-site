import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_API_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar assinaturas do cliente no Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
    });

    // Formatar as assinaturas para retorno
    const formattedSubscriptions = subscriptions.data.map(subscription => ({
      id: subscription.id,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      created: subscription.created,
      items: {
        data: subscription.items.data.map(item => ({
          id: item.id,
          price: {
            id: item.price.id,
            product: item.price.product,
            unit_amount: item.price.unit_amount,
            currency: item.price.currency,
            recurring: item.price.recurring,
          },
          quantity: item.quantity,
        })),
      },
      metadata: subscription.metadata,
    }));

    return NextResponse.json({
      subscriptions: formattedSubscriptions,
      total: subscriptions.data.length,
    });

  } catch (error) {
    console.error('Erro ao buscar assinaturas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
