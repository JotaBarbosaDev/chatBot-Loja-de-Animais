import React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { countBy } from "../data";
import FieldList from "./FieldList";
import JsonPreview from "./JsonPreview";

export default function DataPage({
  catalog,
  effectiveInventory,
  products,
  services,
  stores,
}) {
  const ragDocuments = catalog.rag_documents ?? [];
  const productSpeciesCounts = countBy(products, "species");
  const ragTypeCounts = countBy(ragDocuments, "doc_type");

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-card to-secondary/25">
        <CardHeader className="gap-3">
          <Badge variant="outline">Dados e RAG</Badge>
          <CardTitle className="text-3xl leading-tight">
            Vista de controlo do catálogo, inventário e documentos semânticos.
          </CardTitle>
          <CardDescription className="text-base">
            Esta página existe para garantir que tudo o que alimenta o chatbot, o ecommerce e a pesquisa continua visível no frontend.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card size="sm" className="bg-background/80">
          <CardHeader>
            <CardDescription>Produtos</CardDescription>
            <CardTitle>{products.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm" className="bg-background/80">
          <CardHeader>
            <CardDescription>Inventário</CardDescription>
            <CardTitle>{catalog.inventory.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm" className="bg-background/80">
          <CardHeader>
            <CardDescription>Serviços</CardDescription>
            <CardTitle>{services.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm" className="bg-background/80">
          <CardHeader>
            <CardDescription>Documentos RAG</CardDescription>
            <CardTitle>{ragDocuments.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="bg-background/80">
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldList data={catalog.metadata} />
          </CardContent>
        </Card>

        <Card className="bg-background/80">
          <CardHeader>
            <CardTitle>Resumo de cobertura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(productSpeciesCounts).map(([species, total]) => (
                <Badge key={species} variant="secondary">
                  {species}: {total}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ragTypeCounts).map(([type, total]) => (
                <Badge key={type} variant="outline">
                  {type}: {total}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-card to-muted/35">
        <CardHeader>
          <CardTitle>Taxonomy</CardTitle>
          <CardDescription>
            Vocabulário controlado usado nas facetas e nos documentos semânticos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldList
            columns={3}
            data={{
              species: catalog.taxonomy.species,
              sub_species: catalog.taxonomy.sub_species,
              breeds: catalog.taxonomy.breeds,
              life_stages: catalog.taxonomy.life_stages,
              sizes: catalog.taxonomy.sizes,
              dietary_needs: catalog.taxonomy.dietary_needs,
              water_types: catalog.taxonomy.water_types,
              habitat_types: catalog.taxonomy.habitat_types,
              service_types: catalog.taxonomy.service_types,
              materials: catalog.taxonomy.materials,
              store_channels: catalog.taxonomy.store_channels,
              stock_statuses: catalog.taxonomy.stock_statuses,
            }}
          />
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-card to-accent/10">
        <CardHeader>
          <CardTitle>Amostra de documentos RAG</CardTitle>
          <CardDescription>
            O site mostra o texto pesquisável que mais tarde será chunked ou indexado.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-3">
          {ragDocuments.slice(0, 6).map((doc) => (
            <Card key={doc.doc_id} className="bg-background/75" size="sm">
              <CardHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{doc.doc_type}</Badge>
                  <Badge variant="secondary">{doc.city}</Badge>
                </div>
                <CardTitle className="text-base">{doc.title}</CardTitle>
                <CardDescription>{doc.price_text}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {doc.content}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-card to-secondary/20">
        <CardHeader>
          <CardTitle>JSON bruto por secção</CardTitle>
          <CardDescription>
            Cada área principal do catálogo continua acessível no frontend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <JsonPreview data={catalog.metadata} title="metadata" value="metadata" />
          <JsonPreview data={catalog.taxonomy} title="taxonomy" value="taxonomy" />
          <JsonPreview data={stores} title="stores" value="stores" />
          <JsonPreview data={products} title="products" value="products" />
          <JsonPreview data={catalog.inventory} title="inventory" value="inventory" />
          <JsonPreview
            data={effectiveInventory}
            title="inventory runtime"
            value="runtime-inventory"
          />
          <JsonPreview data={services} title="services" value="services" />
          <JsonPreview data={catalog.brand} title="brand" value="brand-json" />
          <JsonPreview
            data={catalog.content_pages}
            title="content_pages"
            value="content-pages-json"
          />
          <JsonPreview
            data={ragDocuments}
            title="rag_documents"
            value="rag-documents"
          />
        </CardContent>
      </Card>
    </div>
  );
}
