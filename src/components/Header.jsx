import React from "react";
import { Store, Wallet } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatCurrency } from "../data";
import BrandMark from "./BrandMark";

export default function Header({
  activeStore,
  brand,
  stores,
  selectedStoreId,
  setSelectedStoreId,
  walletBalance,
  cartItemCount,
  onSecretTap,
  walletToolsOpen,
  onAddVirtualBalance,
}) {
  const navItems = [
    { to: "/", label: "Início" },
    { to: "/catalogo", label: "Catálogo" },
    { to: "/lojas", label: "Lojas" },
    { to: "/servicos", label: "Serviços" },
    { to: "/marca", label: "Marca" },
    { to: "/dados", label: "Dados" },
    { to: "/checkout", label: "Checkout" },
  ];

  return (
    <div className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 xl:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <button className="flex items-center gap-4 text-left" onClick={onSecretTap} type="button">
            <BrandMark />
            <div className="space-y-1">
              <div className="font-heading text-2xl leading-none tracking-tight">
                {brand?.name}
              </div>
              <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Atlas de cuidado, loja e contexto
              </div>
              <div className="text-sm text-muted-foreground">{brand?.tagline}</div>
            </div>
          </button>

          <div className="grid gap-3 lg:grid-cols-[minmax(240px,300px)_auto_auto] lg:items-end">
            <div className="space-y-2">
              <p className="text-sm font-medium">Loja ativa</p>
              <Select onValueChange={setSelectedStoreId} value={selectedStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleciona uma loja" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.store_id} value={store.store_id}>
                      {store.city} · {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card size="sm">
              <CardHeader>
                <CardDescription>Saldo virtual</CardDescription>
                <CardTitle>{formatCurrency(walletBalance)}</CardTitle>
              </CardHeader>
            </Card>

            <Button asChild>
              <Link to="/checkout">
                Checkout
                <Badge variant="secondary">{cartItemCount}</Badge>
              </Link>
            </Button>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  cn(
                    buttonVariants({
                      size: "sm",
                      variant: isActive ? "secondary" : "ghost",
                    }),
                  )
                }
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              <Store className="size-3.5" />
              {activeStore?.city ?? "N/A"}
            </Badge>
            <Badge variant="secondary">{activeStore?.pickup_sla ?? "2h-48h"}</Badge>
          </div>
        </div>

        {walletToolsOpen ? (
          <Card>
            <CardHeader>
              <CardDescription>Ferramenta académica oculta</CardDescription>
              <CardTitle>Saldo de teste</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <p className="text-sm text-muted-foreground">
                Usa este painel para testar cenários de compra com sucesso e erro por falta de saldo.
              </p>
              <div className="flex flex-wrap gap-2">
                {[15, 25, 50, 100].map((amount) => (
                  <Button key={amount} onClick={() => onAddVirtualBalance(amount)} size="sm" variant="outline">
                    <Wallet className="size-4" />
                    + {formatCurrency(amount)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
