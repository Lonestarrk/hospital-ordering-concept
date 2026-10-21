// Kök och rätter som patienten kan välja eller söka bland på "Min smak".
// Rätterna har svenska och engelska namn; på arabiska visas det engelska namnet.

export type Cuisine = { id: string; sv: string; en: string; ar: string; emoji: string };

export const cuisines: Cuisine[] = [
  { id: "svensk", sv: "Svensk husman", en: "Swedish home cooking", ar: "المطبخ السويدي", emoji: "🥔" },
  { id: "thai", sv: "Thailändsk", en: "Thai", ar: "التايلاندي", emoji: "🌶️" },
  { id: "indisk", sv: "Indisk", en: "Indian", ar: "الهندي", emoji: "🍛" },
  { id: "italiensk", sv: "Italiensk", en: "Italian", ar: "الإيطالي", emoji: "🍝" },
  { id: "kinesisk", sv: "Kinesisk", en: "Chinese", ar: "الصيني", emoji: "🥟" },
  { id: "japansk", sv: "Japansk", en: "Japanese", ar: "الياباني", emoji: "🍣" },
  { id: "vietnamesisk", sv: "Vietnamesisk", en: "Vietnamese", ar: "الفيتنامي", emoji: "🍜" },
  { id: "koreansk", sv: "Koreansk", en: "Korean", ar: "الكوري", emoji: "🍚" },
  { id: "mexikansk", sv: "Mexikansk", en: "Mexican", ar: "المكسيكي", emoji: "🌮" },
  { id: "libanesisk", sv: "Libanesisk och Mellanöstern", en: "Lebanese and Middle Eastern", ar: "اللبناني والشرق أوسطي", emoji: "🧆" },
  { id: "turkisk", sv: "Turkisk", en: "Turkish", ar: "التركي", emoji: "🥙" },
  { id: "persisk", sv: "Persisk", en: "Persian", ar: "الفارسي", emoji: "🍢" },
  { id: "grekisk", sv: "Grekisk", en: "Greek", ar: "اليوناني", emoji: "🫒" },
  { id: "spansk", sv: "Spansk", en: "Spanish", ar: "الإسباني", emoji: "🥘" },
  { id: "fransk", sv: "Fransk", en: "French", ar: "الفرنسي", emoji: "🥖" },
  { id: "amerikansk", sv: "Amerikansk", en: "American", ar: "الأمريكي", emoji: "🍔" },
  { id: "osteuropeisk", sv: "Östeuropeisk", en: "Eastern European", ar: "أوروبا الشرقية", emoji: "🥣" },
  { id: "afrikansk", sv: "Nord- och östafrikansk", en: "North and East African", ar: "شمال وشرق أفريقيا", emoji: "🫓" },
];

export type CatalogDish = { id: string; sv: string; en: string; cuisine: string };

const d = (id: string, sv: string, en: string, cuisine: string): CatalogDish => ({ id, sv, en, cuisine });

