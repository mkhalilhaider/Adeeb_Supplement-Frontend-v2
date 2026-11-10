import { api, getData } from "../../lib/api";

/**
 * Place a cash-on-delivery order. Prices, discount and delivery are recomputed by the backend;
 * the returned order is the source of truth for the confirmation page.
 * @param {object} body  see buildCheckoutBody
 */
export const placeOrder = (body) => getData("/orders/checkout", { method: "POST", body });

/** Save checkout progress (abandoned-checkout follow-ups). Fire-and-forget. */
export const saveCheckoutProgress = (sessionKey, body) =>
  api.put(`/abandoned-checkouts/${encodeURIComponent(sessionKey)}`, body);

export { fetchAddresses } from "../account/api";
