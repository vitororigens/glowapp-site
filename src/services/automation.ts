export type NewClientPayload = {
  userId: string;
  name: string;
  email: string;
  phone?: string;
};

/**
 * Dispara a jornada do sucesso (novo cadastro) no Pipedream a partir do site
 * Requer NEXT_PUBLIC_PIPEDREAM_JOURNEY_ENDPOINT configurado
 */
export async function triggerNewClientJourney(payload: NewClientPayload): Promise<boolean> {
  try {
    const endpoint = process.env.NEXT_PUBLIC_PIPEDREAM_JOURNEY_ENDPOINT;
    if (!endpoint) {
      console.warn('[Automation] NEXT_PUBLIC_PIPEDREAM_JOURNEY_ENDPOINT não configurado');
      return false;
    }

    const body = {
      type: 'new_client',
      user: {
        id: payload.userId,
        name: payload.name,
        email: payload.email,
        phone: payload.phone ?? '',
        createdAt: new Date().toISOString(),
      },
      sentAt: new Date().toISOString(),
      orgId: process.env.NEXT_PUBLIC_PIPEDREAM_ORG_ID,
      projectId: process.env.NEXT_PUBLIC_PIPEDREAM_PROJECT_ID,
      source: 'site',
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error('[Automation] Falha ao disparar jornada:', res.status, txt);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Automation] Erro ao disparar jornada:', err);
    return false;
  }
}

export type AppointmentServiceItem = {
  id?: string;
  name?: string;
  price?: number | string;
  duration?: number | string;
  [key: string]: any;
};

export type NewAppointmentPayload = {
  appointmentId?: string;
  client: { name?: string; email?: string; phone?: string };
  appointment: {
    date: string;             // YYYY-MM-DD
    startTime: string;        // HH:mm
    endTime?: string;
    observations?: string;
    professionalName?: string;
    professionalSpecialty?: string;
    services?: AppointmentServiceItem[];
    totalPrice?: number | string;
  };
  user: { id: string; name?: string; email?: string; phone?: string };
};

/**
 * Dispara automação de confirmação de consulta (novo agendamento) a partir do site
 * Usa o backend Node.js próprio ao invés do Pipedream
 * Pode ser configurado via NEXT_PUBLIC_AUTOMATION_BACKEND_URL ou usa o valor padrão
 */
export async function triggerAppointmentConfirmationSite(payload: NewAppointmentPayload): Promise<boolean> {
  try {
    // URL do backend Node.js, pode ser sobrescrita via variável de ambiente
    const backendUrl = process.env.NEXT_PUBLIC_AUTOMATION_BACKEND_URL
      || process.env.NEXT_PUBLIC_AUTOMATION_FALLBACK_URL
      || 'https://automacao-glowapp-production.up.railway.app';
    const endpoint = `${backendUrl}/schedule`;

    if (!backendUrl) {
      console.warn('[Automation] NEXT_PUBLIC_AUTOMATION_BACKEND_URL não configurado');
      return false;
    }

    // Formatar serviços para garantir compatibilidade
    const formattedServices = (payload.appointment?.services ?? []).map((service) => ({
      id: service.id || '',
      name: service.name || '',
      price: typeof service.price === 'string' ? parseInt(service.price) || 0 : (service.price || 0),
      duration: service.duration ? (typeof service.duration === 'string' ? parseInt(service.duration) || 0 : service.duration) : 0,
    }));

    // Formatar total_price para número quando possível
    const totalPrice = payload.appointment?.totalPrice 
      ? (typeof payload.appointment.totalPrice === 'string' 
          ? parseInt(payload.appointment.totalPrice) || 0 
          : payload.appointment.totalPrice)
      : 0;

    // Formatar telefone (remover caracteres não numéricos, manter sem prefixo 55)
    let patientPhone = payload.client?.phone || '';
    if (patientPhone.startsWith('55')) {
      patientPhone = patientPhone.substring(2);
    }
    // Remover outros caracteres não numéricos
    patientPhone = patientPhone.replace(/\D/g, '');

    // Preparar payload no formato esperado pelo backend Node.js
    // O backend salva no Firebase e envia template do WhatsApp
    const body = {
      appointment: {
        id: payload.appointmentId ?? '', // ID do agendamento criado no Firebase (opcional)
        patient_name: payload.client?.name ?? '',
        patient_phone: patientPhone, // Telefone sem prefixo "55" - o backend adiciona ao enviar
        patient_email: payload.client?.email ?? '',
        professional_name: payload.appointment?.professionalName ?? '',
        professional_specialty: payload.appointment?.professionalSpecialty ?? '',
        services: formattedServices,
        date_time: `${payload.appointment.date} ${payload.appointment.startTime}`, // Formato: "YYYY-MM-DD HH:mm"
        observations: payload.appointment?.observations ?? '',
        total_price: totalPrice,
        status: 'Agendado',
        created_at: new Date().toISOString(),
      },
      user: {
        id: payload.user.id,
        name: payload.user.name ?? '',
        email: payload.user.email ?? '',
        phone: payload.user.phone ?? '',
      },
    };

    console.log('[Automation] Enviando agendamento para backend:', endpoint);
    console.log('[Automation] Payload preparado:', body);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error('[Automation] Falha ao disparar appointment:', res.status, txt);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Automation] Erro ao disparar appointment:', err);
    return false;
  }
}


