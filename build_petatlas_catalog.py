from __future__ import annotations

import json
import math
import re
from copy import deepcopy
from pathlib import Path


SOURCE_JSON = Path("data/petatlas_catalogo_animais_pt_v1.json")
ROOT_JSON = Path("petatlas_catalogo_animais_pt_v1.json")
DATA_JSONL = Path("data/petatlas_catalogo_animais_pt_v1_rag.jsonl")
ROOT_JSONL = Path("petatlas_catalogo_animais_pt_v1_rag.jsonl")
PUBLIC_JSON = Path("public/data/petatlas_catalogo_animais_pt_v1.json")
PUBLIC_JSONL = Path("public/data/petatlas_catalogo_animais_pt_v1_rag.jsonl")
NA = "N/A"
PRICE_ENDINGS = [0.09, 0.19, 0.29, 0.39, 0.49, 0.59, 0.69, 0.79, 0.89, 0.99]


DOG_DRY_BRANDS = {
    "Royal Canin": 1.02,
    "Advance": 0.88,
    "Purina Pro Plan": 0.96,
    "Acana": 1.13,
    "Criadores": 0.80,
    "Hill's": 1.05,
    "True Origins": 0.92,
    "Nath": 0.85,
    "Ownat": 0.89,
    "Edgard & Cooper": 1.07,
    "Virbac": 1.14,
    "Lenda": 0.93,
}

CAT_DRY_BRANDS = {
    "Royal Canin": 1.00,
    "Purina Pro Plan": 0.95,
    "Ownat": 0.84,
    "Hill's": 1.03,
    "Nath": 0.82,
    "Acana": 1.14,
    "True Origins": 0.90,
    "Criadores": 0.78,
    "Edgard & Cooper": 1.06,
}

FOOD_BRANDS_GENERIC = {
    "Small Life": 1.00,
    "RIO": 1.05,
    "Vivanimals": 0.96,
    "Kiki": 0.98,
    "Versele-Laga": 1.12,
    "Ocean Nutrition": 1.08,
    "Tetra": 0.97,
    "JBL": 1.04,
    "Sera": 0.98,
}

ACCESSORY_BRANDS = {
    "Catit": 1.04,
    "Flamingo": 1.02,
    "Outech": 1.00,
    "Catshion": 1.08,
    "Leeby": 1.10,
    "PetAtlas Aqua": 1.00,
    "PetAtlas Home": 1.00,
    "PetAtlas Ortho": 1.04,
    "PetAtlas Walk": 0.98,
    "PetAtlas Play": 0.95,
    "PetAtlas Feline": 0.97,
    "PetAtlas Toilet": 0.99,
    "PetAtlas Bird": 0.96,
}

MARKET_PRICE_SOURCES = [
    {
        "label": "Royal Canin Adult Chihuahua 3 kg",
        "url": "https://www.tiendanimal.pt/royal-canin-adult-chihuahua-racao-para-caes/ROY158115_M.html",
        "observed_price_eur": 26.99,
        "observed_at": "2026-05-05",
    },
    {
        "label": "True Origins Pure Adult Frango e Arroz 12 kg",
        "url": "https://www.kiwoko.pt/caes/comida-para-caes/racao-seca-para-caes/racao-frango/true-origins-pure-adult-frango-e-arroz-racao-para-caes/TRU70957_M.html",
        "observed_price_eur": 55.99,
        "observed_at": "2026-05-05",
    },
    {
        "label": "Royal Canin Pastor Alemão 5+ 12 kg",
        "url": "https://www.kiwoko.pt/caes/comida-para-caes/racao-seca-para-caes/racao-senior/royal-canin-adult-5_-pastor-alemao-racao-para-caes/ROY1340800_M.html",
        "observed_price_eur": 77.49,
        "observed_at": "2026-05-05",
    },
    {
        "label": "Ownat Classic Sterilized 15 kg",
        "url": "https://www.kiwoko.pt/gatos/comida-para-gatos/racao-para-gatos/racao-para-gato-esterilizado/ownat-classic-sterilized-racao-para-gatos/OWN39048_M.html",
        "observed_price_eur": 50.79,
        "observed_at": "2026-05-05",
    },
    {
        "label": "Royal Canin Kitten Sterilised 3.5 kg",
        "url": "https://www.kiwoko.pt/gatos/comida-para-gatos/racao-para-gatos/racao-para-gato-esterilizado/royal-canin-kitten-sterilised-racao-para-gatos-/ROY316210_M.html",
        "observed_price_eur": 39.99,
        "observed_at": "2026-05-05",
    },
    {
        "label": "Small Life Comida para periquitos 1 kg / 5 kg",
        "url": "https://www.kiwoko.pt/passaros/alimentacao-para-passaros/comida-para-passaros/small-life-comida-para-periquitos/KWK301_M.html",
        "observed_price_eur": 4.99,
        "observed_at": "2026-05-05",
    },
    {
        "label": "Flamingo Halura gaiola para periquitos",
        "url": "https://www.kiwoko.pt/passaros/gaiolas-e-acessorios-para-passaros/flamingo-halura-gaiola-branca-e-azul-para-periquitos/FLA107680_M.html",
        "observed_price_eur": 91.49,
        "observed_at": "2026-05-05",
    },
    {
        "label": "ICA Hydra Nano Plus 300 L/h",
        "url": "https://www.kiwoko.pt/peixes/aquarios-e-tanques/filtros-e-bombas/interior/ica-hydra-nano-plus-filtro-interno-biologico-para-aquarios/ICAHYN_M.html",
        "observed_price_eur": 62.99,
        "observed_at": "2026-05-05",
    },
    {
        "label": "ICA Hydra 400-600 L/h",
        "url": "https://www.kiwoko.pt/peixes/aquarios-e-tanques/filtros-e-bombas/interior/ica-hydra-filtro-interno-biologico-para-aquarios/ICAY30_M.html",
        "observed_price_eur": 59.99,
        "observed_at": "2026-05-05",
    },
    {
        "label": "Hydor Prime 30 filtro externo",
        "url": "https://www.kiwoko.pt/peixes/aquarios-e-tanques/filtros-e-bombas/hydor-prime-30-filtro-externo-para-aquarios/HYD24758_M.html",
        "observed_price_eur": 117.59,
        "observed_at": "2026-05-05",
    },
    {
        "label": "Seachem Vibrant Sea 6.2 kg",
        "url": "https://www.tiendanimal.pt/seachem-vibrant-sea-sal-marinho-sintetico-para-aquarios/SEA321_M.html",
        "observed_price_eur": 47.99,
        "observed_at": "2026-05-05",
    },
    {
        "label": "Seachem Brackish Salt 300 g",
        "url": "https://www.tiendanimal.pt/seachem-brackish-sal-para-aquarios-com-peixes-de-agua-salobra/SEA226_M.html",
        "observed_price_eur": 11.99,
        "observed_at": "2026-05-05",
    },
]


