import { normalizePkPhone } from "../../../lib/format";
import { canonicalCity } from "../../checkout/lib/pk-cities";

/** @typedef {{ fullName: string, phone: string, addressLine1: string, addressLine2: string, city: string, postalCode: string }} AddressValues */

/** Form values for a saved address (or an empty form). */
export function addressFormValues(address) {
  return {
    fullName: address?.fullName ?? "",
    phone: address?.phone ?? "",
    addressLine1: address?.addressLine1 ?? "",
    addressLine2: address?.addressLine2 ?? "",
    city: address?.city ?? "",
    postalCode: address?.postalCode ?? "",
  };
}

/** @param {AddressValues} v */
export function validateAddress(v) {
  const errors = {};
  if (v.fullName.trim().length < 2) errors.fullName = "Enter the full name for delivery";
  if (!v.phone.trim()) errors.phone = "Enter a mobile number";
  else if (!normalizePkPhone(v.phone))
    errors.phone = "Enter a Pakistani mobile number, like 0300 1234567";
  if (v.addressLine1.trim().length < 5)
    errors.addressLine1 = "Add the house number, street and area";
  if (v.city.trim().length < 2) errors.city = "Enter the city";
  // The backend requires a postal code for saved addresses (not at checkout).
  if (!/^\d{5}$/.test(v.postalCode.trim())) errors.postalCode = "Enter the 5-digit postal code";
  return errors;
}

/**
 * Request body for POST/PATCH /users/addresses: only the fields the backend accepts.
 * @param {AddressValues} v
 */
export function addressBody(v) {
  return {
    fullName: v.fullName.trim(),
    phone: normalizePkPhone(v.phone) ?? v.phone.trim(),
    addressLine1: v.addressLine1.trim(),
    addressLine2: v.addressLine2.trim(),
    city: canonicalCity(v.city),
    postalCode: v.postalCode.trim(),
    country: "Pakistan",
  };
}
