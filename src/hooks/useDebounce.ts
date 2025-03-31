import { useEffect, useState } from 'react'

export const useDebounce = <T>(value: T, milliSeconds: number): T => {
 const [debouncedValue, setDebouncedValue] = useState<T>(value);

 useEffect(() => {
   const timer = setTimeout(() => {
     setDebouncedValue(value);
   }, milliSeconds);

   return () => {
     clearTimeout(timer);
   };
 }, [value, milliSeconds]);

 return debouncedValue;
};