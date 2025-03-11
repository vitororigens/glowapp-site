// utils/masks.ts

import { currency } from "remask";

export function currencyMask(value: string) {
    const numericValue = Number(value.replace(/\D/g, '')) / 100;

    const maskedValue = currency.mask({
        locale: 'pt-BR',
        currency: 'BRL',
        value: numericValue
    });

    return maskedValue;
}

export function currencyUnMask(maskedValue: string) {
    const unMaskedValue = currency.unmask({
        locale: 'pt-BR',
        currency: 'BRL',
        value: maskedValue
    });

    return unMaskedValue;
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
