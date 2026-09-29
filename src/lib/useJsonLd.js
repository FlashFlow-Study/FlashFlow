import { useEffect } from "react";

/**
 * Injects a JSON-LD <script type="application/ld+json"> tag into <head> for the
 * lifetime of the calling component, then removes it on unmount. Keeps
 * structured data scoped to the page that owns it.
 */
export function useJsonLd(data) {
  const serialized = JSON.stringify(data);
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-jsonld", "dynamic");
    script.text = serialized;
    document.head.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [serialized]);
}