def load_dataset() -> dict:
    if SOURCE_JSON.exists():
        return json.loads(SOURCE_JSON.read_text(encoding="utf-8"))
    if ROOT_JSON.exists():
        return json.loads(ROOT_JSON.read_text(encoding="utf-8"))
    raise FileNotFoundError("Não encontrei o catálogo JSON base.")


def save_dataset(data: dict) -> None:
    SOURCE_JSON.parent.mkdir(parents=True, exist_ok=True)
    encoded = json.dumps(data, ensure_ascii=False, indent=2)
    SOURCE_JSON.write_text(encoded, encoding="utf-8")
    ROOT_JSON.write_text(encoded, encoding="utf-8")
    PUBLIC_JSON.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_JSON.write_text(encoded, encoding="utf-8")


def save_jsonl(lines: list[dict]) -> None:
    DATA_JSONL.parent.mkdir(parents=True, exist_ok=True)
    payload = "\n".join(json.dumps(line, ensure_ascii=False) for line in lines) + "\n"
    DATA_JSONL.write_text(payload, encoding="utf-8")
    ROOT_JSONL.write_text(payload, encoding="utf-8")
    PUBLIC_JSONL.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_JSONL.write_text(payload, encoding="utf-8")


def parse_numeric(value) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    return None


def extract_number(value) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        match = re.search(r"[-+]?\d+(?:[.,]\d+)?", value)
        if match:
            return float(match.group(0).replace(",", "."))
    return None


def product_salt(product: dict) -> int:
    match = re.search(r"(\d+)$", product["product_id"])
    return int(match.group(1)) if match else 0


def retail_round(value: float, salt: int) -> float:
    value = max(value, 0.99)
    whole = math.floor(value)
    ending = PRICE_ENDINGS[salt % len(PRICE_ENDINGS)]
    candidate = whole + ending
    if candidate + 1e-9 < value:
        candidate = whole + 1 + ending
    return round(candidate, 2)


def retail_round_down(value: float, salt: int) -> float:
    value = max(value, 0.49)
    whole = math.floor(value)
    ending = PRICE_ENDINGS[salt % len(PRICE_ENDINGS)]
    candidate = whole + ending
    if candidate - 1e-9 > value:
        candidate = max(0.49, whole - 1 + ending)
    return round(candidate, 2)


def weight_rate(weight: float, tiers: list[tuple[float, float]]) -> float:
    for limit, rate in tiers:
        if weight <= limit:
            return rate
    return tiers[-1][1]


def brand_factor(brand: str, table: dict[str, float], default: float = 1.0) -> float:
    return table.get(brand, default)


def dimensions_volume(product: dict) -> float:
    dims = product.get("dimensions_cm")
    if isinstance(dims, dict):
        return float(dims.get("length", 0)) * float(dims.get("width", 0)) * float(dims.get("height", 0))
    return 0.0


def dimensions_area(product: dict) -> float:
    dims = product.get("dimensions_cm")
    if isinstance(dims, dict):
        return float(dims.get("length", 0)) * float(dims.get("width", 0))
    return 0.0


def dimensions_height(product: dict) -> float:
    dims = product.get("dimensions_cm")
    if isinstance(dims, dict):
        return float(dims.get("height", 0))
    return 0.0


def exact_anchor_price(product: dict) -> float | None:
    name = product["name"]
    if name == "Royal Canin Breed Care Chihuahua Adult ração seca para cães":
        return 26.99
    if name == "True Origins Pure Adult Frango e Arroz ração para cães":
        return 55.99
    if name == "Royal Canin Kitten Sterilised ração para gatos":
        return 39.99
    if name == "Small Life mistura de sementes para periquitos":
        return 4.99
    if name == "Small Life mistura de sementes para periquitos XL":
        return 19.99
    if name == "Flamingo Halura gaiola para periquito":
        return 91.49
    if name == "ICA Hydra Nano Plus filtro interno para aquários":
        return 62.99
    if name == "ICA Hydra 20 filtro interno para aquários":
        return 57.99
    if name == "ICA Hydra 30 filtro interno para aquários":
        return 59.99
    if name == "Hydor Prime 30 filtro externo para aquários":
        return 117.59
    if name == "Seachem Vibrant Sea sal para aquários de água salgada":
        return 47.99
    if name == "Seachem Brackish Salt sal para aquários de água salobra":
        return 11.99
    return None


def dog_dry_price(product: dict) -> float:
    weight = parse_numeric(product["net_weight_kg"]) or 1.0
    rate = weight_rate(
        weight,
        [(2.0, 10.1), (3.0, 8.75), (5.0, 7.35), (8.0, 6.15), (10.0, 5.45), (12.0, 5.0), (14.0, 4.75), (99.0, 4.55)],
    )
    factor = brand_factor(product["brand"], DOG_DRY_BRANDS, 0.92)
    if product["breed_target"] != NA:
        factor *= 1.07
    if product["grain_free"] == "sim":
        factor *= 1.06
    if product["life_stage"] == "júnior":
        factor *= 1.04
    if product["life_stage"] == "sénior":
        factor *= 1.03
    if product["medical_focus"] not in {NA, "manutenção diária", "crescimento"}:
        factor *= 1.04
    base = weight * rate * factor
    return retail_round(base, product_salt(product))


def dog_wet_price(product: dict) -> float:
    weight = parse_numeric(product["net_weight_kg"]) or 0.4
    factor = brand_factor(product["brand"], DOG_DRY_BRANDS, 0.98)
    base = weight * 10.4 * factor
    if product["life_stage"] == "sénior":
        base *= 1.03
    return retail_round(base, product_salt(product))


def dog_dental_snack_price(product: dict) -> float:
    weight = parse_numeric(product["net_weight_kg"]) or 0.1
    max_weight = parse_numeric(product["max_pet_weight_kg"]) or 10
    base = 2.7 + weight * 22 + max_weight * 0.11
    if product["brand"] == "Whimzees":
        base *= 1.08
    return retail_round(base, product_salt(product))


def dog_training_snack_price(product: dict) -> float:
    weight = parse_numeric(product["net_weight_kg"]) or 0.08
    base = 2.4 + weight * 18.5
    if "salmão" in product["name"].lower() or "coelho" in product["name"].lower():
        base += 0.7
    return retail_round(base, product_salt(product))


