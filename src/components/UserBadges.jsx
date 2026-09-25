import React from "react";
import { BadgeCheck, ShieldCheck } from "lucide-react";

export default function UserBadges({ verified, admin, className = "" }) {
  if (!verified && !admin) return null;
  return (
    <span className={`inline-flex items-center gap-1 align-middle ${className}`}>
      {admin &&
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-500 text-white rounded-full font-mono uppercase tracking-widest leading-none text-sm">
          <ShieldCheck className="w-2.5 h-2.5" /> Admin
        </span>
      }
      {verified &&
      <BadgeCheck className="w-4 h-4 text-primary shrink-0" aria-label="Verified" />
      }
    </span>);

}