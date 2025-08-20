import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_API_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do Payment Intent é obrigatório' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(id);

    return NextResponse.json({
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      created: paymentIntent.created,
      metadata: paymentIntent.metadata,
    });
  } catch (error) {
    console.error('Erro ao recuperar Payment Intent:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
