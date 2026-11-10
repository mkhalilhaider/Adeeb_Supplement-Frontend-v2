import { env } from "../../../config/env";
import { productJsonLd as productJsonLdFor } from "./product-seo-core";

export { productMeta, socialImage } from "./product-seo-core";

/** schema.org Product + BreadcrumbList for this site (see product-seo-core). */
export const productJsonLd = (product) => productJsonLdFor(product, env.siteUrl);
