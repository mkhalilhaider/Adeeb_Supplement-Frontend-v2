/**
 * Product form ⇄ API body. Kept pure (and tested): the backend keeps a variant's SKU only when
 * its `_id` is sent back, so existing variants must round-trip their ids.
 */

const num = (v) => (v === "" || v == null ? null : Number(v));

export function emptyVariant(isDefault = false) {
  return {
    key: crypto.randomUUID?.() ?? String(Math.random()),
    _id: undefined,
    sku: "",
    flavor: "",
    weight: "",
    serving: "",
    price: "",
    salePrice: "",
    stockQuantity: "0",
    lowStockThreshold: "5",
    isDefault,
    hidden: false,
    image: null,
    images: [],
  };
}

/** API product → editable form state (strings for inputs). */
export function productToForm(product) {
  if (!product) {
    return {
      name: "",
      description: "",
      category: "",
      brand: "",
      isFeatured: false,
      live: true,
      metaTitle: "",
      metaDescription: "",
      keywords: "",
      variants: [emptyVariant(true)],
    };
  }
  return {
    name: product.name ?? "",
    description: product.description ?? "",
    category: product.category?._id ?? product.category ?? "",
    brand: product.brand?._id ?? product.brand ?? "",
    isFeatured: Boolean(product.isFeatured),
    live: product.status !== "inactive",
    metaTitle: product.metaTitle ?? "",
    metaDescription: product.metaDescription ?? "",
    keywords: Array.isArray(product.keywords)
      ? product.keywords.join(", ")
      : (product.keywords ?? ""),
    variants: (product.variants ?? []).map((v) => ({
      key: String(v._id),
      _id: v._id,
      sku: v.sku ?? "",
      flavor: v.attributes?.flavor ?? "",
      weight: v.attributes?.weight ?? "",
      serving: v.attributes?.serving ?? "",
      price: v.price != null ? String(v.price) : "",
      salePrice: v.salePrice != null ? String(v.salePrice) : "",
      stockQuantity: String(v.stockQuantity ?? 0),
      lowStockThreshold: String(v.lowStockThreshold ?? 5),
      isDefault: Boolean(v.isDefault),
      hidden: v.status === "inactive",
      image: v.image ?? null,
      images: v.images ?? [],
    })),
  };
}

/** @returns {Record<string, string>} field → message ("variants.2.price" for variant fields) */
export function validateProductForm(form) {
  const errors = {};
  if (form.name.trim().length < 3) errors.name = "Enter the product name";
  if (form.description.trim().length < 10)
    errors.description = "Add a description (a few sentences)";
  if (!form.category) errors.category = "Choose a category";
  if (!form.brand) errors.brand = "Choose a brand";
  if (form.variants.length === 0) errors.variants = "Add at least one variant";
  form.variants.forEach((v, i) => {
    const price = num(v.price);
    const sale = num(v.salePrice);
    const stock = num(v.stockQuantity);
    if (!(price > 0)) errors[`variants.${i}.price`] = "Price must be above 0";
    if (sale != null && !(sale > 0 && sale < price))
      errors[`variants.${i}.salePrice`] = "Sale price must be below the price";
    if (stock == null || !Number.isInteger(stock) || stock < 0)
      errors[`variants.${i}.stockQuantity`] = "Whole number, 0 or more";
  });
  const labels = form.variants.map((v) =>
    [v.flavor, v.weight, v.serving].map((s) => s.trim().toLowerCase()).join("|"),
  );
  if (new Set(labels).size !== labels.length)
    errors.variants = "Two variants have the same flavour, weight and servings";
  return errors;
}

/** Form state → POST/PATCH body. Exactly one default variant; ids kept for existing ones. */
export function formToBody(form) {
  const defaultIndex = Math.max(
    0,
    form.variants.findIndex((v) => v.isDefault),
  );
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    category: form.category,
    brand: form.brand,
    isFeatured: form.isFeatured,
    status: form.live ? "active" : "inactive",
    metaTitle: form.metaTitle.trim(),
    metaDescription: form.metaDescription.trim(),
    keywords: form.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    variants: form.variants.map((v, i) => {
      const stock = Number(v.stockQuantity);
      return {
        ...(v._id ? { _id: v._id } : {}),
        attributes: {
          flavor: v.flavor.trim(),
          weight: v.weight.trim(),
          serving: v.serving.trim(),
        },
        price: Number(v.price),
        salePrice: num(v.salePrice),
        stockQuantity: stock,
        lowStockThreshold: num(v.lowStockThreshold) ?? 5,
        isDefault: i === defaultIndex,
        status: v.hidden ? "inactive" : stock > 0 ? "active" : "out_of_stock",
        image: v.image ?? null,
        images: v.images ?? [],
      };
    }),
  };
}
