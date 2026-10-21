// Syntetisk demodata – inga riktiga patientuppgifter. Personnumret är ett officiellt
// testpersonnummer från Skatteverket. I ett riktigt system kommer patient, kostordination
// och allergier från vårdens system och kan bara ändras av vårdpersonal – aldrig av appen.

/** Specialkoster som sjukhuset erbjuder. En rätt anger vilka den uppfyller. */
export type DietTag = "diabetes" | "laktosfri" | "glutenfri" | "vegetarisk";

export const dietLabels: Record<DietTag, string> = {
  diabetes: "Diabeteskost",
  laktosfri: "Laktosfri",
  glutenfri: "Glutenfri",
  vegetarisk: "Vegetarisk",
};

/** Konsistens enligt sjukhusets konsistensanpassade kost. Patienten ordineras en nivå. */
export type Consistency = "normal" | "hackad" | "grovpate" | "timbal" | "gele" | "flytande";

export const consistencyLabels: Record<Consistency, string> = {
  normal: "Normal",
  hackad: "Hackad",
  grovpate: "Grov paté",
  timbal: "Timbal",
  gele: "Gelé",
  flytande: "Flytande",
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
  /** Ordinerad konsistens – rätter med annan konsistens kan inte beställas. */
  consistency: Consistency;
  /** Sjuksköterskan som har patienten idag – får hjälp-signaler och uppföljningar. */
  nurse: string;
};

const patients: Patient[] = [
  {
    personnummer: "194803022328",
    firstName: "Ingrid",
    lastName: "Andersson",
    ward: "Avdelning 12 – Kirurgi",
    room: "Rum 4",
    bed: "Säng B",
    diet: ["diabetes", "laktosfri"],
    allergies: ["Selleri"],
    consistency: "normal",
    nurse: "Anna",
  },
];

export function findPatient(personnummer: string): Patient | undefined {
  return patients.find((p) => p.personnummer === personnummer);
}

export const DEMO_PERSONNUMMER = "194803022328";

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
  consistency: Consistency;
  /** Måltider rätten finns på. */
  occasions: OccasionId[];
};

// ---------- Måltider ----------

export type OccasionId = "frukost" | "lunch" | "fika" | "middag" | "tilltugg";

export type Occasion = {
  id: OccasionId;
  name: string;
  emoji: string;
  /** Bild på kortet där man väljer måltid. */
  image: string;
  /** Serveringstid "HH:MM". Saknas för tilltugg, som kan beställas när som helst. */
  servedAt?: string;
  voiceWords: string[];
};

export const occasions: Occasion[] = [
  { id: "frukost", name: "Frukost", emoji: "🌅", image: "/mat/grot.jpg", servedAt: "08:00", voiceWords: ["frukost*"] },
  { id: "lunch", name: "Lunch", emoji: "🍽️", image: "/mat/kalvspett.jpg", servedAt: "12:00", voiceWords: ["lunch*"] },
  { id: "fika", name: "Fika", emoji: "☕", image: "/mat/muffin.jpg", servedAt: "14:30", voiceWords: ["fika*", "kaffe"] },
  { id: "middag", name: "Middag", emoji: "🌙", image: "/mat/lax.jpg", servedAt: "17:30", voiceWords: ["middag*", "kvällsmat"] },
  { id: "tilltugg", name: "Tilltugg", emoji: "🍎", image: "/mat/frukt.jpg", voiceWords: ["tilltugg*", "mellanmål*", "något litet", "snacks"] },
];

/** Låstid: måltider måste beställas så här många timmar innan de serveras. */
export const LOCK_HOURS = 2;
/** Tilltugg kommer ungefär så här snabbt. */
export const SNACK_MINUTES = 30;

