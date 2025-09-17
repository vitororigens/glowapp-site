// utils/masks.ts

import { currency } from "remask";

export function currencyMask(value: string | number | undefined) {
    if (value === undefined || value === null) return '';
    
    // Se for número, formata diretamente
    if (typeof value === 'number') {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value / 100);
    }

    // Se for string, remove caracteres não numéricos e converte para número
    const stringValue = String(value || '');
    const numericValue = Number(stringValue.replace(/\D/g, ''));

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(numericValue / 100);
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

export function celularMask(value: string) {
    let maskedValue = value;
    maskedValue = maskedValue.replace(/\D/g, '');
    // Limitar a 11 dígitos
    maskedValue = maskedValue.substring(0, 11);
    maskedValue = maskedValue.replace(/^(\d{2})(\d)/g, '($1) $2');
    maskedValue = maskedValue.replace(/(\d)(\d{4})$/, '$1-$2');
    return maskedValue;
}

export function celularUnMask(maskedValue: string) {
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

export function applyPhoneMask(value: string): string {
    return celularMask(value);
}

export function phoneUnMask(value: string): string {
    return celularUnMask(value);
}

export function phoneMask(value: string): string {
    return celularMask(value);
}

// ===== PADRÃO UNIFICADO PARA VALORES MONETÁRIOS =====

/**
 * Converte valor do banco de dados (em centavos) para formato de exibição (R$ X.XXX,XX)
 * @param value - Valor em centavos (number) ou string numérica
 * @returns String formatada como moeda brasileira
 */
export function formatCurrencyFromCents(value: string | number | undefined): string {
    if (value === undefined || value === null || value === '') return 'R$ 0,00';
    
    let numericValue: number;
    
    if (typeof value === 'number') {
        numericValue = value;
    } else {
        // Remove caracteres não numéricos e converte para número
        const cleanValue = String(value).replace(/\D/g, '');
        numericValue = Number(cleanValue);
    }
    
    if (isNaN(numericValue)) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(numericValue / 100);
}

/**
 * Converte valor de exibição (R$ X.XXX,XX) para formato do banco (centavos)
 * @param formattedValue - String formatada como moeda (ex: "R$ 3.000,00")
 * @returns Número em centavos
 */
export function convertCurrencyToCents(formattedValue: string | undefined): number {
    if (!formattedValue) return 0;
    
    // Remove todos os caracteres não numéricos exceto vírgula e ponto
    const cleanValue = formattedValue.replace(/[^\d,.-]/g, '');
    
    // Se tem vírgula, assume formato brasileiro (3.000,00)
    if (cleanValue.includes(',')) {
        // Remove pontos de milhares e substitui vírgula por ponto
        const normalizedValue = cleanValue.replace(/\./g, '').replace(',', '.');
        return Math.round(parseFloat(normalizedValue) * 100);
    }
    
    // Se não tem vírgula, assume que já está em centavos ou é um número inteiro
    return Math.round(parseFloat(cleanValue));
}

/**
 * Converte string numérica para formato de exibição (R$ X.XXX,XX)
 * Útil quando o valor vem como string do banco
 * @param value - String numérica (ex: "3000" ou "300000")
 * @returns String formatada como moeda brasileira
 */
export function formatCurrencyFromString(value: string | undefined): string {
    if (!value) return 'R$ 0,00';
    
    const numericValue = Number(value);
    if (isNaN(numericValue)) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(numericValue / 100);
}

/**
 * Converte valor para string de centavos (formato do banco)
 * @param value - Valor em qualquer formato
 * @returns String numérica representando centavos
 */
export function convertToCentsString(value: string | number | undefined): string {
    if (value === undefined || value === null) return '0';
    
    let numericValue: number;
    
    if (typeof value === 'number') {
        numericValue = value;
    } else {
        // Remove caracteres não numéricos exceto vírgula e ponto
        const cleanValue = String(value).replace(/[^\d,.-]/g, '');
        
        if (cleanValue.includes(',')) {
            // Formato brasileiro: 3.000,00
            const normalizedValue = cleanValue.replace(/\./g, '').replace(',', '.');
            numericValue = Math.round(parseFloat(normalizedValue) * 100);
        } else {
            numericValue = Math.round(parseFloat(cleanValue));
        }
    }
    
    return String(numericValue);
}

/**
 * Função unificada para formatação de moeda - detecta automaticamente o formato de entrada
 * @param value - Valor em qualquer formato (centavos, string, número)
 * @returns String formatada como moeda brasileira
 */
export function formatCurrency(value: string | number | undefined): string {
    if (value === undefined || value === null || value === '') return 'R$ 0,00';
    
    // Se for string vazia ou apenas espaços
    if (typeof value === 'string' && value.trim() === '') return 'R$ 0,00';
    
    let numericValue: number;
    
    if (typeof value === 'number') {
        numericValue = value;
    } else {
        const cleanValue = String(value).replace(/[^\d,.-]/g, '');
        
        if (cleanValue.includes(',')) {
            // Formato brasileiro: 3.000,00 -> converte para centavos
            const normalizedValue = cleanValue.replace(/\./g, '').replace(',', '.');
            numericValue = Math.round(parseFloat(normalizedValue) * 100);
        } else {
            // Assume que já está em centavos se for string numérica
            numericValue = Math.round(parseFloat(cleanValue));
        }
    }
    
    if (isNaN(numericValue)) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(numericValue / 100);
}
