export async function fetchCatalog() {
  const response = await fetch("/data/petatlas_catalogo_animais_pt_v1.json");
  if (!response.ok) {
    throw new Error("Não foi possível carregar o catálogo.");
  }
  return response.json();
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatKey(key) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function stringifyValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          return Object.entries(item)
            .map(([key, nestedValue]) => `${formatKey(key)}: ${stringifyValue(nestedValue)}`)
            .join(" | ");
        }
        return String(item);
      })
      .join(", ");
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, nestedValue]) => `${formatKey(key)}: ${stringifyValue(nestedValue)}`)
      .join(" | ");
  }

  return String(value);
}

export function inventoryStatusFromStock(stockQty) {
  if (stockQty <= 0) return "esgotado";
  if (stockQty <= 4) return "stock_baixo";
  return "em_stock";
}

export function statusLabel(status) {
  const map = {
    em_stock: "Em stock",
    stock_baixo: "Stock baixo",
    esgotado: "Esgotado",
    encomenda_especial: "Encomenda especial",
  };
  return map[status] ?? status;
}

export function productEmoji(species, productType) {
  if (species === "cão") {
    if (productType.includes("ração")) return "🦴";
    if (productType.includes("cama")) return "🛏";
    if (productType.includes("transportadora")) return "🧳";
    return "🐕";
  }
  if (species === "gato") {
    if (productType.includes("areia")) return "🪨";
    if (productType.includes("arranhador")) return "🪵";
    if (productType.includes("fonte")) return "💧";
    return "🐈";
  }
  if (species === "pássaro") {
    if (productType.includes("gaiola") || productType.includes("viveiro")) return "🪺";
    return "🦜";
  }
  if (species === "peixe") {
    if (productType.includes("aquário")) return "🫧";
    if (productType.includes("filtro")) return "🌊";
    return "🐠";
  }
  return "🐾";
}

export function chunk(array, size) {
  const result = [];
  for (let index = 0; index < array.length; index += size) {
    result.push(array.slice(index, index + size));
  }
  return result;
}

export function countBy(items, key) {
  return items.reduce((accumulator, item) => {
    const bucket = item[key];
    accumulator[bucket] = (accumulator[bucket] ?? 0) + 1;
    return accumulator;
  }, {});
}

export function uniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))];
}

export function clamp(number, min, max) {
  return Math.max(min, Math.min(max, number));
}

export function buildSearchBlob(product) {
  return normalizeText(
    [
      product.name,
      product.brand,
      product.species,
      product.sub_species,
      product.breed_target,
      product.category,
      product.subcategory,
      product.description_short,
      product.description_long,
      stringifyValue(product.tags),
      stringifyValue(product.search_keywords),
      stringifyValue(product.synonyms),
    ].join(" "),
  );
}
