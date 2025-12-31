// utils/masks.ts
// ============================================
// FUNÇÕES DE VALORES FINANCEIROS (PADRÃO SEGURO)
// ============================================
// Sempre trabalhar com centavos (integer) no banco
// Exemplo: R$ 19,90 → salva 1990 (centavos)

/**
 * Formata centavos para exibição em moeda brasileira
 * @param cents - Valor em centavos (integer)
 * @returns String formatada: "R$ 19,90"
 */
export function formatToMoney(cents: number): string {
    if (isNaN(cents) || cents === null || cents === undefined) return 'R$ 0,00';
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }
  
  /**
   * Converte string formatada (ex: "R$ 19,90") para centavos
   * @param formattedValue - String formatada ou apenas números
   * @returns Valor em centavos (integer)
   */
  export function parseMoneyToCents(formattedValue: string): number {
    const onlyNumbers = formattedValue.replace(/\D/g, '');
    const cents = Number(onlyNumbers);
    return isNaN(cents) ? 0 : cents;
  }
  
  /**
   * Formata valor enquanto o usuário digita (para usar no onChange do input)
   * @param inputValue - Valor digitado pelo usuário
   * @returns String formatada para exibição: "R$ 19,90"
   */
  export function formatMoneyInput(inputValue: string): string {
    const onlyNumbers = inputValue.replace(/\D/g, '');
    const cents = Number(onlyNumbers);
    return formatToMoney(cents);
  }


export function currencyUnMask(maskedValue: string | undefined) {
    if (!maskedValue) return '0';
    return maskedValue.replace(/\D/g, '');
}

export function formatCurrencyMask(value: string | undefined): string {
    if (!value) return '';
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return '';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue);
}

/**
 * Aplica máscara de moeda enquanto o usuário digita
 * Remove caracteres não numéricos e formata como moeda brasileira
 * @param value - String digitada pelo usuário
 * @returns String formatada como moeda (ex: "R$ 1.234,56")
 */
export function currencyMask(value: string | undefined): string {
    if (!value) return '';
    // Remove tudo exceto números
    const onlyNumbers = value.replace(/\D/g, '');
    if (!onlyNumbers) return '';
    // Converte para número e divide por 100 para obter reais
    const numericValue = parseFloat(onlyNumbers) / 100;
    // Formata como moeda brasileira
    return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numericValue);
}


export function cepMask(value: string) {
    let maskedValue = value;
    maskedValue = maskedValue.replace(/\D/g, '');
    // Limitar a 8 dígitos
    maskedValue = maskedValue.substring(0, 8);
    maskedValue = maskedValue.replace(/^(\d{5})(\d{3})$/, '$1-$2');
    return maskedValue;
}

export function cepUnMask(maskedValue: string) {
    const unMaskedValue = maskedValue.replace(/\D/g, '');
    return unMaskedValue;
}

export function cpfMask(value: string) {
    let maskedValue = value;
    maskedValue = maskedValue.replace(/\D/g, '');
    // Limitar a 11 dígitos
    maskedValue = maskedValue.substring(0, 11);
    maskedValue = maskedValue.replace(/(\d{3})(\d)/, '$1.$2');
    maskedValue = maskedValue.replace(/(\d{3})(\d)/, '$1.$2');
    maskedValue = maskedValue.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return maskedValue;
}

export function cpfUnMask(maskedValue: string) {
    const unMaskedValue = maskedValue.replace(/\D/g, '');
    return unMaskedValue;
}

export function metroQuadradoMask(value: string) {
    let maskedValue = String(value);
    maskedValue = maskedValue.replace(/\D/g, '');
    maskedValue = maskedValue.replace(/(\d)(\d{2})$/, '$1,$2');
    maskedValue = maskedValue.replace(/(?=(\d{3})+(\D))\B/g, '.');
    return `(m²)   ${maskedValue}`;
}

export function metroQuadradoUnMask(maskedValue: string) {
    const unMaskedValue = Number(maskedValue.replace('.', '').replace(',', '.').replace(/[^0-9.]/g, ''));
    return unMaskedValue;
}

export function phoneMask(value: string) {
    let maskedValue = value;
    maskedValue = maskedValue.replace(/\D/g, '');
    // Limitar a 11 dígitos
    maskedValue = maskedValue.substring(0, 11);
    maskedValue = maskedValue.replace(/^(\d{2})(\d)/g, '($1) $2');
    maskedValue = maskedValue.replace(/(\d)(\d{4})$/, '$1-$2');
    return maskedValue;
}

export function phoneUnMask(maskedValue: string) {
    const unMaskedValue = maskedValue.replace(/\D/g, '');
    return unMaskedValue;
}

