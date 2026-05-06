import React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getServiceMedia } from "@/lib/catalog-media";
import { countBy, formatCurrency } from "../data";
import FieldList from "./FieldList";
import JsonPreview from "./JsonPreview";
import SmartImage from "./SmartImage";

export default function ServicesPage({ services, storeMap }) {
  const serviceTypeCounts = countBy(services, "service_type");

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-card to-accent/10">
        <CardHeader className="gap-3">
          <Badge variant="outline">Serviços</Badge>
          <CardTitle className="text-3xl leading-tight">
            Grooming, mobilidade, hotel, treino e aquariofilia.
          </CardTitle>
          <CardDescription className="text-base">
            Cada serviço tem disponibilidade por loja, requisitos, contraindicações e FAQ.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(serviceTypeCounts).map(([type, total]) => (
            <Badge key={type} variant="secondary">
              {type}: {total}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        {services.map((service) => {
          const media = getServiceMedia(service);

          return (
          <Card key={service.service_id} className="bg-gradient-to-br from-card to-background/95">
            <SmartImage
              alt={media.alt}
              fallback="✂️"
              src={media.src}
              wrapperClassName="aspect-[16/8] border-b"
            />
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{service.service_type}</Badge>
                <Badge variant="secondary">
                  Desde {formatCurrency(service.price_from_eur)}
                </Badge>
                <Badge variant="outline">{service.duration_min} min</Badge>
              </div>
              <CardTitle>{service.name}</CardTitle>
              <CardDescription className="text-base">
                {service.aftercare_notes}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <FieldList
                data={{
                  "Preço desde": formatCurrency(service.price_from_eur),
                  Duração: `${service.duration_min} min`,
                  Marcação: service.booking_mode,
                  "Espécies suportadas": service.species_supported,
                  Inclui: service.includes,
                  Requisitos: service.requirements,
                  Contraindicações: service.contraindications,
                }}
              />

              <div className="flex flex-wrap gap-2">
                {service.stores_available.map((storeId) => (
                  <Badge key={storeId} variant="outline">
                    {storeMap[storeId]?.city ?? storeId}
                  </Badge>
                ))}
              </div>

              {(service.faq ?? []).length ? (
                <Accordion collapsible type="single">
                  {service.faq.map((item, index) => (
                    <AccordionItem
                      key={`${service.service_id}-${index}`}
                      value={`${service.service_id}-${index}`}
                    >
                      <AccordionTrigger>{item.question}</AccordionTrigger>
                      <AccordionContent>{item.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : null}

              <JsonPreview
                data={service}
                title={`JSON bruto · ${service.name}`}
                value={service.service_id}
              />
            </CardContent>
          </Card>
        )})}
      </div>
    </div>
  );
}
