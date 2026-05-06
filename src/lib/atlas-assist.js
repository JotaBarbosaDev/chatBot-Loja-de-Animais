import { formatCurrency, normalizeText, statusLabel } from "../data";

const MAX_RAG_DOCS = Number(import.meta.env.VITE_CHAT_MAX_RAG_DOCS || 5);
const SUPPORTED_SPECIES = ["cão", "gato", "pássaro", "peixe"];
const STOPWORDS = new Set([
  "a",
  "ao",
  "aos",
  "as",
  "com",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "ha",
  "la",
  "lhe",
  "lo",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "os",
  "ou",
  "para",
  "pelo",
  "pelos",
  "por",
  "qual",
  "que",
  "quero",
  "se",
  "sem",
  "ser",
  "sua",
  "suas",
  "seu",
  "seus",
  "tem",
  "tenho",
  "ter",
  "um",
  "uma",
  "uns",
  "umas",
  "onde",
  "meu",
  "meus",
  "minha",
  "minhas",
  "eles",
  "elas",
  "isto",
  "isso",
  "disponivel",
  "disponiveis",
  "produto",
  "produtos",
]);

function unique(array) {
  return [...new Set(array)];
}

function tokenize(value) {
  return unique(
    normalizeText(value)
      .split(/[^a-z0-9]+/g)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2 && !STOPWORDS.has(token)),
  );
}

function excerpt(text, size = 220) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= size) {
    return clean;
  }
  return `${clean.slice(0, size).trim()}...`;
}

