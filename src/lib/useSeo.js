import { useEffect } from "react";

/**
 * Sets the document title and meta description for the current page.
 * Call once near the top of a page component:
 *   useSeo("Page Title", "150–160 char description…");
 */
export function useSeo(title, description) {
  useEffect(() => {
    if (title) document.title = title;

    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", "description");
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", description);
    }
  }, [title, description]);
}