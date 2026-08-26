import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * SPA navigations keep the previous page's scroll position, so clicking a
 * category at the bottom of the home page opened the shop already scrolled
 * to its footer. Jump back to the top on every route/query change.
 */
export function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, search]);

  return null;
}
