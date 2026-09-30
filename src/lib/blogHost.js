// Host-based routing helpers for the blog subdomain.
// blog.flashflowstudy.com IS the blog: "/" is the list, "/:id" is a post,
// everything else redirects to the main domain. The main domain keeps
// /blog and /blog/:id working as before, sharing the same BlogPost data.

export const BLOG_HOST = "blog.flashflowstudy.com";
export const MAIN_DOMAIN = "flashflowstudy.com";

export function isBlogHost() {
  if (typeof window === "undefined") return false;
  return window.location.hostname.replace(/:\d+$/, "").toLowerCase() === BLOG_HOST;
}

export function mainUrl(path = "") {
  return `https://${MAIN_DOMAIN}${path}`;
}

// Path to the blog list on the current host.
export function blogListPath() {
  return isBlogHost() ? "/" : "/blog";
}

// Path to a blog post on the current host.
export function blogPostPath(id) {
  return isBlogHost() ? `/${id}` : `/blog/${id}`;
}