def dog_supplement_price(product: dict) -> float:
    weight = parse_numeric(product["net_weight_kg"]) or 0.18
    focus = product["medical_focus"]
    base = 12.5 + weight * 28
    if focus in {"saúde articular", "pele e pelo"}:
        base += 2.8
    if focus == "controlo de peso":
        base += 1.3
    return retail_round(base, product_salt(product))


def dog_bed_price(product: dict) -> float:
    area = dimensions_area(product)
    max_weight = parse_numeric(product["max_pet_weight_kg"]) or 10
    base = 12 + area * 0.0035 + max_weight * 0.34
    if "sofá" in product["name"].lower():
        base += 4.5
    if "elevada" in product["name"].lower():
        base += 6.0
    return retail_round(base, product_salt(product))


def dog_ortho_bed_price(product: dict) -> float:
    standard = dog_bed_price(product)
    base = standard * 1.62 + 14
    return retail_round(base, product_salt(product))


def dog_toy_price(product: dict) -> float:
    max_weight = parse_numeric(product["max_pet_weight_kg"]) or 10
    base = 3.8 + max_weight * 0.14
    subtype = product["subcategory"]
    if "dispensador" in subtype or "puzzle" in subtype:
        base += 5.0
    elif "peluche" in subtype:
        base += 2.0
    elif "mordedor" in subtype:
        base += 3.2
    return retail_round(base, product_salt(product))


def dog_walk_price(product: dict) -> float:
    max_weight = parse_numeric(product["max_pet_weight_kg"]) or 10
    base = 7.5 + max_weight * 0.4
    if "conjunto" in product["subcategory"]:
        base += 5.0
    if "trela" in product["subcategory"]:
        base -= 2.0
    return retail_round(base, product_salt(product))


def dog_carrier_price(product: dict) -> float:
    max_weight = parse_numeric(product["max_pet_weight_kg"]) or 8
    base = 14.5 + max_weight * 2.45
    if "Backpack" in product["name"]:
        base += 5.5
    return retail_round(base, product_salt(product))


def dog_hygiene_price(product: dict) -> float:
    weight = parse_numeric(product["net_weight_kg"]) or 0.1
    base = 5.0 + weight * 14
    if "kit" in product["subcategory"]:
        base += 4.6
    if "resguardos" in product["name"].lower():
        base += 6.0
    return retail_round(base, product_salt(product))


def dog_antiparasitic_price(product: dict) -> float:
    max_weight = parse_numeric(product["max_pet_weight_kg"]) or 10
    base = 9.9 + max_weight * 0.28
    if "coleira" in product["subcategory"]:
        base += 4.2
    if "spray" in product["subcategory"]:
        base = 14.99
    return retail_round(base, product_salt(product))


def cat_dry_price(product: dict) -> float:
    weight = parse_numeric(product["net_weight_kg"]) or 1.5
    rate = weight_rate(
        weight,
        [(1.8, 12.5), (2.5, 10.8), (3.5, 9.8), (4.0, 8.8), (8.0, 4.45), (99.0, 4.15)],
    )
    factor = brand_factor(product["brand"], CAT_DRY_BRANDS, 0.88)
    if product["subcategory"] in {"esterilizados", "urinary", "hairball"}:
        factor *= 1.06
    if product["breed_target"] != NA:
        factor *= 1.08
    if product["life_stage"] == "júnior":
        factor *= 1.03
    if product["life_stage"] == "sénior":
        factor *= 1.03
    base = weight * rate * factor
    return retail_round(base, product_salt(product))


def cat_wet_price(product: dict) -> float:
    weight = parse_numeric(product["net_weight_kg"]) or 0.085
    factor = brand_factor(product["brand"], CAT_DRY_BRANDS, 0.95)
    base = weight * 21.0 * factor
    return retail_round(base, product_salt(product))


def cat_snack_price(product: dict) -> float:
    weight = parse_numeric(product["net_weight_kg"]) or 0.05
    base = 2.9 + weight * 24
    if "Freeze Dried" in product["name"]:
        base += 1.7
    if "Creamy" in product["name"]:
        base += 0.8
    return retail_round(base, product_salt(product))


def cat_litter_price(product: dict) -> float:
    weight = parse_numeric(product["net_weight_kg"]) or 6.0
    subtype = product["subcategory"]
    rate = 1.05
    if subtype == "sílica":
        rate = 2.35
    elif subtype == "tofu":
        rate = 1.42
    elif subtype in {"milho", "fibra vegetal"}:
        rate = 1.62
    elif subtype == "bentonite":
        rate = 1.02
    base = weight * rate
    if "Extra" in product["name"] or "Premium" in product["name"]:
        base *= 1.06
    return retail_round(base, product_salt(product))


def cat_litter_box_price(product: dict) -> float:
    area = dimensions_area(product)
    base = 10 + area * 0.010
    if "fechada" in product["subcategory"]:
        base += 8.0
    if "entrada superior" in product["subcategory"]:
        base += 6.0
    return retail_round(base, product_salt(product))


def cat_scratcher_price(product: dict) -> float:
    longest = max(
        product["dimensions_cm"]["length"],
        product["dimensions_cm"]["width"],
        product["dimensions_cm"]["height"],
    )
    base = 8 + longest * 0.31
    if "poste" in product["subcategory"]:
        base += 2.5
    if "rampa" in product["subcategory"] or "lounge" in product["subcategory"]:
        base += 5.0
    return retail_round(base, product_salt(product))


def cat_tree_price(product: dict) -> float:
    area = dimensions_area(product)
    height = dimensions_height(product)
    factor = brand_factor(product["brand"], ACCESSORY_BRANDS, 1.0)
    base = (20 + area * 0.014 + height * 0.18) * factor
    if product["life_stage"] == "sénior":
        base += 7.0
    return retail_round(base, product_salt(product))


def cat_bed_price(product: dict) -> float:
    area = dimensions_area(product)
    base = 12 + area * 0.007
    if "rede" in product["subcategory"]:
        base += 5.5
    if "felt" in product["name"].lower():
        base += 6.0
    return retail_round(base, product_salt(product))


def cat_fountain_price(product: dict) -> float:
    power = extract_number(product["power_w"]) if product["power_w"] != NA else 2.0
    base = 24 + power * 2.2 + dimensions_area(product) * 0.025
    if "Steel" in product["name"]:
        base += 8.0
    return retail_round(base, product_salt(product))


