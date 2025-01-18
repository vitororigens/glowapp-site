import { useCallback } from "react";
import $ from "jquery";

const useCallbackLoadedPage = () => {
  const setFnCallback = useCallback((fn: () => void) => {
    return $(document).ready(function() {
      setTimeout(() => {
        fn()
      }, 1000)
     });
  }, []);

  return [setFnCallback] as const;
};

export default useCallbackLoadedPage;
