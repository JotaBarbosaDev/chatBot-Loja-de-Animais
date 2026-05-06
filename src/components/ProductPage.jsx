import React from "react";
import { Link, useParams } from "react-router-dom";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { getProductMedia } from "@/lib/catalog-media";
import FieldList from "./FieldList";
import JsonPreview from "./JsonPreview";
import SmartImage from "./SmartImage";
import {
  formatCurrency,
  productEmoji,
  statusLabel,
  stringifyValue,
} from "../data";

function stockBadgeVariant(status) {
  if (status === "esgotado") {
    return "destructive";
  }
  if (status === "stock_baixo") {
    return "secondary";
  }
  return "outline";
}

export default function ProductPage({
  productMap,
  storeMap,
  selectedStoreId,
  offersForProduct,
  onAddToCart,
}) {
  const { productId } = useParams();
  const product = productMap[productId];

  if (!product) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Produto não encontrado</CardTitle>
          <CardDescription>
            O SKU pedido não existe no catálogo atual.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <Link to="/catalogo">Voltar ao catálogo</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const offers = offersForProduct(productId);
  const preferredOffer =
    offers.find((offer) => offer.store_id === selectedStoreId) || offers[0] || null;
  const activeStore = preferredOffer ? storeMap[preferredOffer.store_id] : null;
  const media = getProductMedia(product);

  const summaryData = {
    SKU: product.sku,
    Slug: product.slug,
    Marca: product.brand,
    Fabricante: product.manufacturer,
    Fornecedor: product.supplier,
    Espécie: product.species,
    Subespécie: product.sub_species,
    "Raça alvo": product.breed_target,
    "Etapa de vida": product.life_stage,
    Porte: product.size_target,
    Categoria: product.category,
    Subcategoria: product.subcategory,
    "Preço de referência": formatCurrency(product.reference_price_eur),
    "Faixa de preço": product.price_band,
    Validade: product.validade,
    Estado: product.status,
    "País de origem": product.country_of_origin,
    Barcode: product.barcode,
    Compatibilidade: product.compatibility,
  };

  const nutritionData = {
    Ingredientes: product.ingredients,
    "Componentes analíticos": product.analytical_components,
    Aditivos: product.additives,
    Alergénios: product.allergens,
    "Calorias kcal": product.calories_kcal,
    "Fonte proteica": product.protein_source,
    "Sem cereais": product.grain_free,
    "Foco funcional": product.medical_focus,
    "Guia de alimentação": product.feeding_guide,
    "Tabela diária": product.daily_dosage_table,
    "Notas de transição": product.transition_notes,
    "Vida útil após abertura": product.shelf_life_after_opening,
    "Notas de palatabilidade": product.palatability_notes,
  };

  const technicalData = {
    "Formato de embalagem": product.package_format,
    "Peso líquido kg": product.net_weight_kg,
    "Peso bruto kg": product.gross_weight_kg,
    Dimensões: product.dimensions_cm,
    Material: product.material,
    Cor: product.color,
    "Peso mínimo do animal": product.min_pet_weight_kg,
    "Peso máximo do animal": product.max_pet_weight_kg,
    "Idade mínima meses": product.min_age_months,
    "Nível de atividade": product.activity_level_target,
    "Modo de uso": product.usage_mode,
    Armazenamento: product.storage_instructions,
    Segurança: product.safety_notes,
    Manutenção: product.care_instructions,
    "Frequência de manutenção": product.maintenance_frequency,
    "Ciclo de substituição": product.replacement_cycle,
    "Itens incluídos": product.included_items,
    Garantia: product.warranty,
    "Eco flags": product.eco_flags,
    "Embalagem reciclável": product.recyclable_packaging,
    Certificações: product.certifications,
    "Tipo de água": product.water_type,
    "Capacidade de aquário": product.aquarium_capacity_l,
    "Fluxo de filtro": product.filter_flow_lh,
    "Temperatura": product.temperature_range_c,
    pH: product.ph_range,
    Salinidade: product.salinity_range,
    Potência: product.power_w,
    Voltagem: product.voltage,
    "Ruído dB": product.noise_level_db,
    "Dimensões da gaiola": product.cage_dimensions_cm,
    "Espaçamento barras": product.bar_spacing_mm,
    Montagem: product.mounting_type,
  };

  const ragData = {
    Tags: product.tags,
    "Palavras-chave": product.search_keywords,
    Sinónimos: product.synonyms,
    "Venda cruzada": product.cross_sell,
    "Guias de cuidado": product.care_guides,
    Sazonalidade: product.seasonality,
    "Pontuação média": product.review_score,
    "N.º de avaliações": product.review_count,
    "Recomendado por vet": product.vet_recommended,
  };

  return (
    <div className="flex flex-col gap-6">
      <Button asChild className="w-fit" variant="outline">
        <Link to="/catalogo">Voltar ao catálogo</Link>
      </Button>

      <div className="grid gap-6 2xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-primary/20 bg-gradient-to-br from-card to-secondary/25">
          <SmartImage
            alt={media.alt}
            fallback={productEmoji(product.species, product.product_type)}
            src={media.src}
            wrapperClassName="aspect-[16/10] border-b"
          />
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-background/80 text-4xl shadow-sm">
                <span role="img" aria-label={product.species}>
                  {productEmoji(product.species, product.product_type)}
                </span>
              </div>
              <Badge variant="outline">{product.species}</Badge>
              <Badge variant="secondary">{product.product_type}</Badge>
              <Badge variant="outline">{product.life_stage}</Badge>
              <Badge variant="outline">{product.size_target}</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{product.brand}</p>
              <CardTitle className="text-3xl leading-tight">{product.name}</CardTitle>
              <CardDescription className="text-base">
                {product.description_long || product.description_short}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <FieldList
              data={{
                "Descrição curta": product.description_short,
                "Cross-sell recomendado": product.cross_sell,
                "Guias de cuidado": product.care_guides,
              }}
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-accent/10">
          <CardHeader>
            <CardDescription>Oferta ativa</CardDescription>
            <CardTitle>
              {preferredOffer
                ? formatCurrency(preferredOffer.current_price_eur)
                : "Sem oferta"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={stockBadgeVariant(preferredOffer?.stock_status)}>
                {preferredOffer
                  ? statusLabel(preferredOffer.stock_status)
                  : "Indisponível"}
              </Badge>
              <Badge variant="outline">{activeStore?.city ?? "N/A"}</Badge>
            </div>
            <FieldList
              columns={1}
              data={{
                Loja: activeStore?.name ?? "N/A",
                "Entrega estimada": preferredOffer?.delivery_eta ?? "N/A",
                "Recolha em loja": preferredOffer?.available_for_pickup ? "sim" : "não",
                Promoção: preferredOffer?.promo_label ?? "N/A",
                "Preço base": preferredOffer
                  ? formatCurrency(preferredOffer.base_price_eur)
                  : "N/A",
              }}
            />
          </CardContent>
          <CardFooter>
            <Button
              disabled={!preferredOffer}
              onClick={() => preferredOffer && onAddToCart(product.product_id, preferredOffer.store_id)}
            >
              Adicionar ao checkout
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-card to-muted/35">
        <CardHeader>
          <CardTitle>Oferta por loja</CardTitle>
          <CardDescription>
            O mesmo SKU pode existir com preço, promoção e stock diferentes por cidade.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {offers.map((offer) => (
            <div
              key={`${offer.product_id}-${offer.store_id}`}
              className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="space-y-1">
                <div className="font-medium">{storeMap[offer.store_id]?.name}</div>
                <div className="text-sm text-muted-foreground">
                  {storeMap[offer.store_id]?.city} · {offer.delivery_eta}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={stockBadgeVariant(offer.stock_status)}>
                  {statusLabel(offer.stock_status)}
                </Badge>
                <Badge variant="outline">
                  {formatCurrency(offer.current_price_eur)}
                </Badge>
              </div>
              <Button
                onClick={() => onAddToCart(product.product_id, offer.store_id)}
                variant={offer.store_id === selectedStoreId ? "default" : "outline"}
              >
                Comprar nesta loja
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="bg-background/80">
          <CardHeader>
            <CardTitle>Resumo comercial</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldList data={summaryData} />
          </CardContent>
        </Card>

        <Card className="bg-background/80">
          <CardHeader>
            <CardTitle>Nutrição e uso</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldList data={nutritionData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="bg-background/80">
          <CardHeader>
            <CardTitle>Técnico e logístico</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldList data={technicalData} />
          </CardContent>
        </Card>

        <Card className="bg-background/80">
          <CardHeader>
            <CardTitle>Pesquisa, RAG e contexto expandido</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldList data={ragData} />
          </CardContent>
        </Card>
      </div>

      {(product.faqs ?? []).length ? (
        <Card>
          <CardHeader>
            <CardTitle>FAQ</CardTitle>
            <CardDescription>
              Perguntas frequentes extraídas do próprio catálogo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion collapsible type="single">
              {product.faqs.map((faq, index) => (
                <AccordionItem key={`${faq.question}-${index}`} value={`faq-${index}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>JSON bruto</CardTitle>
          <CardDescription>
            Toda a estrutura do produto e das ofertas continua visível para validação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <JsonPreview data={product} title="Produto completo" value="product" />
          <JsonPreview data={offers} title="Ofertas por loja" value="offers" />
        </CardContent>
      </Card>
    </div>
  );
}
