import React, { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "../data";

export default function CheckoutPage({
  detailedCart,
  cartTotal,
  walletBalance,
  removeCartItem,
  updateCartQuantity,
  submitCheckout,
  checkoutState,
  onAddVirtualBalance,
  orders,
  walletToolsOpen,
}) {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    paymentMethod: "saldo_virtual",
    note: "",
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="gap-3">
            <Badge variant="outline">Checkout simulado</Badge>
            <CardTitle className="text-3xl leading-tight">
              Compra funcional para teste académico.
            </CardTitle>
            <CardDescription className="text-base">
              O carrinho, o loading, a validação de saldo e a confirmação são reais na interface, mas não existe pagamento externo.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-card to-muted/35">
          <CardHeader>
            <CardTitle>Carrinho</CardTitle>
            <CardDescription>
              Produtos adicionados por loja, com quantidade ajustável e total acumulado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!detailedCart.length ? (
              <p className="text-sm text-muted-foreground">
                O carrinho está vazio. Adiciona produtos a partir do catálogo ou da página de detalhe.
              </p>
            ) : (
              detailedCart.map((item) => (
                <div
                  key={item.key}
                  className="flex flex-col gap-4 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{item.store.city}</Badge>
                      <Badge variant="secondary">
                        {formatCurrency(item.offer.current_price_eur)} / unidade
                      </Badge>
                    </div>
                    <div className="font-medium">{item.product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.product.brand} · {item.product.category}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={() =>
                        updateCartQuantity(
                          item.productId,
                          item.storeId,
                          item.quantity - 1,
                        )
                      }
                      size="icon-sm"
                      variant="outline"
                    >
                      -
                    </Button>
                    <Badge variant="outline">{item.quantity}</Badge>
                    <Button
                      onClick={() =>
                        updateCartQuantity(
                          item.productId,
                          item.storeId,
                          item.quantity + 1,
                        )
                      }
                      size="icon-sm"
                      variant="outline"
                    >
                      +
                    </Button>
                    <Badge variant="secondary">
                      {formatCurrency(item.lineTotal)}
                    </Badge>
                    <Button
                      onClick={() => removeCartItem(item.productId, item.storeId)}
                      variant="ghost"
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {checkoutState.status === "error" ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Compra não concluída</AlertTitle>
            <AlertDescription>{checkoutState.error}</AlertDescription>
          </Alert>
        ) : null}

        {checkoutState.status === "success" && checkoutState.order ? (
          <Alert>
            <CheckCircle2 className="size-4" />
            <AlertTitle>Compra concluída</AlertTitle>
            <AlertDescription>
              Encomenda {checkoutState.order.orderId} criada com sucesso. Total pago: {formatCurrency(checkoutState.order.total)}.
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-card to-accent/10">
          <CardHeader>
            <CardTitle>Dados do checkout</CardTitle>
            <CardDescription>
              Preenche os campos e conclui a encomenda simulada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                submitCheckout(formState);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="checkout-name">Nome</Label>
                <Input
                  id="checkout-name"
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                  value={formState.name}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="checkout-email">Email</Label>
                  <Input
                    id="checkout-email"
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    required
                    type="email"
                    value={formState.email}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkout-phone">Telefone</Label>
                  <Input
                    id="checkout-phone"
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    required
                    value={formState.phone}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkout-address">Morada</Label>
                <Input
                  id="checkout-address"
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                  required
                  value={formState.address}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="checkout-city">Cidade</Label>
                  <Input
                    id="checkout-city"
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        city: event.target.value,
                      }))
                    }
                    required
                    value={formState.city}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Método de pagamento</Label>
                  <Select
                    onValueChange={(value) =>
                      setFormState((current) => ({
                        ...current,
                        paymentMethod: value,
                      }))
                    }
                    value={formState.paymentMethod}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saldo_virtual">
                        Saldo virtual académico
                      </SelectItem>
                      <SelectItem value="cartao_mock">Cartão mock</SelectItem>
                      <SelectItem value="mbway_mock">MB WAY mock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkout-note">Nota</Label>
                <Textarea
                  id="checkout-note"
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  placeholder="Observações académicas ou pedidos simulados"
                  value={formState.note}
                />
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm text-muted-foreground">Saldo disponível</span>
                  <Badge variant="secondary">
                    {formatCurrency(walletBalance)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm text-muted-foreground">Total da encomenda</span>
                  <Badge variant="outline">{formatCurrency(cartTotal)}</Badge>
                </div>
              </div>

              {walletToolsOpen ? (
                <div className="flex flex-wrap gap-2">
                  {[20, 40, 75].map((amount) => (
                    <Button
                      key={amount}
                      onClick={() => onAddVirtualBalance(amount)}
                      type="button"
                      variant="outline"
                    >
                      + {formatCurrency(amount)}
                    </Button>
                  ))}
                </div>
              ) : null}

              <Button
                disabled={checkoutState.status === "loading" || !detailedCart.length}
                type="submit"
              >
                {checkoutState.status === "loading"
                  ? "A processar..."
                  : "Finalizar compra"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-secondary/20">
          <CardHeader>
            <CardTitle>Histórico local</CardTitle>
            <CardDescription>
              Últimas encomendas guardadas no navegador.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {orders.length ? (
              orders.map((order) => (
                <div key={order.orderId} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{order.orderId}</Badge>
                    <Badge variant="secondary">
                      {formatCurrency(order.total)}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString("pt-PT")} · {order.items.length} linha(s)
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Ainda não existem encomendas simuladas.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
