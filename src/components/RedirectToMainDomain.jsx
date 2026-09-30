import { useEffect } from "react";
import { mainUrl } from "@/lib/blogHost";

// Redirects the current blog-subdomain path to the same path on the main
// domain (preserving the query string), so deep links to the main app keep
// working when someone lands on them via the blog host.
export default function RedirectToMainDomain() {
  useEffect(() => {
    const { pathname, search } = window.location;
    window.location.replace(mainUrl(`${pathname}${search}`));
  }, []);
  return null;
}