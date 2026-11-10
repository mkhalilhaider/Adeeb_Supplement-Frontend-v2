import { getData } from "../../lib/api";

/** Full profile (includes authProvider: "local" | "google" | "local_google"). */
export const fetchProfile = ({ signal } = {}) => getData("/users/profile", { signal });

/** Only first and last name can change; email is fixed. */
export const updateProfile = ({ firstName, lastName }) =>
  getData("/users/profile", { method: "PATCH", body: { firstName, lastName } });

/** Signs out every device on success (the backend clears all sessions). */
export const changePassword = ({ currentPassword, newPassword }) =>
  getData("/users/password", { method: "PATCH", body: { currentPassword, newPassword } });

export const fetchAddresses = ({ signal } = {}) => getData("/users/addresses", { signal });

/** postalCode and country are required here (unlike checkout). First address becomes default. */
export const addAddress = (address) =>
  getData("/users/addresses", { method: "POST", body: address });

/** Only address fields are accepted (unknown keys → 400). isDefault:true unsets the others. */
export const updateAddress = (id, changes) =>
  getData(`/users/addresses/${encodeURIComponent(id)}`, { method: "PATCH", body: changes });

/** Deleting the default promotes another address. */
export const deleteAddress = (id) =>
  getData(`/users/addresses/${encodeURIComponent(id)}`, { method: "DELETE" });

/** Query keys for the account area; every query using them is marked private (dropped on logout). */
export const accountKeys = {
  profile: ["account", "profile"],
  addresses: ["account", "addresses"],
  orders: ["account", "orders"],
  order: (id) => ["account", "order", id],
};
