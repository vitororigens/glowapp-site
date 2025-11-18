// utils/masks.ts

import { currency } from "remask";

const DECIMAL_SEPARATOR_REGEX = /[.,]/;

function normalizeValueToCents(value: string | number | undefined): number {
    if (value === undefined || value === null || value === '') return 0;

    if (typeof value === 'number') {
        if (!Number.isFinite(value)) return 0;

        if (!Number.isInteger(value)) {
            return Math.round(value * 100);
        }

        return value >= 1000 ? value : value * 100;
    }

    const stringValue = String(value).trim();
    if (!stringValue) return 0;

    const hasDecimalSeparator = DECIMAL_SEPARATOR_REGEX.test(stringValue);
    const cleanedValue = stringValue.replace(/[^\d,.-]/g, '');

    if (hasDecimalSeparator) {
        const normalizedValue = cleanedValue.replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(normalizedValue);
        return isNaN(parsed) ? 0 : Math.round(parsed * 100);
    }

    const digitsOnly = cleanedValue.replace(/\D/g, '');
    if (!digitsOnly) return 0;
    const numericValue = Number(digitsOnly);
    if (isNaN(numericValue)) return 0;

    return numericValue >= 1000 ? numericValue : numericValue * 100;
}

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
