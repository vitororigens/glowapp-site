/* eslint-disable @typescript-eslint/no-explicit-any */
type ParamValue = string | number | boolean | null;
type NestedObject = {
  [key: string]: ParamValue | NestedObject;
};

export interface FormData extends NestedObject {}

export const buildUrlWithParams = (baseUrl: string = '', params: FormData): string => {
  if (typeof window === 'undefined') return '';
  const url = new URL(baseUrl);
  const queryParams = new URLSearchParams();

  const formatCurrencyBRLToNumber = (value: string): string => {
    return value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  };

  const addParams = (prefix: string, obj: NestedObject): void => {
    for (const key in obj) {
      const value = obj[key];
      const paramKey = prefix ? `${prefix}_${key}` : key;

      if (typeof value === 'object' && value !== null) {
        addParams(paramKey, value as NestedObject);
      } else if (value !== undefined && value !== null) {
        let formattedValue = value.toString();
        if (formattedValue.match(/^R\$\s?[\d\.,]+$/)) {
          const numericValue = formatCurrencyBRLToNumber(formattedValue);
          if (Number(numericValue) > 0) {
            formattedValue = numericValue;
          } else {
            return;
          }
        }
        queryParams.append(paramKey, formattedValue);
      }
    }
  };

  addParams('', params);

  url.search = queryParams.toString();
  return url.toString();
};

