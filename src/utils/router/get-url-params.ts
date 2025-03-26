/* eslint-disable @typescript-eslint/no-explicit-any */
type ParamValue = string | number | boolean | null;

interface NestedObject {
  [key: string]: ParamValue | NestedObject;
}

export interface FormData extends NestedObject {}

export const getParamsFromUrl = (url: string): FormData => {
  const params = new URLSearchParams(url.split('?')[1]);
  const formData: FormData = {};

  params.forEach((value, key) => {
    const keys = key.split('_');
    let current: NestedObject = formData;

    while (keys.length > 1) {
      const k = keys.shift()!;
      current[k] = current[k] || {};
      current = current[k] as NestedObject;
    }

    current[keys[0]] = isNaN(Number(value)) ? value : Number(value);
  });

  return formData;
};