import React from "react";

import { cn } from "@/lib/utils";

export default function BrandMark({ className }) {
  return (
    <div
      className={cn(
        "relative flex size-14 items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary via-primary/85 to-accent shadow-sm",
        className,
      )}
    >
      <div className="absolute inset-[10%] rounded-[1.1rem] border border-primary-foreground/20" />
      <div className="absolute inset-[22%] rounded-full border border-primary-foreground/35" />
      <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary-foreground/85" />
      <div className="absolute bottom-3 left-3 h-1.5 w-1.5 rounded-full bg-primary-foreground/70" />
      <div className="absolute bottom-2 right-4 h-1.5 w-1.5 rounded-full bg-primary-foreground/60" />
      <div className="relative text-lg font-semibold tracking-[0.24em] text-primary-foreground">
        PA
      </div>
    </div>
  );
}
