import { normalizeText } from "../data";

export const MEDIA_LIBRARY = {
  storeInterior: {
    src: "https://images.pexels.com/photos/23692911/pexels-photo-23692911.jpeg?cs=srgb&dl=pexels-ali-dashti-506667798-23692911.jpg&fm=jpg",
    alt: "Clientes a explorar uma loja de animais junto a uma secção de ração.",
  },
  dogFood: {
    src: "https://images.pexels.com/photos/8434725/pexels-photo-8434725.jpeg?cs=srgb&dl=pexels-mart-production-8434725.jpg&fm=jpg",
    alt: "Cão pequeno a comer de uma taça dentro de casa.",
  },
  dogBed: {
    src: "https://images.pexels.com/photos/28273847/pexels-photo-28273847.jpeg?cs=srgb&dl=pexels-japy-28273847.jpg&fm=jpg",
    alt: "Cão pequeno a dormir numa cama macia para animais.",
  },
  dogGrooming: {
    src: "https://images.pexels.com/photos/6816866/pexels-photo-6816866.jpeg?cs=srgb&dl=pexels-gustavo-fring-6816866.jpg&fm=jpg",
    alt: "Sessão de grooming a um cão pequeno numa mesa de cuidados.",
  },
  catFood: {
    src: "https://images.pexels.com/photos/16618557/pexels-photo-16618557.jpeg?cs=srgb&dl=pexels-eduardo-lopez-242403618-16618557.jpg&fm=jpg",
    alt: "Gato cinzento a comer ração de uma taça verde.",
  },
  catTree: {
    src: "https://images.pexels.com/photos/16881826/pexels-photo-16881826.jpeg?cs=srgb&dl=pexels-jasmine-pang-232852617-16881826.jpg&fm=jpg",
    alt: "Dois gatos num arranhador em madeira e sisal.",
  },
  birdCage: {
    src: "https://images.pexels.com/photos/12504770/pexels-photo-12504770.jpeg?cs=srgb&dl=pexels-maurylio-silva-251773867-12504770.jpg&fm=jpg",
    alt: "Ave verde pousada dentro de uma gaiola decorativa.",
  },
  birdInterior: {
    src: "https://images.pexels.com/photos/19749418/pexels-photo-19749418.jpeg?cs=srgb&dl=pexels-berna-elif-359546580-19749418.jpg&fm=jpg",
    alt: "Gaiola de pássaro junto a uma zona de estar iluminada pelo sol.",
  },
  fishAquarium: {
    src: "https://images.pexels.com/photos/30637422/pexels-photo-30637422.jpeg?cs=srgb&dl=pexels-olena-khalakhur-2149451078-30637422.jpg&fm=jpg",
    alt: "Peixe-palhaço num aquário de recife com corais coloridos.",
  },
};

function includesAny(text, values) {
  return values.some((value) => text.includes(value));
}

export function getProductMedia(product) {
  const haystack = normalizeText(
    [
      product.species,
      product.category,
      product.subcategory,
      product.product_type,
      product.name,
      product.description_short,
    ].join(" "),
  );

  if (product.species === "cão") {
    if (includesAny(haystack, ["cama", "colchao", "ortopedica", "ortopedico"])) {
      return MEDIA_LIBRARY.dogBed;
    }
    if (includesAny(haystack, ["higiene", "grooming", "champo", "tosquia"])) {
      return MEDIA_LIBRARY.dogGrooming;
    }
    return MEDIA_LIBRARY.dogFood;
  }

  if (product.species === "gato") {
    if (includesAny(haystack, ["arranhador", "arvore", "brinquedo", "cama"])) {
      return MEDIA_LIBRARY.catTree;
    }
    return MEDIA_LIBRARY.catFood;
  }

  if (product.species === "pássaro") {
    if (includesAny(haystack, ["gaiola", "viveiro", "ninho", "poleiro"])) {
      return MEDIA_LIBRARY.birdInterior;
    }
    return MEDIA_LIBRARY.birdCage;
  }

  if (product.species === "peixe") {
    return MEDIA_LIBRARY.fishAquarium;
  }

  return MEDIA_LIBRARY.storeInterior;
}

export function getStoreMedia() {
  return MEDIA_LIBRARY.storeInterior;
}

export function getServiceMedia(service) {
  const haystack = normalizeText(
    [
      service.name,
      service.service_type,
      ...(service.species_supported ?? []),
      ...(service.includes ?? []),
    ].join(" "),
  );

  if (includesAny(haystack, ["grooming", "banho", "tosquia", "unhas"])) {
    return MEDIA_LIBRARY.dogGrooming;
  }
  if (includesAny(haystack, ["aquario", "agua", "marinho"])) {
    return MEDIA_LIBRARY.fishAquarium;
  }
  if (includesAny(haystack, ["gato"])) {
    return MEDIA_LIBRARY.catTree;
  }
  if (includesAny(haystack, ["hotel", "daycare", "walking", "sitting", "taxi"])) {
    return MEDIA_LIBRARY.dogBed;
  }
  return MEDIA_LIBRARY.storeInterior;
}