def cat_carrier_price(product: dict) -> float:
    volume = dimensions_volume(product)
    base = 16 + math.sqrt(volume) * 0.35
    if "Backpack" in product["name"]:
        base += 8.5
    if "Soft" in product["name"]:
        base += 4.0
    return retail_round(base, product_salt(product))


def cat_toy_price(product: dict) -> float:
    base = 4.5 + dimensions_height(product) * 0.35
    if "circuito" in product["subcategory"]:
        base += 4.0
    return retail_round(base, product_salt(product))


def bird_seed_price(product: dict) -> float:
    weight = parse_numeric(product["net_weight_kg"]) or 1.0
    factor = brand_factor(product["brand"], FOOD_BRANDS_GENERIC, 1.0)
    rate = 4.55 if weight <= 1 else 4.05
    base = weight * rate * factor
    if product["sub_species"] == "papagaio":
        base *= 1.18
    return retail_round(base, product_salt(product))


def bird_pellet_price(product: dict) -> float:
    weight = parse_numeric(product["net_weight_kg"]) or 0.8
    factor = brand_factor(product["brand"], FOOD_BRANDS_GENERIC, 1.05)
    base = weight * 9.9 * factor
    if product["sub_species"] == "papagaio":
        base *= 1.10
    return retail_round(base, product_salt(product))


def bird_cage_price(product: dict) -> float:
    volume = dimensions_volume(product)
    sub_species = product["sub_species"]
    species_factor = 1.0
    if sub_species in {"ninfa", "agapornis"}:
        species_factor = 1.07
    if sub_species == "papagaio":
        species_factor = 1.34
    base = (18 + math.sqrt(volume) * 0.18 + dimensions_height(product) * 0.15) * species_factor
    return retail_round(base, product_salt(product))


def bird_aviary_price(product: dict) -> float:
    volume = dimensions_volume(product)
    base = 35 + math.sqrt(volume) * 0.22 + dimensions_height(product) * 0.2
    if "papagaios" in product["sub_species"]:
        base *= 1.12
    return retail_round(base, product_salt(product))


def bird_accessory_price(product: dict) -> float:
    area = dimensions_area(product)
    base = 4.5 + area * 0.015
    if product["product_type"] == "ninho":
        base += 2.0
    if product["product_type"] == "brinquedo":
        base += 2.2
    if product["product_type"] == "poleiro":
        base += 1.5
    return retail_round(base, product_salt(product))


def fish_food_price(product: dict) -> float:
    weight = parse_numeric(product["net_weight_kg"]) or 0.05
    factor = brand_factor(product["brand"], FOOD_BRANDS_GENERIC, 1.0)
    water_factor = 1.08 if product["sub_species"] == "água salgada" else 1.04 if product["sub_species"] == "água salobra" else 1.0
    base = 5.6 + weight * 28 * factor * water_factor
    return retail_round(base, product_salt(product))


def aquarium_price(product: dict) -> float:
    liters = parse_numeric(product["aquarium_capacity_l"]) or 20
    water_type = product["water_type"]
    if water_type == "água salgada":
        base = 55 + liters * 2.8
    elif water_type == "água salobra":
        base = 35 + liters * 2.0
    else:
        base = 30 + liters * 1.72
    return retail_round(base, product_salt(product))


def filter_price(product: dict) -> float:
    flow = extract_number(product["filter_flow_lh"]) if product["filter_flow_lh"] != NA else 300
    capacity = parse_numeric(product["aquarium_capacity_l"]) or 80
    if "externo" in product["product_type"]:
        base = 42 + flow * 0.065 + capacity * 0.05
    else:
        base = 27 + flow * 0.06 + capacity * 0.02
    if product["brand"] in {"Hydor", "Eheim"}:
        base *= 1.06
    return retail_round(base, product_salt(product))


def heater_price(product: dict) -> float:
    power = extract_number(product["power_w"]) if product["power_w"] != NA else 25
    base = 10.5 + power * 0.095
    return retail_round(base, product_salt(product))


def lighting_price(product: dict) -> float:
    power = extract_number(product["power_w"]) if product["power_w"] != NA else 8
    length = product["dimensions_cm"]["length"]
    base = 17 + length * 0.52 + power * 1.2
    if "Reef" in product["name"] or "Marine" in product["name"]:
        base += 10
    return retail_round(base, product_salt(product))


def substrate_price(product: dict) -> float:
    weight = parse_numeric(product["net_weight_kg"]) or 5.0
    name = product["name"]
    rate = 1.55
    if "Soil" in name or "Nutrisoil" in name or "Shrimp" in name:
        rate = 5.9
    elif "Aragonite" in name or "Coral" in name:
        rate = 3.1
    elif "Quartz" in name or "River Gravel" in name:
        rate = 1.3
    base = weight * rate
    return retail_round(base, product_salt(product))


def conditioner_price(product: dict) -> float:
    weight = parse_numeric(product["net_weight_kg"]) or 0.1
    brand = product["brand"]
    base = 5.4 + weight * 23
    if brand in {"Seachem", "JBL"}:
        base *= 1.14
    if "Marine" in product["name"] or "Brackish" in product["name"]:
        base *= 1.05
    return retail_round(base, product_salt(product))


def marine_salt_price(product: dict) -> float:
    weight = parse_numeric(product["net_weight_kg"]) or 1.0
    if product["sub_species"] == "água salgada":
        base = 7.4 + weight * 7.0
    else:
        base = 5.8 + weight * 5.3
    return retail_round(base, product_salt(product))


def water_test_price(product: dict) -> float:
    area = dimensions_area(product)
    base = 12 + area * 0.08
    if "Marine" in product["name"]:
        base += 4.0
    return retail_round(base, product_salt(product))


def decor_price(product: dict) -> float:
    volume = dimensions_volume(product)
    base = 7 + math.sqrt(volume) * 0.32
    if "Mangrove" in product["name"] or "Reef" in product["name"]:
        base += 4.0
    return retail_round(base, product_salt(product))