function sentenceCase(value) {
  const clean = String(value || "").trim();
  if (!clean) {
    return "";
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function formatStoreHours(openingHours) {
  if (!openingHours || typeof openingHours !== "object") {
    return "N/A";
  }

  return Object.entries(openingHours)
    .map(([day, hours]) => `${day}: ${hours}`)
    .join(" | ");
}

function buildKnowledgeBase(catalog) {
  if (!catalog) {
    return [];
  }

  const docs = [];
  const storeById = Object.fromEntries(
    (catalog.stores ?? []).map((store) => [store.store_id, store]),
  );

  if (catalog.brand) {
    const brand = catalog.brand;
    docs.push({
      id: "brand-overview",
      kind: "brand",
      title: `${brand.name} · visão geral`,
      content: [
        brand.tagline,
        brand.mission,
        brand.vision,
        brand.manifesto,
        `Suporte: ${brand.support.email}, ${brand.support.phone}, ${brand.support.hours}`,
        `Garantias: ${(brand.guarantees ?? []).join(", ")}`,
      ].join(" "),
      sourceLabel: "RAG · brand",
      sourcePath: "brand",
    });
  }

  for (const page of catalog.content_pages ?? []) {
    docs.push({
      id: page.page_id,
      kind: "content_page",
      title: `Página institucional · ${page.title}`,
      content: [
        page.summary,
        ...(page.sections ?? []).map(
          (section) => `${section.heading}: ${section.body}`,
        ),
      ].join(" "),
      sourceLabel: `RAG · content_pages/${page.slug}`,
      sourcePath: `content_pages/${page.slug}`,
    });
  }

  for (const store of catalog.stores ?? []) {
    docs.push({
      id: store.store_id,
      kind: "store",
      title: `${store.name} · ${store.city}`,
      content: [
        store.story,
        `${store.address}, ${store.postal_code}`,
        `Horário: ${formatStoreHours(store.opening_hours)}`,
        `Gestor: ${store.manager_name}`,
        `Recolha: ${store.pickup_sla}`,
        `Especialidades: ${(store.specialties ?? []).join(", ")}`,
        `Programas: ${(store.community_programs ?? []).join(", ")}`,
      ].join(" "),
      city: store.city,
      storeId: store.store_id,
      sourceLabel: `RAG · stores/${store.store_id}`,
      sourcePath: `stores/${store.store_id}`,
    });
  }

  for (const service of catalog.services ?? []) {
    const serviceStores = (service.stores_available ?? [])
      .map((storeId) => storeById[storeId]?.city || storeId)
      .join(", ");

    docs.push({
      id: service.service_id,
      kind: "service",
      title: `Serviço · ${service.name}`,
      content: [
        `Tipo: ${service.service_type}`,
        `Preço desde: ${service.price_from_eur} EUR`,
        `Duração: ${service.duration_min} min`,
        `Espécies: ${(service.species_supported ?? []).join(", ")}`,
        `Inclui: ${(service.includes ?? []).join(", ")}`,
        `Requisitos: ${(service.requirements ?? []).join(", ")}`,
        `Contraindicações: ${(service.contraindications ?? []).join(", ")}`,
        `Lojas: ${serviceStores}`,
        `Após cuidado: ${service.aftercare_notes}`,
        ...(service.faq ?? []).map((item) => `${item.question} ${item.answer}`),
      ].join(" "),
      sourceLabel: `RAG · services/${service.service_id}`,
      sourcePath: `services/${service.service_id}`,
    });
  }

  for (const doc of catalog.rag_documents ?? []) {
    docs.push({
      id: doc.doc_id,
      kind: doc.doc_type,
      title: doc.title,
      content: doc.content,
      city: doc.city,
      storeId: doc.store_id,
      sourceLabel: `RAG · rag_documents/${doc.doc_id}`,
      sourcePath: `rag_documents/${doc.doc_id}`,
    });
  }

  return docs.map((doc) => ({
    ...doc,
    normalizedTitle: normalizeText(doc.title),
    normalizedContent: normalizeText(doc.content),
    tokens: tokenize(`${doc.title} ${doc.content}`),
  }));
}

function buildCatalogIndex(catalog) {
  const stores = catalog?.stores ?? [];
  const services = catalog?.services ?? [];
  const products = catalog?.products ?? [];
  const inventory = catalog?.inventory ?? [];

  const storeById = Object.fromEntries(stores.map((store) => [store.store_id, store]));
  const serviceById = Object.fromEntries(
    services.map((service) => [service.service_id, service]),
  );
  const inventoryByProductId = inventory.reduce((accumulator, offer) => {
    accumulator[offer.product_id] = accumulator[offer.product_id] || [];
    accumulator[offer.product_id].push(offer);
    return accumulator;
  }, {});

  const enrichedProducts = products.map((product) => ({
    ...product,
    normalizedName: normalizeText(product.name),
    searchBlob: normalizeText(
      [
        product.name,
        product.brand,
        product.species,
        product.sub_species,
        product.breed_target,
        product.category,
        product.subcategory,
        ...(product.tags ?? []),
        ...(product.search_keywords ?? []),
        ...(product.synonyms ?? []),
      ].join(" "),
    ),
    tokens: tokenize(
      [
        product.name,
        product.brand,
        ...(product.tags ?? []),
        ...(product.search_keywords ?? []),
        ...(product.synonyms ?? []),
        product.category,
        product.subcategory,
      ].join(" "),
    ),
  }));

  const enrichedServices = services.map((service) => ({
    ...service,
    normalizedName: normalizeText(service.name),
    searchBlob: normalizeText(
      [
        service.name,
        service.service_type,
        ...(service.includes ?? []),
        ...(service.species_supported ?? []),
      ].join(" "),
    ),
    tokens: tokenize(
      [
        service.name,
        service.service_type,
        ...(service.includes ?? []),
        ...(service.species_supported ?? []),
      ].join(" "),
    ),
  }));

  return {
    stores,
    services: enrichedServices,
    products: enrichedProducts,
    inventory,
    storeById,
    serviceById,
    inventoryByProductId,
  };
}

function buildStoreCitation(store) {
  return {
    title: store.name,
    sourceLabel: `RAG · stores/${store.store_id}`,
    sourcePath: `stores/${store.store_id}`,
    excerpt: `${store.city}. ${store.address}. Horário: ${formatStoreHours(store.opening_hours)}.`,
  };
}

function buildServiceCitation(service) {
  return {
    title: service.name,
    sourceLabel: `RAG · services/${service.service_id}`,
    sourcePath: `services/${service.service_id}`,
    excerpt: `Serviço ${service.service_type}. Preço desde ${formatCurrency(service.price_from_eur)}. Duração aproximada ${service.duration_min} min.`,
  };
}

function buildOfferCitation(product, offer, store) {
  return {
    title: `${product.name} em ${store.city}`,
    sourceLabel: `RAG · inventory/${product.product_id}/${store.store_id}`,
    sourcePath: `inventory/${product.product_id}/${store.store_id}`,
    excerpt: `${product.name} disponível em ${store.name}. Preço atual ${formatCurrency(offer.current_price_eur)}. Stock ${statusLabel(offer.stock_status)} (${offer.stock_qty} unidades).`,
  };
}

function buildCartAction(product, offer, store) {
  return {
    type: "add_to_cart",
    label: "Adicionar ao carrinho",
    productId: product.product_id,
    storeId: offer.store_id,
    title: product.name,
    priceText: formatCurrency(offer.current_price_eur),
    storeName: store.name,
    subtitle: `${store.city} · ${statusLabel(offer.stock_status)} · ${offer.stock_qty} un.`,
  };
}

function extractJsonObject(text) {
  const match = String(text || "").match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function normalizePlannerPayload(payload, query, catalog) {
  const route = ["rag", "ollama", "hybrid"].includes(payload?.route)
    ? payload.route
    : null;
  const intent = [
    "product_recommendation",
    "product_availability",
    "service",
    "store_locations",
    "brand_info",
    "general",
  ].includes(payload?.intent)
    ? payload.intent
    : null;

  if (route && intent) {
    return {
      route,
      intent,
      species: payload?.species || "N/A",
      breed: payload?.breed || "N/A",
      city: payload?.city || "N/A",
      lifeStages: Array.isArray(payload?.lifeStages) ? payload.lifeStages : [],
    };
  }

  return buildHeuristicPlan(query, catalog);
}

async function planAssistantResponse({ query, conversation, catalog }) {
  const plannerMessages = [
    {
      role: "system",
      content: [
        "És o planeador do Atlas Assist da PetAtlas PT.",
        "Analisa a pergunta do utilizador e escolhe como a resposta deve ser construída.",
        "Responde apenas em JSON sem markdown.",
        "Campos obrigatórios: route, intent, species, breed, city, lifeStages.",
        "route deve ser: rag, ollama ou hybrid.",
        "intent deve ser: product_recommendation, product_availability, service, store_locations, brand_info ou general.",
        "Usa hybrid quando a resposta precisa de dados do catálogo PetAtlas e também de redação natural do modelo.",
        "Usa rag quando a resposta pode ser dada só com factos do catálogo sem geração adicional.",
        "Usa ollama quando a pergunta é geral e não depende da PetAtlas.",
      ].join(" "),
    },
    {
      role: "user",
      content: [
        `Pergunta atual: ${query}`,
        `Marca: ${catalog?.brand?.name ?? "PetAtlas PT"}`,
        `Lojas conhecidas: ${(catalog?.stores ?? []).map((store) => store.city).join(", ")}`,
        `Mensagens recentes: ${conversation
          .slice(-4)
          .map((message) => `${message.role}: ${message.content}`)
          .join(" || ")}`,
      ].join("\n"),
    },
  ];

  const raw = await callOllama({ messages: plannerMessages });
  const payload = extractJsonObject(raw);
  return normalizePlannerPayload(payload, query, catalog);
}

function detectCities(query, stores) {
  const normalizedQuery = normalizeText(query);
  return stores.filter((store) => normalizedQuery.includes(normalizeText(store.city)));
}

function isStoreListQuestion(query) {
  const normalizedQuery = normalizeText(query);
  return (
    normalizedQuery.includes("loja") &&
    /(onde|existem|ha|tem|qual)/.test(normalizedQuery)
  );
}

function isAvailabilityQuestion(query) {
  const normalizedQuery = normalizeText(query);
  return [
    "tem",
    "ha",
    "existe",
    "disponivel",
    "stock",
    "em braga",
    "em lisboa",
    "em porto",
    "onde encontro",
    "onde ha",
  ].some((term) => normalizedQuery.includes(term));
}

function isHoursQuestion(query) {
  const normalizedQuery = normalizeText(query);
  return ["horario", "horário", "abre", "fecha", "aberta", "aberto"].some((term) =>
    normalizedQuery.includes(normalizeText(term)),
  );
}

function isContactQuestion(query) {
  const normalizedQuery = normalizeText(query);
  return ["contacto", "contato", "telefone", "email", "mail", "numero", "número"].some((term) =>
    normalizedQuery.includes(normalizeText(term)),
  );
}

function isCatalogProductQuestion(query) {
  const normalizedQuery = normalizeText(query);
  return [
    "produto",
    "produtos",
    "comprar",
    "ração",
    "racao",
    "comida",
    "cama",
    "brinquedo",
    "areia",
    "aquario",
    "aquário",
  ].some((term) => normalizedQuery.includes(normalizeText(term)));
}

function isFoodQuestion(query) {
  const normalizedQuery = normalizeText(query);
  return [
    "racao",
    "ração",
    "comida",
    "alimentacao",
    "alimentação",
    "croquetes",
    "patê",
    "pate",
  ].some((term) => normalizedQuery.includes(normalizeText(term)));
}

function isBedQuestion(query) {
  const normalizedQuery = normalizeText(query);
  return [
    "cama",
    "camas",
    "caminha",
    "caminhas",
    "colchao",
    "colchão",
    "descanso",
    "ortopedica",
    "ortopédica",
  ].some((term) => normalizedQuery.includes(normalizeText(term)));
}

function isServiceQuestion(query) {
  const normalizedQuery = normalizeText(query);
  return [
    "banho",
    "tosquia",
    "escovagem",
    "unhas",
    "antiparasitaria",
    "antiparasitário",
    "pet taxi",
    "dog walking",
    "pet sitting",
    "daycare",
    "hotel",
    "treino",
    "veterin",
    "aquario",
    "aquário",
    "parametros da agua",
    "parâmetros da água",
    "montagem de aquario",
    "manutencao de aquario",
    "servico",
    "serviço",
    "servicos",
    "serviços",
  ].some((term) => normalizedQuery.includes(normalizeText(term)));
}

function extractAgeStages(query) {
  const normalizedQuery = normalizeText(query);
  const stages = new Set();
  const yearMatches = [...normalizedQuery.matchAll(/(\d+)\s*anos?/g)];
  const monthMatches = [...normalizedQuery.matchAll(/(\d+)\s*mes(?:es)?/g)];

  for (const match of yearMatches) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) {
      stages.add(value >= 1 ? "adulto" : "júnior");
    }
  }

  for (const match of monthMatches) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) {
      stages.add(value < 12 ? "júnior" : "adulto");
    }
  }

  if (normalizedQuery.includes("adult")) {
    stages.add("adulto");
  }
  if (normalizedQuery.includes("junior") || normalizedQuery.includes("junior") || normalizedQuery.includes("puppy") || normalizedQuery.includes("cachorro")) {
    stages.add("júnior");
  }

  return [...stages];
}

