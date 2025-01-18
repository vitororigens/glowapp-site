/* eslint-disable @typescript-eslint/no-explicit-any */
export interface FormData {
  [key: string]: any;
}

export const getParamsFromUrl = (url: string): FormData => {
  const params = new URLSearchParams(url.split('?')[1]);
  const formData: FormData = {};

  params.forEach((value, key) => {
    const keys = key.split('_');
    let current: any = formData;

    while (keys.length > 1) {
      const k = keys.shift()!;
      current[k] = current[k] || {};
      current = current[k];
    }

    current[keys[0]] = isNaN(Number(value)) ? value : Number(value);
  });

  return formData;
};