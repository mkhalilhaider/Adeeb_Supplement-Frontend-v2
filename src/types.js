/**
 * Shapes of backend responses, as JSDoc typedefs (editor autocomplete without TypeScript).
 * Source of truth: BACKEND_ANALYSIS.md §3. Keep in sync when the backend changes.
 */

/**
 * @typedef {object} SessionUser   From /auth/login, /auth/register, /auth/refresh, /auth/me
 * @property {string} id           Note: `id`, not `_id`
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {"customer"|"admin"} role
 * @property {"active"|"blocked"|"deleted"} accountStatus
 * @property {boolean} isEmailVerified
 */

/**
 * @typedef {object} AuthResult
 * @property {SessionUser} user
 * @property {{ accessToken: string, refreshToken: string }} tokens
 */

/**
 * @typedef {object} Address
 * @property {string} _id
 * @property {string} fullName
 * @property {string} phone
 * @property {string} addressLine1
 * @property {string} [addressLine2]
 * @property {string} city
 * @property {string} [state]
 * @property {string} postalCode
 * @property {string} country
 * @property {boolean} isDefault
 */

/**
 * @typedef {object} Category
 * @property {string} _id
 * @property {string} name
 * @property {string} slug
 * @property {string} [description]
 * @property {string} [imageUrl]
 * @property {boolean} isActive
 */

/**
 * @typedef {object} Brand
 * @property {string} _id
 * @property {string} name
 * @property {string} slug
 * @property {string} [description]
 * @property {string} [logoUrl]
 * @property {boolean} isActive
 */

/**
 * @typedef {object} ProductImage
 * @property {string} url
 * @property {string} publicId
 * @property {string} [alt]
 * @property {boolean} [isPrimary]
 */

/**
 * @typedef {object} Variant
 * @property {string} _id
 * @property {string} sku
 * @property {{ flavor?: string, weight?: string, serving?: string }} attributes
 * @property {ProductImage|null} image   Main image (may be null — fall back to images[0], then default variant)
 * @property {ProductImage[]} images
 * @property {number} price
 * @property {number|null} salePrice     Paid price is salePrice ?? price
 * @property {"PKR"} currency
 * @property {number} stockQuantity
 * @property {number} lowStockThreshold
 * @property {"active"|"out_of_stock"|"inactive"} status
 * @property {boolean} isDefault
 */

/**
 * @typedef {object} Product
 * @property {string} _id
 * @property {string} name
 * @property {string} slug
 * @property {string} description      Plain text with blank-line paragraphs
 * @property {{ _id: string, name: string, slug: string }} category
 * @property {{ _id: string, name: string, slug: string }} brand
 * @property {Variant[]} variants
 * @property {boolean} isFeatured
 * @property {"active"|"inactive"} status
 * @property {number} averageRating
 * @property {number} reviewCount
 * @property {string} metaTitle
 * @property {string} metaDescription
 * @property {string[]} keywords
 * @property {number} [unitsSold]      Only with sort=bestselling
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {object} ListMeta
 * @property {number} total
 * @property {number} page
 * @property {number} limit
 * @property {number} pages
 */

/**
 * @typedef {object} CartItem
 * @property {string} productId
 * @property {string} variantId
 * @property {string} productName
 * @property {string} [productSlug]
 * @property {{ url: string, publicId: string }|null} image
 * @property {string} sku
 * @property {{ flavor?: string, weight?: string, serving?: string }} attributes
 * @property {number} unitPrice   Snapshot at add time (not refreshed by GET /cart)
 * @property {number} quantity
 * @property {number} lineTotal
 */

/**
 * @typedef {"pending"|"confirmed"|"processing"|"shipped"|"delivered"|"cancelled"} OrderStatus
 */

/**
 * @typedef {object} Order
 * @property {string} _id
 * @property {string} orderNumber     "SUP-YYYYMMDD-NNNN"
 * @property {string|null} userId
 * @property {string} guestEmail
 * @property {CartItem[]} items
 * @property {Omit<Address, "_id"|"isDefault">} shippingAddress
 * @property {number} subtotal
 * @property {number} discount
 * @property {string} couponCode
 * @property {number} shippingFee
 * @property {number} total
 * @property {"cod"|"safepay"} paymentMethod
 * @property {"pending"|"paid"|"failed"|"refunded"} paymentStatus
 * @property {OrderStatus} orderStatus
 * @property {"pending"|"label_created"|"in_transit"|"delivered"} shipmentStatus
 * @property {string} trackingNumber
 * @property {"local_rider"|"national_courier"} deliveryType
 * @property {string} courierName
 * @property {string} notes
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export {};