function detectSpeciesFromQuery(query) {
  const normalizedQuery = normalizeText(query);
  if (
    ["cao", "cão", "caes", "cães", "pastor alemao", "chihuahua", "puppy"].some((term) =>
      normalizedQuery.includes(normalizeText(term)),
    )
  ) {
    return "cão";
  }
  if (["gato", "gatos", "felino"].some((term) => normalizedQuery.includes(normalizeText(term)))) {
    return "gato";
  }
  if (["passaro", "pássaro", "ave", "aves"].some((term) => normalizedQuery.includes(normalizeText(term)))) {
    return "pássaro";
  }
  if (["peixe", "peixes", "aquario", "aquário"].some((term) => normalizedQuery.includes(normalizeText(term)))) {
    return "peixe";
  }
  return null;
}

function detectUnsupportedSpeciesFromQuery(query) {
  const normalizedQuery = normalizeText(query);
  const unsupported = [
    "coelho",
    "coelhos",
    "roedor",
    "hamster",
    "hamsters",
    "porquinho da india",
    "cobaia",
    "furão",
    "furao",
    "tartaruga",
    "tartarugas",
    "iguana",
    "serpente",
  ];

  return unsupported.find((term) => normalizedQuery.includes(normalizeText(term))) || null;
}

function detectBreedFromQuery(query, index) {
  const normalizedQuery = normalizeText(query);
  const breedTargets = unique(
    index.products
      .map((product) => product.breed_target)
      .filter((breed) => breed && breed !== "N/A"),
  );

  const matches = breedTargets.filter((breed) =>
    normalizedQuery.includes(normalizeText(breed)),
  );

  return matches[0] || null;
}

function inferBreedSize(breed) {
  const normalizedBreed = normalizeText(breed || "");
  if (!normalizedBreed) {
    return null;
  }
  if (["pastor alemao", "golden retriever", "labrador", "rottweiler"].some((term) => normalizedBreed.includes(term))) {
    return "grande";
  }
  if (["chihuahua", "yorkshire", "pomerania"].some((term) => normalizedBreed.includes(term))) {
    return "pequeno";
  }
  return null;
}

function findBestProductMatch(query, index) {
  const normalizedQuery = normalizeText(query);
  const queryTokens = tokenize(query);
  let best = null;

  for (const product of index.products) {
    let score = 0;

    if (normalizedQuery.includes(product.normalizedName)) {
      score += 20;
    }

    for (const token of queryTokens) {
      if (product.tokens.includes(token)) {
        score += 2;
      }
      if (product.normalizedName.includes(token)) {
        score += 3;
      }
    }

    if (score >= 6 && (!best || score > best.score)) {
      best = { product, score };
    }
  }

  return best?.product || null;
}

function findBestServiceMatch(query, index) {
  const normalizedQuery = normalizeText(query);
  const queryTokens = tokenize(query);
  let best = null;

  for (const service of index.services) {
    let score = 0;

    if (normalizedQuery.includes(service.normalizedName)) {
      score += 20;
    }

    for (const token of queryTokens) {
      if (service.tokens.includes(token)) {
        score += 2;
      }
      if (service.normalizedName.includes(token)) {
        score += 3;
      }
    }

    if (score >= 4 && (!best || score > best.score)) {
      best = { service, score };
    }
  }

  return best?.service || null;
}

function buildUnsupportedSpeciesAnswer(query, unsupportedSpecies) {
  const primaryLine = isFoodQuestion(query)
    ? `Neste momento não temos comida para ${unsupportedSpecies} no catálogo da PetAtlas PT.`
    : `Neste momento não temos produtos para ${unsupportedSpecies} no catálogo da PetAtlas PT.`;

  return {
    content: [
      primaryLine,
      "",
      `O catálogo atual cobre apenas ${SUPPORTED_SPECIES.join(", ")}.`,
      isFoodQuestion(query)
        ? "Se quiseres, posso ajudar-te com comida para cão, gato, pássaro ou peixe, ou responder de forma geral sobre alimentação dessa espécie."
        : "Se quiseres, posso ajudar-te com produtos para cão, gato, pássaro ou peixe.",
    ].join("\n"),
    sourceType: "RAG",
    citations: [
      {
        title: "Espécies suportadas no catálogo",
        sourceLabel: "RAG · taxonomy/species",
        sourcePath: "taxonomy/species",
        excerpt: `Espécies presentes no catálogo: ${SUPPORTED_SPECIES.join(", ")}.`,
      },
    ],
    actions: [],
  };
}

function rankProductOffer(product, offer, selectedStoreId) {
  let score = 0;

  if (offer.stock_qty > 0) {
    score += 10;
  }
  if (selectedStoreId && offer.store_id === selectedStoreId) {
    score += 5;
  }
  score += Math.min(offer.stock_qty, 20) / 10;
  score += Math.max(0, 100 - offer.current_price_eur) / 100;
  return score;
}

