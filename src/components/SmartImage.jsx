import React, { useState } from "react";

import { cn } from "@/lib/utils";

export default function SmartImage({
  alt,
  className,
  fallback,
  imgClassName,
  src,
  wrapperClassName,
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-4xl",
          wrapperClassName,
          className,
        )}
      >
        {fallback ?? "🐾"}
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden bg-muted", wrapperClassName, className)}>
      <img
        alt={alt}
        className={cn("h-full w-full object-cover", imgClassName)}
        loading="lazy"
        onError={() => setFailed(true)}
        src={src}
      />
    </div>
  );
}