export const catalog: CatalogDish[] = [
  // Svensk husman
  d("kottbullar", "Köttbullar med potatismos", "Swedish meatballs with mashed potatoes", "svensk"),
  d("korvstroganoff", "Korv stroganoff", "Sausage stroganoff", "svensk"),
  d("flygandejakob", "Flygande Jakob", "Flying Jacob (chicken, banana and peanut bake)", "svensk"),
  d("pannbiff", "Pannbiff med lök", "Beef patty with onions", "svensk"),
  d("kaldolmar", "Kåldolmar", "Cabbage rolls", "svensk"),
  d("artsoppa", "Ärtsoppa med fläsk", "Pea soup with pork", "svensk"),
  d("pytt", "Pytt i panna", "Swedish hash", "svensk"),
  d("janssons", "Janssons frestelse", "Jansson's temptation", "svensk"),
  d("raggmunk", "Raggmunk med fläsk", "Potato pancakes with pork", "svensk"),
  d("kalops", "Kalops", "Swedish beef stew", "svensk"),
  d("makaroner", "Stuvade makaroner", "Creamed macaroni", "svensk"),
  d("fiskbullar", "Fiskbullar i hummersås", "Fish balls in lobster sauce", "svensk"),
  d("laxpudding", "Laxpudding", "Salmon pudding", "svensk"),
  d("stromming", "Stekt strömming med potatismos", "Fried herring with mashed potatoes", "svensk"),
  d("sill", "Sill och potatis", "Pickled herring and potatoes", "svensk"),
  d("wallenbergare", "Wallenbergare", "Wallenberg veal patty", "svensk"),
  d("biffrydberg", "Biff Rydberg", "Beef Rydberg", "svensk"),
  d("kroppkakor", "Kroppkakor", "Potato dumplings", "svensk"),
  d("palt", "Palt", "Palt (potato dumplings)", "svensk"),
  d("lapskojs", "Lapskojs", "Lobscouse", "svensk"),
  d("kycklinggryta", "Kycklinggryta med ris", "Chicken stew with rice", "svensk"),
  d("ugnspannkaka", "Ugnspannkaka med fläsk", "Oven pancake with pork", "svensk"),
  d("pannkakor", "Pannkakor med sylt", "Pancakes with jam", "svensk"),
  d("risgrynsgrot", "Risgrynsgröt", "Rice porridge", "svensk"),
  d("ostkaka", "Ostkaka", "Swedish curd cake", "svensk"),
  d("kanelbulle", "Kanelbulle", "Cinnamon bun", "svensk"),
  d("prinsesstarta", "Prinsesstårta", "Princess cake", "svensk"),
  d("semla", "Semla", "Semla (cream bun)", "svensk"),
  d("rabarberpaj", "Rabarberpaj med vaniljsås", "Rhubarb pie with custard", "svensk"),
  // Thailändsk
  d("padthai", "Pad thai", "Pad thai", "thai"),
  d("grongurry", "Grön curry", "Green curry", "thai"),
  d("rodcurry", "Röd curry", "Red curry", "thai"),
  d("massaman", "Massaman curry", "Massaman curry", "thai"),
  d("tomyum", "Tom yum", "Tom yum soup", "thai"),
  d("tomkha", "Tom kha gai", "Tom kha gai", "thai"),
  d("padkrapao", "Pad kra pao", "Pad kra pao (holy basil stir-fry)", "thai"),
  // Indisk
  d("butterchicken", "Butter chicken", "Butter chicken", "indisk"),
  d("tikkamasala", "Kyckling tikka masala", "Chicken tikka masala", "indisk"),
  d("dal", "Dal", "Dal (lentil curry)", "indisk"),
  d("biryani", "Biryani", "Biryani", "indisk"),
  d("palakpaneer", "Palak paneer", "Palak paneer", "indisk"),
  d("korma", "Korma", "Korma", "indisk"),
  d("vindaloo", "Vindaloo", "Vindaloo", "indisk"),
  // Italiensk
  d("lasagne", "Lasagne", "Lasagne", "italiensk"),
  d("carbonara", "Spaghetti carbonara", "Spaghetti carbonara", "italiensk"),
  d("bolognese", "Spaghetti bolognese", "Spaghetti bolognese", "italiensk"),
  d("risotto", "Svamprisotto", "Mushroom risotto", "italiensk"),
  d("pizza", "Pizza margherita", "Pizza margherita", "italiensk"),
  d("minestrone", "Minestrone", "Minestrone", "italiensk"),
  // Kinesisk
  d("sotsur", "Sötsur kyckling", "Sweet and sour chicken", "kinesisk"),
  d("kungpao", "Kung pao-kyckling", "Kung pao chicken", "kinesisk"),
  d("dumplings", "Dumplings", "Dumplings", "kinesisk"),
  d("friedrice", "Stekt ris", "Fried rice", "kinesisk"),
  d("wonton", "Wontonsoppa", "Wonton soup", "kinesisk"),
  // Japansk
  d("sushi", "Sushi", "Sushi", "japansk"),
  d("ramen", "Ramen", "Ramen", "japansk"),
  d("teriyaki", "Kyckling teriyaki", "Chicken teriyaki", "japansk"),
  d("misosoppa", "Misosoppa", "Miso soup", "japansk"),
  // Vietnamesisk, koreansk
  d("pho", "Pho", "Pho", "vietnamesisk"),
  d("banhmi", "Banh mi", "Banh mi", "vietnamesisk"),
  d("varrullar", "Vårrullar", "Spring rolls", "vietnamesisk"),
  d("bibimbap", "Bibimbap", "Bibimbap", "koreansk"),
  d("bulgogi", "Bulgogi", "Bulgogi", "koreansk"),
  // Mexikansk
  d("tacos", "Tacos", "Tacos", "mexikansk"),
  d("burrito", "Burrito", "Burrito", "mexikansk"),
  d("chiliconcarne", "Chili con carne", "Chili con carne", "mexikansk"),
  d("enchiladas", "Enchiladas", "Enchiladas", "mexikansk"),
  d("quesadilla", "Quesadilla", "Quesadilla", "mexikansk"),
  // Libanesisk, turkisk, persisk
  d("falafel", "Falafel", "Falafel", "libanesisk"),
  d("hummus", "Hummus", "Hummus", "libanesisk"),
  d("shawarma", "Shawarma", "Shawarma", "libanesisk"),
  d("tabbouleh", "Tabbouleh", "Tabbouleh", "libanesisk"),
  d("mujaddara", "Mujaddara", "Mujaddara (lentils and rice)", "libanesisk"),
  d("kebab", "Kebab", "Kebab", "turkisk"),
  d("kofta", "Köfte", "Kofte", "turkisk"),
  d("linssoppa", "Turkisk linssoppa", "Turkish lentil soup", "turkisk"),
  d("ghormehsabzi", "Ghormeh sabzi", "Ghormeh sabzi", "persisk"),
  d("tahdig", "Tahdig", "Tahdig", "persisk"),
  d("kabab", "Kabab koobideh", "Kabab koobideh", "persisk"),
  // Grekisk, spansk, fransk
  d("moussaka", "Moussaka", "Moussaka", "grekisk"),
  d("souvlaki", "Souvlaki", "Souvlaki", "grekisk"),
  d("grekisksallad", "Grekisk sallad", "Greek salad", "grekisk"),
  d("paella", "Paella", "Paella", "spansk"),
  d("tortilla", "Tortilla de patatas", "Spanish omelette", "spansk"),
  d("gazpacho", "Gazpacho", "Gazpacho", "spansk"),
  d("coqauvin", "Coq au vin", "Coq au vin", "fransk"),
  d("bourguignon", "Boeuf bourguignon", "Beef bourguignon", "fransk"),
  d("ratatouille", "Ratatouille", "Ratatouille", "fransk"),
  d("quiche", "Quiche Lorraine", "Quiche Lorraine", "fransk"),
  // Amerikansk, östeuropeisk, afrikansk
  d("hamburgare", "Hamburgare", "Hamburger", "amerikansk"),
  d("macandcheese", "Mac and cheese", "Mac and cheese", "amerikansk"),
  d("pulledpork", "Pulled pork", "Pulled pork", "amerikansk"),
  d("gulasch", "Gulasch", "Goulash", "osteuropeisk"),
  d("pierogi", "Pierogi", "Pierogi", "osteuropeisk"),
  d("borsjtj", "Borsjtj", "Borscht", "osteuropeisk"),
  d("couscous", "Couscous med grönsaker", "Vegetable couscous", "afrikansk"),
  d("tagine", "Tagine", "Tagine", "afrikansk"),
  d("injera", "Injera med linsgryta", "Injera with lentil stew", "afrikansk"),
];