def compute_reference_price(product: dict) -> float:
    anchor = exact_anchor_price(product)
    if anchor is not None:
        return anchor

    species = product["species"]
    product_type = product["product_type"]

    if species == "cão":
        if product_type == "ração seca":
            return dog_dry_price(product)
        if product_type == "ração húmida":
            return dog_wet_price(product)
        if product_type == "snack dentário":
            return dog_dental_snack_price(product)
        if product_type == "snack de treino":
            return dog_training_snack_price(product)
        if product_type == "suplemento":
            return dog_supplement_price(product)
        if product_type == "cama":
            return dog_bed_price(product)
        if product_type == "cama ortopédica":
            return dog_ortho_bed_price(product)
        if product_type == "brinquedo":
            return dog_toy_price(product)
        if product_type == "acessório de passeio":
            return dog_walk_price(product)
        if product_type == "transportadora":
            return dog_carrier_price(product)
        if product_type == "higiene":
            return dog_hygiene_price(product)
        if product_type == "antiparasitário":
            return dog_antiparasitic_price(product)

    if species == "gato":
        if product_type == "ração seca":
            return cat_dry_price(product)
        if product_type == "ração húmida":
            return cat_wet_price(product)
        if product_type == "snack":
            return cat_snack_price(product)
        if product_type == "areia":
            return cat_litter_price(product)
        if product_type == "caixa de areia":
            return cat_litter_box_price(product)
        if product_type == "arranhador":
            return cat_scratcher_price(product)
        if product_type == "árvore para gato":
            return cat_tree_price(product)
        if product_type == "cama":
            return cat_bed_price(product)
        if product_type == "fonte de água":
            return cat_fountain_price(product)
        if product_type == "transportadora":
            return cat_carrier_price(product)
        if product_type == "brinquedo":
            return cat_toy_price(product)

    if species == "pássaro":
        if product_type == "mistura de sementes":
            return bird_seed_price(product)
        if product_type == "pellets":
            return bird_pellet_price(product)
        if product_type == "gaiola":
            return bird_cage_price(product)
        if product_type == "viveiro":
            return bird_aviary_price(product)
        return bird_accessory_price(product)

    if species == "peixe":
        if product_type in {"alimento em flocos", "alimento em pellets"}:
            return fish_food_price(product)
        if product_type == "aquário":
            return aquarium_price(product)
        if product_type in {"filtro interno", "filtro externo"}:
            return filter_price(product)
        if product_type == "aquecedor":
            return heater_price(product)
        if product_type == "iluminação":
            return lighting_price(product)
        if product_type == "substrato":
            return substrate_price(product)
        if product_type == "condicionador":
            return conditioner_price(product)
        if product_type == "sal marinho":
            return marine_salt_price(product)
        if product_type == "kit de testes":
            return water_test_price(product)
        if product_type == "decoração":
            return decor_price(product)

    return retail_round(float(product.get("reference_price_eur", 9.99)), product_salt(product))


def price_band(price: float) -> str:
    if price < 10:
        return "0-9.99"
    if price < 25:
        return "10-24.99"
    if price < 50:
        return "25-49.99"
    if price < 100:
        return "50-99.99"
    return "100+"


def discount_multiplier(item: dict, salt: int) -> float:
    label = item["promo_label"]
    if label == NA:
        return 1.0
    if "leve 3 pague 2" in label:
        return 0.87
    if "fim de semana" in label:
        return 0.88
    if "fidelização" in label:
        return 0.92
    if "-10%" in label:
        return 0.90
    return [0.90, 0.88, 0.92, 0.87][salt % 4]


def inventory_store_factor(store_id: str, salt: int) -> float:
    base = {"PTA-POR-01": 1.0, "PTA-LIS-01": 1.039, "PTA-BRG-01": 0.979}[store_id]
    micro = ((salt % 11) - 5) * 0.006
    return base * (1.0 + micro)


def reprice_inventory(products: list[dict], inventory: list[dict]) -> list[dict]:
    ref_lookup = {product["product_id"]: product["reference_price_eur"] for product in products}
    refreshed = []
    for idx, item in enumerate(inventory, start=1):
        clone = deepcopy(item)
        ref = ref_lookup[item["product_id"]]
        factor = inventory_store_factor(item["store_id"], idx)
        base_price = retail_round(ref * factor, idx)
        multiplier = discount_multiplier(item, idx)
        if multiplier < 1.0:
            current_price = retail_round_down(base_price * multiplier, idx + 3)
            if current_price >= base_price:
                current_price = round(max(0.49, base_price - 0.10), 2)
        else:
            current_price = base_price
        clone["base_price_eur"] = base_price
        clone["current_price_eur"] = current_price
        clone["promo_price_eur"] = current_price if multiplier < 1.0 else NA
        refreshed.append(clone)
    return refreshed


