import { normalizePkPhone } from "../../../lib/format";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const filled = (v, min = 1) => String(v ?? "").trim().length >= min;

/**
 * Field errors for the current values. The address fields only count when typing a new
 * address (a logged-in shopper can pick a saved one instead).
 */
export function validateCheckout(v, { loggedIn, savedIds }) {
  const usingSaved = loggedIn && savedIds.includes(v.addressId);
  const errors = {};
  if (!loggedIn || !usingSaved) {
    if (!filled(v.phone)) errors.phone = "Enter your mobile number";
    else if (!normalizePkPhone(v.phone))
      errors.phone = "Enter a Pakistani mobile number, like 0300 1234567";
  }
  if (!loggedIn && filled(v.email) && !EMAIL.test(String(v.email).trim()))
    errors.email = "Enter a valid email, or leave it empty";
  if (!usingSaved) {
    if (!filled(v.fullName, 2)) errors.fullName = "Enter your full name";
    if (!filled(v.addressLine1, 5)) errors.addressLine1 = "Add your house number, street and area";
    if (!filled(v.city, 2)) errors.city = "Enter your city";
  }
  return errors;
}