function findFoodMatches({ query, index, selectedStoreId }) {
  const species = detectSpeciesFromQuery(query);
  const unsupportedSpecies = detectUnsupportedSpeciesFromQuery(query);
  const breed = detectBreedFromQuery(query, index);
  const lifeStages = extractAgeStages(query);

  if (unsupportedSpecies && !species && !breed) {
    return {
      species: null,
      unsupportedSpecies,
      breed,
      lifeStages,
      matches: [],
    };
  }

  let candidates = index.products.filter(
    (product) =>
      product.category === "alimentação" &&
      (!species || product.species === species),
  );

  if (breed) {
    candidates = candidates.filter((product) => product.breed_target === breed);
  }

  if (lifeStages.length) {
    candidates = candidates.filter((product) => lifeStages.includes(product.life_stage));
  }

  candidates = candidates
    .map((product) => {
      const offers = (index.inventoryByProductId[product.product_id] ?? []).map((offer) => ({
        ...offer,
        score: rankProductOffer(product, offer, selectedStoreId),
      }));
      const bestOffer = offers.sort((left, right) => right.score - left.score)[0];
      return { product, bestOffer };
    })
    .filter((item) => item.bestOffer && item.bestOffer.stock_qty > 0)
    .sort((left, right) => right.bestOffer.score - left.bestOffer.score);

  return {
    species,
    unsupportedSpecies: null,
    breed,
    lifeStages,
    matches: candidates,
  };
}

function findBedMatches({ query, index, selectedStoreId }) {
  const species = detectSpeciesFromQuery(query);
  const breed = detectBreedFromQuery(query, index);
  const lifeStages = extractAgeStages(query);
  const inferredBreedSize = inferBreedSize(breed);

  let candidates = index.products.filter(
    (product) =>
      product.species === (species || "cão") &&
      (product.category === "descanso" ||
        String(product.product_type).includes("cama") ||
        String(product.subcategory).includes("cama")),
  );

  const requestedStages = lifeStages.length ? lifeStages : ["adulto"];
  const items = [];

  for (const stage of requestedStages) {
    let stageCandidates = [...candidates];

    if (stage === "júnior") {
      stageCandidates = stageCandidates.filter(
        (product) =>
          product.min_age_months <= 2 &&
          ["pequeno", "médio", "medio"].includes(normalizeText(product.size_target)),
      );
    } else if (inferredBreedSize === "grande") {
      stageCandidates = stageCandidates.filter((product) => {
        const size = normalizeText(product.size_target);
        return ["grande", "xl", "extra grande"].includes(size) || Number(product.max_pet_weight_kg) >= 30;
      });
    } else if (inferredBreedSize === "pequeno") {
      stageCandidates = stageCandidates.filter((product) => {
        const size = normalizeText(product.size_target);
        return ["pequeno", "s"].includes(size) || Number(product.max_pet_weight_kg) <= 10;
      });
    }

    const ranked = stageCandidates
      .map((product) => {
        const bestOffer = selectBestOfferForProduct({
          product,
          index,
          preferredStoreId: selectedStoreId,
        });
        return { product, bestOffer };
      })
      .filter((item) => item.bestOffer && item.bestOffer.stock_qty > 0)
      .sort((left, right) => right.bestOffer.score - left.bestOffer.score);

    if (ranked[0]) {
      items.push({ stage, ...ranked[0] });
    }
  }

  return {
    species,
    breed,
    lifeStages,
    matches: items,
  };
}

function selectBestOfferForProduct({
  product,
  index,
  preferredStoreId,
  forceStoreId = "",
}) {
  let offers = (index.inventoryByProductId[product.product_id] ?? []).map((offer) => ({
    ...offer,
    score: rankProductOffer(product, offer, preferredStoreId),
  }));

  if (forceStoreId) {
    offers = offers.filter((offer) => offer.store_id === forceStoreId);
  }

  return offers.sort((left, right) => right.score - left.score)[0] || null;
}

function findProductByTitle(title, index) {
  const normalizedTitle = normalizeText(title);
  return (
    index.products.find((product) => normalizedTitle.includes(product.normalizedName)) ||
    null
  );
}

function getLastReferencedProduct(conversation, index) {
  for (let i = conversation.length - 1; i >= 0; i -= 1) {
    const message = conversation[i];
    const citations = Array.isArray(message?.citations) ? message.citations : [];

    for (const citation of citations) {
      const product = findProductByTitle(citation.title, index);
      if (product) {
        return product;
      }
    }
  }

  return null;
}

function answerStoreLocations(catalog) {
  const stores = catalog?.stores ?? [];

  const lines = stores.map(
    (store) => `- ${store.city} — ${store.name}, ${store.address}`,
  );

  const content = [
    `A PetAtlas PT tem ${stores.length} lojas físicas em Portugal.`,
    "",
    ...lines,
    "",
    "Todas permitem Click & Collect e apoio em loja. Se quiseres, também te posso indicar horários, contactos ou serviços disponíveis em cada cidade.",
  ].join("\n");

  return {
    content,
    sourceType: "RAG",
    citations: stores.map(buildStoreCitation),
  };
}

function answerStoreHours({ stores, cityStore }) {
  if (cityStore) {
    return {
      content: [
        `O horário da loja ${cityStore.name} é o seguinte:`,
        "",
        ...Object.entries(cityStore.opening_hours).map(
          ([day, hours]) => `- ${day}: ${hours}`,
        ),
      ].join("\n"),
      sourceType: "RAG",
      citations: [buildStoreCitation(cityStore)],
      actions: [],
    };
  }

  return {
    content: [
      "Posso indicar-te o horário de qualquer loja PetAtlas PT. Neste momento temos:",
      "",
      ...stores.map((store) => `- ${store.city} — ${formatStoreHours(store.opening_hours)}`),
    ].join("\n"),
    sourceType: "RAG",
    citations: stores.map(buildStoreCitation).slice(0, 3),
    actions: [],
  };
}

function answerStoreContacts({ stores, cityStore }) {
  if (cityStore) {
    return {
      content: [
        `Os contactos da loja ${cityStore.name} são:`,
        "",
        `- Telefone: ${cityStore.contact.phone}`,
        `- Email: ${cityStore.contact.email}`,
      ].join("\n"),
      sourceType: "RAG",
      citations: [buildStoreCitation(cityStore)],
      actions: [],
    };
  }

  return {
    content: [
      "Estas são as lojas PetAtlas PT e os respetivos contactos:",
      "",
      ...stores.map(
        (store) =>
          `- ${store.city} — ${store.contact.phone} · ${store.contact.email}`,
      ),
    ].join("\n"),
    sourceType: "RAG",
    citations: stores.map(buildStoreCitation).slice(0, 3),
    actions: [],
  };
}