export const dishes: Dish[] = [
  {
    id: "kalvspett",
    name: "Kalvspett med potatismos",
    description: "Möra bitar av kalv med grönsaker, potatismos och brun sås.",
    image: "/mat/kalvspett.jpg",
    imageAlt: "Kalvspett med zucchini och paprika på potatismos med brun sås",
    label: "Dagens rätt",
    voiceWords: ["kalv*", "spett*", "potatismos"],
    suits: ["diabetes", "laktosfri"],
    allergens: [],
    consistency: "normal",
    occasions: ["lunch", "middag"],
  },
  {
    id: "lax",
    name: "Ugnsbakad lax",
    description: "Med kokt potatis, dillsås och smörkokta morötter.",
    image: "/mat/lax.jpg",
    imageAlt: "Stekt laxfilé med citronklyfta",
    voiceWords: ["lax*"],
    suits: ["diabetes", "laktosfri", "glutenfri"],
    allergens: ["Fisk"],
    consistency: "normal",
    occasions: ["lunch", "middag"],
  },
  {
    id: "soppa",
    name: "Grönsakssoppa",
    description: "Värmande soppa med bröd och pålägg. Bra om aptiten är liten.",
    image: "/mat/soppa.jpg",
    imageAlt: "Grönsakssoppa i röd skål med bröd vid sidan",
    label: "Något lätt",
    voiceWords: ["grönsakssopp*", "grönsak*"],
    suits: ["diabetes", "laktosfri"],
    allergens: ["Gluten"],
    consistency: "normal",
    occasions: ["lunch", "middag"],
  },
  {
    id: "artsoppa",
    name: "Ärtsoppa med fläsk",
    description: "Klassisk gul ärtsoppa med rimmat fläsk och senap.",
    image: "/mat/artsoppa.jpg",
    imageAlt: "Ärtsoppa i vit tallrik med fläsk",
    voiceWords: ["ärtsopp*", "ärt*"],
    suits: ["diabetes", "laktosfri", "glutenfri"],
    allergens: ["Senap"],
    consistency: "normal",
    occasions: ["lunch", "middag"],
  },
  {
    id: "kycklingcurry",
    name: "Kycklingcurry med ris",
    description: "Mild curry med kyckling, grönsaker och kokosmjölk.",
    image: "/mat/kycklingcurry.jpg",
    imageAlt: "Kycklingcurry med ris i skål",
    voiceWords: ["curry*", "kycklingcurry"],
    suits: ["diabetes", "laktosfri", "glutenfri"],
    allergens: [],
    consistency: "normal",
    occasions: ["lunch", "middag"],
  },
  {
    id: "kalops",
    name: "Kalops med kokt potatis",
    description: "Långkokt högrev med morötter, kryddpeppar och inlagda rödbetor.",
    image: "/mat/kalops.jpg",
    imageAlt: "Köttgryta med morötter och potatis",
    voiceWords: ["kalops*", "kött*"],
    suits: ["diabetes", "laktosfri", "glutenfri"],
    allergens: [],
    consistency: "normal",
    occasions: ["lunch", "middag"],
  },
  {
    id: "sejfile",
    name: "Stekt sejfilé",
    description: "Med kokt potatis, citron och gröna ärtor.",
    image: "/mat/sejfile.jpg",
    imageAlt: "Stekt vit fiskfilé med citronskiva",
    voiceWords: ["sej*", "fisk"],
    suits: ["diabetes", "laktosfri", "glutenfri"],
    allergens: ["Fisk"],
    consistency: "normal",
    occasions: ["lunch", "middag"],
  },
  {
    id: "pannbiff",
    name: "Pannbiff med kokt potatis",
    description: "Hemlagad pannbiff med stekt lök, kokt potatis och sallad.",
    image: "/mat/pannbiff.jpg",
    imageAlt: "Pannbiff med kokt potatis och sallad på tallrik",
    voiceWords: ["pannbiff*", "biff*"],
    suits: ["diabetes", "laktosfri"],
    allergens: ["Ägg"],
    consistency: "normal",
    occasions: ["lunch", "middag"],
  },
  {
    id: "gulasch",
    name: "Gulaschsoppa",
    description: "Mustig soppa med nötkött, paprika och potatis.",
    image: "/mat/gulasch.jpg",
    imageAlt: "Gulaschsoppa i blå skål",
    voiceWords: ["gulasch*"],
    suits: ["diabetes", "laktosfri", "glutenfri"],
    allergens: [],
    consistency: "normal",
    occasions: ["lunch", "middag"],
  },
  {
    id: "bonchili",
    name: "Vegetarisk bönchili",
    description: "Bönor, tomat och grönsaker – lite kryddstark.",
    image: "/mat/bonchili.jpg",
    imageAlt: "Vegetarisk chili med bönor och basilika",
    voiceWords: ["chili*", "bön*", "vegetari*"],
    suits: ["diabetes", "laktosfri", "glutenfri", "vegetarisk"],
    allergens: [],
    consistency: "normal",
    occasions: ["lunch", "middag"],
  },
  {
    id: "kycklinggryta",
    name: "Kycklinggryta med ris",
    description: "Mild gryta med paprika och grönsaker.",
    image: "/mat/kycklinggryta.jpg",
    imageAlt: "Kyckling med ris och grönsaker på tallrik",
    voiceWords: ["kycklinggryt*", "gryta*"],
    suits: ["diabetes", "laktosfri", "glutenfri"],
    allergens: ["Selleri"],
    consistency: "normal",
    occasions: ["lunch", "middag"],
  },
  {
    id: "spaghetti",
    name: "Spaghetti med köttfärssås",
    description: "Klassisk köttfärssås med tomat, morot och selleri.",
    image: "/mat/spaghetti.jpg",
    imageAlt: "Spaghetti med tomatsås på tallrik",
    voiceWords: ["spaghetti*", "köttfärs*", "pasta"],
    suits: ["diabetes", "laktosfri"],
    allergens: ["Gluten", "Selleri"],
    consistency: "normal",
    occasions: ["lunch", "middag"],
  },
  {
    id: "ugnskyckling",
    name: "Ugnsbakad kyckling med rotsaker",
    description: "Kycklingklubba med ugnsrostade morötter, palsternacka och rotselleri.",
    image: "/mat/ugnskyckling.jpg",
    imageAlt: "Ugnsbakad kyckling med grönsaker i form",
    voiceWords: ["ugnsbakad kyckling", "rotsak*"],
    suits: ["diabetes", "laktosfri", "glutenfri"],
    allergens: ["Selleri"],
    consistency: "normal",
    occasions: ["lunch", "middag"],
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
    consistency: "normal",
    occasions: ["lunch", "middag"],
  },
  {
    id: "paneradfisk",
    name: "Panerad fisk med remouladsås",
    description: "Frasig fiskfilé med remouladsås och potatis.",
    image: "/mat/paneradfisk.jpg",
    imageAlt: "Panerade fiskbitar med sås",
    voiceWords: ["panerad*", "remoulad*"],
    suits: ["laktosfri"],
    allergens: ["Fisk", "Ägg", "Gluten", "Senap"],
    consistency: "normal",
    occasions: ["lunch", "middag"],
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
    consistency: "normal",
    occasions: ["lunch", "middag"],
  },
  {
    id: "lasagne",
    name: "Lasagne",
    description: "Med köttfärs, tomatsås och ost.",
    image: "/mat/lasagne.jpg",
    imageAlt: "Lasagne på tallrik",
    voiceWords: ["lasagne*"],
    suits: ["diabetes"],
    allergens: ["Gluten", "Mjölk"],
    consistency: "normal",
    occasions: ["lunch", "middag"],
  },
  {
    id: "schnitzel",
    name: "Kycklingschnitzel med potatismos",
    description: "Panerad kycklingfilé med smörigt potatismos.",
    image: "/mat/schnitzel.jpg",
    imageAlt: "Panerad kycklingschnitzel på tallrik",
    voiceWords: ["schnitzel*"],
    suits: ["diabetes"],
    allergens: ["Gluten", "Ägg", "Mjölk"],
    consistency: "normal",
    occasions: ["lunch", "middag"],
  },
  {
    id: "timbal",
    name: "Köttfärstimbal med potatispuré",
    description: "Formad timbal av köttfärs med potatis- och morotspuré.",
    image: "/mat/timbal.jpg",
    imageAlt: "Slät potatispuré i skål",
    voiceWords: ["timbal*"],
    suits: ["diabetes", "laktosfri"],
    allergens: ["Ägg"],
    consistency: "timbal",
    occasions: ["lunch", "middag"],
  },
  {
    id: "naringssoppa",
    name: "Näringsrik grönsakssoppa",
    description: "Slät, energiberikad soppa att dricka.",
    image: "/mat/naringssoppa.jpg",
    imageAlt: "Slät grön soppa i djup tallrik",
    voiceWords: ["näringssopp*"],
    suits: ["diabetes", "laktosfri", "glutenfri"],
    allergens: [],
    consistency: "flytande",
    occasions: ["lunch", "middag"],
  },
  {
    id: "grot",
    name: "Havregrynsgröt med bär",
    description: "Varm gröt med laktosfri mjölk, färska bär och lite kanel.",
    image: "/mat/grot.jpg",
    imageAlt: "Havregrynsgröt med jordgubbar och blåbär",
    voiceWords: ["gröt*", "havre*"],
    suits: ["diabetes", "laktosfri", "vegetarisk"],
    allergens: ["Gluten"],
    consistency: "normal",
    occasions: ["frukost"],
  },
  {
    id: "kokttagg",
    name: "Kokt ägg med rostat bröd",
    description: "Löskokt ägg, rostat bröd och laktosfritt smör.",
    image: "/mat/kokttagg.jpg",
    imageAlt: "Kokt ägg i äggkopp med rostat bröd",
    voiceWords: ["kokt ägg", "ägg"],
    suits: ["diabetes", "laktosfri", "vegetarisk"],
    allergens: ["Ägg", "Gluten"],
    consistency: "normal",
    occasions: ["frukost"],
  },
  {
    id: "yoghurtmusli",
    name: "Yoghurt med bär och müsli",
    description: "Laktosfri yoghurt med blåbär, hallon och osötad müsli.",
    image: "/mat/yoghurtmusli.jpg",
    imageAlt: "Yoghurt med bär och müsli i skål",
    voiceWords: ["yoghurt*", "müsli*"],
    suits: ["diabetes", "laktosfri", "vegetarisk"],
    allergens: ["Mjölkprotein", "Gluten"],
    consistency: "normal",
    occasions: ["frukost"],
  },
  {
    id: "aggbacon",
    name: "Stekt ägg med bacon",
    description: "Stekt ägg, bacon, bönor och rostat bröd.",
    image: "/mat/aggbacon.jpg",
    imageAlt: "Stekt ägg med bacon och bönor på tallrik",
    voiceWords: ["bacon*", "stekt ägg"],
    suits: ["diabetes", "laktosfri"],
    allergens: ["Ägg", "Gluten"],
    consistency: "normal",
    occasions: ["frukost"],
  },
  {
    id: "varmsmorgas",
    name: "Varm smörgås med skinka och ost",
    description: "Grillad smörgås med skinka och smält ost.",
    image: "/mat/varmsmorgas.jpg",
    imageAlt: "Grillad smörgås med skinka och ost",
    voiceWords: ["varm smörgås", "skinka*"],
    suits: ["diabetes"],
    allergens: ["Gluten", "Mjölk"],
    consistency: "normal",
    occasions: ["frukost"],
  },
  {
    id: "omelett",
    name: "Omelett med tomat",
    description: "Fluffig omelett med tomat, oliver och fetaost.",
    image: "/mat/omelett.jpg",
    imageAlt: "Omelett med tomater på tallrik",
    voiceWords: ["omelett*"],
    suits: ["diabetes", "glutenfri", "vegetarisk"],
    allergens: ["Ägg", "Mjölk"],
    consistency: "normal",
    occasions: ["frukost"],
  },
  {
    id: "muffin",
    name: "Sockerfri blåbärsmuffin",
    description: "Saftig muffin sötad utan socker.",
    image: "/mat/muffin.jpg",
    imageAlt: "Blåbärsmuffins på galler",
    voiceWords: ["muffin*", "blåbär*"],
    suits: ["diabetes", "laktosfri", "vegetarisk"],
    allergens: ["Ägg", "Gluten"],
    consistency: "normal",
    occasions: ["fika"],
  },
  {
    id: "fruktsallad",
    name: "Fruktsallad",
    description: "Vattenmelon, kiwi och bär – fräscht och lätt.",
    image: "/mat/fruktsallad.jpg",
    imageAlt: "Fruktsallad med vattenmelon på tallrikar",
    voiceWords: ["fruktsallad*"],
    suits: ["diabetes", "laktosfri", "glutenfri", "vegetarisk"],
    allergens: [],
    consistency: "normal",
    occasions: ["fika"],
  },
  {
    id: "kanelbulle",
    name: "Kanelbulle",
    description: "Nybakad kanelbulle med pärlsocker.",
    image: "/mat/kanelbulle.jpg",
    imageAlt: "Kanelbulle i handen",
    voiceWords: ["kanelbull*", "bulle*"],
    suits: ["vegetarisk"],
    allergens: ["Gluten", "Mjölk", "Ägg"],
    consistency: "normal",
    occasions: ["fika"],
  },
  {
    id: "chokladtarta",
    name: "Chokladtårta",
    description: "Mjuk chokladtårta med grädde.",
    image: "/mat/chokladtarta.jpg",
    imageAlt: "Bit av chokladtårta på tallrik",
    voiceWords: ["choklad*", "tårta*"],
    suits: ["vegetarisk"],
    allergens: ["Gluten", "Mjölk", "Ägg"],
    consistency: "normal",
    occasions: ["fika"],
  },
  {
    id: "frukt",
    name: "Färsk frukt",
    description: "Äpple, päron eller apelsin – välj när den kommer.",
    image: "/mat/frukt.jpg",
    imageAlt: "Äpplen i en skål",
    voiceWords: ["frukt", "äpple*"],
    suits: ["diabetes", "laktosfri", "glutenfri", "vegetarisk"],
    allergens: [],
    consistency: "normal",
    occasions: ["tilltugg"],
  },
  {
    id: "notmix",
    name: "Nötmix",
    description: "Osaltade mandlar, cashewnötter och pistagenötter.",
    image: "/mat/notmix.jpg",
    imageAlt: "Blandade nötter i skål",
    voiceWords: ["nöt*", "mandl*"],
    suits: ["diabetes", "laktosfri", "glutenfri", "vegetarisk"],
    allergens: ["Nötter"],
    consistency: "normal",
    occasions: ["tilltugg"],
  },
  {
    id: "ostsmorgas",
    name: "Smörgås med laktosfri ost",
    description: "Grovt bröd med laktosfri ost och grönsaker.",
    image: "/mat/ostsmorgas.jpg",
    imageAlt: "Smörgås med ost och grönsaker",
    voiceWords: ["smörgås*", "macka", "ost*"],
    suits: ["diabetes", "laktosfri", "vegetarisk"],
    allergens: ["Gluten", "Mjölkprotein"],
    consistency: "normal",
    occasions: ["tilltugg"],
  },
  {
    id: "yoghurtbar",
    name: "Laktosfri yoghurt med bär",
    description: "En liten skål yoghurt med färska bär.",
    image: "/mat/yoghurtbar.jpg",
    imageAlt: "Yoghurt med bär och granola",
    voiceWords: ["yoghurt*"],
    suits: ["diabetes", "laktosfri", "vegetarisk"],
    allergens: ["Mjölkprotein"],
    consistency: "normal",
    occasions: ["tilltugg"],
  },
  {
    id: "bakelse",
    name: "Chokladbakelse",
    description: "En liten bit chokladbakelse.",
    image: "/mat/bakelse.jpg",
    imageAlt: "Chokladbakelse på tallrik",
    voiceWords: ["bakelse*", "choklad*"],
    suits: ["vegetarisk"],
    allergens: ["Gluten", "Mjölk", "Ägg"],
    consistency: "normal",
    occasions: ["tilltugg"],
  },
];

