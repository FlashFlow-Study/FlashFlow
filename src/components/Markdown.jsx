import React from "react";
import ReactMarkdown from "react-markdown";

// Markdown renderer. react-markdown escapes raw HTML by default (no
// rehype-raw), so user-authored markdown can't inject markup. Styling is
// applied via Tailwind descendant selectors on the wrapper so headings,
// lists, links, code blocks etc. match the app's look without a typography
// plugin.
export default function Markdown({ children, className = "" }) {
  return (
    <div
      className={`font-body text-foreground leading-relaxed
        [&_p]:my-3
        [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:tracking-tight
        [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:tracking-tight
        [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2
        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3
        [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3
        [&_li]:my-1
        [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-80
        [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-4
        [&_pre]:bg-muted [&_pre]:border [&_pre]:border-border [&_pre]:rounded-md [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-4
        [&_code]:font-mono [&_code]:text-sm [&_code]:bg-muted/60 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
        [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:px-0 [&_pre_code]:py-0
        [&_hr]:my-6 [&_hr]:border-border
        [&_img]:rounded-md [&_img]:max-w-full [&_img]:my-4
        ${className}`}
    >
      <ReactMarkdown
        components={{
          a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}