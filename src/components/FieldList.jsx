import React from "react";

import { stringifyValue } from "../data";

export default function FieldList({ data, columns = 2 }) {
  const entries = Object.entries(data).filter(([, value]) => value !== undefined);
  const gridClass =
    columns === 1
      ? "grid gap-3"
      : columns === 3
        ? "grid gap-3 md:grid-cols-2 xl:grid-cols-3"
        : "grid gap-3 md:grid-cols-2";

  return (
    <dl className={gridClass}>
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-lg border bg-background/70 p-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {key}
          </dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm text-foreground">
            {stringifyValue(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