def rebuild_rag_documents(
    products: list[dict],
    inventory: list[dict],
    stores: list[dict],
    services: list[dict],
    brand: dict,
    content_pages: list[dict],
) -> list[dict]:
    product_lookup = {product["product_id"]: product for product in products}
    store_lookup = {store["store_id"]: store for store in stores}
    docs = []

    inventory_by_product = {}
    for item in inventory:
        inventory_by_product.setdefault(item["product_id"], []).append(item)

    for product in products:
        docs.append(
            {
                "doc_id": f"DOC-PROD-{product['product_id']}",
                "doc_type": "product_master",
                "entity_id": product["product_id"],
                "store_id": NA,
                "city": NA,
                "title": product["name"],
                "content": (
                    f"{product['name']}. Espécie: {product['species']}. Categoria: {product['category']} / {product['subcategory']}. "
                    f"Raça: {product['breed_target']}. Etapa: {product['life_stage']}. Porte: {product['size_target']}. "
                    f"Descrição: {product['description_long']} "
                    f"Preço de referência realista: {product['reference_price_eur']} EUR. "
                    f"Validade: {product['validade']}. Guia: {product['feeding_guide']}. Compatibilidade: {product['compatibility']}."
                ),
                "filters": {
                    "species": product["species"],
                    "category": product["category"],
                    "subcategory": product["subcategory"],
                    "breed_target": product["breed_target"],
                    "life_stage": product["life_stage"],
                    "size_target": product["size_target"],
                    "water_type": product["water_type"],
                },
                "keywords": product["tags"] + product["search_keywords"] + product["synonyms"],
                "price_text": f"Preço de referência {product['reference_price_eur']} EUR",
                "availability_text": f"Disponível em {len(inventory_by_product.get(product['product_id'], []))} loja(s)",
            }
        )

    for item in inventory:
        product = product_lookup[item["product_id"]]
        store = store_lookup[item["store_id"]]
        docs.append(
            {
                "doc_id": f"DOC-OFFER-{item['product_id']}-{item['store_id']}",
                "doc_type": "product_store_offer",
                "entity_id": item["product_id"],
                "store_id": item["store_id"],
                "city": store["city"],
                "title": f"{product['name']} em {store['city']}",
                "content": (
                    f"{product['name']} disponível na loja {store['name']} em {store['city']}. "
                    f"Preço atual {item['current_price_eur']} EUR. "
                    f"Preço base {item['base_price_eur']} EUR. Promoção: {item['promo_label']}. "
                    f"Stock: {item['stock_status']} ({item['stock_qty']} unidades). "
                    f"Click & Collect: {'sim' if item['available_for_pickup'] else 'não'}. "
                    f"Entrega: {item['delivery_eta']}. "
                    f"Espécie {product['species']}, subcategoria {product['subcategory']}, porte {product['size_target']}, raça {product['breed_target']}."
                ),
                "filters": {
                    "city": store["city"],
                    "store_id": store["store_id"],
                    "species": product["species"],
                    "category": product["category"],
                    "subcategory": product["subcategory"],
                    "stock_status": item["stock_status"],
                    "exclusive_store": item["exclusive_store"],
                },
                "keywords": [store["city"], store["name"]] + product["search_keywords"] + product["synonyms"],
                "price_text": f"{item['current_price_eur']} EUR",
                "availability_text": f"{item['stock_status']} | {item['delivery_eta']}",
            }
        )

    for service in services:
        for store_id in service["stores_available"]:
            store = store_lookup[store_id]
            docs.append(
                {
                    "doc_id": f"DOC-SRV-{service['service_id']}-{store_id}",
                    "doc_type": "service_offer",
                    "entity_id": service["service_id"],
                    "store_id": store_id,
                    "city": store["city"],
                    "title": f"{service['name']} em {store['city']}",
                    "content": (
                        f"Serviço {service['name']} disponível em {store['city']}. "
                        f"Tipo: {service['service_type']}. Espécies: {', '.join(service['species_supported'])}. "
                        f"Preço desde {service['price_from_eur']} EUR. Duração {service['duration_min']} minutos. "
                        f"Inclui: {', '.join(service['includes'])}. Requisitos: {', '.join(service['requirements'])}. "
                        f"Notas pós-serviço: {service['aftercare_notes']}."
                    ),
                    "filters": {
                        "city": store["city"],
                        "service_type": service["service_type"],
                        "species_supported": service["species_supported"],
                    },
                    "keywords": [service["name"], service["service_type"], store["city"]] + service["species_supported"],
                    "price_text": f"desde {service['price_from_eur']} EUR",
                    "availability_text": f"marcação via {service['booking_mode']}",
                }
            )

    docs.append(
        {
            "doc_id": "DOC-BRAND-PETATLAS-PT",
            "doc_type": "brand_info",
            "entity_id": brand["brand_id"],
            "store_id": NA,
            "city": NA,
            "title": f"{brand['name']} | Quem somos",
            "content": (
                f"{brand['name']} nasceu em {brand['founded_year']} e opera a partir de {brand['headquarters']}. "
                f"Missão: {brand['mission']} Visão: {brand['vision']} "
                f"Manifesto: {brand['manifesto']} "
                f"Valores: " + " | ".join(f"{item['title']}: {item['description']}" for item in brand["values"]) +
                " Equipa: " + " | ".join(f"{member['name']} - {member['role']} ({member['focus']})" for member in brand["team"]) +
                " Marcos: " + " | ".join(f"{event['year']}: {event['milestone']}" for event in brand["timeline"])
            ),
            "filters": {"doc_scope": "brand", "brand_id": brand["brand_id"]},
            "keywords": [brand["name"], brand["tagline"], "quem somos", "marca", "pet retail"],
            "price_text": NA,
            "availability_text": "conteúdo institucional",
        }
    )

    for store in stores:
        docs.append(
            {
                "doc_id": f"DOC-STORE-{store['store_id']}",
                "doc_type": "store_info",
                "entity_id": store["store_id"],
                "store_id": store["store_id"],
                "city": store["city"],
                "title": f"{store['name']} | loja e serviços",
                "content": (
                    f"{store['name']} em {store['city']}, distrito de {store['district']}. "
                    f"Gestão local por {store['manager_name']}. "
                    f"Especialidades: {', '.join(store['specialties'])}. "
                    f"Zonas pet friendly: {', '.join(store['pet_friendly_zones'])}. "
                    f"Programas de comunidade: {', '.join(store['community_programs'])}. "
                    f"História local: {store['story']} "
                    f"Pickup SLA: {store['pickup_sla']}. Estacionamento: {store['parking']}."
                ),
                "filters": {
                    "doc_scope": "store",
                    "store_id": store["store_id"],
                    "city": store["city"],
                    "specialties": store["specialties"],
                },
                "keywords": [store["city"], store["name"]] + store["specialties"] + store["store_features"],
                "price_text": NA,
                "availability_text": "loja física e serviços",
            }
        )

    for page in content_pages:
        docs.append(
            {
                "doc_id": f"DOC-PAGE-{page['page_id']}",
                "doc_type": "content_page",
                "entity_id": page["page_id"],
                "store_id": NA,
                "city": NA,
                "title": page["title"],
                "content": page["summary"] + " " + " ".join(section["heading"] + ": " + section["body"] for section in page["sections"]),
                "filters": {"doc_scope": "content_page", "slug": page["slug"]},
                "keywords": [page["title"], page["slug"], "institucional", "petatlas"],
                "price_text": NA,
                "availability_text": "conteúdo institucional",
            }
        )
    return docs


def build_jsonl_lines(rag_documents: list[dict]) -> list[dict]:
    lines = []
    for doc in rag_documents:
        lines.append(
            {
                "id": doc["doc_id"],
                "text": f"{doc['title']}\n{doc['content']}",
                "metadata": {
                    "doc_type": doc["doc_type"],
                    "entity_id": doc["entity_id"],
                    "store_id": doc["store_id"],
                    "city": doc["city"],
                    "filters": doc["filters"],
                    "keywords": doc["keywords"],
                    "price_text": doc["price_text"],
                    "availability_text": doc["availability_text"],
                },
            }
        )
    return lines


