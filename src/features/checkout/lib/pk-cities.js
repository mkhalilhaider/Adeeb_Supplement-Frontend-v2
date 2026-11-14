/**
 * Cities and towns suggested in the checkout city field (bundled: no request, no API key).
 * Free text is still accepted — the fee is "Karachi" or "everywhere else", decided by the
 * backend, so an unlisted town works fine.
 */
export const PK_CITIES = Object.freeze([
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Hyderabad",
  "Peshawar",
  "Quetta",
  "Gujranwala",
  "Sialkot",
  "Sargodha",
  "Bahawalpur",
  "Sukkur",
  "Larkana",
  "Abbottabad",
  "Mardan",
  "Sahiwal",
  "Okara",
  "Rahim Yar Khan",
  "Sheikhupura",
  "Jhang",
  "Dera Ghazi Khan",
  "Gujrat",
  "Kasur",
  "Mirpur Khas",
  "Nawabshah",
  "Chiniot",
  "Kamoke",
  "Mandi Bahauddin",
  "Jhelum",
  "Sadiqabad",
  "Khanewal",
  "Hafizabad",
  "Kohat",
  "Jacobabad",
  "Shikarpur",
  "Muzaffargarh",
  "Khanpur",
  "Gojra",
  "Bahawalnagar",
  "Muridke",
  "Pakpattan",
  "Jaranwala",
  "Chishtian",
  "Daska",
  "Mingora",
  "Dera Ismail Khan",
  "Vehari",
  "Kamalia",
  "Wah Cantt",
  "Taxila",
  "Attock",
  "Chakwal",
  "Mianwali",
  "Bhakkar",
  "Khushab",
  "Toba Tek Singh",
  "Narowal",
  "Lodhran",
  "Layyah",
  "Burewala",
  "Arifwala",
  "Haroonabad",
  "Kot Addu",
  "Swabi",
  "Nowshera",
  "Charsadda",
  "Mansehra",
  "Haripur",
  "Bannu",
  "Chitral",
  "Gilgit",
  "Skardu",
  "Muzaffarabad",
  "Mirpur",
  "Kotli",
  "Bagh",
  "Rawalakot",
  "Thatta",
  "Badin",
  "Dadu",
  "Khairpur",
  "Ghotki",
  "Sanghar",
  "Tando Adam",
  "Tando Allahyar",
  "Kotri",
  "Jamshoro",
  "Umerkot",
  "Hub",
  "Gwadar",
  "Turbat",
  "Khuzdar",
  "Chaman",
  "Zhob",
  "Sibi",
  "Murree",
  "Gujar Khan",
  "Hasan Abdal",
  "Wazirabad",
  "Sambrial",
  "Pasrur",
  "Shakargarh",
  "Renala Khurd",
  "Pattoki",
  "Chunian",
  "Raiwind",
  "Kharian",
  "Lalamusa",
  "Bhalwal",
  "Kabirwala",
  "Mian Channu",
  "Rajanpur",
  "Ahmedpur East",
  "Hasilpur",
  "Hunza",
  "Swat",
  "Samundri",
  "Shahdadpur",
  "Matiari",
  "Kandhkot",
  "Mirpur Mathelo",
  "Fateh Jang",
  "Talagang",
  "Pind Dadan Khan",
  "Panjgur",
  "Liaquatpur",
  "Jampur",
  "Sehwan",
  "Moro",
  "Shahkot",
  "Sangla Hill",
  "Pir Mahal",
  "Kahror Pakka",
  "Jalalpur Jattan",
  "Sarai Alamgir",
  "Chichawatni",
  "Depalpur",
  "Kot Radha Kishan",
  "Dera Murad Jamali",
  "Usta Muhammad",
]);

/** The cities shown first in the city picker (largest delivery areas). */
export const POPULAR_CITIES = Object.freeze([
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Hyderabad",
  "Peshawar",
]);

/** Short names and old names people type, lower case → the listed city. */
export const CITY_ALIASES = Object.freeze({
  khi: "Karachi",
  lhr: "Lahore",
  isb: "Islamabad",
  isl: "Islamabad",
  pindi: "Rawalpindi",
  rwp: "Rawalpindi",
  fsd: "Faisalabad",
  lyallpur: "Faisalabad",
  hyd: "Hyderabad",
  mux: "Multan",
  pesh: "Peshawar",
  "dg khan": "Dera Ghazi Khan",
  "di khan": "Dera Ismail Khan",
  ryk: "Rahim Yar Khan",
});

/** "  lahore " → "Lahore", "pindi" → "Rawalpindi"; otherwise the tidied text as typed. */
export function canonicalCity(input) {
  const text = String(input ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const lower = text.toLowerCase();
  return PK_CITIES.find((c) => c.toLowerCase() === lower) ?? CITY_ALIASES[lower] ?? text;
}

/**
 * Cities for the picker's list: popular ones first when nothing is typed; otherwise names
 * that start with the text, then names containing it, plus a nickname match ("pindi").
 * @returns {string[]}
 */
export function matchCities(query) {
  const q = String(query ?? "")
    .trim()
    .toLowerCase();
  if (!q) {
    const rest = PK_CITIES.filter((c) => !POPULAR_CITIES.includes(c)).sort((a, b) =>
      a.localeCompare(b),
    );
    return [...POPULAR_CITIES, ...rest];
  }
  const starts = [];
  const contains = [];
  for (const city of PK_CITIES) {
    const c = city.toLowerCase();
    if (c.startsWith(q) || c.split(" ").some((w) => w.startsWith(q))) starts.push(city);
    else if (c.includes(q)) contains.push(city);
  }
  const alias = Object.entries(CITY_ALIASES).find(([k]) => k.startsWith(q))?.[1];
  const result = [...starts, ...contains];
  if (alias && !result.includes(alias)) result.unshift(alias);
  return result;
}
