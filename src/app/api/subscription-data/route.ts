import { NextRequest, NextResponse } from 'next/server';
import { findStripeCustomerByEmail, getCustomerSubscriptions } from '@/services/stripeService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔄 Buscando dados da assinatura para:', email);

    // Buscar cliente no Stripe
    const stripeCustomer = await findStripeCustomerByEmail(email);
    
    if (!stripeCustomer) {
      console.log('ℹ Cliente não encontrado no Stripe:', email);
      return NextResponse.json({ subscription: null });
    }

    // Buscar assinaturas do cliente
    const customerSubs = await getCustomerSubscriptions(stripeCustomer.id);
    
    if (customerSubs.length === 0) {
      console.log('ℹ Nenhuma assinatura ativa encontrada para:', email);
      return NextResponse.json({ subscription: null });
    }

    const subscription = customerSubs[0];
    console.log('✅ Assinatura encontrada:', {
      id: subscription.id,
      status: subscription.status,
      current_period_end: subscription.current_period_end
    });

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        canceled_at: subscription.canceled_at
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar dados da assinatura:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados da assinatura' },
      { status: 500 }
    );
  }
}
