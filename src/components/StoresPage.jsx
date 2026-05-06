import React from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getStoreMedia } from "@/lib/catalog-media";
import { countBy } from "../data";
import FieldList from "./FieldList";
import JsonPreview from "./JsonPreview";
import SmartImage from "./SmartImage";

export default function StoresPage({
  stores,
  products,
  services,
  effectiveInventory,
  setSelectedStoreId,
}) {
  const navigate = useNavigate();
  const storeMedia = getStoreMedia();

  function inventoryForStore(storeId) {
    return effectiveInventory.filter((item) => item.store_id === storeId);
  }

  function productsForStore(storeId) {
    const productIds = new Set(
      inventoryForStore(storeId).map((item) => item.product_id),
    );
    return products.filter((product) => productIds.has(product.product_id));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-card to-muted/45">
        <CardHeader>
          <Badge variant="outline">Lojas</Badge>
          <CardTitle className="text-3xl leading-tight">
            Três filiais, sortidos diferentes e serviços locais.
          </CardTitle>
          <CardDescription className="text-base">
            Cada loja combina o catálogo comum com preços, stock, recolha e programas de comunidade próprios.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6">
        {stores.map((store) => {
          const storeInventory = inventoryForStore(store.store_id);
          const storeProducts = productsForStore(store.store_id);
          const serviceNames = services
            .filter((service) => service.stores_available.includes(store.store_id))
            .map((service) => service.name);
          const speciesBreakdown = countBy(storeProducts, "species");

          return (
            <Card key={store.store_id} className="bg-gradient-to-br from-card to-background/90">
              <SmartImage
                alt={storeMedia.alt}
                fallback="🏬"
                src={storeMedia.src}
                wrapperClassName="aspect-[16/6] border-b"
              />
              <CardHeader className="gap-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{store.city}</Badge>
                      <Badge variant="secondary">{store.pickup_sla}</Badge>
                    </div>
                    <CardTitle>{store.name}</CardTitle>
                    <CardDescription className="text-base">
                      {store.story}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => {
                        setSelectedStoreId(store.store_id);
                        navigate(`/catalogo?store=${store.store_id}`);
                      }}
                    >
                      Ver loja online
                    </Button>
                    <Button
                      onClick={() => setSelectedStoreId(store.store_id)}
                      variant="outline"
                    >
                      Ativar loja
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <FieldList
                  columns={3}
                  data={{
                    Morada: `${store.address}, ${store.postal_code}`,
                    Distrito: store.district,
                    Contacto: `${store.contact.phone} · ${store.contact.email}`,
                    Horário: store.opening_hours,
                    Gestor: store.manager_name,
                    Estacionamento: store.parking,
                    "Produtos únicos": storeProducts.length,
                    "Linhas de inventário": storeInventory.length,
                    Canais: store.channels,
                  }}
                />

                <div className="grid gap-4 xl:grid-cols-3">
                  <Card size="sm" className="bg-background/75">
                    <CardHeader>
                      <CardDescription>Especialidades</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {store.specialties.map((item) => (
                        <Badge key={item} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>

                  <Card size="sm" className="bg-background/75">
                    <CardHeader>
                      <CardDescription>Serviços ativos</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {serviceNames.map((item) => (
                        <Badge key={item} variant="outline">
                          {item}
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>

                  <Card size="sm" className="bg-background/75">
                    <CardHeader>
                      <CardDescription>Distribuição por espécie</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {Object.entries(speciesBreakdown).map(([species, total]) => (
                        <Badge key={species} variant="secondary">
                          {species}: {total}
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <Card size="sm" className="bg-background/75">
                    <CardHeader>
                      <CardDescription>Recursos da loja</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {store.store_features.map((item) => (
                        <Badge key={item} variant="outline">
                          {item}
                        </Badge>
                      ))}
                      {store.pet_friendly_zones.map((item) => (
                        <Badge key={item} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>

                  <Card size="sm" className="bg-background/75">
                    <CardHeader>
                      <CardDescription>Programas de comunidade</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {store.community_programs.map((item) => (
                        <Badge key={item} variant="outline">
                          {item}
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>

              <CardFooter className="flex-col items-stretch">
                <JsonPreview
                  data={store}
                  title={`JSON bruto · ${store.city}`}
                  value={store.store_id}
                />
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