function answerServiceQuestion({ service, cityStore, index }) {
  const availableStores = service.stores_available
    .map((storeId) => index.storeById[storeId])
    .filter(Boolean);

  const serviceCitation = buildServiceCitation(service);

  if (cityStore) {
    const matchingStore = availableStores.find(
      (store) => store.store_id === cityStore.store_id,
    );

    if (matchingStore) {
      return {
        content: [
          `Sim, o serviço "${service.name}" está disponível em ${matchingStore.city}, na loja ${matchingStore.name}.`,
          "",
          `O preço começa em ${formatCurrency(service.price_from_eur)} e a duração estimada é de ${service.duration_min} minutos.`,
          `Se precisares, também te posso indicar o que está incluído, os requisitos e os cuidados após o serviço.`,
        ].join("\n"),
        sourceType: "RAG",
        citations: [serviceCitation, buildStoreCitation(matchingStore)],
      };
    }

    return {
      content: [
        `Não, o serviço "${service.name}" não está disponível neste momento em ${cityStore.city}.`,
        "",
        `Atualmente podes encontrá-lo em ${availableStores.map((store) => store.city).join(", ")}.`,
        "Se quiseres, posso sugerir um serviço alternativo disponível nessa loja.",
      ].join("\n"),
      sourceType: "RAG",
      citations: [serviceCitation, ...availableStores.slice(0, 3).map(buildStoreCitation)],
    };
  }

  return {
    content: [
      `O serviço "${service.name}" está disponível em ${availableStores.map((store) => store.city).join(", ")}.`,
      "",
      `O preço começa em ${formatCurrency(service.price_from_eur)} e a duração estimada é de ${service.duration_min} minutos.`,
      "Se quiseres, posso detalhar requisitos, espécies abrangidas e a loja mais conveniente para ti.",
    ].join("\n"),
    sourceType: "RAG",
    citations: [serviceCitation, ...availableStores.slice(0, 3).map(buildStoreCitation)],
  };
}

function answerProductAvailability({ product, cityStore, index }) {
  const offers = (index.inventoryByProductId[product.product_id] ?? [])
    .map((offer) => ({
      ...offer,
      store: index.storeById[offer.store_id],
    }))
    .filter((offer) => offer.store);

  const availableOffers = offers.filter((offer) => offer.stock_qty > 0);

  if (cityStore) {
    const offer = offers.find((item) => item.store_id === cityStore.store_id);

    if (offer && offer.stock_qty > 0) {
      return {
        content: [
          `Sim, o produto "${product.name}" está disponível em ${cityStore.city}, na loja ${cityStore.name}.`,
          "",
          `Neste momento o preço é ${formatCurrency(offer.current_price_eur)} e existem ${offer.stock_qty} unidades em ${statusLabel(offer.stock_status).toLowerCase()}.`,
          `A recolha em loja está ${offer.available_for_pickup ? "disponível" : "indisponível"} e a entrega estimada é ${offer.delivery_eta}.`,
          offer.promo_label !== "N/A"
            ? `Há ainda uma campanha ativa: ${offer.promo_label}.`
            : "",
        ]
          .filter(Boolean)
          .join("\n"),
        sourceType: "RAG",
        citations: [buildOfferCitation(product, offer, cityStore)],
      };
    }

    const otherCities = availableOffers
      .filter((item) => item.store_id !== cityStore.store_id)
      .map((item) => item.store.city);

    return {
      content: [
        `Não encontrei disponibilidade do produto "${product.name}" em ${cityStore.city}.`,
        "",
        otherCities.length
          ? `De momento este artigo aparece disponível em ${unique(otherCities).join(", ")}.`
          : "De momento este artigo não aparece disponível noutras lojas da rede.",
        "Se quiseres, posso mostrar-te alternativas semelhantes na mesma categoria.",
      ].join("\n"),
      sourceType: "RAG",
      citations: availableOffers.slice(0, 3).map((offer) =>
        buildOfferCitation(product, offer, offer.store),
      ),
    };
  }

  const citySummary = availableOffers.map(
    (offer) =>
      `${offer.store.city} (${formatCurrency(offer.current_price_eur)}, ${offer.stock_qty} un.)`,
  );

  return {
    content: [
      `O produto "${product.name}" está atualmente disponível em ${availableOffers.length} loja(s) da rede PetAtlas PT.`,
      "",
      citySummary.length ? `Encontras este artigo em ${citySummary.join("; ")}.` : "",
      "Se quiseres, posso confirmar a melhor opção por cidade ou comparar preços entre lojas.",
    ]
      .filter(Boolean)
      .join("\n"),
    sourceType: "RAG",
    citations: availableOffers.slice(0, 3).map((offer) =>
      buildOfferCitation(product, offer, offer.store),
    ),
  };
}

function answerFoodRecommendation({ query, index, selectedStoreId }) {
  const { breed, lifeStages, matches } = findFoodMatches({
    query,
    index,
    selectedStoreId,
  });

  if (!matches.length) {
    return null;
  }

  const relevantMatches = matches.slice(0, Math.max(lifeStages.length, 1) * 2 || 2);
  const groupedByStage = lifeStages.length
    ? lifeStages.map((stage) => ({
        stage,
        items: relevantMatches.filter((item) => item.product.life_stage === stage).slice(0, 2),
      }))
    : [{ stage: null, items: relevantMatches.slice(0, 3) }];

  const stageLabels = {
    adulto: "adulto",
    "júnior": "júnior",
  };

  const lines = [];
  for (const group of groupedByStage) {
    if (!group.items.length) {
      continue;
    }

    if (group.stage) {
      lines.push(`Para ${breed ? `${breed.toLowerCase()} ` : ""}${stageLabels[group.stage] ?? group.stage}:`);
    } else {
      lines.push("Produtos recomendados:");
    }

    for (const item of group.items) {
      lines.push(
        `- ${item.product.name} — ${formatCurrency(item.bestOffer.current_price_eur)} em ${index.storeById[item.bestOffer.store_id]?.city}; stock ${item.bestOffer.stock_qty} un.`,
      );
    }

    lines.push("");
  }

  const introParts = [];
  if (breed) {
    introParts.push(`para ${breed}`);
  }
  if (lifeStages.length === 2) {
    introParts.push("em fase júnior e adulta");
  } else if (lifeStages.length === 1) {
    introParts.push(`na fase ${lifeStages[0]}`);
  }

  const content = [
    `Encontrei opções de alimentação ${introParts.join(" ")} no catálogo PetAtlas PT.`,
    "",
    ...lines,
    "Se quiseres, no passo seguinte posso filtrar por cidade, comparar preços por loja ou indicar a dose diária recomendada de cada uma.",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    content,
    sourceType: "RAG",
    citations: relevantMatches.slice(0, 4).map((item) =>
      buildOfferCitation(
        item.product,
        item.bestOffer,
        index.storeById[item.bestOffer.store_id],
      ),
    ),
  };
}

