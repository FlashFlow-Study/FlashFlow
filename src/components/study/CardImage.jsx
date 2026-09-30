import React from "react";
import { Image } from "@/components/ui/image";

// Subtle inline photo for a card side. Renders nothing when no URL, so absent
// images never disturb the surrounding layout. Max height keeps it modest.
export default function CardImage({ url, className = "" }) {
  if (!url) return null;
  return (
    <Image
      src={url}
      fittingType="fit"
      className={`max-h-[140px] w-auto object-contain rounded-md ${className}`}
    />
  );
}