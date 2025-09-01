import { useState, useEffect } from 'react';

const useIsMobile = ({
  breakpoint = 768
}) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
    setIsMobile(window.innerWidth <= breakpoint);

    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoint]);

  return { isMobile: isClient ? isMobile : false, setIsMobile };
};

export { useIsMobile };
