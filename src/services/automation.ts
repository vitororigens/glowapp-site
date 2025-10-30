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
 * Requer NEXT_PUBLIC_PIPEDREAM_APPOINTMENT_ENDPOINT configurado
 */
export async function triggerAppointmentConfirmationSite(payload: NewAppointmentPayload): Promise<boolean> {
  try {
    const endpoint = process.env.NEXT_PUBLIC_PIPEDREAM_APPOINTMENT_ENDPOINT;
    if (!endpoint) {
      console.warn('[Automation] NEXT_PUBLIC_PIPEDREAM_APPOINTMENT_ENDPOINT não configurado');
      return false;
    }

    const body = {
      type: 'appointment_confirmation',
      appointment: {
        id: payload.appointmentId ?? '',
        patient_name: payload.client?.name ?? '',
        patient_phone: payload.client?.phone ?? '',
        patient_email: payload.client?.email ?? '',
        professional_name: payload.appointment?.professionalName ?? '',
        professional_specialty: payload.appointment?.professionalSpecialty ?? '',
        services: payload.appointment?.services ?? [],
        date_time: `${payload.appointment.date} ${payload.appointment.startTime}`,
        observations: payload.appointment?.observations ?? '',
        total_price: payload.appointment?.totalPrice ?? '',
        status: 'Agendado',
        created_at: new Date().toISOString(),
      },
      user: {
        id: payload.user.id,
        name: payload.user.name ?? '',
        email: payload.user.email ?? '',
        phone: payload.user.phone ?? '',
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
      console.error('[Automation] Falha ao disparar appointment:', res.status, txt);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Automation] Erro ao disparar appointment:', err);
    return false;
  }
}