function answerDeterministicQuery({ catalog, query, conversation, selectedStoreId }) {
  const index = buildCatalogIndex(catalog);
  const cityStore = detectCities(query, index.stores)[0] || null;
  const unsupportedSpecies = detectUnsupportedSpeciesFromQuery(query);
  const supportedSpecies = detectSpeciesFromQuery(query);
  const product =
    findBestProductMatch(query, index) ||
    (isAvailabilityQuestion(query) ? getLastReferencedProduct(conversation, index) : null);
  const service = isServiceQuestion(query) ? findBestServiceMatch(query, index) : null;

  if (unsupportedSpecies && !supportedSpecies && isCatalogProductQuestion(query)) {
    return buildUnsupportedSpeciesAnswer(query, unsupportedSpecies);
  }

  if (isStoreListQuestion(query)) {
    return answerStoreLocations(catalog);
  }

  if (isHoursQuestion(query)) {
    return answerStoreHours({ stores: index.stores, cityStore });
  }

  if (isContactQuestion(query)) {
    return answerStoreContacts({ stores: index.stores, cityStore });
  }

  if (isFoodQuestion(query)) {
    const recommendation = answerFoodRecommendation({
      query,
      index,
      selectedStoreId,
    });
    if (recommendation) {
      return recommendation;
    }
  }

  if (service) {
    return answerServiceQuestion({ service, cityStore, index });
  }

  if (product && (cityStore || isAvailabilityQuestion(query))) {
    return answerProductAvailability({ product, cityStore, index });
  }

  return null;
}

function isBrandScopedQuestion(query, catalog) {
  const q = normalizeText(query);
  const brandTerms = [
    "petatlas",
    normalizeText(catalog?.brand?.name || ""),
    ...(catalog?.stores ?? []).flatMap((store) => [
      normalizeText(store.city),
      normalizeText(store.name),
    ]),
  ].filter(Boolean);

  const commerceTerms = [
    "loja",
    "lojas",
    "produto",
    "produtos",
    "servico",
    "servicos",
    "marca",
    "petatlas",
    "checkout",
    "preco",
    "stock",
    "entrega",
    "recolha",
    "click",
    "catalogo",
    "rag",
    "disponivel",
    "hotel",
    "banho",
    "tosquia",
    "arranhador",
    "racao",
    "aquario",
    "lisboa",
    "porto",
    "braga",
    "chihuahua",
    "pastor alemao",
  ];

  const brandHits = brandTerms.filter((term) => q.includes(term)).length;
  const commerceHits = commerceTerms.filter((term) => q.includes(term)).length;

  return brandHits > 0 || commerceHits >= 2;
}

function retrieveRelevantDocs({ catalog, query, selectedStoreId }) {
  const docs = buildKnowledgeBase(catalog);
  const queryTokens = tokenize(query);
  const normalizedQuery = normalizeText(query);
  const activeStore = (catalog?.stores ?? []).find(
    (store) => store.store_id === selectedStoreId,
  );
  const activeCity = normalizeText(activeStore?.city || "");

  const scored = docs
    .map((doc) => {
      let score = 0;

      for (const token of queryTokens) {
        if (doc.tokens.includes(token)) {
          score += 2;
        }
        if (doc.normalizedTitle.includes(token)) {
          score += 3;
        }
      }

      if (normalizedQuery.includes("petatlas") && doc.kind === "brand") {
        score += 5;
      }

      if (activeCity && doc.city && normalizeText(doc.city).includes(activeCity)) {
        score += 1;
      }

      if (
        selectedStoreId &&
        doc.storeId &&
        (doc.storeId === selectedStoreId || doc.storeId === "N/A")
      ) {
        score += 1;
      }

      return { ...doc, score };
    })
    .filter((doc) => doc.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_RAG_DOCS);

  return scored.map((doc) => ({
    id: doc.id,
    title: doc.title,
    content: doc.content,
    excerpt: excerpt(doc.content),
    sourceLabel: doc.sourceLabel,
    sourcePath: doc.sourcePath,
    kind: doc.kind,
    score: doc.score,
  }));
}

async function callOllama({ messages }) {
  const response = await fetch("/api/ollama-chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
    }),
  });

  if (!response.ok) {
    let message = "Falha ao contactar a API de chat.";
    try {
      const payload = await response.json();
      message = payload?.error || message;
    } catch {
      // ignore json parse errors
    }
    throw new Error(message);
  }

  const payload = await response.json();
  return payload?.content?.trim() || "";
}

