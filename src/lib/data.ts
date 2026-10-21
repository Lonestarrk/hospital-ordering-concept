// Syntetisk demodata – inga riktiga patientuppgifter. Personnumret är ett officiellt
// testpersonnummer från Skatteverket. I ett riktigt system kommer patient, kostordination
// och allergier från vårdens system och kan bara ändras av vårdpersonal – aldrig av appen.

export type DietTag = "diabetes" | "laktosfri" | "glutenfri" | "konsistensanpassad";

export const dietLabels: Record<DietTag, string> = {
  diabetes: "Diabeteskost",
  laktosfri: "Laktosfri",
  glutenfri: "Glutenfri",
  konsistensanpassad: "Lättuggad",
};

export type Patient = {
  personnummer: string;
  firstName: string;
  lastName: string;
  ward: string;
  room: string;
  bed: string;
  diet: DietTag[];
  allergies: string[];
};

const patients: Patient[] = [
  {
    personnummer: "194501202388",
    firstName: "Ingrid",
    lastName: "Andersson",
    ward: "Avdelning 12 – Geriatrik",
    room: "Rum 4",
    bed: "Säng B",
    diet: ["diabetes", "laktosfri"],
    allergies: ["Selleri"],
  },
];

export function findPatient(personnummer: string): Patient | undefined {
  return patients.find((p) => p.personnummer === personnummer);
}

export const DEMO_PERSONNUMMER = "194501202388";

export type Dish = {
  id: string;
  name: string;
  description: string;
  /** Foto i public/mat – se README för källor. */
  image: string;
  /** Beskrivning av bilden för skärmläsare. */
  imageAlt: string;
  label?: string;
  /** Ord som Ingrid kan säga för att välja rätten (se VoiceCommand i lib/voice.ts). */
  voiceWords: string[];
  /** Kostordinationer som rätten passar för. */
  suits: DietTag[];
  allergens: string[];
};

export const meal = {
  name: "Lunch",
  day: "Idag",
  servedAt: "12:00",
  orderBefore: "10:00",
};

export const dishes: Dish[] = [
  {
    id: "kalvspett",
    name: "Kalvspett med potatismos",
    description: "Möra bitar av kalv med grönsaker, potatismos och brun sås.",
    image: "/mat/kalvspett.jpg",
    imageAlt: "Kalvspett med zucchini och paprika på potatismos med brun sås",
    label: "Dagens rätt",
    voiceWords: ["kalv*", "spett*", "potatismos", "kött*"],
    suits: ["diabetes", "laktosfri"],
    allergens: [],
  },
  {
    id: "lax",
    name: "Ugnsbakad lax",
    description: "Med kokt potatis, dillsås och smörkokta morötter.",
    image: "/mat/lax.jpg",
    imageAlt: "Stekt laxfilé med citronklyfta",
    voiceWords: ["lax*", "fisk"],
    suits: ["diabetes", "laktosfri", "glutenfri"],
    allergens: ["Fisk"],
  },
  {
    id: "kycklinggryta",
    name: "Kycklinggryta med ris",
    description: "Mild gryta med paprika och grönsaker.",
    image: "/mat/kycklinggryta.jpg",
    imageAlt: "Kyckling med ris och grönsaker på tallrik",
    voiceWords: ["kyckling*", "gryta*", "ris"],
    suits: ["diabetes", "laktosfri", "glutenfri"],
    allergens: ["Selleri"],
  },
  {
    id: "soppa",
    name: "Grönsakssoppa",
    description: "Värmande soppa med bröd och pålägg. Bra om aptiten är liten.",
    image: "/mat/soppa.jpg",
    imageAlt: "Grönsakssoppa i röd skål med bröd vid sidan",
    label: "Något lätt",
    voiceWords: ["sopp*", "grönsak*"],
    suits: ["diabetes", "laktosfri", "konsistensanpassad"],
    allergens: ["Gluten"],
  },
  {
    id: "pannkakor",
    name: "Pannkakor med sylt",
    description: "Med sylt och vispad grädde.",
    image: "/mat/pannkakor.jpg",
    imageAlt: "Pannkakor med jordgubbar och vispad grädde",
    voiceWords: ["pannkak*"],
    suits: [],
    allergens: ["Ägg", "Mjölk", "Gluten"],
  },
  {
    id: "fiskgratang",
    name: "Fiskgratäng",
    description: "Med potatismos och ost.",
    image: "/mat/fiskgratang.jpg",
    imageAlt: "Gratäng med gyllene ostyta i ugnsform",
    voiceWords: ["fiskgratäng*", "gratäng*"],
    suits: ["diabetes"],
    allergens: ["Fisk", "Mjölk"],
  },
];

