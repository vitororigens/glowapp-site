/* eslint-disable @typescript-eslint/no-explicit-any */
export interface FormData {
  [key: string]: any;
}

export const buildUrlWithParams = (baseUrl: string = '', params: FormData): string => {
  if (typeof window === 'undefined') return '';
  const url = new URL(baseUrl);
  const queryParams = new URLSearchParams();

  const formatCurrencyBRLToNumber = (value: string): string => {
    return value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  };

  const addParams = (prefix: string, obj: any) => {
    for (const key in obj) {
      const value = obj[key];
      const paramKey = prefix ? `${prefix}_${key}` : key;

      if (typeof value === 'object' && value !== null) {
        addParams(paramKey, value);
      } else if (value !== undefined && value !== null) {
        let formattedValue = value.toString();
        if (formattedValue.match(/^R\$\s?[\d\.,]+$/)) {
          const value = formatCurrencyBRLToNumber(formattedValue);
          if (Number(value) > 0) {
            formattedValue = value;
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