def build_brand() -> dict:
    return {
        "brand_id": "BRAND-PETATLAS-PT",
        "name": "PetAtlas PT",
        "tagline": "Tudo para cada espécie, com contexto local e cuidado diário.",
        "founded_year": 2021,
        "headquarters": "Porto, Portugal",
        "mission": "Ajudar tutores a escolher melhor, comprar com contexto e cuidar dos animais com informação clara.",
        "vision": "Ser a referência portuguesa em pet retail orientado por dados, experiência e proximidade local.",
        "voice": "experiente, próxima e direta",
        "manifesto": (
            "Na PetAtlas PT acreditamos que comprar para um animal não devia ser um gesto genérico. "
            "Cada espécie, raça, porte, rotina doméstica e cidade gera necessidades diferentes. "
            "Por isso juntamos loja física, catálogo detalhado, aconselhamento e dados pesquisáveis num mesmo ecossistema."
        ),
        "values": [
            {
                "title": "Clareza",
                "description": "Explicamos compatibilidades, dosagens, limites de peso, volumes de aquário e serviços sem linguagem vaga.",
            },
            {
                "title": "Especialização por espécie",
                "description": "Cães, gatos, pássaros e peixes têm jornadas e sinais de compra próprios; o catálogo reflete isso.",
            },
            {
                "title": "Proximidade local",
                "description": "Cada loja adapta disponibilidade, eventos e serviços à realidade de Lisboa, Porto e Braga.",
            },
            {
                "title": "Tecnologia útil",
                "description": "Dados bem estruturados para ecommerce, pesquisa semântica e suporte a chatbot académico.",
            },
        ],
        "guarantees": [
            "click & collect na maioria das referências disponíveis",
            "datas de validade e instruções sempre visíveis",
            "preços por loja com contexto local",
            "simulação transparente em ambiente académico",
        ],
        "support": {
            "email": "hello@petatlas.pt",
            "phone": "+351 220 000 123",
            "hours": "Seg-Sex 09:00-19:00",
            "chat_policy": "O chatbot da homepage neste protótipo é apenas visual e não executa pedidos.",
        },
        "team": [
            {"name": "Marta Coutinho", "role": "Direção de Marca", "focus": "experiência omnicanal e storytelling de espécie"},
            {"name": "Diogo Neves", "role": "Operações de Loja", "focus": "sortido local, click & collect e serviços"},
            {"name": "Sara Afonso", "role": "Curadoria de Catálogo", "focus": "nutrição, compatibilidades e enriquecimento"},
            {"name": "João Teles", "role": "Dados e Produto", "focus": "RAG, ecommerce e estruturação semântica"},
        ],
        "timeline": [
            {"year": 2021, "milestone": "Primeiro laboratório de catálogo multi-espécie em ambiente académico."},
            {"year": 2023, "milestone": "Abertura do hub Porto Cobre com foco em cães, treino e viagem."},
            {"year": 2025, "milestone": "Expansão da camada de dados para catálogo, inventário, serviços e RAG."},
        ],
        "loyalty_program": {
            "name": "Clube Atlas",
            "benefits": [
                "campanhas por espécie",
                "packs de treino e grooming",
                "alertas de reposição de consumíveis",
            ],
            "tiers": ["Explorador", "Guardião", "Embaixador"],
        },
        "sustainability": {
            "pillars": [
                "embalagens recicláveis quando disponíveis",
                "triagem de consumíveis por categoria",
                "ações locais de recolha solidária",
            ],
            "community_programs": [
                "Atlas Adota fins de semana solidários",
                "workshops de aquariofilia responsável",
                "sessões de iniciação ao treino positivo",
            ],
        },
        "social": {
            "instagram": "@petatlaspt",
            "facebook": "PetAtlas PT",
            "tiktok": "@petatlas.pt",
        },
    }


def build_content_pages() -> list[dict]:
    return [
        {
            "page_id": "PAGE-ABOUT",
            "slug": "quem-somos",
            "title": "Quem Somos",
            "summary": "A marca, a visão e a razão para um catálogo tão detalhado.",
            "sections": [
                {
                    "heading": "Porque nascemos",
                    "body": (
                        "A PetAtlas PT surgiu de um problema simples: muita oferta, pouca contextualização. "
                        "Criámos uma estrutura onde um tutor pode perceber não só o que existe, mas também para que espécie, porte, fase de vida e habitat cada referência faz sentido."
                    ),
                },
                {
                    "heading": "Como trabalhamos",
                    "body": (
                        "Juntamos observação de mercado, curadoria por categoria e modelação de dados detalhada. "
                        "O objetivo é servir simultaneamente ecommerce, pesquisa avançada e experiências de suporte conversacional."
                    ),
                },
            ],
        },
        {
            "page_id": "PAGE-SHIPPING",
            "slug": "entregas-e-recolhas",
            "title": "Entregas e Recolhas",
            "summary": "Regras simuladas de entrega, click & collect e preparação por loja.",
            "sections": [
                {
                    "heading": "Click & Collect",
                    "body": "Quando o stock está disponível na loja selecionada, a preparação simulada varia entre 2 e 48 horas consoante a categoria e o volume do artigo.",
                },
                {
                    "heading": "Entrega académica",
                    "body": "Neste protótipo, as entregas são apenas simuladas. Os prazos apresentados servem para testar fluxos de carrinho e checkout.",
                },
            ],
        },
        {
            "page_id": "PAGE-SERVICES",
            "slug": "servicos-e-cuidados",
            "title": "Serviços e Cuidados",
            "summary": "Banhos, tosquias, hotel, pet sitting, treino e aquariofilia com cobertura por loja.",
            "sections": [
                {
                    "heading": "Serviços por perfil",
                    "body": "As lojas foram desenhadas com valências diferentes: Lisboa reforça assistência urbana e domicílio, Porto combina treino e hotel, Braga destaca aves e aquários plantados.",
                },
                {
                    "heading": "Agendamento",
                    "body": "No protótipo podes explorar a oferta e os requisitos, mas não existe backend real de marcação.",
                },
            ],
        },
        {
            "page_id": "PAGE-COMMUNITY",
            "slug": "comunidade",
            "title": "Comunidade Atlas",
            "summary": "Ações locais, eventos e rotinas de proximidade com tutores.",
            "sections": [
                {
                    "heading": "Eventos",
                    "body": "Promovemos talks de nutrição felina indoor, workshops de enriquecimento canino e clínicas de parâmetros de água em loja.",
                },
                {
                    "heading": "Adoção e apoio",
                    "body": "O programa Atlas Adota agrega recolha solidária, divulgação de associações e kits de arranque por espécie.",
                },
            ],
        },
        {
            "page_id": "PAGE-FAQ",
            "slug": "faq",
            "title": "FAQ",
            "summary": "Perguntas frequentes sobre preços por loja, stock, validade e serviços.",
            "sections": [
                {
                    "heading": "Porque muda o preço por cidade?",
                    "body": "O catálogo simula diferenças locais por loja, promoções e mix de disponibilidade, para refletir um ecommerce multi-filial mais realista.",
                },
                {
                    "heading": "Os pagamentos são reais?",
                    "body": "Não. Todo o checkout neste projeto é uma simulação académica com saldo virtual e confirmação fictícia.",
                },
            ],
        },
        {
            "page_id": "PAGE-RAG",
            "slug": "dados-e-rag",
            "title": "Dados e RAG",
            "summary": "Como o catálogo foi estruturado para pesquisa semântica e suporte a chatbot.",
            "sections": [
                {
                    "heading": "Dados canónicos",
                    "body": "Produtos, inventário, serviços, lojas, identidade de marca e páginas institucionais foram separados em entidades reutilizáveis.",
                },
                {
                    "heading": "Documentos derivados",
                    "body": "O sistema gera documentos RAG para produto mestre, oferta por loja, serviço por cidade, marca e conteúdo institucional.",
                },
            ],
        },
    ]


