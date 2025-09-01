/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 * @param date - Data em formato string (YYYY-MM-DD, DD/MM/YYYY, ou Date object)
 * @returns Data formatada no formato DD/MM/YYYY
 */
export const formatDateToBrazilian = (date: string | Date): string => {
  try {
    let dateObj: Date;

    if (typeof date === 'string') {
      // Se já está no formato DD/MM/YYYY, retorna como está
      if (date.includes('/') && date.split('/').length === 3) {
        return date;
      }

      // Se está no formato YYYY-MM-DD, converte
      if (date.includes('-')) {
        const [year, month, day] = date.split('-');
        dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        // Tenta parsear como Date
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }

    // Verifica se a data é válida
    if (isNaN(dateObj.getTime())) {
      return date as string; // Retorna a string original se não conseguir converter
    }

    // Formata para DD/MM/YYYY
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return date as string; // Retorna a string original em caso de erro
  }
};

/**
 * Converte uma data do formato brasileiro (DD/MM/YYYY) para o formato ISO (YYYY-MM-DD)
 * @param date - Data no formato DD/MM/YYYY
 * @returns Data no formato YYYY-MM-DD
 */
export const convertBrazilianToISO = (date: string): string => {
  try {
    if (!date.includes('/')) {
      return date; // Se não está no formato brasileiro, retorna como está
    }

    const [day, month, year] = date.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch (error) {
    console.error('Erro ao converter data:', error);
    return date;
  }
};

/**
 * Formata uma data e hora para o formato brasileiro (DD/MM/YYYY HH:mm)
 * @param dateTime - Data e hora em formato string ou Date object
 * @returns Data e hora formatada no formato DD/MM/YYYY HH:mm
 */
export const formatDateTimeToBrazilian = (dateTime: string | Date): string => {
  try {
    let dateObj: Date;

    if (typeof dateTime === 'string') {
      dateObj = new Date(dateTime);
    } else {
      dateObj = dateTime;
    }

    // Verifica se a data é válida
    if (isNaN(dateObj.getTime())) {
      return dateTime as string;
    }

    const date = formatDateToBrazilian(dateObj);
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');

    return `${date} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Erro ao formatar data e hora:', error);
    return dateTime as string;
  }
};

export class DateFormatter {
  static formatDate(dateString: Date | string) {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
  }

  static daysDifference(dateString: Date | string): number {
    const date = new Date(dateString);
    const today = new Date();
    
    // Calcula a diferença em milissegundos
    const timeDiff = today.getTime() - date.getTime();
  
    // Converte a diferença para dias
    const diffInDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
    return diffInDays;
  }
}