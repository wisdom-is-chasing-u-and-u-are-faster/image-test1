// High-Cardinality Product Catalog & Shade Matrix Data (ARCH-1429)

const SHADES = [
  // FAIR SHADES
  { variant_id: "AB-FDN-100W", name: "Aura Glow 100W", hex: "#fae7d0", undertone: "WARM", finish: "DEWY", depth: "FAIR", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-110C", name: "Aura Glow 110C", hex: "#f9eae1", undertone: "COOL", finish: "DEWY", depth: "FAIR", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-115N", name: "Aura Glow 115N", hex: "#f8e6dc", undertone: "NEUTRAL", finish: "MATTE", depth: "FAIR", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-120N", name: "Aura Glow 120N", hex: "#f7e5da", undertone: "NEUTRAL", finish: "DEWY", depth: "FAIR", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-125W", name: "Aura Glow 125W", hex: "#f6e2ce", undertone: "WARM", finish: "SATIN", depth: "FAIR", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-130W", name: "Aura Glow 130W", hex: "#f5dfd2", undertone: "WARM", finish: "DEWY", depth: "FAIR", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-135C", name: "Aura Glow 135C", hex: "#f4dcce", undertone: "COOL", finish: "MATTE", depth: "FAIR", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-140N", name: "Aura Glow 140N", hex: "#f3d9cb", undertone: "NEUTRAL", finish: "DEWY", depth: "FAIR", price: 45.00, in_stock: true, fill_volume_ml: 30 },

  // LIGHT SHADES
  { variant_id: "AB-FDN-200W", name: "Aura Glow 200W", hex: "#f1d4be", undertone: "WARM", finish: "DEWY", depth: "LIGHT", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-205C", name: "Aura Glow 205C", hex: "#f0d1bd", undertone: "COOL", finish: "SATIN", depth: "LIGHT", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-210N", name: "Aura Glow 210N", hex: "#eecfb7", undertone: "NEUTRAL", finish: "MATTE", depth: "LIGHT", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-215O", name: "Aura Glow 215O", hex: "#eccbb4", undertone: "OLIVE", finish: "DEWY", depth: "LIGHT", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-220W", name: "Aura Glow 220W", hex: "#eac7af", undertone: "WARM", finish: "DEWY", depth: "LIGHT", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-225C", name: "Aura Glow 225C", hex: "#e8c3ab", undertone: "COOL", finish: "SATIN", depth: "LIGHT", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-230N", name: "Aura Glow 230N", hex: "#e6bfa6", undertone: "NEUTRAL", finish: "DEWY", depth: "LIGHT", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-235W", name: "Aura Glow 235W", hex: "#e4bba2", undertone: "WARM", finish: "MATTE", depth: "LIGHT", price: 45.00, in_stock: true, fill_volume_ml: 30 },

  // MEDIUM SHADES
  { variant_id: "AB-FDN-300W", name: "Aura Glow 300W", hex: "#dfb499", undertone: "WARM", finish: "DEWY", depth: "MEDIUM", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-305C", name: "Aura Glow 305C", hex: "#ddb095", undertone: "COOL", finish: "MATTE", depth: "MEDIUM", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-310N", name: "Aura Glow 310N", hex: "#dbac91", undertone: "NEUTRAL", finish: "DEWY", depth: "MEDIUM", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-315O", name: "Aura Glow 315O", hex: "#d8a78c", undertone: "OLIVE", finish: "SATIN", depth: "MEDIUM", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-320W", name: "Aura Glow 320W", hex: "#d5a388", undertone: "WARM", finish: "DEWY", depth: "MEDIUM", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-325C", name: "Aura Glow 325C", hex: "#d29f84", undertone: "COOL", finish: "MATTE", depth: "MEDIUM", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-330N", name: "Aura Glow 330N", hex: "#cf9a7f", undertone: "NEUTRAL", finish: "DEWY", depth: "MEDIUM", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-335W", name: "Aura Glow 335W", hex: "#cb957b", undertone: "WARM", finish: "SATIN", depth: "MEDIUM", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-340O", name: "Aura Glow 340O", hex: "#c79177", undertone: "OLIVE", finish: "DEWY", depth: "MEDIUM", price: 45.00, in_stock: true, fill_volume_ml: 30 },

  // TAN SHADES
  { variant_id: "AB-FDN-400W", name: "Aura Glow 400W", hex: "#c28b71", undertone: "WARM", finish: "DEWY", depth: "TAN", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-405C", name: "Aura Glow 405C", hex: "#be866d", undertone: "COOL", finish: "MATTE", depth: "TAN", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-410N", name: "Aura Glow 410N", hex: "#ba8169", undertone: "NEUTRAL", finish: "DEWY", depth: "TAN", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-415O", name: "Aura Glow 415O", hex: "#b57c64", undertone: "OLIVE", finish: "SATIN", depth: "TAN", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-420W", name: "Aura Glow 420W", hex: "#b07760", undertone: "WARM", finish: "DEWY", depth: "TAN", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-425C", name: "Aura Glow 425C", hex: "#ac725c", undertone: "COOL", finish: "MATTE", depth: "TAN", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-430N", name: "Aura Glow 430N", hex: "#a76d58", undertone: "NEUTRAL", finish: "DEWY", depth: "TAN", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-435W", name: "Aura Glow 435W", hex: "#a26854", undertone: "WARM", finish: "SATIN", depth: "TAN", price: 45.00, in_stock: true, fill_volume_ml: 30 },

  // DEEP SHADES
  { variant_id: "AB-FDN-500W", name: "Aura Glow 500W", hex: "#9b614e", undertone: "WARM", finish: "DEWY", depth: "DEEP", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-505C", name: "Aura Glow 505C", hex: "#955c4a", undertone: "COOL", finish: "MATTE", depth: "DEEP", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-510N", name: "Aura Glow 510N", hex: "#905746", undertone: "NEUTRAL", finish: "DEWY", depth: "DEEP", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-515O", name: "Aura Glow 515O", hex: "#8a5242", undertone: "OLIVE", finish: "SATIN", depth: "DEEP", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-520W", name: "Aura Glow 520W", hex: "#854d3e", undertone: "WARM", finish: "DEWY", depth: "DEEP", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-525C", name: "Aura Glow 525C", hex: "#80483a", undertone: "COOL", finish: "MATTE", depth: "DEEP", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-580N", name: "Aura Glow 580N", hex: "#7b4f3a", undertone: "NEUTRAL", finish: "DEWY", depth: "DEEP", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-590C", name: "Aura Glow 590C", hex: "#6a412e", undertone: "COOL", finish: "DEWY", depth: "DEEP", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-600W", name: "Aura Glow 600W", hex: "#5c3624", undertone: "WARM", finish: "DEWY", depth: "DEEP", price: 45.00, in_stock: true, fill_volume_ml: 30 },

  // RICH SHADES
  { variant_id: "AB-FDN-610N", name: "Aura Glow 610N", hex: "#54301f", undertone: "NEUTRAL", finish: "MATTE", depth: "RICH", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-615W", name: "Aura Glow 615W", hex: "#4d2b1c", undertone: "WARM", finish: "DEWY", depth: "RICH", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-620C", name: "Aura Glow 620C", hex: "#452619", undertone: "COOL", finish: "SATIN", depth: "RICH", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-625N", name: "Aura Glow 625N", hex: "#3e2115", undertone: "NEUTRAL", finish: "DEWY", depth: "RICH", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-630W", name: "Aura Glow 630W", hex: "#361c12", undertone: "WARM", finish: "MATTE", depth: "RICH", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-635C", name: "Aura Glow 635C", hex: "#32190f", undertone: "COOL", finish: "DEWY", depth: "RICH", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-640N", name: "Aura Glow 640N", hex: "#2b150c", undertone: "NEUTRAL", finish: "SATIN", depth: "RICH", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-645O", name: "Aura Glow 645O", hex: "#28130a", undertone: "OLIVE", finish: "DEWY", depth: "RICH", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-650W", name: "Aura Glow 650W", hex: "#220f07", undertone: "WARM", finish: "MATTE", depth: "RICH", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-655C", name: "Aura Glow 655C", hex: "#1c0b05", undertone: "COOL", finish: "DEWY", depth: "RICH", price: 45.00, in_stock: true, fill_volume_ml: 30 },
  { variant_id: "AB-FDN-660N", name: "Aura Glow 660N", hex: "#170803", undertone: "NEUTRAL", finish: "SATIN", depth: "RICH", price: 45.00, in_stock: true, fill_volume_ml: 30 },

  // DISCONTINUED VARIANTS WITH ACTIVE EQUIVALENTS
  {
    variant_id: "AB-FDN-LEGACY-01",
    name: "Aura Glow Legacy 01 (Discontinued)",
    hex: "#fae6cf",
    undertone: "WARM",
    finish: "DEWY",
    depth: "FAIR",
    price: 45.00,
    in_stock: false,
    is_discontinued: true,
    active_equivalent_variant_id: "AB-FDN-100W",
    recommended_active_shade: "Aura Glow 100W",
    fill_volume_ml: 30
  },
  {
    variant_id: "AB-FDN-LEGACY-02",
    name: "Aura Glow Legacy 02 (Discontinued)",
    hex: "#dfb398",
    undertone: "WARM",
    finish: "DEWY",
    depth: "MEDIUM",
    price: 45.00,
    in_stock: false,
    is_discontinued: true,
    active_equivalent_variant_id: "AB-FDN-300W",
    recommended_active_shade: "Aura Glow 300W",
    fill_volume_ml: 30
  }
];

const PRODUCTS = [
  {
    id: "aura-glow-foundation",
    name: "Aura Glow Foundation",
    tagline: "A weightless, buildable, medium-coverage foundation with a natural, luminous finish.",
    category: "Complexion",
    price: 45.00,
    subscription_discount_percent: 15,
    subscription_price: 38.25,
    subscription_eligible: true,
    rating: 4.8,
    reviews_count: 1420,
    images: [
      "https://placehold.co/600x600/F8F5F2/2d2d2d?text=Aura+Glow",
      "https://placehold.co/600x600/F8F5F2/2d2d2d?text=Swatch",
      "https://placehold.co/600x600/F8F5F2/2d2d2d?text=Texture",
      "https://placehold.co/600x600/F8F5F2/2d2d2d?text=Model"
    ],
    shades_count: SHADES.length,
    shades: SHADES
  },
  {
    id: "matte-velvet-lipstick",
    name: "Matte Velvet Lipstick",
    tagline: "Hydrating, long-wearing matte lipstick infused with rosehip oil and vitamin E.",
    category: "Lips",
    price: 28.00,
    subscription_discount_percent: 15,
    subscription_price: 23.80,
    subscription_eligible: true,
    rating: 4.9,
    reviews_count: 890,
    images: ["https://placehold.co/400x500/F8F5F2/2d2d2d?text=Matte+Velvet"],
    shades: [
      { variant_id: "LIP-VELVET-CRIMSON", name: "Crimson", hex: "#9E1B32", price: 28.00, in_stock: true },
      { variant_id: "LIP-VELVET-NUDE", name: "Velvet Nude", hex: "#C48A7A", price: 28.00, in_stock: true },
      { variant_id: "LIP-VELVET-BERRY", name: "Berry Plum", hex: "#6C244C", price: 28.00, in_stock: true }
    ]
  },
  {
    id: "radiant-creamy-concealer",
    name: "Radiant Creamy Concealer",
    tagline: "All-day wear, crease-proof brightening concealer that diminishes dark circles.",
    category: "Complexion",
    price: 30.00,
    subscription_discount_percent: 15,
    subscription_price: 25.50,
    subscription_eligible: true,
    rating: 4.7,
    reviews_count: 630,
    images: ["https://placehold.co/400x500/F8F5F2/2d2d2d?text=Radiant+Concealer"]
  },
  {
    id: "luminous-silk-primer",
    name: "Luminous Silk Primer",
    tagline: "Hydrating and pore-minimizing serum primer for an airbrushed canvas.",
    category: "Skincare / Primer",
    price: 38.00,
    subscription_discount_percent: 15,
    subscription_price: 32.30,
    subscription_eligible: true,
    rating: 4.8,
    reviews_count: 410,
    images: ["https://placehold.co/400x500/F8F5F2/2d2d2d?text=Luminous+Primer"]
  }
];

module.exports = {
  SHADES,
  PRODUCTS
};
