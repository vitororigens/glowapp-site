import { useState, useEffect } from 'react';

const useIsMobile = ({
  breakpoint = 768
}) => {
  if (typeof window === 'undefined') return { isMobile: false };

  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= breakpoint);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoint]);

  return { isMobile, setIsMobile };
};

export { useIsMobile };
