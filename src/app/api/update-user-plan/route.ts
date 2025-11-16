import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/services/firebase';
import { doc, setDoc } from 'firebase/firestore';

// Tornar a rota dinâmica para evitar execução durante o build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { userId, planId, planName, paymentIntentId } = await request.json();

    if (!userId || !planId) {
      return NextResponse.json(
        { error: 'userId e planId são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('🔄 Atualizando plano do usuário:', { userId, planId, planName });

    // Atualizar o plano do usuário no Firestore
    const planRef = doc(database, 'userPlans', userId);
    
    const userPlan = {
      planId,
      planName: planName || (planId === 'glow-pro' ? 'Glow Pro' : 'Glow Start'),
      isActive: true,
      hasPaidPlan: planId !== 'glow-start',
      lastChecked: new Date(),
      paymentIntentId: paymentIntentId || null,
      updatedAt: new Date(),
    };

    await setDoc(planRef, userPlan);

    console.log('✅ Plano atualizado com sucesso:', { userId, planId });

    return NextResponse.json({
      success: true,
      message: 'Plano atualizado com sucesso',
      plan: userPlan
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar plano do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

