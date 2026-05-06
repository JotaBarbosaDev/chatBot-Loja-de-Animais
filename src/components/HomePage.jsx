import React, { useState } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bird, Fish, PawPrint, Sparkles } from "lucide-react";
import { askAtlasAssist } from "@/lib/atlas-assist";
import { countBy, formatCurrency, productEmoji } from "../data";
import Hero from "./Hero";
import ProductCard from "./ProductCard";
import SectionIntro from "./SectionIntro";

const FEATURED_PRODUCT_IDS = [
  "DOG-001",
  "DOG-055",
  "CAT-033",
  "CAT-075",
  "BRD-016",
  "FSH-032",
];

export default function HomePage({
  activeStore,
  brand,
  catalog,
  contentPages,
  onAddToCart,
  products,
  selectedOffer,
  selectedStoreId,
  services,
  setSelectedStoreId,
  stores,
}) {
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      id: "atlas-welcome",
      role: "assistant",
      content:
        "Sou o Atlas Assist. Tento responder a qualquer pergunta: quando houver dados da PetAtlas PT uso RAG, quando não houver respondo com o Ollama, e em muitos casos combino os dois.",
      sourceType: "RAG + Ollama",
      citations: [
        {
          title: "Brand overview",
          sourceLabel: "RAG · brand",
          excerpt:
            "A PetAtlas PT junta catálogo detalhado, lojas locais, serviços e contexto para compra assistida.",
        },
      ],
    },
  ]);
  const [chatState, setChatState] = useState({ status: "idle", error: "" });
  const featuredProducts = FEATURED_PRODUCT_IDS.map((productId) =>
    products.find((product) => product.product_id === productId),
  ).filter(Boolean);
  const speciesCounts = countBy(products, "species");
  const serviceHighlights = services.slice(0, 6);
  const speciesMeta = {
    cão: {
      icon: PawPrint,
      blurb: "Nutrição, passeio, descanso e mobilidade com foco por porte e raça.",
      tint: "from-primary/14 to-secondary/35",
    },
    gato: {
      icon: Sparkles,
      blurb: "Ambiente doméstico, arranhar, hidratação e esterilização sem ruído visual.",
      tint: "from-accent/16 to-secondary/35",
    },
    pássaro: {
      icon: Bird,
      blurb: "Misturas, pellets, gaiolas, poleiros e enriquecimento para aves de companhia.",
      tint: "from-secondary/40 to-primary/10",
    },
    peixe: {
      icon: Fish,
      blurb: "Água doce, salgada e salobra com equipamento e consumíveis específicos.",
      tint: "from-primary/16 to-accent/18",
    },
  };

  async function handleSendChat() {
    const query = chatInput.trim();
    if (!query || chatState.status === "loading") {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
    };

    setChatMessages((current) => [...current, userMessage]);
    setChatInput("");
    setChatState({ status: "loading", error: "" });

    try {
      const result = await askAtlasAssist({
        catalog,
        query,
        selectedStoreId,
        conversation: [...chatMessages, userMessage],
      });

      setChatMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: result.content,
          sourceType: result.sourceType,
          citations: result.citations,
          actions: result.actions ?? [],
        },
      ]);
      setChatState({ status: "idle", error: "" });
    } catch (error) {
      setChatMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content:
            "Não foi possível obter resposta da API Ollama remota. Verifica `OLLAMA_API_BASE_URL`, `OLLAMA_MODEL` e `OLLAMA_API_KEY` no `.env`.",
          sourceType: "Erro",
          citations: [],
        },
      ]);
      setChatState({
        status: "error",
        error: error?.message || "Falha ao contactar o Ollama.",
      });
    }
  }

  function handleChatKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendChat();
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <Hero
        activeStore={activeStore}
        brand={brand}
        chatMessages={chatMessages}
        chatState={chatState}
        chatInput={chatInput}
        onChatChange={(event) => setChatInput(event.target.value)}
        onChatKeyDown={handleChatKeyDown}
        onChatAction={(action) => {
          if (action?.type === "add_to_cart") {
            onAddToCart(action.productId, action.storeId);
          }
        }}
        onSendChat={handleSendChat}
        products={products}
        services={services}
        stores={stores}
      />

      <Card className="atlas-panel border-primary/15 bg-gradient-to-r from-primary/10 via-card to-accent/15">
        <CardContent className="grid gap-4 px-6 py-6 md:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3">
            <div className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
              Assinatura PetAtlas
            </div>
            <h2 className="atlas-title text-3xl leading-tight md:text-4xl">
              Dados de catálogo com olhar de loja física, não só com aspeto de base de dados.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border bg-background/80 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Curadoria
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Cada espécie tem linguagem e filtros próprios.
              </p>
            </div>
            <div className="rounded-2xl border bg-background/80 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Cidades
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Porto, Braga e Lisboa com sortido e preço distintos.
              </p>
            </div>
            <div className="rounded-2xl border bg-background/80 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Conversa
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Estrutura pronta para pesquisa e assistência conversacional.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(speciesCounts).map(([species, total]) => {
          const Icon = speciesMeta[species]?.icon;

          return (
            <Card
              key={species}
              className={`atlas-panel bg-gradient-to-br ${speciesMeta[species]?.tint ?? "from-card to-secondary/35"}`}
              size="sm"
            >
              <CardHeader>
                <CardDescription className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="text-2xl" role="img" aria-label={species}>
                      {productEmoji(species, "base")}
                    </span>
                    {species}
                  </span>
                  {Icon ? <Icon className="size-4 text-primary" /> : null}
                </CardDescription>
                <CardTitle className="text-2xl">{total} produtos</CardTitle>
                <CardDescription className="leading-6">
                  {speciesMeta[species]?.blurb}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gradient-to-br from-card to-muted/50">
        <CardHeader className="gap-3">
          <SectionIntro
            aside={
              <Button asChild variant="outline">
                <Link to="/lojas">Ver detalhe das lojas</Link>
              </Button>
            }
            description="Ativa uma loja para comparar sortido, serviços e disponibilidade local sem sair da homepage."
            eyebrow="Lojas físicas"
            title="Três cidades, três contextos de compra."
          />
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-3">
          {stores.map((store) => (
            <Card key={store.store_id} className="atlas-panel bg-background/75" size="sm">
              <CardHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{store.city}</Badge>
                  {store.store_id === selectedStoreId ? (
                    <Badge variant="secondary">Ativa</Badge>
                  ) : null}
                </div>
                <CardTitle className="atlas-title text-2xl">{store.name}</CardTitle>
                <CardDescription>{store.story}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {store.specialties.map((item) => (
                    <Badge key={item} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
                <Button
                  onClick={() => setSelectedStoreId(store.store_id)}
                  variant={store.store_id === selectedStoreId ? "secondary" : "default"}
                >
                  {store.store_id === selectedStoreId ? "Loja ativa" : "Ativar loja"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardHeader className="gap-3">
          <SectionIntro
            aside={<Button asChild variant="outline"><Link to="/catalogo">Abrir catálogo</Link></Button>}
            description="Os cartões abaixo mostram melhor preço da loja ativa, estado de stock e acesso direto ao checkout simulado."
            eyebrow="Produtos em destaque"
            title="Produtos com leitura imediata e destaque comercial."
          />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.product_id}
              offer={selectedOffer(product.product_id, selectedStoreId)}
              onAddToCart={() => onAddToCart(product.product_id, selectedStoreId)}
              product={product}
            />
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-gradient-to-br from-card to-accent/10">
          <CardHeader className="gap-3">
            <SectionIntro
              description="Cada serviço tem informação operacional suficiente para alimentar pesquisa ou resposta assistida."
              eyebrow="Serviços"
              title="Serviços organizados sem excesso de detalhe na primeira leitura."
            />
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {serviceHighlights.map((service) => (
              <Card key={service.service_id} className="bg-background/75" size="sm">
                <CardHeader>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{service.service_type}</Badge>
                    <Badge variant="secondary">
                      Desde {formatCurrency(service.price_from_eur)}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{service.name}</CardTitle>
                  <CardDescription>{service.includes.slice(0, 3).join(", ")}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-secondary/25">
          <CardHeader className="gap-3">
            <SectionIntro
              description="O que foi acrescentado ao JSON para a marca e para o RAG também é navegável no frontend."
              eyebrow="Conteúdo institucional"
              title="Marca e conteúdo editorial com voz própria."
            />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {contentPages.map((page) => (
              <Card key={page.page_id} className="bg-background/75" size="sm">
                <CardHeader>
                  <CardDescription>{page.slug}</CardDescription>
                  <CardTitle className="atlas-title text-xl">{page.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {page.summary}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
