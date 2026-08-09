"use client";

import { useState } from "react";
import { formatImageUrl } from "@/lib/format";
import { getAssetIcon } from "@/components/icons";

export const AssetAvatar = ({ imageUrl, name }: { imageUrl?: string | null; name?: string }) => {
  const [imgError, setImgError] = useState(false);
  const IconComponent = getAssetIcon(name);

  const validUrl = formatImageUrl(imageUrl);

  if (validUrl && !imgError) {
    return (
      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/50 overflow-hidden shrink-0 border border-white/60 shadow-glass-sm">
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
    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center shrink-0 shadow-glass-sm">
      <IconComponent />
    </div>
  );
};
