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