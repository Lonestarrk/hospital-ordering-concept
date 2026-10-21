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
  emoji: string;
  color: string;
  label?: string;
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
    id: "kottbullar",
    name: "Köttbullar med potatismos",
    description: "Med gräddsås och rårörda lingon. Som hemma.",
    emoji: "🍽️",
    color: "#F6E3CF",
    label: "Klassiker",
    suits: ["diabetes", "laktosfri"],
    allergens: ["Ägg", "Mjölkprotein"],
  },
  {
    id: "lax",
    name: "Ugnsbakad lax",
    description: "Med kokt potatis, dillsås och smörkokta morötter.",
    emoji: "🐟",
    color: "#F9DCD4",
    suits: ["diabetes", "laktosfri", "glutenfri"],
    allergens: ["Fisk"],
  },
  {
    id: "kycklinggryta",
    name: "Kycklinggryta med ris",
    description: "Mild gryta med paprika och grönsaker.",
    emoji: "🍛",
    color: "#FBEBC6",
    suits: ["diabetes", "laktosfri", "glutenfri"],
    allergens: ["Selleri"],
  },
  {
    id: "soppa",
    name: "Grönsakssoppa",
    description: "Värmande soppa med bröd och pålägg. Bra om aptiten är liten.",
    emoji: "🥣",
    color: "#DDEBD3",
    label: "Något lätt",
    suits: ["diabetes", "laktosfri", "konsistensanpassad"],
    allergens: ["Gluten"],
  },
  {
    id: "pannkakor",
    name: "Pannkakor med sylt",
    description: "Med vispad grädde.",
    emoji: "🥞",
    color: "#F6E7C1",
    suits: [],
    allergens: ["Ägg", "Mjölk", "Gluten"],
  },
  {
    id: "fiskgratang",
    name: "Fiskgratäng",
    description: "Med potatismos och ost.",
    emoji: "🧀",
    color: "#F1E6D6",
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

export const extras = [
  "Skuren i små bitar",
  "Extra sås",
  "Utan lingon",
  "Såsen vid sidan",
];

export type Drink = { id: string; name: string; emoji: string; suits: DietTag[] };

export const drinks: Drink[] = [
  { id: "vatten", name: "Vatten", emoji: "💧", suits: ["diabetes", "laktosfri", "glutenfri", "konsistensanpassad"] },
  { id: "mjolk", name: "Laktosfri mjölk", emoji: "🥛", suits: ["diabetes", "laktosfri", "glutenfri", "konsistensanpassad"] },
  { id: "lingondricka", name: "Lingondricka utan socker", emoji: "🍹", suits: ["diabetes", "laktosfri", "glutenfri", "konsistensanpassad"] },
  { id: "kaffe", name: "Kaffe", emoji: "☕", suits: ["diabetes", "laktosfri", "glutenfri", "konsistensanpassad"] },
  { id: "saft", name: "Saft", emoji: "🧃", suits: ["laktosfri", "glutenfri", "konsistensanpassad"] },
];

export function drinkSuits(drink: Drink, diet: DietTag[]): boolean {
  return diet.every((tag) => drink.suits.includes(tag));
}
