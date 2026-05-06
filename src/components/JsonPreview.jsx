import React, { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function JsonPreview({ title, data, value = "item" }) {
  const [openValue, setOpenValue] = useState("");

  return (
    <Accordion
      collapsible
      onValueChange={setOpenValue}
      type="single"
      value={openValue}
    >
      <AccordionItem value={value}>
        <AccordionTrigger>{title}</AccordionTrigger>
        <AccordionContent>
          {openValue === value ? (
            <pre className="max-h-96 overflow-auto rounded-md border bg-muted p-4 text-xs leading-6">
              {JSON.stringify(data, null, 2)}
            </pre>
          ) : null}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