def enhance_stores(stores: list[dict]) -> list[dict]:
    extras = {
        "PTA-LIS-01": {
            "manager_name": "Inês Valente",
            "pickup_sla": "2h-24h",
            "parking": "parque coberto do centro comercial",
            "pet_friendly_zones": ["consultório móvel", "zona felina silenciosa", "ilha de snacks naturais"],
            "specialties": ["serviços ao domicílio", "gatos indoor", "aquários nano reef"],
            "community_programs": ["Atlas Adota Lisboa", "Noites de Grooming Calmo"],
            "story": "A loja de Lisboa foi desenhada para clientes urbanos que valorizam rapidez, serviços assistidos e curadoria compacta.",
        },
        "PTA-POR-01": {
            "manager_name": "Miguel Sá",
            "pickup_sla": "2h-48h",
            "parking": "retail park com estacionamento exterior gratuito",
            "pet_friendly_zones": ["pista de treino básico", "mundo beleza", "parede de transportadoras IATA"],
            "specialties": ["hotel canino parceiro", "treino básico", "nutrição canina de grande porte"],
            "community_programs": ["Atlas Adota Porto", "Aulas demo de passeio sem tensão"],
            "story": "O Porto funciona como loja âncora de experimentação, com forte peso em cães, treino, viagem e logística de volume.",
        },
        "PTA-BRG-01": {
            "manager_name": "Carla Loureiro",
            "pickup_sla": "4h-48h",
            "parking": "estacionamento coberto do centro comercial",
            "pet_friendly_zones": ["zona aves premium", "atelier de aquários plantados", "ilha eco litter"],
            "specialties": ["aves de companhia", "aquariofilia plantada", "daycare canino"],
            "community_programs": ["Atlas Adota Braga", "Clínica de parâmetros de água"],
            "story": "Braga é a loja mais curatorial da rede, com grande profundidade em aves, água doce plantada e rotinas eco.",
        },
    }
    result = []
    for store in stores:
        clone = deepcopy(store)
        clone.update(extras[store["store_id"]])
        result.append(clone)
    return result


def validate(data: dict) -> None:
    assert len(data["products"]) == 340
    assert len(data["inventory"]) == 850
    assert len(data["services"]) == 15
    assert len(data["rag_documents"]) == 1241
    assert "brand" in data
    assert "content_pages" in data
    assert len(data["content_pages"]) == 6
    assert all(isinstance(product["reference_price_eur"], (int, float)) for product in data["products"])
    assert any(product["reference_price_eur"] == 26.99 for product in data["products"] if "Chihuahua Adult" in product["name"])
    assert any(product["reference_price_eur"] == 91.49 for product in data["products"] if "Halura" in product["name"])
    assert any(product["reference_price_eur"] == 47.99 for product in data["products"] if "Vibrant Sea" in product["name"])
    assert all(item["current_price_eur"] <= item["base_price_eur"] if item["promo_label"] != NA else item["current_price_eur"] == item["base_price_eur"] for item in data["inventory"])
    assert any(doc["doc_type"] == "product_store_offer" and doc["city"] == "Lisboa" and "Chihuahua" in doc["content"] for doc in data["rag_documents"])
    assert any(doc["doc_type"] == "service_offer" and doc["city"] == "Porto" and "Hotel Canino" in doc["title"] for doc in data["rag_documents"])
    assert any(doc["doc_type"] == "brand_info" for doc in data["rag_documents"])
    assert any(doc["doc_type"] == "store_info" and doc["city"] == "Braga" for doc in data["rag_documents"])
    assert any(doc["doc_type"] == "content_page" and doc["title"] == "Quem Somos" for doc in data["rag_documents"])


def main() -> None:
    data = load_dataset()
    products = deepcopy(data["products"])
    stores = enhance_stores(data["stores"])
    brand = build_brand()
    content_pages = build_content_pages()
    for product in products:
        product["reference_price_eur"] = compute_reference_price(product)
        product["price_band"] = price_band(product["reference_price_eur"])

    inventory = reprice_inventory(products, data["inventory"])
    rag_documents = rebuild_rag_documents(products, inventory, stores, data["services"], brand, content_pages)

    data["products"] = products
    data["stores"] = stores
    data["inventory"] = inventory
    data["rag_documents"] = rag_documents
    data["brand"] = brand
    data["content_pages"] = content_pages
    data["metadata"]["pricing_policy"] = (
        "Preços de referência específicos por produto, calibrados por categoria, marca, peso, dimensão e amostras reais do mercado PT. "
        "Porto mantém a base; Lisboa aplica sobretaxa média ~3.9%; Braga aplica ajuste médio ~-2.1%; micro-ajustes locais até cerca de ±3%."
    )
    data["metadata"]["generated_at"] = "2026-05-05"
    data["metadata"]["market_reference_date"] = "2026-05-05"
    data["metadata"]["market_price_sources"] = MARKET_PRICE_SOURCES
    data["metadata"]["jsonl_exports"] = [
        "data/petatlas_catalogo_animais_pt_v1_rag.jsonl",
        "petatlas_catalogo_animais_pt_v1_rag.jsonl",
        "public/data/petatlas_catalogo_animais_pt_v1_rag.jsonl",
    ]
    for note in [
        "Versão de preços recalibrada com pontos de ancoragem observados em retalhistas portugueses e regras de arredondamento comercial.",
        "Conteúdo institucional, identidade da marca e descrições alargadas das lojas incluídos para navegação web e RAG.",
    ]:
        if note not in data["metadata"]["notes"]:
            data["metadata"]["notes"].append(note)

    validate(data)
    save_dataset(data)
    save_jsonl(build_jsonl_lines(rag_documents))
    print("Atualizado catálogo JSON e exportado JSONL.")
    print(f"Produtos: {len(products)} | Inventário: {len(inventory)} | Docs: {len(rag_documents)}")


if __name__ == "__main__":
    main()
