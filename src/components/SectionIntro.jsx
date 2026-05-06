import React from "react";

import { Badge } from "@/components/ui/badge";

export default function SectionIntro({ eyebrow, title, description, aside }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl space-y-3">
        {eyebrow ? <Badge variant="outline">{eyebrow}</Badge> : null}
        <div className="space-y-2">
          <h2 className="font-heading text-3xl leading-tight text-foreground md:text-4xl">
            {title}
          </h2>
          {description ? (
            <p className="text-base leading-7 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {aside ? <div className="text-sm text-muted-foreground">{aside}</div> : null}
    </div>
  );
}
