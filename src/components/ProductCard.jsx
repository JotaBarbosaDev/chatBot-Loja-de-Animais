import React from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProductMedia } from "@/lib/catalog-media";
import { formatCurrency, productEmoji, statusLabel } from "../data";
import SmartImage from "./SmartImage";

function stockBadgeVariant(status) {
  if (status === "esgotado") {
    return "destructive";
  }
  if (status === "stock_baixo") {
    return "secondary";
  }
  return "outline";
}

export default function ProductCard({ product, offer, onAddToCart }) {
  if (!offer) {
    return null;
  }

  const media = getProductMedia(product);

  return (
    <Card className="h-full bg-linear-to-br from-card via-card to-secondary/20">
      <SmartImage
        alt={media.alt}
        fallback={productEmoji(product.species, product.product_type)}
        src={media.src}
        wrapperClassName="aspect-[4/3] border-b"
      />

      <div className="bg-linear-to-br from-primary/10 via-secondary/30 to-transparent p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-background/80 text-2xl shadow-sm">
                <span role="img" aria-label={product.species}>
                  {productEmoji(product.species, product.product_type)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{product.species}</Badge>
                <Badge variant="secondary">{product.category}</Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{product.brand}</p>
              <CardTitle className="mt-1 text-lg leading-snug">
                <Link to={`/produto/${product.product_id}`}>{product.name}</Link>
              </CardTitle>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl font-semibold">
              {formatCurrency(offer.current_price_eur)}
            </div>
            <Badge variant={stockBadgeVariant(offer.stock_status)}>
              {statusLabel(offer.stock_status)}
            </Badge>
          </div>
        </div>
      </div>

      <CardContent className="space-y-4 pt-4">
        <p className="text-sm text-muted-foreground">{product.description_short}</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{product.life_stage}</Badge>
          <Badge variant="outline">{product.size_target}</Badge>
          <Badge variant="outline">{product.price_band}</Badge>
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex items-center justify-between gap-2">
        <Button onClick={onAddToCart}>Comprar</Button>
        <Button asChild variant="outline">
          <Link to={`/produto/${product.product_id}`}>Ver detalhe</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