/**
 * En rätt passar om den uppfyller alla patientens kostordinationer och inte innehåller
 * något hon är allergisk mot. Appen filtrerar bara – den ändrar aldrig ordinationen.
 */
export function dishSuits(dish: Dish, patient: Pick<Patient, "diet" | "allergies">): boolean {
  return (
    patient.diet.every((tag) => dish.suits.includes(tag)) &&
    !dish.allergens.some((a) => patient.allergies.includes(a))
  );
}

export type Portion = "liten" | "lagom" | "stor";

export const portions: { id: Portion; name: string; hint: string }[] = [
  { id: "liten", name: "Liten", hint: "Lite aptit idag" },
  { id: "lagom", name: "Lagom", hint: "Vanlig portion" },
  { id: "stor", name: "Stor", hint: "Jag är hungrig" },
];

export const extras: { name: string; voiceWords: string[] }[] = [
  { name: "Skuren i små bitar", voiceWords: ["bitar", "skuren", "skär*"] },
  { name: "Såsen vid sidan", voiceWords: ["vid sidan"] },
  { name: "Extra sås", voiceWords: ["extra sås", "mer sås"] },
  { name: "Extra potatis eller ris", voiceWords: ["extra potatis", "extra ris", "mer potatis", "mer ris"] },
];

export type Drink = { id: string; name: string; emoji: string; voiceWords: string[]; suits: DietTag[] };

export const drinks: Drink[] = [
  { id: "vatten", name: "Vatten", emoji: "💧", voiceWords: ["vatten"], suits: ["diabetes", "laktosfri", "glutenfri", "konsistensanpassad"] },
  { id: "mjolk", name: "Laktosfri mjölk", emoji: "🥛", voiceWords: ["mjölk*"], suits: ["diabetes", "laktosfri", "glutenfri", "konsistensanpassad"] },
  { id: "lingondricka", name: "Lingondricka utan socker", emoji: "🍹", voiceWords: ["lingon*", "dricka"], suits: ["diabetes", "laktosfri", "glutenfri", "konsistensanpassad"] },
  { id: "kaffe", name: "Kaffe", emoji: "☕", voiceWords: ["kaffe"], suits: ["diabetes", "laktosfri", "glutenfri", "konsistensanpassad"] },
  { id: "saft", name: "Saft", emoji: "🧃", voiceWords: ["saft*"], suits: ["laktosfri", "glutenfri", "konsistensanpassad"] },
];

export function drinkSuits(drink: Drink, diet: DietTag[]): boolean {
  return diet.every((tag) => drink.suits.includes(tag));
}

// ---------- Omdömen i efterhand ----------

export type Rating = "upp" | "ner";
export type Eaten = "allt" | "halften" | "lite" | "inget";

export type ServedMeal = {
  id: string;
  dishId: string;
  /** T.ex. "Gårdagens middag". */
  label: string;
  rating?: Rating;
  reasons: string[];
  eaten?: Eaten;
  /** Ingrid valde att hoppa över omdömet. */
  skipped?: boolean;
};

export const reasonsUp: { name: string; voiceWords: string[] }[] = [
  { name: "God smak", voiceWords: ["smak*", "god", "gott"] },
  { name: "Lagom portion", voiceWords: ["lagom"] },
  { name: "Varm och fin", voiceWords: ["varm*"] },
  { name: "Som hemma", voiceWords: ["hemma"] },
];

export const reasonsDown: { name: string; voiceWords: string[]; tellStaff?: boolean }[] = [
  { name: "För kall", voiceWords: ["kall*"] },
  { name: "För salt", voiceWords: ["salt*"] },
  { name: "För torr", voiceWords: ["torr*"] },
  { name: "För stor portion", voiceWords: ["för stor", "för mycket"] },
  { name: "Svårt att tugga", voiceWords: ["tugga", "seg*", "hård*"], tellStaff: true },
  { name: "Smakade inte", voiceWords: ["smakade inte", "äcklig*", "inte god*"] },
];