/** Snabbval som visas direkt, innan man har skrivit något. */
export const popularPicks = ["kottbullar", "korvstroganoff", "flygandejakob", "pannbiff", "kaldolmar", "padthai", "butterchicken", "lasagne"];

/** Egna önskningar som inte finns i katalogen sparas med det här prefixet. */
export const CUSTOM_PREFIX = "egen:";

function fold(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Söker i rättens svenska och engelska namn och i kökets namn ("thai" ger thailändska rätter). */
export function searchCatalog(query: string, limit = 8): CatalogDish[] {
  const q = fold(query.trim());
  if (q.length < 2) return [];
  const words = q.split(/\s+/);
  const scored = catalog
    .map((dish) => {
      const cuisine = cuisines.find((c) => c.id === dish.cuisine)!;
      const hay = fold(`${dish.sv} ${dish.en} ${cuisine.sv} ${cuisine.en} ${cuisine.id}`);
      if (!words.every((w) => hay.includes(w))) return null;
      // Träff i början av namnet först.
      const score = fold(dish.sv).startsWith(q) || fold(dish.en).startsWith(q) ? 0 : 1;
      return { dish, score };
    })
    .filter((x): x is { dish: CatalogDish; score: number } => x !== null)
    .sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((x) => x.dish);
}

/** Vilket kök några av rätterna på sjukhusets meny hör till – så att menyn kan märka dem. */
export const menuDishCuisine: Record<string, string> = {
  kalvspett: "svensk",
  artsoppa: "svensk",
  kalops: "svensk",
  pannbiff: "svensk",
  sejfile: "svensk",
  grot: "svensk",
  kanelbulle: "svensk",
  kycklingcurry: "indisk",
  bonchili: "mexikansk",
  spaghetti: "italiensk",
  lasagne: "italiensk",
  gulasch: "osteuropeisk",
  omelett: "grekisk",
};

/** Katalogrätter som motsvarar rätter på sjukhusets meny – för märket "Din favorit". */
export const menuDishFavorite: Record<string, string> = {
  pannbiff: "pannbiff",
  artsoppa: "artsoppa",
  kalops: "kalops",
  kycklinggryta: "kycklinggryta",
  pannkakor: "pannkakor",
  lasagne: "lasagne",
  spaghetti: "bolognese",
  gulasch: "gulasch",
  kanelbulle: "kanelbulle",
};