/** Varför en rätt inte passar patienten. Appen visar skälen men ändrar aldrig ordinationen. */
export type Blocker =
  | { kind: "allergen"; allergen: string }
  | { kind: "diet"; tag: DietTag }
  | { kind: "consistency"; consistency: Consistency };

export function dishBlockers(dish: Dish, patient: Pick<Patient, "diet" | "allergies" | "consistency">): Blocker[] {
  return [
    ...dish.allergens.filter((a) => patient.allergies.includes(a)).map((allergen) => ({ kind: "allergen" as const, allergen })),
    ...patient.diet.filter((tag) => !dish.suits.includes(tag)).map((tag) => ({ kind: "diet" as const, tag })),
    ...(dish.consistency !== patient.consistency ? [{ kind: "consistency" as const, consistency: dish.consistency }] : []),
  ];
}

/** En rätt kan beställas bara om den inte krockar med någon av patientens kostavvikelser. */
export function dishSuits(dish: Dish, patient: Pick<Patient, "diet" | "allergies" | "consistency">): boolean {
  return dishBlockers(dish, patient).length === 0;
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
  { id: "vatten", name: "Vatten", emoji: "💧", voiceWords: ["vatten"], suits: ["diabetes", "laktosfri", "glutenfri", "vegetarisk"] },
  { id: "mjolk", name: "Laktosfri mjölk", emoji: "🥛", voiceWords: ["mjölk*"], suits: ["diabetes", "laktosfri", "glutenfri", "vegetarisk"] },
  { id: "lingondricka", name: "Lingondricka utan socker", emoji: "🍹", voiceWords: ["lingon*", "dricka"], suits: ["diabetes", "laktosfri", "glutenfri", "vegetarisk"] },
  { id: "kaffe", name: "Kaffe", emoji: "☕", voiceWords: ["kaffe"], suits: ["diabetes", "laktosfri", "glutenfri", "vegetarisk"] },
  { id: "ingen", name: "Inget att dricka", emoji: "🚫", voiceWords: ["inget", "ingenting", "nej tack"], suits: ["diabetes", "laktosfri", "glutenfri", "vegetarisk"] },
  { id: "saft", name: "Saft", emoji: "🧃", voiceWords: ["saft*"], suits: ["laktosfri", "glutenfri", "vegetarisk"] },
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
  "194803022328": [
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
  artsoppa: ["husmanskost", "soppor"],
  kycklingcurry: ["kyckling", "pasta", "kryddigt"],
  kalops: ["husmanskost", "kott"],
  sejfile: ["fisk", "husmanskost"],
  pannbiff: ["husmanskost", "kott"],
  gulasch: ["soppor", "kott", "kryddigt"],
  bonchili: ["vegetariskt", "kryddigt"],
  spaghetti: ["pasta", "kott"],
  ugnskyckling: ["kyckling"],
  paneradfisk: ["fisk"],
  lasagne: ["pasta", "kott"],
  schnitzel: ["kyckling"],
  timbal: ["kott"],
  naringssoppa: ["soppor"],
  grot: ["husmanskost"],
  kokttagg: ["husmanskost"],
  yoghurtmusli: ["vegetariskt"],
  aggbacon: ["kott"],
  varmsmorgas: ["kott"],
  omelett: ["vegetariskt"],
  muffin: ["sott"],
  fruktsallad: ["sott", "vegetariskt"],
  kanelbulle: ["sott"],
  chokladtarta: ["sott"],
  frukt: ["vegetariskt"],
  notmix: ["vegetariskt"],
  ostsmorgas: ["vegetariskt"],
  yoghurtbar: ["vegetariskt"],
  bakelse: ["sott"],
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