export const eatenOptions: { id: Eaten; name: string; voiceWords: string[] }[] = [
  { id: "allt", name: "Allt", voiceWords: ["allt", "alltihop", "upp allt"] },
  { id: "halften", name: "Hälften", voiceWords: ["hälften", "halva"] },
  { id: "lite", name: "Lite", voiceWords: ["lite", "några tuggor"] },
  { id: "inget", name: "Inget", voiceWords: ["inget", "ingenting"] },
];

/** Syntetisk historik: måltider Ingrid redan har fått serverade. */
export const servedHistory: Record<string, ServedMeal[]> = {
  "194501202388": [
    { id: "middag-igar", dishId: "kalvspett", label: "Gårdagens middag", reasons: [] },
  ],
};

// ---------- Smak och önskerätter ----------

export type FoodCategory = { id: string; name: string; emoji: string; voiceWords: string[] };

export const foodCategories: FoodCategory[] = [
  { id: "husmanskost", name: "Husmanskost", emoji: "🥘", voiceWords: ["husman*", "svensk*", "vanlig mat"] },
  { id: "fisk", name: "Fisk", emoji: "🐟", voiceWords: ["fisk*", "lax*"] },
  { id: "kyckling", name: "Kyckling", emoji: "🍗", voiceWords: ["kyckling*", "fågel"] },
  { id: "kott", name: "Kött", emoji: "🥩", voiceWords: ["kött*", "biff*"] },
  { id: "vegetariskt", name: "Vegetariskt", emoji: "🥦", voiceWords: ["vegetari*", "grönsak*", "veg*"] },
  { id: "soppor", name: "Soppor", emoji: "🥣", voiceWords: ["sopp*"] },
  { id: "kryddigt", name: "Kryddig mat", emoji: "🌶️", voiceWords: ["krydd*", "stark*"] },
  { id: "pasta", name: "Pasta och ris", emoji: "🍝", voiceWords: ["pasta", "ris", "makaron*"] },
  { id: "sott", name: "Efterrätter", emoji: "🍰", voiceWords: ["efterrätt*", "dessert*", "sött", "kaka*"] },
];

/** Vilka kategorier varje rätt på menyn hör till. */
export const dishCategories: Record<string, string[]> = {
  kalvspett: ["husmanskost", "kott"],
  lax: ["fisk"],
  kycklinggryta: ["kyckling", "pasta"],
  soppa: ["soppor", "vegetariskt"],
  pannkakor: ["husmanskost", "sott"],
  fiskgratang: ["fisk", "husmanskost"],
};

export type WishDish = { id: string; name: string; emoji: string; voiceWords: string[] };

/** Klassiska rätter som patienten kan önska sig – underlag för framtida menyer. */
export const wishDishes: WishDish[] = [
  { id: "kottbullar", name: "Köttbullar med potatismos", emoji: "🍽️", voiceWords: ["köttbull*"] },
  { id: "pannbiff", name: "Pannbiff med lök", emoji: "🧅", voiceWords: ["pannbiff*"] },
  { id: "kaldolmar", name: "Kåldolmar", emoji: "🥬", voiceWords: ["kåldolm*"] },
  { id: "artsoppa", name: "Ärtsoppa", emoji: "🫛", voiceWords: ["ärtsopp*", "ärter"] },
  { id: "pytt", name: "Pytt i panna", emoji: "🍳", voiceWords: ["pytt*"] },
  { id: "raggmunk", name: "Raggmunk med fläsk", emoji: "🥔", voiceWords: ["raggmunk*"] },
  { id: "kalops", name: "Kalops", emoji: "🍲", voiceWords: ["kalops*"] },
  { id: "makaroner", name: "Stuvade makaroner", emoji: "🧀", voiceWords: ["makaron*"] },
  { id: "fiskbullar", name: "Fiskbullar i hummersås", emoji: "🐠", voiceWords: ["fiskbull*"] },
  { id: "laxpudding", name: "Laxpudding", emoji: "🐟", voiceWords: ["laxpudding*"] },
  { id: "ugnspannkaka", name: "Ugnspannkaka", emoji: "🥞", voiceWords: ["ugnspannkak*"] },
  { id: "kroppkakor", name: "Kroppkakor", emoji: "🥟", voiceWords: ["kroppkak*"] },
];

export type TasteProfile = { likes: string[]; dislikes: string[]; favorites: string[] };

export const emptyTaste: TasteProfile = { likes: [], dislikes: [], favorites: [] };
