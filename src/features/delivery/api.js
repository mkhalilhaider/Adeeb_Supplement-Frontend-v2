import { getData } from "../../lib/api";

/**
 * Delivery fee for a city and order subtotal. The backend is the only place fees are decided.
 * @returns {Promise<{ zone: "karachi"|"other", shippingFee: number, isFree: boolean, freeDeliveryThreshold: number }>}
 */
export const fetchDeliveryQuote = ({ city, subtotal = 0 }, { signal } = {}) =>
  getData("/delivery/quote", { query: { city, subtotal }, signal });