function buildRagFallback(query, citations) {
  if (!citations.length) {
    return `Não encontrei contexto suficiente da PetAtlas PT para responder a "${query}" com base no catálogo local.`;
  }

  const mainCitation = citations[0];
  const supporting = citations
    .slice(1, 3)
    .map((item) => `Também encontrei contexto complementar em ${item.title}.`);

  return [
    `Encontrei informação relevante na base da PetAtlas PT para responder à tua pergunta sobre "${query}".`,
    "",
    sentenceCase(mainCitation.excerpt),
    "",
    ...supporting,
    "",
    "Se quiseres, posso afinar a resposta por loja, cidade, espécie, porte, raça ou serviço.",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildHeuristicPlan(query, catalog) {
  if (isFoodQuestion(query) || isBedQuestion(query)) {
    return {
      route: "hybrid",
      intent: "product_recommendation",
      species: detectSpeciesFromQuery(query) || "N/A",
      breed: "N/A",
      city: detectCities(query, catalog?.stores ?? [])[0]?.city || "N/A",
      lifeStages: extractAgeStages(query),
    };
  }

  if (isStoreListQuestion(query)) {
    return {
      route: "rag",
      intent: "store_locations",
      species: "N/A",
      breed: "N/A",
      city: "N/A",
      lifeStages: [],
    };
  }

  if (isServiceQuestion(query)) {
    return {
      route: "rag",
      intent: "service",
      species: detectSpeciesFromQuery(query) || "N/A",
      breed: "N/A",
      city: detectCities(query, catalog?.stores ?? [])[0]?.city || "N/A",
      lifeStages: [],
    };
  }

  if (isAvailabilityQuestion(query)) {
    return {
      route: "rag",
      intent: "product_availability",
      species: detectSpeciesFromQuery(query) || "N/A",
      breed: "N/A",
      city: detectCities(query, catalog?.stores ?? [])[0]?.city || "N/A",
      lifeStages: extractAgeStages(query),
    };
  }

  if (isBrandScopedQuestion(query, catalog)) {
    return {
      route: "hybrid",
      intent: "brand_info",
      species: detectSpeciesFromQuery(query) || "N/A",
      breed: "N/A",
      city: detectCities(query, catalog?.stores ?? [])[0]?.city || "N/A",
      lifeStages: [],
    };
  }

  return {
    route: "ollama",
    intent: "general",
    species: "N/A",
    breed: "N/A",
    city: "N/A",
    lifeStages: [],
  };
}

async function composeCatalogAnswer({ query, contextBlocks, styleHint }) {
  return callOllama({
    messages: [
      {
        role: "system",
        content: [
          "És o Atlas Assist da PetAtlas PT.",
          "Responde em português de Portugal, com tom de loja online claro e útil.",
          "Usa apenas a informação do contexto fornecido.",
          "Não inventes preços, stock, lojas, horários, serviços ou produtos.",
          "Organiza a resposta de forma legível e comercial, mas sem exagero.",
          "Se existirem várias opções, apresenta-as resumidamente e ajuda o cliente a decidir.",
          styleHint || "",
        ]
          .filter(Boolean)
          .join(" "),
      },
      {
        role: "user",
        content: [
          `Pergunta: ${query}`,
          "",
          "Contexto disponível:",
          ...contextBlocks,
        ].join("\n"),
      },
    ],
  });
}

async function answerWithOllamaOnly({ query, conversation, systemHint = "" }) {
  const generalMessages = [
    {
      role: "system",
      content: [
        "Responde em português de Portugal, de forma clara, natural e bem escrita.",
        "Se a pergunta envolver a PetAtlas PT mas não houver dados suficientes do catálogo, diz isso com transparência e responde ao resto do que souberes de forma útil.",
        systemHint,
      ]
        .filter(Boolean)
        .join(" "),
    },
    ...conversation.slice(-6).map((item) => ({
      role: item.role,
      content: item.content,
    })),
    {
      role: "user",
      content: query,
    },
  ];

  const content = await callOllama({ messages: generalMessages });
  return {
    content,
    sourceType: "Ollama",
    citations: [],
    actions: [],
  };
}

async function answerProductRecommendationWithPlanner({
  catalog,
  query,
  selectedStoreId,
  planner,
}) {
  const index = buildCatalogIndex(catalog);
  const cityStore =
    index.stores.find((store) => store.city === planner.city) ||
    detectCities(query, index.stores)[0] ||
    null;
  const unsupportedSpecies = detectUnsupportedSpeciesFromQuery(query);
  const preferredStoreId = cityStore?.store_id || selectedStoreId;
  const { breed, lifeStages, matches, species } = findFoodMatches({
    query,
    index,
    selectedStoreId: preferredStoreId,
  });

  const bedRequest = isBedQuestion(query);
  const bedMatches = bedRequest
    ? findBedMatches({
        query,
        index,
        selectedStoreId: preferredStoreId,
      }).matches
    : [];

  if (!matches.length && !bedMatches.length && unsupportedSpecies) {
    return buildUnsupportedSpeciesAnswer(query, unsupportedSpecies);
  }

  if (!matches.length && !bedMatches.length) {
    return null;
  }

  const relevantMatches = matches
    .map((item) => {
      const bestOffer = selectBestOfferForProduct({
        product: item.product,
        index,
        preferredStoreId,
        forceStoreId: cityStore?.store_id || "",
      });
      return bestOffer ? { product: item.product, bestOffer } : null;
    })
    .filter(Boolean)
    .slice(0, lifeStages.length >= 2 ? 4 : 3);

  if (!relevantMatches.length && !bedMatches.length) {
    return null;
  }

  const foodCitations = relevantMatches.map((item) =>
    buildOfferCitation(
      item.product,
      item.bestOffer,
      index.storeById[item.bestOffer.store_id],
    ),
  );
  const bedCitations = bedMatches.map((item) =>
    buildOfferCitation(
      item.product,
      item.bestOffer,
      index.storeById[item.bestOffer.store_id],
    ),
  );
  const citations = [...foodCitations, ...bedCitations];
  if (unsupportedSpecies) {
    citations.push({
      title: "Espécies suportadas no catálogo",
      sourceLabel: "RAG · taxonomy/species",
      sourcePath: "taxonomy/species",
      excerpt: `Espécies presentes no catálogo: ${SUPPORTED_SPECIES.join(", ")}.`,
    });
  }
  const actions = [...relevantMatches, ...bedMatches].map((item) =>
    buildCartAction(
      item.product,
      item.bestOffer,
      index.storeById[item.bestOffer.store_id],
    ),
  );

  const foodBlocks = relevantMatches.map((item) => {
    const store = index.storeById[item.bestOffer.store_id];
    return [
      `Produto: ${item.product.name}`,
      `Raça alvo: ${item.product.breed_target}`,
      `Fase de vida: ${item.product.life_stage}`,
      `Descrição curta: ${item.product.description_short}`,
      `Foco nutricional: ${item.product.medical_focus}`,
      `Dose recomendada: ${JSON.stringify(item.product.daily_dosage_table)}`,
      `Loja: ${store.name} em ${store.city}`,
      `Preço atual: ${formatCurrency(item.bestOffer.current_price_eur)}`,
      `Stock: ${item.bestOffer.stock_qty} unidades`,
    ].join(" | ");
  });
  const bedBlocks = bedMatches.map((item) => {
    const store = index.storeById[item.bestOffer.store_id];
    return [
      `Cama: ${item.product.name}`,
      `Fase sugerida: ${item.stage}`,
      `Porte: ${item.product.size_target}`,
      `Peso máximo recomendado: ${item.product.max_pet_weight_kg} kg`,
      `Descrição: ${item.product.description_short}`,
      `Loja: ${store.name} em ${store.city}`,
      `Preço atual: ${formatCurrency(item.bestOffer.current_price_eur)}`,
      `Stock: ${item.bestOffer.stock_qty} unidades`,
    ].join(" | ");
  });
  const unsupportedBlock = unsupportedSpecies
    ? `Pedido adicional sem cobertura no catálogo: não existem produtos PetAtlas PT para ${unsupportedSpecies}.`
    : null;

  try {
    const content = await composeCatalogAnswer({
      query,
      contextBlocks: [
        ...(unsupportedBlock ? ["Secção sem cobertura:", unsupportedBlock] : []),
        ...(foodBlocks.length ? ["Secção alimentação:", ...foodBlocks] : []),
        ...(bedBlocks.length ? ["Secção camas:", ...bedBlocks] : []),
      ],
      styleHint:
        "Não uses tabelas markdown. Não uses separadores visuais como --- nem blocos pesados. Usa apenas parágrafos curtos e listas simples. Se houver pedidos mistos, responde por secções curtas e distintas. Quando existir uma espécie sem cobertura no catálogo, diz isso explicitamente sem ignorar os restantes pedidos. Termina com uma frase curta a indicar que os produtos disponíveis podem ser adicionados ao carrinho pelos botões abaixo.",
    });

    return {
      content,
      sourceType: "RAG + Ollama",
      citations,
      actions,
      };
    } catch {
    const foodLines = relevantMatches.map((item) => {
      const store = index.storeById[item.bestOffer.store_id];
      return `- ${item.product.name} — ${formatCurrency(item.bestOffer.current_price_eur)} em ${store.city}, com ${item.bestOffer.stock_qty} unidades em stock.`;
    });
    const bedLines = bedMatches.map((item) => {
      const store = index.storeById[item.bestOffer.store_id];
      return `- ${item.product.name} — ${formatCurrency(item.bestOffer.current_price_eur)} em ${store.city}, indicada para ${item.stage === "júnior" ? "o mais novo" : "o adulto"}.`;
    });

    return {
      content: [
        unsupportedSpecies
          ? `Neste momento não temos comida para ${unsupportedSpecies} no catálogo da PetAtlas PT.`
          : "",
        unsupportedSpecies ? "" : "",
        foodLines.length
          ? `Encontrei opções de ração adequadas ${breed !== "N/A" ? `para ${breed}` : species ? `para ${species}` : ""}${lifeStages.length ? " para as fases indicadas" : ""}.`
          : "",
        foodLines.length ? "" : "",
        ...foodLines,
        bedLines.length ? "" : "",
        bedLines.length ? "Também encontrei camas adequadas:" : "",
        ...bedLines,
        "",
        "Podes usar os botões abaixo para adicionar diretamente ao carrinho.",
      ]
        .filter(Boolean)
        .join("\n"),
      sourceType: "RAG",
      citations,
      actions,
    };
  }
}

export async function askAtlasAssist({
  catalog,
  query,
  selectedStoreId,
  conversation = [],
}) {
  const deterministicAnswer = answerDeterministicQuery({
    catalog,
    query,
    conversation,
    selectedStoreId,
  });

  if (
    deterministicAnswer &&
    (isStoreListQuestion(query) ||
      isHoursQuestion(query) ||
      isContactQuestion(query) ||
      (detectUnsupportedSpeciesFromQuery(query) && isCatalogProductQuestion(query)))
  ) {
    return deterministicAnswer;
  }

  let planner = null;
  try {
    planner = await planAssistantResponse({ query, conversation, catalog });
  } catch {
    planner = buildHeuristicPlan(query, catalog);
  }

  if (isFoodQuestion(query) || isBedQuestion(query)) {
    planner = {
      ...planner,
      route: "hybrid",
      intent: "product_recommendation",
    };
  }

  if (planner.intent === "product_recommendation") {
    const recommendation = await answerProductRecommendationWithPlanner({
      catalog,
      query,
      selectedStoreId,
      planner,
    });

    if (recommendation) {
      return recommendation;
    }

    return answerWithOllamaOnly({
      query,
      conversation,
      systemHint:
        "O utilizador está a pedir recomendação de produtos. Mesmo sem dados exatos da PetAtlas, responde de forma útil e prática.",
    });
  }

  if (planner.intent === "store_locations") {
    return answerStoreLocations(catalog);
  }

  if (planner.intent === "service" || planner.intent === "product_availability") {
    if (deterministicAnswer) {
      if (
        planner.intent === "product_availability" &&
        deterministicAnswer.citations?.[0]?.sourcePath?.startsWith("inventory/")
      ) {
        const index = buildCatalogIndex(catalog);
        const product = findBestProductMatch(query, index) || getLastReferencedProduct(conversation, index);
        const cityStore =
          index.stores.find((store) => store.city === planner.city) ||
          detectCities(query, index.stores)[0] ||
          null;
        if (product) {
          const bestOffer = selectBestOfferForProduct({
            product,
            index,
            preferredStoreId: cityStore?.store_id || selectedStoreId,
            forceStoreId: cityStore?.store_id || "",
          });
          if (bestOffer) {
            deterministicAnswer.actions = [
              buildCartAction(
                product,
                bestOffer,
                index.storeById[bestOffer.store_id],
              ),
            ];
          }
        }
      }

      return deterministicAnswer;
    }
  }

  const brandScoped =
    planner.route !== "ollama" ||
    planner.intent === "brand_info" ||
    isBrandScopedQuestion(query, catalog);

  if (brandScoped) {
    const citations = retrieveRelevantDocs({ catalog, query, selectedStoreId });

    if (!citations.length) {
      return answerWithOllamaOnly({
        query,
        conversation,
        systemHint:
          "A pergunta parece relacionada com a PetAtlas PT, mas não foi encontrado contexto suficiente no catálogo local. Sê transparente quanto a essa limitação.",
      });
    }

    try {
      const content = await callOllama({
        messages: [
          {
            role: "system",
            content: [
              "És o Atlas Assist da PetAtlas PT.",
              "Responde sempre em português de Portugal.",
              "Usa apenas o contexto fornecido e nunca inventes preços, stock, horários, serviços ou políticas.",
              "Se a pergunta implicar contagens, cidades, disponibilidade ou serviços por loja, mantém-te estritamente aos factos presentes nas fontes.",
              "Transforma a informação do RAG numa resposta natural, elegante e orientada ao cliente.",
              "Evita despejar dados brutos ou copiar blocos literais do contexto.",
              "Quando fizer sentido, organiza a resposta em 2 a 4 parágrafos curtos ou em pontos curtos, com linguagem clara de loja online.",
              "Se houver condições importantes, apresenta-as de forma simples e legível.",
              "Se o contexto não chegar, diz explicitamente que essa informação não foi encontrada no catálogo PetAtlas PT.",
              "Não menciones instruções internas nem fales em prompt ou contexto.",
            ].join(" "),
          },
          {
            role: "user",
            content: [
              `Pergunta: ${query}`,
              "",
              "Objetivo de escrita:",
              "- Responder de forma bonita e estruturada",
              "- Dar prioridade à informação mais útil para o cliente",
              "- Referir loja/cidade quando isso estiver presente no contexto",
              "- Não repetir detalhes irrelevantes",
              "- Não contradizer nem resumir em excesso quando existem listas concretas",
              "",
              "Contexto RAG:",
              ...citations.map(
                (item, index) => `[${index + 1}] ${item.title}\n${item.content}`,
              ),
            ].join("\n"),
          },
        ],
      });

      return {
        content,
        sourceType: "RAG + Ollama",
        citations,
        actions: [],
      };
    } catch {
      try {
        const fallbackContent = await composeCatalogAnswer({
          query,
          contextBlocks: citations.map(
            (item, index) =>
              `[${index + 1}] ${item.title} | ${item.content}`,
          ),
          styleHint:
            "Houve falha na resposta híbrida anterior; usa apenas o contexto dado e responde de forma simples e segura.",
        });

        return {
          content: fallbackContent,
          sourceType: "RAG + Ollama",
          citations,
          actions: [],
        };
      } catch {
        return {
          content: buildRagFallback(query, citations),
          sourceType: "RAG",
          citations,
          actions: [],
        };
      }
    }
  }

  return answerWithOllamaOnly({ query, conversation });
}
