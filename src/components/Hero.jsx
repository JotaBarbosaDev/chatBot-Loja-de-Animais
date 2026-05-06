import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Compass, Fish, MapPin, PawPrint, Store } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import BrandMark from "./BrandMark";

function ChatMarkdown({ content, assistant = false }) {
  return (
    <div className={assistant ? "atlas-chat-markdown" : "atlas-chat-markdown atlas-chat-markdown-user"}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...props }) => (
            <a
              {...props}
              className="font-medium underline underline-offset-4"
              rel="noreferrer"
              target="_blank"
            />
          ),
          table: ({ ...props }) => (
            <div className="overflow-x-auto">
              <table {...props} />
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function Hero({
  activeStore,
  brand,
  chatMessages,
  chatState,
  chatInput,
  onChatAction,
  onChatChange,
  onChatKeyDown,
  onSendChat,
  products,
  services,
  stores,
}) {
  const messageListRef = useRef(null);

  useEffect(() => {
    const node = messageListRef.current;
    if (!node) {
      return;
    }

    node.scrollTo({
      top: node.scrollHeight,
      behavior: "smooth",
    });
  }, [chatMessages, chatState?.status]);

  return (
    <section className="space-y-6">
      <Card className="atlas-panel border-primary/25 bg-gradient-to-br from-primary/14 via-card to-accent/24 shadow-sm">
        <CardHeader className="space-y-5 pb-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-4xl space-y-3">
              <Badge variant="secondary" className="px-3 py-1">
                Atlas Assist
              </Badge>
              <CardTitle className="atlas-title text-4xl leading-tight md:text-5xl">
                O assistente principal da PetAtlas, agora com mais contexto e leitura mais limpa.
              </CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7">
                Pergunta sobre produtos, lojas, serviços, preços por cidade ou temas gerais.
                Quando a resposta vier do catálogo PetAtlas, a informação é tratada antes de
                ser apresentada e a origem fica sempre visível.
              </CardDescription>
            </div>
            <div className="grid min-w-[220px] gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border bg-background/78 p-4">
                <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                  Origem
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  RAG, Ollama ou combinação dos dois.
                </p>
              </div>
              <div className="rounded-2xl border bg-background/78 p-4">
                <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                  Âmbito
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Catálogo, serviços, lojas e perguntas gerais.
                </p>
              </div>
              <div className="rounded-2xl border bg-background/78 p-4">
                <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                  Rede
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {stores.length} lojas ligadas ao mesmo conhecimento base.
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[0.78fr_0.22fr]">
            <div className="space-y-3 rounded-2xl border bg-background/82 p-4 md:p-5">
              <div
                ref={messageListRef}
                className="max-h-[32rem] space-y-3 overflow-y-auto pr-1 scroll-smooth"
              >
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[88%] rounded-3xl bg-primary px-4 py-3 text-sm text-primary-foreground shadow-sm"
                      : "max-w-[96%] rounded-3xl border bg-card px-4 py-4 text-sm text-muted-foreground shadow-sm"
                  }
                >
                  <ChatMarkdown
                    assistant={message.role === "assistant"}
                    content={message.content}
                  />

                  {message.role === "assistant" ? (
                    <div className="mt-3 space-y-2">
                      {message.sourceType ? (
                        <Badge variant="outline">{message.sourceType}</Badge>
                      ) : null}
                      {(message.citations ?? []).length ? (
                        <div className="space-y-2">
                          {(message.citations ?? []).slice(0, 3).map((citation) => (
                            <div
                              key={`${message.id}-${citation.sourceLabel}-${citation.title}`}
                              className="rounded-xl border bg-muted/50 p-3 text-xs leading-5 text-muted-foreground"
                            >
                              <div className="font-medium text-foreground">
                                {citation.title}
                              </div>
                              <div>{citation.sourceLabel}</div>
                              <div className="mt-1">{citation.excerpt}</div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {(message.actions ?? []).length ? (
                        <div className="grid gap-2 pt-1 md:grid-cols-2">
                          {message.actions.map((action, index) => (
                            <div
                              key={`${message.id}-action-${index}-${action.productId ?? action.label}`}
                              className="rounded-2xl border bg-background/80 p-3"
                            >
                              <div className="text-sm font-medium text-foreground">
                                {action.title ?? action.label}
                              </div>
                              {action.subtitle ? (
                                <div className="mt-1 text-xs leading-5 text-muted-foreground">
                                  {action.subtitle}
                                </div>
                              ) : null}
                              {action.priceText || action.storeName ? (
                                <div className="mt-1 text-xs leading-5 text-muted-foreground">
                                  {[action.priceText, action.storeName].filter(Boolean).join(" · ")}
                                </div>
                              ) : null}
                              <Button
                                className="mt-3"
                                onClick={() => onChatAction?.(action)}
                                size="sm"
                                type="button"
                              >
                                {action.label}
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}

              {chatState?.status === "loading" ? (
                <div className="max-w-[96%] rounded-3xl border bg-card px-4 py-4 text-sm text-muted-foreground shadow-sm">
                  A consultar {chatMessages.at(-1)?.role === "user" ? "RAG e/ou Ollama" : "Ollama"}...
                </div>
              ) : null}
              </div>

              <div className="mt-4 space-y-3">
                <Textarea
                  className="min-h-28 bg-background"
                  onChange={onChatChange}
                  onKeyDown={onChatKeyDown}
                  placeholder="Pergunta algo geral ou faz uma pergunta específica sobre a PetAtlas PT."
                  value={chatInput}
                />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={onSendChat} type="button" size="lg">
                    {chatState?.status === "loading" ? "A responder..." : "Enviar"}
                  </Button>
                  <Button asChild type="button" variant="outline" size="lg">
                    <Link to="/catalogo">Ver catálogo completo</Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-3 content-start">
              <div className="rounded-2xl border bg-muted/60 p-4 text-sm text-muted-foreground">
                <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                  <PawPrint className="size-4 text-primary" />
                  Cães e gatos
                </div>
                Exemplo: "cama para cão até 10 kg"
              </div>
              <div className="rounded-2xl border bg-muted/60 p-4 text-sm text-muted-foreground">
                <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                  <Fish className="size-4 text-primary" />
                  Aquariofilia
                </div>
                Exemplo: "sal para aquário marinho em Braga"
              </div>
              <div className="rounded-2xl border bg-muted/60 p-4 text-sm text-muted-foreground">
                <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                  <Store className="size-4 text-primary" />
                  Serviços
                </div>
                Exemplo: "hotel canino no Porto"
              </div>
              <div className="rounded-2xl border bg-background/78 p-4 text-sm text-muted-foreground">
                <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                  Como responde
                </div>
                <p className="mt-2 leading-6">
                  Perguntas sobre a marca PetAtlas usam RAG com contexto do catálogo e das
                  páginas institucionais. Perguntas gerais seguem para o modelo remoto.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="atlas-panel atlas-mesh border-primary/20 bg-gradient-to-br from-card via-card to-secondary/35">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <BrandMark className="size-16" />
              <div className="space-y-2">
                <Badge variant="outline">Pet retail com identidade editorial</Badge>
                <div className="text-xs font-medium uppercase tracking-[0.26em] text-muted-foreground">
                  Porto · Braga · Lisboa
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">4 espécies</Badge>
              <Badge variant="secondary">3 lojas</Badge>
              <Badge variant="secondary">RAG-ready</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <CardTitle className="atlas-title max-w-5xl text-5xl leading-[0.95] md:text-6xl">
              Um atlas vivo para comprar melhor, comparar cidades e cuidar com contexto.
            </CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7">
              {brand.manifesto}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border bg-background/75 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Compass className="size-4 text-primary" />
                Navegação por necessidade
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Raça, porte, fase de vida, tipo de água, serviço e cidade.
              </p>
            </div>
            <div className="rounded-2xl border bg-background/75 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Store className="size-4 text-primary" />
                Contexto local realista
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Preço, stock, click & collect e sortido diferente entre filiais.
              </p>
            </div>
            <div className="rounded-2xl border bg-background/75 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <MapPin className="size-4 text-primary" />
                Dados prontos para chatbot
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Catálogo, serviços e conteúdo institucional preparados para pesquisa semântica.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/catalogo">Explorar catálogo</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/servicos">Ver serviços</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/marca">Conhecer a marca</Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Card className="bg-background/75" size="sm">
              <CardHeader>
                <CardDescription>Produtos</CardDescription>
                <CardTitle>{products.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-background/75" size="sm">
              <CardHeader>
                <CardDescription>Serviços</CardDescription>
                <CardTitle>{services.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-background/75" size="sm">
              <CardHeader>
                <CardDescription>Lojas físicas</CardDescription>
                <CardTitle>{stores.length}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1fr_auto]">
            <Card size="sm" className="bg-background/70">
              <CardHeader>
                <CardDescription>Loja ativa</CardDescription>
                <CardTitle>{activeStore?.name ?? "PetAtlas PT"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{activeStore?.address ?? "Sem loja ativa selecionada."}</p>
                <p>{activeStore?.pickup_sla ?? "Click & collect disponível"}</p>
              </CardContent>
            </Card>

            <Card size="sm" className="bg-background/70">
              <CardHeader>
                <CardDescription>Suporte</CardDescription>
                <CardTitle>{brand.support.phone}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>{brand.support.email}</p>
                <p>{brand.support.hours}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
