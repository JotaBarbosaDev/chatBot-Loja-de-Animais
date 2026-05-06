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
import FieldList from "./FieldList";
import JsonPreview from "./JsonPreview";

export default function BrandPage({ brand, contentPages }) {
  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-card to-secondary/25">
        <CardHeader className="gap-3">
          <Badge variant="outline">Marca</Badge>
          <CardTitle className="text-3xl leading-tight">{brand.name}</CardTitle>
          <CardDescription className="text-base">
            {brand.manifesto}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="bg-background/80">
          <CardHeader>
            <CardTitle>Fundação, missão e visão</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldList
              data={{
                Tagline: brand.tagline,
                "Ano de fundação": brand.founded_year,
                Sede: brand.headquarters,
                Missão: brand.mission,
                Visão: brand.vision,
                "Tom de voz": brand.voice,
              }}
            />
          </CardContent>
        </Card>

        <Card className="bg-background/80">
          <CardHeader>
            <CardTitle>Suporte e presença</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldList
              data={{
                Email: brand.support.email,
                Telefone: brand.support.phone,
                Horário: brand.support.hours,
                "Política do chatbot": brand.support.chat_policy,
                Instagram: brand.social.instagram,
                Facebook: brand.social.facebook,
                TikTok: brand.social.tiktok,
              }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="bg-gradient-to-br from-card to-muted/30">
          <CardHeader>
            <CardTitle>Valores</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {brand.values.map((value) => (
              <Card key={value.title} size="sm">
                <CardHeader>
                  <CardTitle className="text-base">{value.title}</CardTitle>
                  <CardDescription>{value.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-accent/10">
          <CardHeader>
            <CardTitle>Garantias</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {brand.guarantees.map((item) => (
              <Badge key={item} variant="secondary">
                {item}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="bg-background/80">
          <CardHeader>
            <CardTitle>Equipa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {brand.team.map((member) => (
              <div key={member.name} className="rounded-lg border p-3">
                <div className="font-medium">{member.name}</div>
                <div className="text-sm text-muted-foreground">
                  {member.role} · {member.focus}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-background/80">
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {brand.timeline.map((milestone) => (
              <div key={milestone.year} className="rounded-lg border p-3">
                <div className="font-medium">{milestone.year}</div>
                <div className="text-sm text-muted-foreground">
                  {milestone.milestone}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-background/80">
          <CardHeader>
            <CardTitle>Clube Atlas e sustentabilidade</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldList
              columns={1}
              data={{
                Programa: brand.loyalty_program.name,
                Benefícios: brand.loyalty_program.benefits,
                Níveis: brand.loyalty_program.tiers,
                Pilares: brand.sustainability.pillars,
                Programas: brand.sustainability.community_programs,
              }}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-card to-muted/35">
        <CardHeader>
          <CardTitle>Páginas institucionais</CardTitle>
          <CardDescription>
            Estas páginas foram acrescentadas ao catálogo e também alimentam os documentos RAG.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {contentPages.map((page) => (
            <Card key={page.page_id} className="bg-background/75" size="sm">
              <CardHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{page.slug}</Badge>
                </div>
                <CardTitle className="text-base">{page.title}</CardTitle>
                <CardDescription>{page.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion collapsible type="single">
                  {page.sections.map((section, index) => (
                    <AccordionItem
                      key={`${page.page_id}-${section.heading}`}
                      value={`${page.page_id}-${index}`}
                    >
                      <AccordionTrigger>{section.heading}</AccordionTrigger>
                      <AccordionContent>{section.body}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-card to-secondary/20">
        <CardHeader>
          <CardTitle>JSON bruto</CardTitle>
          <CardDescription>
            A camada de dados da marca e das páginas continua acessível para validação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <JsonPreview data={brand} title="Brand object" value="brand" />
          <JsonPreview
            data={contentPages}
            title="Content pages"
            value="content-pages"
          />
        </CardContent>
      </Card>
    </div>
  );
}