export function horaMask(value: string) {
    let maskedValue = value;
    maskedValue = maskedValue.replace(/\D/g, '');
    // Limitar a 4 dígitos
    maskedValue = maskedValue.substring(0, 4);
    maskedValue = maskedValue.replace(/(\d{2})(\d)/, '$1:$2');
    return maskedValue;
}

export function horaUnMask(maskedValue: string) {
    const unMaskedValue = maskedValue.replace(/\D/g, '');
    return unMaskedValue;
}

export function dataMask(value: string) {
    let maskedValue = value;
    maskedValue = maskedValue.replace(/\D/g, '');
    maskedValue = maskedValue.replace(/(\d{2})(\d)/, '$1/$2');
    maskedValue = maskedValue.replace(/(\d{2})(\d)/, '$1/$2');
    return maskedValue;
}

export function dataUnMask(maskedValue: string) {
    const unMaskedValue = maskedValue.replace(/\D/g, '');
    return unMaskedValue;
}


export function cnpjMask(value: string): string {
    let maskedValue = value.replace(/\D/g, ''); 
    maskedValue = maskedValue.replace(/^(\d{2})(\d)/, '$1.$2'); 
    maskedValue = maskedValue.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    maskedValue = maskedValue.replace(/\.(\d{3})(\d)/, '.$1/$2');
    maskedValue = maskedValue.replace(/(\d{4})(\d)/, '$1-$2'); 
    return maskedValue;
}

export function cnpjUnMask(maskedValue: string): string {
    return maskedValue.replace(/\D/g, '');
}

export function phoneMask(value: string): string {
    return phoneMask(value);
}

export function phoneUnMask(value: string): string {
    return phoneUnMask(value);
}

export function phoneMask(value: string): string {
    return phoneMask(value);
}

// ===== PADRÃO UNIFICADO PARA VALORES MONETÁRIOS =====

/**
 * Normaliza qualquer valor para centavos (integer)
 * Detecta automaticamente se o valor está em reais ou centavos
 * Padrão: se < 100, está em reais; se >= 100, já está em centavos
 * @param value - Valor em qualquer formato (string, number, undefined)
 * @returns Valor em centavos (integer)
 */
export function normalizeValueToCents(value: string | number | undefined): number {
    if (value === null || value === undefined) return 0;
    
    // Se for string, extrair apenas números
    let numValue: number;
    if (typeof value === 'string') {
        // Remove tudo exceto números
        const onlyNumbers = value.replace(/\D/g, '');
        if (!onlyNumbers) return 0;
        numValue = Number(onlyNumbers);
    } else {
        numValue = value;
    }
    
    if (isNaN(numValue) || numValue === 0) return 0;
    
    // Se o valor for menor que 100, assume que está em reais e converte para centavos
    // Se for maior ou igual a 100, assume que já está em centavos
    if (numValue < 100) {
        return Math.round(numValue * 100);
    }
    
    // Caso contrário, assume que já está em centavos
    return Math.round(numValue);
}

/**
 * Converte valor do banco de dados (em centavos) para formato de exibição (R$ X.XXX,XX)
 * @param value - Valor em centavos (number) ou string numérica
 * @returns String formatada como moeda brasileira
 */
export function formatCurrencyFromCents(value: string | number | undefined): string {
    const valueInCents = normalizeValueToCents(value);

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valueInCents / 100);
}

/**
 * Converte valor de exibição (R$ X.XXX,XX) para formato do banco (centavos)
 * @param formattedValue - String formatada como moeda (ex: "R$ 3.000,00")
 * @returns Número em centavos
 */
export function convertCurrencyToCents(formattedValue: string | undefined): number {
    return normalizeValueToCents(formattedValue);
}

/**
 * Converte string numérica para formato de exibição (R$ X.XXX,XX)
 * Útil quando o valor vem como string do banco
 * @param value - String numérica (ex: "3000" ou "300000")
 * @returns String formatada como moeda brasileira
 */
export function formatCurrencyFromString(value: string | undefined): string {
    const valueInCents = normalizeValueToCents(value);

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valueInCents / 100);
}

/**
 * Converte valor para string de centavos (formato do banco)
 * @param value - Valor em qualquer formato
 * @returns String numérica representando centavos
 */
export function convertToCentsString(value: string | number | undefined): string {
    return String(normalizeValueToCents(value));
}

/**
 * Função unificada para formatação de moeda - detecta automaticamente o formato de entrada
 * @param value - Valor em qualquer formato (centavos, string, número)
 * @returns String formatada como moeda brasileira
 */
export function formatCurrency(value: string | number | undefined): string {
    const valueInCents = normalizeValueToCents(value);

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valueInCents / 100);
}
