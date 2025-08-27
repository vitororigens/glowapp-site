import { NextRequest, NextResponse } from 'next/server';
import { cancelSubscription } from '@/services/stripeService';

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'ID da assinatura é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔄 Cancelando assinatura:', subscriptionId);

    const result = await cancelSubscription(subscriptionId);

    console.log('✅ Assinatura cancelada com sucesso:', {
      id: result.id,
      status: result.status,
      canceled_at: result.canceled_at
    });

    return NextResponse.json({
      success: true,
      message: 'Assinatura cancelada com sucesso',
      subscription: {
        id: result.id,
        status: result.status,
        canceled_at: result.canceled_at,
        current_period_end: result.current_period_end
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao cancelar assinatura:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Erro ao cancelar assinatura',
        details: error.message
      },
      { status: 500 }
    );
  }
}
