import { NextRequest, NextResponse } from 'next/server';

const STRIPE_SECRET_API_KEY = process.env.STRIPE_SECRET_API_KEY;
const STRIPE_API_URL = 'https://api.stripe.com/v1';

export async function POST(request: NextRequest) {
  try {
    const { planId, customerEmail, customerName } = await request.json();

    console.log('🔄 Criando Payment Intent para o plano:', planId);

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
        clientSecret: 'free_plan',
        amount: 0,
        message: 'Plano gratuito ativado com sucesso'
      });
    }

    // Validar o valor mínimo para BRL (R$ 0,50)
    if (!amount || amount < 50) {
      return NextResponse.json(
        { error: 'O valor do plano deve ser maior que R$ 0,50' },
        { status: 400 }
      );
    }

    console.log('💰 Criando Payment Intent com:', {
      amount,
      planId,
    });

    // Criar o Payment Intent com o valor do plano
    const paymentIntentResponse = await fetch(`${STRIPE_API_URL}/payment_intents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: amount.toString(),
        currency: 'brl',
        'automatic_payment_methods[enabled]': 'true',
        'metadata[planId]': planId,
        'metadata[customerEmail]': customerEmail || '',
        setup_future_usage: 'off_session',
      }).toString(),
    });

    if (!paymentIntentResponse.ok) {
      const errorData = await paymentIntentResponse.json();
      console.error('❌ Erro ao criar Payment Intent:', errorData);
      return NextResponse.json(
        { error: `Erro ao criar Payment Intent: ${errorData.error?.message || 'Erro desconhecido'}` },
        { status: 500 }
      );
    }

    const data = await paymentIntentResponse.json();
    console.log('✅ Payment Intent criado com sucesso:', {
      id: data.id,
      amount: data.amount,
      status: data.status,
      clientSecret: data.client_secret,
    });

    return NextResponse.json({
      success: true,
      clientSecret: data.client_secret,
      amount: amount,
      customerId: data.customer,
    });

  } catch (error) {
    console.error('❌ Erro ao criar Payment Intent:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}



