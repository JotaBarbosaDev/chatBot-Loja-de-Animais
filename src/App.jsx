import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Link, Route, Routes, useLocation } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

import BrandPage from "./components/BrandPage";
import CatalogPage from "./components/CatalogPage";
import CheckoutPage from "./components/CheckoutPage";
import DataPage from "./components/DataPage";
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import ProductPage from "./components/ProductPage";
import ServicesPage from "./components/ServicesPage";
import StoresPage from "./components/StoresPage";
import {
  buildSearchBlob,
  fetchCatalog,
  formatCurrency,
  inventoryStatusFromStock,
} from "./data";

const STORAGE_KEYS = {
  selectedStore: "casadosbichos:selected-store",
  cart: "casadosbichos:cart",
  balance: "casadosbichos:balance",
  orders: "casadosbichos:orders",
  inventoryPatch: "casadosbichos:inventory-patch",
};

const DEFAULT_BALANCE = 48.5;
const NA = "N/A";

function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      return initialValue;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

export default function App() {
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStoreId, setSelectedStoreId] = usePersistedState(
    STORAGE_KEYS.selectedStore,
    "",
  );
  const [cart, setCart] = usePersistedState(STORAGE_KEYS.cart, []);
  const [walletBalance, setWalletBalance] = usePersistedState(
    STORAGE_KEYS.balance,
    DEFAULT_BALANCE,
  );
  const [orders, setOrders] = usePersistedState(STORAGE_KEYS.orders, []);
  const [inventoryPatch, setInventoryPatch] = usePersistedState(
    STORAGE_KEYS.inventoryPatch,
    {},
  );
  const [flash, setFlash] = useState(null);
  const [walletToolsOpen, setWalletToolsOpen] = useState(false);
  const [checkoutState, setCheckoutState] = useState({
    status: "idle",
    error: "",
    order: null,
  });
  const flashTimerRef = useRef(null);
  const logoTapRef = useRef({ count: 0, timer: null });

  useEffect(() => {
    let mounted = true;

    fetchCatalog()
      .then((data) => {
        if (!mounted) {
          return;
        }
        setCatalog({
          ...data,
          products: data.products.map((product) => ({
            ...product,
            _searchBlob: buildSearchBlob(product),
          })),
        });
        setLoading(false);
      })
      .catch((fetchError) => {
        if (!mounted) {
          return;
        }
        setError(fetchError.message);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const stores = catalog?.stores ?? [];
  const products = catalog?.products ?? [];
  const services = catalog?.services ?? [];
  const storeMap = Object.fromEntries(stores.map((store) => [store.store_id, store]));
  const productMap = Object.fromEntries(
    products.map((product) => [product.product_id, product]),
  );
  const brand = catalog?.brand ?? null;
  const contentPages = catalog?.content_pages ?? [];

  useEffect(() => {
    if (!selectedStoreId && stores.length) {
      setSelectedStoreId(stores[0].store_id);
    }
  }, [selectedStoreId, setSelectedStoreId, stores]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) {
        window.clearTimeout(flashTimerRef.current);
      }
      if (logoTapRef.current.timer) {
        window.clearTimeout(logoTapRef.current.timer);
      }
    };
  }, []);

  function pushFlash(message, tone = "info") {
    setFlash({ tone, message });
    if (flashTimerRef.current) {
      window.clearTimeout(flashTimerRef.current);
    }
    flashTimerRef.current = window.setTimeout(() => setFlash(null), 2800);
  }

  const effectiveInventory = (catalog?.inventory ?? []).map((item) => {
    const key = `${item.product_id}::${item.store_id}`;
    const patchedStock = inventoryPatch[key];
    const stockQty = Number.isFinite(patchedStock) ? patchedStock : item.stock_qty;
    return {
      ...item,
      stock_qty: stockQty,
      stock_status: inventoryStatusFromStock(stockQty),
      available_for_pickup: stockQty > 0,
      delivery_eta: stockQty > 0 ? item.delivery_eta : NA,
    };
  });

  function offersForProduct(productId) {
    return effectiveInventory
      .filter((item) => item.product_id === productId)
      .sort((left, right) => left.current_price_eur - right.current_price_eur);
  }

  function selectedOffer(productId, preferredStoreId = selectedStoreId) {
    const offers = offersForProduct(productId);
    return (
      offers.find(
        (item) => item.store_id === preferredStoreId && item.stock_qty > 0,
      ) ||
      offers.find((item) => item.store_id === preferredStoreId) ||
      offers.find((item) => item.stock_qty > 0) ||
      offers[0] ||
      null
    );
  }

  function addToCart(productId, preferredStoreId = selectedStoreId) {
    const product = productMap[productId];
    if (!product) {
      return;
    }

    const offers = offersForProduct(productId);
    const offer =
      offers.find(
        (item) => item.store_id === preferredStoreId && item.stock_qty > 0,
      ) || offers.find((item) => item.stock_qty > 0);

    if (!offer) {
      pushFlash("Este produto está indisponível no momento.", "error");
      return;
    }

    setCart((currentCart) => {
      const existingIndex = currentCart.findIndex(
        (item) =>
          item.productId === productId && item.storeId === offer.store_id,
      );
      if (existingIndex >= 0) {
        return currentCart.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...currentCart,
        { productId, storeId: offer.store_id, quantity: 1 },
      ];
    });

    pushFlash(`${product.name} adicionado ao carrinho.`, "success");
  }

  function removeCartItem(productId, storeId) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          !(item.productId === productId && item.storeId === storeId),
      ),
    );
  }

  function updateCartQuantity(productId, storeId, nextQuantity) {
    if (nextQuantity <= 0) {
      removeCartItem(productId, storeId);
      return;
    }
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.productId === productId && item.storeId === storeId
          ? { ...item, quantity: nextQuantity }
          : item,
      ),
    );
  }

  const detailedCart = cart
    .map((item) => {
      const product = productMap[item.productId];
      const offer = effectiveInventory.find(
        (inventoryItem) =>
          inventoryItem.product_id === item.productId &&
          inventoryItem.store_id === item.storeId,
      );
      const store = storeMap[item.storeId];

      if (!product || !offer || !store) {
        return null;
      }

      return {
        ...item,
        key: `${item.productId}::${item.storeId}`,
        product,
        offer,
        store,
        lineTotal: offer.current_price_eur * item.quantity,
      };
    })
    .filter(Boolean);

  const cartItemCount = detailedCart.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const cartTotal = detailedCart.reduce((total, item) => total + item.lineTotal, 0);
  const activeStore = storeMap[selectedStoreId] ?? stores[0] ?? null;

  function handleLogoSecretTap() {
    const tracker = logoTapRef.current;
    tracker.count += 1;
    if (tracker.timer) {
      window.clearTimeout(tracker.timer);
    }

    tracker.timer = window.setTimeout(() => {
      tracker.count = 0;
    }, 1200);

    if (tracker.count >= 4) {
      tracker.count = 0;
      setWalletToolsOpen((current) => !current);
      pushFlash("Painel de saldo desbloqueado.", "info");
    }
  }

  function addVirtualBalance(amount) {
    setWalletBalance((currentBalance) =>
      Number((currentBalance + amount).toFixed(2)),
    );
    pushFlash(`Saldo virtual reforçado em ${formatCurrency(amount)}.`, "success");
  }

  async function submitCheckout(customerData) {
    if (!detailedCart.length) {
      setCheckoutState({
        status: "error",
        error: "O carrinho está vazio.",
        order: null,
      });
      return;
    }

    setCheckoutState({ status: "loading", error: "", order: null });

    await new Promise((resolve) => {
      window.setTimeout(resolve, 1800);
    });

    if (cartTotal > walletBalance) {
      setCheckoutState({
        status: "error",
        error: "Saldo insuficiente. Carregue saldo para completar a compra.",
        order: null,
      });
      pushFlash("A compra falhou por falta de saldo.", "error");
      return;
    }

    const nextPatch = { ...inventoryPatch };
    detailedCart.forEach((item) => {
      nextPatch[item.key] = Math.max(0, item.offer.stock_qty - item.quantity);
    });
    setInventoryPatch(nextPatch);

    const order = {
      orderId: `ATL-${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString(),
      customer: customerData,
      total: Number(cartTotal.toFixed(2)),
      items: detailedCart.map((item) => ({
        productId: item.product.product_id,
        name: item.product.name,
        storeId: item.store.store_id,
        storeName: item.store.name,
        quantity: item.quantity,
        lineTotal: Number(item.lineTotal.toFixed(2)),
      })),
      status: "pago",
    };

    setWalletBalance((currentBalance) =>
      Number((currentBalance - cartTotal).toFixed(2)),
    );
    setOrders((currentOrders) => [order, ...currentOrders].slice(0, 10));
    setCart([]);
    setCheckoutState({ status: "success", error: "", order });
    pushFlash(
      `Compra concluída com sucesso. Encomenda ${order.orderId}.`,
      "success",
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !catalog || !brand) {
    return (
      <CenteredStatus
        title="Não foi possível carregar o site"
        description={
          error || "Faltam dados essenciais para renderizar a experiência."
        }
        eyebrow="PetAtlas PT"
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteLayout
        activeStore={activeStore}
        brand={brand}
        cartItemCount={cartItemCount}
        contentPages={contentPages}
        flash={flash}
        onAddVirtualBalance={addVirtualBalance}
        onSecretTap={handleLogoSecretTap}
        selectedStoreId={selectedStoreId}
        setSelectedStoreId={setSelectedStoreId}
        stores={stores}
        walletBalance={walletBalance}
        walletToolsOpen={walletToolsOpen}
      >
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                activeStore={activeStore}
                brand={brand}
                catalog={catalog}
                contentPages={contentPages}
                onAddToCart={addToCart}
                products={products}
                selectedOffer={selectedOffer}
                selectedStoreId={selectedStoreId}
                services={services}
                setSelectedStoreId={setSelectedStoreId}
                stores={stores}
              />
            }
          />
          <Route
            path="/catalogo"
            element={
              <CatalogPage
                offersForProduct={offersForProduct}
                onAddToCart={addToCart}
                products={products}
                selectedOffer={selectedOffer}
                selectedStoreId={selectedStoreId}
                setSelectedStoreId={setSelectedStoreId}
                stores={stores}
                taxonomy={catalog.taxonomy}
              />
            }
          />
          <Route
            path="/produto/:productId"
            element={
              <ProductPage
                offersForProduct={offersForProduct}
                onAddToCart={addToCart}
                productMap={productMap}
                selectedStoreId={selectedStoreId}
                storeMap={storeMap}
              />
            }
          />
          <Route
            path="/lojas"
            element={
              <StoresPage
                effectiveInventory={effectiveInventory}
                products={products}
                services={services}
                setSelectedStoreId={setSelectedStoreId}
                stores={stores}
              />
            }
          />
          <Route
            path="/servicos"
            element={<ServicesPage services={services} storeMap={storeMap} />}
          />
          <Route
            path="/marca"
            element={<BrandPage brand={brand} contentPages={contentPages} />}
          />
          <Route
            path="/dados"
            element={
              <DataPage
                catalog={catalog}
                effectiveInventory={effectiveInventory}
                products={products}
                services={services}
                stores={stores}
              />
            }
          />
          <Route
            path="/checkout"
            element={
              <CheckoutPage
                cartTotal={cartTotal}
                checkoutState={checkoutState}
                detailedCart={detailedCart}
                onAddVirtualBalance={addVirtualBalance}
                orders={orders}
                removeCartItem={removeCartItem}
                submitCheckout={submitCheckout}
                updateCartQuantity={updateCartQuantity}
                walletBalance={walletBalance}
                walletToolsOpen={walletToolsOpen}
              />
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </SiteLayout>
    </div>
  );
}

function SiteLayout({
  activeStore,
  brand,
  cartItemCount,
  contentPages,
  flash,
  onAddVirtualBalance,
  onSecretTap,
  selectedStoreId,
  setSelectedStoreId,
  stores,
  walletBalance,
  walletToolsOpen,
  children,
}) {
  const location = useLocation();

  return (
    <>
      <Header
        activeStore={activeStore}
        brand={brand}
        cartItemCount={cartItemCount}
        onAddVirtualBalance={onAddVirtualBalance}
        onSecretTap={onSecretTap}
        selectedStoreId={selectedStoreId}
        setSelectedStoreId={setSelectedStoreId}
        stores={stores}
        walletBalance={walletBalance}
        walletToolsOpen={walletToolsOpen}
      />

      <div className="mx-auto w-full max-w-[1600px] px-4 pt-4 sm:px-6 xl:px-8">
        {flash ? <FlashBanner flash={flash} /> : null}
      </div>

      <main
        className="mx-auto min-h-[calc(100vh-15rem)] w-full max-w-[1600px] px-4 py-6 sm:px-6 xl:px-8"
        data-route={location.pathname}
      >
        {children}
      </main>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto grid w-full max-w-[1600px] gap-4 px-4 py-8 sm:px-6 md:grid-cols-3 xl:px-8">
          <Card>
            <CardHeader>
              <Badge variant="outline">PetAtlas PT</Badge>
              <CardTitle>{brand.mission}</CardTitle>
              <CardDescription>{brand.manifesto}</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conteúdo institucional</CardTitle>
              <CardDescription>
                Páginas editoriais reutilizadas do catálogo e disponíveis no RAG.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {contentPages.map((page) => (
                <Badge key={page.page_id} variant="secondary">
                  {page.title}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Suporte</CardTitle>
              <CardDescription>
                Chat híbrido com respostas via RAG PetAtlas, Ollama ou ambos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{brand.support.email}</p>
              <p>{brand.support.phone}</p>
              <p>{brand.support.hours}</p>
            </CardContent>
          </Card>
        </div>
      </footer>
    </>
  );
}

function FlashBanner({ flash }) {
  const Icon =
    flash.tone === "success"
      ? CheckCircle2
      : flash.tone === "error"
        ? AlertCircle
        : Info;

  return (
    <Alert variant={flash.tone === "error" ? "destructive" : "default"}>
      <Icon className="size-4" />
      <AlertTitle>
        {flash.tone === "success"
          ? "Operação concluída"
          : flash.tone === "error"
            ? "Operação falhou"
            : "Informação"}
      </AlertTitle>
      <AlertDescription>{flash.message}</AlertDescription>
    </Alert>
  );
}

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <Badge variant="outline">PetAtlas PT</Badge>
          <CardTitle>A preparar catálogo, lojas e serviços</CardTitle>
          <CardDescription>
            A aplicação está a carregar os dados e o inventário simulado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function CenteredStatus({ eyebrow, title, description }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl">
        <CardHeader>
          {eyebrow ? <Badge variant="outline">{eyebrow}</Badge> : null}
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}

function NotFoundPage() {
  return (
    <div className="flex justify-center py-10">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <Badge variant="outline">404</Badge>
          <CardTitle>Página não encontrada</CardTitle>
          <CardDescription>
            A página pedida não existe neste protótipo.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <Link to="/">Voltar ao início</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
