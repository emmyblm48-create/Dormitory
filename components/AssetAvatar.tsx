"use client";

import { useState } from "react";
import { formatImageUrl } from "@/lib/format";
import { getAssetIcon } from "@/components/icons";

// Alternate warm/cool pastel chip tones by name, so a room's equipment reads as a
// playful set of badges rather than one flat block of color.
const CHIP_TONES = ["from-bloom-400 to-bloom-600", "from-brand-400 to-brand-700"];
const chipTone = (name?: string) => {
  let hash = 0;
  for (const ch of name || "") hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return CHIP_TONES[hash % CHIP_TONES.length];
};

export const AssetAvatar = ({ imageUrl, name }: { imageUrl?: string | null; name?: string }) => {
  const [imgError, setImgError] = useState(false);
  const IconComponent = getAssetIcon(name);

  const validUrl = formatImageUrl(imageUrl);

  if (validUrl && !imgError) {
    return (
      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/50 overflow-hidden shrink-0 border border-white/60 shadow-glass-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={validUrl}
          alt={name || "ครุภัณฑ์"}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${chipTone(name)} flex items-center justify-center shrink-0 shadow-glass-sm`}>
      <IconComponent />
    </div>
  );
};
