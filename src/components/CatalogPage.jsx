import React, { useDeferredValue, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normalizeText, uniqueValues } from "../data";
import ProductCard from "./ProductCard";

export default function CatalogPage({
  products,
  taxonomy,
  selectedStoreId,
  stores,
  selectedOffer,
  offersForProduct,
  onAddToCart,
  setSelectedStoreId,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("all");
  const [category, setCategory] = useState("all");
  const [lifeStage, setLifeStage] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [availableOnly, setAvailableOnly] = useState(true);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    const storeFromQuery = searchParams.get("store");
    if (storeFromQuery && storeFromQuery !== selectedStoreId) {
      setSelectedStoreId(storeFromQuery);
    }
  }, [searchParams, selectedStoreId, setSelectedStoreId]);

  const availableCategories = uniqueValues(
    products.filter((product) => species === "all" || product.species === species),
    "category",
  );

  function updateStoreQuery(storeId) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("store", storeId);
    setSearchParams(nextParams);
    setSelectedStoreId(storeId);
  }

  function offerPrice(productId) {
    return (
      selectedOffer(productId, selectedStoreId)?.current_price_eur ??
      Number.POSITIVE_INFINITY
    );
  }

  const filteredProducts = products
    .filter((product) => {
      if (species !== "all" && product.species !== species) return false;
      if (category !== "all" && product.category !== category) return false;
      if (lifeStage !== "all" && product.life_stage !== lifeStage) return false;
      if (
        deferredSearch &&
        !product._searchBlob.includes(normalizeText(deferredSearch))
      ) {
        return false;
      }
      if (availableOnly) {
        const storeOffer = offersForProduct(product.product_id).find(
          (offer) => offer.store_id === selectedStoreId,
        );
        if (!storeOffer || storeOffer.stock_qty <= 0) {
          return false;
        }
      }
      return true;
    })
    .sort((left, right) => {
      if (sortBy === "price-asc") {
        return offerPrice(left.product_id) - offerPrice(right.product_id);
      }
      if (sortBy === "price-desc") {
        return offerPrice(right.product_id) - offerPrice(left.product_id);
      }
      return left.name.localeCompare(right.name, "pt");
    });

  const activeStore = stores.find((store) => store.store_id === selectedStoreId);

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-primary/15 bg-gradient-to-br from-card to-muted/55">
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <Badge variant="outline">Catálogo</Badge>
              <CardTitle className="text-3xl leading-tight">
                Todos os produtos com filtro por espécie, etapa e loja.
              </CardTitle>
              <CardDescription className="max-w-3xl text-base">
                A loja ativa é {activeStore?.city ?? "N/A"} e os preços, promoções e stock respeitam esse contexto sempre que existir oferta local.
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {filteredProducts.length} resultado(s)
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 xl:grid-cols-4">
          <div className="space-y-2 xl:col-span-4">
            <Label htmlFor="catalog-search">Pesquisa</Label>
            <Input
              id="catalog-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ex.: chihuahua, arranhador, aquário marinho"
              value={search}
            />
          </div>

          <div className="space-y-2">
            <Label>Espécie</Label>
            <Select onValueChange={setSpecies} value={species}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {(taxonomy?.species ?? []).map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select onValueChange={setCategory} value={category}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {availableCategories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Etapa de vida</Label>
            <Select onValueChange={setLifeStage} value={lifeStage}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {(taxonomy?.life_stages ?? []).map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ordenar</Label>
            <Select onValueChange={setSortBy} value={sortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Relevância" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Nome / relevância</SelectItem>
                <SelectItem value="price-asc">Preço crescente</SelectItem>
                <SelectItem value="price-desc">Preço decrescente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 rounded-lg border bg-background/70 p-3 xl:col-span-2">
            <Checkbox
              checked={availableOnly}
              id="available-only"
              onCheckedChange={(checked) => setAvailableOnly(Boolean(checked))}
            />
            <Label htmlFor="available-only">
              Mostrar apenas produtos com stock na loja ativa
            </Label>
          </div>

          <div className="flex items-center justify-end xl:col-span-2">
            <Button
              onClick={() => {
                setSearch("");
                setSpecies("all");
                setCategory("all");
                setLifeStage("all");
                setSortBy("relevance");
                setAvailableOnly(true);
              }}
              variant="outline"
            >
              Limpar filtros
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap gap-2">
          {stores.map((store) => (
            <Button
              key={store.store_id}
              onClick={() => updateStoreQuery(store.store_id)}
              size="sm"
              variant={store.store_id === selectedStoreId ? "secondary" : "outline"}
            >
              {store.city}
            </Button>
          ))}
        </CardFooter>
      </Card>

      {filteredProducts.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.product_id}
              offer={selectedOffer(product.product_id, selectedStoreId)}
              onAddToCart={() => onAddToCart(product.product_id, selectedStoreId)}
              product={product}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Sem resultados</CardTitle>
            <CardDescription>
              Ajusta os filtros ou muda a loja ativa para procurar outro sortido.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
